import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {requireGroq,structured} from '../server/speaking/groq.js';
import {ffprobePath} from '../server/speaking/audio-tool.js';

const runFile=promisify(execFile);
const configured=value=>typeof value==='string'&&!!value.trim()&&!/^(replace|your[_ -]|changeme|example)/i.test(value.trim());
const normalUrl=value=>String(value||'').trim().replace(/\/+$/,'');
const validUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/'&&!!u.hostname;}catch{return false;}};
const both=['assistant','speaking'];

// Node keeps existing environment variables. Loading local first gives it
// precedence over .env, while externally supplied variables remain highest.
export function loadAiEnv({cwd=process.cwd(),loadEnvFile=process.loadEnvFile.bind(process)}={}){
 const warnings=[];
 for(const file of ['.env.local','.env']){
  try{loadEnvFile(resolve(cwd,file));}catch(error){if(error.code!=='ENOENT')warnings.push({code:'ENV_FILE_INVALID',message:`${file} sozlamalari o‘qilmadi.`});}
 }
 return {env:process.env,warnings};
}

export async function checkAiRuntime({env=process.env,fetcher=fetch,probe=runFile,offline=false,speaking=false,timeoutMs=12000}={}){
 timeoutMs=Number.isFinite(timeoutMs)?Math.min(30000,Math.max(1000,timeoutMs)):12000;
 const checks=[];
 const add=(id,status,code,message,requiredFor=both)=>checks.push({id,status,code,message,requiredFor});
 const url=normalUrl(env.SUPABASE_URL||env.VITE_SUPABASE_URL),browserUrl=normalUrl(env.VITE_SUPABASE_URL),anon=env.VITE_SUPABASE_ANON_KEY||env.SUPABASE_ANON_KEY;
 const service=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
 let groq;
 try{groq=requireGroq(env);add('groqConfig','ready','GROQ_CONFIGURED','Groq server kaliti sozlangan.');}catch{add('groqConfig','blocked','GROQ_NOT_CONFIGURED','GROQ_API_KEY va Groq server manzilini tekshiring.');}
 const urlOk=validUrl(url)&&validUrl(browserUrl)&&url===browserUrl;
 add('supabaseUrl',urlOk?'ready':'blocked',urlOk?'SUPABASE_URL_CONFIGURED':'SUPABASE_URL_INVALID',urlOk?'Supabase server va brauzer manzillari mos.':'VITE_SUPABASE_URL ni tekshiring; SUPABASE_URL berilgan bo‘lsa, ular mos bo‘lsin.');
 const anonOk=configured(anon)&&configured(env.VITE_SUPABASE_ANON_KEY)&&env.VITE_SUPABASE_ANON_KEY.length>40;
 add('supabaseAnonKey',anonOk?'ready':'blocked',anonOk?'SUPABASE_ANON_KEY_CONFIGURED':'SUPABASE_ANON_KEY_MISSING',anonOk?'Supabase ochiq autentifikatsiya kaliti sozlangan.':'VITE_SUPABASE_ANON_KEY ni kiriting.');
 const serviceOk=configured(service);
 add('supabaseServiceKey',serviceOk?'ready':'blocked',serviceOk?'SUPABASE_SERVICE_KEY_CONFIGURED':'SUPABASE_SERVICE_KEY_MISSING',serviceOk?'Supabase server kaliti sozlangan.':'Speaking uchun SUPABASE_SECRET_KEY yoki SUPABASE_SERVICE_ROLE_KEY kerak.',['speaking']);
 const request=async(path,key)=>{
  const response=await fetcher(url+path,{method:'GET',headers:{apikey:key,...(!key.startsWith('sb_')?{Authorization:'Bearer '+key}:{})},signal:AbortSignal.timeout(timeoutMs),redirect:'error'});
  if(!response.ok){const error=new Error('Runtime request failed');error.status=response.status;throw error;}
  return response.json();
 };
 const work=[];
 if(!groq)add('groq','skipped','GROQ_NOT_CONFIGURED','Groq so‘rovi sozlama kutilgani uchun bajarilmadi.');
 else if(offline)add('groq','configured','OFFLINE_NOT_VERIFIED','Groq tarmoq so‘rovi bajarilmadi.');
 else work.push((async()=>{try{
  const schema={type:'object',properties:{answerUz:{type:'string'}},required:['answerUz'],additionalProperties:false};
  const result=await structured('Return a short Uzbek greeting in answerUz. Return only the supplied JSON schema.',{request:'Salom'},schema,{env,fetcher,model:groq.practice,maxTokens:512,totalTimeoutMs:timeoutMs,maxAttempts:1});
  if(!result.value.answerUz.trim())throw Error('Empty answer');
  add('groq','ready','GROQ_LIVE_OK','Groq haqiqiy so‘rov va JSON tekshiruvidan o‘tdi.');
 }catch(error){const code=/^(GROQ|AI)_[A-Z0-9_]{1,48}$/.test(error.code||'')?error.code:'GROQ_CHECK_FAILED';add('groq','blocked',code,'Groq bilan jonli aloqa tasdiqlanmadi.');}})());
 if(!urlOk||!anonOk)add('supabaseAuth','skipped','SUPABASE_AUTH_CONFIG_REQUIRED','Autentifikatsiya sozlamalari to‘ldirilishi kerak.');
 else if(offline)add('supabaseAuth','configured','OFFLINE_NOT_VERIFIED','Supabase autentifikatsiyasi tarmoqda tekshirilmadi.');
 else work.push((async()=>{try{const data=await request('/auth/v1/settings',anon);if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid settings');add('supabaseAuth','ready','SUPABASE_AUTH_OK','Supabase autentifikatsiya xizmati javob berdi.');}catch{add('supabaseAuth','blocked','SUPABASE_AUTH_UNAVAILABLE','Supabase ochiq kaliti yoki autentifikatsiya aloqasini tekshiring.');}})());
 for(const [id,path] of [['speakingRecords','/rest/v1/sq_sp_records?select=id&limit=0'],['speakingJobs','/rest/v1/sq_sp_jobs?select=id&limit=0'],['speakingStorage','/storage/v1/bucket/speaking-private']]){
  if(!urlOk||!serviceOk){add(id,'skipped',!serviceOk?'SUPABASE_SERVICE_KEY_MISSING':'SUPABASE_URL_INVALID','Speaking bazasi uchun server sozlamalari kerak.',['speaking']);continue;}
  if(offline){add(id,'configured','OFFLINE_NOT_VERIFIED','Speaking migratsiyasi va storage tarmoqda tekshirilmadi.',['speaking']);continue;}
  work.push((async()=>{try{
   const data=await request(path,service);
   if(id==='speakingStorage'){if(data?.id!=='speaking-private'||data.public!==false){add(id,'blocked','SPEAKING_STORAGE_INVALID','speaking-private bucket mavjud va private bo‘lishi kerak.',['speaking']);return;}}
   else if(!Array.isArray(data))throw Error('Invalid table response');
   add(id,'ready',id==='speakingStorage'?'SPEAKING_STORAGE_OK':'SPEAKING_MIGRATION_OK',id==='speakingStorage'?'Speaking private audio storage tayyor.':'Speaking migratsiyasi jadvali mavjud.',['speaking']);
  }catch(error){add(id,'blocked',[401,403].includes(error.status)?'SUPABASE_SERVICE_KEY_REJECTED':'SPEAKING_MIGRATION_REQUIRED','Server kaliti va supabase-migration-7.46.sql migratsiyasini tekshiring.',['speaking']);}})());
 }
 work.push((async()=>{try{const result=await probe(ffprobePath(env),['-version'],{timeout:5000,maxBuffer:16384,windowsHide:true});if(!/^ffprobe version\s/m.test(String(result.stdout||'')))throw Error('Invalid binary');add('ffprobe','ready','FFPROBE_OK','Audio tekshirish dasturi tayyor.',['speaking']);}catch{add('ffprobe','blocked','FFPROBE_MISSING','ffprobe o‘rnating yoki SPEAKING_FFPROBE_PATH ni kiriting.',['speaking']);}})());
 await Promise.all(work);
 const order=['groqConfig','groq','supabaseUrl','supabaseAnonKey','supabaseAuth','supabaseServiceKey','speakingRecords','speakingJobs','speakingStorage','ffprobe'];checks.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
 const passes=feature=>checks.filter(c=>c.requiredFor.includes(feature)).every(c=>['ready','configured'].includes(c.status));
 const assistantConfigured=passes('assistant'),speakingConfigured=passes('speaking');
 return {checks,offline,assistantConfigured,speakingConfigured,assistantReady:!offline&&assistantConfigured,speakingReady:!offline&&speakingConfigured,exitCode:(speaking?speakingConfigured:assistantConfigured)?0:1};
}

export function formatAiCheck(result){
 const labels={ready:'OK',configured:'SOZLANGAN',blocked:'KERAK',skipped:'KUTILMOQDA'};
 const lines=result.checks.map(c=>`[${labels[c.status]}] ${c.code}: ${c.message}`);
 if(result.offline)lines.push('Offline: tashqi xizmatlar tasdiqlanmadi.');
 lines.push(`AI yordamchi: ${(result.offline?result.assistantConfigured:result.assistantReady)?result.offline?'sozlamalar yetarli':'tayyor':'sozlash kerak'}.`);
 lines.push(`AI Speaking: ${(result.offline?result.speakingConfigured:result.speakingReady)?result.offline?'sozlamalar yetarli':'server talablari tayyor; worker ishga tushishi kerak':'sozlash kerak'}.`);
 return lines.join('\n');
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const {env,warnings}=loadAiEnv();
 for(const warning of warnings)console.log(`[KERAK] ${warning.code}: ${warning.message}`);
 try{const result=await checkAiRuntime({env,offline:process.argv.includes('--offline'),speaking:process.argv.includes('--speaking')});console.log(formatAiCheck(result));process.exitCode=warnings.length?1:result.exitCode;}catch{console.error('[KERAK] AI_CHECK_FAILED: AI tekshiruvi yakunlanmadi.');process.exitCode=1;}
}
