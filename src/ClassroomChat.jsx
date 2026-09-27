import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,Flag,MessageCircle,Mic,Send,Shield,Smile,Square,Volume2} from 'lucide-react';
import {openLessonChat,chatInbox,chatMessages,sendChatText,sendChatVoice,chatAudio,blockChat,reportChat,chatReports,moderateChat} from './classroom-service.js';
import './classroom-chat.css';

const emojis=['😀','😊','👍','👏','🎉','❤️','📚','💡','🤔','✅','🙏','👋'];
const fresh=items=>(items||[]).filter(item=>Date.now()-new Date(item.created_at).getTime()<86400000);

function VoiceNote({id,duration}){
 const [url,setUrl]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>()=>{if(url)URL.revokeObjectURL(url)},[url]);
 const listen=async()=>{if(url)return;setBusy(true);try{const data=await chatAudio(id),bytes=Uint8Array.from(atob(data.base64),c=>c.charCodeAt(0));setUrl(URL.createObjectURL(new Blob([bytes],{type:data.mime})))}catch(e){setError(e.message)}finally{setBusy(false)}};
 return <div className="class-voice">{url?<audio controls preload="none" src={url}/>:<button type="button" onClick={listen} disabled={busy}><Volume2 size={17}/>{busy?'Ochilmoqda…':`Ovozni eshitish · ${duration||0} s`}</button>}{error&&<small role="alert">{error}</small>}</div>;
}

export function ChatModeration(){
 const [items,setItems]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState('');
 const refresh=()=>chatReports().then(setItems).catch(e=>setError(e.message));
 useEffect(()=>{refresh()},[]);
 const suspend=async thread=>{setBusy(thread);setError('');try{await moderateChat(thread,true);await refresh()}catch(e){setError(e.message)}finally{setBusy('')}};
 return <section className="class-moderation panel-card"><h2>Chat shikoyatlari</h2><p>Faqat shikoyat qilingan, 24 soat ichidagi xabarlar ko‘rsatiladi. Administrator suhbatni to‘xtata oladi.</p><button onClick={refresh}>Yangilash</button>{error&&<p role="alert">{error}</p>}{!items.length&&<p>Hozircha shikoyat yo‘q.</p>}{items.map(item=><article key={item.id}><small>{new Date(item.reported_at).toLocaleString('uz-UZ')} · {item.kind==='voice'?'Ovozli xabar':'Matn'}</small>{item.kind==='voice'?<VoiceNote id={item.id}/>:<p>{item.body}</p>}<button disabled={busy===item.thread_id} onClick={()=>suspend(item.thread_id)}><Shield size={16}/> Suhbatni to‘xtatish</button></article>)}</section>;
}

export default function ClassroomChat({user,lessonId,onBack,embedded=false}){
 const [threads,setThreads]=useState([]),[threadId,setThreadId]=useState(null),[messages,setMessages]=useState([]);
 const [text,setText]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[emojiOpen,setEmojiOpen]=useState(false),[recording,setRecording]=useState(false),[seconds,setSeconds]=useState(0);
 const recorder=useRef(null),tracks=useRef(null),ticker=useRef(null),recordStarted=useRef(0),listEnd=useRef(null),cancelled=useRef(false);
 const inbox=async()=>{const items=await chatInbox();setThreads(items);return items};
 useEffect(()=>{let alive=true;cancelled.current=false;(async()=>{try{let id=null;if(lessonId&&user.role==='student')id=await openLessonChat(lessonId);const items=await chatInbox();if(alive){setThreads(items);setThreadId(id||items[0]?.id||null)}}catch(e){if(alive)setError(e.message)}})();return()=>{alive=false;cancelled.current=true;clearInterval(ticker.current);if(recorder.current?.state==='recording')recorder.current.stop();tracks.current?.getTracks().forEach(track=>track.stop())}},[lessonId,user.id]);
 useEffect(()=>{if(!threadId){setMessages([]);return}let alive=true;const load=async()=>{if(document.hidden)return;try{const items=await chatMessages(threadId);if(alive)setMessages(fresh(items))}catch(e){if(alive)setError(e.message)}};load();const timer=setInterval(load,5000);return()=>{alive=false;clearInterval(timer)}},[threadId]);
 useEffect(()=>{listEnd.current?.scrollIntoView?.({block:'end'})},[messages.length]);
 const active=threads.find(item=>item.id===threadId),blocked=active?.blocked_by||active?.suspended;
 const submit=async e=>{e.preventDefault();const value=text.trim();if(!value||busy||!threadId)return;setBusy(true);setError('');try{const item=await sendChatText(threadId,value);setText('');setEmojiOpen(false);setMessages(old=>fresh([...old,item]));await inbox()}catch(err){setError(err.message)}finally{setBusy(false)}};
 const stopRecording=()=>{if(recorder.current?.state==='recording')recorder.current.stop();clearInterval(ticker.current);setRecording(false)};
 const startRecording=async()=>{
  setError('');if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setError('Bu brauzer mikrofon yozuvini qo‘llamaydi.');return}
  try{
   const mime=['audio/webm','audio/ogg','audio/mp4'].find(type=>MediaRecorder.isTypeSupported(type));if(!mime)throw Error('Brauzer audio formatini qo‘llamaydi.');
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});tracks.current=stream;
   const chunks=[],media=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:32000});recorder.current=media;recordStarted.current=Date.now();setSeconds(0);
   media.ondataavailable=event=>{if(event.data.size)chunks.push(event.data)};
   media.onstop=async()=>{stream.getTracks().forEach(track=>track.stop());tracks.current=null;clearInterval(ticker.current);if(cancelled.current)return;setRecording(false);const duration=Math.max(1,Math.ceil((Date.now()-recordStarted.current)/1000)),blob=new Blob(chunks,{type:mime});if(blob.size<100||blob.size>262144||duration>15){setError('Ovoz 15 soniyadan yoki 256 KB dan oshmasin.');return}setBusy(true);try{const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob)});const item=await sendChatVoice(threadId,base64,mime,duration);setMessages(old=>fresh([...old,item]));await inbox()}catch(e){setError(e.message)}finally{setBusy(false)}};
   media.start();setRecording(true);ticker.current=setInterval(()=>{const elapsed=Math.ceil((Date.now()-recordStarted.current)/1000);setSeconds(elapsed);if(elapsed>=15)stopRecording()},500);
  }catch(e){tracks.current?.getTracks().forEach(track=>track.stop());setError(e.message)}
 };
 const toggleBlock=async()=>{if(!threadId)return;setBusy(true);try{await blockChat(threadId,!active?.blocked_by);await inbox();setNotice(active?.blocked_by?'Suhbat qayta ochildi.':'Suhbat bloklandi.')}catch(e){setError(e.message)}finally{setBusy(false)}};
 const report=async id=>{try{await reportChat(id);setNotice('Shikoyat administratorga yuborildi.');setMessages(old=>old.map(item=>item.id===id?{...item,reported:true}:item))}catch(e){setError(e.message)}};
 const view=<section className="class-chat" aria-label="Ustoz bilan suhbat"><div className="class-chat-head">{!embedded&&<button className="class-back" onClick={onBack}><ArrowLeft size={18}/> Orqaga</button>}<div><span>O‘QUVCHI · USTOZ</span><h2>Suhbatlar</h2><small>Faqat darsga oid xabarlar. Xabar va ovoz 24 soatdan keyin o‘chadi.</small></div></div>
 {error&&<p className="class-error" role="alert">{error}</p>}{notice&&<p className="class-notice" role="status">{notice}</p>}
 <div className="class-chat-layout"><aside className="class-threads"><h3>Suhbatlar</h3>{threads.map(item=><button key={item.id} className={threadId===item.id?'selected':''} onClick={()=>{setThreadId(item.id);setError('');setNotice('')}}><MessageCircle size={18}/><span><b>{user.role==='student'?item.teacher_name:item.student_name}</b><small>{item.blocked_by||item.suspended?'Bloklangan':new Date(item.last_at).toLocaleString('uz-UZ')}</small></span></button>)}{!threads.length&&<p>{user.role==='student'?'Darslikni ochib, ustozga yozing.':'O‘quvchilardan xabar kelganda shu yerda chiqadi.'}</p>}</aside>
 <div className="class-conversation">{active?<><header><div><b>{user.role==='student'?active.teacher_name:active.student_name}</b><small>Shaxsiy dars suhbati · 24 soat</small></div><button type="button" onClick={toggleBlock} disabled={busy||active.suspended||(active.blocked_by&&active.blocked_by!==user.id)}>{active.blocked_by===user.id?'Blokdan chiqarish':'Bloklash'}</button></header><div className="class-messages" aria-live="polite">{messages.map(message=><article key={message.id} className={message.sender_uid===user.id?'mine':''}><small>{new Date(message.created_at).toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'})}</small>{message.kind==='voice'?<VoiceNote id={message.id} duration={message.duration_seconds}/>:<p>{message.body}</p>}{message.sender_uid!==user.id&&!message.reported&&<button type="button" onClick={()=>report(message.id)} title="Xabar haqida shikoyat"><Flag size={14}/> Shikoyat</button>}</article>)}<span ref={listEnd}/>{!messages.length&&<p className="class-quiet">Suhbat hali boshlanmagan.</p>}</div>{blocked?<p className="class-quiet">Bu suhbat bloklangan.</p>:<form className="class-compose" onSubmit={submit}><div className="class-emoji-wrap"><button type="button" onClick={()=>setEmojiOpen(!emojiOpen)} aria-label="Emoji tanlash"><Smile size={20}/></button>{emojiOpen&&<div className="class-emojis">{emojis.map(emoji=><button key={emoji} type="button" onClick={()=>{setText(value=>(value+emoji).slice(0,800));setEmojiOpen(false)}}>{emoji}</button>)}</div>}</div><input aria-label="Xabar matni" placeholder="Xabar yozing…" maxLength={800} value={text} onChange={e=>setText(e.target.value)} disabled={busy||recording}/><button type="button" aria-label={recording?'Yozishni to‘xtatish':'Ovozli xabar yozish'} onClick={recording?stopRecording:startRecording} disabled={busy}>{recording?<><Square size={18}/>{seconds}s</>:<Mic size={20}/>}</button><button type="submit" disabled={busy||!text.trim()||recording} aria-label="Xabarni yuborish"><Send size={19}/></button></form>}</>:<div className="class-quiet"><MessageCircle/><p>Suhbatni tanlang.</p></div>}</div></div></section>;
 return embedded?view:<main className="class-chat-page">{view}</main>;
}
