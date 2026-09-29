import test from 'node:test';
import assert from 'node:assert/strict';
import {atlasTopics,atlasTopicById} from '../src/math-atlas-content.js';
import {distance,triangleMeasures,lineTable,lineY,equationSolution,transformPoint,solidMeasures,polygonArea} from '../src/math-atlas-math.js';

test('atlas: 5–11 sinf yo‘li to‘liq, tayanchlar mavjud, har sahna mazmunli',()=>{
 assert.equal(atlasTopics.length,55);
 assert.deepEqual([...new Set(atlasTopics.map(t=>t.grade))].sort((a,b)=>a-b),[5,6,7,8,9,10,11]);
 for(const topic of atlasTopics){for(const field of ['definition','reason','life','misconception','challenge'])assert.ok(topic[field].length>=12,`${topic.id}: ${field}`);for(const id of topic.prerequisites)assert.ok(atlasTopicById[id],`${topic.id}: ${id}`)}
 for(const id of ['son-chizigi','tenglik','chiziqli-funksiya','uchburchak','kochirish','kub','konus','shar','trigonometriya'])assert.ok(atlasTopicById[id]);
});
test('atlas: uchburchak burchaklari 180°, yuza asos × tik balandlik / 2',()=>{
 for(const c of [{x:0,y:4},{x:5,y:8},{x:-3,y:2}]){const t=triangleMeasures({x:0,y:0},{x:6,y:0},c);assert.ok(Math.abs(t.angles.reduce((a,b)=>a+b)-180)<1e-9);assert.equal(t.area,6*Math.abs(c.y)/2);assert.equal(t.height,Math.abs(c.y))}
 assert.equal(triangleMeasures({x:0,y:0},{x:3,y:0},{x:0,y:4}).sides[0],5);
 assert.equal(polygonArea([{x:0,y:0},{x:6,y:0},{x:0,y:4}]),12);
 assert.equal(distance({x:0,y:0},{x:3,y:4}),5);
});
test('atlas: tarozi ikki tomoniga bir xil amal, grafik jadvali va o‘zgarishlar',()=>{
 const x=equationSolution(3,2,17);assert.equal(x,5);for(const take of [0,1,2,5])assert.equal(3*x+(2-take),17-take);
 assert.deepEqual(lineTable(2,1).find(v=>v.x===3),{x:3,y:7});assert.equal(lineY(-1,4,3),1);
 const p={x:2,y:-1};const moved=transformPoint(p,{dx:3,dy:2,angle:90,scale:2,reflect:true});assert.ok(Math.abs(moved.x-5)<1e-10);assert.ok(Math.abs(moved.y+2)<1e-10);
});
test('atlas: sirt yuzi m², hajm m³ va yoyilma hisoblari',()=>{
 assert.deepEqual([solidMeasures('cube',{a:3}).volume,solidMeasures('cube',{a:3}).surface],[27,54]);
 assert.deepEqual([solidMeasures('cuboid',{a:2,b:3,c:4}).volume,solidMeasures('cuboid',{a:2,b:3,c:4}).surface],[24,52]);
 assert.equal(solidMeasures('pyramid',{a:3,h:6}).volume,3*3*6/3);
 assert.ok(Math.abs(solidMeasures('cone',{r:2,h:3}).volume*3-solidMeasures('cylinder',{r:2,h:3}).volume)<1e-9);
 assert.equal(solidMeasures('cube',{a:2}).faces,6);
 assert.deepEqual([solidMeasures('cylinder',{r:2,h:3}).faces,solidMeasures('cylinder',{r:2,h:3}).curvedSurfaces],[2,1]);
 assert.deepEqual([solidMeasures('cone',{r:2,h:3}).faces,solidMeasures('cone',{r:2,h:3}).curvedSurfaces],[1,1]);
 assert.deepEqual([solidMeasures('sphere',{r:2}).faces,solidMeasures('sphere',{r:2}).curvedSurfaces],[0,1]);
 assert.ok(solidMeasures('sphere',{r:2}).volume>solidMeasures('sphere',{r:1}).volume*7.99);
});
