import React,{useEffect,useRef,useState} from 'react';
import {Mic,Square,Upload,RotateCcw,Volume2} from 'lucide-react';
import {loadDraft,saveDraft,removeDraft,blobHash} from './drafts.js';
import {newToken,timeLabel} from './client.js';
const chooseMime=()=>['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus','audio/webm'].find(m=>MediaRecorder.isTypeSupported(m));
export default function Recorder({draftKey,limit=120,prep=0,onBegin,onStop,onSubmit,onActive,onExpired,test=false,externalTurn=null,serverOffset=0}){
 const [state,setState]=useState('loading'),[draft,setDraft]=useState(null),[url,setUrl]=useState(''),[error,setError]=useState(''),[tick,setTick]=useState(Date.now()),[turn,setTurn]=useState(externalTurn);
 const recorder=useRef(null),stream=useRef(null),chunks=useRef([]),timer=useRef(null),saveChain=useRef(Promise.resolve()),mounted=useRef(true),stopping=useRef(false),latest=useRef(null),activeRef=useRef(onActive);
 activeRef.current=onActive;
 useEffect(()=>{mounted.current=true;loadDraft(draftKey).then(d=>{if(!mounted.current)return;latest.current=d||null;setDraft(d||null);setState(d?.blob?.size?'ready':'idle');}).catch(e=>{setError(e.message);setState('idle');});return()=>{mounted.current=false;clearInterval(timer.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());activeRef.current?.(false);};},[draftKey]);
 useEffect(()=>{if(!draft?.blob)return;const src=URL.createObjectURL(draft.blob);setUrl(src);return()=>URL.revokeObjectURL(src);},[draft]);
 useEffect(()=>{if(externalTurn)setTurn(externalTurn);},[externalTurn]);
 const now=tick+serverOffset,preparing=state==='recording'&&turn&&now<Date.parse(turn.prepUntil),remaining=turn?Math.ceil(((preparing?Date.parse(turn.prepUntil):Date.parse(turn.deadline))-now)/1000):limit;
 const expired=!!turn&&now>=Date.parse(turn.deadline);
 useEffect(()=>{onExpired?.(expired)},[expired,onExpired]);
 useEffect(()=>{if(state!=='recording'&&(!turn||turn.stoppedAt||expired))return;timer.current=setInterval(()=>setTick(Date.now()),200);return()=>clearInterval(timer.current);},[state,turn,expired]);
 useEffect(()=>{if(state==='recording'&&!preparing&&remaining<=0)stop();},[state,preparing,remaining]);
 async function start(){setError('');if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setError('Audio yozish uchun HTTPS, mikrofonli Chrome, Edge, Firefox yoki Safari kerak.');return;}
  setState('opening');try{stream.current=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});const mime=chooseMime();if(!mime)throw Error('Bu brauzer audio formatini qo‘llamaydi. Boshqa brauzerda urinib ko‘ring.');
   const info=onBegin?await onBegin():{prepUntil:new Date(Date.now()+prep*1000).toISOString(),deadline:new Date(Date.now()+(prep+limit)*1000).toISOString()};setTurn(info);if(Date.parse(info.deadline)<=Date.now()+serverOffset)throw Error('Bu savolning vaqti tugagan. Javobsiz davom eting yoki yangi sinov boshlang.');
   const token=newToken();chunks.current=[];latest.current={token,blob:null,complete:false};stopping.current=false;
   recorder.current=new MediaRecorder(stream.current,{mimeType:mime});
   recorder.current.ondataavailable=e=>{if(e.data.size){chunks.current.push(e.data);const d={...latest.current,blob:new Blob(chunks.current,{type:mime.split(';')[0]}),complete:stopping.current};latest.current=d;saveChain.current=saveChain.current.catch(()=>{}).then(()=>saveDraft(draftKey,d)).catch(e=>{if(mounted.current)setError(e.message);});}};
   recorder.current.onstop=async()=>{stream.current?.getTracks().forEach(t=>t.stop());await saveChain.current;const d=latest.current;if(d?.blob?.size){try{const hash=await blobHash(d.blob);const saved={...d,sha256:hash,complete:true};latest.current=saved;await saveDraft(draftKey,saved);await onStop?.(saved);if(mounted.current){setDraft(saved);setState('ready');}}catch(e){if(mounted.current){setDraft(d);setError(e.message);setState('ready');}}}else if(mounted.current){setError('Audio olinmadi. Mikrofon sozlamasini tekshiring.');setState('idle');}activeRef.current?.(false);};
   // Preparation uses the same trusted deadline but the microphone starts only
   // after preparation, so preparation silence is not sent to ASR.
   const beginAudio=()=>{if(!mounted.current)return;if(Date.now()+serverOffset<Date.parse(info.prepUntil)){setTimeout(beginAudio,100);return;}if(!stopping.current){recorder.current.start(1000);}};beginAudio();setTick(Date.now());setState('recording');activeRef.current?.(true);
  }catch(e){stream.current?.getTracks().forEach(t=>t.stop());setError(e.name==='NotAllowedError'?'Mikrofonga ruxsat berilmadi. Brauzerning sayt sozlamasidan mikrofonni yoqing.':e.message);setState('idle');activeRef.current?.(false);}}
 function stop(){if(stopping.current)return;stopping.current=true;clearInterval(timer.current);if(recorder.current?.state==='recording'){setState('saving');recorder.current.stop();}else{stream.current?.getTracks().forEach(t=>t.stop());setState('idle');activeRef.current?.(false);}}
 async function submit(){setError('');setState('uploading');try{const d=latest.current||draft;if(!d?.blob?.size)throw Error('Yozuv topilmadi.');const saved={...d,sha256:d.sha256||await blobHash(d.blob),complete:true};await saveDraft(draftKey,saved);await onStop?.(saved);await onSubmit(saved);await removeDraft(draftKey);latest.current=null;if(mounted.current){setDraft(null);setState('idle');}}catch(e){if(mounted.current){setError(e.message);setState('ready');}}}
 async function reset(){await removeDraft(draftKey);latest.current=null;setDraft(null);setState('idle');setError('');}
 return <div className="sp-recorder">
  <div className={`sp-mic-orb ${state==='recording'&&!preparing?'is-recording':''}`}><Mic size={28}/></div>
  <div className="sp-record-status" role="status">{state==='recording'?preparing?'Tayyorlanish vaqti':'Audio yozilmoqda':state==='saving'?'Qurilmada saqlanmoqda…':state==='uploading'?'Audio yuborilmoqda…':state==='opening'?'Mikrofon ochilmoqda…':state==='ready'?test?'Mikrofon sinovi tayyor':'Saqlangan audio tayyor':expired?'Savol vaqti tugagan':'Mikrofon tayyor'}</div>
  {state==='recording'&&<><strong className="sp-clock" aria-label={preparing?'Tayyorlanish uchun qolgan vaqt':'Javob uchun qolgan vaqt'}>{timeLabel(Math.max(0,remaining))}</strong><button className="sp-btn sp-danger" onClick={stop}><Square size={16}/>{preparing?'Tayyorgarlikni to‘xtatish':'Yozuvni tugatish'}</button></>}
  {state==='idle'&&turn&&!turn.stoppedAt&&!expired&&<p className="sp-note">Taymer allaqachon boshlandi. {now<Date.parse(turn.prepUntil)?'Tayyorlanish':'Javob'} uchun {timeLabel(Math.max(0,Math.ceil(((now<Date.parse(turn.prepUntil)?Date.parse(turn.prepUntil):Date.parse(turn.deadline))-now)/1000)))} qoldi.</p>}
  {state==='idle'&&(expired||turn?.stoppedAt)&&<p className="sp-note" role="status">Bu savol uchun yozuv vaqti yakunlangan. Saqlangan javob bilan davom eting yoki yangi sinovni tanlang.</p>}
  {state==='idle'&&!expired&&!turn?.stoppedAt&&<button className="sp-btn sp-primary" onClick={start}><Mic size={18}/>{test?'10 soniyalik sinov':onBegin?'Ovoz yozishni boshlash':'Ovozli javob yozish'}</button>}
  {state==='ready'&&draft?.blob&&<><audio controls src={url||undefined} aria-label={test?'Sinov audiosini tinglash':'O‘z javobingizni tinglash'}/>{!draft.complete&&<p className="sp-note">Oldingi yozuv uzilgan. Saqlangan qismini tinglab, yuborish yoki texnik holatni qayd etishni tanlang.</p>}<div className="sp-actions">{onSubmit&&<button className="sp-btn sp-primary" onClick={submit}><Upload size={16}/>Audioni yuborish</button>}{test&&<button className="sp-btn" onClick={reset}><RotateCcw size={16}/>Qayta sinash</button>}</div></>}
  {error&&<p className="sp-error" role="alert">{error}</p>}
  {test&&<p className="sp-note"><Volume2 size={14}/> Yozuvni tinglang. Ovoz tushunarli bo‘lsa, sinovga o‘ting. Sinov AI baholashiga yuborilmaydi.</p>}
 </div>;
}
