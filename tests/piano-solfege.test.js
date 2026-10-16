import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {noteName,solfegeName,pianoNoteLabel,normalizePianoSettings,parseMidi,encodeMidi,guideGroups} from '../src/piano-music.js';
import {MODERN_SONGS,READY_SONGS,FOCUS_SONGS,NEW_SONGS,SONG_REPERTOIRE,requiresMidi,matchesPianoSearch} from '../src/piano-repertoire.js';

test('fixed Do names preserve every semitone and octave throughout the 88-key piano',()=>{
 assert.deepEqual([60,62,64,65,67,69,71,72].map(solfegeName),['Do4','Re4','Mi4','Fa4','Sol4','Lya4','Si4','Do5']);
 assert.deepEqual([61,63,66,68,70].map(solfegeName),['Do♯4','Re♯4','Fa♯4','Sol♯4','Lya♯4']);
 assert.equal(solfegeName(21),'Lya0');assert.equal(solfegeName(108),'Do8');
 for(let n=21;n<=108;n++){
  assert.match(solfegeName(n),/^(Do|Re|Mi|Fa|Sol|Lya|Si)♯?\d$/);
  assert.equal(pianoNoteLabel(n),solfegeName(n));assert.equal(pianoNoteLabel(n,'letters'),noteName(n));
  if(n<=96)assert.notEqual(solfegeName(n),solfegeName(n+12));
 }
 const old=normalizePianoSettings({labels:false,volume:.4});assert.equal(old.notation,'solfege');assert.equal(old.labels,false);assert.equal(old.volume,.4);
 assert.equal(normalizePianoSettings({notation:'letters'}).notation,'letters');
 assert.equal(normalizePianoSettings({notation:'invalid'}).notation,'solfege');
});

test('known MIDI staff/channel assignments keep the melody below middle C and bass above it',()=>{
 const notes=[{midi:55,time:0,duration:.5,velocity:.7,hand:'right'},{midi:65,time:0,duration:.5,velocity:.6,hand:'left'}];
 const bytes=encodeMidi(notes),byChannel=parseMidi(bytes.buffer,{channelHands:{0:'right',1:'left'}});
 assert.equal(byChannel.events.find(n=>n.midi===55).hand,'right');assert.equal(byChannel.events.find(n=>n.midi===65).hand,'left');
 const byStaff=parseMidi(bytes.buffer,{trackHands:{0:'right'}});
 assert.ok(byStaff.events.every(n=>n.hand==='right'));
 const legacy=parseMidi(bytes.buffer);assert.equal(legacy.events.find(n=>n.midi===55).hand,'left');
 const chunk=(name,data)=>[...name].map(c=>c.charCodeAt(0)).concat([0,0,data.length>>8,data.length&255],data);
 const upper=[0,255,81,3,7,161,32,0,144,55,80,135,64,128,55,0,0,255,47,0];
 const lower=[129,112,144,55,60,131,96,128,55,0,0,255,47,0];
 const sharedChannel=new Uint8Array([...chunk('MThd',[0,1,0,2,1,224]),...chunk('MTrk',upper),...chunk('MTrk',lower)]);
 const samePitch=parseMidi(sharedChannel.buffer,{trackHands:{0:'right',1:'left'}}).events;
 assert.equal(samePitch.find(n=>n.hand==='right').duration,1,'same-channel bass note-off must not shorten a held melody note');
 assert.equal(samePitch.find(n=>n.hand==='left').time,.25);assert.equal(samePitch.find(n=>n.hand==='left').duration,.5);
});

test('twenty modern hits have distinct, bundled 30-second piano scores with exact MIDI provenance',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/piano/modern-7.37/manifest.json',import.meta.url)));
 const sources=JSON.parse(fs.readFileSync(new URL('../data/piano-modern-7.37.json',import.meta.url)));
 assert.equal(MODERN_SONGS.length,20);assert.equal(READY_SONGS.length,21);assert.equal(SONG_REPERTOIRE.length,41+FOCUS_SONGS.length+NEW_SONGS.length);
 assert.ok(MODERN_SONGS.some(t=>t.title==='APT.'));assert.ok(MODERN_SONGS.some(t=>t.title==='Espresso'));
 assert.ok(MODERN_SONGS.every(t=>t.year>=2023&&t.kind==='ready'&&!requiresMidi(t)));
 const signatures=new Set();let count=0;
 for(const track of MODERN_SONGS){
  const report=manifest.tracks.find(t=>t.id===track.id),source=sources.tracks.find(t=>t.id===track.id);
  const bytes=fs.readFileSync(new URL('../public'+track.sourceMidi,import.meta.url));
  const parsed=parseMidi(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),{channelHands:{0:'right',1:'left'}});
  assert.equal(createHash('sha256').update(bytes).digest('hex'),report.clipSha256);
  assert.equal(report.sourceSha256,source.sourceSha256);assert.match(report.sourceSha256,/^[0-9a-f]{64}$/);
  assert.equal(report.clipStart,source.clipStart);assert.equal(report.clipLength,30);assert.ok(report.sourceDuration>=report.clipStart+30);
  assert.equal(report.inventedMelody,false);assert.equal(report.generatedAccompaniment,false);
  assert.equal(track.duration,30);assert.equal(track.events.length,parsed.events.length);assert.equal(parsed.bpm,track.bpm);
  assert.equal(track.sourceUrl,source.sourceUrl);assert.match(track.sourceUrl,/^https:\/\/www\.freepianotutorials\.net\//);
  assert.ok(track.events.length>=30&&guideGroups(track.events,'right').length>=8);
  assert.ok(track.events.some(n=>n.hand==='left'));assert.ok(track.events.some(n=>n.hand==='right'));
  for(let i=0;i<parsed.events.length;i++){
   const expected=parsed.events[i],actual=track.events[i];
   assert.equal(actual.midi,expected.midi);assert.equal(actual.hand,expected.hand);
   assert.ok(Math.abs(actual.time-expected.time)<.00001);assert.ok(Math.abs(actual.duration-expected.duration)<.00001);
   assert.ok(actual.time>=0&&actual.time+actual.duration<=30.001&&actual.velocity>0&&actual.velocity<=1);
  }
  signatures.add(track.events.map(n=>n.midi+':'+n.time).join(','));count+=track.events.length;
 }
 assert.equal(signatures.size,20);assert.equal(count,4434);
 assert.ok(matchesPianoSearch(MODERN_SONGS[1],'rose apt'));
 assert.ok(MODERN_SONGS.some(t=>t.events.some(n=>n.hand==='right'&&n.midi<60)),'melody staff must not be silently split at C4');
});

test('all modern hit cards play immediately and teach Do–Re–Mi without MIDI upload or network',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const name of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location','KeyboardEvent','File'])globalThis[name]=dom.window[name];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};
 const React=(await import('react')).default,{render,within,fireEvent,act,cleanup}=await import('@testing-library/react');
 const played=[],scheduled=[],requests=[],engine={ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},apply(){},setSustain(){},noteOn(n){played.push(n);return played.length},release(){},stopScope(){},allOff(){},schedule(...args){scheduled.push(args)},tick(){},dispose(){}};
 const vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'}),previousFetch=globalThis.fetch;
 try{
  const {default:Piano}=await vite.ssrLoadModule('/src/CinemaPiano.jsx');
  globalThis.fetch=async url=>{requests.push(String(url));throw Error('Ready songs must be bundled');};
  const view=render(React.createElement(Piano,{createAudio:()=>engine})),ui=within(view.container);
  fireEvent.click(ui.getByRole('button',{name:'Tayyor hitlar',exact:true}));
  fireEvent.click(ui.getByRole('button',{name:/Espresso.*Tayyor/}));
  assert.ok(ui.getByRole('heading',{level:1,name:'Espresso'}));assert.equal(view.container.querySelectorAll('.cp-track').length,20);
  assert.equal(ui.getByRole('button',{name:'Tayyor hitlar',exact:true}).getAttribute('aria-pressed'),'true');
  assert.doesNotMatch(view.container.querySelector('.cp-track-list').textContent,/MIDI yuklang|Xalq kuyi|CC-BY-NC-SA/);
  assert.equal(view.container.querySelector('[data-note="60"] .cp-note-label').textContent,'Do4');
  const pointer=(target,type,id)=>{const e=new window.MouseEvent(type,{bubbles:true,button:0});Object.defineProperty(e,'pointerId',{value:id});fireEvent(target,e)};
  let id=1;
  for(const track of MODERN_SONGS){
   const card=[...view.container.querySelectorAll('.cp-track-select')].find(b=>b.querySelector('b').textContent===track.title);assert.ok(card);
   fireEvent.click(card);assert.ok(ui.getByRole('heading',{level:1,name:track.title}));
   assert.equal(view.container.querySelector('.cp-film-upload'),null);assert.equal(ui.getByRole('link',{name:'Piano MIDI manbasi'}).href,track.sourceUrl);
   fireEvent.click(ui.getByRole('button',{name:'Tinglash',exact:true}));scheduled.length=0;
   await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Kuyni tinglash',exact:true})));
   assert.ok(scheduled.length>0,track.title);assert.ok(scheduled.every(a=>track.events.some(n=>n.midi===a[0])));
   fireEvent.click(ui.getByRole('button',{name:'Ijroni to‘xtatish'}));
   fireEvent.click(ui.getByRole('button',{name:'O‘rganish',exact:true}));
   const steps=guideGroups(track.events,'right'),first=steps[0];
   assert.equal(view.container.querySelector('.cp-current-notes strong').textContent,solfegeName(first.notes[0]));
   const future=[...view.container.querySelectorAll('.cp-next-notes b')].map(n=>n.textContent);
   assert.deepEqual(future,steps.slice(1,7).map(g=>g.notes.map(solfegeName).join(' + ')));
   fireEvent.click(ui.getByRole('button',{name:'O‘rganishni boshlash',exact:true}));
   const wrong=[...view.container.querySelectorAll('[data-note]')].find(k=>!first.notes.includes(Number(k.dataset.note)));
   act(()=>{pointer(wrong,'pointerdown',id);pointer(window,'pointerup',id++)});
   assert.match(view.container.querySelector('.cp-guide-status').textContent,new RegExp('0/'+steps.length),'wrong notes must not advance');
   const exercise=track.title==='Espresso'?steps:steps.slice(0,1);
   for(const g of exercise)for(const n of g.notes){
    const key=view.container.querySelector('[data-note="'+n+'"]');assert.ok(key,track.title+' / '+n);
    act(()=>{pointer(key,'pointerdown',id);pointer(window,'pointerup',id++)});
   }
   if(track.title==='Espresso'){
    assert.match(view.container.querySelector('.cp-guide-status').textContent,/Mashq tugadi/);
    assert.equal(JSON.parse(localStorage.getItem('sq-cinema-piano:guest:progress'))[track.id].steps,steps.length);
   }else assert.match(view.container.querySelector('.cp-guide-status').textContent,new RegExp('1/'+steps.length));
   const currentTarget=view.container.querySelector('.cp-current-notes strong')?.textContent;
   fireEvent.change(ui.getByRole('combobox',{name:'Nota yozuvi'}),{target:{value:'letters'}});
   assert.equal(view.container.querySelector('[data-note="60"] .cp-note-label').textContent,'C4');
   if(currentTarget)assert.equal(view.container.querySelector('.cp-current-notes strong').textContent,noteName(steps[1].notes[0]));
   assert.equal(JSON.parse(localStorage.getItem('sq-cinema-piano:guest:settings')).notation,'letters');
   fireEvent.change(ui.getByRole('combobox',{name:'Nota yozuvi'}),{target:{value:'solfege'}});
  }
  fireEvent.click(ui.getByRole('checkbox',{name:/Nota nomlari/}));
  assert.ok([...view.container.querySelectorAll('.cp-note-label')].every(n=>!n.textContent));
  assert.deepEqual(requests,[]);assert.ok(played.length>80);
 }finally{globalThis.fetch=previousFetch;cleanup();await vite.close();dom.window.close()}
});
