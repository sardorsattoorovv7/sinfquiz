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

-- SinfQuiz 7.6: ustoz natijalarini ajratish va testga xos ixcham jonli reyting.
-- SQL Editor'da mavjud supabase-schema.sql dan keyin bir marta RUN qiling.
begin;

create index if not exists documents_players_quiz_idx
  on public.documents ((data->>'quizId')) where collection='players';

create or replace function public.sq_can_view_leaderboard(p_quiz text)
returns boolean language sql stable security definer set search_path=public as $$
  select auth.uid() is not null and (
    exists(select 1 from public.documents q where q.collection='quizzes' and q.id=p_quiz
      and q.data->>'ownerId'=auth.uid()::text and public.sq_is_teacher())
    or exists(select 1 from public.documents p where p.collection='players'
      and p.data->>'quizId'=p_quiz and p.data->>'uid'=auth.uid()::text)
  )
$$;

-- O‘quvchi boshqa ustozning testini yoki natija egasini ko‘rsatib yoza olmaydi.
create or replace function public.sq_guard_player()
returns trigger language plpgsql security definer set search_path=public as $$
declare actual_owner text;
begin
  if tg_op='UPDATE' and old.collection='players' and new.collection<>'players' then
    raise exception 'Natija turini almashtirish mumkin emas' using errcode='42501';
  end if;
  if new.collection<>'players' then return new; end if;
  if auth.uid() is null or new.data->>'uid' is distinct from auth.uid()::text
     or new.data->>'id' is distinct from new.id then
    raise exception 'Natija faqat o‘z hisobingiz nomidan saqlanadi' using errcode='42501';
  end if;
  select q.data->>'ownerId' into actual_owner from public.documents q
    where q.collection='quizzes' and q.id=new.data->>'quizId';
  if actual_owner is null or new.data->>'ownerId' is distinct from actual_owner then
    raise exception 'Natija faqat shu test egasiga tegishli' using errcode='42501';
  end if;
  if tg_op='UPDATE' and (
     new.collection is distinct from old.collection or new.id is distinct from old.id
     or new.data->>'uid' is distinct from old.data->>'uid'
     or new.data->>'quizId' is distinct from old.data->>'quizId'
     or new.data->>'ownerId' is distinct from old.data->>'ownerId'
  ) then raise exception 'Natija egasini almashtirish mumkin emas' using errcode='42501'; end if;
  if jsonb_typeof(new.data->'score') is distinct from 'number'
     or jsonb_typeof(new.data->'correct') is distinct from 'number'
     or jsonb_typeof(new.data->'answers') is distinct from 'number'
     or coalesce(length(new.data->>'name'),0) not between 1 and 80 then
    raise exception 'Natija ma’lumotlari noto‘g‘ri' using errcode='22023';
  end if;
  return new;
end $$;

drop trigger if exists sq_guard_player_trigger on public.documents;
create trigger sq_guard_player_trigger before insert or update on public.documents
  for each row execute function public.sq_guard_player();

-- Barcha qatorlar serverda yig‘iladi. Mijoz reytingni o‘zi yozolmaydi.
create or replace function public.sq_refresh_leaderboard()
returns trigger language plpgsql security definer set search_path=public as $$
declare target_quiz text;
begin
  if tg_op='DELETE' and old.collection='quizzes' then
    delete from public.documents where collection='leaderboards' and id=old.id;
    return old;
  end if;
  if tg_op='DELETE' and old.collection<>'players' then return old; end if;
  if tg_op<>'DELETE' and new.collection<>'players' then return new; end if;
  if tg_op='DELETE' then target_quiz:=old.data->>'quizId';
  else target_quiz:=new.data->>'quizId'; end if;

  if target_quiz is not null then
    insert into public.documents(collection,id,data,updated_at)
    select 'leaderboards',target_quiz,
      jsonb_build_object('quizId',target_quiz,'rows',coalesce(jsonb_agg(
        jsonb_build_object('id',p.id,'name',p.data->>'name','avatar',p.data->>'avatar',
          'score',coalesce((p.data->>'score')::numeric,0),
          'correct',coalesce((p.data->>'correct')::int,0),
          'answers',coalesce((p.data->>'answers')::int,0),
          'startedAt',p.data->'startedAt','finishedAt',p.data->'finishedAt')
        order by coalesce((p.data->>'score')::numeric,0) desc,
          (p.data->>'finishedAt')::bigint nulls last,
          (p.data->>'startedAt')::bigint), '[]'::jsonb)),now()
    from public.documents p where p.collection='players' and p.data->>'quizId'=target_quiz
    on conflict(collection,id) do update set data=excluded.data,updated_at=excluded.updated_at;
  end if;

  if tg_op='UPDATE' and old.data->>'quizId' is distinct from new.data->>'quizId' then
    raise exception 'Test natijasining egasini almashtirish mumkin emas';
  end if;
  return coalesce(new,old);
end $$;

drop trigger if exists sq_refresh_leaderboard_trigger on public.documents;
create trigger sq_refresh_leaderboard_trigger after insert or update or delete on public.documents
  for each row
  execute function public.sq_refresh_leaderboard();

-- Eski o‘yinlar ham yangi reyting hujjatiga ko‘chadi.
insert into public.documents(collection,id,data,updated_at)
select 'leaderboards',q.id,
  jsonb_build_object('quizId',q.id,'rows',coalesce((
    select jsonb_agg(jsonb_build_object('id',p.id,'name',p.data->>'name','avatar',p.data->>'avatar',
      'score',coalesce((p.data->>'score')::numeric,0),
      'correct',coalesce((p.data->>'correct')::int,0),
      'answers',coalesce((p.data->>'answers')::int,0),
      'startedAt',p.data->'startedAt','finishedAt',p.data->'finishedAt')
      order by coalesce((p.data->>'score')::numeric,0) desc,
        (p.data->>'finishedAt')::bigint nulls last,(p.data->>'startedAt')::bigint)
    from public.documents p where p.collection='players' and p.data->>'quizId'=q.id
  ),'[]'::jsonb)),now()
from public.documents q where q.collection='quizzes'
on conflict(collection,id) do update set data=excluded.data,updated_at=excluded.updated_at;

drop policy if exists "sq_select" on public.documents;
create policy "sq_select" on public.documents for select to authenticated using (
  case collection
    when 'profiles' then id=auth.uid()::text or public.sq_is_admin()
    when 'userActivity' then id=auth.uid()::text or public.sq_is_admin()
    when 'quizzes' then data->>'visibility'='public' or data->>'status'='active' or (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text)
    when 'lessons' then data->>'visibility'='public' or (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text)
    when 'nationalSections' then (data->>'visibility'='public' and data->>'approvalStatus'='approved') or data->>'ownerId'=auth.uid()::text or public.sq_is_admin()
    when 'nationalResults' then data->>'uid'=auth.uid()::text or data->>'ownerId'=auth.uid()::text or public.sq_is_admin()
    when 'players' then data->>'uid'=auth.uid()::text or (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text)
    when 'leaderboards' then data->>'quizId'=id and public.sq_can_view_leaderboard(id)
    when 'live' then true
    when 'settings' then true
    when 'typingResults' then data->>'uid'=auth.uid()::text or (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text)
    else false
  end
);

revoke all on function public.sq_can_view_leaderboard(text),public.sq_refresh_leaderboard(),public.sq_guard_player() from public,anon;
grant execute on function public.sq_can_view_leaderboard(text) to authenticated;
commit;
