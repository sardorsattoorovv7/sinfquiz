import {biologyClientToken} from '../src/biology-client-token.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Vector3} from 'three';
import {readFileSync} from 'node:fs';
import {historyTopics} from '../src/history-atlas/content.js';
import {createHistoryDiorama} from '../src/history-atlas/scene.js';
import {mapPoint,yearLabel,historyDraft,historyRevision,historyComplete,historyStorageKey} from '../src/history-atlas/model.js';
import {biologyTopics,organInfo} from '../src/biology-content.js';
import {organPrecision,topicPrecision} from '../src/biology-precision.js';
import {sliceDefinition,anatomicalPart,anatomyViewKeys,anatomyRenderKeys} from '../src/biology-anatomy-layout.js';

test('12 historical stops have ordered periods, mapped locations, sources, actionable questions and evidence distinctions',()=>{
 assert.equal(historyTopics.length,12);assert.equal(new Set(historyTopics.map(t=>t.id)).size,12);let previous=-Infinity;
 for(const t of historyTopics){assert.ok(t.year>previous);previous=t.year;assert.equal(t.parts.length,4);assert.equal(new Set(t.parts.map(p=>p.id)).size,4);assert.equal(t.activity.choices.length,3);assert.ok(t.activity.answer>=0&&t.activity.answer<3);assert.equal(t.check.options.length,3);assert.equal(t.facts.length,3);for(const p of t.parts)assert.ok(p.description.length>20);assert.notEqual(t.evidence.observation,t.evidence.inference);for(const s of t.sources)assert.equal(new URL(s.url).protocol,'https:');const p=mapPoint(t.location);assert.ok(p.x>=0&&p.x<=720&&p.y>=0&&p.y<=360);assert.ok(t.limitation.length>40);}
 assert.equal(yearLabel(-450),'mil. avv. 450');assert.equal(yearLabel(1991),'1991-yil');assert.throws(()=>mapPoint({lat:91,lon:0}));assert.throws(()=>mapPoint({lat:0,lon:NaN}));
 assert.match(historyTopics.find(t=>t.scene==='pyramid').misconception,/tasdiqlangan/);assert.match(historyTopics.find(t=>t.scene==='observatory').misconception,/teleskop/);assert.match(historyTopics.at(-1).misconception,/31-avgust/);
});
test('every historical diorama has four pickable 3D groups and finite camera-sized geometry at both ends of the animation',()=>{
 for(const topic of historyTopics){const m=createHistoryDiorama(topic);assert.equal(m.parts.length,4);for(const p of m.parts){assert.ok(p.children.length,topic.id);assert.ok(Number.isInteger(p.userData.partIndex));}for(const phase of [0,.5,1]){m.step(phase,phase,2);const b=new Box3().setFromObject(m.root),size=b.getSize(new Vector3());assert.ok([...b.min,...b.max].every(Number.isFinite),topic.id);assert.ok(size.x>4&&size.y>1&&size.z>3,topic.id);}m.dispose();}
});
test('history notes require the current question, correct answer and meaningful learner evidence, with bounded isolated storage',()=>{
 const topic=historyTopics[0],row={complete:true,revision:historyRevision(topic),answer:topic.activity.answer,note:'Modelda tomdan kiriladigan uylarni kuzatdim.'};assert.equal(historyComplete(row,topic),true);assert.equal(historyComplete({...row,note:''},topic),false);assert.equal(historyComplete({...row,answer:(topic.activity.answer+1)%3},topic),false);assert.equal(historyComplete(row,{...topic,activity:{...topic.activity,prompt:topic.activity.prompt+' Yangi dalil.'}}),false);
 const dirty=historyDraft(JSON.parse('{"entries":{"__proto__":{"complete":true},"safe-id":{"answer":99,"note":"abc","complete":"true"}}}'));assert.equal(Object.hasOwn(dirty.entries,'__proto__'),false);assert.equal(dirty.entries['safe-id'].answer,null);assert.equal(dirty.entries['safe-id'].complete,false);assert.notEqual(historyStorageKey('alice'),historyStorageKey('bob'));assert.equal(historyDraft({entries:{test:{note:'a'.repeat(3000)}}}).entries.test.note.length,1500);
});
test('all 11 organ lessons and all 30 biology topics have precise structures, mechanisms and primary source links',()=>{
 assert.deepEqual(Object.keys(organPrecision).sort(),Object.keys(organInfo).sort());for(const p of [...Object.values(organPrecision),...biologyTopics.map(t=>topicPrecision(t))]){assert.ok(p);assert.equal(p.structures.length,4);assert.equal(p.mechanism.length,4);for(const s of p.structures)assert.ok(s.detail.length>20);for(const s of p.sources)assert.equal(new URL(s.url).protocol,'https:');assert.ok(p.misconception.length>25);assert.ok(p.limitation.length>30);}for(const p of Object.values(organPrecision)){assert.equal(p.question.options.length,3);assert.ok(p.question.answer>=0&&p.question.answer<3);}
 const cell=biologyTopics.find(t=>t.id==='plant-cell');assert.notEqual(topicPrecision(cell,{cell:'plant'}).subtitle,topicPrecision(cell,{cell:'animal'}).subtitle);assert.match(organPrecision.heart.misconception,/qizil/);assert.match(organPrecision.skin.misconception,/gipoderma|teri osti/i);
});
test('three anatomical cut planes preserve the patient coordinate convention and source model bounds',()=>{
 assert.deepEqual(anatomyRenderKeys('inside','skin'),['skin']);assert.deepEqual(anatomyRenderKeys('outer','skin',true),['skin']);assert.ok(anatomyRenderKeys('organs','heart').every(k=>k!=='skin'));const bounds={min:[-2,-4,-1],max:[3,5,2]};for(const [axis,i]of [['front',2],['side',0],['top',1]]){const uncut=sliceDefinition(axis,0,bounds),cut=sliceDefinition(axis,85,bounds);assert.equal(uncut.constant,bounds.max[i]);assert.equal(cut.normal[i],-1);assert.ok(cut.constant<uncut.constant&&cut.constant>bounds.min[i]);assert.deepEqual(sliceDefinition(axis,999,bounds),cut);}assert.equal(anatomicalPart('diaphragm'),'lungs');assert.deepEqual(anatomyViewKeys('inside','muscles'),['muscles']);assert.ok(anatomyViewKeys('organs','heart').includes('lungs'));
 const manifest=JSON.parse(readFileSync(new URL('../public/biology/v7.21/manifest.json',import.meta.url)));const kidneys=manifest.assets['anatomy-organs.glb'].structures.filter(s=>s.part==='kidneys');assert.ok(kidneys.find(k=>k.key==='right-kidney').bounds[1][0]<0);assert.ok(kidneys.find(k=>k.key==='left-kidney').bounds[0][0]>0);
});

test('biology submissions retain valid v4 UUID tokens on HTTP without randomUUID',()=>{
 const token=biologyClientToken({getRandomValues:a=>{for(let i=0;i<a.length;i++)a[i]=i*13;return a;}});assert.match(token,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);assert.notEqual(biologyClientToken(),biologyClientToken());
});
