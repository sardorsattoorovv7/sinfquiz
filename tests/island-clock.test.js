import test from 'node:test';
import assert from 'node:assert/strict';
import {islandTime,clockDelay,graphicsBudget,validTimeMode} from '../src/island-clock.js';
import {buildIslandModels,ISLAND_DISTRICTS} from '../src/island-models.js';

test('island uses device-local hours: morning, daylight, 17:00 dusk and night',()=>{
 const at=(h,m=0)=>islandTime(new Date(2026,9,9,h,m));
 for(const [h,p] of [[0,'night'],[4,'night'],[5,'morning'],[6,'morning'],[7,'day'],[15,'day'],[16,'evening'],[17,'evening'],[18,'evening'],[19,'night'],[23,'night']])assert.equal(at(h).phase,p);
 assert.equal(at(17).dusk,1);assert.equal(at(17).clock,'17:00');
 assert.equal(at(12).day,1);assert.equal(at(23).night,1);
});
test('lighting stays normalized, nonnegative and continuous across a whole day',()=>{
 let prev;
 for(let minute=0;minute<=1440;minute++){
  const t=islandTime(new Date(2026,9,9,0,minute));
  const weights=[t.day,t.dusk,t.night];
  assert.ok(weights.every(n=>Number.isFinite(n)&&n>=0&&n<=1));
  assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-9);
  if(prev)weights.forEach((n,i)=>assert.ok(Math.abs(n-prev[i])<=1/60+1e-9));
  prev=weights;
 }
});
test('preview modes keep real local clock and scheduler wakes at the next minute',()=>{
 const d=new Date(2026,9,9,17,24);
 assert.equal(islandTime(d,'day').phase,'day');assert.equal(islandTime(d,'day').clock,'17:24');
 for(const mode of ['auto','morning','day','evening','night'])assert.equal(validTimeMode(mode),mode);
 assert.equal(validTimeMode('invalid'),'auto');
 assert.equal(clockDelay(59999),26);assert.equal(clockDelay(60000),60025);
});
test('mobile, weak CPU and data saver keep GPU buffers bounded',()=>{
 for(const [width,height,dpr,cores,saveData] of [[390,377,3,8,false],[1920,760,2,8,false],[1600,710,2,4,false],[1600,710,3,8,true]]){
  const b=graphicsBudget({width,height,dpr,cores,saveData});
  assert.ok(width*height*b.pixelRatio**2<=(b.low?650000:1300000)+1);
  assert.equal(b.shadows,!b.low);assert.equal(b.fps,b.low?24:30);
 }
});
test('all six destinations are real finite mesh geometry with eight waterfall anchors',()=>{
 const m=buildIslandModels();let vertices=0,meshes=0;
 assert.equal(m.anchors.length,6);assert.deepEqual(m.anchors.map(a=>a.id),ISLAND_DISTRICTS.map(a=>a.id));
 assert.equal(m.falls.length,8);assert.ok(m.falls.every(f=>f.top>f.bottom&&f.width>1));
 const geos=new Set(),mats=new Set();
 m.world.traverse(o=>{if(!o.isMesh)return;meshes++;const p=o.geometry.getAttribute('position');vertices+=p.count;assert.ok([...p.array].every(Number.isFinite));geos.add(o.geometry);for(const mat of Array.isArray(o.material)?o.material:[o.material]){assert.equal(mat.map,null);mats.add(mat);}});
 assert.ok(vertices>10000);assert.ok(meshes<40,'static meshes must stay batched');
 geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
});
