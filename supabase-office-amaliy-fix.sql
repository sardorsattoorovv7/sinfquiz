-- SinfQuiz 7.29: 6 xonali testlarda Office amaliy mashqlarini biriktirish.
-- Supabase SQL Editor -> New query -> ushbu fayl -> RUN.
-- Avval supabase-migration-7.29.sql bajarilgan bo‘lishi kerak.
-- Savollar tartibi, ustozga tegishlilik, ballar va muddatlar saqlanadi.
begin;

do $$ begin
 if to_regprocedure('public.sq_excel_normalize(text)') is null
    or to_regclass('public.sq_quiz_sessions') is null
    or not exists(select 1 from public.sq_comp_templates where id='office:excel-mixed-729') then
  raise exception 'Avval Supabase SQL Editor’da supabase-migration-7.29.sql faylini RUN qiling. Keyin ushbu tuzatishni bajaring.';
 end if;
end $$;

-- Mavjud to‘liq, ustoz yozgan mashqni saqlaydi. Faqat shablon kaliti bilan
-- saqlangan savolga serverdagi asl mashq va tekshiruv mezonlarini biriktiradi.
create or replace function public.sq_office_attach_question(p_q jsonb)
returns jsonb language plpgsql stable set search_path='' as $$
declare task jsonb;rubric jsonb;begin
 if p_q->>'type' is distinct from 'office' then return p_q;end if;
 task:=p_q->'officeTask';rubric:=coalesce(p_q->'officeRubric',task->'rubric');
 if task->>'kind' in ('word','excel','ppt') and jsonb_typeof(rubric)='array' then
  if jsonb_array_length(rubric)>0 then return p_q;end if;
 end if;
 select t.data->'officeTask' into task from public.sq_comp_templates t
 where t.id='office:'||(p_q->>'officeTemplate');
 if task is null then return p_q;end if;
 return p_q||jsonb_build_object('officeTask',task);
end $$;

create or replace function public.sq_office_attach_quiz(p_quiz jsonb)
returns jsonb language sql stable set search_path='' as $$
 select case when jsonb_typeof(p_quiz->'questions')='array' then
  p_quiz||jsonb_build_object('questions',coalesce((
   select jsonb_agg(public.sq_office_attach_question(x) order by n)
   from jsonb_array_elements(p_quiz->'questions') with ordinality t(x,n)
  ),'[]'::jsonb)) else p_quiz end
$$;

-- Oddiy saqlash va ustoz uchun tayyor to‘plam yaratish bir xil ishlaydi.
-- SECURITY DEFINER faqat yopiq shablonni o‘qish uchun; jadval RLS o‘zgarmaydi.
create or replace function public.sq_office_quiz_write()
returns trigger language plpgsql security definer set search_path='' as $$
declare item jsonb;previous jsonb;prior_quiz jsonb;resolved jsonb;rubric jsonb;questions jsonb:='[]';valid boolean;begin
 if jsonb_typeof(new.data->'questions') is distinct from 'array' then return new;end if;
 if tg_op='UPDATE' then prior_quiz:=old.data;else
  -- UPSERT oldin INSERT triggerini ham ishga tushiradi.
  select d.data into prior_quiz from public.documents d
  where d.collection='quizzes' and d.id=new.id;
 end if;
 for item in select x from jsonb_array_elements(new.data->'questions') x loop
  previous:=null;
  if jsonb_typeof(prior_quiz->'questions')='array' then
   select x into previous from jsonb_array_elements(prior_quiz->'questions') x
   where x->>'id'=item->>'id' limit 1;
  end if;
  -- Muharrirda boshqa shablon tanlanganda eski biriktirma qolib ketmasin.
  if item->>'type'='office' and previous is not null
     and item->>'officeTemplate' is distinct from previous->>'officeTemplate'
     and item->'officeTask' is not distinct from previous->'officeTask' then
   item:=item-array['officeTask','officeRubric'];
  end if;
  resolved:=public.sq_office_attach_question(item);
  if resolved->>'type'='office' then
   rubric:=coalesce(resolved->'officeRubric',resolved->'officeTask'->'rubric');
   valid:=coalesce(resolved->'officeTask'->>'kind' in ('word','excel','ppt'),false);
   if jsonb_typeof(rubric)='array' then valid:=valid and jsonb_array_length(rubric)>0;else valid:=false;end if;
   -- Oldindan buzilgan, tahrirlanmagan savol boshqa yangilanishni to‘smasin.
   if not valid and (previous is null or item is distinct from previous) then
    raise exception 'Office savoli uchun Amaliy mashqni tanlang, savolni va testni saqlang.';
   end if;
  end if;
  questions:=questions||jsonb_build_array(resolved);
 end loop;
 new.data:=new.data||jsonb_build_object('questions',questions);
 return new;
end $$;

revoke all on function public.sq_office_attach_question(jsonb),
 public.sq_office_attach_quiz(jsonb),public.sq_office_quiz_write()
 from public,anon,authenticated;

drop trigger if exists sq_office_quiz_attach on public.documents;
create trigger sq_office_quiz_attach before insert or update of data on public.documents
 for each row when(new.collection='quizzes') execute function public.sq_office_quiz_write();

-- Muharrirga ham bazaga yozilgan, to‘liq biriktirilgan savolni qaytaradi.
-- 7.28 dagi egalik, limit, kod to‘qnashuvi va hajm tekshiruvlari saqlangan.
create or replace function public.sq_quiz_save(p_id text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare old jsonb;q jsonb;p text;i integer:=0;begin
 if not coalesce(public.sq_is_teacher(),false) or coalesce(length(p_id),0) not between 1 and 150 or p_data is null or length(p_data::text)>1000000 then raise exception 'Testni saqlashga ruxsat yo‘q.';end if;
 perform public.sq_play_limit('quiz-save',60);
 select d.data into old from public.documents d where d.collection='quizzes' and d.id=p_id for update;
 if old is not null and old->>'ownerId'<>auth.uid()::text then raise exception 'Bu test boshqa ustozga tegishli.';end if;
 if jsonb_typeof(p_data->'questions') is distinct from 'array' or jsonb_array_length(p_data->'questions') not between 1 and 200 then raise exception 'Testda 1–200 ta savol bo‘lsin.';end if;
 q:=coalesce(old,'{}')||p_data||jsonb_build_object('id',p_id,'ownerId',auth.uid()::text,'updatedAt',floor(extract(epoch from clock_timestamp())*1000));
 if coalesce(q->>'status','') not in ('active','passive') then raise exception 'Test holati noto‘g‘ri.';end if;
 p:=coalesce(old->>'pin',q->>'pin');
 loop
  if coalesce(p,'') !~ '^[0-9]{6}$' or exists(select 1 from public.documents d where d.collection='quizzes' and d.id<>p_id and d.data->>'status'='active' and d.data->>'pin'=p) then p:=(floor(random()*900000)+100000)::integer::text;end if;
  begin
   q:=q||jsonb_build_object('pin',p);
   insert into public.documents(collection,id,data) values('quizzes',p_id,q)
   on conflict(collection,id) do update set data=excluded.data,updated_at=now()
   returning data into q;
   exit;
  exception when unique_violation then i:=i+1;if i>30 then raise exception 'Kod ajratilmadi. Qayta urinib ko‘ring.';end if;p:=null;
  end;
 end loop;return q;
end $$;
revoke all on function public.sq_quiz_save(text,jsonb) from public,anon;
grant execute on function public.sq_quiz_save(text,jsonb) to authenticated;

-- Oldin yaratilgan testlar, jumladan ustozlarning shaxsiy nusxalari.
with repaired as (
 select d.id,public.sq_office_attach_quiz(d.data) data from public.documents d
 where d.collection='quizzes' and jsonb_typeof(d.data->'questions')='array'
) update public.documents d set data=r.data
 from repaired r where d.collection='quizzes' and d.id=r.id and d.data is distinct from r.data;

-- Boshlangan sessiyada ham jadval ochiladi. Taymer va oldingi natija o‘zgarmaydi.
with repaired as (
 select s.id,public.sq_office_attach_quiz(s.quiz) quiz from public.sq_quiz_sessions s
) update public.sq_quiz_sessions s set quiz=r.quiz
 from repaired r where s.id=r.id and s.quiz is distinct from r.quiz;

commit;
select 'Office amaliy mashqlari biriktirildi. Saytni Ctrl+Shift+R bilan yangilang.' as natija;
