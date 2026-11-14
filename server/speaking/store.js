import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {AiError} from './groq.js';
import {isDeepStrictEqual} from 'node:util';
import {networkFailure,speakingFetch} from './transport.js';
export function serverClient(env=process.env,{timeoutMs=6000,fetcher=fetch}={}){const url=env.SUPABASE_URL||env.VITE_SUPABASE_URL,key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new AiError('SERVER_NOT_CONFIGURED','AI bo‘limi uchun serverning Supabase sozlamalari kerak.',503);return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},db:{retry:false},global:{fetch:speakingFetch({fetcher,timeoutMs})}});}
const check=r=>{if(r.error){const m=r.error.message||'';if(networkFailure(r.error))throw new AiError('SPEAKING_NETWORK','Speaking serveri bilan aloqa uzildi. Yozuvingiz saqlanadi; qayta urinib ko‘ring.',503,true);if(/AI_RATE_LIMIT/.test(m))throw new AiError('AI_RATE_LIMIT','AI limiti tugadi. Saqlangan javob bilan keyinroq urinib ko‘ring.',429,true);if(/REVISION_CONFLICT/.test(m))throw new AiError('REVISION_CONFLICT','Boshqa oynada o‘zgarish saqlandi. Sahifani yangilang.',409,true);if(['42P01','42883','PGRST202','PGRST205'].includes(r.error.code))throw new AiError('MIGRATION_REQUIRED','AI Speaking uchun supabase-migration-7.46.sql migratsiyasini bajaring.',503);throw new AiError('SPEAKING_DATABASE','Speaking ma’lumoti saqlanmadi. Keyinroq urinib ko‘ring.',503,true);}return r.data;};
const localJobPrefix='local:';
const parkedUntil='9999-12-31T23:59:59.999Z';
const leaseMs=300000;
const isLocalJob=job=>job.job_key?.startsWith(localJobPrefix)===true;
const jobColumns='id,job_key,kind,target_id,status,attempts,last_error,result_id,created_at,updated_at';
const jobView=({job_key,...row})=>({...row,provider:isLocalJob({job_key})?'local':'groq'});
export class SpeakingStore{
 constructor(db,{local=false}={}){Object.assign(this,{db,local});}
 async read(user,kind,key){return check(await this.db.from('sq_sp_records').select('*').eq('user_id',user).eq('kind',kind).eq('record_key',key).maybeSingle());}
 async byId(user,id,kind){let q=this.db.from('sq_sp_records').select('*').eq('user_id',user).eq('id',id);if(kind)q=q.eq('kind',kind);const r=check(await q.maybeSingle());if(!r)throw new AiError('NOT_FOUND','Bu yozuv topilmadi yoki sizga tegishli emas.',404);return r;}
 async list(user,kind,exam,limit=200){let q=this.db.from('sq_sp_records').select('*').eq('user_id',user).eq('kind',kind).order('created_at',{ascending:false}).limit(limit);if(exam)q=q.eq('exam_mode',exam);return check(await q)||[];}
 async listSessions(user,exam,limit=30){const rows=check(await this.db.from('sq_sp_records').select('id,created_at,status:payload->>status,title:payload->>title,attemptKind:payload->>attemptKind').eq('user_id',user).eq('kind','session').eq('exam_mode',exam).order('created_at',{ascending:false}).limit(limit))||[];return rows.map(row=>({id:row.id,created_at:row.created_at,payload:{status:row.status,title:row.title,attemptKind:row.attemptKind}}));}
 async listSessionAnswers(user,sessionId){
  return check(await this.db.from('sq_sp_records').select('*').eq('user_id',user).eq('kind','answer')
   .eq('parent_id',sessionId).order('created_at',{ascending:false}).limit(500))||[];
 }
 async fingerprints(user,exam){const out=new Set(),prefix='seen-question:';for(let offset=0;;offset+=1000){const rows=check(await this.db.from('sq_sp_records').select('record_key').eq('user_id',user).eq('kind','receipt').eq('exam_mode',exam).like('record_key',prefix+'%').order('id').range(offset,offset+999))||[];for(const row of rows)out.add(row.record_key.slice(prefix.length));if(rows.length<1000)return out;}}
 async listAll(user,kind){const out=[];for(let i=0;;i+=1000){const rows=check(await this.db.from('sq_sp_records').select('*').eq('user_id',user).eq('kind',kind).order('id').range(i,i+999));out.push(...rows);if(rows.length<1000)return out;}}
 async write(user,ops){
  const send=()=>this.db.rpc('sq_sp_write',{p_user:user,p_ops:ops}),result=await send();
  if(!networkFailure(result.error))return check(result);
  // Insert-mode RPCs return the original row on replay, including a turn's
  // trusted deadline. Never recreate a recording clock after a lost response.
  if(ops.every(op=>op.mode==='insert'))return check(await send());
  const stored=[];
  for(let i=0;i<ops.length;i+=20){const batch=ops.slice(i,i+20);stored.push(...(check(await this.db.from('sq_sp_records').select('*').eq('user_id',user).in('kind',[...new Set(batch.map(op=>op.kind))]).in('record_key',batch.map(op=>op.key)))||[]));}
  const rows=ops.map(op=>stored.find(row=>row.kind===op.kind&&row.record_key===op.key));
  if(ops.every((op,i)=>rows[i]&&(op.mode==='insert'||(isDeepStrictEqual(rows[i].payload,JSON.parse(JSON.stringify(op.payload)))&&(op.expectedRevision===undefined||rows[i].revision===op.expectedRevision+1)))))return rows;
  // A guarded batch that did not commit can be replayed once. If another
  // writer advanced a revision, preserve that writer's result instead.
  if(ops.every((op,i)=>op.mode==='insert'||(op.expectedRevision!==undefined&&rows[i]?.revision===op.expectedRevision)))return check(await send());
  return check(result);
 }
 async enqueue(user,kind,target,key){
  if(!this.local){const send=()=>this.db.rpc('sq_sp_enqueue',{p_user:user,p_kind:kind,p_target:target,p_key:key}),result=await send();return check(networkFailure(result.error)?await send():result);}
  // Local jobs stay outside the shared Groq worker's ready queue, even during a local restart.
  const row={user_id:user,kind,target_id:target,job_key:localJobPrefix+key,available_at:parkedUntil,lease_until:new Date().toISOString()};
  const send=()=>this.db.from('sq_sp_jobs').upsert(row,{onConflict:'user_id,job_key',ignoreDuplicates:true}).select('*').maybeSingle();
  const result=await send(),saved=check(networkFailure(result.error)?await send():result);
  return saved||check(await this.db.from('sq_sp_jobs').select('*').eq('user_id',user).eq('job_key',row.job_key).single());
 }
 async jobs(user){const rows=check(await this.db.from('sq_sp_jobs').select(jobColumns).eq('user_id',user).order('created_at',{ascending:false}).limit(20))||[];return rows.map(jobView);}
 async job(user,id){const row=check(await this.db.from('sq_sp_jobs').select(jobColumns).eq('user_id',user).eq('id',id).maybeSingle());if(!row)throw new AiError('NOT_FOUND','Ish topilmadi.',404);return jobView(row);}
 async retry(user,id){
  const job=await this.job(user,id),local=job.provider==='local',now=new Date().toISOString();
  if(local&&!this.local)throw new AiError('LOCAL_AI_REQUIRED','Bu tahlilni localhostdagi Speaking sahifasidan davom ettiring.',409);
  return check(await this.db.from('sq_sp_jobs').update({status:'queued',attempts:0,last_error:null,available_at:local?parkedUntil:now,lease_token:null,lease_until:local?now:null,updated_at:now}).eq('id',id).eq('user_id',user).in('status',['failed','cancelled']).select('id,status').maybeSingle());
 }
 async cancel(user,id){await this.job(user,id);return check(await this.db.from('sq_sp_jobs').update({status:'cancelled',lease_token:null,lease_until:null}).eq('id',id).eq('user_id',user).in('status',['queued','running']).select('id,status').maybeSingle());}
 async reserve(user,metric,amount,userLimit,siteLimit){check(await this.db.rpc('sq_sp_reserve',{p_user:user,p_metric:metric,p_amount:amount,p_user_limit:userLimit,p_site_limit:siteLimit}));}
 async signedUpload(path){return check(await this.db.storage.from('speaking-private').createSignedUploadUrl(path,{upsert:false}));}
 async signedRead(path){return check(await this.db.storage.from('speaking-private').createSignedUrl(path,120));}
 async removeAudio(path){check(await this.db.storage.from('speaking-private').remove([path]));}
 async download(path){return check(await this.db.storage.from('speaking-private').download(path));}
 async deleteData(user){const all=[];let from=0;for(;;){const rows=check(await this.db.from('sq_sp_records').select('payload').eq('user_id',user).eq('kind','audio').order('id').range(from,from+999));all.push(...rows);if(rows.length<1000)break;from+=1000;}check(await this.db.from('sq_sp_jobs').update({status:'cancelled',lease_token:null,lease_until:null}).eq('user_id',user).in('status',['queued','running']));for(const a of all)if(!a.payload.deletedAt)await this.removeAudio(a.payload.path);check(await this.db.from('sq_sp_records').delete().eq('user_id',user));check(await this.db.from('sq_sp_usage').delete().eq('user_id',user));}
 async claim(){return this.local?null:check(await this.db.rpc('sq_sp_claim'));}
 async claimJob(user,id){
  const table=()=>this.db.from('sq_sp_jobs');
  const read=columns=>table().select(columns).eq('id',id).eq('user_id',user).maybeSingle();
  const row=check(await read('job_key,status,attempts,available_at,lease_until,updated_at'));
  if(!row||!['queued','running'].includes(row.status))return null;
  const local=isLocalJob(row);
  if(local&&!this.local)return null;
  const now=Date.now(),updated_at=new Date(now).toISOString();
  const deadline=local?(row.status==='queued'?'lease_until':'updated_at'):(row.status==='queued'?'available_at':'lease_until');
  const readyBefore=local&&row.status==='running'?new Date(now-leaseMs).toISOString():updated_at;
  if(!row[deadline]||Date.parse(row[deadline])>Date.parse(readyBefore))return null;

  const exhausted=row.attempts>=3,token=randomUUID();
  const changes=exhausted
   ?{status:'failed',last_error:'LEASE_EXHAUSTED',lease_token:null,lease_until:null}
   :{status:'running',attempts:row.attempts+1,lease_token:token,lease_until:local?parkedUntil:new Date(now+leaseMs).toISOString()};
  // A polling request can compete with the background worker for the same lease.
  const result=await table().update({...changes,updated_at}).eq('id',id).eq('user_id',user)
   .eq('status',row.status).eq('attempts',row.attempts).lte(deadline,readyBefore).select('*').maybeSingle();
  if(!exhausted&&networkFailure(result.error)){
   const stored=check(await read('*'));
   if(stored?.lease_token===token)return stored;
  }
  const claimed=check(result);
  return exhausted?null:claimed;
 }
 async lease(job,state,error=null,result=null){
  if(!isLocalJob(job))return check(await this.db.rpc('sq_sp_lease',{p_id:job.id,p_token:job.lease_token,p_state:state,p_error:error,p_result:result}));
  const now=Date.now(),heartbeat=state==='heartbeat';
  const backoff=new Date(now+1000*Math.min(180,10*job.attempts**2)).toISOString();
  const changes={status:heartbeat?'running':state,updated_at:new Date(now).toISOString(),last_error:error?.slice(0,80)||null,
   lease_token:heartbeat?job.lease_token:null,lease_until:heartbeat?parkedUntil:state==='queued'?backoff:null,...(result?{result_id:result}:{})};
  return !!check(await this.db.from('sq_sp_jobs').update(changes).eq('id',job.id).eq('user_id',job.user_id)
   .eq('status','running').eq('lease_token',job.lease_token).select('id').maybeSingle());
 }
 async usage(user,job,model,kind,usage={},seconds=0){check(await this.db.from('sq_sp_usage').insert({user_id:user,job_id:job,model,kind,input_tokens:usage.prompt_tokens||0,output_tokens:usage.completion_tokens||0,audio_seconds:Math.ceil(seconds)}));}
}
