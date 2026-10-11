-- SinfQuiz 7.29.0. Upgrade AFTER 7.28; repeatable, no Cron/secrets required.
begin;
alter table public.sq_competitions add column if not exists order_mode text not null default 'guided' check(order_mode in ('guided','free'));
alter table public.sq_comp_members add column if not exists selected_stage_id uuid references public.sq_comp_stages(id) on delete set null;
alter table public.sq_comp_attempts add column if not exists draft jsonb not null default '{}';
alter table public.sq_comp_attempts add column if not exists draft_version integer not null default 0;
alter table public.sq_comp_attempts add column if not exists draft_saved_at timestamptz;
alter table public.sq_comp_attempts add column if not exists finish_reason text;
create index if not exists sq_comp_open_deadlines on public.sq_comp_attempts(competition_id,started_at) where finished_at is null;


-- A typed, bounded parser. IF evaluates only the selected branch. No dynamic SQL.
create or replace function public.sq_excel_normalize(p_raw text) returns text language plpgsql immutable set search_path='' as $$
 declare s text:=coalesce(p_raw,'');out text:='';part text;parts text[];
 begin
  for parts in select regexp_matches(s,'("(?:[^"]|"")*"|[^" ]+|[ ]+|")','g') loop
   part:=parts[1];
   if left(part,1)<>'"' then
    part:=upper(part);part:=replace(replace(replace(replace(replace(replace(replace(replace(part,'СРЗНАЧ','AVERAGE'),'СУММ','SUM'),'ЕСЛИ','IF'),'ИЛИ','OR'),'НЕ(','NOT('),'И(','AND('),'ИСТИНА','TRUE'),'ЛОЖЬ','FALSE');
   end if;out:=out||part;
  end loop;return out;
 end
$$;
create or replace function public.sq_excel_truth(p_v jsonb) returns boolean language plpgsql immutable set search_path='' as $$
 begin if jsonb_typeof(p_v)='boolean' then return (p_v#>>'{}')::boolean;elsif jsonb_typeof(p_v)='number' then return (p_v#>>'{}')::numeric<>0;else raise exception 'Mantiqiy shart kerak';end if;end
$$;
create or replace function public.sq_excel_number(p_v jsonb) returns numeric language plpgsql immutable set search_path='' as $$
 begin if jsonb_typeof(p_v)='number' then return (p_v#>>'{}')::numeric;elsif jsonb_typeof(p_v)='boolean' then return case when (p_v#>>'{}')::boolean then 1 else 0 end;else raise exception 'Sonli qiymat kerak';end if;end
$$;
create or replace function public.sq_comp_excel_value(p_cells jsonb,p_address text,p_seen text[] default '{}') returns jsonb language plpgsql set search_path='' as $$
 declare addr text:=upper(replace(p_address,'$',''));raw text;tokens text[];parts text[];r jsonb;source text;matched text:='';token text;
 begin
  if addr !~ '^[A-D][1-8]$' then raise exception 'Katak manzili A1–D8 oralig‘ida bo‘lsin';end if;
  if addr=any(p_seen) or cardinality(p_seen)>16 then raise exception 'Aylanma katak havolasi';end if;
  raw:=btrim(coalesce(p_cells->>addr,''));if raw='' then return '0';end if;
  if left(raw,1)<>'=' then if raw~'^[+-]?[0-9]+(\.[0-9]+)?$' then return to_jsonb(raw::numeric);else return to_jsonb(raw);end if;end if;
  source:=public.sq_excel_normalize(substr(raw,2));if length(source)>240 then raise exception 'Formula 240 belgidan oshmasin';end if;
  for parts in select regexp_matches(source,'[[:space:]]*("(?:[^"]|"")*"|AVERAGE|SUM|IF|AND|OR|NOT|TRUE|FALSE|\$?[A-D]\$?[1-8]|[0-9]+(?:\.[0-9]+)?|>=|<=|<>|[=<>()+*/,:;-])[[:space:]]*','g') loop
   token:=parts[1];tokens:=array_append(tokens,token);matched:=matched||token;
  end loop;
  -- Compare outside-string whitespace only; strings retain their exact text.
  if cardinality(tokens) is null or cardinality(tokens)>120 or replace(regexp_replace(source,'[[:space:]]','','g'),'','')<>regexp_replace(matched,'[[:space:]]','','g') then raise exception 'Formula belgisi noto‘g‘ri';end if;
  r:=public.sq_excel_expr(tokens,1,0,p_cells,array_append(p_seen,addr),true,0);
  if (r->>'next')::integer<=cardinality(tokens) then raise exception 'Formula oxirida ortiqcha belgi';end if;return r->'value';
 end
$$;
create or replace function public.sq_excel_expr(p_tokens text[],p_at integer,p_min integer,p_cells jsonb,p_seen text[],p_eval boolean,p_depth integer) returns jsonb language plpgsql set search_path='' as $$
 declare i integer:=p_at;tok text;v jsonb:='0';r jsonb;a jsonb;b jsonb;yes boolean;vals jsonb:='[]';op text;prec integer;startref text;endref text;addr text;rowno integer;col integer;raw text;n numeric;num numeric[]:='{}';value jsonb;total numeric;parts text[];
 begin
  if p_depth>32 then raise exception 'Qavslar juda ko‘p';end if;tok:=p_tokens[i];i:=i+1;
  if tok in ('+','-') then r:=public.sq_excel_expr(p_tokens,i,4,p_cells,p_seen,p_eval,p_depth+1);i:=(r->>'next')::integer;if p_eval then v:=to_jsonb(public.sq_excel_number(r->'value')*case when tok='-' then -1 else 1 end);end if;
  elsif tok='(' then r:=public.sq_excel_expr(p_tokens,i,0,p_cells,p_seen,p_eval,p_depth+1);v:=r->'value';i:=(r->>'next')::integer;if p_tokens[i] is distinct from ')' then raise exception 'Qavs yopilmagan';end if;i:=i+1;
  elsif tok='IF' then
   if p_tokens[i] is distinct from '(' then raise exception 'IF uchun qavs kerak';end if;
   r:=public.sq_excel_expr(p_tokens,i+1,0,p_cells,p_seen,p_eval,p_depth+1);i:=(r->>'next')::integer;yes:=p_eval and public.sq_excel_truth(r->'value');
   if p_tokens[i] not in (',',';') or p_tokens[i] is null then raise exception 'Argument ajratgichi kerak';end if;
   r:=public.sq_excel_expr(p_tokens,i+1,0,p_cells,p_seen,yes,p_depth+1);a:=r->'value';i:=(r->>'next')::integer;b:='false';
   if p_tokens[i] in (',',';') then r:=public.sq_excel_expr(p_tokens,i+1,0,p_cells,p_seen,p_eval and not yes,p_depth+1);b:=r->'value';i:=(r->>'next')::integer;end if;
   if p_tokens[i] is distinct from ')' then raise exception 'IF qavsi yopilmagan';end if;i:=i+1;if p_eval then v:=case when yes then a else b end;end if;
  elsif tok in ('AND','OR','NOT') then
   if p_tokens[i] is distinct from '(' then raise exception 'Mantiqiy funksiya qavsi kerak';end if;i:=i+1;
   loop r:=public.sq_excel_expr(p_tokens,i,0,p_cells,p_seen,p_eval,p_depth+1);i:=(r->>'next')::integer;vals:=vals||jsonb_build_array(r->'value');if jsonb_array_length(vals)>20 then raise exception 'Argumentlar ko‘p';end if;
    exit when p_tokens[i] not in (',',';') or p_tokens[i] is null;i:=i+1;end loop;
   if p_tokens[i] is distinct from ')' or (tok='NOT' and jsonb_array_length(vals)<>1) then raise exception 'Mantiqiy argumentlar noto‘g‘ri';end if;i:=i+1;
   if p_eval then if tok='NOT' then v:=to_jsonb(not public.sq_excel_truth(vals->0));else select case when tok='AND' then to_jsonb(bool_and(public.sq_excel_truth(x))) else to_jsonb(bool_or(public.sq_excel_truth(x))) end into v from jsonb_array_elements(vals) x;end if;end if;
  elsif tok in ('SUM','AVERAGE') then
   if p_tokens[i] is distinct from '(' or p_tokens[i+2] is distinct from ':' or p_tokens[i+4] is distinct from ')' then raise exception 'Funksiya oralig‘i noto‘g‘ri';end if;
   startref:=replace(p_tokens[i+1],'$','');endref:=replace(p_tokens[i+3],'$','');i:=i+5;
   if startref !~ '^[A-D][1-8]$' or endref !~ '^[A-D][1-8]$' or ascii(startref)>ascii(endref) or substr(startref,2)::int>substr(endref,2)::int then raise exception 'Oraliq tartibi noto‘g‘ri';end if;
   if p_eval then
    for rowno in substr(startref,2)::int..substr(endref,2)::int loop for col in ascii(startref)..ascii(endref) loop
     addr:=chr(col)||rowno;raw:=btrim(coalesce(p_cells->>addr,''));if raw~'^[+-]?[0-9]+(\.[0-9]+)?$' or left(raw,1)='=' then value:=public.sq_comp_excel_value(p_cells,addr,p_seen);if jsonb_typeof(value)='number' then num:=array_append(num,public.sq_excel_number(value));end if;end if;
    end loop;end loop;
    select coalesce(sum(x),0) into n from unnest(num) x;if tok='AVERAGE' then if cardinality(num)=0 then raise exception 'O‘rtacha uchun sonli katak yo‘q';end if;n:=n/cardinality(num);end if;v:=to_jsonb(n);
   end if;
  elsif tok~'^\$?[A-D]\$?[1-8]$' then if p_eval then v:=public.sq_comp_excel_value(p_cells,tok,p_seen);end if;
  elsif tok~'^[0-9]+(\.[0-9]+)?$' then if p_eval then v:=to_jsonb(tok::numeric);end if;
  elsif tok in ('TRUE','FALSE') then if p_eval then v:=to_jsonb(tok='TRUE');end if;
  elsif left(tok,1)='"' then if p_eval then v:=to_jsonb(replace(substr(tok,2,length(tok)-2),'""','"'));end if;
  else raise exception 'Formula belgisi noto‘g‘ri';end if;
  loop
   op:=p_tokens[i];prec:=case when op in ('=','<>','>','<','>=','<=') then 1 when op in ('+','-') then 2 when op in ('*','/') then 3 else -1 end;exit when prec<p_min;
   r:=public.sq_excel_expr(p_tokens,i+1,prec+1,p_cells,p_seen,p_eval,p_depth+1);i:=(r->>'next')::int;if not p_eval then continue;end if;
   if prec=1 then
    a:=case when jsonb_typeof(v)='string' then to_jsonb(lower(v#>>'{}')) else v end;b:=case when jsonb_typeof(r->'value')='string' then to_jsonb(lower(r->'value'#>>'{}')) else r->'value' end;
    v:=to_jsonb(case op when '=' then a=b when '<>' then a<>b when '>' then a>b when '<' then a<b when '>=' then a>=b else a<=b end);
   else n:=public.sq_excel_number(v);total:=public.sq_excel_number(r->'value');if op='/' and total=0 then raise exception 'Nolga bo‘lib bo‘lmaydi';end if;v:=to_jsonb(case op when '+' then n+total when '-' then n-total when '*' then n*total else n/total end);end if;
  end loop;return jsonb_build_object('value',v,'next',i);
 end
$$;
create or replace function public.sq_comp_excel(p_cells jsonb,p_address text,p_seen text[] default '{}') returns numeric language plpgsql set search_path='' as $$
 begin return public.sq_excel_number(public.sq_comp_excel_value(p_cells,p_address,p_seen));end
$$;


create or replace function public.sq_comp_grade(p_q jsonb,p_answer jsonb) returns jsonb language plpgsql set search_path='' as $$
 <<assessment>>
 declare ratio numeric:=0;checks jsonb:='[]';value text:=coalesce(p_answer#>>'{}','');sub jsonb;item jsonb;ok boolean;formula text;key text;n integer:=0;passed integer:=0;kind text:=p_q->>'type';
 begin
  if length(p_answer::text)>20000 then return jsonb_build_object('ratio',0,'checks','[]'::jsonb);end if;
  if kind='test' then ratio:=case when p_answer=p_q->'correct' then 1 else 0 end;
  elsif kind='shortcut' then ratio:=case when public.sq_comp_shortcut(value)=public.sq_comp_shortcut(p_q->>'answer') then 1 else 0 end;
  elsif kind='python' then
   return jsonb_build_object('ratio',0,'checks',jsonb_build_array(jsonb_build_object('label','Kod shu brauzerda mashq sifatida bajarildi.','passed',false)),'practiceOnly',true,'verification','local-practice','message','Python natijasi serverdagi ajratilgan bajaruvchida tekshirilmagan. Bu mashq reyting balliga qo‘shilmaydi.');
  elsif kind='prompt' then
   for item in select x from jsonb_array_elements(coalesce(p_q->'criteria','[]')) x loop
    select exists(select 1 from jsonb_array_elements_text(item->'keywords') k where public.sq_comp_norm(k)<>'' and position(public.sq_comp_norm(k) in public.sq_comp_norm(assessment.value))>0) into ok;
    checks:=checks||jsonb_build_array(jsonb_build_object('label',item->>'label','passed',ok));n:=n+1;if ok then passed:=passed+1;end if;
   end loop;ratio:=passed::numeric/greatest(n,1);
  elsif kind='office' then
   begin sub:=value::jsonb;exception when others then sub:='{}';end;
   if sub->>'kind' is not distinct from p_q->'officeTask'->>'kind' then
    for item in select x from jsonb_array_elements(coalesce(p_q->'officeRubric',p_q->'officeTask'->'rubric','[]')) x loop
     ok:=false;
     begin
      if item->>'kind'='excelCell' then ok:=public.sq_comp_norm(sub->'cells'->>(item->>'cell'))=public.sq_comp_norm(item->>'value');
      elsif item->>'kind'='excelFormula' then
       formula:=upper(regexp_replace(public.sq_excel_normalize(coalesce(sub->'cells'->>(item->>'cell'),'')),'\s','','g'));
       formula:=regexp_replace(formula,'"([^"]|"")*"','""','g');
       ok:=left(formula,1)='=' and (not (item?'fn') or position((item->>'fn')||'(' in formula)>0) and not exists(select 1 from jsonb_array_elements_text(coalesce(item->'functions','[]')) fn where position(fn||'(' in formula)=0) and not exists(select 1 from jsonb_array_elements_text(coalesce(item->'references','[]')) ref where not exists(select 1 from regexp_matches(formula,'\$?[A-D]\$?[1-8]','g') token where token[1]=ref)) and abs(public.sq_comp_excel(sub->'cells',item->>'cell')-(item->>'expected')::numeric)<.001;
      elsif item->>'kind'='wordText' then ok:=length(btrim(coalesce(sub->>'title',''))) between 3 and 1000 and length(btrim(coalesce(sub->>'body',''))) between 3 and 1000;
      elsif item->>'kind'='wordTable' then ok:=jsonb_array_length(sub->'table')>=2 and not exists(select 1 from jsonb_array_elements(sub->'table') with ordinality rows(x,i) where i<=2 and (jsonb_array_length(x)<2 or length(btrim(coalesce(x->>0,''))) not between 1 and 100 or length(btrim(coalesce(x->>1,''))) not between 1 and 100));
      elsif item->>'kind'='wordFormat' then ok:=sub->'titleFormat'->(item->>'field')=item->'value';
      elsif item->>'kind'='wordTableCells' then ok:=not exists(select 1 from jsonb_array_elements(item->'cells') with ordinality r(v,i) cross join lateral jsonb_array_elements_text(r.v) with ordinality c(v,j) where public.sq_comp_norm(sub->'table'->((r.i-1)::int)->>((c.j-1)::int))<>public.sq_comp_norm(c.v));
      elsif item->>'kind'='wordImage' then ok:=sub->'imageInserted'='true'::jsonb;
      elsif item->>'kind'='wordWrap' then ok:=sub->'imageInserted'='true'::jsonb and sub->>'wrap'=item->>'value';
      elsif item->>'kind'='wordReference' then ok:=not exists(select 1 from unnest(array['recipient','date','source']) f where length(btrim(coalesce(sub->'reference'->>f,''))) not between 3 and 1000);
      elsif item->>'kind'='pptSlides' then ok:=jsonb_array_length(sub->'slides')>=2 and sub->'slides'->0->>'title'<>sub->'slides'->1->>'title' and not exists(select 1 from jsonb_array_elements(sub->'slides') with ordinality slides(x,i) where i<=2 and (length(btrim(coalesce(x->>'title',''))) not between 3 and 1000 or length(btrim(coalesce(x->>'body',''))) not between 3 and 1000));
      elsif item->>'kind'='pptImage' then ok:=exists(select 1 from jsonb_array_elements(sub->'slides') slide where slide->'imageInserted'='true'::jsonb);
      elsif item->>'kind'='pptNotes' then ok:=length(btrim(coalesce(sub->'slides'->1->>'notes',''))) between 3 and 1000;
      end if;
     exception when others then ok:=false;end;
     checks:=checks||jsonb_build_array(jsonb_build_object('label',item->>'label','passed',coalesce(ok,false)));n:=n+1;if ok then passed:=passed+1;end if;
    end loop;
   end if;ratio:=passed::numeric/greatest(n,1);
  else
   for item in select x from jsonb_array_elements(jsonb_build_array(p_q->'answer')||coalesce(p_q->'acceptedAnswers','[]')) x loop
    if (case when p_q->>'subject'='Excel' then replace(public.sq_comp_norm(assessment.value),' ','')=replace(public.sq_comp_norm(item#>>'{}'),' ','') else public.sq_comp_norm(assessment.value)=public.sq_comp_norm(item#>>'{}') end) then ratio:=1;exit;end if;
   end loop;
  end if;
  return jsonb_build_object('ratio',ratio,'checks',checks);
 end
$$;


create or replace function public.sq_comp_save(p_id uuid,p_config jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 declare old public.sq_competitions;stage jsonb;team jsonb;data jsonb;i integer:=0;size integer;code text;roster jsonb;owner uuid;
 begin
  if coalesce(p_config->>'orderMode','guided') not in ('guided','free') then raise exception 'Bosqich tartibini tanlang';end if;
  if auth.uid() is null or not coalesce(public.sq_is_teacher(),false) then raise exception 'Ustoz sifatida kiring';end if;
  if length(p_config::text)>350000 or jsonb_typeof(p_config->'stages') is distinct from 'array' or jsonb_array_length(p_config->'stages') not between 4 and 24 or jsonb_typeof(p_config->'teams') is distinct from 'array' or jsonb_array_length(p_config->'teams') not between 2 and 32 then raise exception 'Kamida 4 bosqich va 2 jamoa kerak';end if;
  if coalesce(p_config->>'teamSize','') !~ '^[0-9]{1,2}$' then raise exception 'Jamoa hajmini kiriting';end if;size:=(p_config->>'teamSize')::integer;
  select c.* into old from public.sq_competitions c where c.id=p_id for update;
  if found then if not public.sq_comp_owner(p_id) then raise exception 'Begona musobaqani o‘zgartirish mumkin emas';end if;if old.status<>'draft' then raise exception 'Faollashtirilgan musobaqaning tarkibi o‘zgarmaydi';end if;owner:=old.owner_id;
  else owner:=auth.uid();end if;
  insert into public.sq_competitions(id,owner_id,title,description,team_size,visibility,order_mode) values(p_id,owner,btrim(p_config->>'title'),coalesce(p_config->>'description',''),size,coalesce(p_config->>'visibility','public'),coalesce(p_config->>'orderMode','guided')) on conflict(id) do update set title=excluded.title,description=excluded.description,team_size=excluded.team_size,visibility=excluded.visibility,order_mode=excluded.order_mode,updated_at=clock_timestamp();
  delete from public.sq_comp_stages s where s.competition_id=p_id;delete from public.sq_comp_teams t where t.competition_id=p_id;
  for team in select x from jsonb_array_elements(p_config->'teams') x loop
   roster:=coalesce(team->'roster','[]');
   if jsonb_array_length(roster) not in (0,size) or exists(select 1 from jsonb_array_elements_text(roster) n where length(btrim(n)) not between 2 and 40) or (select count(distinct public.sq_comp_norm(n)) from jsonb_array_elements_text(roster) n)<>jsonb_array_length(roster) then raise exception 'Ro‘yxat bo‘sh yoki jamoa hajmiga teng, ismlar esa farqli bo‘lsin';end if;
   loop
    code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    exit when not exists(select 1 from public.sq_comp_teams t where t.join_code=code);
   end loop;
   insert into public.sq_comp_teams(competition_id,title,join_code,roster) values(p_id,btrim(team->>'title'),code,roster);
  end loop;
  for stage in select x from jsonb_array_elements(p_config->'stages') x loop
   i:=i+1;data:=public.sq_comp_prepare(stage);
   insert into public.sq_comp_stages(competition_id,position,title,kind,duration,weight,config,data) values(p_id,i,btrim(stage->>'title'),stage->>'kind',(stage->>'duration')::integer,(stage->>'weight')::integer,stage-'custom',data);
  end loop;
  perform public.sq_comp_tick(p_id);return jsonb_build_object('id',p_id);
 end
$$;


-- Finalize only data received before the server deadline. Score/time are never client inputs.
create or replace function public.sq_comp_finalize(p_id uuid,p_stage uuid,p_user uuid,p_reason text) returns void language plpgsql set search_path='' as $$
 <<finalize>>
 declare c public.sq_competitions;s public.sq_comp_stages;a public.sq_comp_attempts;q jsonb;g jsonb;deadline timestamptz;stop_at timestamptz;spent numeric;maximum numeric;points numeric;score numeric;correct integer;feedback jsonb;chars integer;wpm numeric;accuracy numeric;response jsonb;
 begin
  select x.* into c from public.sq_competitions x where x.id=p_id;
  select x.* into s from public.sq_comp_stages x where x.id=p_stage and x.competition_id=p_id;
  select x.* into a from public.sq_comp_attempts x where x.competition_id=p_id and x.stage_id=p_stage and x.user_id=p_user for update;
  if a.stage_id is null or a.finished_at is not null then return;end if;
  deadline:=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration);
  stop_at:=least(clock_timestamp(),deadline);spent:=greatest(0,extract(epoch from stop_at-a.started_at));points:=a.points;score:=a.score;correct:=a.correct;
  feedback:=jsonb_build_object('message',case p_reason when 'time' then 'Vaqt tugadi. Serverga saqlangan ish baholandi; bajarilmagan qism uchun ball berilmadi.' when 'teacher' then 'Ustoz bosqichni yopdi. Saqlangan ish baholandi.' when 'cancel' then 'Musobaqa to‘xtatildi. Saqlangan ish baholandi.' else 'Bosqich yakunlandi. Bajarilgan ish hisobga olindi.' end);
  if s.kind='quiz' then
   q:=s.data->'questions'->a.cursor;
   if q is not null and a.draft->>'questionId'=q->>'id' and a.draft?'answer' then
    g:=public.sq_comp_grade(q,a.draft->'answer');points:=points+(q->>'points')::numeric*(g->>'ratio')::numeric;
    correct:=correct+case when (g->>'ratio')::numeric=1 then 1 else 0 end;
    feedback:=feedback||g||jsonb_build_object('explanation',coalesce(q->>'explanation',''),'correctAnswer',case when q->>'type'='test' then q->'options'->>((q->>'correct')::integer) when q->>'type' in ('practical','shortcut') then q->>'answer' else null end);
    response:=jsonb_build_object('questionId',q->>'id','answer',a.draft->'answer','ratio',g->'ratio','fromDraft',true);
   end if;
   select coalesce(sum((x->>'points')::numeric) filter(where x->>'type'<>'python'),0) into maximum from jsonb_array_elements(s.data->'questions') x;
   score:=round(least(100,greatest(0,100*points/greatest(maximum,1))),2);
  elsif s.kind='typing' then
   g:=public.sq_comp_typing(s.data->>'text',coalesce(a.draft->>'text',a.payload->>'text',''));chars:=(g->>'correct')::integer;accuracy:=(g->>'accuracy')::numeric;wpm:=chars*12/greatest(spent,1);
   score:=round(least(100,greatest(0,accuracy*(.75+.25*least(wpm/75,1)))),2);correct:=chars;
   feedback:=feedback||jsonb_build_object('accuracy',round(accuracy,1),'wpm',round(wpm,1),'correctChars',chars,'expectedChars',length(s.data->>'text'),'editDistance',g->'distance','method',g->'method');
  end if;
  update public.sq_comp_attempts x set score=finalize.score,points=finalize.points,correct=finalize.correct,elapsed=spent,finished_at=stop_at,finish_reason=p_reason,feedback=finalize.feedback,
   payload=case when response is not null then x.payload||jsonb_build_object('responses',coalesce(x.payload->'responses','[]')||jsonb_build_array(response)) when s.kind='typing' then jsonb_build_object('text',coalesce(x.draft->>'text',x.payload->>'text','')) else x.payload end,
   draft='{}',draft_version=x.draft_version+1 where x.stage_id=p_stage and x.user_id=p_user;
  perform public.sq_comp_tick(p_id);
 end
$$;
create or replace function public.sq_comp_expire(p_id uuid) returns void language plpgsql set search_path='' as $$
 declare row record;
 begin
  for row in select a.stage_id,a.user_id from public.sq_comp_attempts a join public.sq_comp_stages s on s.id=a.stage_id join public.sq_competitions c on c.id=a.competition_id
   where a.competition_id=p_id and c.status='running' and a.finished_at is null and clock_timestamp()>=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration)
   order by a.user_id,a.stage_id loop perform public.sq_comp_finalize(p_id,row.stage_id,row.user_id,'time');end loop;
 end
$$;
create or replace function public.sq_comp_select(p_id uuid,p_stage uuid) returns jsonb language plpgsql security definer set search_path='' as $$
 declare c public.sq_competitions;m public.sq_comp_members;s public.sq_comp_stages;started timestamptz:=clock_timestamp();
 begin
  select x.* into c from public.sq_competitions x where x.id=p_id for share;
  select x.* into m from public.sq_comp_members x where x.competition_id=p_id and x.user_id=auth.uid() for update;
  if auth.uid() is null or m.user_id is null or m.withdrawn or m.excluded or c.status is distinct from 'running' then raise exception 'Siz faol musobaqada qatnashmayapsiz';end if;
  if c.order_mode<>'free' then raise exception 'Bu musobaqada bosqichlarni ustoz navbat bilan ochadi';end if;
  if not public.sq_comp_limit('select-stage',60) then return jsonb_build_object('error','Bosqichlar juda tez almashtirildi. Biroz kuting.');end if;
  select x.* into s from public.sq_comp_stages x where x.id=p_stage and x.competition_id=p_id;
  if s.id is null then raise exception 'Bu bosqich musobaqaga tegishli emas';end if;
  insert into public.sq_comp_attempts(competition_id,stage_id,user_id,started_at,payload)
   values(p_id,s.id,auth.uid(),started,case when s.kind='maze' then jsonb_build_object('position',s.data->'start','opened','[]'::jsonb,'mistakes','{}'::jsonb,'hints','{}'::jsonb) else '{}' end)
   on conflict(stage_id,user_id) do nothing;
  update public.sq_comp_members x set selected_stage_id=s.id where x.competition_id=p_id and x.user_id=auth.uid();
  perform public.sq_comp_tick(p_id);return public.sq_comp_state(p_id);
 end
$$;
create or replace function public.sq_comp_draft(p_id uuid,p_stage uuid,p_action uuid,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 <<draft_save>>
 declare c public.sq_competitions;m public.sq_comp_members;s public.sq_comp_stages;a public.sq_comp_attempts;deadline timestamptz;q jsonb;draft jsonb;version integer;
 begin
  if auth.uid() is null or p_action is null or jsonb_typeof(p_data) is distinct from 'object' or length(p_data::text)>22000 then raise exception 'Qoralama formati noto‘g‘ri';end if;
  select x.* into c from public.sq_competitions x where x.id=p_id for share;
  select x.* into m from public.sq_comp_members x where x.competition_id=p_id and x.user_id=auth.uid();
  if c.status is distinct from 'running' or m.user_id is null or m.excluded or m.withdrawn then raise exception 'Siz faol musobaqada qatnashmayapsiz';end if;
  select x.* into s from public.sq_comp_stages x where x.id=p_stage and x.competition_id=p_id;
  select x.* into a from public.sq_comp_attempts x where x.stage_id=p_stage and x.user_id=auth.uid() for update;
  if s.id is null or a.stage_id is null or (c.order_mode='guided' and s.position<>c.current_stage) then raise exception 'Bosqichni avval oching';end if;
  deadline:=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration);
  if a.finished_at is not null or clock_timestamp()>=deadline then perform public.sq_comp_expire(p_id);return jsonb_build_object('closed',true,'draftVersion',a.draft_version);end if;
  if a.actions?('draft:'||p_action::text) then return jsonb_build_object('saved',true,'draftVersion',a.draft_version,'savedAt',a.draft_saved_at);end if;
  if not public.sq_comp_limit('draft',40) then return jsonb_build_object('error','Qoralama juda tez yuborildi. Biroz kuting.');end if;
  if s.kind='quiz' then
   q:=s.data->'questions'->a.cursor;
   if q is null or q->>'id' is distinct from p_data->>'questionId' then return jsonb_build_object('stale',true,'draftVersion',a.draft_version);end if;
   draft:=jsonb_build_object('questionId',q->>'id','answer',coalesce(p_data->'answer','null'::jsonb));
  elsif s.kind='typing' then
   if jsonb_typeof(p_data->'text') is distinct from 'string' or length(p_data->>'text')>8000 then raise exception 'Typing matni juda uzun yoki noto‘g‘ri';end if;
   draft:=jsonb_build_object('text',p_data->>'text');
  else return jsonb_build_object('saved',true,'draftVersion',a.draft_version);end if;
  update public.sq_comp_attempts x set draft=draft_save.draft,draft_version=x.draft_version+1,draft_saved_at=clock_timestamp(),actions=x.actions||jsonb_build_object('draft:'||p_action::text,true)
   where x.stage_id=p_stage and x.user_id=auth.uid() returning x.draft_version into version;
  -- Draft saves don't broadcast the full room. Grading/select/finish do.
  return jsonb_build_object('saved',true,'draftVersion',version,'savedAt',clock_timestamp());
 end
$$;


create or replace function public.sq_comp_state(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
 declare c public.sq_competitions;s public.sq_comp_stages;m public.sq_comp_members;a public.sq_comp_attempts;manager boolean;teams jsonb;stages jsonb;current jsonb:=null;question jsonb;data jsonb;deadline timestamptz;result jsonb;history jsonb;roster jsonb;revision bigint;
 begin
  if not public.sq_comp_read(p_id) then raise exception 'Musobaqa yopiq yoki sizga tegishli emas';end if;
  select x.* into c from public.sq_competitions x where x.id=p_id for share;
  select sig.revision into revision from public.sq_comp_signals sig where sig.competition_id=p_id;
  if c.status='running' then perform public.sq_comp_expire(p_id);select sig.revision into revision from public.sq_comp_signals sig where sig.competition_id=p_id;end if;
  manager:=public.sq_comp_owner(p_id);
  select x.* into m from public.sq_comp_members x where x.competition_id=p_id and x.user_id=auth.uid();
  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'position',x.position,'title',x.title,'kind',x.kind,'duration',x.duration,'weight',x.weight)||coalesce((select jsonb_build_object('startedAt',at.started_at,'deadline',case when c.order_mode='free' then at.started_at else c.stage_started_at end+make_interval(secs=>x.duration),'finished',at.finished_at is not null,'score',at.score,'finishReason',at.finish_reason) from public.sq_comp_attempts at where at.stage_id=x.id and at.user_id=auth.uid()),jsonb_build_object('finished',false))||case when manager and c.status='draft' then jsonb_build_object('config',x.config,'custom',x.data) else '{}' end order by x.position),'[]') into stages from public.sq_comp_stages x where x.competition_id=p_id;
  if c.status='running' then
   select x.* into s from public.sq_comp_stages x where x.competition_id=p_id and ((c.order_mode='guided' and x.position=c.current_stage) or (c.order_mode='free' and x.id=m.selected_stage_id));
   if s.id is not null then
   deadline:=c.stage_started_at+make_interval(secs=>s.duration);
   current:=jsonb_build_object('id',s.id,'position',s.position,'title',s.title,'kind',s.kind,'weight',s.weight,'duration',s.duration,'deadline',deadline);
   if m.user_id is not null and not m.excluded then
    if c.order_mode='guided' then insert into public.sq_comp_attempts(competition_id,stage_id,user_id,started_at,payload) values(p_id,s.id,auth.uid(),c.stage_started_at,case s.kind when 'maze' then jsonb_build_object('position',s.data->'start','opened','[]'::jsonb,'mistakes','{}'::jsonb,'hints','{}'::jsonb) else '{}'::jsonb end) on conflict(stage_id,user_id) do nothing;end if;
    select x.* into a from public.sq_comp_attempts x where x.stage_id=s.id and x.user_id=auth.uid();
    deadline:=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration);
    current:=current||jsonb_build_object('deadline',deadline,'startedAt',a.started_at);
    if a.finished_at is null and (clock_timestamp()>=deadline or m.withdrawn) then perform public.sq_comp_finalize(p_id,s.id,auth.uid(),case when m.withdrawn then 'withdrawn' else 'time' end);select x.* into a from public.sq_comp_attempts x where x.stage_id=s.id and x.user_id=auth.uid();end if;
    data:='{}';
    if a.finished_at is null then
     if s.kind='quiz' then
      question:=s.data->'questions'->a.cursor;
      question:=public.sq_safe_question(question);
      if question?'officeTask' then question:=jsonb_set(question,'{officeTask}',(question->'officeTask')-'rubric');end if;
      data:=jsonb_build_object('question',question,'index',a.cursor,'total',jsonb_array_length(s.data->'questions'));
     elsif s.kind='typing' then data:=s.data;
     else
      select jsonb_agg(t-array['answer','translation','explanation','hints']) into question from jsonb_array_elements(s.data->'tasks') t;
      data:=(s.data-'tasks'-'route')||jsonb_build_object('tasks',question,'position',a.payload->'position','opened',a.payload->'opened','mistakes',a.payload->'mistakes','hintsUsed',a.payload->'hints');
     end if;
    end if;
    current:=current||jsonb_build_object('data',data,'finished',a.finished_at is not null,'score',a.score,'correct',a.correct,'feedback',a.feedback,'draft',a.draft,'draftVersion',a.draft_version,'elapsed',a.elapsed,'savedAt',a.draft_saved_at,'finishReason',a.finish_reason);
   end if;
   end if;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('stage',st.position,'title',st.title,'score',at.score,'correct',at.correct,'elapsed',at.elapsed,'finished',at.finished_at is not null,'finishReason',at.finish_reason) order by st.position),'[]') into history from public.sq_comp_attempts at join public.sq_comp_stages st on st.id=at.stage_id where at.competition_id=p_id and at.user_id=auth.uid();
  if manager then
   select coalesce(jsonb_agg(jsonb_build_object('userId',mem.user_id,'name',mem.name,'teamId',mem.team_id,'withdrawn',mem.withdrawn,'excluded',mem.excluded,'stages',(select coalesce(jsonb_agg(jsonb_build_object('stage',st.position,'score',at.score,'correct',at.correct,'elapsed',at.elapsed,'finished',at.finished_at is not null,'feedback',at.feedback,'finishReason',at.finish_reason,'startedAt',at.started_at,'deadline',case when c.order_mode='free' then at.started_at else c.stage_started_at end+make_interval(secs=>st.duration)) order by st.position),'[]') from public.sq_comp_attempts at join public.sq_comp_stages st on st.id=at.stage_id where at.competition_id=p_id and at.user_id=mem.user_id)) order by mem.team_id,mem.seat),'[]') into roster from public.sq_comp_members mem where mem.competition_id=p_id;
  end if;
  -- Aggregate each attempt once instead of rescanning attempts for every team/stage.
  with counts as (
   select mem.team_id,count(*) filter(where not mem.excluded) joined from public.sq_comp_members mem where mem.competition_id=p_id group by mem.team_id
  ), per_stage as (
   select mem.team_id,st.position,sum(at.score) points,sum(at.score*st.weight) weighted,sum(at.correct) correct,sum(at.elapsed) elapsed,count(*) filter(where at.finished_at is not null and not mem.withdrawn) completed
   from public.sq_comp_attempts at join public.sq_comp_members mem on mem.competition_id=at.competition_id and mem.user_id=at.user_id join public.sq_comp_stages st on st.id=at.stage_id
   where at.competition_id=p_id and not mem.excluded group by mem.team_id,st.position
  ), team_base as (
   select t.*,coalesce(cnt.joined,0) joined,coalesce(t.started_size,c.team_size) divisor,
    coalesce(sum(ps.weighted),0) weighted,coalesce(sum(ps.correct),0) correct,coalesce(sum(ps.elapsed),0) elapsed
   from public.sq_comp_teams t left join counts cnt on cnt.team_id=t.id left join per_stage ps on ps.team_id=t.id
   where t.competition_id=p_id group by t.id,cnt.joined
  ), ranked as (
   select t.*,round(weighted/greatest(divisor,1),2) score,round(correct::numeric/greatest(divisor,1),2) average_correct,round(elapsed/greatest(divisor,1),2) average_elapsed,
    case when started_size=0 then null else rank() over(order by (started_size=0) asc nulls first,round(weighted/greatest(divisor,1),2) desc,round(correct::numeric/greatest(divisor,1),2) desc,round(elapsed/greatest(divisor,1),2) asc) end place
   from team_base t
  )
  select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'joined',r.joined,'startedSize',r.started_size,'score',r.score,'correct',r.average_correct,'elapsed',r.average_elapsed,'rank',r.place,'stages',
    (select coalesce(jsonb_agg(jsonb_build_object('position',st.position,'score',round(coalesce(ps.points,0)/greatest(r.divisor,1),2),'completed',coalesce(ps.completed,0)) order by st.position),'[]') from public.sq_comp_stages st left join per_stage ps on ps.position=st.position and ps.team_id=r.id where st.competition_id=p_id))||case when manager then jsonb_build_object('code',r.join_code,'roster',r.roster) else '{}' end order by r.place nulls last,r.title),'[]') into teams from ranked r;
  result:=jsonb_build_object('revision',coalesce(revision,0),'competition',jsonb_build_object('id',c.id,'title',c.title,'description',c.description,'visibility',c.visibility,'teamSize',c.team_size,'status',c.status,'currentStage',c.current_stage,'orderMode',c.order_mode),'manager',manager,'teams',teams,'stages',stages,'current',current,'me',case when m.user_id is not null then jsonb_build_object('name',m.name,'teamId',m.team_id,'seat',m.seat,'withdrawn',m.withdrawn,'excluded',m.excluded) else null end,'history',history,'serverNow',clock_timestamp());
  if manager then result:=result||jsonb_build_object('members',roster);end if;return result;
 end
$$;


create or replace function public.sq_comp_poll(p_id uuid,p_revision bigint default -1) returns jsonb language plpgsql security definer set search_path='' as $$
 declare revision bigint;expired boolean;
 begin
  if not public.sq_comp_read(p_id) then raise exception 'Musobaqa yopiq yoki sizga tegishli emas';end if;
  select sig.revision into revision from public.sq_comp_signals sig where sig.competition_id=p_id;
  select exists(select 1 from public.sq_comp_attempts a join public.sq_comp_stages s on s.id=a.stage_id join public.sq_competitions c on c.id=a.competition_id where c.id=p_id and c.status='running' and a.finished_at is null and clock_timestamp()>=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration)) into expired;
  if coalesce(revision,0)=p_revision and not expired then return jsonb_build_object('unchanged',true,'revision',coalesce(revision,0),'serverNow',clock_timestamp());end if;
  return public.sq_comp_state(p_id);
 end
$$;


create or replace function public.sq_comp_control(p_id uuid,p_action text,p_expected_stage integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
 declare c public.sq_competitions;s public.sq_comp_stages;deadline timestamptz;members integer;done integer;total integer;teams_ready integer;row record;
 begin
  select x.* into c from public.sq_competitions x where x.id=p_id for update;
  if not found or not public.sq_comp_owner(p_id) then raise exception 'Musobaqani boshqarishga ruxsat yo‘q';end if;
  if p_action='publish' then
   if c.status='lobby' then return public.sq_comp_state(p_id);end if;
   if c.status<>'draft' then raise exception 'Bu musobaqa allaqachon faollashtirilgan';end if;
   update public.sq_competitions x set status='lobby',updated_at=clock_timestamp() where x.id=p_id;
  elsif p_action in ('start','start-current') then
   if c.status='running' then return public.sq_comp_state(p_id);end if;
   if c.status<>'lobby' then raise exception 'Avval ro‘yxatdan o‘tishni faollashtiring';end if;
   select count(*) into members from public.sq_comp_members m where m.competition_id=p_id and not m.excluded;
   select count(*)*c.team_size into total from public.sq_comp_teams t where t.competition_id=p_id;
   -- Both start actions accept the present roster. Freeze its size for fair averages.
   select count(distinct m.team_id) into teams_ready from public.sq_comp_members m where m.competition_id=p_id and not m.excluded;
   if teams_ready<2 then raise exception 'Kamida ikkita jamoada bittadan ishtirokchi bo‘lsin';end if;
   update public.sq_comp_teams t set started_size=(select count(*) from public.sq_comp_members m where m.team_id=t.id and not m.excluded) where t.competition_id=p_id;
   update public.sq_competitions x set status='running',current_stage=case when c.order_mode='free' then 0 else 1 end,stage_started_at=clock_timestamp(),updated_at=clock_timestamp() where x.id=p_id;
  elsif p_action in ('finish','force-finish') then
   if c.status='finished' then return public.sq_comp_state(p_id);end if;
   if c.status<>'running' or c.order_mode<>'free' then raise exception 'Bu musobaqada bosqichlarni navbat bilan yakunlang';end if;
   perform public.sq_comp_expire(p_id);
   if p_action='finish' and exists(select 1 from public.sq_comp_members mem cross join public.sq_comp_stages st left join public.sq_comp_attempts a on a.stage_id=st.id and a.user_id=mem.user_id where mem.competition_id=p_id and st.competition_id=p_id and not mem.excluded and not mem.withdrawn and a.finished_at is null) then raise exception 'Hali tugatilmagan bosqichlar bor. Kuting yoki hozir yakunlashni tanlang';end if;
   insert into public.sq_comp_attempts(competition_id,stage_id,user_id,started_at) select p_id,st.id,mem.user_id,clock_timestamp() from public.sq_comp_stages st cross join public.sq_comp_members mem where st.competition_id=p_id and mem.competition_id=p_id and not mem.excluded on conflict(stage_id,user_id) do nothing;
   for row in select a.stage_id,a.user_id from public.sq_comp_attempts a where a.competition_id=p_id and a.finished_at is null order by a.user_id,a.stage_id loop perform public.sq_comp_finalize(p_id,row.stage_id,row.user_id,'teacher');end loop;
   update public.sq_competitions x set status='finished',updated_at=clock_timestamp() where x.id=p_id;
  elsif p_action in ('next','force-next') then
   if c.order_mode='free' then raise exception 'Erkin tartibda har o‘quvchi bosqichni o‘zi tanlaydi';end if;
   if c.current_stage>p_expected_stage or c.status='finished' then return public.sq_comp_state(p_id);end if;
   if c.status<>'running' or c.current_stage<>p_expected_stage then raise exception 'Bosqich holati o‘zgargan. Yangilang';end if;
   select x.* into s from public.sq_comp_stages x where x.competition_id=p_id and x.position=c.current_stage;
   deadline:=c.stage_started_at+make_interval(secs=>s.duration);
   select count(*) into members from public.sq_comp_members m where m.competition_id=p_id and not m.excluded;
   select count(*) into members from public.sq_comp_members m where m.competition_id=p_id and not m.excluded and not m.withdrawn;
   select count(*) into done from public.sq_comp_attempts a join public.sq_comp_members m on m.competition_id=a.competition_id and m.user_id=a.user_id where a.stage_id=s.id and a.finished_at is not null and not m.excluded and not m.withdrawn;
   if p_action='next' and clock_timestamp()<deadline and done<members then raise exception 'Hali barcha ishtirokchi tugatmagan. Kuting yoki bosqichni yakunlang';end if;
   insert into public.sq_comp_attempts(competition_id,stage_id,user_id,started_at) select p_id,s.id,m.user_id,c.stage_started_at from public.sq_comp_members m where m.competition_id=p_id and not m.excluded on conflict(stage_id,user_id) do nothing;
   for row in select a.stage_id,a.user_id from public.sq_comp_attempts a where a.stage_id=s.id and a.finished_at is null order by a.user_id loop perform public.sq_comp_finalize(p_id,row.stage_id,row.user_id,case when clock_timestamp()>=deadline then 'time' else 'teacher' end);end loop;
   select count(*) into total from public.sq_comp_stages x where x.competition_id=p_id;
   if c.current_stage>=total then update public.sq_competitions x set status='finished',updated_at=clock_timestamp() where x.id=p_id;
   else update public.sq_competitions x set current_stage=c.current_stage+1,stage_started_at=clock_timestamp(),updated_at=clock_timestamp() where x.id=p_id;end if;
  elsif p_action='cancel' then
   if c.status='cancelled' then return public.sq_comp_state(p_id);end if;
   if c.status='finished' then raise exception 'Yakunlangan musobaqa natijasi o‘zgarmaydi';end if;
   for row in select a.stage_id,a.user_id from public.sq_comp_attempts a where a.competition_id=p_id and a.finished_at is null order by a.user_id,a.stage_id loop perform public.sq_comp_finalize(p_id,row.stage_id,row.user_id,'cancel');end loop;
   update public.sq_competitions x set status='cancelled',updated_at=clock_timestamp() where x.id=p_id;
   update public.sq_comp_attempts a set finished_at=coalesce(a.finished_at,clock_timestamp()),elapsed=case when a.finished_at is null then greatest(0,extract(epoch from clock_timestamp()-a.started_at)) else a.elapsed end where a.competition_id=p_id;
  else raise exception 'Boshqaruv amali noma’lum';end if;
  perform public.sq_comp_tick(p_id);return public.sq_comp_state(p_id);
 end
$$;


create or replace function public.sq_comp_answer(p_id uuid,p_stage uuid,p_action uuid,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 <<submission>>
 declare c public.sq_competitions;s public.sq_comp_stages;a public.sq_comp_attempts;m public.sq_comp_members;q jsonb;grade jsonb;deadline timestamptz;payload jsonb;feedback jsonb;points numeric;maximum numeric;score numeric;correct integer;cursor integer;elapsed numeric;finished boolean:=false;key text:=p_action::text;gate integer;mistakes integer;hints integer;path jsonb;chars integer;distance integer;typed text;target text;accuracy numeric;wpm numeric;body jsonb;
 begin
  if auth.uid() is null or p_action is null or jsonb_typeof(p_data) is distinct from 'object' or length(p_data::text)>22000 then raise exception 'Javob hajmi yoki kirish holati noto‘g‘ri';end if;
  select x.* into c from public.sq_competitions x where x.id=p_id for share;
  select x.* into m from public.sq_comp_members x where x.competition_id=p_id and x.user_id=auth.uid();
  if m.user_id is null or m.withdrawn or m.excluded then raise exception 'Siz bu musobaqada qatnashmayapsiz';end if;
  select x.* into a from public.sq_comp_attempts x where x.stage_id=p_stage and x.user_id=auth.uid() for update;
  if a.actions?key then return public.sq_comp_state(p_id);end if;
  if c.status<>'running' then raise exception 'Bosqich faol emas';end if;
  select x.* into s from public.sq_comp_stages x where x.competition_id=p_id and x.id=p_stage and (c.order_mode='free' or x.position=c.current_stage);
  if s.id is null or a.stage_id is null then raise exception 'Joriy bosqichni qayta oching';end if;
  deadline:=case when c.order_mode='free' then a.started_at else c.stage_started_at end+make_interval(secs=>s.duration);elapsed:=greatest(0,extract(epoch from clock_timestamp()-a.started_at));
  if a.finished_at is not null then return public.sq_comp_state(p_id);end if;
  if clock_timestamp()>=deadline then perform public.sq_comp_finalize(p_id,p_stage,auth.uid(),'time');return public.sq_comp_state(p_id);end if;
  if not public.sq_comp_limit('answer',120) then return jsonb_build_object('error','Javoblar juda tez yuborildi. Biroz kuting.');end if;
  payload:=a.payload;points:=a.points;score:=a.score;correct:=a.correct;cursor:=a.cursor;
  if p_data->>'mode'='finish' and s.kind<>'maze' then perform public.sq_comp_finalize(p_id,p_stage,auth.uid(),'finish');return public.sq_comp_state(p_id);
  elsif s.kind='quiz' then
   q:=s.data->'questions'->a.cursor;
   if q->>'id' is distinct from p_data->>'questionId' then raise exception 'Savol almashgan. Sahifani yangilang';end if;
   grade:=public.sq_comp_grade(q,p_data->'answer');points:=points+(q->>'points')::numeric*(grade->>'ratio')::numeric;
   select coalesce(sum((x->>'points')::numeric) filter(where x->>'type'<>'python'),0) into maximum from jsonb_array_elements(s.data->'questions') x;
   score:=round(least(100,100*points/greatest(maximum,1)),2);correct:=correct+case when (grade->>'ratio')::numeric=1 then 1 else 0 end;cursor:=cursor+1;finished:=cursor>=jsonb_array_length(s.data->'questions');
   feedback:=grade||jsonb_build_object('message',case when (grade->>'ratio')::numeric=1 then 'To‘g‘ri javob.' when (grade->>'ratio')::numeric>0 then 'Mezonlarning bir qismi bajarildi.' else 'Bu javob mos kelmadi.' end,'explanation',coalesce(q->>'explanation',''),'correctAnswer',case when q->>'type'='test' then q->'options'->>((q->>'correct')::integer) when q->>'type' in ('practical','shortcut','python') then q->>'answer' else null end);
   payload:=payload||jsonb_build_object('responses',coalesce(payload->'responses','[]')||jsonb_build_array(jsonb_build_object('questionId',q->>'id','answer',p_data->'answer','ratio',grade->'ratio')));
  elsif s.kind='typing' then
   target:=s.data->>'text';typed:=coalesce(p_data->>'text','');if length(typed)>8000 then raise exception 'Matn juda uzun';end if;
   grade:=public.sq_comp_typing(target,typed);distance:=(grade->>'distance')::integer;chars:=(grade->>'correct')::integer;
   accuracy:=(grade->>'accuracy')::numeric;wpm:=chars*12/greatest(elapsed,1);
   score:=round(accuracy*(.75+.25*least(wpm/75,1)),2);correct:=chars;finished:=true;
   feedback:=jsonb_build_object('message',case when grade->>'method'='word-levenshtein' then 'Matn ko‘p farq qilgani uchun tartibli so‘z tahrirlari bo‘yicha baholandi. Bir so‘z tushib qolsa, keyingi so‘zlar qayta xato sanalmaydi. Matn uzunligi va aniqlangan eng kam belgi farqi ham hisobga olindi.' else 'Matn terish yakunlandi. Tushib qolgan, ortiqcha yoki almashgan belgi bittadan xato hisoblanadi; keyingi matn siljigani uchun qayta jarima yo‘q.' end,'accuracy',round(accuracy,1),'wpm',round(wpm,1),'correctChars',chars,'expectedChars',length(target),'editDistance',distance,'method',grade->>'method','expectedUnits',grade->'expectedUnits','typedUnits',grade->'typedUnits','minimumCharEdits',grade->'minimumCharEdits');payload:=jsonb_build_object('text',typed);
  else
   path:=p_data->'path';
   if p_data->>'mode'='finish' then
    if jsonb_array_length(payload->'opened')<>jsonb_array_length(s.data->'tasks') or not public.sq_comp_path(s.data,payload->'position',path,payload->'opened',s.data->'exit') then raise exception 'Chiqish uchun barcha eshiklarni ochib, yo‘lni tugating';end if;
    finished:=true;feedback:=jsonb_build_object('message','Labirintdan chiqdingiz.');payload:=jsonb_set(payload,'{position}',s.data->'exit');
   else
    if coalesce(p_data->>'gate','') !~ '^[0-7]$' then raise exception 'Eshik raqami noto‘g‘ri';end if;gate:=(p_data->>'gate')::integer;
    if gate>=jsonb_array_length(s.data->'tasks') or payload->'opened' @> jsonb_build_array(gate) then raise exception 'Bu eshik ochilgan yoki mavjud emas';end if;
    if not public.sq_comp_path(s.data,payload->'position',path,payload->'opened',s.data->'gateCells'->gate) then raise exception 'Eshikka yurib yetib boring; devordan o‘tib bo‘lmaydi';end if;
    q:=s.data->'tasks'->gate;mistakes:=coalesce(payload->'mistakes'->>gate::text,'0')::integer;hints:=coalesce(payload->'hints'->>gate::text,'0')::integer;
    if p_data->>'mode'='hint' then
     hints:=least(2,hints+1);payload:=jsonb_set(payload,array['hints',gate::text],to_jsonb(hints),true);feedback:=jsonb_build_object('message','Yordam ishlatildi; bu eshik uchun ball kamayadi.','hint',coalesce(q->'hints'->>(hints-1),'Gapdagi yo‘nalish yoki kalit so‘zni ajrating.'));
    elsif p_data->'answer'=q->'answer' then
     points:=points+greatest(.3,1-mistakes*.15-hints*.2);correct:=correct+1;score:=round(100*points/jsonb_array_length(s.data->'tasks'),2);
     payload:=jsonb_set(payload,'{opened}',payload->'opened'||jsonb_build_array(gate));payload:=jsonb_set(payload,'{position}',s.data->'gateCells'->gate);feedback:=jsonb_build_object('message','To‘g‘ri. Eshik ochildi.','correct',true);
    else
     mistakes:=mistakes+1;payload:=jsonb_set(payload,array['mistakes',gate::text],to_jsonb(mistakes),true);feedback:=jsonb_build_object('message','Gapni qayta o‘qib yoki tinglab ko‘ring.','correct',false);
    end if;
   end if;
  end if;
  update public.sq_comp_attempts x set points=submission.points,score=submission.score,correct=submission.correct,cursor=submission.cursor,payload=submission.payload,feedback=submission.feedback,elapsed=submission.elapsed,finished_at=case when submission.finished then clock_timestamp() else null end,finish_reason=case when submission.finished then 'submit' else null end,draft=case when s.kind='maze' then x.draft else '{}'::jsonb end,draft_version=x.draft_version+case when s.kind='maze' then 0 else 1 end,actions=x.actions||jsonb_build_object(submission.key,true) where x.stage_id=p_stage and x.user_id=auth.uid();
  perform public.sq_comp_tick(p_id);return public.sq_comp_state(p_id);
 end
$$;


create or replace function public.sq_comp_leave(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
 declare c public.sq_competitions;row record;
 begin
  select x.* into c from public.sq_competitions x where x.id=p_id for update;
  if c.status='lobby' then delete from public.sq_comp_members m where m.competition_id=p_id and m.user_id=auth.uid();
  elsif c.status='running' then for row in select a.stage_id,a.user_id from public.sq_comp_attempts a where a.competition_id=p_id and a.user_id=auth.uid() and a.finished_at is null order by a.stage_id loop perform public.sq_comp_finalize(p_id,row.stage_id,row.user_id,'withdrawn');end loop;update public.sq_comp_members m set withdrawn=true where m.competition_id=p_id and m.user_id=auth.uid();update public.sq_comp_attempts a set finished_at=coalesce(a.finished_at,clock_timestamp()),elapsed=greatest(0,extract(epoch from clock_timestamp()-a.started_at)) where a.competition_id=p_id and a.user_id=auth.uid() and a.finished_at is null;end if;
  if c.id is not null then perform public.sq_comp_tick(p_id);end if;return jsonb_build_object('ok',true);
 end
$$;


-- Original 34 questions and seven Office tasks; existing templates preserved.
insert into public.sq_comp_templates(id,kind,title,data)
select t.id,t.kind,t.title,t.data from jsonb_to_recordset($SQ729$[{"id":"quiz:keyboard-12-7.29","kind":"quiz","title":"Klaviatura: tahrirlash va boshqarish","data":{"templateKey":"keyboard-12-7.29","title":"Klaviatura: tahrirlash va boshqarish","subject":"Klaviatura","group":"Boshlang‘ich","color":"blue","questions":[{"id":"kbd729-1","type":"test","text":"Kursor «Kitob|lar» joyida turibdi. Backspace bosilsa, qaysi matn qoladi?","options":["Kitolar","Kitoblr","Kitoblar","Kitob"],"correct":0,"explanation":"Backspace kursorning chapidagi b harfini o‘chiradi. Delete o‘ngdagi l harfini o‘chirgan bo‘lardi.","subject":"Klaviatura","time":60,"points":100},{"id":"kbd729-2","type":"test","text":"Kursor «Daf|tar» joyida turibdi. Delete bosilsa, nima qoladi?","options":["Daftar","Daftarlar","Dafar","Datar"],"correct":2,"explanation":"Delete kursorning o‘ngidagi t harfini olib tashlaydi.","subject":"Klaviatura","time":60,"points":100},{"id":"kbd729-3","type":"test","text":"Caps Lock o‘chiq. Inglizcha klaviaturada faqat bitta katta A harfini yozish uchun nima qilasiz?","options":["Ctrl+A","Shift+A","Alt+A","Faqat A"],"correct":1,"explanation":"Shiftni ushlab A ni bosing. Caps Lock keyingi harflarga ham ta’sir qiladi.","subject":"Klaviatura","time":60,"points":100},{"id":"kbd729-4","type":"test","text":"Matnning bir qismini belgilashda Shift+Right Arrow nima qiladi?","options":["Faylni saqlaydi","Bir so‘z o‘chiradi","Yangi qator ochadi","Belgilashni o‘ngga bir belgi kengaytiradi"],"correct":3,"explanation":"Shift+strelka tanlov chegarasini bir belgi suradi.","subject":"Klaviatura","time":60,"points":100},{"id":"kbd729-5","type":"test","text":"Katta ko‘p qatorli matnda Ctrl+Home qayerga olib boradi?","options":["Hujjat boshiga","Faqat joriy qator oxiriga","Keyingi so‘zga","Hujjat oxiriga"],"correct":0,"explanation":"Home joriy qator boshiga, Ctrl+Home esa hujjat boshiga olib boradi.","subject":"Klaviatura","time":60,"points":100},{"id":"kbd729-6","type":"shortcut","text":"Windows matn muharririda barcha matnni belgilash kombinatsiyasini bosing.","answer":"Ctrl+A","explanation":"Ctrl+A butun matnni belgilaydi.","subject":"Klaviatura","time":90,"points":100},{"id":"kbd729-7","type":"shortcut","text":"Belgilangan matnni nusxalash kombinatsiyasini bosing.","answer":"Ctrl+C","explanation":"Ctrl+C nusxa oladi; asl matn qoladi.","subject":"Klaviatura","time":90,"points":100},{"id":"kbd729-8","type":"shortcut","text":"Oxirgi tahrirni bekor qilish kombinatsiyasini bosing.","answer":"Ctrl+Z","explanation":"Ctrl+Z oxirgi amalni bekor qiladi.","subject":"Klaviatura","time":90,"points":100},{"id":"kbd729-9","type":"shortcut","text":"Windows Word’da kursorni bir so‘z chapga ko‘chirish kombinatsiyasini bosing.","answer":"Ctrl+ArrowLeft","explanation":"Ctrl+chap strelka oldingi so‘z tomonga yuradi. Virtual klaviaturadagi ArrowLeft ham qabul qilinadi.","subject":"Klaviatura","time":90,"points":100},{"id":"kbd729-10","type":"shortcut","text":"Windows Word’da kursorning o‘ngidagi bitta belgini o‘chirish tugmasini tanlang.","answer":"Delete","explanation":"Delete o‘ngdagi, Backspace chapdagi belgini o‘chiradi.","subject":"Klaviatura","time":90,"points":100},{"id":"kbd729-11","type":"practical","subject":"Klaviatura","text":"Matnni klaviaturada aynan yozing: Dars: 12 + 3 = 15. Ikki nuqta, bo‘sh joylar va oxirgi nuqtani unutmang.","answer":"Dars: 12 + 3 = 15.","explanation":"Belgilar matnning bir qismi. Katta D uchun Shift, qolgan belgilar uchun kerakli tugmalardan foydalaning.","time":120,"points":100},{"id":"kbd729-12","type":"practical","subject":"Klaviatura","text":"Ikki qatorda yozing: birinchi qator — Men o‘rganaman. ikkinchi qator — Bugun mashq qilaman. Yangi qator uchun Enter bosing.","answer":"Men o‘rganaman.\nBugun mashq qilaman.","explanation":"Enter yangi qator ochadi. Mazmun va nuqtalar to‘liq bo‘lsin; baholash qatorlar orasidagi bo‘shliqni bir xil qabul qiladi.","time":120,"points":100}]}},{"id":"quiz:word-12-7.29","kind":"quiz","title":"Word: hujjat bilan amaliy ishlash","data":{"templateKey":"word-12-7.29","title":"Word: hujjat bilan amaliy ishlash","subject":"Word","group":"Boshlang‘ich","color":"purple","questions":[{"id":"word729-1","type":"test","text":"Yangi paragraf boshlash va faqat shu paragraf ichida satrni uzish tugmalari qaysi juftlikda to‘g‘ri?","options":["Space va Tab","Enter va Shift+Enter","Ctrl+C va Ctrl+V","Delete va Backspace"],"correct":1,"explanation":"Enter yangi paragraf; Shift+Enter paragrafni almashtirmay satr uzilishi qiladi.","subject":"Word","time":60,"points":100},{"id":"word729-2","type":"test","text":"Hujjat ichidagi ma’lumotlarni qator va ustunlar bilan tartiblash uchun qaysi vosita mos?","options":["WordArt","Zoom","Table / Jadval","Page Color"],"correct":2,"explanation":"Jadval ma’lumotlarni qator va ustunlarga ajratadi. Tab bo‘shliqlari jadvalning o‘rnini bosmaydi.","subject":"Word","time":60,"points":100},{"id":"word729-3","type":"test","text":"Rasm matnning yonida, matn esa uning atrofida oqishi uchun nimani sozlaysiz?","options":["Wrap Text / Matnni o‘rash","Save As","Find","Line Numbers"],"correct":0,"explanation":"Matnni o‘rash rasm va matnning bir-biriga nisbatan joylashishini belgilaydi.","subject":"Word","time":60,"points":100},{"id":"word729-4","type":"test","text":"Sahifani landshaft ko‘rinishiga o‘tkazish qaysi parametrga tegishli?","options":["Font Size","Bold","Spelling","Orientation / Yo‘nalish"],"correct":3,"explanation":"Landscape sahifani eniga, Portrait bo‘yiga joylashtiradi.","subject":"Word","time":60,"points":100},{"id":"word729-5","type":"test","text":"Sarlavhani matn markaziga joylash uchun qaysi paragraf tekislashi kerak?","options":["Justify","Center","Left","Right"],"correct":1,"explanation":"Center paragrafni chap va o‘ng chet oralig‘ida markazlaydi.","subject":"Word","time":60,"points":100},{"id":"word729-6","type":"test","text":"Ma’lumotnomada kimga yuborilgani, sana va manba nima uchun kerak?","options":["Faqat bezak uchun","Fayl hajmini oshirish uchun","Hujjatning kimga, qachon va qaysi manba asosida yozilganini aniqlash uchun","Shriftni o‘zgartirish uchun"],"correct":2,"explanation":"Mazmun bilan birga hujjatning konteksti ham tushunarli bo‘lishi kerak.","subject":"Word","time":60,"points":100},{"id":"word729-7","type":"shortcut","text":"Windows Word (English) uchun qalin yozuvni yoqish/o‘chirish kombinatsiyasini bosing.","answer":"Ctrl+B","explanation":"Belgilangan matn yoki keyin yoziladigan matn uchun Bold holati almashadi.","subject":"Word","time":90,"points":100},{"id":"word729-8","type":"shortcut","text":"Windows Word’da hujjatni saqlash kombinatsiyasini bosing.","answer":"Ctrl+S","explanation":"Ctrl+S joriy hujjatni saqlaydi.","subject":"Word","time":90,"points":100},{"id":"word729-9","type":"shortcut","text":"Windows Word’da yangi sahifani majburan boshlash kombinatsiyasini bosing.","answer":"Ctrl+Enter","explanation":"Page Break yangi sahifani ochadi; ko‘p marta Enter bosish barqaror usul emas.","subject":"Word","time":90,"points":100},{"id":"word729-10","type":"office","text":"O‘quv muharririda sarlavha va matn yozing, sarlavhani qalin, markazda, 18 pt qilib formatlang.","officeTemplate":"word-format-729","explanation":"Har bir format mezoni alohida baholanadi. Matn mazmuni ham kiritilgan bo‘lsin.","subject":"Word","time":240,"points":100},{"id":"word729-11","type":"office","text":"Navbatchilik uchun ikki qatorli, ikki ustunli jadvalni to‘ldiring.","officeTemplate":"word-table-729","explanation":"Birinchi qator ustun nomlarini, keyingi qator haqiqiy ma’lumotni beradi.","subject":"Word","time":240,"points":100},{"id":"word729-12","type":"office","text":"Sarlavha, asosiy matn va rasm qo‘shing. Rasmni o‘ngga o‘rab joylashtiring.","officeTemplate":"word-image-729","explanation":"Rasm qo‘shilishi bilan uning joylashuvi boshqa-boshqa mezonlar hisoblanadi.","subject":"Word","time":240,"points":100}]}},{"id":"quiz:excel-10-7.29","kind":"quiz","title":"Excel: $ havolalar va mantiqiy formulalar","data":{"templateKey":"excel-10-7.29","title":"Excel: $ havolalar va mantiqiy formulalar","subject":"Excel","group":"Boshlang‘ich va o‘rta","color":"green","questions":[{"id":"xls729-1","type":"test","text":"=A2+B2 formulasi C2 dan C3 ga ko‘chirilsa, qanday bo‘ladi?","options":["=A2+B2","=A3+B3","=$A$2+$B$2","=B2+C2"],"correct":1,"explanation":"Nisbiy havola bir qator pastga ko‘chirishda qator raqamini bittaga oshiradi.","subject":"Excel","time":60,"points":100},{"id":"xls729-2","type":"test","text":"=$B$2*C3 formulasida qaysi qism ham ustun, ham qator bo‘yicha qotirilgan?","options":["C3","C ustun","$B$2","Faqat 2-qator"],"correct":2,"explanation":"$B ustunni, $2 qatorni qotiradi. $B$2 mutlaq havola.","subject":"Excel","time":60,"points":100},{"id":"xls729-3","type":"test","text":"=$A2*B$1 formulasi B2 dan C3 ga (bir ustun o‘ngga va bir qator pastga) ko‘chirilsa, qaysi formula hosil bo‘ladi?","options":["=$A3*C$1","=B3*C2","=$B3*C$2","=$A2*B$1"],"correct":0,"explanation":"$A ustuni va $1 qatori o‘zgarmaydi. A2 ning qatori 3, B$1 ning ustuni C bo‘ladi.","subject":"Excel","time":60,"points":100},{"id":"xls729-4","type":"test","text":"B2=50 bo‘lsa, =IF(B2>=50,\"O‘tdi\",\"Qayta\") qanday natija beradi?","options":["50","Qayta","TRUE","O‘tdi"],"correct":3,"explanation":"50>=50 rost. IF ikkinchi argumentni qaytaradi; natija TRUE emas, «O‘tdi» matni.","subject":"Excel","time":60,"points":100},{"id":"xls729-5","type":"test","text":"B2=70 va C2=55. =AND(B2>=60,C2>=60) va =OR(B2>=60,C2>=60) natijalari qaysi?","options":["TRUE va FALSE","FALSE va TRUE","Ikkalasi TRUE","Ikkalasi FALSE"],"correct":1,"explanation":"AND barcha shartlarni, OR kamida bitta shartni talab qiladi.","subject":"Excel","time":60,"points":100},{"id":"xls729-6","type":"test","text":"=IF(B2>=$D$1,1,0) formulasi C2 dan C3 ga ko‘chirilsa, qaysi formula to‘g‘ri?","options":["=IF(B2>=$D$2,1,0)","=IF(B3>=D2,1,0)","=IF(B3>=$D$1,1,0)","=IF(C3>=$E$1,1,0)"],"correct":2,"explanation":"B2 nisbiy bo‘lgani uchun B3 bo‘ladi. $D$1 mezoni o‘zgarmaydi.","subject":"Excel","time":60,"points":100},{"id":"xls729-7","type":"office","text":"Miqdorni o‘zgarmas narxga ko‘paytiring va formulani pastga ko‘chiring.","officeTemplate":"excel-absolute-729","explanation":"Miqdor qatori o‘zgaradi; $D$1 narxi o‘zgarmaydi.","subject":"Excel","time":240,"points":100},{"id":"xls729-8","type":"office","text":"Aralash havolalar bilan 2×2 ko‘paytirish jadvalini to‘ldiring.","officeTemplate":"excel-mixed-729","explanation":"Ustuni qotirilgan $A2 va qatori qotirilgan B$1 ikki yo‘nalishda ko‘chirishga xizmat qiladi.","subject":"Excel","time":240,"points":100},{"id":"xls729-9","type":"office","text":"IF orqali o‘tish mezonini tekshiring; mezon havolasini mutlaq qiling.","officeTemplate":"excel-if-729","explanation":"IF shartni tekshiradi va mos 1 yoki 0 qiymatni qaytaradi.","subject":"Excel","time":240,"points":100},{"id":"xls729-10","type":"office","text":"Ikkala shart va kamida bitta shart uchun IF, AND hamda OR formulalarini yozing.","officeTemplate":"excel-logic-729","explanation":"70 va 55 ikkala shartni bajarmaydi. 40 va 80 dan bittasi mezonga yetadi.","subject":"Excel","time":240,"points":100}]}},{"id":"office:word-format-729","kind":"quiz","title":"Word: sarlavhani formatlash","data":{"officeTask":{"title":"Word: sarlavhani formatlash","kind":"word","prompt":"«Sinf yangiliklari» sarlavhasini va kamida bir mazmunli gapni yozing. Sarlavhani qalin, markazda va 18 pt qiling.","rubric":[{"label":"Sarlavha va asosiy matn yozilgan","kind":"wordText"},{"label":"Sarlavha qalin","kind":"wordFormat","field":"bold","value":true},{"label":"Sarlavha markazda","kind":"wordFormat","field":"align","value":"center"},{"label":"Sarlavha 18 pt","kind":"wordFormat","field":"size","value":18}]}}},{"id":"office:word-table-729","kind":"quiz","title":"Word: navbatchilik jadvali","data":{"officeTask":{"title":"Word: navbatchilik jadvali","kind":"word","prompt":"«Navbatchilik» sarlavhasi va qisqa izoh yozing. Jadvalga «Kun | Ism» va «Dushanba | Ali» qatorlarini kiriting.","rubric":[{"label":"Sarlavha va matn","kind":"wordText"},{"label":"Ikki qator, ikki ustun to‘ldirilgan","kind":"wordTable"},{"label":"Jadval mazmuni vazifaga mos","kind":"wordTableCells","cells":[["Kun","Ism"],["Dushanba","Ali"]]}]}}},{"id":"office:word-image-729","kind":"quiz","title":"Word: rasm va matn","data":{"officeTask":{"title":"Word: rasm va matn","kind":"word","prompt":"«Maktab bog‘i» sarlavhasi va kamida bir gap yozing. Namuna yoki o‘z rasmingizni qo‘shing, uni o‘ngga o‘rab joylashtiring.","rubric":[{"label":"Sarlavha va asosiy matn","kind":"wordText"},{"label":"Hujjatga rasm qo‘shilgan","kind":"wordImage"},{"label":"Rasm o‘ngda, matn uning atrofida","kind":"wordWrap","value":"right"}]}}},{"id":"office:excel-absolute-729","kind":"quiz","title":"Excel: o‘zgarmas narx","data":{"officeTask":{"title":"Excel: o‘zgarmas narx","kind":"excel","prompt":"B2=3, B3=5, D1=2000. C2 da miqdorni D1 dagi narxga ko‘paytiring. Narx manzilining ustuni va qatorini $ bilan qotiring. C2 ni C3 ga ko‘chiring.","initialCells":{"A1":"Mahsulot","B1":"Miqdor","D1":"2000","A2":"Daftar","B2":"3","A3":"Qalam","B3":"5"},"rubric":[{"label":"C2: B2 va $D$1 bilan 6000","kind":"excelFormula","cell":"C2","references":["B2","$D$1"],"expected":6000},{"label":"C3: B3 va o‘zgarmas $D$1 bilan 10000","kind":"excelFormula","cell":"C3","references":["B3","$D$1"],"expected":10000}]}}},{"id":"office:excel-mixed-729","kind":"quiz","title":"Excel: aralash havolalar","data":{"officeTask":{"title":"Excel: aralash havolalar","kind":"excel","prompt":"B2 ga =$A2*B$1 yozing va uni C2, B3 hamda C3 ga ko‘chiring. $A ustunni, $1 qatorni qotiradi. Qolgan qism ko‘chirish yo‘nalishiga mos o‘zgaradi.","initialCells":{"A1":"Ko‘paytirish","B1":"4","C1":"5","A2":"2","A3":"3"},"rubric":[{"label":"B2: $A2 × B$1 = 8","kind":"excelFormula","cell":"B2","references":["$A2","B$1"],"expected":8},{"label":"C2: $A2 × C$1 = 10","kind":"excelFormula","cell":"C2","references":["$A2","C$1"],"expected":10},{"label":"B3: $A3 × B$1 = 12","kind":"excelFormula","cell":"B3","references":["$A3","B$1"],"expected":12},{"label":"C3: $A3 × C$1 = 15","kind":"excelFormula","cell":"C3","references":["$A3","C$1"],"expected":15}]}}},{"id":"office:excel-if-729","kind":"quiz","title":"Excel: IF va o‘zgarmas mezon","data":{"officeTask":{"title":"Excel: IF va o‘zgarmas mezon","kind":"excel","prompt":"D1 dagi 50 — o‘tish mezoni. C2 va C3 da IF bilan ball mezondan kam bo‘lmasa 1, aks holda 0 chiqaring. Mezon uchun $D$1 ishlating; formulani pastga ko‘chiring.","initialCells":{"A1":"Ism","B1":"Ball","D1":"50","A2":"Ali","B2":"70","A3":"Lola","B3":"40"},"rubric":[{"label":"C2: IF, B2 va $D$1; natija 1","kind":"excelFormula","cell":"C2","fn":"IF","references":["B2","$D$1"],"expected":1},{"label":"C3: IF, B3 va $D$1; natija 0","kind":"excelFormula","cell":"C3","fn":"IF","references":["B3","$D$1"],"expected":0}]}}},{"id":"office:excel-logic-729","kind":"quiz","title":"Excel: AND va OR shartlari","data":{"officeTask":{"title":"Excel: AND va OR shartlari","kind":"excel","prompt":"D2 da ikkala ball ham kamida 60 bo‘lsa 1, aks holda 0 chiqaring: IF va AND ishlating. D3 da kamida bitta ball 60 bo‘lsa 1, aks holda 0 chiqaring: IF va OR ishlating.","initialCells":{"A1":"Ism","B1":"1-ball","C1":"2-ball","D1":"Natija","A2":"Ali","B2":"70","C2":"55","A3":"Lola","B3":"40","C3":"80"},"rubric":[{"label":"D2: IF va AND; ikkala shart bajarilmagan, 0","kind":"excelFormula","cell":"D2","functions":["IF","AND"],"references":["B2","C2"],"expected":0},{"label":"D3: IF va OR; bitta shart bajarilgan, 1","kind":"excelFormula","cell":"D3","functions":["IF","OR"],"references":["B3","C3"],"expected":1}]}}}]$SQ729$::jsonb) t(id text,kind text,title text,data jsonb)
on conflict(id) do update set kind=excluded.kind,title=excluded.title,data=excluded.data;



create or replace function public.sq_schema_status() returns jsonb language sql security definer set search_path='' as $$select jsonb_build_object('version','7.29.0','secureActivities',true,'competitionFreeOrder',true,'stageDraftGrading',true,'migration','supabase-migration-7.29.sql')$$;
revoke all on function public.sq_excel_normalize(text),public.sq_excel_truth(jsonb),public.sq_excel_number(jsonb),public.sq_comp_excel_value(jsonb,text,text[]),public.sq_excel_expr(text[],integer,integer,jsonb,text[],boolean,integer),public.sq_comp_finalize(uuid,uuid,uuid,text),public.sq_comp_expire(uuid) from public,anon,authenticated;
revoke all on function public.sq_comp_select(uuid,uuid),public.sq_comp_draft(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.sq_comp_select(uuid,uuid),public.sq_comp_draft(uuid,uuid,uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
