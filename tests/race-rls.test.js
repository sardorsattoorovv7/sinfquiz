import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';

test('guest joining an active race can UPDATE the existing row; UPSERT needs forbidden INSERT',async()=>{
 const db=new PGlite(),owner='00000000-0000-0000-0000-000000000001',guest='00000000-0000-0000-0000-000000000002';
 try{
  await db.exec(`create role authenticated;create schema auth;
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
   create function public.sq_is_teacher() returns boolean language sql stable as $$select auth.uid()='${owner}'::uuid$$;
   create table public.documents(collection text,id text,data jsonb not null,updated_at timestamptz default now(),primary key(collection,id));
   alter table public.documents enable row level security;
   grant usage on schema auth to authenticated;grant select,insert,update on public.documents to authenticated;
   create policy race_read on public.documents for select to authenticated using(collection='live');
   create policy race_insert on public.documents for insert to authenticated with check(collection='live' and public.sq_is_teacher() and data->>'ownerId'=auth.uid()::text);
   create policy race_update on public.documents for update to authenticated using(collection='live' and (public.sq_is_teacher() or data->>'active'='true')) with check(collection='live' and (public.sq_is_teacher() or (data->>'active'='true' and jsonb_array_length(coalesce(data->'racers','[]'::jsonb))<=2)));`);
  await db.query('insert into public.documents(collection,id,data) values($1,$2,$3)', ['live','race',JSON.stringify({ownerId:owner,active:true,phase:'lobby',racers:[]})]);
  await db.query("select set_config('request.uid',$1,false)",[guest]);await db.exec('set role authenticated');
  const updated=await db.query("update public.documents set data=jsonb_set(data,'{racers}','[{\"id\":\"p1\"},{\"id\":\"p2\"}]'::jsonb) where collection='live' and id='race' returning data");
  assert.equal(updated.rows[0].data.racers.length,2);
  await assert.rejects(db.query("insert into public.documents(collection,id,data) values('live','race','{\"ownerId\":\"other\",\"active\":true,\"racers\":[]}'::jsonb) on conflict(collection,id) do update set data=excluded.data"),/row-level security policy/i);
 }finally{await db.close()}
});
