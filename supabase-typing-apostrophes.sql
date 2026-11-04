-- Optional content patch for an existing database. Fresh 7.28 seeds already
-- use ordinary keyboard apostrophes. Preserve current session snapshots,
-- submitted answers, grades and all result/history tables.
begin;
update public.sq_typing_content
set stages=translate(stages::text,U&'\2018\2019\02BB\02BC\FF07',repeat(chr(39),5))::jsonb
where stages::text<>translate(stages::text,U&'\2018\2019\02BB\02BC\FF07',repeat(chr(39),5));
commit;
