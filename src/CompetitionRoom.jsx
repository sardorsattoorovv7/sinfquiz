import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,Check,Clock3,Copy,Download,Play,RefreshCw,Trophy,Users} from 'lucide-react';
import {competitionApi,watchCompetition} from './competition-service.js';
import {competitionKinds,competitionStatuses,editCompetition,saveCsv} from './competition-model.js';
import {MazeChallenge,QuizChallenge,TypingChallenge} from './CompetitionChallenges.jsx';

const number=n=>Number(n||0).toLocaleString('uz-UZ',{maximumFractionDigits:2});
function Confirmation({title,text,onAccept,onClose,busy}){
 const dialog=useRef(null);
 useEffect(()=>{dialog.current?.querySelector('button')?.focus()},[]);
 return <div className="comp-modal-backdrop"><section ref={dialog} role="alertdialog" aria-modal="true" aria-labelledby="comp-confirm-title" aria-describedby="comp-confirm-text" className="comp-modal" onKeyDown={e=>{if(e.key==='Escape'&&!busy)onClose();if(e.key==='Tab'){const buttons=[...dialog.current.querySelectorAll('button:not(:disabled)')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0]?.focus()}}}}><h2 id="comp-confirm-title">{title}</h2><p id="comp-confirm-text">{text}</p><div className="comp-row"><button className="btn btn-outline" disabled={busy} onClick={onClose}>Qaytish</button><button className="btn btn-primary" disabled={busy} onClick={onAccept}>{busy?'Bajarilmoqda…':'Tasdiqlash'}</button></div></section></div>;
}
export function CompetitionJoin({user,onJoined,expectedId}){
 const [code,setCode]=useState(''),[name,setName]=useState(user?.name||''),[busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false);
 const submit=async e=>{e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');try{const result=await competitionApi('join',{code,name});if(expectedId&&result.competition.id!==expectedId){onJoined(result);return}onJoined(result)}catch(e){setError(e.message)}finally{lock.current=false;setBusy(false)}};
 return <form className="comp-join-form" onSubmit={submit}><h2>Jamoangizga qo‘shiling</h2><p>Ustoz bergan 8 belgili jamoa kodi va ism-familiyangizni kiriting.</p><div className="comp-row"><label>Jamoa kodi<input aria-label="Jamoa kodi" autoComplete="off" autoCapitalize="characters" spellCheck="false" placeholder="A1B2C3D4" maxLength={8} pattern="[A-Fa-f0-9]{8}" required disabled={busy} value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g,''))}/></label><label>Ism-familiya<input aria-label="Musobaqa ishtirokchisi" autoComplete="name" value={name} disabled={busy} minLength={2} maxLength={40} required onChange={e=>setName(e.target.value)}/></label><button className="btn btn-primary" disabled={busy||code.length!==8||name.trim().length<2}>{busy?'Qo‘shilmoqda…':'Jamoaga kirish'}</button></div><small>Har bir ishtirokchi o‘z hisobidan yoki alohida brauzer/qurilmadan kiradi. Ustoz ro‘yxat tuzgan bo‘lsa, ismingiz unga mos bo‘lsin.</small>{error&&<p role="alert" className="comp-error">{error}</p>}</form>;
}
export default function CompetitionRoom({id,initial,user,onBack,onEdit,onActive,onJoinedOther}){
 const [state,setState]=useState(initial?.competition?.id===id?initial:null),[loading,setLoading]=useState(!initial),[error,setError]=useState(''),[busy,setBusy]=useState(false),[connected,setConnected]=useState(false),[now,setNow]=useState(Date.now()),[notice,setNotice]=useState(''),[confirm,setConfirm]=useState(null);
 const latest=useRef(state),mounted=useRef(true),fetching=useRef(false),mutating=useRef(false),sequence=useRef(0),pending=useRef(null),offset=useRef(0);
 const apply=useCallback(next=>{if(!mounted.current)return;latest.current=next;offset.current=new Date(next.serverNow).getTime()-Date.now();setState(next);setNow(Date.now()+offset.current);setError('');setLoading(false)},[]);
 const refresh=useCallback(async()=>{
  if(fetching.current||mutating.current||document.hidden)return;
  fetching.current=true;const seq=sequence.current;
  try{const next=await competitionApi('state',{id});if(seq===sequence.current)apply(next)}catch(e){if(mounted.current&&seq===sequence.current){setError(e.message);setLoading(false)}}finally{fetching.current=false}
 },[id,apply]);
 useEffect(()=>{
  mounted.current=true;refresh();let stop=null;
  watchCompetition(id,refresh,value=>mounted.current&&setConnected(value)).then(fn=>{if(mounted.current)stop=fn;else fn()}).catch(()=>setConnected(false));
  const visible=()=>{if(!document.hidden)refresh()},timer=setInterval(refresh,15000);
  document.addEventListener('visibilitychange',visible);window.addEventListener('online',visible);
  return()=>{mounted.current=false;stop?.();clearInterval(timer);document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',visible);onActive(false)};
 },[id,refresh]);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()+offset.current),1000);return()=>clearInterval(timer)},[]);
 const c=state?.competition,stage=state?.current,participating=!!state?.me&&!state.me.withdrawn&&['lobby','running'].includes(c?.status);
 useEffect(()=>{if(state)onActive(participating)},[!!state,participating,onActive]);
 const remaining=stage?Math.max(0,Math.ceil((new Date(stage.deadline).getTime()-now)/1000)):0;
 useEffect(()=>{if(stage&&!remaining&&!stage.finished){refresh()}},[stage?.id,remaining,stage?.finished,refresh]);
 const mutate=async(action,payload)=>{
  if(mutating.current)return null;
  mutating.current=true;sequence.current++;setBusy(true);setError('');
  try{const next=await competitionApi(action,payload);if(next?.competition)apply(next);return next}catch(e){if(mounted.current)setError(e.message);return null}finally{mutating.current=false;if(mounted.current)setBusy(false)}
 };
 const submit=async body=>{
  const fingerprint=stage.id+JSON.stringify(body);
  if(!pending.current||pending.current.fingerprint!==fingerprint)pending.current={fingerprint,actionId:crypto.randomUUID()};
  const result=await mutate('answer',{id,stageId:stage.id,actionId:pending.current.actionId,body});
  if(result)pending.current=null;return result;
 };
 const control=async action=>{const result=await mutate('control',{id,action,stage:c.currentStage});if(result)setConfirm(null)};
 const joined=next=>{if(next.competition.id!==id){onJoinedOther(next);return}sequence.current++;apply(next)};
 const leave=async()=>{const result=state.me?await mutate('leave',{id}):{ok:true};if(result){onActive(false);onBack()}};
 const askLeave=()=>participating?setConfirm({title:'Musobaqadan chiqasizmi?',text:c.status==='lobby'?'Jamoangizdagi o‘rin bo‘shaydi. Kod bilan qayta kirishingiz mumkin.':'Qatnashishni to‘xtatasiz. Toplangan ball saqlanadi, keyingi bosqichlar uchun ball berilmaydi.',accept:leave}):onBack();
 const copy=async code=>{try{await navigator.clipboard.writeText(code);setNotice('Jamoa kodi nusxalandi.')}catch{setNotice('Kodni belgilang va qo‘lda nusxalang.')}};
 if(!state)return <main className="comp-panel"><button className="btn btn-outline" onClick={onBack}><ArrowLeft size={16}/> Musobaqalar</button>{loading?<p role="status">Musobaqa ochilmoqda…</p>:<><p className="comp-error" role="alert">{error}</p><button className="btn btn-primary" onClick={refresh}>Qayta yuklash</button></>}</main>;
 const maximum=state.stages.reduce((n,s)=>n+s.weight*100,0),joinedCount=state.teams.reduce((n,t)=>n+t.joined,0),capacity=state.teams.length*c.teamSize;
 const completed=stage?state.teams.reduce((n,t)=>n+(t.stages.find(s=>s.position===stage.position)?.completed||0),0):0;
 const canNext=!!stage&&(remaining===0||completed>=capacity);
 const currentTeam=state.teams.find(t=>t.id===state.me?.teamId);
 return <div className="competition-room"><header className="comp-page-head"><div><span className="comp-eyebrow">{competitionStatuses[c.status]}</span><h1>{c.title}</h1><p>{c.description||'Har bir a’zo jamoasining umumiy natijasiga hissa qo‘shadi.'}</p></div><button className="btn btn-outline" disabled={busy} onClick={askLeave}><ArrowLeft size={17}/> {participating?'Musobaqadan chiqish':'Musobaqalar'}</button></header>
 <div className="comp-room-stats"><span><Users size={18}/>{joinedCount} / {capacity} ishtirokchi</span><span>{state.stages.length} bosqich</span><span>{c.teamSize} a’zo / jamoa</span><span className={connected?'is-live':''}>{connected?'Jonli aloqa':'Har 15 sekundda yangilanadi'}</span><button className="btn btn-ghost" onClick={refresh} disabled={busy}><RefreshCw size={16}/> Yangilash</button></div>
 {error&&<p className="comp-error" role="alert">{error} Javobingiz yuborilmagan bo‘lsa, yana urinishingiz mumkin.</p>}{notice&&<p role="status" className="comp-notice">{notice}</p>}
 {state.manager&&<section className="comp-panel comp-organizer"><h2>Musobaqani boshqaring</h2><div className="comp-row">
 {c.status==='draft'&&<><button className="btn btn-outline" disabled={busy} onClick={()=>onEdit(editCompetition(state))}>Qoralamani tahrirlash</button><button className="btn btn-primary" disabled={busy} onClick={()=>control('publish')}><Check size={17}/> Qabulni faollashtirish</button></>}
 {c.status==='lobby'&&<button className="btn btn-primary" disabled={busy||joinedCount!==capacity} onClick={()=>control('start')}><Play size={17}/> Musobaqani boshlash</button>}
 {c.status==='running'&&<><button className="btn btn-primary" disabled={busy||!canNext} onClick={()=>control('next')}>{c.currentStage===state.stages.length?'Musobaqani yakunlash':'Keyingi bosqich'}</button>{!canNext&&<button className="btn btn-outline" disabled={busy} onClick={()=>setConfirm({title:'Bosqichni ertaroq yopasizmi?',text:'Hali tugatmagan o‘quvchilarning joriy balli saqlanadi. Javobsiz topshiriqlar uchun ball berilmaydi. Barcha jamoa birga keyingi bosqichga o‘tadi.',accept:()=>control('force-next')})}>Bosqichni hozir yopish</button>}</>}
 {['draft','lobby','running'].includes(c.status)&&<button className="btn btn-ghost" disabled={busy} onClick={()=>setConfirm({title:'Musobaqani to‘xtatasizmi?',text:'Qatnashish yopiladi. Mavjud natijalar saqlanadi.',accept:()=>control('cancel')})}>Musobaqani to‘xtatish</button>}
 <button className="btn btn-outline" onClick={()=>saveCsv(state)}><Download size={17}/> Natijalarni Excel uchun olish</button></div>
 <p>{c.status==='draft'?'Qabulni faollashtirgach, har bir jamoaga o‘z kodini bering.':c.status==='lobby'?joinedCount===capacity?'Barcha jamoalar tayyor. Boshlash mumkin.':'Boshlash uchun yana '+(capacity-joinedCount)+' ishtirokchi kirishi kerak.':c.status==='running'?completed+' / '+capacity+' ishtirokchi joriy bosqichni tugatgan.':'Musobaqa yopilgan. Natijalar shu sahifada qoladi.'}</p>
 {['draft','lobby'].includes(c.status)&&<div className="comp-team-codes">{state.teams.map(t=><article key={t.id}><b>{t.title}</b><span>{t.joined} / {c.teamSize} kirdi</span><div><code>{t.code}</code><button type="button" className="btn btn-ghost" aria-label={t.title+' kodini nusxalash'} onClick={()=>copy(t.code)}><Copy size={16}/></button></div>{t.roster.length>0&&<small>{t.roster.join(' · ')}</small>}</article>)}</div>}</section>}
 {!state.manager&&!state.me&&c.status==='lobby'&&<CompetitionJoin user={user} onJoined={joined} expectedId={id}/>}
 {state.me&&c.status==='lobby'&&<section className="comp-waiting"><Users size={28}/><h2>{currentTeam?.title}: {state.me.name}</h2><p>Jamoangizga kirdingiz. Ustoz musobaqani boshlaganda birinchi bosqich shu yerda ochiladi.</p></section>}
 <ol className="comp-stage-track" aria-label="Musobaqa bosqichlari">{state.stages.map(s=><li key={s.id} className={s.position===c.currentStage?'is-current':s.position<c.currentStage||c.status==='finished'?'is-done':''}><span>{s.position}</span><div><b>{s.title}</b><small>{competitionKinds[s.kind]} · {s.duration} s · ×{s.weight}</small></div></li>)}</ol>
 {stage&&<section className="comp-panel comp-stage-active"><header className="comp-active-head"><div><span className="comp-eyebrow">{stage.position}-BOSQICH</span><h2>{stage.title}</h2></div><output className={'comp-timer '+(remaining<30?'is-urgent':'')} aria-label="Qolgan vaqt"><Clock3 size={21}/>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</output></header>
 {state.me&&!state.me.withdrawn?<>
 {stage.feedback?.message&&<div className="comp-feedback" role="status"><b>{stage.feedback.message}</b>{stage.feedback.hint&&<p>{stage.feedback.hint}</p>}{stage.feedback.explanation&&<p>{stage.feedback.explanation}</p>}{stage.feedback.correctAnswer&&<p>Namuna javob: <code>{stage.feedback.correctAnswer}</code></p>}{stage.feedback.checks&&<ul>{stage.feedback.checks.map((check,i)=><li key={i}>{check.passed?'Bajarildi: ':'Hali bajarilmadi: '}{check.label}</li>)}</ul>}{stage.feedback.accuracy!==undefined&&<p>{stage.feedback.accuracy}% aniqlik · {stage.feedback.wpm} so‘z/minut</p>}</div>}
 {stage.finished?<div className="comp-waiting"><Check size={30}/><h3>Bosqich yakunlandi</h3><p>Sizning natijangiz: {number(stage.score)} / 100 ball. {remaining?'Ustoz keyingi bosqichni ochishini kuting.':'Vaqt tugadi. Ustoz musobaqani davom ettiradi.'}</p></div>:stage.data?.question||stage.kind!=='quiz'?<>{stage.kind==='quiz'?<QuizChallenge key={stage.id+'-'+stage.data.question.id} stage={stage} onSubmit={submit} busy={busy||!remaining} ownerId={user?.id||'comp-guest'}/>:stage.kind==='typing'?<TypingChallenge key={stage.id} stage={stage} onSubmit={submit} busy={busy||!remaining}/>:<MazeChallenge key={stage.id} stage={stage} onSubmit={submit} busy={busy||!remaining}/>}
 {stage.kind!=='maze'&&<button className="btn btn-ghost comp-early-finish" disabled={busy||!remaining} onClick={()=>setConfirm({title:'Bosqichni tugatasizmi?',text:'Javobsiz qolgan topshiriqlar uchun ball berilmaydi. Yozayotgan typing matni bo‘lsa, avval “Typingni yakunlash”ni bosing.',accept:async()=>{if(await submit({mode:'finish'}))setConfirm(null)}})}>Bosqichni hozir tugatish</button>}</>:null}
 </>:<p>{state.me?.withdrawn?'Siz qatnashishni to‘xtatgansiz.':'O‘quvchilar topshiriqlarni o‘z ekranida bajaryapti. Natijalar quyida yangilanadi.'}</p>}
 </section>}
 <section className="comp-panel"><div className="comp-active-head"><h2><Trophy size={21}/> Jamoalar jadvali</h2><span>Eng ko‘pi {maximum} ball</span></div><p className="comp-muted">Har bosqichdagi a’zolar ballari qo‘shilib, belgilangan {c.teamSize} a’zoga bo‘linadi. O‘rin avval ball, keyin to‘g‘ri javoblar, so‘ng kamroq vaqt bo‘yicha aniqlanadi. Uchala natija teng bo‘lsa, o‘rin ham teng.</p>
 <div className="comp-table-scroll" tabIndex={0} role="region" aria-label="Jamoalar natijalari jadvali"><table className="comp-leaderboard"><caption className="sr-only">Jamoalar reytingi va har bosqichdagi natijalar</caption><thead><tr><th scope="col">O‘rin</th><th scope="col">Jamoa</th><th scope="col">Jami ball</th><th scope="col">To‘g‘ri</th><th scope="col">Vaqt, s</th>{state.stages.map(s=><th scope="col" key={s.id} title={s.title}>{s.position}-bosqich</th>)}</tr></thead><tbody>{state.teams.map(t=><tr key={t.id} className={state.me?.teamId===t.id?'is-my-team':''}><td><span className="comp-rank">{t.rank}</span></td><th scope="row">{t.title}<small>{t.joined} a’zo</small></th><td><b>{number(t.score)}</b></td><td>{t.correct}</td><td>{number(t.elapsed)}</td>{state.stages.map(s=><td key={s.id}>{number(t.stages.find(x=>x.position===s.position)?.score)}</td>)}</tr>)}</tbody></table></div></section>
 {!!state.history.length&&<section className="comp-panel"><h2>Sizning bosqichlaringiz</h2><div className="comp-personal-history">{state.history.map(row=><article key={row.stage}><b>{row.stage}. {row.title}</b><span>{number(row.score)} / 100 ball</span><small>{row.finished?'Yakunlandi':'Davom etmoqda'} · {number(row.elapsed)} s</small></article>)}</div></section>}
 {state.manager&&state.members?.length>0&&<section className="comp-panel"><h2>Ishtirokchilar natijalari</h2><div className="comp-table-scroll" tabIndex={0} role="region" aria-label="Ishtirokchilar natijalari jadvali"><table className="comp-leaderboard"><caption className="sr-only">O‘quvchilarning bosqichlar bo‘yicha ballari</caption><thead><tr><th>Ishtirokchi</th><th>Jamoa</th>{state.stages.map(s=><th key={s.id}>{s.position}-bosqich</th>)}</tr></thead><tbody>{state.members.map((m,i)=><tr key={i}><th scope="row">{m.name}{m.withdrawn&&<small>Qatnashishni to‘xtatgan</small>}</th><td>{state.teams.find(t=>t.id===m.teamId)?.title}</td>{state.stages.map(s=>{const r=m.stages.find(x=>x.stage===s.position);return <td key={s.id}>{r?number(r.score):'—'}{r?.feedback?.message&&<details><summary>Tekshiruv</summary><p>{r.feedback.message}</p>{r.feedback.checks?.map((item,n)=><p key={n}>{item.passed?'Bajarilgan: ':'Bajarilmagan: '}{item.label}</p>)}</details>}</td>})}</tr>)}</tbody></table></div></section>}
 {confirm&&<Confirmation {...confirm} busy={busy} onClose={()=>setConfirm(null)} onAccept={confirm.accept}/>}
 </div>;
}
