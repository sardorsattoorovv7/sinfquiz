import test from 'node:test';
import assert from 'node:assert/strict';
import {cefrMockBank,cefrSummary} from '../data/cefr-mock-bank.js';
import {cefrBand,cefrObjectiveScore,cefrResult} from '../src/cefr-grading.js';

test('CEFR bank contains archived legacy demo bank',()=>{
 assert.equal(cefrSummary.mocks,10);
 assert.equal(cefrMockBank.length,10);
 const ids=new Set();
 for(const mock of cefrMockBank){
  assert.equal(mock.durationMinutes,180);
  assert.equal(mock.listening.length,35);
  assert.equal(mock.reading.length,35);
  assert.equal(mock.writing.length,2);
  assert.equal(mock.speaking.length,3);
  assert.deepEqual([...new Set(mock.listening.map(item=>item.part))],[1,2,3,4,5,6]);
  assert.deepEqual([...new Set(mock.reading.map(item=>item.part))],[1,2,3,4,5]);
  for(const item of [...mock.listening,...mock.reading]){
   assert.equal(item.options.length,4);
   assert.ok(Number.isInteger(item.correct)&&item.correct>=0&&item.correct<4);
   assert.ok(!ids.has(item.id));ids.add(item.id);
  }
  assert.deepEqual(mock.writing.map(item=>[item.minWords,item.maxWords]),[[100,150],[200,250]]);
 }
 assert.equal(ids.size,700);
});

test('CEFR B1, B2 and C1 thresholds use the 75-point scale',()=>{
 assert.equal(cefrBand(37.9),'B1 dan quyi');
 assert.equal(cefrBand(38),'B1');
 assert.equal(cefrBand(51),'B2');
 assert.equal(cefrBand(65),'C1');
 assert.equal(cefrObjectiveScore(35),75);
 assert.deepEqual(cefrResult({listeningCorrect:35,readingCorrect:35,writingScore:70,speakingScore:70}),{listening:75,reading:75,writing:70,speaking:70,overall:72.5,level:'C1',scaleMax:75,provisional:true});
});
