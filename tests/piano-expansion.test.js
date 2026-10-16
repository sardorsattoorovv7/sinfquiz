import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {NEW_SONGS,SONG_REPERTOIRE,matchesPianoSearch,requiresMidi} from '../src/piano-repertoire.js';
import {parseMidi,guideGroups,solfegeName} from '../src/piano-music.js';

test('twenty new melodies retain exact downloadable MIDI notes, source types and pickup rests',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/piano/expansion-7.39/manifest.json',import.meta.url)));
 assert.equal(NEW_SONGS.length,20);assert.equal(SONG_REPERTOIRE.length,72);
 assert.equal(new Set(SONG_REPERTOIRE.map(t=>t.id)).size,72);
 assert.equal(NEW_SONGS.filter(t=>t.sourceType==='ready-midi').length,5);
 assert.equal(NEW_SONGS.filter(t=>t.sourceType==='score-transcription').length,15);
 assert.equal(NEW_SONGS.filter(t=>t.language==='tr').length,9);assert.equal(NEW_SONGS.filter(t=>t.language==='hi').length,10);
 const signatures=new Set();let notes=0;
 for(const track of NEW_SONGS){
  const report=manifest.tracks.find(t=>t.id===track.id),bytes=fs.readFileSync(new URL('../public'+track.sourceMidi,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),report.clipSha256);
  assert.equal(track.kind,'ready');assert.equal(requiresMidi(track),false);assert.equal(track.duration,30);
  assert.match(report.sourceSha256,/^[a-f0-9]{64}$/);assert.equal(report.sourceType,track.sourceType);
  assert.equal(report.generatedAccompaniment,false);assert.equal(report.melodyOnly,true);
  const parsed=parseMidi(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),{channelHands:{0:'right'}});
  assert.equal(track.events.length,parsed.events.length);assert.ok(guideGroups(track.events,'right').length>=15);
  for(let i=0;i<parsed.events.length;i++){
   const n=track.events[i],raw=parsed.events[i];assert.equal(n.midi,raw.midi);assert.equal(n.hand,'right');
   assert.ok(Math.abs(n.time-raw.time-report.leadingRest)<.00002,track.title);
   assert.ok(Math.abs(n.duration-raw.duration)<.00002);assert.ok(n.time>=0&&n.time+n.duration<=30.003);
  }
  signatures.add(track.events.map(n=>n.midi+':'+n.time).join(','));notes+=track.events.length;
 }
 assert.equal(signatures.size,20);assert.equal(notes,1209);
 const pickup=NEW_SONGS.find(t=>t.id==='new-kara-sevda-anlatamam');assert.equal(pickup.events[0].time,.46875);
});

test('the requested chorus, series and Uzbek film names resolve to their distinct melodies',()=>{
 const find=q=>NEW_SONGS.filter(t=>matchesPianoSearch(t,q));
 const training=find('Dua Lipa Training Season')[0];assert.match(training.section,/Chorus, 21–28/);assert.equal(training.bpm,64);assert.equal(training.album,'Radical Optimism');
 assert.equal(find('Chuqur')[0].series,'Çukur');assert.equal(find('Kara Sevda').length,2);
 assert.equal(find('Ish va qasos').length,2);assert.equal(find('Ishq va Qasos').length,2);
 assert.deepEqual(find('Ishq va qasos').map(t=>t.title),['Tum Hi Aana','Thodi Jagah']);
 assert.ok(find('Kal Ho Naa Ho').length);assert.ok(find('Janam Janam').length);
 assert.equal(NEW_SONGS.filter(t=>t.simplifiedRhythm).length,3);
});

test('every new card plays offline and teaches the actual melody; Training Season chorus can be completed',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const name of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location','KeyboardEvent','File'])globalThis[name]=dom.window[name];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};
 const React=(await import('react')).default,{render,within,fireEvent,act,cleanup}=await import('@testing-library/react');
 const scheduled=[],requests=[],played=[],engine={ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},apply(){},setSustain(){},noteOn(n){played.push(n);return played.length},release(){},stopScope(){},allOff(){},schedule(...args){scheduled.push(args)},tick(){},dispose(){}};
 const vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'}),previousFetch=globalThis.fetch;
 try{
  const {default:Piano}=await vite.ssrLoadModule('/src/CinemaPiano.jsx');
  globalThis.fetch=async url=>{requests.push(String(url));throw Error('Ready lessons must not download remote files');};
  const view=render(React.createElement(Piano,{createAudio:()=>engine})),ui=within(view.container);
  assert.ok(ui.getByRole('heading',{level:1,name:'Training Season — naqorat'}));
  assert.equal(ui.getByRole('button',{name:'Yangi kuylar',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(view.container.querySelectorAll('.cp-track').length,20);
  const pointer=(target,type,id)=>{const e=new window.MouseEvent(type,{bubbles:true,button:0});Object.defineProperty(e,'pointerId',{value:id});fireEvent(target,e)};
  let id=1;
  for(const track of NEW_SONGS){
   const card=[...view.container.querySelectorAll('.cp-track-select')].find(b=>b.querySelector('b').textContent===track.title);assert.ok(card);fireEvent.click(card);
   assert.equal(view.container.querySelector('.cp-film-upload'),null);assert.ok(ui.getByRole('heading',{level:1,name:track.title}));
   assert.equal(ui.getByRole('link',{name:track.sourceLabel}).href,track.sourceUrl);
   fireEvent.click(ui.getByRole('button',{name:'Tinglash',exact:true}));scheduled.length=0;
   await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Kuyni tinglash',exact:true})));
   // Anlatamam starts with a written eighth rest. Advance the audio clock
   // through that pickup rather than incorrectly requiring a note at t=0.
   if(!scheduled.length)await act(async()=>{engine.ctx.currentTime+=track.events[0].time+.06;await new Promise(resolve=>setTimeout(resolve,40))});
   assert.ok(scheduled.length>0,track.title);assert.ok(scheduled.every(a=>track.events.some(n=>n.midi===a[0])));
   fireEvent.click(ui.getByRole('button',{name:'Ijroni to‘xtatish'}));fireEvent.click(ui.getByRole('button',{name:'O‘rganish',exact:true}));
   const steps=guideGroups(track.events,'right');assert.equal(view.container.querySelector('.cp-current-notes strong').textContent,solfegeName(steps[0].notes[0]));
   fireEvent.click(ui.getByRole('button',{name:'O‘rganishni boshlash',exact:true}));
   const wrong=[...view.container.querySelectorAll('[data-note]')].find(k=>!steps[0].notes.includes(Number(k.dataset.note)));
   act(()=>{pointer(wrong,'pointerdown',id);pointer(window,'pointerup',id++)});assert.match(view.container.querySelector('.cp-guide-status').textContent,new RegExp('0/'+steps.length));
   for(const step of track.id==='new-training-season-chorus'?steps:steps.slice(0,2))for(const n of step.notes){
    const key=view.container.querySelector('[data-note="'+n+'"]');assert.ok(key,track.title+' / '+n);
    act(()=>{pointer(key,'pointerdown',id);pointer(window,'pointerup',id++)});
   }
   if(track.id==='new-training-season-chorus'){
    assert.match(view.container.querySelector('.cp-guide-status').textContent,/Mashq tugadi/);
    assert.equal(JSON.parse(localStorage.getItem('sq-cinema-piano:guest:progress'))[track.id].steps,steps.length);
   }else assert.match(view.container.querySelector('.cp-guide-status').textContent,new RegExp('2/'+steps.length));
  }
  fireEvent.change(ui.getByRole('textbox',{name:'Piano kuyini qidirish'}),{target:{value:'Ish va qasos'}});
  assert.equal(view.container.querySelectorAll('.cp-track').length,2);
  fireEvent.change(ui.getByRole('textbox',{name:'Piano kuyini qidirish'}),{target:{value:''}});
  fireEvent.change(ui.getByRole('combobox',{name:'Kayfiyat bo‘yicha saralash'}),{target:{value:'Turk seriallari'}});assert.equal(view.container.querySelectorAll('.cp-track').length,9);
  fireEvent.change(ui.getByRole('combobox',{name:'Kayfiyat bo‘yicha saralash'}),{target:{value:'Hindcha'}});assert.equal(view.container.querySelectorAll('.cp-track').length,10);
  assert.deepEqual(requests,[]);
 }finally{globalThis.fetch=previousFetch;cleanup();await vite.close();dom.window.close()}
});
