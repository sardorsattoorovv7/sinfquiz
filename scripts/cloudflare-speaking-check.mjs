import {readFile,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateAssessment,sniffAudio} from '../server/speaking/domain.js';
import {AiError} from '../server/speaking/groq.js';
import {localFeedback} from '../server/speaking/local-feedback.js';
import {validateSchema} from '../server/speaking/schema.js';
import {loadAiEnv} from './ai-check.mjs';

const speechModel='@cf/openai/whisper-large-v3-turbo';
const feedbackModel='@cf/openai/gpt-oss-20b';
const maxAudioBytes=2*1024*1024;

export async function checkCloudflareSpeaking(audio,{env=process.env,fetcher=fetch}={}){
 const account=env.CLOUDFLARE_ACCOUNT_ID?.trim(),token=env.CLOUDFLARE_API_TOKEN?.trim();
 if(!/^[a-f0-9]{32}$/i.test(account||'')||!token){
  throw new AiError('CLOUDFLARE_CONFIG','CLOUDFLARE_ACCOUNT_ID va CLOUDFLARE_API_TOKEN ni .env.local fayliga kiriting.');
 }
 if(!audio?.byteLength||audio.byteLength>maxAudioBytes||!['audio/wav','audio/webm','audio/mpeg'].some(mime=>sniffAudio(audio,mime))){
  throw new AiError('TRIAL_AUDIO','Sinov uchun 2 MB gacha WAV, WebM yoki MP3 namuna kerak.');
 }
 const base=`https://api.cloudflare.com/client/v4/accounts/${account}/ai`;
 async function request(path,input){
  let response;
  try{
   response=await fetcher(base+path,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify(input),signal:AbortSignal.timeout(60000),redirect:'error'});
  }catch{throw new AiError('CLOUDFLARE_NETWORK','Cloudflare bilan aloqa uzildi yoki kutish vaqti tugadi.');}
  if(response.status===401||response.status===403)throw new AiError('CLOUDFLARE_AUTH','Cloudflare hisob IDsi va Workers AI tokenini tekshiring.');
  if(response.status===429)throw new AiError('CLOUDFLARE_LIMIT','Cloudflare AI kvotasi yoki so‘rov limiti tugadi.');
  const body=await response.json().catch(()=>null);
  if(!response.ok||!body||body.success===false){
   const issue=Number.isSafeInteger(body?.errors?.[0]?.code)?` (${body.errors[0].code})`:'';
   throw new AiError('CLOUDFLARE_REQUEST',`Cloudflare so‘rovi bajarilmadi. HTTP ${response.status}${issue}`);
  }
  return body.result??body;
 }

 const started=performance.now();
 const speech=await request(`/run/${speechModel}`,{audio:Buffer.from(audio).toString('base64'),language:'en',task:'transcribe',vad_filter:true});
 const speechMs=Math.round(performance.now()-started);
 const transcript=typeof speech.text==='string'?speech.text.trim():'';
 if(transcript.split(/\s+/u).filter(Boolean).length<3)throw new AiError('TRIAL_TRANSCRIPT','Sinov audiosidan tahlil uchun yetarli matn olinmadi.');
 const answer={id:'sample-answer',questionId:'sample-question',status:'answered',sourceKind:'audio',transcript,
  question:{prompt:'What do you enjoy doing with your friends?',taskPoints:[]}};
 const feedbackStarted=performance.now();
 const draft=await localFeedback([answer],async(prompt,data,schema,maxTokens)=>{
  const result=await request('/v1/chat/completions',{model:feedbackModel,stream:false,temperature:.1,reasoning_effort:'low',
   max_tokens:maxTokens+350,messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify(data)}],
   response_format:{type:'json_schema',json_schema:{name:'speaking_trial',strict:true,schema}}});
  try{
   const value=JSON.parse(result.choices?.[0]?.message?.content||'');
   validateSchema(value,schema);
   return value;
  }catch{throw new AiError('TRIAL_REPORT_FORMAT','Cloudflare javobi Speaking hisobotining JSON sxemasiga mos kelmadi.');}
 });
 const report=validateAssessment(draft,[answer],{examMode:'ielts',rubricVersion:'cloudflare-trial',kind:'practice',practice:true});
 return {speechModel,feedbackModel,wordCount:report.wordCount,answers:report.answerAnalyses.length,
  corrections:report.answerAnalyses.flatMap(item=>item.errors).length,speechMs,feedbackMs:Math.round(performance.now()-feedbackStarted)};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  loadAiEnv();
  const path=process.argv[2]||(process.env.LOCALAPPDATA&&join(process.env.LOCALAPPDATA,'SinfQuizAI','smoke','english-test.wav'));
  if(!path||(await stat(path)).size>maxAudioBytes)throw new AiError('TRIAL_AUDIO','2 MB gacha sintetik audio namunasining fayl yo‘lini kiriting.');
  const result=await checkCloudflareSpeaking(await readFile(path));
  console.log(JSON.stringify({status:'CLOUDFLARE_SPEAKING_OK',...result}));
 }catch(error){
  console.error(error instanceof AiError?`${error.code} ${error.message}`:'CLOUDFLARE_TRIAL_FAILED Sinov audio fayli yoki server sozlamalarini tekshiring.');
  process.exitCode=1;
 }
}
