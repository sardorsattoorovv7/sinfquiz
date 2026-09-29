-- SinfQuiz 7.13: English audio maze documents and ownership policies.
-- Run after supabase-schema.sql and existing SinfQuiz migrations.
begin;

create or replace function public.sq_audio_maze_is_admin()
returns boolean language sql stable security definer set search_path=public
as $$
  select lower(coalesce(auth.jwt()->>'email',''))='admin@sinfquiz.uz'
    or public.sq_role()='admin'
$$;

create or replace function public.sq_audio_maze_active_owner(p_owner text,p_level text)
returns boolean language sql stable security definer set search_path=public
as $$
  select exists(
    select 1 from public.documents a
    where a.collection='audioMazeActivations'
      and a.id='a-'||p_owner
      and a.data->>'ownerId'=p_owner
      and a.data->>'active'='true'
      and a.data->>'levelId'=p_level
  )
$$;

create or replace function public.sq_audio_maze_guard()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if new.collection='audioMazeLevels' then
    if public.sq_audio_maze_is_admin() then return new; end if;
    if not public.sq_is_teacher() or new.data->>'ownerId' is distinct from auth.uid()::text then
      raise exception 'Audio labirint savollari faqat egasi tomonidan tahrirlanadi';
    end if;
    if new.data->>'approvalStatus'='approved' or new.data->>'visibility'='public' then
      raise exception 'Ommaviy savollar uchun administrator tasdig‘i kerak';
    end if;
    if tg_op='UPDATE' and (
      new.data->'title' is distinct from old.data->'title'
      or new.data->'tasks' is distinct from old.data->'tasks'
      or new.data->'mapId' is distinct from old.data->'mapId'
    ) then
      new.data:=new.data||jsonb_build_object('approvalStatus','pending','visibility','private','reviewedAt',null);
    end if;
  elsif new.collection='audioMazeActivations' then
    if not public.sq_audio_maze_is_admin() and (
      not public.sq_is_teacher() or new.data->>'ownerId' is distinct from auth.uid()::text
    ) then raise exception 'Audio labirint sozlamasini faqat o‘qituvchi o‘zgartiradi'; end if;
  end if;
  return new;
end
$$;

drop trigger if exists sq_audio_maze_guard_trigger on public.documents;
create trigger sq_audio_maze_guard_trigger
before insert or update on public.documents
for each row execute function public.sq_audio_maze_guard();

drop policy if exists sq_audio_maze_levels_select on public.documents;
create policy sq_audio_maze_levels_select on public.documents for select to authenticated using (
  collection='audioMazeLevels' and (
    (data->>'approvalStatus'='approved' and data->>'visibility'='public')
    or data->>'ownerId'=auth.uid()::text
    or public.sq_audio_maze_is_admin()
  )
);

drop policy if exists sq_audio_maze_levels_insert on public.documents;
create policy sq_audio_maze_levels_insert on public.documents for insert to authenticated with check (
  collection='audioMazeLevels' and public.sq_is_teacher()
  and data->>'ownerId'=auth.uid()::text
  and ((data->>'approvalStatus'='pending' and data->>'visibility'='private')
    or public.sq_audio_maze_is_admin())
);

drop policy if exists sq_audio_maze_levels_update on public.documents;
create policy sq_audio_maze_levels_update on public.documents for update to authenticated
using (collection='audioMazeLevels' and ((public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text) or public.sq_audio_maze_is_admin()))
with check (collection='audioMazeLevels' and ((public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text and data->>'approvalStatus'<>'approved' and data->>'visibility'<>'public') or public.sq_audio_maze_is_admin()));

drop policy if exists sq_audio_maze_levels_delete on public.documents;
create policy sq_audio_maze_levels_delete on public.documents for delete to authenticated using (
  collection='audioMazeLevels' and ((public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text) or public.sq_audio_maze_is_admin())
);

drop policy if exists sq_audio_maze_activations_select on public.documents;
create policy sq_audio_maze_activations_select on public.documents for select to authenticated using (
  collection='audioMazeActivations' and (data->>'active'='true' or data->>'ownerId'=auth.uid()::text or public.sq_audio_maze_is_admin())
);

drop policy if exists sq_audio_maze_activations_insert on public.documents;
create policy sq_audio_maze_activations_insert on public.documents for insert to authenticated with check (
  collection='audioMazeActivations' and public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text
);

drop policy if exists sq_audio_maze_activations_update on public.documents;
create policy sq_audio_maze_activations_update on public.documents for update to authenticated
using (collection='audioMazeActivations' and ((public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text) or public.sq_audio_maze_is_admin()))
with check (collection='audioMazeActivations' and ((public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text) or public.sq_audio_maze_is_admin()));

drop policy if exists sq_audio_maze_activations_delete on public.documents;
create policy sq_audio_maze_activations_delete on public.documents for delete to authenticated using (
  collection='audioMazeActivations' and ((public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text) or public.sq_audio_maze_is_admin())
);

drop policy if exists sq_audio_maze_results_select on public.documents;
create policy sq_audio_maze_results_select on public.documents for select to authenticated using (
  collection='audioMazeResults' and (
    data->>'uid'=auth.uid()::text
    or (public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text)
    or public.sq_audio_maze_is_admin()
  )
);

drop policy if exists sq_audio_maze_results_insert on public.documents;
create policy sq_audio_maze_results_insert on public.documents for insert to authenticated with check (
  collection='audioMazeResults'
  and data->>'uid'=auth.uid()::text
  and public.sq_audio_maze_active_owner(data->>'ownerId',data->>'levelId')
  and data->>'mode' in ('listen','learn')
  and data->>'outcome' in ('won','caught','time','left')
  and exists(select 1 from public.documents a where a.collection='audioMazeActivations'
    and a.id='a-'||(documents.data->>'ownerId')
    and a.data->>'taskCount'=documents.data->>'tasksTotal')
  and (data->>'wrong') ~ '^([0-9]|[1-9][0-9]|100)$'
  and case when (data->>'correct') ~ '^[0-8]$' and (data->>'tasksTotal') ~ '^[5-8]$' and (data->>'assisted') ~ '^[0-8]$'
    then (data->>'correct')::integer <= (data->>'tasksTotal')::integer and (data->>'assisted')::integer <= (data->>'tasksTotal')::integer
    else false end
  and jsonb_array_length(coalesce(data->'mistakes','[]'::jsonb))<=80
);

revoke all on function public.sq_audio_maze_is_admin(),public.sq_audio_maze_active_owner(text,text),public.sq_audio_maze_guard() from public,anon;
grant execute on function public.sq_audio_maze_is_admin(),public.sq_audio_maze_active_owner(text,text) to authenticated;

create index if not exists documents_audio_maze_owner_idx
  on public.documents(collection,(data->>'ownerId'),updated_at desc)
  where collection in ('audioMazeActivations','audioMazeLevels','audioMazeResults');

commit;
