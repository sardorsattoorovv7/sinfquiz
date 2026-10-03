import test from 'node:test';
import assert from 'node:assert/strict';
import {benchMissions,initialBench} from '../src/chemistry-bench-content.js';
import {simulateBench,missionComplete} from '../src/chemistry-bench-model.js';
import {benchTutorials,tutorialSample,tutorialState,tutorialRoundMatches} from '../src/chemistry-bench-tutorial.js';
import {benchVisualState} from '../src/chemistry-bench-visual-model.js';

for(const m of [{id:'free'},...benchMissions])test(`virtual guide ${m.id}: authored samples finish the actual scientific task`,()=>{
 const guide=benchTutorials[m.id],trials=[];
 assert.ok(guide&&guide.rounds.length);
 assert.equal(tutorialState(m.id,initialBench(),trials).done,false);
 for(const round of guide.rounds){
  const sample=tutorialSample(round),result=simulateBench(sample);
  assert.ok(tutorialRoundMatches(round,result),round.title);
  assert.equal(tutorialRoundMatches(round,simulateBench({...sample,elapsed:0})),false,'time must be observed');
  trials.push({parameters:result.parameters});
 }
 const result=simulateBench(trials.at(-1).parameters);
 assert.equal(tutorialState(m.id,result.parameters,trials).done,true);
 assert.equal(missionComplete(m.id,result,trials),true,`tutorial must satisfy real mission criteria: ${m.id}`);
});
test('guide: incorrect reagent, excess amount and concentration produce an explanation instead of progress',()=>{
 const r=benchTutorials.volcano.rounds[0],p=tutorialSample(r);
 for(const [data,message] of [
  [{...p,additions:[...p.additions,{substance:'iron',amount:1,concentration:.1,at:0}]},/Temir.*tarkibiga kirmaydi/],
  [{...p,additions:p.additions.map(a=>a.substance==='soda'?{...a,amount:2}:a)},/Osh sodasi.*jami 2/],
  [{...p,additions:p.additions.map(a=>a.substance==='vinegar'?{...a,concentration:.3}:a)},/Konsentratsiya/],
  [{...p,additions:p.additions.map(a=>({...a,at:1}))},/vaqt 0 s/]
 ]){
  const state=tutorialState('volcano',data,[]);assert.match(state.warning,message);assert.equal(state.valid,false);
  assert.equal(tutorialState('volcano',data,[{parameters:data}]).completed,0);
 }
 assert.equal(tutorialState('volcano',initialBench()).current.id,'equipment');
 const first={...initialBench(),equipment:'volcano'};assert.equal(tutorialState('volcano',first).current.id,'vinegar');
});
test('guide: comparisons are chronological, separate and rate measurements use the same instant',()=>{
 const guide=benchTutorials.rate.rounds,[first,second]=guide.map(r=>tutorialSample(r));
 assert.equal(tutorialState('rate',second,[{parameters:second}]).completed,0);
 assert.equal(tutorialState('rate',first,[{parameters:first},{parameters:first}]).completed,1);
 assert.equal(tutorialState('rate',second,[{parameters:first},{parameters:second}]).completed,2);
 assert.equal(tutorialRoundMatches(guide[1],simulateBench({...second,elapsed:12})),false);
 assert.equal(tutorialRoundMatches(guide[1],simulateBench({...second,stir:true})),false);
});
test('appearance: bubbles derive from actual gas flow; unsupported combinations never get a gas effect',()=>{
 const round=benchTutorials.gas.rounds[0],p=tutorialSample(round),early=simulateBench({...p,elapsed:5}),late=simulateBench({...p,elapsed:180});
 assert.ok(early.gasRateMl>late.gasRateMl);
 const dt=1e-4,plus=simulateBench({...p,elapsed:5+dt});
 assert.ok(Math.abs((plus.gasMl-early.gasMl)/dt-early.gasRateMl)<.001,'rate is the derivative of the gas-volume model');
 assert.ok(benchVisualState(early).bubbleCount>benchVisualState(late).bubbleCount);
 const unknown=simulateBench({...initialBench(),elapsed:50,additions:[{substance:'iron',amount:1,at:0,concentration:.1},{substance:'vinegar',amount:30,at:0,concentration:.1}]});
 assert.equal(unknown.gasRateMl,0);assert.equal(benchVisualState(unknown).bubbleCount,0);
 for(const specimen of [early,late,unknown,simulateBench(initialBench())])for(const v of Object.values(benchVisualState(specimen)).filter(v=>typeof v==='number'))assert.ok(Number.isFinite(v));
});
test('appearance: filter separates visible residue, oil disperses only when mixing, precipitate settles',()=>{
 const filter=simulateBench(tutorialSample(benchTutorials.filter.rounds[0])),a=benchVisualState(filter);
 assert.ok(a.filterResidue>0);assert.equal(a.solid,0);assert.equal(a.cloudy,false);
 const [calm,mixed]=benchTutorials.density.rounds.map(r=>benchVisualState(simulateBench(tutorialSample(r))));
 assert.equal(calm.mixedOil,false);assert.equal(mixed.mixedOil,true);assert.ok(calm.oilHeight>0);
 const p={...initialBench(),additions:[{substance:'cacl2',amount:30,concentration:.1,at:0},{substance:'carbonate',amount:30,concentration:.1,at:0}]};
 const early=benchVisualState(simulateBench({...p,elapsed:1})),late=benchVisualState(simulateBench({...p,elapsed:60}));
 assert.ok(early.precipitate>0);assert.ok(early.suspended>late.suspended);
 assert.equal(benchVisualState(simulateBench({...p,stir:true,elapsed:60})).suspended,1);
 assert.ok(Math.abs(simulateBench(p).precipitateMass-.003*100.0869)<1e-9);
});

test('invalid external catalog names are ignored and cannot select Object prototypes',()=>{
 const p=simulateBench({...initialBench(),additions:[null,{substance:'constructor',amount:2},{substance:'__proto__',amount:2},{substance:'toString',amount:2}]});
 assert.equal(p.parameters.additions.length,0);assert.equal(p.events.length,0);assert.equal(p.gasRateMl,0);
 assert.equal(tutorialState('constructor',initialBench()).guide,benchTutorials.free);
});

test('amount integrity: soap and indicator volumes count; dry soda stays visible as solid',()=>{
 const liquid=simulateBench({...initialBench(),additions:[{substance:'water',amount:30},{substance:'soap',amount:3},{substance:'indicator',amount:3}]});
 assert.equal(liquid.volume,33.15);assert.equal(liquid.pH,null);
 const dry=simulateBench({...initialBench(),additions:[{substance:'soda',amount:1}]});
 assert.equal(dry.residue,1);assert.ok(benchVisualState(dry).solid>0);assert.equal(dry.gasMoles,0);
});
