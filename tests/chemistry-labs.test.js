import test from 'node:test';import assert from 'node:assert/strict';
import {chemistryLabs,labDefaults} from '../src/chemistry-labs.js';
import {labResult,carbonateGas,GAS_ML_PER_MMOL,carbonateAtoms,labParameters} from '../src/chemistry-lab-model.js';
import {validateChemistryForm,filterChemistryTopics} from '../src/chemistry-workflow.js';
import {chemistryTopics} from '../src/chemistry-content.js';
const near=(a,b,e=.002)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('13 laboratory templates have working numerical models, learning tasks and bounded teacher parameters',()=>{
 assert.equal(chemistryLabs.length,13);assert.equal(new Set(chemistryLabs.map(l=>l.scene)).size,13);
 for(const l of chemistryLabs){assert.equal(validateChemistryForm({...l,parameters:labDefaults(l)}),'',l.id);for(const extremes of ['initial','min','max']){const p=Object.fromEntries(l.controls.map(c=>[c.key,c[extremes]]));for(const progress of [0,.1,.5,1]){const r=labResult(l.scene,p,progress);assert.ok(r.explanation);for(const n of Object.values(r.values))assert.ok(Number.isFinite(n),l.id)}}const c=l.controls[0];assert.notEqual(validateChemistryForm({...l,parameters:{[c.key]:c.max+1}}),'');assert.notEqual(validateChemistryForm({...l,parameters:{unknown:0}}),'');}
 assert.equal(filterChemistryTopics([...chemistryTopics,...chemistryLabs],{tab:'map'}).length,12);assert.equal(filterChemistryTopics(chemistryLabs,{tab:'lab'}).length,13);assert.equal(filterChemistryTopics(chemistryLabs,{tab:'lab',query:'vulqon'}).length,1);
});
test('volcano limiting reagent conserves atoms and does not gain gas from soap',()=>{
 assert.deepEqual(carbonateAtoms.left,carbonateAtoms.right);assert.deepEqual(carbonateAtoms.left,{Na:1,H:5,C:3,O:5});const g=carbonateGas(10,6);assert.equal(g.mmol,6);assert.equal(g.sodaLeft,4);assert.equal(g.acidLeft,0);near(g.gasML,6*GAS_ML_PER_MMOL,1e-10);
 for(const soda of [0,1,10,20])for(const acid of [0,1,10,20]){const r=carbonateGas(soda,acid);assert.equal(r.sodaLeft+r.mmol,soda);assert.equal(r.acidLeft+r.mmol,acid);}
 assert.equal(labResult('lab-volcano',{soda:10,acid:6,foam:0}).values['CO₂'],labResult('lab-volcano',{soda:10,acid:6,foam:4}).values['CO₂']);
 near(labResult('lab-balloon',{soda:10,acid:10}).values['Gaz hajmi'],244.653, .01);assert.equal(carbonateGas(0,6).gasML,0);
});
test('neutralisation follows ionic balance including acid/base excess and zero reactants',()=>{
 assert.equal(labResult('lab-neutralisation',{acid:5,base:5}).values.pH,7);assert.equal(labResult('lab-neutralisation',{acid:5,base:3}).values['Ortiqcha kislota'],2);assert.equal(labResult('lab-neutralisation',{acid:3,base:5}).values['Ortiqcha asos'],2);assert.equal(labResult('lab-neutralisation',{acid:0,base:0}).values.pH,7);assert.equal(labResult('lab-neutralisation',{acid:5,base:5},.5).values['Ortiqcha kislota'],2.5);
});
test('dissolution, crystallisation, filtration and distillation preserve every material mass',()=>{
 const d=labResult('lab-dissolving',{salt:40,water:100}).values;near(d['Erigan NaCl'],35.9);near(d['Qattiq NaCl'],4.1);near(d['Erigan NaCl']+d['Qattiq NaCl'],40);
 const c=labResult('lab-crystals',{salt:20,evaporation:50}).values;near(c['Kristall NaCl'],2.05);near(c['Erigan NaCl']+c['Kristall NaCl'],20);
 for(const q of [0,.25,.5,1]){const f=labResult('lab-filtration',{sand:10,salt:5},q).values;near(f['Filtrdagi qum']+f['Hali quyilmagan qum'],10);near(f['Filtratdagi NaCl'],5*q);const r=labResult('lab-distillation',{salt:10,collected:40},q).values;near(r['Yig‘ilgan suv']+r['Qolgan suv'],100);assert.equal(r['Idishdagi jami NaCl'],10);}
});
test('physical models have deterministic monotonic effects and expose qualitative units',()=>{
 const den=labResult('lab-density',{oil:50});assert.equal(den.values['Jami hajm'],150);assert.equal(den.values['Moy massasi'],45);
 const warm=labResult('lab-diffusion',{temperature:60}),cold=labResult('lab-diffusion',{temperature:5});assert.ok(warm.spread>cold.spread);
 const c=labResult('lab-chromatography',{front:5}).values;near(c['Sariq pigment']/c.Front,.8);near(c['Qizil pigment']/c.Front,.55);near(c['Ko‘k pigment']/c.Front,.25);
 assert.equal(labResult('lab-conductivity',{salt:0,sugar:0}).conductivity,labResult('lab-conductivity',{salt:0,sugar:3}).conductivity);assert.ok(labResult('lab-conductivity',{salt:3,sugar:0}).conductivity>labResult('lab-conductivity',{salt:1,sugar:0}).conductivity);
 assert.equal(labResult('lab-corrosion',{humidity:0,oxygen:100,salt:3}).corrosion,0);assert.equal(labResult('lab-corrosion',{humidity:100,oxygen:0,salt:3}).corrosion,0);assert.ok(labResult('lab-corrosion',{humidity:70,oxygen:100,salt:3}).corrosion>labResult('lab-corrosion',{humidity:70,oxygen:100,salt:0}).corrosion);
 assert.deepEqual(labResult('lab-corrosion',{}),labResult('lab-corrosion',{}));assert.equal(labParameters('lab-volcano',{soda:100,acid:NaN}).soda,20);assert.deepEqual(labResult('lab-volcano',null),labResult('lab-volcano',{}));assert.throws(()=>labResult('bad',{}));
});
