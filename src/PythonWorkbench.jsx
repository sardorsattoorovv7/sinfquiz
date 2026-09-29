import React,{useEffect,useRef,useState} from 'react';
import {Code2,Download,Play,RotateCcw} from 'lucide-react';
import {pythonCourse} from '../data/python-course.js';
import {readPythonDraft,savePythonDraft,clearPythonDraft} from './python-drafts.js';
import {runPythonIsolated,downloadPython} from './python-runner.js';
import './python-workbench.css';

export default function PythonWorkbench({ownerId,taskId,initialCode='',onChange}){
 const first=()=>readPythonDraft(ownerId,taskId)||{code:initialCode,input:'',output:''};
 const [draft,setDraft]=useState(first),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');
 const controller=useRef(null),latest=useRef(draft);
 useEffect(()=>{const timer=setTimeout(()=>onChange?.(JSON.stringify({code:latest.current.code,output:latest.current.output})),0);return()=>clearTimeout(timer)},[ownerId,taskId]);
 useEffect(()=>{latest.current=draft;const timer=setTimeout(()=>{if(!savePythonDraft(ownerId,taskId,draft))setError('Bu brauzerda saqlab bo‘lmadi. Kodni .py fayl qilib oling.')},550);return()=>clearTimeout(timer)},[ownerId,taskId,draft]);
 useEffect(()=>()=>{controller.current?.abort();savePythonDraft(ownerId,taskId,latest.current)},[ownerId,taskId]);
 const change=next=>{setDraft(next);latest.current=next;onChange?.(JSON.stringify({code:next.code,output:next.output}));setError('')};
 const run=async()=>{
  if(busy)return;setBusy(true);setError('');setStatus('Muhit tayyorlanmoqda…');
  controller.current=new AbortController();
  try{const output=await runPythonIsolated(draft.code,draft.input,{signal:controller.current.signal,onStatus:setStatus});change({...latest.current,output});setStatus('Bajarildi')}
  catch(cause){setError(cause.message);setStatus('')}
  finally{controller.current=null;setBusy(false)}
 };
 const reset=()=>{controller.current?.abort();clearPythonDraft(ownerId,taskId);change({code:initialCode,input:'',output:''});setStatus('')};
 return <section className="py-workbench"><div className="py-workbench-head"><div><Code2 size={19}/><b>Python muharriri</b></div><small>Shu qurilmada 52 soat saqlanadi{draft.savedAt?` · Oxirgi yozuv ${new Date(draft.savedAt).toLocaleString('uz-UZ')}`:''}</small></div>
  <label>Kod<textarea aria-label="Python kodi" spellCheck="false" value={draft.code} maxLength={8000} onChange={event=>change({...draft,code:event.target.value,output:''})} placeholder="print('Salom, dunyo!')"/></label>
  <label>input() uchun qiymatlar <small>(har biri alohida qatorda)</small><textarea aria-label="Python input qiymatlari" spellCheck="false" value={draft.input} maxLength={2000} onChange={event=>change({...draft,input:event.target.value,output:''})} placeholder="12"/></label>
  <div className="py-workbench-actions"><button type="button" className="btn btn-primary" disabled={busy||!draft.code.trim()} onClick={run}><Play size={17}/> {busy?'Ishlayapti…':'Kodni ishga tushirish'}</button><button type="button" className="btn btn-outline" disabled={!draft.code} onClick={()=>downloadPython(draft.code,taskId)}><Download size={17}/> .py yuklash</button><button type="button" className="btn btn-ghost" disabled={busy} onClick={reset}><RotateCcw size={16}/> Tozalash</button></div>
  {status&&<p role="status" className="py-status">{status}</p>}{error&&<p role="alert" className="form-error">{error}</p>}
  <div className="py-output"><b>Natija</b><pre aria-label="Python natijasi">{draft.output||'Kod ishlatilgach natija shu yerda ko‘rinadi.'}</pre></div>
  <p className="py-note">Kod brauzerdagi ajratilgan muhitda ishlaydi. 6 soniyadan uzoq ishlaydigan kod to‘xtatiladi; serverda kod bajarilmaydi. Fayl yoki internetdan foydalanadigan dasturlar bu mashq uchun mo‘ljallanmagan.</p>
 </section>;
}

export function PythonPractice({ownerId}){
 const [slug,setSlug]=useState(pythonCourse[0].slug);
 const lesson=pythonCourse.find(item=>item.slug===slug)||pythonCourse[0];
 return <section className="py-practice"><header><small>AMALIY PYTHON</small><h2>Kodni o‘zingiz yozib sinang</h2><p>Dars tanlang, namunani o‘zgartiring, natijani ko‘ring. Ishingiz shu brauzerda 52 soat davomida ochiladi.</p></header><label>Mavzu<select aria-label="Python mavzusi" value={slug} onChange={event=>setSlug(event.target.value)}>{pythonCourse.map((item,index)=><option key={item.slug} value={item.slug}>{index+1}. {item.title}</option>)}</select></label><div className="py-task"><b>Amaliy vazifa</b><p>{lesson.practice}</p></div><PythonWorkbench key={slug} ownerId={ownerId} taskId={slug} initialCode={lesson.code}/></section>
}
