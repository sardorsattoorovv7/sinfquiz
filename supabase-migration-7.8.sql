-- SinfQuiz 7.8: darslikning noyob o‘quvchilari va 24 soatlik shaxsiy chat.
-- 7.7 dan keyin Supabase SQL Editor'da RUN qiling.
begin;

create table if not exists public.sq_lesson_reads (
  lesson_id text not null,
  student_uid uuid not null,
  read_at timestamptz not null default now(),
  primary key (lesson_id,student_uid)
);
create index if not exists sq_lesson_reads_student_idx on public.sq_lesson_reads(student_uid);
alter table public.sq_lesson_reads enable row level security;
revoke all on public.sq_lesson_reads from anon,authenticated;

create or replace function public.sq_lesson_counts(p_ids text[]) returns jsonb
language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  if auth.uid() is null or public.sq_role() not in ('student','teacher','admin') then
    raise exception 'Hisobingizga kiring.' using errcode='42501';
  end if;
  if coalesce(array_length(p_ids,1),0)>100 then raise exception 'Ko‘pi bilan 100 ta darslik.'; end if;
  select coalesce(jsonb_object_agg(l.id,coalesce(r.cnt,0)),'{}'::jsonb) into result
  from public.documents l
  left join (select lesson_id,count(*)::int cnt from public.sq_lesson_reads
             where lesson_id=any(p_ids) group by lesson_id) r on r.lesson_id=l.id
  where l.collection='lessons' and l.id=any(p_ids)
    and (l.data->>'visibility'='public' or l.data->>'ownerId'=auth.uid()::text or public.sq_is_admin());
  return result;
end $$;

create or replace function public.sq_lesson_mark_read(p_id text) returns integer
language plpgsql security definer set search_path=public as $$
declare count_readers int;
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' or public.sq_role()<>'student' then raise exception 'Faqat o‘quvchi uchun.' using errcode='42501'; end if;
  if not exists(select 1 from public.documents where collection='lessons' and id=p_id and data->>'visibility'='public') then
    raise exception 'Darslik topilmadi.';
  end if;
  insert into public.sq_lesson_reads(lesson_id,student_uid) values(p_id,auth.uid()) on conflict do nothing;
  select count(*)::int into count_readers from public.sq_lesson_reads where lesson_id=p_id;
  return count_readers;
end $$;

create table if not exists public.sq_chat_threads (
  id uuid primary key default gen_random_uuid(),
  teacher_uid uuid not null,
  student_uid uuid not null,
  lesson_id text not null,
  blocked_by uuid,
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '24 hours'),
  unique(teacher_uid,student_uid),
  check(teacher_uid<>student_uid),
  check(blocked_by is null or blocked_by=teacher_uid or blocked_by=student_uid)
);
create index if not exists sq_chat_teacher_idx on public.sq_chat_threads(teacher_uid,expires_at desc);
create index if not exists sq_chat_student_idx on public.sq_chat_threads(student_uid,expires_at desc);
alter table public.sq_chat_threads enable row level security;
revoke all on public.sq_chat_threads from anon,authenticated;

create table if not exists public.sq_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.sq_chat_threads(id) on delete cascade,
  sender_uid uuid not null,
  kind text not null check(kind in ('text','voice')),
  body text,
  audio bytea,
  audio_mime text,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  reported_by uuid,
  reported_at timestamptz,
  check((kind='text' and body is not null and audio is null) or
        (kind='voice' and body is null and audio is not null))
);
create index if not exists sq_chat_recent_idx on public.sq_chat_messages(thread_id,created_at desc);
create index if not exists sq_chat_expiry_idx on public.sq_chat_messages(created_at);
alter table public.sq_chat_messages enable row level security;
revoke all on public.sq_chat_messages from anon,authenticated;

create or replace function public.sq_lesson_cleanup() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if old.collection='lessons' then
    delete from public.sq_lesson_reads where lesson_id=old.id;
    delete from public.sq_chat_threads where lesson_id=old.id;
  end if;
  return old;
end $$;
drop trigger if exists sq_lesson_cleanup_trigger on public.documents;
create trigger sq_lesson_cleanup_trigger after delete on public.documents
for each row execute function public.sq_lesson_cleanup();

create or replace function public.sq_chat_open(p_lesson_id text) returns uuid
language plpgsql security definer set search_path=public as $$
declare teacher_id uuid; thread_id uuid;
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' or public.sq_role()<>'student' then raise exception 'O‘quvchi hisobida kiring.' using errcode='42501'; end if;
  select (data->>'ownerId')::uuid into teacher_id from public.documents
    where collection='lessons' and id=p_lesson_id and data->>'visibility'='public';
  if teacher_id is null or not exists(select 1 from public.documents
      where collection='profiles' and id=teacher_id::text and data->>'role' in ('teacher','admin')) then
    raise exception 'Bu darslikning ustozi topilmadi.';
  end if;
  delete from public.sq_chat_threads where teacher_uid=teacher_id and student_uid=auth.uid() and expires_at<=now();
  insert into public.sq_chat_threads(teacher_uid,student_uid,lesson_id)
  values(teacher_id,auth.uid(),p_lesson_id)
  on conflict(teacher_uid,student_uid) do update set lesson_id=excluded.lesson_id
  returning id into thread_id;
  return thread_id;
end $$;

create or replace function public.sq_chat_inbox() returns jsonb
language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  if auth.uid() is null or public.sq_role() not in ('teacher','admin','student') then
    raise exception 'Hisobingizga kiring.' using errcode='42501';
  end if;
  perform public.sq_chat_purge();
  select coalesce(jsonb_agg(to_jsonb(x) order by x.last_at desc),'[]'::jsonb) into result from (
    select t.id,t.lesson_id,t.teacher_uid,t.student_uid,t.blocked_by,t.suspended,
      coalesce(tp.data->>'name','O‘qituvchi') teacher_name,
      coalesce(sp.data->>'name','O‘quvchi') student_name,
      coalesce((select max(m.created_at) from public.sq_chat_messages m
                where m.thread_id=t.id and m.created_at>now()-interval '24 hours'),t.created_at) last_at
    from public.sq_chat_threads t
    left join public.documents tp on tp.collection='profiles' and tp.id=t.teacher_uid::text
    left join public.documents sp on sp.collection='profiles' and sp.id=t.student_uid::text
    where t.expires_at>now() and (t.teacher_uid=auth.uid() or t.student_uid=auth.uid())
    order by last_at desc limit 50
  ) x;
  return result;
end $$;

create or replace function public.sq_chat_messages_for(p_thread uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  if not exists(select 1 from public.sq_chat_threads where id=p_thread and expires_at>now()
      and auth.uid() in (teacher_uid,student_uid)) then raise exception 'Suhbat topilmadi.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at,x.id),'[]'::jsonb) into result from (
    select m.id,m.sender_uid,m.kind,m.body,m.audio_mime,m.duration_seconds,m.created_at,
           m.reported_by is not null reported
    from public.sq_chat_messages m where m.thread_id=p_thread and m.created_at>now()-interval '24 hours'
    order by m.created_at desc limit 80
  ) x;
  return result;
end $$;

create or replace function public.sq_chat_send(p_thread uuid,p_kind text,p_body text default null,
  p_audio_base64 text default null,p_mime text default null,p_duration integer default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare thread_row public.sq_chat_threads; saved public.sq_chat_messages; audio_bytes bytea;
begin
  select * into thread_row from public.sq_chat_threads where id=p_thread and expires_at>now()
    and auth.uid() in (teacher_uid,student_uid) for update;
  if not found then raise exception 'Suhbat topilmadi.' using errcode='42501'; end if;
  if thread_row.blocked_by is not null or thread_row.suspended then raise exception 'Suhbat bloklangan.' using errcode='42501'; end if;
  if exists(select 1 from public.sq_chat_messages where thread_id=p_thread and sender_uid=auth.uid()
    and created_at>now()-interval '2 seconds') then raise exception 'Biroz kutib, keyin yuboring.'; end if;
  if (select count(*) from public.sq_chat_messages where sender_uid=auth.uid()
      and created_at>now()-interval '1 hour')>=120 then raise exception 'Bir soatlik xabar chegarasiga yetdingiz.'; end if;
  if p_kind='text' then
    if coalesce(char_length(trim(p_body)),0) not between 1 and 800 then raise exception 'Xabar 1–800 belgidan iborat bo‘lsin.'; end if;
    insert into public.sq_chat_messages(thread_id,sender_uid,kind,body)
      values(p_thread,auth.uid(),'text',trim(p_body)) returning * into saved;
  elsif p_kind='voice' then
    if p_mime not in ('audio/webm','audio/ogg','audio/mp4') or p_duration not between 1 and 15
       or coalesce(length(p_audio_base64),0) not between 100 and 400000
       or p_audio_base64 !~ '^[A-Za-z0-9+/]+={0,2}$' then
      raise exception 'Ovoz 15 soniyadan va 256 KB dan oshmasin.';
    end if;
    audio_bytes:=decode(p_audio_base64,'base64');
    if octet_length(audio_bytes)>262144 or octet_length(audio_bytes)<100 or not (
       (p_mime='audio/webm' and substring(audio_bytes from 1 for 4)=decode('1a45dfa3','hex')) or
       (p_mime='audio/ogg' and substring(audio_bytes from 1 for 4)=decode('4f676753','hex')) or
       (p_mime='audio/mp4' and substring(audio_bytes from 5 for 4)=decode('66747970','hex'))
    ) then raise exception 'Audio formati yoki hajmi noto‘g‘ri.'; end if;
    insert into public.sq_chat_messages(thread_id,sender_uid,kind,audio,audio_mime,duration_seconds)
      values(p_thread,auth.uid(),'voice',audio_bytes,p_mime,p_duration) returning * into saved;
  else raise exception 'Xabar turi noto‘g‘ri.'; end if;
  update public.sq_chat_threads set expires_at=now()+interval '24 hours' where id=p_thread;
  return jsonb_build_object('id',saved.id,'sender_uid',saved.sender_uid,'kind',saved.kind,
    'body',saved.body,'audio_mime',saved.audio_mime,'duration_seconds',saved.duration_seconds,
    'created_at',saved.created_at,'reported',false);
end $$;

create or replace function public.sq_chat_audio(p_message uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  select jsonb_build_object('mime',m.audio_mime,'base64',translate(encode(m.audio,'base64'),E'\n\r\t ','')) into result
  from public.sq_chat_messages m join public.sq_chat_threads t on t.id=m.thread_id
  where m.id=p_message and m.kind='voice' and m.created_at>now()-interval '24 hours'
    and t.expires_at>now() and (auth.uid() in (t.teacher_uid,t.student_uid)
      or (public.sq_is_admin() and m.reported_by is not null));
  if result is null then raise exception 'Ovozli xabar topilmadi.' using errcode='42501'; end if;
  return result;
end $$;

create or replace function public.sq_chat_block(p_thread uuid,p_block boolean) returns boolean
language plpgsql security definer set search_path=public as $$
declare row_thread public.sq_chat_threads;
begin
  select * into row_thread from public.sq_chat_threads where id=p_thread and expires_at>now()
    and auth.uid() in (teacher_uid,student_uid) for update;
  if not found then raise exception 'Suhbat topilmadi.' using errcode='42501'; end if;
  if p_block then
    update public.sq_chat_threads set blocked_by=auth.uid() where id=p_thread;
  elsif row_thread.blocked_by=auth.uid() then
    update public.sq_chat_threads set blocked_by=null where id=p_thread;
  else raise exception 'Suhbatni faqat bloklagan ishtirokchi qayta ochadi.' using errcode='42501'; end if;
  return true;
end $$;

create or replace function public.sq_chat_report(p_message uuid) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  update public.sq_chat_messages m set reported_by=auth.uid(),reported_at=now()
  from public.sq_chat_threads t where m.id=p_message and t.id=m.thread_id
    and t.expires_at>now() and m.created_at>now()-interval '24 hours'
    and auth.uid() in (t.teacher_uid,t.student_uid) and m.sender_uid<>auth.uid()
    and m.reported_by is null;
  if not found then raise exception 'Xabar topilmadi yoki allaqachon yuborilgan.' using errcode='42501'; end if;
  return true;
end $$;

create or replace function public.sq_chat_reports() returns jsonb
language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  if not public.sq_is_admin() then raise exception 'Faqat administrator uchun.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.reported_at desc),'[]'::jsonb) into result from (
    select m.id,m.thread_id,m.kind,m.body,m.created_at,m.reported_at,m.reported_by,
           t.student_uid,t.teacher_uid
    from public.sq_chat_messages m join public.sq_chat_threads t on t.id=m.thread_id
    where m.reported_by is not null and m.created_at>now()-interval '24 hours'
    order by m.reported_at desc limit 100
  ) x;
  return result;
end $$;

create or replace function public.sq_chat_moderate(p_thread uuid,p_suspend boolean) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if not public.sq_is_admin() then raise exception 'Faqat administrator uchun.' using errcode='42501'; end if;
  update public.sq_chat_threads set suspended=p_suspend where id=p_thread and expires_at>now();
  if not found then raise exception 'Suhbat topilmadi.'; end if;
  return true;
end $$;

create or replace function public.sq_chat_purge() returns integer
language plpgsql security definer set search_path=public as $$
declare deleted_count integer;
begin
  delete from public.sq_chat_messages where created_at<=now()-interval '24 hours';
  get diagnostics deleted_count=row_count;
  delete from public.sq_chat_threads where expires_at<=now();
  return deleted_count;
end $$;

revoke all on function public.sq_lesson_counts(text[]),public.sq_lesson_mark_read(text),
  public.sq_chat_open(text),public.sq_chat_inbox(),public.sq_chat_messages_for(uuid),
  public.sq_chat_send(uuid,text,text,text,text,integer),public.sq_chat_audio(uuid),
  public.sq_chat_block(uuid,boolean),public.sq_chat_report(uuid),public.sq_chat_reports(),
  public.sq_chat_moderate(uuid,boolean),public.sq_lesson_cleanup(),
  public.sq_chat_purge() from public,anon,authenticated;
grant execute on function public.sq_lesson_counts(text[]),public.sq_lesson_mark_read(text),
  public.sq_chat_open(text),public.sq_chat_inbox(),public.sq_chat_messages_for(uuid),
  public.sq_chat_send(uuid,text,text,text,text,integer),public.sq_chat_audio(uuid),
  public.sq_chat_block(uuid,boolean),public.sq_chat_report(uuid),public.sq_chat_reports(),
  public.sq_chat_moderate(uuid,boolean) to authenticated;
commit;

-- Supabase Cron / pg_cron kengaytmasi cron sxemasini o‘zi yaratadi.
-- Job har daqiqada 24 soatdan oshgan matn va audio baytlarini o‘chiradi.
create extension if not exists pg_cron;
select cron.schedule('sinfquiz-chat-24h-purge','* * * * *','select public.sq_chat_purge()');
