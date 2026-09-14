import test from 'node:test';
import assert from 'node:assert/strict';
import {createDuels,decideDuel} from '../server/duels.js';
import {sampleKurashPose} from '../src/kurashPose.js';
const quiz={id:'quiz',group:'8-A',pin:'123456',questions:[{id:'q1',type:'test',text:'Word?',options:['Matn','A','B','C'],correct:0,time:10,points:100},{id:'q2',type:'shortcut',text:'Nusxa?',answer:'Ctrl+C',time:10,points:100}]};
function setup(){let clock=100000;const db={quizzes:[structuredClone(quiz)]},events=[];const d=createDuels({db,save(){},publish:(m,s)=>events.push(s),now:()=>clock});const m=d.create('owner',db.quizzes[0],'Kurash','654321');const a=d.join(m.id,'Ali','🤖'),b=d.join(m.id,'Vali','🐼');return {d,db,m,a,b,events,s1:d.session(a.token),s2:d.session(b.token),at:t=>{clock=t;d.tick()}}}
test('Duel: exactly two seats, shared start, private question, immutable snapshot, replay and server result',()=>{
 const {d,db,m,a,s1,s2,at,events}=setup();assert.equal(d.view(s1).question,null);assert.throws(()=>d.join(m.id,'Third','🤖'),{status:409});assert.equal(d.join(m.id,'Ali','🤖',a.token).state.playerId,a.state.playerId);
 assert.throws(()=>d.cancel('other',m.id),{status:404});assert.equal(d.list('other').length,0);
 d.ready(s1);assert.equal(d.get(m.id).phase,'waiting');d.ready(s2);assert.equal(d.view(s1).match.startsAt,103000);assert.throws(()=>d.answer(s1,'q1',0),{status:409});
 db.quizzes[0].questions[0].correct=3;at(103000);assert.equal(d.view(s1).question.id,d.view(s2).question.id);assert.equal(d.view(s1).question.correct,undefined);
 at(103800);d.answer(s1,'q1',0);assert.equal(d.view(s1).index,1);d.answer(s1,'q1',0);assert.equal(d.view(s1).index,1);
 assert.throws(()=>d.answer(s2,'q2','Ctrl+C'),{status:409});at(104000);d.answer(s1,'q2','Ctrl+C');assert.equal(d.view(s1).match.phase,'running');
 at(104100);d.answer(s2,'q1',0);at(104600);const end=d.answer(s2,'q2','Ctrl+C');assert.equal(end.match.phase,'finished');assert.equal(end.match.result.winnerSeat,0);assert.equal(end.match.result.reason,'speed');assert.deepEqual(end.match.result.elapsedMs,[1000,1600]);assert.equal(end.question,null);
 for(const e of events){assert.equal(e.questions,undefined);assert.equal(e.players[0]?.responses,undefined)}assert.equal(d.view(s1).match.result.animationAt,d.view(s2).match.result.animationAt);
});
test('Duel: accuracy before speed, 100ms draw boundary and no-correct draw',()=>{
 const p=(correct,elapsedMs,id)=>({correct,elapsedMs,id,done:true});
 assert.equal(decideDuel([p(2,9000,'a'),p(1,1000,'b')]).winnerSeat,0);
 assert.equal(decideDuel([p(1,1000,'a'),p(1,1100,'b')]).kind,'draw');
 assert.equal(decideDuel([p(1,1000,'a'),p(1,1101,'b')]).reason,'speed');
 assert.equal(decideDuel([p(0,1000,'a'),p(0,9000,'b')]).kind,'draw');
 assert.equal(decideDuel([p(1,1000,'a'),{...p(1,9000,'b'),done:false}]),null);
});
test('Duel: timeout advances both disconnected players, countdown departure resets, running departure cancels, restart preserves results',()=>{
 const f=setup();f.d.ready(f.s1);f.d.ready(f.s2);f.d.leave(f.a.token);assert.equal(f.d.get(f.m.id).phase,'waiting');assert.equal(f.d.get(f.m.id).players[0].ready,false);
 const c=f.d.join(f.m.id,'New','🤖');f.d.ready(f.s2);f.d.ready(f.d.session(c.token));f.at(123000);assert.equal(f.d.get(f.m.id).phase,'finished');assert.equal(f.d.get(f.m.id).result.kind,'draw');assert.equal(f.d.get(f.m.id).players[0].responses.length,2);
 createDuels({db:f.db,save(){},publish(){}});assert.equal(f.db.duels[0].phase,'finished');
 const g=setup();g.d.ready(g.s1);g.d.ready(g.s2);g.at(103000);g.d.leave(g.a.token);assert.equal(g.d.get(g.m.id).phase,'cancelled');assert.equal(g.d.get(g.m.id).result,undefined);
 const h=setup();createDuels({db:h.db,save(){},publish(){}});assert.equal(h.db.duels[0].phase,'cancelled');
});
test('3D choreography: deterministic shared timeline, stable limbs, mirrored winners and upright draw',()=>{
 const startsAt=10000,animationAt=20000;
 for(const winnerSeat of [0,1])for(let time=19000;time<=24000;time+=50){const state={phase:'finished',startsAt,result:{kind:'win',winnerSeat,animationAt}};const pose=sampleKurashPose(state,time);assert.deepEqual(pose,sampleKurashPose(state,time));
  pose.forEach(p=>{for(const j of Object.values(p.joints))assert.ok([j.x,j.y,j.z].every(Number.isFinite));for(const k of ['L','R']){assert.ok(Math.abs(p.joints['shoulder'+k].distanceTo(p.joints['elbow'+k])-.47)<1e-8);assert.ok(Math.abs(p.joints['elbow'+k].distanceTo(p.joints['hand'+k])-.47)<1e-8)}});
  if(time<animationAt)assert.equal(pose[1-winnerSeat].bodyRotation,0);if(time>=23000){assert.equal(Math.abs(pose[1-winnerSeat].bodyRotation),Math.PI/2);assert.equal(pose[winnerSeat].bodyRotation,0);assert.ok(Math.abs(Math.min(...Object.values(pose[1-winnerSeat].joints).map(j=>j.y))-.14)<1e-8);assert.equal(pose[1-winnerSeat].action,'landed');assert.equal(pose[winnerSeat].action,'victory')}
 }
 const grip=sampleKurashPose({phase:'running',startsAt,players:[{correct:1},{correct:1}]},14000);assert.ok(grip.every(p=>p.action==='grip'));assert.ok(grip[0].joints.handR.x>0&&grip[1].joints.handR.x<0);
 const draw=sampleKurashPose({phase:'finished',startsAt,result:{kind:'draw',animationAt}},23000);assert.ok(draw.every(p=>p.bodyRotation===0&&p.joints.head.y>2));assert.ok(draw[1].joints.hip.x-draw[0].joints.hip.x>2);
});
