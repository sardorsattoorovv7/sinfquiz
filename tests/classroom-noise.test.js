import test from 'node:test';
import assert from 'node:assert/strict';
import {NoiseController} from '../src/classroom/noise-controller.js';
function fixture(){
 const state=[],events=[],track={onended:null,readyState:'live',stop(){this.readyState='ended';events.push('track-stop');}};
 const stream={getTracks:()=>[track],getAudioTracks:()=>[track]};let amplitude=.25,calls=0;
 class AudioContext{state='running';resume(){events.push('resume');return Promise.resolve();}close(){events.push('context-close');return Promise.resolve();}createMediaStreamSource(){return {connect(){events.push('connect');},disconnect(){events.push('source-disconnect');}};}createAnalyser(){return {getFloatTimeDomainData(a){a.fill(amplitude);},disconnect(){events.push('analyser-disconnect');}};}}
 const mediaDevices={async getUserMedia(options){calls++;assert.deepEqual(options,{audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});return stream;}};
 const controller=new NoiseController(x=>state.push(x),{mediaDevices,AudioContext});return {controller,state,events,track,stream,mediaDevices,AudioContext,setAmplitude:x=>amplitude=x,get calls(){return calls;}};
}
test('Microphone opens only on start and releases every resource on stop',async()=>{
 const f=fixture();assert.equal(f.calls,0);await f.controller.start();assert.equal(f.calls,1);assert.ok(f.state.some(s=>s.active===true));
 f.controller.lastAt=performance.now()-80;f.controller.sample();assert.ok(f.controller.level>0&&f.controller.level<25);
 f.controller.stop();assert.equal(f.track.readyState,'ended');assert.equal(f.controller.interval,null);assert.equal(f.controller.context,null);assert.ok(f.events.includes('source-disconnect'));assert.deepEqual(f.state.at(-1),{active:false,requesting:false,level:0,calibrating:false});
});
test('Calibration samples local audio and sensitivity changes the relative reading',async()=>{
 const f=fixture();await f.controller.start();f.setAmplitude(.01);f.controller.calibrate();assert.equal(f.state.at(-1).calibrating,true);
 f.controller.calibration.until=performance.now()-1;f.controller.sample();assert.ok(f.controller.floor<-30);assert.equal(f.state.at(-2).calibrated,true);
 f.setAmplitude(.2);f.controller.level=0;f.controller.lastAt=performance.now()-100;f.controller.sensitivity=.4;f.controller.sample();const low=f.controller.level;
 f.controller.level=0;f.controller.lastAt=performance.now()-100;f.controller.sensitivity=2.5;f.controller.sample();assert.ok(f.controller.level>low);f.controller.stop();
});
test('Permission denial is localized, closes AudioContext and permits retry',async()=>{
 const f=fixture();f.mediaDevices.getUserMedia=async()=>{throw Object.assign(Error('blocked'),{name:'NotAllowedError'});};await f.controller.start();assert.match(f.state.at(-1).error,/ruxsati berilmadi/);assert.equal(f.controller.context,null);
 f.mediaDevices.getUserMedia=async()=>f.stream;await f.controller.start();assert.ok(f.state.at(-1).active);f.controller.stop();
});
test('Late permission after leaving the page cannot restart the microphone',async()=>{
 const f=fixture();let resolve;f.mediaDevices.getUserMedia=()=>new Promise(r=>resolve=r);const opening=f.controller.start();f.controller.stop();resolve(f.stream);await opening;assert.equal(f.track.readyState,'ended');assert.equal(f.controller.analyser,null);assert.equal(f.controller.interval,null);assert.equal(f.state.at(-1).active,false);
});
test('Unplugging a microphone stops the monitor with a useful error',async()=>{
 const f=fixture();await f.controller.start();f.track.onended();assert.equal(f.controller.context,null);assert.match(f.state.at(-1).error,/Mikrofon uzildi/);
});
test('Unavailable microphone APIs leave the board usable without opening anything',async()=>{
 const f=fixture(),states=[],controller=new NoiseController(s=>states.push(s),{mediaDevices:{},AudioContext:f.AudioContext});await controller.start();assert.equal(controller.context,null);assert.match(states.at(-1).error,/HTTPS yoki localhost/);
});
