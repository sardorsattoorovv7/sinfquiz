-- SinfQuiz 7.9: hisobga bog‘langan mashq va 1v1 natijalari.
-- 7.8 migratsiyadan keyin SQL Editor'da bir marta RUN qiling.
begin;

create index if not exists documents_result_uid_idx
 on public.documents(collection,((data->>'uid')),updated_at desc)
 where collection in ('practiceResults','raceResults');

drop policy if exists sq_practice_result_select on public.documents;
create policy sq_practice_result_select on public.documents for select to authenticated
 using (collection in ('practiceResults','raceResults') and data->>'uid'=auth.uid()::text);

drop policy if exists sq_practice_result_insert on public.documents;
create policy sq_practice_result_insert on public.documents for insert to authenticated
 with check (collection='practiceResults' and id like auth.uid()::text || ':%'
   and data->>'uid'=auth.uid()::text
   and coalesce(length(data->>'title'),0) between 1 and 120
   and coalesce((data->>'correct')::integer,0) between 0 and 30
   and coalesce((data->>'total')::integer,0) between 1 and 30);

drop policy if exists sq_practice_result_update on public.documents;
create policy sq_practice_result_update on public.documents for update to authenticated
 using (collection='practiceResults' and id like auth.uid()::text || ':%' and data->>'uid'=auth.uid()::text)
 with check (collection='practiceResults' and id like auth.uid()::text || ':%'
   and data->>'uid'=auth.uid()::text
   and coalesce(length(data->>'title'),0) between 1 and 120
   and coalesce((data->>'correct')::integer,0) between 0 and 30
   and coalesce((data->>'total')::integer,0) between 1 and 30);

create or replace function public.sq_archive_race_result() returns trigger
language plpgsql security definer set search_path=public as $$
declare racer jsonb; race_id text; racer_id text; user_id text;
begin
 if new.collection<>'live' or new.id<>'race' or new.data->>'phase'<>'finished'
    or coalesce(new.data->>'winnerId','')='' then return new; end if;
 if tg_op='UPDATE' then
  if old.data->>'phase'='finished' and old.data->>'id'=new.data->>'id' then return new; end if;
 end if;
 race_id:=new.data->>'id';
 if race_id is null or length(race_id)>100 then return new; end if;
 if jsonb_typeof(new.data->'racers') is distinct from 'array' then return new; end if;
 for racer in select value from jsonb_array_elements(coalesce(new.data->'racers','[]'::jsonb)) loop
  racer_id:=racer->>'id';user_id:=racer->>'uid';
  if racer_id is null or length(racer_id)>100 or user_id is null or user_id !~
   '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then continue; end if;
  insert into public.documents(collection,id,data,updated_at) values
   ('raceResults',race_id||':'||racer_id,
    jsonb_build_object('uid',user_id,'raceId',race_id,'title',left(coalesce(new.data->>'title','1v1 poyga'),120),
     'name',left(coalesce(racer->>'name','O‘quvchi'),60),
     'correct',case when racer->>'correct' ~ '^[0-9]{1,3}$' then (racer->>'correct')::integer else 0 end,
     'total',case when new.data->>'questionCount' ~ '^[0-9]{1,3}$' then (new.data->>'questionCount')::integer else 0 end,
     'won',racer_id=new.data->>'winnerId',
     'finishedAt',case when new.data->>'finishedAt' ~ '^[0-9]{10,14}$' then (new.data->>'finishedAt')::bigint else (extract(epoch from now())*1000)::bigint end),now())
   on conflict(collection,id) do nothing;
 end loop;
 return new;
end $$;

drop trigger if exists sq_archive_race_result_trigger on public.documents;
create trigger sq_archive_race_result_trigger after insert or update on public.documents
for each row when (new.collection='live' and new.id='race')
execute function public.sq_archive_race_result();
revoke all on function public.sq_archive_race_result() from public,anon,authenticated;

create or replace function public.sq_student_result_history() returns jsonb
language plpgsql security definer set search_path=public as $$
declare result_json jsonb;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
  raise exception 'Hisobingizga kiring.' using errcode='42501';
 end if;
 select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.finished_at desc),'[]'::jsonb)
 into result_json from (
  select a.id,a.snapshot->>'title' title,a.finished_at,a.assessment,a.result
  from public.cefr_attempts a where a.uid=auth.uid() and a.finished_at is not null
  order by a.finished_at desc limit 500
 ) row_data;
 return result_json;
end $$;
revoke all on function public.sq_student_result_history() from public,anon;
grant execute on function public.sq_student_result_history() to authenticated;

commit;
