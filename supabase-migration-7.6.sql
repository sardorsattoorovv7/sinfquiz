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
