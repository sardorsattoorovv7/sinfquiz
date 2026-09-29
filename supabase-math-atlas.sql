-- SinfQuiz 7.12: SQL Editor'da bir marta ishga tushiring. Mavjud documents siyosatini o‘zgartirmaydi.
begin;
create table if not exists public.math_atlas_concepts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','pending','published')),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint math_atlas_data_valid check (
    jsonb_typeof(data)='object'
    and length(coalesce(data->>'title','')) between 4 and 100
    and length(coalesce(data->>'definition','')) between 12 and 500
    and length(coalesce(data->>'reason','')) between 12 and 600
    and length(coalesce(data->>'life','')) between 12 and 500
    and length(coalesce(data->>'challenge','')) between 12 and 500
    and length(coalesce(data->>'misconception','')) between 12 and 500
    and data->>'domain' in ('Algebra','Geometriya')
    and data->>'scene' in ('number','fraction','balance','linear','quadratic','coordinate','triangle','transform','power','sequence','expression','angle','line','square','rectangle','parallelogram','trapezoid','rhombus','polygon','circle','cube','cuboid','prism','pyramid','cylinder','cone','sphere')
    and (data->>'grade')::integer between 5 and 11
    and jsonb_typeof(coalesce(data->'parameters','{}'::jsonb))='object'
    and jsonb_typeof(coalesce(data->'prerequisites','[]'::jsonb))='array'
    and jsonb_array_length(coalesce(data->'prerequisites','[]'::jsonb))<=12
    and length(data::text)<12000
  )
);
create index if not exists math_atlas_visible_idx on public.math_atlas_concepts(status,updated_at desc);
create index if not exists math_atlas_owner_idx on public.math_atlas_concepts(owner_id,updated_at desc);
alter table public.math_atlas_concepts enable row level security;
grant select,insert,update,delete on public.math_atlas_concepts to authenticated;

create or replace function public.sq_guard_math_atlas()
returns trigger language plpgsql security invoker set search_path=public
as $$
begin
  if  (select count(*) from jsonb_object_keys(coalesce(new.data->'parameters','{}'::jsonb)))>20 then raise exception 'Sahna parametrlari soni juda katta'; end if;
  if exists(select 1 from jsonb_each(coalesce(new.data->'parameters','{}'::jsonb)) p where jsonb_typeof(p.value) not in ('number','boolean')) then raise exception 'Sahna parametri son yoki mantiqiy qiymat bo‘lishi kerak'; end if;
  if exists(select 1 from jsonb_each(coalesce(new.data->'parameters','{}'::jsonb)) p where jsonb_typeof(p.value)='number' and (p.value::text)::numeric not between -1000 and 1000) then raise exception 'Sahna parametri ruxsat etilgan chegaradan tashqarida'; end if;
  if tg_op='INSERT' then
    if new.owner_id is distinct from auth.uid() then raise exception 'Muallif identifikatori mos emas'; end if;
    if new.status='published' and not public.sq_is_admin() then raise exception 'E’lon uchun administrator tasdig‘i kerak'; end if;
  else
    if new.owner_id is distinct from old.owner_id or new.created_at is distinct from old.created_at then raise exception 'Muallif va yaratilgan sana o‘zgarmaydi'; end if;
    if old.owner_id is distinct from auth.uid() then
      if not public.sq_is_admin() or new.data is distinct from old.data or new.status not in ('published','draft') then raise exception 'Administrator faqat e’lon holatini ko‘rib chiqadi'; end if;
    elsif not public.sq_is_admin() and new.status='published' and (old.status is distinct from 'published' or new.data is distinct from old.data) then
      raise exception 'O‘zgartirilgan kontent qayta tasdiqlanishi kerak';
    end if;
  end if;
  new.updated_at=now();
  return new;
end $$;
drop trigger if exists sq_guard_math_atlas_trigger on public.math_atlas_concepts;
create trigger sq_guard_math_atlas_trigger before insert or update on public.math_atlas_concepts for each row execute function public.sq_guard_math_atlas();

drop policy if exists "math_atlas_read" on public.math_atlas_concepts;
create policy "math_atlas_read" on public.math_atlas_concepts for select to authenticated
using (status='published' or (public.sq_is_teacher() and owner_id=auth.uid()) or public.sq_is_admin());
drop policy if exists "math_atlas_insert" on public.math_atlas_concepts;
create policy "math_atlas_insert" on public.math_atlas_concepts for insert to authenticated
with check (public.sq_is_teacher() and owner_id=auth.uid() and (status in ('draft','pending') or public.sq_is_admin()));
drop policy if exists "math_atlas_update" on public.math_atlas_concepts;
create policy "math_atlas_update" on public.math_atlas_concepts for update to authenticated
using ((public.sq_is_teacher() and owner_id=auth.uid()) or public.sq_is_admin())
with check ((public.sq_is_teacher() and owner_id=auth.uid()) or public.sq_is_admin());
drop policy if exists "math_atlas_delete" on public.math_atlas_concepts;
create policy "math_atlas_delete" on public.math_atlas_concepts for delete to authenticated
using (public.sq_is_teacher() and owner_id=auth.uid());
commit;
