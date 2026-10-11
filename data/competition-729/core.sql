-- Finalize only data received before the server deadline. Score/time are never client inputs.
create or replace function public.sq_comp_finalize(p_id uuid,p_stage uuid,p_user uuid,p_reason text) returns void language plpgsql set search_path='' as $$
 <<finalize>>
 declare c public.sq_competitions;s public.sq_comp_stages;a public.sq_comp_attempts;q jsonb;g jsonb;deadline timestamptz;stop_at timestamptz;spent numeric;maximum numeric;points numeric;score numeric;correct integer;feedback jsonb;chars integer;wpm numeric;accuracy numeric;response jsonb;
 begin
  select x.* into c from public.sq_competitions x where x.id=p_id;
  select x.* into s from public.sq_comp_stages x where x.id=p_stage and x.competition_id=p_id;
  select x.* into a from public.sq_comp_attempts x where x.competition_id=p_id and x.stage_id=p_stage and x.user_id=p_user for update;
  if a.stage_id is null or a.finished_at is not null then return;end if;
  deadline:=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration);
  stop_at:=least(clock_timestamp(),deadline);spent:=greatest(0,extract(epoch from stop_at-a.started_at));points:=a.points;score:=a.score;correct:=a.correct;
  feedback:=jsonb_build_object('message',case p_reason when 'time' then 'Vaqt tugadi. Serverga saqlangan ish baholandi; bajarilmagan qism uchun ball berilmadi.' when 'teacher' then 'Ustoz bosqichni yopdi. Saqlangan ish baholandi.' when 'cancel' then 'Musobaqa to‘xtatildi. Saqlangan ish baholandi.' else 'Bosqich yakunlandi. Bajarilgan ish hisobga olindi.' end);
  if s.kind='quiz' then
   q:=s.data->'questions'->a.cursor;
   if q is not null and a.draft->>'questionId'=q->>'id' and a.draft?'answer' then
    g:=public.sq_comp_grade(q,a.draft->'answer');points:=points+(q->>'points')::numeric*(g->>'ratio')::numeric;
    correct:=correct+case when (g->>'ratio')::numeric=1 then 1 else 0 end;
    feedback:=feedback||g||jsonb_build_object('explanation',coalesce(q->>'explanation',''),'correctAnswer',case when q->>'type'='test' then q->'options'->>((q->>'correct')::integer) when q->>'type' in ('practical','shortcut') then q->>'answer' else null end);
    response:=jsonb_build_object('questionId',q->>'id','answer',a.draft->'answer','ratio',g->'ratio','fromDraft',true);
   end if;
   select coalesce(sum((x->>'points')::numeric) filter(where x->>'type'<>'python'),0) into maximum from jsonb_array_elements(s.data->'questions') x;
   score:=round(least(100,greatest(0,100*points/greatest(maximum,1))),2);
  elsif s.kind='typing' then
   g:=public.sq_comp_typing(s.data->>'text',coalesce(a.draft->>'text',a.payload->>'text',''));chars:=(g->>'correct')::integer;accuracy:=(g->>'accuracy')::numeric;wpm:=chars*12/greatest(spent,1);
   score:=round(least(100,greatest(0,accuracy*(.75+.25*least(wpm/75,1)))),2);correct:=chars;
   feedback:=feedback||jsonb_build_object('accuracy',round(accuracy,1),'wpm',round(wpm,1),'correctChars',chars,'expectedChars',length(s.data->>'text'),'editDistance',g->'distance','method',g->'method');
  end if;
  update public.sq_comp_attempts x set score=finalize.score,points=finalize.points,correct=finalize.correct,elapsed=spent,finished_at=stop_at,finish_reason=p_reason,feedback=finalize.feedback,
   payload=case when response is not null then x.payload||jsonb_build_object('responses',coalesce(x.payload->'responses','[]')||jsonb_build_array(response)) when s.kind='typing' then jsonb_build_object('text',coalesce(x.draft->>'text',x.payload->>'text','')) else x.payload end,
   draft='{}',draft_version=x.draft_version+1 where x.stage_id=p_stage and x.user_id=p_user;
  perform public.sq_comp_tick(p_id);
 end
$$;
create or replace function public.sq_comp_expire(p_id uuid) returns void language plpgsql set search_path='' as $$
 declare row record;
 begin
  for row in select a.stage_id,a.user_id from public.sq_comp_attempts a join public.sq_comp_stages s on s.id=a.stage_id join public.sq_competitions c on c.id=a.competition_id
   where a.competition_id=p_id and c.status='running' and a.finished_at is null and clock_timestamp()>=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration)
   order by a.user_id,a.stage_id loop perform public.sq_comp_finalize(p_id,row.stage_id,row.user_id,'time');end loop;
 end
$$;
create or replace function public.sq_comp_select(p_id uuid,p_stage uuid) returns jsonb language plpgsql security definer set search_path='' as $$
 declare c public.sq_competitions;m public.sq_comp_members;s public.sq_comp_stages;started timestamptz:=clock_timestamp();
 begin
  select x.* into c from public.sq_competitions x where x.id=p_id for share;
  select x.* into m from public.sq_comp_members x where x.competition_id=p_id and x.user_id=auth.uid() for update;
  if auth.uid() is null or m.user_id is null or m.withdrawn or m.excluded or c.status is distinct from 'running' then raise exception 'Siz faol musobaqada qatnashmayapsiz';end if;
  if c.order_mode<>'free' then raise exception 'Bu musobaqada bosqichlarni ustoz navbat bilan ochadi';end if;
  if not public.sq_comp_limit('select-stage',60) then return jsonb_build_object('error','Bosqichlar juda tez almashtirildi. Biroz kuting.');end if;
  select x.* into s from public.sq_comp_stages x where x.id=p_stage and x.competition_id=p_id;
  if s.id is null then raise exception 'Bu bosqich musobaqaga tegishli emas';end if;
  insert into public.sq_comp_attempts(competition_id,stage_id,user_id,started_at,payload)
   values(p_id,s.id,auth.uid(),started,case when s.kind='maze' then jsonb_build_object('position',s.data->'start','opened','[]'::jsonb,'mistakes','{}'::jsonb,'hints','{}'::jsonb) else '{}' end)
   on conflict(stage_id,user_id) do nothing;
  update public.sq_comp_members x set selected_stage_id=s.id where x.competition_id=p_id and x.user_id=auth.uid();
  perform public.sq_comp_tick(p_id);return public.sq_comp_state(p_id);
 end
$$;
create or replace function public.sq_comp_draft(p_id uuid,p_stage uuid,p_action uuid,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 <<draft_save>>
 declare c public.sq_competitions;m public.sq_comp_members;s public.sq_comp_stages;a public.sq_comp_attempts;deadline timestamptz;q jsonb;draft jsonb;version integer;
 begin
  if auth.uid() is null or p_action is null or jsonb_typeof(p_data) is distinct from 'object' or length(p_data::text)>22000 then raise exception 'Qoralama formati noto‘g‘ri';end if;
  select x.* into c from public.sq_competitions x where x.id=p_id for share;
  select x.* into m from public.sq_comp_members x where x.competition_id=p_id and x.user_id=auth.uid();
  if c.status is distinct from 'running' or m.user_id is null or m.excluded or m.withdrawn then raise exception 'Siz faol musobaqada qatnashmayapsiz';end if;
  select x.* into s from public.sq_comp_stages x where x.id=p_stage and x.competition_id=p_id;
  select x.* into a from public.sq_comp_attempts x where x.stage_id=p_stage and x.user_id=auth.uid() for update;
  if s.id is null or a.stage_id is null or (c.order_mode='guided' and s.position<>c.current_stage) then raise exception 'Bosqichni avval oching';end if;
  deadline:=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration);
  if a.finished_at is not null or clock_timestamp()>=deadline then perform public.sq_comp_expire(p_id);return jsonb_build_object('closed',true,'draftVersion',a.draft_version);end if;
  if a.actions?('draft:'||p_action::text) then return jsonb_build_object('saved',true,'draftVersion',a.draft_version,'savedAt',a.draft_saved_at);end if;
  if not public.sq_comp_limit('draft',40) then return jsonb_build_object('error','Qoralama juda tez yuborildi. Biroz kuting.');end if;
  if s.kind='quiz' then
   q:=s.data->'questions'->a.cursor;
   if q is null or q->>'id' is distinct from p_data->>'questionId' then return jsonb_build_object('stale',true,'draftVersion',a.draft_version);end if;
   draft:=jsonb_build_object('questionId',q->>'id','answer',coalesce(p_data->'answer','null'::jsonb));
  elsif s.kind='typing' then
   if jsonb_typeof(p_data->'text') is distinct from 'string' or length(p_data->>'text')>8000 then raise exception 'Typing matni juda uzun yoki noto‘g‘ri';end if;
   draft:=jsonb_build_object('text',p_data->>'text');
  else return jsonb_build_object('saved',true,'draftVersion',a.draft_version);end if;
  update public.sq_comp_attempts x set draft=draft_save.draft,draft_version=x.draft_version+1,draft_saved_at=clock_timestamp(),actions=x.actions||jsonb_build_object('draft:'||p_action::text,true)
   where x.stage_id=p_stage and x.user_id=auth.uid() returning x.draft_version into version;
  -- Draft saves don't broadcast the full room. Grading/select/finish do.
  return jsonb_build_object('saved',true,'draftVersion',version,'savedAt',clock_timestamp());
 end
$$;
