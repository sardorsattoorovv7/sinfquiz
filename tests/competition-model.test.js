import test from 'node:test';
import assert from 'node:assert/strict';
import {competitionCsv,editCompetition,makeCompetition,stageFromSource,typingMatch,validateCompetition} from '../src/competition-model.js';
import {excelBasicsQuiz,excelBeginnerTemplateIds} from '../data/excel-basics.js';
import {excelValue,gradeOffice,officeTemplates} from '../src/office-lab-model.js';
const valid=()=>({...makeCompetition(),title:'Sinf jamoalar bahsi',stages:Array.from({length:4},(_,i)=>stageFromSource({kind:'maze',title:'Inglizcha yo‘l '+i,sourceKind:'template',sourceId:'maze:maze-01'}))});
test('Competition drafts enforce at least four stages, fixed capacity and unambiguous names',()=>{
 const value=valid();assert.equal(validateCompetition(value),'');
 assert.match(validateCompetition({...value,stages:value.stages.slice(1)}),/4–24/);
 assert.match(validateCompetition({...value,teams:[value.teams[0],value.teams[0]]}),/takror/);
 assert.match(validateCompetition({...value,teamSize:2,teams:[{title:'Sinf A',roster:['Ali']},value.teams[1]]}),/2 ta ism/);
 assert.match(validateCompetition({...value,stages:[...value.stages,{...value.stages[0],duration:2}]}),/30–3600/);
 assert.equal(stageFromSource({kind:'typing',title:'Uzun matn',sourceKind:'template',sourceId:'text1'}).duration,120);
 const edited=editCompetition({competition:{...value,teamSize:2},teams:value.teams,stages:[{kind:'quiz',title:'Oldingi test',duration:90,weight:2,custom:{questions:[{text:'Nusxa savol'}]}}]});
 assert.equal(edited.stages[0].sourceKind,'custom');assert.equal(edited.stages[0].custom.questions[0].text,'Nusxa savol');
});
test('CSV retains all stage scores and prevents spreadsheet formula injection',()=>{
 const csv=competitionCsv({competition:{id:'abc'},stages:[{position:1,title:'=HYPERLINK("x")'}],teams:[{rank:1,title:' =SUM(1,2)',score:150,correct:4,elapsed:9,stages:[{position:1,score:75}]}]});
 assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/"' =SUM\(1,2\)"/);assert.match(csv,/"75"/);assert.match(csv,/HYPERLINK\(""x""\)/);
 assert.deepEqual(typingMatch('A😀B','A😀C'),{correct:2,total:3,typed:3});
});
test('Beginner Excel pack has 20 theory questions, six short answers and six usable practical tasks',()=>{
 assert.equal(excelBasicsQuiz.questions.length,32);
 for(const q of excelBasicsQuiz.questions){assert.ok(q.text.trim().length>10);assert.ok(q.explanation);if(q.type==='test')assert.ok(q.options[q.correct]);if(q.type==='office')assert.ok(officeTemplates[q.officeTemplate])}
 assert.equal(excelBasicsQuiz.questions.filter(q=>q.type==='test').length,20);assert.equal(excelBasicsQuiz.questions.filter(q=>q.type==='practical').length,6);
 const solutions={
  'excel-cells-first':{A2:'Matematika',B2:'12'},
  'excel-add-subtract':{D2:'=B2+C2',D3:'=B3-C3'},
  'excel-multiply-divide':{D2:'=B2*C2',D3:'=B3/C3'},
  'excel-sum-first':{B5:'=SUM(B2:B4)'},
  'excel-average-first':{B5:'=AVERAGE(B2:B4)'},
  'excel-order-first':{D2:'=(B2+C2)*4'},
 };
 for(const id of excelBeginnerTemplateIds){
  const t=officeTemplates[id],question={type:'office',officeTemplate:id},empty=JSON.stringify({kind:'excel',cells:{...t.initialCells}}),answer=JSON.stringify({kind:'excel',cells:{...t.initialCells,...solutions[id]}});
  assert.equal(gradeOffice(question,empty).ratio,0,id+' empty task earns zero');
  assert.equal(gradeOffice(question,answer).ratio,1,id+' correct practical task');
 }
 assert.equal(excelValue({B2:'4',B3:'',B4:'0',B5:'=AVERAGE(B2:B4)'},'B5'),2);
 assert.equal(excelValue({B2:'4',B3:'nom',B4:'6',B5:'=AVERAGE(B2:B4)'},'B5'),5);
 assert.throws(()=>excelValue({B2:'',B3:'matn',B5:'=AVERAGE(B2:B3)'},'B5'));
});
