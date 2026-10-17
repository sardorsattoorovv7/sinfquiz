import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {REQUESTED_SONGS,SELECTED_SONGS,NEW_SONGS,SONG_REPERTOIRE,matchesPianoSearch,requiresMidi} from '../src/piano-repertoire.js';
import {parseMidi,guideGroups,solfegeName} from '../src/piano-music.js';

test('five requested melodies match their downloadable MIDI, written rhythm and source anchors',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/piano/requested-7.40/manifest.json',import.meta.url)));
 assert.equal(REQUESTED_SONGS.length,5);assert.equal(NEW_SONGS.length,25+SELECTED_SONGS.length);assert.equal(SONG_REPERTOIRE.length,77+SELECTED_SONGS.length);
 assert.equal(new Set(SONG_REPERTOIRE.map(t=>t.id)).size,77+SELECTED_SONGS.length);
 const anchors={
  'requested-belalim-chorus':[66,67,64,66,67,64,66,67],
  'requested-bu-aksam-olurum-chorus':[64,69,69,69,69,71,72,71],
  'requested-calikusu-theme':[69,76,76,74,76,77,76,74],
  'requested-unutmak-istiyorum-hook':[71,71,71,71,71,71,64,67],
  'requested-diet-mountain-dew':[72,72,72,72,72,72,72,72],
 };
 let notes=0;
 for(const track of REQUESTED_SONGS){
  const report=manifest.tracks.find(t=>t.id===track.id),b=fs.readFileSync(new URL('../public'+track.sourceMidi,import.meta.url));
  assert.equal(createHash('sha256').update(b).digest('hex'),report.clipSha256);
  assert.match(report.sourceSha256,/^[a-f0-9]{64}$/);assert.equal(track.sourceType,'score-transcription');
  assert.equal(track.kind,'ready');assert.equal(requiresMidi(track),false);assert.equal(track.duration,30);
  assert.equal(report.generatedAccompaniment,false);assert.equal(report.melodyOnly,true);
  assert.deepEqual(track.events.slice(0,8).map(n=>n.midi),anchors[track.id]);
  const parsed=parseMidi(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),{channelHands:{0:'right'}});
  assert.equal(track.events.length,parsed.events.length);assert.ok(guideGroups(track.events,'right').length>=30);
  for(let i=0;i<track.events.length;i++){
   const n=track.events[i],raw=parsed.events[i];assert.equal(n.midi,raw.midi);assert.equal(n.hand,'right');
   assert.ok(n.midi>=21&&n.midi<=108&&n.time>=0&&n.duration>=.03&&n.time+n.duration<=30.003);
   assert.ok(Math.abs(n.time-raw.time-report.leadingRest)<.00002);assert.ok(Math.abs(n.duration-raw.duration)<.00002);
  }
  notes+=track.events.length;
 }
 assert.equal(notes,283);
 assert.equal(REQUESTED_SONGS.find(t=>t.artist==='Murat Kekilli').bpm,48);
 const diet=REQUESTED_SONGS.find(t=>t.artist==='Lana Del Rey');assert.equal(diet.simplifiedRhythm,true);assert.match(diet.description,/soddalashtirilgan/);
 assert.equal(REQUESTED_SONGS.filter(t=>t.simplifiedRhythm).length,1);
});

test('Uzbek spellings find the requested artist versions without an invented Nahotki melody',()=>{
 const find=q=>REQUESTED_SONGS.filter(t=>matchesPianoSearch(t,q));
 assert.equal(find('belalim')[0].artist,'Sezen Aksu');assert.equal(find('chaliqushi')[0].artist,'Esin Engin');
 assert.equal(find('unutmak istiyorum')[0].artist,'Ufuk Çalışkan');assert.equal(find('bu aksham olurum')[0].artist,'Murat Kekilli');
 assert.equal(find('Lana Del Rey Diet Mountain Dew')[0].album,'Born to Die');
 assert.match(find('unutmak')[0].section,/21–28/);assert.match(find('chaliqushi')[0].section,/Esin Engin/);
 assert.equal(SONG_REPERTOIRE.filter(t=>matchesPianoSearch(t,'Nahotki')).length,0);
 const input=JSON.parse(fs.readFileSync(new URL('../data/piano-requested-7.40.json',import.meta.url)));
 assert.equal(input.unresolvedRequests[0].artist,'Alisher Uzoqov');
});

test('all five new songs play offline and their complete Do–Re–Mi lessons advance only on correct keys',async()=>{
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
  assert.equal(view.container.querySelectorAll('.cp-track').length,NEW_SONGS.length);
  const pointer=(target,type,id)=>{const e=new window.MouseEvent(type,{bubbles:true,button:0});Object.defineProperty(e,'pointerId',{value:id});fireEvent(target,e)};
  let id=1;
  for(const track of REQUESTED_SONGS){
   const card=[...view.container.querySelectorAll('.cp-track-select')].find(b=>b.querySelector('b').textContent===track.title);assert.ok(card);fireEvent.click(card);
   assert.ok(ui.getByRole('heading',{level:1,name:track.title}));assert.equal(view.container.querySelector('.cp-film-upload'),null);
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
  assert.deepEqual(requests,[]);
 }finally{globalThis.fetch=previousFetch;cleanup();await vite.close();dom.window.close()}
});
