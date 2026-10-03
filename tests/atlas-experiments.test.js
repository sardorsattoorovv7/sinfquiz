import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {fractionSum,balanceStep,triangleFromUnits,quadraticRoots,pythagoras} from '../src/atlas-experiment-math.js';
import {solidNetModel,sectionMeasures} from '../src/math-solid-models.js';
import {simulateBench,benchEquations,atomBalance,strongPH,acetatePH,missionComplete} from '../src/chemistry-bench-model.js';
import {initialBench,benchMissions} from '../src/chemistry-bench-content.js';

const close=(actual,expected,tolerance=1e-7)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} ≈ ${expected}`);
test('algebra: equivalent fractions, operations on both sides and degenerate quadratics',()=>{
 const sum=fractionSum({n:1,d:4},{n:1,d:3});assert.equal(sum.n,7);assert.equal(sum.d,12);
 const equation={a:3,c:2,b:0,d:17};
 for(const [op,value] of [['add',4],['subtract',2],['multiply',-2],['divide',3]]){
  const next=balanceStep(equation,op,value);close(next.a*5+next.c,next.b*5+next.d);
 }
 const wrong=balanceStep(equation,'add',4,false);assert.notEqual(wrong.a*5+wrong.c,wrong.b*5+wrong.d);
 for(const op of ['multiply','divide'])assert.throws(()=>balanceStep(equation,op,0));
 assert.deepEqual(quadraticRoots(1,-3,2).roots,[1,2]);assert.equal(quadraticRoots(0,0,0).kind,'all');assert.equal(quadraticRoots(0,0,1).kind,'none');
});
test('geometry: dragged triangle measurements and Pythagorean square areas agree',()=>{
 for(const offset of [0,3,8,11]){const t=triangleFromUnits(8,5,offset);close(t.area,20);close(t.angles.reduce((a,b)=>a+b),180)}
 const equal=triangleFromUnits(6,3*Math.sqrt(3),3);equal.angles.forEach(a=>close(a,60));equal.sides.forEach(s=>close(s,6));
 assert.deepEqual(pythagoras(3,4),{c:5,areas:[9,16,25]});
});
function meshArea(model){let total=0;model.updateMatrixWorld(true);model.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,p=g.attributes.position,index=g.index,count=index?index.count:p.count;for(let i=0;i<count;i+=3){const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,index?index.getX(i+k):i+k).applyMatrix4(m.matrixWorld));total+=new T.Vector3().subVectors(v[1],v[0]).cross(new T.Vector3().subVectors(v[2],v[0])).length()/2}});return total}
test('3D nets: rigid faces keep surface area; flat curved surfaces and cross sections agree',()=>{
 const material=(color,extra)=>new T.MeshBasicMaterial({color,...extra}),dispose=model=>model.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});
 for(const open of [0,35,100])for(const [kind,p,area] of [['pyramid',{a:3,h:5},9+6*Math.hypot(5,1.5)],['prism',{a:3,b:4,h:5},12+12*5]]){const m=solidNetModel({kind,...p,open},material);close(meshArea(m),area,1e-5);dispose(m)}
 for(const [kind,area] of [['cylinder',2*Math.PI*2*5+2*Math.PI*4],['cone',Math.PI*2*Math.hypot(2,5)+Math.PI*4]]){const m=solidNetModel({kind,r:2,h:5,open:100},material);close(meshArea(m),area,.06);dispose(m)}
 for(const [kind,area] of [['cube',9],['cuboid',12],['prism',6],['pyramid',2.25],['cone',Math.PI],['sphere',4*Math.PI]])close(sectionMeasures({kind,a:3,b:4,h:5,r:2,sectionAt:50}).area,area);
});
const add=(substance,amount,at=0)=>({substance,amount,at,concentration:.1});
const run=(additions,extra={})=>simulateBench({...initialBench(),elapsed:60,additions,...extra});
test('chemistry: atom conservation, limiting reagent and reaction-specific time',()=>{
 Object.values(benchEquations).forEach(eq=>assert.ok(atomBalance(eq).balanced,eq.text));
 const additions=[add('vinegar',30),add('soda',1)],r=run(additions);close(r.gasTargetMoles,.003);assert.ok(r.gasMoles>0&&r.gasMoles<.003);close(run(additions,{elapsed:0}).gasMoles,0);
 assert.ok(run(additions,{temperature:45}).gasMl>r.gasMl);
 close(run([...additions,add('salt',1,40)]).gasMoles,r.gasMoles);
 assert.ok(run([add('vinegar',30),add('soda',1,40)]).gasMoles<r.gasMoles);
 close(run([add('hcl',20),add('naoh',20),add('soda',1)]).gasMoles,0);
 assert.equal(run([add('iron',1),add('vinegar',20)]).events.length,0);
 close(run([add('cacl2',20),add('carbonate',20)]).events[0].moles,.002);
});
test('chemistry: dissolution, pH validity, neutral salts and unsupported mixtures',()=>{
 const salt=run([add('water',10),add('salt',10)]);close(salt.dissolvedSalt+salt.residue,10);assert.ok(salt.dissolvedSalt<=3.59);
 close(strongPH(0),7);close(strongPH(.1),1);close(strongPH(-.1),13);
 assert.ok(acetatePH(.1,0)>2.7&&acetatePH(.1,0)<3);assert.ok(acetatePH(.1,-.1)>8&&acetatePH(.1,-.1)<10);
 const neutral=run([add('hcl',20),add('naoh',20)]);close(neutral.pH,7);assert.ok(neutral.conductivity>0);
 assert.equal(run([add('water',30),add('soda',1)]).pH,null);assert.equal(run([]).pH,null);assert.equal(run([add('iron',1),add('hcl',20)]).pH,null);assert.equal(run([add('cacl2',20),add('carbonate',20)]).pH,null);
 const oil=run([add('water',30),add('oil',10)]);assert.equal(oil.oil,10);assert.equal(oil.events.length,0);assert.equal(run([add('water',30),add('oil',10)],{temperature:110}).phase,'suvli aralashma');assert.equal(run([]).phase,'namuna yo‘q');
});
test('all 12 laboratory missions require their observations and can be completed',()=>{
 const gas=[add('vinegar',30),add('soda',1)],water=[add('water',30)],trials=(sets)=>sets.map(([a,p={}])=>({parameters:run(a,p).parameters}));
 const cases={
  volcano:[[gas,{equipment:'volcano'}],[[add('vinegar',50),add('soda',1)],{equipment:'volcano'}]],
  gas:[[gas],[[add('vinegar',50),add('soda',1)]]],
  ph:[[[add('hcl',20),add('indicator',3)]],[[add('naoh',20),add('indicator',3)]]],
  neutral:[[[add('hcl',20),add('naoh',20)]],[[add('hcl',20)]]],
  solubility:[[[add('water',10),add('salt',10)]],[[add('water',20),add('salt',10)]]],
  crystals:[[[add('water',30),add('salt',10)],{equipment:'dish',evaporated:80}]],
  filter:[[[add('water',30),add('salt',2),add('sand',2)],{equipment:'funnel',filtered:true}]],
  density:[[[add('water',30),add('oil',15)],{stir:false}],[[add('water',30),add('oil',15)],{stir:true}]],
  phase:[[water,{temperature:-10}],[water,{temperature:25}],[water,{temperature:110}]],
  rate:[[gas,{elapsed:10,temperature:15}],[gas,{elapsed:10,temperature:35}]],
  rust:[[[add('water',30),add('iron',1)],{oxygen:true}],[[add('water',30),add('iron',1)],{oxygen:false}]],
  conductivity:[[[add('water',30),add('salt',2)],{equipment:'electrodes'}],[[add('water',30),add('sugar',2)],{equipment:'electrodes'}]]
 };
 assert.equal(benchMissions.length,12);
 for(const mission of benchMissions){assert.equal(missionComplete(mission.id,run([]),[]),false);const t=trials(cases[mission.id]);assert.equal(missionComplete(mission.id,simulateBench(t[0].parameters),t),true,mission.id)}
});
