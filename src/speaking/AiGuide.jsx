import React,{useEffect,useRef,useState} from 'react';
import {Sparkles,ArrowRight,Compass,Send,CheckCircle2,MessageCircle,BookOpen,ClipboardList,LoaderCircle,X} from 'lucide-react';
import {allowedFeatures} from './features.js';
import {assistantApi} from './assistant-client.js';
import {Notice} from './Common.jsx';
import './speaking.css';

const modes=[
 {id:'guide',title:'Yo‘l ko‘rsatish',icon:Compass,description:'Dasturdagi bo‘limlarni toping va ulardan foydalanishni o‘rganing.'},
 {id:'tutor',title:'Mavzuni tushuntirish',icon:BookOpen,description:'Mavzuni sodda izoh, misol va bosqichlar orqali o‘rganing.'},
 {id:'quiz',title:'Mashq savollari',icon:ClipboardList,description:'Mavzu bo‘yicha savollar oling, javobni tanlang va izohini tekshiring.'},
];
const suggestions={guide:['Speakingni qayerdan boshlayman?','Tarixdagi dalil ustaxonasini qanday ishlataman?'],tutor:['Fotosintezni oddiy misol bilan tushuntiring.','Kasrlarni qo‘shishni bosqichma-bosqich tushuntiring.'],quiz:['Hujayra mavzusidan 3 ta savol tuzing.','Present Simple bo‘yicha 3 ta mashq savoli bering.']};

export default function AiGuide({user,onNavigate,onLogin,currentView='atlasHub'}){
 const features=allowedFeatures(user?.role),[selectedId,setSelectedId]=useState(currentView),[query,setQuery]=useState(''),[message,setMessage]=useState(''),[mode,setMode]=useState('guide'),[turns,setTurns]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[providerConfigured,setProviderConfigured]=useState(null),request=useRef(null),requestId=useRef(0);
 const selected=features.find(f=>f.id===selectedId)||features[0],activeMode=modes.find(m=>m.id===mode);
 useEffect(()=>{const abort=new AbortController();fetch('/api/ai-assistant',{signal:abort.signal}).then(r=>r.ok?r.json():null).then(r=>{if(!abort.signal.aborted&&typeof r?.providerConfigured==='boolean')setProviderConfigured(r.providerConfigured);}).catch(()=>{});return()=>abort.abort();},[]);
 useEffect(()=>{request.current?.abort();requestId.current++;setTurns([]);setMessage('');setError('');setBusy(false);return()=>{requestId.current++;request.current?.abort();};},[user?.id]);
 async function ask(e){
  e?.preventDefault();if(!user)return onLogin();if(busy||!message.trim())return;
  const text=message.trim(),id=++requestId.current,controller=new AbortController();request.current=controller;setBusy(true);setError('');
  const history=turns.flatMap(t=>[{role:'user',content:t.message},{role:'assistant',content:t.answerUz.slice(0,1500)}]).slice(-6);
  try{const result=await assistantApi({mode,message:text,view:selected.id,history},controller.signal);if(id!==requestId.current)return;setTurns(t=>[...t,{...result,id,message:text,mode}].slice(-12));setMessage('');}
  catch(e){if(id===requestId.current&&e.name!=='AbortError')setError(e.message);}
  finally{if(id===requestId.current){setBusy(false);request.current=null;}}
 }
 function cancel(){requestId.current++;request.current?.abort();request.current=null;setBusy(false);}
 const matches=features.filter(f=>(f.title+' '+f.description).toLocaleLowerCase('uz').includes(query.toLocaleLowerCase('uz')));
 return <main className="sp-page sp-guide"><div className="sp-eyebrow"><Sparkles size={14}/> SINFQUIZ AI YORDAMCHI</div><header className="sp-page-head"><div><h1>Qayerdan boshlaymiz?</h1><p>Yo‘l toping, mavzuni tushuning va mashq savollari bilan bilimingizni tekshiring.</p></div><span className="sp-pill"><Compass size={15}/> {user?'Hisobingizga mos yo‘llar':'Ochiq qo‘llanma'}</span></header>
 <div className="sp-guide-layout"><section className="sp-card sp-guide-index"><label className="sp-field">Bo‘limni topish<input type="search" placeholder="Masalan: biologiya, speaking…" value={query} onChange={e=>setQuery(e.target.value)}/></label><nav aria-label="Qo‘llanma bo‘limlari">{matches.map(f=><button key={f.id} className={selected.id===f.id?'is-current':''} aria-current={selected.id===f.id?'true':undefined} onClick={()=>setSelectedId(f.id)}><span>{f.title}</span><ArrowRight size={16}/></button>)}{!matches.length&&<p>Bo‘lim topilmadi. Qidiruv so‘zini qisqartiring.</p>}</nav></section>
 <div className="sp-stack"><section className="sp-card sp-tour"><span className="sp-pill">Qo‘llanma · tekshirilgan qadamlar</span><h2>{selected.title}</h2><p>{selected.description}</p><ol className="sp-steps">{selected.steps.map((s,i)=><li key={s}><span>{i+1}</span><p>{s}</p></li>)}</ol><button className="sp-btn sp-primary" onClick={()=>onNavigate(selected.id)}>{selected.title}ni ochish <ArrowRight size={17}/></button></section>
 <section className="sp-card sp-ai-box"><h2><Sparkles size={20}/> AI bilan birga o‘rganing</h2><div className="sp-assistant-modes" role="group" aria-label="AI yordamchi vazifasi">{modes.map(m=><button key={m.id} className={'sp-btn'+(mode===m.id?' sp-primary':'')} aria-pressed={mode===m.id} disabled={busy} onClick={()=>{setMode(m.id);setError('');}}><m.icon size={16}/>{m.title}</button>)}</div><p>{activeMode.description}</p>
 {!user&&<Notice>Shaxsiy AI yordamchi uchun hisobga kiring. Yuqoridagi qo‘llanma hozir ochiq.</Notice>}{providerConfigured===false&&<Notice>AI xizmati hali administrator tomonidan sozlanmagan. Qo‘llanmadagi qadamlar hozir ishlaydi.</Notice>}
 <div className="sp-assistant-suggestions" aria-label="Savol namunalari">{suggestions[mode].map(s=><button key={s} className="sp-btn sp-quiet" disabled={busy} onClick={()=>setMessage(s)}>{s}<ArrowRight size={13}/></button>)}</div>
 <div className="sp-guide-conversation" aria-live="polite" aria-relevant="additions">{turns.map(t=><article key={t.id}><p className="sp-user-question"><MessageCircle size={15}/> {t.message}</p><p className="sp-ai-answer">{t.answerUz}</p>{t.questions.length>0&&<AssistantQuiz key={t.id} questions={t.questions}/>}<div className="sp-actions">{t.routeIds.filter(id=>features.some(f=>f.id===id)).map(id=><button className="sp-btn" key={id} onClick={()=>onNavigate(id)}>{features.find(f=>f.id===id).title}<ArrowRight size={15}/></button>)}</div></article>)}</div>
 <form onSubmit={ask} aria-busy={busy}><label className="sp-field">Savolingiz<textarea maxLength={1500} rows={3} value={message} disabled={busy} onChange={e=>setMessage(e.target.value)} placeholder={mode==='guide'?'Dasturdan foydalanish haqida so‘rang…':mode==='tutor'?'Qaysi mavzuni tushuntirib beray?':'Fan va mavzuni yozing…'} required={!!user}/></label><div className="sp-assistant-submit"><span className="sp-note">{message.length} / 1500</span><button className="sp-btn sp-primary" disabled={busy||(!message.trim()&&!!user)||providerConfigured===false}>{busy?<><LoaderCircle className="sp-spinner" size={16}/>AI javob tayyorlamoqda…</>:<>{user?'Yordamchidan so‘rash':'Hisobga kirish'}<Send size={16}/></>}</button>{busy&&<button type="button" className="sp-btn sp-quiet" onClick={cancel}><X size={15}/>Bekor qilish</button>}</div></form>{error&&<Notice error>{error} Savolingiz shu yerda saqlandi; qayta yuborishingiz mumkin.</Notice>}
 <p className="sp-note"><CheckCircle2 size={14}/> Savolingiz va shu suhbatdagi oxirgi javoblar Groq orqali qayta ishlanadi. Suhbat faqat shu sahifada saqlanadi. Ovoz va Speaking javoblaringiz yuborilmaydi. AI javoblarini darslik bilan tekshiring.</p></section></div></div></main>;
}

export function AssistantQuiz({questions}){
 const [choices,setChoices]=useState({}),answered=Object.keys(choices).length,correct=questions.filter((q,i)=>choices[i]===q.correctIndex).length;
 return <section className="sp-assistant-quiz" aria-label="AI mashq savollari"><p className="sp-note">Javobni tanlang — keyin to‘g‘ri javob va izoh ochiladi. Bu mashq natijasi.</p>{questions.map((q,i)=><fieldset key={i}><legend>{i+1}. {q.question}</legend><div className="sp-assistant-options">{q.options.map((option,index)=><button type="button" key={index} className={'sp-btn'+(choices[i]===index?' is-picked':'')+(choices[i]!==undefined&&q.correctIndex===index?' is-correct':'')} aria-pressed={choices[i]===index} disabled={choices[i]!==undefined} onClick={()=>setChoices(c=>({...c,[i]:index}))}><span>{String.fromCharCode(65+index)}.</span>{option}</button>)}</div>{choices[i]!==undefined&&<div className="sp-assistant-feedback" role="status"><b>{choices[i]===q.correctIndex?'To‘g‘ri javob.':'To‘g‘ri javob: '+String.fromCharCode(65+q.correctIndex)+'. '+q.options[q.correctIndex]}</b><p>{q.explanationUz}</p></div>}</fieldset>)}{answered===questions.length&&<p className="sp-assistant-score" role="status">Mashq yakuni: {correct} / {questions.length} ta to‘g‘ri javob.</p>}</section>;
}

export function GuideWelcome({user,onNavigate,hidden}){
 const key='sq_guide_746:'+user?.id,[visible,setVisible]=useState(false);
 useEffect(()=>{if(!user?.id){setVisible(false);return;}try{setVisible(localStorage.getItem(key)!=='done');}catch{setVisible(true);}},[key,user?.id]);
 function dismiss(){try{localStorage.setItem(key,'done');}catch{}setVisible(false);}
 if(!visible||hidden||!user)return null;
 return <aside className="sp-welcome" aria-label="Dastur bilan tanishish"><span className="sp-welcome-icon"><Sparkles size={22}/></span><div><b>Dastur bilan birga tanishamiz</b><p>Atlaslar, darslar va AI Speakingni qadam-baqadam ko‘ring.</p><div className="sp-actions"><button className="sp-btn sp-primary" onClick={()=>{dismiss();onNavigate('aiGuide');}}>Menga yo‘l ko‘rsating <ArrowRight size={15}/></button><button className="sp-btn sp-quiet" onClick={dismiss}>Keyinroq</button></div></div></aside>;
}
