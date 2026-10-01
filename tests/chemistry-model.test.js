import test from 'node:test';
import assert from 'node:assert/strict';
import {elements} from '../src/chemistry-elements.js';
import {atomIdentity,molecules,composition,moleculeValidation,reactions,balanceReaction,neutralPH,waterPhase,rateFactor,solubility} from '../src/chemistry-model.js';
import {chemistryTopics} from '../src/chemistry-content.js';
test('118 elements have unique symbols, correct positions and atomic numbers',()=>{
 assert.equal(elements.length,118);assert.equal(new Set(elements.map(x=>x.symbol)).size,118);elements.forEach((e,i)=>{assert.equal(e.z,i+1);assert.ok(e.name);assert.ok(e.period>=1&&e.period<=7);assert.ok(e.column>=1&&e.column<=18)});
 for(const [s,z,g,p] of [['H',1,1,1],['He',2,18,1],['O',8,16,2],['Fe',26,8,4],['Au',79,11,6],['Og',118,18,7]]){const e=elements[z-1];assert.equal(e.symbol,s);assert.equal(e.group,g);assert.equal(e.period,p)}
});
test('atom Z, mass number, ion charge and isotope distinction are exact',()=>{assert.equal(atomIdentity(8,8,10).charge,-2);assert.equal(atomIdentity(6,8,6).mass,14);assert.equal(atomIdentity(6,6,6).element.symbol,'C');assert.equal(atomIdentity(7,6,6).element.symbol,'N');assert.throws(()=>atomIdentity(0,1,1));assert.throws(()=>atomIdentity(1,1,1.5))});
test('all supplied molecule formulas agree with atom and bond counts',()=>{
 const counts={water:{H:2,O:1},methane:{C:1,H:4},oxygen:{O:2},nitrogen:{N:2},dioxide:{C:1,O:2},ammonia:{N:1,H:3},ethene:{C:2,H:4},ethyne:{C:2,H:2},ethanol:{C:2,H:6,O:1}};
 for(const [id,m] of Object.entries(molecules)){assert.deepEqual(composition(m.atoms),counts[id]);assert.equal(moleculeValidation(m.atoms,m.bonds).valid,true,id)}
 assert.equal(moleculeValidation([['H',0,0,0],['H',1,0,0]],[[0,1,2]]).valid,false);assert.equal(moleculeValidation(molecules.water.atoms,[[0,1,1]]).valid,false);assert.equal(moleculeValidation(molecules.oxygen.atoms,[[0,1,2],[0,1,2]]).valid,false);
 const water=molecules.water.atoms;const u=water[1].slice(1),v=water[2].slice(1),angle=Math.acos(u.reduce((s,x,i)=>s+x*v[i],0)/(Math.hypot(...u)*Math.hypot(...v)))*180/Math.PI;assert.ok(Math.abs(angle-104.5)<.3);
});
test('every reference reaction conserves each element and detects imbalance',()=>{for(const r of reactions){assert.equal(balanceReaction(r,r.answer).balanced,true,r.id);const wrong=[...r.answer];wrong[0]++;assert.equal(balanceReaction(r,wrong).balanced,false,r.id);for(const scale of [2,3,4])assert.equal(balanceReaction(r,r.answer.map(n=>n*scale)).balanced,true)}});
test('pH uses concentration balance, not average pH, including basic cancellation edge',()=>{assert.equal(neutralPH(1,1),7);assert.ok(Math.abs(neutralPH(1,0)-2)<1e-5);assert.ok(Math.abs(neutralPH(0,1)-12)<1e-5);assert.ok(Math.abs(neutralPH(10,0)-1)<1e-5);assert.ok(Math.abs(neutralPH(0,10)-13)<1e-5);assert.ok(Number.isFinite(neutralPH(0,0)));assert.equal(neutralPH(4.2,4.2),7)});
test('phase boundaries, rate baseline and salt mass balance are explicit',()=>{assert.equal(waterPhase(-10),'qattiq');assert.equal(waterPhase(0),'muz va suyuqlik');assert.equal(waterPhase(20),'suyuq');assert.equal(waterPhase(100),'suyuqlik va gaz');assert.equal(waterPhase(110),'gaz');assert.equal(rateFactor(25,1,1),1);assert.equal(rateFactor(25,2,1),2);assert.ok(rateFactor(45,1,1)>1);assert.equal(rateFactor(25,1,1,true),2);const d=solubility(50,100);assert.equal(d.dissolved,35.9);assert.ok(Math.abs(d.dissolved+d.residue-50)<1e-9);assert.equal(chemistryTopics.length,12);assert.equal(new Set(chemistryTopics.map(t=>t.scene)).size,12)});
