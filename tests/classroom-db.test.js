import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const teacher='00000000-0000-0000-0000-000000000011';
const teacher2='00000000-0000-0000-0000-000000000012';
const student='00000000-0000-0000-0000-000000000013';
const student2='00000000-0000-0000-0000-000000000014';
const admin='00000000-0000-0000-0000-000000000015';

test('lesson unique readers and private 24-hour teacher/student chat',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;
   create table public.documents(collection text,id text,data jsonb,primary key(collection,id));
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt',true),'')::jsonb,'{}'::jsonb)$$;
   create function public.sq_role() returns text language sql stable as $$select data->>'role' from public.documents where collection='profiles' and id=auth.uid()::text$$;
   create function public.sq_is_admin() returns boolean language sql stable as $$select public.sq_role()='admin'$$;`);
  for(const [uid,role,name] of [[teacher,'teacher','Ustoz A'],[teacher2,'teacher','Ustoz B'],[student,'student','O‘quvchi A'],[student2,'student','O‘quvchi B'],[admin,'admin','Admin']])
   await db.query('insert into public.documents values($1,$2,$3)', ['profiles',uid,JSON.stringify({role,name})]);
  await db.query('insert into public.documents values($1,$2,$3)', ['lessons','lesson-a',JSON.stringify({ownerId:teacher,visibility:'public'})]);
  await db.query('insert into public.documents values($1,$2,$3)', ['lessons','lesson-b',JSON.stringify({ownerId:teacher2,visibility:'private'})]);
  const source=readFileSync(new URL('../supabase-migration-7.8.sql',import.meta.url),'utf8');
  await db.exec(source.split('-- Supabase Cron / pg_cron')[0]);
  const login=async(uid,anonymous=false)=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[uid]);await db.query("select set_config('request.jwt',$1,false)",[JSON.stringify({is_anonymous:anonymous})]);await db.exec('set role authenticated')};
  const rpc=async(name,args=[])=>{const placeholders=args.map((_,i)=>'$'+(i+1)).join(',');return (await db.query(`select public.${name}(${placeholders}) as result`,args)).rows[0].result};

  await login(student,true);await assert.rejects(rpc('sq_chat_open',['lesson-a']),/O‘quvchi hisobida/);
  await login(student);await assert.rejects(rpc('sq_chat_open',['lesson-b']),/topilmadi/);
  assert.equal(await rpc('sq_lesson_mark_read',['lesson-a']),1);
  assert.equal(await rpc('sq_lesson_mark_read',['lesson-a']),1);
  assert.equal((await rpc('sq_lesson_counts',[['lesson-a']]))['lesson-a'],1);
  const thread=await rpc('sq_chat_open',['lesson-a']);
  assert.equal(await rpc('sq_chat_open',['lesson-a']),thread);
  const message=await rpc('sq_chat_send',[thread,'text','Assalomu alaykum, ustoz',null,null,null]);
  assert.equal(message.body,'Assalomu alaykum, ustoz');
  await assert.rejects(rpc('sq_chat_send',[thread,'text','Tez xabar',null,null,null]),/Biroz kutib/);
  await assert.rejects(db.query('select * from public.sq_chat_messages'),/permission denied/);

  await login(student2);await assert.rejects(rpc('sq_chat_messages_for',[thread]),/topilmadi/);
  await assert.rejects(rpc('sq_chat_audio',[message.id]),/topilmadi/);
  await login(teacher2);assert.equal((await rpc('sq_chat_inbox')).length,0);
  await login(teacher);assert.equal((await rpc('sq_chat_inbox')).length,1);
  assert.equal((await rpc('sq_chat_messages_for',[thread]))[0].body,'Assalomu alaykum, ustoz');
  const bytes=Buffer.concat([Buffer.from('1a45dfa3','hex'),Buffer.alloc(120,1)]).toString('base64');
  const voice=await rpc('sq_chat_send',[thread,'voice',null,bytes,'audio/webm',4]);
  assert.equal((await rpc('sq_chat_audio',[voice.id])).base64,bytes);
  await assert.rejects(rpc('sq_chat_send',[thread,'voice',null,bytes,'audio/png',4]),/Ovoz|Biroz kutib/);
  await login(admin);await assert.rejects(rpc('sq_chat_audio',[voice.id]),/topilmadi/);
  await login(student);assert.equal(await rpc('sq_chat_report',[voice.id]),true);
  await login(admin);assert.equal((await rpc('sq_chat_reports')).length,1);
  assert.equal((await rpc('sq_chat_audio',[voice.id])).base64,bytes);
  assert.equal(await rpc('sq_chat_moderate',[thread,true]),true);
  await login(teacher);await assert.rejects(rpc('sq_chat_send',[thread,'text','Javob',null,null,null]),/bloklangan/);
  await login(admin);await db.exec('reset role');
  await db.exec("update public.sq_chat_messages set created_at=now()-interval '25 hours'");
  assert.equal(await rpc('sq_chat_purge'),2);
  assert.equal((await db.query('select count(*)::int count from public.sq_chat_messages')).rows[0].count,0);
  await db.exec("delete from public.documents where collection='lessons' and id='lesson-a'");
  assert.equal((await db.query('select count(*)::int count from public.sq_lesson_reads')).rows[0].count,0);
  assert.equal((await db.query('select count(*)::int count from public.sq_chat_threads')).rows[0].count,0);
 }finally{await db.close()}
});
