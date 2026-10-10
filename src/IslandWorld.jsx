import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowLeft,Compass,RotateCcw,ZoomIn,ZoomOut,Sun,Moon,Sunset} from 'lucide-react';
import {islandDestinations} from './island-content.js';
import {useIslandEnvironment} from './useIslandEnvironment.js';
import {ISLAND_ASSET} from './island-asset.js';
export default function IslandWorld({onNavigate}){
 const env=useIslandEnvironment(),host=useRef(null),controller=useRef(null),current=useRef(env),navigate=useRef(onNavigate),menu=useRef(null);current.current=env;navigate.current=onNavigate;
 const [status,setStatus]=useState('loading'),[progress,setProgress]=useState(0),[attempt,setAttempt]=useState(0),[explore,setExplore]=useState(false);
 useEffect(()=>{
  let alive=true,scene,idle,timer;
  setStatus('loading');setProgress(0);
  if(!window.WebGL2RenderingContext){setStatus('unsupported');return;}
  timer=setTimeout(()=>{if(alive)setStatus(s=>s==='loading'?'slow':s);},12000);
  const start=()=>import('./garden-campus-3d.js').then(({mountIslandWorld})=>{
   if(!alive)return;
   scene=mountIslandWorld(host.current,{time:current.current.time,motion:!current.current.reduced},{
    onReady:()=>{if(alive){clearTimeout(timer);setStatus('ready');}},
    onProgress:n=>{if(alive)setProgress(n);},
    onFail:({reason})=>{if(alive){clearTimeout(timer);setStatus(reason==='context'?'lost':reason==='timeout'?'timeout':'error');}},
   });controller.current=scene;
  }).catch(()=>{if(alive){clearTimeout(timer);setStatus('error');}});
  // Let React paint the working navigation and code entry before loading 3D.
  if(window.requestIdleCallback)idle=requestIdleCallback(start,{timeout:1200});else idle=setTimeout(start,200);
  return()=>{alive=false;clearTimeout(timer);if(window.cancelIdleCallback)cancelIdleCallback(idle);else clearTimeout(idle);scene?.dispose();controller.current=null;};
 },[attempt]);
 useEffect(()=>{controller.current?.update({time:env.time,motion:!env.reduced});},[env.time.phase,env.time.day,env.time.dusk,env.time.night,env.reduced,status]);
 useEffect(()=>{controller.current?.explore(explore);},[explore,status]);
 const command=(name,value)=>{if(name==='rotate'||name==='zoom')setExplore(true);if(name==='reset')setExplore(false);controller.current?.[name](value);};
 const key=e=>{const ops={ArrowLeft:()=>command('rotate',-.17),ArrowRight:()=>command('rotate',.17),'+':()=>command('zoom',1.12),'=':()=>command('zoom',1.12),'-':()=>command('zoom',1/1.12),Home:()=>command('reset')};if(e.target===e.currentTarget&&ops[e.key]){e.preventDefault();ops[e.key]();}};
 const Icon=env.time.phase==='night'?Moon:env.time.phase==='evening'?Sunset:Sun;
 const pending=status==='loading'||status==='slow';
 return <><div className="island-map island-3d-map garden-map" data-phase={env.time.phase} data-scene-status={status} data-explore={explore} role="group" aria-label="Bilim bog‘i va fanlar">
  <div ref={host} className="island-3d-host" tabIndex={status==='ready'?0:-1} onKeyDown={key} role="region" aria-label="Bilim bog‘ining 3D modeli" aria-describedby="island-3d-help"/>
  <p id="island-3d-help" className="island-sr-only">Samarqanddagi Registon maydoni va uch madrasa majmuasining skanerlangan modeli. Chap va o‘ng tugmalar bilan aylantiring, plus va minus bilan yaqinlashing, Home bilan bosh ko‘rinishga qayting. Fanlar alohida tugmalardan ochiladi. Bog‘ modeli fan bo‘limlarining ichki mazmunini tasvirlamaydi.</p>
  {status!=='ready'&&<div className="island-scene-message" role="status">{pending?<><span className="island-load-orbit" aria-hidden="true"/><b>{status==='slow'?'Bog‘ hali yuklanmoqda…':'3D bog‘ ochilmoqda…'}</b><span>{progress?`${progress}% · Model tayyorlanmoqda.`:'Fan bo‘limlari hozirdan ochiladi.'}</span></>:<><b>{status==='deferred'?'Bilim bog‘i':status==='unsupported'?'Brauzerda 3D ko‘rinish qo‘llanmayapti.':status==='lost'?'3D ko‘rinish to‘xtadi.':status==='timeout'?'Modelni yuklash vaqti tugadi.':'3D bog‘ni yuklab bo‘lmadi.'}</b><span>{status==='deferred'?'Fan tanlang yoki 3D bog‘ni oching.':'Fanlarni pastdagi tugmalardan oching.'}</span>{status!=='unsupported'&&<button type="button" onClick={()=>setAttempt(n=>n+1)}>Qayta urinish</button>}</>}</div>}
  <nav className="island-destinations" aria-label="Fan maskanini tanlang"><header className="island-sr-only"><h2>Fan tanlang</h2></header>{islandDestinations.map((d,i)=><button key={d.id} data-island-destination={d.id} className="island-destination" aria-label={d.label+' bo‘limini ochish'} title={d.title} onClick={()=>onNavigate(d.id)}><em aria-hidden="true">{String(i+1).padStart(2,'0')}</em><span><b>{d.label}</b><small>{d.topics[0]}</small></span><i aria-hidden="true"><ArrowRight size={17}/></i></button>)}</nav>
  <div className="island-world-toolbar">
   <details ref={menu} className="island-time-picker" onKeyDown={e=>{if(e.key==='Escape'){menu.current.open=false;menu.current.querySelector('summary').focus();}}}><summary aria-label="Bog‘ vaqtini sozlash"><Icon size={18}/><span><b>{env.time.label}</b><small>{env.time.clock} · {env.mode==='auto'?'Avtomatik':'Tanlangan'}</small></span></summary><div className="island-time-popover"><label htmlFor="island-time-mode">Bog‘ vaqti</label><select id="island-time-mode" value={env.mode} onChange={e=>env.setMode(e.target.value)}><option value="auto">Avtomatik — qurilma vaqti</option><option value="morning">Tong</option><option value="day">Kunduz</option><option value="evening">Shom</option><option value="night">Tun</option></select><p>Qurilmaning mahalliy vaqti: tong 05:00, kunduz 07:00, shom 16:00–19:00, tun 19:00 dan. Soat 17:00 da shom manzarasi.</p></div></details>
   <div className="island-camera-controls" aria-label="3D ko‘rinishni boshqarish">{[['Bog‘ni chapga aylantirish',ArrowLeft,'rotate',-.2],['Bog‘ni o‘ngga aylantirish',ArrowRight,'rotate',.2],['Bog‘ga yaqinlashish',ZoomIn,'zoom',1.12],['Bog‘dan uzoqlashish',ZoomOut,'zoom',1/1.12],['Bog‘ ko‘rinishini tiklash',RotateCcw,'reset']].map(([label,Symbol,action,value])=><button key={label} type="button" aria-label={label} disabled={status!=='ready'} onClick={()=>command(action,value)}><Symbol size={18}/></button>)}<button className="island-explore" type="button" aria-label={explore?'Aylantirishni tugatish':'Erkin aylantirish'} aria-pressed={explore} disabled={status!=='ready'} onClick={()=>setExplore(v=>!v)}><Compass size={18}/><span>{explore?'Aylantirishni tugatish':'Erkin aylantirish'}</span></button></div>
  </div>{explore&&<p className="island-drag-hint">Barmoq yoki sichqoncha bilan suring. Ikki barmoq bilan yaqinlashtiring.</p>}
 </div><p className="island-asset-credit"><a href={ISLAND_ASSET.source} target="_blank" rel="noopener noreferrer">{ISLAND_ASSET.title}</a><span>— <a href={ISLAND_ASSET.authorUrl} target="_blank" rel="noopener noreferrer">{ISLAND_ASSET.author}</a> · <a href={ISLAND_ASSET.licenseUrl} target="_blank" rel="noopener noreferrer">{ISLAND_ASSET.license}</a></span></p></>;
}
