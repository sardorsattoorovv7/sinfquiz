import {serverClient,SpeakingStore} from '../server/speaking/store.js';
import {SpeakingService,publicSpeakingStatus} from '../server/speaking/service.js';
import {AiError} from '../server/speaking/groq.js';
import {networkFailure} from '../server/speaking/transport.js';
export const config={maxDuration:30};

export function createSpeakingHandler({client=serverClient,service=db=>new SpeakingService(new SpeakingStore(db))}={}){
 return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method==='GET')return res.status(200).json(publicSpeakingStatus(process.env));
  if(req.method!=='POST')return res.status(405).json({error:'Faqat GET/POST.',code:'METHOD'});
  try{
   const origin=req.headers.origin;
   if(origin&&new URL(origin).host!==req.headers.host)throw new AiError('ORIGIN','So‘rov manbasi mos emas.',403);
   const token=/^Bearer\s+(\S+)$/i.exec(req.headers.authorization||'')?.[1];
   if(!token)throw new AiError('AUTH_REQUIRED','AI Speaking uchun hisobga kiring.',401);
   if(!req.body||JSON.stringify(req.body).length>45000)throw new AiError('PAYLOAD','So‘rov hajmi katta.',413);
   const db=client(),identity=await db.auth.getUser(token);
   if(identity.error&&(networkFailure(identity.error)||identity.error.name==='AuthRetryableFetchError'))throw new AiError('SPEAKING_NETWORK','Speaking serveri bilan aloqa uzildi. Qayta urinib ko‘ring.',503,true);
   if(identity.error||!identity.data?.user||identity.data.user.is_anonymous)throw new AiError('AUTH_REQUIRED','Doimiy hisob orqali kiring.',401);
   const {data:profile,error}=await db.from('documents').select('data').eq('collection','profiles').eq('id',identity.data.user.id).maybeSingle();
   if(networkFailure(error))throw new AiError('SPEAKING_NETWORK','Speaking serveri bilan aloqa uzildi. Qayta urinib ko‘ring.',503,true);
   const role=['admin','teacher','student'].includes(profile?.data?.role)?profile.data.role:'student';
   const result=await service(db).run({id:identity.data.user.id,role},req.body.action,req.body.data||{});
   return res.status(200).json(result);
  }catch(error){return res.status(error instanceof AiError?error.status:500).json({error:error instanceof AiError?error.message:'AI so‘rovi bajarilmadi. Saqlangan ishingiz bilan qayta urinib ko‘ring.',code:error instanceof AiError?error.code:'SPEAKING_SERVER',retryable:error.retryable===true});}
 };
}
export default createSpeakingHandler();
