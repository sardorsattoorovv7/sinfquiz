import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {pianoStageLayout} from '../src/use-piano-stage.js';
import {NEW_SONGS} from '../src/piano-repertoire.js';
import {guideGroups,PIANO_LIBRARY} from '../src/piano-music.js';

test('stage geometry fills small phones, tablets and wide boards with reversible 90 degree rotation',()=>{
 for(const [w,h] of [[320,640],[390,844],[768,1024],[1024,768],[1920,1080],[3840,2160]]){
  const x=pianoStageLayout(w,h);
  assert.equal(x.rotated,h>w);assert.ok(x.stageWidth>=x.stageHeight);
  assert.equal(x.stageWidth*x.stageHeight,w*h);
  const turned=pianoStageLayout(w,h,x.rotated?'upright':'sideways');
  assert.notEqual(turned.rotated,x.rotated);assert.equal(turned.stageWidth,x.stageHeight);assert.equal(turned.stageHeight,x.stageWidth);
 }
 assert.deepEqual(pianoStageLayout(320,640),{width:320,height:640,rotated:true,stageWidth:640,stageHeight:320});
 assert.equal(pianoStageLayout(390,844,'upright').rotated,false);
});

async function setup(){
 const dom=new JSDOM('<!doctype html><html data-design="paper" data-theme="light"><body><aside id="already-inert" inert></aside></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const n of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location','KeyboardEvent','File'])globalThis[n]=dom.window[n];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 Object.defineProperty(window,'innerWidth',{value:390,writable:true});Object.defineProperty(window,'innerHeight',{value:844,writable:true});
 globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};document.body.style.overflow='scroll';
 const React=(await import('react')).default,lib=await import('@testing-library/react');
 const played=[],released=[],engine={ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},apply(){},setSustain(){},noteOn(n){played.push(n);return played.length},release(n){released.push(n)},stopScope(){},allOff(){},schedule(){},tick(){},dispose(){}};
 const vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 const {default:Piano}=await vite.ssrLoadModule('/src/CinemaPiano.jsx');
 return {dom,lib,engine,played,released,render:()=>lib.render(React.createElement(Piano,{createAudio:()=>engine})),
  async dispose(){lib.cleanup();await vite.close();dom.window.close()}};
}

test('unsupported mobile fullscreen keeps a rotated playable tutorial and preserves progress on return',async()=>{
 const s=await setup(),{within,fireEvent,act}=s.lib;
 try{
  const view=s.render(),ui=within(view.container);
  fireEvent.click(ui.getByRole('button',{name:'O‘rganish',exact:true}));fireEvent.click(ui.getByRole('button',{name:'O‘rganishni boshlash',exact:true}));
  await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Yonlama piano rejimini ochish'})));
  const body=within(document.body),dialog=body.getByRole('dialog',{name:'Yonlama piano va tutorial'});
  assert.ok(dialog.classList.contains('is-rotated'));assert.equal(dialog.style.getPropertyValue('--cp-vw'),'390px');assert.equal(dialog.style.getPropertyValue('--cp-vh'),'844px');
  assert.ok(view.container.hasAttribute('inert'));assert.equal(dialog.closest('[inert]'),null);assert.equal(document.body.style.overflow,'hidden');assert.equal(document.activeElement,dialog);
  const pointer=(target,type,id)=>{const e=new window.MouseEvent(type,{bubbles:true,button:0});Object.defineProperty(e,'pointerId',{value:id});fireEvent(target,e)};
  const steps=guideGroups(NEW_SONGS[0].events,'right');let id=1;
  for(const group of steps.slice(0,2))for(const note of group.notes){
   const key=dialog.querySelector('[data-note="'+note+'"]');assert.ok(key);
   act(()=>{pointer(key,'pointerdown',id);pointer(window,'pointerup',id++)});
  }
  assert.match(dialog.querySelector('.cp-stage-title small').textContent,new RegExp('2 / '+steps.length));
  const key=dialog.querySelector('[data-note="60"]');act(()=>pointer(key,'pointerdown',id));assert.ok(dialog.querySelector('.is-held'));
  fireEvent.click(body.getByRole('button',{name:'Piano ko‘rinishini 90 darajaga aylantirish'}));
  assert.equal(dialog.classList.contains('is-rotated'),false);assert.ok(dialog.classList.contains('is-narrow'));assert.equal(dialog.querySelector('.is-held'),null);assert.ok(s.released.length>=3);
  const summary=body.getByLabelText('Yonlama piano sozlamalari');fireEvent.click(summary);
  const volume=body.getByRole('slider',{name:/Yonlama ovoz balandligi/});fireEvent.change(volume,{target:{value:'0.96'}});
  assert.equal(volume.value,'0.96');
  fireEvent.change(body.getByRole('combobox',{name:'Yonlama nota yozuvi'}),{target:{value:'letters'}});
  assert.equal(dialog.querySelector('[data-note="60"] .cp-note-label').textContent,'C4');
  document.documentElement.dataset.theme='dark';assert.equal(dialog.closest('.paper-workshop')!==null,true);
  // A physical orientation change restores automatic layout, without a remount.
  window.innerWidth=844;window.innerHeight=390;
  await act(async()=>{fireEvent(window,new window.Event('orientationchange'));await new Promise(resolve=>requestAnimationFrame(resolve))});
  assert.equal(dialog.classList.contains('is-rotated'),false);assert.equal(dialog.style.getPropertyValue('--cp-vw'),'844px');
  fireEvent.click(body.getByRole('button',{name:'Oddiy piano ko‘rinishiga qaytish'}));
  assert.equal(document.querySelector('.cp-stage-portal'),null);assert.equal(view.container.hasAttribute('inert'),false);assert.ok(document.getElementById('already-inert').hasAttribute('inert'));
  assert.equal(document.body.style.overflow,'scroll');assert.equal(document.activeElement,view.container.querySelector('.cp-stage-launch'));
  assert.match(view.container.querySelector('.cp-guide-status').textContent,new RegExp('2/'+steps.length));
  assert.equal(JSON.parse(localStorage.getItem('sq-cinema-piano:guest:settings')).notation,'letters');
  assert.equal(JSON.parse(localStorage.getItem('sq-cinema-piano:guest:settings')).volume,.96);
  assert.equal(ui.getByRole('slider',{name:/^Ovoz balandligi/}).value,'0.96');
 }finally{await s.dispose()}
});

test('native fullscreen uses an outer surface, locks landscape, and unlocks after external exit',async()=>{
 const s=await setup(),{within,fireEvent,act}=s.lib;let full=null,locks=0,unlocks=0,requested=null;
 try{
  Object.defineProperty(document,'fullscreenElement',{get:()=>full,configurable:true});
  window.HTMLElement.prototype.requestFullscreen=async function(){requested=this;full=this;document.dispatchEvent(new window.Event('fullscreenchange'))};
  document.exitFullscreen=async()=>{full=null;document.dispatchEvent(new window.Event('fullscreenchange'))};
  Object.defineProperty(window.screen,'orientation',{value:{async lock(value){assert.equal(value,'landscape');locks++},unlock(){unlocks++}},configurable:true});
  const view=s.render(),ui=within(view.container);await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Pianinoni to‘liq ekran qilish'})));
  assert.ok(document.querySelector('.cp-stage-open'));assert.ok(requested.classList.contains('cp-stage-portal'));assert.equal(locks,1);
  await act(async()=>{full=null;document.dispatchEvent(new window.Event('fullscreenchange'))});
  assert.equal(document.querySelector('.cp-stage-open'),null);assert.equal(unlocks,1);assert.equal(document.body.style.overflow,'scroll');
 }finally{await s.dispose()}
});

test('rejected fullscreen and orientation locks leave CSS rotation working and Escape restores the page',async()=>{
 const s=await setup(),{within,fireEvent,act}=s.lib;let attempts=0;
 try{
  window.HTMLElement.prototype.requestFullscreen=async()=>{throw new Error('unsupported')};
  Object.defineProperty(window.screen,'orientation',{value:{async lock(){attempts++;throw new Error('not supported')},unlock(){}},configurable:true});
  const view=s.render(),ui=within(view.container);await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Kuyni tinglash',exact:true})));
  await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Pianinoni to‘liq ekran qilish'})));
  assert.ok(document.querySelector('.cp-stage-open.is-rotated'));assert.equal(attempts,1);
  fireEvent.keyDown(document,{key:'Escape',code:'Escape'});
  assert.equal(document.querySelector('.cp-stage-open'),null);assert.equal(view.container.hasAttribute('inert'),false);assert.equal(document.body.style.overflow,'scroll');
  assert.ok(ui.getByRole('button',{name:'Kuyni tinglash',exact:true}),'Escape also pauses the existing audio transport');
 }finally{await s.dispose()}
});

test('closing during a pending fullscreen request cannot reopen or leak an orientation lock',async()=>{
 const s=await setup(),{within,fireEvent,act}=s.lib;let full=null,complete,locks=0,exits=0;
 try{
  Object.defineProperty(document,'fullscreenElement',{get:()=>full,configurable:true});
  window.HTMLElement.prototype.requestFullscreen=function(){return new Promise(resolve=>{complete=()=>{full=this;resolve()}})};
  document.exitFullscreen=async()=>{exits++;full=null;document.dispatchEvent(new window.Event('fullscreenchange'))};
  Object.defineProperty(window.screen,'orientation',{value:{async lock(){locks++},unlock(){}},configurable:true});
  const view=s.render(),ui=within(view.container);fireEvent.click(ui.getByRole('button',{name:'Pianinoni to‘liq ekran qilish'}));
  fireEvent.click(within(document.body).getByRole('button',{name:'Oddiy piano ko‘rinishiga qaytish'}));
  await act(async()=>complete());assert.equal(locks,0);assert.equal(full,null);assert.equal(exits,1);assert.equal(document.querySelector('.cp-stage-open'),null);
 }finally{await s.dispose()}
});

test('rotated phone library selects a real song or practice without leaving stage and resets the old guide safely',async()=>{
 const s=await setup(),{within,fireEvent,act}=s.lib;
 try{
  localStorage.setItem('sq-cinema-piano:guest:favorites',JSON.stringify([NEW_SONGS[0].id]));
  localStorage.setItem('sq-cinema-piano:guest:progress',JSON.stringify({[NEW_SONGS[0].id]:{steps:49,accuracy:100,date:1}}));
  const view=s.render(),ui=within(view.container);assert.equal(view.container.querySelector('.cp-brand b').textContent,'PIANO');
  fireEvent.click(ui.getByRole('button',{name:'O‘rganish',exact:true}));fireEvent.click(ui.getByRole('button',{name:'O‘rganishni boshlash',exact:true}));
  await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Yonlama piano rejimini ochish'})));
  const body=within(document.body),dialog=body.getByRole('dialog',{name:'Yonlama piano va tutorial'}),stage=within(dialog);
  const note=guideGroups(NEW_SONGS[0].events,'right')[0].notes[0],key=dialog.querySelector('[data-note="'+note+'"]');
  const pointer=(target,type,id)=>{const e=new window.MouseEvent(type,{bubbles:true,button:0});Object.defineProperty(e,'pointerId',{value:id});fireEvent(target,e)};
  act(()=>{pointer(key,'pointerdown',1);pointer(window,'pointerup',1);pointer(key,'pointerdown',2)});
  assert.ok(dialog.querySelector('.is-held'));fireEvent.click(stage.getByRole('button',{name:'Yonlama kuyni almashtirish'}));
  const region=stage.getByRole('region',{name:'Yonlama kuylar kutubxonasi'}),library=within(region),search=library.getByRole('textbox',{name:'Yonlama kuyni qidirish'});
  assert.equal(document.activeElement,search);assert.equal(dialog.querySelector('.is-held'),null);assert.ok(s.released.length>=2);
  assert.ok(dialog.querySelector('.cp-stage-bar').hasAttribute('inert'));assert.ok(dialog.querySelector('.cp-layout').hasAttribute('inert'));
  assert.equal(region.querySelectorAll('.cp-stage-song-list button').length,79);assert.equal(region.closest('.cp-stage-open'),dialog);assert.ok(dialog.classList.contains('is-rotated'));
  fireEvent.change(search,{target:{value:'Tujh Mein Rab'}});const next=NEW_SONGS.find(t=>t.id==='selected-tujh-mein-rab-dikhta-hai-chorus');
  assert.equal(region.querySelectorAll('.cp-stage-song-list button').length,1);fireEvent.click(library.getByRole('button',{name:new RegExp(next.title)}));
  assert.equal(document.querySelector('.cp-stage-open'),dialog);assert.equal(stage.queryByRole('region',{name:'Yonlama kuylar kutubxonasi'}),null);
  assert.equal(dialog.querySelector('#cp-stage-current-song').textContent,next.title);assert.match(dialog.querySelector('.cp-stage-title small').textContent,/0 \/ 32/);
  assert.equal(dialog.querySelector('.cp-stage-bar').hasAttribute('inert'),false);assert.equal(document.activeElement,stage.getByRole('button',{name:'Yonlama kuyni almashtirish'}));
  assert.ok(stage.getByRole('button',{name:'O‘rganishni boshlash',exact:true}));
  assert.equal(JSON.parse(localStorage.getItem('sq-cinema-piano:guest:progress'))[NEW_SONGS[0].id].accuracy,100);
  assert.deepEqual(JSON.parse(localStorage.getItem('sq-cinema-piano:guest:favorites')),[NEW_SONGS[0].id]);
  fireEvent.click(stage.getByRole('button',{name:'Yonlama kuyni almashtirish'}));const picker=within(stage.getByRole('region',{name:'Yonlama kuylar kutubxonasi'}));
  fireEvent.change(picker.getByRole('textbox'),{target:{value:'no-song-xyz'}});assert.ok(picker.getByText(/Mos kuy topilmadi/));
  fireEvent.click(picker.getByRole('button',{name:'Meniki',exact:true}));assert.ok(picker.getByText(/Shaxsiy MIDI hali yo‘q/));
  fireEvent.click(picker.getByRole('button',{name:'Mashqlar',exact:true}));assert.equal(dialog.querySelectorAll('.cp-stage-song-list button').length,38);
  fireEvent.click(picker.getByRole('button',{name:new RegExp(PIANO_LIBRARY[0].title)}));assert.equal(dialog.querySelector('#cp-stage-current-song').textContent,PIANO_LIBRARY[0].title);assert.ok(dialog.classList.contains('is-rotated'));
  fireEvent.click(stage.getByRole('button',{name:'Oddiy piano ko‘rinishiga qaytish'}));assert.ok(ui.getByRole('heading',{level:1,name:PIANO_LIBRARY[0].title}));
 }finally{await s.dispose()}
});

test('fullscreen song picker traps focus and Escape closes only the picker before restoring the full page',async()=>{
 const s=await setup(),{within,fireEvent,act}=s.lib;let full=null,locks=0,unlocks=0;
 try{
  Object.defineProperty(document,'fullscreenElement',{get:()=>full,configurable:true});
  window.HTMLElement.prototype.requestFullscreen=async function(){full=this;document.dispatchEvent(new window.Event('fullscreenchange'))};
  document.exitFullscreen=async()=>{full=null;document.dispatchEvent(new window.Event('fullscreenchange'))};
  Object.defineProperty(window.screen,'orientation',{value:{async lock(){locks++},unlock(){unlocks++}},configurable:true});
  const view=s.render(),ui=within(view.container);await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Pianinoni to‘liq ekran qilish'})));
  const dialog=document.querySelector('.cp-stage-open'),stage=within(dialog);fireEvent.click(stage.getByRole('button',{name:'Yonlama kuyni almashtirish'}));
  const region=stage.getByRole('region',{name:'Yonlama kuylar kutubxonasi'}),library=within(region);
  for(const node of region.querySelectorAll('button,input'))node.getClientRects=()=>[{width:44,height:44}];
  const first=library.getByRole('button',{name:'Yonlama kuylar ro‘yxatini yopish'}),last=[...region.querySelectorAll('button')].at(-1);
  act(()=>last.focus());fireEvent.keyDown(last,{key:'Tab'});assert.equal(document.activeElement,first);
  fireEvent.keyDown(first,{key:'Tab',shiftKey:true});assert.equal(document.activeElement,last);
  fireEvent.change(library.getByRole('textbox'),{target:{value:'Belki'}});assert.equal(region.querySelectorAll('.cp-stage-song-list button').length,1);
  fireEvent.keyDown(library.getByRole('textbox'),{key:'Escape',code:'Escape'});
  assert.equal(stage.queryByRole('region',{name:'Yonlama kuylar kutubxonasi'}),null);assert.equal(document.querySelector('.cp-stage-open'),dialog);assert.ok(full);assert.equal(locks,1);assert.equal(unlocks,0);
  assert.equal(document.activeElement,stage.getByRole('button',{name:'Yonlama kuyni almashtirish'}));
  await act(async()=>fireEvent.keyDown(document,{key:'Escape',code:'Escape'}));assert.equal(full,null);assert.equal(unlocks,1);assert.equal(document.querySelector('.cp-stage-open'),null);assert.equal(document.body.style.overflow,'scroll');
 }finally{await s.dispose()}
});

test('opening the phone search keyboard resizes the library without flipping its 90 degree orientation',async()=>{
 const s=await setup(),{within,fireEvent,act}=s.lib;
 try{
  const viewport=new window.EventTarget();Object.assign(viewport,{width:390,height:844,offsetLeft:0,offsetTop:0});Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});
  const view=s.render(),ui=within(view.container);await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Yonlama piano rejimini ochish'})));
  const dialog=document.querySelector('.cp-stage-open'),stage=within(dialog);fireEvent.click(stage.getByRole('button',{name:'Yonlama kuyni almashtirish'}));
  const search=within(stage.getByRole('region',{name:'Yonlama kuylar kutubxonasi'})).getByRole('textbox');assert.equal(document.activeElement,search);
  viewport.height=280;await act(async()=>{viewport.dispatchEvent(new window.Event('resize'));await new Promise(r=>requestAnimationFrame(r))});
  assert.ok(dialog.classList.contains('is-rotated'));assert.equal(dialog.style.getPropertyValue('--cp-vh'),'280px');assert.equal(document.activeElement,search);
  fireEvent.keyDown(search,{key:'Escape',code:'Escape'});viewport.height=844;await act(async()=>{viewport.dispatchEvent(new window.Event('resize'));await new Promise(r=>requestAnimationFrame(r))});
  assert.ok(dialog.classList.contains('is-rotated'));assert.equal(dialog.style.getPropertyValue('--cp-vh'),'844px');assert.equal(document.querySelector('[data-stage-library]'),null);
 }finally{await s.dispose()}
});
