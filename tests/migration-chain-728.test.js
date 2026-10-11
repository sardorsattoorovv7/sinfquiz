import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('7.28 fresh-install SQL chain compiles in order without cron and preserves all content banks',async()=>{
 const db=new PGlite();
 try{
  // Supabase supplies these platform primitives. Realtime publication delivery and
  // object storage are not emulated; only their SQL schema is provided here.
  await db.exec(`create role anon;create role authenticated;create schema auth;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;
   grant usage on schema auth to authenticated;
   grant execute on all functions in schema auth to authenticated;
   create schema storage;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
   alter table storage.objects enable row level security;`);
  const chain=JSON.parse(read('migration-chain.json'));
  for(const name of chain.freshInstall){
   const sql=read(name).replace(/do \$\$ begin\s+alter publication supabase_realtime add table public.documents;\s+exception when duplicate_object then null;\s+end \$\$;/,'');
   try{await db.exec(sql)}catch(error){throw new Error(name+': '+error.message,{cause:undefined})}
  }
  assert.equal((await db.query('select public.sq_schema_status() value')).rows[0].value.version,'7.29.0');
  assert.equal((await db.query('select count(*)::int n from public.cefr_builtin_bank')).rows[0].n,10);
  const expected=JSON.parse(read('sql/cefr-7.7/manifest.json'));
  const original=JSON.parse(read('supabase-migration-7.7.sql').split('$cefr_bank$')[1]);
  const stored=(await db.query('select seed_key,payload from public.cefr_builtin_bank')).rows;
  for(const row of stored){const item=original.find(x=>x.seedKey===row.seed_key);const {seedKey,...payload}=item;assert.deepEqual(row.payload,payload)}
  assert.equal(expected.mocks,10);
  // A manually created, empty cron schema must not break setup either.
  await db.exec('create schema cron');await db.exec(read('supabase-migration-7.8-fixed.sql'));
  // Applying the current upgrade twice is safe after the full historical chain.
  await db.exec(read('supabase-migration-7.28.sql'));await db.exec(read('supabase-migration-7.28.sql'));
 }finally{await db.close()}
});
