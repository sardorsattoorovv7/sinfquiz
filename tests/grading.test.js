import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gradeAnswer} from '../src/grading.js';
const packs=JSON.parse(readFileSync(new URL('../data/question-bank.json',import.meta.url)));
test('Keyboard and mouse lesson contains 15 valid multiple-choice questions',()=>{
 const pack=packs.find(item=>item.id==='keyboard-mouse-lab');
 assert.ok(pack);
 assert.equal(pack.questions.length,15);
 assert.equal(new Set(pack.questions.map(question=>question.id)).size,15);
 for(const question of pack.questions){assert.equal(question.type,'test');assert.equal(question.options.length,4);assert.ok(Number.isInteger(question.correct)&&question.correct>=0&&question.correct<4);assert.ok(question.options[question.correct])}
});
test('All supplied non-test sample answers receive full credit',()=>{
 for(const q of packs.flatMap(p=>p.questions).filter(q=>q.type!=='test')) assert.equal(gradeAnswer(q,q.answer,q.time).earned,q.points,q.id);
});
test('Shortcut modifiers are order/case independent; extra modifiers are incorrect',()=>{
 const q={type:'shortcut',answer:'Ctrl+S',time:30,points:100};
 assert.equal(gradeAnswer(q,' s + CONTROL ',30).correct,true);
 assert.equal(gradeAnswer(q,'Ctrl+Shift+S',30).earned,0);
 assert.equal(gradeAnswer(q,'Ctrl',30).earned,0);
});
test('Prompt partial credit and apostrophe variants',()=>{
 const q=packs[4].questions[3];
 assert.equal(gradeAnswer(q,'Word uchun 5 ta test',q.time).earned,80);
 assert.equal(gradeAnswer(q,q.answer.replaceAll('‘',"'").replaceAll('’',"'"),q.time).earned,200);
 assert.equal(gradeAnswer(q,'',q.time).earned,0);
});
test('Excel spacing and alternate formulas are accepted without accepting an incorrect formula',()=>{
 const q=packs[1].questions[4];
 assert.equal(gradeAnswer(q,' = b1 * a1 ',q.time).correct,true);
 assert.equal(gradeAnswer(q,'=A1+B1',q.time).correct,false);
});
test('Time bonus cannot exceed question points',()=>{
 const q=packs[0].questions[0];
 assert.equal(gradeAnswer(q,0,10000).earned,100);
 assert.equal(gradeAnswer(q,0,0).earned,85);
 assert.equal(gradeAnswer(q,1,30).earned,0);
});
