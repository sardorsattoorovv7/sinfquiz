import React,{useEffect,useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,Check,Clock3,Keyboard,RotateCcw,Target,X,Zap} from 'lucide-react';
import {DEFAULT_WARMUP,advanceWarmup,finishWarmup,makeWarmupText,newWarmupSession,normalizeWarmup,warmupMetrics} from './uzbek-warmup.js';
import './uzbek-warmup.css';

const clockNow=()=>performance.now();
export default function UzbekTypingWarmup({onContinue,continueLabel='5 bosqichli mashqqa o‘tish',clock=clockNow}){
 const [options,setOptions]=useState({...DEFAULT_WARMUP});
 const [target,setTarget]=useState(()=>makeWarmupText(DEFAULT_WARMUP));
 const [session,setSession]=useState(newWarmupSession),[draft,setDraft]=useState(''),[now,setNow]=useState(0);
 const [focused,setFocused]=useState(false),[caret,setCaret]=useState(0),[notice,setNotice]=useState('');
 const sessionRef=useRef(session),targetRef=useRef(target),composing=useRef(false),inputRef=useRef(null),restartRef=useRef(null),viewportRef=useRef(null),caretRef=useRef(null);
 const id=useId(),finished=session.endedAt!==null,running=session.startedAt!==null&&!finished;
 const metrics=warmupMetrics(session,target,now),typedChars=[...normalizeWarmup(draft)];
 const words=useMemo(()=>{let offset=0;return target.split(' ').map((word,index,all)=>{const chars=[...(word+(index<all.length-1?' ':''))],start=offset;offset+=chars.length;return {chars,start};})},[target]);
 const commit=value=>{sessionRef.current=value;setSession(value)};
 const stop=()=>{const t=clock();setNow(t);commit(finishWarmup(sessionRef.current,t,options))};
 const focusInput=()=>inputRef.current?.focus({preventScroll:true});
 const reset=(nextOptions=options,focus=true)=>{
  const next=makeWarmupText(nextOptions,Math.random,target);
  commit(newWarmupSession());targetRef.current=next;setTarget(next);setDraft('');setCaret(0);setNow(0);setNotice('');setFocused(false);composing.current=false;
  if(viewportRef.current)viewportRef.current.scrollTop=0;
  if(focus)requestAnimationFrame(focusInput);
 };
 const configure=patch=>{const next={...options,...patch};setOptions(next);reset(next,false)};
 const change=(value,selection)=>{
  if(sessionRef.current.endedAt!==null)return;
  if(composing.current){setDraft(value);return;}
  const t=clock(),next=advanceWarmup(sessionRef.current,targetRef.current,value,t,options);
  setNow(t);commit(next);setDraft(next.typed);setNotice('');
  setCaret([...next.typed.slice(0,selection??next.typed.length)].length);
  if(options.mode==='time'&&next.endedAt===null&&targetRef.current.length-next.typed.length<160){
   const extended=targetRef.current+' '+makeWarmupText({...options,mode:'time'},Math.random,targetRef.current);
   targetRef.current=extended;setTarget(extended);
  }
 };
 useEffect(()=>{
  if(!running)return;
  const tick=()=>{const t=clock();setNow(t);if(options.mode==='time'&&t>=sessionRef.current.startedAt+options.seconds*1000)commit(finishWarmup(sessionRef.current,t,options));};
  const timer=setInterval(tick,100);document.addEventListener('visibilitychange',tick);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',tick)};
 },[running,options.mode,options.seconds,clock]);
 useEffect(()=>{if(finished)restartRef.current?.focus({preventScroll:true})},[finished]);
 useLayoutEffect(()=>{
  const viewport=viewportRef.current,mark=caretRef.current;if(!viewport||!mark)return;
  const top=mark.offsetTop,bottom=top+mark.offsetHeight;
  if(top<viewport.scrollTop||bottom>viewport.scrollTop+viewport.clientHeight)viewport.scrollTop=Math.max(0,top-viewport.clientHeight/2);
 },[caret,target]);
 const preventTransfer=event=>{event.preventDefault();setNotice('Razminka uchun matnni klaviaturada o‘zingiz tering.')};
 const remaining=options.mode==='time'?Math.max(0,Math.ceil(options.seconds-metrics.elapsedMs/1000)):null;
 return <section className="uw-practice" aria-labelledby={id+'-title'} lang="uz-Latn">
  <header className="uw-heading"><div><span className="uw-eyebrow"><Keyboard size={15}/> O‘ZBEKCHA TYPING</span><h2 id={id+'-title'}>Barmoqlar uchun <em>razminka.</em></h2><p>Qisqa gaplar. Erkin ritm. Har kuni bir oz tezroq.</p></div><span className="uw-local-badge">Erkin mashq · reytingga yozilmaydi</span></header>
  <div className="uw-toolbar">
   <div className="uw-switch" role="group" aria-label="Razminka rejimi">{[['sentences','Gaplar'],['time','Vaqt']].map(([mode,label])=><button type="button" key={mode} aria-pressed={options.mode===mode} onClick={()=>configure({mode})}>{label}</button>)}</div>
   {options.mode==='sentences'?<div className="uw-switch" role="group" aria-label="Gaplar soni">{[1,3,5].map(count=><button type="button" key={count} aria-pressed={options.count===count} onClick={()=>configure({count})}>{count} gap</button>)}</div>:<div className="uw-switch" role="group" aria-label="Razminka davomiyligi">{[15,30,60].map(seconds=><button type="button" key={seconds} aria-pressed={options.seconds===seconds} onClick={()=>configure({seconds})}>{seconds} s</button>)}</div>}
   <button type="button" className="uw-punctuation" aria-pressed={options.punctuation} onClick={()=>configure({punctuation:!options.punctuation})}><span aria-hidden="true">Aa,.</span> Tinish belgilari</button>
  </div>
  <div className="uw-stats" aria-label="Razminka ko‘rsatkichlari"><div><Zap size={16}/><strong data-metric="wpm">{metrics.wpm}</strong><span>WPM</span></div><div><Target size={16}/><strong data-metric="accuracy">{metrics.accuracy}%</strong><span>aniqlik</span></div><div><X size={16}/><strong data-metric="errors">{metrics.errors}</strong><span>xato</span></div><div><Clock3 size={16}/><strong data-metric="time">{options.mode==='time'&&!finished?remaining:Math.floor(metrics.elapsedMs/1000)}<small> s</small></strong><span>{options.mode==='time'&&!finished?'qoldi':'vaqt'}</span></div></div>
  {finished?<div className="uw-result" role="status"><span className="uw-result-icon"><Check size={25}/></span><span className="uw-eyebrow">YAXSHI MASHQ BO‘LDI</span><h3>Razminka yakunlandi.</h3><p>{metrics.correct} / {metrics.typed} belgi to‘g‘ri. {metrics.errors?'Xato chiqqan joylarga keyingi safar biroz e’tibor bering.':'Aniq yozdingiz. Shu ritmni saqlang!'}</p><small>WPM — to‘g‘ri belgilar soni ÷ 5 ÷ daqiqa. Aniqlikda tuzatilgan xatolar ham hisoblanadi.</small></div>:<div className={'uw-editor '+(focused?'is-focused':'')}>
   <p className="uw-sr" id={id+'-target'}>Teriladigan matn: {target}</p>
   <label className="uw-sr" htmlFor={id+'-input'}>Qisqa gaplarni yozish</label>
   <div className="uw-viewport" ref={viewportRef} aria-hidden="true"><div className="uw-words">{words.map(({chars,start})=><span className="uw-word" key={start}>{chars.map((char,i)=>{const index=start+i,entered=index<typedChars.length,wrong=entered&&typedChars[index]!==normalizeWarmup(char);return <span key={index} ref={index===caret?caretRef:null} className={'uw-char '+(entered?wrong?'is-wrong':'is-correct':'is-pending')+(index===caret?' is-caret':'')}>{char}</span>})}</span>)}{typedChars.length>target.length&&<span className="uw-char is-wrong">{draft.slice(target.length)}</span>}<span ref={caret>=target.length?caretRef:null} className={caret>=target.length?'uw-char is-caret':''}/></div></div>
   <textarea id={id+'-input'} ref={inputRef} className="uw-input" value={draft} aria-describedby={id+'-hint '+id+'-target'} spellCheck={false} autoCapitalize="off" autoCorrect="off" autoComplete="off" inputMode="text" maxLength={target.length+80} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onChange={e=>change(e.target.value,e.target.selectionStart)} onSelect={e=>setCaret([...e.target.value.slice(0,e.target.selectionStart)].length)} onPaste={preventTransfer} onDrop={preventTransfer} onBeforeInput={e=>{if(['insertFromPaste','insertFromDrop'].includes(e.nativeEvent.inputType))preventTransfer(e)}} onCompositionStart={()=>{composing.current=true}} onCompositionEnd={e=>{composing.current=false;change(e.currentTarget.value,e.currentTarget.selectionStart)}}/>
   {!focused&&<button type="button" className="uw-focus-button" onClick={focusInput}><Keyboard size={19}/>{running?'Yozishni davom ettirish':'Yozishni boshlash'}</button>}
  </div>}
  <div className="uw-footer"><button type="button" ref={restartRef} className="uw-restart" onClick={()=>reset()} aria-label="Yangi razminka"><RotateCcw size={17}/> Yangi gaplar</button>{running&&<button type="button" onClick={stop}>Yakunlash <Check size={16}/></button>}{finished&&onContinue&&<button type="button" className="uw-continue" onClick={onContinue}>{continueLabel}<ArrowRight size={17}/></button>}{!finished&&<span><kbd>Tab</kbd> keyin <kbd>Enter</kbd> — yangi mashq</span>}</div>
  <p className="uw-hint" id={id+'-hint'}>Vaqt birinchi harfdan boshlanadi. Backspace bilan tuzating. O‘ va G‘ uchun oddiy apostrof ham qabul qilinadi.</p>
  <p className="uw-notice" role="status" aria-live="polite">{notice}</p>
 </section>;
}
