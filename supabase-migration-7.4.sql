-- SinfQuiz 7.4. Run AFTER supabase-schema.sql and migration 7.2.
-- Only the configured administrator can manage these CEFR variants.
begin;
create table if not exists public.cefr_tests (
 id uuid primary key default gen_random_uuid(), payload jsonb not null,
 status text not null default 'draft' check(status in ('draft','published','archived')),
 revision integer not null default 1, created_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
create table if not exists public.cefr_attempts (
 id uuid primary key default gen_random_uuid(), test_id uuid not null references public.cefr_tests(id),
 uid uuid not null references auth.users(id), snapshot jsonb not null, answers jsonb not null default '{}',
 step integer not null default 0 check(step between 0 and 3), revision integer not null default 1,
 started_at timestamptz not null default now(), ends_at timestamptz not null,
 finished_at timestamptz, result jsonb, assessment jsonb, reviewed_by uuid, reviewed_at timestamptz
);
create unique index if not exists cefr_one_active on public.cefr_attempts(uid) where finished_at is null;
create index if not exists cefr_attempt_history on public.cefr_attempts(uid,started_at desc);
alter table public.cefr_tests enable row level security;
alter table public.cefr_attempts enable row level security;
-- No direct browser access: keys and attempt snapshots are available only via filtered RPCs.
revoke all on public.cefr_tests, public.cefr_attempts from anon, authenticated;

create or replace function public.sq_cefr_validate(p jsonb) returns void
language plpgsql set search_path=public as $$
declare s jsonb; part jsonb; q jsonb; a jsonb; si int:=0; pi int; ids text[]:='{}';
 expected jsonb:='[[8,6,4,5,6,6],[6,8,6,9,6],[3],[3,3,1,1]]'; n int;
begin
 if length(p::text)>2000000 or jsonb_typeof(p->'sections') is distinct from 'array' or jsonb_array_length(p->'sections')<>4 then raise exception '4 ta CEFR bo‘limi kerak.'; end if;
 if coalesce(length(trim(p->>'title')),0) not between 1 and 160 then raise exception 'Variant nomi 1–160 belgi bo‘lsin.'; end if;
 if p->>'rightsConfirmed' is distinct from 'true' then raise exception 'Materiallardan foydalanish huquqini tasdiqlang.'; end if;
 for s in select value from jsonb_array_elements(p->'sections') loop
  if s->>'skill' is distinct from (array['listening','reading','writing','speaking'])[si+1] or coalesce(s->>'minutes','') !~ '^[0-9]+$' then raise exception 'Bo‘lim turi yoki vaqti noto‘g‘ri.'; end if;
  if (s->>'minutes')::int not between 1 and 180 or jsonb_typeof(s->'parts') is distinct from 'array' then raise exception 'Bo‘lim sozlamasi noto‘g‘ri.'; end if;
  if jsonb_array_length(s->'parts') not between 1 and 20 then raise exception 'Qismlar soni noto‘g‘ri.'; end if;
  if p->>'format'='multilevel' and jsonb_array_length(s->'parts')<>jsonb_array_length(expected->si) then raise exception 'Multilevel qismlari sonini tekshiring.'; end if;
  pi:=0;
  for part in select value from jsonb_array_elements(s->'parts') loop
   if coalesce(length(trim(part->>'source')),0)=0 then raise exception 'Har qismda muallif yoki manba kerak.'; end if;
   if si=0 and coalesce(part->>'audioUrl','') !~ '^https://[^/@[:space:]]+([/:?#]|$)' then raise exception 'Listening uchun HTTPS audio kerak.'; end if;
   if si=1 and coalesce(length(trim(part->>'text')),0)=0 then raise exception 'Reading matni kerak.'; end if;
   if coalesce(part->>'imageUrl','')<>'' and (part->>'imageUrl') !~ '^https://[^/@[:space:]]+([/:?#]|$)' then raise exception 'HTTPS rasm manzili kerak.'; end if;
   if jsonb_typeof(part->'questions') is distinct from 'array' then raise exception 'Savollar ro‘yxati kerak.'; end if;
   n:=jsonb_array_length(part->'questions');
   if n not between 1 and 100 or (p->>'format'='multilevel' and n<>(expected->si->>pi)::int) then raise exception 'Qismdagi savollar soni noto‘g‘ri.'; end if;
   for q in select value from jsonb_array_elements(part->'questions') loop
    if coalesce(q->>'id','') !~ '^[a-zA-Z0-9_-]{1,100}$' or q->>'id'=any(ids) then raise exception 'Savol ID bo‘sh yoki takrorlangan.'; end if;
    ids:=array_append(ids,q->>'id');
    if coalesce(length(trim(q->>'text')),0) not between 1 and 20000 then raise exception 'Savol matnini tekshiring.'; end if;
    if si<2 then
     if coalesce(q->>'type','') not in ('choice','text') or jsonb_typeof(q->'answers') is distinct from 'array' or coalesce(length(trim(q->>'explanation')),0)=0 then raise exception 'Javob kaliti va izoh kerak.'; end if;
     if jsonb_array_length(q->'answers') not between 1 and 20 then raise exception 'Kalitni tekshiring.'; end if;
     if q->>'type'='choice' then
      if jsonb_typeof(q->'options') is distinct from 'array' then raise exception 'Variantlar kerak.'; end if;
      if jsonb_array_length(q->'options') not between 2 and 12 or exists(select 1 from jsonb_array_elements_text(q->'options') v where trim(v)='') or (select count(distinct v) from jsonb_array_elements_text(q->'options') v)<>jsonb_array_length(q->'options') then raise exception 'Variantlar bo‘sh yoki takrorlangan.'; end if;
     end if;
     for a in select value from jsonb_array_elements(q->'answers') loop
      if jsonb_typeof(a)<>'string' or length(trim(a#>>'{}'))=0 or (q->>'type'='choice' and not (q->'options' @> jsonb_build_array(a))) then raise exception 'Javob kaliti noto‘g‘ri.'; end if;
     end loop;
    elsif q->>'type' is distinct from s->>'skill' then raise exception 'Topshiriq turi noto‘g‘ri.'; end if;
   end loop;
   pi:=pi+1;
  end loop;
  si:=si+1;
 end loop;
 if array_length(ids,1)>300 then raise exception 'Bir variantda 300 tagacha savol bo‘lsin.'; end if;
end $$;

create or replace function public.sq_cefr_public(p jsonb) returns jsonb language plpgsql immutable set search_path=public as $$
declare s jsonb; part jsonb; q jsonb; ss jsonb:='[]'; pp jsonb; qq jsonb;
begin
 for s in select value from jsonb_array_elements(p->'sections') loop
  pp:='[]'; for part in select value from jsonb_array_elements(s->'parts') loop
   qq:='[]'; for q in select value from jsonb_array_elements(part->'questions') loop qq:=qq||jsonb_build_array(q-'answers'-'explanation'); end loop;
   pp:=pp||jsonb_build_array(jsonb_set(part,'{questions}',qq));
  end loop; ss:=ss||jsonb_build_array(jsonb_set(s,'{parts}',pp));
 end loop;
 return jsonb_set(p,'{sections}',ss);
end $$;

create or replace function public.sq_cefr_grade(p jsonb, answers jsonb) returns jsonb language plpgsql immutable set search_path=public as $$
declare s jsonb; part jsonb; q jsonb; given text; ok boolean; review jsonb:='[]'; scores jsonb:='{}'; right_count int; total int;
begin
 for s in select value from jsonb_array_elements(p->'sections') limit 2 loop
  right_count:=0; total:=0;
  for part in select value from jsonb_array_elements(s->'parts') loop for q in select value from jsonb_array_elements(part->'questions') loop
   given:=coalesce(answers->>(q->>'id'),'');
   select exists(select 1 from jsonb_array_elements_text(q->'answers') k where lower(regexp_replace(trim(k),'\s+',' ','g'))=lower(regexp_replace(trim(given),'\s+',' ','g'))) into ok;
   total:=total+1; right_count:=right_count+ok::int;
   review:=review||jsonb_build_array(jsonb_build_object('skill',s->>'skill','id',q->>'id','text',q->>'text','selected',given,'correct',ok,'answers',q->'answers','explanation',q->>'explanation'));
  end loop; end loop;
  scores:=scores||jsonb_build_object(s->>'skill',jsonb_build_object('correct',right_count,'total',total));
 end loop;
 return jsonb_build_object('scores',scores,'review',review);
end $$;

create or replace function public.sq_cefr_admin(p_action text, p_id uuid default null, p_body jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public as $$
declare t public.cefr_tests; a public.cefr_attempts; out_json jsonb;
begin
 if auth.uid() is null or not public.sq_is_admin() then raise exception 'Faqat administrator uchun.' using errcode='42501'; end if;
 if p_action='list' then select coalesce(jsonb_agg(to_jsonb(x) order by updated_at desc),'[]') into out_json from public.cefr_tests x; return out_json; end if;
 if p_action='results' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into out_json from (select attempt_row.id,attempt_row.test_id,attempt_row.uid,attempt_row.snapshot->>'title' title,attempt_row.started_at,attempt_row.finished_at,attempt_row.assessment,coalesce(d.data->>'name','O‘quvchi') student_name from public.cefr_attempts attempt_row left join public.documents d on d.collection='profiles' and d.id=attempt_row.uid::text where attempt_row.finished_at is not null order by attempt_row.finished_at desc limit 100) x;return out_json;
 end if;
 if p_action in ('attempt','review') then
  select * into a from public.cefr_attempts where id=p_id for update;
  if not found or a.finished_at is null then raise exception 'Topshirilgan javob topilmadi.'; end if;
  if p_action='review' then
   if coalesce(p_body->>'writing','') !~ '^[0-9]+$' or coalesce(p_body->>'speaking','') !~ '^[0-9]+$' then raise exception 'Baholar butun son bo‘lsin.'; end if;
   if (p_body->>'writing')::int not between 0 and 75 or (p_body->>'speaking')::int not between 0 and 75 or coalesce(length(trim(p_body->>'feedback')),0) not between 1 and 5000 then raise exception '0–75 oralig‘ida baho va izoh kiriting.'; end if;
   update public.cefr_attempts set assessment=jsonb_build_object('writing',(p_body->>'writing')::int,'speaking',(p_body->>'speaking')::int,'feedback',p_body->>'feedback'),reviewed_by=auth.uid(),reviewed_at=now() where id=p_id returning * into a;
  end if;
  return to_jsonb(a);
 end if;
 if p_action='save' then
  if length(p_body::text)>2000000 or jsonb_typeof(p_body->'payload'->'sections') is distinct from 'array' or jsonb_array_length(p_body->'payload'->'sections')<>4 then raise exception 'Variant tuzilmasi noto‘g‘ri.'; end if;
  if coalesce(length(trim(p_body->'payload'->>'title')),0) not between 1 and 160 then raise exception 'Variant nomini kiriting (160 belgigacha).'; end if;
  if p_id is null then insert into public.cefr_tests(payload,created_by) values(p_body->'payload',auth.uid()) returning * into t;
  else update public.cefr_tests set payload=p_body->'payload',status='draft',revision=revision+1,updated_at=now() where id=p_id and revision=(p_body->>'revision')::int returning * into t;
   if not found then raise exception 'Variant boshqa oynada o‘zgargan. Ro‘yxatni yangilang.'; end if;
  end if;return to_jsonb(t);
 end if;
 select * into t from public.cefr_tests where id=p_id for update;
 if not found then raise exception 'Variant topilmadi.'; end if;
 if p_action='publish' then perform public.sq_cefr_validate(t.payload); update public.cefr_tests set status='published',updated_at=now() where id=p_id returning * into t;
 elsif p_action='archive' then update public.cefr_tests set status='archived',updated_at=now() where id=p_id returning * into t;
 else raise exception 'Amal noto‘g‘ri.'; end if;
 return to_jsonb(t);
end $$;

create or replace function public.sq_cefr_catalog() returns jsonb language plpgsql security definer set search_path=public as $$
declare out_json jsonb;
begin
 if auth.uid() is null then raise exception 'Hisobingizga kiring.' using errcode='42501'; end if;
 select jsonb_build_object('tests',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',payload->>'title','description',payload->>'description','level',payload->>'level','format',payload->>'format')) from public.cefr_tests where status='published'),'[]'),'attempts',coalesce((select jsonb_agg(to_jsonb(x)) from (select id,snapshot->>'title' title,finished_at,started_at,assessment from public.cefr_attempts where uid=auth.uid() order by started_at desc limit 30)x),'[]')) into out_json;
 return out_json;
end $$;

create or replace function public.sq_cefr_session(p_id uuid,p_action text default 'get',p_step int default 0,p_answers jsonb default '{}',p_revision int default 0) returns jsonb
language plpgsql security definer set search_path=public as $$
declare a public.cefr_attempts; s jsonb; part jsonb; q jsonb; k text; v jsonb; known boolean; expired boolean:=false; cefr_now timestamptz:=clock_timestamp();
begin
 if auth.uid() is null then raise exception 'Hisobingizga kiring.' using errcode='42501'; end if;
 select * into a from public.cefr_attempts where id=p_id and uid=auth.uid() for update;
 if not found then raise exception 'Sessiya topilmadi.' using errcode='42501'; end if;
 if p_action not in ('get','save','next','finish') then raise exception 'Amal noto‘g‘ri.'; end if;
 while a.finished_at is null and cefr_now>=a.ends_at loop
  expired:=true;a.revision:=a.revision+1;
  if a.step=3 then a.finished_at:=a.ends_at;
  else a.step:=a.step+1;a.ends_at:=a.ends_at+make_interval(mins=>(a.snapshot->'sections'->a.step->>'minutes')::int);end if;
 end loop;
 if a.finished_at is null and not expired and p_action<>'get' then
  if p_step<>a.step or p_revision<>a.revision then raise exception 'Sessiya boshqa oynada yangilangan. Sahifani yangilang.'; end if;
  if jsonb_typeof(p_answers) is distinct from 'object' or length(p_answers::text)>200000 then raise exception 'Javob hajmi yoki turi noto‘g‘ri.'; end if;
  s:=a.snapshot->'sections'->a.step;
  for k,v in select * from jsonb_each(p_answers) loop
   known:=false;
   for part in select value from jsonb_array_elements(s->'parts') loop for q in select value from jsonb_array_elements(part->'questions') loop if q->>'id'=k then known:=true;exit;end if;end loop; if known then exit;end if;end loop;
   if not known or jsonb_typeof(v)<>'string' or length(v#>>'{}')>20000 then raise exception 'Javob faqat joriy bo‘lim uchun yuboriladi.';end if;
   if q->>'type'='choice' and v#>>'{}'<>'' and not (q->'options' @> jsonb_build_array(v)) then raise exception 'Javob varianti noto‘g‘ri.';end if;
   if a.step=3 and v#>>'{}'<>'' then
    if split_part(v#>>'{}','/',1)<>auth.uid()::text or split_part(v#>>'{}','/',2)<>a.id::text or split_part(v#>>'{}','/',3)<>k or not exists(select 1 from storage.objects where bucket_id='cefr-recordings' and name=v#>>'{}') then raise exception 'Audio yozuv topilmadi.';end if;
   end if;
   a.answers:=a.answers||jsonb_build_object(k,v);
  end loop;
  a.revision:=a.revision+1;
  if p_action='finish' or (p_action='next' and a.step=3) then a.finished_at:=cefr_now;
  elsif p_action='next' then a.step:=a.step+1;a.ends_at:=cefr_now+make_interval(mins=>(a.snapshot->'sections'->a.step->>'minutes')::int);end if;
 end if;
 if a.finished_at is not null and a.result is null then a.result:=public.sq_cefr_grade(a.snapshot,a.answers);end if;
 update public.cefr_attempts set answers=a.answers,step=a.step,revision=a.revision,ends_at=a.ends_at,finished_at=a.finished_at,result=a.result where id=a.id;
 return (to_jsonb(a)-'snapshot'-'reviewed_by')||jsonb_build_object('payload',public.sq_cefr_public(a.snapshot),'serverNow',cefr_now,'expired',expired);
end $$;

create or replace function public.sq_cefr_start(p_test uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare t public.cefr_tests; a public.cefr_attempts;
begin
 if auth.uid() is null then raise exception 'Hisobingizga kiring.' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into a from public.cefr_attempts where uid=auth.uid() and finished_at is null;
 if found then return public.sq_cefr_session(a.id);end if;
 select * into t from public.cefr_tests where id=p_test and status='published';
 if not found then raise exception 'Variant hozir yopiq.';end if;
 perform public.sq_cefr_validate(t.payload);
 insert into public.cefr_attempts(test_id,uid,snapshot,ends_at) values(t.id,auth.uid(),t.payload,now()+make_interval(mins=>(t.payload->'sections'->0->>'minutes')::int)) returning * into a;
 return public.sq_cefr_session(a.id);
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('cefr-recordings','cefr-recordings',false,20971520,array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav','audio/x-wav']) on conflict(id) do nothing;
create or replace function public.sq_cefr_recording_allowed(path text) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.cefr_attempts a where a.uid=auth.uid() and split_part(path,'/',1)=auth.uid()::text and split_part(path,'/',2)=a.id::text and a.step=3 and a.finished_at is null and now()<a.ends_at and exists(select 1 from jsonb_array_elements(a.snapshot->'sections'->3->'parts') p, jsonb_array_elements(p->'questions') q where q->>'id'=split_part(path,'/',3)))
$$;
drop policy if exists cefr_audio_insert on storage.objects;
create policy cefr_audio_insert on storage.objects for insert to authenticated with check(bucket_id='cefr-recordings' and public.sq_cefr_recording_allowed(name));
drop policy if exists cefr_audio_select on storage.objects;
create policy cefr_audio_select on storage.objects for select to authenticated using(bucket_id='cefr-recordings' and (split_part(name,'/',1)=auth.uid()::text or public.sq_is_admin()));

revoke all on function public.sq_cefr_validate(jsonb),public.sq_cefr_public(jsonb),public.sq_cefr_grade(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.sq_cefr_admin(text,uuid,jsonb),public.sq_cefr_catalog(),public.sq_cefr_start(uuid),public.sq_cefr_session(uuid,text,int,jsonb,int),public.sq_cefr_recording_allowed(text) from public,anon;
grant execute on function public.sq_cefr_admin(text,uuid,jsonb),public.sq_cefr_catalog(),public.sq_cefr_start(uuid),public.sq_cefr_session(uuid,text,int,jsonb,int),public.sq_cefr_recording_allowed(text) to authenticated;
commit;
