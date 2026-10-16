import {clamp,frequency,DEFAULT_PIANO_SETTINGS} from './piano-music.js';

// Shared boost for manual keys, lessons, preview notes and MIDI. The last
// native audio node bounds peaks without a JS audio loop or downloaded assets.
export const PIANO_OUTPUT_BOOST=2.5;
export const PIANO_OUTPUT_MAKEUP=1.15;
export const PIANO_OUTPUT_CEILING=.97;
export function pianoLimiterCurve(){
 const curve=new Float32Array(8193),knee=.8,room=PIANO_OUTPUT_CEILING-knee;
 for(let i=0;i<curve.length;i++){
  const x=i*2/(curve.length-1)-1,a=Math.abs(x);
  curve[i]=Math.sign(x)*(a<=knee?a:knee+room*Math.tanh((a-knee)/room));
 }
 return curve;
}

// Five independently decaying string/partial layers and a filtered hammer
// transient per voice. No network samples or main-thread audio processing.
export class PianoAudio {
 constructor({contextFactory,onState=()=>{}}={}){
  this.factory=contextFactory;this.onState=onState;this.voices=new Map();this.counter=0;this.sustain=false;this.settings={volume:DEFAULT_PIANO_SETTINGS.volume,gain:DEFAULT_PIANO_SETTINGS.gain,reverb:DEFAULT_PIANO_SETTINGS.reverb};this.disposed=false;
 }
 ensure(){
  if(this.disposed)throw Error('Audio yopilgan.');
  if(!this.ctx){
   const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
   if(!this.factory&&!Audio)throw Error('Brauzeringiz Web Audio API’ni qo‘llamaydi.');
   const ctx=this.ctx=this.factory?this.factory():new Audio({latencyHint:'interactive'});
   this.input=ctx.createGain();this.dry=ctx.createGain();this.wet=ctx.createGain();
   this.convolver=ctx.createConvolver();this.volume=ctx.createGain();this.master=ctx.createGain();
   this.boost=ctx.createGain();this.makeup=ctx.createGain();this.limiter=ctx.createWaveShaper();
   this.boost.gain.value=PIANO_OUTPUT_BOOST;this.makeup.gain.value=PIANO_OUTPUT_MAKEUP;
   this.limiter.curve=pianoLimiterCurve();this.limiter.oversample='none';
   this.compressor=ctx.createDynamicsCompressor();this.analyser=ctx.createAnalyser();
   this.compressor.threshold.value=-12;this.compressor.knee.value=15;this.compressor.ratio.value=5;this.compressor.attack.value=.003;this.compressor.release.value=.2;
   this.analyser.fftSize=512;
   this.input.connect(this.dry);this.input.connect(this.convolver);this.convolver.connect(this.wet);
   this.dry.connect(this.volume);this.wet.connect(this.volume);this.volume.connect(this.master);
   this.master.connect(this.boost);this.boost.connect(this.compressor);this.compressor.connect(this.makeup);
   this.makeup.connect(this.limiter);this.limiter.connect(this.analyser);this.analyser.connect(ctx.destination);
   const length=Math.floor(ctx.sampleRate*1.85),impulse=ctx.createBuffer(2,length,ctx.sampleRate);
   let seed=81921;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296*2-1};
   for(let ch=0;ch<2;ch++){const d=impulse.getChannelData(ch);for(let i=0;i<length;i++)d[i]=rand()*Math.pow(1-i/length,2.8)*.65}
   this.convolver.buffer=impulse;
   this.hammer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.045),ctx.sampleRate);
   const noise=this.hammer.getChannelData(0);for(let i=0;i<noise.length;i++)noise[i]=rand()*Math.exp(-i/(ctx.sampleRate*.007));
   this.waveCache=new Map();this.apply(this.settings);
   if('onstatechange' in ctx)ctx.onstatechange=()=>this.onState(this.stats());
  }
  const promise=this.ctx.state==='suspended'?this.ctx.resume():Promise.resolve();
  Promise.resolve(promise).then(()=>this.onState(this.stats())).catch(()=>this.onState(this.stats()));
  return this.ctx;
 }
 stats(){return {state:this.ctx?.state||'off',sampleRate:this.ctx?.sampleRate||0,latency:((this.ctx?.baseLatency||0)+(this.ctx?.outputLatency||0))*1000,voices:this.voices.size}}
 apply(settings){
  this.settings={...this.settings,...settings};if(!this.ctx)return;
  const t=this.ctx.currentTime,s=this.settings;
  this.volume.gain.setTargetAtTime(clamp(s.volume,0,1),t,.015);
  this.master.gain.setTargetAtTime(clamp(s.gain,.25,1.5),t,.015);
  this.dry.gain.setTargetAtTime(1-s.reverb*.22,t,.025);
  this.wet.gain.setTargetAtTime(s.reverb*.65,t,.025);
 }
 wave(midi,band){
  const key=midi+':'+band;if(this.waveCache.has(key))return this.waveCache.get(key);
  const ctx=this.ctx,f=frequency(midi),real=new Float32Array(25),imag=new Float32Array(25);
  const [first,last]=[[1,3],[4,8],[9,22]][band];
  for(let h=first;h<=last&&f*h<ctx.sampleRate*.46;h++)imag[h]=Math.pow(h,-1.45)*(h%2?.96:.72);
  const wave=ctx.createPeriodicWave(real,imag,{disableNormalization:true});this.waveCache.set(key,wave);return wave;
 }
 noteOn(midi,velocity=.76,{when,scope='manual'}={}){
  if(!Number.isFinite(midi)||midi<21||midi>108)return null;
  const ctx=this.ensure(),at=Math.max(ctx.currentTime,when??ctx.currentTime+.002),id=++this.counter;
  if(this.voices.size>=64){const oldest=this.voices.values().next().value;this.cut(oldest);this.cleanup(oldest)}
  const output=ctx.createGain(),tone=ctx.createBiquadFilter(),pan=ctx.createStereoPanner?ctx.createStereoPanner():ctx.createGain();
  velocity=clamp(velocity,.05,1);tone.type='lowpass';tone.frequency.setValueAtTime(Math.min(ctx.sampleRate*.44,1800+velocity*6900+frequency(midi)*1.2),at);tone.Q.value=.3;
  if(pan.pan)pan.pan.value=clamp((midi-60)/85,-.45,.45);
  tone.connect(output);output.connect(pan);pan.connect(this.input);output.gain.value=1;
  const nodes=[tone,output,pan],sources=[],register=Math.pow(2,(60-midi)/40),loud=.14*Math.pow(velocity,1.5);
  const layers=[[0,-1.7,.42,3.2],[0,0,.48,3.5],[0,1.6,.36,2.8],[1,.3,.48,.95],[2,-.5,.6,.18]];
  for(const [band,detune,weight,decay] of layers){
   const osc=ctx.createOscillator(),gain=ctx.createGain();osc.setPeriodicWave(this.wave(midi,band));
   osc.frequency.setValueAtTime(frequency(midi),at);osc.detune.setValueAtTime(detune,at);
   const peak=loud*weight;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(peak,at+.0035);
   gain.gain.exponentialRampToValueAtTime(.00001,at+Math.max(.12,decay*register*(.75+velocity*.35)));
   osc.connect(gain);gain.connect(tone);osc.start(at);osc.stop(at+12);
   nodes.push(osc,gain);sources.push(osc);
  }
  const hammer=ctx.createBufferSource(),hammerGain=ctx.createGain(),hammerFilter=ctx.createBiquadFilter();
  hammer.buffer=this.hammer;hammerFilter.type='bandpass';hammerFilter.frequency.value=1300+velocity*2900;hammerFilter.Q.value=.45;hammerGain.gain.value=.018*velocity;
  hammer.connect(hammerFilter);hammerFilter.connect(hammerGain);hammerGain.connect(tone);hammer.start(at);hammer.stop(at+.046);
  nodes.push(hammer,hammerGain,hammerFilter);sources.push(hammer);
  const voice={id,midi,scope,at,nodes,sources,output,released:false,held:false,disposed:false};
  this.voices.set(id,voice);
  sources[0].onended=()=>this.cleanup(voice);
  return id;
 }
 cleanup(voice){
  if(voice.disposed)return;voice.disposed=true;
  this.voices.delete(voice.id);for(const n of voice.nodes){try{n.disconnect()}catch{}}
 }
 release(id,when=this.ctx?.currentTime||0,force=false){
  const v=this.voices.get(id);if(!v||v.released)return;
  if(this.sustain&&!force&&v.scope==='manual'){v.held=true;return}
  const at=Math.max(this.ctx.currentTime,when),end=at+.12+clamp((75-v.midi)/100,0,.3);
  v.released=true;v.held=false;v.output.gain.cancelScheduledValues(at);v.output.gain.setValueAtTime(1,at);v.output.gain.exponentialRampToValueAtTime(.00001,end);
  for(const s of v.sources){try{s.stop(end+.015)}catch{}}
 }
 schedule(midi,velocity,when,duration,scope='transport'){
  const id=this.noteOn(midi,velocity,{when,scope});
  this.release(id,when+Math.max(.04,duration)+(this.sustain ? .45 : 0),true);return id;
 }
 setSustain(down){
  this.sustain=Boolean(down);if(!down)for(const v of this.voices.values())if(v.held)this.release(v.id,undefined,true);
 }
 stopScope(scope){
  if(!this.ctx)return;for(const v of this.voices.values())if(v.scope===scope)this.cut(v);
 }
 cut(v){
  if(v.disposed)return;
  const now=this.ctx.currentTime;
  try{v.output.gain.cancelScheduledValues(now);v.output.gain.setTargetAtTime(0,now,.006)}catch{}
  for(const s of v.sources){try{s.stop(now+.025)}catch{}}
 }
 allOff(){if(this.ctx)for(const v of this.voices.values())this.cut(v)}
 tick(when,accent=false){
  const ctx=this.ensure(),osc=ctx.createOscillator(),gain=ctx.createGain(),id=++this.counter;osc.frequency.value=accent?1450:1000;
  gain.gain.setValueAtTime(.075,when);gain.gain.exponentialRampToValueAtTime(.00001,when+.04);osc.connect(gain);gain.connect(this.input);osc.start(when);osc.stop(when+.045);
  const voice={id,scope:'metronome',nodes:[osc,gain],sources:[osc],output:gain,disposed:false};this.voices.set(id,voice);
  osc.onended=()=>this.cleanup(voice);return id;
 }
 async dispose(){
  if(this.disposed)return;this.allOff();this.disposed=true;
  if(this.ctx){this.ctx.onstatechange=null;try{await this.ctx.close()}catch{}}
  this.voices.clear();
 }
}

// Audio-clock lookahead scheduling; animation frames are never used to time audio.
export class PianoTransport{
 constructor(audio,{onEnd=()=>{},onChange=()=>{}}={}){this.audio=audio;this.onEnd=onEnd;this.onChange=onChange;this.offset=0;this.speed=1;this.playing=false;this.loop=false;this.events=[];this.duration=30;this.timer=null;this.generation=0}
 load(events,duration=30,bpm=90,meter='4/4'){this.stop();this.events=[...events].sort((a,b)=>a.time-b.time);this.duration=duration;this.bpm=bpm;const m=/^(\d{1,2})\/(2|4|8|16)$/.exec(meter||'4/4');this.beatsPerBar=m&&Number(m[1])>0?Number(m[1]):4;this.beatUnit=m?Number(m[2]):4}
 beatSeconds(){return 60/(this.bpm||90)*4/(this.beatUnit||4)}
 position(){return this.playing?Math.min(this.duration,this.offset+Math.max(0,this.audio.ctx.currentTime-this.startedAt)*this.speed):this.offset}
 async play(){
  const generation=this.generation;this.audio.ensure();if(this.audio.ctx.state==='suspended')await this.audio.ctx.resume();
  if(this.playing||generation!==this.generation)return;if(this.offset>=this.duration-.005)this.offset=0;
  this.startedAt=this.audio.ctx.currentTime+.035;this.cursor=this.events.findIndex(e=>e.time>=this.offset-.001);if(this.cursor<0)this.cursor=this.events.length;
  this.nextBeat=Math.ceil(this.offset/this.beatSeconds());this.playing=true;
  // Restore notes already sounding when resuming/seeking into their duration.
  for(const e of this.events)if(e.time<this.offset-.001&&e.time+e.duration>this.offset)this.audio.schedule(e.midi,e.velocity,this.startedAt,(e.time+e.duration-this.offset)/this.speed);
  this.pump();this.timer=setInterval(()=>this.pump(),25);this.onChange(true);
 }
 pump(){
  if(!this.playing)return;
  const now=this.audio.ctx.currentTime,pos=this.position(),horizon=pos+.13*this.speed;
  while(this.cursor<this.events.length&&this.events[this.cursor].time<=horizon){
   const e=this.events[this.cursor++],at=this.startedAt+(e.time-this.offset)/this.speed;
   if(at>=now-.035)this.audio.schedule(e.midi,e.velocity,Math.max(now,at),Math.min(e.duration,this.duration-e.time)/this.speed);
  }
  if(this.metronome){const beat=this.beatSeconds();this.nextBeat=Math.max(this.nextBeat,Math.ceil((pos-.001)/beat));while(this.nextBeat*beat<=horizon&&this.nextBeat*beat<this.duration){const at=this.startedAt+(this.nextBeat*beat-this.offset)/this.speed;if(at>=now)this.audio.tick(at,this.nextBeat%this.beatsPerBar===0);this.nextBeat++}}
  if(pos>=this.duration){if(this.loop){this.pause();this.offset=0;this.play().catch(()=>{})}else{this.pause();this.offset=this.duration;this.onEnd()}}
 }
 setMetronome(enabled){if(this.metronome===Boolean(enabled))return;this.metronome=Boolean(enabled);this.audio.stopScope('metronome');if(this.metronome)this.nextBeat=Math.ceil(this.position()/this.beatSeconds())}
 pause(){this.generation++;if(this.playing)this.offset=this.position();this.playing=false;clearInterval(this.timer);this.timer=null;this.audio.stopScope('transport');this.audio.stopScope('metronome');this.onChange(false)}
 stop(){this.pause();this.offset=0}
 seek(seconds){const playing=this.playing;this.pause();this.offset=clamp(seconds,0,this.duration);if(playing)this.play().catch(()=>{})}
 setSpeed(value){const playing=this.playing;this.pause();this.speed=value;if(playing)this.play().catch(()=>{})}
 destroy(){this.pause()}
}
