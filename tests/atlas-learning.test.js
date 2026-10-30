import test from 'node:test';
import assert from 'node:assert/strict';
import {atlasCatalog,topicCount} from '../src/atlas-learning/catalog.js';
import {guideFor,learningPaths,subjectInfo} from '../src/atlas-learning/guides.js';
import {sanitizeLearning,readLearning,emptyLearning,progressStorageKey,lessonRevision,lessonRow,canComplete,updateLearning,completedFor,nextInPath} from '../src/atlas-learning/progress.js';

test('all five atlases have usable teaching guides, valid formative questions and reachable learning paths',()=>{
 assert.equal(topicCount,174);
 for(const [subject,topics] of Object.entries(atlasCatalog)){
  assert.ok(subjectInfo[subject].route);assert.equal(new Set(topics.map(t=>t.id)).size,topics.length);
  for(const topic of topics){const guide=guideFor(subject,topic);assert.ok(guide,`${subject}/${topic.id}`);for(const key of ['idea','example','observe','task'])assert.ok(guide[key]?.length>=20,`${topic.id}: ${key}`);assert.ok(guide.words.length>0,topic.id);assert.ok(guide.check.answer>=0&&guide.check.answer<guide.check.options.length);assert.equal(new Set(guide.check.options).size,guide.check.options.length);assert.ok(guide.check.why.length>15);assert.equal(new URL(guide.source).protocol,'https:');}
  for(const path of learningPaths[subject]){assert.ok(path.ids.length>0);for(const id of path.ids)assert.ok(topics.some(t=>t.id===id),`${subject}/${path.id}/${id}`);}
  const reachable=new Set(learningPaths[subject].flatMap(p=>p.ids));for(const t of topics)assert.ok(reachable.has(t.id),`${subject}/${t.id}: a learning path exists`);
  assert.ok(topics.some(t=>t.id===subjectInfo[subject].start));
 }
});
test('different concepts sharing a scene retain their own explanation and question',()=>{
 for(const [subject,a,b]of [['math','logarifm','ildizlar'],['math','piramida','kub'],['space','nova','blackhole-merger'],['space','moon-phases','solar-eclipse'],['space','comet-tail','solar-system'],['biology','human-cell','plant-cell']]){
  const get=id=>guideFor(subject,atlasCatalog[subject].find(t=>t.id===id));assert.notEqual(get(a).idea,get(b).idea);assert.notEqual(get(a).check.question,get(b).check.question);
 }
});
test('completion requires a correct explanation check and two learner-entered observations',()=>{
 const guide=guideFor('math',atlasCatalog.math[0]);let row={answer:null,observation:'',changed:'',before:'',after:''};assert.equal(canComplete(row,guide.check),false);
 row={...row,answer:guide.check.answer,observation:'O‘zgargan qadam natijani siljitdi.'};assert.equal(canComplete(row,guide.check),false);
 row={...row,changed:'Qadam',before:'−3 + 2 = −1',after:'−3 + 3 = 0'};assert.equal(canComplete(row,guide.check),true);
 assert.equal(canComplete({...row,answer:(guide.check.answer+1)%3},guide.check),false);
});
test('learning progress isolates users and subjects, restores notes and does not count foreign topic IDs',()=>{
 assert.notEqual(progressStorageKey('alice'),progressStorageKey('bob'));assert.notEqual(progressStorageKey(),progressStorageKey('alice'));
 const row=(subject,id)=>{const t=atlasCatalog[subject].find(t=>t.id===id),g=guideFor(subject,t);return {revision:lessonRevision(t,g),completed:true,answer:g.check.answer,observation:'To‘liq izoh va modeldagi dalil.',changed:'Parametr',before:'Birinchi sinov',after:'Ikkinchi sinov'};};let data=emptyLearning();data=updateLearning(data,'math','son-chizigi',row('math','son-chizigi'));data=updateLearning(data,'biology','plant-cell',row('biology','plant-cell'));data=updateLearning(data,'math','not-a-topic',{completed:true});
 assert.equal(completedFor(data,'math',atlasCatalog.math),1);assert.equal(completedFor(data,'biology',atlasCatalog.biology),1);assert.equal(completedFor(data,'chemistry',atlasCatalog.chemistry),0);
 const restored=readLearning({getItem:()=>JSON.stringify(data)},'key');assert.equal(restored.entries.math['son-chizigi'].observation,'To‘liq izoh va modeldagi dalil.');assert.equal(nextInPath(learningPaths.math[0],restored,'math',atlasCatalog.math),'manfiy-sonlar');
});
test('changed content invalidates a previous guide completion without discarding unrelated stored lessons',()=>{
 const topic=atlasCatalog.math[0],guide=guideFor('math',topic),revision=lessonRevision(topic,guide);let data=updateLearning(emptyLearning(),'math',topic.id,{revision,completed:true});
 assert.equal(lessonRow(data,'math',topic.id,revision).completed,true);
 const revised=lessonRevision(topic,{...guide,check:{...guide.check,question:guide.check.question+' Yangilangan.'}});assert.notEqual(revised,revision);assert.equal(lessonRow(data,'math',topic.id,revised).completed,false);
 const long={...topic,definition:'Uzun izoh. '.repeat(100)};assert.notEqual(lessonRevision(long,guide),lessonRevision(long,{...guide,check:{...guide.check,answer:2}}));
});
test('malformed, blocked, oversized and prototype-shaped local drafts are bounded safely',()=>{
 assert.deepEqual(readLearning({getItem(){throw Error('blocked');}},'x'),emptyLearning());assert.deepEqual(readLearning({getItem(){return '{broken';}},'x'),emptyLearning());
 const data=sanitizeLearning(JSON.parse('{"entries":{"math":{"__proto__":{"completed":true},"son-chizigi":{"answer":999,"observation":"ok"}},"unknown":{"x":{"completed":true}}}}'));
 assert.equal(Object.hasOwn(data.entries.math,'__proto__'),false);assert.equal(data.entries.math['son-chizigi'].answer,null);assert.equal(Object.hasOwn(data.entries,'unknown'),false);
 const large=sanitizeLearning({entries:{math:{x:{observation:'x'.repeat(5000),before:'x'.repeat(600),changed:'x'.repeat(500),completed:'yes'}}}});assert.equal(large.entries.math.x.observation.length,1200);assert.equal(large.entries.math.x.before.length,160);assert.equal(large.entries.math.x.completed,false);
});
