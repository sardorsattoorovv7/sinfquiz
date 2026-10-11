-- SinfQuiz 7.7: original Multilevel mashqlar, admin seed va local audio.
-- Existing database: RUN after supabase-migration-7.4.sql and 7.6.
begin;
create or replace function public.sq_cefr_validate(p jsonb) returns void
language plpgsql set search_path=public as $$
declare s jsonb; part jsonb; q jsonb; a jsonb; si int:=0; pi int; ids text[]:='{}';
 expected jsonb:='[[8,6,4,5,6,6],[6,8,6,9,6],[3],[3,3,1,1]]'; n int;
begin
 if length(p::text)>2000000 or jsonb_typeof(p->'sections') is distinct from 'array' or jsonb_array_length(p->'sections')<>4 then raise exception '4 ta CEFR bo‘limi kerak.'; end if;
 if coalesce(length(trim(p->>'title')),0) not between 1 and 160 then raise exception 'Variant nomi 1–160 belgi bo‘lsin.'; end if;
 if p->>'rightsConfirmed' is distinct from 'true' then raise exception 'Materiallardan foydalanish huquqini tasdiqlang.'; end if;
 for s in select value from jsonb_array_elements(p->'sections') loop
  if s->>'skill' is distinct from (array['listening','reading','writing','speaking'])[si+1] or coalesce(s->>'minutes','') !~ '^[0-9]+$' then raise exception 'Bo‘lim turi yoki vaqti noto‘g‘ri.'; end if;
  if (s->>'minutes')::int not between 1 and 180 or jsonb_typeof(s->'parts') is distinct from 'array' then raise exception 'Bo‘lim sozlamasi noto‘g‘ri.'; end if;
  if jsonb_array_length(s->'parts') not between 1 and 20 then raise exception 'Qismlar soni noto‘g‘ri.'; end if;
  if p->>'format'='multilevel' and jsonb_array_length(s->'parts')<>jsonb_array_length(expected->si) then raise exception 'Multilevel qismlari sonini tekshiring.'; end if;
  pi:=0;
  for part in select value from jsonb_array_elements(s->'parts') loop
   if coalesce(length(trim(part->>'source')),0)=0 then raise exception 'Har qismda muallif yoki manba kerak.'; end if;
   if si=0 and (coalesce(part->>'audioUrl','') !~ '^https://[^/@[:space:]]+([/:?#]|$)' and coalesce(part->>'audioUrl','') !~ '^/cefr-audio/mock-([1-9]|10)-part-[1-6]\.mp3$') then raise exception 'Listening uchun HTTPS audio kerak.'; end if;
   if si=1 and coalesce(length(trim(part->>'text')),0)=0 then raise exception 'Reading matni kerak.'; end if;
   if coalesce(part->>'imageUrl','')<>'' and (part->>'imageUrl') !~ '^https://[^/@[:space:]]+([/:?#]|$)' then raise exception 'HTTPS rasm manzili kerak.'; end if;
   if jsonb_typeof(part->'questions') is distinct from 'array' then raise exception 'Savollar ro‘yxati kerak.'; end if;
   n:=jsonb_array_length(part->'questions');
   if n not between 1 and 100 or (p->>'format'='multilevel' and n<>(expected->si->>pi)::int) then raise exception 'Qismdagi savollar soni noto‘g‘ri.'; end if;
   for q in select value from jsonb_array_elements(part->'questions') loop
    if coalesce(q->>'id','') !~ '^[a-zA-Z0-9_-]{1,100}$' or q->>'id'=any(ids) then raise exception 'Savol ID bo‘sh yoki takrorlangan.'; end if;
    ids:=array_append(ids,q->>'id');
    if coalesce(length(trim(q->>'text')),0) not between 1 and 20000 then raise exception 'Savol matnini tekshiring.'; end if;
    if si<2 then
     if coalesce(q->>'type','') not in ('choice','text') or jsonb_typeof(q->'answers') is distinct from 'array' or coalesce(length(trim(q->>'explanation')),0)=0 then raise exception 'Javob kaliti va izoh kerak.'; end if;
     if jsonb_array_length(q->'answers') not between 1 and 20 then raise exception 'Kalitni tekshiring.'; end if;
     if q->>'type'='choice' then
      if jsonb_typeof(q->'options') is distinct from 'array' then raise exception 'Variantlar kerak.'; end if;
      if jsonb_array_length(q->'options') not between 2 and 12 or exists(select 1 from jsonb_array_elements_text(q->'options') v where trim(v)='') or (select count(distinct v) from jsonb_array_elements_text(q->'options') v)<>jsonb_array_length(q->'options') then raise exception 'Variantlar bo‘sh yoki takrorlangan.'; end if;
     end if;
     for a in select value from jsonb_array_elements(q->'answers') loop
      if jsonb_typeof(a)<>'string' or length(trim(a#>>'{}'))=0 or (q->>'type'='choice' and not (q->'options' @> jsonb_build_array(a))) then raise exception 'Javob kaliti noto‘g‘ri.'; end if;
     end loop;
    elsif q->>'type' is distinct from s->>'skill' then raise exception 'Topshiriq turi noto‘g‘ri.'; end if;
   end loop;
   pi:=pi+1;
  end loop;
  si:=si+1;
 end loop;
 if array_length(ids,1)>300 then raise exception 'Bir variantda 300 tagacha savol bo‘lsin.'; end if;
end $$;


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

create table if not exists public.cefr_builtin_bank(
  seed_key text primary key,
  payload jsonb not null
);
revoke all on public.cefr_builtin_bank from anon,authenticated;


commit;
