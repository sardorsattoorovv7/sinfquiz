import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {performance,monitorEventLoopDelay} from 'node:perf_hooks';
import {competitionHttp} from './competition-http-fixture.js';
import {config,teacher,students} from './competition-fixture.js';
import {typingMatch} from '../src/competition-typing.js';
const out='qa-7.24',id='72420000-0000-0000-0000-000000000001',pupils=students.slice(0,40),text=('Our class learns together. We read, think and practise every day. ').repeat(60).slice(0,4000);
const percentile=(values,p)=>Math.round([...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1]*100)/100;
async function scenario(patched){
 const f=await competitionHttp({port:patched?4186:4187,patched}),rows=[],cpu=process.cpuUsage(),loop=monitorEventLoopDelay({resolution:20});loop.enable();
 const request=async(uid,action,body={})=>{
  const at=performance.now(),r=await fetch(f.url+'/api/competitions/'+action,{method:'POST',headers:{'Content-Type':'application/json','x-fixture-user':uid},body:JSON.stringify(body)}),data=await r.json();
  rows.push({action,ms:performance.now()-at,status:r.status,bytes:Buffer.byteLength(JSON.stringify(data))});assert.equal(r.status,200,data.error);return data;
 };
 const concurrent=async(title,fn)=>{const start=rows.length,at=performance.now();const values=await Promise.all(pupils.map(fn)),sample=rows.slice(start);console.log(`${patched?'7.24':'7.22'} ${title}: ${sample.length} HTTP requests, p95 ${percentile(sample.map(r=>r.ms),.95)}ms`);return {values,metric:{phase:title,requests:sample.length,totalMs:Math.round(performance.now()-at),p50Ms:percentile(sample.map(r=>r.ms),.5),p95Ms:percentile(sample.map(r=>r.ms),.95),maxMs:Math.round(Math.max(...sample.map(r=>r.ms))),responseBytes:sample.reduce((n,r)=>n+r.bytes,0),errors:sample.filter(r=>r.status!==200).length}}};
 const phases=[];
 try{
  const cfg=config({teamSize:10,teams:['Zukko','Bilimdon','Ziyrak','Ijodkor'].map(title=>({title,roster:[]}))});cfg.stages[1].custom.text=text;
  cfg.stages=[...cfg.stages,...Array.from({length:6},(_,i)=>({...cfg.stages[0],title:'Qo‘shimcha bosqich '+(i+5)}))];
  await request(teacher,'save',{config:{...cfg,id}});let owner=await request(teacher,'control',{id,action:'publish'});
  let batch=await concurrent('40 simultaneous joins',(uid,n)=>request(uid,'join',{code:owner.teams[Math.floor(n/10)].code,name:'O‘quvchi '+n}));phases.push(batch.metric);
  owner=await request(teacher,'control',{id,action:'start'});assert.equal(owner.competition.status,'running');
  batch=await concurrent('40 simultaneous stage opens',uid=>request(uid,'state',{id}));phases.push(batch.metric);let states=batch.values;
  for(let repeat=0;repeat<3;repeat++){batch=await concurrent('unchanged lobby/room poll '+(repeat+1),(uid,n)=>request(uid,patched?'poll':'state',{id,revision:states[n].revision}));phases.push(batch.metric);if(patched)assert.ok(batch.values.every(r=>r.unchanged===true))}
  batch=await concurrent('40 simultaneous quiz submissions',(uid,n)=>request(uid,'answer',{id,stageId:states[n].current.id,actionId:crypto.randomUUID(),body:{questionId:states[n].current.data.question.id,answer:n<20?0:1}}));phases.push(batch.metric);assert.ok(batch.values.every(r=>r.current.finished));
  owner=await request(teacher,'state',{id});assert.deepEqual(owner.teams.map(t=>t.rank),[1,2,3,4]);
  await request(teacher,'control',{id,action:'next',stage:1});
  batch=await concurrent('40 simultaneous long typing opens',uid=>request(uid,'state',{id}));phases.push(batch.metric);states=batch.values;
  batch=await concurrent('40 simultaneous 4000-character typing submissions',(uid,n)=>request(uid,'answer',{id,stageId:states[n].current.id,actionId:crypto.randomUUID(),body:{text:n%2?text.slice(1):text}}));phases.push(batch.metric);
  const typoAccuracies=batch.values.filter((_,n)=>n%2).map(r=>r.current.feedback.accuracy);if(patched)assert.ok(typoAccuracies.every(n=>n>=99.9));
  // Exercise all ten transitions/roster attempts, not just the opening burst.
  await request(teacher,'control',{id,action:'next',stage:2});
  for(let position=3;position<=10;position++){
   const opened=await concurrent('40 stage '+position+' opens',uid=>request(uid,'state',{id}));phases.push(opened.metric);
   const answered=await concurrent('40 stage '+position+' answers',(uid,n)=>request(uid,'answer',{id,stageId:opened.values[n].current.id,actionId:crypto.randomUUID(),body:{questionId:opened.values[n].current.data.question.id,answer:n<20?0:1}}));phases.push(answered.metric);
   owner=await request(teacher,'control',{id,action:'next',stage:position});
  }
  assert.equal(owner.competition.status,'finished');assert.equal(owner.members.length,40);assert.ok(owner.members.every(m=>m.stages.length===10));
  const scores=owner.teams.map(t=>({title:t.title,rank:t.rank,score:t.score})),stateRows=rows.filter(r=>r.action==='state'),pollRows=rows.filter(r=>r.action==='poll');
  const elapsedCpu=process.cpuUsage(cpu);loop.disable();
  return {version:patched?'7.24':'7.22',passed:true,concurrentStudents:40,teams:4,teamSize:10,stages:10,requests:rows.length,errors:rows.filter(r=>r.status!==200).length,phases,typoAccuracies,scores,unchangedPollBytes:pollRows.reduce((n,r)=>n+r.bytes,0),cpuMs:Math.round((elapsedCpu.user+elapsedCpu.system)/1000),eventLoopP95Ms:Math.round(loop.percentile(95)/1e6),dbModel:'Single PGlite PostgreSQL instance, serialized per-user auth/RLS; real loopback HTTP concurrency, no live Supabase or physical phones.'};
 }finally{loop.disable();await f.close()}
}
await mkdir(out,{recursive:true});const baseline=await scenario(false),updated=await scenario(true),before=baseline.phases.filter(p=>p.phase.startsWith('unchanged')).reduce((n,p)=>n+p.responseBytes,0),after=updated.phases.filter(p=>p.phase.startsWith('unchanged')).reduce((n,p)=>n+p.responseBytes,0);
const report={passed:baseline.passed&&updated.passed,scope:'40 simultaneous HTTP clients and actual SQL/RLS. Not a production Supabase capacity guarantee.',baseline,updated,unchangedResponseReductionPercent:Math.round(100*(1-after/before)*100)/100};
await writeFile(out+'/competition-load.json',JSON.stringify(report,null,2)+'\n');console.log('PASS load comparison',report.unchangedResponseReductionPercent+'% fewer response bytes on unchanged polls');
