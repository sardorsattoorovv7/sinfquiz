import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {competitionFixture,config,teacher,other,admin,students} from './competition-fixture.js';
import {typingDistance,typingMatch} from '../src/competition-typing.js';
const id='72410000-0000-0000-0000-000000000001';
async function lobby(f,cfg=config()){
 await f.call(teacher,'sq_comp_save',[id,cfg]);return f.call(teacher,'sq_comp_control',[id,'publish',0]);
}
test('7.24 attendance: partial teams start, empty teams unranked, roster freezes and absent students cannot answer',async()=>{
 const f=await competitionFixture();try{
  const s=await lobby(f),a=s.teams.find(t=>t.title==='Zukko'),b=s.teams.find(t=>t.title==='Bilimdon');
  await assert.rejects(f.call(teacher,'sq_comp_control',[id,'start-current',0]),/Kamida ikkita/);
  for(const [n,code] of [[0,a.code],[1,b.code],[2,b.code]])await f.call(students[n],'sq_comp_join',[code,'O‘quvchi '+n]);
  await assert.rejects(f.call(other,'sq_comp_member',[id,students[2],false]),/ruxsat/);
  await assert.rejects(f.call(students[0],'sq_comp_control',[id,'start-current',0]),/ruxsat/);
  const excluded=await f.call(teacher,'sq_comp_member',[id,students[2],false]);assert.equal(excluded.members.find(m=>m.userId===students[2]).excluded,true);
  assert.equal((await f.call(students[2],'sq_comp_join',[b.code,'Yangi ism'])).me.excluded,true);
  const owner=await f.call(teacher,'sq_comp_control',[id,'start-current',0]);assert.equal(owner.competition.status,'running');assert.equal(owner.teams.find(t=>t.id===a.id).startedSize,1);assert.equal(owner.teams.find(t=>t.id===b.id).startedSize,1);assert.equal(owner.teams.find(t=>t.title==='Kelmagan jamoa').rank,null);
  assert.equal((await f.call(teacher,'sq_comp_control',[id,'start-current',0])).competition.currentStage,1);
  await assert.rejects(f.call(teacher,'sq_comp_member',[id,students[2],true]),/boshlanguncha/);
  assert.ok((await f.call(students[3],'sq_comp_join',[a.code,'Kechikkan'])).error);
  const absent=await f.call(students[2],'sq_comp_state',[id]);assert.equal(absent.current.data,undefined);
  await assert.rejects(f.call(students[2],'sq_comp_answer',[id,owner.current.id,crypto.randomUUID(),{questionId:'x',answer:0}]),/qatnashmayapsiz/);
  for(let n=0;n<2;n++){const s=await f.call(students[n],'sq_comp_state',[id]);await f.call(students[n],'sq_comp_answer',[id,s.current.id,crypto.randomUUID(),{questionId:s.current.data.question.id,answer:n}])}
  const next=await f.call(teacher,'sq_comp_control',[id,'next',1]);assert.equal(next.competition.currentStage,2);
  assert.equal(next.teams.find(t=>t.id===a.id).score,100);assert.equal(next.teams.find(t=>t.id===b.id).score,0);
 }finally{await f.db.close()}
});
test('7.24 unequal team sizes use fixed starting denominators and averaged tie breakers; withdrawn participants do not block next',async()=>{
 const f=await competitionFixture();try{
  let s=await lobby(f),a=s.teams.find(t=>t.title==='Zukko'),b=s.teams.find(t=>t.title==='Bilimdon');
  for(const [n,code] of [[0,a.code],[1,b.code],[2,b.code]])await f.call(students[n],'sq_comp_join',[code,'Ishtirokchi '+n]);
  await f.call(teacher,'sq_comp_control',[id,'start-current',0]);
  for(let n=0;n<3;n++){s=await f.call(students[n],'sq_comp_state',[id]);await f.call(students[n],'sq_comp_answer',[id,s.current.id,crypto.randomUUID(),{questionId:s.current.data.question.id,answer:0}])}
  // Same performance in differently sized teams must not favor more members.
  await f.db.query('update public.sq_comp_attempts set elapsed=10 where competition_id=$1',[id]);
  s=await f.call(teacher,'sq_comp_state',[id]);assert.deepEqual(s.teams.filter(t=>t.startedSize>0).map(t=>[t.score,t.correct,t.elapsed,t.rank]),[[100,1,10,1],[100,1,10,1]]);
  await f.call(teacher,'sq_comp_control',[id,'next',1]);await f.call(students[2],'sq_comp_leave',[id]);
  for(let n=0;n<2;n++){s=await f.call(students[n],'sq_comp_state',[id]);await f.call(students[n],'sq_comp_answer',[id,s.current.id,crypto.randomUUID(),{text:s.current.data.text}])}
  s=await f.call(teacher,'sq_comp_control',[id,'next',2]);assert.equal(s.competition.currentStage,3);assert.equal(s.teams.find(t=>t.id===b.id).startedSize,2);assert.equal(s.teams.find(t=>t.id===b.id).stages.find(t=>t.position===2).score,50);
 }finally{await f.db.close()}
});
test('7.24 cancellation closes joining and answers, preserves scores, is idempotent, and only owner/admin controls it',async()=>{
 const f=await competitionFixture();try{
  let s=await lobby(f,config({teamSize:1,teams:config().teams.slice(0,2)}));const codes=s.teams.map(t=>t.code);
  for(let n=0;n<2;n++)await f.call(students[n],'sq_comp_join',[codes[n],'Bola '+n]);
  await f.call(teacher,'sq_comp_control',[id,'start',0]);s=await f.call(students[0],'sq_comp_state',[id]);await f.call(students[0],'sq_comp_answer',[id,s.current.id,crypto.randomUUID(),{questionId:s.current.data.question.id,answer:0}]);
  await assert.rejects(f.call(other,'sq_comp_control',[id,'cancel',1]),/ruxsat/);
  const cancelled=await f.call(admin,'sq_comp_control',[id,'cancel',1]);assert.equal(cancelled.competition.status,'cancelled');assert.ok(cancelled.teams.some(t=>t.score===100));
  assert.equal((await f.call(teacher,'sq_comp_control',[id,'cancel',1])).competition.status,'cancelled');assert.ok((await f.call(students[3],'sq_comp_join',[codes[0],'Yangi bola'])).error);
  await assert.rejects(f.call(students[1],'sq_comp_answer',[id,s.current.id,crypto.randomUUID(),{}]),/faol emas/);
  assert.equal((await f.call(students[0],'sq_comp_state',[id])).history[0].score,100);
 }finally{await f.db.close()}
});
test('7.24 real SQL typing uses edit distance, Unicode, bounds and idempotence; poll never leaks hidden answers',async()=>{
 const f=await competitionFixture();try{
  const pairs=[['I go to school.',' go to school.',1],['I go to school.','Ix go to school.',1],['A😀B','A😀C',1],['','a',1],['abc','',3],['abc','xyz',3],['kitob','kotib',2],['abc','xbcdd',3],['a'.repeat(4000),'a'.repeat(3999),1]];
  for(const [a,b,d] of pairs){const r=(await f.db.query('select public.sq_comp_distance($1,$2) d',[a,b])).rows[0].d;assert.equal(r,d);assert.equal(typingDistance(a,b),d)}
  await assert.rejects(f.db.query('select public.sq_comp_distance($1,$2)',['a'.repeat(4001),'x']),/hajmi/);
  for(const [a,b] of [['abc '.repeat(1000),'xbc '.repeat(1000)],['abc '.repeat(1000),'\nxbc\t'.repeat(1000)+'\r\n'],['x'.repeat(1000)+' y','y '+ 'x'.repeat(1000)],['I go to school every day.','I go to school every day.'+' '.repeat(500)]]){
   const r=(await f.db.query('select public.sq_comp_typing($1,$2) value',[a,b])).rows[0].value,j=typingMatch(a,b);
   assert.equal(r.method,j.method);assert.equal(r.distance,j.distance);assert.ok(Math.abs(r.accuracy-j.accuracy)<1e-8);assert.equal(r.expectedUnits,j.expectedUnits);assert.equal(r.typedUnits,j.typedUnits);
  }

  let s=await lobby(f,config({teamSize:1,teams:config().teams.slice(0,2)}));for(let n=0;n<2;n++)await f.call(students[n],'sq_comp_join',[s.teams[n].code,'Bola '+n]);
  await f.call(teacher,'sq_comp_control',[id,'start',0]);await f.call(teacher,'sq_comp_control',[id,'force-next',1]);
  s=await f.call(students[0],'sq_comp_state',[id]);const target=s.current.data.text,action=crypto.randomUUID();
  s=await f.call(students[0],'sq_comp_answer',[id,s.current.id,action,{text:target.slice(1),score:999}]);assert.equal(s.current.feedback.editDistance,1);assert.ok(s.current.feedback.accuracy>95);assert.ok(s.current.score>70);
  const again=await f.call(students[0],'sq_comp_answer',[id,s.current.id,action,{text:'wrong'}]);assert.equal(again.current.score,s.current.score);
  const full=await f.call(students[0],'sq_comp_state',[id]);const tiny=await f.call(students[0],'sq_comp_poll',[id,full.revision]);assert.equal(tiny.unchanged,true);assert.equal(tiny.stages,undefined);assert.equal(tiny.current,undefined);
  await assert.rejects(f.call(students[0],'sq_comp_member',[id,students[1],false]),/ruxsat/);
  // RLS/grants are still not direct-score writes.
  await f.db.query("select set_config('request.uid',$1,false)",[students[0]]);await f.db.exec('set role authenticated');await assert.rejects(f.db.query('select * from public.sq_comp_attempts'));await assert.rejects(f.db.query('select public.sq_comp_distance($1,$2)',['a','b']));await f.db.exec('reset role');
 }finally{await f.db.close()}
});
test('7.24 upgrade preserves completed competition data and all quiz templates on rerun',async()=>{
 const f=await competitionFixture({patched:false});try{
  let s=await lobby(f,config({teamSize:1,teams:config().teams.slice(0,2)}));for(let n=0;n<2;n++)await f.call(students[n],'sq_comp_join',[s.teams[n].code,'Bola '+n]);
  await f.call(teacher,'sq_comp_control',[id,'start',0]);s=await f.call(students[0],'sq_comp_state',[id]);await f.call(students[0],'sq_comp_answer',[id,s.current.id,crypto.randomUUID(),{questionId:s.current.data.question.id,answer:0}]);await f.call(teacher,'sq_comp_control',[id,'cancel',1]);
  const before=(await f.db.query('select * from public.sq_comp_attempts')).rows,templates=(await f.db.query('select * from public.sq_comp_templates order by id')).rows;
  const patch=readFileSync(new URL('../supabase-migration-7.24.sql',import.meta.url),'utf8');await f.db.exec(patch);await f.db.exec(patch);
  assert.deepEqual((await f.db.query('select * from public.sq_comp_attempts')).rows,before);assert.deepEqual((await f.db.query('select * from public.sq_comp_templates order by id')).rows,templates);
  s=await f.call(teacher,'sq_comp_state',[id]);assert.equal(s.competition.status,'cancelled');assert.ok(s.teams.some(t=>t.score===100));
 }finally{await f.db.close()}
});
