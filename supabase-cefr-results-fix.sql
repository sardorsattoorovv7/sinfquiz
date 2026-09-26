-- CEFR administrator natijalari uchun a.uid noaniqligi tuzatildi.
-- Supabase SQL Editor da shu faylni RUN qiling; 7.4 migratsiyasini qayta bajarish shart emas.
begin;
create or replace function public.sq_cefr_admin(p_action text, p_id uuid default null, p_body jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public as $$
declare t public.cefr_tests; a public.cefr_attempts; out_json jsonb;
begin
 if auth.uid() is null or not public.sq_is_admin() then raise exception 'Faqat administrator uchun.' using errcode='42501'; end if;
 if p_action='list' then select coalesce(jsonb_agg(to_jsonb(x) order by updated_at desc),'[]') into out_json from public.cefr_tests x; return out_json; end if;
 if p_action='results' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into out_json from (select attempt_row.id,attempt_row.test_id,attempt_row.uid,attempt_row.snapshot->>'title' title,attempt_row.started_at,attempt_row.finished_at,attempt_row.assessment,coalesce(d.data->>'name','O‘quvchi') student_name from public.cefr_attempts attempt_row left join public.documents d on d.collection='profiles' and d.id=attempt_row.uid::text where attempt_row.finished_at is not null order by attempt_row.finished_at desc limit 100) x;return out_json;
 end if;
 if p_action in ('attempt','review') then
  select * into a from public.cefr_attempts where id=p_id for update;
  if not found or a.finished_at is null then raise exception 'Topshirilgan javob topilmadi.'; end if;
  if p_action='review' then
   if coalesce(p_body->>'writing','') !~ '^[0-9]+$' or coalesce(p_body->>'speaking','') !~ '^[0-9]+$' then raise exception 'Baholar butun son bo‘lsin.'; end if;
   if (p_body->>'writing')::int not between 0 and 75 or (p_body->>'speaking')::int not between 0 and 75 or coalesce(length(trim(p_body->>'feedback')),0) not between 1 and 5000 then raise exception '0–75 oralig‘ida baho va izoh kiriting.'; end if;
   update public.cefr_attempts set assessment=jsonb_build_object('writing',(p_body->>'writing')::int,'speaking',(p_body->>'speaking')::int,'feedback',p_body->>'feedback'),reviewed_by=auth.uid(),reviewed_at=now() where id=p_id returning * into a;
  end if;
  return to_jsonb(a);
 end if;
 if p_action='save' then
  if length(p_body::text)>2000000 or jsonb_typeof(p_body->'payload'->'sections') is distinct from 'array' or jsonb_array_length(p_body->'payload'->'sections')<>4 then raise exception 'Variant tuzilmasi noto‘g‘ri.'; end if;
  if coalesce(length(trim(p_body->'payload'->>'title')),0) not between 1 and 160 then raise exception 'Variant nomini kiriting (160 belgigacha).'; end if;
  if p_id is null then insert into public.cefr_tests(payload,created_by) values(p_body->'payload',auth.uid()) returning * into t;
  else update public.cefr_tests set payload=p_body->'payload',status='draft',revision=revision+1,updated_at=now() where id=p_id and revision=(p_body->>'revision')::int returning * into t;
   if not found then raise exception 'Variant boshqa oynada o‘zgargan. Ro‘yxatni yangilang.'; end if;
  end if;return to_jsonb(t);
 end if;
 select * into t from public.cefr_tests where id=p_id for update;
 if not found then raise exception 'Variant topilmadi.'; end if;
 if p_action='publish' then perform public.sq_cefr_validate(t.payload); update public.cefr_tests set status='published',updated_at=now() where id=p_id returning * into t;
 elsif p_action='archive' then update public.cefr_tests set status='archived',updated_at=now() where id=p_id returning * into t;
 else raise exception 'Amal noto‘g‘ri.'; end if;
 return to_jsonb(t);
end $$;
revoke all on function public.sq_cefr_admin(text,uuid,jsonb) from public,anon;
grant execute on function public.sq_cefr_admin(text,uuid,jsonb) to authenticated;
commit;
