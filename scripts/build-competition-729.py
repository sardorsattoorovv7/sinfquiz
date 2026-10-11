"""Reproducible additive upgrade; historical migrations are never overwritten."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
def function(file, name):
    text = (root / file).read_text()
    start = text.index('create or replace function public.' + name + '(')
    end = text.index('$$;', start) + 3
    return text[start:end] + '\n'
def replace(text, old, new):
    assert old in text, old
    return text.replace(old, new)

header = '''-- SinfQuiz 7.29.0. Upgrade AFTER 7.28; repeatable, no Cron/secrets required.
begin;
alter table public.sq_competitions add column if not exists order_mode text not null default 'guided' check(order_mode in ('guided','free'));
alter table public.sq_comp_members add column if not exists selected_stage_id uuid references public.sq_comp_stages(id) on delete set null;
alter table public.sq_comp_attempts add column if not exists draft jsonb not null default '{}';
alter table public.sq_comp_attempts add column if not exists draft_version integer not null default 0;
alter table public.sq_comp_attempts add column if not exists draft_saved_at timestamptz;
alter table public.sq_comp_attempts add column if not exists finish_reason text;
create index if not exists sq_comp_open_deadlines on public.sq_comp_attempts(competition_id,started_at) where finished_at is null;
'''
grade = function('supabase-migration-7.28.sql', 'sq_comp_grade')
grade = replace(grade, "formula:=upper(regexp_replace(coalesce(sub->'cells'->>(item->>'cell'),''),'\\s','','g'));", "formula:=upper(regexp_replace(public.sq_excel_normalize(coalesce(sub->'cells'->>(item->>'cell'),'')),'\\s','','g'));")
grade = replace(grade, "ok:=left(formula,1)='=' and (not (item?'fn') or position((item->>'fn')||'(' in formula)>0) and not exists(select 1 from jsonb_array_elements_text(coalesce(item->'references','[]')) ref where position(ref in formula)=0)", "formula:=regexp_replace(formula,'\"([^\"]|\"\")*\"','\"\"','g');\n       ok:=left(formula,1)='=' and (not (item?'fn') or position((item->>'fn')||'(' in formula)>0) and not exists(select 1 from jsonb_array_elements_text(coalesce(item->'functions','[]')) fn where position(fn||'(' in formula)=0) and not exists(select 1 from jsonb_array_elements_text(coalesce(item->'references','[]')) ref where not exists(select 1 from regexp_matches(formula,'\\$?[A-D]\\$?[1-8]','g') token where token[1]=ref))")
grade = replace(grade, "elsif item->>'kind'='wordImage'", "elsif item->>'kind'='wordFormat' then ok:=sub->'titleFormat'->(item->>'field')=item->'value';\n      elsif item->>'kind'='wordTableCells' then ok:=not exists(select 1 from jsonb_array_elements(item->'cells') with ordinality r(v,i) cross join lateral jsonb_array_elements_text(r.v) with ordinality c(v,j) where public.sq_comp_norm(sub->'table'->((r.i-1)::int)->>((c.j-1)::int))<>public.sq_comp_norm(c.v));\n      elsif item->>'kind'='wordImage'")

save = function('supabase-migration-7.22.sql', 'sq_comp_save')
save = replace(save, ' begin\n', " begin\n  if coalesce(p_config->>'orderMode','guided') not in ('guided','free') then raise exception 'Bosqich tartibini tanlang';end if;\n")
save = replace(save, 'team_size,visibility) values(', 'team_size,visibility,order_mode) values(')
save = replace(save, "coalesce(p_config->>'visibility','public')) on conflict", "coalesce(p_config->>'visibility','public'),coalesce(p_config->>'orderMode','guided')) on conflict")
save = replace(save, 'visibility=excluded.visibility,updated_at=', 'visibility=excluded.visibility,order_mode=excluded.order_mode,updated_at=')

state = function('supabase-migration-7.24.sql', 'sq_comp_state')
state = replace(state, '  manager:=public.sq_comp_owner(p_id);', "  if c.status='running' then perform public.sq_comp_expire(p_id);select sig.revision into revision from public.sq_comp_signals sig where sig.competition_id=p_id;end if;\n  manager:=public.sq_comp_owner(p_id);")
state = replace(state, "'duration',x.duration,'weight',x.weight)", "'duration',x.duration,'weight',x.weight)||coalesce((select jsonb_build_object('startedAt',at.started_at,'deadline',case when c.order_mode='free' then at.started_at else c.stage_started_at end+make_interval(secs=>x.duration),'finished',at.finished_at is not null,'score',at.score,'finishReason',at.finish_reason) from public.sq_comp_attempts at where at.stage_id=x.id and at.user_id=auth.uid()),jsonb_build_object('finished',false))")
state = replace(state, "   select x.* into s from public.sq_comp_stages x where x.competition_id=p_id and x.position=c.current_stage;", "   select x.* into s from public.sq_comp_stages x where x.competition_id=p_id and ((c.order_mode='guided' and x.position=c.current_stage) or (c.order_mode='free' and x.id=m.selected_stage_id));\n   if s.id is not null then")
state = replace(state, "   deadline:=c.stage_started_at+make_interval(secs=>s.duration);", "   deadline:=c.stage_started_at+make_interval(secs=>s.duration);")
state = replace(state, "   if m.user_id is not null and not m.excluded then", "   if m.user_id is not null and not m.excluded then")
# Free attempts are created by select, never by merely viewing the room.
state = replace(state, "    insert into public.sq_comp_attempts", "    if c.order_mode='guided' then insert into public.sq_comp_attempts")
state = replace(state, "on conflict(stage_id,user_id) do nothing;", "on conflict(stage_id,user_id) do nothing;end if;")
state = replace(state, "    if a.finished_at is null and (clock_timestamp()>=deadline or m.withdrawn) then update public.sq_comp_attempts x set finished_at=least(clock_timestamp(),deadline),elapsed=greatest(0,extract(epoch from least(clock_timestamp(),deadline)-x.started_at)) where x.stage_id=s.id and x.user_id=auth.uid() returning x.* into a;perform public.sq_comp_tick(p_id);end if;", "    deadline:=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration);\n    current:=current||jsonb_build_object('deadline',deadline,'startedAt',a.started_at);\n    if a.finished_at is null and (clock_timestamp()>=deadline or m.withdrawn) then perform public.sq_comp_finalize(p_id,s.id,auth.uid(),case when m.withdrawn then 'withdrawn' else 'time' end);select x.* into a from public.sq_comp_attempts x where x.stage_id=s.id and x.user_id=auth.uid();end if;")
state = replace(state, "      question:=question-array['correct','answer','acceptedAnswers','officeRubric','criteria'];", "      question:=public.sq_safe_question(question);")
state = replace(state, "'feedback',a.feedback);", "'feedback',a.feedback,'draft',a.draft,'draftVersion',a.draft_version,'elapsed',a.elapsed,'savedAt',a.draft_saved_at,'finishReason',a.finish_reason);")
state = replace(state, "   end if;\n  end if;\n  select coalesce(jsonb_agg", "   end if;\n   end if;\n  end if;\n  select coalesce(jsonb_agg")
state = replace(state, "'finished',at.finished_at is not null)", "'finished',at.finished_at is not null,'finishReason',at.finish_reason)")
state = replace(state, "'feedback',at.feedback)", "'feedback',at.feedback,'finishReason',at.finish_reason,'startedAt',at.started_at,'deadline',case when c.order_mode='free' then at.started_at else c.stage_started_at end+make_interval(secs=>st.duration))")
state = replace(state, "'currentStage',c.current_stage)", "'currentStage',c.current_stage,'orderMode',c.order_mode)")

poll = '''create or replace function public.sq_comp_poll(p_id uuid,p_revision bigint default -1) returns jsonb language plpgsql security definer set search_path='' as $$
 declare revision bigint;expired boolean;
 begin
  if not public.sq_comp_read(p_id) then raise exception 'Musobaqa yopiq yoki sizga tegishli emas';end if;
  select sig.revision into revision from public.sq_comp_signals sig where sig.competition_id=p_id;
  select exists(select 1 from public.sq_comp_attempts a join public.sq_comp_stages s on s.id=a.stage_id join public.sq_competitions c on c.id=a.competition_id where c.id=p_id and c.status='running' and a.finished_at is null and clock_timestamp()>=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration)) into expired;
  if coalesce(revision,0)=p_revision and not expired then return jsonb_build_object('unchanged',true,'revision',coalesce(revision,0),'serverNow',clock_timestamp());end if;
  return public.sq_comp_state(p_id);
 end
$$;
'''

control = function('supabase-migration-7.24.sql', 'sq_comp_control')
control = replace(control, 'teams_ready integer;', 'teams_ready integer;row record;')
control = replace(control, "   if p_action='start' and members<>total then raise exception 'Barcha jamoalar to‘liq bo‘lgach musobaqa boshlanadi yoki hozirgi tarkib bilan boshlang';end if;", "   -- Both start actions accept the present roster. Freeze its size for fair averages.")
control = replace(control, "status='running',current_stage=1", "status='running',current_stage=case when c.order_mode='free' then 0 else 1 end")
control = replace(control, "  elsif p_action in ('next','force-next') then", """  elsif p_action in ('finish','force-finish') then
   if c.status='finished' then return public.sq_comp_state(p_id);end if;
   if c.status<>'running' or c.order_mode<>'free' then raise exception 'Bu musobaqada bosqichlarni navbat bilan yakunlang';end if;
   perform public.sq_comp_expire(p_id);
   if p_action='finish' and exists(select 1 from public.sq_comp_members mem cross join public.sq_comp_stages st left join public.sq_comp_attempts a on a.stage_id=st.id and a.user_id=mem.user_id where mem.competition_id=p_id and st.competition_id=p_id and not mem.excluded and not mem.withdrawn and a.finished_at is null) then raise exception 'Hali tugatilmagan bosqichlar bor. Kuting yoki hozir yakunlashni tanlang';end if;
   insert into public.sq_comp_attempts(competition_id,stage_id,user_id,started_at) select p_id,st.id,mem.user_id,clock_timestamp() from public.sq_comp_stages st cross join public.sq_comp_members mem where st.competition_id=p_id and mem.competition_id=p_id and not mem.excluded on conflict(stage_id,user_id) do nothing;
   for row in select a.stage_id,a.user_id from public.sq_comp_attempts a where a.competition_id=p_id and a.finished_at is null order by a.user_id,a.stage_id loop perform public.sq_comp_finalize(p_id,row.stage_id,row.user_id,'teacher');end loop;
   update public.sq_competitions x set status='finished',updated_at=clock_timestamp() where x.id=p_id;
  elsif p_action in ('next','force-next') then
   if c.order_mode='free' then raise exception 'Erkin tartibda har o‘quvchi bosqichni o‘zi tanlaydi';end if;""")
control = replace(control, "   update public.sq_comp_attempts a set finished_at=least(clock_timestamp(),deadline),elapsed=greatest(0,extract(epoch from least(clock_timestamp(),deadline)-a.started_at)) where a.stage_id=s.id and a.finished_at is null;", "   for row in select a.stage_id,a.user_id from public.sq_comp_attempts a where a.stage_id=s.id and a.finished_at is null order by a.user_id loop perform public.sq_comp_finalize(p_id,row.stage_id,row.user_id,case when clock_timestamp()>=deadline then 'time' else 'teacher' end);end loop;")
control = replace(control, "   update public.sq_competitions x set status='cancelled',updated_at=clock_timestamp() where x.id=p_id;", "   for row in select a.stage_id,a.user_id from public.sq_comp_attempts a where a.competition_id=p_id and a.finished_at is null order by a.user_id,a.stage_id loop perform public.sq_comp_finalize(p_id,row.stage_id,row.user_id,'cancel');end loop;\n   update public.sq_competitions x set status='cancelled',updated_at=clock_timestamp() where x.id=p_id;")

answer = function('supabase-migration-7.24.sql', 'sq_comp_answer')
answer = replace(answer, "if auth.uid() is null or length(p_data::text)>22000", "if auth.uid() is null or p_action is null or jsonb_typeof(p_data) is distinct from 'object' or length(p_data::text)>22000")
answer = replace(answer, "select x.* into s from public.sq_comp_stages x where x.competition_id=p_id and x.position=c.current_stage;", "select x.* into s from public.sq_comp_stages x where x.competition_id=p_id and x.id=p_stage and (c.order_mode='free' or x.position=c.current_stage);")
answer = replace(answer, 'if s.id<>p_stage or a.stage_id is null', 'if s.id is null or a.stage_id is null')
answer = replace(answer, 'deadline:=c.stage_started_at+make_interval(secs=>s.duration);', "deadline:=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration);")
answer = replace(answer, "if a.finished_at is not null or clock_timestamp()>=deadline then return public.sq_comp_state(p_id);end if;", "if a.finished_at is not null then return public.sq_comp_state(p_id);end if;\n  if clock_timestamp()>=deadline then perform public.sq_comp_finalize(p_id,p_stage,auth.uid(),'time');return public.sq_comp_state(p_id);end if;")
answer = replace(answer, "if p_data->>'mode'='finish' and s.kind<>'maze' then finished:=true;feedback:=jsonb_build_object('message','Bosqich yakunlandi. Javobsiz topshiriqlar uchun ball berilmadi.');", "if p_data->>'mode'='finish' and s.kind<>'maze' then perform public.sq_comp_finalize(p_id,p_stage,auth.uid(),'finish');return public.sq_comp_state(p_id);")
answer = replace(answer, "sum((x->>'points')::numeric) into maximum", "coalesce(sum((x->>'points')::numeric) filter(where x->>'type'<>'python'),0) into maximum")
answer = replace(answer, 'score:=round(100*points/greatest(maximum,1),2)', 'score:=round(least(100,100*points/greatest(maximum,1)),2)')
answer = replace(answer, "actions=x.actions||jsonb_build_object(submission.key,true)", "finish_reason=case when submission.finished then 'submit' else null end,draft=case when s.kind='maze' then x.draft else '{}'::jsonb end,draft_version=x.draft_version+case when s.kind='maze' then 0 else 1 end,actions=x.actions||jsonb_build_object(submission.key,true)")
answer = replace(answer, 'body:=public.sq_comp_state(p_id);perform public.sq_comp_tick(p_id);return body;', 'perform public.sq_comp_tick(p_id);return public.sq_comp_state(p_id);')

leave = function('supabase-migration-7.22.sql', 'sq_comp_leave')
leave = replace(leave, 'declare c public.sq_competitions;', 'declare c public.sq_competitions;row record;')
leave = replace(leave, "  elsif c.status='running' then update", "  elsif c.status='running' then for row in select a.stage_id,a.user_id from public.sq_comp_attempts a where a.competition_id=p_id and a.user_id=auth.uid() and a.finished_at is null order by a.stage_id loop perform public.sq_comp_finalize(p_id,row.stage_id,row.user_id,'withdrawn');end loop;update")

footer = '''
create or replace function public.sq_schema_status() returns jsonb language sql security definer set search_path='' as $$select jsonb_build_object('version','7.29.0','secureActivities',true,'competitionFreeOrder',true,'stageDraftGrading',true,'migration','supabase-migration-7.29.sql')$$;
revoke all on function public.sq_excel_normalize(text),public.sq_excel_truth(jsonb),public.sq_excel_number(jsonb),public.sq_comp_excel_value(jsonb,text,text[]),public.sq_excel_expr(text[],integer,integer,jsonb,text[],boolean,integer),public.sq_comp_finalize(uuid,uuid,uuid,text),public.sq_comp_expire(uuid) from public,anon,authenticated;
revoke all on function public.sq_comp_select(uuid,uuid),public.sq_comp_draft(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.sq_comp_select(uuid,uuid),public.sq_comp_draft(uuid,uuid,uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
'''
parts = [header,(root/'data/competition-729/excel.sql').read_text(),grade,save,
         (root/'data/competition-729/core.sql').read_text(),state,poll,control,answer,leave,
         (root/'data/competition-729/templates.sql').read_text(),footer]
out = root/'supabase-migration-7.29.sql'
out.write_text('\n\n'.join(parts))
assert out.stat().st_size < 150_000
print('7.29 upgrade:',out.stat().st_size,'bytes')
