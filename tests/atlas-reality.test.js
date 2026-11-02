import test from 'node:test';
import assert from 'node:assert/strict';
import {atlasCatalog} from '../src/atlas-learning/catalog.js';
import {realityContext} from '../src/atlas-reality/contexts.js';
import {realitySpec,realityResult,safeRealityParameters} from '../src/atlas-reality/science-model.js';
import {history,components} from '../src/informatics/content.js';
import {historyWorkplaces,historicResult,eniacPanels,eniacFacts,freeFallTable} from '../src/informatics/history-sim.js';
import {hardwareCases,hardwareOutcome} from '../src/informatics/hardware-work.js';
const finite=r=>{assert.ok(r.metrics.length);for(const m of r.metrics){assert.ok(m.label);assert.notEqual(m.value,undefined);if(typeof m.value==='number')assert.ok(Number.isFinite(m.value),m.label);}};
test('all 170 scientific topics have a relevant real setting and valid live computations at control bounds',()=>{
 let count=0;for(const [subject,topics]of Object.entries(atlasCatalog)){if(['informatics','history'].includes(subject))continue;for(const topic of topics){const context=realityContext(subject,topic),spec=realitySpec(subject,topic);assert.ok(context.title&&context.task&&context.life&&context.limit,`${subject}:${topic.id}`);assert.equal(context.stations.length,3);assert.ok(spec.defaults);for(const q of [0,.5,1])finite(realityResult(subject,topic,spec.defaults,q));for(const c of spec.controls){const values=c.options?c.options.map(o=>Array.isArray(o)?o[0]:o.value):[c.min,c.max];for(const value of values){const p=safeRealityParameters(spec,{...spec.defaults,[c.key]:value});finite(realityResult(subject,topic,p,1));}}count++;}}assert.equal(count,170);
});
test('physical maths examples preserve units, edge cases and distinct concepts',()=>{
 const result=(id,p,q=1)=>realityResult('math',atlasCatalog.math.find(t=>t.id===id),p,q);
 assert.equal(result('pifagor',{a:3,b:4}).metrics[0].value,5);
 assert.equal(result('ulush-foiz',{price:200,discount:25}).metrics[1].value,150);
 assert.throws(()=>result('unknown-topic',{}));
});
test('symmetric and degenerate maths cases stay truthful',()=>{
 const result=(id,p)=>realityResult('math',atlasCatalog.math.find(t=>t.id===id),p,1);
 assert.deepEqual(result('simmetriya',{dx:3}).metrics.map(m=>m.value),[-3,3,3]);
 assert.match(result('sistema',{m:1,b:3,x:5}).explanation,/yo‘q/);
 assert.match(result('sistema',{m:1,b:8,x:5}).explanation,/bir xil/);
 assert.equal(result('ildizlar',{area:49}).metrics[0].value,7);
 assert.equal(result('ehtimollik',{red:0,blue:7}).metrics[0].value,0);
 const k=result('silindr',{r:2,h:3});assert.equal(k.metrics[0].unit,'m³');assert.ok(Math.abs(k.metrics[0].value-12*Math.PI)<1e-9);
});
test('each of 12 historical computers has a distinct worked activity and truthful abstraction',()=>{
 assert.equal(Object.keys(historyWorkplaces).length,history.length);for(const h of history){const work=historyWorkplaces[h.id];assert.ok(work.place&&work.purpose&&work.task&&work.limit);assert.ok(work.steps.length>=4);const values=Object.fromEntries(work.controls.map(c=>[c.key,c.initial]));assert.ok(Number.isFinite(historicResult(h.id,values.a,values.b).value));}
 assert.equal(historicResult('pascal',999,1).value,1000);assert.equal(historicResult('eniac',23,17,'multiply').value,391);assert.equal(historicResult('colossus',21,17).value,4);assert.equal(historicResult('micro',9,7).value,0);assert.match(historicResult('micro',9,7).detail,/carry = 1/);assert.equal(historicResult('modern',640,480).value,921600);
});
test('ENIAC room facts convert US short tons, enumerate 40 panels and distinguish 20 accumulators',()=>{
 assert.equal(eniacPanels.length,40);assert.equal(eniacPanels.filter(x=>x.startsWith('Akkumulyator')).length,20);assert.ok(Math.abs(eniacFacts.massMetric-27.2155422)<1e-7);assert.ok(Math.abs(eniacFacts.roomWidth-9.144)<1e-9);assert.ok(Math.abs(eniacFacts.roomLength-15.24)<1e-9);
 const rows=freeFallTable(20,.25);assert.equal(rows[0].height,20);assert.equal(rows.at(-1).height,0);assert.ok(Math.abs(rows.at(-1).time-Math.sqrt(40/9.81))<1e-9);assert.equal(rows.length,new Set(rows.map(r=>r.time)).size);assert.ok(rows.every(r=>r.height>=0));
});
test('all 18 components have executable cases and use real component paths',()=>{
 assert.equal(Object.keys(hardwareCases).length,18);const known=components.map(c=>c.id);for(const part of components){const c=hardwareCases[part.id];assert.equal(c.path.length,3);assert.equal(c.steps.length,3);assert.ok(c.path.every(id=>known.includes(id)));assert.ok(hardwareOutcome(part.id,{ready:true,a:7,b:5,text:'abc'}));assert.ok(hardwareOutcome(part.id,{ready:false}));}
 assert.match(hardwareOutcome('ram',{ready:false}),/yo‘qoldi/);assert.match(hardwareOutcome('rom',{ready:false}),/saqlanib/);assert.match(hardwareOutcome('cpu',{a:7,b:5}),/12/);assert.match(hardwareOutcome('nvme'),/SATA kabeli ishlatilmaydi/);
});
test('runtime parameters reject enum injection and clamp numeric values',()=>{
 const t=atlasCatalog.biology.find(t=>t.id==='plant-cell'),s=realitySpec('biology',t);assert.equal(safeRealityParameters(s,{cell:'__proto__'}).cell,'plant');
 const spec=realitySpec('math',atlasCatalog.math.find(t=>t.id==='aylana'));assert.equal(safeRealityParameters(spec,{r:999}).r,1.2);assert.equal(safeRealityParameters(spec,{r:'NaN'}).r,.35);assert.equal(safeRealityParameters(spec,{r:-5}).r,.1);
});
