begin;
create or replace function public.sq_cefr_seed()
returns jsonb language plpgsql security definer set search_path=public as $$
declare item record; added int:=0;
begin
  if auth.uid() is null or not public.sq_is_admin() then
    raise exception 'Faqat administrator variantlarni o‘rnata oladi' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sinfquiz-cefr-ready',0));
  if exists(select 1 from public.documents where collection='settings' and id='cefrReadySeed') then
    return jsonb_build_object('added',0,'alreadySeeded',true);
  end if;
  for item in select seed_key,payload from public.cefr_builtin_bank order by seed_key loop
    perform public.sq_cefr_validate(item.payload);
    insert into public.cefr_tests(payload,status,created_by)
      values(item.payload,'published',auth.uid());
    added:=added+1;
  end loop;
  if added<>10 then raise exception '10 ta variant to‘liq yuklanmagan'; end if;
  insert into public.documents(collection,id,data)
    values('settings','cefrReadySeed',jsonb_build_object('count',added,'at',now()));
  return jsonb_build_object('added',added,'alreadySeeded',false);
end $$;

revoke all on function public.sq_cefr_validate(jsonb) from public,anon,authenticated;
revoke all on function public.sq_cefr_admin(text,uuid,jsonb) from public,anon;
grant execute on function public.sq_cefr_admin(text,uuid,jsonb) to authenticated;
revoke all on function public.sq_cefr_seed() from public,anon;
grant execute on function public.sq_cefr_seed() to authenticated;
commit;
