import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {newCefrTest,cefrIssues} from '../src/cefr-model.js';
const admin='00000000-0000-0000-0000-000000000001',student='00000000-0000-0000-0000-000000000002',other='00000000-0000-0000-0000-000000000003';
export function completeCefr(){const p=newCefrTest();p.title='CEFR regression';p.rightsConfirmed=true;p.sections.forEach((s,i)=>s.parts.forEach(part=>{part.source='Original regression fixture';part.text='Fixture passage and instructions.';part.audioUrl='https://example.org/audio.mp3';part.questions.forEach(q=>{q.text='Fixture '+s.skill;if(i<2){q.answers=['answer'];q.explanation='Fixture explanation';}})}));return p}
test('CEFR database: admin authorization, secret keys, persistence, section locking, grading and private audio',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
  create table auth.users(id uuid primary key);insert into auth.users values('${admin}'),('${student}'),('${other}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
  create function public.sq_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
  create table public.documents(collection text,id text,data jsonb);
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
  alter table storage.objects enable row level security;grant usage on schema auth,storage to authenticated;grant select,insert on storage.objects to authenticated;`);
  const sql=readFileSync(new URL('../supabase-migration-7.4.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
  const resultsFix=readFileSync(new URL('../supabase-cefr-results-fix.sql',import.meta.url),'utf8');await db.exec(resultsFix);await db.exec(resultsFix);
  const login=async id=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[id]);await db.exec('set role authenticated')};
  const rpc=async(name,args=[])=>{const params=args.map((_,i)=>'$'+(i+1)).join(',');return (await db.query(`select public.${name}(${params}) as result`,args)).rows[0].result};
  await login(student);await assert.rejects(rpc('sq_cefr_admin',['list']),/administrator/);await assert.rejects(db.query('select * from public.cefr_tests'),/permission denied/);
  await login(admin);let draft=await rpc('sq_cefr_admin',['save',null,JSON.stringify({payload:{...newCefrTest(),title:'Unfinished'}})]);await assert.rejects(rpc('sq_cefr_admin',['publish',draft.id]),/huquq/);
  const p=completeCefr();assert.deepEqual(cefrIssues(p),[]);
  let row=await rpc('sq_cefr_admin',['save',null,JSON.stringify({payload:p})]);await rpc('sq_cefr_admin',['publish',row.id]);
  await login(student);const catalog=await rpc('sq_cefr_catalog');assert.equal(catalog.tests.length,1);assert.ok(!JSON.stringify(catalog).includes('explanation'));
  let a=await rpc('sq_cefr_start',[row.id]);assert.ok(!JSON.stringify(a.payload).includes('answers'));assert.equal(a.result,null);
  assert.equal((await rpc('sq_cefr_start',[row.id])).id,a.id);
  a=await rpc('sq_cefr_session',[a.id,'save',0,JSON.stringify({'listening-1-1':'  ANSWER  '}),a.revision]);assert.equal(a.answers['listening-1-1'],'  ANSWER  ');
  await assert.rejects(rpc('sq_cefr_session',[a.id,'save',0,JSON.stringify({'reading-1-1':'answer'}),a.revision]),/joriy/);
  await assert.rejects(rpc('sq_cefr_session',[a.id,'save',0,'{}',1]),/boshqa oynada/);
  await login(other);await assert.rejects(rpc('sq_cefr_session',[a.id]),/topilmadi/);assert.equal((await rpc('sq_cefr_catalog')).attempts.length,0);
  await login(admin);row=await rpc('sq_cefr_admin',['save',row.id,JSON.stringify({payload:{...p,title:'Changed'},revision:row.revision})]);
  await assert.rejects(rpc('sq_cefr_admin',['save',row.id,JSON.stringify({payload:p,revision:1})]),/o‘zgargan/);
  await login(student);a=await rpc('sq_cefr_session',[a.id,'next',0,'{}',a.revision]);assert.equal(a.step,1);assert.equal(a.payload.title,'CEFR regression');
  await assert.rejects(rpc('sq_cefr_session',[a.id,'save',0,'{}',a.revision]),/yangilangan/);
  a=await rpc('sq_cefr_session',[a.id,'next',1,JSON.stringify({'reading-1-1':'answer'}),a.revision]);assert.equal(a.step,2);
  a=await rpc('sq_cefr_session',[a.id,'next',2,JSON.stringify({'writing-1-1':'My written response.'}),a.revision]);assert.equal(a.step,3);
  const audio=`${student}/${a.id}/speaking-1-1/test.webm`;
  await assert.rejects(db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['cefr-recordings',`${other}/${a.id}/speaking-1-1/hack.webm`]),/row-level/);
  await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['cefr-recordings',audio]);
  a=await rpc('sq_cefr_session',[a.id,'finish',3,JSON.stringify({'speaking-1-1':audio}),a.revision]);assert.ok(a.finished_at);assert.equal(a.result.scores.listening.correct,1);assert.equal(a.result.scores.reading.correct,1);
  const finished=await rpc('sq_cefr_session',[a.id,'save',3,JSON.stringify({'speaking-1-1':''}),a.revision]);assert.equal(finished.answers['speaking-1-1'],audio);
  await assert.rejects(db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['cefr-recordings',`${student}/${a.id}/speaking-1-1/late.webm`]),/row-level/);
  await login(other);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
  await login(admin);assert.equal((await db.query('select * from storage.objects')).rows.length,1);
  assert.equal((await rpc('sq_cefr_admin',['results'])).length,1);
  await rpc('sq_cefr_admin',['review',a.id,JSON.stringify({writing:55,speaking:50,feedback:'Use more specific examples.'})]);
  await login(student);assert.equal((await rpc('sq_cefr_session',[a.id])).assessment.writing,55);
  // Deadline is enforced in SQL even if the browser sends a late correct answer.
  await login(admin);await rpc('sq_cefr_admin',['publish',row.id]);await login(student);let expired=await rpc('sq_cefr_start',[row.id]);
  await db.exec('reset role');await db.query("update public.cefr_attempts set ends_at=now()-interval '1 second' where id=$1",[expired.id]);await db.exec('set role authenticated');
  expired=await rpc('sq_cefr_session',[expired.id,'save',0,JSON.stringify({'listening-1-1':'answer'}),expired.revision]);assert.equal(expired.step,1);assert.equal(expired.answers['listening-1-1'],undefined);assert.equal(expired.expired,true);
 }finally{await db.close()}
});
