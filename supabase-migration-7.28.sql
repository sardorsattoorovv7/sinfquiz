-- SinfQuiz 7.28.0. Apply after 7.22, 7.24 and 7.26.2; see MIGRATIONS.md.
-- Additive, idempotent. No secret key, cron, extension or data deletion.
begin;
do $$ begin
 if to_regprocedure('public.sq_comp_typing(text,text)') is null or to_regprocedure('public.sq_quiz_action(text,text,jsonb)') is null then
  raise exception 'Avval 7.22, 7.24 va 7.26.2 migratsiyalarini tartib bilan bajaring. MIGRATIONS.md fayliga qarang.';
 end if;
end $$;

-- Restrictive guards also apply if an old permissive policy is accidentally restored.
drop policy if exists sq_728_keys on public.documents;
create policy sq_728_keys on public.documents as restrictive for select to authenticated using (
 collection not in ('quizzes','nationalSections','live') or
 (collection in ('quizzes','nationalSections') and (public.sq_is_admin() or (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text)))
);
drop policy if exists sq_728_insert on public.documents;
create policy sq_728_insert on public.documents as restrictive for insert to authenticated with check (
 collection not in ('players','typingResults','nationalResults','userActivity','live')
);
drop policy if exists sq_728_update on public.documents;
create policy sq_728_update on public.documents as restrictive for update to authenticated using (
 collection not in ('players','typingResults','nationalResults','userActivity','live')
) with check (collection not in ('players','typingResults','nationalResults','userActivity','live'));

-- Existing conflicting PINs are reassigned, never deleted. Running twice changes nothing.
do $$ declare q record;p text;begin
 for q in select id,data from (select id,data,row_number() over(partition by data->>'pin' order by updated_at,id) n from public.documents where collection='quizzes' and data->>'status'='active') x where n>1 or coalesce(data->>'pin','') !~ '^[0-9]{6}$' loop
  loop p:=lpad((floor(random()*900000)+100000)::integer::text,6,'0');exit when not exists(select 1 from public.documents d where d.collection='quizzes' and d.data->>'status'='active' and d.data->>'pin'=p);end loop;
  update public.documents d set data=q.data||jsonb_build_object('pin',p,'previousPin',q.data->>'pin','pinReassignedAt',floor(extract(epoch from clock_timestamp())*1000)),updated_at=now() where d.collection='quizzes' and d.id=q.id;
 end loop;
end $$;
create unique index if not exists sq_quiz_active_pin_unique on public.documents ((data->>'pin')) where collection='quizzes' and data->>'status'='active';
drop policy if exists sq_728_pin_format on public.documents;
create policy sq_728_pin_format on public.documents as restrictive for all to authenticated
 using (true) with check (collection<>'quizzes' or data->>'status' is distinct from 'active' or coalesce(data->>'pin','')~'^[0-9]{6}$');

create or replace function public.sq_quiz_save(p_id text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 declare old jsonb;q jsonb;p text;i integer:=0;begin
 if not coalesce(public.sq_is_teacher(),false) or coalesce(length(p_id),0) not between 1 and 150 or p_data is null or length(p_data::text)>1000000 then raise exception 'Testni saqlashga ruxsat yo‘q.';end if;
 perform public.sq_play_limit('quiz-save',60);
 select d.data into old from public.documents d where d.collection='quizzes' and d.id=p_id for update;
 if old is not null and old->>'ownerId'<>auth.uid()::text then raise exception 'Bu test boshqa ustozga tegishli.';end if;
 if jsonb_typeof(p_data->'questions') is distinct from 'array' or jsonb_array_length(p_data->'questions') not between 1 and 200 then raise exception 'Testda 1–200 ta savol bo‘lsin.';end if;
 q:=coalesce(old,'{}')||p_data||jsonb_build_object('id',p_id,'ownerId',auth.uid()::text,'updatedAt',floor(extract(epoch from clock_timestamp())*1000));
 if coalesce(q->>'status','') not in ('active','passive') then raise exception 'Test holati noto‘g‘ri.';end if;
 p:=coalesce(old->>'pin',q->>'pin');
 loop
  if coalesce(p,'') !~ '^[0-9]{6}$' or exists(select 1 from public.documents d where d.collection='quizzes' and d.id<>p_id and d.data->>'status'='active' and d.data->>'pin'=p) then p:=(floor(random()*900000)+100000)::integer::text;end if;
  begin
   q:=q||jsonb_build_object('pin',p);
   insert into public.documents(collection,id,data) values('quizzes',p_id,q) on conflict(collection,id) do update set data=excluded.data,updated_at=now();exit;
  exception when unique_violation then i:=i+1;if i>30 then raise exception 'Kod ajratilmadi. Qayta urinib ko‘ring.';end if;p:=null;
  end;
 end loop;return q;
 end $$;

-- This invoker RPC is one database transaction; RLS checks every operation.
create or replace function public.sq_documents_batch(p_ops jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
 declare o jsonb;begin
 if auth.uid() is null or jsonb_typeof(p_ops)<>'array' or jsonb_array_length(p_ops)>500 or length(p_ops::text)>4000000 then raise exception 'Paket hajmi yoki sessiya noto‘g‘ri.';end if;
 for o in select x from jsonb_array_elements(p_ops) x loop
  if length(o->>'id') not between 1 and 200 then raise exception 'Hujjat identifikatori noto‘g‘ri.';end if;
  if o->>'op'='delete' then delete from public.documents d where d.collection=o->>'collection' and d.id=o->>'id';
  elsif o->>'op'='merge' and jsonb_typeof(o->'data')='object' then
   update public.documents d set data=d.data||(o->'data'),updated_at=now() where d.collection=o->>'collection' and d.id=o->>'id';
   if not found then insert into public.documents(collection,id,data) values(o->>'collection',o->>'id',o->'data');end if;
  elsif o->>'op'='set' and jsonb_typeof(o->'data')='object' then
   insert into public.documents(collection,id,data) values(o->>'collection',o->>'id',o->'data') on conflict(collection,id) do update set data=excluded.data,updated_at=now();
  elsif o->>'op'='update' and jsonb_typeof(o->'data')='object' then
   update public.documents d set data=d.data||(o->'data'),updated_at=now() where d.collection=o->>'collection' and d.id=o->>'id';if not found then raise exception 'Hujjat topilmadi yoki ruxsat yo‘q.';end if;
  else raise exception 'Paket amali noto‘g‘ri.';end if;
 end loop;return jsonb_build_object('ok',true,'count',jsonb_array_length(p_ops));
 end $$;

create or replace function public.sq_owned_bulk(p_kind text,p_quiz_id text default null) returns jsonb language plpgsql security definer set search_path='' as $$
 declare n integer;begin
 if not coalesce(public.sq_is_teacher(),false) then raise exception 'Ustoz ruxsati kerak.';end if;
 perform public.sq_play_limit('bulk',10);
 if p_kind='typing-reset' then delete from public.documents d where d.collection='typingResults' and d.data->>'ownerId'=auth.uid()::text;get diagnostics n=row_count;
 elsif p_kind in ('quiz-delete','players-reset') then
  if p_quiz_id is not null and not exists(select 1 from public.documents d where d.collection='quizzes' and d.id=p_quiz_id and d.data->>'ownerId'=auth.uid()::text) then raise exception 'Test sizga tegishli emas.';end if;
  delete from public.documents d where d.collection='players' and (p_quiz_id is null or d.data->>'quizId'=p_quiz_id) and d.data->>'ownerId'=auth.uid()::text;
  get diagnostics n=row_count;
  delete from public.sq_quiz_sessions s where (p_quiz_id is null or s.quiz_id=p_quiz_id) and s.quiz->>'ownerId'=auth.uid()::text;
  if p_kind='quiz-delete' then delete from public.documents d where d.collection='quizzes' and d.id=p_quiz_id;end if;
 else raise exception 'Tozalash amali noma’lum.';end if;
 return jsonb_build_object('ok',true,'count',n);
 end $$;

create table if not exists public.sq_live_rooms(id text primary key default gen_random_uuid()::text,owner_id uuid not null,kind text not null check(kind in ('race','typing')),code text not null check(code~'^[0-9]{6}$'),active boolean not null default true,data jsonb not null,created_at timestamptz not null default now());
create unique index if not exists sq_room_code on public.sq_live_rooms(code) where active;
create unique index if not exists sq_room_owner_kind on public.sq_live_rooms(owner_id,kind) where active;
alter table public.sq_live_rooms enable row level security;
revoke all on public.sq_live_rooms from public,anon,authenticated;

create or replace function public.sq_room_catalog(p_kind text) returns jsonb language plpgsql security definer set search_path='' as $$
 declare rooms jsonb;begin
 if auth.uid() is null then raise exception 'Kirish sessiyasi kerak.';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'code',r.code,'title',r.data->>'title','ownerName',coalesce(p.data->>'name','O‘qituvchi'),'active',true,'phase',r.data->>'phase','questionCount',r.data->'questionCount','playerCount',jsonb_array_length(coalesce(r.data->'racers','[]'))) order by r.created_at desc),'[]') into rooms from public.sq_live_rooms r left join public.documents p on p.collection='profiles' and p.id=r.owner_id::text where r.kind=p_kind and r.active and (p_kind<>'race' or (r.data->>'phase'='lobby' and jsonb_array_length(coalesce(r.data->'racers','[]'))<2));
 return jsonb_build_object('active',jsonb_array_length(rooms)>0,'rooms',rooms,'phase',case when p_kind='race' then 'lobby' else null end,'playerCount',case when jsonb_array_length(rooms)=1 then rooms->0->'playerCount' else '0'::jsonb end,'questionCount',case when jsonb_array_length(rooms)=1 then rooms->0->'questionCount' else null end,'stageCount',5,'title',case when jsonb_array_length(rooms)=1 then rooms->0->>'title' else 'Ustoz xonasini tanlang' end,'id',case when jsonb_array_length(rooms)=1 then rooms->0->>'id' else null end,'levels',jsonb_build_array('A1','A2','B1','B2','C1','C2'));
 end $$;
create or replace function public.sq_room_manage(p_kind text,p_active boolean,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
 declare room_id text:=gen_random_uuid()::text;code text;q jsonb;questions jsonb;lane jsonb;v jsonb;begin
 if not coalesce(public.sq_is_teacher(),false) or p_kind not in ('race','typing') then raise exception 'Ustoz ruxsati kerak.';end if;
 perform public.sq_play_limit('room-manage',30);
 -- Lock by owner/kind: concurrent clicks cannot create two active rooms.
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||p_kind));
 if not p_active then update public.sq_live_rooms r set active=false,data=r.data||jsonb_build_object('active',false,'phase','closed') where r.owner_id=auth.uid() and r.kind=p_kind and r.active;return jsonb_build_object('ok',true);end if;
 if p_kind='race' then
  select d.data into q from public.documents d where d.collection='quizzes' and d.id=p_payload->>'quizId' and d.data->>'ownerId'=auth.uid()::text;
  if q is null or jsonb_typeof(p_payload->'questionIds')<>'array' then raise exception 'O‘zingizning test va savollaringizni tanlang.';end if;
  select jsonb_agg(x order by n) into questions from jsonb_array_elements_text(p_payload->'questionIds') with ordinality t(id,n) join lateral (select item x from jsonb_array_elements(q->'questions') item where item->>'id'=t.id and item->>'type'='test' and jsonb_array_length(item->'options')=4) matched on true;
  if coalesce(jsonb_array_length(questions),0) not between 2 and 12 or (select count(distinct x->>'id') from jsonb_array_elements(questions) x)<>jsonb_array_length(questions) then raise exception '2–12 ta turli savol tanlang.';end if;
  select jsonb_agg(x order by case when n=1 then 999 else n end) into lane from jsonb_array_elements(questions) with ordinality t(x,n);
  v:=jsonb_build_object('id',room_id,'ownerId',auth.uid()::text,'title',(q->>'title')||' · 1v1','sourceQuizId',q->>'id','active',true,'phase','lobby','questionCount',jsonb_array_length(questions),'questionsByLane',jsonb_build_array(questions,lane),'racers','[]'::jsonb,'createdAt',floor(extract(epoch from now())*1000));
 else v:=jsonb_build_object('id',room_id,'ownerId',auth.uid()::text,'title','Typing · 5 bosqich','active',true);end if;
 update public.sq_live_rooms r set active=false,data=r.data||jsonb_build_object('active',false,'phase','closed') where r.owner_id=auth.uid() and r.kind=p_kind and r.active;
 loop
  code:=(floor(random()*900000)+100000)::integer::text;
  begin insert into public.sq_live_rooms(id,owner_id,kind,code,data) values(room_id,auth.uid(),p_kind,code,v||jsonb_build_object('code',code));exit;exception when unique_violation then null;end;
 end loop;return jsonb_build_object('room',public.sq_race_info(v)||jsonb_build_object('code',code));
 end $$;
create or replace function public.sq_room_staff() returns jsonb language plpgsql security definer set search_path='' as $$
 declare race jsonb;typing jsonb;begin
 if not coalesce(public.sq_is_teacher(),false) then raise exception 'Ustoz ruxsati kerak.';end if;
 select public.sq_race_info(r.data)||jsonb_build_object('code',r.code) into race from public.sq_live_rooms r where r.owner_id=auth.uid() and r.kind='race' and r.active;
 select jsonb_build_object('id',r.id,'active',true,'code',r.code,'activatedAt',floor(extract(epoch from r.created_at)*1000)) into typing from public.sq_live_rooms r where r.owner_id=auth.uid() and r.kind='typing' and r.active;
 return jsonb_build_object('race',race,'typing',coalesce(typing,jsonb_build_object('active',false)));
 end $$;

create table if not exists public.sq_typing_content(mode text not null,level text not null,stages jsonb not null,primary key(mode,level));
create table if not exists public.sq_typing_sessions(id text primary key default gen_random_uuid()::text,uid uuid not null,room_id text not null references public.sq_live_rooms(id),data jsonb not null);
create table if not exists public.sq_national_sessions(id text primary key default gen_random_uuid()::text,uid uuid not null,data jsonb not null);
alter table public.sq_typing_content enable row level security;
alter table public.sq_typing_sessions enable row level security;
alter table public.sq_national_sessions enable row level security;
revoke all on public.sq_typing_content,public.sq_typing_sessions,public.sq_national_sessions from public,anon,authenticated;

create or replace function public.sq_typing_state(s jsonb) returns jsonb language sql set search_path='' as $$
 select (s-array['stages','uid','ownerId','roomId'])||jsonb_build_object('stage',s->'stages'->((s->>'index')::integer),'stageCount',jsonb_array_length(s->'stages'),'finished',(s->>'index')::integer>=jsonb_array_length(s->'stages'),'serverNow',floor(extract(epoch from clock_timestamp())*1000),'active',true)
$$;
create or replace function public.sq_typing_action(p_action text,p_id text default null,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
 declare s jsonb;r public.sq_live_rooms;stages jsonb;session_key text;at bigint:=floor(extract(epoch from clock_timestamp())*1000);target text;typed text;metrics jsonb;seconds numeric;wpm numeric;passed boolean;result jsonb;begin
 if auth.uid() is null or length(p_payload::text)>30000 then raise exception 'Sessiya yoki so‘rov hajmi noto‘g‘ri.';end if;
 perform public.sq_play_limit('typing-'||p_action,100);
 if p_action='join' then
  select x.* into r from public.sq_live_rooms x where x.id=p_payload->>'roomId' and x.kind='typing' and x.active;
  if r.id is null then raise exception 'Ustozning faol typing xonasini tanlang.';end if;
  if length(btrim(coalesce(p_payload->>'name',''))) not between 1 and 80 or length(coalesce(p_payload->>'avatar','')) not between 1 and 30 then raise exception 'Ism va avatarni kiriting.';end if;
  select c.stages into stages from public.sq_typing_content c where c.mode=case when p_payload->>'courseMode'='longtext' then 'longtext' else 'english' end and c.level=case when p_payload->>'courseMode'='longtext' then 'ALL' else coalesce(p_payload->>'englishLevel','A1') end;
  if stages is null then raise exception 'Daraja topilmadi.';end if;
  session_key:=gen_random_uuid()::text;s:=jsonb_build_object('playerId',session_key,'uid',auth.uid()::text,'ownerId',r.owner_id::text,'roomId',r.id,'name',btrim(p_payload->>'name'),'avatar',p_payload->>'avatar','courseMode',coalesce(p_payload->>'courseMode','english'),'englishLevel',coalesce(p_payload->>'englishLevel','A1'),'index',0,'results','[]'::jsonb,'stages',stages,'stageStartedAt',null,'feedback',null);
  insert into public.sq_typing_sessions(id,uid,room_id,data) values(session_key,auth.uid(),r.id,s);
 else
  select x.data into s from public.sq_typing_sessions x where x.id=p_id and x.uid=auth.uid() for update;if s is null then raise exception 'Typing sessiyasi topilmadi.';end if;session_key:=p_id;
  if p_action='leave' then delete from public.sq_typing_sessions x where x.id=session_key and x.uid=auth.uid();return jsonb_build_object('ok',true);end if;
  if not exists(select 1 from public.sq_live_rooms x where x.id=s->>'roomId' and x.active) then raise exception 'Typing mashqi hozir yopiq.';end if;
  if p_action='start' and (s->>'index')::integer<jsonb_array_length(s->'stages') then s:=s||jsonb_build_object('stageStartedAt',coalesce((s->>'stageStartedAt')::bigint,at),'feedback',null);
  elsif p_action='submit' then
   -- Duplicate/replayed submissions cannot advance another stage.
   if s->>'stageStartedAt' is null then return public.sq_typing_state(s);end if;
   target:=s->'stages'->((s->>'index')::integer)->>'text';typed:=normalize(coalesce(p_payload->>'value',''),NFC);
   metrics:=public.sq_comp_typing(normalize(target,NFC),typed);seconds:=(at-(s->>'stageStartedAt')::bigint)::numeric/1000;
   if seconds<1 or seconds>7200 then raise exception 'Bosqich vaqtini qayta boshlang.';end if;
   wpm:=round((metrics->>'correct')::numeric*12/seconds);if wpm>300 then raise exception 'Matn juda tez yuborildi. Mashqni o‘zingiz terib bajaring.';end if;
   passed:=(metrics->>'accuracy')::numeric>=90 and length(typed)>=length(target)*.9;
   result:=metrics||jsonb_build_object('stage',(s->>'index')::integer+1,'accuracy',round((metrics->>'accuracy')::numeric,1),'errors',metrics->'distance','wpm',wpm,'seconds',round(seconds,1),'passed',passed,'verified',true);
   s:=s||jsonb_build_object('stageStartedAt',null,'feedback',result||jsonb_build_object('correctText',target,'translation',s->'stages'->((s->>'index')::integer)->'translation'));
   if passed then s:=s||jsonb_build_object('results',(s->'results')||jsonb_build_array(result),'index',(s->>'index')::integer+1);end if;
   if (s->>'index')::integer=jsonb_array_length(s->'stages') then
    select jsonb_build_object('averageAccuracy',round(avg((x->>'accuracy')::numeric),1),'averageWpm',round(avg((x->>'wpm')::numeric)),'totalSeconds',sum((x->>'seconds')::numeric)) into result from jsonb_array_elements(s->'results') x;
    insert into public.documents(collection,id,data) values('typingResults',session_key,(s-array['results','index','feedback','stageStartedAt','stages'])||result||jsonb_build_object('stages',s->'results','verified',true,'verification','server-session','completedAt',at)) on conflict(collection,id) do nothing;
   end if;
  elsif p_action<>'session' then raise exception 'Typing amali noto‘g‘ri.';end if;
  update public.sq_typing_sessions x set data=s where x.id=session_key;
 end if;return public.sq_typing_state(s);
 end $$;

create or replace function public.sq_national_info(q jsonb) returns jsonb language sql immutable set search_path='' as $$
 select (q-array['questions','answer','correct'])||jsonb_build_object('questionCount',jsonb_array_length(q->'questions'))
$$;
create or replace function public.sq_national_catalog() returns jsonb language plpgsql security definer set search_path='' as $$
 declare items jsonb;begin
 if auth.uid() is null or coalesce(public.sq_role(),'') not in ('student','teacher','admin') then raise exception 'Hisobingizga kiring.';end if;
 select coalesce(jsonb_agg(public.sq_national_info(d.data) order by d.updated_at desc),'[]') into items from public.documents d where d.collection='nationalSections' and (public.sq_is_admin() or d.data->>'ownerId'=auth.uid()::text or (d.data->>'visibility'='public' and d.data->>'approvalStatus'='approved'));
 return jsonb_build_object('sections',items,'canCreate',public.sq_is_teacher(),'canReview',public.sq_is_admin());
 end $$;
create or replace function public.sq_national_state(s jsonb) returns jsonb language plpgsql set search_path='' as $$
 declare q jsonb:=s->'section';i integer:=(s->>'index')::integer;finished boolean:=coalesce((s->>'finished')::boolean,false);answered jsonb;begin
 select jsonb_agg(case when x='null'::jsonb then 'null'::jsonb else 'true'::jsonb end order by n) into answered from jsonb_array_elements(s->'answers') with ordinality t(x,n);
 return jsonb_build_object('attemptId',s->>'id','section',public.sq_national_info(q),'question',case when finished then null else public.sq_safe_question(q->'questions'->i) end,'index',i,'answers',answered,'selected',s->'answers'->i,'startedAt',s->'startedAt','endsAt',s->'endsAt','serverNow',floor(extract(epoch from clock_timestamp())*1000),'finished',finished,'finishReason',s->'finishReason','review',case when finished then s->'review' else '[]'::jsonb end,'result',case when finished then s->'result' else null end);
 end $$;
create or replace function public.sq_national_action(p_action text,p_id text default null,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
 declare s jsonb;q jsonb;session_key text;at bigint:=floor(extract(epoch from clock_timestamp())*1000);i integer;value integer;total integer;correct integer;score numeric;level text;review jsonb;result jsonb;begin
 if auth.uid() is null or coalesce(public.sq_role(),'') not in ('student','teacher','admin') or length(p_payload::text)>1000 then raise exception 'Hisob sessiyasi kerak.';end if;
 perform public.sq_play_limit('national-'||p_action,100);
 if p_action='start' then
  select d.data into q from public.documents d where d.collection='nationalSections' and d.id=p_payload->>'sectionId' and (public.sq_is_admin() or d.data->>'ownerId'=auth.uid()::text or (d.data->>'visibility'='public' and d.data->>'approvalStatus'='approved'));
  if q is null or jsonb_array_length(q->'questions')<>30 then raise exception '30 savolli tasdiqlangan variantni tanlang.';end if;
  session_key:=gen_random_uuid()::text;s:=jsonb_build_object('id',session_key,'section',q,'uid',auth.uid()::text,'index',0,'answers',(select jsonb_agg('null'::jsonb) from generate_series(1,jsonb_array_length(q->'questions'))),'startedAt',at,'endsAt',at+least(180,greatest(30,coalesce((q->>'durationMinutes')::integer,60)))*60000,'finished',false);
  insert into public.sq_national_sessions(id,uid,data) values(session_key,auth.uid(),s);
 else
  select x.data into s from public.sq_national_sessions x where x.id=p_id and x.uid=auth.uid() for update;if s is null then raise exception 'Test sessiyasi topilmadi.';end if;session_key:=p_id;q:=s->'section';
  if p_action='leave' then if s->'finished'<>'true'::jsonb then raise exception 'Avval testni tugating.';end if;return jsonb_build_object('ok',true);end if;
  if s->'finished'<>'true'::jsonb then
   if at>=(s->>'endsAt')::bigint or p_action='finish' then s:=s||jsonb_build_object('finished',true,'finishedAt',least(at,(s->>'endsAt')::bigint),'finishReason',case when at>=(s->>'endsAt')::bigint then 'time' else 'submitted' end);
   elsif p_action='answer' then value:=(p_payload->>'value')::integer;i:=(s->>'index')::integer;if value is null or value<0 or value>=jsonb_array_length(q->'questions'->i->'options') then raise exception 'Javob variantini tanlang.';end if;s:=jsonb_set(s,array['answers',i::text],to_jsonb(value));
   elsif p_action='navigate' then i:=(p_payload->>'index')::integer;if i is null or i<0 or i>=jsonb_array_length(q->'questions') then raise exception 'Savol raqami noto‘g‘ri.';end if;s:=s||jsonb_build_object('index',i);
   elsif p_action<>'session' then raise exception 'Test amali noto‘g‘ri.';end if;
   if s->'finished'='true'::jsonb then
    total:=jsonb_array_length(q->'questions');select count(*) filter(where x->'correct'=s->'answers'->(n::integer-1)),jsonb_agg(jsonb_build_object('id',x->>'id','number',n,'text',x->>'text','topic',x->>'topic','selected',s->'answers'->(n::integer-1),'selectedText',x->'options'->((s->'answers'->>(n::integer-1))::integer),'correctText',x->'options'->((x->>'correct')::integer),'correct',coalesce(x->'correct'=s->'answers'->(n::integer-1),false),'explanation',x->>'explanation','sourceUrl',x->>'sourceUrl','sourceReference',x->>'sourceReference') order by n) into correct,review from jsonb_array_elements(q->'questions') with ordinality t(x,n);
    score:=round(correct::numeric/total*75,1);level:=case when score>70 then 'A+' when score>=65 then 'A' when score>=60 then 'B+' when score>=55 then 'B' when score>=50 then 'C+' when score>=46 then 'C' else 'Sertifikat darajasidan quyi' end;
    result:=jsonb_build_object('correct',correct,'total',total,'score',score,'maxScore',75,'scaleMax',75,'percent',round(correct::numeric/total*100,1),'level',level,'verified',true,'verification','server-session','method','Mashq bahosi: to‘g‘ri javoblar ulushi × 75. Rasmiy Rasch baholashi emas.');s:=s||jsonb_build_object('review',review,'result',result);
    insert into public.documents(collection,id,data) values('nationalResults',session_key,result||jsonb_build_object('uid',auth.uid()::text,'ownerId',q->>'ownerId','sectionId',q->>'id','sectionTitle',q->>'title','subject',q->>'subject','review',review,'startedAt',s->'startedAt','finishedAt',s->'finishedAt','finishReason',s->'finishReason')) on conflict(collection,id) do nothing;
   end if;
   update public.sq_national_sessions x set data=s where x.id=session_key;
  end if;
 end if;return public.sq_national_state(s);
 end $$;

create table if not exists public.sq_activity_events(uid uuid not null,session_id text not null,event text not null,primary key(uid,session_id,event));
alter table public.sq_activity_events enable row level security;
revoke all on public.sq_activity_events from public,anon,authenticated;
create or replace function public.sq_record_activity(p_event text,p_session text) returns jsonb language plpgsql security definer set search_path='' as $$
 declare a jsonb;p jsonb;at bigint:=floor(extract(epoch from clock_timestamp())*1000);inc integer:=0;begin
 if auth.uid() is null or coalesce(public.sq_role(),'') not in ('student','teacher','admin') or p_event not in ('login','logout','heartbeat') or length(p_session) not between 1 and 100 then raise exception 'Faollik sessiyasi noto‘g‘ri.';end if;
 perform public.sq_play_limit('activity',12);perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 select d.data into a from public.documents d where d.collection='userActivity' and d.id=auth.uid()::text;
 select d.data into p from public.documents d where d.collection='profiles' and d.id=auth.uid()::text;
 if p_event in ('login','logout') then insert into public.sq_activity_events values(auth.uid(),p_session,p_event) on conflict do nothing;get diagnostics inc=row_count;end if;
 a:=coalesce(a,'{}')||jsonb_build_object('uid',auth.uid()::text,'name',p->>'name','email',p->>'email','role',p->>'role','lastSeenAt',at,'online',p_event<>'logout','loginCount',coalesce((a->>'loginCount')::integer,0)+case when p_event='login' then inc else 0 end,'logoutCount',coalesce((a->>'logoutCount')::integer,0)+case when p_event='logout' then inc else 0 end,'lastEvent',p_event);
 if p_event='login' and inc=1 then a:=a||jsonb_build_object('lastLoginAt',at,'lastLoginSession',p_session);elsif p_event='logout' and inc=1 then a:=a||jsonb_build_object('lastLogoutAt',at,'lastLogoutSession',p_session);end if;
 insert into public.documents(collection,id,data) values('userActivity',auth.uid()::text,a) on conflict(collection,id) do update set data=excluded.data,updated_at=now();return jsonb_build_object('ok',true);
 end $$;
create or replace function public.sq_admin_analytics(p_after text default '',p_search text default '',p_role text default '') returns jsonb language plpgsql security definer set search_path='' as $$
 declare counts jsonb;users jsonb;next_id text;at bigint:=floor(extract(epoch from clock_timestamp())*1000);begin
 if not coalesce(public.sq_is_admin(),false) then raise exception 'Administrator ruxsati kerak.';end if;
 select jsonb_build_object('totalUsers',count(*),'teachers',count(*) filter(where p.data->>'role'='teacher'),'students',count(*) filter(where p.data->>'role'='student'),'admins',count(*) filter(where p.data->>'role'='admin'),'activeUsers',count(*) filter(where coalesce((a.data->>'lastSeenAt')::bigint,0)>at-300000 and a.data->'online' is distinct from 'false'::jsonb),'todayUsers',count(*) filter(where coalesce((a.data->>'lastSeenAt')::bigint,0)>=floor(extract(epoch from date_trunc('day',clock_timestamp() at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent')*1000)),'totalLogins',coalesce(sum((a.data->>'loginCount')::bigint),0),'totalLogouts',coalesce(sum((a.data->>'logoutCount')::bigint),0),'generatedAt',at) into counts from public.documents p left join public.documents a on a.collection='userActivity' and a.id=p.id where p.collection='profiles';
 select coalesce(jsonb_agg(data order by id),'[]'),case when count(*)=50 then max(id) else null end into users,next_id from (select p.id,p.data||jsonb_build_object('id',p.id,'activity',a.data) data from public.documents p left join public.documents a on a.collection='userActivity' and a.id=p.id where p.collection='profiles' and p.id>coalesce(p_after,'') and (p_role='' or p.data->>'role'=p_role) and (p_search='' or position(lower(left(p_search,100)) in lower(coalesce(p.data->>'name','')||' '||coalesce(p.data->>'email','')))>0) order by p.id limit 50) page;
 return counts||jsonb_build_object('users',users,'nextCursor',next_id);
 end $$;

-- Historical client-submitted results remain available, clearly unverified.
update public.documents d set data=d.data||jsonb_build_object('verified',false,'verification','legacy-client') where collection in ('typingResults','nationalResults') and not data?'verification';
create or replace function public.sq_schema_status() returns jsonb language sql security definer set search_path='' as $$ select jsonb_build_object('version','7.28.0','secureActivities',true,'migration','supabase-migration-7.28.sql') $$;
create or replace function public.sq_safe_question(q jsonb) returns jsonb language sql immutable set search_path='' as $$
 select case when q is null then null else
  (q-array['correct','answer','acceptedAnswers','criteria','officeRubric','explanation']) ||
  case when q?'officeTask' then jsonb_build_object('officeTask',(q->'officeTask')-'rubric') else '{}'::jsonb end end
$$;
create or replace function public.sq_quiz_catalog() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(public.sq_quiz_info(d.data||jsonb_build_object('id',d.id))||jsonb_build_object('pin',d.data->>'pin','status','active') order by d.updated_at desc),'[]'::jsonb)
 from public.documents d where d.collection='quizzes' and d.data->>'visibility'='public' and d.data->>'status'='active' and auth.uid() is not null
$$;
-- Generated canonical content, grading and per-room race function are appended below.

insert into public.sq_typing_content(mode,level,stages) values ('english','A1','[{"id":"a1-1","englishLevel":"A1","level":1,"title":"School routine","description":"Present simple · kundalik harakat","prompt":"I ___ to school every day.","text":"I go to school every day.","translation":"Men har kuni maktabga boraman.","focus":"go — bormoq","words":[{"word":"go","meaning":"bormoq"},{"word":"school","meaning":"maktab"},{"word":"every day","meaning":"har kuni"}],"wordCount":6},{"id":"a1-2","englishLevel":"A1","level":2,"title":"My family","description":"Have/has · oila","prompt":"My sister ___ a blue bicycle.","text":"My sister has a blue bicycle.","translation":"Mening singlimning ko‘k velosipedi bor.","focus":"has — ega, bor","words":[{"word":"sister","meaning":"opa yoki singil"},{"word":"bicycle","meaning":"velosiped"},{"word":"blue","meaning":"ko‘k"}],"wordCount":6},{"id":"a1-3","englishLevel":"A1","level":3,"title":"In the classroom","description":"There is · sinf jihozlari","prompt":"There ___ a computer on the desk.","text":"There is a computer on the desk.","translation":"Stol ustida kompyuter bor.","focus":"there is — bor","words":[{"word":"computer","meaning":"kompyuter"},{"word":"desk","meaning":"yozuv stoli"},{"word":"on","meaning":"ustida"}],"wordCount":7},{"id":"a1-4","englishLevel":"A1","level":4,"title":"After school","description":"Like + -ing · bo‘sh vaqt","prompt":"We ___ playing football after school.","text":"We like playing football after school.","translation":"Biz maktabdan keyin futbol o‘ynashni yoqtiramiz.","focus":"like — yoqtirmoq","words":[{"word":"like","meaning":"yoqtirmoq"},{"word":"playing","meaning":"o‘ynash"},{"word":"after","meaning":"keyin"}],"wordCount":6},{"id":"a1-5","englishLevel":"A1","level":5,"title":"A useful habit","description":"Can · oddiy ko‘nikma","prompt":"I ___ type short sentences carefully and clearly.","text":"I can type short sentences carefully and clearly.","translation":"Men qisqa gaplarni ehtiyotkorlik va ravshanlik bilan tera olaman.","focus":"can — qila olmoq","words":[{"word":"type","meaning":"klaviaturada termoq"},{"word":"carefully","meaning":"ehtiyotkorlik bilan"},{"word":"clearly","meaning":"ravshan"}],"wordCount":8}]'::jsonb) on conflict(mode,level) do update set stages=excluded.stages;

insert into public.sq_typing_content(mode,level,stages) values ('english','A2','[{"id":"a2-1","englishLevel":"A2","level":1,"title":"Yesterday","description":"Past simple · kechagi kun","prompt":"Yesterday, I ___ my homework before dinner.","text":"Yesterday, I finished my homework before dinner.","translation":"Kecha men kechki ovqatdan oldin uy vazifamni tugatdim.","focus":"finished — tugatdi","words":[{"word":"yesterday","meaning":"kecha"},{"word":"finished","meaning":"tugatdi"},{"word":"before","meaning":"oldin"}],"wordCount":7},{"id":"a2-2","englishLevel":"A2","level":2,"title":"Weekend plan","description":"Be going to · reja","prompt":"We are going to ___ the science museum on Saturday.","text":"We are going to visit the science museum on Saturday.","translation":"Biz shanba kuni fan muzeyiga tashrif buyurmoqchimiz.","focus":"visit — tashrif buyurmoq","words":[{"word":"visit","meaning":"tashrif buyurmoq"},{"word":"museum","meaning":"muzey"},{"word":"Saturday","meaning":"shanba"}],"wordCount":10},{"id":"a2-3","englishLevel":"A2","level":3,"title":"Healthy routine","description":"Frequency adverbs · odatlar","prompt":"She ___ drinks water before her morning lesson.","text":"She usually drinks water before her morning lesson.","translation":"U odatda ertalabki darsidan oldin suv ichadi.","focus":"usually — odatda","words":[{"word":"usually","meaning":"odatda"},{"word":"drinks","meaning":"ichadi"},{"word":"morning","meaning":"ertalab"}],"wordCount":8},{"id":"a2-4","englishLevel":"A2","level":4,"title":"Comparing devices","description":"Comparatives · taqqoslash","prompt":"This laptop is ___ than the old computer.","text":"This laptop is faster than the old computer.","translation":"Bu noutbuk eski kompyuterdan tezroq.","focus":"faster — tezroq","words":[{"word":"laptop","meaning":"noutbuk"},{"word":"faster","meaning":"tezroq"},{"word":"old","meaning":"eski"}],"wordCount":8},{"id":"a2-5","englishLevel":"A2","level":5,"title":"Learning together","description":"Because · sabab bildirish","prompt":"I enjoy group projects ___ we can share ideas.","text":"I enjoy group projects because we can share ideas.","translation":"Men guruh loyihalarini yoqtiraman, chunki biz fikr almasha olamiz.","focus":"because — chunki","words":[{"word":"enjoy","meaning":"yoqtirmoq"},{"word":"because","meaning":"chunki"},{"word":"share","meaning":"bo‘lishmoq"}],"wordCount":9}]'::jsonb) on conflict(mode,level) do update set stages=excluded.stages;

insert into public.sq_typing_content(mode,level,stages) values ('english','B1','[{"id":"b1-1","englishLevel":"B1","level":1,"title":"A better result","description":"First conditional · natija","prompt":"If I practise regularly, I ___ more accurately.","text":"If I practise regularly, I will type more accurately.","translation":"Agar muntazam mashq qilsam, aniqroq teraman.","focus":"will type — teraman","words":[{"word":"practise","meaning":"mashq qilmoq"},{"word":"regularly","meaning":"muntazam"},{"word":"accurately","meaning":"aniq"}],"wordCount":9},{"id":"b1-2","englishLevel":"B1","level":2,"title":"The helpful teacher","description":"Relative clause · odamni tasvirlash","prompt":"The teacher ___ helped us explained the task clearly.","text":"The teacher who helped us explained the task clearly.","translation":"Bizga yordam bergan o‘qituvchi vazifani aniq tushuntirdi.","focus":"who — kimki","words":[{"word":"explained","meaning":"tushuntirdi"},{"word":"task","meaning":"vazifa"},{"word":"clearly","meaning":"aniq"}],"wordCount":9},{"id":"b1-3","englishLevel":"B1","level":3,"title":"A finished project","description":"Present perfect · tajriba","prompt":"Our team has already ___ the first version of the app.","text":"Our team has already completed the first version of the app.","translation":"Jamoamiz ilovaning birinchi versiyasini allaqachon tugatgan.","focus":"completed — tugatgan","words":[{"word":"already","meaning":"allaqachon"},{"word":"completed","meaning":"tugatgan"},{"word":"version","meaning":"versiya"}],"wordCount":11},{"id":"b1-4","englishLevel":"B1","level":4,"title":"Safe research","description":"Modal advice · internet xavfsizligi","prompt":"Students ___ check the source before sharing information.","text":"Students should check the source before sharing information.","translation":"O‘quvchilar ma’lumotni ulashishdan oldin manbani tekshirishlari kerak.","focus":"should — kerak","words":[{"word":"source","meaning":"manba"},{"word":"sharing","meaning":"ulashish"},{"word":"information","meaning":"ma’lumot"}],"wordCount":8},{"id":"b1-5","englishLevel":"B1","level":5,"title":"Solving a problem","description":"Connected sentence · muammo yechish","prompt":"Although the program failed at first, we found the error and ___ it.","text":"Although the program failed at first, we found the error and fixed it.","translation":"Dastur avval ishlamagan bo‘lsa-da, biz xatoni topib tuzatdik.","focus":"fixed — tuzatdi","words":[{"word":"although","meaning":"garchi"},{"word":"failed","meaning":"ishlamadi"},{"word":"fixed","meaning":"tuzatdi"}],"wordCount":13}]'::jsonb) on conflict(mode,level) do update set stages=excluded.stages;

insert into public.sq_typing_content(mode,level,stages) values ('english','B2','[{"id":"b2-1","englishLevel":"B2","level":1,"title":"Effective learning","description":"Academic vocabulary · ta’lim","prompt":"Regular feedback enables learners to ___ their weaknesses.","text":"Regular feedback enables learners to identify their weaknesses.","translation":"Muntazam fikr-mulohaza o‘quvchilarga zaif tomonlarini aniqlash imkonini beradi.","focus":"identify — aniqlamoq","words":[{"word":"feedback","meaning":"fikr-mulohaza"},{"word":"enables","meaning":"imkon beradi"},{"word":"identify","meaning":"aniqlamoq"}],"wordCount":8},{"id":"b2-2","englishLevel":"B2","level":2,"title":"Responsible technology","description":"Passive voice · texnologiya","prompt":"Personal data must be ___ by strong security rules.","text":"Personal data must be protected by strong security rules.","translation":"Shaxsiy ma’lumotlar kuchli xavfsizlik qoidalari bilan himoyalanishi kerak.","focus":"protected — himoyalangan","words":[{"word":"personal data","meaning":"shaxsiy ma’lumot"},{"word":"protected","meaning":"himoyalangan"},{"word":"security","meaning":"xavfsizlik"}],"wordCount":9},{"id":"b2-3","englishLevel":"B2","level":3,"title":"Innovation","description":"Complex contrast · yangilik","prompt":"While automation saves time, it also ___ careful human supervision.","text":"While automation saves time, it also requires careful human supervision.","translation":"Avtomatlashtirish vaqtni tejasa-da, u insonning sinchkov nazoratini ham talab qiladi.","focus":"requires — talab qiladi","words":[{"word":"automation","meaning":"avtomatlashtirish"},{"word":"requires","meaning":"talab qiladi"},{"word":"supervision","meaning":"nazorat"}],"wordCount":10},{"id":"b2-4","englishLevel":"B2","level":4,"title":"Evaluating information","description":"Formal instruction · media savodxonligi","prompt":"Before accepting a claim, readers should examine whether the evidence is ___.","text":"Before accepting a claim, readers should examine whether the evidence is reliable.","translation":"Da’voni qabul qilishdan oldin o‘quvchilar dalil ishonchli ekanini tekshirishlari kerak.","focus":"reliable — ishonchli","words":[{"word":"claim","meaning":"da’vo"},{"word":"evidence","meaning":"dalil"},{"word":"reliable","meaning":"ishonchli"}],"wordCount":12},{"id":"b2-5","englishLevel":"B2","level":5,"title":"Collaborative improvement","description":"Advanced sentence · loyiha tahlili","prompt":"Had the team tested each component earlier, they would have ___ the problem sooner.","text":"Had the team tested each component earlier, they would have discovered the problem sooner.","translation":"Jamoa har bir qismni oldinroq sinaganida, muammoni tezroq aniqlagan bo‘lardi.","focus":"discovered — aniqladi","words":[{"word":"component","meaning":"tarkibiy qism"},{"word":"discovered","meaning":"aniqladi"},{"word":"sooner","meaning":"tezroq"}],"wordCount":14}]'::jsonb) on conflict(mode,level) do update set stages=excluded.stages;

insert into public.sq_typing_content(mode,level,stages) values ('english','C1','[{"id":"c1-1","englishLevel":"C1","level":1,"title":"Careful interpretation","description":"Nuanced vocabulary · tahlil","prompt":"The report should be interpreted with ___, since the sample was relatively small.","text":"The report should be interpreted with caution, since the sample was relatively small.","translation":"Namuna nisbatan kichik bo‘lgani uchun hisobot ehtiyotkorlik bilan talqin qilinishi kerak.","focus":"caution — ehtiyotkorlik","words":[{"word":"interpret","meaning":"talqin qilmoq"},{"word":"caution","meaning":"ehtiyotkorlik"},{"word":"sample","meaning":"namuna"}],"wordCount":13},{"id":"c1-2","englishLevel":"C1","level":2,"title":"A qualified argument","description":"Concession · dalillash","prompt":"___ the proposal has clear benefits, its long-term costs remain uncertain.","text":"Although the proposal has clear benefits, its long-term costs remain uncertain.","translation":"Taklifning aniq foydalari bo‘lsa-da, uning uzoq muddatli xarajatlari noaniqligicha qolmoqda.","focus":"although — garchi","words":[{"word":"proposal","meaning":"taklif"},{"word":"benefit","meaning":"foyda"},{"word":"uncertain","meaning":"noaniq"}],"wordCount":11},{"id":"c1-3","englishLevel":"C1","level":3,"title":"Research findings","description":"Formal reporting · tadqiqot","prompt":"The findings ___ that regular practice improves both speed and accuracy.","text":"The findings indicate that regular practice improves both speed and accuracy.","translation":"Natijalar muntazam mashq tezlik va aniqlikni oshirishini ko‘rsatadi.","focus":"indicate — ko‘rsatmoq","words":[{"word":"findings","meaning":"natijalar"},{"word":"indicate","meaning":"ko‘rsatmoq"},{"word":"accuracy","meaning":"aniqlik"}],"wordCount":11},{"id":"c1-4","englishLevel":"C1","level":4,"title":"Constructive review","description":"Emphasis · fikr bildirish","prompt":"What matters most is not the number of errors, but how effectively they are ___.","text":"What matters most is not the number of errors, but how effectively they are addressed.","translation":"Eng muhimi xatolar soni emas, balki ular qanchalik samarali bartaraf etilishidir.","focus":"addressed — bartaraf etilgan","words":[{"word":"matters","meaning":"ahamiyatli"},{"word":"effectively","meaning":"samarali"},{"word":"addressed","meaning":"bartaraf etilgan"}],"wordCount":15},{"id":"c1-5","englishLevel":"C1","level":5,"title":"Balanced decision","description":"Complex condition · qaror","prompt":"Were the evidence more conclusive, the committee would be ___ to approve the change.","text":"Were the evidence more conclusive, the committee would be inclined to approve the change.","translation":"Dalillar yanada ishonchli bo‘lganida, qo‘mita o‘zgarishni ma’qullashga moyil bo‘lardi.","focus":"inclined — moyil","words":[{"word":"conclusive","meaning":"ishonarli va qat’iy"},{"word":"committee","meaning":"qo‘mita"},{"word":"inclined","meaning":"moyil"}],"wordCount":14}]'::jsonb) on conflict(mode,level) do update set stages=excluded.stages;

insert into public.sq_typing_content(mode,level,stages) values ('english','C2','[{"id":"c2-1","englishLevel":"C2","level":1,"title":"Precise distinction","description":"Semantic precision · nozik farq","prompt":"The two explanations are not contradictory; they are, in fact, mutually ___.","text":"The two explanations are not contradictory; they are, in fact, mutually complementary.","translation":"Ikki tushuntirish bir-biriga zid emas; aksincha, ular o‘zaro bir-birini to‘ldiradi.","focus":"complementary — bir-birini to‘ldiruvchi","words":[{"word":"contradictory","meaning":"ziddiyatli"},{"word":"mutually","meaning":"o‘zaro"},{"word":"complementary","meaning":"to‘ldiruvchi"}],"wordCount":12},{"id":"c2-2","englishLevel":"C2","level":2,"title":"Subtle implication","description":"Inversion · urg‘u","prompt":"Only after examining the context did the researchers ___ the remark’s significance.","text":"Only after examining the context did the researchers grasp the remark’s significance.","translation":"Tadqiqotchilar faqat kontekstni o‘rgangach, izohning ahamiyatini to‘liq angladilar.","focus":"grasp — to‘liq anglamoq","words":[{"word":"context","meaning":"kontekst"},{"word":"grasp","meaning":"anglamoq"},{"word":"significance","meaning":"ahamiyat"}],"wordCount":12},{"id":"c2-3","englishLevel":"C2","level":3,"title":"Measured conclusion","description":"Hedging · xulosa","prompt":"The available evidence does not ___ a definitive conclusion, but it points to a clear trend.","text":"The available evidence does not warrant a definitive conclusion, but it points to a clear trend.","translation":"Mavjud dalillar qat’iy xulosaga asos bermaydi, ammo ular aniq yo‘nalishni ko‘rsatadi.","focus":"warrant — asos bermoq","words":[{"word":"warrant","meaning":"asos bermoq"},{"word":"definitive","meaning":"qat’iy"},{"word":"trend","meaning":"yo‘nalish"}],"wordCount":16},{"id":"c2-4","englishLevel":"C2","level":4,"title":"Elegant reformulation","description":"Cleft structure · aniq urg‘u","prompt":"It was the clarity of the explanation, rather than its length, that made it so ___.","text":"It was the clarity of the explanation, rather than its length, that made it so compelling.","translation":"Tushuntirishni ta’sirchan qilgan narsa uning uzunligi emas, aynan ravshanligi edi.","focus":"compelling — kuchli va ishontiruvchi","words":[{"word":"clarity","meaning":"ravshanlik"},{"word":"rather than","meaning":"emas, balki"},{"word":"compelling","meaning":"ishontiruvchi"}],"wordCount":16},{"id":"c2-5","englishLevel":"C2","level":5,"title":"Critical perspective","description":"Idiomatic formality · tanqidiy fikr","prompt":"The author stops ___ of dismissing the theory, yet exposes several serious weaknesses.","text":"The author stops short of dismissing the theory, yet exposes several serious weaknesses.","translation":"Muallif nazariyani butunlay rad etmaydi, ammo uning bir nechta jiddiy zaif tomonlarini ochib beradi.","focus":"stop short of — bir ishni qilishgacha bormaslik","words":[{"word":"dismiss","meaning":"rad etmoq"},{"word":"expose","meaning":"ochib bermoq"},{"word":"weakness","meaning":"zaif tomon"}],"wordCount":13}]'::jsonb) on conflict(mode,level) do update set stages=excluded.stages;

insert into public.sq_typing_content(mode,level,stages) values ('longtext','ALL','[{"id":"typing-1","level":1,"title":"Aniq tugmalar","description":"Qisqa va sodda gap","text":"Men klaviaturada to‘g‘ri o‘tiraman va har bir tugmani shoshilmasdan aniq bosaman.","wordCount":11},{"id":"typing-2","level":2,"title":"Raqamli sinf","description":"Ikki jumlali mashq","text":"Informatika xonasida kompyuterdan tartibli foydalanamiz. Fayllarni kerakli papkaga saqlaymiz, kuchli parol tanlaymiz va internetdagi noma’lum havolalarni ochmaymiz. Tez yozishdan oldin matnni xatosiz yozishga e’tibor beramiz.","wordCount":25},{"id":"typing-3","level":3,"title":"Foydali texnologiya","description":"Bir abzasli mashq","text":"Kompyuter bizga matn yozish, hisoblash, rasm chizish va yangi bilimlarni o‘rganishda yordam beradi. Dars paytida vazifani diqqat bilan o‘qish, faylga tushunarli nom berish va uni to‘g‘ri joyga saqlash muhim. Klaviaturada ikki qo‘l bilan ishlash yozish tezligini oshiradi. Biroq tezlikning o‘zi yetarli emas: harflar, tinish belgilari va bo‘sh joylar ham aniq kiritilishi kerak. Mashqni muntazam bajargan o‘quvchi vaqt o‘tishi bilan kamroq xato qiladi va fikrini kompyuterda tezroq ifodalay oladi.","wordCount":68},{"id":"typing-4","level":4,"title":"Maktab loyihasi","description":"Kengaytirilgan matn","text":"Sinfimizda ekologiya mavzusida raqamli loyiha tayyorlashga qaror qildik. Avval har bir guruh o‘z vazifasini belgiladi. Birinchi guruh maktab hovlisidagi daraxtlar haqida ma’lumot to‘pladi, ikkinchi guruh suvdan tejamkor foydalanish bo‘yicha takliflar yozdi, uchinchi guruh esa taqdimot uchun rasmlar tayyorladi. Biz barcha fayllarni bitta papkaga joylab, ularga mazmunini bildiradigan aniq nomlar berdik. Matn yozishda imlo qoidalariga, jumlalarning tushunarli bo‘lishiga va manbalarni ko‘rsatishga e’tibor qaratdik.\n\nKeyin jadval dasturida kuzatuv natijalarini kiritdik. Ustunlarga sana, joy, o‘lchov va izoh yozildi. Diagramma yordamida bir haftadagi suv sarfini taqqosladik. Taqdimot tayyorlashda esa har bir slaydga juda ko‘p matn joylamadik. Sarlavha, qisqa fikr va mavzuga mos rasm ishlatdik. Guruh a’zolari navbat bilan chiqish qilib, bir-biriga muloyim fikr bildirdi. Loyiha yakunida texnologiya faqat tayyor ma’lumotni topish uchun emas, balki muammoni o‘rganish, hamkorlik qilish va foydali yechim yaratish uchun ham kerakligini tushundik.","wordCount":132},{"id":"typing-5","level":5,"title":"Kelajakdagi aqlli maktab","description":"Yakuniy katta matn","text":"Tasavvur qiling, kelajakdagi maktabga ertalab kirganingizda elektron jadval dars xonalaridagi harorat va yorug‘likni ko‘rsatadi. Bu tizim o‘quvchilarni kuzatish uchun emas, balki qulay muhit yaratish va elektr energiyasini tejash uchun ishlaydi. Sinfdagi sensorlar faqat zarur ma’lumotlarni o‘lchaydi, natijalar esa himoyalangan serverda saqlanadi. O‘qituvchi qurilmalar qanday ishlashini tushuntiradi va har bir o‘quvchi shaxsiy ma’lumotlarni ehtiyot qilish kerakligini biladi.\n\nInformatika darsida guruhlar maktab kutubxonasi uchun kichik dastur yaratadi. Dastur kitob nomi, muallif va mavjud nusxalar sonini ko‘rsatadi. Bir guruh interfeys chizadi, ikkinchi guruh ma’lumotlarni jadvalga kiritadi, yana bir guruh esa xatolarni sinaydi. O‘quvchilar ishni boshlashdan oldin vazifalarni rejalashtiradi. Ular fayllarga tushunarli nom beradi, o‘zgarishlarni alohida nusxalarda saqlaydi va ishlatilgan rasm hamda ma’lumot manbalarini yozib boradi. Agar dasturda muammo chiqsa, ular xatoni yashirmaydi. Avval qaysi qadamda muammo paydo bo‘lganini aniqlaydi, keyin kichik qismlarni navbat bilan tekshiradi.\n\nTanaffusdan so‘ng robototexnika mashg‘uloti boshlanadi. Oddiy robot rangli chiziq bo‘ylab yurishi kerak. O‘quvchilar sensor qiymatini o‘qib, motorlar tezligini boshqaradigan algoritm tuzadi. Dastlab robot burilishda chiziqdan chiqib ketadi. Guruh a’zolari sensorni boshqa joyga o‘rnatib ko‘radi, koddagi tezlikni pasaytiradi va har bir sinov natijasini yozadi. Bir necha urinishdan keyin robot yo‘lni aniq bosib o‘tadi. Bu jarayon ularga muvaffaqiyat birdan kelmasligini, sinov va tahlil yaxshi yechimga olib borishini ko‘rsatadi. Har bir kichik natija keyingi qarorni aniqroq va ishonchliroq qilishga yordam beradi.\n\nKun oxirida o‘quvchilar bajarilgan ishlar haqida qisqa taqdimot qiladi. Ular faqat natijani emas, qaysi usul foydali bo‘lganini va keyingi safar nimani yaxshilash mumkinligini ham aytadi. Tinglovchilar savol beradi, mualliflar esa fikrlarni hurmat bilan qabul qiladi. Shunday maktabda texnologiya darsning maqsadi emas, balki bilim olish vositasi bo‘ladi. Eng muhim ko‘nikmalar qurilma nomlarini yodlash bilan cheklanmaydi. To‘g‘ri savol berish, axborotni tekshirish, xavfsiz ishlash, jamoada kelishish va yaratilgan yechim uchun mas’uliyatni his qilish ham katta ahamiyatga ega. Raqamli vositalardan ongli foydalangan o‘quvchi yangi dastur yoki qurilma paydo bo‘lganda qo‘rqib qolmaydi. U muammoni bosqichlarga ajratadi, o‘rganadi, sinaydi va o‘z fikrini ravon ifodalaydi.","wordCount":308}]'::jsonb) on conflict(mode,level) do update set stages=excluded.stages;

create or replace function public.sq_comp_grade(p_q jsonb,p_answer jsonb) returns jsonb language plpgsql set search_path='' as $$
 <<assessment>>
 declare ratio numeric:=0;checks jsonb:='[]';value text:=coalesce(p_answer#>>'{}','');sub jsonb;item jsonb;ok boolean;formula text;key text;n integer:=0;passed integer:=0;kind text:=p_q->>'type';
 begin
  if length(p_answer::text)>20000 then return jsonb_build_object('ratio',0,'checks','[]'::jsonb);end if;
  if kind='test' then ratio:=case when p_answer=p_q->'correct' then 1 else 0 end;
  elsif kind='shortcut' then ratio:=case when public.sq_comp_shortcut(value)=public.sq_comp_shortcut(p_q->>'answer') then 1 else 0 end;
  elsif kind='python' then
   return jsonb_build_object('ratio',0,'checks',jsonb_build_array(jsonb_build_object('label','Kod shu brauzerda mashq sifatida bajarildi.','passed',false)),'practiceOnly',true,'verification','local-practice','message','Python natijasi serverdagi ajratilgan bajaruvchida tekshirilmagan. Bu mashq reyting balliga qo‘shilmaydi.');
  elsif kind='prompt' then
   for item in select x from jsonb_array_elements(coalesce(p_q->'criteria','[]')) x loop
    select exists(select 1 from jsonb_array_elements_text(item->'keywords') k where public.sq_comp_norm(k)<>'' and position(public.sq_comp_norm(k) in public.sq_comp_norm(assessment.value))>0) into ok;
    checks:=checks||jsonb_build_array(jsonb_build_object('label',item->>'label','passed',ok));n:=n+1;if ok then passed:=passed+1;end if;
   end loop;ratio:=passed::numeric/greatest(n,1);
  elsif kind='office' then
   begin sub:=value::jsonb;exception when others then sub:='{}';end;
   if sub->>'kind' is not distinct from p_q->'officeTask'->>'kind' then
    for item in select x from jsonb_array_elements(coalesce(p_q->'officeRubric',p_q->'officeTask'->'rubric','[]')) x loop
     ok:=false;
     begin
      if item->>'kind'='excelCell' then ok:=public.sq_comp_norm(sub->'cells'->>(item->>'cell'))=public.sq_comp_norm(item->>'value');
      elsif item->>'kind'='excelFormula' then
       formula:=upper(regexp_replace(coalesce(sub->'cells'->>(item->>'cell'),''),'\s','','g'));
       ok:=left(formula,1)='=' and (not (item?'fn') or position((item->>'fn')||'(' in formula)>0) and not exists(select 1 from jsonb_array_elements_text(coalesce(item->'references','[]')) ref where position(ref in formula)=0) and abs(public.sq_comp_excel(sub->'cells',item->>'cell')-(item->>'expected')::numeric)<.001;
      elsif item->>'kind'='wordText' then ok:=length(btrim(coalesce(sub->>'title',''))) between 3 and 1000 and length(btrim(coalesce(sub->>'body',''))) between 3 and 1000;
      elsif item->>'kind'='wordTable' then ok:=jsonb_array_length(sub->'table')>=2 and not exists(select 1 from jsonb_array_elements(sub->'table') with ordinality rows(x,i) where i<=2 and (jsonb_array_length(x)<2 or length(btrim(coalesce(x->>0,''))) not between 1 and 100 or length(btrim(coalesce(x->>1,''))) not between 1 and 100));
      elsif item->>'kind'='wordImage' then ok:=sub->'imageInserted'='true'::jsonb;
      elsif item->>'kind'='wordWrap' then ok:=sub->'imageInserted'='true'::jsonb and sub->>'wrap'=item->>'value';
      elsif item->>'kind'='wordReference' then ok:=not exists(select 1 from unnest(array['recipient','date','source']) f where length(btrim(coalesce(sub->'reference'->>f,''))) not between 3 and 1000);
      elsif item->>'kind'='pptSlides' then ok:=jsonb_array_length(sub->'slides')>=2 and sub->'slides'->0->>'title'<>sub->'slides'->1->>'title' and not exists(select 1 from jsonb_array_elements(sub->'slides') with ordinality slides(x,i) where i<=2 and (length(btrim(coalesce(x->>'title',''))) not between 3 and 1000 or length(btrim(coalesce(x->>'body',''))) not between 3 and 1000));
      elsif item->>'kind'='pptImage' then ok:=exists(select 1 from jsonb_array_elements(sub->'slides') slide where slide->'imageInserted'='true'::jsonb);
      elsif item->>'kind'='pptNotes' then ok:=length(btrim(coalesce(sub->'slides'->1->>'notes',''))) between 3 and 1000;
      end if;
     exception when others then ok:=false;end;
     checks:=checks||jsonb_build_array(jsonb_build_object('label',item->>'label','passed',coalesce(ok,false)));n:=n+1;if ok then passed:=passed+1;end if;
    end loop;
   end if;ratio:=passed::numeric/greatest(n,1);
  else
   for item in select x from jsonb_array_elements(jsonb_build_array(p_q->'answer')||coalesce(p_q->'acceptedAnswers','[]')) x loop
    if (case when p_q->>'subject'='Excel' then replace(public.sq_comp_norm(assessment.value),' ','')=replace(public.sq_comp_norm(item#>>'{}'),' ','') else public.sq_comp_norm(assessment.value)=public.sq_comp_norm(item#>>'{}') end) then ratio:=1;exit;end if;
   end loop;
  end if;
  return jsonb_build_object('ratio',ratio,'checks',checks);
 end
$$;
create or replace function public.sq_quiz_action(p_id text,p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
 declare s public.sq_quiz_sessions;q jsonb;g jsonb;f jsonb;player jsonb;ratio numeric;earned integer;remaining numeric;at bigint:=floor(extract(epoch from clock_timestamp())*1000);begin
 if auth.uid() is null then raise exception 'Kirish sessiyasi kerak.';end if;
 select * into s from public.sq_quiz_sessions where id=p_id and uid=auth.uid() for update;
 if not found then raise exception 'O‘yin sessiyasi tugagan. Kod bilan qayta kiring.';end if;
 if p_action='session' then return public.sq_quiz_state(p_id);end if;
 if p_action='leave' then return jsonb_build_object('ok',true);end if;
 if s.finished then return public.sq_quiz_state(p_id);end if;
 if not exists(select 1 from public.documents d where d.collection='quizzes' and d.id=s.quiz_id and d.data->>'status'='active') then raise exception 'O‘qituvchi testni to‘xtatgan.';end if;
 q:=s.quiz->'questions'->s.question_index;
 if p_action='answer' then
  if s.feedback is not null then return public.sq_quiz_state(p_id);end if;
  if p_payload->>'questionId' is distinct from q->>'id' then raise exception 'Savol yangilangan. Sahifani qayta oching.';end if;
  remaining:=greatest(0,(s.deadline-at)/1000.0);
  g:=public.sq_comp_grade(q,coalesce(p_payload->'value','null'::jsonb));ratio:=case when remaining>0 then (g->>'ratio')::numeric else 0 end;
  earned:=round(greatest(0,least(10000,coalesce((q->>'points')::numeric,100)))*ratio*(.7+.3*greatest(.5,least(1,remaining/greatest(5,coalesce((q->>'time')::numeric,30))))));
  f:=jsonb_build_object('ratio',ratio,'earned',earned,'practiceOnly',coalesce((g->>'practiceOnly')::boolean,false),'verification',g->>'verification','message',g->>'message','correct',ratio=1,'expired',remaining=0,'checks',g->'checks','answer',q->'answer','correctIndex',case when q->>'type'='test' then q->'correct' else null end,'explanation',q->'explanation');
  update public.sq_quiz_sessions set feedback=f where id=p_id;
  select d.data into player from public.documents d where d.collection='players' and d.id=p_id for update;
  update public.documents set data=player||jsonb_build_object('score',(player->>'score')::integer+earned,'answers',(player->>'answers')::integer+1,'correct',(player->>'correct')::integer+case when ratio=1 then 1 else 0 end,'lastEarned',earned,
   'responses',coalesce(player->'responses','[]'::jsonb)||jsonb_build_array(jsonb_build_object('questionId',q->>'id','type',q->>'type','text',q->>'text','value',p_payload->'value','earned',earned,'checks',g->'checks'))),updated_at=now() where collection='players' and id=p_id;
 elsif p_action='next' then
  if s.feedback is null then raise exception 'Avval joriy savolga javob bering.';end if;
  if s.question_index=jsonb_array_length(s.quiz->'questions')-1 then
   update public.sq_quiz_sessions set finished=true where id=p_id;
   update public.documents set data=data||jsonb_build_object('finishedAt',at),updated_at=now() where collection='players' and id=p_id;
  else
   update public.sq_quiz_sessions set question_index=question_index+1,feedback=null,deadline=at+greatest(5,least(600,coalesce((s.quiz->'questions'->(s.question_index+1)->>'time')::integer,30)))*1000 where id=p_id;
  end if;
 else raise exception 'Test amali noto‘g‘ri.';
 end if;
 return public.sq_quiz_state(p_id);
 end $$;


create or replace function public.sq_race_action(p_action text,p_race_id text default null,p_ids jsonb default '[]',p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
 declare r jsonb;racers jsonb;player jsonb;entry jsonb;ids jsonb:=p_ids;id text;q jsonb;correct boolean;total integer;at bigint:=floor(extract(epoch from clock_timestamp())*1000);begin
 if auth.uid() is null then raise exception 'Kirish sessiyasi kerak.';end if;
 if p_action='join' then perform public.sq_play_limit('race-join',12);end if;
 if length(p_payload::text)>20000 then raise exception 'So‘rov hajmi juda katta.';end if;
 if p_action='active' then return public.sq_room_catalog('race');end if;
 if p_action='join' then p_race_id:=coalesce(p_payload->>'roomId',p_race_id);end if;
 select x.data into r from public.sq_live_rooms x where x.kind='race' and x.id=p_race_id and x.active for update;
 if r is null or r->'active'<>'true'::jsonb then raise exception 'Poyga yopilgan.';end if;
 racers:=coalesce(r->'racers','[]');
 if p_action='join' then
  if r->>'phase'<>'lobby' then raise exception 'Poyga boshlangan. Ustoz qayta faollashtirsin.';end if;
  if p_payload?'players' then
   if jsonb_array_length(p_payload->'players')<>2 or jsonb_array_length(racers)<>0 then raise exception 'Bitta monitor uchun ikkita bo‘sh o‘rin kerak.';end if;
   ids:='[]';
   for entry in select x from jsonb_array_elements(p_payload->'players') x loop
    if length(btrim(entry->>'name')) not between 1 and 80 or coalesce(length(entry->>'avatar'),0) not between 1 and 30 then raise exception 'Ikkala o‘quvchi uchun ism va avatar kiriting.';end if;
    id:=gen_random_uuid()::text;racers:=racers||jsonb_build_array(jsonb_build_object('id',id,'uid',auth.uid()::text,'name',btrim(entry->>'name'),'avatar',entry->>'avatar','ready',true,'index',0,'correct',0,'attempts',0,'lane',jsonb_array_length(ids),'joinedAt',at));ids:=ids||jsonb_build_array(id);
   end loop;
   r:=r||jsonb_build_object('phase','countdown','startsAt',at+3000,'startedAt',null);
  else
   if jsonb_array_length(racers)>=2 then raise exception 'Ikki o‘rin ham band.';end if;
   if length(btrim(p_payload->>'name')) not between 1 and 80 or coalesce(length(p_payload->>'avatar'),0) not between 1 and 30 then raise exception 'Ism va avatarni kiriting.';end if;
   id:=gen_random_uuid()::text;ids:=jsonb_build_array(id);racers:=racers||jsonb_build_array(jsonb_build_object('id',id,'uid',auth.uid()::text,'name',btrim(p_payload->>'name'),'avatar',p_payload->>'avatar','ready',false,'index',0,'correct',0,'attempts',0,'lane',jsonb_array_length(racers),'joinedAt',at));
  end if;
 else
  if r->>'id' is distinct from p_race_id then raise exception 'Poyga almashtirilgan. Qayta kiring.';end if;
  perform public.sq_race_state(r,ids); -- verifies ownership of every requested player
  if r->>'phase'='countdown' and at>=(r->>'startsAt')::bigint then r:=r||jsonb_build_object('phase','running','startedAt',r->'startsAt');end if;
  if p_action='answer' then
   if r->>'phase'<>'running' or coalesce(r->>'winnerId','')<>'' then raise exception 'Poyga hozir javob qabul qilmaydi.';end if;
   id:=coalesce(p_payload->>'playerId',ids->>0);if not ids? id then raise exception 'Poygachi sizga tegishli emas.';end if;
   select x into player from jsonb_array_elements(racers) x where x->>'id'=id;
   if at<coalesce((player->>'retryAt')::bigint,0) then return public.sq_race_state(r,ids);end if;
   q:=coalesce(r->'questionsByLane'->((player->>'lane')::integer)->((player->>'index')::integer),r->'questions'->((player->>'index')::integer));
   if q is null or q->>'id' is distinct from p_payload->>'questionId' then return public.sq_race_state(r,ids);end if;
   correct:=coalesce(p_payload->'value'=q->'correct',false);total:=coalesce((r->>'questionCount')::integer,jsonb_array_length(r->'questionsByLane'->0),jsonb_array_length(r->'questions'));
   player:=player||jsonb_build_object('index',(player->>'index')::integer+case when correct then 1 else 0 end,'correct',(player->>'correct')::integer+case when correct then 1 else 0 end,'attempts',(player->>'attempts')::integer+1,'retryAt',case when correct then 0 else at+1000 end,'feedback',jsonb_build_object('correct',correct,'at',at,'retryAt',case when correct then 0 else at+1000 end));
   if correct and (player->>'index')::integer=total then player:=player||jsonb_build_object('finishedAt',at);r:=r||jsonb_build_object('winnerId',id,'phase','finished','finishedAt',at);end if;
   select jsonb_agg(case when x->>'id'=id then player else x end order by n) into racers from jsonb_array_elements(racers) with ordinality t(x,n);
  elsif p_action='ready' then
   select jsonb_agg(case when ids? (x->>'id') then x||jsonb_build_object('ready',true) else x end order by n) into racers from jsonb_array_elements(racers) with ordinality t(x,n);
   if jsonb_array_length(racers)=2 and not exists(select 1 from jsonb_array_elements(racers) x where x->'ready'<>'true'::jsonb) then r:=r||jsonb_build_object('phase','countdown','startsAt',at+3000);end if;
  elsif p_action='leave' then
   select coalesce(jsonb_agg(x order by n),'[]') into racers from jsonb_array_elements(racers) with ordinality t(x,n) where not ids? (x->>'id');
   if jsonb_array_length(racers)=1 and r->>'phase'='running' then r:=r||jsonb_build_object('winnerId',racers->0->>'id','phase','finished','finishedAt',at);
   elsif jsonb_array_length(racers)=0 or r->>'phase' in ('lobby','countdown') then r:=r||jsonb_build_object('phase','lobby','startsAt',null,'startedAt',null,'winnerId',null);end if;
  elsif p_action<>'session' then raise exception 'Poyga amali noto‘g‘ri.';
  end if;
 end if;
 r:=r||jsonb_build_object('racers',racers);
 update public.sq_live_rooms x set data=r where x.id=p_race_id and x.data is distinct from r;
 if p_action='leave' then return jsonb_build_object('ok',true);end if;
 return public.sq_race_state(r,ids);
 end $$;


-- Disable the obsolete shared channels; each teacher now owns independent rooms.
update public.documents set data=data||jsonb_build_object('active',false,'phase','closed') where collection='live' and id='race';
update public.documents set data=data-array['typingActive','typingOwnerId','typingActivatedAt'] where collection='settings' and id='app';
drop policy if exists sq_728_settings on public.documents;
create policy sq_728_settings on public.documents as restrictive for all to authenticated using (collection<>'settings' or not data ?| array['typingActive','typingOwnerId','typingActivatedAt']) with check (collection<>'settings' or not data ?| array['typingActive','typingOwnerId','typingActivatedAt']);

revoke all on function public.sq_typing_state(jsonb), public.sq_national_state(jsonb), public.sq_national_info(jsonb) from public,anon,authenticated;
revoke all on function public.sq_quiz_save(text,jsonb),public.sq_documents_batch(jsonb),public.sq_owned_bulk(text,text),public.sq_room_catalog(text),public.sq_room_manage(text,boolean,jsonb),public.sq_room_staff(),public.sq_typing_action(text,text,jsonb),public.sq_national_catalog(),public.sq_national_action(text,text,jsonb),public.sq_record_activity(text,text),public.sq_admin_analytics(text,text,text),public.sq_schema_status() from public,anon;
grant execute on function public.sq_quiz_save(text,jsonb),public.sq_documents_batch(jsonb),public.sq_owned_bulk(text,text),public.sq_room_catalog(text),public.sq_room_manage(text,boolean,jsonb),public.sq_room_staff(),public.sq_typing_action(text,text,jsonb),public.sq_national_catalog(),public.sq_national_action(text,text,jsonb),public.sq_record_activity(text,text),public.sq_admin_analytics(text,text,text),public.sq_schema_status() to authenticated;

-- One refresh per affected quiz per statement, including a thousand-row clear.
create or replace function public.sq_rebuild_quiz_rank(p_id text) returns void language sql security definer set search_path='' as $$
 insert into public.documents(collection,id,data,updated_at)
 select 'leaderboards',p_id,jsonb_build_object('quizId',p_id,'rows',coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.data->>'name','avatar',p.data->>'avatar','score',coalesce((p.data->>'score')::numeric,0),'correct',coalesce((p.data->>'correct')::integer,0),'answers',coalesce((p.data->>'answers')::integer,0),'startedAt',p.data->'startedAt','finishedAt',p.data->'finishedAt') order by coalesce((p.data->>'score')::numeric,0) desc,(p.data->>'finishedAt')::bigint nulls last,(p.data->>'startedAt')::bigint),'[]'::jsonb)),now() from public.documents p where p.collection='players' and p.data->>'quizId'=p_id
 on conflict(collection,id) do update set data=excluded.data,updated_at=excluded.updated_at
$$;
create or replace function public.sq_rank_statement() returns trigger language plpgsql security definer set search_path='' as $$
 declare q text;begin
 if tg_op='DELETE' then
  if not exists(select 1 from sq_old_rows where collection in ('players','quizzes')) then return null;end if;
  for q in select distinct data->>'quizId' from sq_old_rows where collection='players' loop if q is not null then perform public.sq_rebuild_quiz_rank(q);end if;end loop;
  delete from public.documents d where d.collection='leaderboards' and d.id in (select id from sq_old_rows where collection='quizzes');
 elsif tg_op='INSERT' then
  if not exists(select 1 from sq_new_rows where collection='players') then return null;end if;
  for q in select distinct data->>'quizId' from sq_new_rows where collection='players' loop if q is not null then perform public.sq_rebuild_quiz_rank(q);end if;end loop;
 else
  for q in select distinct data->>'quizId' from sq_new_rows where collection='players' union select distinct data->>'quizId' from sq_old_rows where collection='players' loop if q is not null then perform public.sq_rebuild_quiz_rank(q);end if;end loop;
 end if;return null;
 end $$;
drop trigger if exists sq_refresh_leaderboard_trigger on public.documents;
drop trigger if exists sq_rank_insert on public.documents;
drop trigger if exists sq_rank_update on public.documents;
drop trigger if exists sq_rank_delete on public.documents;
create trigger sq_rank_insert after insert on public.documents referencing new table as sq_new_rows for each statement execute function public.sq_rank_statement();
create trigger sq_rank_update after update on public.documents referencing old table as sq_old_rows new table as sq_new_rows for each statement execute function public.sq_rank_statement();
create trigger sq_rank_delete after delete on public.documents referencing old table as sq_old_rows for each statement execute function public.sq_rank_statement();
revoke all on function public.sq_rebuild_quiz_rank(text),public.sq_rank_statement() from public,anon,authenticated;
-- Practice-only classification remains visible in group competition feedback.
do $$ declare body text;begin
 body:=pg_get_functiondef('public.sq_comp_answer(uuid,uuid,uuid,jsonb)'::regprocedure);
 body:=replace(body,$find$case when (grade->>'ratio')::numeric=1 then 'To‘g‘ri javob.'$find$,$fix$case when grade->'practiceOnly'='true'::jsonb then grade->>'message' when (grade->>'ratio')::numeric=1 then 'To‘g‘ri javob.'$fix$);
 body:=replace(body,$find$from jsonb_array_elements(s.data->'questions') x;$find$,$fix$from jsonb_array_elements(s.data->'questions') x where x->>'type'<>'python';$fix$);
 execute body;
end $$;
-- IQ deadline and start use the same server instant (when the IQ module exists).
do $$ declare body text;begin
 if to_regprocedure('public.sq_iq(text,jsonb)') is not null then
  body:=pg_get_functiondef('public.sq_iq(text,jsonb)'::regprocedure);
  if position('v_started timestamptz' in body)=0 then
   body:=replace(body,'declare uid uuid:=auth.uid();','declare v_started timestamptz:=clock_timestamp();uid uuid:=auth.uid();');
   body:=replace(body,'bank,deadline) values(uid,v_band,v_mode,1,chosen_bank,clock_timestamp()+case','bank,started_at,deadline) values(uid,v_band,v_mode,1,chosen_bank,v_started,v_started+case');
   execute body;
  end if;
 end if;
end $$;
commit;
