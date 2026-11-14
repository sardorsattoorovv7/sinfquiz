import {execFile} from 'node:child_process';
import {mkdtemp,readFile,rmdir,unlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {promisify} from 'node:util';
import {AiError,requireGroq,structured,transcribe} from './groq.js';
import {validateSchema} from './schema.js';

const runFile=promisify(execFile);
export const usesLocalSpeaking=(env=process.env)=>env.SPEAKING_PROVIDER==='local';
export const localProcessEnv=()=>Object.fromEntries(['PATH','SystemRoot','WINDIR','TEMP','TMP']
 .filter(name=>process.env[name]).map(name=>[name,process.env[name]]));
export function assertSpeakingProvider(record,env){
 if(record?.payload?.processingProvider==='local'&&!usesLocalSpeaking(env)){
  throw new AiError('LOCAL_AI_REQUIRED','Bu javobni localhostdagi Speaking sahifasida tahlil qiling.',409);
 }
}

export function speakingProvider(env=process.env){
 if(!usesLocalSpeaking(env))return requireGroq(env);
 let url;
 try{url=new URL(env.SPEAKING_LOCAL_LLM_URL||'http://127.0.0.1:17863');}catch{}
 const whisperPath=env.SPEAKING_LOCAL_WHISPER_PATH,whisperModel=env.SPEAKING_LOCAL_WHISPER_MODEL;
 if(!url||url.protocol!=='http:'||!['127.0.0.1','[::1]'].includes(url.hostname)||url.pathname!=='/'||url.username||url.password||url.search||url.hash||!whisperPath||!whisperModel){
  throw new AiError('LOCAL_AI_CONFIG','Lokal Speaking uchun model manzili va Whisper fayllarini sozlang.',503);
 }
 const assessment=env.SPEAKING_LOCAL_LLM_MODEL||'qwen3.5-4b-local';
 return {base:url.origin,assessment,practice:assessment,whisperPath,whisperModel,
  ffmpegPath:env.SPEAKING_LOCAL_FFMPEG_PATH||'ffmpeg',transcription:'whisper-small.en-local'};
}

export async function speakingStructured(prompt,data,schema,options={}){
 const {env=process.env,fetcher=fetch,maxTokens=7000,totalTimeoutMs=Infinity}=options;
 if(!usesLocalSpeaking(env))return structured(prompt,data,schema,options);
 const config=speakingProvider(env),model=options.model||config.assessment;
 const signal=AbortSignal.timeout(Math.max(1,Math.min(900000,totalTimeoutMs)));
 let response;
 try{
  response=await fetcher(config.base+'/v1/chat/completions',{
   method:'POST',headers:{'Content-Type':'application/json'},signal,redirect:'error',
   body:JSON.stringify({model,messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify(data)}],
    stream:false,temperature:.1,max_tokens:Math.min(maxTokens,4500),reasoning_effort:'none',chat_template_kwargs:{enable_thinking:false},
    response_format:{type:'json_schema',json_schema:{name:'sinfquiz_response',strict:true,schema}},
   }),
  });
 }catch{
  throw new AiError(signal.aborted?'LOCAL_AI_TIMEOUT':'LOCAL_AI_OFFLINE',
   signal.aborted?'Lokal model javobi kechikdi. Saqlangan javob bilan qayta urinib ko‘ring.':'Lokal Qwen xizmati ishga tushmagan.',503,true);
 }
 if(!response.ok)throw new AiError('LOCAL_AI_REQUEST','Lokal model so‘rovni bajara olmadi.',503,response.status>=500);
 try{
  const result=await response.json(),value=JSON.parse(result.choices?.[0]?.message?.content||'');
  validateSchema(value,schema);
  return {value,usage:result.usage||{},model};
 }catch{
  throw new AiError('AI_INVALID_OUTPUT','Lokal model javobi tekshiruvdan o‘tmadi. Saqlangan javob bilan qayta urinib ko‘ring.',502,true);
 }
}

export async function speakingTranscribe(bytes,options={}){
 const {env=process.env,run=runFile,seconds}=options;
 if(!usesLocalSpeaking(env))return transcribe(bytes,options);
 const config=speakingProvider(env),folder=await mkdtemp(join(tmpdir(),'sq-local-speaking-'));
 const clip=join(folder,'clip'),wav=join(folder,'clip.wav'),output=join(folder,'result');
 const processOptions={env:localProcessEnv(),windowsHide:true,maxBuffer:1048576};
 try{
  await writeFile(clip,bytes,{mode:0o600});
  await run(config.ffmpegPath,['-nostdin','-hide_banner','-loglevel','error','-protocol_whitelist','file,pipe','-i',clip,'-vn','-ac','1','-ar','16000','-c:a','pcm_s16le',wav],{...processOptions,timeout:30000});
  // Whisper encodes 50 audio positions per second. Short clips need only that window plus padding.
  const shortClip=Number.isFinite(seconds)&&seconds>0&&seconds<25;
  const decodeOptions=shortClip?['-ac',String(Math.max(400,Math.ceil(seconds*50)+100)),'-bo','1','-bs','1']:[];
  await run(config.whisperPath,['-m',config.whisperModel,'-f',wav,'-l','en','-t','4','-ng','-np','-ojf','-of',output,...decodeOptions],{...processOptions,timeout:240000});
  const result=JSON.parse(await readFile(output+'.json','utf8'));
  const segments=result.transcription.map(segment=>({
   start:segment.offsets.from/1000,end:segment.offsets.to/1000,text:segment.text.trim(),
  }));
  const text=segments.map(segment=>segment.text).filter(Boolean).join(' ');
  const confidence=result.transcription.flatMap(segment=>segment.tokens||[])
   .filter(token=>Number.isFinite(token.p)&&!/^\[_/.test(token.text||''));
  const uncertain=!text||confidence.some(token=>token.p<.2);
  return {text,segments,words:[],model:config.transcription,uncertain};
 }catch(error){
  if(error.code==='ENOENT')throw new AiError('LOCAL_ASR_CONFIG','Whisper yoki FFmpeg fayli topilmadi.',503);
  if(error.killed)throw new AiError('LOCAL_ASR_TIMEOUT','Lokal transkripsiya vaqti tugadi.',504,true);
  throw new AiError('LOCAL_ASR_FAILED','Lokal Whisper yozuvni matnga o‘gira olmadi.',502);
 }finally{
  await Promise.allSettled([clip,wav,output+'.json'].map(file=>unlink(file)));
  await rmdir(folder).catch(()=>{});
 }
}
