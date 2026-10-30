import test from 'node:test';
import assert from 'node:assert/strict';
import {history,components,questions,assemblyTasks,bootSteps} from '../src/informatics/content.js';
import {validateProgress,readProgress,progressKey,learningProgress,byteValue,byteLabel,memoryAction,scoreQuiz,emptyProgress} from '../src/informatics/model.js';
import {restoredStudioView,studioViewHash} from '../src/studio-navigation.js';

test('informatics memory lab: unsaved RAM is lost on power cut, disk survives, saved data can be reopened',()=>{
 let s={power:true,ram:'Birinchi matn',disk:'Oldingi fayl'};
 s=memoryAction(s,{type:'edit',value:'Saqlanmagan matn'});
 s=memoryAction(s,{type:'power'});
 assert.deepEqual(s,{power:false,ram:'',disk:'Oldingi fayl'});
 assert.equal(memoryAction(s,{type:'save'}),s);
 assert.equal(memoryAction(s,{type:'edit',value:'Yashirin o‘zgarish'}),s);
 s=memoryAction(s,{type:'power'});s=memoryAction(s,{type:'load'});
 assert.equal(s.ram,'Oldingi fayl');
 s=memoryAction(s,{type:'edit',value:'Yangi saqlangan fayl'});s=memoryAction(s,{type:'save'});
 s=memoryAction(s,{type:'power'});s=memoryAction(s,{type:'power'});s=memoryAction(s,{type:'load'});
 assert.equal(s.ram,'Yangi saqlangan fayl');assert.equal(s.disk,s.ram);
});
test('informatics byte lab: bit weights and ASCII work for every unsigned byte',()=>{
 for(let n=0;n<256;n++){const bits=n.toString(2).padStart(8,'0').split('').map(Number);assert.equal(byteValue(bits),n);if(n>=32&&n<=126)assert.equal(byteLabel(n),String.fromCharCode(n));}
 assert.equal(byteValue([0,1,0,0,0,0,0,1]),65);assert.equal(byteLabel(65),'A');assert.equal(byteValue([1,1,1,1,1,1,1,1]),255);
 assert.equal(byteValue(null),0);assert.match(byteLabel(0),/Bosilmaydigan/);
});
test('informatics drafts: corrupt storage, unknown IDs, duplicates and invalid answers do not inflate progress',()=>{
 const p=validateProgress({eras:['abacus','abacus','unknown'],parts:['ram','ram','__proto__'],assembly:['cpu','cpu','invented'],answers:{ram:9,rom:-1,first:1,baby:'2',unknown:0}});
 assert.deepEqual(p.eras,['abacus']);assert.deepEqual(p.parts,['ram']);assert.deepEqual(p.assembly,['cpu']);assert.deepEqual(p.answers,{first:1});assert.equal(learningProgress(p).done,4);
 assert.deepEqual(readProgress('broken',{getItem(){return '{not json';}}),emptyProgress());
 assert.deepEqual(readProgress('blocked',{getItem(){throw Error('SecurityError');}}),emptyProgress());
 assert.notEqual(progressKey('one'),progressKey('two'));assert.notEqual(progressKey(),progressKey('student'));
});
test('informatics assessment gives credit only for correct answers and full learning remains reachable',()=>{
 const answers=Object.fromEntries(questions.map(q=>[q.id,q.answer]));assert.equal(scoreQuiz(answers),questions.length);assert.equal(scoreQuiz({}),0);
 const p={eras:history.map(x=>x.id),parts:components.map(x=>x.id),assembly:assemblyTasks.map(x=>x.id),answers};
 assert.equal(learningProgress(p).percent,100);assert.equal(learningProgress(emptyProgress()).percent,0);
 answers.first=0;assert.equal(scoreQuiz(answers),questions.length-1);
});
test('informatics public deep link restores for guests and all roles without granting access to private modules',()=>{
 assert.equal(studioViewHash('informaticsAtlas'),'informatika-atlasi');
 for(const user of [null,{role:'student'},{role:'teacher'},{role:'admin'}])assert.equal(restoredStudioView('#informatika-atlasi',user),'informaticsAtlas');
 assert.equal(restoredStudioView('#informatika',null),null);assert.equal(restoredStudioView('#profil',null),null);
});
test('informatics curriculum links boot stages and assembly slots to real atlas components',()=>{
 const ids=new Set(components.map(c=>c.id));assert.equal(ids.size,components.length);
 for(const s of bootSteps)assert.ok(ids.has(s.part),s.id);
 for(const task of assemblyTasks)assert.ok(ids.has(task.id),task.id);
 for(const q of questions)assert.ok(q.answer>=0&&q.answer<q.options.length,q.id);
 for(const h of history)assert.equal(new URL(h.source).protocol,'https:');
});
