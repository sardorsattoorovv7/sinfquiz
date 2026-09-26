import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {readyMocks,listeningScripts} from '../scripts/generate-cefr-ready.mjs';
import {cefrIssues} from '../src/cefr-model.js';
const admin='00000000-0000-0000-0000-000000000001';
const student='00000000-0000-0000-0000-000000000002';

test('ten complete original Multilevel mocks seed once, play and keep keys private',async()=>{
 assert.equal(readyMocks.length,10);
 assert.equal(listeningScripts.length,60);
 const ids=new Set();
 for(const [index,mock] of readyMocks.entries()){
  assert.deepEqual(cefrIssues(mock),[]);
  assert.deepEqual(mock.sections.map(s=>s.parts.reduce((count,p)=>count+p.questions.length,0)),[35,35,3,8]);
  for(const section of mock.sections)for(const part of section.parts)for(const q of part.questions){
   assert.ok(!ids.has(q.id),q.id);ids.add(q.id);
   if(q.type==='choice')assert.equal(q.options.filter(o=>o===q.answers[0]).length,1);
  }
  for(let p=1;p<=6;p++)assert.ok(statSync(new URL(`../public/cefr-audio/mock-${index+1}-part-${p}.mp3`,import.meta.url)).size>2000);
 }
 assert.equal(ids.size,810);
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
   create table auth.users(id uuid primary key);insert into auth.users values('${admin}'),('${student}');
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
   create function public.sq_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
   create table public.documents(collection text not null,id text not null,data jsonb not null,primary key(collection,id));
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
   alter table storage.objects enable row level security;
   grant usage on schema auth,storage to authenticated;
   grant select,insert on storage.objects to authenticated;`);
  const base=readFileSync(new URL('../supabase-migration-7.4.sql',import.meta.url),'utf8');
  await db.exec(base);
  const migration=readFileSync(new URL('../supabase-migration-7.7.sql',import.meta.url),'utf8');
  await db.exec(migration);await db.exec(migration);
  const login=async id=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[id]);await db.exec('set role authenticated')};
  const rpc=async(name,args=[])=>{const params=args.map((_,i)=>'$'+(i+1)).join(',');return (await db.query(`select public.${name}(${params}) as result`,args)).rows[0].result};
  await login(student);
  await assert.rejects(rpc('sq_cefr_seed'),/administrator/);
  await assert.rejects(db.query('select * from public.cefr_builtin_bank'),/permission denied/);
  await login(admin);
  assert.equal((await rpc('sq_cefr_seed')).added,10);
  assert.equal((await rpc('sq_cefr_seed')).added,0);
  assert.equal((await rpc('sq_cefr_admin',['results'])).length,0);
  assert.equal((await rpc('sq_cefr_admin',['list'])).length,10);
  await login(student);
  const catalog=await rpc('sq_cefr_catalog');
  assert.equal(catalog.tests.length,10);
  const attempt=await rpc('sq_cefr_start',[catalog.tests[0].id]);
  assert.equal(attempt.payload.sections[0].parts.length,6);
  assert.match(attempt.payload.sections[0].parts[0].audioUrl,/^\/cefr-audio\/mock-\d+-part-1\.mp3$/);
  assert.ok(!JSON.stringify(attempt.payload).includes('"answers"'));
  assert.ok(!JSON.stringify(attempt.payload).includes('"explanation"'));
 }finally{await db.close()}
});
