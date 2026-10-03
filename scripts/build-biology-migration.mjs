// Run only when canonical control specifications change; SQL is shipped ready to RUN.
import {biologyScenes} from '../src/biology-content.js';import {writeFileSync} from 'node:fs';
const spec=Object.fromEntries(Object.entries(biologyScenes).map(([id,s])=>[id,Object.fromEntries(s.controls.map(c=>[c.key,c.type==='enum'?{type:'enum',values:c.options.map(o=>o[0])}:{type:'number',min:c.min,max:c.max,step:c.step}]))]));
writeFileSync(new URL('../supabase-biology-atlas.sql',import.meta.url),`-- SinfQuiz 7.18. Run after existing supabase-schema.sql and role helpers.
-- Adds biology only. No cron dependency or changes to existing subject policies.
begin;
create or replace function public.sq_biology_parameters_valid(scene text,params jsonb,complete boolean default false)
returns boolean language plpgsql immutable set search_path=public as $$
declare spec jsonb:='${JSON.stringify(spec)}'::jsonb; pair record; rule jsonb; v numeric;
begin
 if jsonb_typeof(params) is distinct from 'object' or not(spec ? scene) then return false; end if;
 if complete and (select count(*) from jsonb_object_keys(params))<>(select count(*) from jsonb_object_keys(spec->scene)) then return false; end if;
 for pair in select * from jsonb_each(params) loop
  rule:=spec->scene->pair.key;
  if rule is null then return false; end if;
  if rule->>'type'='enum' then
   if jsonb_typeof(pair.value)<>'string' or not((rule->'values') ? (pair.value#>>'{}')) then return false; end if;
  else
   if jsonb_typeof(pair.value)<>'number' then return false; end if;
   v:=(pair.value::text)::numeric;
   if v<(rule->>'min')::numeric or v>(rule->>'max')::numeric or mod(v-(rule->>'min')::numeric,(rule->>'step')::numeric)<>0 then return false; end if;
  end if;
 end loop;return true;
end $$;
create table if not exists public.biology_concepts(
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'draft' check(status in ('draft','pending','published')), active boolean not null default true,
 data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint biology_content_valid check(
 jsonb_typeof(data)='object' and length(data::text)<18000
 and data ?& array['title','question','definition','reason','life','misconception','challenge','group','grade','scene']
 and length(btrim(coalesce(data->>'title',''))) between 4 and 100
 and length(btrim(coalesce(data->>'question',''))) between 12 and 300
 and length(btrim(coalesce(data->>'definition',''))) between 12 and 700
 and length(btrim(coalesce(data->>'reason',''))) between 12 and 700
 and length(btrim(coalesce(data->>'life',''))) between 12 and 700
 and length(btrim(coalesce(data->>'misconception',''))) between 12 and 700
 and length(btrim(coalesce(data->>'challenge',''))) between 12 and 700
 and data->>'group' in ('Botanika','Zoologiya','Odam tanasi','Ekologiya')
 and jsonb_typeof(data->'grade')='number' and (data->>'grade')::numeric between 5 and 11 and trunc((data->>'grade')::numeric)=(data->>'grade')::numeric
 and public.sq_biology_parameters_valid(coalesce(data->>'scene',''),coalesce(data->'parameters','{}'::jsonb))
 ));
create index if not exists biology_concept_owner_idx on public.biology_concepts(owner_id,updated_at desc);
create index if not exists biology_concept_visible_idx on public.biology_concepts(status,active,updated_at desc);
create or replace function public.sq_guard_biology_concept()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if tg_op='INSERT' then
  if new.owner_id is distinct from auth.uid() then raise exception 'Muallif mos emas'; end if;
  if new.status='published' and not public.sq_is_admin() then raise exception 'Admin tasdigi kerak'; end if;
  new.created_at:=now();
 else
  if new.owner_id is distinct from old.owner_id or new.created_at is distinct from old.created_at then raise exception 'Muallif ozgarmaydi'; end if;
  if old.owner_id is distinct from auth.uid() then
   if not public.sq_is_admin() or new.data is distinct from old.data or new.active is distinct from old.active or new.status not in ('published','draft') then raise exception 'Admin faqat tasdiqlash holatini ozgartiradi'; end if;
  elsif not public.sq_is_admin() and new.status='published' and (old.status<>'published' or new.data is distinct from old.data) then raise exception 'Izoh qayta tasdiqlanishi kerak'; end if;
 end if;new.updated_at:=now();return new;
end $$;
drop trigger if exists biology_concept_guard on public.biology_concepts;
create trigger biology_concept_guard before insert or update on public.biology_concepts for each row execute function public.sq_guard_biology_concept();
alter table public.biology_concepts enable row level security;
grant select,insert,update,delete on public.biology_concepts to authenticated;
drop policy if exists biology_read on public.biology_concepts;
create policy biology_read on public.biology_concepts for select to authenticated using((status='published' and active) or (public.sq_is_teacher() and owner_id=auth.uid()) or public.sq_is_admin());
drop policy if exists biology_insert on public.biology_concepts;
create policy biology_insert on public.biology_concepts for insert to authenticated with check(public.sq_is_teacher() and owner_id=auth.uid());
drop policy if exists biology_update on public.biology_concepts;
create policy biology_update on public.biology_concepts for update to authenticated using((public.sq_is_teacher() and owner_id=auth.uid()) or public.sq_is_admin()) with check((public.sq_is_teacher() and owner_id=auth.uid()) or public.sq_is_admin());
drop policy if exists biology_delete on public.biology_concepts;
create policy biology_delete on public.biology_concepts for delete to authenticated using(public.sq_is_teacher() and owner_id=auth.uid());
create table if not exists public.biology_observations(
 id uuid primary key default gen_random_uuid(),concept_id uuid not null references public.biology_concepts(id) on delete cascade,
 student_id uuid not null references auth.users(id) on delete cascade,student_name text not null default 'Oquvchi' check(length(btrim(student_name)) between 1 and 80),
 prediction text not null check(length(btrim(prediction)) between 12 and 500),observation text not null check(length(btrim(observation)) between 20 and 1200),conclusion text not null check(length(btrim(conclusion)) between 20 and 1200),
 trials jsonb not null check(jsonb_typeof(trials)='array' and jsonb_array_length(trials) between 1 and 6 and length(trials::text)<12000),
 client_token uuid not null,scene_id text not null default '',topic_title text not null default '',feedback text not null default '' check(length(feedback)<=1200),reviewed_at timestamptz,created_at timestamptz not null default now(),unique(student_id,client_token)
);
create index if not exists biology_observation_student_idx on public.biology_observations(student_id,created_at desc);
create index if not exists biology_observation_concept_idx on public.biology_observations(concept_id,created_at desc);
create or replace function public.sq_guard_biology_observation()
returns trigger language plpgsql security invoker set search_path=public as $$
declare lesson public.biology_concepts; trial jsonb; distinct_trials integer; required integer;
begin
 if tg_op='UPDATE' then
  if (to_jsonb(new)-array['feedback','reviewed_at']) is distinct from (to_jsonb(old)-array['feedback','reviewed_at']) then raise exception 'Faqat ustoz fikri ozgaradi'; end if;
  if length(btrim(new.feedback)) not between 5 and 1200 then raise exception 'Fikr 5-1200 belgi bolsin'; end if;
  new.reviewed_at:=now();return new;
 end if;
 if new.student_id is distinct from auth.uid() then raise exception 'Oquvchi mos emas'; end if;
 select * into lesson from public.biology_concepts c where c.id=new.concept_id and c.status='published' and c.active;
 if not found then raise exception 'Amaliy ish faol emas'; end if;
 if jsonb_typeof(new.trials) is distinct from 'array' then raise exception 'Sinov royxati kerak'; end if;
 for trial in select value from jsonb_array_elements(new.trials) loop
  if jsonb_typeof(trial) is distinct from 'object' or not public.sq_biology_parameters_valid(lesson.data->>'scene',trial->'parameters',true)
  or jsonb_typeof(trial->'date') is distinct from 'string' or length(trial->>'date')>50 then raise exception 'Sinov parametri notogri'; end if;
 end loop;
 select count(distinct value->'parameters') into distinct_trials from jsonb_array_elements(new.trials);
 required:=case when lesson.data->>'scene' in ('leaf','soil','compost','seed','growth','photosynthesis','pollination','adaptation','foodchain') then 2 else 1 end;
 if distinct_trials<required then raise exception 'Turli sharoitlarni solishtiring'; end if;
 new.scene_id:=lesson.data->>'scene';new.topic_title:=lesson.data->>'title';new.feedback:='';new.reviewed_at:=null;new.created_at:=now();return new;
end $$;
drop trigger if exists biology_observation_guard on public.biology_observations;
create trigger biology_observation_guard before insert or update on public.biology_observations for each row execute function public.sq_guard_biology_observation();
alter table public.biology_observations enable row level security;
grant select,insert,update on public.biology_observations to authenticated;
drop policy if exists biology_observation_read on public.biology_observations;
create policy biology_observation_read on public.biology_observations for select to authenticated using(student_id=auth.uid() or public.sq_is_admin() or (public.sq_is_teacher() and exists(select 1 from public.biology_concepts c where c.id=concept_id and c.owner_id=auth.uid())));
drop policy if exists biology_observation_insert on public.biology_observations;
create policy biology_observation_insert on public.biology_observations for insert to authenticated with check(student_id=auth.uid() and exists(select 1 from public.biology_concepts c where c.id=concept_id and c.status='published' and c.active));
drop policy if exists biology_observation_feedback on public.biology_observations;
create policy biology_observation_feedback on public.biology_observations for update to authenticated using(public.sq_is_admin() or (public.sq_is_teacher() and exists(select 1 from public.biology_concepts c where c.id=concept_id and c.owner_id=auth.uid()))) with check(public.sq_is_admin() or (public.sq_is_teacher() and exists(select 1 from public.biology_concepts c where c.id=concept_id and c.owner_id=auth.uid())));
commit;
`);
