// Original practice scores and public-domain melodies. No copyrighted film scores.
export const NOTE_NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
export const noteName=n=>NOTE_NAMES[((n%12)+12)%12]+(Math.floor(n/12)-1);
export const frequency=n=>440*Math.pow(2,(n-69)/12);
export const blackNote=n=>[1,3,6,8,10].includes(n%12);
export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const DEFAULT_PIANO_SETTINGS={volume:.72,gain:1,reverb:.24,sustain:false,octave:0,labels:true,shortcuts:true,follow:true,speed:1,keys:49,hand:'right',metronome:false,loop:false};
export function normalizePianoSettings(value={}){
 const s={...DEFAULT_PIANO_SETTINGS,...value},num=(key,a,b)=>s[key]=Number.isFinite(Number(s[key]))?clamp(Number(s[key]),a,b):DEFAULT_PIANO_SETTINGS[key];
 num('volume',0,1);num('gain',.25,1.5);num('reverb',0,1);num('speed',.5,1.5);
 s.octave=Math.round(clamp(Number(s.octave)||0,-2,2));
 s.keys=[25,37,49,88].includes(Number(s.keys))?Number(s.keys):37;
 s.hand=['right','left','both'].includes(s.hand)?s.hand:'right';
 for(const k of ['sustain','labels','shortcuts','follow','metronome','loop'])s[k]=Boolean(s[k]);
 return s;
}
export const KEY_CODES=['KeyZ','KeyS','KeyX','KeyD','KeyC','KeyV','KeyG','KeyB','KeyH','KeyN','KeyJ','KeyM','KeyQ','Digit2','KeyW','Digit3','KeyE','KeyR','Digit5','KeyT','Digit6','KeyY','Digit7','KeyU','KeyI'];
export const KEY_LABELS=['Z','S','X','D','C','V','G','B','H','N','J','M','Q','2','W','3','E','R','5','T','6','Y','7','U','I'];
const originals=[
 ['Orbital Dawn','Kosmik','A minor',57,[0,2,4,1,5,4,2,6],[0,5,3,4],0],
 ['Velvet Horizon','Drama','C major',60,[4,2,6,5,1,3,0,2],[0,4,5,3],1],
 ['Midnight Platform','Sirli','D minor',62,[0,3,1,4,6,2,5,1],[0,3,5,4],2],
 ['A Letter in Rain','Romantik','F major',53,[2,4,1,5,3,6,4,0],[0,5,1,4],3],
 ['Amber Waltz','Vals','G major',55,[0,4,2,5,1,6,3,2],[0,3,4,0],4],
 ['The Quiet Astronaut','Kosmik','E minor',64,[1,4,0,6,3,5,2,4],[0,5,3,4],5],
 ['Paper Lanterns','Fantaziya','C major',60,[5,1,3,0,4,2,6,3],[0,1,4,3],6],
 ['After the Credits','Drama','A minor',57,[3,5,2,0,6,1,4,2],[0,3,4,5],7],
 ['The Last Lighthouse','Sarguzasht','D minor',62,[0,4,6,2,5,1,3,6],[0,5,3,4],8],
 ['Golden Hour Café','Romantik','F major',53,[4,1,5,2,6,3,0,4],[0,4,1,3],9],
 ['Snow over Kyoto','Fantaziya','E minor',64,[2,5,0,3,6,1,4,0],[0,3,5,1],10],
 ['The Unsent Postcard','Drama','G major',55,[6,2,4,0,3,1,5,2],[0,5,4,3],11],
 ['Clockwork Garden','Sirli','A minor',57,[1,3,6,0,4,2,5,3],[0,1,5,4],12],
 ['Blue Departure','Kosmik','C major',60,[0,5,2,6,1,4,3,5],[0,4,3,5],13],
 ['Summer on Film','Romantik','F major',53,[5,3,1,6,2,0,4,1],[0,3,1,4],14],
 ['Footsteps in Fog','Sirli','D minor',62,[2,0,4,6,3,1,5,4],[0,5,1,4],15],
 ['The Smallest Hero','Sarguzasht','G major',55,[0,2,5,3,6,4,1,5],[0,4,5,1],16],
 ['Glass Constellation','Kosmik','E minor',64,[4,6,1,3,0,5,2,1],[0,5,4,3],17],
 ['A Room with Stars','Fantaziya','A minor',57,[6,3,0,4,2,5,1,0],[0,3,1,5],18],
 ['Between Two Cities','Drama','C major',60,[3,0,5,1,4,6,2,5],[0,1,3,4],19],
 ['Silver Bicycle','Romantik','G major',55,[1,5,3,6,0,2,4,3],[0,4,1,5],20],
 ['The Hidden Library','Fantaziya','D minor',62,[5,2,0,4,1,6,3,0],[0,3,4,1],21],
 ['Slow Motion Memory','Drama','F major',53,[0,6,4,2,5,3,1,4],[0,5,3,1],22],
 ['Moonlit Harbour','Romantik','E minor',64,[2,4,0,5,3,1,6,5],[0,3,5,4],23],
 ['The Copper Compass','Sarguzasht','A minor',57,[4,0,3,6,1,5,2,3],[0,4,3,1],24],
 ['First Light Express','Sarguzasht','C major',60,[0,3,5,2,4,1,6,4],[0,5,1,3],25],
 ['Underwater Letters','Kosmik','D minor',62,[6,4,2,5,0,3,1,2],[0,3,1,4],26],
 ['A Thousand Windows','Drama','G major',55,[3,1,4,0,5,2,6,1],[0,1,4,5],27],
 ['Portrait in Sepia','Romantik','F major',53,[1,6,3,5,2,4,0,6],[0,4,3,5],28],
 ['The Wandering Planet','Kosmik','E minor',64,[5,0,2,4,6,3,1,4],[0,5,1,3],29],
 ['Fireflies at Dawn','Fantaziya','C major',60,[2,6,1,5,0,4,3,1],[0,3,5,4],30],
 ['One More Scene','Sarguzasht','A minor',57,[0,4,1,6,2,5,3,4],[0,1,3,5],31],
];
const rhythms=[[.5,.5,1,.5,.5,1],[1,.5,.5,1,1],[.75,.25,.5,.5,1,1],[.5,1,.5,.5,1,.5]];
const addNote=(a,time,midi,duration,hand='right',velocity=.76)=>a.push({time:+time.toFixed(5),midi:clamp(Math.round(midi),21,108),duration:+Math.max(.05,duration).toFixed(5),hand,velocity});
function originalScore(row){
 const [title,mood,key,root,motif,progression,index]=row,minor=key.includes('minor'),scale=minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
 const bpm=[80,96,72,88,90,76,100,84][index%8],beat=60/bpm,events=[];
 const degree=n=>root+scale[((n%7)+7)%7]+Math.floor(n/7)*12;
 let t=0,phrase=0;
 while(t<29.8){
  const r=rhythms[index%rhythms.length];
  for(let j=0;j<r.length&&t<29.8;j++){
   const d=r[j]*beat,offset=phrase%4===3?(index%3===0?2:-1):0;
   const midi=degree(motif[(j+phrase*3)%motif.length]+offset);
   addNote(events,t,midi,Math.min(d*.8,30-t), 'right',.68+(j%3)*.055);t+=d;
  }
  phrase++;
 }
 for(let bar=0;bar*beat*4<29.8;bar++){
  const at=bar*beat*4,deg=progression[bar%4],base=degree(deg)-12;
  const chord=[base,degree(deg+2)-12,degree(deg+4)-12];
  if(index%3===0)chord.forEach((n,i)=>addNote(events,at+i*.018,n,Math.min(beat*3.6,30-at-i*.018),'left',.43));
  else for(let k=0;k<8;k++){const start=at+k*beat/2;if(start>=29.9)break;addNote(events,start,chord[(k+(index%2))%3],Math.min(beat*.82,30-start),'left',.42+(k%2)*.05)}
 }
 return {id:'original-'+String(index+1).padStart(2,'0'),title,mood,key,bpm,kind:'original',difficulty:index%3===0?'Oson':index%3===1?'O‘rta':'Ilg‘or',duration:30,events:events.sort((a,b)=>a.time-b.time||a.midi-b.midi),description:'Kino kayfiyatidagi original 30 soniyalik piano mashqi. Melodiya va jo‘r bo‘lishni alohida o‘rganing.'};
}
const publicMelodies=[
 {title:'Ode to Joy',credit:'L. van Beethoven · 1824',bpm:100,key:'C major',melody:[64,64,65,67,67,65,64,62,60,60,62,64,64,62,62,64,64,65,67,67,65,64,62,60,60,62,64,62,60,60]},
 {title:'Twinkle, Twinkle',credit:'An’anaviy fransuz kuyi · XVIII asr',bpm:96,key:'C major',melody:[60,60,67,67,69,69,[67,2],65,65,64,64,62,62,[60,2],67,67,65,65,64,64,[62,2],67,67,65,65,64,64,[62,2]]},
 {title:'Frère Jacques',credit:'An’anaviy fransuz kuyi',bpm:104,key:'C major',melody:[60,62,64,60,60,62,64,60,64,65,[67,2],64,65,[67,2],[67,.5],[69,.5],[67,.5],[65,.5],64,60,[67,.5],[69,.5],[67,.5],[65,.5],64,60,60,55,[60,2],60,55,[60,2]]},
 {title:'Au clair de la lune',credit:'An’anaviy fransuz kuyi · XVIII asr',bpm:88,key:'C major',melody:[60,60,60,62,[64,2],[62,2],60,64,62,62,[60,4],62,62,62,62,[57,2],[57,2],62,60,59,57,[55,4]]},
 {title:'Amazing Grace',credit:'New Britain · XIX asr',bpm:84,key:'C major',melody:[55,[60,2],[64,.5],[60,.5],[64,2],62,[60,2],57,[55,2],55,[60,2],[64,.5],[60,.5],[64,2],62,[67,5]]},
 {title:'Scarborough Fair',credit:'An’anaviy ingliz kuyi · yangi sodda aranjirovka',bpm:90,key:'D minor',melody:[[62,2],62,69,[69,2],64,65,[64,2],[62,3],[69,2],72,74,[72,2],69,[71,2],67,[69,3],[74,2],74,74,[72,2],69,69,[67,2],65,[64,3],[62,3]]},
];
function publicScore(row,index){
 const events=[],beat=60/row.bpm;let t=0,j=0;
 while(t<29.8){const item=row.melody[j%row.melody.length],[midi,len]=Array.isArray(item)?item:[item,1];addNote(events,t,midi,Math.min(len*beat*.9,30-t));if(j%4===0)addNote(events,t,row.key==='D minor'?50:48,Math.min(beat*3.4,30-t),'left',.4);t+=len*beat;j++}
 return {...row,id:'public-'+index,kind:'public',difficulty:'Oson',mood:'Klassik',duration:30,events,description:row.credit+'. Jamoat mulkidagi melodiya asosida ushbu ilova uchun tuzilgan 30 soniyalik mashq.'};
}
export const PIANO_LIBRARY=[...originals.map(originalScore),...publicMelodies.map(publicScore)];
export const FILM_CATALOG=[
 ['Interstellar','Kosmik'],['Titanic','Romantik'],['Harry Potter','Fantaziya'],['The Lord of the Rings','Fantaziya'],
 ['Inception','Sirli'],['The Godfather','Drama'],['Amélie','Romantik'],['La La Land','Romantik'],
 ['Pirates of the Caribbean','Sarguzasht'],['Star Wars','Kosmik'],['Jurassic Park','Sarguzasht'],['Schindler’s List','Drama'],
 ['Cinema Paradiso','Drama'],['Gladiator','Sarguzasht'],['Braveheart','Sarguzasht'],['The Pianist','Drama'],
 ['The Lion King','Sarguzasht'],['Frozen','Fantaziya'],['Up','Romantik'],['Coco','Drama'],
 ['The Dark Knight','Sirli'],['The Batman','Sirli'],['Spirited Away','Fantaziya'],['Howl’s Moving Castle','Fantaziya'],
 ['Requiem for a Dream','Drama'],['TRON: Legacy','Kosmik'],['Avatar','Fantaziya'],['Dune','Kosmik'],
 ['Forrest Gump','Drama'],['Avengers: Endgame','Sarguzasht'],['Merry Christmas, Mr. Lawrence','Drama'],
 ['The Social Network','Sirli'],['Back to the Future','Sarguzasht'],['The Last of the Mohicans','Sarguzasht'],
].map(([title,mood],i)=>({id:'film-'+i,title,mood,kind:'film',description:'O‘zingizdagi MIDI aranjirovkasini yuklang va uning istalgan 30 soniyasini o‘rganing.'}));

export function clipEvents(events,start=0,length=30){
 return events.filter(n=>n.time<start+length&&n.time+n.duration>start).map(n=>({...n,time:Math.max(0,n.time-start),duration:Math.min(n.time+n.duration,start+length)-Math.max(n.time,start)})).filter(n=>n.duration>.005).sort((a,b)=>a.time-b.time||a.midi-b.midi);
}
export function guideGroups(events,hand='right'){
 const groups=[];
 for(const e of [...events].sort((a,b)=>a.time-b.time)){
  if(hand!=='both'&&e.hand!==hand)continue;
  let g=groups.at(-1);
  if(!g||e.time-g.time>.045){g={time:e.time,notes:[],duration:e.duration};groups.push(g)}
  if(!g.notes.includes(e.midi))g.notes.push(e.midi);
  g.duration=Math.max(g.duration,e.duration);
 }
 return groups;
}
export function keyboardGeometry(count=49,octave=0){
 let first=count===88?21:clamp((count>=49?36:48)+octave*12,21,109-count),last=count===88?108:first+count-1;
 let whites=0;const keys=[];
 for(let n=first;n<=last;n++){
  const black=blackNote(n);keys.push({midi:n,black,x:black?whites-.31:whites,width:black?.62:1});if(!black)whites++;
 }
 return {keys,whites,first,last};
}

// Standard MIDI File type 0/1 parser: running status, tempo maps, overlapping
// voices, channel sustain and SMPTE division. Track 10 percussion is excluded.
export function parseMidi(arrayBuffer){
 const a=new Uint8Array(arrayBuffer);let p=0,eventCount=0,songEndTick=0;
 const need=n=>{if(p+n>a.length)throw Error('MIDI fayl tugallanmagan.')};
 const u8=()=>{need(1);return a[p++]},u16=()=>u8()*256+u8(),u32=()=>u8()*16777216+u8()*65536+u8()*256+u8();
 const text=n=>{need(n);const s=String.fromCharCode(...a.subarray(p,p+n));p+=n;return s};
 const vlq=()=>{let v=0;for(let i=0;i<4;i++){const b=u8();v=v*128+(b&127);if(!(b&128))return v}throw Error('MIDI delta-vaqti yaroqsiz.')};
 if(text(4)!=='MThd')throw Error('Bu Standard MIDI (.mid) fayli emas.');
 const hlen=u32();if(hlen<6||hlen>1024)throw Error('MIDI sarlavhasi noto‘g‘ri.');
 const format=u16(),tracks=u16(),division=u16();if(format>1||!tracks||tracks>256||!division)throw Error('MIDI 0 yoki 1 formati kerak.');
 need(hlen-6);p+=hlen-6;const raw=[],tempos=[{tick:0,micro:500000}],trackNames=[];
 for(let tr=0;tr<tracks;tr++){
  if(text(4)!=='MTrk')throw Error('MIDI trek topilmadi.');
  const size=u32();need(size);const end=p+size;let tick=0,running=0;
  while(p<end){
   if(++eventCount>250000)throw Error('MIDI juda murakkab: 250 000 hodisadan oshdi.');
   tick+=vlq();let status=u8();
   if(status<128){if(!running)throw Error('MIDI running status yaroqsiz.');p--;status=running}
   if(status===255){
    const type=u8(),length=vlq();need(length);if(p+length>end)throw Error('MIDI meta hodisasi tugallanmagan.');
    if(type===81&&length===3)tempos.push({tick,micro:a[p]*65536+a[p+1]*256+a[p+2]});
    if(type===3&&length<256){try{trackNames.push(new TextDecoder().decode(a.subarray(p,p+length)))}catch{}}
    p+=length;continue;
   }
   if(status===240||status===247){const length=vlq();need(length);p+=length;running=0;continue}
   if(status>=240)throw Error('Qo‘llanmaydigan MIDI tizim hodisasi.');
   running=status;const type=status>>4,ch=status&15,b=u8(),c=type===12||type===13?0:u8();
   if(b>127||c>127||p>end)throw Error('MIDI hodisasi noto‘g‘ri.');
   if(ch!==9&&[8,9,11].includes(type))raw.push({tick,type,ch,b,c});
  }
  songEndTick=Math.max(songEndTick,tick);p=end;
 }
 const ppq=division&32768?0:division,tempoMap=[];
 let lastTick=0,seconds=0,micro=500000;
 for(const te of tempos.sort((a,b)=>a.tick-b.tick)){
  if(!te.micro)continue;
  if(ppq)seconds+=(te.tick-lastTick)*micro/(ppq*1e6);
  tempoMap.push({tick:te.tick,seconds,micro:te.micro});lastTick=te.tick;micro=te.micro;
 }
 const fpsRaw=256-(division>>8),fps=fpsRaw===29?29.97:fpsRaw,tpf=division&255;
 if(!ppq&&(![24,25,29,30].includes(fpsRaw)||!tpf))throw Error('MIDI SMPTE vaqti noto‘g‘ri.');
 const toSeconds=tick=>{
  if(!ppq)return tick/(fps*tpf);
  let lo=0,hi=tempoMap.length-1;while(lo<hi){const m=Math.ceil((lo+hi)/2);if(tempoMap[m].tick<=tick)lo=m;else hi=m-1}
  const t=tempoMap[lo];return t.seconds+(tick-t.tick)*t.micro/(ppq*1e6);
 };
 const active=new Map(),sustained=Array.from({length:16},()=>[]),pedals=new Set(),notes=[];
 const close=(note,tick)=>{const end=toSeconds(tick),start=toSeconds(note.tick);if(end>start&&note.b>=21&&note.b<=108)notes.push({midi:note.b,time:start,duration:Math.max(.03,end-start),velocity:note.c/127,hand:note.b>=60?'right':'left'})};
 for(const e of raw.sort((a,b)=>a.tick-b.tick)){
  const key=e.ch+':'+e.b;
  if(e.type===9&&e.c){if(!active.has(key))active.set(key,[]);active.get(key).push(e)}
  else if(e.type===8||e.type===9){const stack=active.get(key),note=stack?.shift();if(note){if(pedals.has(e.ch))sustained[e.ch].push(note);else close(note,e.tick)}}
  else if(e.type===11&&e.b===64){if(e.c>=64)pedals.add(e.ch);else{pedals.delete(e.ch);for(const n of sustained[e.ch])close(n,e.tick);sustained[e.ch]=[]}}
 }
 const last=Math.max(songEndTick,raw.reduce((max,e)=>Math.max(max,e.tick),0));for(const stack of active.values())for(const n of stack)close(n,Math.max(last,n.tick+division/4));for(const ns of sustained)for(const n of ns)close(n,last);
 if(!notes.length)throw Error('Faylda A0–C8 oralig‘idagi piano notalari topilmadi.');
 const origin=notes.reduce((min,n)=>Math.min(min,n.time),Infinity);for(const n of notes)n.time-=origin;
 const duration=notes.reduce((max,n)=>Math.max(max,n.time+n.duration),0);
 if(duration>3600)throw Error('Bir soatdan qisqa MIDI fayl tanlang.');
 const initialTempo=tempoMap.filter(t=>t.tick===0).at(-1)||tempoMap[0];
 return {events:notes.sort((a,b)=>a.time-b.time||a.midi-b.midi),duration,title:trackNames.find(s=>s.trim())||'',bpm:Math.round(60e6/initialTempo.micro)};
}
export function encodeMidi(notes,{tempo=120,pedalEvents=[]}={}){
 const division=480,micro=Math.round(60e6/tempo),ticksPerSecond=division*tempo/60,events=[];
 for(const n of notes){
  if(!Number.isFinite(n.time)||!Number.isFinite(n.duration)||n.duration<=0)continue;
  const note=clamp(Math.round(n.midi),21,108),velocity=clamp(Math.round((n.velocity??.75)*127),1,127),ch=n.hand==='left'?1:0;
  events.push({tick:Math.round(Math.max(0,n.time)*ticksPerSecond),data:[144+ch,note,velocity],order:1});
  events.push({tick:Math.round((Math.max(0,n.time)+n.duration)*ticksPerSecond),data:[128+ch,note,0],order:0});
 }
 for(const e of pedalEvents)for(const ch of [0,1])events.push({tick:Math.round(Math.max(0,e.time)*ticksPerSecond),data:[176+ch,64,e.down?127:0],order:0});
 events.sort((a,b)=>a.tick-b.tick||a.order-b.order);
 const variable=v=>{const out=[v&127];while(v>>>=7)out.unshift((v&127)|128);return out};
 const track=[0,255,81,3,(micro>>16)&255,(micro>>8)&255,micro&255,0,192,0,0,193,0];let previous=0;
 for(const e of events){track.push(...variable(e.tick-previous),...e.data);previous=e.tick}
 track.push(0,255,47,0);
 const u32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
 return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,...u32(track.length),...track]);
}
