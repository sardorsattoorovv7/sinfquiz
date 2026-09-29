import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gradeAnswer} from '../src/grading.js';
import {excelValue} from '../src/office-lab-model.js';
import {readPythonDraft,savePythonDraft,PYTHON_DRAFT_TTL} from '../src/python-drafts.js';
const bank=JSON.parse(readFileSync(new URL('../data/question-bank.json',import.meta.url)));
const question=(pack,template)=>bank.find(item=>item.id===pack).questions.find(item=>item.officeTemplate===template);

test('Office classroom packs cover theory and graded hands-on tasks',()=>{
 for(const id of ['word-lab','excel-lab','ppt-lab']){
  const questions=bank.find(item=>item.id===id).questions;
  assert.ok(questions.length>=11);
  assert.ok(questions.filter(item=>item.type==='test').length>=6);
  assert.ok(questions.some(item=>item.type==='office'));
  assert.equal(new Set(questions.map(item=>item.id)).size,questions.length);
 }
 const word=question('word-lab','word-report');
 const value={kind:'word',title:'Maktab kutubxonasi',body:'Bu yerda yangi kitoblar bor.',table:[['Kitob','Soni'],['Algebra','4']],imageInserted:true,wrap:'right',reference:{}};
 assert.equal(gradeAnswer(word,JSON.stringify(value),word.time).earned,word.points);
 value.wrap='inline';assert.ok(gradeAnswer(word,JSON.stringify(value),word.time).earned<word.points);
 assert.equal(gradeAnswer(word,'<script>alert(1)</script>',word.time).earned,0);
 const ppt=question('ppt-lab','ppt-presentation');
 assert.equal(gradeAnswer(ppt,JSON.stringify({kind:'ppt',slides:[{title:'Kutubxona',body:'O‘qish uchun joy',imageInserted:true},{title:'Kitoblar',body:'Yangi kitoblar',notes:'Maktabga murojaat qiling'}]}),ppt.time).earned,ppt.points);
});

test('Excel formulas use cell references, SUM and AVERAGE without evaluating JavaScript',()=>{
 const shop=question('excel-lab','excel-shop');
 const cells={B2:'3',C2:'8000',B3:'4',C3:'2000',D2:'=B2*C2',D3:'=B3*C3',D4:'=SUM(D2:D3)'};
 assert.equal(excelValue(cells,'D4'),32000);
 assert.equal(gradeAnswer(shop,JSON.stringify({kind:'excel',cells}),shop.time).earned,shop.points);
 cells.D4='=32000';assert.ok(gradeAnswer(shop,JSON.stringify({kind:'excel',cells}),shop.time).earned<shop.points);
 cells.D4='=SUM(D2:D4)';assert.throws(()=>excelValue(cells,'D4'),/Aylanma/);
 cells.D4='=globalThis.alert(1)';assert.throws(()=>excelValue(cells,'D4'),/Formula/);
 const average=question('excel-lab','excel-average');
 assert.equal(gradeAnswer(average,JSON.stringify({kind:'excel',cells:{B2:'70',B3:'80',B4:'90',B5:'=AVERAGE(B2:B4)',C2:'=B2+5'}}),average.time).earned,average.points);
});

test('Python output assessment and 52-hour local draft expiry',()=>{
 const py=bank.find(item=>item.id==='python-basics').questions.find(item=>item.type==='python');
 assert.equal(gradeAnswer(py,JSON.stringify({code:'print(12)',output:'12\n'}),py.time).earned,py.points);
 assert.equal(gradeAnswer(py,JSON.stringify({code:'print(11)',output:'11\n'}),py.time).earned,0);
 const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 const start=1_000_000;
 assert.equal(savePythonDraft('student','lesson',{code:'print(1)',input:'',output:'1'},storage,start),true);
 assert.equal(readPythonDraft('student','lesson',storage,start+PYTHON_DRAFT_TTL-1).code,'print(1)');
 assert.equal(readPythonDraft('other','lesson',storage,start+1),null);
 assert.equal(readPythonDraft('student','lesson',storage,start+PYTHON_DRAFT_TTL),null);
});

test('Python executes in a sandboxed opaque-origin iframe with worker timeout',()=>{
 const runner=readFileSync(new URL('../src/python-runner.js',import.meta.url),'utf8');
 const sandbox=readFileSync(new URL('../public/python-sandbox.js',import.meta.url),'utf8');
 const headers=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url)));
 assert.match(runner,/setAttribute\('sandbox','allow-scripts'\)/);
 assert.doesNotMatch(runner,/allow-same-origin/);
 assert.match(sandbox,/6000\)/);
 assert.match(sandbox,/\.terminate\(\)/);
 assert.match(sandbox,/ast\.walk/);
 assert.match(headers.headers.at(-1).headers.at(-1).value,/frame-ancestors 'self'/);
});
