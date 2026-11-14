import {spawn} from 'node:child_process';
import {localProcessEnv,speakingProvider,usesLocalSpeaking} from './provider.js';

export function attachLocalModel(server,env=process.env){
 const executable=env.SPEAKING_LOCAL_LLM_PATH,weights=env.SPEAKING_LOCAL_LLM_WEIGHTS;
 if(!usesLocalSpeaking(env)||!executable||!weights||!server.httpServer)return;
 let child,closed=false;
 const logger=server.config.logger;
 server.httpServer.once('listening',async()=>{
  try{
   const provider=speakingProvider(env),endpoint=new URL(provider.base);
   const running=await fetch(endpoint.origin+'/health',{signal:AbortSignal.timeout(1500),redirect:'error'}).catch(()=>null);
   if(closed||running)return;
   child=spawn(executable,[
    '--model',weights,'--alias',provider.assessment,'--host',endpoint.hostname.replace(/^\[|\]$/g,''),
    '--port',endpoint.port||'80','--ctx-size','8192','--parallel','1','--threads','4','--threads-batch','4',
    '--n-gpu-layers','0','--reasoning','off','--no-webui','--no-warmup',
   ],{env:localProcessEnv(),stdio:'ignore',windowsHide:true});
   child.once('error',()=>logger.error('[Speaking] Lokal Qwen xizmati ishga tushmadi.'));
   child.once('exit',code=>{if(!closed&&code!==0)logger.error('[Speaking] Lokal Qwen xizmati to‘xtadi.');});
  }catch{logger.error('[Speaking] Lokal Qwen sozlamalarini tekshiring.');}
 });
 server.httpServer.once('close',()=>{closed=true;child?.kill();});
}
