import React,{useEffect,useRef,useState} from 'react';
import {Sparkles,ArrowRight,Compass,Send,CheckCircle2,MessageCircle,BookOpen,ClipboardList,LoaderCircle,X,GraduationCap,ClipboardCheck} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {allowedFeatures,assistantPage} from './features.js';
import {assistantApi} from './assistant-client.js';
import {Notice} from './Common.jsx';
import {speakingCopy as copy} from './copy.js';
import RobotAssistant from './RobotAssistant.jsx';
import DiagnosticQuiz from './DiagnosticQuiz.jsx';
import {reportContext} from './learning.js';
import './speaking.css';
import './assistant-answer.css';

const modes=[
 {id:'mentor',title:'AI ustoz',icon:GraduationCap,description:'Istalgan mavzuda yozing. Javobni qaysi tilda, uslubda yoki shaklda xohlashingizni ham aytishingiz mumkin.'},
 {id:'guide',title:'Yo‘l ko‘rsatish',icon:Compass,description:'Dasturdagi bo‘limlarni toping va ulardan foydalanishni o‘rganing.'},
 {id:'tutor',title:'Mavzuni tushuntirish',icon:BookOpen,description:'Mavzuni sodda izoh, misol va bosqichlar orqali o‘rganing.'},
 {id:'quiz',title:'Mashq savollari',icon:ClipboardList,description:'Mavzu bo‘yicha savollar oling, javobni tanlang va izohini tekshiring.'},
 {id:'diagnostic',title:'Darajani aniqlash',icon:ClipboardCheck,description:'Fan va mavzuni ayting. 5 ta savol bilan shu mavzuda nimadan boshlashni aniqlaymiz.'},
];
const suggestions={mentor:['Hozir qayerdaman?','Bilimimni qisqa test bilan tekshiring.','Speakingni qayerdan boshlayman?','Ingliz tilida qisqa hikoya yozing.'],guide:copy.helperQuestions,tutor:['Fotosintezni oddiy misol bilan tushuntiring.','Kasrlarni qo‘shishni bosqichma-bosqich tushuntiring.'],quiz:['Hujayra mavzusidan 3 ta savol tuzing.','Present Simple bo‘yicha 3 ta mashq savoli bering.'],diagnostic:['Matematika: kasrlar bo‘yicha darajamni tekshiring.','Ingliz tili: Present Simple bo‘yicha bilimimni tekshiring.']};
const replyComponents={
 table:({children})=><div className="sp-answer-scroll" role="region" aria-label="Javobdagi jadval" tabIndex={0}><table>{children}</table></div>,
 pre:({children})=><pre tabIndex={0}>{children}</pre>,
};

export default function AiGuide({user,onNavigate,onLogin,currentView='aiGuide',originView=null,compact=false}){
 const features=allowedFeatures(user?.role),[selectedId,setSelectedId]=useState(originView||currentView),[query,setQuery]=useState(''),[message,setMessage]=useState(''),[mode,setMode]=useState('mentor'),[turns,setTurns]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[providerConfigured,setProviderConfigured]=useState(null),request=useRef(null),requestId=useRef(0);
 const selected=features.find(f=>f.id===selectedId),activeMode=modes.find(m=>m.id===mode),page=assistantPage(currentView,user?.role);
 useEffect(()=>{const abort=new AbortController();fetch('/api/ai-assistant',{signal:abort.signal}).then(r=>r.ok?r.json():null).then(r=>{if(!abort.signal.aborted&&typeof r?.providerConfigured==='boolean')setProviderConfigured(r.providerConfigured);}).catch(()=>{});return()=>abort.abort();},[]);
 useEffect(()=>{request.current?.abort();requestId.current++;setTurns([]);setMessage('');setError('');setBusy(false);return()=>{requestId.current++;request.current?.abort();};},[user?.id]);
 async function ask(e,nextMessage,nextMode=mode){
  e?.preventDefault();const text=(nextMessage??message).trim();if(!user)return onLogin();if(busy||request.current||!text)return;
  const id=++requestId.current,controller=new AbortController();request.current=controller;setBusy(true);setError('');if(nextMessage)setMessage(text);if(nextMode!==mode)setMode(nextMode);
  const history=turns.flatMap(t=>[{role:'user',content:t.message},{role:'assistant',content:(t.report?t.answerUz.slice(0,700)+'\n'+reportContext(t.report):t.answerUz).slice(0,4000)}]).slice(-6),learning=turns.filter(t=>t.report).slice(-1).map(t=>t.report);
  const context={...(originView?{originView}:{}),...(selected?{focusView:selected.id}:{}),...(learning.length?{learning}:{})};
  try{const result=await assistantApi({mode:nextMode,message:text,view:currentView,...context,history},controller.signal);if(id!==requestId.current)return;setTurns(t=>[...t,{...result,id,message:text,mode:nextMode}].slice(-12));setMessage('');}
  catch(e){if(id===requestId.current&&e.name!=='AbortError')setError(e.message);}
  finally{if(id===requestId.current){setBusy(false);request.current=null;}}
 }
 function cancel(){requestId.current++;request.current?.abort();request.current=null;setBusy(false);}
 function keyDown(e){if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent?.isComposing&&!e.isComposing&&e.keyCode!==229){e.preventDefault();e.currentTarget.form?.requestSubmit();}}
 const robotMood=error?'error':busy?'thinking':turns.length?'happy':'idle';
 const Container=compact?'div':'main',Heading=compact?'h2':'h1';
 const matches=features.filter(f=>(f.title+' '+f.description).toLocaleLowerCase('uz').includes(query.toLocaleLowerCase('uz')));
 return <Container className={'sp-page sp-guide'+(compact?' sp-help-panel':'')}><div className="sp-eyebrow"><Sparkles size={14}/> SINFQUIZ AI YORDAMCHI</div><header className="sp-page-head"><div><Heading>{compact?'Yordam':'Qayerdan boshlaymiz?'}</Heading><p>Savol bering, tushunmagan joyingizni ayting yoki bilimni tekshirishdan boshlang. Birga sizga mos yo‘lni tanlaymiz.</p></div><div className="sp-guide-robot"><RobotAssistant size="hero" mood={robotMood}/><p><strong>SQ robot · AI ustoz</strong>{busy?'Savolingiz ustida ishlayapman…':'Salom! Bugun nimani o‘rganamiz?'}</p></div></header>
 <p className="sp-current-page"><span>Hozirgi sahifa: <strong>{page?.title||'SinfQuiz'}</strong></span>{originView&&originView!==currentView&&assistantPage(originView,user?.role)&&<span>Bu yerga {assistantPage(originView,user?.role).title} sahifasidan keldingiz.</span>}</p>
 <div className="sp-guide-layout"><section className="sp-card sp-guide-index"><label className="sp-field">Bo‘limni topish<input type="search" placeholder="Masalan: biologiya, speaking…" value={query} onChange={e=>setQuery(e.target.value)}/></label><nav aria-label="Qo‘llanma bo‘limlari">{matches.map(f=><button key={f.id} className={selected?.id===f.id?'is-current':''} aria-current={selected?.id===f.id?'true':undefined} onClick={()=>setSelectedId(f.id)}><span>{f.title}</span><ArrowRight size={16}/></button>)}{!matches.length&&<p>Bo‘lim topilmadi. Qidiruv so‘zini qisqartiring.</p>}</nav></section>
 <div className="sp-stack">
 <section className="sp-card sp-ai-box"><h2><Sparkles size={20}/> AI bilan birga o‘rganing</h2>{!compact&&<div className="sp-assistant-modes" role="group" aria-label="AI yordamchi vazifasi">{modes.map(m=><button key={m.id} className={'sp-btn'+(mode===m.id?' sp-primary':'')} aria-pressed={mode===m.id} disabled={busy} onClick={()=>{setMode(m.id);setError('');}}><m.icon size={16}/>{m.title}</button>)}</div>}<p>{activeMode.description}</p>
 {!user&&<Notice>Shaxsiy AI yordamchi uchun hisobga kiring. Bo‘limlar qo‘llanmasi hozir ochiq.</Notice>}{providerConfigured===false&&<Notice>AI xizmati hali administrator tomonidan sozlanmagan. Hozirgi sahifangizni aniqlash va bo‘limlar qo‘llanmasi ishlaydi.</Notice>}
 <div className="sp-assistant-suggestions" aria-label="Savol namunalari">{suggestions[mode].map(s=><button key={s} className="sp-btn sp-quiet" disabled={busy} onClick={()=>setMessage(s)}>{s}<ArrowRight size={13}/></button>)}</div>
 <div className="sp-guide-conversation" aria-live="polite" aria-relevant="additions">{turns.map(t=><article key={t.id}><p className="sp-user-question"><MessageCircle size={15}/> {t.message}</p><div className="sp-robot-reply"><RobotAssistant size="mini" mood="happy"/><div className="sp-ai-answer sp-ai-markdown"><Markdown remarkPlugins={[remarkGfm]} skipHtml disallowedElements={['img']} components={replyComponents}>{t.answerUz}</Markdown></div></div>{t.questions.length>0&&(t.quizType==='diagnostic'?<DiagnosticQuiz key={t.id} questions={t.questions} subjectUz={t.subjectUz} topicUz={t.topicUz} busy={busy} onComplete={report=>setTurns(old=>old.map(turn=>turn.id===t.id?{...turn,report}:turn))} onFollowup={text=>ask(null,text,'mentor')}/>:<AssistantQuiz key={t.id} questions={t.questions}/>)}<div className="sp-actions">{t.routeIds.filter(id=>features.some(f=>f.id===id)).map(id=><button className="sp-btn" key={id} onClick={()=>onNavigate(id)}>{features.find(f=>f.id===id).title}<ArrowRight size={15}/></button>)}</div></article>)}</div>
 <form onSubmit={ask} aria-busy={busy}><label className="sp-field">Savolingiz<textarea maxLength={1500} rows={3} value={message} disabled={busy} onKeyDown={keyDown} onChange={e=>setMessage(e.target.value)} placeholder={mode==='guide'?'Dasturdan foydalanish haqida so‘rang…':mode==='tutor'?'Qaysi mavzuni tushuntirib beray?':mode==='mentor'?'Masalan: qayerdaman, buni tushunmadim yoki bilimimni tekshiring…':'Fan va mavzuni yozing…'} required={!!user}/></label><span className="sp-robot-key-hint">Enter — yuborish. Shift+Enter — yangi qator.</span><div className="sp-assistant-submit"><span className="sp-note">{message.length} / 1500</span><button className="sp-btn sp-primary" disabled={busy||(!message.trim()&&!!user)}>{busy?<><LoaderCircle className="sp-spinner" size={16}/>AI javob tayyorlamoqda…</>:<>{user?'Yordamchidan so‘rash':'Hisobga kirish'}<Send size={16}/></>}</button>{busy&&<button type="button" className="sp-btn sp-quiet" onClick={cancel}><X size={15}/>Bekor qilish</button>}</div></form>{error&&<Notice error>{error} Savolingiz shu yerda saqlandi; qayta yuborishingiz mumkin.</Notice>}
 <p className="sp-note"><CheckCircle2 size={14}/> Savolingiz, suhbatning oxirgi javoblari va shu suhbatdagi mini-test natijalari AI ustozga yuboriladi. Suhbat faqat shu sahifada saqlanadi. Ovoz va Speaking javoblaringiz yuborilmaydi.</p></section>{selected&&<section className="sp-card sp-tour"><span className="sp-pill">Qo‘llanma · tekshirilgan qadamlar</span><h2>{selected.title}</h2><p>{selected.description}</p><ol className="sp-steps">{selected.steps.map((s,i)=><li key={s}><span>{i+1}</span><p>{s}</p></li>)}</ol><button className="sp-btn sp-primary" onClick={()=>onNavigate(selected.id)}>{selected.title}ni ochish <ArrowRight size={17}/></button></section>}</div></div></Container>;
}

export function AssistantQuiz({questions}){
 const [choices,setChoices]=useState({}),answered=Object.keys(choices).length,correct=questions.filter((q,i)=>choices[i]===q.correctIndex).length;
 return <section className="sp-assistant-quiz" aria-label="AI mashq savollari"><p className="sp-note">Javobni tanlang — keyin to‘g‘ri javob va izoh ochiladi. Bu mashq natijasi.</p>{questions.map((q,i)=><fieldset key={i}><legend>{i+1}. {q.question}</legend><div className="sp-assistant-options">{q.options.map((option,index)=><button type="button" key={index} className={'sp-btn'+(choices[i]===index?' is-picked':'')+(choices[i]!==undefined&&q.correctIndex===index?' is-correct':'')} aria-pressed={choices[i]===index} disabled={choices[i]!==undefined} onClick={()=>setChoices(c=>({...c,[i]:index}))}><span>{String.fromCharCode(65+index)}.</span>{option}</button>)}</div>{choices[i]!==undefined&&<div className="sp-assistant-feedback" role="status"><b>{choices[i]===q.correctIndex?'To‘g‘ri javob.':'To‘g‘ri javob: '+String.fromCharCode(65+q.correctIndex)+'. '+q.options[q.correctIndex]}</b><p>{q.explanationUz}</p></div>}</fieldset>)}{answered===questions.length&&<p className="sp-assistant-score" role="status">Mashq yakuni: {correct} / {questions.length} ta to‘g‘ri javob.</p>}</section>;
}


export {default as GuideWelcome} from './GuideWelcome.jsx';
