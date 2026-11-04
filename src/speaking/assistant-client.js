import {getSupabase} from '../supabase-sdk.js';
import {speakingError} from './copy.js';

function requestBody(data){
 const payload={...data};
 if(Array.isArray(data.history))payload.history=data.history.slice(-6);
 if(Array.isArray(data.learning))payload.learning=data.learning.slice(-1).map(report=>({subjectUz:report.subjectUz,topicUz:report.topicUz,items:report.items.map(item=>({question:item.question.slice(0,120),skillUz:item.skillUz.slice(0,60),difficulty:item.difficulty,chosen:item.chosen,expected:item.expected}))}));
 const encode=()=>JSON.stringify(payload);
 let body=encode();
 while(new TextEncoder().encode(body).byteLength>19000&&payload.history?.length){payload.history.splice(0,2);body=encode();}
 return body;
}

export async function assistantApi(data,signal){
 const {auth}=await getSupabase(),token=await auth.currentUser?.getIdToken();
 if(!token||auth.currentUser?.isAnonymous)throw Object.assign(Error('AI yordamchi uchun hisobga kiring.'),{code:'AUTH_REQUIRED'});
 let response;
 try{response=await fetch('/api/ai-assistant',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:requestBody(data),signal});}
 catch(error){if(error.name==='AbortError')throw error;throw Error('AI yordamchiga ulanib bo‘lmadi. Savolingiz saqlandi; qayta urinib ko‘ring.');}
 const result=await response.json().catch(()=>null);
 if(!response.ok)throw Object.assign(Error(speakingError(result,'AI javobi olinmadi. Qayta urinib ko‘ring.')),{code:result?.code,status:response.status,retryable:result?.retryable});
 if(!result||typeof result.answerUz!=='string'||!Array.isArray(result.routeIds)||!Array.isArray(result.questions))throw Error('AI javobi to‘liq olinmadi. Qayta urinib ko‘ring.');
 return result;
}
