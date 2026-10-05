import React,{useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUp,Check,Headphones,HelpCircle} from 'lucide-react';
import ShortcutInput from './ShortcutInput.jsx';
import OfficeLab from './OfficeLab.jsx';
import ScenicMaze from './ScenicMaze.jsx';
import {typingMatch} from './competition-model.js';
const PythonWorkbench=React.lazy(()=>import('./PythonWorkbench.jsx'));
const same=(a,b)=>a?.[0]===b?.[0]&&a?.[1]===b?.[1];
const key=p=>p.join(',');
function pythonReady(value){try{const v=JSON.parse(value);return typeof v.code==='string'&&v.code.trim().length>=5&&typeof v.output==='string'&&v.output.trim().length>0}catch{return false}}
function speak(text){
 if(!window.speechSynthesis)return;
 window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.rate=.85;window.speechSynthesis.speak(utterance);
}
export function QuizChallenge({stage,onSubmit,busy,ownerId}){
 const q=stage.data.question,[answer,setAnswer]=useState(q.type==='test'?null:'');
 const ready=q.type==='test'?answer!==null:q.type==='python'?pythonReady(answer):String(answer).trim().length>0;
 return <section className="comp-challenge"><div className="comp-question-count">Savol {stage.data.index+1} / {stage.data.total}<span>{q.points} savol balli</span></div>
 {q.passage&&<div className="comp-passage" tabIndex={0} role="region" aria-label="Savol matni">{q.passage}</div>}<h3>{q.text}</h3>
 {q.code&&q.type!=='python'&&<pre className="comp-code" aria-label="Savolga oid kod">{q.code}</pre>}
 {q.type==='test'?<fieldset className="comp-answer-options"><legend>Javobni tanlang</legend>{q.options.map((text,i)=><label className={answer===i?'is-selected':''} key={i}><input type="radio" name={'comp-answer-'+q.id} disabled={busy} checked={answer===i} onChange={()=>setAnswer(i)}/><span className="comp-option-letter">{String.fromCharCode(65+i)}</span><span>{text}</span></label>)}</fieldset>:
 q.type==='shortcut'?<ShortcutInput value={answer} onChange={setAnswer} disabled={busy}/>:
 q.type==='office'?<OfficeLab question={q} onChange={setAnswer} disabled={busy}/>:
 q.type==='python'?<React.Suspense fallback={<p role="status">Python muharriri ochilmoqda…</p>}><PythonWorkbench ownerId={ownerId} taskId={'comp-'+stage.id+'-'+q.id} initialCode={q.code||''} onChange={setAnswer}/></React.Suspense>:
 <label>{q.type==='prompt'?'Javobingizni tushuntiring':'Javobingiz'}<textarea autoComplete="off" spellCheck={q.type==='prompt'} maxLength={q.type==='prompt'?5000:8000} disabled={busy} value={answer} onChange={e=>setAnswer(e.target.value)} rows={q.type==='prompt'?5:2}/></label>}
 {q.type==='python'&&<p className="comp-muted">Avval kodni ishga tushiring. Natija chiqqach javobni yuboring.</p>}<button className="btn btn-primary" disabled={busy||!ready} onClick={()=>onSubmit({questionId:q.id,answer})}><Check size={17}/>{busy?'Javob tekshirilmoqda…':'Javobni yuborish'}</button>
 </section>;
}
export function TypingChallenge({stage,onSubmit,busy}){
 const [text,setText]=useState(''),target=stage.data.text,typed=[...text],match=typingMatch(target,text),accuracy=Math.round(100*match.correct/Math.max(match.total,match.typed,1));
 const english=stage.data.language==='en';
 useEffect(()=>()=>window.speechSynthesis?.cancel(),[]);
 return <section className="comp-challenge comp-typing"><div className="comp-question-count"><span>{match.correct} / {match.total} belgi mos</span><span>Aniqlik: {accuracy}%</span></div><p>Matnni quyidagidek tering. Aniqlik va tezlik yakuniy ballga birga ta’sir qiladi.</p>
 <div className="comp-typing-target" tabIndex={0} role="region" aria-label="Teriladigan matn">{[...target].map((c,i)=><span key={i} className={i<typed.length?c===typed[i]?'is-correct':'is-wrong':''}>{c}</span>)}</div>
 {english&&typeof window.speechSynthesis!=='undefined'&&<button className="btn btn-outline" disabled={busy} onClick={()=>speak(target)}><Headphones size={16}/> Matnni tinglash</button>}
 <label>Matnni shu yerga yozing<textarea aria-label="Musobaqa typing matni" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" value={text} disabled={busy} maxLength={Math.min(8000,target.length+500)} onChange={e=>setText(e.target.value)} onPaste={e=>e.preventDefault()} onDrop={e=>e.preventDefault()} rows={6}/></label>
 <small>Yopishtirish o‘chirilgan. Inglizcha matnni ovozsiz ham bajarishingiz mumkin.</small><button className="btn btn-primary" disabled={busy||!text.length} onClick={()=>onSubmit({text})}><Check size={17}/>{busy?'Yuborilmoqda…':'Typingni yakunlash'}</button></section>;
}
export function MazeChallenge({stage,onSubmit,busy}){
 const level=stage.data,opened=level.opened||[],serverPosition=level.position||level.start;
 const [position,setPosition]=useState(serverPosition),[gate,setGate]=useState(null),[notice,setNotice]=useState(''),[selection,setSelection]=useState(null);
 const route=useRef([serverPosition]),serverKey=key(serverPosition),openedKey=opened.join(','),mapRef=useRef(null);
 useEffect(()=>{setPosition(serverPosition);route.current=[serverPosition];setGate(null);setSelection(null);setNotice('')},[serverKey,openedKey]);
 useEffect(()=>()=>window.speechSynthesis?.cancel(),[]);
 const closed=level.gateCells.filter((_,i)=>!opened.includes(i)).map(key);
 const walk=(dx,dy)=>{
  if(busy||gate!==null)return;
  const next=[position[0]+dx,position[1]+dy],cell=level.grid[next[1]]?.[next[0]];
  if(!cell||cell==='#'){setNotice('Bu tomonda devor. Boshqa yo‘nalishni sinang.');return}
  const door=level.gateCells.findIndex(p=>same(p,next));
  if(door>=0&&!opened.includes(door)){setGate(door);setSelection(null);setNotice('Eshikni ochish uchun savolga javob bering.');return}
  const index=route.current.findIndex(p=>same(p,next));
  route.current=index>=0?route.current.slice(0,index+1):[...route.current,next];
  setPosition(next);setNotice('');
 };
 const atExit=same(position,level.exit),allOpen=opened.length===level.tasks.length,task=gate===null?null:level.tasks[gate];
 const send=mode=>onSubmit({mode,gate,path:[...route.current,level.gateCells[gate]],...(mode==='hint'?{}:{answer:selection})});
 const keyboard=e=>{
  if(e.target!==e.currentTarget)return;
  const moves={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]},move=moves[e.key];
  if(move){e.preventDefault();walk(...move)}
 };
 return <section className="comp-challenge comp-maze"><div className="comp-question-count"><span>{opened.length} / {level.tasks.length} eshik ochildi</span><span>{level.difficulty==='hard'?'Murakkab':['middle','medium'].includes(level.difficulty)?'O‘rta':'Boshlang‘ich'}</span></div>
 <p>Eshikka yurib boring, gapni o‘qing va javobni tanlang. Bu musobaqada ta’qibchi yo‘q; vaqt va javoblar hisoblanadi.</p>
 <div ref={mapRef} className="comp-maze-map" tabIndex={0} role="group" aria-label="Labirintni strelka yoki WASD tugmalari bilan boshqaring" onKeyDown={keyboard}>
  <ScenicMaze level={level} position={position} closed={closed} showMonster={false}/>
 </div><div className="comp-maze-below"><p role="status">{notice||'Strelkalar yoki pastdagi tugmalar bilan yuring.'}</p><div className="comp-maze-pad">{[[0,-1,ArrowUp,'Yuqoriga'],[-1,0,ArrowLeft,'Chapga'],[0,1,ArrowDown,'Pastga'],[1,0,ArrowRight,'O‘ngga']].map(([dx,dy,Icon,label])=><button className="btn btn-outline" type="button" key={label} aria-label={label} disabled={busy||gate!==null} onClick={()=>walk(dx,dy)}><Icon size={22}/></button>)}</div></div>
 {task&&<section className="comp-door" aria-label={gate+1+'-eshik savoli'}><h3>{gate+1}-eshik: gapni tushuning</h3><p className="comp-english-sentence" lang="en">{task.audio}</p>{typeof window.speechSynthesis!=='undefined'&&<button className="btn btn-outline" disabled={busy} onClick={()=>speak(task.audio)}><Headphones size={16}/> Tinglash</button>}<fieldset className="comp-answer-options"><legend>Gapga mos javob</legend>{task.options.map((option,i)=><label key={i} className={selection===i?'is-selected':''}><input type="radio" name={'door-'+gate} checked={selection===i} disabled={busy} onChange={()=>setSelection(i)}/><span>{option}</span></label>)}</fieldset><div className="comp-row"><button className="btn btn-primary" disabled={busy||selection===null} onClick={()=>send('answer')}>Eshikni ochish</button><button className="btn btn-outline" disabled={busy||(level.hintsUsed?.[gate]||0)>=2} onClick={()=>send('hint')}><HelpCircle size={17}/> Yordam (−20%)</button><button className="btn btn-ghost" disabled={busy} onClick={()=>{setGate(null);setSelection(null);mapRef.current?.focus()}}>Yo‘lga qaytish</button></div><small>Har xato uchun shu eshik ballidan 15%, har yordam uchun 20% ayriladi; eng kam ball 30%.</small></section>}
 {atExit&&<div className="comp-exit"><p>{allOpen?'Barcha eshik ochildi. Yakuniy natijangizni yuboring.':'Chiqishdan oldin barcha eshiklarni oching.'}</p><button className="btn btn-primary" disabled={busy||!allOpen} onClick={()=>onSubmit({mode:'finish',path:route.current})}>Labirintni yakunlash</button></div>}
 </section>;
}
