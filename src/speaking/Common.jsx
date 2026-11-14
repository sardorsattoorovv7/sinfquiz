import React,{useEffect,useRef,useState} from 'react';
import {CheckCircle2,Clock3,RotateCcw,X,ArrowRight,LoaderCircle,Mic,PenLine} from 'lucide-react';
import {speakingApi,jobNames} from './client.js';
import {speakingCopy as copy} from './copy.js';
export function Notice({children,error=false}){return <div className={error?'sp-error':'sp-notice'} role={error?'alert':'status'}>{children}</div>;}
export function AnswerMode({value,onChange,disabled}){
 return <div className="sp-exam-switch sp-response-modes" role="group" aria-label="Javob shakli">
  <button type="button" aria-pressed={value==='audio'} className={value==='audio'?'is-current':''} onClick={()=>onChange('audio')} disabled={disabled}><Mic size={15}/>Ovozli javob</button>
  <button type="button" aria-pressed={value==='typed'} className={value==='typed'?'is-current':''} onClick={()=>onChange('typed')} disabled={disabled}><PenLine size={15}/>Yozma javob</button>
 </div>;
}
export function Empty({title,children,action,onAction}){return <section className="sp-empty"><span className="sp-empty-icon"><Clock3 size={26}/></span><h2>{title}</h2><p>{children}</p>{action&&<button className="sp-btn sp-primary" onClick={onAction}>{action}<ArrowRight size={16}/></button>}</section>;}
export function Question({question:q}){if(!q)return null;return <div className="sp-question"><div className="sp-eyebrow">{q.part} · {copy.questionKinds[q.taskType]||'Ovozli javob'}</div><h2 lang="en">{q.prompt}</h2>{q.images?.length>0&&<><div className="sp-pictures">{q.images.map(a=><figure key={a.id}><img src={a.src} alt={a.alt} width="640" height="420"/><figcaption lang="en">{a.caption}</figcaption></figure>)}</div><p className="sp-note">Original mashq illyustratsiyalari. Rasm tavsifi ham ko‘rsatilgan; bu imkoniyat urinishda qayd etiladi.</p></>}{q.taskPoints?.length>0&&<ul lang="en">{q.taskPoints.map(p=><li key={p}>{p}</li>)}</ul>}{q.forPoints?.length>0&&<div className="sp-sides"><section><h3 lang="en">For · choose two</h3><ul lang="en">{q.forPoints.map(p=><li key={p}>{p}</li>)}</ul></section><section><h3 lang="en">Against · choose two</h3><ul lang="en">{q.againstPoints.map(p=><li key={p}>{p}</li>)}</ul></section></div>}</div>;}
const codes={GROQ_401:'AI xizmatining server sozlamasi tekshirilishi kerak.',GROQ_429:'AI xizmatida vaqtinchalik so‘rov cheklovi bor. Javoblaringiz saqlangan.',GROQ_NOT_CONFIGURED:'AI hali sozlanmagan. Javobingiz saqlanadi.',AI_RATE_LIMIT:'SinfQuiz’ning kunlik AI limiti tugadi. Javoblaringiz saqlangan.',EMPTY_RECORDING:'Aniq nutq olinmadi. Transkript yoki yangi yozuvni tekshiring.',AUDIO_INVALID:'Yozuv ochilmadi. Saqlangan audioni tinglang.',AUDIO_EXPIRED:'Audio saqlash muddati tugagan yoki o‘chirilgan.',AI_EVIDENCE:'AI dalili transkriptga mos kelmadi. Qayta tekshirish kerak.',AUDIO_PROBE_NOT_CONFIGURED:'Audio xizmati administrator tomonidan sozlanishi kerak.'};
const localCodes={
 LOCAL_AI_OFFLINE:'Lokal Qwen xizmati yuklanmoqda yoki o‘chiq. Javoblaringiz saqlangan.',
 LOCAL_AI_TIMEOUT:'Lokal tahlil vaqti tugadi. Saqlangan javob bilan qayta urinib ko‘ring.',
 LOCAL_ASR_CONFIG:'Lokal Whisper yoki FFmpeg faylini tekshiring.',
 LOCAL_ASR_FAILED:'Whisper yozuvni matnga o‘gira olmadi. Saqlangan audioni tekshiring.',
 LOCAL_AI_REQUIRED:'Bu tahlilni localhostdagi Speaking sahifasidan davom ettiring.',
};
const jobMessages={
 queued:'So‘rovingiz saqlandi. Tahlil boshlanishi kutilmoqda.',
 running:'Javoblar va o‘quv dalillari tahlil qilinmoqda.',
 completed:'Natija saqlandi.',
 failed:'Tahlil yakunlanmadi. Saqlangan javob bilan qayta urinib ko‘ring.',
 cancelled:'Tahlil bekor qilindi. Saqlangan javob bilan qayta urinishingiz mumkin.',
};
export function JobPanel({job:initial,onComplete,onChange}){
 const [job,setJob]=useState(initial),[error,setError]=useState(''),[waiting,setWaiting]=useState(false),done=useRef(null),completeRef=useRef(onComplete);completeRef.current=onComplete;
 useEffect(()=>{setJob(initial);done.current=null;setWaiting(false);},[initial?.id]);
 useEffect(()=>{if(!job?.id)return;let alive=true,timer,waitTimer=setTimeout(()=>alive&&setWaiting(true),25000);const poll=async()=>{try{const r=await speakingApi('job',{id:job.id});if(!alive)return;setError('');setJob(r.job);onChange?.(r.job);if(r.job.status==='completed'){if(done.current!==r.job.id){done.current=r.job.id;completeRef.current?.(r.job);}return;}if(['failed','cancelled'].includes(r.job.status))return;timer=setTimeout(poll,3000);}catch(e){if(alive){setError(e.message);timer=setTimeout(poll,12000);}}};poll();return()=>{alive=false;clearTimeout(timer);clearTimeout(waitTimer);};},[job?.id,job?.status==='failed'||job?.status==='cancelled']);
 if(!job)return null;
 async function change(action){setError('');try{const r=await speakingApi(action,{id:job.id});setJob({...job,...r.job});onChange?.({...job,...r.job});}catch(e){setError(e.message);}}
 const pending=['running','queued'].includes(job.status);
 const message=job.kind==='plan'&&job.last_error==='AI_RATE_LIMIT'
  ?'Hisobot tayyor. Shaxsiy reja uchun SinfQuiz’ning kunlik AI limiti tugadi.'
  :localCodes[job.last_error]||codes[job.last_error]||(job.status==='running'&&job.provider==='local'?'Tahlil shu kompyuterda davom etmoqda.':job.status==='running'&&job.kind==='guide'?'Yordamchi javob tayyorlamoqda.':jobMessages[job.status]);
 return <section className={`sp-job sp-job-${job.status}`} aria-live="polite">
  {job.status==='completed'?<CheckCircle2 size={20}/>:pending?<LoaderCircle className="sp-spinner" size={20}/>:<Clock3 size={20}/>}
  <div>
   <b>{jobNames[job.status]}</b><p>{message}</p>
   {waiting&&pending&&<p>Sahifaga qaytganingizda tahlil holatini shu yerda ko‘rasiz.</p>}
   {error&&<p className="sp-error" role="alert">{error}</p>}
  </div>
  {['failed','cancelled'].includes(job.status)&&<button className="sp-btn" onClick={()=>change('retry_job')}><RotateCcw size={15}/>Qayta urinish</button>}
  {pending&&<button className="sp-btn sp-quiet" onClick={()=>change('cancel_job')}><X size={15}/>Bekor qilish</button>}
 </section>;
}
