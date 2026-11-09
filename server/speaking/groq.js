import {validateSchema} from './schema.js';
export class AiError extends Error{constructor(code,message,status=400,retryable=false){super(message);Object.assign(this,{code,status,retryable});}}
export function groqConfig(env=process.env){const base=(env.GROQ_BASE_URL||'https://api.groq.com/openai/v1').replace(/\/+$/,'');if(base!=='https://api.groq.com/openai/v1')throw new AiError('GROQ_BASE_URL','Groq server manzili noto‘g‘ri.',503);return {key:env.GROQ_API_KEY||'',base,assessment:env.GROQ_ASSESSMENT_MODEL||'openai/gpt-oss-120b',practice:env.GROQ_PRACTICE_MODEL||'openai/gpt-oss-20b',transcription:env.GROQ_TRANSCRIPTION_MODEL||'whisper-large-v3',practiceTranscription:env.GROQ_PRACTICE_TRANSCRIPTION_MODEL||'whisper-large-v3-turbo'};}
export function requireGroq(env=process.env){const c=groqConfig(env);if(!c.key||c.key==='replace_with_new_server_side_key')throw new AiError('GROQ_NOT_CONFIGURED','AI xizmati hali administrator tomonidan sozlanmagan. Javoblaringizni saqlab, keyin qayta urinishingiz mumkin.',503);return c;}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function groqRequest(path,body,{fetcher=fetch,env=process.env,sleep=pause,timeoutMs=45000,totalTimeoutMs=Infinity,maxAttempts=3}={}){
 const c=requireGroq(env),started=Date.now(),attempts=Math.min(3,Math.max(1,Math.floor(maxAttempts)||1));
 const remaining=()=>totalTimeoutMs-(Date.now()-started);
 const timeout=()=>new AiError('GROQ_TIMEOUT','AI javobini kutish vaqti tugadi. Qayta urinib ko‘ring.',504,true);
 for(let attempt=0;attempt<attempts;attempt++){
  if(remaining()<=0)throw timeout();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.min(timeoutMs,remaining()));let retry,delay=0;
  try{
   const response=await fetcher(c.base+path,{method:'POST',headers:{Authorization:'Bearer '+c.key,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body instanceof FormData?body:JSON.stringify(body),signal:controller.signal,redirect:'error'});
   if(response.ok)return await response.json();
   retry=response.status===429||response.status>=500;
   if(response.status===400){const detail=await response.json().catch(()=>null);retry=detail?.error?.code==='json_validate_failed';}
   const header=response.headers.get('retry-after'),raw=header===null?NaN:Number(header);
   delay=Number.isFinite(raw)?Math.min(30000,Math.max(0,raw*1000)):Math.min(12000,1000*2**attempt+Math.random()*300);
   if(!retry||attempt===attempts-1)throw new AiError('GROQ_'+response.status,response.status===401?'AI provayder kaliti serverda tekshirilsin.':'AI provayder javob bermadi. Saqlangan javob bilan qayta urinib ko‘ring.',503,retry);
  }catch(error){
   if(error instanceof AiError)throw error;
   if(remaining()<=0)throw timeout();
   if(attempt===attempts-1)throw new AiError('GROQ_NETWORK','AI bilan aloqa uzildi. Javob saqlangan, qayta urinib ko‘ring.',503,true);
   retry=true;delay=500*2**attempt;
  }finally{clearTimeout(timer);}
  if(retry){if(delay>=remaining())throw timeout();await sleep(delay);}
 }
 throw new AiError('GROQ_FAILED','AI so‘rovi tugamadi.',503,true);
}
export async function structured(prompt,data,schema,{model,env=process.env,fetcher=fetch,messages=[{role:'user',content:JSON.stringify(data)}],maxTokens=7000,totalTimeoutMs=Infinity,maxAttempts=3}={}){
 const chosenModel=model||requireGroq(env).assessment;
 const result=await groqRequest('/chat/completions',{
  model:chosenModel,
  messages:[{role:'system',content:prompt},...messages],
  temperature:.2,
  max_completion_tokens:maxTokens,
  reasoning_effort:'low',
  response_format:{type:'json_schema',json_schema:{name:'sinfquiz_response',strict:true,schema}},
 },{env,fetcher,totalTimeoutMs,maxAttempts});
 let value;
 try{
  value=JSON.parse(result.choices?.[0]?.message?.content||'');
  validateSchema(value,schema);
 }catch{
  throw new AiError('AI_INVALID_OUTPUT','AI javobi tekshiruvdan o‘tmadi. Saqlangan javob bilan qayta urinib ko‘ring.',502,true);
 }
 return {value,usage:result.usage||{},model:chosenModel};
}
export async function transcribe(bytes,{mime,name,practice=false,env=process.env,fetcher=fetch}={}){const c=requireGroq(env),form=new FormData(),model=practice?c.practiceTranscription:c.transcription;form.set('file',new Blob([bytes],{type:mime}),name);form.set('model',model);form.set('language','en');form.set('response_format','verbose_json');form.append('timestamp_granularities[]','segment');form.append('timestamp_granularities[]','word');form.set('temperature','0');const data=await groqRequest('/audio/transcriptions',form,{env,fetcher,timeoutMs:120000});if(typeof data.text!=='string'||data.text.length>60000)throw new AiError('ASR_INVALID','Transkript to‘liq olinmadi.',502,true);return {text:data.text,words:Array.isArray(data.words)?data.words:[],segments:Array.isArray(data.segments)?data.segments:[],model,uncertain:!data.text.trim()||(data.segments||[]).some(s=>Number(s.no_speech_prob)>.6||Number(s.avg_logprob)<-1)};}
