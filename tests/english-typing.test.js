import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {placementBank,placementLevels,randomPlacementQuestion} from '../data/placement-bank.js';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const lessons=JSON.parse(readFileSync(join(root,'data/english-typing-lessons.json'),'utf8'));

test('English typing bank has five complete lessons for every A1-C2 level',()=>{
 for(const level of ['A1','A2','B1','B2','C1','C2']){
  const course=lessons.filter(item=>item.englishLevel===level);
  assert.equal(course.length,5);
  course.forEach((item,index)=>{
   assert.equal(item.level,index+1);
   assert.ok(item.prompt.includes('___'));
   assert.ok(item.text.length>item.prompt.replace('___','').length);
   assert.ok(item.translation.length>5);
   assert.equal(item.words.length,3);
  });
 }
});

test('Adaptive placement bank has 276 unique A1-C2 questions including reading',()=>{
 assert.deepEqual(placementLevels,['A1','A2','B1','B2','C1','C2']);
 assert.equal(placementBank.length,276);
 assert.equal(new Set(placementBank.map(item=>item.id)).size,276);
 for(const level of placementLevels){
  const expected=['C1','C2'].includes(level)?30:54;
  assert.equal(placementBank.filter(item=>item.level===level).length,expected);
  assert.equal(placementBank.filter(item=>item.level===level&&item.kind==='reading').length,6);
 }
 assert.equal(placementBank.filter(item=>item.kind==='reading').length,36);
 const used=[];
 for(let index=0;index<15;index++){
  const kind=[2,5,8,11,14].includes(index)?'reading':'language';
  const question=randomPlacementQuestion(placementLevels[index%6],used,kind);
  assert.equal(question.kind,kind);
  assert.ok(!used.includes(question.id));
  used.push(question.id);
 }
});

test('Long-text typing course remains available through the 300-500 word stage',()=>{
 const longLessons=JSON.parse(readFileSync(join(root,'data/typing-lessons.json'),'utf8'));
 assert.equal(longLessons.length,5);
 const finalWords=longLessons.at(-1).text.trim().split(/\s+/u).length;
 assert.ok(finalWords>=300&&finalWords<=500,`final words: ${finalWords}`);
});
