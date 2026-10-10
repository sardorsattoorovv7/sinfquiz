-- SinfQuiz 7.26.2. Run after the existing schema and migrations through 7.24.
-- Additive upgrade: teacher content and science RLS policies are preserved.
begin;
do $$ begin
 if to_regprocedure('public.sq_comp_grade(jsonb,jsonb)') is null then
  raise exception 'Avval supabase-migration-7.22.sql va 7.24.sql ni bajaring.';
 end if;
end $$;

create table if not exists public.sq_quiz_sessions (
 id text primary key, uid uuid not null, quiz_id text not null, quiz jsonb not null,
 question_index integer not null default 0, deadline bigint not null,
 feedback jsonb, finished boolean not null default false, created_at timestamptz not null default now()
);
alter table public.sq_quiz_sessions enable row level security;
revoke all on public.sq_quiz_sessions from public,anon,authenticated;
create index if not exists sq_quiz_sessions_user on public.sq_quiz_sessions(uid,created_at);

create table if not exists public.sq_play_limits(uid uuid,label text,bucket timestamptz not null,hits integer not null,primary key(uid,label));
alter table public.sq_play_limits enable row level security;
revoke all on public.sq_play_limits from public,anon,authenticated;
create or replace function public.sq_play_limit(p_label text,p_max integer) returns void language plpgsql security definer set search_path='' as $$
 declare b timestamptz:=date_trunc('minute',clock_timestamp());n integer;begin
 insert into public.sq_play_limits(uid,label,bucket,hits) values(auth.uid(),p_label,b,1)
 on conflict(uid,label) do update set bucket=b,hits=case when sq_play_limits.bucket=b then sq_play_limits.hits+1 else 1 end returning hits into n;
 if n>p_max then raise exception 'Urinishlar ko‘paydi. Bir daqiqadan keyin qayta urinib ko‘ring.';end if;
 end $$;
revoke all on function public.sq_play_limit(text,integer) from public,anon,authenticated;

-- Preserve all existing policy branches; tighten only quiz answers, player writes and live races.
do $$ declare p record;extra text;begin
 for p in select polname,polcmd,pg_get_expr(polqual,polrelid) q,pg_get_expr(polwithcheck,polrelid) c
  from pg_policy where polrelid='public.documents'::regclass and polname in ('sq_select','sq_insert','sq_update') loop
  if p.polcmd='r' then
   extra:='(collection not in (''quizzes'',''live'') or (collection=''quizzes'' and public.sq_is_teacher()) or (collection=''live'' and data->>''ownerId''=auth.uid()::text and public.sq_is_teacher()))';
   execute format('alter policy %I on public.documents using ((%s) and %s)',p.polname,p.q,extra);
  else
   extra:='(collection<>''players'' and (collection<>''live'' or (public.sq_is_teacher() and data->>''ownerId''=auth.uid()::text)))';
   if p.q is not null then execute format('alter policy %I on public.documents using ((%s) and %s)',p.polname,p.q,extra);end if;
   if p.c is not null then execute format('alter policy %I on public.documents with check ((%s) and %s)',p.polname,p.c,extra);end if;
  end if;
 end loop;
end $$;

create or replace function public.sq_quiz_info(q jsonb) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('id',q->>'id','title',q->>'title','group',q->>'group','subject',q->>'subject',
  'questionCount',jsonb_array_length(q->'questions'),'visibility',coalesce(q->>'visibility','private'),'ownerName',coalesce(q->>'ownerName','O‘qituvchi'))
$$;
create or replace function public.sq_safe_question(q jsonb) returns jsonb language sql immutable set search_path='' as $$
 select case when q is null then null else
  (q-array['correct','answer','acceptedAnswers','criteria','officeRubric']) ||
  case when q?'officeTask' then jsonb_build_object('officeTask',(q->'officeTask')-'rubric') else '{}'::jsonb end end
$$;
create or replace function public.sq_quiz_catalog() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(public.sq_quiz_info(d.data||jsonb_build_object('id',d.id)) order by d.updated_at desc),'[]'::jsonb)
 from public.documents d where d.collection='quizzes' and d.data->>'visibility'='public' and d.data->>'status'='active' and auth.uid() is not null
$$;
create or replace function public.sq_quiz_ticket(p_pin text) returns jsonb language plpgsql security definer set search_path='' as $$
 declare q jsonb;begin
 if auth.uid() is null then raise exception 'Kirish sessiyasi kerak.';end if;
 perform public.sq_play_limit('quiz-ticket',30);
 if p_pin !~ '^[0-9]{6}$' then raise exception '6 xonali kodni kiriting.';end if;
 select d.data||jsonb_build_object('id',d.id) into q from public.documents d
  where d.collection='quizzes' and d.data->>'pin'=p_pin and d.data->>'status'='active' limit 1;
 if q is null then raise exception 'Kod topilmadi yoki test hali ochilmagan.';end if;
 return jsonb_build_object('quiz',public.sq_quiz_info(q),'ticket',q->>'id');
 end $$;

-- Internal state reader. It never returns future questions or the answer key.
create or replace function public.sq_quiz_state(p_id text) returns jsonb language plpgsql security definer set search_path='' as $$
 declare s public.sq_quiz_sessions;player jsonb;rows jsonb;begin
 select * into s from public.sq_quiz_sessions where id=p_id and uid=auth.uid();
 if not found then raise exception 'O‘yin sessiyasi topilmadi. Kod bilan qayta kiring.';end if;
 select d.data into player from public.documents d where d.collection='players' and d.id=p_id;
 select d.data->'rows' into rows from public.documents d where d.collection='leaderboards' and d.id=s.quiz_id;
 return jsonb_build_object('quiz',public.sq_quiz_info(s.quiz),'player',player-'responses','question',
  case when s.finished then null else public.sq_safe_question(s.quiz->'questions'->s.question_index) end,
  'index',s.question_index,'deadline',s.deadline,'serverNow',floor(extract(epoch from clock_timestamp())*1000),
  'closed',not exists(select 1 from public.documents d where d.collection='quizzes' and d.id=s.quiz_id and d.data->>'status'='active'),'csrf','supabase','feedback',s.feedback,'finished',s.finished,'ranking',coalesce(rows,'[]'::jsonb));
 end $$;

create or replace function public.sq_quiz_join(p_ticket text,p_pin text,p_name text,p_avatar text) returns jsonb language plpgsql security definer set search_path='' as $$
 declare q jsonb;id text:=gen_random_uuid()::text;at bigint:=floor(extract(epoch from clock_timestamp())*1000);begin
 if auth.uid() is null then raise exception 'Kirish sessiyasi kerak.';end if;
 perform public.sq_play_limit('quiz-join',12);
 delete from public.sq_quiz_sessions where uid=auth.uid() and created_at<now()-interval '7 days';
 if length(btrim(p_name)) not between 1 and 80 or p_avatar not in ('🧑‍💻','👩‍🚀','🤖','🥷','🧙','🦸','👾','🦊','🐼','🦁','🐯','🐸') then raise exception 'Ism va avatarni kiriting.';end if;
 select d.data||jsonb_build_object('id',d.id) into q from public.documents d where d.collection='quizzes' and d.id=p_ticket and d.data->>'pin'=p_pin and d.data->>'status'='active';
 if q is null or jsonb_array_length(q->'questions')=0 then raise exception 'Test o‘zgardi yoki yopildi. Kodni qayta kiriting.';end if;
 insert into public.sq_quiz_sessions(id,uid,quiz_id,quiz,deadline) values(id,auth.uid(),p_ticket,q,at+greatest(5,least(600,coalesce((q->'questions'->0->>'time')::integer,30)))*1000);
 insert into public.documents(collection,id,data) values('players',id,jsonb_build_object('id',id,'uid',auth.uid()::text,'ownerId',q->>'ownerId','quizId',p_ticket,'quizTitle',q->>'title','name',btrim(p_name),'avatar',p_avatar,'score',0,'correct',0,'answers',0,'startedAt',at,'responses','[]'::jsonb));
 return public.sq_quiz_state(id);
 end $$;

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
  f:=jsonb_build_object('ratio',ratio,'earned',earned,'correct',ratio=1,'expired',remaining=0,'checks',g->'checks','answer',q->'answer','correctIndex',case when q->>'type'='test' then q->'correct' else null end,'explanation',q->'explanation');
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

create or replace function public.sq_race_info(r jsonb) returns jsonb language sql immutable set search_path='' as $$
 select (r-array['questions','questionsByLane','sourcePin','ownerId'])||jsonb_build_object('racers',coalesce((select jsonb_agg(x-array['uid','feedback','retryAt','answer']) from jsonb_array_elements(coalesce(r->'racers','[]')) x),'[]'::jsonb))
$$;
create or replace function public.sq_race_state(r jsonb,p_ids jsonb) returns jsonb language plpgsql stable set search_path='' as $$
 declare ids jsonb:=coalesce(p_ids,'[]');player jsonb;questions jsonb:='[]';feedback jsonb:='{}';id text;q jsonb;at bigint:=floor(extract(epoch from clock_timestamp())*1000);begin
 if jsonb_array_length(ids) not between 1 and 2 or jsonb_array_length(ids)<>(select count(distinct x) from jsonb_array_elements_text(ids) x) then raise exception 'Poyga sessiyasi topilmadi.';end if;
 for id in select jsonb_array_elements_text(ids) loop
  select x into player from jsonb_array_elements(r->'racers') x where x->>'id'=id and x->>'uid'=auth.uid()::text;
  if player is null then raise exception 'Poygachi sizga tegishli emas.';end if;
  q:=case when r->>'phase'='running' and coalesce(r->>'winnerId','')='' then coalesce(r->'questionsByLane'->((player->>'lane')::integer)->((player->>'index')::integer),r->'questions'->((player->>'index')::integer)) else null end;
  questions:=questions||jsonb_build_array(public.sq_safe_question(q));feedback:=feedback||jsonb_build_object(id,player->'feedback');
 end loop;
 if jsonb_array_length(ids)=2 then return jsonb_build_object('race',public.sq_race_info(r),'localMode',true,'playerIds',ids,'questions',questions,'feedbackByPlayer',feedback,'csrf','supabase','serverNow',at);end if;
 return jsonb_build_object('race',public.sq_race_info(r),'playerId',ids->>0,'question',questions->0,'index',player->'index','feedback',player->'feedback','csrf','supabase','serverNow',at);
 end $$;

create or replace function public.sq_race_action(p_action text,p_race_id text default null,p_ids jsonb default '[]',p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
 declare r jsonb;racers jsonb;player jsonb;entry jsonb;ids jsonb:=p_ids;id text;q jsonb;correct boolean;total integer;at bigint:=floor(extract(epoch from clock_timestamp())*1000);begin
 if auth.uid() is null then raise exception 'Kirish sessiyasi kerak.';end if;
 if p_action='join' then perform public.sq_play_limit('race-join',12);end if;
 if length(p_payload::text)>20000 then raise exception 'So‘rov hajmi juda katta.';end if;
 select d.data into r from public.documents d where d.collection='live' and d.id='race' for update;
 if p_action='active' then return case when r->'active'='true'::jsonb then public.sq_race_info(r)||jsonb_build_object('playerCount',jsonb_array_length(r->'racers')) else jsonb_build_object('active',false) end;end if;
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
 update public.documents d set data=r,updated_at=now() where d.collection='live' and d.id='race' and d.data is distinct from r;
 if p_action='leave' then return jsonb_build_object('ok',true);end if;
 return public.sq_race_state(r,ids);
 end $$;

revoke all on function public.sq_quiz_info(jsonb),public.sq_safe_question(jsonb),public.sq_quiz_catalog(),public.sq_quiz_ticket(text),public.sq_quiz_state(text),public.sq_quiz_join(text,text,text,text),public.sq_quiz_action(text,text,jsonb),public.sq_race_info(jsonb),public.sq_race_state(jsonb,jsonb),public.sq_race_action(text,text,jsonb,jsonb) from public,anon;
grant execute on function public.sq_quiz_catalog(),public.sq_quiz_ticket(text),public.sq_quiz_join(text,text,text,text),public.sq_quiz_action(text,text,jsonb),public.sq_race_action(text,text,jsonb,jsonb) to authenticated;
commit;
