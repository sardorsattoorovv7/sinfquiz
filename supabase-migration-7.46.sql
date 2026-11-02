-- SinfQuiz AI Speaking. Additive; apply after the existing migration chain.
begin;
create table if not exists public.sq_sp_records(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('profile','session','turn','answer','audio','transcript','assessment','roadmap','daily','vocabulary','review','progress','guide','error','receipt')),
 record_key text not null check(length(record_key) between 1 and 240),exam_mode text check(exam_mode in ('ielts','multilevel')),parent_id uuid,
 payload jsonb not null default '{}' check(jsonb_typeof(payload)='object' and length(payload::text)<300000),revision integer not null default 1,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,kind,record_key),unique(id,user_id),
 foreign key(parent_id,user_id) references public.sq_sp_records(id,user_id) on delete cascade
);
create index if not exists sq_sp_owner_kind on public.sq_sp_records(user_id,kind,created_at desc);
create table if not exists public.sq_sp_jobs(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('assess','plan','practice','guide','vocabulary')),target_id uuid not null,job_key text not null,
 status text not null default 'queued' check(status in ('queued','running','completed','failed','cancelled')),attempts integer not null default 0,
 available_at timestamptz not null default now(),lease_until timestamptz,lease_token uuid,last_error text,result_id uuid,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,job_key),foreign key(target_id,user_id) references public.sq_sp_records(id,user_id) on delete cascade
);
create index if not exists sq_sp_jobs_ready on public.sq_sp_jobs(status,available_at,created_at);
create table if not exists public.sq_sp_budget(day date not null,actor text not null,metric text not null,amount bigint not null default 0,primary key(day,actor,metric));
create table if not exists public.sq_sp_usage(id bigint generated always as identity primary key,user_id uuid references auth.users(id) on delete cascade,job_id uuid,model text not null,kind text not null,input_tokens integer not null default 0,output_tokens integer not null default 0,audio_seconds integer not null default 0,created_at timestamptz not null default now());
alter table public.sq_sp_records enable row level security;
alter table public.sq_sp_jobs enable row level security;
alter table public.sq_sp_budget enable row level security;
alter table public.sq_sp_usage enable row level security;
drop policy if exists sq_sp_own_records on public.sq_sp_records;
create policy sq_sp_own_records on public.sq_sp_records for select to authenticated using(user_id=auth.uid());
drop policy if exists sq_sp_own_jobs on public.sq_sp_jobs;
create policy sq_sp_own_jobs on public.sq_sp_jobs for select to authenticated using(user_id=auth.uid());
revoke all on public.sq_sp_records,public.sq_sp_jobs,public.sq_sp_budget,public.sq_sp_usage from anon,authenticated;
grant select on public.sq_sp_records,public.sq_sp_jobs to authenticated;
grant all on public.sq_sp_records,public.sq_sp_jobs,public.sq_sp_budget,public.sq_sp_usage to service_role;
grant usage,select on sequence public.sq_sp_usage_id_seq to service_role;

-- Only the authenticated server may invoke writes. Immutable records never
-- overwrite a first answer; expectedRevision protects read/modify/write work.
create or replace function public.sq_sp_write(p_user uuid,p_ops jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare o jsonb;r public.sq_sp_records;results jsonb:='[]';
begin
 if jsonb_typeof(p_ops)<>'array' or jsonb_array_length(p_ops)>100 then raise exception 'INVALID_OPERATIONS';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,746));
 for o in select value from jsonb_array_elements(p_ops) loop
  select * into r from public.sq_sp_records where user_id=p_user and kind=o->>'kind' and record_key=o->>'key' for update;
  if found then
   if o->>'mode'='insert' then results:=results||jsonb_build_array(to_jsonb(r));continue;end if;
   if (o->>'expectedRevision') is not null and r.revision<>(o->>'expectedRevision')::integer then raise exception 'REVISION_CONFLICT' using errcode='40001';end if;
   if r.kind in ('answer','transcript','assessment','review') then raise exception 'IMMUTABLE_RECORD';end if;
   update public.sq_sp_records set payload=o->'payload',revision=revision+1,updated_at=now() where id=r.id returning * into r;
  else
   insert into public.sq_sp_records(id,user_id,kind,record_key,exam_mode,parent_id,payload) values(coalesce((o->>'id')::uuid,gen_random_uuid()),p_user,o->>'kind',o->>'key',o->>'exam',(o->>'parentId')::uuid,o->'payload') returning * into r;
  end if;
  results:=results||jsonb_build_array(to_jsonb(r));
 end loop;return results;
end$$;
create or replace function public.sq_sp_enqueue(p_user uuid,p_kind text,p_target uuid,p_key text) returns public.sq_sp_jobs language plpgsql security definer set search_path='' as $$
declare r public.sq_sp_jobs;
begin insert into public.sq_sp_jobs(user_id,kind,target_id,job_key) values(p_user,p_kind,p_target,p_key) on conflict(user_id,job_key) do nothing;select * into r from public.sq_sp_jobs where user_id=p_user and job_key=p_key;return r;end$$;
create or replace function public.sq_sp_reserve(p_user uuid,p_metric text,p_amount integer,p_user_limit integer,p_site_limit integer) returns void language plpgsql security definer set search_path='' as $$
declare d date:=(now() at time zone 'UTC')::date;a bigint;b bigint;
begin
 if p_amount<0 or p_amount>1000000 then raise exception 'INVALID_BUDGET';end if;
 perform pg_advisory_xact_lock(hashtextextended(d::text||p_metric,746));
 select amount into a from public.sq_sp_budget where day=d and actor=p_user::text and metric=p_metric;
 select amount into b from public.sq_sp_budget where day=d and actor='site' and metric=p_metric;
 if coalesce(a,0)+p_amount>p_user_limit or coalesce(b,0)+p_amount>p_site_limit then raise exception 'AI_RATE_LIMIT';end if;
 insert into public.sq_sp_budget values(d,p_user::text,p_metric,p_amount) on conflict(day,actor,metric) do update set amount=public.sq_sp_budget.amount+excluded.amount;
 insert into public.sq_sp_budget values(d,'site',p_metric,p_amount) on conflict(day,actor,metric) do update set amount=public.sq_sp_budget.amount+excluded.amount;
end$$;
create or replace function public.sq_sp_claim() returns public.sq_sp_jobs language plpgsql security definer set search_path='' as $$
declare r public.sq_sp_jobs;
begin
 update public.sq_sp_jobs set status='failed',last_error='LEASE_EXHAUSTED',lease_token=null,lease_until=null where status='running' and lease_until<now() and attempts>=3;
 select * into r from public.sq_sp_jobs where ((status='queued' and available_at<=now()) or (status='running' and lease_until<now())) and attempts<3 order by created_at for update skip locked limit 1;
 if not found then return null;end if;
 update public.sq_sp_jobs set status='running',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval '5 minutes',updated_at=now() where id=r.id returning * into r;return r;
end$$;
create or replace function public.sq_sp_lease(p_id uuid,p_token uuid,p_state text,p_error text default null,p_result uuid default null) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if p_state not in ('heartbeat','completed','failed','queued') then raise exception 'INVALID_JOB_STATE';end if;
 update public.sq_sp_jobs set status=case when p_state='heartbeat' then status else p_state end,last_error=left(p_error,80),result_id=coalesce(p_result,result_id),available_at=case when p_state='queued' then now()+make_interval(secs=>least(180,10*attempts*attempts)) else available_at end,lease_until=case when p_state='heartbeat' then now()+interval '5 minutes' else null end,lease_token=case when p_state='heartbeat' then lease_token else null end,updated_at=now() where id=p_id and status='running' and lease_token=p_token;
 return found;
end$$;
revoke all on function public.sq_sp_write(uuid,jsonb),public.sq_sp_enqueue(uuid,text,uuid,text),public.sq_sp_reserve(uuid,text,integer,integer,integer),public.sq_sp_claim(),public.sq_sp_lease(uuid,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.sq_sp_write(uuid,jsonb),public.sq_sp_enqueue(uuid,text,uuid,text),public.sq_sp_reserve(uuid,text,integer,integer,integer),public.sq_sp_claim(),public.sq_sp_lease(uuid,uuid,text,text,uuid) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('speaking-private','speaking-private',false,20971520,array['audio/webm','video/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav','audio/x-wav']) on conflict(id) do update set public=false,file_size_limit=20971520,allowed_mime_types=excluded.allowed_mime_types;
-- No anonymous/authenticated object policies: upload/read URLs are issued by
-- the server only after owner checks. Existing buckets and policies are intact.
commit;
