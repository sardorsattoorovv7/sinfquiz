-- SinfQuiz 7.17. Run AFTER supabase-chemistry-atlas.sql. Re-runnable.
-- Adds laboratory scene templates and per-scene numeric validation only.
-- Existing ownership guards, RLS, observations, auth and other subjects are retained.
begin;
create or replace function public.sq_chemistry_parameters_valid(scene_id text, params jsonb)
returns boolean language plpgsql immutable set search_path=public as $$
declare specs jsonb := '{"atom":{"protons":[8,1,20],"neutrons":[8,0,35],"electrons":[8,0,20]},"states":{"temperature":[20,-20,120]},"rate":{"temperature":[25,5,65]},"ph":{"acid":[1,0,10],"base":[0,0,10]},"lab-volcano":{"soda":[10,0,20],"acid":[6,0,20],"foam":[2,0,4]},"lab-balloon":{"soda":[10,0,20],"acid":[10,0,20]},"lab-indicator":{"ph":[7,1,13]},"lab-neutralisation":{"acid":[5,0,10],"base":[5,0,10]},"lab-dissolving":{"salt":[40,0,60],"water":[100,50,200]},"lab-crystals":{"salt":[20,0,35],"evaporation":[50,0,90]},"lab-filtration":{"sand":[10,0,30],"salt":[5,0,20]},"lab-distillation":{"salt":[10,0,30],"collected":[40,0,80]},"lab-density":{"oil":[50,10,100]},"lab-diffusion":{"temperature":[20,5,60]},"lab-chromatography":{"front":[8,2,10]},"lab-conductivity":{"salt":[1,0,3],"sugar":[1,0,3]},"lab-corrosion":{"humidity":[70,0,100],"salt":[1,0,3],"oxygen":[100,0,100]}}'::jsonb; bounds jsonb; entry record; n numeric;
begin
 if params is null or jsonb_typeof(params)<>'object' then return false; end if;
 if (select count(*) from jsonb_object_keys(params))>8 then return false; end if;
 for entry in select * from jsonb_each(params) loop
  bounds := specs->scene_id->entry.key;
  if bounds is null or jsonb_typeof(entry.value)<>'number' then return false; end if;
  n := (entry.value::text)::numeric;
  if n < (bounds->>1)::numeric or n > (bounds->>2)::numeric then return false; end if;
  if entry.key in ('protons','neutrons','electrons') and n<>trunc(n) then return false; end if;
 end loop;
 return true;
end $$;

alter table public.chemistry_concepts drop constraint if exists chemistry_content_valid;
alter table public.chemistry_concepts add constraint chemistry_content_valid check (
 jsonb_typeof(data)='object' and length(data::text)<16000
 and data ?& array['title','scene','grade','definition','reason','life','misconception','challenge','feedback','answer']
 and length(coalesce(data->>'title','')) between 4 and 100
 and data->>'scene' in ('atom','periodic','molecule','bonds','states','reaction','ph','rate','mixture','organic','electric','life','lab-volcano','lab-balloon','lab-indicator','lab-neutralisation','lab-dissolving','lab-crystals','lab-filtration','lab-distillation','lab-density','lab-diffusion','lab-chromatography','lab-conductivity','lab-corrosion')
 and (data->>'grade')::integer between 5 and 11
 and length(coalesce(data->>'definition','')) between 12 and 700
 and length(coalesce(data->>'reason','')) between 12 and 700
 and length(coalesce(data->>'life','')) between 12 and 700
 and length(coalesce(data->>'misconception','')) between 12 and 700
 and length(coalesce(data->>'challenge','')) between 12 and 500
 and length(coalesce(data->>'feedback','')) between 12 and 500
 and jsonb_typeof(data->'answer')='number' and (data->>'answer')::numeric between -1000 and 1000
 and jsonb_typeof(coalesce(data->'parameters','{}'::jsonb))='object');
create or replace function public.sq_guard_chemistry_concept()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if not public.sq_chemistry_parameters_valid(new.data->>'scene',coalesce(new.data->'parameters','{}'::jsonb)) then raise exception 'Parametr sahna chegarasiga mos emas'; end if;
 if tg_op='INSERT' then
  if new.owner_id is distinct from auth.uid() then raise exception 'Muallif mos emas'; end if;
  if new.status='published' and not public.sq_is_admin() then raise exception 'Admin tasdig‘i kerak'; end if;
 else
  if new.owner_id is distinct from old.owner_id or new.created_at is distinct from old.created_at then raise exception 'Muallif o‘zgarmaydi'; end if;
  if old.owner_id is distinct from auth.uid() then
   if not public.sq_is_admin() or new.data is distinct from old.data or new.active is distinct from old.active or new.status not in ('published','draft') then raise exception 'Admin faqat tasdiqlash holatini o‘zgartiradi'; end if;
  elsif not public.sq_is_admin() and new.status='published' and (old.status<>'published' or new.data is distinct from old.data) then raise exception 'O‘zgargan izoh qayta tasdiqlanishi kerak'; end if;
 end if;
 new.updated_at=now();return new;
end $$;

commit;
