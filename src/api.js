import {firebaseReady} from './firebase-sdk.js';
import {firebaseApi,subscribeFirebase} from './firebase-data.js';

let teacherCsrf='',playerCsrf='',raceCsrf='',typingCsrf='';
export function setTeacherCsrf(value){teacherCsrf=value||''}
export function setPlayerCsrf(value){playerCsrf=value||''}
export function setRaceCsrf(value){raceCsrf=value||''}
export function setTypingCsrf(value){typingCsrf=value||''}
export async function api(path,{method='GET',data,role='teacher'}={}){
 if(firebaseReady())return firebaseApi(path,{method,data,role});
 let response;
 try{response=await fetch(path,{method,credentials:'same-origin',headers:method==='GET'?{}:{'Content-Type':'application/json','X-CSRF-Token':role==='player'?playerCsrf:role==='race'?raceCsrf:role==='typing'?typingCsrf:teacherCsrf},...(method!=='GET'?{body:JSON.stringify(data||{})}:{}),signal:AbortSignal.timeout(15000)})}catch{throw Error('Server bilan aloqa yo‘q. Qayta urinib ko‘ring.')}
 let result;try{result=await response.json()}catch{throw Error('Server javobi o‘qilmadi. Sahifani yangilang.')}
 if(!response.ok){const error=Error(result.error||'So‘rov bajarilmadi.');error.status=response.status;throw error}return result;
}

export function subscribeRealtime(handlers){
 if(firebaseReady())return subscribeFirebase(handlers);
 return null;
}
