import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,Check,Clock3,Download,Headphones,Mic,Square} from 'lucide-react';
import SourceResources from './SourceResources.jsx';
import {asset} from './practice-assets.js';
import {newPractice,advancePractice,setPracticeAnswer,finishPractice,practiceSkills,practiceMinutes,wordCount,validPractice} from './cefr-practice.js';
import {safeSourceUrl} from './national-review.js';

const labels={listening:'Listening',reading:'Reading',writing:'Writing',speaking:'Speaking'};
const filesNeeded={paper:'Listening / Reading PDF',writing:'Writing PDF — yangi format',speaking:'Speaking PDF',audio:'Listening audio (MP3 / WAV / M4A)'};

export default function CefrWorkspace({user,onBack,onStatus}){
 const uid=user.id,key='sq_cefr_practice_'+uid;
 const [state,setState]=useState(()=>{try{const s=JSON.parse(localStorage.getItem(key));return validPractice(s)?advancePractice(s):null}catch{return null}});
 const [source,setSource]=useState('https://gov.uz/oz/uzbmb/sections/view/49518'),[title,setTitle]=useState(''),[files,setFiles]=useState({}),[urls,setUrls]=useState({}),[ready,setReady]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(Date.now());
 const stateRef=useRef(state),urlsRef=useRef({});stateRef.current=state;
 const store=next=>{stateRef.current=next;setState(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{setError('Qurilma xotirasiga saqlab bo‘lmadi. Javoblaringizni yuklab oling.')}};
 useEffect(()=>{let alive=true;Promise.all(Object.keys(filesNeeded).map(async name=>[name,await asset('get',uid,name)])).then(rows=>{
  if(!alive)return;const fs=Object.fromEntries(rows.filter(([,value])=>value)),us=Object.fromEntries(Object.entries(fs).map(([name,file])=>[name,URL.createObjectURL(file)]));urlsRef.current=us;setFiles(fs);setUrls(us);
 }).catch(()=>alive&&setError('Fayl xotirasi ochilmadi. Brauzerning odatiy oynasida qayta urinib ko‘ring.')).finally(()=>alive&&setReady(true));
 return()=>{alive=false;Object.values(urlsRef.current).forEach(URL.revokeObjectURL)}},[uid]);
 useEffect(()=>{const active=!!state&&!state.finished;onStatus(active);if(active)history.replaceState(null,'',location.pathname+'#cefr-source');return()=>onStatus(false)},[!!state,state?.finished]);
 useEffect(()=>{if(!state||state.finished)return;const timer=setInterval(()=>{const time=Date.now();setNow(time);const next=advancePractice(stateRef.current,time);if(next!==stateRef.current)store(next)},1000);return()=>clearInterval(timer)},[!!state,state?.finished]);
 const upload=async(name,file)=>{if(!file)return;setError('');if(state&&!state.finished)return;
  const valid=name==='audio'?/\.(mp3|wav|m4a|ogg|webm)$/i.test(file.name):/\.pdf$/i.test(file.name);
  if(!valid||file.size>50*1024*1024){setError('Mos PDF/audio tanlang. Har bir fayl 50 MB dan kichik bo‘lsin.');return}
  try{await asset('put',uid,name,file);const url=URL.createObjectURL(file);if(urlsRef.current[name])URL.revokeObjectURL(urlsRef.current[name]);urlsRef.current={...urlsRef.current,[name]:url};setUrls({...urlsRef.current});setFiles(prev=>({...prev,[name]:file}))}catch{setError('Fayl saqlanmadi. Qurilmadagi bo‘sh joyni tekshiring.')}
 };
 const download=()=>{const blob=new Blob([JSON.stringify({...state,assessment:'unmarked',notice:'Rasmiy sertifikat emas. O‘qituvchi tekshiruvi zarur.'},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cefr-javoblarim.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 if(!state)return <main className="source-page"><button className="back-link" onClick={onBack}><ArrowLeft/> Chiqish</button><span className="eyebrow">INGLIZ TILI · MULTILEVEL</span><h1>Asl material bilan tayyorlaning</h1><p>Sun’iy savollar o‘rniga rasmiy namuna va uning haqiqiy audiosidan foydalaning. Bu sahifa manbali mashq ish joyi; tayyor 10 ta tasdiqlangan variant hali ulanmagan.</p><SourceResources kind="cefr"/><section className="source-setup"><h2>Materialni ochish</h2><p>Manbadan namunani yuklab oling, arxivni oching va PDF/audio fayllarini tanlang. Fayllar faqat shu brauzerda saqlanadi. Har bir bo‘lim uchun aynan o‘sha variant materialini tanlang.</p><label>Variant nomi<input value={title} maxLength={120} onChange={e=>setTitle(e.target.value)} placeholder="Manbadagi variant nomi va sanasi"/></label><label>Asl manba (HTTPS)<input type="url" value={source} onChange={e=>setSource(e.target.value)} maxLength={1000}/></label><div className="source-upload-grid">{Object.entries(filesNeeded).map(([name,label])=><label key={name}>{label}<input type="file" accept={name==='audio'?'.mp3,.wav,.m4a,.ogg,.webm':'.pdf'} onChange={e=>upload(name,e.target.files[0])}/><small>{files[name]?.name||'Fayl tanlanmagan'}</small></label>)}</div><p>Ketma-ketlik: Listening 45 → Reading 60 → Writing 60 → Speaking 15 daqiqa. Oldingi bo‘limga qaytilmaydi. Bu vaqtlar tayyorgarlik rejimi uchun; asl hujjatdagi ko‘rsatmalar ustun.</p><p>Matn kiritish, variant harfi, moslashtirish va True/False/Not Given javoblari uchun ochiq javob varaqasi ishlatiladi. Writing/Speaking o‘qituvchi tomonidan tekshiriladi.</p>{error&&<p role="alert" className="form-error">{error}</p>}<button className="btn btn-primary" disabled={!ready||!title.trim()||!safeSourceUrl(source)||Object.keys(filesNeeded).some(name=>!files[name])} onClick={async()=>{try{await asset('delete',uid,'recording');store(newPractice({title:title.trim(),url:safeSourceUrl(source),files:Object.fromEntries(Object.entries(files).map(([k,v])=>[k,v.name]))}))}catch{setError('Oldingi ovoz yozuvini tozalab bo‘lmadi.')}}}>Mashqni boshlash</button></section></main>;
 if(state.finished)return <main className="source-page"><section className="source-setup"><span className="eyebrow">MASHQ YAKUNLANDI</span><h1>{state.source.title}</h1><p>Javoblar shu qurilmada saqlandi. Ball yoki CEFR darajasi avtomatik belgilanmaydi: javob kaliti va o‘qituvchi bahosi kerak.</p><div className="review-summary">{['listening','reading'].map(skill=><div key={skill}><b>{state.answers[skill].filter(Boolean).length}/35</b><span>{labels[skill]} javob berilgan</span></div>)}</div><button className="btn btn-primary" onClick={download}><Download/> Javoblarni yuklab olish</button><button className="btn btn-outline" onClick={()=>{localStorage.removeItem(key);setState(null);history.replaceState(null,'',location.pathname)}}>Yangi mashq</button><button className="btn btn-outline" onClick={onBack}>Chiqish</button><details className="answer-review"><summary>Barcha javoblarim</summary>{['listening','reading'].map(skill=><section key={skill}><h2>{labels[skill]}</h2><ol>{state.answers[skill].map((text,i)=><li key={i}>{text||'Javobsiz'}</li>)}</ol></section>)}{state.writing.map((text,i)=><section key={i}><h3>Writing {i+1}</h3><p className="preserve-lines">{text||'Javob berilmagan'}</p></section>)}</details><LocalRecorder uid={uid} readonly/></section></main>;
 const skill=practiceSkills[state.step],remaining=Math.max(0,state.endsAt-now),pdf=skill==='writing'?'writing':skill==='speaking'?'speaking':'paper';
 const finish=()=>{if(confirm('Mashq yakunlansinmi? Yuborilgan javoblarni o‘zgartirib bo‘lmaydi.'))store(finishPractice(stateRef.current))};
 return <main className="source-page practice-workspace"><header><div><small>{state.source.title}</small><h1>{labels[skill]}</h1></div><div className="national-timer"><Clock3/>{Math.floor(remaining/60000)}:{String(Math.floor(remaining%60000/1000)).padStart(2,'0')}</div><button className="btn btn-primary" onClick={finish}><Check/> Tugatish</button></header><ol className="practice-steps">{practiceSkills.map((s,i)=><li key={s} className={i===state.step?'current':i<state.step?'done':''}>{labels[s]}<small>{practiceMinutes[i]} daqiqa</small></li>)}</ol>{error&&<p role="alert" className="form-error">{error}</p>}<div className="practice-columns"><section className="practice-document"><h2>Asl topshiriq</h2>{urls[pdf]?<><a href={urls[pdf]} target="_blank" rel="noopener noreferrer">PDF’ni alohida oynada ochish ↗</a><iframe src={urls[pdf]} title={labels[skill]+' topshiriqlari'}/></>:<p>PDF yuklanmoqda. Brauzer xotirasi o‘chirilgan bo‘lsa, javoblarni saqlab mashqni tugating va faylni qayta tanlang.</p>}</section><section className="practice-answers">{state.step===0&&<LocalListening url={urls.audio} count={state.plays} onPlayed={()=>store({...stateRef.current,plays:stateRef.current.plays+1})}/>}<h2>{state.step<2?'Javob varaqasi':state.step===2?'Writing javoblari':'Speaking yozuvi'}</h2>{state.step<2?<><p>PDF’dagi raqamga mos javob yozing. Harf, so‘z yoki raqam kiriting; so‘z chegarasini manbadan tekshiring.</p><div className="answer-sheet">{state.answers[skill].map((answer,i)=><label key={i}><span>{i+1}</span><input aria-label={`${labels[skill]} ${i+1}-javob`} value={answer} maxLength={120} autoComplete="off" onChange={e=>store(setPracticeAnswer(stateRef.current,i,e.target.value))}/></label>)}</div></>:state.step===2?<><p>Yangi formatdagi Task 1.1, Task 1.2 va Task 2 uchun maydonlar. Aniq topshiriq va so‘z chegarasi — yuklangan PDF’da. Eski formatni yangi format bilan aralashtirmang.</p>{['Task 1.1','Task 1.2','Task 2'].map((label,i)=><label className="writing-answer" key={label}>{label} · {wordCount(state.writing[i])} so‘z<textarea value={state.writing[i]} maxLength={8000} onChange={e=>{const current=advancePractice(stateRef.current);if(current!==stateRef.current){store(current);return}const writing=[...current.writing];writing[i]=e.target.value;store({...current,writing})}}/></label>)}</>:<><p>PDF’dagi qismlar, tayyorgarlik va gapirish vaqtlariga amal qiling. Ovoz kompyuteringizda saqlanadi, sayt serveriga yuborilmaydi.</p><LocalRecorder uid={uid}/></>}<footer><small>Javoblar shu brauzerda saqlanadi.</small>{state.step<3&&<button className="btn btn-outline" onClick={()=>{if(confirm('Bu bo‘limga qaytib bo‘lmaydi. Keyingi bo‘limga o‘tasizmi?'))store(advancePractice(stateRef.current,Date.now(),true))}}>Bo‘limni topshirish →</button>}</footer></section></div></main>;
}

function LocalListening({url,count,onPlayed}){
 const audio=useRef(null),[playing,setPlaying]=useState(false),[error,setError]=useState(''),started=useRef(false),pending=useRef(false);
 useEffect(()=>()=>audio.current?.pause(),[]);
 const play=async()=>{if(pending.current||!audio.current||(!started.current&&count>=2))return;pending.current=true;setError('');try{await audio.current.play();if(!started.current){onPlayed();started.current=true}setPlaying(true)}catch{setError('Audio ijro etilmadi. Mos audio faylni tekshiring.')}finally{pending.current=false}};
 return <section className="local-audio"><Headphones/><b>Asl audio · {count}/2 ijro</b><p>Agar manba audiosining o‘zida takrorlash bo‘lsa, uni bir marta to‘liq tinglang. Bu mashq pleyeri, rasmiy imtihon nazorati emas.</p><audio ref={audio} src={url} onEnded={()=>{started.current=false;setPlaying(false)}} onError={()=>setError('Audio fayli ochilmadi.')}/><button className="btn btn-outline" disabled={!url||(!playing&&!started.current&&count>=2)} onClick={playing?()=>{audio.current.pause();setPlaying(false)}:play}>{playing?'Pauza':started.current?'Davom ettirish':'Audioni boshlash'}</button>{error&&<p role="alert">{error}</p>}</section>;
}

function LocalRecorder({uid,readonly=false}){
 const [recording,setRecording]=useState(false),[busy,setBusy]=useState(false),[url,setUrl]=useState(''),[error,setError]=useState(''),rec=useRef(null),stream=useRef(null),urlRef=useRef(''),alive=useRef(true),pending=useRef(false);
 useEffect(()=>{
  alive.current=true;
  const refresh=()=>asset('get',uid,'recording').then(blob=>{if(blob&&alive.current){if(urlRef.current)URL.revokeObjectURL(urlRef.current);urlRef.current=URL.createObjectURL(blob);setUrl(urlRef.current)}}).catch(()=>{if(alive.current)setError('Ovoz xotirasi ochilmadi.')});
  const saved=e=>{if(e.detail.uid!==uid)return;if(e.detail.error)setError('Ovoz yozuvini saqlab bo‘lmadi.');else refresh()};
  window.addEventListener('sq-recording-saved',saved);refresh();
  return()=>{alive.current=false;window.removeEventListener('sq-recording-saved',saved);if(rec.current?.state==='recording')rec.current.stop();stream.current?.getTracks().forEach(t=>t.stop());if(urlRef.current)URL.revokeObjectURL(urlRef.current)};
 },[uid]);
 const start=async()=>{
  if(pending.current||rec.current?.state==='recording')return;pending.current=true;setBusy(true);setError('');
  try{
   if(!navigator.mediaDevices?.getUserMedia||!globalThis.MediaRecorder)throw Error('Brauzer mikrofondan yozishni qo‘llamaydi. Chrome yoki Edge va HTTPS’dan foydalaning.');
   const media=await navigator.mediaDevices.getUserMedia({audio:true});if(!alive.current){media.getTracks().forEach(t=>t.stop());return}stream.current=media;
   const recorder=new MediaRecorder(media),chunks=[];rec.current=recorder;
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   recorder.onstop=async()=>{
    pending.current=true;if(alive.current)setBusy(true);media.getTracks().forEach(t=>t.stop());
    let error=false;
    try{await asset('put',uid,'recording',new Blob(chunks,{type:recorder.mimeType}))}catch{error=true}
    window.dispatchEvent(new CustomEvent('sq-recording-saved',{detail:{uid,error}}));
    pending.current=false;if(alive.current){setRecording(false);setBusy(false)}
   };
   recorder.start();setRecording(true);
  }catch(e){stream.current?.getTracks().forEach(t=>t.stop());if(alive.current)setError(e.name==='NotAllowedError'?'Mikrofon ruxsati berilmadi. Brauzer sozlamasini tekshiring.':e.message)}
  finally{pending.current=false;if(alive.current)setBusy(false)}
 };
 return <div className="speaking-recorder">{!readonly&&<button disabled={busy} onClick={recording?()=>{if(rec.current?.state==='recording'){pending.current=true;setBusy(true);rec.current.stop()}}:start}>{recording?<Square/>:<Mic/>}{busy?'Kutilmoqda…':recording?'Yozishni to‘xtatish':'Ovoz yozish'}</button>}{url&&<><audio controls src={url}/><a href={url} download="speaking-recording.webm">Ovozni yuklab olish</a></>}{error&&<p role="alert">{error}</p>}</div>;
}
