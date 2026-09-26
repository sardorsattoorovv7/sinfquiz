import React, {useEffect,useState} from 'react';
import {Volume2,VolumeX,Sun,Moon} from 'lucide-react';

let ctx; let master;
let enabled=localStorage.getItem('sq_sound')!=='off';
export function unlockAudio(){
  if(!enabled)return;
  try {const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;ctx ||= new Audio();if(!master){master=ctx.createGain();master.gain.value=.18;master.connect(ctx.destination)}if(ctx.state==='suspended')ctx.resume().catch(()=>{});}catch{}
}
export function playSound(type='tap'){
  if(!enabled)return;unlockAudio();if(!ctx||ctx.state!=='running')return;
  const tone=(freq,delay=0,duration=.18,volume=.34,wave='sine',endFreq=freq)=>{const start=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=wave;osc.frequency.setValueAtTime(freq,start);osc.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),start+duration);gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+duration);osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect()}};
  const hit=(delay=0,duration=.14,volume=.24)=>{const length=Math.ceil(ctx.sampleRate*duration),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),start=ctx.currentTime+delay;source.buffer=buffer;filter.type='lowpass';filter.frequency.value=720;gain.gain.setValueAtTime(volume,start);gain.gain.exponentialRampToValueAtTime(.001,start+duration);source.connect(filter);filter.connect(gain);gain.connect(master);source.start(start);source.stop(start+duration);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()}};
  if(type==='tap')return tone(620,0,.07,.13,'sine',760);
  if(type==='countdown')return tone(460,0,.13,.34,'square',390);
  if(type==='arena'){tone(98,0,.38,.45,'sawtooth',65);hit(.04,.23,.28);tone(196,.17,.25,.22,'triangle',294);return}
  if(type==='grip'){hit(0,.09,.12);tone(150,0,.12,.18,'triangle',115);return}
  if(type==='impact'){hit(0,.30,.52);tone(92,0,.42,.55,'sawtooth',45);tone(310,.05,.18,.20,'triangle',125);return}
  if(type==='correct'){[523,659,784].forEach((f,i)=>tone(f,i*.085,.18,.30,'sine',f*1.04));return}
  if(type==='wrong'){tone(220,0,.22,.31,'triangle',155);tone(165,.13,.25,.25,'triangle',110);return}
  if(type==='draw'){tone(294,0,.25,.28,'triangle');tone(294,.28,.25,.28,'triangle');return}
  if(type==='victory'||type==='finish'){[392,523,659,784,1047].forEach((f,i)=>tone(f,i*.095,.28,.31,'sine',f*1.03));hit(.31,.16,.16);return}
  if(type==='tick')return tone(740,0,.10,.16,'square',680);
  tone(560,0,.12,.2);
}
export function ExperienceControls(){
  const [sound,setSound]=useState(enabled);
  const [theme,setTheme]=useState(()=>localStorage.getItem('sq_theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
  useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;document.documentElement.removeAttribute('data-motion');localStorage.setItem('sq_theme',theme)},[theme]);
  useEffect(()=>{const tap=e=>{unlockAudio();if(e.target.closest('button')&&!e.target.closest('.experience-controls'))playSound('tap')};document.addEventListener('pointerdown',tap);document.addEventListener('keydown',unlockAudio);return()=>{document.removeEventListener('pointerdown',tap);document.removeEventListener('keydown',unlockAudio)}},[]);
  return <div className="experience-controls" aria-label="Ovoz va rang sozlamalari"><button aria-pressed={sound} onClick={()=>{enabled=!sound;setSound(enabled);localStorage.setItem('sq_sound',enabled?'on':'off');if(master)master.gain.value=enabled?.18:0;if(enabled)playSound('arena')}} title="Ovoz effektlari">{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}<span>Ovoz {sound?'yoqilgan':'o‘chiq'}</span></button><button aria-label={theme==='dark'?'Kunduzgi ko‘rinishga o‘tish':'Tungi ko‘rinishga o‘tish'} onClick={()=>setTheme(theme==='dark'?'light':'dark')} title="Sayt ko‘rinishi">{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}<span>{theme==='dark'?'Kunduzgi':'Tungi'}</span></button></div>
}

const colors=['#b4a1ff','#83dbef','#ffc66e','#eaa0ed','#8be0b7','#f6a29a'];
export function Avatar3D({value='🤖',index=0,large=false}){
 const seed=[...value].reduce((n,c)=>n+c.codePointAt(0),0);
 return <span className={`avatar-3d ${large?'large':''}`} style={{'--avatar-color':colors[seed%colors.length],'--avatar-delay':`${index*-.23}s`}} aria-label={`Avatar ${value}`} role="img"><span className="avatar-antenna"/><span className="avatar-head"><span className="avatar-visor"><i/><i/></span><span className="avatar-cheek left"/><span className="avatar-cheek right"/></span><span className="avatar-badge">{value}</span></span>
}
export function MotionScene(){return <div className="motion-scene" aria-hidden="true"><div className="scene-orbit"/><div className="scene-floor"/><div className="scene-mascot"><Avatar3D value="🤖" large/></div><div className="app-block block-word">W<small>Word</small></div><div className="app-block block-excel">X<small>Excel</small></div><div className="app-block block-ppt">P<small>Slides</small></div><div className="scene-key"><kbd>Ctrl</kbd><b>+</b><kbd>S</kbd></div><div className="scene-prompt"><span>✦</span><div><b>Aniq topshiriq, yaxshi natija</b><small>Prompt tuzish</small></div></div><div className="scene-label">BILIMNI AMALIYOTDA SINAB KO‘RING</div></div>}
export function Celebration(){return <div className="celebration" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--x':`${(i*37)%100}%`,'--delay':`${(i%7)*.14}s`,'--color':colors[i%colors.length],'--turn':`${i*41}deg`}}/>)}</div>}
