-- SinfQuiz 7.16. Run AFTER the existing supabase-schema.sql migrations.
-- Existing documents, auth, math, quiz and audio-maze policies are unchanged.
begin;
create table if not exists public.chemistry_concepts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'draft' check(status in ('draft','pending','published')),
 active boolean not null default true,
 data jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint chemistry_content_valid check (
 jsonb_typeof(data)='object' and length(data::text)<16000
 and data ?& array['title','scene','grade','definition','reason','life','misconception','challenge','feedback','answer']
 and length(coalesce(data->>'title','')) between 4 and 100
 and data->>'scene' in ('atom','periodic','molecule','bonds','states','reaction','ph','rate','mixture','organic','electric','life')
 and (data->>'grade')::integer between 5 and 11
 and length(coalesce(data->>'definition','')) between 12 and 700
 and length(coalesce(data->>'reason','')) between 12 and 700
 and length(coalesce(data->>'life','')) between 12 and 700
 and length(coalesce(data->>'misconception','')) between 12 and 700
 and length(coalesce(data->>'challenge','')) between 12 and 500
 and length(coalesce(data->>'feedback','')) between 12 and 500
 and jsonb_typeof(data->'answer')='number' and (data->>'answer')::numeric between -1000 and 1000
 and jsonb_typeof(coalesce(data->'parameters','{}'::jsonb))='object'
 ));
create index if not exists chemistry_concept_owner_idx on public.chemistry_concepts(owner_id,updated_at desc);
create index if not exists chemistry_concept_visible_idx on public.chemistry_concepts(status,active);
create or replace function public.sq_guard_chemistry_concept()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if (select count(*) from jsonb_object_keys(coalesce(new.data->'parameters','{}'::jsonb)))>8 then raise exception 'Parametrlar ko‘p'; end if;
 if exists(select 1 from jsonb_each(coalesce(new.data->'parameters','{}'::jsonb)) p where p.key not in ('protons','neutrons','electrons','temperature','acid','base') or jsonb_typeof(p.value)<>'number' or (p.value::text)::numeric not between -20 and 120) then raise exception 'Parametr noto‘g‘ri'; end if;
 if exists(select 1 from jsonb_each(coalesce(new.data->'parameters','{}'::jsonb)) p where (p.key='protons' and ((p.value::text)::numeric not between 1 and 20 or trunc((p.value::text)::numeric)<>(p.value::text)::numeric)) or (p.key in ('neutrons','electrons') and ((p.value::text)::numeric<0 or (p.value::text)::numeric>case when p.key='neutrons' then 35 else 20 end or trunc((p.value::text)::numeric)<>(p.value::text)::numeric)) or (p.key in ('acid','base') and (p.value::text)::numeric not between 0 and 10) or (p.key='temperature' and new.data->>'scene'='rate' and (p.value::text)::numeric not between 5 and 65)) then raise exception 'Parametr sahna chegarasiga mos emas'; end if;
 if tg_op='INSERT' then
  if new.owner_id is distinct from auth.uid() then raise exception 'Muallif mos emas'; end if;
  if new.status='published' and not public.sq_is_admin() then raise exception 'Admin tasdig‘i kerak'; end if;
 else
  if new.owner_id is distinct from old.owner_id or new.created_at is distinct from old.created_at then raise exception 'Muallif o‘zgarmaydi'; end if;
  if old.owner_id is distinct from auth.uid() then
   if not public.sq_is_admin() or new.data is distinct from old.data or new.active is distinct from old.active or new.status not in ('published','draft') then raise exception 'Admin faqat tasdiqlash holatini o‘zgartiradi'; end if;
  elsif not public.sq_is_admin() and new.status='published' and (old.status<>'published' or new.data is distinct from old.data) then raise exception 'O‘zgargan izoh qayta tasdiqlanishi kerak'; end if;
 end if;
 new.updated_at=now();return new;
end $$;
drop trigger if exists chemistry_concept_guard on public.chemistry_concepts;
create trigger chemistry_concept_guard before insert or update on public.chemistry_concepts for each row execute function public.sq_guard_chemistry_concept();
alter table public.chemistry_concepts enable row level security;
grant select,insert,update,delete on public.chemistry_concepts to authenticated;
drop policy if exists chemistry_read on public.chemistry_concepts;
create policy chemistry_read on public.chemistry_concepts for select to authenticated using ((status='published' and active) or (public.sq_is_teacher() and owner_id=auth.uid()) or public.sq_is_admin());
drop policy if exists chemistry_insert on public.chemistry_concepts;
create policy chemistry_insert on public.chemistry_concepts for insert to authenticated with check (public.sq_is_teacher() and owner_id=auth.uid());
drop policy if exists chemistry_update on public.chemistry_concepts;
create policy chemistry_update on public.chemistry_concepts for update to authenticated using ((public.sq_is_teacher() and owner_id=auth.uid()) or public.sq_is_admin()) with check ((public.sq_is_teacher() and owner_id=auth.uid()) or public.sq_is_admin());
drop policy if exists chemistry_delete on public.chemistry_concepts;
create policy chemistry_delete on public.chemistry_concepts for delete to authenticated using (public.sq_is_teacher() and owner_id=auth.uid());
create table if not exists public.chemistry_observations (
 id uuid primary key default gen_random_uuid(),
 concept_id uuid not null references public.chemistry_concepts(id) on delete cascade,
 student_id uuid not null references auth.users(id) on delete cascade,
 student_name text not null default 'O‘quvchi' check(length(student_name) between 1 and 80),
 prediction numeric not null check(prediction between -1000 and 1000),
 is_correct boolean not null default false,
 observation text not null default '' check(length(observation)<=1500),
 created_at timestamptz not null default now()
);
create index if not exists chemistry_observation_student_idx on public.chemistry_observations(student_id,created_at desc);
create index if not exists chemistry_observation_concept_idx on public.chemistry_observations(concept_id,created_at desc);
create or replace function public.sq_guard_chemistry_observation()
returns trigger language plpgsql security invoker set search_path=public as $$
declare lesson public.chemistry_concepts;
begin
 if new.student_id is distinct from auth.uid() then raise exception 'O‘quvchi mos emas'; end if;
 select * into lesson from public.chemistry_concepts where id=new.concept_id and status='published' and active;
 if not found then raise exception 'Sahna faol emas'; end if;
 new.is_correct=abs(new.prediction-(lesson.data->>'answer')::numeric)<0.0001;
 new.created_at=now();return new;
end $$;
drop trigger if exists chemistry_observation_guard on public.chemistry_observations;
create trigger chemistry_observation_guard before insert on public.chemistry_observations for each row execute function public.sq_guard_chemistry_observation();
alter table public.chemistry_observations enable row level security;
grant select,insert on public.chemistry_observations to authenticated;
drop policy if exists chemistry_observation_read on public.chemistry_observations;
create policy chemistry_observation_read on public.chemistry_observations for select to authenticated using (student_id=auth.uid() or public.sq_is_admin() or (public.sq_is_teacher() and exists(select 1 from public.chemistry_concepts c where c.id=concept_id and c.owner_id=auth.uid())));
drop policy if exists chemistry_observation_insert on public.chemistry_observations;
create policy chemistry_observation_insert on public.chemistry_observations for insert to authenticated with check (student_id=auth.uid() and exists(select 1 from public.chemistry_concepts c where c.id=concept_id and c.status='published' and c.active));
commit;
