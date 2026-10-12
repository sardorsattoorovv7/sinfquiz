-- SinfQuiz 7.30: separate tables, existing Auth and class membership unchanged.
begin;
create table if not exists public.sq_space_catalog(id text primary key,title text not null,spec jsonb not null);
create table if not exists public.sq_space_configs(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 topic_id text not null references public.sq_space_catalog(id),title text not null check(length(btrim(title)) between 4 and 100),
 notes text not null check(length(btrim(notes)) between 12 and 900),parameters jsonb not null,
 visibility text not null check(visibility in ('private','group','public')),group_id uuid references public.sq_class_groups(id) on delete cascade,
 status text not null check(status in ('pending','published','rejected')),active boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check((visibility='group' and group_id is not null) or (visibility<>'group' and group_id is null))
);
create table if not exists public.sq_space_attempts(
 id uuid primary key default gen_random_uuid(),student_id uuid not null references auth.users(id) on delete cascade,
 student_name text not null,topic_id text not null references public.sq_space_catalog(id),topic_title text not null,
 assignment_id uuid references public.sq_space_configs(id) on delete set null,data jsonb not null check(octet_length(data::text)<24000),
 client_token uuid not null,passed boolean not null,feedback text not null default '' check(length(feedback)<=1500),
 created_at timestamptz not null default now(),reviewed_at timestamptz,unique(student_id,client_token)
);
create index if not exists sq_space_owner_idx on public.sq_space_configs(owner_id,updated_at desc);
create index if not exists sq_space_group_idx on public.sq_space_configs(group_id) where active;
create index if not exists sq_space_user_results_idx on public.sq_space_attempts(student_id,created_at desc);
create index if not exists sq_space_assignment_results_idx on public.sq_space_attempts(assignment_id,created_at desc);
alter table public.sq_space_catalog enable row level security;
alter table public.sq_space_configs enable row level security;
alter table public.sq_space_attempts enable row level security;
revoke all on public.sq_space_catalog,public.sq_space_configs,public.sq_space_attempts from public,anon,authenticated;
grant select on public.sq_space_configs,public.sq_space_attempts to authenticated;

create or replace function public.sq_space_owns(p_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.sq_space_configs c where c.id=p_id and c.owner_id=auth.uid());
$$;
create or replace function public.sq_space_can_read(p_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select auth.uid() is not null and exists(select 1 from public.sq_space_configs c where c.id=p_id and
 (public.sq_is_admin() or c.owner_id=auth.uid() or (c.active and c.status='published' and
 (c.visibility='public' or (c.visibility='group' and exists(select 1 from public.sq_class_members m join public.sq_class_groups g on g.id=m.group_id where m.group_id=c.group_id and m.student_id=auth.uid() and g.active))))));
$$;
revoke all on function public.sq_space_owns(uuid),public.sq_space_can_read(uuid) from public,anon;
grant execute on function public.sq_space_owns(uuid),public.sq_space_can_read(uuid) to authenticated;
drop policy if exists sq_space_config_read on public.sq_space_configs;
create policy sq_space_config_read on public.sq_space_configs for select to authenticated using(public.sq_space_can_read(id));
drop policy if exists sq_space_attempt_read on public.sq_space_attempts;
create policy sq_space_attempt_read on public.sq_space_attempts for select to authenticated using(student_id=auth.uid() or public.sq_is_admin() or public.sq_space_owns(assignment_id));

create or replace function public.sq_space_params(p_topic text,p_params jsonb) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_spec jsonb;v_control jsonb;v_value jsonb;v_key text;v_result jsonb:='{}';v_number numeric;
begin
 select cat.spec into v_spec from public.sq_space_catalog cat where cat.id=p_topic;
 if v_spec is null then raise exception 'Hodisa topilmadi.';end if;
 if jsonb_typeof(p_params) is distinct from 'object' or octet_length(p_params::text)>2500 then raise exception 'Parametrlar noto‘g‘ri.';end if;
 if exists(select 1 from jsonb_object_keys(p_params) k where not exists(select 1 from jsonb_array_elements(v_spec->'controls') c where c->>'key'=k)) then raise exception 'Noma’lum parametr.';end if;
 for v_control in select value from jsonb_array_elements(v_spec->'controls') loop
  v_key:=v_control->>'key';v_value:=coalesce(p_params->v_key,v_control->'value');
  if v_control->>'type'='select' then
   if jsonb_typeof(v_value) is distinct from 'string' or not exists(select 1 from jsonb_array_elements(v_control->'options') o where o->0=v_value) then raise exception 'Tanlov parametri noto‘g‘ri.';end if;
  else
   if jsonb_typeof(v_value) is distinct from 'number' then raise exception 'Sonli parametr kerak.';end if;v_number:=(v_value#>>'{}')::numeric;
   if v_number<(v_control->>'min')::numeric or v_number>(v_control->>'max')::numeric then raise exception 'Parametr ruxsat etilgan oraliqdan tashqarida.';end if;
  end if;
  v_result:=v_result||jsonb_build_object(v_key,v_value);
 end loop;return v_result;
end;$$;
revoke all on function public.sq_space_params(text,jsonb) from public,anon,authenticated;

create or replace function public.sq_space(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_uid uuid:=auth.uid();v_staff boolean;v_admin boolean;v_role text;v_name text;
 v_id uuid;v_config public.sq_space_configs;v_attempt public.sq_space_attempts;
 v_topic text;v_title text;v_notes text;v_visibility text;v_group uuid;v_status text;v_params jsonb;v_active boolean;
 v_token uuid;v_assignment uuid;v_spec jsonb;v_prediction text;v_conclusion text;
 v_trials jsonb:='[]';v_trial jsonb;v_metrics jsonb;v_metric jsonb;v_metric_clean jsonb;v_progress numeric;
 v_choice integer;v_hints integer;v_wrong integer;v_distinct integer;v_offset integer;v_result jsonb;
begin
 if v_uid is null then raise exception 'Hisobga kiring.';end if;
 select d.data->>'role',coalesce(d.data->>'name','O‘quvchi') into v_role,v_name from public.documents d where d.collection='profiles' and d.id=v_uid::text;
 if v_role is null or v_role not in ('student','teacher','admin') then raise exception 'Profil ruxsati topilmadi.';end if;
 v_admin:=coalesce(public.sq_is_admin(),false);v_staff:=v_admin or coalesce(public.sq_is_teacher(),false);
 if p_payload is null or jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>28000 then raise exception 'So‘rov hajmi yoki turi noto‘g‘ri.';end if;
 if p_action='catalog' then
  select coalesce(jsonb_agg(to_jsonb(c) order by c.updated_at desc),'[]') into v_result from (select sc.* from public.sq_space_configs sc where public.sq_space_can_read(sc.id) order by sc.updated_at desc limit 200)c;
  return jsonb_build_object('configs',v_result);
 elsif p_action='save' then
  if not v_staff then raise exception 'Faqat ustoz va admin tajriba yaratadi.';end if;
  v_id:=coalesce(nullif(p_payload->>'id','')::uuid,gen_random_uuid());
  select * into v_config from public.sq_space_configs c where c.id=v_id for update;
  if found and v_config.owner_id<>v_uid then raise exception 'Bu tajriba boshqa ustozga tegishli.';end if;
  v_topic:=p_payload->>'topic_id';v_title:=btrim(p_payload->>'title');v_notes:=btrim(p_payload->>'notes');v_visibility:=coalesce(p_payload->>'visibility','private');
  if v_title is null or length(v_title) not between 4 and 100 or v_notes is null or length(v_notes) not between 12 and 900 then raise exception 'Sarlavha va ko‘rsatma uzunligini tekshiring.';end if;
  if v_visibility not in ('private','group','public') then raise exception 'Ko‘rinish noto‘g‘ri.';end if;
  v_group:=case when v_visibility='group' then nullif(p_payload->>'group_id','')::uuid else null end;
  if v_visibility='group' and not exists(select 1 from public.sq_class_groups g where g.id=v_group and g.owner_id=v_uid and g.active) then raise exception 'Faqat o‘zingizning faol guruhingizga biriktiring.';end if;
  v_params:=public.sq_space_params(v_topic,coalesce(p_payload->'parameters','{}'));
  if p_payload ? 'active' and jsonb_typeof(p_payload->'active') is distinct from 'boolean' then raise exception 'Faollik turi noto‘g‘ri.';end if;
  v_active:=coalesce((p_payload->>'active')::boolean,true);v_status:=case when v_visibility='public' and not v_admin then 'pending' else 'published' end;
  if v_config.id is null and (select count(*) from public.sq_space_configs c where c.owner_id=v_uid)>=100 then raise exception '100 tajriba chegarasi. Mavjud ishni tahrirlang.';end if;
  perform public.sq_limit_action('space_save',6,100);
  insert into public.sq_space_configs(id,owner_id,topic_id,title,notes,parameters,visibility,group_id,status,active)
  values(v_id,v_uid,v_topic,v_title,v_notes,v_params,v_visibility,v_group,v_status,v_active)
  on conflict(id) do update set topic_id=excluded.topic_id,title=excluded.title,notes=excluded.notes,parameters=excluded.parameters,visibility=excluded.visibility,group_id=excluded.group_id,status=excluded.status,active=excluded.active,updated_at=now()
  where sq_space_configs.owner_id=v_uid returning * into v_config;
  if v_config.id is null then raise exception 'Bu tajriba boshqa ustozga tegishli.';end if;
  return to_jsonb(v_config);
 elsif p_action in ('toggle','review') then
  v_id:=(p_payload->>'id')::uuid;select * into v_config from public.sq_space_configs c where c.id=v_id for update;
  if v_config.id is null then raise exception 'Tajriba topilmadi.';end if;
  if p_action='toggle' then
   if not v_staff or v_config.owner_id<>v_uid then raise exception 'Faqat o‘zingizning tajribangizni o‘zgartiring.';end if;
   if jsonb_typeof(p_payload->'active') is distinct from 'boolean' then raise exception 'Faollik turi noto‘g‘ri.';end if;
   update public.sq_space_configs c set active=(p_payload->>'active')::boolean,updated_at=now() where c.id=v_id returning * into v_config;
  else
   v_status:=p_payload->>'status';if not v_admin or v_config.visibility<>'public' or v_status not in ('published','rejected') then raise exception 'Tasdiqlash faqat administrator uchun.';end if;
   update public.sq_space_configs c set status=v_status,updated_at=now() where c.id=v_id returning * into v_config;
  end if;return to_jsonb(v_config);
 elsif p_action='submit' then
  v_token:=(p_payload->>'client_token')::uuid;if v_token is null then raise exception 'Qayta yuborish kaliti kerak.';end if;
  select * into v_attempt from public.sq_space_attempts a where a.student_id=v_uid and a.client_token=v_token;
  if found then return to_jsonb(v_attempt);end if;
  v_topic:=p_payload->>'topic_id';select cat.spec,cat.title into v_spec,v_title from public.sq_space_catalog cat where cat.id=v_topic;
  if v_spec is null then raise exception 'Hodisa topilmadi.';end if;
  v_assignment:=nullif(p_payload->>'assignment_id','')::uuid;
  if v_assignment is not null then
   select * into v_config from public.sq_space_configs c where c.id=v_assignment;
   if v_config.id is null or not public.sq_space_can_read(v_assignment) or not v_config.active or v_config.status<>'published' or v_config.topic_id<>v_topic then raise exception 'Biriktirilgan ish uchun ruxsat yo‘q yoki yopilgan.';end if;
  end if;
  if jsonb_typeof(p_payload->'prediction') is distinct from 'string' or jsonb_typeof(p_payload->'conclusion') is distinct from 'string' then raise exception 'Taxmin va xulosa matn bo‘lsin.';end if;
  v_prediction:=btrim(p_payload->>'prediction');v_conclusion:=btrim(p_payload->>'conclusion');
  if length(v_prediction) not between 6 and 400 or length(v_conclusion) not between 12 and 1200 then raise exception 'Taxmin va xulosa uzunligini tekshiring.';end if;
  if jsonb_typeof(p_payload->'trials') is distinct from 'array' or jsonb_array_length(p_payload->'trials') not between 2 and 8 then raise exception 'Ikki yoki undan ko‘p sinov kerak.';end if;
  for v_trial in select value from jsonb_array_elements(p_payload->'trials') loop
   if jsonb_typeof(v_trial) is distinct from 'object' then raise exception 'Sinov turi noto‘g‘ri.';end if;
   v_params:=public.sq_space_params(v_topic,v_trial->'parameters');
   if jsonb_typeof(v_trial->'progress') is distinct from 'number' then raise exception 'Vaqt qiymati son bo‘lsin.';end if;
   v_progress:=(v_trial->>'progress')::numeric;if v_progress<0 or v_progress>1 then raise exception 'Vaqt 0–1 oralig‘ida bo‘lsin.';end if;
   v_metrics:=v_trial->'metrics';if jsonb_typeof(v_metrics) is distinct from 'array' or jsonb_array_length(v_metrics) not between 1 and 8 or octet_length(v_metrics::text)>3000 then raise exception 'O‘lchovlar noto‘g‘ri.';end if;
   v_metric_clean:='[]';
   for v_metric in select value from jsonb_array_elements(v_metrics) loop
    if jsonb_typeof(v_metric) is distinct from 'object' or jsonb_typeof(v_metric->'label') is distinct from 'string' or length(v_metric->>'label') not between 1 and 100 or jsonb_typeof(v_metric->'value') is distinct from 'number' or abs((v_metric->>'value')::numeric)>1e80 or jsonb_typeof(v_metric->'unit') is distinct from 'string' or length(v_metric->>'unit')>25 then raise exception 'O‘lchov matni va qiymati noto‘g‘ri.';end if;
    v_metric_clean:=v_metric_clean||jsonb_build_array(jsonb_build_object('label',v_metric->>'label','value',v_metric->'value','unit',v_metric->>'unit'));
   end loop;
   v_trials:=v_trials||jsonb_build_array(jsonb_build_object('parameters',v_params,'progress',v_progress,'metrics',v_metric_clean));
  end loop;
  select count(distinct (j->'parameters')) into v_distinct from jsonb_array_elements(v_trials)j;
  if v_distinct<2 then raise exception 'Kamida ikki xil parametrli sinov kerak.';end if;
  if jsonb_typeof(p_payload->'choice') is distinct from 'number' or (p_payload->>'choice')!~'^[0-2]$' or jsonb_typeof(p_payload->'hints') is distinct from 'number' or (p_payload->>'hints')!~'^[0-3]$' or jsonb_typeof(p_payload->'wrongChecks') is distinct from 'number' or (p_payload->>'wrongChecks')!~'^[0-9]{1,3}$' then raise exception 'Tekshiruv va yordam qiymatlari noto‘g‘ri.';end if;
  v_choice:=(p_payload->>'choice')::integer;v_hints:=(p_payload->>'hints')::integer;v_wrong:=(p_payload->>'wrongChecks')::integer;
  if v_wrong>100 then raise exception 'Tekshiruvlar chegarasi oshdi.';end if;
  if v_choice<>(v_spec->>'answer')::integer then raise exception 'Tushuncha savolini yana tekshiring.';end if;
  perform public.sq_limit_action('space_submit',6,200);
  insert into public.sq_space_attempts(student_id,student_name,topic_id,topic_title,assignment_id,data,client_token,passed)
  values(v_uid,left(v_name,100),v_topic,v_title,v_assignment,jsonb_build_object('prediction',v_prediction,'conclusion',v_conclusion,'trials',v_trials,'choice',v_choice,'hints',v_hints,'wrongChecks',v_wrong),v_token,true)
  on conflict(student_id,client_token) do nothing returning * into v_attempt;
  if v_attempt.id is null then select * into v_attempt from public.sq_space_attempts a where a.student_id=v_uid and a.client_token=v_token;end if;
  return to_jsonb(v_attempt);
 elsif p_action='results' then
  v_offset:=coalesce((p_payload->>'offset')::integer,0);if v_offset<0 or v_offset>10000 then raise exception 'Sahifa chegarasi.';end if;
  select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc),'[]') into v_result from(
   select a.*,c.owner_id from public.sq_space_attempts a left join public.sq_space_configs c on c.id=a.assignment_id
   where a.student_id=v_uid or v_admin or (v_staff and c.owner_id=v_uid) order by a.created_at desc,a.id limit 100 offset v_offset
  )r;return jsonb_build_object('results',v_result);
 elsif p_action='feedback' then
  v_id:=(p_payload->>'id')::uuid;select * into v_attempt from public.sq_space_attempts a where a.id=v_id for update;
  if not v_staff or v_attempt.id is null or not (v_admin or public.sq_space_owns(v_attempt.assignment_id)) then raise exception 'Bu natija uchun ruxsat yo‘q.';end if;
  if jsonb_typeof(p_payload->'feedback') is distinct from 'string' or length(p_payload->>'feedback')>1500 then raise exception 'Fikr matni noto‘g‘ri.';end if;
  update public.sq_space_attempts a set feedback=btrim(p_payload->>'feedback'),reviewed_at=now() where a.id=v_id returning * into v_attempt;return to_jsonb(v_attempt);
 else raise exception 'Amal topilmadi.';end if;
end;$$;
revoke all on function public.sq_space(text,jsonb) from public,anon;
grant execute on function public.sq_space(text,jsonb) to authenticated;
-- Catalog seed is appended by scripts/build-space-730.mjs before commit.

insert into public.sq_space_catalog(id,title,spec) values
('solar-system','Quyosh tizimi','{"controls":[{"key":"radius","label":"Katta yarim o‘q","min":0.4,"max":10,"step":0.1,"value":1,"unit":"AU","type":"range"},{"key":"eccentricity","label":"Ekssentrisitet","min":0,"max":0.75,"step":0.01,"value":0.1,"unit":"","type":"range"}],"answer":0}'::jsonb),
('day-night','Kun va tun','{"controls":[{"key":"tilt","label":"O‘q og‘ishi","min":0,"max":90,"step":0.1,"value":23.4,"unit":"°","type":"range"},{"key":"latitude","label":"Geografik kenglik","min":-80,"max":80,"step":1,"value":41,"unit":"°","type":"range"},{"key":"season","label":"Yillik holat","min":0,"max":360,"step":1,"value":90,"unit":"°","type":"range"}],"answer":1}'::jsonb),
('axial-tilt','Yer o‘qi va fasllar','{"controls":[{"key":"tilt","label":"O‘q og‘ishi","min":0,"max":90,"step":0.1,"value":23.4,"unit":"°","type":"range"},{"key":"latitude","label":"Geografik kenglik","min":-80,"max":80,"step":1,"value":41,"unit":"°","type":"range"},{"key":"season","label":"Yillik holat","min":0,"max":360,"step":1,"value":90,"unit":"°","type":"range"}],"answer":2}'::jsonb),
('sun-distance','Quyosh yaqinlashsa','{"controls":[{"key":"distance","label":"Quyoshgacha masofa","min":0.5,"max":1.5,"step":0.01,"value":1,"unit":"AU","type":"range"},{"key":"albedo","label":"Qaytarilgan yorug‘lik ulushi","min":0,"max":0.8,"step":0.01,"value":0.3,"unit":"","type":"range"}],"answer":0}'::jsonb),
('moon-distance','Oy yaqinlashsa: suv qalqishi','{"controls":[{"key":"distance","label":"Oygacha masofa","min":180000,"max":600000,"step":100,"value":384400,"unit":"km","type":"range"},{"key":"phase","label":"Oy yo‘nalishi","min":0,"max":360,"step":1,"value":0,"unit":"°","type":"range"}],"answer":1}'::jsonb),
('orbit','Sun’iy yo‘ldosh orbitasi','{"controls":[{"key":"height","label":"Boshlang‘ich balandlik","min":200,"max":36000,"step":100,"value":400,"unit":"km","type":"range"},{"key":"speed","label":"Tangensial tezlik","min":1,"max":13,"step":0.1,"value":7.7,"unit":"km/s","type":"range"}],"answer":2}'::jsonb),
('gravity','Massa va og‘irlik','{"controls":[{"key":"mass","label":"Jism massasi","min":1,"max":100,"step":1,"value":50,"unit":"kg","type":"range"},{"key":"world","label":"Osmon jismi","value":"earth","options":[["earth","Yer"],["moon","Oy"],["mars","Mars"]],"type":"select"}],"answer":0}'::jsonb),
('rocket','Raketa va reaktiv harakat','{"controls":[{"key":"ratio","label":"Boshlang‘ich / oxirgi massa","min":1.1,"max":10,"step":0.1,"value":3,"unit":"","type":"range"},{"key":"exhaust","label":"Gaz chiqish tezligi","min":1,"max":4.5,"step":0.1,"value":3,"unit":"km/s","type":"range"}],"answer":1}'::jsonb),
('stellar-life','Yulduz hayoti','{"controls":[{"key":"mass","label":"Boshlang‘ich massa","min":0.5,"max":30,"step":0.5,"value":15,"unit":"M☉","type":"range"},{"key":"age","label":"Evolyutsiya bosqichi","min":0,"max":100,"step":1,"value":40,"unit":"%","type":"range"}],"answer":2}'::jsonb),
('blackhole-tides','Qora tuynuk va cho‘zilish','{"controls":[{"key":"mass","label":"Massa","min":3,"max":100,"step":1,"value":10,"unit":"M☉","type":"range"},{"key":"distance","label":"Markazgacha masofa","min":1.2,"max":15,"step":0.1,"value":5,"unit":"rₛ","type":"range"}],"answer":0}'::jsonb),
('supernova','Supernova','{"controls":[{"key":"mass","label":"Boshlang‘ich massa","min":0.5,"max":30,"step":0.5,"value":15,"unit":"M☉","type":"range"},{"key":"age","label":"Evolyutsiya bosqichi","min":0,"max":100,"step":1,"value":95,"unit":"%","type":"range"}],"answer":1}'::jsonb),
('cosmic-scale','Koinot masshtablari','{"controls":[{"key":"zoom","label":"Masshtab pog‘onasi","min":0,"max":8,"step":1,"value":3,"unit":"","type":"range"}],"answer":2}'::jsonb),
('aurora','Qutb yog‘dusi','{"controls":[{"key":"activity","label":"Faollik","min":0.1,"max":3,"step":0.1,"value":1,"unit":"","type":"range"},{"key":"field","label":"Magnit maydon yo‘nalishi","min":-1,"max":1,"step":0.1,"value":-0.5,"unit":"","type":"range"},{"key":"latitude","label":"Kenglik","min":0,"max":90,"step":1,"value":65,"unit":"°","type":"range"}],"answer":0}'::jsonb),
('solar-wind','Quyosh shamoli','{"controls":[{"key":"activity","label":"Faollik","min":0.1,"max":3,"step":0.1,"value":1,"unit":"","type":"range"},{"key":"field","label":"Magnit maydon yo‘nalishi","min":-1,"max":1,"step":0.1,"value":-0.5,"unit":"","type":"range"},{"key":"latitude","label":"Kenglik","min":0,"max":90,"step":1,"value":65,"unit":"°","type":"range"}],"answer":1}'::jsonb),
('sunspots','Quyosh dog‘lari','{"controls":[{"key":"activity","label":"Faollik","min":0.1,"max":3,"step":0.1,"value":1,"unit":"","type":"range"}],"answer":2}'::jsonb),
('solar-flare','Quyosh chaqnashi','{"controls":[{"key":"activity","label":"Faollik","min":0.1,"max":3,"step":0.1,"value":1,"unit":"","type":"range"},{"key":"field","label":"Magnit maydon yo‘nalishi","min":-1,"max":1,"step":0.1,"value":-0.5,"unit":"","type":"range"},{"key":"latitude","label":"Kenglik","min":0,"max":90,"step":1,"value":65,"unit":"°","type":"range"}],"answer":0}'::jsonb),
('cme','Koronal massa otilishi','{"controls":[{"key":"activity","label":"Faollik","min":0.1,"max":3,"step":0.1,"value":1,"unit":"","type":"range"},{"key":"field","label":"Magnit maydon yo‘nalishi","min":-1,"max":1,"step":0.1,"value":-0.5,"unit":"","type":"range"},{"key":"latitude","label":"Kenglik","min":0,"max":90,"step":1,"value":65,"unit":"°","type":"range"},{"key":"direction","label":"Otilish og‘ishi","min":0,"max":90,"step":1,"value":0,"unit":"°","type":"range"}],"answer":1}'::jsonb),
('geomagnetic-storm','Geomagnit bo‘ron','{"controls":[{"key":"activity","label":"Faollik","min":0.1,"max":3,"step":0.1,"value":1,"unit":"","type":"range"},{"key":"field","label":"Magnit maydon yo‘nalishi","min":-1,"max":1,"step":0.1,"value":-0.5,"unit":"","type":"range"},{"key":"latitude","label":"Kenglik","min":0,"max":90,"step":1,"value":65,"unit":"°","type":"range"}],"answer":2}'::jsonb),
('solar-eclipse','Quyosh tutilishi','{"controls":[{"key":"phase","label":"Oy orbital holati","min":0,"max":360,"step":1,"value":0,"unit":"°","type":"range"},{"key":"inclination","label":"Orbita og‘ishi","min":0,"max":10,"step":0.1,"value":5.1,"unit":"°","type":"range"}],"answer":0}'::jsonb),
('lunar-eclipse','Oy tutilishi','{"controls":[{"key":"phase","label":"Oy orbital holati","min":0,"max":360,"step":1,"value":180,"unit":"°","type":"range"},{"key":"inclination","label":"Orbita og‘ishi","min":0,"max":10,"step":0.1,"value":5.1,"unit":"°","type":"range"}],"answer":1}'::jsonb),
('moon-phases','Oy fazalari','{"controls":[{"key":"phase","label":"Oy orbital holati","min":0,"max":360,"step":1,"value":0,"unit":"°","type":"range"},{"key":"inclination","label":"Orbita og‘ishi","min":0,"max":10,"step":0.1,"value":5.1,"unit":"°","type":"range"}],"answer":2}'::jsonb),
('tidal-lock','Oy nega bir tomonini ko‘rsatadi?','{"controls":[{"key":"phase","label":"Oy orbital holati","min":0,"max":360,"step":1,"value":0,"unit":"°","type":"range"}],"answer":0}'::jsonb),
('transit','Ekzosayyora tranziti','{"controls":[{"key":"ratio","label":"Sayyora / yulduz radiusi","min":0.02,"max":0.35,"step":0.01,"value":0.1,"unit":"","type":"range"},{"key":"inclination","label":"Orbita kuzatuvga og‘ishi","min":0,"max":90,"step":1,"value":90,"unit":"°","type":"range"}],"answer":1}'::jsonb),
('retrograde','Teskari ko‘ringan harakat','{"controls":[{"key":"radius","label":"Katta yarim o‘q","min":0.4,"max":10,"step":0.1,"value":1,"unit":"AU","type":"range"},{"key":"eccentricity","label":"Ekssentrisitet","min":0,"max":0.75,"step":0.01,"value":0.1,"unit":"","type":"range"}],"answer":2}'::jsonb),
('resonance','Orbital rezonans','{"controls":[{"key":"inner","label":"Ichki orbitadagi aylanishlar","min":1,"max":4,"step":1,"value":2,"unit":"","type":"range"},{"key":"outer","label":"Tashqi orbitadagi aylanishlar","min":1,"max":4,"step":1,"value":1,"unit":"","type":"range"}],"answer":0}'::jsonb),
('gravity-assist','Gravitatsion manevr','{"controls":[{"key":"speed","label":"Boshlang‘ich tezlik","min":2,"max":20,"step":0.5,"value":8,"unit":"km/s","type":"range"},{"key":"bend","label":"Burilish","min":0,"max":160,"step":1,"value":70,"unit":"°","type":"range"},{"key":"side","label":"Uchib o‘tish tomoni","value":"behind","options":[["behind","Harakat ortidan"],["front","Harakat oldidan"]],"type":"select"}],"answer":1}'::jsonb),
('comet-tail','Kometa dumlari','{"controls":[{"key":"radius","label":"Katta yarim o‘q","min":0.4,"max":10,"step":0.1,"value":1,"unit":"AU","type":"range"},{"key":"eccentricity","label":"Ekssentrisitet","min":0,"max":0.75,"step":0.01,"value":0.1,"unit":"","type":"range"}],"answer":2}'::jsonb),
('meteor-entry','Meteor: atmosferaga kirish','{"controls":[{"key":"diameter","label":"Diametr","min":0.02,"max":1000,"step":0.01,"value":40,"unit":"m","type":"range"},{"key":"speed","label":"Kirish tezligi","min":11,"max":72,"step":0.5,"value":20,"unit":"km/s","type":"range"},{"key":"angle","label":"Kirish burchagi","min":10,"max":90,"step":1,"value":45,"unit":"°","type":"range"},{"key":"material","label":"Tarkib","value":"stone","options":[["stone","Tosh"],["iron","Temir"],["ice","G‘ovak muz"]],"type":"select"},{"key":"surface","label":"Sirt","value":"land","options":[["land","Quruqlik"],["water","Suv"]],"type":"select"}],"answer":0}'::jsonb),
('meteor-shower','Meteor yomg‘iri','{"controls":[{"key":"count","label":"Oqimdagi zarrachalar","min":10,"max":120,"step":1,"value":40,"unit":"","type":"range"},{"key":"phase","label":"Yer orbital holati","min":0,"max":360,"step":1,"value":180,"unit":"°","type":"range"}],"answer":1}'::jsonb),
('meteor-impact','Meteorit Yerga tushsa','{"controls":[{"key":"diameter","label":"Diametr","min":0.02,"max":1000,"step":0.01,"value":120,"unit":"m","type":"range"},{"key":"speed","label":"Kirish tezligi","min":11,"max":72,"step":0.5,"value":20,"unit":"km/s","type":"range"},{"key":"angle","label":"Kirish burchagi","min":10,"max":90,"step":1,"value":45,"unit":"°","type":"range"},{"key":"material","label":"Tarkib","value":"iron","options":[["stone","Tosh"],["iron","Temir"],["ice","G‘ovak muz"]],"type":"select"},{"key":"surface","label":"Sirt","value":"land","options":[["land","Quruqlik"],["water","Suv"]],"type":"select"}],"answer":2}'::jsonb),
('planet-rings','Sayyora halqalari','{"controls":[{"key":"radius","label":"Halqa tashqi radiusi","min":1.4,"max":3.5,"step":0.05,"value":2.3,"unit":"jism radiusi","type":"range"},{"key":"eccentricity","label":"Zarracha orbitasi cho‘ziqligi","min":0,"max":0.6,"step":0.01,"value":0.05,"unit":"","type":"range"}],"answer":0}'::jsonb),
('protoplanetary-disk','Sayyoralar tug‘iladigan disk','{"controls":[{"key":"radius","label":"Katta yarim o‘q","min":0.4,"max":10,"step":0.1,"value":1,"unit":"AU","type":"range"},{"key":"eccentricity","label":"Ekssentrisitet","min":0,"max":0.75,"step":0.01,"value":0.1,"unit":"","type":"range"}],"answer":1}'::jsonb),
('protostar','Yosh yulduz','{"controls":[{"key":"mass","label":"Boshlang‘ich massa","min":0.5,"max":30,"step":0.5,"value":1,"unit":"M☉","type":"range"},{"key":"age","label":"Evolyutsiya bosqichi","min":0,"max":100,"step":1,"value":10,"unit":"%","type":"range"}],"answer":2}'::jsonb),
('red-giant','Qizil gigant','{"controls":[{"key":"mass","label":"Boshlang‘ich massa","min":0.5,"max":7.5,"step":0.5,"value":1,"unit":"M☉","type":"range"},{"key":"age","label":"Evolyutsiya bosqichi","min":0,"max":100,"step":1,"value":78,"unit":"%","type":"range"}],"answer":0}'::jsonb),
('planetary-nebula','Planetar tumanlik','{"controls":[{"key":"mass","label":"Boshlang‘ich massa","min":0.5,"max":7.5,"step":0.5,"value":1,"unit":"M☉","type":"range"},{"key":"age","label":"Evolyutsiya bosqichi","min":0,"max":100,"step":1,"value":95,"unit":"%","type":"range"}],"answer":1}'::jsonb),
('white-dwarf','Oq mitti','{"controls":[{"key":"mass","label":"Boshlang‘ich massa","min":0.5,"max":7.5,"step":0.5,"value":1,"unit":"M☉","type":"range"},{"key":"age","label":"Evolyutsiya bosqichi","min":0,"max":100,"step":1,"value":95,"unit":"%","type":"range"}],"answer":2}'::jsonb),
('nova','Nova: qayta chaqnash','{"controls":[{"key":"separation","label":"Yulduzlar oralig‘i","min":1,"max":8,"step":0.1,"value":4,"unit":"","type":"range"},{"key":"inclination","label":"Kuzatuv og‘ishi","min":0,"max":90,"step":1,"value":90,"unit":"°","type":"range"}],"answer":0}'::jsonb),
('pulsar','Pulsar mayog‘i','{"controls":[{"key":"spin","label":"Aylanish davri","min":0.1,"max":5,"step":0.1,"value":1,"unit":"s","type":"range"},{"key":"beam","label":"Nur o‘qi og‘ishi","min":0,"max":90,"step":1,"value":45,"unit":"°","type":"range"}],"answer":1}'::jsonb),
('magnetar','Magnetar','{"controls":[{"key":"spin","label":"Aylanish davri","min":0.1,"max":5,"step":0.1,"value":1,"unit":"s","type":"range"},{"key":"beam","label":"Nur o‘qi og‘ishi","min":0,"max":90,"step":1,"value":45,"unit":"°","type":"range"},{"key":"field","label":"Nisbiy maydon kuchi","min":0.5,"max":3,"step":0.1,"value":1,"unit":"","type":"range"}],"answer":2}'::jsonb),
('eclipsing-binary','Tutiluvchi qo‘sh yulduz','{"controls":[{"key":"separation","label":"Yulduzlar oralig‘i","min":1,"max":8,"step":0.1,"value":4,"unit":"","type":"range"},{"key":"inclination","label":"Kuzatuv og‘ishi","min":0,"max":90,"step":1,"value":90,"unit":"°","type":"range"}],"answer":0}'::jsonb),
('neutron-merger','Neytron yulduzlar qo‘shilishi','{"controls":[{"key":"separation","label":"Yulduzlar oralig‘i","min":1,"max":8,"step":0.1,"value":4,"unit":"","type":"range"},{"key":"inclination","label":"Kuzatuv og‘ishi","min":0,"max":90,"step":1,"value":90,"unit":"°","type":"range"}],"answer":1}'::jsonb),
('gamma-burst','Gamma chaqnashi','{"controls":[{"key":"duration","label":"Ko‘rgazmali davomiylik","min":1,"max":10,"step":0.5,"value":3,"unit":"s","type":"range"},{"key":"beam","label":"Nurga nisbatan og‘ish","min":0,"max":90,"step":1,"value":15,"unit":"°","type":"range"}],"answer":2}'::jsonb),
('blackhole-merger','Qora tuynuklar qo‘shilishi','{"controls":[{"key":"separation","label":"Yulduzlar oralig‘i","min":1,"max":8,"step":0.1,"value":4,"unit":"","type":"range"},{"key":"inclination","label":"Kuzatuv og‘ishi","min":0,"max":90,"step":1,"value":90,"unit":"°","type":"range"}],"answer":0}'::jsonb),
('gravitational-waves','Gravitatsion to‘lqinlar','{"controls":[{"key":"frequency","label":"Nisbiy chastota","min":1,"max":8,"step":0.1,"value":3,"unit":"","type":"range"},{"key":"amplitude","label":"Nisbiy deformatsiya","min":0.1,"max":1,"step":0.05,"value":0.4,"unit":"","type":"range"}],"answer":1}'::jsonb),
('accretion-disk','Akkretsiya diski','{"controls":[{"key":"mass","label":"Massa","min":3,"max":100,"step":1,"value":10,"unit":"M☉","type":"range"},{"key":"distance","label":"Markazgacha masofa","min":1.2,"max":15,"step":0.1,"value":5,"unit":"rₛ","type":"range"}],"answer":2}'::jsonb),
('jets','Kosmik jetlar','{"controls":[{"key":"mass","label":"Massa","min":3,"max":100,"step":1,"value":10,"unit":"M☉","type":"range"},{"key":"distance","label":"Markazgacha masofa","min":1.2,"max":15,"step":0.1,"value":5,"unit":"rₛ","type":"range"}],"answer":0}'::jsonb),
('lensing','Gravitatsion linza','{"controls":[{"key":"mass","label":"Massa","min":3,"max":100,"step":1,"value":10,"unit":"M☉","type":"range"},{"key":"distance","label":"Markazgacha masofa","min":1.2,"max":15,"step":0.1,"value":5,"unit":"rₛ","type":"range"}],"answer":1}'::jsonb),
('galaxy-collision','Galaktikalar yaqinlashuvi','{"controls":[{"key":"separation","label":"Markazlar oralig‘i","min":0,"max":10,"step":0.1,"value":6,"unit":"","type":"range"},{"key":"angle","label":"Disklar og‘ishi","min":0,"max":90,"step":1,"value":30,"unit":"°","type":"range"}],"answer":2}'::jsonb),
('galaxy-rotation','Galaktika aylanishi','{"controls":[{"key":"radius","label":"Kuzatuv radiusi","min":0.4,"max":10,"step":0.1,"value":3,"unit":"","type":"range"},{"key":"profile","label":"Tezlik profili","value":"flat","options":[["flat","Tekis tezlik"],["kepler","Markaziy massa"]],"type":"select"}],"answer":0}'::jsonb),
('quasar','Kvazar','{"controls":[{"key":"mass","label":"Markaziy massa","min":1000000,"max":1000000000,"step":1000000,"value":100000000,"unit":"M☉","type":"range"},{"key":"distance","label":"Markazgacha masofa","min":1.2,"max":15,"step":0.1,"value":5,"unit":"rₛ","type":"range"}],"answer":1}'::jsonb),
('cosmic-expansion','Koinot kengayishi','{"controls":[{"key":"scale","label":"Kengayish koeffitsiyenti","min":1,"max":4,"step":0.1,"value":2,"unit":"","type":"range"},{"key":"wavelength","label":"Chiqarilgan to‘lqin","min":400,"max":700,"step":10,"value":500,"unit":"nm","type":"range"}],"answer":2}'::jsonb),
('redshift','Kosmologik qizil siljish','{"controls":[{"key":"scale","label":"Kengayish koeffitsiyenti","min":1,"max":4,"step":0.1,"value":2,"unit":"","type":"range"},{"key":"wavelength","label":"Chiqarilgan to‘lqin","min":400,"max":700,"step":10,"value":500,"unit":"nm","type":"range"}],"answer":0}'::jsonb)
on conflict(id) do update set title=excluded.title,spec=excluded.spec;
commit;
notify pgrst,'reload schema';
