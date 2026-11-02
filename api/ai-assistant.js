import {createClient} from '@supabase/supabase-js';
import {AiError,requireGroq} from '../server/speaking/groq.js';
import {assistantInput,assistantModes,createAssistantLimiter,runAssistant} from '../server/assistant/service.js';
import {SpeakingStore,serverClient} from '../server/speaking/store.js';

export const config={maxDuration:30};

export async function authenticateAssistant(token,env=process.env){
 const url=env.SUPABASE_URL||env.VITE_SUPABASE_URL;
 const key=env.SUPABASE_ANON_KEY||env.VITE_SUPABASE_ANON_KEY||env.SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new AiError('SERVER_NOT_CONFIGURED','AI yordamchi uchun Supabase kirish sozlamalari kerak.',503);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:'Bearer '+token},fetch:(url,options={})=>fetch(url,{...options,signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(5000)]):AbortSignal.timeout(5000)})}});
 const identity=await db.auth.getUser(token),user=identity.data?.user;
 if(identity.error||!user||user.is_anonymous)throw new AiError('AUTH_REQUIRED','Doimiy hisob orqali qayta kiring.',401);
 const {data:profile}=await db.from('documents').select('data').eq('collection','profiles').eq('id',user.id).maybeSingle().abortSignal(AbortSignal.timeout(2500));
 return {id:user.id,role:['admin','teacher','student'].includes(profile?.data?.role)?profile.data.role:'student'};
}

export async function reserveAssistantQuota(user,env=process.env,now=Date.now(),{storeFactory=env=>new SpeakingStore(serverClient(env,{timeoutMs:2500}))}={}){
 // The text assistant also works on installations without the Speaking schema.
 // Once shared quota storage exists, its limits and failures must be respected.
 if(!env.SUPABASE_SECRET_KEY&&!env.SUPABASE_SERVICE_ROLE_KEY)return false;
 try{
  const store=storeFactory(env);
  await store.reserve(user,'assistant-calls',1,80,2000);
  await store.reserve(user,'assistant-minute:'+Math.floor(now/60000),1,10,3000);
  return true;
 }catch(error){
  if(error instanceof AiError&&['MIGRATION_REQUIRED','SERVER_NOT_CONFIGURED'].includes(error.code))return false;
  throw error;
 }
}

export function createAssistantHandler({env=process.env,authenticate=authenticateAssistant,respond=runAssistant,reserve=reserveAssistantQuota,limiter=createAssistantLimiter(),now=()=>Date.now()}={}){
 return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method==='GET'){
   let providerConfigured=false;try{requireGroq(env);providerConfigured=true;}catch{}
   return res.status(200).json({providerConfigured,modes:assistantModes});
  }
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Faqat GET/POST.',code:'METHOD'});}
  try{
   if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{throw new AiError('ORIGIN','So‘rov manbasi mos emas.',403);}
    if(!['https:','http:'].includes(origin.protocol)||origin.host!==req.headers.host)throw new AiError('ORIGIN','So‘rov manbasi mos emas.',403);
   }
   const token=/^Bearer\s+(\S+)$/i.exec(req.headers.authorization||'')?.[1];
   if(!token)throw new AiError('AUTH_REQUIRED','AI yordamchi uchun hisobga kiring.',401);
   if(!req.body||Buffer.byteLength(JSON.stringify(req.body),'utf8')>20000)throw new AiError('PAYLOAD','So‘rov hajmi katta.',413);
   // Validate cheap, untrusted input before authentication or paid AI calls.
   assistantInput(req.body);
   const actor=await authenticate(token,env);
   if(!actor?.id)throw new AiError('AUTH_REQUIRED','AI yordamchi uchun hisobga kiring.',401);
   const timestamp=now();
   limiter(actor.id,timestamp);
   await reserve(actor.id,env,timestamp);
   const result=await respond(req.body,actor,{env});
   return res.status(200).json(result);
  }catch(error){
   const known=error instanceof AiError;
   if(known&&error.status===429)res.setHeader('Retry-After','60');
   return res.status(known?error.status:503).json({error:known?error.message:'AI yordamchi bilan aloqa uzildi. Qayta urinib ko‘ring.',code:known?error.code:'ASSISTANT_SERVER',retryable:known?error.retryable===true:true});
  }
 };
}

export default createAssistantHandler();
