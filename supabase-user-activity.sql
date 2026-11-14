begin;

create table if not exists public.sq_activity_presence (
  session_id uuid primary key references auth.sessions(id) on delete cascade,
  uid uuid not null references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null
);
alter table public.sq_activity_presence enable row level security;
revoke all on public.sq_activity_presence from public, anon, authenticated;
create index if not exists sq_activity_presence_recent on public.sq_activity_presence(last_seen_at);
create index if not exists sq_activity_presence_user on public.sq_activity_presence(uid,last_seen_at);

-- Existing authentication sessions were counted using a browser-generated ID.
-- Seed their login event once so a reload cannot count the same login again.
insert into public.sq_activity_events(uid,session_id,event)
select s.user_id,s.id::text,'login'
from auth.sessions s
join public.documents a on a.collection='userActivity' and a.id=s.user_id::text
where a.data->'presenceTracked' is distinct from 'true'::jsonb
  and s.created_at <= case when a.data->>'lastLoginAt' ~ '^[0-9]{1,15}$'
    then to_timestamp((a.data->>'lastLoginAt')::bigint / 1000.0) end
on conflict do nothing;

create or replace function public.sq_record_activity(p_event text,p_session text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid();
  auth_session_id uuid:=(auth.jwt()->>'session_id')::uuid;
  profile jsonb;
  activity jsonb;
  observed_at timestamptz;
  seen_ms bigint;
  sign_in_ms bigint;
  event_count integer:=0;
begin
  if actor is null or auth_session_id is null or p_event is null
    or p_event not in ('login','logout','heartbeat') then
    raise exception 'Faollik sessiyasi noto‘g‘ri.';
  end if;

  select data into profile from public.documents where collection='profiles' and id=actor::text;
  if coalesce(profile->>'role','') not in ('student','teacher','admin') then
    raise exception 'Faollik sessiyasi noto‘g‘ri.';
  end if;

  perform public.sq_play_limit('activity',12);
  perform pg_advisory_xact_lock(hashtext(actor::text));
  perform 1 from auth.sessions s where s.id=auth_session_id and s.user_id=actor for key share;
  if not found then return jsonb_build_object('ok',false); end if;

  observed_at:=clock_timestamp();
  seen_ms:=floor(extract(epoch from observed_at)*1000);
  select data into activity from public.documents where collection='userActivity' and id=actor::text;

  if p_event in ('login','logout') then
    insert into public.sq_activity_events values(actor,auth_session_id::text,p_event) on conflict do nothing;
    get diagnostics event_count=row_count;
  end if;

  if p_event='logout' then
    delete from public.sq_activity_presence p where p.session_id=auth_session_id;
    if not found and event_count=0 then return jsonb_build_object('ok',true); end if;
  else
    insert into public.sq_activity_presence values(auth_session_id,actor,observed_at)
    on conflict on constraint sq_activity_presence_pkey do update set last_seen_at=excluded.last_seen_at
    where public.sq_activity_presence.last_seen_at < excluded.last_seen_at-interval '20 seconds';
    if not found and event_count=0 then return jsonb_build_object('ok',true); end if;
  end if;

  select floor(extract(epoch from u.last_sign_in_at)*1000) into sign_in_ms from auth.users u where u.id=actor;
  activity:=coalesce(activity,'{}')||jsonb_build_object(
    'uid',actor::text,'name',profile->>'name','email',profile->>'email','role',profile->>'role',
    'lastSeenAt',seen_ms,'presenceTracked',true,
    'online',exists(select 1 from public.sq_activity_presence p where p.uid=actor and p.last_seen_at>observed_at-interval '5 minutes'),
    'loginCount',coalesce((activity->>'loginCount')::bigint,0)+case when p_event='login' then event_count else 0 end,
    'logoutCount',coalesce((activity->>'logoutCount')::bigint,0)+case when p_event='logout' then event_count else 0 end,
    'lastEvent',p_event
  );
  if sign_in_ms is not null then
    activity:=activity||jsonb_build_object('lastLoginAt',sign_in_ms);
  end if;
  if p_event='logout' and event_count=1 then
    activity:=activity||jsonb_build_object('lastLogoutAt',seen_ms);
  end if;

  insert into public.documents(collection,id,data) values('userActivity',actor::text,activity)
  on conflict(collection,id) do update set data=excluded.data,updated_at=now();
  return jsonb_build_object('ok',true);
end
$$;

create or replace function public.sq_admin_user_page(p_search text default '',p_role text default '',p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  observed_at timestamptz:=statement_timestamp();
  now_ms bigint:=floor(extract(epoch from observed_at)*1000);
  day_ms bigint:=floor(extract(epoch from date_trunc('day',observed_at at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent')*1000);
  search_term text:=lower(left(trim(coalesce(p_search,'')),100));
begin
  if auth.uid() is null or not coalesce(public.sq_is_admin(),false) then
    raise exception 'Administrator ruxsati kerak.';
  end if;

  return (
    with active_sessions as (
      select distinct uid from public.sq_activity_presence where last_seen_at>observed_at-interval '5 minutes'
    ), users_with_activity as (
      select p.id,p.data as profile,
        a.data as activity,
        case when a.data->>'lastSeenAt' ~ '^[0-9]{1,15}$' then (a.data->>'lastSeenAt')::bigint end as last_seen,
        coalesce(floor(extract(epoch from u.last_sign_in_at)*1000)::bigint,
          case when a.data->>'lastLoginAt' ~ '^[0-9]{1,15}$' then (a.data->>'lastLoginAt')::bigint end) as last_login,
        case when a.data->>'loginCount' ~ '^[0-9]{1,15}$' then (a.data->>'loginCount')::bigint else 0 end as logins,
        case when a.data->>'logoutCount' ~ '^[0-9]{1,15}$' then (a.data->>'logoutCount')::bigint else 0 end as logouts,
        s.uid is not null as session_active
      from public.documents p
      left join public.documents a on a.collection='userActivity' and a.id=p.id
      left join auth.users u on u.id=case when p.id ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' then p.id::uuid end
      left join active_sessions s on s.uid=u.id
      where p.collection='profiles'
    ), accounts as (
      select *,session_active or (
        activity->'presenceTracked' is distinct from 'true'::jsonb
        and activity->'online' is distinct from 'false'::jsonb
        and activity->>'lastEvent' is distinct from 'logout'
        and coalesce(last_seen between now_ms-299999 and now_ms,false)
      ) as online
      from users_with_activity
    ), totals as (
      select count(*) as users,
        count(*) filter(where profile->>'role'='teacher') as teachers,
        count(*) filter(where profile->>'role'='student') as students,
        count(*) filter(where profile->>'role'='admin') as admins,
        count(*) filter(where online) as active,
        count(*) filter(where greatest(last_seen,last_login)>=day_ms) as today,
        coalesce(sum(logins),0) as logins,
        coalesce(sum(logouts),0) as logouts
      from accounts
    ), matches as (
      select * from accounts
      where (coalesce(p_role,'')='' or profile->>'role'=p_role)
        and position(search_term in lower(coalesce(profile->>'name','')||' '||coalesce(profile->>'email','')))>0
    ), pages as (
      select count(*) as matches,greatest(1,(count(*)+49)/50) as page_count from matches
    ), bounds as (
      select matches,page_count,least(greatest(coalesce(p_page,1),1),page_count) as page from pages
    ), page_rows as (
      select * from matches
      order by online desc,last_login desc nulls last,last_seen desc nulls last,id
      limit 50 offset (select (page-1)*50 from bounds)
    )
    select jsonb_build_object(
      'totalUsers',totals.users,
      'teachers',totals.teachers,
      'students',totals.students,
      'admins',totals.admins,
      'activeUsers',totals.active,
      'todayUsers',totals.today,
      'totalLogins',totals.logins,
      'totalLogouts',totals.logouts,
      'generatedAt',now_ms,
      'page',(select page from bounds),
      'pageCount',(select page_count from bounds),
      'filteredUsers',(select matches from bounds),
      'users',coalesce((select jsonb_agg(jsonb_build_object(
        'id',id,'name',profile->>'name','email',profile->>'email','role',profile->>'role','provider',profile->>'provider',
        'activity',jsonb_build_object('online',online,'lastSeenAt',last_seen,'lastLoginAt',last_login,'loginCount',logins,'logoutCount',logouts)
      ) order by online desc,last_login desc nulls last,last_seen desc nulls last,id) from page_rows),'[]'::jsonb)
    ) from totals
  );
end
$$;

revoke all on function public.sq_record_activity(text,text),public.sq_admin_user_page(text,text,integer) from public,anon;
grant execute on function public.sq_record_activity(text,text),public.sq_admin_user_page(text,text,integer) to authenticated;
notify pgrst, 'reload schema';

commit;
