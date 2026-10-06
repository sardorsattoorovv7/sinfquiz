-- SinfQuiz 7.24: run AFTER supabase-migration-7.22.sql (and existing migrations).
-- Safe to run again. No reseeding, deletions, Cron, extensions or secret key.
begin;
alter table public.sq_comp_members add column if not exists excluded boolean not null default false;
alter table public.sq_comp_teams add column if not exists started_size integer check(started_size between 0 and 12);
update public.sq_comp_teams t set started_size=(select count(*) from public.sq_comp_members m where m.team_id=t.id)
 where t.started_size is null and exists(select 1 from public.sq_competitions c where c.id=t.competition_id and c.status in ('running','finished','cancelled'));

-- Exact Unicode-codepoint Levenshtein. Prefix/suffix stripping and adaptive bands
-- make an insertion/deletion near the start of a 4,000-character text inexpensive.
create or replace function public.sq_comp_distance_band(p_a text[],p_b text[],p_band integer) returns integer language plpgsql immutable set search_path='' as $$
 declare n integer:=cardinality(p_a);m integer:=cardinality(p_b);prev integer[];curr integer[];i integer;j integer;lo integer;hi integer;best integer;inf integer:=p_band+1;
 begin
  if abs(n-m)>p_band then return inf;end if;
  prev:=array_fill(inf,array[m+1],array[0]);
  for j in 0..least(m,p_band) loop prev[j]:=j;end loop;
  for i in 1..n loop
   curr:=array_fill(inf,array[m+1],array[0]);curr[0]:=least(i,inf);lo:=greatest(1,i-p_band);hi:=least(m,i+p_band);best:=curr[0];
   for j in lo..hi loop
    curr[j]:=least(prev[j]+1,curr[j-1]+1,prev[j-1]+case when p_a[i]=p_b[j] then 0 else 1 end);best:=least(best,curr[j]);
   end loop;
   if best>p_band then return inf;end if;prev:=curr;
  end loop;
  return prev[m];
 end
$$;
create or replace function public.sq_comp_units_distance(p_a text[],p_b text[],p_limit integer default null) returns integer language plpgsql immutable set search_path='' as $$
 declare a text[]:=p_a;b text[]:=p_b;n integer:=cardinality(a);m integer:=cardinality(b);first integer:=1;band integer;distance integer;
 begin
  while first<=least(n,m) and a[first]=b[first] loop first:=first+1;end loop;
  while n>=first and m>=first and a[n]=b[m] loop n:=n-1;m:=m-1;end loop;
  a:=coalesce(a[first:n],'{}');b:=coalesce(b[first:m],'{}');n:=cardinality(a);m:=cardinality(b);
  if n=0 then return m;elsif m=0 then return n;end if;
  if p_limit is not null and abs(n-m)>p_limit then return p_limit+1;end if;
  if not a && b then return greatest(n,m);end if;
  band:=greatest(8,abs(n-m));
  loop
   distance:=public.sq_comp_distance_band(a,b,band);
   if distance<=band then return distance;end if;
   if p_limit is not null and band>=p_limit then return p_limit+1;end if;
   band:=least(greatest(n,m),case when p_limit is null then band*2 else least(p_limit,band*2) end);
  end loop;
 end
$$;
create or replace function public.sq_comp_distance(p_target text,p_typed text) returns integer language plpgsql immutable set search_path='' as $$
 begin
  if length(p_target)>4000 or length(p_typed)>8000 then raise exception 'Matn hajmi ruxsat etilganidan katta';end if;
  return public.sq_comp_units_distance(string_to_array(coalesce(p_target,''),null),string_to_array(coalesce(p_typed,''),null));
 end
$$;
create or replace function public.sq_comp_words(p_text text) returns text[] language sql immutable set search_path='' as $$
 select case when cleaned='' then '{}'::text[] else regexp_split_to_array(cleaned,ws||'+') end
 from (select regexp_replace(coalesce(p_text,''),'^'||ws||'+|'||ws||'+$','','g') cleaned,ws
 from (select '['||chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||' ]' ws) whitespace) normalized
$$;
create or replace function public.sq_comp_typing(p_target text,p_typed text) returns jsonb language plpgsql immutable set search_path='' as $$
 declare distance integer;expected integer:=length(p_target);typed integer:=length(p_typed);accuracy numeric;chars integer;method text:='levenshtein';a text[];b text[];minimum_chars integer;
 begin
  if expected>4000 or typed>8000 then raise exception 'Matn hajmi ruxsat etilganidan katta';end if;
  distance:=public.sq_comp_units_distance(string_to_array(p_target,null),string_to_array(p_typed,null),128);minimum_chars:=greatest(distance,abs(expected-typed));
  if distance>128 then
   method:='word-levenshtein';a:=public.sq_comp_words(p_target);b:=public.sq_comp_words(p_typed);
   expected:=cardinality(a);typed:=cardinality(b);distance:=public.sq_comp_units_distance(a,b);
  end if;
  accuracy:=100*greatest(0,greatest(expected,typed)-distance)::numeric/greatest(expected,typed,1);
  if method='word-levenshtein' then accuracy:=least(accuracy,100*greatest(0,greatest(length(p_target),length(p_typed))-minimum_chars)::numeric/greatest(length(p_target),length(p_typed),1));end if;
  chars:=case when method='levenshtein' then greatest(0,least(expected,typed,greatest(expected,typed)-distance)) else round(length(p_target)*accuracy/100)::integer end;
  return jsonb_build_object('method',method,'distance',distance,'accuracy',accuracy,'correct',chars,'expectedUnits',expected,'typedUnits',typed,'minimumCharEdits',minimum_chars);
 end
$$;


create or replace function public.sq_comp_state(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
 declare c public.sq_competitions;s public.sq_comp_stages;m public.sq_comp_members;a public.sq_comp_attempts;manager boolean;teams jsonb;stages jsonb;current jsonb:=null;question jsonb;data jsonb;deadline timestamptz;result jsonb;history jsonb;roster jsonb;revision bigint;
 begin
  if not public.sq_comp_read(p_id) then raise exception 'Musobaqa yopiq yoki sizga tegishli emas';end if;
  select x.* into c from public.sq_competitions x where x.id=p_id for share;
  select sig.revision into revision from public.sq_comp_signals sig where sig.competition_id=p_id;
  manager:=public.sq_comp_owner(p_id);
  select x.* into m from public.sq_comp_members x where x.competition_id=p_id and x.user_id=auth.uid();
  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'position',x.position,'title',x.title,'kind',x.kind,'duration',x.duration,'weight',x.weight)||case when manager and c.status='draft' then jsonb_build_object('config',x.config,'custom',x.data) else '{}' end order by x.position),'[]') into stages from public.sq_comp_stages x where x.competition_id=p_id;
  if c.status='running' then
   select x.* into s from public.sq_comp_stages x where x.competition_id=p_id and x.position=c.current_stage;
   deadline:=c.stage_started_at+make_interval(secs=>s.duration);
   current:=jsonb_build_object('id',s.id,'position',s.position,'title',s.title,'kind',s.kind,'weight',s.weight,'duration',s.duration,'deadline',deadline);
   if m.user_id is not null and not m.excluded then
    insert into public.sq_comp_attempts(competition_id,stage_id,user_id,started_at,payload) values(p_id,s.id,auth.uid(),c.stage_started_at,case s.kind when 'maze' then jsonb_build_object('position',s.data->'start','opened','[]'::jsonb,'mistakes','{}'::jsonb,'hints','{}'::jsonb) else '{}'::jsonb end) on conflict(stage_id,user_id) do nothing;
    select x.* into a from public.sq_comp_attempts x where x.stage_id=s.id and x.user_id=auth.uid();
    if a.finished_at is null and (clock_timestamp()>=deadline or m.withdrawn) then update public.sq_comp_attempts x set finished_at=least(clock_timestamp(),deadline),elapsed=greatest(0,extract(epoch from least(clock_timestamp(),deadline)-x.started_at)) where x.stage_id=s.id and x.user_id=auth.uid() returning x.* into a;perform public.sq_comp_tick(p_id);end if;
    data:='{}';
    if a.finished_at is null then
     if s.kind='quiz' then
      question:=s.data->'questions'->a.cursor;
      question:=question-array['correct','answer','acceptedAnswers','officeRubric','criteria'];
      if question?'officeTask' then question:=jsonb_set(question,'{officeTask}',(question->'officeTask')-'rubric');end if;
      data:=jsonb_build_object('question',question,'index',a.cursor,'total',jsonb_array_length(s.data->'questions'));
     elsif s.kind='typing' then data:=s.data;
     else
      select jsonb_agg(t-array['answer','translation','explanation','hints']) into question from jsonb_array_elements(s.data->'tasks') t;
      data:=(s.data-'tasks'-'route')||jsonb_build_object('tasks',question,'position',a.payload->'position','opened',a.payload->'opened','mistakes',a.payload->'mistakes','hintsUsed',a.payload->'hints');
     end if;
    end if;
    current:=current||jsonb_build_object('data',data,'finished',a.finished_at is not null,'score',a.score,'correct',a.correct,'feedback',a.feedback);
   end if;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('stage',st.position,'title',st.title,'score',at.score,'correct',at.correct,'elapsed',at.elapsed,'finished',at.finished_at is not null) order by st.position),'[]') into history from public.sq_comp_attempts at join public.sq_comp_stages st on st.id=at.stage_id where at.competition_id=p_id and at.user_id=auth.uid();
  if manager then
   select coalesce(jsonb_agg(jsonb_build_object('userId',mem.user_id,'name',mem.name,'teamId',mem.team_id,'withdrawn',mem.withdrawn,'excluded',mem.excluded,'stages',(select coalesce(jsonb_agg(jsonb_build_object('stage',st.position,'score',at.score,'correct',at.correct,'elapsed',at.elapsed,'finished',at.finished_at is not null,'feedback',at.feedback) order by st.position),'[]') from public.sq_comp_attempts at join public.sq_comp_stages st on st.id=at.stage_id where at.competition_id=p_id and at.user_id=mem.user_id)) order by mem.team_id,mem.seat),'[]') into roster from public.sq_comp_members mem where mem.competition_id=p_id;
  end if;
  -- Aggregate each attempt once instead of rescanning attempts for every team/stage.
  with counts as (
   select mem.team_id,count(*) filter(where not mem.excluded) joined from public.sq_comp_members mem where mem.competition_id=p_id group by mem.team_id
  ), per_stage as (
   select mem.team_id,st.position,sum(at.score) points,sum(at.score*st.weight) weighted,sum(at.correct) correct,sum(at.elapsed) elapsed,count(*) filter(where at.finished_at is not null and not mem.withdrawn) completed
   from public.sq_comp_attempts at join public.sq_comp_members mem on mem.competition_id=at.competition_id and mem.user_id=at.user_id join public.sq_comp_stages st on st.id=at.stage_id
   where at.competition_id=p_id and not mem.excluded group by mem.team_id,st.position
  ), team_base as (
   select t.*,coalesce(cnt.joined,0) joined,coalesce(t.started_size,c.team_size) divisor,
    coalesce(sum(ps.weighted),0) weighted,coalesce(sum(ps.correct),0) correct,coalesce(sum(ps.elapsed),0) elapsed
   from public.sq_comp_teams t left join counts cnt on cnt.team_id=t.id left join per_stage ps on ps.team_id=t.id
   where t.competition_id=p_id group by t.id,cnt.joined
  ), ranked as (
   select t.*,round(weighted/greatest(divisor,1),2) score,round(correct::numeric/greatest(divisor,1),2) average_correct,round(elapsed/greatest(divisor,1),2) average_elapsed,
    case when started_size=0 then null else rank() over(order by (started_size=0) asc nulls first,round(weighted/greatest(divisor,1),2) desc,round(correct::numeric/greatest(divisor,1),2) desc,round(elapsed/greatest(divisor,1),2) asc) end place
   from team_base t
  )
  select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'joined',r.joined,'startedSize',r.started_size,'score',r.score,'correct',r.average_correct,'elapsed',r.average_elapsed,'rank',r.place,'stages',
    (select coalesce(jsonb_agg(jsonb_build_object('position',st.position,'score',round(coalesce(ps.points,0)/greatest(r.divisor,1),2),'completed',coalesce(ps.completed,0)) order by st.position),'[]') from public.sq_comp_stages st left join per_stage ps on ps.position=st.position and ps.team_id=r.id where st.competition_id=p_id))||case when manager then jsonb_build_object('code',r.join_code,'roster',r.roster) else '{}' end order by r.place nulls last,r.title),'[]') into teams from ranked r;
  result:=jsonb_build_object('revision',coalesce(revision,0),'competition',jsonb_build_object('id',c.id,'title',c.title,'description',c.description,'visibility',c.visibility,'teamSize',c.team_size,'status',c.status,'currentStage',c.current_stage),'manager',manager,'teams',teams,'stages',stages,'current',current,'me',case when m.user_id is not null then jsonb_build_object('name',m.name,'teamId',m.team_id,'seat',m.seat,'withdrawn',m.withdrawn,'excluded',m.excluded) else null end,'history',history,'serverNow',clock_timestamp());
  if manager then result:=result||jsonb_build_object('members',roster);end if;return result;
 end
$$;

create or replace function public.sq_comp_poll(p_id uuid,p_revision bigint default -1) returns jsonb language plpgsql security definer set search_path='' as $$
 declare revision bigint;expired boolean;
 begin
  if not public.sq_comp_read(p_id) then raise exception 'Musobaqa yopiq yoki sizga tegishli emas';end if;
  select sig.revision into revision from public.sq_comp_signals sig where sig.competition_id=p_id;
  select exists(select 1 from public.sq_competitions c join public.sq_comp_stages s on s.competition_id=c.id and s.position=c.current_stage
   join public.sq_comp_attempts a on a.stage_id=s.id and a.user_id=auth.uid()
   where c.id=p_id and c.status='running' and a.finished_at is null and clock_timestamp()>=c.stage_started_at+make_interval(secs=>s.duration)) into expired;
  if coalesce(revision,0)=p_revision and not expired then return jsonb_build_object('unchanged',true,'revision',coalesce(revision,0),'serverNow',clock_timestamp());end if;
  return public.sq_comp_state(p_id);
 end
$$;

create or replace function public.sq_comp_member(p_id uuid,p_user uuid,p_included boolean) returns jsonb language plpgsql security definer set search_path='' as $$
 declare c public.sq_competitions;
 begin
  select x.* into c from public.sq_competitions x where x.id=p_id for update;
  if not found or not public.sq_comp_owner(p_id) then raise exception 'Tarkibni boshqarishga ruxsat yo‘q';end if;
  if c.status<>'lobby' then raise exception 'Tarkib faqat musobaqa boshlanguncha o‘zgartiriladi';end if;
  if p_included is null then raise exception 'Qatnashish holatini belgilang';end if;
  update public.sq_comp_members m set excluded=not p_included where m.competition_id=p_id and m.user_id=p_user;
  if not found then raise exception 'Ishtirokchi shu musobaqada topilmadi';end if;
  perform public.sq_comp_tick(p_id);return public.sq_comp_state(p_id);
 end
$$;

create or replace function public.sq_comp_control(p_id uuid,p_action text,p_expected_stage integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
 declare c public.sq_competitions;s public.sq_comp_stages;deadline timestamptz;members integer;done integer;total integer;teams_ready integer;
 begin
  select x.* into c from public.sq_competitions x where x.id=p_id for update;
  if not found or not public.sq_comp_owner(p_id) then raise exception 'Musobaqani boshqarishga ruxsat yo‘q';end if;
  if p_action='publish' then
   if c.status='lobby' then return public.sq_comp_state(p_id);end if;
   if c.status<>'draft' then raise exception 'Bu musobaqa allaqachon faollashtirilgan';end if;
   update public.sq_competitions x set status='lobby',updated_at=clock_timestamp() where x.id=p_id;
  elsif p_action in ('start','start-current') then
   if c.status='running' then return public.sq_comp_state(p_id);end if;
   if c.status<>'lobby' then raise exception 'Avval ro‘yxatdan o‘tishni faollashtiring';end if;
   select count(*) into members from public.sq_comp_members m where m.competition_id=p_id and not m.excluded;
   select count(*)*c.team_size into total from public.sq_comp_teams t where t.competition_id=p_id;
   if p_action='start' and members<>total then raise exception 'Barcha jamoalar to‘liq bo‘lgach musobaqa boshlanadi yoki hozirgi tarkib bilan boshlang';end if;
   select count(distinct m.team_id) into teams_ready from public.sq_comp_members m where m.competition_id=p_id and not m.excluded;
   if teams_ready<2 then raise exception 'Kamida ikkita jamoada bittadan ishtirokchi bo‘lsin';end if;
   update public.sq_comp_teams t set started_size=(select count(*) from public.sq_comp_members m where m.team_id=t.id and not m.excluded) where t.competition_id=p_id;
   update public.sq_competitions x set status='running',current_stage=1,stage_started_at=clock_timestamp(),updated_at=clock_timestamp() where x.id=p_id;
  elsif p_action in ('next','force-next') then
   if c.current_stage>p_expected_stage or c.status='finished' then return public.sq_comp_state(p_id);end if;
   if c.status<>'running' or c.current_stage<>p_expected_stage then raise exception 'Bosqich holati o‘zgargan. Yangilang';end if;
   select x.* into s from public.sq_comp_stages x where x.competition_id=p_id and x.position=c.current_stage;
   deadline:=c.stage_started_at+make_interval(secs=>s.duration);
   select count(*) into members from public.sq_comp_members m where m.competition_id=p_id and not m.excluded;
   select count(*) into members from public.sq_comp_members m where m.competition_id=p_id and not m.excluded and not m.withdrawn;
   select count(*) into done from public.sq_comp_attempts a join public.sq_comp_members m on m.competition_id=a.competition_id and m.user_id=a.user_id where a.stage_id=s.id and a.finished_at is not null and not m.excluded and not m.withdrawn;
   if p_action='next' and clock_timestamp()<deadline and done<members then raise exception 'Hali barcha ishtirokchi tugatmagan. Kuting yoki bosqichni yakunlang';end if;
   insert into public.sq_comp_attempts(competition_id,stage_id,user_id,started_at) select p_id,s.id,m.user_id,c.stage_started_at from public.sq_comp_members m where m.competition_id=p_id and not m.excluded on conflict(stage_id,user_id) do nothing;
   update public.sq_comp_attempts a set finished_at=least(clock_timestamp(),deadline),elapsed=greatest(0,extract(epoch from least(clock_timestamp(),deadline)-a.started_at)) where a.stage_id=s.id and a.finished_at is null;
   select count(*) into total from public.sq_comp_stages x where x.competition_id=p_id;
   if c.current_stage>=total then update public.sq_competitions x set status='finished',updated_at=clock_timestamp() where x.id=p_id;
   else update public.sq_competitions x set current_stage=c.current_stage+1,stage_started_at=clock_timestamp(),updated_at=clock_timestamp() where x.id=p_id;end if;
  elsif p_action='cancel' then
   if c.status='cancelled' then return public.sq_comp_state(p_id);end if;
   if c.status='finished' then raise exception 'Yakunlangan musobaqa natijasi o‘zgarmaydi';end if;
   update public.sq_competitions x set status='cancelled',updated_at=clock_timestamp() where x.id=p_id;
   update public.sq_comp_attempts a set finished_at=coalesce(a.finished_at,clock_timestamp()),elapsed=case when a.finished_at is null then greatest(0,extract(epoch from clock_timestamp()-a.started_at)) else a.elapsed end where a.competition_id=p_id;
  else raise exception 'Boshqaruv amali noma’lum';end if;
  perform public.sq_comp_tick(p_id);return public.sq_comp_state(p_id);
 end
$$;

create or replace function public.sq_comp_answer(p_id uuid,p_stage uuid,p_action uuid,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 <<submission>>
 declare c public.sq_competitions;s public.sq_comp_stages;a public.sq_comp_attempts;m public.sq_comp_members;q jsonb;grade jsonb;deadline timestamptz;payload jsonb;feedback jsonb;points numeric;maximum numeric;score numeric;correct integer;cursor integer;elapsed numeric;finished boolean:=false;key text:=p_action::text;gate integer;mistakes integer;hints integer;path jsonb;chars integer;distance integer;typed text;target text;accuracy numeric;wpm numeric;body jsonb;
 begin
  if auth.uid() is null or length(p_data::text)>22000 then raise exception 'Javob hajmi yoki kirish holati noto‘g‘ri';end if;
  select x.* into c from public.sq_competitions x where x.id=p_id for share;
  select x.* into m from public.sq_comp_members x where x.competition_id=p_id and x.user_id=auth.uid();
  if m.user_id is null or m.withdrawn or m.excluded then raise exception 'Siz bu musobaqada qatnashmayapsiz';end if;
  select x.* into a from public.sq_comp_attempts x where x.stage_id=p_stage and x.user_id=auth.uid() for update;
  if a.actions?key then return public.sq_comp_state(p_id);end if;
  if c.status<>'running' then raise exception 'Bosqich faol emas';end if;
  select x.* into s from public.sq_comp_stages x where x.competition_id=p_id and x.position=c.current_stage;
  if s.id<>p_stage or a.stage_id is null then raise exception 'Joriy bosqichni qayta oching';end if;
  deadline:=c.stage_started_at+make_interval(secs=>s.duration);elapsed:=greatest(0,extract(epoch from clock_timestamp()-a.started_at));
  if a.finished_at is not null or clock_timestamp()>=deadline then return public.sq_comp_state(p_id);end if;
  if not public.sq_comp_limit('answer',120) then return jsonb_build_object('error','Javoblar juda tez yuborildi. Biroz kuting.');end if;
  payload:=a.payload;points:=a.points;score:=a.score;correct:=a.correct;cursor:=a.cursor;
  if p_data->>'mode'='finish' and s.kind<>'maze' then finished:=true;feedback:=jsonb_build_object('message','Bosqich yakunlandi. Javobsiz topshiriqlar uchun ball berilmadi.');
  elsif s.kind='quiz' then
   q:=s.data->'questions'->a.cursor;
   if q->>'id' is distinct from p_data->>'questionId' then raise exception 'Savol almashgan. Sahifani yangilang';end if;
   grade:=public.sq_comp_grade(q,p_data->'answer');points:=points+(q->>'points')::numeric*(grade->>'ratio')::numeric;
   select sum((x->>'points')::numeric) into maximum from jsonb_array_elements(s.data->'questions') x;
   score:=round(100*points/greatest(maximum,1),2);correct:=correct+case when (grade->>'ratio')::numeric=1 then 1 else 0 end;cursor:=cursor+1;finished:=cursor>=jsonb_array_length(s.data->'questions');
   feedback:=grade||jsonb_build_object('message',case when (grade->>'ratio')::numeric=1 then 'To‘g‘ri javob.' when (grade->>'ratio')::numeric>0 then 'Mezonlarning bir qismi bajarildi.' else 'Bu javob mos kelmadi.' end,'explanation',coalesce(q->>'explanation',''),'correctAnswer',case when q->>'type'='test' then q->'options'->>((q->>'correct')::integer) when q->>'type' in ('practical','shortcut','python') then q->>'answer' else null end);
   payload:=payload||jsonb_build_object('responses',coalesce(payload->'responses','[]')||jsonb_build_array(jsonb_build_object('questionId',q->>'id','answer',p_data->'answer','ratio',grade->'ratio')));
  elsif s.kind='typing' then
   target:=s.data->>'text';typed:=coalesce(p_data->>'text','');if length(typed)>8000 then raise exception 'Matn juda uzun';end if;
   grade:=public.sq_comp_typing(target,typed);distance:=(grade->>'distance')::integer;chars:=(grade->>'correct')::integer;
   accuracy:=(grade->>'accuracy')::numeric;wpm:=chars*12/greatest(elapsed,1);
   score:=round(accuracy*(.75+.25*least(wpm/75,1)),2);correct:=chars;finished:=true;
   feedback:=jsonb_build_object('message',case when grade->>'method'='word-levenshtein' then 'Matn ko‘p farq qilgani uchun tartibli so‘z tahrirlari bo‘yicha baholandi. Bir so‘z tushib qolsa, keyingi so‘zlar qayta xato sanalmaydi. Matn uzunligi va aniqlangan eng kam belgi farqi ham hisobga olindi.' else 'Matn terish yakunlandi. Tushib qolgan, ortiqcha yoki almashgan belgi bittadan xato hisoblanadi; keyingi matn siljigani uchun qayta jarima yo‘q.' end,'accuracy',round(accuracy,1),'wpm',round(wpm,1),'correctChars',chars,'expectedChars',length(target),'editDistance',distance,'method',grade->>'method','expectedUnits',grade->'expectedUnits','typedUnits',grade->'typedUnits','minimumCharEdits',grade->'minimumCharEdits');payload:=jsonb_build_object('text',typed);
  else
   path:=p_data->'path';
   if p_data->>'mode'='finish' then
    if jsonb_array_length(payload->'opened')<>jsonb_array_length(s.data->'tasks') or not public.sq_comp_path(s.data,payload->'position',path,payload->'opened',s.data->'exit') then raise exception 'Chiqish uchun barcha eshiklarni ochib, yo‘lni tugating';end if;
    finished:=true;feedback:=jsonb_build_object('message','Labirintdan chiqdingiz.');payload:=jsonb_set(payload,'{position}',s.data->'exit');
   else
    if coalesce(p_data->>'gate','') !~ '^[0-7]$' then raise exception 'Eshik raqami noto‘g‘ri';end if;gate:=(p_data->>'gate')::integer;
    if gate>=jsonb_array_length(s.data->'tasks') or payload->'opened' @> jsonb_build_array(gate) then raise exception 'Bu eshik ochilgan yoki mavjud emas';end if;
    if not public.sq_comp_path(s.data,payload->'position',path,payload->'opened',s.data->'gateCells'->gate) then raise exception 'Eshikka yurib yetib boring; devordan o‘tib bo‘lmaydi';end if;
    q:=s.data->'tasks'->gate;mistakes:=coalesce(payload->'mistakes'->>gate::text,'0')::integer;hints:=coalesce(payload->'hints'->>gate::text,'0')::integer;
    if p_data->>'mode'='hint' then
     hints:=least(2,hints+1);payload:=jsonb_set(payload,array['hints',gate::text],to_jsonb(hints),true);feedback:=jsonb_build_object('message','Yordam ishlatildi; bu eshik uchun ball kamayadi.','hint',coalesce(q->'hints'->>(hints-1),'Gapdagi yo‘nalish yoki kalit so‘zni ajrating.'));
    elsif p_data->'answer'=q->'answer' then
     points:=points+greatest(.3,1-mistakes*.15-hints*.2);correct:=correct+1;score:=round(100*points/jsonb_array_length(s.data->'tasks'),2);
     payload:=jsonb_set(payload,'{opened}',payload->'opened'||jsonb_build_array(gate));payload:=jsonb_set(payload,'{position}',s.data->'gateCells'->gate);feedback:=jsonb_build_object('message','To‘g‘ri. Eshik ochildi.','correct',true);
    else
     mistakes:=mistakes+1;payload:=jsonb_set(payload,array['mistakes',gate::text],to_jsonb(mistakes),true);feedback:=jsonb_build_object('message','Gapni qayta o‘qib yoki tinglab ko‘ring.','correct',false);
    end if;
   end if;
  end if;
  update public.sq_comp_attempts x set points=submission.points,score=submission.score,correct=submission.correct,cursor=submission.cursor,payload=submission.payload,feedback=submission.feedback,elapsed=submission.elapsed,finished_at=case when submission.finished then clock_timestamp() else null end,actions=x.actions||jsonb_build_object(submission.key,true) where x.stage_id=p_stage and x.user_id=auth.uid();
  body:=public.sq_comp_state(p_id);perform public.sq_comp_tick(p_id);return body;
 end
$$;


-- Replaced functions preserve the existing grants. New internal helpers stay private.
revoke all on function public.sq_comp_distance_band(text[],text[],integer),public.sq_comp_distance(text,text),public.sq_comp_units_distance(text[],text[],integer),public.sq_comp_typing(text,text),public.sq_comp_words(text),public.sq_comp_member(uuid,uuid,boolean),public.sq_comp_poll(uuid,bigint) from public,anon,authenticated;
grant execute on function public.sq_comp_member(uuid,uuid,boolean),public.sq_comp_poll(uuid,bigint) to authenticated;
notify pgrst,'reload schema';
commit;
