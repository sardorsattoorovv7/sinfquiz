import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {newAttempt,validAttempt,updateAttempt,finishAttempt,attemptReview,correctAnswer} from '../src/open-exam-engine.js';
test('Source exercises: unique questions, full passages, valid answers and 30-question mixed papers',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {openExams,openQuestions,openGroups}=await vite.ssrLoadModule('/data/open-exams.js');
  assert.equal(openQuestions.length,75);assert.equal(new Set(openQuestions.map(q=>q.id)).size,75);
  assert.equal(openExams.find(x=>x.id==='english-mixed').questions.length,30);
  assert.equal(openExams.find(x=>x.id==='math-mixed').questions.length,30);
  assert.equal(openExams.find(x=>x.id==='unit-python').questions.length,15);
  for(const q of openQuestions){
   assert.ok(q.explanation&&q.sourceReference);assert.ok(openGroups.some(g=>g.id===q.group));
   assert.ok(correctAnswer(q,Array.isArray(q.answer)?q.answer[0]:q.answer));
   if(q.type==='choice'){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.equal(q.options.filter(o=>correctAnswer(q,o)).length,1)}
   const v=q.verification;
   if(v?.kind==='system'){assert.ok(Math.abs(v.a*v.x+v.b*v.y-v.c)<1e-9);assert.ok(Math.abs(v.d*v.x+v.e*v.y-v.f)<1e-9)}
   if(v?.kind==='quadratic'){const x=Number(q.answer[0]),[a,b,c]=v.coefficients;assert.equal(a*x*x+b*x+c,0)}
  }
  for(const g of openGroups.filter(g=>g.subject==='english'))assert.ok(g.text.length>200);
  const exam=openExams[0],fresh=newAttempt(exam,1000);
  assert.ok(validAttempt(fresh,exam));assert.equal(validAttempt({...fresh,answers:[]},exam),false);
  const answered=updateAttempt(fresh,{type:'answer',id:exam.questions[0].id,value:exam.questions[0].answer},2000);
  assert.deepEqual(attemptReview(answered,exam),[]);
  const finished=finishAttempt(answered,3000);
  assert.equal(attemptReview(finished,exam).filter(x=>x.correct).length,1);
  assert.strictEqual(updateAttempt(finished,{type:'navigate',index:1},4000),finished);
  const expired=updateAttempt(fresh,{type:'answer',id:exam.questions[0].id,value:'too late'},fresh.endsAt);
  assert.equal(expired.finished,true);assert.deepEqual(expired.answers,{});
  assert.equal(correctAnswer({numeric:true,answer:['5.5']},'11/2'),true);
  assert.equal(correctAnswer({numeric:true,answer:['5.5']},'5,5'),true);
  assert.equal(correctAnswer({numeric:true,answer:['5.5']},'5.5extra'),false);
  assert.equal(correctAnswer({numeric:true,answer:['5.5']},'1/0'),false);
 }finally{await vite.close()}
});
test('Python question outputs agree with the actual Python interpreter',()=>{
 const rows=JSON.parse(readFileSync(new URL('../data/python-basics.json',import.meta.url),'utf8'));
 for(const q of rows.filter(q=>q.code)){
  const result=spawnSync('python3',['-I','-c',q.code],{encoding:'utf8',timeout:3000});
  assert.equal(result.status,0,q.id+result.stderr);
  assert.equal(result.stdout.trim(),q.answer,q.id);
 }
});
