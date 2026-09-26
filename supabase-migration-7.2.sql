-- Existing v7 installs: run this after supabase-schema.sql has already been applied.
-- Does not delete or rewrite existing tests/results.
create or replace function public.sq_require_national_sources()
returns trigger language plpgsql set search_path=public
as $$
declare q jsonb; topic_count integer; text_count integer;
begin
 if new.collection<>'nationalSections' then return new; end if;
 if coalesce(new.data->>'approvalStatus','') not in ('pending','approved') then return new; end if;
 if jsonb_typeof(new.data->'questions') is distinct from 'array' then
  raise exception 'Variant savollari to‘ldirilmagan';
 end if;
 if jsonb_array_length(new.data->'questions')<>30 then
  raise exception 'Ommaviy variantda 30 ta savol bo‘lsin';
 end if;
 for q in select value from jsonb_array_elements(new.data->'questions') loop
  if length(btrim(coalesce(q->>'text','')))=0
   or length(btrim(coalesce(q->>'topic','')))=0
   or length(btrim(coalesce(q->>'explanation','')))=0
   or length(btrim(coalesce(q->>'sourceReference','')))=0
   or coalesce(q->>'sourceUrl','') !~ '^https://[^/@[:space:]]+([/:?].*)?$' then
   raise exception 'Har savolga mavzu, manba, sahifa/savol raqami va izoh kiriting';
  end if;
  if jsonb_typeof(q->'options') is distinct from 'array' then raise exception 'Javob variantlari noto‘g‘ri'; end if;
  if jsonb_array_length(q->'options')<>4 or coalesce(q->>'correct','') !~ '^[0-3]$' then
   raise exception '4 ta variant va to‘g‘ri javob indeksi kerak';
  end if;
 end loop;
 select count(distinct lower(btrim(value->>'topic'))),count(distinct lower(btrim(value->>'text')))
 into topic_count,text_count from jsonb_array_elements(new.data->'questions');
 if topic_count<3 or text_count<>30 then raise exception 'Kamida 3 mavzu va takrorlanmagan 30 savol kerak'; end if;
 return new;
end $$;
drop trigger if exists sq_require_national_sources_trigger on public.documents;
create trigger sq_require_national_sources_trigger before insert or update on public.documents
for each row execute function public.sq_require_national_sources();
