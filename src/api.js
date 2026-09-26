import {supabaseReady} from './supabase-sdk.js';
import {supabaseApi,subscribeSupabase} from './supabase-data.js';

let teacherCsrf='',playerCsrf='',raceCsrf='',typingCsrf='';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const timeoutError=()=>Error('Internet sekin yoki aloqa uzildi. Qayta urinib ko‘ring.');
const withTimeout=(promise,ms)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(timeoutError()),ms);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})});
const transient=error=>/internet|aloqa|network|offline|timeout|unavailable|deadline/i.test(error?.message||'')||['unavailable','deadline-exceeded'].includes(error?.code);
export function setTeacherCsrf(value){teacherCsrf=value||''}
export function setPlayerCsrf(value){playerCsrf=value||''}
export function setRaceCsrf(value){raceCsrf=value||''}
export function setTypingCsrf(value){typingCsrf=value||''}
export async function api(path,{method='GET',data,role='teacher'}={}){
 if(typeof navigator!=='undefined'&&navigator.onLine===false)throw Error('Internet aloqasi yo‘q. Ulanishni tekshirib, qayta urinib ko‘ring.');
 if(supabaseReady()){
  const timeout=method==='GET'?10000:18000;
  try{return await withTimeout(supabaseApi(path,{method,data,role}),timeout)}catch(error){
   if(method==='GET'&&transient(error)){await wait(450);return withTimeout(supabaseApi(path,{method,data,role}),timeout)}
   throw error;
  }
 }
 let response;
 try{response=await fetch(path,{method,credentials:'same-origin',headers:method==='GET'?{}:{'Content-Type':'application/json','X-CSRF-Token':role==='player'?playerCsrf:role==='race'?raceCsrf:role==='typing'?typingCsrf:teacherCsrf},...(method!=='GET'?{body:JSON.stringify(data||{})}:{}),signal:AbortSignal.timeout(15000)})}catch{throw Error('Server bilan aloqa yo‘q. Qayta urinib ko‘ring.')}
 let result;try{result=await response.json()}catch{throw Error('Server javobi o‘qilmadi. Sahifani yangilang.')}
 if(!response.ok){const error=Error(result.error||'So‘rov bajarilmadi.');error.status=response.status;throw error}return result;
}

export function subscribeRealtime(handlers){
 if(supabaseReady())return subscribeSupabase(handlers);
 return null;
}
