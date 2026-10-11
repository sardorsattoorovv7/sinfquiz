// HTTP burst test on a local single-process Postgres fixture. Not a Supabase capacity claim.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {competitionHttp} from './competition-http-fixture.js';
import {config,teacher,students} from './competition-729-fixture.js';
const out=process.env.COMPETITION_QA_DIR||'qa-7.29.0/load';
const id='72920000-0000-0000-0000-000000000001',users=students.slice(0,40),phases=[],rows=[];
const f=await competitionHttp({port:4198,latest:true});
const request=async(uid,action,body={})=>{
 const at=performance.now(),r=await fetch(f.url+'/api/competitions/'+action,{method:'POST',headers:{'Content-Type':'application/json','x-fixture-user':uid},body:JSON.stringify(body)}),data=await r.json();
 rows.push({action,status:r.status,ms:performance.now()-at,bytes:Buffer.byteLength(JSON.stringify(data))});assert.equal(r.status,200,data.error);return data;
};
const burst=async(title,fn)=>{
 const before=rows.length,at=performance.now(),values=await Promise.all(users.map(fn)),sample=rows.slice(before),times=sample.map(r=>r.ms).sort((a,b)=>a-b);
 const phase={title,requests:sample.length,totalMs:Math.round(performance.now()-at),p50Ms:+times[Math.ceil(times.length*.5)-1].toFixed(2),p95Ms:+times[Math.ceil(times.length*.95)-1].toFixed(2),maxMs:+times.at(-1).toFixed(2),errors:sample.filter(r=>r.status!==200).length,responseBytes:sample.reduce((n,r)=>n+r.bytes,0)};phases.push(phase);console.log(title+': '+phase.requests+' requests; p95 '+phase.p95Ms+' ms');return values;
};
try{
 const text='I go to school every day. Our class reads and learns together.';
 const value=config({orderMode:'free',teamSize:12,teams:['Zukko','Bilimdon','Ziyrak','Ijodkor'].map(title=>({title,roster:[]}))});
 value.stages[0].custom.questions=Array.from({length:3},(_,n)=>({type:'test',text:'2 + 3 nechaga teng? '+n,options:['5','4','6'],correct:0,points:100}));
 value.stages[1].custom.text=text;value.stages[3]={...value.stages[1],title:'Ikkinchi typing',duration:180};
 await request(teacher,'save',{config:{...value,id}});let owner=await request(teacher,'control',{id,action:'publish'});
 await burst('40 simultaneous joins',(uid,n)=>request(uid,'join',{code:owner.teams[n%4].code,name:'O‘quvchi '+n}));
 owner=await request(teacher,'control',{id,action:'start'});assert.equal(owner.competition.status,'running');assert.equal(owner.teams.reduce((n,t)=>n+t.startedSize,0),40);
 const opened=await burst('40 independent stage openings',(uid,n)=>request(uid,'select',{id,stageId:owner.stages[n%4].id}));
 await burst('40 unsubmitted draft saves',(uid,n)=>request(uid,'draft',{id,stageId:opened[n].current.id,actionId:crypto.randomUUID(),body:opened[n].current.kind==='typing'?{text:text.slice(0,32)}:{questionId:opened[n].current.data.question.id,answer:0}}));
 const refreshed=await burst('40 changed-state polls',(uid,n)=>request(uid,'poll',{id,revision:opened[n].revision}));
 const same=await burst('40 unchanged-state polls',(uid,n)=>request(uid,'poll',{id,revision:refreshed[n].revision}));assert.ok(same.every(s=>s.unchanged));
 await burst('40 stage switches',(uid,n)=>request(uid,'select',{id,stageId:owner.stages[(n+1)%4].id}));
 const reopened=await burst('40 returns preserve first deadline',(uid,n)=>request(uid,'select',{id,stageId:opened[n].current.id}));reopened.forEach((s,n)=>assert.equal(s.current.deadline,opened[n].current.deadline));
 await f.db.query("update public.sq_comp_attempts a set started_at=clock_timestamp()-make_interval(secs=>s.duration+1) from public.sq_comp_stages s where s.id=a.stage_id and a.competition_id=$1",[id]);
 const at=performance.now();owner=await request(teacher,'state',{id});phases.push({title:'Teacher settles 80 expired attempts',requests:1,totalMs:Math.round(performance.now()-at),errors:0});
 assert.ok(owner.members.every(m=>m.stages.length===2&&m.stages.every(s=>s.finished)));
 const own=await burst('40 timeout-result reads',uid=>request(uid,'state',{id}));assert.ok(own.every(s=>s.current.finished&&s.current.score>0&&s.current.score<=100&&s.current.finishReason==='time'));
 owner=await request(teacher,'control',{id,action:'force-finish'});assert.equal(owner.competition.status,'finished');assert.ok(owner.members.every(m=>m.stages.length===4));
 const final=await burst('40 final ranking reads',uid=>request(uid,'state',{id}));assert.ok(final.every(s=>s.competition.status==='finished'));
 await mkdir(out,{recursive:true});await writeFile(out+'/competition-free-load.json',JSON.stringify({passed:true,version:'7.29.0',clients:40,capacity:48,requests:rows.length,errors:rows.filter(r=>r.status!==200).length,phases,scope:'Local concurrent HTTP requests with fixture Auth; PGlite processes SQL through one queue. Network, physical phones and production Supabase capacity are not measured.'},null,2));console.log('PASS 40-client free-order/draft/timeout HTTP load; '+rows.length+' requests.');
}finally{await f.close()}
