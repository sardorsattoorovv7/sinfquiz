import {createHash,randomUUID} from 'node:crypto';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {assessmentSchema,roadmapSchema,vocabSchema,guideSchema} from './schema.js';
import {assessmentPrompt,practicePrompt,roadmapPrompt,vocabularyPrompt,guidePrompt,PROMPT_VERSION} from './prompts.js';
import {AiError} from './groq.js';
import {assertSpeakingProvider,speakingProvider,speakingStructured,speakingTranscribe,usesLocalSpeaking} from './provider.js';
import {validateAssessment,validateRoadmap,scheduledDays,localDate,addDays,policy,sniffAudio,choosePriorities} from './domain.js';
import {rubricFor,RUBRIC_POLICY} from './rubrics.js';
import {speakingImageAssets} from './questions.js';
import {allowedFeatures} from '../../src/speaking/features.js';
import {IELTS_MOCK_PART_LIMITS,IELTS_MOCK_QUESTION_LIMIT} from '../../src/speaking/format-limits.js';
import {ffprobePath} from './audio-tool.js';
import {alignAssessmentEvidence} from './evidence.js';
import {roadmapFromReport} from './roadmap.js';
import {localFeedback} from './local-feedback.js';
const allBaseline=rows=>rows.some(a=>a.payload.attemptKind==='baseline');
const execFileAsync=promisify(execFile),op=(kind,key,payload,extra={})=>({kind,key,payload,...extra});
const transcriptionConcurrency=3;
const roadmapFallbackErrors=new Set(['AI_RATE_LIMIT','GROQ_429','AI_INVALID_OUTPUT','AI_PLAN','AI_PLAN_EVIDENCE','AI_PLAN_TIME','AI_TASK','AI_DRILLS']);

function sessionAnswerSample(session,rows){
 const positions=new Map((session.payload.queue||[]).map((question,index)=>[question.id,index]));
 const ordered=[...rows].sort((a,b)=>
  (positions.get(a.payload.questionId)??Infinity)-(positions.get(b.payload.questionId)??Infinity)
  ||a.created_at.localeCompare(b.created_at)
 );
 if(session.exam_mode!=='ielts'||ordered.length<=IELTS_MOCK_QUESTION_LIMIT)return ordered;
 const bestEvidence=(a,b)=>
  Number(b.payload.status==='answered')-Number(a.payload.status==='answered')
  ||Number(b.payload.question?.taskType==='cue_card')-Number(a.payload.question?.taskType==='cue_card')
  ||(b.payload.elapsedSeconds||0)-(a.payload.elapsedSeconds||0);
 const chosen=new Set();
 for(const [section,limit] of Object.entries(IELTS_MOCK_PART_LIMITS)){
  const candidates=ordered.filter(answer=>answer.payload.question?.section===section);
  for(const answer of candidates.sort(bestEvidence).slice(0,limit))chosen.add(answer.id);
 }
 return chosen.size?ordered.filter(answer=>chosen.has(answer.id)):[...ordered].sort(bestEvidence).slice(0,IELTS_MOCK_QUESTION_LIMIT);
}
export async function probeAudio(bytes,mime,{env=process.env}={}){if(!sniffAudio(bytes,mime))throw new AiError('AUDIO_SIGNATURE','Fayl haqiqiy qo‘llanadigan audio emas.',422);const folder=await mkdtemp(join(tmpdir(),'sq-speaking-'));try{const path=join(folder,'clip');await writeFile(path,bytes,{mode:0o600});const result=await execFileAsync(ffprobePath(env),['-v','error','-show_entries','format=duration:stream=codec_type:packet=pts_time,duration_time','-of','json',path],{timeout:12000,maxBuffer:4194304,windowsHide:true});const d=JSON.parse(result.stdout),seconds=Number(d.format?.duration)||Math.max(0,...(d.packets||[]).map(p=>(Number(p.pts_time)||0)+(Number(p.duration_time)||0)));if(!d.streams?.some(s=>s.codec_type==='audio')||!Number.isFinite(seconds)||seconds<.4||seconds>310)throw Error('invalid');return seconds;}catch(e){throw new AiError(e.code==='ENOENT'?'AUDIO_PROBE_NOT_CONFIGURED':'AUDIO_INVALID',e.code==='ENOENT'?'Audio workerda ffprobe o‘rnatilishi kerak.':'Audio ochilmadi yoki davomiyligi noto‘g‘ri.',503,false);}finally{await rm(folder,{recursive:true,force:true});}}
export class SpeakingWorker{
 constructor(repo,{env=process.env,fetcher=fetch,now=()=>new Date(),probe=probeAudio}={}){Object.assign(this,{repo,env,fetcher,now,probe});}
 budgetedFetch(job,{tokens=0,seconds=0}){
  const limit=(name,fallback)=>Math.max(1,Number(this.env[name])||fallback);
  // Groq invokes this for each HTTP attempt, including a retry after throttling.
  return async (url,options)=>{
   if(tokens)await this.repo.reserve(job.user_id,'reserved-tokens',tokens,limit('SPEAKING_USER_TOKEN_BUDGET',250000),limit('SPEAKING_SITE_TOKEN_BUDGET',5000000));
   if(seconds)await this.repo.reserve(job.user_id,'audio-seconds',Math.ceil(seconds),limit('SPEAKING_USER_AUDIO_SECONDS',5400),limit('SPEAKING_SITE_AUDIO_SECONDS',100000));
   await this.repo.reserve(job.user_id,'groq-calls',1,limit('SPEAKING_USER_AI_CALLS',80),limit('SPEAKING_SITE_AI_CALLS',2000));
   return this.fetcher(url,options);
  };
 }
 async ask(job,prompt,data,schema,model,maxTokens){
  const fetcher=usesLocalSpeaking(this.env)?this.fetcher:this.budgetedFetch(job,{tokens:Math.ceil(JSON.stringify(data).length/3)+maxTokens});
  const result=await speakingStructured(prompt,data,schema,{env:this.env,fetcher,model,maxTokens});
  await this.repo.usage(job.user_id,job.id,result.model,'chat',result.usage);
  return result.value;
 }
 async assertLease(job){if(!await this.repo.lease(job,'heartbeat'))throw new AiError('JOB_CANCELLED','Ish bekor qilingan.',409,false);}
 async transcript(job,answer){assertSpeakingProvider(answer,this.env);const old=await this.repo.read(job.user_id,'transcript','original:'+answer.id);if(old){assertSpeakingProvider(old,this.env);return old;}let payload={answerId:answer.id,questionId:answer.payload.questionId,text:answer.payload.text||'',words:[],segments:[],durationVerified:false,durationSeconds:null,uncertain:false,revisionKind:'original',modelId:null,processingProvider:usesLocalSpeaking(this.env)?'local':'groq'};
  if(answer.payload.status!=='answered')payload={...payload,text:'',uncertain:true};
  else if(answer.payload.sourceKind==='audio'){
   const asset=await this.repo.byId(job.user_id,answer.payload.audioId,'audio');if(asset.payload.deletedAt||asset.payload.expiresAt<this.now().toISOString())throw new AiError('AUDIO_EXPIRED','Audio o‘chirilgan. Original saqlangan transkript bo‘lsa, undan foydalaning.',410);
   const blob=await this.repo.download(asset.payload.path),bytes=new Uint8Array(await blob.arrayBuffer());if(bytes.byteLength!==asset.payload.bytes||bytes.byteLength>20*1024*1024)throw new AiError('AUDIO_SIZE','Audio hajmi mos kelmadi.',422);const digest=createHash('sha256').update(bytes).digest('hex');if(answer.payload.sha256&&digest!==answer.payload.sha256)throw new AiError('AUDIO_HASH','Yozuv topshirilgan originalga mos emas.',422);
   const seconds=await this.probe(bytes,asset.payload.mime,{env:this.env}),question=answer.payload.question||{};if(question.responseMaxSeconds&&seconds>question.responseMaxSeconds+5)throw new AiError('AUDIO_TOO_LONG','Audio savol vaqtidan oshib ketgan. Texnik holatni tekshiring.',422);
   const fetcher=usesLocalSpeaking(this.env)?this.fetcher:this.budgetedFetch(job,{seconds});
   const result=await speakingTranscribe(bytes,{mime:asset.payload.mime,name:asset.payload.path.split('/').at(-1),practice:answer.payload.attemptKind!=='baseline',env:this.env,fetcher,seconds});await this.repo.usage(job.user_id,job.id,result.model,'transcription',{},seconds);payload={...payload,...result,modelId:result.model,durationVerified:true,durationSeconds:seconds,uncertain:result.uncertain||(!result.text.trim())};await this.assertLease(job);await this.repo.write(job.user_id,[op('audio',asset.record_key,{...asset.payload,verified:true,durationSeconds:seconds,sha256:digest},{expectedRevision:asset.revision})]);
  }
  await this.assertLease(job);return (await this.repo.write(job.user_id,[op('transcript','original:'+answer.id,payload,{exam:answer.exam_mode,parentId:answer.id,mode:'insert'})]))[0];
 }
 async assess(job,target,practice){const key='assessment:'+target.id,previous=await this.repo.read(job.user_id,'assessment',key);let answerRows,submittedCount=0;
  if(target.kind==='transcript'){const answer=await this.repo.byId(job.user_id,target.parent_id,'answer');answerRows=[{answer,transcript:target}];}
  else if(target.kind==='session'){
   const all=this.repo.listSessionAnswers?await this.repo.listSessionAnswers(job.user_id,target.id):await this.repo.list(job.user_id,'answer',target.exam_mode,500);
   const rows=all.filter(answer=>answer.parent_id===target.id);
   if(!rows.length)throw new AiError('EMPTY_MOCK','Mockda javob yo‘q.',422);
   submittedCount=rows.length;
   const sample=sessionAnswerSample(target,rows);
   answerRows=[];
   const concurrency=usesLocalSpeaking(this.env)?1:transcriptionConcurrency;
   for(let start=0;start<sample.length;start+=concurrency){
    const batch=await Promise.allSettled(sample.slice(start,start+concurrency).map(async answer=>({answer,transcript:await this.transcript(job,answer)})));
    const failed=batch.find(item=>item.status==='rejected');
    if(failed)throw failed.reason;
    answerRows.push(...batch.map(item=>item.value));
   }
  }
  else answerRows=[{answer:target,transcript:await this.transcript(job,target)}];
  const answers=answerRows.map(({answer:a,transcript:t})=>({id:a.id,questionId:a.payload.questionId,question:{...a.payload.question,verifiedImages:(a.payload.question.imageIds||[]).map(id=>speakingImageAssets.find(x=>x.id===id)).filter(Boolean).map(x=>({caption:x.caption,visibleObjects:x.visibleObjects}))},transcript:t.payload.text,status:a.payload.status,attemptKind:target.kind==='transcript'?'transcript_revision':a.payload.attemptKind,durationVerified:t.payload.durationVerified,durationSeconds:t.payload.durationSeconds,uncertain:t.payload.uncertain||t.payload.needsReview===true,sourceKind:a.payload.sourceKind,isFirstAttempt:a.payload.isFirstAttempt,hasSeenPrompt:a.payload.hasSeenPrompt,hasSeenModelAnswer:a.payload.hasSeenModelAnswer}));
  const writtenInterview=target.kind==='session'&&answers.some(answer=>answer.sourceKind==='typed'&&answer.status==='answered');
  const mode=target.exam_mode,kind=writtenInterview?'written_mock':target.kind==='session'?target.payload.attemptKind:target.kind==='transcript'?'transcript_revision':target.payload.attemptKind,rubric=answers[0].question.formatVersion+':'+RUBRIC_POLICY;
  const local=usesLocalSpeaking(this.env);
  const [knownErrors,knownVocabulary]=local?[[],[]]:await Promise.all([this.repo.list(job.user_id,'error',mode,30),this.repo.list(job.user_id,'vocabulary',mode,30)]);const targetCategories=knownErrors.map(e=>e.payload.category),vocabularyIds=knownVocabulary.map(e=>e.id);
  const data={rubric:rubricFor(mode),targetCategories,vocabulary:knownVocabulary.map(v=>({id:v.id,phraseEn:v.payload.phraseEn})),examMode:mode,rubricVersion:rubric,answers,assessmentConstraints:{writtenInterview,pronunciationAvailable:false,officialScoreMappingAvailable:false,overallBand:null,scaledScore75:null,minimumWordsForProvisionalTextEstimate:150,practiceMaxErrors:practice?2:20}};
  const hasEvidence=answers.some(answer=>answer.transcript.trim().split(/\s+/).filter(Boolean).length>=(writtenInterview?1:3));
  if(!hasEvidence)throw new AiError('EMPTY_RECORDING','Javobda tahlil uchun yetarli matn olinmadi.',422);
  const provider=speakingProvider(this.env),model=practice?provider.practice:provider.assessment;
  let assessment=previous?.payload;
  if(!assessment){
   const value=local?await localFeedback(answers,(prompt,input,schema,maxTokens)=>this.ask(job,prompt,input,schema,model,maxTokens))
    :await this.ask(job,practice?practicePrompt:assessmentPrompt,data,assessmentSchema,model,9500);
   assessment=validateAssessment(alignAssessmentEvidence(value,answers),answers,{practice,examMode:mode,rubricVersion:rubric,kind,targetCategories,vocabularyIds});
  }
  await this.assertLease(job);const [record]=await this.repo.write(job.user_id,[op('assessment',key,{...assessment,
   ...(submittedCount>answerRows.length?{
    limitationsUz:[...assessment.limitationsUz,`${submittedCount} ta saqlangan javobdan ${answerRows.length} tasi uch qism bo‘yicha tanlanib tahlil qilindi.`],
    coverage:{...assessment.coverage,submittedAnswerCount:submittedCount},
   }:{}),
   promptVersion:PROMPT_VERSION,modelId:model,processingProvider:local?'local':'groq',comparisonGroup:writtenInterview?'written_mock':target.kind==='session'?(kind==='weekly_check'?'weekly_check':submittedCount>answerRows.length?'legacy_full_mock':'full_mock'):answers[0].question.taskType+':'+answers[0].question.difficulty,assessmentRevision:target.kind==='transcript'?target.revision:1,transcriptRevisionIds:answerRows.map(x=>x.transcript.id),createdAt:this.now().toISOString()},{exam:mode,parentId:target.id,mode:'insert'})]);
  if(kind==='baseline')await this.repo.write(job.user_id,[op('receipt','baseline:'+mode,{assessmentId:record.id,sessionId:target.id},{exam:mode,parentId:record.id,mode:'insert'})]);
  await this.updateErrors(job,record,answerRows);await this.updateTransfer(job,record,answerRows);
  if(target.kind==='session'&&target.payload.status!=='assessed')await this.repo.write(job.user_id,[op('session',target.record_key,{...target.payload,status:'assessed',assessmentId:record.id},{expectedRevision:target.revision})]);
  const profile=await this.repo.read(job.user_id,'profile',mode),oldPlan=(await this.repo.list(job.user_id,'roadmap',mode,1))[0];
  if(profile&&!writtenInterview&&(target.kind==='session'||(!oldPlan&&allBaseline(await this.repo.list(job.user_id,'assessment',mode,100)))))await this.repo.enqueue(job.user_id,'plan',record.id,'plan:'+record.id+':'+profile.revision+':'+Math.floor(Date.parse(localDate(profile.payload.timezone,this.now()))/604800000));
  else if(profile&&oldPlan&&kind==='transfer'&&this.now().getTime()-Date.parse(oldPlan.created_at)>6*86400000)await this.repo.enqueue(job.user_id,'plan',record.id,'plan:'+record.id+':'+profile.revision+':'+Math.floor(Date.parse(localDate(profile.payload.timezone,this.now()))/604800000));
  return record;
 }
 async updateErrors(job,record,rows){const byCategory=new Map();for(const a of record.payload.answerAnalyses)for(const e of a.errors){if(e.isStyleOnly)continue;if(!byCategory.has(e.category))byCategory.set(e.category,[]);const source=rows.find(x=>x.answer.id===a.answerId)?.answer;byCategory.get(e.category).push({...e,questionId:a.questionId,assessmentId:record.id,at:this.now().toISOString(),attemptKind:record.payload.attemptKind||source?.payload.attemptKind||'unknown'});}
  for(const [category,items] of byCategory){const key=record.exam_mode+':'+category,old=await this.repo.read(job.user_id,'error',key),occurrences=[...(old?.payload.occurrences||[]),...items].filter((v,i,a)=>a.findIndex(x=>x.errorId===v.errorId)===i).slice(-100),unique=new Set(occurrences.map(v=>v.answerId));if(items.every(item=>(old?.payload.occurrences||[]).some(o=>o.errorId===item.errorId)))continue;await this.repo.write(job.user_id,[op('error',key,{category,status:unique.size>1?'practising':'new',occurrences,latestAt:this.now().toISOString(),policy:'A rehearsed answer or absence of an error alone does not prove stable mastery.'},{exam:record.exam_mode,...(old?{expectedRevision:old.revision}:{mode:'insert'})})]);}
 }
 async updateTransfer(job,record,rows){
  if(!['transfer','recheck','weekly_check'].includes(record.payload.attemptKind))return;
  const profile=await this.repo.read(job.user_id,'profile',record.exam_mode),date=localDate(profile?.payload.timezone||'Asia/Tashkent',this.now());
  const eligible=v=>{const r=rows.find(r=>r.answer.id===v.answerId);return r&&r.answer.payload.isFirstAttempt&&!r.answer.payload.hasSeenPrompt&&!r.answer.payload.hasSeenModelAnswer&&['transfer','recheck','weekly_check'].includes(r.answer.payload.attemptKind)&&r.answer.payload.sourceKind==='audio'&&!r.transcript.payload.uncertain&&!r.transcript.payload.needsReview&&v.confidence==='high'&&v.correctUse;};
  for(const v of record.payload.targetChecks.filter(eligible)){const key=record.exam_mode+':'+v.category,old=await this.repo.read(job.user_id,'error',key);if(!old||record.payload.answerAnalyses.some(a=>a.errors.some(e=>!e.isStyleOnly&&e.category===v.category)))continue;const uses=[...(old.payload.delayedChecks||[]),{answerId:v.answerId,questionId:rows.find(r=>r.answer.id===v.answerId).answer.payload.questionId,date,quote:v.sourceQuote}].filter((v,i,a)=>a.findIndex(x=>x.answerId===v.answerId)===i),stable=new Set(uses.map(u=>u.date)).size>=2&&new Set(uses.map(u=>u.questionId)).size>=2;await this.repo.write(job.user_id,[op('error',key,{...old.payload,delayedChecks:uses.slice(-20),status:stable?'stable':'improving'},{expectedRevision:old.revision})]);}
  for(const v of record.payload.phraseUses.filter(eligible)){const item=await this.repo.byId(job.user_id,v.vocabularyId,'vocabulary'),uses=[...(item.payload.activeUses||[]),{answerId:v.answerId,questionId:rows.find(r=>r.answer.id===v.answerId).answer.payload.questionId,date,quote:v.sourceQuote}].filter((v,i,a)=>a.findIndex(x=>x.answerId===v.answerId)===i),mastered=new Set(uses.map(u=>u.date)).size>=2&&new Set(uses.map(u=>u.questionId)).size>=2;await this.repo.write(job.user_id,[op('vocabulary',item.record_key,{...item.payload,activeUses:uses.slice(-20),masteryStatus:mastered?'active':'practising'},{expectedRevision:item.revision})]);}
 }
 async plan(job,target){
  const profile=await this.repo.read(job.user_id,'profile',target.exam_mode);
  if(!profile)throw new AiError('PROFILE_REQUIRED','O‘quv profili topilmadi.');
  const key=target.id+':profile:'+profile.revision+':week:'+Math.floor(Date.parse(localDate(profile.payload.timezone,this.now()))/604800000);
  const old=await this.repo.read(job.user_id,'roadmap',key);
  if(old)return old;
  const local=usesLocalSpeaking(this.env);
  const recent=(await this.repo.list(job.user_id,'assessment',target.exam_mode,10)).filter(report=>local||report.payload.processingProvider!=='local');
  const evidence=recent.flatMap(assessment=>assessment.payload.answerAnalyses).slice(0,30);
  const evidenceAssessment={...target.payload,answerAnalyses:evidence};
  const priorities=choosePriorities([{payload:evidenceAssessment}]);
  const errors=priorities.flatMap(({examples})=>examples.slice(0,2))
   .map(({errorId,category,sourceQuote,minimalCorrection})=>({errorId,category,sourceQuote,minimalCorrection}));
  const weeks=profile.payload.deadline&&Date.parse(profile.payload.deadline)-this.now().getTime()<8*7*86400000?4:8;
  const dailyBudgets=policy.budgets[profile.payload.minutes];
  const data={profile:profile.payload,validatedAssessment:{summaryUz:target.payload.summaryUz,wordCount:target.payload.wordCount,needsFollowUp:target.payload.needsFollowUp,priorities:priorities.map(({category,distinctAnswers})=>({category,distinctAnswers})),errors},weekCount:weeks,dailyBudgets,today:localDate(profile.payload.timezone,this.now()),noOfficialLevelOrBand:true};
  let value,source='report';
  if(!local){
   try{
    value=await this.ask(job,roadmapPrompt,data,roadmapSchema,speakingProvider(this.env).assessment,4500);
    for(const day of value.days)day.tasks.forEach((task,index)=>{task.minutes=dailyBudgets[index];});
    validateRoadmap(value,evidenceAssessment,profile.payload);
    source='groq';
   }catch(error){
    if(!(error instanceof AiError)||!roadmapFallbackErrors.has(error.code))throw error;
    value=null;
   }
  }
  if(!value)value=validateRoadmap(roadmapFromReport({target,evidence,priorities,weekCount:weeks,dailyBudgets}),evidenceAssessment,profile.payload);
  const dates=scheduledDays(profile.payload,7,this.now()),id=randomUUID(),existingDays=await this.repo.list(job.user_id,'daily',target.exam_mode,100),ops=[op('roadmap',key,{...value,source,processingProvider:local?'local':'groq',assessmentId:target.id,profileRevision:profile.revision,policyVersion:policy.version,dates,createdAt:this.now().toISOString(),nextFullMockDate:scheduledDays(profile.payload,15,this.now()).find(d=>d>=addDays(localDate(profile.payload.timezone,this.now()),14))||addDays(localDate(profile.payload.timezone,this.now()),14),nextMiniCheckDate:scheduledDays(profile.payload,8,this.now()).find(d=>d>=addDays(localDate(profile.payload.timezone,this.now()),7))||addDays(localDate(profile.payload.timezone,this.now()),7),reason:'Yangi tekshirilgan dalil va o‘quv jadvali asosida.'},{id,exam:target.exam_mode,parentId:target.id,mode:'insert'})];
  value.days.forEach((day,i)=>{if(existingDays.some(d=>d.payload.date===dates[i]&&d.payload.completed))return;ops.push(op('daily',target.exam_mode+':'+dates[i]+':'+id,{...day,date:dates[i],roadmapId:id,processingProvider:local?'local':'groq',completedTaskIds:[],completed:false,tasks:day.tasks.map((t,n)=>({...t,id:'task-'+n})),vocabularyReady:false},{exam:target.exam_mode,parentId:id,mode:'insert'}));});await this.assertLease(job);return (await this.repo.write(job.user_id,ops))[0];
 }
 async vocabulary(job,day){if(day.payload.vocabularyReady)return day;const roadmap=await this.repo.byId(job.user_id,day.payload.roadmapId,'roadmap'),assessment=await this.repo.byId(job.user_id,roadmap.payload.assessmentId,'assessment'),profile=await this.repo.read(job.user_id,'profile',day.exam_mode),existing=await this.repo.list(job.user_id,'vocabulary',day.exam_mode,300),date=localDate(profile.payload.timezone,this.now()),due=existing.filter(v=>v.payload.reviewDueAt<=date),count=Math.max(1,(profile.payload.minutes===20?3:5)-(due.length>10?2:0)),errors=assessment.payload.answerAnalyses.flatMap(a=>a.errors),valid=new Set(errors.map(e=>e.errorId));assertSpeakingProvider(assessment,this.env);
  const value=await this.ask(job,vocabularyPrompt,{count,topic:day.payload.topic,errors,existingPhrases:existing.map(e=>e.payload.phraseEn),profile:profile.payload},vocabSchema,speakingProvider(this.env).practice,5000);if(value.items.length!==count||new Set(value.items.map(v=>v.phraseEn.toLowerCase())).size!==count)throw new AiError('AI_VOCABULARY','Iboralar soni yoki takrori mos kelmadi.',502,true);
  const ops=value.items.map(v=>{if(v.sourceErrorIds.some(id=>!valid.has(id))||existing.some(e=>e.payload.phraseEn.toLowerCase()===v.phraseEn.toLowerCase()))throw new AiError('AI_VOCAB_EVIDENCE','Ibora dalili yoki takrori tekshiruvdan o‘tmadi.',502,true);return op('vocabulary',day.id+':'+v.phraseEn.toLowerCase().slice(0,80),{...v,dayId:day.id,reviewDueAt:date,reviewStage:-1,masteryStatus:'new',activeUses:[]},{exam:day.exam_mode,parentId:day.id,mode:'insert'});});ops.push(op('daily',day.record_key,{...day.payload,vocabularyReady:true},{expectedRevision:day.revision}));await this.assertLease(job);return (await this.repo.write(job.user_id,ops)).at(-1);
 }
 async guide(job,target){if(target.payload.status==='completed')return target;const features=allowedFeatures(target.payload.role),value=await this.ask(job,guidePrompt,{currentView:target.payload.view,question:target.payload.message,features:features.map(({id,title,description,steps})=>({id,title,description,steps}))},guideSchema,speakingProvider(this.env).practice,1400),allowed=new Set(features.map(f=>f.id));if(value.routeIds.length>3||value.routeIds.some(id=>!allowed.has(id)))throw new AiError('AI_GUIDE_ROUTE','AI mavjud bo‘lmagan bo‘limni taklif qildi.',502,true);await this.assertLease(job);return (await this.repo.write(job.user_id,[op('guide',target.record_key,{...target.payload,answerUz:value.answerUz,routeIds:value.routeIds,status:'completed'},{expectedRevision:target.revision})]))[0];}
 async once({userId,jobId}={}){
  const job=jobId?await this.repo.claimJob(userId,jobId):await this.repo.claim();
  if(!job?.id)return {idle:true};
  const heartbeat=setInterval(()=>this.repo.lease(job,'heartbeat').catch(()=>{}),30000);
  try{
   const target=await this.repo.byId(job.user_id,job.target_id);
   assertSpeakingProvider(target,this.env);
   let result;
   if(job.kind==='assess'||job.kind==='practice')result=await this.assess(job,target,job.kind==='practice');
   else if(job.kind==='plan')result=await this.plan(job,target);
   else if(job.kind==='vocabulary')result=await this.vocabulary(job,target);
   else result=await this.guide(job,target);
   await this.repo.lease(job,'completed',null,result.id);
   return {jobId:job.id,status:'completed',kind:job.kind};
  }catch(error){
   const code=error instanceof AiError?error.code:'WORKER_FAILED';
   const retry=error.retryable===true&&code!=='AI_RATE_LIMIT'&&job.attempts<3;
   await this.repo.lease(job,retry?'queued':'failed',code).catch(()=>{});
   return {jobId:job.id,status:retry?'queued':'failed',code};
  }finally{clearInterval(heartbeat);}
 }
 async cleanup(){const db=this.repo.db;if(!db)return;const rows=await db.from('sq_sp_records').select('*').eq('kind','audio').lte('payload->>expiresAt',this.now().toISOString()).is('payload->>deletedAt',null).limit(100);if(rows.error)throw new AiError('CLEANUP_DATABASE','Audio saqlash muddati tekshirilmadi.',503);for(const a of rows.data||[]){await this.repo.removeAudio(a.payload.path);await this.repo.write(a.user_id,[op('audio',a.record_key,{...a.payload,deletedAt:this.now().toISOString(),deletionReason:'retention'},{expectedRevision:a.revision})]);}return {expiredDeleted:rows.data?.length||0};}
}
