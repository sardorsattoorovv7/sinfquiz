import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {BOARD_STYLES,TIMER_STYLES,canUseClassroom,freshClassroom,freshTimer,validateClassroom,validateBoardObject,boardStyle,visibleInk,contrastRatio,objectBounds,shapeFromPoints,translateObject,resizeObject,hitObject,eraseObjects,taskObjects,timerRemaining,timerAction,formatTime,numberPool,randomIndex,chooseNumbers,rmsLevel,relativeNoise,smoothNoise,noiseStatus} from '../src/classroom/model.js';
import {restoredStudioView} from '../src/studio-navigation.js';
const stroke=()=>({id:'pen',type:'stroke',brush:'pen',width:4,color:'auto',points:Array.from({length:11},(_,i)=>({x:100+i*20,y:150,pressure:1}))});
const config=(patch={})=>({...freshClassroom().random,...patch});
const zero={getRandomValues(a){a.fill(0);return a;}};

test('Sinfxona is restricted to authenticated teacher/admin, including restored links',()=>{
 for(const role of ['teacher','admin']){const u={id:'staff',role};assert.equal(canUseClassroom(u),true);assert.equal(restoredStudioView('#sinfxona',u),'classroom');}
 for(const u of [null,{id:'pupil',role:'student'},{role:'teacher'},{id:'guest',role:'guest'},{id:'evil',role:'Teacher'}]){assert.equal(canUseClassroom(u),false);assert.notEqual(restoredStudioView('#sinfxona',u),'classroom');}
});
test('Ten board backgrounds preserve semantic ink while remaining legible',()=>{
 assert.equal(new Set(BOARD_STYLES.map(x=>x.id)).size,10);assert.equal(TIMER_STYLES.length,10);
 for(const s of BOARD_STYLES){for(const ink of ['auto','#ffffff','#142c48','#e9f5ee','#ffeb00'])assert.ok(contrastRatio(visibleInk(ink,s.id,true),s.background)>=4.5);assert.equal(boardStyle(s.id).id,s.id);}
 const d=freshClassroom();d.pages[0].objects=[stroke()];for(const s of BOARD_STYLES){d.pages[0].style=s.id;assert.deepEqual(validateClassroom(d).pages[0].objects,[stroke()]);}
});
test('Damaged drafts and executable/remote images are rejected safely',()=>{
 assert.equal(validateClassroom({version:1,pages:[null]}),null);
 const d=freshClassroom();d.pages.push({...d.pages[0]});assert.equal(validateClassroom(d),null);
 for(const src of ['javascript:alert(1)','https://example.org/photo.png','data:image/svg+xml;base64,PHN2Zz4=','data:text/html;base64,PHNjcmlwdD4='])assert.equal(validateBoardObject({type:'image',src}),null);
 assert.ok(validateBoardObject({type:'image',src:'data:image/png;base64,aGVsbG8='}));
 assert.equal(validateBoardObject({type:'stroke',points:[{x:NaN,y:1},null]}),null);
 const fixed=validateBoardObject({type:'rectangle',x:1590,y:880,w:400,h:300,color:'red',width:200});assert.equal(fixed.x,1200);assert.equal(fixed.y,600);assert.equal(fixed.color,'auto');assert.equal(fixed.width,64);
 const broken=freshClassroom();broken.random.history=[null,{values:[2,3],at:8}];assert.equal(validateClassroom(broken).random.history.length,1);
});
test('Object movement and resizing keep coordinates inside the board',()=>{
 const o={id:'box',type:'rectangle',x:100,y:100,w:200,h:120,width:3,color:'auto'};
 assert.deepEqual(translateObject(o,-500,-500),{...o,x:0,y:0});const moved=translateObject(o,9999,9999);assert.equal(moved.x+moved.w,1600);assert.equal(moved.y+moved.h,900);
 const bigger=resizeObject(o,5000,2000);assert.equal(bigger.w,1500);assert.equal(bigger.h,800);
 const resized=resizeObject(stroke(),400,90);assert.ok(objectBounds(resized).w>390);assert.equal(resized.points[0].pressure,1);
});
test('Reversed arrows use the actual segment, and a partial eraser leaves both sides',()=>{
 const arrow={id:'a',type:'arrow',x:100,y:100,w:200,h:100,flipX:true,flipY:false,width:2};assert.equal(hitObject(arrow,{x:200,y:150},0),true);assert.equal(hitObject(arrow,{x:100,y:100},1),false);
 const erased=eraseObjects([stroke()],{x:200,y:150},14);assert.equal(erased.length,2);assert.ok(erased.every(o=>o.points.every(p=>Math.abs(p.x-200)>14)));assert.equal(erased[0].points[0].x,100);assert.equal(erased[1].points.at(-1).x,300);
});
test('All four task templates contain editable work, fit the board and keep images proportional',()=>{
 const image={id:'i',type:'image',x:0,y:0,w:720,h:360,src:'data:image/png;base64,aGVsbG8=',color:'auto',width:1};
 for(const kind of ['solve','blanks','table','image']){
  const objects=taskObjects(kind,'Kasrlar','Hisoblang va qanday yechganingizni tushuntiring.',image);assert.ok(objects.length>=3);
  for(const o of objects){const b=objectBounds(o);assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=1600&&b.y+b.h<=900,`${kind}: ${o.type}`);}
  if(kind==='table')assert.equal(objects.filter(o=>o.type==='rectangle').length,12);
  if(kind==='image'){const o=objects.find(o=>o.type==='image');assert.equal(o.w/o.h,2);}
 }
});
test('Timer counts elapsed wall time rather than tab ticks and pauses precisely',()=>{
 const t=timerAction(timerAction(freshTimer(),'set',1000,90000),'start',1000);
 assert.equal(timerRemaining(t,41000),50000);assert.equal(timerRemaining(t,100000),0);
 const paused=timerAction(t,'pause',41000);assert.equal(paused.remainingMs,50000);assert.equal(timerRemaining(paused,900000),50000);
 const resumed=timerAction(paused,'start',900000);assert.equal(resumed.deadline,950000);assert.equal(timerRemaining(resumed,920000),30000);
 assert.equal(timerAction(resumed,'reset',930000).remainingMs,90000);
});
test('Every timer visualization retains the same deadline; adjustments and zero are coherent',()=>{
 let t=timerAction(timerAction(freshTimer(),'set',0,10000),'start',0);
 for(const s of TIMER_STYLES){t={...t,style:s.id};assert.equal(timerRemaining(t,3500),6500);assert.equal(t.deadline,10000);}
 t=timerAction(t,'adjust',5000,60000);assert.equal(t.deadline,70000);assert.equal(timerRemaining(t,5000),65000);
 t=timerAction(t,'adjust',6000,-120000);assert.equal(t.status,'finished');assert.equal(timerRemaining(t,6000),0);
 const added=timerAction(t,'adjust',7000,60000);assert.equal(added.status,'paused');assert.equal(added.remainingMs,60000);
 assert.equal(timerAction(added,'adjust',7000,'oops').remainingMs,60000);
 assert.equal(formatTime(3600500),'01:00:01');assert.equal(formatTime(999),'00:01');assert.equal(formatTime(0),'00:00');
});
test('Number inputs reject impossible ranges and normalize repeated entries',()=>{
 assert.deepEqual(numberPool(config({mode:'list',list:'3, 7; 3\n12 -2'})).values,[-2,3,7,12]);assert.equal(numberPool(config({mode:'list',list:'3, 3, 3'})).duplicates,2);
 assert.deepEqual(numberPool(config({mode:'limit',end:'3'})).values,[1,2,3]);
 for(const patch of [{start:'5',end:'2'},{start:'',end:'3'},{end:'1.2'},{start:'1',end:'10001'},{mode:'list',list:''},{mode:'list',list:'2, abc'},{mode:'list',list:'1e3'}])assert.throws(()=>numberPool(config(patch)));
});
test('Uniform random index rejects the biased tail instead of mapping it modulo N',()=>{
 const samples=[4294967295,4];let calls=0;const crypto={getRandomValues(a){a[0]=samples[calls++];return a;}};assert.equal(randomIndex(3,crypto),1);assert.equal(calls,2);
 assert.equal(randomIndex(1,zero),0);assert.throws(()=>randomIndex(0,zero));
});
test('Non-repeat mode exhausts the pool, reset restores it, multiple draws are distinct',()=>{
 let c=config({mode:'limit',end:'6',count:2});c=chooseNumbers(c,zero,1);assert.deepEqual(c.result,[1,2]);c=chooseNumbers(c,zero,2);assert.deepEqual(c.result,[3,4]);c=chooseNumbers(c,zero,3);assert.deepEqual(c.result,[5,6]);assert.throws(()=>chooseNumbers(c,zero,4),/Faqat 0/);
 c=chooseNumbers({...c,used:[],result:[],history:[]},zero,5);assert.deepEqual(c.result,[1,2]);assert.equal(c.history.length,1);
 const repeat=chooseNumbers({...c,unique:false},zero,6);assert.deepEqual(repeat.result,[1,2]);assert.equal(repeat.used.length,0);
 const all=chooseNumbers(config({mode:'limit',end:'30',count:30}),webcrypto);assert.equal(new Set(all.result).size,30);
});
test('Noise is relative, monotonic and smoothed so isolated sounds cannot jump to 100',()=>{
 assert.equal(rmsLevel(new Float32Array([.5,-.5])),.5);assert.equal(rmsLevel([]),0);
 assert.ok(relativeNoise(.2)>relativeNoise(.01));assert.equal(relativeNoise(0),0);
 const first=smoothNoise(0,100,.08);assert.ok(first>0&&first<20);assert.ok(smoothNoise(first,0,.08)<first);
 assert.equal(noiseStatus(20,55),'Tinch');assert.equal(noiseStatus(45,55),'Ovoz ko‘tarilyapti');assert.equal(noiseStatus(70,55),'Chegaradan oshdi');
});

test('Aylana retains a circle during a diagonal drag, resize and restore',()=>{
 const o=shapeFromPoints('ellipse',{x:500,y:300},{x:700,y:380},{id:'circle',width:4,color:'auto'});assert.equal(o.w,200);assert.equal(o.h,200);
 const n=resizeObject(o,300,200);assert.equal(n.w,300);assert.equal(n.h,300);assert.equal(validateBoardObject(n).circle,true);
 const edge=shapeFromPoints('ellipse',{x:1500,y:800},{x:1600,y:900},{id:'edge'});assert.ok(edge.x+edge.w<=1600&&edge.y+edge.h<=900);
});
