import React,{forwardRef,useEffect,useId,useRef} from 'react';
import {X} from 'lucide-react';

export function PaperBrand({className=''}){
 return <span className={'paper-brand '+className} role="img" aria-label="SinfQuiz"><span className="paper-brand-star" aria-hidden="true">✦</span><span>sinfquiz<span className="paper-brand-period">.</span></span></span>;
}
export const PaperButton=forwardRef(function PaperButton({variant='secondary',className='',children,type='button',...props},ref){
 return <button ref={ref} type={type} className={'pw-button pw-button--'+variant+' '+className} {...props}>{children}</button>;
});
export const PaperInput=forwardRef(function PaperInput({className='',...props},ref){return <input ref={ref} className={'pw-input '+className} {...props}/>});
export const PaperBookmark=forwardRef(function PaperBookmark({selected=false,className='',children,...props},ref){
 return <button ref={ref} type="button" className={'pw-bookmark '+(selected?'is-selected ':'')+className} {...props}>{children}</button>;
});
export function NotebookPanel({as:Tag='section',className='',children,decoration=true,...props}){
 return <Tag className={'pw-notebook '+className} {...props}>{decoration&&<><span className="pw-tape" aria-hidden="true"/><span className="pw-spiral" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i}/>)}</span></>}<div className="pw-notebook-content">{children}</div></Tag>;
}
export function PaperNotice({children,kind='info',className='',onDismiss,...props}){
 return <div className={'pw-notice pw-notice--'+kind+' '+className} role={kind==='error'?'alert':'status'} {...props}><div>{children}</div>{onDismiss&&<PaperButton variant="quiet" aria-label="Xabarni yopish" onClick={onDismiss}><X size={18}/></PaperButton>}</div>;
}
export function PaperSkeleton({label='Sahifa ochilmoqda…',className=''}){
 return <div className={'pw-skeleton '+className} role="status" aria-live="polite"><span>{label}</span><div aria-hidden="true"><i/><i/><i/></div></div>;
}
export function PaperDialog({open,onClose,title,description,children,className=''}){
 const id=useId(),panel=useRef(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const focusables=()=>[...panel.current?.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')||[]];
  (panel.current?.querySelector('[data-autofocus]')||focusables()[0]||panel.current)?.focus();
  const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close.current?.()}else if(e.key==='Tab'){const items=focusables(),first=items[0],last=items.at(-1);if(!first){e.preventDefault();return}if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};
  document.addEventListener('keydown',key,true);return()=>{document.removeEventListener('keydown',key,true);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus()};
 },[open]);
 if(!open)return null;
 return <div className="pw-dialog-shade" onPointerDown={e=>{if(e.target===e.currentTarget)onClose?.()}}><section ref={panel} className={'pw-dialog '+className} role="dialog" aria-modal="true" aria-labelledby={id+'-title'} aria-describedby={description?id+'-description':undefined} tabIndex={-1}><PaperButton className="pw-dialog-close" variant="quiet" onClick={onClose} aria-label="Oynani yopish"><X size={20}/></PaperButton><span className="pw-overline">SINFQUIZ / QOG‘OZ USTAXONASI</span><h2 id={id+'-title'}>{title}</h2>{description&&<p id={id+'-description'}>{description}</p>}{children}</section></div>;
}
