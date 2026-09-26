import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const teacherA='00000000-0000-0000-0000-000000000001';
const teacherB='00000000-0000-0000-0000-000000000002';
const studentA='00000000-0000-0000-0000-000000000003';
const studentB='00000000-0000-0000-0000-000000000004';
const visitor='00000000-0000-0000-0000-000000000005';
const player=(id,uid,ownerId,quizId,name,score=0)=>({id,uid,ownerId,quizId,name,avatar:'🐼',score,correct:0,answers:0,startedAt:100,responses:[{value:'private answer'}]});

test('leaderboards are isolated by teacher and quiz while live rows omit answers',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role authenticated; create role anon; create schema auth;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
    create function public.sq_is_admin() returns boolean language sql stable as $$select false$$;
    create function public.sq_is_teacher() returns boolean language sql stable as $$select auth.uid() in ('${teacherA}'::uuid,'${teacherB}'::uuid)$$;
    create table public.documents(collection text not null,id text not null,data jsonb not null,updated_at timestamptz default now(),primary key(collection,id));
    alter table public.documents enable row level security;
    grant usage on schema auth to authenticated;
    grant select,insert,update,delete on public.documents to authenticated;
    create policy prior_read on public.documents for select to authenticated using(true);
    create policy prior_insert on public.documents for insert to authenticated with check(true);
    create policy prior_update on public.documents for update to authenticated using(true) with check(true);
    create policy prior_delete on public.documents for delete to authenticated using(true);`);
  const insert=async(collection,id,data)=>db.query('insert into public.documents(collection,id,data) values($1,$2,$3)',[collection,id,JSON.stringify(data)]);
  await insert('quizzes','quiz-a',{ownerId:teacherA,status:'active',visibility:'public'});
  await insert('quizzes','quiz-b',{ownerId:teacherB,status:'active',visibility:'public'});
  await insert('players','p-old',player('p-old',studentA,teacherA,'quiz-a','Aziza',12));
  const migration=readFileSync(new URL('../supabase-migration-7.6.sql',import.meta.url),'utf8');
  await db.exec(migration);await db.exec(migration);
  await db.exec('drop policy prior_read on public.documents');
  const login=async uid=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[uid]);await db.exec('set role authenticated')};
  const rows=async(collection=undefined)=>(await db.query('select collection,id,data from public.documents'+(collection?' where collection=$1':''),collection?[collection]:[])).rows;

  await login(studentA);
  assert.deepEqual((await rows('players')).map(r=>r.id),['p-old']);
  let leaderboards=await rows('leaderboards');
  assert.deepEqual(leaderboards.map(r=>r.id),['quiz-a']);
  assert.equal(leaderboards[0].data.rows[0].score,12);
  assert.ok(!JSON.stringify(leaderboards).includes('private answer'));

  await login(studentB);
  assert.equal((await rows('players')).length,0);
  assert.equal((await rows('leaderboards')).length,0);
  await assert.rejects(insert('players','spoof',player('spoof',studentB,teacherB,'quiz-a','Spoof')),/egasiga/);
  await insert('players','p-new',player('p-new',studentB,teacherA,'quiz-a','Bekzod',5));
  assert.deepEqual((await rows('leaderboards'))[0].data.rows.map(r=>r.name),['Aziza','Bekzod']);
  await db.query("update public.documents set data=jsonb_set(data,'{score}','20') where collection='players' and id='p-new'");
  assert.deepEqual((await rows('leaderboards'))[0].data.rows.map(r=>r.name),['Bekzod','Aziza']);
  await assert.rejects(db.query("update public.documents set data=jsonb_set(data,'{quizId}','\"quiz-b\"') where collection='players' and id='p-new'"),/egasiga|almashtirish/);

  await login(teacherB);
  assert.equal((await rows('players')).length,0);
  assert.deepEqual((await rows('leaderboards')).map(r=>r.id),['quiz-b']);
  await login(teacherA);
  assert.equal((await rows('players')).length,2);
  assert.equal((await rows('leaderboards')).length,1);

  await login(visitor);
  assert.equal((await rows('players')).length,0);
  assert.equal((await rows('leaderboards')).length,0);
 }finally{await db.close()}
});
