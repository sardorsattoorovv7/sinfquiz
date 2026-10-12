import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {competition729Fixture,teacher,other,students} from './competition-729-fixture.js';
import {office729Tasks,office729Quizzes} from '../data/office-729.js';

const patch=readFileSync(new URL('../supabase-office-amaliy-fix.sql',import.meta.url),'utf8');
const questions=office729Quizzes.flatMap(x=>x.questions).filter(x=>x.type==='office');
const answers={
 'word-format-729':{kind:'word',title:'Sinf yangiliklari',body:'Bugun yangi kitoblar keldi.',titleFormat:{bold:true,align:'center',size:18}},
 'word-table-729':{kind:'word',title:'Navbatchilik',body:'Bu hafta navbatchilar.',table:[['Kun','Ism'],['Dushanba','Ali']]},
 'word-image-729':{kind:'word',title:'Maktab bog‘i',body:'Bog‘imiz yashil.',imageInserted:true,wrap:'right'},
 'excel-absolute-729':{kind:'excel',cells:{C2:'=B2*$D$1',C3:'=B3*$D$1'}},
 'excel-mixed-729':{kind:'excel',cells:{B2:'=$A2*B$1',C2:'=$A2*C$1',B3:'=$A3*B$1',C3:'=$A3*C$1'}},
 'excel-if-729':{kind:'excel',cells:{C2:'=IF(B2>=$D$1,1,0)',C3:'=IF(B3>=$D$1,1,0)'}},
 'excel-logic-729':{kind:'excel',cells:{D2:'=IF(AND(B2>=60,C2>=60),1,0)',D3:'=IF(OR(B3>=60,C3>=60),1,0)'}},
};
const answer=key=>JSON.stringify({...answers[key],...(answers[key].kind==='excel'?{cells:{...office729Tasks[key].initialCells,...answers[key].cells}}:{})});
const makeQuiz=(id,pin,q,owner=teacher)=>({id,pin,title:'Office tekshiruv',group:'8-A',ownerId:owner,status:'active',visibility:'private',questions:[q]});

test('Office quiz fix: real PostgreSQL display, grading, existing sessions and tenant isolation',async t=>{
 const f=await competition729Fixture();try{
  const q=questions.find(x=>x.id==='xls729-8'),before=makeQuiz('office-before','982001',q);
  await f.call(teacher,'sq_quiz_save',[before.id,before]);
  let s=await f.call(students[0],'sq_quiz_join',[before.id,before.pin,'Ali','🦊']);
  assert.equal(s.question.officeTask,undefined);
  s=await f.call(students[0],'sq_quiz_action',[s.player.id,'answer',{questionId:q.id,value:answer(q.officeTemplate)}]);
  assert.equal(s.feedback.ratio,0);const oldResult=structuredClone(s.player);
  const active=await f.call(students[1],'sq_quiz_join',[before.id,before.pin,'Lola','🐼']);
  const deadline=active.deadline;
  const foreign=makeQuiz('other-office','982002',{...q,text:'Boshqa ustozning o‘z savoli'},other);
  await f.call(other,'sq_quiz_save',[foreign.id,foreign]);
  await f.db.exec(patch);

  await t.test('Repairs active sessions and strips rubric from student response; keeps deadline and submitted score',async()=>{
   s=await f.call(students[1],'sq_quiz_action',[active.player.id,'session',{}]);
   assert.equal(s.deadline,deadline);assert.equal(s.question.officeTask.kind,'excel');
   assert.deepEqual(s.question.officeTask.initialCells,office729Tasks[q.officeTemplate].initialCells);
   assert.equal(s.question.officeTask.rubric,undefined);assert.equal(s.question.officeRubric,undefined);
   s=await f.call(students[1],'sq_quiz_action',[active.player.id,'answer',{questionId:q.id,value:answer(q.officeTemplate)}]);
   assert.equal(s.feedback.ratio,1);assert.equal(s.feedback.checks.length,4);
   const submitted=await f.call(students[0],'sq_quiz_action',[oldResult.id,'session',{}]);
   assert.deepEqual(submitted.player,oldResult);
  });

  for(const [i,q] of questions.entries())await t.test(q.officeTemplate+' opens and receives full server credit through normal six-digit quiz',async()=>{
   const quiz=makeQuiz('office-new-'+i,String(983000+i),q);
   if(i%2){await f.call(teacher,'sq_documents_batch',[[{op:'set',collection:'quizzes',id:quiz.id,data:quiz}]]);}else await f.call(teacher,'sq_quiz_save',[quiz.id,quiz]);
   let state=await f.call(students[2],'sq_quiz_join',[quiz.id,quiz.pin,'Aziza','🦊']);
   assert.equal(state.question.officeTask.kind,office729Tasks[q.officeTemplate].kind);
   assert.equal(state.question.officeTask.rubric,undefined);
   state=await f.call(students[2],'sq_quiz_action',[state.player.id,'answer',{questionId:q.id,value:answer(q.officeTemplate),score:99999}]);
   assert.equal(state.feedback.ratio,1);assert.ok(state.feedback.checks.every(x=>x.passed));assert.ok(state.player.score>0&&state.player.score<=100);
  });

  await t.test('Partial Excel work remains partial and an expired answer receives zero',async()=>{
   const quiz=makeQuiz('office-partial','984001',q);await f.call(teacher,'sq_quiz_save',[quiz.id,quiz]);
   let state=await f.call(students[3],'sq_quiz_join',[quiz.id,quiz.pin,'Vali','🦊']);
   state=await f.call(students[3],'sq_quiz_action',[state.player.id,'answer',{questionId:q.id,value:JSON.stringify({kind:'excel',cells:{...office729Tasks[q.officeTemplate].initialCells,B2:'=$A2*B$1'}})}]);
   assert.equal(state.feedback.ratio,.25);
   state=await f.call(students[4],'sq_quiz_join',[quiz.id,quiz.pin,'Anvar','🦊']);
   await f.db.query('update public.sq_quiz_sessions set deadline=0 where id=$1',[state.player.id]);
   state=await f.call(students[4],'sq_quiz_action',[state.player.id,'answer',{questionId:q.id,value:answer(q.officeTemplate)}]);
   assert.equal(state.feedback.ratio,0);assert.equal(state.player.score,0);
  });

  await t.test('Re-selecting a template replaces the old attachment, while explicit teacher tasks survive',async()=>{
   const old=(await f.db.query("select data from public.documents where collection='quizzes' and id=$1",[before.id])).rows[0].data;
   old.questions[0].officeTemplate='excel-if-729';
   const saved=await f.call(teacher,'sq_quiz_save',[old.id,old]);
   assert.equal(saved.questions[0].officeTask.title,office729Tasks['excel-if-729'].title);
   const stored=(await f.db.query("select data from public.documents where collection='quizzes' and id=$1",[old.id])).rows[0].data;
   assert.equal(stored.questions[0].officeTask.title,office729Tasks['excel-if-729'].title);
   const custom=makeQuiz('office-custom','984002',{id:'custom',type:'office',text:'Ustozning o‘z mashqi',officeTemplate:'excel-mixed-729',officeTask:{title:'Shaxsiy mashq',kind:'excel',prompt:'A2 ga 9 yozing.',initialCells:{A1:'Son'},rubric:[{kind:'excelCell',cell:'A2',value:'9',label:'A2 to‘g‘ri'}]},points:100,time:240});
   await f.call(teacher,'sq_quiz_save',[custom.id,custom]);
   let state=await f.call(students[5],'sq_quiz_join',[custom.id,custom.pin,'Komil','🦊']);
   assert.equal(state.question.officeTask.title,'Shaxsiy mashq');
   state=await f.call(students[5],'sq_quiz_action',[state.player.id,'answer',{questionId:'custom',value:JSON.stringify({kind:'excel',cells:{A2:'9'}})}]);
   assert.equal(state.feedback.ratio,1);
  });

  await t.test('RLS and helper permissions protect keys, students and other teachers cannot write foreign quizzes',async()=>{
   await f.login(students[6]);assert.equal((await f.db.query("select * from public.documents where collection='quizzes'")).rows.length,0);await f.db.exec('reset role');
   await assert.rejects(f.call(students[6],'sq_office_attach_question',[q]),/permission denied/);
   await assert.rejects(f.call(students[6],'sq_documents_batch',[[{op:'set',collection:'quizzes',id:'forged',data:before}]]),/row-level security/);
   await assert.rejects(f.call(other,'sq_documents_batch',[[{op:'set',collection:'quizzes',id:before.id,data:before}]]),/row-level security/);
   const preserved=(await f.db.query("select data from public.documents where collection='quizzes' and id=$1",[foreign.id])).rows[0].data;
   assert.equal(preserved.ownerId,other);assert.equal(preserved.questions[0].text,foreign.questions[0].text);
   await assert.rejects(f.call(teacher,'sq_quiz_save',['missing-task',makeQuiz('missing-task','984003',{id:'missing',type:'office',officeTemplate:'not-a-template',text:'Noto‘g‘ri',time:240,points:100})]),/Amaliy mashqni tanlang/);
  });

  await t.test('Patch runs twice without changing sessions, results, ownership or question order',async()=>{
   const docs=(await f.db.query("select * from public.documents where collection in ('quizzes','players') order by collection,id")).rows;
   const sessions=(await f.db.query('select * from public.sq_quiz_sessions order by id')).rows;
   await f.db.exec(patch);
   assert.deepEqual((await f.db.query("select * from public.documents where collection in ('quizzes','players') order by collection,id")).rows,docs);
   assert.deepEqual((await f.db.query('select * from public.sq_quiz_sessions order by id')).rows,sessions);
  });
 }finally{await f.db.close()}
});
