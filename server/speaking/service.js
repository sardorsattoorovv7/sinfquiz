import {randomUUID} from 'node:crypto';
import {AiError} from './groq.js';
import {assertSpeakingProvider,speakingProvider,usesLocalSpeaking} from './provider.js';
import {profileInput,localDate,policy,addDays} from './domain.js';
import {speakingMockSets,speakingQuestionsById,practiceTransferQuestions,speakingImageAssets,speakingFormat,speakingSources,SPEAKING_BANK_VERSION} from './questions.js';
import {allowedFeatures} from '../../src/speaking/features.js';
import {getInterviewer} from '../../src/speaking/interviewer.js';
import {normalizeAnswerMode,WRITTEN_ANSWER_MAX} from '../../src/speaking/answer-mode.js';
import {IELTS_MOCK_PART_LIMITS} from '../../src/speaking/format-limits.js';
import {generateVariant,generationTokens,pickRandom,questionHistory,questionFingerprint,variantQuestions,exposureIds} from './variants.js';
const hasProvider=env=>{try{speakingProvider(env);return true;}catch{return false;}};
const providerName=env=>usesLocalSpeaking(env)?'local':'groq';
const uuid=s=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(s);
const mimeExt={'audio/webm':'webm','video/webm':'webm','audio/mp4':'m4a','audio/mpeg':'mp3','audio/ogg':'ogg','audio/wav':'wav','audio/x-wav':'wav'};
const op=(kind,key,payload,extra={})=>({kind,key,payload,...extra});
const seenOp=(q,exam,now)=>{const fingerprint=questionFingerprint(q);return op('receipt','seen-question:'+fingerprint,{questionId:q.id,prompt:q.prompt,fingerprint,firstShownAt:now.toISOString()},{exam,mode:'insert'})};
const examName=e=>['ielts','multilevel'].includes(e)?e:'ielts';
const sessionQuestions=s=>s.sections.flatMap(section=>section.questions);
const assessmentPageSize=30;

function limitIeltsQueue(queue, preserveCount=0){
 const used={};
 return queue.filter((question,index)=>{
  const count=used[question.section]||0;
  if(index>=preserveCount&&count>=(IELTS_MOCK_PART_LIMITS[question.section]??Infinity))return false;
  used[question.section]=count+1;
  return true;
 }).map((question,index)=>index>=preserveCount&&question.taskType==='long_turn_follow_up'
  ?{...question,responseMaxSeconds:30}:question);
}

function mockTemplate(set){
 if(set.exam!=='ielts')return set;
 const questions=limitIeltsQueue(sessionQuestions(set));
 return {...set,questions,sections:set.sections.map(section=>({...section,questions:questions.filter(question=>question.section===section.id)}))};
}

function interviewerCue(session, question) {
 if (session.cursor === 0) return `Hello, I'm ${getInterviewer(session.interviewerId).name}. I'll be your interviewer today. Let's begin.`;
 if (question.section === session.queue[session.cursor - 1]?.section) {
  return ['Thank you.', 'All right.', 'Let’s move on.', 'Thanks. Here’s the next question.'][session.cursor % 4];
 }
 if (question.section === 'part1_2') return 'Now, look at the two pictures on your screen.';
 if (question.section === 'part2') return 'Let’s move on to part two. You’ll have one minute to prepare before you speak.';
 if (session.examMode === 'multilevel') return 'For the final task, consider both sides of the statement. You’ll have one minute to prepare.';
 return 'Now, let’s discuss some broader ideas about this topic.';
}

export function publicJob(j){return j?{id:j.id,kind:j.kind,status:j.status,attempts:j.attempts,last_error:j.last_error||null,result_id:j.result_id||null,provider:j.provider||(j.job_key?.startsWith('local:')?'local':'groq')}:null;}
export class SpeakingService{
 constructor(repo,{env=process.env,now=()=>new Date(),generate=generateVariant,pick=pickRandom}={}){Object.assign(this,{repo,env,now,generate,pick});}
 async run(actor,action,p={}){const user=actor.id;if(!user)throw new AiError('AUTH_REQUIRED','Hisobga kiring.',401);const now=this.now();await this.repo.reserve(user,'api-minute:'+Math.floor(now.getTime()/60000),1,120,3000);const exam=examName(p.examMode);
  const getProfile=async()=>{const r=await this.repo.read(user,'profile',exam);if(!r)throw new AiError('PROFILE_REQUIRED','Avval maqsad va jadvalni saqlang.');return r;};
  const baselineRecord=async(known=null)=>{
   const existing=known?.find(assessment=>assessment.payload.attemptKind==='baseline');
   if(existing||(known&&known.length<assessmentPageSize))return existing||null;
   const pointer=await this.repo.read(user,'receipt','baseline:'+exam);
   if(pointer)return this.repo.byId(user,pointer.payload.assessmentId,'assessment');
   return (await this.repo.list(user,'assessment',exam,100)).find(assessment=>assessment.payload.attemptKind==='baseline')||null;
  };
  const by=async(id,kind)=>{if(!uuid(id))throw new AiError('INVALID_ID','Yozuv identifikatori noto‘g‘ri.');return this.repo.byId(user,id,kind);};
  if(action==='home'){
   const [profile,sessions,assessments,roadmaps,days,vocabulary,errors,jobs]=await Promise.all([
    this.repo.read(user,'profile',exam),
    this.repo.listSessions?this.repo.listSessions(user,exam,30):this.repo.list(user,'session',exam,30),
    this.repo.list(user,'assessment',exam,assessmentPageSize),this.repo.list(user,'roadmap',exam,20),
    this.repo.list(user,'daily',exam,70),this.repo.list(user,'vocabulary',exam,100),
    this.repo.list(user,'error',exam,30),this.repo.jobs(user),
   ]);
   const date=localDate(profile?.payload.timezone||'Asia/Tashkent',now);
   const baseline=await baselineRecord(assessments);
   const assessmentDates=new Map(assessments.map(assessment=>[assessment.id,assessment.created_at]));
   const roadmap=roadmaps.sort((a,b)=>
    b.payload.profileRevision-a.payload.profileRevision
    ||Date.parse(assessmentDates.get(b.payload.assessmentId)||b.created_at)-Date.parse(assessmentDates.get(a.payload.assessmentId)||a.created_at)
    ||b.created_at.localeCompare(a.created_at)
   )[0]||null;
   const completed=days.find(day=>day.payload.date===date&&day.payload.completed);
   if(baseline&&!assessments.some(assessment=>assessment.id===baseline.id))assessments.push(baseline);
   return {
    profile,sessions:sessions.map(session=>({id:session.id,status:session.payload.status,title:session.payload.title,kind:session.payload.attemptKind,createdAt:session.created_at})),
    baseline:baseline||null,assessments,roadmap,
    today:completed||days.find(day=>day.payload.date===date&&day.payload.roadmapId===roadmap?.id)||null,
    nextDay:days.filter(day=>day.payload.date>date).sort((a,b)=>a.payload.date.localeCompare(b.payload.date))[0]||null,
    vocabulary,errors,jobs:jobs.map(publicJob),localDate:date,providerConfigured:hasProvider(this.env),provider:providerName(this.env),policy,
   };
  }
  if(action==='profile'){const profile=profileInput(p.profile),saved=await this.repo.write(user,[op('profile',profile.examMode,profile,{exam:profile.examMode})]);return {profile:saved[0]};}
  if(action==='start_check'){
   if(!uuid(p.token)||p.consent!==true)throw new AiError('CONSENT_REQUIRED','Audio va AI tahliliga rozilikni tasdiqlang.');
   const [profile,baseline,existing]=await Promise.all([getProfile(),baselineRecord(),this.repo.read(user,'session','check:'+p.token)]);
   if(!baseline)throw new AiError('BASELINE_REQUIRED','Avval to‘liq boshlang‘ich mockni tugating.');
   if(existing)return this.sessionView(user,existing);
   const sessions=await this.repo.list(user,'session',exam,150);
   const active=sessions.find(session=>session.payload.status==='started');
   if(active)return this.sessionView(user,active);
   const [answers,receipts]=await Promise.all([this.repo.list(user,'answer',exam,500),this.repo.list(user,'receipt',exam,400)]);
   const seen=new Set([...answers.map(answer=>answer.payload.questionId),...exposureIds(receipts),...sessions.flatMap(session=>session.payload.revealedIds||[])]);
   const history=await this.history(user,exam,sessions,receipts,answers);
   const pool=practiceTransferQuestions.filter(question=>question.exam===exam&&!seen.has(question.id)&&!history.fingerprints.has(questionFingerprint(question)));
   const sections=exam==='ielts'?['part1','part2','part3']:['part1_1','part1_2','part3'];
   const chosen=sections.map(section=>this.pick(pool.filter(question=>question.section===section))).filter(Boolean);
   const questions=chosen.length===3?chosen:variantQuestions(await this.freshVariant(user,'check-variant:'+p.token,{
    exam,sections:sections.map(section=>({questions:[this.pick(practiceTransferQuestions.filter(question=>question.exam===exam&&question.section===section))]})),
   },history,exam));
   const queue=questions.map(question=>({...question,timerScope:'task',responseMaxSeconds:question.responseMaxSeconds||60}));
   const id=randomUUID();
   const [session]=await this.repo.write(user,[op('session','check:'+p.token,{
    examMode:exam,attemptKind:'weekly_check',title:'Haftalik mini-tekshiruv · 3 yangi savol',setId:null,
    formatVersion:queue[0].formatVersion,bankVersion:SPEAKING_BANK_VERSION,queue,cursor:0,
    revealedIds:[queue[0].id],sectionUsed:{},status:'started',profileId:profile.id,consentAt:now.toISOString(),
    imageDescriptionShown:true,examRoom:p.examRoom===true,interviewerId:getInterviewer(p.interviewerId).id,
    answerMode:p.examRoom===true?normalizeAnswerMode(p.answerMode):'audio',processingProvider:providerName(this.env),
   },{id,exam,mode:'insert'})]);
   return this.sessionView(user,session,{fresh:session.id===id});
  }
  if(action==='start_mock'){
   if(!uuid(p.token)||p.consent!==true)throw new AiError('CONSENT_REQUIRED','Yozuv va Groq tahlili roziligini tasdiqlang.');
   const [profile,existing]=await Promise.all([getProfile(),this.repo.read(user,'session','mock:'+p.token)]);
   if(existing)return this.sessionView(user,existing);
   const [old,assessments,receipts]=await Promise.all([
    this.repo.list(user,'session',exam,150),this.repo.list(user,'assessment',exam,50),this.repo.list(user,'receipt',exam,400),
   ]);
   const active=old.find(s=>s.payload.status==='started');if(active)return this.sessionView(user,active);
   const history=await this.history(user,exam,old,receipts),sets=speakingMockSets.filter(s=>s.exam===exam).map(mockTemplate);
   const available=sets.filter(set=>variantQuestions(set).every(q=>!history.ids.has(q.id)&&!history.fingerprints.has(questionFingerprint(q))));
   const set=available.length?this.pick(available):await this.freshVariant(user,'mock-variant:'+p.token,this.pick(sets),history,exam);
   const queue=exam==='ielts'?limitIeltsQueue(sessionQuestions(set)):sessionQuestions(set);
   const kind=(receipts.some(r=>r.record_key==='baseline:'+exam)||assessments.some(a=>a.payload.attemptKind==='baseline'))?'recheck':'baseline';
   const id=randomUUID();
   const [session]=await this.repo.write(user,[op('session','mock:'+p.token,{
    examMode:exam,attemptKind:kind,title:set.title,setId:set.id,formatVersion:set.formatVersion,
    bankVersion:SPEAKING_BANK_VERSION,queue,cursor:0,revealedIds:[queue[0].id],sectionUsed:{},status:'started',
    profileId:profile.id,consentAt:now.toISOString(),imageDescriptionShown:true,
    examRoom:p.examRoom===true,interviewerId:getInterviewer(p.interviewerId).id,
    answerMode:p.examRoom===true?normalizeAnswerMode(p.answerMode):'audio',processingProvider:providerName(this.env),
   },{id,exam,mode:'insert'})]);
   return this.sessionView(user,session,{fresh:session.id===id});
  }
  if(action==='session')return this.sessionView(user,await by(p.id,'session'));
  if(action==='begin_turn'){
   const session=await by(p.sessionId,'session');
   if(session.payload.status!=='started')throw new AiError('SESSION_CLOSED','Mock yakunlangan.');
   const current=session.payload.queue[session.payload.cursor];
   if(!current||current.id!==p.questionId)throw new AiError('QUESTION_ORDER','Savollar ketma-ketligi o‘zgardi. Sahifani yangilang.');
   const turn=await this.makeTurn(user,session,current,this.now(),p.interviewer===true,p.answerMode);
   return {turn,question:this.questionView(current),serverNow:this.now().toISOString()};
  }
  if(action==='finish_prompt'){
   const turn=await by(p.id,'turn');
   const saved=await this.finishPrompt(user,turn,now);
   return {turn:saved,serverNow:this.now().toISOString()};
  }
  if(action==='stop_turn'){const turn=await by(p.id,'turn');if(await this.repo.read(user,'answer',turn.record_key))throw new AiError('TURN_CLOSED','Ushbu javob original sifatida saqlangan.');if(turn.payload.stoppedAt&&!['technical_error','skipped'].includes(p.technicalStatus))return {turn};if(p.sha256!==null&&!/^[a-f0-9]{64}$/.test(p.sha256||''))throw new AiError('AUDIO_HASH','Audio imzosi to‘liq emas.');const payload={...turn.payload,stoppedAt:now.toISOString(),sha256:p.sha256,technicalStatus:p.technicalStatus==='technical_error'?'technical_error':p.technicalStatus==='skipped'?'skipped':'recorded'};const rows=await this.repo.write(user,[op('turn',turn.record_key,payload,{expectedRevision:turn.revision})]);return {turn:rows[0]};}
  if(action==='prepare_audio'){
   return this.prepareAudio(user,p,now,by);
  }
  if(action==='submit_answer'){
   const session=await by(p.sessionId,'session'),s=session.payload,current=s.queue[s.cursor];
   if(p.questionId&&p.questionId!==current?.id){
    const existing=await this.repo.read(user,'answer',session.id+':'+p.questionId);
    if(existing)return this.sessionView(user,session);
    throw new AiError('QUESTION_ORDER','Savollar ketma-ketligini yangilang.');
   }
   if(!current||s.status!=='started')return this.sessionView(user,session);
   const key=session.id+':'+current.id,turn=await this.repo.read(user,'turn',key);
   if(!turn)throw new AiError('TURN_REQUIRED','Avval savolni boshlang.');
   const answerMode=normalizeAnswerMode(turn.payload.answerMode);
   const written=Object.hasOwn(p,'text');
   let {stoppedAt,sha256,technicalStatus}=turn.payload;
   let text=null,audioId=null;
   const changes=[];
   if(written){
    if(!s.examRoom||answerMode!=='typed'||p.audioId)throw new AiError('ANSWER_MODE','Bu savol uchun yozma javob shaklini tanlang.');
    if(stoppedAt)throw new AiError('TURN_CLOSED','Bu savolning javobi yakunlangan.');
    if(typeof p.text!=='string'||!p.text.trim()||p.text.length>WRITTEN_ANSWER_MAX)throw new AiError('WRITTEN_ANSWER',`Javob 1–${WRITTEN_ANSWER_MAX} belgidan iborat bo‘lsin.`);
    if(now.getTime()<Date.parse(turn.payload.prepUntil))throw new AiError('ANSWER_NOT_OPEN','Javob vaqti boshlanishini kuting.');
    text=p.text.trim();
    // A frozen draft may arrive after its deadline if the network was interrupted.
    stoppedAt=new Date(Math.min(now.getTime(),Date.parse(turn.payload.deadline))).toISOString();
    sha256=null;
    technicalStatus='written';
    changes.push(op('turn',key,{...turn.payload,stoppedAt,sha256,technicalStatus},{expectedRevision:turn.revision}));
   }else{
    if(!stoppedAt)throw new AiError('TURN_NOT_STOPPED','Avval yozuvni yakunlang.');
    if(technicalStatus==='recorded'){
     if(answerMode==='typed')throw new AiError('ANSWER_MODE','Bu savol yozma javob uchun ochilgan.');
     const audio=await by(p.audioId,'audio');
     if(audio.parent_id!==session.id||audio.payload.deletedAt)throw new AiError('AUDIO_OWNER','Audio ushbu mockga tegishli emas.');
     if(audio.payload.turnId){
      if(audio.payload.turnId!==turn.id||audio.payload.sha256!==sha256)throw new AiError('AUDIO_OWNER','Audio ushbu savolga tegishli emas.');
     }else{
      const previous=this.repo.listSessionAnswers?await this.repo.listSessionAnswers(user,session.id):await this.repo.list(user,'answer',session.exam_mode,500);
      if(previous.some(answer=>answer.payload.audioId===audio.id))throw new AiError('AUDIO_OWNER','Audio avvalgi javobda ishlatilgan.');
     }
     audioId=audio.id;
    }else if(technicalStatus==='written'){
     throw new AiError('TURN_CLOSED','Bu savolning javobi yakunlangan.');
    }
   }
   const status=written||technicalStatus==='recorded'?'answered':technicalStatus;
   const spent=Math.min(turn.payload.responseMax,Math.max(0,(Date.parse(stoppedAt)-Date.parse(turn.payload.prepUntil))/1000));
   const used={...s.sectionUsed,[current.section]:(s.sectionUsed[current.section]||0)+spent};
   const cursor=s.cursor+1;
   let queue=s.queue;
   if(current.timerScope==='section'&&used[current.section]>=270){
    queue=queue.filter((question,index)=>index<cursor||question.section!==current.section);
   }
   if(s.examMode==='ielts'&&s.attemptKind!=='weekly_check')queue=limitIeltsQueue(queue,cursor);
   const processingProvider=s.processingProvider==='local'?'local':providerName(this.env);
   const nextPayload={...s,queue,cursor,answerMode,processingProvider,sectionUsed:used,revealedIds:[...new Set([...s.revealedIds,...(queue[cursor]?[queue[cursor].id]:[])])]};
   changes.push(op('answer',key,{
    sessionId:session.id,questionId:current.id,question:current,status,audioId,...(written?{text}:{}),sha256,turnId:turn.id,
    attemptKind:written?'written_mock':s.attemptKind,isFirstAttempt:true,hasSeenPrompt:false,hasSeenModelAnswer:false,
    sourceKind:answerMode,elapsedSeconds:spent,recordedAt:stoppedAt,processingProvider,
   },{exam:session.exam_mode,parentId:session.id,mode:'insert'}),op('session',session.record_key,nextPayload,{expectedRevision:session.revision}));
   let savedSession;
   try{
    const saved=await this.repo.write(user,changes);
    savedSession=saved.at(-1);
   }catch(error){
    if(error.code!=='REVISION_CONFLICT'||!await this.repo.read(user,'answer',key))throw error;
    savedSession=await by(session.id,'session');
   }
   return this.sessionView(user,savedSession);
  }
  if(action==='finish_mock'){
   speakingProvider(this.env);
   const session=await by(p.id,'session');
   assertSpeakingProvider(session,this.env);
   if(session.payload.cursor<session.payload.queue.length)throw new AiError('MOCK_INCOMPLETE','Mock savollarini yakunlang.');
   const job=await this.repo.enqueue(user,'assess',session.id,'assess:'+session.id);
   if(session.payload.status==='started')await this.repo.write(user,[op('session',session.record_key,{...session.payload,status:'queued',processingProvider:providerName(this.env)},{expectedRevision:session.revision})]);
   return {job:publicJob(job)};
  }
  if(action==='job')return {job:await this.repo.job(user,p.id)};
  if(action==='retry_job'){speakingProvider(this.env);await this.repo.reserve(user,'manual-retry',1,12,300);return {job:await this.repo.retry(user,p.id)};}
  if(action==='cancel_job')return {job:await this.repo.cancel(user,p.id)};
  if(action==='assessment'){const assessment=await by(p.id,'assessment'),answers=await Promise.all(assessment.payload.answerAnalyses.map(a=>by(a.answerId,'answer'))),transcripts=await Promise.all(assessment.payload.transcriptRevisionIds.map(id=>by(id,'transcript')));return {assessment,answers,transcripts};}
  if(action==='transcript_revision'){speakingProvider(this.env);if(typeof p.text!=='string'||!p.text.trim()||p.text.length>30000||!uuid(p.token))throw new AiError('TRANSCRIPT_INPUT','Tuzatilgan transkript va qayta urinish identifikatori kerak.');const original=await by(p.id,'transcript');assertSpeakingProvider(original,this.env);const rows=await this.repo.write(user,[op('transcript','revision:'+p.token,{...original.payload,text:p.text,originalRevisionId:original.id,revisionKind:'learner_corrected',needsReview:true},{exam:original.exam_mode,parentId:original.parent_id,mode:'insert'})]);const job=await this.repo.enqueue(user,'practice',rows[0].id,'revision-assess:'+rows[0].id);return {transcript:rows[0],job:publicJob(job)};}
  if(action==='practice_question'){
   await getProfile();if(!await baselineRecord())throw new AiError('BASELINE_REQUIRED','Avval boshlang‘ich mock hisobotini oling.');const [answers,sessions,exposures]=await Promise.all([this.repo.list(user,'answer',exam,400),this.repo.list(user,'session',exam,100),this.repo.list(user,'receipt',exam,300)]);const pending=exposures.find(e=>e.record_key.startsWith('question:')&&e.payload.modelSeen!==true&&!answers.some(a=>a.payload.questionId===e.payload.questionId));if(pending){const known=speakingQuestionsById[pending.payload.questionId]||(await this.repo.read(user,'receipt','generated-question:'+pending.payload.questionId))?.payload.question;if(known)return {question:this.questionView(known),exposureId:pending.id};}const seen=new Set([...answers.map(a=>a.payload.questionId),...exposureIds(exposures),...sessions.flatMap(s=>s.payload.revealedIds||[])]),history=await this.history(user,exam,sessions,exposures,answers),q=this.pick([...practiceTransferQuestions.filter(q=>q.exam===exam&&!seen.has(q.id)&&!history.fingerprints.has(questionFingerprint(q))),...exposures.filter(e=>e.record_key.startsWith('generated-question:')&&e.payload.question?.purpose==='practice_or_unseen_transfer'&&!seen.has(e.payload.question.id)).map(e=>e.payload.question)])||variantQuestions(await this.freshVariant(user,'practice-variant:'+randomUUID(),{exam,sections:[{questions:[this.pick(practiceTransferQuestions.filter(q=>q.exam===exam))]}]},history,exam))[0];const [record]=await this.repo.write(user,[op('receipt','question:'+q.id,{questionId:q.id,firstShownAt:now.toISOString(),modelSeen:false},{exam,mode:'insert'}),seenOp(q,exam,now)]);return {question:this.questionView(q),exposureId:record.id};
  }
  if(action==='practice_submit'){
   speakingProvider(this.env);if(!uuid(p.token))throw new AiError('INVALID_TOKEN','Urinish identifikatori kerak.');const q=speakingQuestionsById[p.questionId]||(await this.repo.read(user,'receipt','generated-question:'+p.questionId))?.payload.question;if(!q||q.exam!==exam||(q.purpose!=='practice_or_unseen_transfer'&&!p.retakeOf))throw new AiError('PRACTICE_QUESTION','Mashq savoli noto‘g‘ri.');let exposure=await this.repo.read(user,'receipt','question:'+q.id);if(p.retakeOf){const original=await by(p.retakeOf,'answer');if(original.payload.questionId!==q.id)throw new AiError('RETAKE_QUESTION','Qayta aytish savoli mos emas.');if(!exposure)[exposure]=await this.repo.write(user,[op('receipt','question:'+q.id,{questionId:q.id,firstShownAt:now.toISOString(),modelSeen:true},{exam,mode:'insert'})]);}if(!exposure)throw new AiError('QUESTION_EXPOSURE','Avval yangi savolni oching.');const existing=await this.repo.read(user,'answer','practice:'+p.token);let answer=existing;
   if(!answer){const old=await this.repo.list(user,'answer',exam,400),first=!old.some(a=>a.payload.questionId===q.id);if(p.audioId){const audio=await by(p.audioId,'audio');if(audio.exam_mode!==exam||audio.parent_id!==(await getProfile()).id||audio.payload.deletedAt||(await this.repo.list(user,'answer',exam,500)).some(a=>a.payload.audioId===audio.id))throw new AiError('AUDIO_EXAM','Audio yo‘nalishi mos emas.');}else if(typeof p.text!=='string'||p.text.trim().length<4||p.text.length>8000)throw new AiError('PRACTICE_TEXT','Javobni yozing yoki audio tanlang.');[answer]=await this.repo.write(user,[op('answer','practice:'+p.token,{questionId:q.id,question:q,status:'answered',audioId:p.audioId||null,text:p.audioId?null:p.text,sourceKind:p.audioId?'audio':'typed',processingProvider:providerName(this.env),attemptKind:p.retakeOf?'aided_repeat':first?'transfer':'practice',isFirstAttempt:first&&!p.retakeOf,hasSeenPrompt:!first,hasSeenModelAnswer:exposure.payload.modelSeen===true,retakeOf:p.retakeOf||null,recordedAt:now.toISOString(),sha256:/^[a-f0-9]{64}$/.test(p.sha256||'')?p.sha256:null},{exam,mode:'insert'})]);}
   assertSpeakingProvider(answer,this.env);
   const job=await this.repo.enqueue(user,'practice',answer.id,'practice-assess:'+answer.id);return {answer,job:publicJob(job)};
  }
  if(action==='mark_model_seen'){const questionId=String(p.questionId||'');const generated=!Object.hasOwn(speakingQuestionsById,questionId)?await this.repo.read(user,'receipt','generated-question:'+questionId):null;if(!Object.hasOwn(speakingQuestionsById,questionId)&&!generated)throw new AiError('QUESTION_ID','Savol topilmadi.');const old=await this.repo.read(user,'receipt','question:'+questionId);const [saved]=await this.repo.write(user,[op('receipt','question:'+questionId,{...(old?.payload||{}),questionId,modelSeen:true,firstShownAt:old?.payload.firstShownAt||now.toISOString()},{exam,...(old?{expectedRevision:old.revision}:{mode:'insert'})})]);return {exposure:saved};}
  if(action==='replan'){speakingProvider(this.env);const profile=await getProfile(),assessments=await this.repo.list(user,'assessment',exam,30),baseline=await baselineRecord(),target=assessments.find(a=>['baseline','recheck','transfer','weekly_check'].includes(a.payload.attemptKind))||baseline;if(!target||!baseline)throw new AiError('BASELINE_REQUIRED','Avval boshlang‘ich mockni tugating.');assertSpeakingProvider(target,this.env);return {job:publicJob(await this.repo.enqueue(user,'plan',target.id,'plan:'+target.id+':'+profile.revision+':'+Math.floor(Date.parse(localDate(profile.payload.timezone,now))/604800000)))};}
  if(action==='prepare_day'){speakingProvider(this.env);const day=await by(p.id,'daily'),date=localDate((await getProfile()).payload.timezone,now);if(day.payload.date!==date)throw new AiError('DAY_DATE','Bugungi reja tanlansin.');assertSpeakingProvider(day,this.env);return {job:publicJob(await this.repo.enqueue(user,'vocabulary',day.id,'vocab:'+day.id))};}
  if(action==='task_done'){const day=await by(p.id,'daily');if(!day.payload.tasks.some(t=>t.id===p.taskId))throw new AiError('TASK_ID','Topshiriq topilmadi.');const completedIds=[...new Set([...(day.payload.completedTaskIds||[]),p.taskId])],completed=completedIds.length===day.payload.tasks.length;const [saved]=await this.repo.write(user,[op('daily',day.record_key,{...day.payload,completedTaskIds:completedIds,completed,completedAt:completed?now.toISOString():null},{expectedRevision:day.revision})]);return {day:saved};}
  if(action==='review'){if(!uuid(p.token))throw new AiError('REVIEW_TOKEN','Takrorlash identifikatori kerak.');const item=await by(p.id,'vocabulary'),existing=await this.repo.read(user,'review',p.token);if(existing)return {item};const date=localDate((await getProfile()).payload.timezone,now),stage=p.success===true?Math.min(4,(item.payload.reviewStage??-1)+1):0;const rows=await this.repo.write(user,[op('review',p.token,{vocabularyId:item.id,success:p.success===true,date,kind:'self_recall_not_active_mastery'},{exam:item.exam_mode,parentId:item.id,mode:'insert'}),op('vocabulary',item.record_key,{...item.payload,reviewStage:stage,reviewDueAt:addDays(date,policy.reviewDays[stage]),masteryStatus:item.payload.masteryStatus||'new'},{expectedRevision:item.revision})]);return {item:rows[1]};}
  if(action==='audio_list')return {audios:await this.repo.list(user,'audio',null,500)};
  if(action==='audio_url'){const asset=await by(p.id,'audio');if(asset.payload.deletedAt||asset.payload.expiresAt<now.toISOString())throw new AiError('AUDIO_EXPIRED','Audio o‘chirilgan yoki saqlash muddati tugagan.',410);return {url:(await this.repo.signedRead(asset.payload.path)).signedUrl};}
  if(action==='delete_audio'){const asset=await by(p.id,'audio');if(!asset.payload.deletedAt)await this.repo.removeAudio(asset.payload.path);await this.repo.write(user,[op('audio',asset.record_key,{...asset.payload,deletedAt:now.toISOString()},{expectedRevision:asset.revision})]);return {deleted:true,transcriptRetained:true};}
  if(action==='export'){const kinds=['profile','session','turn','answer','audio','receipt','transcript','assessment','roadmap','daily','vocabulary','review','error','progress','guide'];const records=(await Promise.all(kinds.map(k=>this.repo.listAll?this.repo.listAll(user,k):this.repo.list(user,k,null,1000)))).flat();return {version:'7.46.0',exportedAt:now.toISOString(),records};}
  if(action==='cancel_session'){const s=await by(p.id,'session');if(s.payload.status==='started')await this.repo.write(user,[op('session',s.record_key,{...s.payload,status:'abandoned'},{expectedRevision:s.revision})]);return {cancelled:true};}
  if(action==='delete_data'){if(p.confirm!=='DELETE_SPEAKING')throw new AiError('DELETE_CONFIRM','Speaking ma’lumotlarini o‘chirishni tasdiqlang.');await this.repo.deleteData(user);return {deleted:true};}
  if(action==='guide'){speakingProvider(this.env);const message=String(p.message||'').trim();if(!message||message.length>1500||!uuid(p.token))throw new AiError('GUIDE_INPUT','Savol1500belgidan oshmasin.');const features=allowedFeatures(actor.role),view=features.some(f=>f.id===p.view)?p.view:'atlasHub';const [record]=await this.repo.write(user,[op('guide',p.token,{message,view,role:actor.role,features,status:'queued'},{mode:'insert'})]);return {job:publicJob(await this.repo.enqueue(user,'guide',record.id,'guide:'+record.id))};}
  if(action==='guide_history')return {guides:await this.repo.list(user,'guide',null,20),jobs:(await this.repo.jobs(user)).filter(j=>j.kind==='guide').map(publicJob)};
  if(action==='guide_result')return {guide:await by(p.id,'guide')};
  throw new AiError('UNKNOWN_ACTION','Bunday AI amali mavjud emas.',404);
 }
 async freshVariant(user,key,template,history,exam){
  const cached=await this.repo.read(user,'receipt',key);let variant=cached?.payload.variant;
  if(!variant){
   speakingProvider(this.env);
   if(!usesLocalSpeaking(this.env)){
    await this.repo.reserve(user,'groq-calls',2,Number(this.env.SPEAKING_USER_AI_CALLS)||80,Number(this.env.SPEAKING_SITE_AI_CALLS)||2000);
    const tokens=(Math.ceil(JSON.stringify({template,excluded:history.prompts.slice(-80)}).length/3)+generationTokens(template))*3;
    await this.repo.reserve(user,'reserved-tokens',tokens,Number(this.env.SPEAKING_USER_TOKEN_BUDGET)||250000,Number(this.env.SPEAKING_SITE_TOKEN_BUDGET)||5000000);
   }
   const value=await this.generate(template,history,{env:this.env}),[saved]=await this.repo.write(user,[op('receipt',key,{variant:value},{exam,mode:'insert'})]);variant=saved.payload.variant;
  }
  await this.repo.write(user,variantQuestions(variant).map(question=>op('receipt','generated-question:'+question.id,{questionId:question.id,question},{exam,mode:'insert'})));
  return variant;
 }
 async history(user,exam,sessions,receipts,answers=[]){const history=questionHistory(sessions,receipts,answers);if(this.repo.fingerprints)for(const value of await this.repo.fingerprints(user,exam))history.fingerprints.add(value);return history;}
 async prepareAudio(user,p,now,by){
  const maxBytes=Math.min(20,Number(this.env.SPEAKING_MAX_UPLOAD_MB)||20)*1024*1024;
  if(!Object.hasOwn(mimeExt,p.mime)||!Number.isInteger(p.bytes)||p.bytes<100||p.bytes>maxBytes||!uuid(p.token)){
   throw new AiError('AUDIO_FORMAT','WebM/MP4/Ogg/MP3/WAV audio 20 MB dan oshmasin.');
  }
  const bindsTurn=p.turnId!==undefined;
  if(bindsTurn&&(p.parentKind!=='session'||!/^[a-f0-9]{64}$/.test(p.sha256||''))){
   throw new AiError('AUDIO_HASH','Audio imzosi to‘liq emas.');
  }
  const key='audio:'+p.token;
  const parentKind=p.parentKind==='session'?'session':p.parentKind==='profile'?'profile':'answer';
  const [parent,existing,turn]=await Promise.all([
   by(p.parentId,parentKind),this.repo.read(user,'audio',key),bindsTurn?by(p.turnId,'turn'):null,
  ]);
  const validateAsset=asset=>{
   const data=asset.payload;
   if(asset.parent_id!==parent.id||data.mime!==p.mime||data.bytes!==p.bytes
    ||(data.turnId&&turn&&(data.turnId!==turn.id||data.sha256!==p.sha256))){
    throw new AiError('AUDIO_OWNER','Bu yozuv boshqa javobga tegishli.');
   }
   if(data.deletedAt)throw new AiError('AUDIO_DELETED','Bu audio o‘chirilgan.');
  };
  if(existing)validateAsset(existing);
  const changes=[];
  if(turn){
   const state=turn.payload;
   if(turn.parent_id!==parent.id||normalizeAnswerMode(state.answerMode)!=='audio'){
    throw new AiError('AUDIO_OWNER','Audio ushbu savolga tegishli emas.');
   }
   if(state.stoppedAt&&(state.technicalStatus!=='recorded'||(state.sha256&&state.sha256!==p.sha256))){
    throw new AiError('AUDIO_HASH','Audio avval saqlangan yozuvga mos kelmadi.');
   }
   const current=parent.payload.queue[parent.payload.cursor];
   if(parent.payload.status!=='started'||current?.id!==state.questionId){
    const answer=existing&&await this.repo.read(user,'answer',turn.record_key);
    if(answer&&answer.payload.audioId===existing.id)return {assetId:existing.id,submitted:true};
    throw new AiError('QUESTION_ORDER','Savol holatini yangilang va saqlangan javobni tekshiring.');
   }
   if(!state.stoppedAt&&now.getTime()<Date.parse(state.prepUntil)){
    throw new AiError('ANSWER_NOT_OPEN','Javob vaqti boshlanishini kuting.');
   }
   if(!state.stoppedAt||!state.sha256){
    const stoppedAt=state.stoppedAt||new Date(Math.min(now.getTime(),Date.parse(state.deadline))).toISOString();
    changes.push(op('turn',turn.record_key,{...state,stoppedAt,sha256:p.sha256,technicalStatus:'recorded'},{expectedRevision:turn.revision}));
   }
  }else if(parent.kind==='session'&&parent.payload.status!=='started'){
   throw new AiError('SESSION_CLOSED','Mock yopilgan.');
  }

  let asset=existing;
  if(!asset){
   await this.repo.reserve(user,'upload-kib',Math.ceil(p.bytes/1024),Number(this.env.SPEAKING_USER_UPLOAD_KIB)||102400,Number(this.env.SPEAKING_SITE_UPLOAD_KIB)||2097152);
   const id=randomUUID(),path=user+'/'+id+'.'+mimeExt[p.mime];
   const expiresAt=new Date(now.getTime()+Math.min(365,Math.max(1,Number(this.env.SPEAKING_AUDIO_RETENTION_DAYS)||30))*86400000).toISOString();
   changes.push(op('audio',key,{
    path,mime:p.mime,bytes:p.bytes,expiresAt,deletedAt:null,verified:false,
    ...(turn?{turnId:turn.id,sha256:p.sha256}:{}),
   },{id,exam:parent.exam_mode,parentId:parent.id,mode:'insert'}));
  }
  if(changes.length){
   try{
    const saved=await this.repo.write(user,changes);
    asset||=saved.find(row=>row.kind==='audio');
   }catch(error){
    if(!turn||error.code!=='REVISION_CONFLICT')throw error;
    const [updated,recovered]=await Promise.all([by(turn.id,'turn'),this.repo.read(user,'audio',key)]);
    if(!recovered||!updated.payload.stoppedAt||updated.payload.technicalStatus!=='recorded'||updated.payload.sha256!==p.sha256)throw error;
    asset=recovered;
   }
  }
  validateAsset(asset);
  const upload=await this.repo.signedUpload(asset.payload.path);
  return {assetId:asset.id,path:asset.payload.path,token:upload.token};
 }
 async makeTurn(user,session,current,now,interviewer=false,answerMode=session.payload.answerMode){
  const key=session.id+':'+current.id;
  const existing=await this.repo.read(user,'turn',key);
  if(existing)return existing;
  const responseMax=current.responseMaxSeconds??Math.max(1,Math.ceil(270-(session.payload.sectionUsed[current.section]||0)));
  const cue=session.payload.examRoom&&interviewer?interviewerCue(session.payload,current):null;
  const words=(cue?`${cue} ${current.prompt}`:current.prompt).trim().split(/\s+/).length;
  const presentationSeconds=cue?Math.min(45,Math.max(7,Math.ceil(words/1.6)+4))
   :session.payload.examRoom?Math.min(18,Math.max(4,Math.ceil(words/2)+1)):0;
  const promptUntil=new Date(now.getTime()+presentationSeconds*1000);
  const prepUntil=new Date(promptUntil.getTime()+current.prepSeconds*1000);
  const deadline=new Date(prepUntil.getTime()+responseMax*1000);
  const payload={
   sessionId:session.id,questionId:current.id,index:session.payload.cursor,startedAt:now.toISOString(),
   ...(presentationSeconds?{promptUntil:promptUntil.toISOString()}:{}),
   ...(cue?{examinerPending:true,interviewerCue:cue}:{}),
   answerMode:session.payload.examRoom?normalizeAnswerMode(answerMode):'audio',
   prepUntil:prepUntil.toISOString(),deadline:deadline.toISOString(),responseMax,
   stoppedAt:null,sha256:null,technicalStatus:null,
  };
  const rows=await this.repo.write(user,[op('turn',key,payload,{exam:session.exam_mode,parentId:session.id,mode:'insert'}),seenOp(current,session.exam_mode,now)]);
  return rows[0];
 }
 async finishPrompt(user,turn,now){
  const state=turn.payload;
  if(!state.examinerPending||state.stoppedAt)return turn;
  const bound=Date.parse(state.promptUntil),end=Math.max(Date.parse(state.startedAt),Math.min(bound,now.getTime()));
  const earlierBy=bound-end;
  const next={...state,examinerPending:false,promptUntil:new Date(end).toISOString(),
   prepUntil:new Date(Date.parse(state.prepUntil)-earlierBy).toISOString(),deadline:new Date(Date.parse(state.deadline)-earlierBy).toISOString()};
  try{
   const [saved]=await this.repo.write(user,[op('turn',turn.record_key,next,{expectedRevision:turn.revision})]);
   return saved;
  }catch(error){
   if(error.code!=='REVISION_CONFLICT')throw error;
   const saved=await this.repo.byId(user,turn.id,'turn');
   if(saved.payload.examinerPending&&!saved.payload.stoppedAt)throw error;
   return saved;
  }
 }
 questionView(q){return {id:q.id,prompt:q.prompt,part:q.part,section:q.section,taskType:q.taskType,taskPoints:q.taskPoints,prepSeconds:q.prepSeconds,responseMaxSeconds:q.responseMaxSeconds,timerScope:q.timerScope,forPoints:q.argumentFor||q.forPoints||[],againstPoints:q.argumentAgainst||q.againstPoints||[],images:(q.imageIds||[]).map(id=>speakingImageAssets.find(a=>a.id===id)).filter(Boolean).map(a=>({id:a.id,src:a.src,caption:a.caption,alt:a.alt})),formatVersion:q.formatVersion};}
 async sessionView(user,session,{fresh=false}={}){
  const s=session.payload,q=s.queue[s.cursor];
  const answerRows=fresh?[]:this.repo.listSessionAnswers
   ?this.repo.listSessionAnswers(user,session.id):this.repo.list(user,'answer',session.exam_mode,500);
  const [recorded,turn]=await Promise.all([
   answerRows,
   q&&s.status==='started'?(s.examRoom?(fresh?null:this.repo.read(user,'turn',session.id+':'+q.id)):this.makeTurn(user,session,q,this.now())):null,
  ]);
  const answers=recorded.filter(answer=>answer.parent_id===session.id);
  const current=!q?null:s.examRoom&&!turn
   ? {id:q.id,part:q.part,section:q.section,taskType:q.taskType,prepSeconds:q.prepSeconds,responseMaxSeconds:q.responseMaxSeconds}
   : this.questionView(q);
  return {session:{
   id:session.id,status:s.status,title:s.title,attemptKind:s.attemptKind,examMode:s.examMode,examRoom:s.examRoom===true,
   interviewerId:getInterviewer(s.interviewerId).id,
   answerMode:normalizeAnswerMode(s.answerMode),
   cursor:s.cursor,questionCount:s.queue.length,current,
   sectionRemaining:q?.timerScope==='section'?Math.max(0,270-(s.sectionUsed[q.section]||0)):null,
   formatVersion:s.formatVersion,imageDescriptionShown:s.imageDescriptionShown,
  },answers,turn,serverNow:this.now().toISOString()};
 }
}
export const publicSpeakingStatus=env=>({version:'7.46.0',providerConfigured:hasProvider(env),provider:providerName(env),formats:speakingFormat,sources:speakingSources,counts:{ieltsMocks:6,multilevelMocks:6,picturePairs:12,practiceQuestions:practiceTransferQuestions.length},privacy:usesLocalSpeaking(env)
 ?'Audio hisobingizda yopiq saqlanadi. Whisper va Qwen bu kompyuterda transkripsiya va tahlil qiladi.'
 :'Audio hisobingizda yopiq saqlanadi va transkripsiya hamda tahlil uchun Groq xizmatiga yuboriladi.'});
