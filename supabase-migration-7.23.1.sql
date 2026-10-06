-- SinfQuiz 7.23 -> 7.23.1. Existing work, roles, RLS and content revisions are preserved.
begin;
do $$begin if to_regclass('public.sq_en_runs') is null then raise exception 'Avval supabase-migration-7.23.sql ni bajaring.';end if;end$$;
create or replace function public.sq_en_check_view(c public.sq_en_checks) returns jsonb language plpgsql stable set search_path='' as $$
 declare cursor integer:=coalesce((c.state->>'cursor')::integer,0);q jsonb;
 begin
 if c.status='started' then q:=public.sq_en_safe(c.bank->'questions'->cursor);end if;
 return jsonb_build_object('id',c.id,'kind',c.kind,'level',c.level,'variant',c.variant,'status',c.status,'state',c.state-'answers'-'tokens','updatedAt',c.updated_at,'question',q,'total',jsonb_array_length(c.bank->'questions'),'result',c.result,'writingTask',case when c.status<>'started' then c.bank->'writing' else null end,'speakingTask',case when c.status<>'started' then c.bank->'speaking' else null end,'rubrics',c.bank->'rubrics');
 end
$$;

create or replace function public.sq_en(p_action text,p jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
 #variable_conflict use_variable
 declare uid uuid:=auth.uid();staff boolean;profile public.sq_en_profiles;c public.sq_en_content;r public.sq_en_runs;ch public.sq_en_checks;asgn public.sq_en_assignments;
 out jsonb;lesson jsonb;q jsonb;allq jsonb;answer jsonb;res jsonb;state jsonb;bank jsonb;qs jsonb:='[]';item jsonb;results jsonb;score numeric;correct integer;total integer;cur integer;band integer;miss integer;recommend integer:=0;variant integer;threshold integer;w integer;s integer;id uuid;tok uuid;prev text;lev integer;ord integer;term text;rows jsonb;grades jsonb;
 begin
 if uid is null then raise exception 'Mavjud hisob yoki mehmon sessiyasi orqali kiring.';end if;
 insert into public.sq_en_profiles(user_id) values(uid) on conflict do nothing;
 select * into profile from public.sq_en_profiles where user_id=uid;
 staff:=coalesce(public.sq_is_teacher(),false);
 threshold:=coalesce(profile.threshold,(select settings.threshold from public.sq_en_settings settings where settings.id));
 if length(p::text)>220000 then raise exception 'So‘rov juda katta.';end if;
 if p ? 'token' then
  tok:=(p->>'token')::uuid;perform pg_advisory_xact_lock(hashtextextended(uid::text||tok::text,723));
  select response into out from public.sq_en_actions where user_id=uid and token=tok;if found then return out;end if;
 end if;
 if p_action not in ('home','lesson','teacher') and to_regprocedure('public.sq_comp_limit(text,integer)') is not null then
  if not public.sq_comp_limit('en:'||p_action,case when p_action='checkStart' then 8 when p_action='joinGroup' then 8 else 120 end) then return jsonb_build_object('error','Urinishlar tezligi yuqori. Bir oz kutib qayta urinib ko‘ring.');end if;
 end if;
 if p_action='home' then
  select coalesce(jsonb_agg(jsonb_build_object('id',x.base_id,'level',x.payload->>'level','order',x.ordinal,'title',x.payload->>'title','objective',x.payload->>'objective','open',public.sq_en_access(x.base_id,uid),'testPassed',profile.placement_complete and x.level<profile.open_level,'mastered',exists(select 1 from public.sq_en_runs r0 where r0.user_id=uid and r0.base_id=x.base_id and r0.status='mastered')) order by x.level,x.ordinal),'[]') into rows from (select distinct on(base_id) * from public.sq_en_content where owner_id is null and status='published' order by base_id,revision desc) x;
  out:=jsonb_build_object('uid',uid,'staff',staff,'admin',public.sq_is_admin(),'active',(select active from public.sq_en_settings where sq_en_settings.id),'threshold',threshold,'profile',to_jsonb(profile),'lessons',rows,
   'runs',(select coalesce(jsonb_agg(public.sq_en_run_view(r0) order by r0.updated_at desc),'[]') from public.sq_en_runs r0 where r0.user_id=uid),
   'checks',(select coalesce(jsonb_agg(public.sq_en_check_view(c0) order by c0.created_at desc),'[]') from public.sq_en_checks c0 where c0.user_id=uid),
   'assignments',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.sq_en_assignments a where a.active and exists(select 1 from public.sq_class_members m where m.group_id=a.group_id and m.student_id=uid)),
   'vocabulary',(select coalesce(jsonb_agg(to_jsonb(v) order by v.due_at),'[]') from public.sq_en_vocab v where v.user_id=uid));
 elsif p_action='run' then
  select * into r from public.sq_en_runs where sq_en_runs.id=(p->>'id')::uuid and user_id=uid;
  if not found then raise exception 'Ishga ruxsat yo‘q.';end if;
  lesson:=r.snapshot;out:=jsonb_build_object('lesson',public.sq_en_safe(lesson)||jsonb_build_object('listening',public.sq_en_safe(lesson->'listening')||jsonb_build_object('transcript',lesson->'listening'->'transcript')),'run',public.sq_en_run_view(r));
 elsif p_action in ('lesson','begin') then
  if not public.sq_en_access(p->>'baseId',uid) then raise exception 'Dars yopiq. Daraja testini yoki oldingi dars mezonlarini bajaring.';end if;
  if p ? 'assignmentId' then
   select * into asgn from public.sq_en_assignments a where a.id=(p->>'assignmentId')::uuid and a.active and a.base_id=p->>'baseId' and (a.owner_id=uid or public.sq_is_admin() or exists(select 1 from public.sq_class_members m where m.group_id=a.group_id and m.student_id=uid));
   if not found then raise exception 'Biriktirilgan darsga ruxsat yo‘q.';end if;
   select * into c from public.sq_en_content where sq_en_content.id=asgn.content_id and revision=asgn.revision;
  else select * into c from public.sq_en_content where base_id=p->>'baseId' and owner_id is null and status='published' order by revision desc limit 1;end if;
  if not found then raise exception 'Dars topilmadi.';end if;
  if p_action='begin' then
   insert into public.sq_en_runs(user_id,base_id,content_id,revision,snapshot) values(uid,c.base_id,c.id,c.revision,c.payload) on conflict(user_id,content_id,revision) do nothing;
   select * into r from public.sq_en_runs where user_id=uid and content_id=c.id and revision=c.revision;
   lesson:=r.snapshot;
  else lesson:=c.payload;end if;
  out:=jsonb_build_object('lesson',public.sq_en_safe(lesson)||jsonb_build_object('listening',public.sq_en_safe(lesson->'listening')||jsonb_build_object('transcript',lesson->'listening'->'transcript')),'run',case when p_action='begin' then public.sq_en_run_view(r) else null end);
 elsif p_action in ('save','attempt','hint','exit','submit','resubmit') then
  select * into r from public.sq_en_runs where sq_en_runs.id=(p->>'id')::uuid and user_id=uid for update;
  if not found then raise exception 'Ishga ruxsat yo‘q.';end if;
  if not public.sq_en_access(r.base_id,uid) then raise exception 'Dars yopiq.';end if;
  if r.status in ('submitted','reviewed','mastered') and p_action<>'submit' then raise exception 'Topshirilgan ishni tahrirlash uchun qayta ishlash so‘ralishi kerak.';end if;
  state:=r.state;
  if p_action in ('save','resubmit','submit') and p ? 'expectedDraftVersion' then
   if coalesce(p->>'expectedDraftVersion','') !~ '^(0|[1-9][0-9]{0,8})$' then raise exception 'Qoralama versiyasi noto‘g‘ri.';end if;
   if (p->>'expectedDraftVersion')::integer <> coalesce((state->>'draftVersion')::integer,0) then raise exception using errcode='P7231',message='Bu ish boshqa oynada yoki qurilmada yangilangan. Qoralamangiz shu brauzerda qoladi; qaysi nusxani saqlashni tanlang.';end if;
  end if;
  if p_action in ('save','resubmit') then
   if r.status in ('submitted','reviewed','mastered') and p_action='save' then raise exception 'Topshirilgan ishni tahrirlash uchun qayta ishlash so‘ralishi kerak.';end if;
   if p_action='resubmit' and r.status<>'needs_revision' then raise exception 'Qayta ishlash so‘rovi yo‘q.';end if;
   if p ? 'writing' and (jsonb_typeof(p->'writing') is distinct from 'string' or length(p->>'writing')>20000) then raise exception 'Yozma qoralama 20000 belgigacha matn bo‘lsin.';end if;
   if p ? 'writing' then
    state:=jsonb_set(state,'{writing}',p->'writing');
   end if;
   if p ? 'step' then state:=jsonb_set(state,'{step}',to_jsonb(greatest(0,least(7,(p->>'step')::integer))));end if;
   if p ? 'completed' then
    if jsonb_typeof(p->'completed')<>'array' or exists(select 1 from jsonb_array_elements_text(p->'completed') t where t not in ('learn','vocabulary','listening')) then raise exception 'Qadam qiymati noto‘g‘ri.';end if;
    state:=jsonb_set(state,'{completed}',(select coalesce(jsonb_agg(distinct v),'[]') from jsonb_array_elements((coalesce(state->'completed','[]')||(p->'completed'))) v));
   end if;
   if p ? 'speaking' and p->'speaking'<>'{}'::jsonb then
    if p->'speaking' = '{"mode":"draft"}'::jsonb then state:=jsonb_set(state,'{speaking}',p->'speaking');
    else
    if not public.sq_en_recording_ok(uid,r.id,p->'speaking') then raise exception 'Speaking uchun yuborilgan yozuv yoki jonli tekshiruv izohi kerak.';end if;
    state:=jsonb_set(state,'{speaking}',p->'speaking');
    end if;
   end if;
   state:=jsonb_set(state,'{draftVersion}',to_jsonb(coalesce((state->>'draftVersion')::integer,0)+1));
   if p_action='resubmit' then state:=jsonb_set(state,'{draftVersions}',coalesce(state->'draftVersions','[]')||jsonb_build_array(jsonb_build_object('text',state->>'writing','feedback',r.feedback,'at',now())));r.status:='started';end if;
  elsif p_action in ('attempt','hint') then
   select value into q from jsonb_array_elements((r.snapshot->'exercises')||(r.snapshot->'reading'->'questions')||(r.snapshot->'listening'->'questions')) where value->>'id'=p->>'questionId';
   if not found then raise exception 'Mashq topilmadi.';end if;
   if p_action='hint' then
    state:=jsonb_set(state,'{hints}',coalesce(state->'hints','{}')||jsonb_build_object(q->>'id',true));out:=jsonb_build_object('hint',q->>'hint');
   else
    if q->>'skill'='listening' and not coalesce(state->'completed','[]') ? 'listening' then raise exception 'Avval audioni yakunigacha tinglang.';end if;
    if q ? 'audio' and coalesce(p->>'heard','false')<>'true' then raise exception 'Avval shu mashq audiosini yakunigacha tinglang.';end if;
    answer:=p->'answer';res:=jsonb_build_object('correct',public.sq_en_grade(q,answer),'answer',answer,'expected',q->'answers','explanation',q->>'explanation','hintUsed',coalesce(state->'hints','{}') ? (q->>'id'),'at',now(),'skill',q->>'skill');
    state:=jsonb_set(state,'{results}',coalesce(state->'results','{}')||jsonb_build_object(q->>'id',res));
    state:=jsonb_set(state,'{history}',coalesce(state->'history','[]')||jsonb_build_array(res||jsonb_build_object('questionId',q->>'id')));out:=res;
   end if;
  elsif p_action='exit' then
   variant:=jsonb_array_length(coalesce(state->'exitHistory','[]'))%2;
   allq:=r.snapshot->'exit'->variant;correct:=0;total:=jsonb_array_length(allq);rows:='[]';
   for q in select value from jsonb_array_elements(allq) loop
    res:=jsonb_build_object('id',q->>'id','correct',public.sq_en_grade(q,p->'answers'->(q->>'id')),'expected',q->'answers','explanation',q->>'explanation');if (res->>'correct')::boolean then correct:=correct+1;end if;rows:=rows||jsonb_build_array(res);
   end loop;
   res:=jsonb_build_object('score',round(100.0*correct/greatest(total,1)),'variant',variant,'feedback',rows,'at',now());
   state:=jsonb_set(state,'{exitHistory}',coalesce(state->'exitHistory','[]')||jsonb_build_array(res));state:=jsonb_set(state,'{exit}',res);out:=res;
  elsif p_action='submit' then
   if r.status in ('submitted','reviewed','mastered') then out:=public.sq_en_run_view(r);return out;end if;
   if not (state->'completed' ? 'learn' and state->'completed' ? 'vocabulary' and state->'completed' ? 'listening') then raise exception 'Majburiy o‘rganish va listening qadamlarini bajaring.';end if;
   allq:=(r.snapshot->'exercises')||(r.snapshot->'reading'->'questions')||(r.snapshot->'listening'->'questions');
   for q in select value from jsonb_array_elements(allq) loop if not coalesce((state->'results'->(q->>'id')->>'correct')::boolean,false) then raise exception 'Mashqlarni to‘g‘ri bajarib, xatolarni qayta ishlang.';end if;end loop;
   select greatest(threshold,coalesce(max(a.threshold),threshold)) into threshold from public.sq_en_assignments a where a.content_id=r.content_id and a.revision=r.revision and a.active and exists(select 1 from public.sq_class_members m where m.group_id=a.group_id and m.student_id=uid);
   if coalesce((state->'exit'->>'score')::numeric,0)<threshold then raise exception 'Chiqish tekshiruvi kamida % foiz bo‘lishi kerak.',threshold;end if;
   if coalesce(cardinality(regexp_split_to_array(btrim(state->>'writing'),'\s+')),0) < coalesce((r.snapshot->'writing'->>'minWords')::integer,10000) then raise exception 'Yozma vazifani to‘liqroq bajaring. So‘z soni sifat bahosi emas.';end if;
   if not public.sq_en_recording_ok(uid,r.id,state->'speaking') then raise exception 'Speaking namunasini topshiring yoki jonli ustoz tekshiruvini tanlang.';end if;
   if coalesce(state->>'firstWriting','')='' then state:=jsonb_set(state,'{firstWriting}',state->'writing');end if;
   state:=jsonb_set(state,'{submittedVersions}',coalesce(state->'submittedVersions','[]')||jsonb_build_array(jsonb_build_object('writing',state->>'writing','speaking',state->'speaking','at',now())));r.status:='submitted';
  end if;
  update public.sq_en_runs set state=state,status=r.status,updated_at=now() where sq_en_runs.id=r.id returning * into r;
  if out is null then out:=public.sq_en_run_view(r);else out:=out||jsonb_build_object('run',public.sq_en_run_view(r));end if;
 elsif p_action='checkStart' then
  lev:=case when p->>'kind'='placement' then 0 else (p->>'level')::integer end;
  if lev not between 0 and 5 or p->>'kind' not in ('placement','level') then raise exception 'Tekshiruv turi noto‘g‘ri.';end if;
  if p->>'kind'='level' and (not profile.placement_complete or lev<>profile.open_level or exists(select 1 from public.sq_en_content x where x.owner_id is null and x.status='published' and x.level=lev and not exists(select 1 from public.sq_en_runs r0 where r0.user_id=uid and r0.base_id=x.base_id and r0.status='mastered'))) then raise exception 'Avval joriy darajadagi barcha darslarni o‘zlashtiring.';end if;
  select * into ch from public.sq_en_checks where user_id=uid and kind=p->>'kind' and level=lev and status='started';
  if not found then
   if exists(select 1 from public.sq_en_checks where user_id=uid and kind=p->>'kind' and created_at>now()-interval '30 seconds') then raise exception 'Yangi urinishdan oldin 30 soniya kuting.';end if;
   select count(*)%2 into variant from public.sq_en_checks where user_id=uid and kind=p->>'kind' and level=lev;
   for band in select generate_series(case when p->>'kind'='placement' then 0 else lev end,case when p->>'kind'='placement' then 5 else lev end) loop
    select payload into lesson from public.sq_en_content where owner_id is null and status='published' and level=band and (p->>'kind'='placement' or ordinal%2=variant) order by random() limit 1;
    qs:=qs||jsonb_build_array((lesson->'exercises'->0)||jsonb_build_object('band',band), (lesson->'exercises'->4)||jsonb_build_object('band',band), (lesson->'reading'->'questions'->variant)||jsonb_build_object('band',band,'text',lesson->'reading'->>'text'), (lesson->'listening'->'questions'->variant)||jsonb_build_object('band',band,'audio',lesson->'listening'->>'audio'));
    if p->>'kind'='level' then
     qs:=qs||jsonb_build_array((lesson->'exercises'->1)||jsonb_build_object('band',band), (lesson->'reading'->'questions'->(1-variant))||jsonb_build_object('band',band,'text',lesson->'reading'->>'text'), (lesson->'listening'->'questions'->(1-variant))||jsonb_build_object('band',band,'audio',lesson->'listening'->>'audio'));
    end if;
   end loop;
   bank:=jsonb_build_object('questions',qs,'writing',lesson->'writing','speaking',lesson->'speaking','rubrics',lesson->'rubrics');
   insert into public.sq_en_checks(user_id,kind,level,variant,bank) values(uid,p->>'kind',lev,variant,bank) returning * into ch;
  end if;out:=public.sq_en_check_view(ch);
 elsif p_action='checkAnswer' then
  select * into ch from public.sq_en_checks where sq_en_checks.id=(p->>'id')::uuid and user_id=uid for update;
  if not found then raise exception 'Tekshiruvga ruxsat yo‘q.';end if;
  if ch.status<>'started' then return public.sq_en_check_view(ch);end if;
  cur:=(ch.state->>'cursor')::integer;q:=ch.bank->'questions'->cur;
  if (p->>'cursor')::integer<>cur then return public.sq_en_check_view(ch);end if;
  if q->>'skill'='listening' and p->>'heard'<>'true' and not coalesce((p->>'skip')::boolean,false) then raise exception 'Audio tugamaguncha listening javobini yubormang.';end if;
  res:=jsonb_build_object('questionId',q->>'id','skill',q->>'skill','band',q->'band','correct',not coalesce((p->>'skip')::boolean,false) and public.sq_en_grade(q,p->'answer'),'answer',p->'answer');
  state:=ch.state||jsonb_build_object('cursor',cur+1,'answers',ch.state->'answers'||jsonb_build_array(res));
  select count(*) into miss from jsonb_array_elements(state->'answers') v where (v->>'band')::integer=(q->>'band')::integer and not (v->>'correct')::boolean;
  if cur+1>=jsonb_array_length(ch.bank->'questions') or (ch.kind='placement' and ((cur+1)%4=0 and miss>=1)) then
   ch.status:='objective_complete';results:='{}';
   for term in select unnest(array['grammar','vocabulary','reading','listening']) loop
    select count(*),count(*) filter(where (v->>'correct')::boolean) into total,correct from jsonb_array_elements(state->'answers') v where v->>'skill'=term;
    results:=results||jsonb_build_object(term,jsonb_build_object('correct',correct,'total',total,'score',case when total>0 then round(100.0*correct/total) else null end));
   end loop;
   if ch.kind='placement' then
    recommend:=least(5,(q->>'band')::integer);if miss=0 then recommend:=least(5,recommend+1);end if;
    -- Placement recommendations above A2 need human evidence before opening.
    update public.sq_en_profiles set placement_complete=true,recommended=greatest(recommended,recommend),open_level=greatest(open_level,least(recommend,2)),updated_at=now() where user_id=uid;
   else recommend:=ch.level;end if;
   rows:='[]';for item in select value from jsonb_array_elements(state->'answers') loop
    select value into q from jsonb_array_elements(ch.bank->'questions') where value->>'id'=item->>'questionId';
    rows:=rows||jsonb_build_array(jsonb_build_object('correct',item->'correct','prompt',q->>'prompt','expected',q->'answers','explanation',q->>'explanation','skill',item->>'skill'));
   end loop;
   ch.result:=jsonb_build_object('feedback',rows,'recommended',case when ch.kind='placement' then recommend else ch.level end,'skills',results,'humanReviewRequired',true,'note','Ichki o‘quv tavsiyasi; rasmiy CEFR sertifikati emas.');
   if ch.kind='placement' then select payload into lesson from public.sq_en_content where owner_id is null and level=recommend and ordinal=1 order by revision desc limit 1;ch.bank:=jsonb_set(jsonb_set(ch.bank,'{writing}',lesson->'writing'),'{speaking}',lesson->'speaking');end if;
  end if;
  update public.sq_en_checks set state=state,status=ch.status,result=ch.result,bank=ch.bank,updated_at=now() where sq_en_checks.id=ch.id returning * into ch;out:=public.sq_en_check_view(ch);
 elsif p_action='checkSave' then
  select * into ch from public.sq_en_checks where sq_en_checks.id=(p->>'id')::uuid and user_id=uid for update;
  if not found or ch.status not in ('objective_complete','needs_revision') then raise exception 'Bu tekshiruv qoralamasini tahrirlab bo‘lmaydi.';end if;
  if p ? 'writing' and (jsonb_typeof(p->'writing')<>'string' or length(p->>'writing')>20000) then raise exception 'Yozma qoralama 20000 belgidan oshmasin.';end if;
  state:=ch.state;
  if p ? 'expectedDraftVersion' then
   if coalesce(p->>'expectedDraftVersion','') !~ '^(0|[1-9][0-9]{0,8})$' then raise exception 'Qoralama versiyasi noto‘g‘ri.';end if;
   if (p->>'expectedDraftVersion')::integer <> coalesce((state->>'draftVersion')::integer,0) then raise exception using errcode='P7231',message='Bu tekshiruv boshqa oynada yoki qurilmada yangilangan. Qoralamangiz shu brauzerda qoladi; qaysi nusxani saqlashni tanlang.';end if;
  end if;
  if p ? 'writing' then state:=jsonb_set(state,'{writing}',p->'writing');end if;
  if p ? 'speaking' and p->'speaking'<>'{}'::jsonb then
   if p->'speaking' = '{"mode":"draft"}'::jsonb then state:=jsonb_set(state,'{speaking}',p->'speaking');
   else
   if not public.sq_en_recording_ok(uid,ch.id,p->'speaking') then raise exception 'Speaking yozuvi yoki jonli tekshiruv izohi kerak.';end if;
   state:=jsonb_set(state,'{speaking}',p->'speaking');
   end if;
  end if;
  state:=jsonb_set(state,'{draftVersion}',to_jsonb(coalesce((state->>'draftVersion')::integer,0)+1));
  update public.sq_en_checks set state=state,updated_at=now() where sq_en_checks.id=ch.id returning * into ch;out:=public.sq_en_check_view(ch);
 elsif p_action='checkSubmit' then
  select * into ch from public.sq_en_checks where sq_en_checks.id=(p->>'id')::uuid and user_id=uid for update;
  if not found or ch.status not in ('objective_complete','needs_revision') then raise exception 'Avval test qismini tugating.';end if;
  if p ? 'expectedDraftVersion' then
   if coalesce(p->>'expectedDraftVersion','') !~ '^(0|[1-9][0-9]{0,8})$' then raise exception 'Qoralama versiyasi noto‘g‘ri.';end if;
   if (p->>'expectedDraftVersion')::integer <> coalesce((ch.state->>'draftVersion')::integer,0) then raise exception using errcode='P7231',message='Tekshiruv qoralamasi boshqa oynada yangilangan. Avval nusxalarni solishtiring.';end if;
  end if;
  if length(btrim(coalesce(p->>'writing','')))<30 or length(p->>'writing')>20000 or not public.sq_en_recording_ok(uid,ch.id,p->'speaking') then raise exception 'Writing va speaking namunasini to‘liq topshiring.';end if;
  update public.sq_en_checks set state=ch.state||jsonb_build_object('writing',p->>'writing','speaking',p->'speaking','draftVersion',coalesce((ch.state->>'draftVersion')::integer,0)+1),status='submitted',updated_at=now() where sq_en_checks.id=ch.id returning * into ch;out:=public.sq_en_check_view(ch);
 elsif p_action='vocabSave' then
  select * into r from public.sq_en_runs where sq_en_runs.id=(p->>'id')::uuid and user_id=uid;
  if not found then raise exception 'Darsdagi so‘zga ruxsat yo‘q.';end if;
  select value into item from jsonb_array_elements(r.snapshot->'vocabulary') where value->>'id'=p->>'wordId';if not found then raise exception 'So‘z topilmadi.';end if;
  insert into public.sq_en_vocab(user_id,word_id,word) values(uid,item->>'id',item) on conflict do nothing;out:=jsonb_build_object('ok',true);
 elsif p_action='vocabReview' then
  select word into item from public.sq_en_vocab where user_id=uid and word_id=p->>'wordId' for update;if not found then raise exception 'So‘z topilmadi.';end if;
  correct:=case when public.sq_en_norm(p->>'answer')=public.sq_en_norm(item->>'meaning') then 1 else 0 end;
  if length(coalesce(p->>'sentence',''))>2000 then raise exception 'Gap juda uzun.';end if;
  update public.sq_en_vocab set attempts=attempts+1,streak=case when correct=1 then least(streak+1,8) else 0 end,due_at=now()+case when correct=0 then interval '10 minutes' else make_interval(days=>least(30,power(2,least(streak,5))::integer)) end,sentence=p->>'sentence' where user_id=uid and word_id=p->>'wordId';
  out:=jsonb_build_object('correct',correct=1,'expected',item->>'meaning','note','Misol gapingiz saqlandi. Birikmani mazmunga mos qo‘llash ustoz rubrikasida tekshiriladi.');
 elsif p_action='teacher' then
  if not staff then raise exception 'Ustoz ruxsati kerak.';end if;
  out:=jsonb_build_object('groups',(select coalesce(jsonb_agg(to_jsonb(g)),'[]') from public.sq_class_groups g where g.owner_id=uid or public.sq_is_admin()),
   'students',(select coalesce(jsonb_agg(jsonb_build_object('id',m.student_id,'name',m.student_name,'groupId',m.group_id,'profile',(select to_jsonb(pr) from public.sq_en_profiles pr where pr.user_id=m.student_id))),'[]') from public.sq_class_members m join public.sq_class_groups g on g.id=m.group_id where g.owner_id=uid or public.sq_is_admin()),
   'runs',(select coalesce(jsonb_agg(public.sq_en_run_view(r0)||jsonb_build_object('studentId',r0.user_id,'rubrics',r0.snapshot->'rubrics','task',r0.snapshot->'writing'->>'task','speakingTask',r0.snapshot->'speaking'->>'task')),'[]') from public.sq_en_runs r0 where public.sq_en_staff(r0.user_id)),
   'checks',(select coalesce(jsonb_agg(public.sq_en_check_view(c0)||jsonb_build_object('studentId',c0.user_id)),'[]') from public.sq_en_checks c0 where public.sq_en_staff(c0.user_id)),
   'assignments',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.sq_en_assignments a where a.owner_id=uid or public.sq_is_admin()),
   'content',(select coalesce(jsonb_agg((to_jsonb(x)-'payload')||jsonb_build_object('payload',jsonb_build_object('id',x.base_id,'level',x.payload->>'level','title',x.payload->>'title','objective',x.payload->>'objective'))),'[]') from (select distinct on(id) * from public.sq_en_content where owner_id is null or owner_id=uid or public.sq_is_admin() order by id,revision desc) x));
 elsif p_action='joinGroup' then
  if length(btrim(coalesce(p->>'name',''))) not between 2 and 60 then raise exception 'Guruhdagi ismingizni kiriting (2–60 belgi).';end if;
  select g.id into id from public.sq_class_groups g where g.join_code=upper(btrim(p->>'code')) and g.active for update;
  if not found then return jsonb_build_object('error','Kod mos kelmadi yoki guruh yopilgan.');end if;
  if (select count(*) from public.sq_class_members m where m.group_id=id)>=150 and not exists(select 1 from public.sq_class_members m where m.group_id=id and m.student_id=uid) then return jsonb_build_object('error','Guruh to‘ldi.');end if;
  insert into public.sq_class_members(group_id,student_id,student_name) values(id,uid,btrim(p->>'name')) on conflict do nothing;out:=jsonb_build_object('ok',true);
 elsif p_action='assign' then
  if not staff or not exists(select 1 from public.sq_class_groups g where g.id=(p->>'groupId')::uuid and (g.owner_id=uid or public.sq_is_admin())) then raise exception 'Guruh egasining ruxsati kerak.';end if;
  select * into c from public.sq_en_content where sq_en_content.id=p->>'contentId' and revision=(p->>'revision')::integer and status='published' and (owner_id is null or owner_id=uid or public.sq_is_admin());if not found then raise exception 'Kontentga ruxsat yo‘q yoki draft.';end if;
  insert into public.sq_en_assignments(owner_id,group_id,base_id,content_id,revision,deadline,threshold) values(uid,(p->>'groupId')::uuid,c.base_id,c.id,c.revision,nullif(p->>'deadline','')::timestamptz,coalesce((p->>'threshold')::integer,80));out:=jsonb_build_object('ok',true);
 elsif p_action='assignmentOff' then
  update public.sq_en_assignments set active=false where sq_en_assignments.id=(p->>'id')::uuid and (owner_id=uid or public.sq_is_admin());if not found then raise exception 'Biriktirishga ruxsat yo‘q.';end if;out:=jsonb_build_object('ok',true);
 elsif p_action='review' then
  grades:=p->'grades';
  if jsonb_typeof(grades->'writing') is distinct from 'array' or jsonb_typeof(grades->'speaking') is distinct from 'array' then raise exception 'Writing va speaking rubrikalari to‘liq bo‘lsin.';end if;
  if jsonb_array_length(grades->'writing')<>4 or jsonb_array_length(grades->'speaking')<>4 or exists(select 1 from jsonb_array_elements((grades->'writing')||(grades->'speaking')) v where jsonb_typeof(v) is distinct from 'number' or (v#>>'{}')::numeric not between 0 and 5 or (v#>>'{}')::numeric<>trunc((v#>>'{}')::numeric)) then raise exception 'Har rubrika mezoni 0–5 ball bo‘lsin.';end if;
  select round(sum((v#>>'{}')::numeric)*5) into w from jsonb_array_elements(grades->'writing') v;select round(sum((v#>>'{}')::numeric)*5) into s from jsonb_array_elements(grades->'speaking') v;
  if length(btrim(coalesce(p->>'feedback','')))<12 or length(p->>'feedback')>5000 then raise exception 'Mazmunli feedback yozing.';end if;
  res:=jsonb_build_object('grades',grades,'writing',w,'speaking',s,'text',p->>'feedback','reviewer',uid,'at',now());
  if p->>'kind'='check' then
   select * into ch from public.sq_en_checks where sq_en_checks.id=(p->>'id')::uuid for update;if not found or not public.sq_en_staff(ch.user_id) or ch.status<>'submitted' then raise exception 'Tekshiruvni baholashga ruxsat yo‘q.';end if;
   threshold:=coalesce((select pr.threshold from public.sq_en_profiles pr where pr.user_id=ch.user_id),(select settings.threshold from public.sq_en_settings settings where settings.id));
   correct:=case when w>=threshold and s>=threshold and not exists(select 1 from jsonb_each(ch.result->'skills') v where coalesce((v.value->>'score')::numeric,0)<threshold) then 1 else 0 end;
   ch.status:=case when correct=1 then 'mastered' else 'needs_revision' end;
   update public.sq_en_checks set status=ch.status,result=ch.result||jsonb_build_object('review',res),updated_at=now() where sq_en_checks.id=ch.id;
   if correct=1 then update public.sq_en_profiles set placement_complete=true,open_level=greatest(open_level,case when ch.kind='placement' then (ch.result->>'recommended')::integer else least(ch.level+1,5) end),updated_at=now() where user_id=ch.user_id;end if;
  else
   select * into r from public.sq_en_runs where sq_en_runs.id=(p->>'id')::uuid for update;if not found or not public.sq_en_staff(r.user_id) or r.status<>'submitted' then raise exception 'Ishni baholashga ruxsat yo‘q.';end if;
   threshold:=coalesce((select pr.threshold from public.sq_en_profiles pr where pr.user_id=r.user_id),(select settings.threshold from public.sq_en_settings settings where settings.id));
   select greatest(threshold,coalesce(max(a.threshold),threshold)) into threshold from public.sq_en_assignments a where a.content_id=r.content_id and a.revision=r.revision and a.active and exists(select 1 from public.sq_class_members m where m.group_id=a.group_id and m.student_id=r.user_id);
   r.status:=case when w>=threshold and s>=threshold and coalesce((r.state->'exit'->>'score')::numeric,0)>=threshold then 'mastered' else 'needs_revision' end;
   update public.sq_en_runs set status=r.status,feedback=res,updated_at=now() where sq_en_runs.id=r.id;
  end if;out:=jsonb_build_object('ok',true,'status',case when p->>'kind'='check' then ch.status else r.status end,'feedback',res);
 elsif p_action='override' then
  id:=(p->>'studentId')::uuid;lev:=(p->>'level')::integer;
  if not public.sq_en_staff(id) or lev not between 0 and 5 or length(btrim(coalesce(p->>'reason','')))<12 then raise exception 'Guruh ruxsati va asosli sabab kerak.';end if;
  insert into public.sq_en_profiles(user_id,placement_complete,open_level,recommended,threshold) values(id,true,lev,lev,(p->>'threshold')::integer) on conflict(user_id) do update set placement_complete=true,open_level=excluded.open_level,recommended=excluded.recommended,threshold=excluded.threshold,updated_at=now();
  insert into public.sq_en_audit(actor_id,student_id,reason,change) values(uid,id,p->>'reason',p-'reason'-'token');out:=jsonb_build_object('ok',true);
 elsif p_action='editContent' then
  if not staff then raise exception 'Ustoz ruxsati kerak.';end if;
  select payload into lesson from public.sq_en_content where sq_en_content.id=p->>'id' and revision=(p->>'revision')::integer and (owner_id is null or owner_id=uid or public.sq_is_admin());if not found then raise exception 'Kontentga ruxsat yo‘q.';end if;out:=lesson;
 elsif p_action='contentSave' then
  if not staff then raise exception 'Ustoz ruxsati kerak.';end if;
  lesson:=p->'payload';prev:=lesson->>'baseId';
  if jsonb_typeof(lesson) is distinct from 'object' then raise exception 'Dars modeli JSON obyekt bo‘lsin.';end if;
  foreach term in array array['examples','rules','visuals','vocabulary','exercises','exit'] loop
   if jsonb_typeof(lesson->term) is distinct from 'array' then raise exception 'Dars modeli to‘liq bo‘lsin: %.',term;end if;
  end loop;
  if jsonb_typeof(lesson->'reading'->'questions') is distinct from 'array' or jsonb_typeof(lesson->'listening'->'questions') is distinct from 'array' or jsonb_typeof(lesson->'writing'->'plan') is distinct from 'array' or jsonb_typeof(lesson->'rubrics'->'writing') is distinct from 'array' or jsonb_typeof(lesson->'rubrics'->'speaking') is distinct from 'array' then raise exception 'Ko‘nikma vazifalari va rubrikalari to‘liq bo‘lsin.';end if;
  if jsonb_array_length(lesson->'rules')<3 or jsonb_array_length(lesson->'visuals')<>2 or jsonb_array_length(lesson->'vocabulary')<3 or jsonb_array_length(lesson->'reading'->'questions')<3 or jsonb_array_length(lesson->'listening'->'questions')<4 or jsonb_array_length(lesson->'writing'->'plan')=0 or jsonb_array_length(lesson->'rubrics'->'writing')<>4 or jsonb_array_length(lesson->'rubrics'->'speaking')<>4 then raise exception 'Darsning majburiy qismlari yetishmayapti.';end if;
  select * into c from public.sq_en_content where base_id=prev and owner_id is null order by revision desc limit 1;
  if not found or (lesson->>'id') is distinct from prev or (lesson->>'level') is distinct from (c.payload->>'level') or (lesson->>'order')::integer is distinct from c.ordinal or coalesce(lesson->>'title','')='' or coalesce(lesson->>'objective','')='' or jsonb_array_length(lesson->'examples')<6 or jsonb_array_length(lesson->'exercises')<3 or jsonb_array_length(lesson->'exit')<>2 or length(coalesce(lesson->'reading'->>'text',''))<30 or length(coalesce(lesson->'listening'->>'transcript',''))<15 or coalesce(lesson->'writing'->>'task','')='' or coalesce(lesson->'speaking'->>'task','')='' then raise exception 'Dars modeli to‘liq va asosiy tartibga mos bo‘lsin.';end if;
  if coalesce(lesson->'writing'->>'minWords','') !~ '^[0-9]+$' or coalesce(lesson->'writing'->>'maxWords','') !~ '^[0-9]+$' then raise exception 'Writing so‘z chegaralari musbat butun son bo‘lsin.';end if;
  if (lesson->'writing'->>'minWords')::integer not between 5 and 1000 or (lesson->'writing'->>'maxWords')::integer<(lesson->'writing'->>'minWords')::integer then raise exception 'Writing so‘z chegaralari mos bo‘lsin.';end if;
  for item in select value from jsonb_array_elements(lesson->'exit') loop
   if jsonb_typeof(item) is distinct from 'array' then raise exception 'Chiqish varianti savollar ro‘yxati bo‘lsin.';end if;
   if jsonb_array_length(item)<>5 then raise exception 'Har chiqish variantida beshta savol bo‘lsin.';end if;
  end loop;
  if exists(select 1 from jsonb_array_elements((lesson->'exercises')||(lesson->'reading'->'questions')||(lesson->'listening'->'questions')) z where coalesce(jsonb_array_length(z->'answers'),0)=0 or coalesce(z->>'explanation','')='') then raise exception 'Mashq javobi va izohi kerak.';end if;
  for term in select unnest(array[lesson->'listening'->>'audio',lesson->'pronunciation'->>'audio']) loop if coalesce(term,'') !~ '^/english-course/[-a-zA-Z0-9_./]+\.mp3$' then raise exception 'Audio shu saytdagi english-course MP3 manzili bo‘lsin.';end if;end loop;
  if exists(select 1 from jsonb_array_elements(coalesce(lesson->'sources','[]')) z where z->>'url' !~ '^https://') then raise exception 'Manba havolasi HTTPS bo‘lsin.';end if;
  term:=case when public.sq_is_admin() and coalesce((p->>'global')::boolean,false) then prev else prev||':'||uid::text end;
  perform pg_advisory_xact_lock(hashtextextended(term,723));select coalesce(max(revision),0)+1 into variant from public.sq_en_content where sq_en_content.id=term;
  insert into public.sq_en_content(id,revision,base_id,owner_id,level,ordinal,status,payload) values(term,variant,prev,case when term=prev then null else uid end,c.level,c.ordinal,case when p->>'status'='published' then 'published' else 'draft' end,lesson||jsonb_build_object('revision',variant));out:=jsonb_build_object('ok',true,'id',term,'revision',variant);
 elsif p_action='settings' then
  if not public.sq_is_admin() then raise exception 'Admin ruxsati kerak.';end if;
  update public.sq_en_settings set active=coalesce((p->>'active')::boolean,active),threshold=coalesce((p->>'threshold')::integer,sq_en_settings.threshold) where sq_en_settings.id;out:=jsonb_build_object('ok',true);
 else raise exception 'Noma’lum amal.';end if;
 if tok is not null then
  delete from public.sq_en_actions where user_id=uid and created_at<now()-interval '2 days';
  insert into public.sq_en_actions(user_id,token,response) values(uid,tok,out) on conflict do nothing;
 end if;return out;
 end
$$;


revoke all on function public.sq_en_check_view(public.sq_en_checks) from public,anon,authenticated;
revoke all on function public.sq_en(text,jsonb) from public,anon;
grant execute on function public.sq_en(text,jsonb) to authenticated;
commit;
