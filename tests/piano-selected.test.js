import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {SELECTED_SONGS,NEW_SONGS,SONG_REPERTOIRE,matchesPianoSearch,requiresMidi} from '../src/piano-repertoire.js';
import {parseMidi,guideGroups,solfegeName} from '../src/piano-music.js';

test('Belki and Tujh retain source melody anchors, explicit rhythm and identical downloadable MIDI',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/piano/selected-7.41/manifest.json',import.meta.url)));
 const data=JSON.parse(fs.readFileSync(new URL('../data/piano-selected-7.41.json',import.meta.url)));
 assert.equal(SELECTED_SONGS.length,2);assert.equal(NEW_SONGS.length,27);assert.equal(SONG_REPERTOIRE.length,79);
 assert.equal(new Set(SONG_REPERTOIRE.map(t=>t.id)).size,79);
 const anchors=[[72,72,71,71,71,69,69,71],[60,68,70,68,67,67,65,63]];
 let total=0;
 for(const [index,track] of SELECTED_SONGS.entries()){
  const report=manifest.tracks.find(t=>t.id===track.id),source=data.tracks.find(t=>t.id===track.id);
  const bytes=fs.readFileSync(new URL('../public'+track.sourceMidi,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),report.clipSha256);
  assert.match(report.sourceSha256,/^[a-f0-9]{64}$/);assert.equal(report.sourceSha256,source.sourceSha256);
  assert.equal(track.sourceType,'score-transcription');assert.equal(track.kind,'ready');assert.equal(requiresMidi(track),false);
  assert.equal(track.duration,30);assert.equal(report.generatedAccompaniment,false);assert.equal(report.melodyOnly,true);
  assert.deepEqual(track.events.slice(0,8).map(n=>n.midi),anchors[index]);
  const parsed=parseMidi(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),{channelHands:{0:'right'}});
  assert.equal(track.events.length,parsed.events.length);assert.equal(guideGroups(track.events,'right').length,track.events.length);
  for(let i=0;i<track.events.length;i++){
   const n=track.events[i],raw=parsed.events[i],original=source.events[i];
   assert.equal(n.midi,raw.midi);assert.equal(n.midi,original.midi);assert.equal(n.hand,'right');
   assert.ok(n.midi>=21&&n.midi<=108&&n.time>=0&&n.duration>.03&&n.time+n.duration<=30.003);
   assert.ok(Math.abs(n.time-raw.time-report.leadingRest)<.00002);assert.ok(Math.abs(n.duration-raw.duration)<.00002);
   assert.ok(Math.abs(n.time-original.time)<.003);assert.ok(Math.abs(n.duration-original.duration)<.003);
  }
  total+=track.events.length;
 }
 assert.equal(total,81);
 const [belki,tujh]=SELECTED_SONGS;
 assert.equal(belki.bpm,66);assert.equal(belki.events.length,49);
 // Written bar 24: A quarter, quarter rest, then four eighths.
 const beat=60/66,bar24=belki.events.filter(n=>n.time>=28*beat-.001&&n.time<32*beat-.001);
 assert.deepEqual(bar24.map(n=>n.midi),[69,69,67,65,64]);
 assert.ok(Math.abs(bar24[1].time-bar24[0].time-2*beat)<.003);
 assert.ok(Math.abs(belki.events.at(-1).time+belki.events.at(-1).duration-30)<.003);
 assert.equal(tujh.simplifiedRhythm,true);assert.equal(tujh.bpm,64);assert.match(tujh.description,/soddalashtirilgan/);
 assert.deepEqual(tujh.events.slice(0,16).map(n=>n.midi),tujh.events.slice(16).map(n=>n.midi));
 for(let i=0;i<16;i++)assert.ok(Math.abs(tujh.events[i+16].time-tujh.events[i].time-15)<.003);
});

test('new choruses can be found by Turkish spelling, Uzbek actor name and film title',()=>{
 const find=q=>SELECTED_SONGS.filter(t=>matchesPianoSearch(t,q));
 assert.match(find('Dedubluman Belki')[0].artist,/Dedublüman/);
 assert.equal(find('Tujhme Rab')[0].movie,'Rab Ne Bana Di Jodi');
 assert.equal(find('Shohruxxon')[0].artist,'Roop Kumar Rathod');
 assert.equal(find('Shah Rukh Khan')[0].id,find('Rab Ne Bana Di Jodi')[0].id);
});

test('both selected choruses play offline and their entire Do–Re–Mi tutorial requires correct keys',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const name of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location','KeyboardEvent','File'])globalThis[name]=dom.window[name];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};
 const React=(await import('react')).default,{render,within,fireEvent,act,cleanup}=await import('@testing-library/react');
 const scheduled=[],requests=[],engine={ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},apply(){},setSustain(){},noteOn(){return 1},release(){},stopScope(){},allOff(){},schedule(...a){scheduled.push(a)},tick(){},dispose(){}};
 const vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'}),previousFetch=globalThis.fetch;
 try{
  const {default:Piano}=await vite.ssrLoadModule('/src/CinemaPiano.jsx');
  globalThis.fetch=async url=>{requests.push(String(url));throw Error('Bundled songs must not fetch external music')};
  const view=render(React.createElement(Piano,{createAudio:()=>engine})),ui=within(view.container);
  assert.equal(view.container.querySelectorAll('.cp-track').length,27);
  assert.ok(ui.getByRole('heading',{level:1,name:SELECTED_SONGS[0].title}));
  const pointer=(target,type,id)=>{const e=new window.MouseEvent(type,{bubbles:true,button:0});Object.defineProperty(e,'pointerId',{value:id});fireEvent(target,e)};
  let id=1;
  for(const track of SELECTED_SONGS){
   const card=[...view.container.querySelectorAll('.cp-track-select')].find(b=>b.querySelector('b').textContent===track.title);assert.ok(card);fireEvent.click(card);
   assert.ok(ui.getByRole('heading',{level:1,name:track.title}));assert.equal(view.container.querySelector('.cp-film-upload'),null);
   assert.equal(ui.getByRole('link',{name:track.sourceLabel}).href,track.sourceUrl);
   fireEvent.click(ui.getByRole('button',{name:'Tinglash',exact:true}));scheduled.length=0;
   await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Kuyni tinglash',exact:true})));
   assert.ok(scheduled.length&&scheduled.every(a=>track.events.some(n=>n.midi===a[0])));
   fireEvent.click(ui.getByRole('button',{name:'Ijroni to‘xtatish'}));fireEvent.click(ui.getByRole('button',{name:'O‘rganish',exact:true}));
   const groups=guideGroups(track.events,'right');assert.equal(view.container.querySelector('.cp-current-notes strong').textContent,solfegeName(groups[0].notes[0]));
   fireEvent.click(ui.getByRole('button',{name:'O‘rganishni boshlash',exact:true}));
   const wrong=[...view.container.querySelectorAll('[data-note]')].find(k=>!groups[0].notes.includes(Number(k.dataset.note)));
   act(()=>{pointer(wrong,'pointerdown',id);pointer(window,'pointerup',id++)});assert.match(view.container.querySelector('.cp-guide-status').textContent,new RegExp('0/'+groups.length));
   for(const group of groups)for(const note of group.notes){
    const key=view.container.querySelector('[data-note="'+note+'"]');assert.ok(key,track.title+' '+note);
    act(()=>{pointer(key,'pointerdown',id);pointer(window,'pointerup',id++)});
   }
   assert.match(view.container.querySelector('.cp-guide-status').textContent,/Mashq tugadi/);
   assert.equal(JSON.parse(localStorage.getItem('sq-cinema-piano:guest:progress'))[track.id].steps,groups.length);
  }
  fireEvent.change(ui.getByRole('textbox',{name:'Piano kuyini qidirish'}),{target:{value:'Rab Ne Bana Di Jodi'}});
  assert.equal(view.container.querySelectorAll('.cp-track').length,1);
  assert.deepEqual(requests,[]);
 }finally{globalThis.fetch=previousFetch;cleanup();await vite.close();dom.window.close()}
});
