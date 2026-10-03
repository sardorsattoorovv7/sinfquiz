-- SinfQuiz 7.20: private class groups and science experiment notebooks.
-- Run after the existing schema and atlas migrations. Repeatable; Cron is optional.
begin;
-- Extend the existing atlas content constraint without changing its RLS.
alter table public.math_atlas_concepts drop constraint if exists math_atlas_data_valid;
alter table public.math_atlas_concepts add constraint math_atlas_data_valid check (
    jsonb_typeof(data)='object'
    and length(coalesce(data->>'title','')) between 4 and 100
    and length(coalesce(data->>'definition','')) between 12 and 500
    and length(coalesce(data->>'reason','')) between 12 and 600
    and length(coalesce(data->>'life','')) between 12 and 500
    and length(coalesce(data->>'challenge','')) between 12 and 500
    and length(coalesce(data->>'misconception','')) between 12 and 500
    and data->>'domain' in ('Algebra','Geometriya')
    and data->>'scene' in ('number','fraction','balance','linear','quadratic','coordinate','triangle','transform','power','sequence','expression','angle','line','square','rectangle','parallelogram','trapezoid','rhombus','polygon','circle','cube','cuboid','prism','pyramid','cylinder','cone','sphere','statistics','probability')
    and (data->>'grade')::integer between 5 and 11
    and jsonb_typeof(coalesce(data->'parameters','{}'::jsonb))='object'
    and jsonb_typeof(coalesce(data->'prerequisites','[]'::jsonb))='array'
    and jsonb_array_length(coalesce(data->'prerequisites','[]'::jsonb))<=12
    and length(data::text)<12000
);
create table if not exists public.sq_class_groups(id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,title text not null check(length(btrim(title)) between 4 and 80),join_code text not null unique check(join_code ~ '^[A-F0-9]{10}$'),active boolean not null default true,created_at timestamptz not null default now());
create table if not exists public.sq_class_members(group_id uuid not null references public.sq_class_groups(id) on delete cascade,student_id uuid not null references auth.users(id) on delete cascade,student_name text not null,created_at timestamptz not null default now(),primary key(group_id,student_id));
create table if not exists public.sq_group_messages(id uuid primary key default gen_random_uuid(),group_id uuid not null references public.sq_class_groups(id) on delete cascade,sender_id uuid not null references auth.users(id) on delete cascade,sender_name text not null,kind text not null check(kind in ('text','voice')),body text not null default '' check(length(body)<=800),audio_base64 text not null default '' check(length(audio_base64)<=349528),mime text not null default '',duration integer not null default 0,created_at timestamptz not null default now(),check((kind='text' and length(btrim(body)) between 1 and 800 and audio_base64='' and mime='' and duration=0) or (kind='voice' and body='' and length(audio_base64) between 100 and 349528 and mime in ('audio/webm','audio/ogg','audio/mp4') and duration between 1 and 15)));
create table if not exists public.sq_action_limits(user_id uuid not null references auth.users(id) on delete cascade,kind text not null,created_at timestamptz not null default now());
create index if not exists sq_limit_user_idx on public.sq_action_limits(user_id,kind,created_at desc);
create index if not exists sq_member_user_idx on public.sq_class_members(student_id,group_id);
create index if not exists sq_message_group_idx on public.sq_group_messages(group_id,created_at desc);
create index if not exists sq_message_expiry_idx on public.sq_group_messages(created_at);
create or replace function public.sq_class_owner(p_group uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from public.sq_class_groups g where g.id=p_group and g.owner_id=auth.uid())$$;
create or replace function public.sq_class_member(p_group uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from public.sq_class_members m where m.group_id=p_group and m.student_id=auth.uid())$$;
create or replace function public.sq_limit_action(p_kind text,p_minute integer,p_day integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Hisobga kiring'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':'||p_kind));
 if (select count(*) from public.sq_action_limits l where l.user_id=auth.uid() and l.kind=p_kind and l.created_at>now()-interval '1 minute')>=p_minute or (select count(*) from public.sq_action_limits l where l.user_id=auth.uid() and l.kind=p_kind and l.created_at>now()-interval '1 day')>=p_day then raise exception 'So‘rovlar juda ko‘p. Birozdan keyin urinib ko‘ring.'; end if;
 insert into public.sq_action_limits(user_id,kind) values(auth.uid(),p_kind);
end $$;
create or replace function public.sq_group_create(p_title text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_group public.sq_class_groups;v_code text;
begin
 if not public.sq_is_teacher() then raise exception 'Ustoz ruxsati kerak'; end if;
 if p_title is null or length(btrim(p_title)) not between 4 and 80 then raise exception 'Guruh nomi 4–80 belgi bo‘lsin'; end if;
 perform public.sq_limit_action('group_create',2,20);
 loop v_code:=upper(substr(md5(gen_random_uuid()::text),1,10));exit when not exists(select 1 from public.sq_class_groups g where g.join_code=v_code);end loop;
 insert into public.sq_class_groups(owner_id,title,join_code) values(auth.uid(),btrim(p_title),v_code) returning * into v_group;return to_jsonb(v_group);
end $$;
create or replace function public.sq_group_join(p_code text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_group public.sq_class_groups;v_name text;
begin
 if auth.uid() is null or not exists(select 1 from public.documents d where d.collection='profiles' and d.id=auth.uid()::text) then raise exception 'Avval hisobga kiring'; end if;
 perform public.sq_limit_action('group_join',5,40);
 select * into v_group from public.sq_class_groups g where g.join_code=upper(btrim(p_code)) and g.active for update;
 -- A wrong code returns a value so the failed attempt is committed, not rolled back.
 if v_group.id is null then return jsonb_build_object('error','Kod mos kelmadi yoki guruh yopilgan.');end if;
 if (select count(*) from public.sq_class_members m where m.group_id=v_group.id)>=150 and not public.sq_class_member(v_group.id) then return jsonb_build_object('error','Guruh to‘ldi.');end if;
 select left(coalesce(nullif(d.data->>'name',''),'O‘quvchi'),100) into v_name from public.documents d where d.collection='profiles' and d.id=auth.uid()::text;
 insert into public.sq_class_members(group_id,student_id,student_name) values(v_group.id,auth.uid(),v_name) on conflict do nothing;
 return to_jsonb(v_group);
end $$;
create or replace function public.sq_group_send(p_group uuid,p_body text default '',p_audio text default '',p_mime text default '',p_duration integer default 0) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_row public.sq_group_messages;v_name text;v_bytes bytea;
begin
 if not (public.sq_class_owner(p_group) or public.sq_class_member(p_group) or public.sq_is_admin()) or not exists(select 1 from public.sq_class_groups g where g.id=p_group and g.active) then raise exception 'Faol guruhga kirish ruxsati yo‘q';end if;
 if p_audio<>'' then
  if p_mime not in ('audio/webm','audio/ogg','audio/mp4') or p_duration not between 1 and 15 or length(p_audio) not between 100 and 349528 then raise exception 'Ovoz formati yoki hajmi mos emas';end if;
  v_bytes:=decode(p_audio,'base64');
  if octet_length(v_bytes)>262144 or not ((p_mime='audio/webm' and encode(substring(v_bytes from 1 for 4),'hex')='1a45dfa3') or (p_mime='audio/ogg' and encode(substring(v_bytes from 1 for 4),'hex')='4f676753') or (p_mime='audio/mp4' and convert_from(substring(v_bytes from 5 for 4),'UTF8')='ftyp')) then raise exception 'Ovoz fayli mos emas';end if;
 else
  if p_body is null or length(btrim(p_body)) not between 1 and 800 then raise exception 'Xabar 1–800 belgi bo‘lsin';end if;
 end if;
 perform public.sq_limit_action('group_message',8,300);
 delete from public.sq_group_messages m where m.group_id=p_group and m.created_at<=now()-interval '24 hours';
 select left(coalesce(nullif(d.data->>'name',''),'O‘quvchi'),100) into v_name from public.documents d where d.collection='profiles' and d.id=auth.uid()::text;
 if v_name is null then raise exception 'Hisob profili topilmadi';end if;
 insert into public.sq_group_messages(group_id,sender_id,sender_name,kind,body,audio_base64,mime,duration) values(p_group,auth.uid(),v_name,case when p_audio='' then 'text' else 'voice' end,case when p_audio='' then btrim(p_body) else '' end,p_audio,case when p_audio='' then '' else p_mime end,case when p_audio='' then 0 else p_duration end) returning * into v_row;
 return to_jsonb(v_row)-'audio_base64';
end $$;
create or replace function public.sq_group_audio(p_id uuid) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$select jsonb_build_object('base64',m.audio_base64,'mime',m.mime) from public.sq_group_messages m where m.id=p_id and m.kind='voice' and m.created_at>now()-interval '24 hours' and (public.sq_class_owner(m.group_id) or public.sq_class_member(m.group_id) or public.sq_is_admin())$$;
create or replace function public.sq_group_guard() returns trigger language plpgsql set search_path=public,pg_temp as $$begin if (to_jsonb(new)-'title'-'active') is distinct from (to_jsonb(old)-'title'-'active') then raise exception 'Guruh egasi va kodi o‘zgarmaydi';end if;return new;end $$;
drop trigger if exists sq_group_guard_trigger on public.sq_class_groups;
create trigger sq_group_guard_trigger before update on public.sq_class_groups for each row execute function public.sq_group_guard();

-- Only timestamps enter Realtime. Text and audio remain behind RLS/RPC.
create table if not exists public.sq_group_signals(group_id uuid primary key references public.sq_class_groups(id) on delete cascade,messages_at timestamptz,members_at timestamptz,settings_at timestamptz);
alter table public.sq_group_signals enable row level security;
revoke all on public.sq_group_signals from public,anon,authenticated;
grant select on public.sq_group_signals to authenticated;
drop policy if exists sq_signals_read on public.sq_group_signals;
create policy sq_signals_read on public.sq_group_signals for select to authenticated using(public.sq_class_owner(group_id) or public.sq_class_member(group_id) or public.sq_is_admin());
create or replace function public.sq_group_signal() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_group uuid;v_time timestamptz:=clock_timestamp();
begin
 if tg_table_name='sq_class_groups' then v_group:=new.id;elsif tg_op='DELETE' then v_group:=old.group_id;else v_group:=new.group_id;end if;
 if exists(select 1 from public.sq_class_groups g where g.id=v_group) then
  insert into public.sq_group_signals(group_id,messages_at,members_at,settings_at) values(v_group,case when tg_table_name='sq_group_messages' then v_time end,case when tg_table_name='sq_class_members' then v_time end,case when tg_table_name='sq_class_groups' then v_time end)
  on conflict(group_id) do update set messages_at=coalesce(excluded.messages_at,sq_group_signals.messages_at),members_at=coalesce(excluded.members_at,sq_group_signals.members_at),settings_at=coalesce(excluded.settings_at,sq_group_signals.settings_at);
 end if;
 if tg_op='DELETE' then return old;end if;return new;
end $$;
revoke all on function public.sq_group_signal() from public,anon,authenticated;
drop trigger if exists sq_message_signal on public.sq_group_messages;
create trigger sq_message_signal after insert or delete on public.sq_group_messages for each row execute function public.sq_group_signal();
drop trigger if exists sq_member_signal on public.sq_class_members;
create trigger sq_member_signal after insert or delete on public.sq_class_members for each row execute function public.sq_group_signal();
drop trigger if exists sq_settings_signal on public.sq_class_groups;
create trigger sq_settings_signal after insert or update on public.sq_class_groups for each row execute function public.sq_group_signal();
do $$begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='sq_group_signals') then execute 'alter publication supabase_realtime add table public.sq_group_signals';end if;
end $$;

create table if not exists public.sq_experiment_assignments(id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,subject text not null check(subject in ('math','chemistry')),topic_id text not null check(length(topic_id) between 1 and 100),title text not null check(length(btrim(title)) between 4 and 100),instructions text not null check(length(btrim(instructions)) between 12 and 1500),group_id uuid references public.sq_class_groups(id) on delete cascade,visibility text not null check(visibility in ('public','group')),status text not null default 'draft' check(status in ('draft','pending','published')),active boolean not null default true,settings jsonb not null default '{}' check(jsonb_typeof(settings)='object' and length(settings::text)<=4000),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check((visibility='public' and group_id is null) or (visibility='group' and group_id is not null)));
create table if not exists public.sq_experiment_attempts(id uuid primary key default gen_random_uuid(),student_id uuid not null references auth.users(id) on delete cascade,student_name text not null,subject text not null check(subject in ('math','chemistry')),topic_id text not null check(length(topic_id) between 1 and 100),topic_title text not null check(length(topic_title) between 1 and 100),assignment_id uuid references public.sq_experiment_assignments(id) on delete cascade,data jsonb not null,client_token uuid not null,feedback text not null default '' check(length(feedback)<=1500),created_at timestamptz not null default now(),reviewed_at timestamptz,unique(student_id,client_token),check(data ?& array['prediction','observation','conclusion','parameters','checks','snapshots','hintsUsed'] and jsonb_typeof(data->'parameters')='object' and jsonb_typeof(data->'hintsUsed')='number' and (data->>'hintsUsed') ~ '^(0|[1-9][0-9]?)$' and jsonb_typeof(data->'prediction')='string' and jsonb_typeof(data->'observation')='string' and jsonb_typeof(data->'conclusion')='string' and jsonb_typeof(data)='object' and length(data::text)<=35000 and length(btrim(coalesce(data->>'prediction',''))) between 3 and 500 and length(btrim(coalesce(data->>'observation',''))) between 15 and 1500 and length(btrim(coalesce(data->>'conclusion',''))) between 15 and 1500 and jsonb_typeof(data->'checks')='array' and jsonb_array_length(data->'checks')<=20 and jsonb_typeof(data->'snapshots')='array' and jsonb_array_length(data->'snapshots')<=6 and (data->>'hintsUsed')::integer between 0 and 30));
-- Also upgrades any early 7.20 schema that was already installed.
alter table public.sq_experiment_attempts drop constraint if exists sq_attempt_data_valid;
alter table public.sq_experiment_attempts add constraint sq_attempt_data_valid check(data ?& array['prediction','observation','conclusion','parameters','checks','snapshots','hintsUsed'] and jsonb_typeof(data->'parameters')='object' and jsonb_typeof(data->'hintsUsed')='number' and (data->>'hintsUsed') ~ '^(0|[1-9][0-9]?)$' and jsonb_typeof(data->'prediction')='string' and jsonb_typeof(data->'observation')='string' and jsonb_typeof(data->'conclusion')='string' and jsonb_typeof(data)='object' and length(data::text)<=35000 and length(btrim(coalesce(data->>'prediction',''))) between 3 and 500 and length(btrim(coalesce(data->>'observation',''))) between 15 and 1500 and length(btrim(coalesce(data->>'conclusion',''))) between 15 and 1500 and jsonb_typeof(data->'checks')='array' and jsonb_array_length(data->'checks')<=20 and jsonb_typeof(data->'snapshots')='array' and jsonb_array_length(data->'snapshots')<=6 and (data->>'hintsUsed')::integer between 0 and 30);
create index if not exists sq_assignment_owner_idx on public.sq_experiment_assignments(owner_id,updated_at desc);
create index if not exists sq_assignment_topic_idx on public.sq_experiment_assignments(subject,topic_id,status);
create index if not exists sq_attempt_student_idx on public.sq_experiment_attempts(student_id,subject,created_at desc);
create index if not exists sq_attempt_assignment_idx on public.sq_experiment_attempts(assignment_id,created_at desc);
create or replace function public.sq_assignment_owner(p_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from public.sq_experiment_assignments a where a.id=p_id and a.owner_id=auth.uid())$$;
create or replace function public.sq_assignment_can_read(p_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from public.sq_experiment_assignments a where a.id=p_id and (a.owner_id=auth.uid() or public.sq_is_admin() or (a.active and a.status='published' and (a.visibility='public' or public.sq_class_member(a.group_id)))))$$;
create or replace function public.sq_experiment_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_assignment public.sq_experiment_assignments;
begin
 if tg_table_name='sq_experiment_assignments' then
  if tg_op='INSERT' then
   if new.owner_id is distinct from auth.uid() or not public.sq_is_teacher() then raise exception 'Muallif ruxsati yo‘q';end if;
   perform public.sq_limit_action('assignment',6,100);
   if new.visibility='public' and new.status='published' and not public.sq_is_admin() then raise exception 'Admin tasdig‘i kerak';end if;
  else
   if new.owner_id is distinct from old.owner_id or new.id is distinct from old.id or new.created_at is distinct from old.created_at then raise exception 'Muallif o‘zgarmaydi';end if;
   if old.owner_id<>auth.uid() then
    if not public.sq_is_admin() or (to_jsonb(new)-'status'-'updated_at') is distinct from (to_jsonb(old)-'status'-'updated_at') then raise exception 'Admin faqat e’lon holatini o‘zgartiradi';end if;
   elsif new.visibility='public' and not public.sq_is_admin() and new.status='published' and (old.status<>'published' or (to_jsonb(new)-'active'-'updated_at') is distinct from (to_jsonb(old)-'active'-'updated_at')) then raise exception 'Ommaviy ish qayta tasdiqlanishi kerak';end if;
  end if;
  if new.visibility='group' and not exists(select 1 from public.sq_class_groups g where g.id=new.group_id and g.owner_id=new.owner_id) then raise exception 'Boshqa ustoz guruhiga biriktirilmaydi';end if;
  new.updated_at:=now();return new;
 end if;
 if tg_op='INSERT' then
  if new.student_id is distinct from auth.uid() or not exists(select 1 from public.documents d where d.collection='profiles' and d.id=auth.uid()::text) then raise exception 'O‘quvchi identifikatori mos emas';end if;
  if new.assignment_id is not null then
   select * into v_assignment from public.sq_experiment_assignments a where a.id=new.assignment_id and a.active and a.status='published' and public.sq_assignment_can_read(a.id);
   if v_assignment.id is null or v_assignment.subject<>new.subject or v_assignment.topic_id<>new.topic_id then raise exception 'Faol ish yoki mavzu mos emas';end if;
  end if;
  perform public.sq_limit_action('experiment',8,150);
  select left(coalesce(nullif(d.data->>'name',''),'O‘quvchi'),100) into new.student_name from public.documents d where d.collection='profiles' and d.id=auth.uid()::text;
  new.feedback:='';new.reviewed_at:=null;new.created_at:=now();return new;
 end if;
 if not (public.sq_is_admin() or public.sq_assignment_owner(old.assignment_id)) or (to_jsonb(new)-'feedback'-'reviewed_at') is distinct from (to_jsonb(old)-'feedback'-'reviewed_at') then raise exception 'Natija o‘zgarmaydi; ustoz faqat fikr yozadi';end if;
 new.reviewed_at:=now();return new;
end $$;
drop trigger if exists sq_assignment_guard_trigger on public.sq_experiment_assignments;
create trigger sq_assignment_guard_trigger before insert or update on public.sq_experiment_assignments for each row execute function public.sq_experiment_guard();
drop trigger if exists sq_attempt_guard_trigger on public.sq_experiment_attempts;
create trigger sq_attempt_guard_trigger before insert or update on public.sq_experiment_attempts for each row execute function public.sq_experiment_guard();

alter table public.sq_class_groups enable row level security;
alter table public.sq_class_members enable row level security;
alter table public.sq_group_messages enable row level security;
alter table public.sq_action_limits enable row level security;
alter table public.sq_experiment_assignments enable row level security;
alter table public.sq_experiment_attempts enable row level security;
revoke all on public.sq_class_groups,public.sq_class_members,public.sq_group_messages,public.sq_action_limits,public.sq_experiment_assignments,public.sq_experiment_attempts from anon,authenticated;
grant select,update,delete on public.sq_class_groups to authenticated;
grant select,delete on public.sq_class_members to authenticated;
grant select(id,group_id,sender_id,sender_name,kind,body,duration,created_at),delete on public.sq_group_messages to authenticated;
grant select,insert,update,delete on public.sq_experiment_assignments to authenticated;
grant select,insert,update on public.sq_experiment_attempts to authenticated;
drop policy if exists sq_groups_read on public.sq_class_groups;
create policy sq_groups_read on public.sq_class_groups for select to authenticated using(owner_id=auth.uid() or public.sq_class_member(id) or public.sq_is_admin());
drop policy if exists sq_groups_update on public.sq_class_groups;
create policy sq_groups_update on public.sq_class_groups for update to authenticated using(owner_id=auth.uid() or public.sq_is_admin()) with check(owner_id=auth.uid() or public.sq_is_admin());
drop policy if exists sq_groups_delete on public.sq_class_groups;
create policy sq_groups_delete on public.sq_class_groups for delete to authenticated using(owner_id=auth.uid());
drop policy if exists sq_members_read on public.sq_class_members;
create policy sq_members_read on public.sq_class_members for select to authenticated using(public.sq_class_owner(group_id) or public.sq_class_member(group_id) or public.sq_is_admin());
drop policy if exists sq_members_delete on public.sq_class_members;
create policy sq_members_delete on public.sq_class_members for delete to authenticated using(student_id=auth.uid() or public.sq_class_owner(group_id) or public.sq_is_admin());
drop policy if exists sq_messages_read on public.sq_group_messages;
create policy sq_messages_read on public.sq_group_messages for select to authenticated using(created_at>now()-interval '24 hours' and (public.sq_class_owner(group_id) or public.sq_class_member(group_id) or public.sq_is_admin()));
drop policy if exists sq_messages_delete on public.sq_group_messages;
create policy sq_messages_delete on public.sq_group_messages for delete to authenticated using(sender_id=auth.uid() or public.sq_class_owner(group_id) or public.sq_is_admin());
drop policy if exists sq_assignments_read on public.sq_experiment_assignments;
create policy sq_assignments_read on public.sq_experiment_assignments for select to authenticated using(owner_id=auth.uid() or public.sq_is_admin() or (active and status='published' and (visibility='public' or public.sq_class_member(group_id))));
drop policy if exists sq_assignments_insert on public.sq_experiment_assignments;
create policy sq_assignments_insert on public.sq_experiment_assignments for insert to authenticated with check(owner_id=auth.uid() and public.sq_is_teacher());
drop policy if exists sq_assignments_update on public.sq_experiment_assignments;
create policy sq_assignments_update on public.sq_experiment_assignments for update to authenticated using(owner_id=auth.uid() and public.sq_is_teacher() or public.sq_is_admin()) with check(owner_id=auth.uid() and public.sq_is_teacher() or public.sq_is_admin());
drop policy if exists sq_assignments_delete on public.sq_experiment_assignments;
create policy sq_assignments_delete on public.sq_experiment_assignments for delete to authenticated using(owner_id=auth.uid() and public.sq_is_teacher());
drop policy if exists sq_attempts_read on public.sq_experiment_attempts;
create policy sq_attempts_read on public.sq_experiment_attempts for select to authenticated using(student_id=auth.uid() or public.sq_assignment_owner(assignment_id) or public.sq_is_admin());
drop policy if exists sq_attempts_insert on public.sq_experiment_attempts;
create policy sq_attempts_insert on public.sq_experiment_attempts for insert to authenticated with check(student_id=auth.uid());
drop policy if exists sq_attempts_update on public.sq_experiment_attempts;
create policy sq_attempts_update on public.sq_experiment_attempts for update to authenticated using(public.sq_assignment_owner(assignment_id) or public.sq_is_admin()) with check(public.sq_assignment_owner(assignment_id) or public.sq_is_admin());
revoke all on function public.sq_limit_action(text,integer,integer),public.sq_group_create(text),public.sq_group_join(text),public.sq_group_send(uuid,text,text,text,integer),public.sq_group_audio(uuid),public.sq_class_owner(uuid),public.sq_class_member(uuid),public.sq_assignment_owner(uuid),public.sq_assignment_can_read(uuid) from public,anon,authenticated;
grant execute on function public.sq_group_create(text),public.sq_group_join(text),public.sq_group_send(uuid,text,text,text,integer),public.sq_group_audio(uuid),public.sq_class_owner(uuid),public.sq_class_member(uuid),public.sq_assignment_owner(uuid),public.sq_assignment_can_read(uuid) to authenticated;
create or replace function public.sq_groups_purge() returns void language plpgsql security definer set search_path=public,pg_temp as $$begin delete from public.sq_group_messages where created_at<=now()-interval '24 hours';delete from public.sq_action_limits where created_at<now()-interval '2 days';end $$;
revoke all on function public.sq_groups_purge() from public,anon,authenticated;
do $$begin
 if to_regnamespace('cron') is not null and to_regprocedure('cron.schedule(text,text,text)') is not null then
  execute 'select cron.schedule(''sinfquiz-groups-24h-purge'',''*/5 * * * *'',''select public.sq_groups_purge()'')';
 end if;
end $$;
commit;
