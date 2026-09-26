-- SinfQuiz 7.0: Supabase SQL Editor oynasida bir marta RUN qiling.
create table if not exists public.documents (
  collection text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

alter table public.documents enable row level security;
alter table public.documents replica identity full;
grant select, insert, update, delete on public.documents to authenticated;

create or replace function public.sq_is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select lower(coalesce(auth.jwt()->>'email',''))='admin@sinfquiz.uz' $$;

create or replace function public.sq_role()
returns text language sql stable security definer set search_path=public
as $$ select data->>'role' from public.documents where collection='profiles' and id=auth.uid()::text limit 1 $$;

create or replace function public.sq_is_teacher()
returns boolean language sql stable security definer set search_path=public
as $$ select public.sq_is_admin() or public.sq_role() in ('teacher','admin') $$;

-- O‘quvchi jonli poygada faqat natija/racers holatini yangilaydi.
-- Ustoz, test manbasi va har ikki yo‘lak savollari mijozdan almashtirilmaydi.
create or replace function public.sq_protect_live_questions()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if old.collection='live'
     and not (public.sq_is_teacher() and old.data->>'ownerId'=auth.uid()::text) then
    if new.id is distinct from old.id
       or new.data->'ownerId' is distinct from old.data->'ownerId'
       or new.data->'sourceQuizId' is distinct from old.data->'sourceQuizId'
       or new.data->'sourcePin' is distinct from old.data->'sourcePin'
       or new.data->'title' is distinct from old.data->'title'
       or new.data->'active' is distinct from old.data->'active'
       or new.data->'questionsByLane' is distinct from old.data->'questionsByLane'
       or new.data->'questions' is distinct from old.data->'questions'
       or new.data->'questionCount' is distinct from old.data->'questionCount'
       or new.data->'createdAt' is distinct from old.data->'createdAt' then
      raise exception 'Poyga savollari va ustoz ma’lumotini o‘zgartirish mumkin emas';
    end if;
    if jsonb_array_length(coalesce(new.data->'racers','[]'::jsonb)) > 2 then
      raise exception 'Poygada ikki o‘quvchidan ortiq qatnasha olmaydi';
    end if;
  end if;
  return new;
end
$$;

-- O‘qituvchi yuborgan milliy test bo‘limini faqat admin ommaga tasdiqlaydi.
create or replace function public.sq_protect_national_approval()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if new.collection='nationalSections' and not public.sq_is_admin() then
    if new.data->>'ownerId' is distinct from auth.uid()::text then
      raise exception 'Bo‘lim faqat o‘z egasi nomidan saqlanadi';
    end if;
    if new.data->>'visibility'='public' or new.data->>'approvalStatus'='approved' then
      if tg_op='INSERT' then
        raise exception 'Ommaviy bo‘lim uchun administrator tasdig‘i kerak';
      elsif old.data->>'approvalStatus'<>'approved'
            or new.data->'questions' is distinct from old.data->'questions'
            or new.data->'title' is distinct from old.data->'title'
            or new.data->'subject' is distinct from old.data->'subject'
            or new.data->'description' is distinct from old.data->'description' then
        raise exception 'Ommaviy bo‘lim uchun administrator tasdig‘i kerak';
      end if;
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists sq_protect_live_questions_trigger on public.documents;
create trigger sq_protect_live_questions_trigger
before update on public.documents
for each row execute function public.sq_protect_live_questions();

drop trigger if exists sq_protect_national_approval_trigger on public.documents;
create trigger sq_protect_national_approval_trigger
before insert or update on public.documents
for each row execute function public.sq_protect_national_approval();

drop policy if exists "sq_select" on public.documents;
create policy "sq_select" on public.documents for select to authenticated using (
  case collection
    when 'profiles' then id=auth.uid()::text or public.sq_is_admin()
    when 'userActivity' then id=auth.uid()::text or public.sq_is_admin()
    when 'quizzes' then data->>'visibility'='public' or data->>'status'='active' or (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text)
    when 'lessons' then data->>'visibility'='public' or (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text)
    when 'nationalSections' then (data->>'visibility'='public' and data->>'approvalStatus'='approved') or data->>'ownerId'=auth.uid()::text or public.sq_is_admin()
    when 'nationalResults' then data->>'uid'=auth.uid()::text or data->>'ownerId'=auth.uid()::text or public.sq_is_admin()
    when 'players' then true
    when 'live' then true
    when 'settings' then true
    when 'typingResults' then data->>'uid'=auth.uid()::text or (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text)
    else false
  end
);

drop policy if exists "sq_insert" on public.documents;
create policy "sq_insert" on public.documents for insert to authenticated with check (
  case collection
    when 'profiles' then id=auth.uid()::text and ((data->>'role' in ('student','teacher')) or (public.sq_is_admin() and data->>'role'='admin'))
    when 'userActivity' then id=auth.uid()::text and data->>'uid'=auth.uid()::text
    when 'quizzes' then public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text
    when 'lessons' then public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text
    when 'nationalSections' then public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text
    when 'nationalResults' then data->>'uid'=auth.uid()::text
    when 'players' then data->>'uid'=auth.uid()::text
    when 'live' then public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text
    when 'settings' then public.sq_is_teacher()
    when 'typingResults' then data->>'uid'=auth.uid()::text and jsonb_array_length(coalesce(data->'stages','[]'::jsonb))=5
    else false
  end
);

drop policy if exists "sq_update" on public.documents;
create policy "sq_update" on public.documents for update to authenticated using (
  case collection
    when 'profiles' then id=auth.uid()::text
    when 'userActivity' then id=auth.uid()::text
    when 'quizzes' then public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text
    when 'lessons' then public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text
    when 'nationalSections' then (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text) or public.sq_is_admin()
    when 'players' then data->>'uid'=auth.uid()::text
    when 'live' then public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text or data->>'active'='true'
    when 'settings' then public.sq_is_teacher()
    when 'typingResults' then data->>'uid'=auth.uid()::text
    else false
  end
) with check (
  case collection
    when 'profiles' then id=auth.uid()::text and ((data->>'role'=public.sq_role()) or (public.sq_is_admin() and data->>'role'='admin'))
    when 'userActivity' then id=auth.uid()::text and data->>'uid'=auth.uid()::text
    when 'quizzes' then data->>'ownerId'=auth.uid()::text
    when 'lessons' then data->>'ownerId'=auth.uid()::text
    when 'nationalSections' then (data->>'ownerId'=auth.uid()::text) or public.sq_is_admin()
    when 'players' then data->>'uid'=auth.uid()::text
    when 'live' then public.sq_is_teacher() or (data->>'active'='true' and jsonb_array_length(coalesce(data->'racers','[]'::jsonb))<=2)
    when 'settings' then public.sq_is_teacher()
    when 'typingResults' then data->>'uid'=auth.uid()::text
    else false
  end
);

drop policy if exists "sq_delete" on public.documents;
create policy "sq_delete" on public.documents for delete to authenticated using (
  case collection
    when 'quizzes' then public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text
    when 'lessons' then public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text
    when 'nationalSections' then (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text) or public.sq_is_admin()
    when 'nationalResults' then data->>'uid'=auth.uid()::text or public.sq_is_admin()
    when 'players' then data->>'uid'=auth.uid()::text or (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text)
    when 'live' then public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text
    when 'typingResults' then public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text
    else false
  end
);

create index if not exists documents_owner_idx on public.documents (collection, ((data->>'ownerId')));
create index if not exists documents_pin_status_idx on public.documents (collection, ((data->>'pin')), ((data->>'status')));
create index if not exists documents_visibility_idx on public.documents (collection, ((data->>'visibility')));
create index if not exists documents_quiz_idx on public.documents (collection, ((data->>'quizId')));
create index if not exists documents_updated_idx on public.documents (collection, updated_at desc);

do $$ begin
  alter publication supabase_realtime add table public.documents;
exception when duplicate_object then null;
end $$;
