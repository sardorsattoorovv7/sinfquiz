import {ensureAnonymous,getSupabase} from '../supabase-sdk.js';
export const fixture=()=>globalThis.__SINFQUIZ_LEGACY_TEST__||globalThis.window?.__SINFQUIZ_LEGACY_TEST__;
export async function course(action,p={}){
 const body=['home','lesson','teacher'].includes(action)?p:{...p,token:p.token||crypto.randomUUID()};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
 try{
  if(fixture()){const r=await fetch('/api/english/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});const d=await r.json();if(!r.ok||d.error)throw Object.assign(Error(d.error||'So‘rov bajarilmadi.'),{code:d.code});return d}
  const sdk=await ensureAnonymous(),{data,error}=await sdk.db.rpc('sq_en',{p_action:action,p:body}).abortSignal(controller.signal);
  if(error){if(['42P01','42883','PGRST202','PGRST205'].includes(error.code))throw Error('Ingliz tili darsi uchun supabase-migration-7.23.sql faylini SQL Editor’da RUN qiling.');throw Object.assign(Error(error.message),{code:error.code})}if(data?.error)throw Error(data.error);return data;
 }catch(e){if(e.name==='AbortError')throw Error('So‘rov kechikdi. Saqlangan ishingiz saqlanadi; qayta urinib ko‘ring.');if(/Anonymous sign-ins are disabled/.test(e.message))throw Error('Mavjud hisobdan kiring yoki Supabase Auth’da Anonymous Sign-Ins usulini yoqing.');throw e}finally{clearTimeout(timer)}
}
export async function uploadAudio(workId,blob){
 if(!blob?.size||blob.size>12*1024*1024)throw Error('Yozuv hajmi 12 MB dan oshmasin.');
 const type=blob.type.split(';')[0],ext={'audio/mp4':'m4a','audio/ogg':'ogg','audio/wav':'wav','audio/webm':'webm','video/webm':'webm'}[type];
 if(!ext)throw Error('Yozuv formati qo‘llanmaydi. WebM, MP4, Ogg yoki WAV ishlating.');
 if(!/^[0-9a-f-]{36}$/i.test(workId))throw Error('Yozuv uchun dars yoki tekshiruv tanlanmagan.');
 const sha256=await audioDigest(blob);
 if(fixture()){const r=await fetch('/api/english-audio/upload/'+workId,{method:'POST',headers:{'Content-Type':type},body:blob});const data=await r.json();if(!r.ok)throw Error(data.error||'Yozuv yuborilmadi.');return {...data,sha256}}
 const sdk=await ensureAnonymous();
 const path=`${sdk.auth.currentUser.uid}/${workId}/${crypto.randomUUID()}.${ext}`;
 const file=blob.type===type?blob:new Blob([blob],{type});
 const {error}=await sdk.db.storage.from('english-recordings').upload(path,file,{contentType:type,upsert:false});if(error)throw Error(error.message);return {mode:'recording',path,bytes:blob.size,type,sha256};
}
export async function audioDigest(blob){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()));return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
export async function audioUrl(path){if(fixture()){const r=await fetch('/api/english-audio/url',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path})}),data=await r.json();if(!r.ok)throw Error(data.error||'Yozuv ochilmadi.');return data.url}const sdk=await getSupabase(),{data,error}=await sdk.db.storage.from('english-recordings').createSignedUrl(path,600);if(error)throw Error(error.message);return data.signedUrl}
export const norm=s=>String(s??'').replace(/[‘’`ʻʼ]/g,"'").replace(/\s+/g,' ').trim().toLowerCase().replace(/[.!?]+$/,'');
const openDb=()=>new Promise((resolve,reject)=>{let settled=false;const r=indexedDB.open('sinfquiz-english-recordings',1),timer=setTimeout(()=>{settled=true;reject(Error('Brauzer audio xotirasi javob bermadi.'))},5000);r.onupgradeneeded=()=>r.result.createObjectStore('clips');r.onerror=()=>{clearTimeout(timer);reject(r.error)};r.onsuccess=()=>{clearTimeout(timer);if(settled)r.result.close();else resolve(r.result)}});
export async function clip(key,blob){const db=await openDb();return new Promise((resolve,reject)=>{let result;const tx=db.transaction('clips',blob===undefined?'readonly':'readwrite'),s=tx.objectStore('clips'),r=blob===undefined?s.get(key):blob===null?s.delete(key):s.put(blob,key);r.onsuccess=()=>{result=r.result};tx.oncomplete=()=>{db.close();resolve(result)};tx.onabort=()=>{db.close();reject(tx.error||Error('Yozuv brauzer xotirasiga saqlanmadi.'))};tx.onerror=()=>{db.close();reject(tx.error||r.error)}})}
