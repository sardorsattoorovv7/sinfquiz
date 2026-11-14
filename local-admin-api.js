// The Vite dev server does not execute Vercel's /api functions by itself.
// Keep this bridge server-side and only active during local development.
import resetPassword from './api/admin-reset-password.js';
import telegramAuth from './api/telegram-auth.js';
import {createSpeakingHandler} from './api/ai-speaking.js';
import aiAssistant from './api/ai-assistant.js';
import {serverClient,SpeakingStore} from './server/speaking/store.js';
import {SpeakingWorker} from './server/speaking/worker.js';
import {usesLocalSpeaking} from './server/speaking/provider.js';
import {attachLocalModel} from './server/speaking/local-runtime.js';
export function localAdminApi(){
 return {name:'sinfquiz-local-admin-api',apply:'serve',configureServer(server){
  attachLocalModel(server);
  const scheduledJobs=new Set();
  let processing=Promise.resolve();
  const aiSpeaking=createSpeakingHandler({onJob({userId,jobId}){
   if(scheduledJobs.has(jobId))return;
   scheduledJobs.add(jobId);
   processing=processing.then(async()=>{
    const store=new SpeakingStore(serverClient(process.env,{timeoutMs:45000}),{local:usesLocalSpeaking()});
    await new SpeakingWorker(store).once({userId,jobId});
   }).catch(error=>{
    server.config.logger.error(`Lokal Speaking worker xatosi (${error.code||'WORKER_FAILED'})`);
   }).finally(()=>scheduledJobs.delete(jobId));
  }});
  for(const [path,handler] of [['/api/admin-reset-password',resetPassword],['/api/telegram-auth',telegramAuth],['/api/ai-speaking',aiSpeaking],['/api/ai-assistant',aiAssistant]])server.middlewares.use(path,async(req,res,next)=>{
   if(req.url!=='/'&&req.url!=='')return next();
   res.setHeader('Content-Type','application/json; charset=utf-8');
   res.status=function(code){res.statusCode=code;return res};
   res.json=function(body){res.end(JSON.stringify(body));return res};
   try{
    let raw='';
    for await(const chunk of req){
     raw+=chunk;
     if(Buffer.byteLength(raw)> (path.startsWith('/api/ai-')?45000:16_384)){res.status(413).json({error:'So‘rov hajmi juda katta.'});return}
    }
    try{req.body=raw?JSON.parse(raw):{}}catch{res.status(400).json({error:'So‘rov formati noto‘g‘ri.'});return}
    await handler(req,res);
   }catch(error){
    server.ssrFixStacktrace?.(error);
    server.config.logger.error(`Lokal API xatosi (${path}): ${error.message}`);
    if(!res.writableEnded)res.status(500).json({error:'Lokal API ishlamadi. Terminaldagi xatoni tekshiring.'});
   }
  });
 }};
}
