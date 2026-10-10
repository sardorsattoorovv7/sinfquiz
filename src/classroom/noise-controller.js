import {clamp,rmsLevel,relativeNoise,smoothNoise} from './model.js';
const errorText=e=>e?.name==='NotAllowedError'?'Mikrofon ruxsati berilmadi. Brauzer manzil satridan mikrofonni yoqing va qayta urinib ko‘ring.':e?.name==='NotSupportedError'?'Bu brauzer yoki qurilma mikrofon oqimini qo‘llamayapti. Boshqa brauzerda qayta urinib ko‘ring.':e?.name==='NotFoundError'?'Mikrofon topilmadi. Mikrofonni ulang va qayta urinib ko‘ring.':e?.name==='NotReadableError'?'Mikrofon boshqa dasturda band. Uni yoping va qayta urinib ko‘ring.':'Mikrofonni ishga tushirib bo‘lmadi. HTTPS yoki localhost manzilida qayta urinib ko‘ring.';
export class NoiseController {
  constructor(onState,{mediaDevices=globalThis.navigator?.mediaDevices,AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext}={}) {
    this.onState=onState;this.mediaDevices=mediaDevices;this.AudioContext=AudioContext;this.run=0;this.level=0;this.floor=-55;this.sensitivity=1;
  }
  async start() {
    this.stop(false);const run=++this.run;
    if(!this.mediaDevices?.getUserMedia||!this.AudioContext){this.onState({active:false,requesting:false,error:'Mikrofon uchun HTTPS yoki localhost va zamonaviy brauzer kerak.'});return;}
    this.onState({active:false,requesting:true,error:''});
    try {
      this.context=new this.AudioContext();this.context.resume().catch(()=>{});
      const stream=await this.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      if(run!==this.run){stream.getTracks().forEach(t=>t.stop());return;}
      this.stream=stream;this.source=this.context.createMediaStreamSource(stream);this.analyser=this.context.createAnalyser();this.analyser.fftSize=2048;this.source.connect(this.analyser);this.samples=new Float32Array(2048);
      stream.getAudioTracks().forEach(t=>{t.onended=()=>{this.stop(false);this.onState({active:false,requesting:false,error:'Mikrofon uzildi. Uni qayta ulang va urinib ko‘ring.'});};});
      this.level=0;this.onState({active:true,requesting:false,error:'',level:0});this.lastAt=performance.now();
      this.interval=setInterval(()=>this.sample(),80);
    } catch(e) {if(run!==this.run)return;this.stop(false);this.onState({active:false,requesting:false,error:errorText(e)});}
  }
  sample() {
    if(!this.analyser)return;this.analyser.getFloatTimeDomainData(this.samples);const rms=rmsLevel(this.samples),at=performance.now(),elapsed=clamp((at-this.lastAt)/1000,.01,1);this.lastAt=at;
    if(this.calibration) {
      this.calibration.values.push(rms);
      if(at>=this.calibration.until) {const values=this.calibration.values.sort((a,b)=>a-b),base=values[Math.floor(values.length*.6)]||1e-6;this.floor=clamp(20*Math.log10(base),-100,-5);this.calibration=null;this.onState({calibrating:false,calibrated:true});}
    }
    this.level=smoothNoise(this.level,relativeNoise(rms,this.floor,this.sensitivity),elapsed);this.onState({level:this.level});
  }
  calibrate() {if(!this.analyser)return;this.calibration={until:performance.now()+2400,values:[]};this.onState({calibrating:true,calibrated:false});}
  stop(notify=true) {
    ++this.run;clearInterval(this.interval);this.interval=null;this.calibration=null;
    this.stream?.getTracks().forEach(t=>{t.onended=null;t.stop();});this.stream=null;
    try{this.source?.disconnect();this.analyser?.disconnect();}catch{}
    this.source=this.analyser=null;this.context?.close().catch(()=>{});this.context=null;
    if(notify)this.onState({active:false,requesting:false,level:0,calibrating:false});
  }
}
