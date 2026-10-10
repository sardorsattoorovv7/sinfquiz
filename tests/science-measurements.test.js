import test from 'node:test';
import assert from 'node:assert/strict';
import {biologyCurve,benchCurve,curveCSV,curveExtent,comparisonChanges} from '../src/science-measurements.js';
import {biologyDefaults,biologyResult,leafJourney} from '../src/biology-model.js';
import {simulateBench} from '../src/chemistry-bench-model.js';
import {readBiologyDraft,writeBiologyDraft} from '../src/biology-workflow.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('late salt addition keeps already dissolved salt; dilution lowers the ion concentration index',()=>{
 const first={substance:'salt',amount:1,at:0},water={substance:'water',amount:100,at:0};
 const old=simulateBench({elapsed:30,additions:[water,first]});
 const added=simulateBench({elapsed:30,additions:[water,first,{substance:'salt',amount:2,at:30}]});
 near(added.dissolvedSalt,old.dissolvedSalt);
 const later=simulateBench({elapsed:60,additions:added.parameters.additions});
 assert.ok(later.dissolvedSalt>added.dissolvedSalt);
 const diluted=simulateBench({elapsed:30,additions:[water,first,{substance:'water',amount:100,at:30}]});
 assert.ok(diluted.conductivity<old.conductivity);
 assert.equal(simulateBench({elapsed:30,additions:[water,{substance:'sugar',amount:5,at:0}]}).conductivity,0);
});
test('rain controls leaching while leaf carbon and nitrogen remain conserved',()=>{
 const dry=leafJourney({water:60,rain:0},365),wet=leafJourney({water:60,rain:60},365);
 assert.equal(dry.nitrogen.leached,0);
 assert.ok(wet.nitrogen.leached>dry.nitrogen.leached);
 for(const r of [dry,wet]){near(Object.values(r.carbon).reduce((a,b)=>a+b,0),45);near(Object.values(r.nitrogen).reduce((a,b)=>a+b,0),1)}
});
test('graph samples exactly the scene model including the middle and final stage',()=>{
 const p=biologyDefaults('leaf'),bio=biologyCurve('leaf',p);
 assert.equal(bio.length,31);
 for(const i of [0,15,30])assert.deepEqual(bio[i].values,biologyResult('leaf',p,i/30).readings);
 const chem={temperature:25,additions:[{substance:'vinegar',amount:30,concentration:.1,at:0},{substance:'soda',amount:2,at:5}]};
 const points=benchCurve(chem,60);
 for(const i of [0,15,30])assert.deepEqual(points[i].values,simulateBench({...chem,elapsed:2*i}).readings);
 const csv=curveCSV(bio,'Barg qoldig‘i','Bosqich',{unit:'g',xUnit:'%'});assert.match(csv,/^\uFEFF"Bosqich \(\%\)","Barg qoldig‘i \(g\)"/);assert.ok(csv.split('\r\n').at(-1).startsWith('"100",'));
 const extent=curveExtent(points,'CO₂ (ml)');assert.ok(extent.hi>extent.lo);
 assert.deepEqual(comparisonChanges({water:30,soil:'sand'},{water:60,soil:'sand'}),['water']);
 assert.match(curveCSV([{x:0,values:{'He said "hi"':2}}],'He said "hi"','t'),/^\uFEFF"t","He said ""hi"""\r\n"0","2"$/);
});
test('biology drafts resume validated conditions and progress without accepting invalid controls',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 const context='leaf-lesson',parameters=biologyDefaults('leaf',{water:30});
 writeBiologyDraft(storage,'draft',{context,parameters,progress:.4,prediction:'Sinovda namlikni o‘zgartiraman.'});
 const draft=readBiologyDraft(storage,'draft',context,'leaf');
 assert.deepEqual(draft.parameters,parameters);near(draft.progress,.4);
 writeBiologyDraft(storage,'bad',{context,parameters:{water:NaN},progress:8});
 const invalid=readBiologyDraft(storage,'bad',context,'leaf');assert.equal(invalid.parameters,undefined);assert.equal(invalid.progress,0);
 assert.equal(readBiologyDraft(storage,'draft','different','leaf'),null);
});
