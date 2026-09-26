from pathlib import Path

root = Path(__file__).resolve().parent.parent
v74 = (root / 'supabase-migration-7.4.sql').read_text()
validator = v74[v74.index('create or replace function public.sq_cefr_validate('):
                v74.index('create or replace function public.sq_cefr_public(')].replace(
    "coalesce(part->>'audioUrl','') !~ '^https://[^/@[:space:]]+([/:?#]|$)'",
    "(coalesce(part->>'audioUrl','') !~ '^https://[^/@[:space:]]+([/:?#]|$)' "
    "and coalesce(part->>'audioUrl','') !~ '^/cefr-audio/mock-([1-9]|10)-part-[1-6]\\.mp3$')"
)
fix = (root / 'supabase-cefr-results-fix.sql').read_text()
admin_fix = fix[fix.index('create or replace function public.sq_cefr_admin('):
                fix.index('revoke all on function public.sq_cefr_admin(')]
bank = (root / 'data/cefr-ready-bank.json').read_text().strip()
assert '$cefr_bank$' not in bank
sql = f'''-- SinfQuiz 7.7: original Multilevel mashqlar, admin seed va local audio.
-- Existing database: RUN after supabase-migration-7.4.sql and 7.6.
begin;
{validator}
{admin_fix}
create table if not exists public.cefr_builtin_bank(
  seed_key text primary key,
  payload jsonb not null
);
revoke all on public.cefr_builtin_bank from anon,authenticated;

insert into public.cefr_builtin_bank(seed_key,payload)
select item->>'seedKey',item-'seedKey'
from jsonb_array_elements($cefr_bank${bank}$cefr_bank$::jsonb) item
on conflict(seed_key) do update set payload=excluded.payload;

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
'''
(root / 'supabase-migration-7.7.sql').write_text(sql)
print('Built migration:', len(sql), 'bytes')
