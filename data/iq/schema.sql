-- SinfQuiz 7.25. Small schema migration; then run sql/7.25/02–05 in order.
-- Existing Auth, profiles, teacher roles and class membership are reused.
begin;
do $$ begin
 if to_regclass('public.documents') is null or to_regclass('public.sq_class_members') is null then
  raise exception 'Avval mavjud SinfQuiz bazasi va 7.20 guruhlar migratsiyasini o‘rnating.';
 end if;
end $$;
create table if not exists public.sq_iq_settings(id boolean primary key default true check(id),active boolean not null default true);
insert into public.sq_iq_settings(id) values(true) on conflict do nothing;
create table if not exists public.sq_iq_items(id text primary key,bank_version integer not null,band integer not null check(band between 0 and 2),domain text not null check(domain in ('patterns','numbers','logic','spatial')),payload jsonb not null check(jsonb_typeof(payload)='object' and length(payload::text)<12000));
create table if not exists public.sq_iq_runs(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,band integer not null check(band between 0 and 2),mode text not null check(mode in ('timed','extended')),bank_version integer not null,bank jsonb not null check(jsonb_typeof(bank)='array' and jsonb_array_length(bank)=32),answers jsonb not null default '{}' check(jsonb_typeof(answers)='object'),revision integer not null default 0,status text not null default 'started' check(status in ('started','finished')),started_at timestamptz not null default clock_timestamp(),deadline timestamptz not null,finished_at timestamptz,result jsonb,unique(user_id,id));
create unique index if not exists sq_iq_one_open on public.sq_iq_runs(user_id) where status='started';
create index if not exists sq_iq_runs_user on public.sq_iq_runs(user_id,started_at desc);
create table if not exists public.sq_iq_actions(run_id uuid not null references public.sq_iq_runs(id) on delete cascade,token uuid not null,payload jsonb not null,primary key(run_id,token));
create table if not exists public.sq_book_keys(id text primary key,subject text not null check(subject in ('chemistry','biology','informatics','english')),title text not null,ordinal integer not null);
create table if not exists public.sq_book_reads(book_id text not null references public.sq_book_keys(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,first_read_at timestamptz not null default now(),primary key(book_id,user_id));
create index if not exists sq_book_reads_user on public.sq_book_reads(user_id);
alter table public.sq_iq_settings enable row level security;
alter table public.sq_iq_items enable row level security;
alter table public.sq_iq_runs enable row level security;
alter table public.sq_iq_actions enable row level security;
alter table public.sq_book_keys enable row level security;
alter table public.sq_book_reads enable row level security;
-- All reads/writes use checked RPCs. The answer bank and other pupils' reports
-- are never available via a direct table request, including staff clients.
revoke all on public.sq_iq_settings,public.sq_iq_items,public.sq_iq_runs,public.sq_iq_actions,public.sq_book_keys,public.sq_book_reads from anon,authenticated;

create or replace function public.sq_iq_report(p_bank jsonb,p_answers jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare q jsonb;d text;total integer:=0;correct integer:=0;answered integer:=0;profile jsonb:='[]';n integer;k integer;value jsonb;
begin
 for q in select * from jsonb_array_elements(p_bank) loop
  total:=total+1;value:=p_answers->(q->>'id');
  if jsonb_typeof(value)='number' then answered:=answered+1;end if;
  if value=q->'answer' then correct:=correct+1;end if;
 end loop;
 foreach d in array array['patterns','numbers','logic','spatial'] loop
  select count(*),count(*) filter(where p_answers->(b->>'id')=b->'answer') into n,k from jsonb_array_elements(p_bank) b where b->>'domain'=d;
  profile:=profile||jsonb_build_array(jsonb_build_object('domain',d,'total',n,'correct',k,'percent',case when n=0 then 0 else round(100.0*k/n) end));
 end loop;
 return jsonb_build_object('total',total,'correct',correct,'answered',answered,'percent',case when total=0 then 0 else round(100.0*correct/total) end,'profile',profile);
end $$;
create or replace function public.sq_iq_view(p_run public.sq_iq_runs) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('id',p_run.id,'band',p_run.band,'mode',p_run.mode,'bankVersion',p_run.bank_version,'revision',p_run.revision,'status',p_run.status,'startedAt',p_run.started_at,'deadline',p_run.deadline,'serverNow',clock_timestamp(),'finishedAt',p_run.finished_at,'answers',p_run.answers,'result',p_run.result,'items',
  (select jsonb_agg(jsonb_build_object('id',b->'id','domain',b->'domain','prompt',b->'prompt','visual',b->'visual','options',b->'options')||case when p_run.status='finished' then jsonb_build_object('answer',b->'answer','explanation',b->'explanation') else '{}'::jsonb end order by ord) from jsonb_array_elements(p_run.bank) with ordinality x(b,ord)))
$$;
create or replace function public.sq_iq_close(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 update public.sq_iq_runs r set status='finished',finished_at=least(clock_timestamp(),r.deadline),result=public.sq_iq_report(r.bank,r.answers),revision=r.revision+1 where r.id=p_id and r.status='started';
end $$;
create or replace function public.sq_iq(p_action text,p jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();v_run public.sq_iq_runs;v_band integer;v_mode text;chosen_bank jsonb;q jsonb;choice jsonb;rev integer;action_token uuid;old_payload jsonb;action_payload jsonb;out jsonb;staff boolean;
begin
 if uid is null then raise exception 'Avval mavjud hisobingizga kiring.';end if;
 if jsonb_typeof(p)<>'object' or length(p::text)>16000 then raise exception 'So‘rov hajmi yoki turi noto‘g‘ri.';end if;
 staff:=coalesce(public.sq_is_teacher(),false);
 if p_action='settings' then
  if not coalesce(public.sq_is_admin(),false) then raise exception 'Faqat administrator faollashtira oladi.';end if;
  if jsonb_typeof(p->'active')<>'boolean' then raise exception 'Faollik qiymati noto‘g‘ri.';end if;
  update public.sq_iq_settings set active=(p->>'active')::boolean where id;
 end if;
 if p_action in ('home','settings') then
  select * into v_run from public.sq_iq_runs where user_id=uid and status='started' for update;
  if v_run.id is not null and v_run.deadline<=clock_timestamp() then perform public.sq_iq_close(v_run.id);v_run.id:=null;end if;
  return jsonb_build_object('active',(select active from public.sq_iq_settings where id),'ready',(select count(*)=144 from public.sq_iq_items where bank_version=1),'open',case when v_run.id is null then null else public.sq_iq_view(v_run) end,'history',
   (select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'band',x.band,'mode',x.mode,'startedAt',x.started_at,'finishedAt',x.finished_at,'result',x.result) order by x.started_at desc),'[]') from (select * from public.sq_iq_runs where user_id=uid and status='finished' order by started_at desc limit 20)x),'staff',staff);
 end if;
 if p_action='start' then
  -- Serialize starts by user so two tabs cannot open two timed tests.
  perform pg_advisory_xact_lock(hashtext(uid::text));
  select * into v_run from public.sq_iq_runs where user_id=uid and status='started' for update;
  if v_run.id is not null and v_run.deadline>clock_timestamp() then return public.sq_iq_view(v_run);end if;
  if v_run.id is not null then perform public.sq_iq_close(v_run.id);end if;
  if not (select active from public.sq_iq_settings where id) and not coalesce(public.sq_is_admin(),false) then raise exception 'Ushbu test hozir yopiq.';end if;
  if (select count(*) from public.sq_iq_runs where user_id=uid and started_at>clock_timestamp()-interval '1 day')>=12 then raise exception 'Bugungi urinishlar tugadi. Keyinroq davom eting.';end if;
  if coalesce(p->>'band','') !~ '^[012]$' or coalesce(p->>'mode','') not in ('timed','extended') then raise exception 'Bosqich va vaqt rejimini tanlang.';end if;
  v_band:=(p->>'band')::integer;v_mode:=p->>'mode';
  select jsonb_agg(payload order by rn,domain) into chosen_bank from
   (select payload,domain,row_number() over(partition by domain order by random()) rn from public.sq_iq_items where bank_version=1 and sq_iq_items.band=v_band)x where rn<=8;
  if coalesce(jsonb_array_length(chosen_bank),0)<>32 then raise exception 'Savollar hali o‘rnatilmagan. SQL 02–04 fayllarini RUN qiling.';end if;
  insert into public.sq_iq_runs(user_id,band,mode,bank_version,bank,deadline) values(uid,v_band,v_mode,1,chosen_bank,clock_timestamp()+case when v_mode='extended' then interval '48 minutes' else interval '24 minutes' end) returning * into v_run;
  return public.sq_iq_view(v_run);
 end if;
 if p_action='staff' then
  if not staff then raise exception 'O‘qituvchi ruxsati kerak.';end if;
  return jsonb_build_object('rows',(select coalesce(jsonb_agg(to_jsonb(x) order by x.finished_at desc),'[]') from
   (select report.id,report.user_id,report.band,report.mode,report.finished_at,report.result,
    coalesce((select d.data->>'name' from public.documents d where d.collection='profiles' and d.id=report.user_id::text),'O‘quvchi') student_name
    from public.sq_iq_runs report where report.status='finished' and (public.sq_is_admin() or exists(select 1 from public.sq_class_members m join public.sq_class_groups g on g.id=m.group_id where g.owner_id=uid and m.student_id=report.user_id)) order by report.finished_at desc limit 100)x));
 end if;
 if p_action not in ('run','answer','finish') then raise exception 'Amal topilmadi.';end if;
 select * into v_run from public.sq_iq_runs where id=(p->>'id')::uuid and user_id=uid for update;
 if v_run.id is null then raise exception 'Bu testga ruxsat yo‘q.';end if;
 if v_run.status='started' and v_run.deadline<=clock_timestamp() then perform public.sq_iq_close(v_run.id);select * into v_run from public.sq_iq_runs where id=v_run.id;end if;
 if p_action='run' or v_run.status='finished' then return public.sq_iq_view(v_run);end if;
 action_token:=(p->>'token')::uuid;if action_token is null then raise exception 'Amal identifikatori kerak.';end if;
 action_payload:=jsonb_build_object('action',p_action,'id',v_run.id,'expectedRevision',p->'expectedRevision')||case when p_action='answer' then jsonb_build_object('questionId',p->'questionId','choice',p->'choice') else '{}'::jsonb end;
 select a.payload into old_payload from public.sq_iq_actions a where a.run_id=v_run.id and a.token=action_token;
 if old_payload is not null then
  if old_payload<>action_payload then raise exception 'Amal kodi boshqa javobda ishlatilgan.';end if;
  return public.sq_iq_view(v_run);
 end if;
 if coalesce(p->>'expectedRevision','') !~ '^[0-9]{1,8}$' then raise exception 'Saqlash versiyasi kerak.';end if;
 rev:=(p->>'expectedRevision')::integer;
 if rev<>v_run.revision then raise exception using errcode='P7251',message='Boshqa oynada javob yangilangan. Joriy holatni yangilang.';end if;
 if p_action='answer' then
  if v_run.revision>=512 then raise exception 'Bu urinishdagi javob o‘zgartirishlar chegarasi tugadi. Testni yakunlashingiz mumkin.';end if;
  select b into q from jsonb_array_elements(v_run.bank)b where b->>'id'=p->>'questionId';
  choice:=p->'choice';
  if q is null or choice is null or (choice<>'null'::jsonb and (jsonb_typeof(choice)<>'number' or choice::text !~ '^[0-3]$')) then raise exception 'Savol yoki javob noto‘g‘ri.';end if;
  update public.sq_iq_runs set answers=case when choice='null'::jsonb then answers-(q->>'id') else jsonb_set(answers,array[q->>'id'],choice) end,revision=revision+1 where id=v_run.id returning * into v_run;
 else
  perform public.sq_iq_close(v_run.id);select * into v_run from public.sq_iq_runs where id=v_run.id;
 end if;
 insert into public.sq_iq_actions(run_id,token,payload) values(v_run.id,action_token,action_payload);
 return public.sq_iq_view(v_run);
end $$;

create or replace function public.sq_books(p_action text,p jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();book text;out jsonb;
begin
 if uid is null then raise exception 'Darsliklarni mavjud hisobingiz bilan oching.';end if;
 if jsonb_typeof(p)<>'object' or length(p::text)>16000 then raise exception 'So‘rov turi yoki hajmi noto‘g‘ri.';end if;
 if p_action='mark' then
  book:=p->>'id';if not exists(select 1 from public.sq_book_keys k where k.id=book) then raise exception 'Dars topilmadi.';end if;
  insert into public.sq_book_reads(book_id,user_id) values(book,uid) on conflict do nothing;
 elsif p_action<>'home' then raise exception 'Amal topilmadi.';end if;
 select coalesce(jsonb_object_agg(k.id,jsonb_build_object('read',exists(select 1 from public.sq_book_reads me where me.book_id=k.id and me.user_id=uid),'count',coalesce(c.n,0))),'{}') into out
 from public.sq_book_keys k left join (select book_id,count(*) n from public.sq_book_reads group by book_id)c on c.book_id=k.id;
 return out;
end $$;
revoke all on function public.sq_iq_report(jsonb,jsonb),public.sq_iq_view(public.sq_iq_runs),public.sq_iq_close(uuid),public.sq_iq(text,jsonb),public.sq_books(text,jsonb) from public,anon,authenticated;
grant execute on function public.sq_iq(text,jsonb),public.sq_books(text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
