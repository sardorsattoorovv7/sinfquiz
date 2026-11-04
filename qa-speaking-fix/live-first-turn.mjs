// Tests only a newly created, disposable account. No existing user is queried.
import {randomUUID,createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {loadAiEnv} from '../scripts/ai-check.mjs';
import {serverClient,SpeakingStore} from '../server/speaking/store.js';
import {SpeakingService} from '../server/speaking/service.js';
import {profile} from '../tests/speaking-fixtures.js';
import {speakingRequest} from '../src/speaking/request.js';

loadAiEnv();
const transport=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 const path=new URL(url).pathname;
 try{const response=await transport(url,options);console.log(JSON.stringify({request:path,method:options?.method||'GET',status:response.status}));return response;}
 catch(error){console.log(JSON.stringify({request:path,method:options?.method||'GET',code:error.code,cause:error.cause?.code,name:error.name}));throw error;}
};
const db=serverClient(process.env),rpc=db.rpc.bind(db);
db.rpc=async(name,args)=>{
 const result=await rpc(name,args);
 if(result.error)console.log(JSON.stringify({rpc:name,code:result.error.code,message:result.error.message}));
 return result;
};
let createdId=null,audioPath=null;
const email=`speaking-qa-${randomUUID()}@example.invalid`,password=randomUUID()+randomUUID(),checks={};
try{
 const account=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name:'Disposable Speaking QA'}});
 if(account.error)throw account.error;
 createdId=account.data.user.id;
 const service=new SpeakingService(new SpeakingStore(db)),actor={id:createdId,role:'student'};
 await service.run(actor,'profile',{examMode:'ielts',profile:profile('ielts')});
 const mock=await service.run(actor,'start_mock',{examMode:'ielts',consent:true,token:randomUUID()});
 const resumed=await service.run(actor,'session',{id:mock.session.id});
 Object.assign(checks,{profileSaved:true,mockOpened:true,firstTurn:!!mock.turn,resumed:resumed.turn?.id===mock.turn?.id,deadlineUnchanged:resumed.turn?.payload.deadline===mock.turn?.payload.deadline});
 if(process.argv.includes('--http')){
  const base=(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL).replace(/\/+$/,'');
  const signed=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:process.env.VITE_SUPABASE_ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(12000)}),identity=await signed.json();
  if(!signed.ok||!identity.access_token)throw Error('Disposable QA sign-in failed');
  const run=(action,data)=>speakingRequest(action,data,identity.access_token,{fetcher:(path,options)=>fetch('http://localhost:5173'+path,options)});
  const current=await run('session',{id:mock.session.id});
  checks.httpAuthenticatedSession=current.turn.id===mock.turn.id;
  const home=await run('home',{examMode:'ielts'});checks.thinHomeSessionSummary=home.sessions.some(s=>s.id===mock.session.id&&s.kind==='baseline'&&s.title===mock.session.title);
  const bytes=Buffer.alloc(44+16000*2);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVE',8);bytes.write('fmt ',12);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(16000,24);bytes.writeUInt32LE(32000,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(bytes.length-44,40);
  await run('stop_turn',{id:mock.turn.id,sha256:createHash('sha256').update(bytes).digest('hex'),technicalStatus:'recorded'});
  const asset=await run('prepare_audio',{parentKind:'session',parentId:mock.session.id,bytes:bytes.length,mime:'audio/wav',token:randomUUID()});audioPath=asset.path;
  const upload=await db.storage.from('speaking-private').uploadToSignedUrl(asset.path,asset.token,bytes,{contentType:'audio/wav'});if(upload.error)throw upload.error;
  checks.privateAudioUploaded=true;
  const next=await run('submit_answer',{sessionId:mock.session.id,questionId:mock.session.current.id,audioId:asset.assetId});
  checks.answerSavedOnce=next.answers.length===1;checks.nextQuestionOpened=next.session.current.id!==mock.session.current.id&&!!next.turn;
  const duplicate=await run('submit_answer',{sessionId:mock.session.id,questionId:mock.session.current.id,audioId:asset.assetId});checks.duplicateDidNotAdvance=duplicate.answers.length===1&&duplicate.session.current.id===next.session.current.id;
 }
 console.log(JSON.stringify(checks));
}catch(error){console.log(JSON.stringify({code:error.code||'QA_FAILED',message:error.message}));process.exitCode=1;}
finally{
 if(createdId){
  if(audioPath){const removed=await db.storage.from('speaking-private').remove([audioPath]);checks.disposableAudioDeleted=!removed.error;if(removed.error)process.exitCode=1;}
  await db.from('sq_sp_budget').delete().eq('actor',createdId);
  const result=await db.auth.admin.deleteUser(createdId);
  console.log(JSON.stringify({disposableAccountDeleted:!result.error}));
  checks.disposableAccountDeleted=!result.error;
  if(result.error)process.exitCode=1;
 }
 writeFileSync(new URL('./live-result.json',import.meta.url),JSON.stringify(checks,null,2)+'\n');
}
