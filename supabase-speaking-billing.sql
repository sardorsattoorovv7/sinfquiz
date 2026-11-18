begin;

-- Order history is private and survives account deletion for reconciliation.
create table if not exists public.sq_speaking_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  scope text not null check (scope in ('test','live')),
  plan text not null check (plan in ('single','plus')),
  amount integer not null check (amount>0),
  state integer not null default 0 check (state in (-2,-1,0,1,2)),
  created_at timestamptz not null default now(),
  payme_id text,
  payme_time bigint,
  create_time bigint not null default 0,
  perform_time bigint not null default 0,
  cancel_time bigint not null default 0,
  reason integer,
  expires_at timestamptz,
  unique (scope,payme_id)
);
alter table public.sq_speaking_orders
  add column if not exists method text not null default 'payme' check (method in ('payme','transfer')),
  add column if not exists bank_reference text,
  add column if not exists approved_by uuid references auth.users(id) on delete set null;
create index if not exists sq_speaking_orders_owner on public.sq_speaking_orders(user_id,scope,created_at desc);
create index if not exists sq_speaking_orders_statement on public.sq_speaking_orders(scope,payme_time);
create unique index if not exists sq_speaking_transfer_reference on public.sq_speaking_orders(scope,bank_reference)
  where method='transfer' and bank_reference is not null;

-- A pending analysis holds a credit. Only a completed one keeps it permanently.
create table if not exists public.sq_speaking_credits (
  job_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('test','live')),
  order_id uuid references public.sq_speaking_orders(id),
  kind text not null check (kind in ('full','short')),
  completed boolean not null default false
);
create index if not exists sq_speaking_credits_owner on public.sq_speaking_credits(user_id,scope,order_id);
alter table public.sq_speaking_orders enable row level security;
alter table public.sq_speaking_credits enable row level security;
revoke all on public.sq_speaking_orders,public.sq_speaking_credits from public,anon,authenticated;

create or replace function public.sq_speaking_open_purchase(p_user uuid,p_scope text,p_plan text,p_amount integer,p_method text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  purchase public.sq_speaking_orders;
  now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000);
  expected_amount integer:=case p_plan when 'single' then 1500000 when 'plus' then 4500000 end;
begin
  if p_user is null or p_scope is null or p_scope not in ('test','live')
    or p_method is null or p_method not in ('payme','transfer')
    or expected_amount is null or p_amount is distinct from expected_amount then
    raise exception 'BILLING_INPUT';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('speaking-billing:'||p_scope||':'||p_user::text,0));
  select * into purchase from public.sq_speaking_orders
  where user_id=p_user and scope=p_scope and plan=p_plan and method=p_method
    and ((state=0 and (p_method='transfer' or created_at>now()-interval '24 hours'))
      or (state=1 and payme_time>now_ms-43200000))
  order by created_at desc limit 1;
  if not found then
    if (select count(*) from public.sq_speaking_orders where user_id=p_user and scope=p_scope and created_at>now()-interval '1 minute')>=10 then
      raise exception 'BILLING_RATE';
    end if;
    insert into public.sq_speaking_orders(user_id,scope,plan,amount,method) values(p_user,p_scope,p_plan,p_amount,p_method)
    returning * into purchase;
  end if;
  return jsonb_build_object('id',purchase.id,'amount',purchase.amount);
end
$$;

create or replace function public.sq_speaking_open_order(p_user uuid,p_scope text,p_plan text,p_amount integer)
returns jsonb language sql security definer set search_path='' as $$
  select public.sq_speaking_open_purchase(p_user,p_scope,p_plan,p_amount,'payme')
$$;

create or replace function public.sq_speaking_transfer_orders(p_user uuid,p_scope text)
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',o.id,'plan',o.plan,'amount',o.amount,
    'status',case when o.state=2 then 'paid' else 'pending' end,'expiresAt',o.expires_at)
    order by o.state,o.created_at desc),'[]'::jsonb)
  from (
    select id,plan,amount,state,expires_at,created_at
    from public.sq_speaking_orders
    where user_id=p_user and scope=p_scope and method='transfer' and state in (0,2)
    order by state,created_at desc
    limit 12
  ) o
$$;

create or replace function public.sq_speaking_approve_transfer(
  p_admin uuid,p_user uuid,p_scope text,p_order uuid,p_reference text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  purchase public.sq_speaking_orders;
  reference text:=upper(regexp_replace(p_reference,'[[:space:]./_#-]','','g'));
begin
  if p_admin is null or p_user is null or p_scope is null or p_scope not in ('test','live')
    or reference is null or length(p_reference)>100 or reference !~ '^[A-Z0-9]{4,64}$' then
    raise exception 'TRANSFER_INPUT';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('speaking-billing:'||p_scope||':'||p_user::text,0));
  select * into purchase from public.sq_speaking_orders
  where id=p_order and user_id=p_user and scope=p_scope and method='transfer' for update;
  if not found then raise exception 'TRANSFER_ORDER'; end if;
  if purchase.state=0 then
    begin
      update public.sq_speaking_orders
      set state=2,bank_reference=reference,approved_by=p_admin,
        perform_time=floor(extract(epoch from clock_timestamp())*1000),
        expires_at=clock_timestamp()+interval '30 days'
      where id=p_order returning * into purchase;
    exception when unique_violation then
      raise exception 'TRANSFER_DUPLICATE';
    end;
  elsif purchase.state<>2 or purchase.bank_reference is distinct from reference then
    raise exception 'TRANSFER_CLOSED';
  end if;
  return jsonb_build_object('id',purchase.id,'plan',purchase.plan,'amount',purchase.amount,
    'status','paid','expiresAt',purchase.expires_at);
end
$$;

create or replace function public.sq_payme_transaction(
  p_scope text,p_method text,p_order uuid default null,p_id text default null,p_amount integer default null,
  p_time bigint default null,p_reason integer default null,p_from bigint default null,p_to bigint default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  purchase public.sq_speaking_orders;
  now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000);
begin
  if p_scope not in ('test','live') then return jsonb_build_object('error',-32504); end if;
  if p_method='GetStatement' then
    return jsonb_build_object('transactions',coalesce((
      select jsonb_agg(jsonb_build_object('id',payme_id,'time',payme_time,'amount',amount,
        'account',jsonb_build_object('order_id',id),'transaction',id,'state',state,
        'create_time',create_time,'perform_time',perform_time,'cancel_time',cancel_time,'reason',reason)
        order by payme_time,id)
      from public.sq_speaking_orders where scope=p_scope and method='payme' and payme_time between p_from and p_to
    ),'[]'::jsonb));
  end if;
  if p_method in ('CheckPerformTransaction','CreateTransaction') then
    select * into purchase from public.sq_speaking_orders where id=p_order and scope=p_scope and method='payme';
    if not found or purchase.user_id is null then return jsonb_build_object('error',-31050); end if;
  else
    select * into purchase from public.sq_speaking_orders where scope=p_scope and method='payme' and payme_id=p_id;
    if not found then return jsonb_build_object('error',-31003); end if;
  end if;
  if purchase.user_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('speaking-billing:'||p_scope||':'||purchase.user_id::text,0));
  end if;
  select * into purchase from public.sq_speaking_orders where id=purchase.id for update;
  now_ms:=floor(extract(epoch from clock_timestamp())*1000);
  if purchase.state=1 and purchase.payme_time<=now_ms-43200000 then
    update public.sq_speaking_orders set state=-1,cancel_time=now_ms,reason=4 where id=purchase.id returning * into purchase;
  end if;

  if p_method in ('CheckPerformTransaction','CreateTransaction') then
    if p_amount is distinct from purchase.amount then return jsonb_build_object('error',-31001); end if;
    if p_method='CreateTransaction' and purchase.payme_id=p_id and purchase.state in (1,2) then
      return jsonb_build_object('create_time',purchase.create_time,'transaction',purchase.id,'state',1);
    end if;
    if purchase.state not in (0,1) or (purchase.state=0 and purchase.created_at<=now()-interval '24 hours') then
      return jsonb_build_object('error',-31008);
    end if;
    if p_method='CheckPerformTransaction' then return jsonb_build_object('allow',true); end if;
    if purchase.state<>0 or p_time is null or p_time<=now_ms-43200000 or p_time>now_ms+300000 then
      return jsonb_build_object('error',-31008);
    end if;
    begin
      update public.sq_speaking_orders set payme_id=p_id,payme_time=p_time,state=1,create_time=now_ms where id=purchase.id returning * into purchase;
    exception when unique_violation then
      return jsonb_build_object('error',-31008);
    end;
    return jsonb_build_object('create_time',purchase.create_time,'transaction',purchase.id,'state',purchase.state);
  end if;

  if p_method='PerformTransaction' then
    if purchase.state=1 then
      if purchase.user_id is null then return jsonb_build_object('error',-31008); end if;
      update public.sq_speaking_orders set state=2,perform_time=now_ms,expires_at=clock_timestamp()+interval '30 days'
      where id=purchase.id returning * into purchase;
    end if;
    if purchase.state<>2 then return jsonb_build_object('error',-31008); end if;
    return jsonb_build_object('transaction',purchase.id,'perform_time',purchase.perform_time,'state',purchase.state);
  end if;
  if p_method='CancelTransaction' then
    if purchase.state in (1,2) then
      update public.sq_speaking_orders set state=-state,cancel_time=now_ms,reason=p_reason
      where id=purchase.id returning * into purchase;
    end if;
    return jsonb_build_object('transaction',purchase.id,'cancel_time',purchase.cancel_time,'state',purchase.state);
  end if;
  if p_method='CheckTransaction' then
    return jsonb_build_object('transaction',purchase.id,'create_time',purchase.create_time,
      'perform_time',purchase.perform_time,'cancel_time',purchase.cancel_time,'state',purchase.state,'reason',purchase.reason);
  end if;
  return jsonb_build_object('error',-32601);
end
$$;

create or replace function public.sq_speaking_credit_balances(p_user uuid,p_scope text)
returns table(order_id uuid,plan text,expires_at timestamptz,full_left integer,short_left integer)
language sql stable set search_path='' as $$
  with limits as (
    select null::uuid as id,'free'::text as plan,null::timestamptz as expiry,1 as full_limit,2 as short_limit
    union all
    select o.id,o.plan,o.expires_at,case when o.plan='plus' then 4 else 1 end,case when o.plan='plus' then 12 else 0 end
    from public.sq_speaking_orders o
    where o.user_id=p_user and o.scope=p_scope and o.state=2 and o.expires_at>now()
  ), held as (
    select c.order_id,count(*) filter(where c.kind='full') as full_held,count(*) filter(where c.kind='short') as short_held
    from public.sq_speaking_credits c left join public.sq_sp_jobs j on j.id=c.job_id
    where c.user_id=p_user and c.scope=p_scope and (c.completed or j.status in ('queued','running','completed'))
    group by c.order_id
  )
  select l.id,l.plan,l.expiry,greatest(0,l.full_limit-coalesce(h.full_held,0))::integer,
    greatest(0,l.short_limit-coalesce(h.short_held,0))::integer
  from limits l left join held h on h.order_id is not distinct from l.id
$$;

create or replace function public.sq_speaking_billing_status(p_user uuid,p_scope text,p_order uuid default null)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'balances',coalesce((select jsonb_agg(jsonb_build_object('plan',b.plan,'expiresAt',b.expires_at,'full',b.full_left,'short',b.short_left)
      order by b.expires_at nulls last) from public.sq_speaking_credit_balances(p_user,p_scope) b),'[]'::jsonb),
    'transferOrders',public.sq_speaking_transfer_orders(p_user,p_scope),
    'order',(select jsonb_build_object('id',o.id,'plan',o.plan,'amount',o.amount,'method',o.method,'status',case
      when o.state=2 then 'paid' when o.state<0 then 'cancelled'
      when o.method='payme' and o.state=0 and o.created_at<=now()-interval '24 hours' then 'cancelled'
      when o.state=1 and o.payme_time<=floor(extract(epoch from now())*1000)-43200000 then 'cancelled'
      else 'pending' end)
      from public.sq_speaking_orders o where o.id=p_order and o.user_id=p_user and o.scope=p_scope))
$$;

create or replace function public.sq_speaking_billed_job(
  p_user uuid,p_scope text,p_local boolean,p_kind text default null,
  p_target uuid default null,p_key text default null,p_retry uuid default null)
returns public.sq_sp_jobs language plpgsql security definer set search_path='' as $$
declare
  job public.sq_sp_jobs;
  bucket record;
  target uuid:=p_target;
  job_kind text:=p_kind;
  credit_kind text;
  parked constant timestamptz:='9999-12-31T23:59:59.999Z';
  queued_at timestamptz:=case when p_local then parked else now() end;
begin
  perform pg_advisory_xact_lock(hashtextextended('speaking-billing:'||p_scope||':'||p_user::text,0));
  if p_retry is null then
    select * into job from public.sq_sp_jobs where user_id=p_user and job_key=p_key;
    if found then return job; end if;
  else
    select * into job from public.sq_sp_jobs where user_id=p_user and id=p_retry for update;
    if not found then raise exception 'BILLING_JOB_NOT_FOUND'; end if;
    if job.status not in ('failed','cancelled') then return job; end if;
    target:=job.target_id;
    job_kind:=job.kind;
  end if;
  if job_kind not in ('assess','practice') or p_scope not in ('test','live') then raise exception 'BILLING_INPUT'; end if;
  select case when job_kind='assess' and payload->>'attemptKind' is distinct from 'weekly_check' then 'full' else 'short' end
  into credit_kind from public.sq_sp_records where id=target and user_id=p_user;
  if not found then raise exception 'BILLING_JOB_NOT_FOUND'; end if;
  select b.order_id into bucket from public.sq_speaking_credit_balances(p_user,p_scope) b
  where case credit_kind when 'full' then b.full_left else b.short_left end >0
  order by b.expires_at nulls last,b.order_id limit 1;
  if not found then raise exception 'SPEAKING_CREDITS'; end if;

  if p_retry is null then
    insert into public.sq_sp_jobs(user_id,kind,target_id,job_key,available_at,lease_until)
    values(p_user,job_kind,target,p_key,queued_at,case when p_local then now() end) returning * into job;
  else
    update public.sq_sp_jobs set status='queued',attempts=0,last_error=null,available_at=queued_at,lease_token=null,
      lease_until=case when p_local then now() end,updated_at=now()
    where id=p_retry returning * into job;
  end if;
  insert into public.sq_speaking_credits(job_id,user_id,scope,order_id,kind)
  values(job.id,p_user,p_scope,bucket.order_id,credit_kind)
  on conflict(job_id) do update set scope=excluded.scope,order_id=excluded.order_id,kind=excluded.kind;
  return job;
end
$$;

create or replace function public.sq_speaking_mark_credit() returns trigger language plpgsql security definer set search_path='' as $$
begin
  update public.sq_speaking_credits set completed=true where job_id=new.id;
  return new;
end
$$;
drop trigger if exists sq_speaking_mark_credit on public.sq_sp_jobs;
create trigger sq_speaking_mark_credit after update of status on public.sq_sp_jobs
for each row when (new.status='completed' and old.status is distinct from new.status)
execute function public.sq_speaking_mark_credit();

revoke all on function public.sq_speaking_open_order(uuid,text,text,integer),
  public.sq_speaking_open_purchase(uuid,text,text,integer,text),
  public.sq_speaking_transfer_orders(uuid,text),public.sq_speaking_approve_transfer(uuid,uuid,text,uuid,text),
  public.sq_payme_transaction(text,text,uuid,text,integer,bigint,integer,bigint,bigint),
  public.sq_speaking_credit_balances(uuid,text),public.sq_speaking_billing_status(uuid,text,uuid),
  public.sq_speaking_billed_job(uuid,text,boolean,text,uuid,text,uuid),public.sq_speaking_mark_credit() from public,anon,authenticated;
grant execute on function public.sq_speaking_open_order(uuid,text,text,integer),
  public.sq_speaking_open_purchase(uuid,text,text,integer,text),
  public.sq_speaking_transfer_orders(uuid,text),public.sq_speaking_approve_transfer(uuid,uuid,text,uuid,text),
  public.sq_payme_transaction(text,text,uuid,text,integer,bigint,integer,bigint,bigint),
  public.sq_speaking_billing_status(uuid,text,uuid),public.sq_speaking_billed_job(uuid,text,boolean,text,uuid,text,uuid) to service_role;
notify pgrst, 'reload schema';
commit;
