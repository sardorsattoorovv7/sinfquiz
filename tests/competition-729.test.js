import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {competition729Fixture,teacher,other,admin,students,config} from './competition-729-fixture.js';
import {office729Quizzes,office729Tasks} from '../data/office-729.js';
import {excelValue,copyFormula} from '../src/excel-formula.js';import {gradeOffice} from '../src/office-lab-model.js';
import {makeCompetition,validateCompetition} from '../src/competition-model.js';
const id='72990000-0000-0000-0000-000000000001';
const q=(n)=>({type:'test',text:'2 + 3 nechaga teng? '+n,options:['5','4','6'],correct:0,points:100});
const conf=()=>({...config(),orderMode:'free',stages:[{title:'Uch savolli quiz',kind:'quiz',sourceKind:'custom',duration:60,weight:1,custom:{questions:[q(1),q(2),q(3)]}},config().stages[1],{title:'Word amaliyoti',kind:'quiz',sourceKind:'template',sourceId:'quiz:word-12-7.29',duration:180,weight:1},{title:'Excel amaliyoti',kind:'quiz',sourceKind:'template',sourceId:'quiz:excel-10-7.29',duration:120,weight:1}]});
async function start(f,value=conf()){
 await f.call(teacher,'sq_comp_save',[id,value]);let s=await f.call(teacher,'sq_comp_control',[id,'publish',0]);
 const teams=[s.teams.find(t=>t.title==='Zukko'),s.teams.find(t=>t.title==='Bilimdon')];
 for(let n=0;n<2;n++)await f.call(students[n],'sq_comp_join',[teams[n].code,['Ali','Lola'][n]]);
 return f.call(teacher,'sq_comp_control',[id,'start',0]);
}
test('7.29: three original question packs have 12/12/10 questions and real Office tasks',()=>{
 assert.deepEqual(office729Quizzes.map(q=>q.questions.length),[12,12,10]);const ids=office729Quizzes.flatMap(q=>q.questions.map(x=>x.id));assert.equal(new Set(ids).size,34);
 for(const pack of office729Quizzes)for(const q of pack.questions){assert.ok(q.explanation?.length>20);if(q.type==='test')assert.ok(q.options[q.correct]);if(q.type==='office')assert.ok(office729Tasks[q.officeTemplate])}
 assert.equal(makeCompetition().orderMode,'free');assert.match(validateCompetition({...makeCompetition(),orderMode:'hacked'}),/tartib/);
});
test('7.29: Excel copies all four reference kinds and supports bounded logical expressions',()=>{
 assert.equal(copyFormula('=A2+$B$2+$C2+D$2','B2','B3'),'=A3+$B$2+$C3+D$2');
 assert.equal(copyFormula('=$A2*B$1','B2','C3'),'=$A3*C$1');assert.equal(copyFormula('=IF(A1=1,"A1",0)','B2','C3'),'=IF(B2=1,"A1",0)');
 assert.equal(excelValue({A1:'=IF(TRUE,7,1/0)'},'A1'),7);assert.equal(excelValue({A1:'=IF(FALSE,1/0,"Qayta")'},'A1'),'Qayta');
 assert.equal(excelValue({A1:'=ЕСЛИ(И(2>=2;3<4);1;0)'},'A1'),1);
 assert.equal(excelValue({A1:'=IF(OR(2<1,3>1),NOT(FALSE),FALSE)'},'A1'),true);
 assert.throws(()=>copyFormula('=A1','B2','A1'),/chiqadi/);assert.throws(()=>excelValue({A1:'=1/0'},'A1'));
 assert.throws(()=>excelValue({A1:'=fetch("x")'},'A1'));assert.throws(()=>excelValue({A1:'=A1'},'A1'));assert.throws(()=>excelValue({A1:'=1"'},'A1'));
});
test('7.29 real Postgres: free order, exact deadlines, drafts, partial scoring and private ownership',async t=>{
 const f=await competition729Fixture();try{
  let s=await start(f),stageIds=s.stages.map(x=>x.id),a=s.teams.find(t=>t.title==='Zukko'),b=s.teams.find(t=>t.title==='Bilimdon');
  await t.test('Primary start works with 2/6 seats, freezes team sizes, leaves an empty team unranked',()=>{assert.equal(s.competition.status,'running');assert.equal(a.startedSize,1);assert.equal(b.startedSize,1);assert.equal(s.teams.find(t=>t.title==='Kelmagan jamoa').rank,null);assert.equal(s.competition.currentStage,0)});
  await t.test('Learners independently choose different stages and durations',async()=>{
   s=await f.call(students[0],'sq_comp_select',[id,stageIds[3]]);assert.equal(s.current.position,4);assert.equal(s.current.duration,120);
   let x=await f.call(students[1],'sq_comp_select',[id,stageIds[0]]);assert.equal(x.current.position,1);assert.equal(x.current.duration,60);
   assert.ok(x.current.data.question&&!('correct' in x.current.data.question)&&!('explanation' in x.current.data.question));
  });
  await t.test('Reopening or reloading an attempt never resets its deadline',async()=>{
   const deadline=s.current.deadline;await f.call(students[0],'sq_comp_select',[id,stageIds[1]]);s=await f.call(students[0],'sq_comp_select',[id,stageIds[3]]);assert.equal(s.current.deadline,deadline);
   s=await f.call(students[0],'sq_comp_state',[id]);assert.equal(s.current.deadline,deadline);assert.equal(s.stages.filter(x=>x.startedAt).length,2);
  });
  await t.test('Saved unsubmitted quiz answer is counted once at timeout, unattempted questions stay zero',async()=>{
   let x=await f.call(students[1],'sq_comp_state',[id]);const action=crypto.randomUUID();const body={questionId:x.current.data.question.id,answer:0,score:999999};
   let draft=await f.call(students[1],'sq_comp_draft',[id,stageIds[0],action,body]);const again=await f.call(students[1],'sq_comp_draft',[id,stageIds[0],action,body]);assert.equal(draft.draftVersion,again.draftVersion);
   x=await f.call(students[1],'sq_comp_state',[id]);assert.equal(x.current.draft.answer,0);
   await f.db.query("update public.sq_comp_attempts set started_at=clock_timestamp()-interval '65 seconds' where stage_id=$1 and user_id=$2",[stageIds[0],students[1]]);
   x=await f.call(students[1],'sq_comp_poll',[id,x.revision]);assert.equal(x.current.finished,true);assert.equal(x.current.score,33.33);assert.equal(x.current.correct,1);assert.equal(x.current.finishReason,'time');assert.equal(x.current.elapsed,60);
   const before=x.current.score;x=await f.call(students[1],'sq_comp_answer',[id,stageIds[0],crypto.randomUUID(),body]);assert.equal(x.current.score,before);
  });
  await t.test('Typing partial draft grades fairly at timeout and manager polling settles it',async()=>{
   s=await f.call(students[0],'sq_comp_select',[id,stageIds[1]]);await f.call(students[0],'sq_comp_draft',[id,stageIds[1],crypto.randomUUID(),{text:'I go to school',elapsedMs:1,wpm:999999}]);
   await f.db.query("update public.sq_comp_attempts set started_at=clock_timestamp()-interval '125 seconds' where stage_id=$1 and user_id=$2",[stageIds[1],students[0]]);
   let owner=await f.call(teacher,'sq_comp_state',[id]);let result=owner.members.find(m=>m.userId===students[0]).stages.find(x=>x.stage===2);assert.ok(result.score>0&&result.score<100);assert.equal(result.elapsed,120);assert.equal(result.finishReason,'time');
   s=await f.call(students[0],'sq_comp_state',[id]);assert.equal(s.current.score,result.score);
  });
  await t.test('Other learner/teacher cannot save drafts, pick foreign stages, control or read private internals',async()=>{
   await assert.rejects(f.call(students[2],'sq_comp_select',[id,stageIds[0]]),/qatnashmayapsiz/);
   await assert.rejects(f.call(students[2],'sq_comp_draft',[id,stageIds[3],crypto.randomUUID(),{answer:0}]),/qatnashmayapsiz/);
   await assert.rejects(f.call(other,'sq_comp_control',[id,'force-finish',0]),/ruxsat/);
   await assert.rejects(f.call(students[0],'sq_comp_select',[id,crypto.randomUUID()]),/tegishli emas/);
   await f.login(students[0]);await assert.rejects(f.rpc('sq_comp_finalize',[id,stageIds[0],students[1],'time']),/permission/);await assert.rejects(f.db.query('select * from public.sq_comp_attempts'),/permission|policy/);await f.db.exec('reset role');
  });
  await t.test('Teacher can finish incomplete competition; unstarted stages receive 0, existing scores stay',async()=>{
   await assert.rejects(f.call(teacher,'sq_comp_control',[id,'finish',0]),/tugatilmagan/);s=await f.call(teacher,'sq_comp_control',[id,'force-finish',0]);assert.equal(s.competition.status,'finished');
   const lola=s.members.find(m=>m.userId===students[1]);assert.equal(lola.stages.length,4);assert.equal(lola.stages[0].score,33.33);assert.ok(lola.stages.slice(1).every(x=>x.score===0));
   const repeated=await f.call(teacher,'sq_comp_control',[id,'force-finish',0]);assert.deepEqual(repeated.teams,s.teams);
  });
  await t.test('Migration can be reapplied without losing results and preserves old guided competitions',async()=>{
   const before=(await f.db.query('select * from public.sq_comp_attempts order by user_id,stage_id')).rows;await f.db.exec(readFileSync(new URL('../supabase-migration-7.29.sql',import.meta.url),'utf8'));assert.deepEqual((await f.db.query('select * from public.sq_comp_attempts order by user_id,stage_id')).rows,before);
   const oldId=crypto.randomUUID();await f.call(teacher,'sq_comp_save',[oldId,{...config(),orderMode:'guided'}]);let old=await f.call(teacher,'sq_comp_control',[oldId,'publish',0]);for(let i=0;i<2;i++)await f.call(students[i],'sq_comp_join',[old.teams.filter(x=>x.title!=='Kelmagan jamoa')[i].code,'Bola '+i]);old=await f.call(teacher,'sq_comp_control',[oldId,'start',0]);assert.equal(old.competition.currentStage,1);old=await f.call(students[0],'sq_comp_state',[oldId]);assert.equal(old.current.position,1);await assert.rejects(f.call(students[0],'sq_comp_select',[oldId,old.stages[2].id]),/navbat/);
  });
 }finally{await f.db.close()}
});
test('7.29 JS and Postgres grade all seven new Office tasks equally, including incomplete work',async()=>{
 const f=await competition729Fixture();try{
  const answers={
   'word-format-729':{kind:'word',title:'Sinf yangiliklari',body:'Bugun yangi kitoblar keldi.',titleFormat:{bold:true,align:'center',size:18}},
   'word-table-729':{kind:'word',title:'Navbatchilik',body:'Bu hafta navbatchilar.',table:[['Kun','Ism'],['Dushanba','Ali']]},
   'word-image-729':{kind:'word',title:'Maktab bog‘i',body:'Bog‘imiz yashil.',imageInserted:true,wrap:'right'},
   'excel-absolute-729':{kind:'excel',cells:{C2:'=B2*$D$1',C3:'=B3*$D$1'}},
   'excel-mixed-729':{kind:'excel',cells:{B2:'=$A2*B$1',C2:'=$A2*C$1',B3:'=$A3*B$1',C3:'=$A3*C$1'}},
   'excel-if-729':{kind:'excel',cells:{C2:'=IF(B2>=$D$1,1,0)',C3:'=IF(B3>=$D$1,1,0)'}},
   'excel-logic-729':{kind:'excel',cells:{D2:'=IF(AND(B2>=60,C2>=60),1,0)',D3:'=IF(OR(B3>=60,C3>=60),1,0)'}},
  };
  for(const [key,task] of Object.entries(office729Tasks)){
   const submission=answers[key];if(task.kind==='excel')submission.cells={...task.initialCells,...submission.cells};const question={type:'office',officeTask:task};
   for(const data of [submission,{kind:task.kind,cells:task.initialCells||{},title:'Sarlavha',body:'Qisqa matn',table:[]}]){
    const answer=JSON.stringify(data),js=gradeOffice(question,answer),sql=(await f.db.query('select public.sq_comp_grade($1,$2) value',[question,JSON.stringify(answer)])).rows[0].value;
    assert.equal(sql.ratio,js.ratio,key);assert.deepEqual(sql.checks,js.checks,key);if(data===submission)assert.equal(js.ratio,1,key);
   }
  }
  for(const formula of ['=IF(TRUE,9,1/0)','=IF(FALSE,1/0,"Qayta")','=IF(AND(2>=2,3<4),1,0)','=ЕСЛИ(И(2>=2;3<4);1;0)','=NOT(FALSE)','=SUM($B$2:$B$4)']){
   const cells={B2:'2',B3:'3',B4:'4',A1:formula};const sql=(await f.db.query('select public.sq_comp_excel_value($1,$2) value',[cells,'A1'])).rows[0].value;assert.equal(sql,excelValue(cells,'A1'),formula);
  }
  for(const formula of ['=1/0','=1;DROP TABLE public.documents','=fetch("x")','=A1','=1"'])await assert.rejects(f.db.query('select public.sq_comp_excel_value($1,$2)',[{A1:formula},'A1']),formula);
  for(const [key,cells] of [
   ['excel-absolute-729',{C2:'=IF(TRUE,6000,"B2*$D$1")',C3:'=IF(TRUE,10000,"B3*$D$1")'}],
   ['excel-logic-729',{D2:'=AND(B2>=60,C2>=60)',D3:'=OR(B3>=60,C3>=60)'}],
  ]){
   const task=office729Tasks[key],question={type:'office',officeTask:task},answer=JSON.stringify({kind:'excel',cells:{...task.initialCells,...cells}});
   assert.equal(gradeOffice(question,answer).ratio,0);assert.equal((await f.db.query('select public.sq_comp_grade($1,$2) value',[question,JSON.stringify(answer)])).rows[0].value.ratio,0);
  }
 }finally{await f.db.close()}
});
test('7.29 Office drafts receive partial points at timeout, even after switching stages; late data cannot change them',async()=>{
 const f=await competition729Fixture();try{
  const office=(key,n)=>({id:'partial-'+n,type:'office',text:office729Tasks[key].prompt,officeTask:office729Tasks[key],points:100});
  const value=conf();value.stages[0]={title:'Word qisman ish',kind:'quiz',sourceKind:'custom',duration:60,weight:1,custom:{questions:[office('word-format-729',1),office('word-table-729',2),office('word-image-729',3)]}};
  value.stages[3]={title:'Excel qisman ish',kind:'quiz',sourceKind:'custom',duration:60,weight:1,custom:{questions:[office('excel-absolute-729',4)]}};
  const initial=await start(f,value),ids=initial.stages.map(x=>x.id);
  let word=await f.call(students[0],'sq_comp_select',[id,ids[0]]),excel=await f.call(students[1],'sq_comp_select',[id,ids[3]]);
  const wordAnswer=JSON.stringify({kind:'word',title:'Sinf yangiliklari',body:'Bugun yangi kitoblar keldi.',titleFormat:{bold:true,align:'center',size:14}});
  const excelAnswer=JSON.stringify({kind:'excel',cells:{...office729Tasks['excel-absolute-729'].initialCells,C2:'=B2*$D$1'}});
  await f.call(students[0],'sq_comp_draft',[id,ids[0],crypto.randomUUID(),{questionId:word.current.data.question.id,answer:wordAnswer}]);
  await f.call(students[1],'sq_comp_draft',[id,ids[3],crypto.randomUUID(),{questionId:excel.current.data.question.id,answer:excelAnswer}]);
  await f.call(students[0],'sq_comp_select',[id,ids[1]]);
  await f.db.query("update public.sq_comp_attempts set started_at=clock_timestamp()-interval '65 seconds' where stage_id=any($1::uuid[])",[[ids[0],ids[3]]]);
  const late=await f.call(students[1],'sq_comp_draft',[id,ids[3],crypto.randomUUID(),{questionId:excel.current.data.question.id,answer:JSON.stringify({kind:'excel',cells:{...office729Tasks['excel-absolute-729'].initialCells,C2:'=B2*$D$1',C3:'=B3*$D$1'}})}]);assert.equal(late.closed,true);
  const owner=await f.call(teacher,'sq_comp_state',[id]);
  const w=owner.members.find(m=>m.userId===students[0]).stages.find(x=>x.stage===1),e=owner.members.find(m=>m.userId===students[1]).stages.find(x=>x.stage===4);
  assert.equal(w.score,25);assert.equal(e.score,50);assert.equal(w.elapsed,60);assert.equal(e.elapsed,60);assert.equal(w.finishReason,'time');assert.equal(e.finishReason,'time');
  word=await f.call(students[0],'sq_comp_state',[id]);assert.equal(word.current.position,2);assert.equal(word.history.find(x=>x.stage===1).score,25);
  const before=e.score;excel=await f.call(students[1],'sq_comp_answer',[id,ids[3],crypto.randomUUID(),{questionId:excel.current.data.question.id,answer:excelAnswer,score:100,elapsedMs:1}]);assert.equal(excel.current.score,before);
  await assert.rejects(f.call(students[0],'sq_comp_draft',[id,ids[1],crypto.randomUUID(),{text:'a'.repeat(23000)}]),/formati/);
  await assert.rejects(f.call(students[0],'sq_comp_draft',[id,ids[1],crypto.randomUUID(),[]]),/formati/);
 }finally{await f.db.close()}
});
