import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {pianoStageLayout} from '../src/use-piano-stage.js';
import {NEW_SONGS} from '../src/piano-repertoire.js';
import {guideGroups} from '../src/piano-music.js';

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
