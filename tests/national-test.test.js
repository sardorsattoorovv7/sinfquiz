import test from 'node:test';
import assert from 'node:assert/strict';
import {nationalTestBank,nationalSummary} from '../data/national-test-bank.js';
import {nationalGrade} from '../src/national-grading.js';

test('Archived demo bank: National preparation bank has exactly 10 sections and 30 questions each',()=>{
 assert.equal(nationalSummary.sections,10);
 assert.equal(nationalSummary.questions,300);
 assert.equal(nationalTestBank.filter(item=>item.subject==='Matematika').length,5);
 assert.equal(nationalTestBank.filter(item=>item.subject==='Ingliz tili').length,5);
 for(const section of nationalTestBank){
  assert.equal(section.questions.length,30);
  assert.equal(new Set(section.questions.map(item=>item.id)).size,30);
  section.questions.forEach(item=>{assert.equal(item.options.length,4);assert.ok(item.correct>=0&&item.correct<4)});
 }
});

test('National practice grading follows published 75-point level boundaries',()=>{
 const math={scoringModel:'general-certificate'},english={scoringModel:'general-certificate'};
 assert.equal(nationalGrade(math,29,30).level,'A+');
 assert.equal(nationalGrade(math,26,30).level,'A');
 assert.equal(nationalGrade(math,24,30).level,'B+');
 assert.equal(nationalGrade(math,22,30).level,'B');
 assert.equal(nationalGrade(math,20,30).level,'C+');
 assert.equal(nationalGrade(math,19,30).level,'C');
 assert.equal(nationalGrade(english,29,30).level,'A+');
 assert.equal(nationalGrade(english,26,30).level,'A');
 assert.equal(nationalGrade(english,19,30).level,'C');
});
