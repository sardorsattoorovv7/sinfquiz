import test from 'node:test';
import assert from 'node:assert/strict';
import {quizPlacement,quizRanking,rankRows} from '../src/quiz-ranking.js';
const oldRows=[{id:'ali',score:750,correct:2,startedAt:100,finishedAt:800},{id:'vali',score:2800,correct:3,startedAt:100,finishedAt:700},{id:'zebo',score:1500,correct:2,startedAt:100,finishedAt:750}];
test('7.6 leaderboard rows lacking quizId give distinct real ranks instead of all first place',()=>{
 assert.equal(quizPlacement(oldRows,'quiz-a','vali').rank,1);
 assert.equal(quizPlacement(oldRows,'quiz-a','zebo').rank,2);
 assert.equal(quizPlacement(oldRows,'quiz-a','ali').rank,3);
 assert.deepEqual(quizRanking(oldRows,'quiz-a').map(p=>p.quizId),Array(3).fill('quiz-a'));
 assert.equal(oldRows[0].quizId,undefined,'does not mutate incoming rows');
});
test('missing data never invents first place and explicit other-quiz rows are rejected',()=>{
 assert.equal(quizPlacement([],'quiz-a','ali').rank,null);
 assert.equal(quizPlacement(undefined,'quiz-a','ali').rank,null);
 assert.equal(quizPlacement(oldRows,'quiz-a','missing').rank,null);
 assert.equal(quizPlacement([...oldRows,{id:'other',quizId:'quiz-b',score:9999}],'quiz-a','ali').rank,3);
});
test('live score changes update rank, with existing finish/start tie-breaks deterministic',()=>{
 assert.equal(quizPlacement(oldRows.map(p=>p.id==='ali'?{...p,score:3000}:p),'quiz-a','ali').rank,1);
 const rows=[{id:'c',score:10,startedAt:100},{id:'b',score:10,startedAt:100,finishedAt:400},{id:'a',score:10,startedAt:100,finishedAt:400}];
 assert.deepEqual(rankRows(rows).map(p=>p.id),['a','b','c']);
});
