import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Clock3,Download,Flag,ShieldCheck} from 'lucide-react';
import {iq} from './iq/service.js';
import {domains,bands,resultNote,scorePractice,formatTime} from './iq/model.js';
import {practiceItems} from './iq/practice.js';
import {ItemVisual,ChoiceVisual} from './iq/Item.jsx';
import './learning-hub.css';
import './iq/exam.css';
const draftKey=(uid,id)=>`sq-iq-pending:${uid}:${id}`;
const flagKey=(uid,id)=>`sq-iq-review:${uid}:${id}`;

function hasOriginalTestItem(item) {
 return /^iq-1-[0-2]-/.test(item?.id || '');
}

function examPrompt(item) {
 if (!hasOriginalTestItem(item)) return item.prompt;
 switch (item.visual?.kind) {
  case 'matrix': return 'Kataklar orasidagi bog‘lanishni toping. Bo‘sh katakka qaysi variant mos?';
  case 'sequence': return 'Ketma-ketlikdagi bo‘sh o‘ringa mos sonni tanlang.';
  case 'arrows': return 'Ketma-ketlikni davom ettiradigan strelkani tanlang.';
  default: return item.prompt;
 }
}
function download(result,run){const text=`SinfQuiz — IQ va mantiq mashqlari\n${resultNote}\n\nBosqich: ${bands[run.band||0]}\nRejim: ${run.mode==='practice'?'Vaqtsiz mashq':run.mode==='extended'?'48 daqiqa':'24 daqiqa'}\nNatija: ${result.correct}/${result.total} (${result.percent}%)\nJavob berilgan: ${result.answered}\n\n${result.profile.map(x=>`${domains[x.domain].title}: ${x.correct}/${x.total}`).join('\n')}\n`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='sinfquiz-mantiq-natija.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export default function IQHub({user,onBack,onActive=()=>{}}){
 const [home,setHome]=useState(null),[run,setRun]=useState(null),[cursor,setCursor]=useState(0),[band,setBand]=useState(0),[mode,setMode]=useState('timed'),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[pending,setPending]=useState(null),[storageNote,setStorageNote]=useState(''),[finishOpen,setFinishOpen]=useState(false),[now,setNow]=useState(Date.now()),[staff,setStaff]=useState(null),[review,setReview]=useState(false),[practiceFeedback,setPracticeFeedback]=useState(false);
 const working=useRef(false),offset=useRef(0),autoFinishing=useRef(false),root=useRef(null),resuming=useRef(sessionStorage.getItem('sq_active_hash')==='#iq');
 const [flags,setFlags]=useState([]);
 const questionTitle=useRef(null);
 const active=run?.status==='started',practice=run?.mode==='practice';
 const load=async()=>{const h=await iq('home');setHome(h);return h};
 useEffect(()=>{let alive=true;load().then(h=>{if(alive&&resuming.current&&h.open)open(h.open)}).catch(e=>alive&&setError(e.message)).finally(()=>alive&&setLoading(false));return()=>{alive=false}},[user.id]);
 useEffect(()=>{onActive(!!active||loading&&resuming.current);return()=>onActive(false)},[active,loading]);
 useEffect(()=>{if(!finishOpen)return;const dialog=root.current?.querySelector('[role=alertdialog]'),before=document.activeElement;
  const background=[...root.current.children].filter(el=>!el.classList.contains('learning-dialog-overlay'));
  background.forEach(el=>el.inert=true);
  const trap=e=>{if(e.key==='Escape'&&!working.current){e.preventDefault();setFinishOpen(false)}if(e.key==='Tab'){const buttons=[...dialog.querySelectorAll('button:not(:disabled)')];if(!buttons.length){e.preventDefault();return}const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};dialog?.addEventListener('keydown',trap);dialog?.querySelector('button')?.focus();return()=>{background.forEach(el=>el.inert=false);dialog?.removeEventListener('keydown',trap);before?.focus?.()};
 },[finishOpen]);
 useEffect(()=>{if(!active||practice)return;const tick=()=>{if(!document.hidden)setNow(Date.now())};const timer=setInterval(tick,1000);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',tick)}},[active,practice]);
 const accept=r=>{
  offset.current=r.serverNow?new Date(r.serverNow).getTime()-Date.now():0;
  setNow(Date.now());
  setRun(r);
  setPracticeFeedback(false);
  autoFinishing.current=false;
  if(r.status==='finished'){
   setFinishOpen(false);
   setFlags([]);
   try{localStorage.removeItem(flagKey(user.id,r.id))}catch{}
  }
 };
 const task=async fn=>{if(working.current)return;working.current=true;setBusy(true);setError('');try{await fn()}catch(e){setError(e.message)}finally{working.current=false;setBusy(false)}};
 const readDraft=r=>{try{const d=JSON.parse(localStorage.getItem(draftKey(user.id,r.id)));if(d&&d.id===r.id&&Number.isInteger(d.expectedRevision)&&typeof d.questionId==='string'&&typeof d.token==='string'){setPending(d);return}}catch{}setPending(null)};
 const open=r=>{
  accept(r);
  setCursor(0);
  setReview(false);
  if(r.status==='started')readDraft(r);
  else clearDraft(r.id);
  let marked=[];
  try{
   const saved=JSON.parse(localStorage.getItem(flagKey(user.id,r.id)));
   if(r.status==='started'&&Array.isArray(saved))marked=r.items.filter(item=>saved.includes(item.id)).map(item=>item.id);
  }catch{}
  setFlags(marked);
  window.scrollTo({top:0,behavior:'instant'});
 };
 const resume=()=>task(async()=>open(await iq('run',{id:home.open.id})));
 const begin=()=>task(async()=>open(await iq('start',{band,mode})));
 const beginPractice=()=>{setError('');setPending(null);setReview(false);setFlags([]);setCursor(0);accept({id:'practice',band:0,mode:'practice',status:'started',items:practiceItems,answers:{},revision:0})};
 const persist=p=>{setPending(p);try{localStorage.setItem(draftKey(user.id,p.id),JSON.stringify(p));setStorageNote('')}catch{setStorageNote('Brauzer xotirasi yopiq. Sahifani yangilamang; javobni qayta yuboring.')}};
 const clearDraft=id=>{setPending(null);try{localStorage.removeItem(draftKey(user.id,id))}catch{}};
 const send=p=>task(async()=>{const r=await iq('answer',p);clearDraft(p.id);accept(r)});
 const choose=choice=>{
  if(busy||pending||left<=0)return;
  if(practice){setRun(r=>({...r,answers:{...r.answers,[r.items[cursor].id]:choice}}));setPracticeFeedback(false);return}
  const p={id:run.id,questionId:run.items[cursor].id,choice,expectedRevision:run.revision,token:crypto.randomUUID()};persist(p);send(p);
 };
 const refresh=()=>task(async()=>{const r=await iq('run',{id:run.id});clearDraft(run.id);accept(r)});
 const finish=()=>task(async()=>{
  if(practice){setRun(r=>({...r,status:'finished',result:scorePractice(r.items,r.answers)}));setFinishOpen(false);return}
  const r=await iq('finish',{id:run.id,expectedRevision:run.revision,token:crypto.randomUUID()});clearDraft(run.id);accept(r);setFinishOpen(false);await load();
 });
 const left=run?.deadline?Math.ceil((new Date(run.deadline).getTime()-now-offset.current)/1000):Infinity;
 useEffect(()=>{if(active&&!practice&&left<=0&&!busy&&!autoFinishing.current){autoFinishing.current=true;task(async()=>{const r=await iq('run',{id:run.id});clearDraft(run.id);accept(r);await load()})}},[active,practice,left,busy]);
 const go=n=>{setCursor(n);setPracticeFeedback(false);root.current?.focus();window.scrollTo({top:0,behavior:'instant'})};
 const leaveResult=()=>{setRun(null);setReview(false);setCursor(0);load().catch(e=>setError(e.message))};
 const current=run?.items[cursor],selected=pending&&current&&pending.questionId===current.id?pending.choice:run?.answers[current?.id],answered=run?.items.filter(x=>Number.isInteger(run.answers[x.id])).length||0;
 const analysis=run?.status==='finished';
 const timed=active&&!practice;
 const missing=run?.items.flatMap((item,index)=>Number.isInteger(run.answers[item.id])?[]:[index])||[];
 const marked=run?.items.flatMap((item,index)=>flags.includes(item.id)?[index]:[])||[];
 useEffect(()=>{if(active)questionTitle.current?.focus({preventScroll:true})},[run?.id,cursor]);
 function toggleFlag(){
  const next=flags.includes(current.id)?flags.filter(id=>id!==current.id):[...flags,current.id];
  setFlags(next);
  try{localStorage.setItem(flagKey(user.id,run.id),JSON.stringify(next))}catch{}
 }
 return <main className="sq-learning iq-hub" ref={root} tabIndex="-1" data-exam={timed || undefined}>
 <header className="learning-top">
  <button type="button" onClick={run ? analysis ? leaveResult : () => setFinishOpen(true) : onBack}>
   <ArrowLeft size={18}/>{run ? analysis ? 'Testlar oynasi' : 'Testni yakunlash' : 'Bosh sahifa'}
  </button>
  <span className="learning-kicker">{timed ? 'MANTIQIY FIKRLASH SINOVI' : 'SINFQUIZ / IQ VA MANTIQ'}</span>
  {timed ? <span className="iq-timer" role="timer" aria-label="Qolgan vaqt"><Clock3 size={17}/>{formatTime(left)}</span>
   : <span className="learning-status"><ShieldCheck size={16}/> Shaxsiy natija</span>}
 </header>
 {error&&<div className="learning-message error" role="alert"><p>{error}</p>{!run&&<button type="button" disabled={busy} onClick={()=>task(load)}>Ulanishni qayta tekshirish</button>}{active&&!practice&&!pending&&<button type="button" disabled={busy} onClick={refresh}>Serverdagi holatni tekshirish</button>}</div>}
 {!run?<><section className="iq-exam-intro">
  <div>
   <span className="learning-kicker">VAQTLI SINOV</span>
   <h1>Mantiqiy fikrlash sinovi</h1>
   <p>Sonli ketma-ketlik, shakl, mantiqiy xulosa va fazoviy fikrlash topshiriqlarini belgilangan vaqtda bajaring.</p>
  </div>
  <dl>
   <div><dt>Savollar</dt><dd>32 ta</dd></div>
   <div><dt>Yo‘nalishlar</dt><dd>4 ta</dd></div>
   <div><dt>Vaqt</dt><dd>24 yoki 48 daqiqa</dd></div>
  </dl>
 </section>
 <div className="iq-intro-grid"><section className="learning-card iq-start"><h2>Test shartlarini tanlang</h2><p>Sinf tavsiyasi yo‘l ko‘rsatadi. O‘zingizga mos tayyorgarlik bosqichini erkin tanlang.</p><label>Tayyorgarlik bosqichi<select value={band} onChange={e=>setBand(Number(e.target.value))}>{bands.map((b,i)=><option key={b} value={i}>{b}</option>)}</select></label><fieldset><legend>Vaqt rejimi</legend>{[['timed','24 daqiqa','Bir xil vaqt chegarasi bilan'],['extended','48 daqiqa','O‘qish yoki boshqarish uchun qo‘shimcha vaqt']].map(([m,title,desc])=><label className="iq-mode" key={m}><input type="radio" name="iq-time" value={m} checked={mode===m} onChange={()=>setMode(m)}/><span><b>{title}</b><small>{desc}</small></span></label>)}</fieldset><p className="learning-help">To‘g‘ri javob — 1 ball. Xato va bo‘sh javob — 0 ball. Tezlik uchun qo‘shimcha ball yo‘q. Muddat tugasa test yakunlanadi; yechimlar yakunda ochiladi.</p>{home?.open?<button className="learning-primary" disabled={busy} onClick={resume}>To‘xtagan testni davom ettirish <ArrowRight size={18}/></button>:<button className="learning-primary" disabled={busy||loading||!home?.ready||!home?.active} onClick={begin}>{busy?'Ochilyapti…':'32 savollik testni boshlash'}<ArrowRight size={18}/></button>}{home&&!home.ready&&<p role="status">Savollar banki hali o‘rnatilmagan. SQL 02–04 qismlarini bajaring. Namuna mashqlari ishlaydi.</p>}{home&&!home.active&&<p role="status">Test administrator tomonidan yopilgan. Namuna mashqlari ochiq.</p>}{loading&&<p role="status">Oldingi urinishlar tekshirilmoqda…</p>}<button type="button" className="iq-practice-link" onClick={beginPractice}>Avval namuna bilan mashq qilish <ArrowRight size={17}/></button></section><section className="learning-card"><h2>Nimani mashq qilasiz?</h2><div className="iq-domains">{Object.entries(domains).map(([id,d],i)=><article key={id}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{d.title}</h3><p>{d.description}</p></div></article>)}</div><details className="learning-details"><summary>IQ natijasi nimani anglatadi?</summary><p>{resultNote}</p><p>SinfQuiz original topshiriqlari umumiy fikrlash mashqlaridir. Yosh tanlovi savol murakkabligini tanlaydi; yosh me’yorlari o‘rnini bosmaydi. Ishonchlilik, mahalliy tilga moslik va me’yorlar alohida tadqiqotda tekshirilmaguncha IQ yoki aholiga nisbatan foiz chiqarilmaydi.</p><p>Test vaqti sahifa yangilanganda ham davom etadi. Qo‘shimcha vaqt rejimi alohida qayd etiladi. Mashqda esa vaqt chegarasi va IQ talqini yo‘q.</p></details></section></div>
 {home?.history.length>0&&<section className="learning-card"><h2>Mening urinishlarim</h2><div className="iq-history">{home.history.map(h=><button type="button" key={h.id} disabled={busy} onClick={()=>task(async()=>open(await iq('run',{id:h.id})))}><span><b>{bands[h.band].split(' · ')[0]}</b><small>{new Date(h.startedAt).toLocaleDateString('uz-UZ')} · {h.mode==='extended'?'48':'24'} daqiqa</small></span><strong>{h.result.correct}/{h.result.total}</strong><ArrowRight size={18}/></button>)}</div></section>}
 {['teacher','admin'].includes(user.role)&&<section className="learning-card"><h2>Ustoz uchun</h2><p>O‘qituvchiga faqat o‘z guruhlariga qo‘shilgan o‘quvchilar ko‘rinadi. Natijalar ommaviy reytingga chiqarilmaydi.</p><div className="learning-actions"><button disabled={busy} onClick={()=>task(async()=>setStaff(await iq('staff')))}>Guruhlarim natijalarini ko‘rish</button>{user.role==='admin'&&home&&<button disabled={busy} onClick={()=>task(async()=>setHome(await iq('settings',{active:!home.active})))}>{home.active?'Testni yopish':'Testni faollashtirish'}</button>}</div>{staff&&<div className="learning-table"><table><thead><tr><th>O‘quvchi</th><th>Bosqich</th><th>Rejim</th><th>Natija</th></tr></thead><tbody>{staff.rows.map(s=><tr key={s.id}><td>{s.student_name}</td><td>{bands[s.band].split(' · ')[0]}</td><td>{s.mode==='extended'?'48':'24'} daqiqa</td><td>{s.result.correct}/{s.result.total}</td></tr>)}</tbody></table>{!staff.rows.length&&<p>Guruhlaringizda yakunlangan urinish yo‘q.</p>}</div>}</section>}
 </>:analysis&&!review?<><section className="learning-card iq-result"><span className="learning-kicker">YAKUNLANGAN URINISH</span><h1>{practice?'Mashq natijasi':'Sinov natijasi'}</h1><div className="iq-score"><strong>{run.result.correct}<small> / {run.result.total}</small></strong><span>{run.result.percent}% to‘g‘ri javob</span></div><p>{resultNote}</p><div className="iq-score-grid">{run.result.profile.map(x=><article key={x.domain}><h2>{domains[x.domain].title}</h2><strong>{x.correct}<small>/{x.total}</small></strong><div className="iq-meter"><i style={{width:x.percent+'%'}}/></div><span>{x.percent}% · shu urinishdagi savollar</span></article>)}</div><p>{run.result.total-run.result.answered} ta savolga javob berilmadi. {practice?'Vaqtsiz mashq.':run.mode==='extended'?'Qo‘shimcha vaqt rejimi qayd etildi.':'24 daqiqalik rejim.'}</p><div className="learning-actions"><button className="learning-primary" onClick={()=>{setReview(true);go(0)}}>Savollar va yechimlarni ko‘rish <ArrowRight size={18}/></button><button onClick={()=>download(run.result,run)}><Download size={18}/> Natijani yuklash</button></div></section><section className="learning-card"><h2>Keyingi mashq uchun</h2><p>Kamroq to‘g‘ri javob berilgan yo‘nalishdan boshlang. Bu sizning umumiy qobiliyatingizga hukm emas; aynan ushbu vazifalarda qaysi qoidani takrorlash foydali ekanini ko‘rsatadi.</p><button onClick={beginPractice}>Yechim izohi bilan mashq qilish</button></section></>:<div className="iq-session-layout">
  <aside className="learning-card iq-question-map">
   <h2>{analysis ? 'Yechimlar xaritasi' : 'Savollar xaritasi'}</h2>
   <span>{answered}/{run.items.length} javob saqlangan</span>
   <nav aria-label="Test savollari">{run.items.map((item,index)=>{
    const saved=Number.isInteger(run.answers[item.id]), flagged=flags.includes(item.id);
    return <button key={item.id} type="button" disabled={busy || !!pending} aria-current={cursor === index ? 'step' : undefined}
     aria-label={`${index + 1}-savol${saved ? ', javob berilgan' : ', javobsiz'}${flagged ? ', qayta ko‘rish uchun belgilangan' : ''}`}
     className={[saved && 'answered', flagged && 'flagged'].filter(Boolean).join(' ')} onClick={() => go(index)}>
     {index + 1}{flagged && <Flag size={11} aria-hidden="true"/>}
    </button>;
   })}</nav>
   <p className="learning-help">{timed ? 'Javoblar saqlanadi. Belgilangan savollarga vaqt tugaguncha qayting.' : 'Savollar orasida erkin o‘ting.'}</p>
   {analysis ? <button type="button" onClick={() => setReview(false)}>Natija tahliliga qaytish</button>
    : <button type="button" onClick={() => setFinishOpen(true)} disabled={busy || !!pending}>Testni yakunlash</button>}
  </aside>
  <section className="learning-card iq-question">
   <div className="iq-question-top">
    <span>{domains[current.domain].title} · {cursor + 1} / {run.items.length}</span>
    {timed && <button type="button" className="iq-flag" aria-pressed={flags.includes(current.id)} disabled={left <= 0} onClick={toggleFlag}>
     <Flag size={16}/>Qayta ko‘rishga belgilash
    </button>}
    {practice && <span>Vaqtsiz mashq</span>}
   </div>
   <h1 ref={questionTitle} tabIndex={-1}>{timed ? examPrompt(current) : current.prompt}</h1>
   {current.visual?.kind !== 'text' && !(timed && hasOriginalTestItem(current) && current.visual?.kind === 'sets') && <div className="iq-model"><ItemVisual visual={current.visual}/></div>}
   <fieldset className="iq-options">
    <legend>{analysis ? 'Sizning javobingiz va to‘g‘ri variant' : 'Javob variantlari'}</legend>
    {current.options.map((option,index) => <label key={index} className={`${selected === index ? 'selected' : ''} ${analysis && current.answer === index ? 'correct' : ''}`}>
     <input type="radio" name="iq-choice" checked={selected === index} disabled={analysis || busy || !!pending || left <= 0} onChange={() => choose(index)}/>
     <span className="iq-option-letter">{String.fromCharCode(65 + index)}</span>
     <ChoiceVisual item={current} value={option}/>
     {analysis && current.answer === index && <Check size={18} aria-label="To‘g‘ri javob"/>}
    </label>)}
   </fieldset>
 {busy&&<p role="status">Javob saqlanmoqda…</p>}{pending&&!busy&&<div className="learning-message error"><p>Javob serverda tasdiqlanmadi. Qoralama shu qurilmada turibdi.</p><div className="learning-actions"><button onClick={()=>send(pending)}>Javobni qayta yuborish</button><button onClick={refresh}>Serverdagi holatni olish</button></div></div>}{storageNote&&<p role="alert">{storageNote}</p>}
 {(analysis||practiceFeedback)&&<div className="iq-explanation" role="status"><b>{selected===current.answer?'To‘g‘ri javob.':selected===undefined?'Javob belgilanmagan.':'Bu qoida boshqa natijani beradi.'}</b><p>{current.explanation}</p></div>}
 <div className="learning-actions iq-session-actions">{practice&&!analysis&&<button disabled={!Number.isInteger(selected)} onClick={()=>setPracticeFeedback(true)}>Javobni izohlash</button>}<button disabled={cursor===0||busy||!!pending} onClick={()=>go(cursor-1)}><ArrowLeft size={17}/> Oldingi</button>{cursor<run.items.length-1?<button className="learning-primary" disabled={busy||!!pending} onClick={()=>go(cursor+1)}>Keyingi <ArrowRight size={17}/></button>:analysis?<button className="learning-primary" onClick={()=>setReview(false)}>Natija tahlili</button>:<button className="learning-primary" disabled={busy||!!pending} onClick={()=>setFinishOpen(true)}>Testni yakunlash</button>}</div></section></div>}
 {finishOpen&&<div className="learning-dialog-overlay">
  <section role="alertdialog" aria-modal="true" aria-labelledby="iq-finish-title" aria-describedby="iq-finish-detail" className="learning-dialog iq-submit-dialog">
   <h2 id="iq-finish-title">Topshirishdan oldin tekshiring</h2>
   <p id="iq-finish-detail">{answered} ta javob saqlangan, {missing.length} ta javobsiz. {timed && 'Tekshirish paytida vaqt davom etadi.'}</p>
   {timed && <span className="iq-timer" role="timer" aria-label="Topshirish uchun qolgan vaqt"><Clock3 size={17}/>{formatTime(left)}</span>}
   {timed && <div className="iq-submit-questions">
    {[[missing, 'Javobsiz savollar'], [marked, 'Qayta ko‘rishga belgilangan savollar']].map(([indexes, label]) => <section key={label}>
     <h3>{label} <small>({indexes.length})</small></h3>
     {indexes.length ? <div className="iq-submit-grid">{indexes.map(index => <button type="button" key={index} disabled={busy || !!pending}
      aria-label={`${index + 1}-savolga qaytish · ${label}`} onClick={() => {setFinishOpen(false); go(index);}}>{index + 1}</button>)}</div> : <p>Yo‘q</p>}
    </section>)}
   </div>}
   <p>Topshirgach natija va yechimlar ochiladi.</p>
   <div className="learning-actions">
    <button type="button" autoFocus disabled={busy} onClick={() => setFinishOpen(false)}>Davom ettirish</button>
    <button type="button" className="learning-primary" disabled={busy || !!pending} onClick={finish}>Ha, yakunlash</button>
   </div>
  </section>
 </div>}
 </main>;
}
