import React,{useEffect,useRef,useState} from 'react';
import {Mic,Sparkles,ArrowRight,ShieldCheck,Clock3,BookOpen,Check,Settings2,Target,CalendarDays,Headphones,FileText} from 'lucide-react';
import {speakingApi,newToken,categoryNames,taskNames} from './client.js';
import Recorder from './Recorder.jsx';
import MockRoom from './MockRoom.jsx';
import {JobPanel,Notice,Empty} from './Common.jsx';
import {Report,Practice,Vocabulary,Progress,SpeakingSettings,ErrorBank,Roadmap} from './SpeakingPanels.jsx';
import {speakingCopy as copy} from './copy.js';
import './speaking.css';
const tabs=[['today','Bugungi reja'],['roadmap','Shaxsiy yo‘l'],['report','Hisobot'],['practice','Mashq'],['words','Iboralar'],['errors','Xatolarim'],['progress','O‘sish'],['settings','Tarix va sozlamalar']];
export default function SpeakingHub({user,onLogin,onNavigate,onActive}){
 const [exam,setExam]=useState('ielts'),[home,setHome]=useState(null),[tab,setTab]=useState('today'),[loading,setLoading]=useState(!!user),[error,setError]=useState(''),[session,setSession]=useState(null),[job,setJob]=useState(null),[reportId,setReportId]=useState(null),[editing,setEditing]=useState(false),[micTest,setMicTest]=useState(false),[checkMode,setCheckMode]=useState(false),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[publicStatus,setPublicStatus]=useState(null);
 const token=useRef(newToken()),mounted=useRef(true),homeRequest=useRef(null),homeVersion=useRef(0);
 const startRequest=useRef(null);
 async function refresh(){if(!user)return;homeRequest.current?.abort();const controller=new AbortController(),version=++homeVersion.current;homeRequest.current=controller;setError('');try{const r=await speakingApi('home',{examMode:exam},controller.signal);if(mounted.current&&version===homeVersion.current)setHome(r);return r;}catch(e){if(mounted.current&&version===homeVersion.current&&e.name!=='AbortError')setError(e.message);}finally{if(mounted.current&&version===homeVersion.current)setLoading(false);}}
 useEffect(()=>{mounted.current=true;token.current=newToken();setBusy(false);setConsent(false);setMicTest(false);setHome(null);setLoading(!!user);setSession(null);setReportId(null);refresh();return()=>{mounted.current=false;homeVersion.current++;homeRequest.current?.abort();startRequest.current?.abort();startRequest.current=null;onActive?.(false);};},[user?.id,exam]);
 useEffect(()=>{const abort=new AbortController();fetch('/api/ai-speaking',{signal:abort.signal}).then(r=>r.ok?r.json():null).then(setPublicStatus).catch(()=>{});return()=>abort.abort();},[]);
 useEffect(()=>{if(!user||!home?.jobs.some(j=>['queued','running'].includes(j.status)))return;const t=setInterval(()=>{if(!document.hidden)refresh();},30000);return()=>clearInterval(t);},[home?.jobs,user?.id,exam]);
 async function start(id){if(!user)return onLogin();if(startRequest.current)return;const request=new AbortController();startRequest.current=request;setBusy(true);setError('');try{const r=id?await speakingApi('session',{id},request.signal):await speakingApi(checkMode?'start_check':'start_mock',{examMode:exam,token:token.current,consent,examRoom:!checkMode},request.signal);if(startRequest.current!==request)return;setSession(r);setMicTest(false);setJob(null);}catch(e){if(startRequest.current===request&&e.name!=='AbortError')setError(e.message);}finally{if(startRequest.current===request){startRequest.current=null;setBusy(false);}}}
 async function prepareNew(){
  if(active&&!window.confirm('Boshlangan sinov tarixda saqlanadi. Boshqa savollar bilan yangi sinov ochilsinmi?'))return;
  setBusy(true);setError('');
  try{if(active)await speakingApi('cancel_session',{id:active.id});token.current=newToken();setConsent(false);setCheckMode(false);setMicTest(true);if(active)await refresh();}
  catch(e){setError(e.message)}finally{setBusy(false)}
 }
 function showReport(id){setReportId(id);setTab('report');setSession(null);refresh();}
 async function replan(){setBusy(true);setError('');try{const r=await speakingApi('replan',{examMode:exam});setJob(r.job);}catch(e){setError(e.message);}finally{setBusy(false);}}
 const latest=home?.assessments?.[0],active=home?.sessions.find(s=>s.status==='started'),pending=home?.jobs.filter(j=>j.kind!=='guide'&&['queued','running','failed'].includes(j.status))||[];
 if(session)return <MockRoom key={session.session.id} initial={session} user={user} exam={exam} onActive={onActive} onExit={()=>{setSession(null);onActive?.(false);refresh();}} onRestart={()=>{setSession(null);setConsent(false);token.current=newToken();setMicTest(true);onActive?.(false);refresh();}} onReport={showReport}/>;
 return <main className="sp-page sp-speaking-page sp-entry"><div className="sp-eyebrow"><Mic size={14}/> AI SPEAKING · OVOZLI MASHQ</div><header className="sp-page-head"><div><h1>{copy.title}</h1><p>{copy.description}</p></div><button className="sp-btn" onClick={()=>onNavigate('aiGuide')}><Sparkles size={16}/>Qanday ishlatiladi?</button></header>
 <div className="sp-exam-switch" role="group" aria-label="Speaking yo‘nalishi">{[['ielts','IELTS Speaking'],['multilevel','Multilevel Speaking']].map(([id,label])=><button className={exam===id?'is-current':''} aria-pressed={exam===id} key={id} onClick={()=>{setExam(id);setTab('today');setJob(null);setEditing(false);}}>{label}</button>)}</div>
 {!user?<><SpeakingIntro exam={exam} onStart={onLogin}/><section className="sp-card sp-intro-footer"><ShieldCheck size={24}/><div><h2>Yozuvlaringiz faqat hisobingizda ochiladi.</h2><p>Audio yopiq saqlanadi. Tahlil uchun audio va javob matni Groq xizmatiga yuboriladi. Standart audio saqlash muddati 30 kun; o‘zingiz ham o‘chirishingiz mumkin.</p></div></section></>:<>
 {loading&&<Notice>Shaxsiy Speaking ma’lumotlari yuklanmoqda…</Notice>}{error&&<Notice error>{error}<button className="sp-btn" onClick={refresh}>Qayta yuklash</button></Notice>}
 {home?.providerConfigured===false&&<Notice>AI xizmati hali administrator tomonidan sozlanmagan. Maqsad va yozuvlaringiz saqlanadi; tahlilni xizmat yoqilgach yuborishingiz mumkin.</Notice>}
 {home&&(!home.profile||editing)?<ProfileForm key={exam} exam={exam} current={home.profile?.payload} onCancel={home.profile?()=>setEditing(false):null} onSaved={async()=>{token.current=newToken();setConsent(false);setEditing(false);setMicTest(true);await refresh();}}/>:home&&<>
 <nav className="sp-tabs" aria-label="AI Speaking sahifalari">{tabs.map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} className={tab===id?'is-current':''} onClick={()=>setTab(id)}>{label}</button>)}</nav>
 {job&&<JobPanel job={job} onComplete={async j=>{if(['assess','practice'].includes(j.kind))showReport(j.result_id);else await refresh();}}/>}
 {pending.filter(j=>j.id!==job?.id).slice(0,3).map(j=><JobPanel key={j.id} job={j} onComplete={async result=>{await refresh();if(['assess','practice'].includes(result.kind))setReportId(result.result_id);}}/>)}
 {tab==='today'&&<>
 <section className="sp-dashboard-hero"><div><span className="sp-pill"><CalendarDays size={14}/>{home.localDate} · {home.profile.payload.minutes} daqiqa</span><h2>{!home.baseline?'Avval o‘zingizni eshiting.':home.today?'Bugungi mashqlaringiz':'Keyingi mashqni tanlang.'}</h2><p>{!home.baseline?'Boshlang‘ich sinov sizning haqiqiy javoblaringizdan kuchli va rivojlantirish kerak bo‘lgan jihatlarni topadi. Hozircha daraja yoki shaxsiy reja taxmin qilinmaydi.':home.roadmap?.payload.adaptationUz||'Tahlilingiz saqlandi. Shaxsiy reja tayyor bo‘lishini kuting yoki qayta yarating.'}</p><div className="sp-actions">{active?<button className="sp-btn sp-primary" disabled={busy} onClick={()=>start(active.id)}>Sinovni davom ettirish <ArrowRight size={17}/></button>:<button className="sp-btn sp-primary" onClick={prepareNew}><Mic size={17}/>{home.baseline?'Yangi to‘liq sinov':copy.start}</button>}{active&&<button className="sp-btn" disabled={busy} onClick={prepareNew}>Yangi savollar bilan sinov <ArrowRight size={17}/></button>}{home.baseline&&!active&&<button className="sp-btn" onClick={()=>{token.current=newToken();setConsent(false);setCheckMode(true);setMicTest(true);}}>Haftalik mini-tekshiruv <ArrowRight size={16}/></button>}{latest&&<button className="sp-btn" onClick={()=>showReport(latest.id)}>So‘nggi hisobot <FileText size={16}/></button>}</div></div><ExamOverview exam={exam}/></section>
 {micTest&&<section className="sp-card"><div className="sp-card-heading"><h2><Headphones size={20}/> {checkMode?'Mini-tekshiruv oldidan mikrofon':'Mikrofonni tekshiring'}</h2><button className="sp-btn sp-quiet" onClick={()=>setMicTest(false)}>Yopish</button></div><div className="sp-exam-ready"><p>{checkMode?'Uch savolga ovozli javob berasiz.':'Savol mikrofon ochilgach chiqadi. Ajratilgan vaqt tugaganda yozuv saqlanadi va yuboriladi. Tahlil sinov oxirida ochiladi.'}</p></div><Recorder key={'test:'+user.id} draftKey={user.id+':mic-test'} limit={10} test onActive={onActive}/><label className="sp-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>Javoblarim audio shaklida yopiq saqlanishi va Groq orqali transkripsiya hamda AI tahlili qilinishiga roziman. Audio odatda 30 kun saqlanadi.</span></label><button className="sp-btn sp-primary" disabled={!consent||busy} onClick={()=>start()}>{busy?'Ochilmoqda…':checkMode?'3 ta yangi savolda mini-tekshiruv':home.baseline?'Yangi variantni boshlash':'Boshlang‘ich sinovni boshlash'}<ArrowRight size={17}/></button><p className="sp-note">Texnik sinov natija hisoblanmaydi. Sinovda namuna, tuzatish va kalit so‘zlar yakunigacha ochilmaydi.</p></section>}
 {home.baseline?<DailyPlan day={home.today} nextDay={home.nextDay} onReload={refresh} onJob={setJob} onPractice={()=>setTab('practice')} onWords={()=>setTab('words')} onReplan={replan}/>:null}
 {home.roadmap&&<div className="sp-grid-three"><section className="sp-card"><Target size={21}/><small>MAQSAD</small><h3>{exam==='ielts'?'IELTS ':'Multilevel '}{home.profile.payload.goal}</h3><p>Bu siz tanlagan maqsad, hozirgi natijangiz emas.</p></section><section className="sp-card"><Clock3 size={21}/><small>KEYINGI TO‘LIQ SINOV</small><h3>{home.roadmap.payload.nextFullMockDate}</h3><p>Yangi savollar va mustaqil javoblar bilan.</p><p className="sp-note">Mini-tekshiruv: {home.roadmap.payload.nextMiniCheckDate}</p></section><section className="sp-card"><BookOpen size={21}/><small>SHU HAFTA</small><h3>{home.roadmap.payload.focus.map(f=>categoryNames[f.category]).join(' · ')}</h3><p>{home.roadmap.payload.reason}</p></section></div>}
 </>}
 {tab==='roadmap'&&<Roadmap home={home} onReplan={replan} busy={busy}/>}
 {tab==='report'&&<Report id={reportId||latest?.id} home={home} onChoose={setReportId} onJob={setJob} onPractice={a=>{setReportId(a);setTab('practice');}}/>}
 {tab==='practice'&&<Practice key={exam} user={user} home={home} onActive={onActive} onJob={setJob} onReport={showReport}/>}
 {tab==='words'&&<Vocabulary home={home} onReload={refresh} onJob={setJob} onPractice={()=>setTab('practice')}/>}
 {tab==='errors'&&<ErrorBank home={home} onPractice={()=>setTab('practice')}/>}
 {tab==='progress'&&<Progress home={home}/>}
 {tab==='settings'&&<SpeakingSettings user={user} home={home} onEdit={()=>setEditing(true)} onReload={refresh} onResume={start} onReport={showReport}/>}
 </>}
 </>}
 <footer className="sp-footnote">Original mashq savollari · IELTS / UZBMB tomonidan berilgan rasmiy imtihon yoki sertifikat emas. {publicStatus?.sources&&<details><summary>Format manbalari</summary>{Object.values(publicStatus.sources).map((s,i)=>s?.url?<p key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.title||s.url}</a></p>:null)}</details>}</footer>
 </main>;
}
function ExamOverview({exam}) {
 const ielts = exam === 'ielts';
 return <section className="sp-exam-overview" aria-label="Sinov qismlari">
  <h3>{ielts ? 'IELTS · 3 qism' : 'Multilevel · 4 qism'}</h3>
  <ol>{(ielts ? [
   'Kundalik mavzuda qisqa suhbat',
   'Mavzu kartasi · 1 daqiqa tayyorgarlik, 2 daqiqagacha javob',
   'Mavzu bo‘yicha kengroq muhokama',
  ] : [
   '1.1 · Tanish mavzuda savollar',
   '1.2 · Rasmlarni taqqoslash',
   '2 · Uch savolga bitta kengaytirilgan javob',
   '3 · Fikrning ikki tomonini tahlil qilish',
  ]).map(part => <li key={part}>{part}</li>)}</ol>
 </section>;
}

function SpeakingIntro({exam,onStart,onPractice}) {
 return <section className="sp-intro">
  <div className="sp-intro-copy">
   <span className="sp-eyebrow">VAQTLI OVOZLI SINOV</span>
   <h2>Speaking imtihoniga tayyorlaning.</h2>
   <p>Mikrofonni tekshiring va savollarga ajratilgan vaqtda inglizcha javob bering. Tahlil sinov tugagach ochiladi.</p>
   <div className="sp-actions">
    <button className="sp-btn sp-primary" onClick={onStart}>{copy.start} <ArrowRight size={18}/></button>
    <button className="sp-btn" disabled={!onPractice} onClick={onPractice} aria-describedby="sp-practice-requirement">{copy.practice}</button>
   </div>
   {!onPractice && <p id="sp-practice-requirement" className="sp-note">Alohida mashqlar boshlang‘ich sinov tahlilidan keyin ochiladi.</p>}
  </div>
  <ExamOverview exam={exam}/>
 </section>;
}
function ProfileForm({exam,current,onSaved,onCancel}){
 const [p,setP]=useState(current||{examMode:exam,goal:exam==='ielts'?'6.5':'B2',minutes:20,studyDays:[1,2,3,4,5],timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Tashkent',deadline:'',interests:[]}),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const change=(k,v)=>setP(p=>({...p,[k]:v}));async function save(e){e.preventDefault();setBusy(true);setError('');try{await speakingApi('profile',{examMode:exam,profile:{...p,examMode:exam}});await onSaved();}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <form className="sp-card sp-profile-form" onSubmit={save}><span className="sp-pill"><Settings2 size={14}/> 1-qadam · sizning jadvalingiz</span><h2>Maqsadni siz belgilaysiz.</h2><p>Hozirgi darajangiz boshlang‘ich sinovdan keyin tekshiriladi. Maqsadga erishish muddati kafolatlanmaydi.</p><div className="sp-form-grid"><label className="sp-field">Maqsad<select value={p.goal} onChange={e=>change('goal',e.target.value)}>{(exam==='ielts'?['4','4.5','5','5.5','6','6.5','7','7.5','8','8.5','9']:['A2','B1','B2','C1']).map(v=><option key={v}>{v}</option>)}</select></label><label className="sp-field">Kunlik vaqt<select value={p.minutes} onChange={e=>change('minutes',Number(e.target.value))}>{[20,40,60].map(v=><option value={v} key={v}>{v} daqiqa</option>)}</select></label><label className="sp-field">Imtihon sanasi (ixtiyoriy)<input type="date" value={p.deadline||''} onChange={e=>change('deadline',e.target.value)}/></label><label className="sp-field">Vaqt zonasi<input required maxLength={80} value={p.timezone} onChange={e=>change('timezone',e.target.value)} placeholder="Asia/Tashkent"/></label></div><fieldset className="sp-days"><legend>Qaysi kunlari o‘qiysiz?</legend>{[['Du',1],['Se',2],['Ch',3],['Pa',4],['Ju',5],['Sh',6],['Ya',0]].map(([label,id])=><label key={id}><input type="checkbox" checked={p.studyDays.includes(id)} onChange={e=>change('studyDays',e.target.checked?[...p.studyDays,id]:p.studyDays.filter(x=>x!==id))}/><span>{label}</span></label>)}</fieldset><label className="sp-field">Qiziqishlaringiz (vergul bilan, ixtiyoriy)<input maxLength={200} value={p.interests.join(', ')} onChange={e=>change('interests',e.target.value.split(',').map(s=>s.trim()).slice(0,8))} placeholder="texnologiya, sayohat, sport"/></label>{error&&<Notice error>{error}</Notice>}<div className="sp-actions"><button className="sp-btn sp-primary" disabled={busy}>{busy?'Saqlanmoqda…':'Jadvalni saqlash'}<Check size={17}/></button>{onCancel&&<button type="button" className="sp-btn" onClick={onCancel}>Bekor qilish</button>}</div></form>;
}
function DailyPlan({day,nextDay,onReload,onJob,onPractice,onWords,onReplan}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);async function action(type,data){setBusy(true);setError('');try{const r=await speakingApi(type,data);if(r.job)onJob(r.job);await onReload();}catch(e){setError(e.message);}finally{setBusy(false);}}
 if(!day)return <Empty title={nextDay?'Keyingi mashg‘ulot: '+nextDay.payload.date:'Shaxsiy reja tayyorlanmoqda'} action={nextDay?'Yangi savolda mashq qilish':'Rejani yaratish / yangilash'} onAction={nextDay?onPractice:onReplan}>{nextDay?'Bugun jadvalingizda dam olish kuni. Oldingi iboralarni takrorlash yoki mustaqil mashq qilishingiz mumkin.':'Boshlang‘ich tahlil saqlangan bo‘lsa, javoblaringizga mos reja yaratiladi.'}</Empty>;
 return <section className="sp-card"><div className="sp-card-heading"><div><span className="sp-eyebrow">BUGUNGI REJA</span><h2>{day.payload.topic}</h2></div><span className="sp-pill">{day.payload.completedTaskIds.length} / 5 bajarildi</span></div><p>{day.payload.whyUz}</p>{error&&<Notice error>{error}</Notice>}<div className="sp-task-list">{day.payload.tasks.map(t=><details key={t.id} className={day.payload.completedTaskIds.includes(t.id)?'is-done':''}><summary><span>{day.payload.completedTaskIds.includes(t.id)?<Check size={18}/>:<Clock3 size={18}/>}</span><strong>{taskNames[t.kind]}</strong><small>{t.minutes} daqiqa</small></summary><div><p>{t.instructionsUz}</p><ol lang="en">{t.promptsEn.map((s,i)=><li key={i}>{s}</li>)}</ol><p><b>Bajarilish mezoni:</b> {t.successUz}</p><div className="sp-actions">{t.kind==='vocabulary'&&<button className="sp-btn" onClick={onWords}>Iboralarni ochish</button>}{['speaking','reflection'].includes(t.kind)&&<button className="sp-btn" onClick={onPractice}>Ovozli javob berish</button>}{!day.payload.completedTaskIds.includes(t.id)&&<button className="sp-btn sp-primary" disabled={busy} onClick={()=>action('task_done',{id:day.id,taskId:t.id})}><Check size={16}/>Mashqni bajardim</button>}</div></div></details>)}</div><p className="sp-note">“Bajardim” belgisi o‘quv qaydi. Faol o‘zlashtirish yangi mustaqil audio javobdagi dalil bilan tekshiriladi.</p></section>;
}
