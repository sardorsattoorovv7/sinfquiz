import test from 'node:test';
import assert from 'node:assert/strict';
import {alignAssessmentEvidence} from '../server/speaking/evidence.js';
import {validateAssessment} from '../server/speaking/domain.js';
import {answerFixture,assessmentFixture} from './speaking-fixtures.js';

test('unique exact evidence is aligned with UTF-16 positions without changing provider data',()=>{
 const answer=answerFixture('😀 I good at explaining ideas.'),value=assessmentFixture([answer]);value.answerAnalyses[0].errors[0].startOffset=2;value.answerAnalyses[0].errors[0].endOffset=11;
 const before=structuredClone(value),aligned=alignAssessmentEvidence(value,[answer]),error=aligned.answerAnalyses[0].errors[0];
 assert.deepEqual(value,before);assert.equal(error.startOffset,3);assert.equal(error.endOffset,12);assert.equal(error.sourceQuote,'I good at');assert.equal(error.minimalCorrection,'I am good at');
 assert.doesNotThrow(()=>validateAssessment(aligned,[answer]));
});

test('target checks and phrase usage align only within their own answer transcript',()=>{
 const a=answerFixture('I good at explaining ideas.'),other=answerFixture('I am ready for practice.'),value=assessmentFixture([a,other]);
 const span={answerId:other.id,sourceQuote:'I am ready',startOffset:2,endOffset:4,confidence:'high',correctUse:true};
 value.targetChecks=[{...span,category:'missing_be'}];value.phraseUses=[{...span,vocabularyId:'vocab-fixture'}];
 const aligned=alignAssessmentEvidence(value,[a,other]);
 for(const field of ['targetChecks','phraseUses']){assert.equal(aligned[field][0].startOffset,0);assert.equal(aligned[field][0].endOffset,10);assert.equal(aligned[field][0].answerId,other.id);}
 assert.doesNotThrow(()=>validateAssessment(aligned,[a,other],{targetCategories:['missing_be'],vocabularyIds:['vocab-fixture']}));
});

test('an already valid span remains selected when the quote appears multiple times',()=>{
 const answer=answerFixture('I good at explaining. I good at teaching.'),value=assessmentFixture([answer]),second=answer.transcript.lastIndexOf('I good at');
 Object.assign(value.answerAnalyses[0].errors[0],{startOffset:second,endOffset:second+9});
 const aligned=alignAssessmentEvidence(value,[answer]);assert.equal(aligned.answerAnalyses[0].errors[0].startOffset,second);assert.doesNotThrow(()=>validateAssessment(aligned,[answer]));
});

test('ambiguous, missing and foreign-answer quotes still fail strict domain validation',()=>{
 for(const text of ['I good at explaining. I good at teaching.','I enjoy explaining ideas.']){
  const answer=answerFixture(text),value=assessmentFixture([answer]);
  value.answerAnalyses[0].errors=[{category:'missing_be',sourceQuote:'I good at',startOffset:1,endOffset:5,minimalCorrection:'I am good at',explanationUz:'Be fe’li.',severity:'high',confidence:'high',confidenceReasonUz:'Test',isStyleOnly:false,suggestedDrillType:'I am'}];
  const aligned=alignAssessmentEvidence(value,[answer]);assert.equal(aligned.answerAnalyses[0].errors[0].startOffset,1);assert.throws(()=>validateAssessment(aligned,[answer]),{code:'AI_EVIDENCE'});
 }
 const answer=answerFixture(),value=assessmentFixture([answer]);value.answerAnalyses[0].answerId='foreign-answer';assert.throws(()=>validateAssessment(alignAssessmentEvidence(value,[answer]),[answer]),{code:'AI_FOREIGN_ANSWER'});
});
