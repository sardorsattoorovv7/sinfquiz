// Run with Node22.12+: node --env-file=.env.local scripts/speaking-worker.mjs
// --once processes one durable job; --cleanup performs the retention sweep.
import {serverClient,SpeakingStore} from '../server/speaking/store.js';
import {SpeakingWorker} from '../server/speaking/worker.js';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';

export async function runSpeakingWorker(worker,{once=false,cleanup=false,now=Date.now,sleep=ms=>delay(ms),log=value=>console.log(JSON.stringify(value)),isStopped=()=>false}={}){
 if(isStopped())return 0;
 if(cleanup){try{const result=await worker.cleanup();if(result)log(result);return 0;}catch{log({code:'RETENTION_RETRY'});return 1;}}
 let lastCleanup=-Infinity,failures=0,retentionFailed=false;
 while(!isStopped()){
  if(now()-lastCleanup>=600000){lastCleanup=now();try{await worker.cleanup();retentionFailed=false;}catch{retentionFailed=true;log({code:'RETENTION_RETRY'});}}
  if(isStopped())break;
  try{
   const result=await worker.once();failures=0;
   if(!result.idle)log(result);
   if(once)return retentionFailed||['failed','queued'].includes(result.status)?1:0;
   if(result.idle&&!isStopped())await sleep(2000);
  }catch{
   if(once){log({code:'WORKER_ONCE_FAILED'});return 1;}
   const retryInMs=Math.min(30000,2000*2**Math.min(failures++,4));
   log({code:'WORKER_RETRY',retryInMs});
   if(!isStopped())await sleep(retryInMs);
  }
 }
 return 0;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const controller=new AbortController(),stop=()=>controller.abort();
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,stop);
 try{
  const worker=new SpeakingWorker(new SpeakingStore(serverClient()));
  process.exitCode=await runSpeakingWorker(worker,{once:process.argv.includes('--once'),cleanup:process.argv.includes('--cleanup'),isStopped:()=>controller.signal.aborted,sleep:ms=>delay(ms,undefined,{signal:controller.signal}).catch(error=>{if(error.name!=='AbortError')throw error;})});
 }catch{console.error(JSON.stringify({code:'WORKER_START_FAILED'}));process.exitCode=1;}
 finally{for(const signal of ['SIGINT','SIGTERM'])process.removeListener(signal,stop);}
}
