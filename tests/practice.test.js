import test from 'node:test';
import assert from 'node:assert/strict';
import {nationalReview,safeSourceUrl} from '../src/national-review.js';
import {publicationError} from '../src/national-validation.js';
import {newPractice,advancePractice,setPracticeAnswer,finishPractice,wordCount,validPractice} from '../src/cefr-practice.js';

test('National review stays closed during a test and identifies wrong, blank and correct answers',()=>{
 const current={finished:false,section:{subject:'Test',questions:[0,1,2].map(id=>({id,text:'Fixture '+id,options:['A','B','C','D'],correct:1,explanation:'Fixture explanation'}))},answers:[0,null,1]};
 assert.deepEqual(nationalReview(current),[]);current.finished=true;
 const review=nationalReview(current);assert.deepEqual(review.map(q=>q.correct),[false,false,true]);assert.equal(review[1].selectedText,'Javob berilmagan');assert.equal(review[0].correctText,'B');assert.equal(review[2].number,3);
});
test('Source URLs reject script schemes and credentials',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,test','http://example.com','https://user:pass@example.com'])assert.equal(safeSourceUrl(url),null);
 assert.equal(safeSourceUrl('https://gov.uz/example'),'https://gov.uz/example');
});
test('Public national variants require sources, answer explanations, unique questions and mixed topics',()=>{
 const section={questions:Array.from({length:30},(_,i)=>({text:'Fixture '+i,options:['A','B','C','D'],correct:0,topic:'Topic '+i%3,sourceUrl:'https://example.com/sample',sourceReference:'Q '+i,explanation:'Fixture only'}))};
 assert.equal(publicationError(section),null);
 const oneTopic=structuredClone(section);oneTopic.questions.forEach(q=>q.topic='Only topic');assert.match(publicationError(oneTopic),/3 ta mavzu/);
 const noSource=structuredClone(section);noSource.questions[0].sourceUrl='';assert.match(publicationError(noSource),/manba/);
 const duplicate=structuredClone(section);duplicate.questions[1].text=duplicate.questions[0].text;assert.match(publicationError(duplicate),/takrorlamang/);
});
test('CEFR answer editing respects deadlines and section transitions',()=>{
 const start=newPractice({title:'Fixture'},1000),answered=setPracticeAnswer(start,0,'answer',2000);
 assert.equal(validPractice(start),true);assert.equal(validPractice({version:1}),false);assert.equal(validPractice({...start,step:8}),false);
 assert.equal(answered.answers.listening[0],'answer');assert.equal(start.answers.listening[0],'');
 const next=advancePractice(answered,start.endsAt);assert.equal(next.step,1);assert.equal(next.answers.listening[0],'answer');
 const expired=setPracticeAnswer(start,0,'too late',start.endsAt);assert.equal(expired.step,1);assert.equal(expired.answers.listening[0],'');assert.equal(expired.answers.reading[0],'');
 assert.equal(advancePractice(start,1000+180*60000).finished,true);
 const early=advancePractice(start,5000,true);assert.equal(early.endsAt,5000+60*60000);assert.equal(early.step,1);
 const finished=finishPractice(answered,4000);assert.strictEqual(setPracticeAnswer(finished,0,'changed',4500),finished);
 assert.equal(wordCount('  one\n two   three '),3);
});
