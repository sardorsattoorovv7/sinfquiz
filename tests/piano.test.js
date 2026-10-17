import test from 'node:test';
import assert from 'node:assert/strict';
import {PIANO_LIBRARY,FILM_CATALOG,KEY_CODES,normalizePianoSettings,keyboardGeometry,guideGroups,clipEvents,encodeMidi,parseMidi,frequency} from '../src/piano-music.js';
import {READY_SONGS,MODERN_SONGS,FOCUS_SONGS,NEW_SONGS,SONG_REPERTOIRE} from '../src/piano-repertoire.js';
import {PianoAudio,PianoTransport} from '../src/piano-audio.js';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';

test('PIANO has 38 distinct playable 30-second scores and 34 film MIDI slots',()=>{
 assert.equal(PIANO_LIBRARY.filter(t=>t.kind==='original').length,32);
 assert.equal(PIANO_LIBRARY.filter(t=>t.kind==='public').length,6);
 assert.equal(FILM_CATALOG.length,34);
 const signatures=new Set();
 for(const t of PIANO_LIBRARY){
  assert.equal(t.duration,30);assert.ok(t.events.length>=20);assert.ok(guideGroups(t.events).length>10);
  for(const n of t.events){assert.ok(n.midi>=21&&n.midi<=108);assert.ok(n.duration>0&&n.time>=0&&n.time+n.duration<=30.001);assert.ok(n.velocity>0&&n.velocity<=1)}
  signatures.add(JSON.stringify(t.events));
 }
 assert.equal(signatures.size,38);
 assert.ok(FILM_CATALOG.every(t=>t.kind==='film'&&!t.events),'film slots must not pretend to contain actual soundtracks');
});
test('Piano tuning, octave limits and 88-key geometry match an acoustic piano',()=>{
 assert.equal(frequency(69),440);assert.equal(frequency(21),27.5);
 const full=keyboardGeometry(88);assert.equal(full.keys.length,88);assert.equal(full.whites,52);assert.equal(full.first,21);assert.equal(full.last,108);
 for(const count of [25,37,49,88])for(const octave of [-2,-1,0,1,2]){
  const g=keyboardGeometry(count,octave);assert.equal(g.keys.length,count);assert.ok(g.first>=21&&g.last<=108);
 }
 const s=normalizePianoSettings({octave:99,gain:15,volume:-1,reverb:3,speed:0,keys:9,hand:'invalid'});
 assert.equal(s.octave,2);assert.equal(s.gain,1.5);assert.equal(s.volume,0);assert.equal(s.reverb,1);assert.equal(s.speed,.5);assert.equal(s.keys,37);assert.equal(s.hand,'right');
});
test('Guide groups simultaneous notes, separates hands and clips notes crossing a 30-second boundary',()=>{
 const notes=[{time:2,midi:60,duration:1,hand:'right'},{time:2.018,midi:64,duration:2,hand:'right'},{time:2.03,midi:48,duration:1,hand:'left'},{time:33,midi:72,duration:3,hand:'right'}];
 assert.deepEqual(guideGroups(notes,'right')[0].notes,[60,64]);assert.deepEqual(guideGroups(notes,'left')[0].notes,[48]);
 const clip=clipEvents(notes,2.5,30);assert.equal(clip.length,3);assert.equal(clip[0].time,0);assert.equal(clip.find(n=>n.midi===60).duration,.5);
 const tail=clipEvents(notes,32,2);assert.deepEqual(tail.map(n=>[n.time,n.duration]),[[1,1]]);
});
test('MIDI export/import preserves pitch, left/right channels, note lengths and velocity',()=>{
 const notes=[{time:0,midi:48,duration:1.5,velocity:.45,hand:'left'},{time:.5,midi:64,duration:.75,velocity:.8,hand:'right'},{time:1,midi:67,duration:1,velocity:.7,hand:'right'}];
 const bytes=encodeMidi(notes),parsed=parseMidi(bytes.buffer);assert.equal(parsed.events.length,3);
 for(const expected of notes){const actual=parsed.events.find(n=>n.midi===expected.midi);assert.ok(Math.abs(actual.time-expected.time)<.002);assert.ok(Math.abs(actual.duration-expected.duration)<.002);assert.ok(Math.abs(actual.velocity-expected.velocity)<.01);assert.equal(actual.hand,expected.hand)}
 const sustained=parseMidi(encodeMidi([{time:0,midi:60,duration:.25,velocity:.7}],{pedalEvents:[{time:0,down:true},{time:1,down:false}]}).buffer);assert.equal(sustained.events[0].duration,1);
});
const chunk=(name,data)=>[...name].map(c=>c.charCodeAt(0)).concat([(data.length>>>24)&255,(data.length>>>16)&255,(data.length>>>8)&255,data.length&255],data);
const smf=(tracks,division=480)=>new Uint8Array([...chunk('MThd',[0,tracks.length>1?1:0,0,tracks.length,division>>8,division&255]),...tracks.flatMap(t=>chunk('MTrk',t))]).buffer;
test('MIDI parser honors tempo changes, running status, channel percussion and rejects malformed files',()=>{
 const tempo=[0,255,81,3,7,161,32,131,96,255,81,3,15,66,64,0,255,47,0];
 const notes=[0,144,60,100,131,96,60,0,0,144,64,100,131,96,64,0,0,153,36,100,100,137,36,0,0,255,47,0];
 const parsed=parseMidi(smf([tempo,notes]));assert.equal(parsed.events.length,2);assert.equal(parsed.events[0].duration,.5);assert.equal(parsed.events[1].time,.5);assert.equal(parsed.events[1].duration,1);
 assert.throws(()=>parseMidi(new Uint8Array([1,2,3]).buffer),/tugallanmagan/);
 assert.throws(()=>parseMidi(smf([[0,60,100,0,255,47,0]])),/running status/);
 assert.throws(()=>parseMidi(smf([[0,255,47,0]])),/notalari topilmadi/);
});
test('MIDI import reports the actual initial tempo rather than the 120 BPM fallback',()=>{
 const notes=[{midi:60,time:0,duration:1,velocity:.7,hand:'right'}];
 for(const tempo of [60,78,84,108,150]){
  const parsed=parseMidi(encodeMidi(notes,{tempo}).buffer);
  assert.equal(parsed.bpm,tempo);assert.ok(Math.abs(parsed.events[0].duration-1)<.003);
 }
});
test('Transport pause/resume and speed use the audio clock and restore sounding notes',async()=>{
 const scheduled=[],audio={ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},schedule(...a){scheduled.push(a)},stopScope(){},tick(){}};
 const tr=new PianoTransport(audio);tr.load([{time:0,midi:60,duration:2,velocity:.7},{time:1,midi:64,duration:.5,velocity:.7}],3);
 await tr.play();audio.ctx.currentTime=.535;assert.ok(Math.abs(tr.position()-.5)<.001);tr.pause();assert.ok(Math.abs(tr.offset-.5)<.001);
 scheduled.length=0;tr.speed=.5;await tr.play();assert.ok(scheduled.some(x=>x[0]===60&&Math.abs(x[3]-3)<.001),'resume restores remaining 1.5 score seconds at half speed');
 tr.stop();assert.equal(tr.position(),0);assert.equal(tr.playing,false);tr.destroy();
});
test('Pausing or disabling the metronome cancels scheduled clicks without a stale beat backlog',async()=>{
 const stopped=[],ticks=[],audio={ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},schedule(){},stopScope(scope){stopped.push(scope)},tick(...args){ticks.push(args)}};
 const tr=new PianoTransport(audio);tr.load([],30,120);tr.setMetronome(true);
 try{
  await tr.play();assert.equal(ticks.length,1);tr.pause();assert.ok(stopped.slice(-2).includes('metronome'));
  tr.seek(12);await tr.play();tr.setMetronome(false);assert.equal(stopped.at(-1),'metronome');
  audio.ctx.currentTime+=5;tr.setMetronome(true);tr.pump();assert.ok(tr.nextBeat>=34,'enabling after a gap starts at the current beat');
  const pos=tr.position();assert.ok(ticks.every(([at])=>Number.isFinite(at)));assert.ok(pos>=16.96&&pos<=17);
 }finally{tr.destroy()}
});
test('Scheduled audio clicks belong to the metronome scope and can be stopped before sounding',()=>{
 const stops=[],cancels=[],osc={frequency:{},connect(){},disconnect(){},start(at){this.startedAt=at},stop(at){stops.push(at)}},gain={gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(at){cancels.push(at)},setTargetAtTime(){}},connect(){},disconnect(){}};
 const audio=new PianoAudio();audio.ctx={currentTime:0,createOscillator:()=>osc,createGain:()=>gain};audio.ensure=()=>audio.ctx;audio.input={};
 const id=audio.tick(.12,true);assert.equal(audio.voices.get(id).scope,'metronome');audio.stopScope('metronome');
 assert.equal(cancels[0],0);assert.ok(stops.at(-1)<osc.startedAt,'pause cancels the lookahead click before its start');osc.onended();assert.equal(audio.voices.size,0);
});

test('PIANO UI searches, teaches a complete melody, toggles labels and imports MIDI',async()=>{
 const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const name of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location','KeyboardEvent','File'])globalThis[name]=dom.window[name];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
 window.scrollTo=()=>{};globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const React=(await import('react')).default,{render,screen,fireEvent,act,cleanup,waitFor}=await import('@testing-library/react');
 const played=[],released=[],active=[],factory=()=>({ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},apply(){},setSustain(){},noteOn(n){played.push(n);return played.length},release(id){released.push(id)},stopScope(){},allOff(){},schedule(){},tick(){},dispose(){this.closed=true}});
 const vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Module}=await vite.ssrLoadModule('/src/CinemaPiano.jsx');
  const view=render(React.createElement(Module,{createAudio:factory,onActive:value=>active.push(value)}));
  fireEvent.click(screen.getByRole('button',{name:'Mashqlar',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:/Orbital Dawn.*30 s/}));
  assert.equal(view.container.querySelectorAll('.cp-track').length,38);
  fireEvent.change(screen.getByRole('textbox',{name:'Piano kuyini qidirish'}),{target:{value:'Orbital'}});assert.equal(view.container.querySelectorAll('.cp-track').length,1);
  fireEvent.click(screen.getByRole('checkbox',{name:/Nota nomlari/}));assert.ok([...view.container.querySelectorAll('.cp-note-label')].every(n=>!n.textContent));
  fireEvent.click(screen.getByRole('button',{name:'O‘rganish',exact:true}));fireEvent.click(screen.getByRole('button',{name:'O‘rganishni boshlash',exact:true}));
  const song=PIANO_LIBRARY[0],steps=guideGroups(song.events),base=Math.min(...song.events.filter(n=>n.hand==='right').map(n=>n.midi));
  const wrong=KEY_CODES.find((_,i)=>!steps[0].notes.includes(base+i));act(()=>{fireEvent.keyDown(window,{code:wrong});fireEvent.keyUp(window,{code:wrong})});
  for(const g of steps)for(const n of g.notes){const code=KEY_CODES[n-base];assert.ok(code);act(()=>{fireEvent.keyDown(window,{code});fireEvent.keyUp(window,{code})})}
  assert.match(view.container.querySelector('.cp-guide-status').textContent,/Mashq tugadi/);
  assert.ok(JSON.parse(localStorage.getItem('sq-cinema-piano:guest:progress'))[song.id].accuracy>90);
  assert.equal(played.length,released.length);assert.ok(active.includes(true));
  const bytes=encodeMidi([{time:0,midi:60,duration:1,velocity:.8,hand:'right'}]);
  const f={name:'Test-Soundtrack.mid',size:bytes.length,arrayBuffer:async()=>bytes.buffer};
  await act(async()=>fireEvent.change(view.container.querySelector('input[type=file]'),{target:{files:[f]}}));
  await waitFor(()=>assert.ok(screen.getByRole('heading',{level:1,name:'Test-Soundtrack'})));
  assert.equal(screen.getByLabelText('MIDI parchasining boshlanish soniyasi').value,'0');
  fireEvent.click(screen.getByRole('button',{name:'Piano qo‘llanmasi'}));assert.ok(screen.getByRole('dialog'));fireEvent.click(screen.getByRole('button',{name:'Piano qo‘llanmasini yopish'}));
 }finally{cleanup();await vite.close();dom.window.close()}
});

test('Piano clock, auto-follow, pointer release, MIDI input and recording limit work without a visible note canvas',async t=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const name of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location','KeyboardEvent','File'])globalThis[name]=dom.window[name];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const frames=new Map();let frameId=0,now=1000;
 globalThis.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId};globalThis.cancelAnimationFrame=id=>frames.delete(id);
 const played=[],released=[],engine={ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},apply(){},setSustain(){},noteOn(n){played.push(n);return played.length},release(id){released.push(id)},stopScope(){},allOff(){},schedule(){},tick(){},dispose(){}};
 const React=(await import('react')).default,{render,within,fireEvent,act,cleanup}=await import('@testing-library/react'),vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Module}=await vite.ssrLoadModule('/src/CinemaPiano.jsx');t.mock.method(performance,'now',()=>now);
  const view=render(React.createElement(Module,{createAudio:()=>engine})),ui=within(view.container);
  fireEvent.click(ui.getByRole('button',{name:'Mashqlar',exact:true}));fireEvent.click(ui.getByRole('button',{name:/Orbital Dawn.*30 s/}));
  const step=async time=>{now=time;const [id,fn]=frames.entries().next().value;frames.delete(id);await act(async()=>fn(time))};
  const sc=view.container.querySelector('.cp-keyboard-scroll');Object.defineProperty(sc,'clientWidth',{value:200});
  for(const key of sc.querySelectorAll('[data-note]')){Object.defineProperty(key,'offsetLeft',{value:Number(key.dataset.note)*20});Object.defineProperty(key,'offsetWidth',{value:20})}
  await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Kuyni tinglash',exact:true})));
  engine.ctx.currentTime=.135;await step(1100);assert.ok(Number(ui.getByLabelText('Piano ijro vaqti').value)>0);assert.ok(sc.querySelector('.cp-auto-active'));assert.ok(sc.scrollLeft>0,'the current melody key is revealed');
  fireEvent.click(ui.getByRole('checkbox',{name:/Notalarni kuzatish/}));sc.scrollLeft=0;
  engine.ctx.currentTime=PIANO_LIBRARY[0].events.find(e=>e.hand==='right'&&e.time>.5).time+.055;await step(1200);assert.equal(sc.scrollLeft,0,'auto-follow can be disabled');
  fireEvent.click(ui.getByRole('button',{name:'Ijroni to‘xtatish'}));
  const key=sc.querySelector('[data-note="60"]'),keyboard=sc.querySelector('.cp-keyboard');
  const pointer=(target,type,id)=>{const e=new window.MouseEvent(type,{bubbles:true,button:0});Object.defineProperty(e,'pointerId',{value:id});fireEvent(target,e)};
  pointer(key,'pointerdown',7);assert.equal(key.getAttribute('aria-pressed'),'true');pointer(window,'pointerup',7);assert.equal(key.getAttribute('aria-pressed'),'false','a release outside the keyboard cannot leave a stuck note');
  const foreign=document.createElement('button');foreign.dataset.note='61';document.body.append(foreign);document.elementFromPoint=()=>foreign;
  pointer(key,'pointerdown',8);const before=played.length;pointer(keyboard,'pointermove',8);assert.equal(played.length,before);assert.equal(key.getAttribute('aria-pressed'),'false');pointer(window,'pointerup',8);foreign.remove();
  const input={id:'qa-midi',name:'QA MIDI'},access={inputs:new Map([['qa-midi',input]])};navigator.requestMIDIAccess=async options=>{assert.equal(options.sysex,false);return access};
  await act(async()=>fireEvent.click(ui.getByRole('button',{name:'MIDI qurilma ulash'})));
  const beforeMidi=played.length;act(()=>input.onmidimessage({data:[144,0,100]}));assert.equal(played.length,beforeMidi,'out-of-range MIDI does not create a virtual held note');
  act(()=>input.onmidimessage({data:[144,60,100]}));assert.equal(key.getAttribute('aria-pressed'),'true');act(()=>input.onmidimessage({data:[128,60,0]}));assert.equal(key.getAttribute('aria-pressed'),'false');
  act(()=>input.onmidimessage({data:[144,60,100]}));access.inputs.clear();act(()=>access.onstatechange());assert.equal(key.getAttribute('aria-pressed'),'false','disconnect releases MIDI notes');
  fireEvent.click(ui.getByRole('button',{name:'Xalq va mumtoz',exact:true}));fireEvent.click(ui.getByRole('button',{name:/Sarı Gelin.*Tayyor/}));assert.equal(view.container.querySelector('.cp-film-upload'),null);
  await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Ijroni yozish',exact:true})));
  now=1300;fireEvent.keyDown(window,{code:'KeyZ'});now=1700;fireEvent.keyUp(window,{code:'KeyZ'});
  await step(2200);assert.ok(ui.getByRole('button',{name:'Yozishni tugatish 00:01',exact:true}));
  await step(301500);assert.equal(view.container.querySelector('.cp-stop-record'),null);assert.match(ui.getByRole('heading',{level:1}).textContent,/Mening ijrom/);assert.match(view.container.querySelector('.cp-clip').textContent,/Fayl: 05:00/);assert.ok(released.length>=3);
 }finally{cleanup();await vite.close();dom.window.close()}
});

test('SinfQuiz opens PIANO for guest, student, teacher and admin, then returns to exercises',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/#kino-piano',pretendToBeVisual:true});
 for(const name of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[name]=dom.window[name];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
 globalThis.matchMedia=window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
 globalThis.__SINFQUIZ_LEGACY_TEST__=true;window.scrollTo=()=>{};globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 let role=null;
 globalThis.fetch=async path=>{
  const p=String(path),user=role?{id:'piano-role-'+role,name:'Piano foydalanuvchi',role}:null;
  const data=p==='/auth/session'?{user,csrf:'test'}:p==='/api/quizzes'?{quizzes:[],publicQuizzes:[],lessons:[],players:[],results:[]}:p==='/api/catalog'?{quizzes:[],lessons:[]}:{};
  return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
 };
 const React=(await import('react')).default,{render,within,fireEvent,waitFor,cleanup}=await import('@testing-library/react'),vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:App}=await vite.ssrLoadModule('/src/App.jsx');
  for(role of [null,'student','teacher','admin']){
   location.hash='kino-piano';sessionStorage.clear();
   const view=render(React.createElement(App)),ui=within(view.container);
   await ui.findByRole('heading',{level:1,name:NEW_SONGS[0].title});
   assert.equal(location.hash,'#kino-piano');assert.equal(view.container.querySelectorAll('.cp-track').length,NEW_SONGS.length);
   fireEvent.click(ui.getByRole('button',{name:'Pianinodan orqaga'}));
   await ui.findByRole('heading',{name:'O‘zingiz sinab ko‘ring.',exact:true});
   assert.equal(location.hash,'#mashqlar');assert.ok(ui.getByRole('heading',{name:'PIANO',exact:true}));
   await waitFor(()=>assert.equal(view.container.querySelectorAll('.cinema-piano').length,0));
   cleanup();
  }
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});
