import test from 'node:test';
import assert from 'node:assert/strict';
import {PianoAudio,PianoTransport,pianoLimiterCurve,PIANO_OUTPUT_CEILING} from '../src/piano-audio.js';
import {normalizePianoSettings} from '../src/piano-music.js';

function audioContext(){
 const nodes=[];
 const param=()=>({value:0,targets:[],setTargetAtTime(v){this.value=v;this.targets.push(v)},setValueAtTime(v){this.value=v},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
 const node=type=>{const n={type,links:[],gain:param(),frequency:param(),Q:param(),detune:param(),pan:param(),connect(to){this.links.push(to)},disconnect(){},start(){},stop(){},setPeriodicWave(){}};nodes.push(n);return n};
 return {nodes,state:'running',currentTime:0,sampleRate:44100,destination:node('destination'),
  createGain:()=>node('gain'),createConvolver:()=>node('convolver'),createWaveShaper:()=>node('waveshaper'),
  createDynamicsCompressor(){const n=node('compressor');for(const k of ['threshold','knee','ratio','attack','release'])n[k]=param();return n},
  createAnalyser:()=>node('analyser'),createOscillator:()=>node('oscillator'),createBiquadFilter:()=>node('filter'),createStereoPanner:()=>node('panner'),createBufferSource:()=>node('buffer-source'),
  createPeriodicWave:()=>({}),createBuffer(ch,length){const data=Array.from({length:ch},()=>new Float32Array(length));return {getChannelData:c=>data[c]}},async close(){this.state='closed'}};
}

test('piano boosts quiet voices through a compressor and bounded output, including old saved preferences',async()=>{
 const ctx=audioContext(),audio=new PianoAudio({contextFactory:()=>ctx});
 const saved=normalizePianoSettings({volume:.4,gain:1.2,reverb:.3});audio.apply(saved);audio.ensure();
 assert.equal(audio.volume.gain.value,.4);assert.equal(audio.master.gain.value,1.2);
 assert.ok(audio.boost.gain.value*audio.makeup.gain.value>2,'existing preferences receive the same louder output');
 assert.deepEqual(audio.master.links,[audio.boost]);assert.deepEqual(audio.boost.links,[audio.compressor]);
 assert.deepEqual(audio.compressor.links,[audio.makeup]);assert.deepEqual(audio.makeup.links,[audio.limiter]);
 assert.deepEqual(audio.limiter.links,[audio.analyser]);assert.deepEqual(audio.analyser.links,[ctx.destination]);
 audio.apply({volume:0});assert.equal(audio.volume.gain.value,0,'mute remains an actual zero');
 const manual=audio.noteOn(60,.8),scheduled=audio.schedule(67,.8,1,.4),preview=audio.schedule(72,.8,1,.4,'guide-preview');
 for(const id of [manual,scheduled,preview])assert.ok(audio.voices.get(id).nodes.some(n=>n.links.includes(audio.input)));
 await audio.dispose();assert.equal(ctx.state,'closed');assert.equal(audio.voices.size,0);
});

test('output protection is silent at zero, transparent at normal peaks, symmetric and bounded for overloads',()=>{
 const curve=pianoLimiterCurve(),mid=(curve.length-1)/2;
 const output=x=>{const p=(Math.max(-1,Math.min(1,x))+1)*mid,i=Math.floor(p);return i>=curve.length-1?curve.at(-1):curve[i]+(curve[i+1]-curve[i])*(p-i)};
 assert.equal(output(0),0);
 for(let x=-.79;x<=.79;x+=.001)assert.ok(Math.abs(output(x)-x)<1e-6);
 let last=-Infinity;
 for(let i=0;i<curve.length;i++){
  assert.ok(Number.isFinite(curve[i])&&Math.abs(curve[i])<PIANO_OUTPUT_CEILING);
  assert.ok(curve[i]>=last);assert.ok(Math.abs(curve[i]+curve[curve.length-1-i])<1e-7);last=curve[i];
 }
 for(const x of [-64,-8,-1,1,8,64])assert.ok(Math.abs(output(x))<PIANO_OUTPUT_CEILING);
 assert.ok(normalizePianoSettings().volume>.72);assert.ok(normalizePianoSettings().gain>=1);
 assert.equal(normalizePianoSettings({volume:0}).volume,0,'saved silence is never replaced by a default');
});

test('Bu Akşam 6/8 metronome follows eighth notes and accents the six-note bar instead of four quarters',async()=>{
 const ticks=[],audio={ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},schedule(){},stopScope(){},tick(...args){ticks.push(args)}};
 const tr=new PianoTransport(audio);tr.load([],30,48,'6/8');tr.setMetronome(true);
 try{
  await tr.play();assert.equal(tr.beatSeconds(),.625);
  for(let beat=1;beat<=6;beat++){audio.ctx.currentTime=tr.startedAt+beat*.625;tr.pump()}
  assert.deepEqual(ticks.map(([,accent])=>accent),[true,false,false,false,false,false,true]);
  assert.ok(Math.abs(ticks[6][0]-ticks[0][0]-3.75)<.000001);
  tr.load([],30,120);assert.equal(tr.beatSeconds(),.5);assert.equal(tr.beatsPerBar,4);
 }finally{tr.destroy()}
});
