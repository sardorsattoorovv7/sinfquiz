import React,{useEffect,useRef,useState} from 'react';
import {Box,RotateCcw,RotateCw} from 'lucide-react';
import './learning-visual.css';

export default function LearningVisual({mode,fallback,label='Interaktiv 3D model',className='',...params}){
 const host=useRef(null),instance=useRef(null),latest=useRef({mode,...params});latest.current={mode,...params};
 const [view,setView]=useState('3d'),[status,setStatus]=useState('loading');
 useEffect(()=>{
  if(view!=='3d')return;let gone=false,timer;
  if(!window.WebGLRenderingContext||!window.ResizeObserver){setStatus('fallback');return}
  setStatus('loading');
  const fail=()=>{if(!gone){setStatus('fallback');instance.current?.dispose();instance.current=null;clearTimeout(timer)}};
  timer=setTimeout(()=>{gone=true;setStatus('fallback');instance.current?.dispose();instance.current=null},12000);
  import('./learning-3d.js').then(({mountLearningScene})=>{if(gone)return;instance.current=mountLearningScene(host.current,latest.current,{onReady:()=>{if(!gone){clearTimeout(timer);setStatus('ready')}},onFail:fail})}).catch(fail);
  return()=>{gone=true;clearTimeout(timer);instance.current?.dispose();instance.current=null};
 },[mode,params.level?.id,view]);
 useEffect(()=>{instance.current?.update(latest.current)});
 return <div className={`learning-visual ${className} lv-${mode} lv-${status}`}>
  <div className="lv-toolbar"><span><Box size={14}/>{mode==='maze'?'QAL’A MAYDONI':mode==='atlas'?'SHAKLLAR OLAMI':'FAZOVIY TAJRIBA'}</span><div><button aria-pressed={view==='3d'} onClick={()=>setView('3d')}>3D</button><button aria-pressed={view==='2d'} onClick={()=>setView('2d')}>Chizma</button></div></div>
  <div className="lv-viewport" role="group" aria-label={label}>
   <div ref={host} className="lv-canvas" style={{visibility:view==='3d'&&status==='ready'?'visible':'hidden'}}/>
   {(view==='2d'||status!=='ready')&&<div className="lv-fallback-content">{fallback}</div>}
   {view==='3d'&&status==='loading'&&<span className="lv-loading" role="status">3D sahna tayyorlanmoqda…</span>}
  </div>
  <div className="lv-caption"><span>{view==='3d'&&status==='ready'?(mode==='maze'?'Yashil yo‘lboshchi · binafsha izquvar':'Modelni sichqoncha yoki barmoq bilan aylantiring'):status==='fallback'?'Yengil chizma rejimi':'Obyektni chizmada kuzating'}</span>{view==='3d'&&status==='ready'&&<div><button title="Chapga aylantirish" aria-label="Modelni chapga aylantirish" onClick={()=>instance.current?.rotate(-.3)}><RotateCcw size={15}/></button><button title="O‘ngga aylantirish" aria-label="Modelni o‘ngga aylantirish" onClick={()=>instance.current?.rotate(.3)}><RotateCw size={15}/></button><button onClick={()=>instance.current?.reset()}>Tiklash</button></div>}</div>
 </div>;
}

export function TopicArt({scene='cube',className=''}){
 const line={stroke:'#458c80',strokeWidth:2,fill:'none'},fill={fill:'#bce4d2',stroke:'#458c80',strokeWidth:2};let drawing;
 if(scene==='number')drawing=<><path d="M22 60H158" {...line}/>{Array.from({length:7},(_,i)=><path key={i} d={`M${30+i*20} 55v10`} {...line}/>)}<path d="M70 45Q90 12 110 45l-7-4m7 4 1-8" {...line}/><circle cx="70" cy="60" r="5" fill="#eab77b"/><circle cx="110" cy="60" r="5" fill="#439e86"/><text x="85" y="88" fill="#628274" fontSize="12">0</text></>;
 else if(scene==='fraction')drawing=<>{Array.from({length:40},(_,i)=><rect key={i} x={33+i%8*15} y={20+Math.floor(i/8)*15} width="11" height="11" rx="2" fill={i<26?'#56a58e':'#dbe7da'}/>)}</>;
 else if(scene==='balance')drawing=<><path d="M90 26v64M70 91h40M38 39h104M45 40 30 70h30ZM135 40 120 70h30Z" {...line}/><circle cx="90" cy="39" r="5" fill="#edb777"/><rect x="36" y="57" width="18" height="13" rx="2" fill="#82bdb0"/><text x="42" y="67" fontSize="10" fill="#173f39">x</text><circle cx="135" cy="65" r="6" fill="#aa95ca"/></>;
 else if(['linear','quadratic','coordinate'].includes(scene))drawing=<><path d="M25 80H157M63 15V98" stroke="#9ab7b2"/><path d={scene==='quadratic'?'M40 21Q91 158 143 21':scene==='coordinate'?'M63 80V35H125':'M28 92L145 22'} fill="none" stroke="#438b85" strokeWidth="3" strokeDasharray={scene==='coordinate'?'4 4':undefined}/><circle cx={scene==='coordinate'?125:scene==='quadratic'?91:87} cy={scene==='coordinate'?35:scene==='quadratic'?89:57} r="5" fill="#e7b36f"/></>;
 else if(scene==='expression')drawing=<><rect x="27" y="30" width="53" height="53" rx="11" fill="#d0e9d9"/><text x="46" y="65" fontFamily="Georgia" fontSize="32" fill="#487866">x</text><text x="92" y="65" fontSize="27" fill="#8c80aa">+ 3</text></>;
 else if(scene==='power'||scene==='sequence')drawing=<>{[1,2,3,4,5].map((n,i)=><g key={n}><rect x={26+i*27} y={90-n*13} width="19" height={n*13} rx="4" fill={['#c4ddce','#aaceba','#8cbda5','#69a48e','#458b75'][i]}/><text x={35+i*27} y="104" fontSize="8" textAnchor="middle" fill="#58766c">{n}</text></g>)}</>;
 else if(scene==='sphere')drawing=<><circle cx="88" cy="54" r="36" {...fill}/><ellipse cx="88" cy="54" rx="17" ry="36" {...line}/><ellipse cx="88" cy="54" rx="36" ry="13" {...line}/></>;
 else if(scene==='circle'||scene==='angle')drawing=<><circle cx="88" cy="54" r="36" {...fill}/><path d={scene==='circle'?'M88 54h36':'M118 35 88 54h36'} stroke="#d59c5a" strokeWidth="3" fill="none"/><circle cx="88" cy="54" r="3" fill="#458c80"/></>;
 else if(scene==='cylinder')drawing=<><path d="M54 28v52a36 13 0 0 0 72 0V28" {...fill}/><ellipse cx="90" cy="28" rx="36" ry="13" {...fill}/><path d="M54 80a36 13 0 0 1 72 0" {...line} strokeDasharray="4 3"/></>;
 else if(scene==='cone')drawing=<><path d="M90 15 52 86a38 11 0 0 0 76 0Z" {...fill}/><ellipse cx="90" cy="86" rx="38" ry="11" {...line}/></>;
 else if(['cube','cuboid','prism','pyramid'].includes(scene))drawing=scene==='pyramid'?<><path d="M90 14 40 83 94 101 143 80Z" {...fill}/><path d="M90 14 94 101M40 83 143 80" {...line}/></>:scene==='prism'?<><path d="M38 87 71 27 109 87Z" {...fill}/><path d="M71 27 115 16 153 75 109 87M153 75 38 87" {...line}/><path d="M71 27 115 16 153 75 109 87Z" fill="#8ac5b0" stroke="#458c80" strokeWidth="2"/></>:<><path d="M90 14L139 39 90 66 41 39Z" fill="#b3e5d7"/><path d="M41 39L90 66V103L41 77Z" fill="#419d96"/><path d="M90 66L139 39V77L90 103Z" fill="#74c6b1"/></>;
 else if(['triangle','polygon','transform'].includes(scene))drawing=<><path d="M34 87L103 16 147 87Z" fill="#e0def8" stroke="#8c83be" strokeWidth="2"/><path d="M103 16V87M103 77H113V87" fill="none" stroke="#b09755" strokeDasharray="4 3"/><circle cx="103" cy="16" r="5" fill="#9183c5"/></>;
 else if(scene==='line')drawing=<><path d="M24 84 156 24" {...line}/><circle cx="62" cy="67" r="5" fill="#a593c2"/><circle cx="124" cy="39" r="5" fill="#edb777"/></>;
 else drawing=<><path d={scene==='trapezoid'?'M56 24H117L144 89H30Z':scene==='rhombus'?'M91 13 149 54 91 95 33 54Z':scene==='parallelogram'?'M58 23H150L120 88H28Z':scene==='square'?'M56 20H124V88H56Z':'M35 26H147V85H35Z'} {...fill}/><path d="M35 96H145" stroke="#bc9b68" strokeWidth="2" strokeDasharray="4 4"/></>;
 return <svg className={`topic-art ${className}`} viewBox="0 0 180 110" aria-hidden="true"><circle cx="149" cy="20" r="13" fill="currentColor" opacity=".06"/>{drawing}</svg>;
}
export function AtlasArtwork(){return <div className="atlas-fallback-art"><TopicArt scene="cube"/><TopicArt scene="sphere"/><TopicArt scene="triangle"/></div>}
export function MazeThumbnail({level}){return <svg viewBox={`-1 -1 ${level.grid[0].length+2} ${level.grid.length+2}`} aria-hidden="true" className="maze-thumbnail">{level.grid.map((row,y)=>[...row].map((c,x)=>c==='#'?<rect key={`${x}-${y}`} x={x} y={y} width=".91" height=".91" rx=".14" fill="currentColor"/>:null))}{level.gateCells.map(([x,y],i)=><rect key={i} x={x+.1} y={y+.1} width=".75" height=".75" rx=".2" fill="#e5ae52"/>)}<circle cx={level.start[0]+.5} cy={level.start[1]+.5} r=".43" fill="#21a888"/><circle cx={level.exit[0]+.5} cy={level.exit[1]+.5} r=".43" fill="#bf71c5"/></svg>}
