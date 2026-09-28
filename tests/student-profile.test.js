import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {normalizedHistory} from '../src/profile-results.js';
import {resetEmailPassword} from '../api/admin-reset-password.js';

const admin='00000000-0000-4000-8000-000000000001';
const student='00000000-0000-4000-8000-000000000002';
const stranger='00000000-0000-4000-8000-000000000003';

function mockAdminDb({actorEmail='admin@sinfquiz.uz',targetProvider='email'}={}){
 const profiles={
  [admin]:{role:'admin',email:'admin@sinfquiz.uz'},
  [student]:{uid:student,role:'student',email:'learner@example.com',provider:targetProvider},
 };
 let newPassword=null;
 const db={
  auth:{getUser:async()=>({data:{user:{id:admin,email:actorEmail}}}),admin:{getUserById:async()=>({data:{user:{id:student,email:'learner@example.com'}}}),updateUserById:async(id,payload)=>{assert.equal(id,student);newPassword=payload.password;return {error:null}}}},
  from:()=>({select(){return this},eq(field,value){if(field==='id'){this.uid=value;if(this.payload){profiles[value]=this.payload.data;return {error:null}}}return this},async maybeSingle(){return {data:profiles[this.uid]?{data:profiles[this.uid]}:null,error:null}},update(payload){this.payload=payload;return this}}),
 };
 return {db,getPassword:()=>newPassword};
}

test('only verified admin may issue a one-time replacement for a real email account',async()=>{
 const now=Date.now();
 await assert.rejects(resetEmailPassword(mockAdminDb({actorEmail:'teacher@example.com'}).db,'token',student,now),/Administrator ruxsati/);
 await assert.rejects(resetEmailPassword(mockAdminDb({targetProvider:'telegram'}).db,'token',student,now),/Email orqali/);
 const mock=mockAdminDb();
 const result=await resetEmailPassword(mock.db,'token',student,now);
 assert.equal(result.email,'learner@example.com');
 assert.equal(result.password,mock.getPassword());
 assert.match(result.password,/^[A-Za-z0-9_-]{24}$/);
 await assert.rejects(resetEmailPassword(mock.db,'token',student,now+1000),/Bir daqiqadan/);
});

test('history combines account results and local practice without duplicating a synced result',()=>{
 const rows=normalizedHistory({players:[{id:'a',quizTitle:'Sinf testi',correct:3,answers:5,score:25,finishedAt:1000}],typing:[{id:'t',averageAccuracy:98,averageWpm:42,completedAt:2000}],practice:[{id:'p',title:'Python',correct:5,total:5,at:3000}],cefr:[{id:'c',title:'Mock',finished_at:'2026-09-27T09:00:00Z',result:{overall:61}}]},[{id:'p',title:'Python',correct:5,total:5,at:3000}]);
 assert.equal(rows.length,4);
 assert.equal(rows.filter(row=>row.type==='practice').length,1);
 assert.equal(rows.find(row=>row.type==='cefr').score.includes('61/75'),true);
});

test('7.9 SQL keeps practice, race and CEFR histories within the authenticated account',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;
   create table public.documents(collection text,id text,data jsonb,updated_at timestamptz default now(),primary key(collection,id));
   create table public.cefr_attempts(id uuid,uid uuid,snapshot jsonb,finished_at timestamptz,assessment jsonb,result jsonb);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt',true),'')::jsonb,'{}'::jsonb)$$;
   alter table public.documents enable row level security;
   grant usage on schema auth to authenticated;
   grant execute on all functions in schema auth to authenticated;
   grant select,insert,update on public.documents to authenticated;`);
  const migration=readFileSync(new URL('../supabase-migration-7.9.sql',import.meta.url),'utf8');
  await db.exec(migration);await db.exec(migration);
  await db.query('insert into public.cefr_attempts values($1,$2,$3,now(),$4,$5)', ['10000000-0000-4000-8000-000000000000',student,JSON.stringify({title:'Mock 1'}),JSON.stringify({writing:65}),JSON.stringify({overall:62})]);
  const login=async uid=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[uid]);await db.query("select set_config('request.jwt',$1,false)",[JSON.stringify({is_anonymous:false})]);await db.exec('set role authenticated')};
  await login(student);
  await db.query('insert into public.documents(collection,id,data) values($1,$2,$3)', ['practiceResults',`${student}:python:1000`,JSON.stringify({uid:student,title:'Python',correct:4,total:5,at:1000})]);
  await assert.rejects(db.query('insert into public.documents(collection,id,data) values($1,$2,$3)', ['practiceResults',`${stranger}:fake`,JSON.stringify({uid:stranger,title:'Soxta',correct:5,total:5,at:1000})]),/row-level security/);
  assert.equal((await db.query('select public.sq_student_result_history() as r')).rows[0].r.length,1);
  await db.exec('reset role');
  const race={id:'race-1',title:'1v1 sinov',phase:'running',winnerId:null,questionCount:4,racers:[{id:'a',uid:student,name:'Aziza',correct:4},{id:'b',uid:stranger,name:'Bekzod',correct:3}]};
  await db.query('insert into public.documents(collection,id,data) values($1,$2,$3)', ['live','race',JSON.stringify(race)]);
  await db.query('update public.documents set data=$1 where collection=$2 and id=$3',[JSON.stringify({...race,phase:'finished',winnerId:'a',finishedAt:2000}),'live','race']);
  await login(student);
  const mine=(await db.query('select collection,id from public.documents order by collection,id')).rows;
  assert.deepEqual(mine.map(row=>row.id),[`${student}:python:1000`,'race-1:a']);
  await login(stranger);
  assert.deepEqual((await db.query("select id from public.documents where collection='raceResults'")).rows.map(row=>row.id),['race-1:b']);
  assert.deepEqual((await db.query('select public.sq_student_result_history() as r')).rows[0].r,[]);
 }finally{await db.close()}
});
