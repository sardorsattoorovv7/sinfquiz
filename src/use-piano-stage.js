import {useCallback,useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';

// CSS rotation also works when a mobile browser cannot lock device orientation.
export function pianoStageLayout(width,height,rotation='auto'){
 const w=Math.max(1,Math.round(Number(width)||1)),h=Math.max(1,Math.round(Number(height)||1));
 const rotated=rotation==='auto'?h>w:rotation==='sideways';
 return {width:w,height:h,rotated,stageWidth:rotated?h:w,stageHeight:rotated?w:h};
}
const viewport=()=>{
 if(typeof window==='undefined')return {width:800,height:400,left:0,top:0};
 const v=window.visualViewport;
 return {width:v?.width||window.innerWidth,height:v?.height||window.innerHeight,left:v?.offsetLeft||0,top:v?.offsetTop||0};
};

export function usePianoStage(root,onRelease,onEscape){
 const [open,setOpen]=useState(false),[rotation,setRotation]=useState('auto'),[size,setSize]=useState(viewport);
 const launcher=useRef(null),release=useRef(onRelease),escape=useRef(onEscape),active=useRef(false),epoch=useRef(0),ownedFullscreen=useRef(null),locked=useRef(false);
 release.current=onRelease;escape.current=onEscape;
 const unlock=useCallback(()=>{if(locked.current){locked.current=false;try{window.screen?.orientation?.unlock?.()}catch{}}},[]);
 const exitNative=useCallback(()=>{
  unlock();const element=ownedFullscreen.current;ownedFullscreen.current=null;
  if(element&&document.fullscreenElement===element){try{Promise.resolve(document.exitFullscreen?.()).catch(()=>{})}catch{}}
 },[unlock]);
 const close=useCallback(()=>{
  if(!active.current)return;
  active.current=false;epoch.current++;release.current?.();exitNative();setOpen(false);
 },[exitNative]);
 const enter=useCallback(async()=>{
  if(active.current)return;
  release.current?.();active.current=true;const token=++epoch.current;
  // The portal must be mounted before requesting fullscreen on its new root.
  flushSync(()=>{setSize(viewport());setRotation('auto');setOpen(true)});
  const element=root.current;element?.focus({preventScroll:true});
  // Fullscreen the wrapper: native fullscreen rules reset transforms on the
  // fullscreen element, so the inner piano must keep its own CSS rotation.
  const surface=element?.parentElement?.classList.contains('cp-stage-portal')?element.parentElement:element;
  if(document.fullscreenElement&&!document.fullscreenElement.contains(element)){
   try{await document.exitFullscreen?.()}catch{}
  }
  if(token!==epoch.current||!active.current)return;
  if(surface?.requestFullscreen&&!document.fullscreenElement){
   ownedFullscreen.current=surface;
   try{await surface.requestFullscreen({navigationUI:'hide'})}catch{if(ownedFullscreen.current===surface)ownedFullscreen.current=null}
  }
  if(token!==epoch.current||!active.current){
   if(document.fullscreenElement===surface){try{await document.exitFullscreen?.()}catch{}}
   return;
  }
  const orientation=window.screen?.orientation;
  if(typeof orientation?.lock==='function'){
   try{
    await orientation.lock('landscape');
    if(token!==epoch.current||!active.current){try{orientation.unlock?.()}catch{}}else locked.current=true;
   }catch{/* The CSS stage remains usable without native orientation support. */}
  }
 },[root]);
 const rotate=useCallback(()=>{
  release.current?.();unlock();setRotation(old=>pianoStageLayout(size.width,size.height,old).rotated?'upright':'sideways');
 },[size.width,size.height,unlock]);
 useEffect(()=>{
  if(!open)return;
  const node=root.current,body=document.body,oldOverflow=body.style.overflow,oldFocus=document.activeElement;
  const siblings=[...body.children].filter(e=>e!==node&&!e.contains(node)&&!['SCRIPT','STYLE','LINK'].includes(e.tagName)).map(e=>[e,e.hasAttribute('inert')]);
  body.style.overflow='hidden';for(const [element] of siblings)element.setAttribute('inert','');
  let frame=0,portrait=size.height>size.width;
  const measure=()=>{
   cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
    const next=viewport(),nextPortrait=next.height>next.width;
    if(nextPortrait!==portrait){portrait=nextPortrait;setRotation('auto')}
    setSize(next);
   });
  };
  const fullscreen=()=>{if(ownedFullscreen.current&&!document.fullscreenElement)close()};
  const key=e=>{
   if(e.key==='Escape'){
    e.preventDefault();e.stopPropagation();
    const details=node?.querySelector('.cp-stage-options[open]');
    if(details)details.removeAttribute('open');else{escape.current?.();close()}return;
   }
   if(e.key!=='Tab'||!node)return;
   const items=[...node.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),summary,[tabindex="0"]')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]'));
   if(!items.length){e.preventDefault();node.focus();return}
   const first=items[0],last=items.at(-1);
   if(e.shiftKey&&(document.activeElement===first||document.activeElement===node)){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  };
  window.addEventListener('resize',measure);window.addEventListener('orientationchange',measure);
  window.visualViewport?.addEventListener('resize',measure);window.visualViewport?.addEventListener('scroll',measure);
  document.addEventListener('fullscreenchange',fullscreen);document.addEventListener('keydown',key,true);
  return()=>{
   cancelAnimationFrame(frame);body.style.overflow=oldOverflow;
   for(const [element,inert] of siblings)if(!inert)element.removeAttribute('inert');
   window.removeEventListener('resize',measure);window.removeEventListener('orientationchange',measure);
   window.visualViewport?.removeEventListener('resize',measure);window.visualViewport?.removeEventListener('scroll',measure);
   document.removeEventListener('fullscreenchange',fullscreen);document.removeEventListener('keydown',key,true);
   const target=launcher.current||oldFocus;if(target?.isConnected)target.focus({preventScroll:true});
  };
 },[open,close,root]);
 useEffect(()=>()=>{active.current=false;epoch.current++;exitNative()},[exitNative]);
 const layout=pianoStageLayout(size.width,size.height,rotation);
 return {open,enter,close,rotate,launcher,layout,style:{'--cp-vw':layout.width+'px','--cp-vh':layout.height+'px',
  '--cp-vleft':size.left+'px','--cp-vtop':size.top+'px','--cp-stage-h':layout.stageHeight+'px'}};
}
