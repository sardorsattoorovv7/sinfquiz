import {speakingError} from './copy.js';
const reads=new Set(['home','session','begin_turn','finish_prompt','job','assessment','audio_url']);
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const offline=()=>Object.assign(Error('Speaking serveri bilan aloqa uzildi. Yozuvingiz shu qurilmada saqlanadi; qayta urinib ko‘ring.'),{code:'SPEAKING_NETWORK',retryable:true});

export async function speakingRequest(action,data,token,{signal,fetcher=fetch,pause=delay,timeoutMs=22000}={}){
 for(let attempt=0;;attempt++){
  signal?.throwIfAborted();
  const timeout=AbortSignal.timeout(timeoutMs),requestSignal=signal?AbortSignal.any([signal,timeout]):timeout;
  let response;
  try{response=await fetcher('/api/ai-speaking',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({action,data}),signal:requestSignal});}
  catch(error){if(signal?.aborted)throw error;if(attempt||!reads.has(action))throw offline();await pause(150);continue;}
  const result=await response.json().catch(()=>null);
  if(!response.ok){
   if(!attempt&&reads.has(action)&&[502,503,504].includes(response.status)&&(!result?.code||result.code==='SPEAKING_NETWORK')){await pause(150);continue;}
   throw Object.assign(Error(speakingError(result,'Serverga ulanib bo‘lmadi. Qayta urinib ko‘ring.')),{code:result?.code,status:response.status,retryable:result?.retryable});
  }
  if(!result||typeof result!=='object'||Array.isArray(result))throw offline();
  return result;
 }
}
