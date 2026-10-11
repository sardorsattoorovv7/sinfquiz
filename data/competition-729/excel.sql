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
