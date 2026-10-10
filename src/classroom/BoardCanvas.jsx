import React,{memo,useEffect,useRef} from 'react';
import {BOARD_WIDTH as W,BOARD_HEIGHT as H,clamp,makeId,objectBounds,hitObject,translateObject,resizeObject,eraseObjects,shapeFromPoints} from './model.js';
import {drawBoard,readyImages} from './board-renderer.js';

export default memo(function BoardCanvas({page,tool,color,width,fontSize,selected,presentation,onSelect,onCommit,onText,onUndo,onRedo,onMessage}) {
  const canvas=useRef(null),view=useRef({}),gesture=useRef(null),frame=useRef(null),scale=useRef(1);
  view.current={page,tool,color,width,fontSize,selected,presentation,onSelect,onCommit,onText,onUndo,onRedo,onMessage};
  const paint=()=>{
    const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;
    if(view.current.presentation){
      const wrap=el.parentElement,top=wrap.getBoundingClientRect().top,help=wrap.querySelector('.cr-board-help').offsetHeight,actions=wrap.parentElement.querySelector('.cr-board-actions').offsetHeight;
      const availableHeight=Math.max(180,innerHeight-Math.max(0,top)-help-actions-20);
      el.style.width=Math.min(wrap.clientWidth,availableHeight*W/H)+'px';
    }else el.style.width='100%';
    el.style.marginInline='auto';
    const dpr=Math.min(2,window.devicePixelRatio||1),size=el.getBoundingClientRect();
    const cw=Math.max(1,Math.round(size.width*dpr)),ch=Math.max(1,Math.round(size.height*dpr));
    if(el.width!==cw||el.height!==ch){el.width=cw;el.height=ch;}
    scale.current=size.width/W;ctx.setTransform(cw/W,0,0,ch/H,0,0);
    drawBoard(ctx,view.current.page,{draft:gesture.current,selected:view.current.selected,scale:scale.current});
  };
  const repaint=()=>{if(frame.current!==null)return;frame.current=requestAnimationFrame(()=>{frame.current=null;paint();});};
  useEffect(()=>{gesture.current=null;},[page.id]);
  useEffect(()=>{let alive=true;paint();readyImages(page.objects).then(()=>alive&&repaint()).catch(e=>alive&&onMessage(e.message));return()=>{alive=false;};},[page,selected,presentation]);
  useEffect(()=>{const r=new ResizeObserver(repaint);r.observe(canvas.current);window.addEventListener('resize',repaint);return()=>{r.disconnect();window.removeEventListener('resize',repaint);cancelAnimationFrame(frame.current);};},[]);
  const point=e=>{const b=canvas.current.getBoundingClientRect();return {x:clamp((e.clientX-b.left)*W/b.width,0,W),y:clamp((e.clientY-b.top)*H/b.height,0,H),pressure:e.pointerType==='pen'?clamp(e.pressure||.5,.05,1):1};};
  const down=e=>{
    if(gesture.current||e.button>0)return;e.preventDefault();canvas.current.focus();
    const p=point(e),v=view.current,g={pointer:e.pointerId,start:p,kind:v.tool};
    if(v.tool==='text'){v.onText(p);return;}
    if(v.tool==='select') {
      const current=v.page.objects.find(o=>o.id===v.selected),b=current&&objectBounds(current),tol=16/scale.current;
      const resizing=b&&Math.hypot(p.x-b.x-b.w,p.y-b.y-b.h)<=tol;
      const object=resizing?current:[...v.page.objects].reverse().find(o=>hitObject(o,p,8/scale.current));
      v.onSelect(object?.id||null);if(!object){repaint();return;}
      g.original=object;g.kind=resizing?'resize':'move';g.objects=v.page.objects;
    } else if(v.tool==='eraser')g.objects=eraseObjects(v.page.objects,p,v.width*2);
    else if(['pen','marker','highlight'].includes(v.tool))g.object={id:makeId(),type:'stroke',brush:v.tool,color:v.color,width:v.width,points:[p,{...p,x:p.x+.1}]};
    else g.object=shapeFromPoints(v.tool,p,p,{id:makeId(),color:v.color,width:v.width});
    gesture.current=g;canvas.current.setPointerCapture(e.pointerId);repaint();
  };
  const move=e=>{
    const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;e.preventDefault();const p=point(e),v=view.current;
    if(g.object?.type==='stroke') {
      const coalesced=e.nativeEvent.getCoalescedEvents?.(),events=coalesced?.length?coalesced:[e];
      for(const event of events) {const q=point(event),last=g.object.points.at(-1);if(g.object.points.length<15000&&Math.hypot(q.x-last.x,q.y-last.y)>.8)g.object.points.push(q);}
    } else if(g.object)g.object=shapeFromPoints(g.object.type,g.start,p,g.object);
    else if(g.kind==='eraser')g.objects=eraseObjects(g.objects,p,v.width*2);
    else {
      const b=objectBounds(g.original),next=g.kind==='resize'?resizeObject(g.original,p.x-b.x,p.y-b.y):translateObject(g.original,p.x-g.start.x,p.y-g.start.y);
      g.objects=v.page.objects.map(o=>o.id===next.id?next:o);
    }
    repaint();
  };
  const finish=e=>{
    const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;
    gesture.current=null;if(e.type!=='pointercancel') {
      const next=g.objects||[...view.current.page.objects,g.object];
      if(next.length>1500)view.current.onMessage('Bu sahifa to‘ldi. Yangi doska sahifasini oching.');else view.current.onCommit(next);
    }
    repaint();
  };
  const keys=e=>{
    const v=view.current,mod=e.ctrlKey||e.metaKey;
    if(mod&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();e.stopPropagation();(e.key.toLowerCase()==='y'||e.shiftKey?v.onRedo:v.onUndo)();return;}
    if(e.key==='Enter'&&v.tool==='text'){e.preventDefault();v.onText({x:100,y:100});return;}
    if(e.key==='Enter'&&['line','arrow','ellipse','rectangle','triangle'].includes(v.tool)){
      e.preventDefault();const o=shapeFromPoints(v.tool,{x:W*.3,y:H*.3},{x:W*.55,y:H*.6},{id:makeId(),color:v.color,width:v.width});
      if(v.page.objects.length>=1500){v.onMessage('Bu sahifa to‘ldi. Yangi sahifa oching.');return;}
      v.onCommit([...v.page.objects,o]);v.onSelect(o.id);return;
    }
    const object=v.page.objects.find(o=>o.id===v.selected);
    if(['Delete','Backspace'].includes(e.key)&&object){e.preventDefault();v.onCommit(v.page.objects.filter(o=>o.id!==object.id));v.onSelect(null);}
    if(e.key==='Escape')v.onSelect(null);
    if(object&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      e.preventDefault();const d=e.shiftKey?10:1,dx=e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0,dy=e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0;
      v.onCommit(v.page.objects.map(o=>o.id===object.id?translateObject(o,dx,dy):o));
    }
  };
  return <div className="cr-board-wrap"><canvas ref={canvas} className={`cr-board tool-${tool}`} tabIndex="0" role="application" aria-label={`${page.name}. Elektron doska`} aria-describedby="cr-board-help" onPointerDown={down} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onKeyDown={keys}>Chizmalar ro‘yxati doska ostida mavjud.</canvas><p id="cr-board-help" className="cr-board-help">Sensor yoki qalam bilan yozing. Matn/shakl asbobi + Enter — qo‘yish. Tanlangan obyekt: strelkalar — ko‘chirish, Shift — 10 birlik; Delete — o‘chirish; Ctrl+Z / Ctrl+Y — bekor qilish / qaytarish.</p></div>;
});
