import {getSupabase} from '../supabase-sdk.js';

export async function assistantApi(data,signal){
 const {auth}=await getSupabase(),token=await auth.currentUser?.getIdToken();
 if(!token||auth.currentUser?.isAnonymous)throw Object.assign(Error('AI yordamchi uchun hisobga kiring.'),{code:'AUTH_REQUIRED'});
 let response;
 try{response=await fetch('/api/ai-assistant',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(data),signal});}
 catch(error){if(error.name==='AbortError')throw error;throw Error('AI yordamchiga ulanib bo‘lmadi. Savolingiz saqlandi; qayta urinib ko‘ring.');}
 const result=await response.json().catch(()=>null);
 if(!response.ok)throw Object.assign(Error(result?.error||'AI javobi olinmadi. Qayta urinib ko‘ring.'),{code:result?.code,status:response.status,retryable:result?.retryable});
 if(!result||typeof result.answerUz!=='string'||!Array.isArray(result.routeIds)||!Array.isArray(result.questions))throw Error('AI javobi to‘liq olinmadi. Qayta urinib ko‘ring.');
 return result;
}
