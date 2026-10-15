import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ChevronDown,Download,Expand,Headphones,Heart,HelpCircle,Keyboard,Library,Mic,Minus,Music2,Pause,Piano,Play,Plus,Radio,Repeat2,RotateCcw,Search,Settings2,SkipBack,SkipForward,Square,Trash2,Upload,Volume2,Waves,X} from 'lucide-react';
import {PianoAudio,PianoTransport} from './piano-audio.js';
import {PIANO_LIBRARY,FILM_CATALOG,KEY_CODES,KEY_LABELS,normalizePianoSettings,noteName,keyboardGeometry,guideGroups,clipEvents,parseMidi,encodeMidi,clamp} from './piano-music.js';
import {loadPianoTracks,storePianoTrack,deletePianoTrack} from './piano-storage.js';
import './cinema-piano.css';

const emptyGuide=()=>({running:false,index:0,hits:0,wrong:0,matched:[]});
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const download=(bytes,name)=>{const url=URL.createObjectURL(new Blob([bytes],{type:'audio/midi'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)};
const clock=t=>String(Math.floor(Math.max(0,t)/60)).padStart(2,'0')+':'+String(Math.floor(Math.max(0,t))%60).padStart(2,'0');
const moodColor={Kosmik:'#af9af7',Drama:'#d6b37c',Sirli:'#8eb5bb',Romantik:'#df9fba',Vals:'#d0b480',Fantaziya:'#99c9a2',Sarguzasht:'#dbaf74',Klassik:'#acc7e1'};
const noop=()=>{};
const defaultAudioFactory=options=>new PianoAudio(options);
const revealNote=(sc,n)=>{const key=sc?.querySelector('[data-note="'+n+'"]');if(!key||!sc.clientWidth)return;const x=key.offsetLeft,w=key.offsetWidth;if(x<sc.scrollLeft+12||x+w>sc.scrollLeft+sc.clientWidth-12)sc.scrollLeft=Math.max(0,x-sc.clientWidth/2+w/2)};
function Range({name,label,value,min=0,max=1,step=.01,onChange,format=v=>Math.round(v*100)+'%',icon:Icon}){
 return <label className="cp-range" htmlFor={'cp-'+name}><span>{Icon&&<Icon size={15}/>} {label}<output>{format(value)}</output></span><input id={'cp-'+name} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
}
function Toggle({label,detail,checked,onChange}){
 return <label className="cp-toggle"><span><b>{label}</b>{detail&&<small>{detail}</small>}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><i aria-hidden="true"/></label>;
}

export default function CinemaPiano({user,onBack=noop,onActive=noop,createAudio=defaultAudioFactory}){
 const owner=user?.id||'guest',storageKey='sq-cinema-piano:'+owner;
 const [settings,setSettings]=useState(()=>normalizePianoSettings(safeRead(storageKey+':settings',{})));
 const [saved,setSaved]=useState(()=>safeRead(storageKey+':progress',{})),[favorites,setFavorites]=useState(()=>{const x=safeRead(storageKey+':favorites',[]);return Array.isArray(x)?x:[]});
 const [imports,setImports]=useState([]),[selected,setSelected]=useState(PIANO_LIBRARY[0].id),[tab,setTab]=useState('practice'),[query,setQuery]=useState(''),[mood,setMood]=useState('all'),[onlyFavorites,setOnlyFavorites]=useState(false);
 const [mode,setMode]=useState('auto'),[playing,setPlaying]=useState(false),[guide,setGuide]=useState(emptyGuide),[position,setPosition]=useState(0),[held,setHeld]=useState(new Set()),[spacePedal,setSpacePedal]=useState(false),[midiPedal,setMidiPedal]=useState(false);
 const [audioInfo,setAudioInfo]=useState({state:'off',sampleRate:0,latency:0}),[message,setMessage]=useState(''),[help,setHelp]=useState(false),[labOpen,setLabOpen]=useState(false),[libraryOpen,setLibraryOpen]=useState(false);
 const [midiInfo,setMidiInfo]=useState('MIDI ulanmagan'),[recording,setRecording]=useState(false),[recordSeconds,setRecordSeconds]=useState(0),[clipStart,setClipStart]=useState(0),[loadingFile,setLoadingFile]=useState(false);
 const root=useRef(null),audio=useRef(null),transport=useRef(null),scroll=useRef(null),canvas=useRef(null),meter=useRef(null),file=useRef(null),helpRef=useRef(null),labRef=useRef(null);
 const sources=useRef(new Map()),pointers=useRef(new Map()),runtime=useRef({}),guideRef=useRef(guide),midi=useRef(null),take=useRef(null),mounted=useRef(true),finishRecording=useRef(noop);
 const chosen=useMemo(()=>[...PIANO_LIBRARY,...imports,...FILM_CATALOG].find(t=>t.id===selected)||PIANO_LIBRARY[0],[selected,imports]);
 const events=useMemo(()=>chosen.kind==='import'?clipEvents(chosen.events,clipStart,30):chosen.events||[],[chosen,clipStart]);
 const duration=chosen.kind==='import'?Math.min(30,Math.max(.1,chosen.fullDuration-clipStart)):30;
 const groups=useMemo(()=>guideGroups(events,settings.hand),[events,settings.hand]);
 const geometry=useMemo(()=>keyboardGeometry(settings.keys,settings.octave),[settings.keys,settings.octave]);
 const rightNotes=events.filter(n=>n.hand==='right'),mapBase=clamp((rightNotes.length?rightNotes.reduce((min,n)=>Math.min(min,n.midi),108):60)+settings.octave*12,21,84);
 const keyMap=useMemo(()=>new Map(KEY_CODES.map((code,i)=>[code,mapBase+i])),[mapBase]);
 const mappedLabels=useMemo(()=>new Map(KEY_LABELS.map((label,i)=>[mapBase+i,label])),[mapBase]);
 const target=mode==='guide'?(groups[guide.index]?.notes||[]):[];
 const listBase=tab==='film'?FILM_CATALOG:tab==='mine'?imports:PIANO_LIBRARY;
 const visible=listBase.filter(t=>(!onlyFavorites||favorites.includes(t.id))&&(mood==='all'||t.mood===mood)&&(t.title+' '+(t.key||'')+' '+t.mood).toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
 const statusText=chosen.kind==='film'?'MIDI yuklang':recording?'Ijro yozilmoqda':mode==='guide'?(guide.running?'Yoritilgan notalarni bosing':'Tayyor bo‘lsangiz boshlang'):playing?'Avtoijro davom etmoqda':'Pianino sizni kutmoqda';
 runtime.current={settings,chosen,events,duration,groups,mode,guide,keyMap,geometry,mapBase,recording,spacePedal,midiPedal};
 const updateGuide=useCallback(value=>{guideRef.current=value;setGuide(value)},[]);
 const update=useCallback((key,value)=>setSettings(s=>normalizePianoSettings({...s,[key]:value})),[]);
 const notice=useCallback(text=>setMessage(text),[]);
 useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),6500);return()=>clearTimeout(timer)},[message]);
 useEffect(()=>{try{localStorage.setItem(storageKey+':settings',JSON.stringify(settings))}catch{}},[settings,storageKey]);
 useEffect(()=>{try{localStorage.setItem(storageKey+':favorites',JSON.stringify(favorites));localStorage.setItem(storageKey+':progress',JSON.stringify(saved))}catch{}},[favorites,saved,storageKey]);
 useEffect(()=>{let live=true;loadPianoTracks(owner).then(t=>{if(live)setImports(t)}).catch(()=>{});return()=>{live=false}},[owner]);
 useEffect(()=>{
  mounted.current=true;audio.current=createAudio({onState:value=>{if(mounted.current)setAudioInfo(value)}});
  transport.current=new PianoTransport(audio.current,{onChange:value=>{if(mounted.current)setPlaying(value)},onEnd:()=>{if(mounted.current)notice('Tanlangan parcha yakunlandi. Endi o‘zingiz sinab ko‘ring.')}});
  return()=>{mounted.current=false;transport.current?.destroy();audio.current?.dispose();if(midi.current){midi.current.onstatechange=null;for(const input of midi.current.inputs.values())input.onmidimessage=null}onActive(false)};
 },[onActive,notice,createAudio]);
 useEffect(()=>audio.current?.apply(settings),[settings]);
 useEffect(()=>audio.current?.setSustain(settings.sustain||spacePedal||midiPedal),[settings.sustain,spacePedal,midiPedal]);
 useEffect(()=>transport.current?.setSpeed(settings.speed),[settings.speed]);
 useEffect(()=>{if(transport.current){transport.current.loop=settings.loop;transport.current.setMetronome(settings.metronome)}},[settings.loop,settings.metronome]);
 useEffect(()=>{
  transport.current?.load(events,duration,chosen.bpm||90);updateGuide(emptyGuide());setPosition(0);
 },[events,duration,chosen.bpm,updateGuide]);
 useEffect(()=>{updateGuide(emptyGuide())},[settings.hand,updateGuide]);
 useEffect(()=>{
  if(mode!=='guide'||!groups[guide.index]?.notes.length)return;
  const n=groups[guide.index].notes[0],outside=groups[guide.index].notes.some(note=>note<geometry.first||note>geometry.last);
  if(outside){update('keys',88);return}
  revealNote(scroll.current,n);
 },[mode,guide.index,groups,geometry,update]);
 useEffect(()=>{if(mode==='auto'&&playing&&events.some(n=>n.midi<geometry.first||n.midi>geometry.last))update('keys',88)},[mode,playing,events,geometry,update]);
 useEffect(()=>{onActive(playing||guide.running||recording)},[playing,guide.running,recording,onActive]);
 const releaseSource=useCallback(source=>{
  const item=sources.current.get(source);if(!item)return;
  audio.current?.release(item.voice);sources.current.delete(source);
  setHeld(new Set([...sources.current.values()].map(v=>v.midi)));
  const rec=take.current;if(rec?.active){const start=rec.down.get(source);if(start){rec.notes.push({...start,duration:Math.max(.04,(performance.now()-rec.started)/1000-start.time)});rec.down.delete(source)}}
 },[]);
 const allOff=useCallback(()=>{
  for(const source of [...sources.current.keys()])releaseSource(source);pointers.current.clear();audio.current?.allOff();setHeld(new Set());setSpacePedal(false);setMidiPedal(false);
 },[releaseSource]);
 const press=useCallback((midiNote,source,velocity=.8)=>{
  if(!Number.isInteger(midiNote)||midiNote<21||midiNote>108||sources.current.has(source))return;
  try{
   const voice=audio.current.noteOn(midiNote,velocity);if(voice==null)return;sources.current.set(source,{midi:midiNote,voice});setHeld(new Set([...sources.current.values()].map(v=>v.midi)));
   const rec=take.current;if(rec?.active)rec.down.set(source,{midi:midiNote,time:(performance.now()-rec.started)/1000,velocity,hand:midiNote>=60?'right':'left'});
   const r=runtime.current,g=guideRef.current,group=r.groups[g.index];
   if(r.mode==='guide'&&g.running&&group){
    if(!group.notes.includes(midiNote)){updateGuide({...g,wrong:g.wrong+1});return}
    if(g.matched.includes(midiNote))return;
    const matched=[...g.matched,midiNote];
    if(group.notes.every(n=>matched.includes(n))){
     const index=g.index+1,done=index>=r.groups.length,next={...g,index,hits:g.hits+1,matched:[],running:!done};updateGuide(next);
     if(done){
      const accuracy=Math.round(next.hits/(next.hits+next.wrong||1)*100);
      setSaved(old=>({...old,[r.chosen.id]:{accuracy,steps:next.hits,date:Date.now()}}));notice('Ajoyib! Mashq tugadi. Aniqlik: '+accuracy+'%.');
     }
    }else updateGuide({...g,matched});
   }
  }catch(e){notice(e.message)}
 },[notice,updateGuide]);
 useEffect(()=>{
  const editable=e=>e.target?.closest?.('input,textarea,select,[contenteditable="true"],[role="dialog"]');
  const down=e=>{
   if(e.code==='Escape'){allOff();transport.current?.pause();updateGuide({...guideRef.current,running:false});return}
   if(e.ctrlKey||e.metaKey||e.altKey||editable(e)||e.repeat)return;
   if(e.code==='Space'){e.preventDefault();setSpacePedal(true);audio.current?.setSustain(true);return}
   const n=runtime.current.keyMap.get(e.code);if(n!==undefined){e.preventDefault();press(n,'key:'+e.code)}
  };
  const up=e=>{if(e.code==='Space'){setSpacePedal(false);audio.current?.setSustain(runtime.current.settings.sustain||runtime.current.midiPedal)}releaseSource('key:'+e.code)};
  const blur=()=>{allOff();transport.current?.pause();updateGuide({...guideRef.current,running:false})};
  const visibility=()=>{if(document.hidden)blur()};
  const pointerEnd=e=>{pointers.current.delete(e.pointerId);releaseSource('pointer:'+e.pointerId)};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);window.addEventListener('pointerup',pointerEnd);window.addEventListener('pointercancel',pointerEnd);document.addEventListener('visibilitychange',visibility);
  return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);window.removeEventListener('pointerup',pointerEnd);window.removeEventListener('pointercancel',pointerEnd);document.removeEventListener('visibilitychange',visibility);allOff()};
 },[allOff,press,releaseSource,updateGuide]);
 useEffect(()=>{
  if(!help)return;const old=document.activeElement;helpRef.current?.querySelector('button')?.focus();
  const trap=e=>{if(e.key==='Escape'){e.stopPropagation();setHelp(false)}if(e.key==='Tab'){const items=[...helpRef.current.querySelectorAll('button,a')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};
  document.addEventListener('keydown',trap,true);return()=>{document.removeEventListener('keydown',trap,true);old?.focus?.()};
 },[help]);
 useEffect(()=>{
  let frame=0,lastUi=0,lastFollow=null,palette={right:'#E7CC73',left:'#B8C6E3',guide:'#C74B2D',ink:'#38382B',onAccent:'#FFFFFF',paper:'#F8F2E7'};const buffer=new Uint8Array(256);
  const draw=now=>{
   frame=requestAnimationFrame(draw);const r=runtime.current,cv=canvas.current,sc=scroll.current,pos=r.mode==='guide'?(r.groups[guideRef.current.index]?.time||0):transport.current?.position()||0;
   // Playback/recording state must progress even with a hidden or absent note canvas.
   if(now-lastUi>70){
    lastUi=now;setPosition(transport.current?.position()||0);
    if(root.current){const styles=window.getComputedStyle(root.current),color=(name,fallback)=>styles.getPropertyValue(name).trim()||fallback;palette={right:color('--pw-tape',palette.right),left:color('--pw-blue',palette.left),guide:color('--pw-accent',palette.guide),ink:color('--pw-ink',palette.ink),onAccent:color('--pw-on-accent',palette.onAccent),paper:color('--pw-paper',palette.paper)}}
    const autoEvents=r.mode==='auto'&&transport.current?.playing?r.events.filter(e=>e.time<=pos&&e.time+e.duration>pos):[],autoNotes=new Set(autoEvents.map(e=>e.midi));
    if(sc){
     for(const key of sc.querySelectorAll('.cp-key'))key.classList.toggle('cp-auto-active',autoNotes.has(Number(key.dataset.note)));
     const focus=(autoEvents.find(e=>e.hand==='right')||autoEvents[0])?.midi??null;
     if(r.settings.follow&&focus!==null&&focus!==lastFollow)revealNote(sc,focus);lastFollow=focus;
    }
    if(audio.current?.analyser&&meter.current){audio.current.analyser.getByteTimeDomainData(buffer);let sum=0;for(const v of buffer)sum+=((v-128)/128)**2;meter.current.style.setProperty('--level',Math.min(100,Math.sqrt(sum/buffer.length)*330)+'%')}
    if(take.current?.active){const seconds=Math.min(300,(performance.now()-take.current.started)/1000);setRecordSeconds(seconds);if(seconds>=300)finishRecording.current()}
   }
   if(!cv||!sc)return;
   const ratio=Math.min(window.devicePixelRatio||1,2),w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
   if(cv.width!==Math.round(w*ratio)||cv.height!==Math.round(h*ratio)){cv.width=Math.round(w*ratio);cv.height=Math.round(h*ratio)}
   const ctx=cv.getContext('2d');if(!ctx)return;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
   const whiteWidth=Math.max(34,sc.clientWidth/r.geometry.whites),left=sc.scrollLeft;
   for(const k of r.geometry.keys){
    const x=k.x*whiteWidth-left;if(x+whiteWidth<0||x>w)continue;
    ctx.globalAlpha=k.black?.018:.035;ctx.fillStyle=palette.ink;ctx.fillRect(x,0,k.width*whiteWidth,h);
    if(!k.black){ctx.globalAlpha=.08;ctx.strokeStyle=palette.ink;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}ctx.globalAlpha=1;
   }
   const horizon=4,scale=(h-22)/horizon;
   for(const e of r.events){
    if(e.time+e.duration<pos-.12||e.time>pos+horizon)continue;
    const key=r.geometry.keys.find(k=>k.midi===e.midi);if(!key)continue;
    const x=key.x*whiteWidth-left+3,width=key.width*whiteWidth-6;if(x+width<0||x>w)continue;
    const current=e.time<=pos+.025&&e.time+e.duration>pos,guideCurrent=r.mode==='guide'&&Math.abs(e.time-pos)<.05&&r.groups[guideRef.current.index]?.notes.includes(e.midi);
    const y=h-16-(e.time-pos+e.duration)*scale,bh=Math.max(7,e.duration*scale);
    ctx.globalAlpha=r.mode==='guide'&&r.settings.hand!=='both'&&e.hand!==r.settings.hand?.2:current||guideCurrent?1:.72;
    ctx.fillStyle=guideCurrent?palette.guide:e.hand==='left'?palette.left:palette.right;
    ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,width,bh,4);else ctx.rect(x,y,width,bh);ctx.fill();
    if(width>29&&bh>17){ctx.fillStyle=guideCurrent?palette.onAccent:palette.ink;ctx.font='600 10px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(noteName(e.midi),x+width/2,y+Math.min(17,bh-3))}
    ctx.globalAlpha=1;
   }
   ctx.fillStyle=palette.guide;ctx.globalAlpha=.08;ctx.fillRect(0,h-28,w,28);ctx.globalAlpha=1;ctx.fillRect(0,h-16,w,1);
  };frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
 },[]);
 const changeMode=value=>{transport.current?.pause();updateGuide({...guideRef.current,running:false});allOff();setMode(value)};
 const choose=track=>{if(recording){notice('Avval yozishni yakunlang.');return}transport.current?.stop();allOff();updateGuide(emptyGuide());setSelected(track.id);setClipStart(0);setLibraryOpen(false)};
 const togglePlay=async()=>{
  if(chosen.kind==='film'){file.current.click();return}
  try{
   audio.current.ensure();
   if(mode==='guide'){
    if(!groups.length){notice('Bu qo‘l uchun nota topilmadi. “Ikkala qo‘l”ni tanlang.');return}
    const g=guideRef.current;updateGuide(g.index>=groups.length?{...emptyGuide(),running:true}:{...g,running:!g.running});
   }else if(mode==='auto'){if(transport.current.playing)transport.current.pause();else await transport.current.play()}
  }catch(e){notice(e.message)}
 };
 const stop=()=>{transport.current?.stop();updateGuide(emptyGuide());setPosition(0);allOff()};
 const moveTrack=direction=>{const available=[...PIANO_LIBRARY,...imports],i=available.findIndex(t=>t.id===selected);choose(available[(i+direction+available.length)%available.length])};
 const pointerDown=e=>{
  const key=e.target.closest('[data-note]');if(e.button>0||!key||!e.currentTarget.contains(key))return;e.preventDefault();const n=Number(key.dataset.note),source='pointer:'+e.pointerId;
  pointers.current.set(e.pointerId,n);try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}press(n,source,e.pressure>0&&e.pointerType==='pen'?clamp(e.pressure,.2,1):.8);
 };
 const pointerMove=e=>{
  if(!pointers.current.has(e.pointerId))return;
  const key=document.elementFromPoint?.(e.clientX,e.clientY)?.closest('[data-note]'),n=key&&e.currentTarget.contains(key)?Number(key.dataset.note):null,old=pointers.current.get(e.pointerId);
  if(n===old)return;releaseSource('pointer:'+e.pointerId);pointers.current.set(e.pointerId,n);if(n!==null)press(n,'pointer:'+e.pointerId);
 };
 const pointerUp=e=>{pointers.current.delete(e.pointerId);releaseSource('pointer:'+e.pointerId)};
 const saveTrack=async track=>{setImports(old=>[track,...old.filter(t=>t.id!==track.id)]);try{await storePianoTrack(owner,track)}catch{notice('MIDI shu sessiyada ishlaydi. Brauzer doimiy saqlashga ruxsat bermadi.')}};
 const importFile=async e=>{
  const f=e.target.files?.[0];e.target.value='';if(!f)return;
  setLoadingFile(true);
  try{
   if(f.size>5*1024*1024)throw Error('5 MB dan kichik .mid yoki .midi fayl tanlang.');
   const parsed=parseMidi(await f.arrayBuffer()),film=chosen.kind==='film'?chosen:null;
   const track={id:'import-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)),title:film?.title||f.name.replace(/\.(mid|midi)$/i,''),mood:film?.mood||'Mening MIDI',kind:'import',key:'MIDI',difficulty:'MIDI',bpm:parsed.bpm,events:parsed.events,fullDuration:parsed.duration,filmId:film?.id||null,description:'Siz yuklagan MIDI · '+f.name+'. Parcha boshlanishini tanlab, 30 soniyasini mashq qiling.'};
   await saveTrack(track);choose(track);if(parsed.events.some(n=>n.midi<geometry.first||n.midi>geometry.last))update('keys',88);
   notice('MIDI ochildi: '+parsed.events.length+' nota. 30 soniyalik parchani tanlang.');
  }catch(error){notice(error.message)}finally{setLoadingFile(false)}
 };
 const record=async()=>{
  if(!recording){stop();setMode('free');try{audio.current.ensure()}catch(e){notice(e.message);return}take.current={active:true,started:performance.now(),notes:[],down:new Map()};setRecording(true);setRecordSeconds(0);return}
  const r=take.current;if(!r?.active)return;r.active=false;const elapsed=Math.min(300,(performance.now()-r.started)/1000);
  for(const note of r.down.values())if(note.time<elapsed)r.notes.push({...note,duration:Math.max(.001,elapsed-note.time)});r.down.clear();r.notes=r.notes.filter(n=>n.time<elapsed).map(n=>({...n,duration:Math.min(n.duration,elapsed-n.time)}));setRecording(false);allOff();
  if(!r.notes.length){notice('Yozuvda nota yo‘q. Qayta boshlab pianino chaling.');return}
  const track={id:'take-'+Date.now(),title:'Mening ijrom '+new Date().toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'}),kind:'import',mood:'Mening MIDI',key:'MIDI',difficulty:'Ijro',bpm:120,events:r.notes,fullDuration:Math.max(.1,elapsed),description:'Shu qurilmada yozilgan shaxsiy piano ijrosi.'};
  await saveTrack(track);setSelected(track.id);setClipStart(0);setTab('mine');notice('Ijro saqlandi. MIDI tugmasidan yuklab olishingiz mumkin.');
 };
 finishRecording.current=record;
 const connectMidi=async()=>{
  if(!navigator.requestMIDIAccess){notice('Bu brauzer Web MIDI’ni qo‘llamaydi. Kompyuter klaviaturasi yoki sensor orqali chaling.');return}
  try{
   const access=await navigator.requestMIDIAccess({sysex:false});midi.current=access;
   const attach=()=>{
    const inputs=[...access.inputs.values()];setMidiInfo(inputs.length?inputs.map(i=>i.name||'MIDI piano').join(', '):'Ulandi, qurilma kutilmoqda');
    for(const input of inputs)input.onmidimessage=e=>{
     const [status,n,vel]=e.data,type=status&240,ch=status&15,source='midi:'+input.id+':'+ch+':'+n;
     if(type===144&&vel>0)press(n,source,vel/127);
     else if(type===128||type===144)releaseSource(source);
     else if(type===176&&n===64){const down=vel>=64;setMidiPedal(down);audio.current?.setSustain(down||runtime.current.settings.sustain||runtime.current.spacePedal)}
     else if(type===176&&[120,123].includes(n))allOff();
    }
   };attach();access.onstatechange=()=>{allOff();attach()};notice('MIDI kirishi tayyor.');
  }catch{notice('MIDI ruxsati berilmadi. HTTPS/localhost va Web MIDI mavjud brauzerni tekshiring.')}
 };
 const preview=()=>{try{const ctx=audio.current.ensure();audio.current.stopScope('preview');for(const n of target)audio.current.schedule(n,.72,ctx.currentTime+.02,.65,'preview')}catch(e){notice(e.message)}};
 const removeImport=async()=>{if(chosen.kind!=='import')return;stop();const id=chosen.id;try{await deletePianoTrack(owner,id)}catch{}setImports(old=>old.filter(t=>t.id!==id));setSelected(PIANO_LIBRARY[0].id);notice('MIDI qurilmadan o‘chirildi.')};
 const favorite=id=>setFavorites(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
 const activeGuide=guide.running&&mode==='guide';
 const progress=mode==='guide'?Math.min(100,guide.index/Math.max(1,groups.length)*100):position/duration*100;
 const onExit=()=>{if(take.current?.active){notice('Chiqishdan oldin ijro yozuvini yakunlang.');return}stop();onActive(false);onBack()};

 return <main ref={root} className="cinema-piano cp-app">
  <header className="cp-header"><div className="cp-brand"><button className="cp-icon" aria-label="Pianinodan orqaga" onClick={onExit}><ArrowLeft/></button><span className="cp-mark"><Piano/></span><div><small>SINFQUIZ / MUSIQA STUDIYASI</small><b>Kino<span>Piano</span></b></div></div><div className="cp-header-tools"><span className={'cp-audio-state '+(audioInfo.state==='running'?'is-ready':'')}><i/>{audioInfo.state==='running'?'Audio tayyor':'Ovozni yoqing'}</span><button className="cp-button cp-audio-unlock" onClick={()=>{try{audio.current.ensure();notice('Piano tayyor. Klavishlarni bosing.')}catch(e){notice(e.message)}}}><Headphones size={16}/><span>Ovozni yoqish</span></button><button className="cp-icon" aria-label="Piano qo‘llanmasi" onClick={()=>setHelp(true)}><HelpCircle/></button><button className="cp-icon" aria-label="Pianinoni to‘liq ekran qilish" onClick={async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await root.current.requestFullscreen()}catch{notice('Brauzer to‘liq ekran rejimini ocholmadi.')}}}><Expand/></button></div></header>
  <div className="cp-mobile-tools"><button onClick={()=>setLibraryOpen(v=>!v)} aria-expanded={libraryOpen}><Library size={17}/> Kuylar kutubxonasi <ChevronDown size={14}/></button><button onClick={()=>{setLabOpen(v=>!v);if(!labOpen)setTimeout(()=>labRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),60)}} aria-expanded={labOpen}><Settings2 size={17}/> Audio Lab</button></div>
  {message&&<div className="cp-toast" role="status">{message}<button onClick={()=>setMessage('')} aria-label="Xabarni yopish"><X size={15}/></button></div>}
  <div className="cp-layout">
   <aside className={'cp-library '+(libraryOpen?'is-open':'')} aria-label="Piano kuylar kutubxonasi"><div className="cp-library-heading"><span className="cp-overline">SIZNING REPERTUARINGIZ</span><h2>Kuylar kutubxonasi <span>{listBase.length}</span></h2><label className="cp-search"><Search size={16}/><input aria-label="Piano kuyini qidirish" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom yoki kayfiyat bo‘yicha…"/></label></div>
    <div className="cp-tabs" role="group" aria-label="Kutubxona manbasi">{[['practice','Mashqlar'],['film','Kino MIDI'],['mine','Meniki']].map(([id,label])=><button key={id} aria-pressed={tab===id} className={tab===id?'is-selected':''} onClick={()=>{setTab(id);setQuery('');setMood('all')}}>{label}</button>)}</div>
    <div className="cp-filters"><label><span className="cp-sr">Kayfiyat bo‘yicha saralash</span><select value={mood} onChange={e=>setMood(e.target.value)}><option value="all">Barcha kayfiyatlar</option>{[...new Set(listBase.map(t=>t.mood))].map(m=><option key={m}>{m}</option>)}</select></label><button className={'cp-icon '+(onlyFavorites?'is-gold':'')} aria-label="Faqat sevimli kuylar" aria-pressed={onlyFavorites} onClick={()=>setOnlyFavorites(v=>!v)}><Heart size={16}/></button></div>
    {tab==='film'&&<p className="cp-catalog-note">34 kino uchun MIDI joyi. Asl soundtrack notalari kiritilmagan; o‘zingizdagi faylni yuklang.</p>}
    <div className="cp-track-list">{visible.map((t,i)=>{const linked=imports.find(x=>x.filmId===t.id),isSelected=t.id===selected||linked?.id===selected;return <div key={t.id} className={'cp-track '+(isSelected?'is-current':'')} style={{'--track-color':moodColor[t.mood]||'#91b7ba'}}><button className="cp-track-select" onClick={()=>choose(linked||t)}><span className="cp-track-art">{isSelected&&playing?<Waves size={20}/>:<Music2 size={18}/>}<small>{String(i+1).padStart(2,'0')}</small></span><span className="cp-track-copy"><b>{t.title}</b><small>{t.kind==='film'?(linked?'MIDI yuklangan':'MIDI yuklang'):t.kind==='public'?'Jamoat mulki · 30 s':t.kind==='import'?'Shaxsiy MIDI':t.mood+' · 30 s'}</small></span>{saved[t.id]&&<Check size={13} className="cp-track-done"/>}</button><button className={'cp-track-favorite '+(favorites.includes(t.id)?'is-gold':'')} aria-label={t.title+' — sevimli'} aria-pressed={favorites.includes(t.id)} onClick={()=>favorite(t.id)}><Heart size={14}/></button></div>})}{!visible.length&&<div className="cp-empty"><Music2/><b>{tab==='mine'?'Hali MIDI yuklanmagan':'Kuy topilmadi'}</b><p>{tab==='mine'?'O‘z MIDI faylingizni qo‘shing yoki ijroingizni yozing.':'Qidiruv yoki saralashni o‘zgartiring.'}</p></div>}</div>
    <button className="cp-import-button" disabled={loadingFile} onClick={()=>file.current.click()}><Upload size={17}/>{loadingFile?'MIDI ochilmoqda…':'MIDI fayl yuklash'}<span>.mid</span></button>
   </aside>
   <section className="cp-workspace" aria-label="Piano ijro maydoni">
    <div className="cp-feature"><div className="cp-cover" style={{'--cover-color':moodColor[chosen.mood]||'#92b9b5'}} aria-hidden="true"><div className="cp-cover-orbit"/><div className="cp-cover-star"/><span>PIANO<br/>SESSIONS</span><small>VOL. 01</small></div><div className="cp-feature-copy"><span className="cp-overline">{chosen.kind==='film'?'SIZNING MIDI ARANJIROVKANGIZ':chosen.kind==='import'?'SHAXSIY MIDI STUDIYASI':chosen.kind==='public'?'KLASSIK MELODIYA':'ORIGINAL CINEMATIC SESSION'}</span><h1>{chosen.title}</h1><p>{chosen.kind==='film'?chosen.description:chosen.kind==='public'?chosen.credit:chosen.mood+' kayfiyati. Har bir klavishda yangi sahna.'}</p><div className="cp-badges"><span>{chosen.kind==='film'?'MIDI kutilmoqda':clock(duration)+' parcha'}</span>{chosen.key&&<span>{chosen.key}</span>}{chosen.difficulty&&<span>{chosen.difficulty}</span>}{chosen.bpm&&<span>{chosen.bpm} BPM</span>}</div></div><button className={'cp-icon cp-feature-heart '+(favorites.includes(chosen.id)?'is-gold':'')} aria-label="Joriy kuyni sevimliga qo‘shish" aria-pressed={favorites.includes(chosen.id)} onClick={()=>favorite(chosen.id)}><Heart/></button></div>
    {chosen.kind==='film'?<div className="cp-film-upload"><Upload size={28}/><h2>{chosen.title} musiqasini yuklang</h2><p>O‘zingizdagi MIDI faylni tanlang. Ilova notalarni o‘qiydi, 30 soniyalik parchani kesadi va yoritib o‘rgatadi.</p><button className="cp-primary" onClick={()=>file.current.click()}><Upload size={17}/> MIDI tanlash</button></div>:<>
    {chosen.kind==='import'&&<div className="cp-clip"><label>Parcha boshlanishi <input type="number" aria-label="MIDI parchasining boshlanish soniyasi" min="0" max={Math.max(0,chosen.fullDuration-.1).toFixed(2)} step=".5" value={clipStart} onChange={e=>{stop();setClipStart(clamp(Number(e.target.value)||0,0,Math.max(0,chosen.fullDuration-.1)))}}/> soniya</label><small>Fayl: {clock(chosen.fullDuration)} · joriy parcha: {clock(duration)}</small><button className="cp-icon" aria-label="Joriy MIDI faylni o‘chirish" onClick={removeImport}><Trash2 size={16}/></button></div>}
    <div className="cp-mode-row"><div className="cp-modes" role="group" aria-label="Piano ijro rejimi">{[['auto','Tinglash',Headphones],['guide','O‘rganish',Radio],['free','Erkin ijro',Piano]].map(([id,label,Icon])=><button key={id} aria-pressed={mode===id} className={mode===id?'is-selected':''} onClick={()=>changeMode(id)}><Icon size={15}/>{label}</button>)}</div><label className="cp-hand-label">Qo‘l <select aria-label="Mashq qilinadigan qo‘l" value={settings.hand} onChange={e=>update('hand',e.target.value)}><option value="right">O‘ng · melodiya</option><option value="left">Chap · jo‘r bo‘lish</option><option value="both">Ikkala qo‘l</option></select></label></div>
    <div className="cp-roll"><div className="cp-roll-caption"><span><i className="cp-dot gold"/> O‘ng qo‘l <i className="cp-dot blue"/> Chap qo‘l</span><small>{mode==='guide'?'Siz chalmaguningizcha keyingi notaga o‘tmaydi':'Notalar vaqt chizig‘i bo‘ylab tushadi'}</small></div><canvas ref={canvas} aria-label="Piano notalari vaqt chizig‘i"/><div className="cp-roll-edge"><span>CINEMA GRAND / STEREO</span><span>{noteName(geometry.first)} — {noteName(geometry.last)}</span></div></div>
    <div className="cp-guide-status" aria-live="polite"><span><i className={playing||activeGuide?'is-lit':''}/>{statusText}</span>{mode==='guide'?<div><b>{target.length?target.map(noteName).join(' + '):'Mashq tugadi'}</b><button onClick={preview} disabled={!target.length}><Volume2 size={14}/> Namuna</button><small>{Math.min(guide.index,groups.length)}/{groups.length} · {Math.round(guide.hits/(guide.hits+guide.wrong||1)*100)}%</small></div>:<small>{recording?'Yozuv '+clock(recordSeconds):'Z → '+noteName(mapBase)+' · I → '+noteName(mapBase+24)}</small>}</div>
    </>}
    <div className="cp-piano-shell"><div className="cp-piano-top"><span><Piano size={15}/> CINEMA GRAND</span><div><button aria-label="Pastki oktavaga o‘tish" disabled={settings.octave<=-2} onClick={()=>{allOff();update('octave',settings.octave-1)}}><Minus size={13}/></button><b>Oktava {settings.octave>0?'+':''}{settings.octave}</b><button aria-label="Yuqori oktavaga o‘tish" disabled={settings.octave>=2} onClick={()=>{allOff();update('octave',settings.octave+1)}}><Plus size={13}/></button><select aria-label="Ko‘rsatiladigan piano klavishlari" value={settings.keys} onChange={e=>{allOff();update('keys',Number(e.target.value))}}>{[25,37,49,88].map(n=><option key={n} value={n}>{n} klavish</option>)}</select></div></div>
     <div className="cp-keyboard-scroll" ref={scroll} tabIndex={0} aria-label="Piano klaviaturasini yon tomonga surish"><div className="cp-keyboard" role="group" aria-label="Virtual piano klaviaturasi" style={{'--white-count':geometry.whites}} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onLostPointerCapture={pointerUp}>{geometry.keys.filter(k=>!k.black).concat(geometry.keys.filter(k=>k.black)).map(k=><button key={k.midi} tabIndex={-1} data-note={k.midi} aria-label={noteName(k.midi)+' notasi'} aria-pressed={held.has(k.midi)} className={'cp-key '+(k.black?'cp-black':'cp-white')+(held.has(k.midi)?' is-held':'')+(target.includes(k.midi)?' is-target':'')+(guide.matched.includes(k.midi)?' is-matched':'')} style={{left:'calc(var(--key-width) * '+k.x+')',width:'calc(var(--key-width) * '+k.width+')'}}><span className="cp-note-label">{settings.labels?noteName(k.midi):''}</span>{settings.shortcuts&&mappedLabels.has(k.midi)&&<kbd>{mappedLabels.get(k.midi)}</kbd>}</button>)}</div></div>
     <div className="cp-keyboard-pan"><button aria-label="Piano klaviaturasini chapga surish" onClick={()=>scroll.current?.scrollBy({left:-240,behavior:'smooth'})}><ArrowLeft size={13}/> Past notalar</button><small>Klaviaturani suring</small><button aria-label="Piano klaviaturasini o‘ngga surish" onClick={()=>scroll.current?.scrollBy({left:240,behavior:'smooth'})}>Yuqori notalar <ArrowRight size={13}/></button></div>
     <div className="cp-piano-bottom"><span><Keyboard size={14}/> Kompyuter, sichqoncha yoki sensor</span><button className={settings.sustain||spacePedal||midiPedal?'pedal-down':''} aria-pressed={settings.sustain} onClick={()=>update('sustain',!settings.sustain)}><i/>{settings.sustain||spacePedal||midiPedal?'Sustain bosilgan':'Sustain'}<kbd>SPACE</kbd></button></div>
    </div>
    <div className="cp-transport"><div className="cp-transport-main"><button className="cp-icon" aria-label="Oldingi kuy" onClick={()=>moveTrack(-1)}><SkipBack size={18}/></button><button className="cp-main-play" aria-label={mode==='guide'?(guide.running?'Mashqni pauza qilish':'O‘rganishni boshlash'):playing?'Kuyni pauza qilish':'Kuyni tinglash'} disabled={mode==='free'||recording} onClick={togglePlay}>{playing||activeGuide?<Pause size={23} fill="currentColor"/>:<Play size={23} fill="currentColor"/>}</button><button className="cp-icon" aria-label="Keyingi kuy" onClick={()=>moveTrack(1)}><SkipForward size={18}/></button><button className="cp-icon" aria-label="Ijroni to‘xtatish" onClick={stop}><Square size={16}/></button></div><div className="cp-timeline"><div><span>{mode==='guide'?clock(groups[guide.index]?.time||0):clock(position)}</span><b>{mode==='guide'?'NOTA-BA-NOTA MASHQ':'30 SONIYALIK SESSIYA'}</b><span>{clock(duration)}</span></div><input aria-label="Piano ijro vaqti" type="range" min="0" max="100" step=".1" value={progress} disabled={mode!=='auto'||chosen.kind==='film'} onChange={e=>transport.current.seek(Number(e.target.value)/100*duration)}/></div><div className="cp-transport-extra"><button className={'cp-icon '+(settings.loop?'is-gold':'')} aria-label="Kuyni takrorlash" aria-pressed={settings.loop} onClick={()=>update('loop',!settings.loop)}><Repeat2 size={18}/></button><label className="cp-speed"><span className="cp-sr">Ijro tezligi</span><select aria-label="Ijro tezligi" value={settings.speed} onChange={e=>update('speed',Number(e.target.value))}>{[.5,.75,1,1.25,1.5].map(n=><option key={n} value={n}>{n}×</option>)}</select></label></div></div>
    <div className="cp-session-foot"><span>Boy garmonik pianino · Web Audio</span><div><button className={recording?'cp-record is-recording cp-stop-record':'cp-record'} onClick={record}><i/>{recording?'Yozishni tugatish '+clock(recordSeconds):'Ijroni yozish'}</button><button onClick={()=>{const notes=chosen.kind==='film'?[]:events;if(!notes.length){notice('Eksport uchun avval kuy yoki MIDI tanlang.');return}download(encodeMidi(notes),(chosen.title.replace(/[^a-z0-9 -]/gi,'')||'SinfQuiz-Piano')+'.mid')}}><Download size={14}/> MIDI</button><button aria-label="Barcha piano tovushlarini o‘chirish" onClick={()=>{stop();notice('Barcha tovushlar to‘xtatildi.')}}>Panic <kbd>Esc</kbd></button></div></div>
   </section>
   <aside ref={labRef} className={'cp-lab '+(labOpen?'is-open':'')} aria-label="MIDI va Audio Lab"><div className="cp-lab-title"><span className="cp-overline">TOVUSHNI O‘ZINGIZ SOZLANG</span><h2><Settings2 size={18}/> Audio Lab</h2><p>O‘zingizga mos ijro muhiti.</p></div>
    <div className="cp-sound-preset"><span className="cp-preset-icon"><Piano size={25}/></span><div><b>Cinema Grand</b><small>Garmonik akustik tembr</small></div><Check size={15}/></div>
    <Range name="volume" label="Ovoz balandligi" icon={Volume2} value={settings.volume} onChange={v=>update('volume',v)}/>
    <Range name="gain" label="Master Gain" value={settings.gain} min={.25} max={1.5} format={v=>v.toFixed(2)+'×'} onChange={v=>update('gain',v)}/>
    <Range name="reverb" label="Reverb / aks-sado" icon={Waves} value={settings.reverb} onChange={v=>update('reverb',v)}/>
    <div className="cp-lab-divider"/>
    <Toggle label="Sustain pedal" detail="Notani uzoqroq ushlab turadi" checked={settings.sustain} onChange={v=>update('sustain',v)}/>
    <Toggle label="Nota nomlari" detail="C4, D4, E4…" checked={settings.labels} onChange={v=>update('labels',v)}/>
    <Toggle label="Klaviatura harflari" detail="Z S X D C V… / Q 2 W 3…" checked={settings.shortcuts} onChange={v=>update('shortcuts',v)}/>
    <Toggle label="Notalarni kuzatish" detail="Avtoijroda pianino notaga qarab suriladi" checked={settings.follow} onChange={v=>update('follow',v)}/>
    <Toggle label="Metronom" detail="Avtoijroda taktni eshiting" checked={settings.metronome} onChange={v=>update('metronome',v)}/>
    <div className="cp-lab-divider"/>
    <div className="cp-midi"><span className="cp-overline">TASHQI KLAVIATURA</span><b><Radio size={16}/> MIDI ulanishi</b><p>{midiInfo}</p><button className="cp-button" onClick={connectMidi}><Plus size={15}/> MIDI qurilma ulash</button></div>
    <div className="cp-output"><span>MASTER OUTPUT <b>{audioInfo.sampleRate?(audioInfo.sampleRate/1000).toFixed(1)+' kHz':'—'}</b></span><div className="cp-meter" ref={meter}><i/></div><div><small>Bufer taxmini</small><b>{audioInfo.latency?audioInfo.latency.toFixed(1)+' ms':'—'}</b></div></div>
    <button className="cp-reset" onClick={()=>{allOff();setSettings(normalizePianoSettings());notice('Piano sozlamalari tiklandi.')}}><RotateCcw size={14}/> Sozlamalarni tiklash</button>
    <p className="cp-latency-note">Interactive audio rejimi. Amaldagi kechikish qurilma va audio chiqishiga bog‘liq; mutlaq 0 ms kafolatlanmaydi.</p>
   </aside>
  </div>
  <input ref={file} type="file" accept=".mid,.midi,audio/midi,audio/x-midi" hidden onChange={importFile}/>
  {help&&<div className="cp-dialog-shade"><section ref={helpRef} className="cp-help" role="dialog" aria-modal="true" aria-labelledby="cp-help-title"><button className="cp-icon cp-close" aria-label="Piano qo‘llanmasini yopish" onClick={()=>setHelp(false)}><X/></button><span className="cp-overline">BIRINCHI SESSIYANGIZ</span><h2 id="cp-help-title">Bir kuy. Uch xil imkoniyat.</h2><ol><li><b>Tinglash.</b> Tayyor kuyni tanlang va Play bosing. Pastga tushayotgan notalar piano klavishlariga mos keladi.</li><li><b>O‘rganish.</b> Yoritilgan notalarni chaling. To‘g‘ri nota yoki akkord tugamaguncha mashq kutib turadi. “Namuna” joriy notalarni eshittiradi.</li><li><b>Erkin ijro.</b> Sensor, sichqoncha, kompyuter yoki MIDI klaviaturada chaling. Space — vaqtinchalik sustain, Esc — barcha tovushlarni to‘xtatish.</li></ol><p><b>Kino repertuari:</b> 34 kino nomi MIDI yuklash uchun katalogdir. Asl film musiqalari kiritilmagan. 32 original mashq va 6 jamoat mulkidagi kuy tayyor ishlaydi.</p><p><b>MIDI:</b> .mid/.midi format 0 yoki 1. Faylda istalgan boshlanish soniyasini tanlang: undan 30 soniyagacha parcha olinadi. Qisqa MIDI qisqa holicha qoladi. Qo‘llar MIDI notalari uchun C4 chegarasi bilan taxminan ajratiladi.</p><p><b>Yozuv:</b> faqat siz bosgan notalar yoziladi, avtoijro yozilmaydi. Yozuvni to‘xtatgach, “Meniki” ichidan topasiz va MIDI qilib yuklaysiz. Fayllar shu brauzerda va joriy hisob uchun saqlanadi.</p><p><b>Tovush:</b> bu ko‘p qatlamli sintezlangan piano; tashqi akustik namuna banki yuklanmaydi. Ovoz birinchi bosishdan so‘ng faollashadi. MIDI qurilma ulanishi brauzer qo‘llovi va HTTPS/localhost talablariga bog‘liq.</p><div className="cp-help-links"><a href="https://www.w3.org/TR/webaudio/" target="_blank" rel="noreferrer">Web Audio standarti <ArrowRight size={13}/></a><a href="https://www.w3.org/TR/webmidi/" target="_blank" rel="noreferrer">Web MIDI standarti <ArrowRight size={13}/></a></div></section></div>}
 </main>;
}
