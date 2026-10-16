import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {FOCUS_SONGS,SONG_REPERTOIRE,matchesPianoSearch,requiresMidi} from '../src/piano-repertoire.js';
import {parseMidi,encodeMidi,guideGroups,solfegeName} from '../src/piano-music.js';

test('BLOK3 and Shah Rukh repertoire contains eleven playable excerpts with honest source types',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/piano/focus-7.38/manifest.json',import.meta.url)));
 const source=JSON.parse(fs.readFileSync(new URL('../data/piano-focus-7.38.json',import.meta.url)));
 assert.equal(FOCUS_SONGS.length,11);assert.equal(SONG_REPERTOIRE.length,52);
 assert.equal(FOCUS_SONGS.filter(t=>t.artist==='BLOK3').length,6);
 assert.equal(FOCUS_SONGS.filter(t=>t.language==='hi').length,5);
 assert.equal(FOCUS_SONGS.filter(t=>t.sourceType==='ready-midi').length,4);
 assert.equal(FOCUS_SONGS.filter(t=>t.sourceType==='score-transcription').length,7);
 const signatures=new Set();let notes=0;
 for(const track of FOCUS_SONGS){
  const report=manifest.tracks.find(t=>t.id===track.id),original=source.tracks.find(t=>t.id===track.id);
  const bytes=fs.readFileSync(new URL('../public'+track.sourceMidi,import.meta.url));
  const parsed=parseMidi(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),{channelHands:{0:'right'}});
  assert.equal(createHash('sha256').update(bytes).digest('hex'),report.clipSha256);
  assert.equal(track.sourceType,original.sourceType);assert.equal(track.sourceType,report.sourceType);
  assert.equal(report.generatedAccompaniment,false);assert.equal(track.duration,30);assert.equal(requiresMidi(track),false);
  assert.ok(track.events.length>=20&&guideGroups(track.events,'right').length>=15);
  assert.equal(track.events.length,parsed.events.length);
  for(let i=0;i<parsed.events.length;i++){
   const actual=track.events[i],expected=parsed.events[i];
   assert.equal(actual.midi,expected.midi);assert.equal(actual.hand,'right');
   assert.ok(Math.abs(actual.time-expected.time)<.00001);
   assert.ok(Math.abs(actual.duration-expected.duration)<.00001);
   assert.ok(actual.time>=0&&actual.time+actual.duration<=30.002);
   assert.ok(actual.midi>=21&&actual.midi<=108&&actual.velocity>0&&actual.velocity<=1);
  }
  assert.ok(parsed.duration>28.5&&parsed.duration<=30.002);
  signatures.add(track.events.map(n=>n.midi+':'+n.time).join(','));notes+=track.events.length;
  if(track.sourceType==='score-transcription'){
   assert.equal(track.sourceLabel,'Nota manbasi');assert.match(track.arrangementLabel,/Notadan/);
   assert.equal(track.bpm,64);assert.ok(original.bars.length>0);
  }else{
   assert.equal(track.sourceLabel,'Tayyor MIDI manbasi');assert.match(report.sourceMd5,/^[a-f0-9]{32}$/);
   assert.match(report.sourceSha256,/^[a-f0-9]{64}$/);assert.ok(original.parseOptions);
  }
 }
 assert.equal(signatures.size,11);assert.equal(notes,616);
});

test('the requested film aliases and Turkish spellings find the actual ready melodies',()=>{
 const find=q=>FOCUS_SONGS.filter(t=>matchesPianoSearch(t,q));
 for(const q of ['o‘g‘irlanmagan kelin','ogirlanmagan kelin','DDLJ','Dilwale Dulhania'])assert.equal(find(q)[0].title,'Tujhe Dekha Toh');
 assert.equal(find('shoxruxxon').length,5);assert.equal(find('Shah Rukh Khan').length,5);
 assert.equal(find('blok3 kusura')[0].title,'Kusura Bakma');
 assert.equal(find('napiyosun mesela')[0].title,'Napıyosun Mesela');
 assert.equal(find('kirginim')[0].title,'Kırgınım');
 assert.equal(find('kayip kalp')[0].title,'Kayıp Kalp');
});

test('short transcriptions retain source pitches, rests, tied notes and triplet timing',()=>{
 const byTitle=title=>FOCUS_SONGS.find(t=>t.title===title).events;
 assert.deepEqual(byTitle('Kusura Bakma').slice(0,8).map(n=>n.midi),[62,64,65,67,70,69,67,65]);
 assert.ok(Math.abs(byTitle('Kusura Bakma')[9].duration-1.25*60/64)<.002,'the tied C is one held note');
 const seb=byTitle('Sebebi Yar');assert.deepEqual(seb.slice(0,6).map(n=>n.midi),[62,65,64,62,64,60]);
 assert.ok(Math.abs(seb[1].time-2*60/64)<.002,'the quarter rest remains in the phrase');
 assert.ok(Math.abs(seb[1].duration-(1/3)*60/64)<.002,'triplets must not turn into straight eighths');
 assert.deepEqual(byTitle('Tujhe Dekha Toh').slice(0,10).map(n=>n.midi),[64,64,64,71,69,71,67,69,72,71]);
 assert.match(FOCUS_SONGS.find(t=>t.title==='Tujhe Dekha Toh').description,/Soddalashtirilgan/);
 assert.ok(byTitle('Baazigar O Baazigar').some(n=>n.midi<60),'a melody below C4 stays in the right-hand lesson');
});

test('MIDI melody isolation retains full source timing and leaves default imports unchanged',()=>{
 const bytes=encodeMidi([{midi:55,time:0,duration:1,velocity:.7,hand:'right'},{midi:72,time:0,duration:2,velocity:.6,hand:'left'},
  {midi:57,time:1.5,duration:.5,velocity:.8,hand:'right'}],{tempo:90});
 const whole=parseMidi(bytes.buffer),melody=parseMidi(bytes.buffer,{includeChannels:[0],channelHands:{0:'right'}});
 assert.equal(whole.events.length,3);assert.equal(melody.events.length,2);assert.equal(melody.bpm,90);
 assert.deepEqual(melody.events.map(n=>n.midi),[55,57]);assert.ok(melody.events.every(n=>n.hand==='right'));
 assert.ok(Math.abs(melody.events[1].time-1.5)<.002);assert.ok(Math.abs(melody.events[0].duration-1)<.002);
 assert.throws(()=>parseMidi(bytes.buffer,{includeTracks:[1]}),/notalari topilmadi/);
 assert.throws(()=>parseMidi(bytes.buffer,{includeChannels:[]}),/notalari topilmadi/);
 assert.equal(parseMidi(bytes.buffer,{includeTracks:[0]}).events.length,3);
});

test('all eleven requested cards play and teach immediately; film search and language filters work offline',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const name of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location','KeyboardEvent','File'])globalThis[name]=dom.window[name];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};
 // A returning player can have left-hand settings from an older score.
 localStorage.setItem('sq-cinema-piano:guest:settings',JSON.stringify({hand:'left'}));
 const React=(await import('react')).default,{render,within,fireEvent,act,cleanup}=await import('@testing-library/react');
 const scheduled=[],requests=[],played=[],engine={ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},apply(){},setSustain(){},noteOn(n){played.push(n);return played.length},release(){},stopScope(){},allOff(){},schedule(...args){scheduled.push(args)},tick(){},dispose(){}};
 const vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'}),previousFetch=globalThis.fetch;
 try{
  const {default:Piano}=await vite.ssrLoadModule('/src/CinemaPiano.jsx');
  globalThis.fetch=async url=>{requests.push(String(url));throw Error('Bundled melodies must not fetch external files');};
  const view=render(React.createElement(Piano,{createAudio:()=>engine})),ui=within(view.container);
  assert.ok(ui.getByRole('heading',{level:1,name:'Kusura Bakma'}));
  assert.equal(ui.getByRole('button',{name:'BLOK3 va hindcha',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(ui.getByRole('combobox',{name:'Mashq qilinadigan qo‘l'}).value,'right');
  assert.equal(view.container.querySelectorAll('.cp-track').length,11);
  const pointer=(target,type,id)=>{const e=new window.MouseEvent(type,{bubbles:true,button:0});Object.defineProperty(e,'pointerId',{value:id});fireEvent(target,e)};
  let id=1;
  for(const track of FOCUS_SONGS){
   const card=[...view.container.querySelectorAll('.cp-track-select')].find(b=>b.querySelector('b').textContent===track.title);assert.ok(card);
   fireEvent.click(card);assert.ok(ui.getByRole('heading',{level:1,name:track.title}));
   assert.equal(view.container.querySelector('.cp-film-upload'),null);
   assert.equal(ui.getByRole('link',{name:track.sourceLabel}).href,track.sourceUrl);
   if(track.movie)assert.match(view.container.querySelector('.cp-feature-film').textContent,new RegExp(track.movie));
   fireEvent.click(ui.getByRole('button',{name:'Tinglash',exact:true}));scheduled.length=0;
   await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Kuyni tinglash',exact:true})));
   assert.ok(scheduled.length>0,track.title);assert.ok(scheduled.every(a=>track.events.some(n=>n.midi===a[0])));
   fireEvent.click(ui.getByRole('button',{name:'Ijroni to‘xtatish'}));
   fireEvent.click(ui.getByRole('button',{name:'O‘rganish',exact:true}));
   const steps=guideGroups(track.events,'right');
   assert.equal(view.container.querySelector('.cp-current-notes strong').textContent,solfegeName(steps[0].notes[0]));
   fireEvent.click(ui.getByRole('button',{name:'Eshitib ko‘rish',exact:true}));
   fireEvent.click(ui.getByRole('button',{name:'O‘rganishni boshlash',exact:true}));
   const wrong=[...view.container.querySelectorAll('[data-note]')].find(k=>!steps[0].notes.includes(Number(k.dataset.note)));
   act(()=>{pointer(wrong,'pointerdown',id);pointer(window,'pointerup',id++)});
   assert.match(view.container.querySelector('.cp-guide-status').textContent,new RegExp('0/'+steps.length));
   for(const step of track.title==='Kusura Bakma'?steps:steps.slice(0,2))for(const n of step.notes){
    const key=view.container.querySelector('[data-note="'+n+'"]');assert.ok(key,track.title+' / '+n);
    act(()=>{pointer(key,'pointerdown',id);pointer(window,'pointerup',id++)});
   }
   if(track.title==='Kusura Bakma'){
    assert.match(view.container.querySelector('.cp-guide-status').textContent,/Mashq tugadi/);
    assert.equal(JSON.parse(localStorage.getItem('sq-cinema-piano:guest:progress'))[track.id].steps,steps.length);
   }else assert.match(view.container.querySelector('.cp-guide-status').textContent,new RegExp('2/'+steps.length));
  }
  fireEvent.change(ui.getByRole('textbox',{name:'Piano kuyini qidirish'}),{target:{value:'ogirlanmagan kelin'}});
  assert.equal(view.container.querySelectorAll('.cp-track').length,1);assert.match(view.container.querySelector('.cp-track').textContent,/Tujhe Dekha Toh/);
  fireEvent.change(ui.getByRole('textbox',{name:'Piano kuyini qidirish'}),{target:{value:''}});
  const filter=ui.getByRole('combobox',{name:'Kayfiyat bo‘yicha saralash'});
  fireEvent.change(filter,{target:{value:'Turkcha'}});assert.equal(view.container.querySelectorAll('.cp-track').length,6);
  fireEvent.change(filter,{target:{value:'Hindcha'}});assert.equal(view.container.querySelectorAll('.cp-track').length,5);
  assert.deepEqual(requests,[]);
 }finally{globalThis.fetch=previousFetch;cleanup();await vite.close();dom.window.close()}
});
