import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadAiEnv} from './ai-check.mjs';
import {usesLocalSpeaking} from '../server/speaking/provider.js';

export function startAiDevelopment({env=process.env,cwd=process.cwd(),viteArgs=[],spawnProcess=spawn,log=console.log,registerSignals=true}={}){
 const children=new Set();let stopping=false,exitCode=0,finished;
 const done=new Promise(resolveDone=>{finished=resolveDone;});
 const signalHandlers=new Map();
 const finish=()=>{if(!children.size){for(const [signal,handler] of signalHandlers)process.removeListener(signal,handler);finished(exitCode);}};
 const stop=(code=0)=>{if(stopping)return;stopping=true;exitCode=code;for(const child of children){try{child.kill('SIGTERM');}catch{}}
  const force=setTimeout(()=>{for(const child of children){try{child.kill('SIGKILL');}catch{}}},4000);force.unref();finish();};
 const launch=(label,path,args=[])=>{
  if(stopping)return null;
  let child;
  try{child=spawnProcess(process.execPath,[resolve(cwd,path),...args],{cwd,env,stdio:'inherit',windowsHide:true});}catch{log(`[AI] ${label} ishga tushmadi. Muhit sozlamalarini tekshiring.`);stop(1);return null;}
  children.add(child);
  child.once('error',()=>{log(`[AI] ${label} ishga tushmadi. Muhit sozlamalarini tekshiring.`);stop(1);});
  child.once('close',code=>{children.delete(child);if(!stopping){log(`[AI] ${label} to‘xtadi.`);stop(Number.isInteger(code)?code:1);}finish();});
  return child;
 };
 if(registerSignals)for(const signal of ['SIGINT','SIGTERM']){const handler=()=>stop(0);signalHandlers.set(signal,handler);process.once(signal,handler);}
 launch('Web server','node_modules/vite/bin/vite.js',viteArgs);
 const serverKey=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
 const workerConfigured=!!serverKey&&!!(env.SUPABASE_URL||env.VITE_SUPABASE_URL);
 const workerStarted=workerConfigured&&!usesLocalSpeaking(env)&&!!launch('Speaking worker','scripts/speaking-worker.mjs');
 if(workerStarted)log('[AI] Web server va AI Speaking worker birga ishga tushmoqda.');
 else if(!workerConfigured)log('[AI] AI yordamchi web serverda ishlaydi. AI Speaking uchun SUPABASE_SECRET_KEY yoki SUPABASE_SERVICE_ROLE_KEY va Supabase manzilini sozlang.');
 else if(usesLocalSpeaking(env))log('[AI] Lokal Speaking topshiriqlarini Vite serveri bajaradi.');
 if(!env.GROQ_API_KEY)log('[AI] GROQ_API_KEY kiritilmagan. AI so‘rovlari uchun server kalitini sozlang.');
 return {children,done,stop,workerStarted};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const {env,warnings}=loadAiEnv();
 for(const warning of warnings)console.log(`[AI] ${warning.code}: ${warning.message}`);
 try{const runtime=startAiDevelopment({env,viteArgs:process.argv.slice(2)});process.exitCode=await runtime.done;}catch{console.error('[AI] AI_DEV_START_FAILED: Web va AI worker ishga tushmadi.');process.exitCode=1;}
}
