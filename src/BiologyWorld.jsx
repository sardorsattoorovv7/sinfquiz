import React,{useEffect,useRef,useState} from 'react';
import {RotateCcw,RotateCw,ZoomIn,ZoomOut,Home,Box,Layers} from 'lucide-react';
import BiologyModelSources from './BiologyModelSources.jsx';
import {biologySceneAssets} from './biology-asset-catalog.js';
export default function BiologyWorld({topic,p,q,fallback}){
 const host=useRef(null),engine=useRef(null),latest=useRef({p,q}),[view,setView]=useState('3d'),[status,setStatus]=useState('loading'),[parts,setParts]=useState([]),[selected,setSelected]=useState(null),[retry,setRetry]=useState(0);latest.current={p,q};
 useEffect(()=>{if(view!=='3d')return;let gone=false,failed=false;setParts([]);setSelected(null);
  const fail=()=>{if(gone||failed)return;failed=true;clearTimeout(timer);setStatus('fallback');engine.current?.dispose();engine.current=null};
  const timer=setTimeout(fail,17000);setStatus('loading');if(!window.WebGLRenderingContext||!window.ResizeObserver){fail();return()=>{gone=true;clearTimeout(timer)}}
  import('./biology-world-3d.js').then(({mountBiologyWorld})=>{if(gone||failed)return;try{engine.current=mountBiologyWorld(host.current,topic.scene,latest.current,{onReady:()=>{clearTimeout(timer);if(!gone&&!failed)setStatus('ready')},onFail:fail,onParts:items=>{if(!gone&&!failed){setParts(items);setSelected(null)}},onSelect:item=>!gone&&setSelected(item)})}catch{fail()}}).catch(fail);
  return()=>{gone=true;clearTimeout(timer);engine.current?.dispose();engine.current=null};
 },[view,topic.scene,retry]);
 useEffect(()=>engine.current?.update({p,q}),[p,q]);
 const act=(name,value)=>engine.current?.[name](value),ready=view==='3d'&&status==='ready',imported=biologySceneAssets(topic.scene).length>0;
 return <section className="bio-world" aria-label={`${topic.title}: boshqariladigan model`}>
  <div className="bio-world-toolbar"><div role="group" aria-label="Model ko‘rinishi"><button aria-pressed={view==='3d'} onClick={()=>{if(view!=='3d'){setStatus('loading');setView('3d')}}}><Box size={16}/>3D model</button><button aria-pressed={view==='2d'} onClick={()=>setView('2d')}><Layers size={16}/>Izohli chizma</button></div><span>{imported?'Tayyor 3D model va jarayon sxemasi':'Zarrachalar va hujayralarning ta’limiy modeli'}</span></div>
  <div className={`bio-world-stage bio-world-${status}`}>
   <div ref={host} className="bio-world-canvas" style={{visibility:ready?'visible':'hidden',position:ready?'relative':'absolute'}} tabIndex={ready?0:-1} role="group" aria-label="3D model. Chap va o‘ng tugmalari aylantiradi, yuqori va past tugmalari masofani o‘zgartiradi, Home boshlang‘ich ko‘rinish." onKeyDown={e=>{const keys={ArrowLeft:['rotate',-.2],ArrowRight:['rotate',.2],ArrowUp:['zoom',.9],ArrowDown:['zoom',1.1],Home:['reset']};if(keys[e.key]){e.preventDefault();act(...keys[e.key])}}}/>
   {!ready&&fallback}
   {view==='3d'&&status==='loading'&&<p className="bio-world-loading" role="status">{imported?'Tayyor model yuklanmoqda…':'3D sahna ochilmoqda…'} Chizma hozirdan ishlaydi.</p>}
   {view==='3d'&&status==='fallback'&&<div className="bio-world-message"><p>3D model ochilmadi. Interaktiv chizma orqali davom etish mumkin.</p><button onClick={()=>{setStatus('loading');setRetry(v=>v+1)}}>3Dni qayta ochish</button></div>}
  </div>
  {ready&&<><div className="bio-world-camera" role="group" aria-label="3D kamerani boshqarish"><button aria-label="Modelni chapga aylantirish" onClick={()=>act('rotate',-.3)}><RotateCcw size={18}/></button><button aria-label="Modelni o‘ngga aylantirish" onClick={()=>act('rotate',.3)}><RotateCw size={18}/></button><button aria-label="Modelga yaqinlashish" onClick={()=>act('zoom',.85)}><ZoomIn size={18}/></button><button aria-label="Modeldan uzoqlashish" onClick={()=>act('zoom',1.15)}><ZoomOut size={18}/></button><button aria-label="Model kamerasini tiklash" onClick={()=>act('reset')}><Home size={18}/></button></div><div className="bio-world-parts" role="group" aria-label="Model qismlari">{parts.map(part=><button key={part.name} aria-pressed={selected?.name===part.name} onClick={()=>act('select',part.name)}>{part.name}</button>)}</div><p className="bio-world-detail" aria-live="polite">{selected?<><b>{selected.name}.</b> {selected.description}</>:'Model qismiga yoki uning nomiga bosing. Aylantirish shaklni, vaqt shkalasi esa biologik jarayonni o‘zgartiradi.'}</p></>}
  <p className="bio-model-note">{imported?'Organ, o‘simlik va hayvon sirtlari litsenziyalangan tayyor modellardan olingan. ':''}Ildiz, oziqa yo‘li, molekula va signal belgilarida ta’limiy sxemadan foydalaniladi. Deformatsiyalar, hajm va zarracha o‘lchamlari soddalashtirilgan; hisob va harakat bir xil tajriba parametrlariga bog‘langan.</p>
  {imported&&<BiologyModelSources/>}
 </section>;
}
