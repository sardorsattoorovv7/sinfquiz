import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {READY_SONGS,READY_TURKISH_SONGS,TURKISH_CATALOG,SONG_REPERTOIRE,requiresMidi,matchesPianoSearch,linkedPianoImport} from '../src/piano-repertoire.js';
import {parseMidi,guideGroups,encodeMidi} from '../src/piano-music.js';

test('Bella Ciao preserves every verified CC0 source note in a complete 30-second score',()=>{
 const original=fs.readFileSync(new URL('../public/piano/bella-ciao.cc0.mid',import.meta.url));
 assert.equal(createHash('sha1').update(original).digest('hex'),'4f44afdfdbc0f905e98580cd1655fcfaae3bc4d8');
 const parsed=parseMidi(original.buffer.slice(original.byteOffset,original.byteOffset+original.byteLength));
 const bella=READY_SONGS[0],scale=30/parsed.duration;
 assert.equal(bella.title,'Bella Ciao');assert.equal(bella.duration,30);assert.equal(bella.license,'CC0-1.0');
 assert.equal(bella.events.length,254);assert.equal(bella.events.length,parsed.events.length);
 for(let i=0;i<parsed.events.length;i++){
  const expected=parsed.events[i],actual=bella.events[i];
  assert.equal(actual.midi,expected.midi);assert.equal(actual.hand,expected.hand);
  assert.ok(Math.abs(actual.time-expected.time*scale)<.000001);
  assert.ok(Math.abs(actual.duration-expected.duration*scale)<.000001);
  assert.ok(actual.time>=0&&actual.time+actual.duration<=30.000002&&actual.velocity>0&&actual.velocity<=1);
 }
 assert.ok(guideGroups(bella.events,'right').length>50);assert.ok(guideGroups(bella.events,'left').length>20);
 const roundTrip=parseMidi(encodeMidi(bella.events).buffer);assert.equal(roundTrip.events.length,254);
});

test('twenty ready Turkish scores contain verified MIDI clips, distinct melodies and source licenses',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/piano/ready-7.36/manifest.json',import.meta.url)));
 const source=JSON.parse(fs.readFileSync(new URL('../data/piano-ready-7.36.json',import.meta.url)));
 assert.equal(READY_TURKISH_SONGS.length,20);assert.equal(SONG_REPERTOIRE.length,72);
 assert.equal(new Set(SONG_REPERTOIRE.map(t=>t.id)).size,72);
 const melodies=new Set();let notes=0;
 for(const track of READY_TURKISH_SONGS){
  const row=manifest.tracks.find(t=>t.id===track.id),original=source.tracks.find(t=>t.id===track.id);
  const midi=fs.readFileSync(new URL('../public'+track.sourceMidi,import.meta.url));
  const parsed=parseMidi(midi.buffer.slice(midi.byteOffset,midi.byteOffset+midi.byteLength));
  assert.equal(createHash('sha256').update(midi).digest('hex'),row.clipSha256);
  assert.equal(row.sourceSha256,original.sourceSha256);assert.ok(row.sourceNotes>=row.notes);
  assert.equal(track.license,'CC-BY-NC-SA-4.0');assert.equal(track.language,'tr');
  assert.match(track.sourceUrl,/github.com\/MTG\/SymbTr\/blob\/[a-f0-9]{40}\/midi\//);
  assert.equal(track.duration,30);assert.equal(track.bpm,parsed.bpm);assert.equal(track.events.length,parsed.events.length);
  assert.equal(requiresMidi(track),false);assert.ok(track.events.length>=40);
  for(let i=0;i<parsed.events.length;i++){
   const expected=parsed.events[i],actual=track.events[i];
   assert.equal(actual.midi,expected.midi);assert.equal(actual.hand,'right');
   assert.ok(Math.abs(actual.time-expected.time)<.00001);assert.ok(Math.abs(actual.duration-expected.duration)<.00001);
   assert.ok(actual.time>=0&&actual.time+actual.duration<=30.001);assert.ok(actual.midi>=21&&actual.midi<=108);
  }
  assert.ok(guideGroups(track.events,'right').length>=25);notes+=track.events.length;
  melodies.add(track.events.map(n=>n.midi).join(','));
 }
 assert.equal(notes,1846);assert.equal(melodies.size,20);
 assert.equal(SONG_REPERTOIRE.some(t=>requiresMidi(t)),false);
 assert.equal(SONG_REPERTOIRE.some(t=>t.title==='KUSURA BAKMA'),false);
 for(const q of ['bella cio','Çav Bella','la casa de papel'])assert.ok(matchesPianoSearch(READY_SONGS[0],q));
 assert.equal(SONG_REPERTOIRE.find(t=>matchesPianoSearch(t,'sari gelin')).id,'ready-tr-sari-gelin');
 assert.equal(SONG_REPERTOIRE.find(t=>matchesPianoSearch(t,'uskudar')).id,'ready-tr-uskudara');
 const film={id:'film-0',kind:'film'},song=TURKISH_CATALOG[0];
 assert.equal(linkedPianoImport([{id:'old',filmId:film.id}],film).id,'old');
 assert.equal(linkedPianoImport([{id:'new',catalogId:song.id}],song).id,'new');
});

test('every ready Turkish card plays and starts Guide immediately, without a file or external request',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const name of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location','KeyboardEvent','File'])globalThis[name]=dom.window[name];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};
 const React=(await import('react')).default,{render,within,fireEvent,act,cleanup,waitFor}=await import('@testing-library/react');
 const played=[],scheduled=[],engine={ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},apply(){},setSustain(){},noteOn(n){played.push(n);return played.length},release(){},stopScope(){},allOff(){},schedule(...args){scheduled.push(args)},tick(){},dispose(){}};
 const previousFetch=globalThis.fetch,networkRequests=[];
 const vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Module}=await vite.ssrLoadModule('/src/CinemaPiano.jsx');
  globalThis.fetch=async url=>{networkRequests.push(String(url));throw Error('Ready songs must not request an external MIDI');};
  const view=render(React.createElement(Module,{createAudio:()=>engine})),ui=within(view.container);
  fireEvent.click(ui.getByRole('button',{name:'Xalq va mumtoz',exact:true}));
  fireEvent.click(ui.getByRole('button',{name:/Bella Ciao.*Tayyor/}));
  assert.ok(ui.getByRole('heading',{level:1,name:'Bella Ciao'}));assert.equal(view.container.querySelectorAll('.cp-track').length,21);
  assert.equal(ui.getByRole('button',{name:'Xalq va mumtoz',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(ui.queryByRole('button',{name:'Kino MIDI',exact:true}),null);
  assert.doesNotMatch(view.container.querySelector('.cp-track-list').textContent,/MIDI yuklang|MIDI kutilmoqda/);
  const pointer=(key,type,id)=>{const e=new window.MouseEvent(type,{bubbles:true,button:0});Object.defineProperty(e,'pointerId',{value:id});fireEvent(key,e)};
  let pointerId=1;
  for(const track of READY_TURKISH_SONGS){
   const card=[...view.container.querySelectorAll('.cp-track-select')].find(b=>b.querySelector('b').textContent===track.title);assert.ok(card);
   fireEvent.click(card);assert.ok(ui.getByRole('heading',{level:1,name:track.title}));
   assert.equal(view.container.querySelector('.cp-film-upload'),null);assert.ok(view.container.querySelector('canvas'));
   const link=ui.getByRole('link',{name:/Nota manbasi/});assert.equal(link.href,track.sourceUrl);assert.ok(link.rel.includes('noopener'));
   fireEvent.click(ui.getByRole('button',{name:'Tinglash',exact:true}));scheduled.length=0;
   await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Kuyni tinglash',exact:true})));
   assert.ok(scheduled.length>0,track.title);assert.ok(scheduled.every(args=>track.events.some(n=>n.midi===args[0])));
   fireEvent.click(ui.getByRole('button',{name:'Ijroni to‘xtatish'}));
   fireEvent.click(ui.getByRole('button',{name:'O‘rganish',exact:true}));
   fireEvent.click(ui.getByRole('button',{name:'O‘rganishni boshlash',exact:true}));
   const steps=guideGroups(track.events,'right');
   const exercise=track.id==='ready-tr-sari-gelin'?steps:steps.slice(0,1);
   for(const step of exercise)for(const note of step.notes){
    const key=view.container.querySelector('[data-note="'+note+'"]');assert.ok(key);
    act(()=>{pointer(key,'pointerdown',pointerId);pointer(window,'pointerup',pointerId++)});
   }
   if(track.id==='ready-tr-sari-gelin'){
    assert.match(view.container.querySelector('.cp-guide-status').textContent,/Mashq tugadi/);
    assert.equal(JSON.parse(localStorage.getItem('sq-cinema-piano:guest:progress'))[track.id].accuracy,100);
   }else assert.match(view.container.querySelector('.cp-guide-status').textContent,new RegExp('1/'+steps.length));
  }
  fireEvent.click(ui.getByRole('button',{name:'Ijroni to‘xtatish'}));
  const search=ui.getByRole('textbox',{name:'Piano kuyini qidirish'});
  fireEvent.change(search,{target:{value:'sari gelin'}});assert.equal(view.container.querySelectorAll('.cp-track').length,1);
  fireEvent.change(search,{target:{value:'kusura'}});assert.equal(view.container.querySelectorAll('.cp-track').length,0);
  fireEvent.click(ui.getByRole('button',{name:'Meniki',exact:true}));
  const bytes=encodeMidi([{midi:60,time:0,duration:1,velocity:.7,hand:'right'}]);
  await act(async()=>fireEvent.change(view.container.querySelector('input[type=file]'),{target:{files:[{name:'My-arrangement.mid',size:bytes.length,arrayBuffer:async()=>bytes.buffer}]}}));
  await waitFor(()=>assert.ok(view.container.querySelector('.cp-clip')));
  assert.ok(ui.getByRole('heading',{level:1,name:'My-arrangement'}));
  fireEvent.click(ui.getByRole('button',{name:'Meniki',exact:true}));assert.equal(view.container.querySelectorAll('.cp-track').length,1);
  assert.deepEqual(networkRequests,[]);
 }finally{globalThis.fetch=previousFetch;cleanup();await vite.close();dom.window.close()}
});
