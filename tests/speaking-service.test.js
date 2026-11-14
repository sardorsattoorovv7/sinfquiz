import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {SpeakingService} from '../server/speaking/service.js';
import {SpeakingWorker,probeAudio} from '../server/speaking/worker.js';
import {speakingMockSets} from '../server/speaking/questions.js';
import {guideSchema} from '../server/speaking/schema.js';
import {MemoryRepo,profile,uid,otherUid,testEnv,assessmentFixture,planFixture} from './speaking-fixtures.js';
import {AiError} from '../server/speaking/groq.js';
const actor={id:uid,role:'student'},other={id:otherUid,role:'student'};
const op=(kind,key,payload,extra={})=>({kind,key,payload,...extra});
test('a local written interview produces feedback with Qwen under a full Groq quota',async()=>{
 const repo=new MemoryRepo(),exam='ielts',question=speakingMockSets.find(set=>set.exam===exam).sections[0].questions[0];
 const env={SPEAKING_PROVIDER:'local',SPEAKING_LOCAL_WHISPER_PATH:'whisper',SPEAKING_LOCAL_WHISPER_MODEL:'model'};
 const [session]=await repo.write(uid,[op('session','local-test',{cursor:1,queue:[question],status:'started',processingProvider:'local',attemptKind:'baseline'},{exam})]);
 await repo.write(uid,[op('answer','local-answer',{question,questionId:question.id,sourceKind:'typed',text:'I good at explaining my ideas.',status:'answered',processingProvider:'local'},{exam,parentId:session.id})]);
 const cloud=new SpeakingService(repo,{env:testEnv});
 await assert.rejects(cloud.run(actor,'finish_mock',{id:session.id}),{code:'LOCAL_AI_REQUIRED'});
 const local=new SpeakingService(repo,{env});
 const {job}=await local.run(actor,'finish_mock',{id:session.id});
 const worker=new SpeakingWorker(repo,{env,fetcher:async(url,options)=>{
  assert.ok(url.startsWith('http://127.0.0.1:17863/'));
  const data=JSON.parse(JSON.parse(options.body).messages[1].content);
  assert.equal(data.a1.answer,'I good at explaining my ideas.');
  const value={summaryUz:'Bitta grammatik tuzatish.',strengthUz:'Fikr aniq.',priorityUz:'Be fe‘lini ishlating.',answers:{a1:{
   relevance:'on_topic',missingPoints:[],corrections:[{category:'missing_be',quote:'I good at',replacement:'I am good at',reasonUz:'Be fe‘lini qo‘shing.'}],
   adviceUz:'Bitta misol keltiring.',exampleEn:'I am good at explaining my ideas.',nextQuestionEn:'Which skill do you want to improve?',
  }}};
  return Response.json({choices:[{message:{content:JSON.stringify(value)}}]});
 }});
 assert.equal((await worker.once()).status,'completed');
 const state=await repo.job(uid,job.id),report=await repo.byId(uid,state.result_id,'assessment');
 assert.equal(report.payload.modelId,'qwen3.5-4b-local');
 assert.equal(report.payload.processingProvider,'local');
 assert.equal(report.payload.answerAnalyses[0].errors[0].minimalCorrection,'I am good at');
 assert.equal(repo.reservations.some(([,metric])=>metric==='groq-calls'||metric==='reserved-tokens'),false);
});

test('Speaking reserves budget per provider attempt and checks the limit before sending',async()=>{
 const repo=new MemoryRepo(),job={id:randomUUID(),user_id:uid},input={message:'Study question'},response={answerUz:'Speaking mashqini oching.',routeIds:[]};
 let sent=0;
 const worker=new SpeakingWorker(repo,{env:testEnv,fetcher:async()=>{
  if(++sent===1)return Response.json({},{status:429,headers:{'retry-after':'0'}});
  return Response.json({choices:[{message:{content:JSON.stringify(response)}}]});
 }});
 const ask=()=>worker.ask(job,'Guide',input,guideSchema,'openai/gpt-oss-20b',100);
 assert.deepEqual(await ask(),response);
 assert.equal(sent,2);
 const estimatedTokens=Math.ceil(JSON.stringify(input).length/3)+100;
 assert.deepEqual(repo.reservations.map(([,metric,amount])=>[metric,amount]),[
  ['reserved-tokens',estimatedTokens],['groq-calls',1],['reserved-tokens',estimatedTokens],['groq-calls',1],
 ]);
 repo.reserve=async()=>{throw new AiError('AI_RATE_LIMIT','Daily budget reached.',429,true);};
 await assert.rejects(ask(),{code:'AI_RATE_LIMIT'});
 assert.equal(sent,2);
});

test('the saved report supplies a seven-day study plan after the AI budget is exhausted',async()=>{
 const repo=new MemoryRepo(),exam='ielts',now=()=>new Date('2026-11-09T06:00:00Z');
 const service=new SpeakingService(repo,{env:testEnv,now});
 await service.run(actor,'profile',{examMode:exam,profile:profile(exam)});
 const error={errorId:randomUUID(),category:'missing_be',confidence:'high',severity:'high',startOffset:0,sourceQuote:'I good at',minimalCorrection:'I am good at',explanationUz:'Ega bilan sifat orasiga be fe‘lini qo‘shing.'};
 const [assessment]=await repo.write(uid,[op('assessment','saved-report',{
  summaryUz:'Fe’l shaklini yangi javobda mashq qiling.',attemptKind:'baseline',answerAnalyses:[{answerId:randomUUID(),errors:[error]}],
 },{exam})]);
 await repo.enqueue(uid,'plan',assessment.id,'plan');
 const reserve=repo.reserve.bind(repo);
 repo.reserve=async(user,metric,...limits)=>{
  if(metric==='reserved-tokens')throw new AiError('AI_RATE_LIMIT','Daily budget reached.',429,true);
  await reserve(user,metric,...limits);
 };
 let providerCalls=0;
 const worker=new SpeakingWorker(repo,{env:testEnv,now,fetcher:async()=>{providerCalls++;throw Error('Unexpected provider call');}});
 assert.equal((await worker.once()).status,'completed');
 const home=await service.run(actor,'home',{examMode:exam});
 const plan=home.roadmap.payload;
 assert.equal(providerCalls,0);
 assert.equal(plan.source,'report');
 assert.equal(plan.assessmentId,assessment.id);
 assert.equal(plan.weeks.length,8);
 assert.equal(plan.days.length,7);
 assert.equal(new Set(plan.days.map(day=>day.tasks[3].promptsEn[0])).size,7);
 assert.deepEqual(plan.focus[0].sourceErrorIds,[error.errorId]);
 assert.deepEqual(home.today.payload.tasks.map(task=>task.minutes),[3,5,3,6,3]);
});

test('short IELTS answers finish the mock after the three planned parts', async () => {
 const repo=new MemoryRepo(),service=new SpeakingService(repo,{env:testEnv,now:()=>new Date('2026-11-09T06:00:00Z')});
 const run=(action,data={})=>service.run(actor,action,{examMode:'ielts',...data});
 await run('profile',{profile:profile('ielts')});
 let mock=await run('start_mock',{token:randomUUID(),consent:true});
 const sessionId=mock.session.id,questions=[];
 assert.equal(mock.session.questionCount,10);
 for(let i=0;i<10;i++){
  const question=mock.session.current;
  assert.ok(question);
  questions.push(question);
  await run('stop_turn',{id:mock.turn.id,technicalStatus:'skipped',sha256:null});
  mock=await run('submit_answer',{sessionId,questionId:question.id});
  assert.equal(mock.session.questionCount,10);
 }
 assert.equal(mock.session.current,null);
 assert.equal(mock.answers.length,10);
 assert.deepEqual(questions.map(question=>question.section),['part1','part1','part1','part1','part2','part2','part3','part3','part3','part3']);
 assert.equal(questions[4].prepSeconds,60);
 assert.equal(questions[4].responseMaxSeconds,120);
 assert.equal(questions[5].responseMaxSeconds,30);
 assert.equal((await run('finish_mock',{id:sessionId})).job.status,'queued');
});

test('a stored 33-answer IELTS mock produces a bounded report and preserves its answers', async () => {
 const repo=new MemoryRepo(),exam='ielts',set=speakingMockSets.find(item=>item.exam===exam),sectionSizes=[14,2,17];
 const queue=set.sections.flatMap(({questions},index)=>Array.from({length:sectionSizes[index]},(_,i)=>({
  ...questions[i%questions.length],id:`legacy-${index}-${i}`,
 })));
 const [session]=await repo.write(uid,[op('session','legacy',{queue,cursor:33,status:'queued',attemptKind:'baseline'},{exam})]);
 const saved=await repo.write(uid,queue.map((question,i)=>op('answer',question.id,{
  question,questionId:question.id,status:'answered',sourceKind:'audio',elapsedSeconds:i+1,attemptKind:'baseline',
 },{exam,parentId:session.id})));
 const job=await repo.enqueue(uid,'assess',session.id,'legacy');
 let calls=0,transcriptions=0,active=0,peak=0;
 const worker=new SpeakingWorker(repo,{env:testEnv,fetcher:async(url,options)=>{
  assert.ok(url.endsWith('/chat/completions'));
  calls++;
  const data=JSON.parse(JSON.parse(options.body).messages[1].content);
  assert.deepEqual(data.answers.map(answer=>answer.question.section),['part1','part1','part1','part1','part2','part2','part3','part3','part3','part3']);
  assert.equal(data.answers[4].question.taskType,'cue_card');
  return Response.json({choices:[{message:{content:JSON.stringify(assessmentFixture(data.answers))}}]});
 }});
 worker.transcript=async (_job,answer)=>{
  transcriptions++;
  active++;
  peak=Math.max(peak,active);
  await new Promise(resolve=>setImmediate(resolve));
  active--;
  return (await repo.write(uid,[op('transcript','original:'+answer.id,{
   text:'I good at explaining ideas and helping other people.',durationVerified:true,durationSeconds:answer.payload.elapsedSeconds,
  },{exam,parentId:answer.id,mode:'insert'})]))[0];
 };
 assert.equal((await worker.once()).status,'completed');
 const finished=await repo.job(uid,job.id),report=await repo.byId(uid,finished.result_id,'assessment');
 assert.equal(calls,1);
 assert.equal(transcriptions,10);
 assert.equal(peak,3);
 assert.equal(report.payload.answerAnalyses.length,10);
 assert.equal(report.payload.coverage.submittedAnswerCount,33);
 assert.equal(report.payload.comparisonGroup,'legacy_full_mock');
 assert.deepEqual((await repo.list(uid,'answer',exam)).reverse(),saved);
});

test('the full exam room holds each question and clock until the microphone starts its turn', async () => {
 const repo = new MemoryRepo();
 let clock = new Date('2026-11-02T06:00:00Z');
 const service = new SpeakingService(repo, {env: testEnv, now: () => clock});
 const run = (action, data = {}) => service.run(actor, action, {examMode: 'multilevel', ...data});
 await run('profile', {profile: profile('multilevel')});
 const creation = {token: randomUUID(), consent: true, examRoom: true};
 let snapshot = await run('start_mock', creation);
 const sessionId = snapshot.session.id;
 assert.equal(snapshot.session.examRoom, true);
 assert.equal(snapshot.turn, null);
 assert.equal(snapshot.session.current.prompt, undefined);
 clock = new Date(clock.getTime() + 180_000);
 snapshot = await run('session', {id: sessionId});
 assert.equal(snapshot.turn, null);
 assert.equal((await run('start_mock', creation)).session.id, sessionId);

 while (snapshot.session.current) {
  const {id: questionId, prepSeconds, responseMaxSeconds} = snapshot.session.current;
  assert.equal(snapshot.session.current.prompt, undefined);
  assert.equal(snapshot.turn, null);
  const started = await run('begin_turn', {sessionId, questionId});
  const {promptUntil, prepUntil, deadline} = started.turn.payload;
  assert.ok(started.question.prompt);
  assert.ok(Date.parse(promptUntil) > clock.getTime());
  assert.equal(Date.parse(prepUntil) - Date.parse(promptUntil), prepSeconds * 1000);
  assert.equal(Date.parse(deadline) - Date.parse(prepUntil), responseMaxSeconds * 1000);
  clock = new Date(Date.parse(prepUntil) + 2000);
  const resumed = await run('session', {id: sessionId});
  assert.equal(resumed.session.current.prompt, started.question.prompt);
  assert.equal(resumed.turn.payload.deadline, deadline);
  assert.equal((await run('begin_turn', {sessionId, questionId})).turn.id, started.turn.id);
  await run('stop_turn', {id: started.turn.id, sha256: null, technicalStatus: 'skipped'});
  snapshot = await run('submit_answer', {sessionId, questionId});
 }
 assert.equal(snapshot.answers.length, 8);
 assert.ok(snapshot.answers.every(answer => answer.payload.elapsedSeconds === 2));
});

test('the interviewer starts the prep and response clocks once, within the server presentation bound', async () => {
 const repo = new MemoryRepo();
 let clock = new Date('2026-11-02T06:00:00Z');
 const service = new SpeakingService(repo, {env: testEnv, now: () => clock});
 const run = (action, data = {}) => service.run(actor, action, {examMode: 'multilevel', ...data});
 await run('profile', {profile: profile('multilevel')});
 let snapshot = await run('start_mock', {token: randomUUID(), consent: true, examRoom: true});
 const sessionId = snapshot.session.id;

 while (snapshot.session.current.part !== '2') {
  const questionId = snapshot.session.current.id;
  const {turn} = await run('begin_turn', {sessionId, questionId, interviewer: true});
  assert.equal(turn.payload.examinerPending, true);
  if (snapshot.session.cursor === 0) assert.match(turn.payload.interviewerCue, /I'm Alex/);
  if (snapshot.session.cursor === 3) assert.match(turn.payload.interviewerCue, /two pictures/);
  clock = new Date(clock.getTime() + 2500);
  const [first, concurrent] = await Promise.all([run('finish_prompt', {id: turn.id}), run('finish_prompt', {id: turn.id})]);
  assert.deepEqual(first.turn, concurrent.turn);
  assert.equal(first.turn.payload.promptUntil, clock.toISOString());
  assert.equal(first.turn.payload.prepUntil, clock.toISOString());
  assert.equal(first.turn.payload.examinerPending, false);
  assert.equal(Date.parse(first.turn.payload.deadline) - clock.getTime(), turn.payload.responseMax * 1000);
  clock = new Date(clock.getTime() + 2000);
  assert.equal((await run('finish_prompt', {id: turn.id})).turn.payload.deadline, first.turn.payload.deadline);
  await run('stop_turn', {id: turn.id, sha256: null, technicalStatus: 'skipped'});
  snapshot = await run('submit_answer', {sessionId, questionId});
 }

 const {turn} = await run('begin_turn', {sessionId, questionId: snapshot.session.current.id, interviewer: true});
 assert.match(turn.payload.interviewerCue, /one minute to prepare/);
 await assert.rejects(service.run(other, 'finish_prompt', {id: turn.id}), {code: 'NOT_FOUND'});
 clock = new Date(Date.parse(turn.payload.promptUntil) + 5000);
 const {turn: late} = await run('finish_prompt', {id: turn.id});
 assert.equal(late.payload.prepUntil, turn.payload.prepUntil);
 assert.equal(late.payload.deadline, turn.payload.deadline);
 assert.equal(Date.parse(late.payload.prepUntil) - Date.parse(late.payload.promptUntil), 60_000);
 assert.equal(Date.parse(late.payload.deadline) - Date.parse(late.payload.prepUntil), 120_000);
});

test('written interview answers keep the server clock and receive text feedback without an audio baseline', async () => {
 const repo = new MemoryRepo();
 let clock = new Date('2026-11-02T06:00:00Z');
 const service = new SpeakingService(repo, {env: testEnv, now: () => clock});
 const run = (action, data = {}) => service.run(actor, action, {examMode: 'multilevel', ...data});
 await run('profile', {profile: profile('multilevel')});
 let snapshot = await run('start_mock', {token: randomUUID(), consent: true, examRoom: true, answerMode: 'typed'});
 const sessionId = snapshot.session.id;
 assert.equal(snapshot.session.answerMode, 'typed');
 const text = 'I good at explaining ideas. I use a clear example and give a practical reason for my opinion. '.repeat(2).trim();
 while (snapshot.session.current) {
  const {id: questionId, prepSeconds} = snapshot.session.current;
  const first = snapshot.session.cursor === 0;
  const input = {sessionId, questionId, text};
  const started = await run('begin_turn', {sessionId, questionId, interviewer: true});
  assert.equal(started.turn.payload.answerMode, 'typed');
  assert.equal((await run('session', {id: sessionId})).turn.id, started.turn.id);
  await assert.rejects(run('submit_answer', input), {code: 'ANSWER_NOT_OPEN'});
  if (first) {
   await assert.rejects(run('submit_answer', {...input, text: '   '}), {code: 'WRITTEN_ANSWER'});
   await assert.rejects(run('submit_answer', {...input, text: 'x'.repeat(4001)}), {code: 'WRITTEN_ANSWER'});
   await assert.rejects(run('submit_answer', {...input, audioId: randomUUID()}), {code: 'ANSWER_MODE'});
  }
  clock = new Date(clock.getTime() + 2500);
  const {turn} = await run('finish_prompt', {id: started.turn.id});
  if (prepSeconds > 0) await assert.rejects(run('submit_answer', input), {code: 'ANSWER_NOT_OPEN'});
  clock = new Date(Date.parse(turn.payload.deadline) + 3000);
  if (first) {
   const [saved, repeated] = await Promise.all([run('submit_answer', input), run('submit_answer', input)]);
   assert.equal(saved.answers.length, 1);
   assert.equal(repeated.answers[0].id, saved.answers[0].id);
   assert.equal((await run('submit_answer', {...input, text: 'Changed later.'})).answers[0].payload.text, text);
   snapshot = saved;
  } else snapshot = await run('submit_answer', input);
  const answer = snapshot.answers.find(row => row.payload.questionId === questionId);
  assert.equal(answer.payload.sourceKind, 'typed');
  assert.equal(answer.payload.audioId, null);
  assert.equal(answer.payload.recordedAt, turn.payload.deadline);
 }
 assert.equal(snapshot.answers.length, 8);

 let feedbackCalls = 0;
 const worker = new SpeakingWorker(repo, {env: testEnv, now: () => clock, fetcher: async (url, options) => {
  assert.ok(url.endsWith('/chat/completions'));
  feedbackCalls++;
  const data = JSON.parse(JSON.parse(options.body).messages[1].content);
  assert.equal(data.assessmentConstraints.writtenInterview, true);
  assert.ok(data.answers.every(answer => answer.transcript === text && !answer.durationVerified));
  return Response.json({choices: [{message: {content: JSON.stringify(assessmentFixture(data.answers))}}]});
 }});
 await run('finish_mock', {id: sessionId});
 assert.equal((await worker.once()).status, 'completed');
 assert.equal(feedbackCalls, 1);
 const home = await run('home');
 assert.equal(home.baseline, null);
 const assessment = home.assessments[0].payload;
 assert.equal(assessment.attemptKind, 'written_mock');
 assert.equal(assessment.textProfile, null);
 assert.ok(assessment.wordCount > 150);
 assert.ok(assessment.criterionResults.every(criterion => criterion.score === null));
 assert.ok(assessment.answerAnalyses.every(answer => answer.errors.length === 1));
 assert.equal(repo.jobRows.some(job => job.kind === 'plan'), false);
});

test('one audio preparation closes the turn, binds the clip and recovers a lost signing response', async () => {
 const repo = new MemoryRepo();
 let clock = new Date('2026-11-02T06:00:00Z');
 const service = new SpeakingService(repo, {env: testEnv, now: () => clock});
 const run = (action, data = {}) => service.run(actor, action, {examMode: 'multilevel', ...data});
 await run('profile', {profile: profile('multilevel')});
 const {session} = await run('start_mock', {token: randomUUID(), consent: true, examRoom: true});
 const questionId = session.current.id;
 const {turn} = await run('begin_turn', {sessionId: session.id, questionId, interviewer: true});
 const sha256 = createHash('sha256').update('fixture voice').digest('hex');
 const prepare = {parentKind: 'session', parentId: session.id, turnId: turn.id, sha256, token: randomUUID(), bytes: 512, mime: 'audio/webm'};
 await assert.rejects(run('prepare_audio', prepare), {code: 'ANSWER_NOT_OPEN'});
 const {turn: ready} = await run('finish_prompt', {id: turn.id});
 clock = new Date(Date.parse(ready.payload.prepUntil) + 4000);
 const originalSign = repo.signedUpload.bind(repo);
 let signCalls = 0;
 repo.signedUpload = async path => {
  if (++signCalls === 1) throw new AiError('SPEAKING_NETWORK', 'Lost signing response.', 503, true);
  return originalSign(path);
 };
 await assert.rejects(run('prepare_audio', prepare), {code: 'SPEAKING_NETWORK'});
 const stored = await repo.read(uid, 'audio', 'audio:' + prepare.token);
 const firstStop = await repo.byId(uid, turn.id, 'turn');
 assert.equal(firstStop.payload.stoppedAt, clock.toISOString());
 assert.equal(firstStop.payload.sha256, sha256);
 assert.equal(stored.payload.turnId, turn.id);
 clock = new Date(clock.getTime() + 8000);
 assert.equal((await run('prepare_audio', prepare)).assetId, stored.id);
 assert.equal((await repo.byId(uid, turn.id, 'turn')).payload.stoppedAt, firstStop.payload.stoppedAt);
 await assert.rejects(run('prepare_audio', {...prepare, bytes: 513}), {code: 'AUDIO_OWNER'});
 await assert.rejects(run('prepare_audio', {...prepare, token: randomUUID(), sha256: 'a'.repeat(64)}), {code: 'AUDIO_HASH'});

 const next = await run('submit_answer', {sessionId: session.id, questionId, audioId: stored.id});
 assert.equal(next.answers[0].payload.elapsedSeconds, 4);
 assert.deepEqual(await run('prepare_audio', prepare), {assetId: stored.id, submitted: true});
 const nextQuestion = next.session.current.id;
 const {turn: nextTurn} = await run('begin_turn', {sessionId: session.id, questionId: nextQuestion});
 await run('stop_turn', {id: nextTurn.id, sha256, technicalStatus: 'recorded'});
 await assert.rejects(run('submit_answer', {sessionId: session.id, questionId: nextQuestion, audioId: stored.id}), {code: 'AUDIO_OWNER'});
 assert.equal((await run('session', {id: session.id})).answers.length, 1);
});

test('real service and durable worker flow, with controlled Groq HTTP fixtures',async t=>{
 const repo=new MemoryRepo();let clock=new Date('2026-11-02T06:00:00Z');const service=new SpeakingService(repo,{env:testEnv,now:()=>clock}),run=(a,p={})=>service.run(actor,a,{examMode:'multilevel',...p});
 await t.test('no baseline means no fake roadmap or practice diagnosis',async()=>{await run('profile',{profile:profile('multilevel')});const h=await run('home');assert.equal(h.baseline,null);assert.equal(h.roadmap,null);assert.equal(h.today,null);await assert.rejects(run('practice_question'),{code:'BASELINE_REQUIRED'});await assert.rejects(run('replan'),{code:'BASELINE_REQUIRED'});});
 let mock=await run('start_mock',{token:randomUUID(),consent:true});const sessionId=mock.session.id;
 await t.test('server starts timing when the question is revealed; reload does not restart it',async()=>{assert.equal(mock.session.current.responseMaxSeconds,30);assert.ok(mock.turn);const deadline=mock.turn.payload.deadline;clock=new Date(clock.getTime()+5000);const resumed=await run('session',{id:sessionId});assert.equal(resumed.turn.payload.deadline,deadline);assert.equal(resumed.session.current.id,mock.session.current.id);assert.equal(JSON.stringify(resumed.session).includes('queue'),false);});
 const audioBytes=new Uint8Array(200);audioBytes.set([0x1a,0x45,0xdf,0xa3]);let firstAnswerId,firstAudioId,part2Seen=false,part3Seen=false;
 while(mock.session.current){const q=mock.session.current,turn=mock.turn;if(q.section==='part2'){part2Seen=true;assert.equal(q.taskPoints.length,3);assert.equal(q.prepSeconds,60);assert.equal(q.responseMaxSeconds,120);}if(q.section==='part3'){part3Seen=true;assert.ok(q.forPoints.length>=2);assert.ok(q.againstPoints.length>=2);}clock=new Date(Date.parse(turn.payload.prepUntil)+Math.min(15,turn.payload.responseMax)*1000);await run('stop_turn',{id:turn.id,sha256:createHash('sha256').update(audioBytes).digest('hex'),technicalStatus:'recorded'});const asset=await run('prepare_audio',{parentId:sessionId,parentKind:'session',mime:'audio/webm',bytes:200,token:randomUUID()});repo.audio.set(asset.path,new Blob([audioBytes]));if(!firstAudioId)firstAudioId=asset.assetId;const lastQuestion=q.id;mock=await run('submit_answer',{sessionId,questionId:q.id,audioId:asset.assetId});firstAnswerId||=mock.answers[0].id;const afterDuplicate=await run('submit_answer',{sessionId,questionId:lastQuestion,audioId:asset.assetId});assert.equal(afterDuplicate.answers.length,mock.answers.length);}
 assert.ok(part2Seen&&part3Seen);assert.equal(mock.answers.length,8);
 let finished;
 await t.test('finish is idempotent and another user cannot read private entities',async()=>{finished=await run('finish_mock',{id:sessionId});const again=await run('finish_mock',{id:sessionId});assert.equal(finished.job.id,again.job.id);for(const [action,data] of [['session',{id:sessionId}],['audio_url',{id:firstAudioId}],['job',{id:finished.job.id}]])await assert.rejects(service.run(other,action,data),{code:'NOT_FOUND'});});
 let sttCalls=0,chatCalls=0;const fetcher=async(url,options)=>{if(url.endsWith('/audio/transcriptions')){sttCalls++;return Response.json({text:'I good at explaining ideas. I like learning practical skills because I can help my classmates. For example, I explain one step and then we try it together.',segments:[{start:0,end:15,no_speech_prob:.01,avg_logprob:-.1}],words:[]});}chatCalls++;const body=JSON.parse(options.body),data=JSON.parse(body.messages[1].content),schema=body.response_format.json_schema.schema;let v;if(schema.properties.answerAnalyses)v=assessmentFixture(data.answers);else if(schema.properties.weeks)v=planFixture(data);else if(schema.properties.items)v={items:Array.from({length:data.count},(_,i)=>({phraseEn:['be good at','for example','work together','in my view','as a result'][i],meaningUz:'Ma’nosi '+i,pattern:'phrase + example',usageNoteUz:'Tabiiy kontekstda ishlating.',exampleEn:'We work together.',exampleUz:'Birga ishlaymiz.',personalisedExampleEn:'We work together on a project.',commonMistake:'work in together',correctVersion:'work together',recallTask:'Iborani xotiradan ayting.',transferQuestion:'How do you help your friends?',sourceErrorIds:data.errors.slice(0,1).map(e=>e.errorId)}))};else v={answerUz:'Bo‘limni oching va ko‘rsatilgan qadamni bajaring.',routeIds:['biology']};assert.equal(body.response_format.json_schema.strict,true);assert.ok(!body.messages[1].content.includes(testEnv.GROQ_API_KEY));return Response.json({choices:[{message:{content:JSON.stringify(v)}}],usage:{prompt_tokens:10,completion_tokens:30}});};
 const worker=new SpeakingWorker(repo,{env:testEnv,now:()=>clock,fetcher,probe:async()=>15});
 await t.test('private audio -> original transcript -> validated partial assessment -> queued roadmap',async()=>{const r=await worker.once();assert.equal(r.status,'completed');assert.equal(sttCalls,8);const h=await run('home');assert.ok(h.baseline);assert.equal(h.baseline.payload.overallBand,null);assert.equal(h.baseline.payload.scaledScore75,null);assert.equal(h.baseline.payload.criterionResults.find(c=>c.criterion==='pronunciation').score,null);assert.equal(h.errors[0].payload.category,'missing_be');assert.ok(repo.jobRows.some(j=>j.kind==='plan'&&j.status==='queued'));});
 await t.test('personal roadmap and user-local daily plan persist without repeat AI GET calls',async()=>{assert.equal((await worker.once()).status,'completed');const before=chatCalls,h=await run('home');assert.ok(h.roadmap);assert.equal(h.today.payload.tasks.reduce((n,t)=>n+t.minutes,0),20);const second=await run('home');assert.equal(second.today.id,h.today.id);assert.equal(chatCalls,before);const day=h.today;await run('task_done',{id:day.id,taskId:day.payload.tasks[0].id});assert.equal((await run('home')).today.payload.completedTaskIds.length,1);});
 await t.test('today vocabulary is an explicit idempotent job; viewing/recall cannot grant mastery',async()=>{const h=await run('home'),j=await run('prepare_day',{id:h.today.id}),j2=await run('prepare_day',{id:h.today.id});assert.equal(j.job.id,j2.job.id);assert.equal((await worker.once()).status,'completed');const words=(await run('home')).vocabulary;assert.equal(words.length,3);const before=words[0],review=await run('review',{id:before.id,success:true,token:randomUUID()});assert.equal(review.item.payload.masteryStatus,'new');assert.equal(review.item.payload.reviewDueAt,'2026-11-03');});
 await t.test('manual transcript revision preserves original baseline and creates a separate analysis',async()=>{const original=(await repo.list(uid,'transcript','multilevel',100)).find(t=>t.payload.answerId===firstAnswerId),h=await run('home'),baselineId=h.baseline.id,before=original.payload.text;const r=await run('transcript_revision',{id:original.id,text:'I am good at explaining ideas.',token:randomUUID()});assert.equal(r.transcript.payload.originalRevisionId,original.id);assert.equal((await repo.byId(uid,original.id,'transcript')).payload.text,before);assert.equal((await worker.once()).status,'completed');const after=await run('home');assert.equal(after.baseline.id,baselineId);assert.ok(after.assessments.some(a=>a.payload.attemptKind==='transcript_revision'));});
 await t.test('typed practice stays separate; a model-viewed repeat cannot become a fresh diagnosis',async()=>{const q=await run('practice_question'),again=await run('practice_question');assert.equal(q.question.id,again.question.id);await run('mark_model_seen',{questionId:q.question.id});const p=await run('practice_submit',{questionId:q.question.id,text:'I good at describing everyday routines.',token:randomUUID()});assert.equal(p.answer.payload.hasSeenModelAnswer,true);assert.equal((await worker.once()).status,'completed');const repeat=await run('practice_submit',{questionId:q.question.id,text:'I am good at describing everyday routines.',token:randomUUID(),retakeOf:p.answer.id});assert.equal(repeat.answer.payload.attemptKind,'aided_repeat');assert.equal(repeat.answer.payload.isFirstAttempt,false);await worker.once();});
 await t.test('guide AI is grounded in student routes and has durable history',async()=>{const j=await run('guide',{message:'Biologiyani qanday ishlataman?',view:'biology',token:randomUUID()});assert.equal((await worker.once()).status,'completed');const job=await run('job',{id:j.job.id}),g=await run('guide_result',{id:job.job.result_id});assert.deepEqual(g.guide.payload.routeIds,['biology']);assert.ok(!g.guide.payload.features.some(f=>f.id==='admin'));assert.equal((await run('guide_history')).guides.length,1);});
 await t.test('weekly mini-check has three fresh timed tasks and its own attempt kind',async()=>{const s=await run('start_check',{token:randomUUID(),consent:true});assert.equal(s.session.attemptKind,'weekly_check');assert.equal(s.session.questionCount,3);assert.ok(!s.session.current.id.startsWith('sp746-multilevel-01'));assert.ok(s.turn.payload.deadline);await run('cancel_session',{id:s.session.id});});
 await t.test('audio deletion removes private object but explicitly retains transcript',async()=>{const a=await repo.byId(uid,firstAudioId,'audio');assert.ok(repo.audio.has(a.payload.path));const r=await run('delete_audio',{id:firstAudioId});assert.equal(r.transcriptRetained,true);assert.ok(!repo.audio.has(a.payload.path));assert.ok((await repo.list(uid,'transcript',null,200)).some(t=>t.payload.answerId===firstAnswerId));await assert.rejects(run('audio_url',{id:firstAudioId}),{code:'AUDIO_EXPIRED'});});
 await t.test('export is owner-scoped and privacy purge preserves another account',async()=>{await service.run(other,'profile',{examMode:'ielts',profile:profile('ielts')});assert.ok((await run('export')).records.every(r=>r.user_id===uid));await run('delete_data',{confirm:'DELETE_SPEAKING'});assert.equal((await run('home')).profile,null);assert.ok(await repo.read(otherUid,'profile','ielts'));});
});
test('missing provider key cannot enqueue fake assessments and keeps the recorded attempt',async()=>{const repo=new MemoryRepo(),service=new SpeakingService(repo,{env:{}}),[s]=await repo.write(uid,[op('session','ready',{cursor:1,queue:[{}],status:'started'},{exam:'ielts'})]);await assert.rejects(service.run(actor,'finish_mock',{id:s.id}),{code:'GROQ_NOT_CONFIGURED'});assert.equal(repo.rows.length,1);assert.equal(repo.jobRows.length,0);});
test('baseline survives long practice history and is never reclassified by pagination',async()=>{const repo=new MemoryRepo(),service=new SpeakingService(repo,{env:testEnv});await service.run(actor,'profile',{examMode:'ielts',profile:profile('ielts')});const [baseline]=await repo.write(uid,[op('assessment','original-baseline',{attemptKind:'baseline',answerAnalyses:[]},{exam:'ielts'})]);await repo.write(uid,[op('receipt','baseline:ielts',{assessmentId:baseline.id},{exam:'ielts',parentId:baseline.id})]);await repo.write(uid,Array.from({length:65},(_,i)=>op('assessment','practice-'+i,{attemptKind:'aided_repeat',answerAnalyses:[]},{exam:'ielts'})));const home=await service.run(actor,'home',{examMode:'ielts'});assert.equal(home.baseline.id,baseline.id);assert.ok(home.assessments.some(a=>a.id===baseline.id));const session=await service.run(actor,'start_mock',{examMode:'ielts',token:randomUUID(),consent:true});assert.equal(session.session.attemptKind,'recheck');const plan=await service.run(actor,'replan',{examMode:'ielts'});assert.equal((await repo.job(uid,plan.job.id)).target_id,baseline.id);});
test('429/timeout retry reuses original ASR and fails in bounded durable attempts',async()=>{const repo=new MemoryRepo(),[a]=await repo.write(uid,[op('answer','typed',{sourceKind:'typed',text:'I good at explaining ideas.',status:'answered',questionId:'q',question:{formatVersion:'test',imageIds:[]},attemptKind:'practice'},{exam:'ielts'})]);await repo.enqueue(uid,'practice',a.id,'one');const worker=new SpeakingWorker(repo,{env:testEnv,fetcher:async()=>{throw new AiError('GROQ_NETWORK','Network failure',503,true);}});for(let i=0;i<3;i++)await worker.once();assert.equal(repo.jobRows[0].status,'failed');assert.equal(repo.jobRows[0].attempts,3);assert.equal((await repo.list(uid,'transcript',null)).length,1);assert.equal((await repo.list(uid,'answer',null)).length,1);});
test('ffprobe checks real WAV bytes and rejects corrupt recordings without asking a model',async()=>{const samples=8000,b=Buffer.alloc(44+samples*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(8000,24);b.writeUInt32LE(16000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)b.writeInt16LE(Math.round(Math.sin(i/8000*440*Math.PI*2)*2000),44+i*2);assert.ok(Math.abs(await probeAudio(b,'audio/wav')-1)<.02);await assert.rejects(probeAudio(Buffer.from('fake recording'),'audio/webm'),{code:'AUDIO_SIGNATURE'});});
test('retention sweep deletes only expired audio while transcripts survive',async()=>{const repo=new MemoryRepo(),[expired,fresh,transcript]=await repo.write(uid,[op('audio','expired',{path:'expired.webm',expiresAt:'2026-10-01T00:00:00Z',deletedAt:null}),op('audio','fresh',{path:'fresh.webm',expiresAt:'2026-12-01T00:00:00Z',deletedAt:null}),op('transcript','original',{text:'Original retained transcript.'})]);repo.audio.set('expired.webm',new Blob(['old']));repo.audio.set('fresh.webm',new Blob(['new']));const q={select(){return this;},eq(){return this;},lte(){return this;},is(){return this;},async limit(){return {data:[structuredClone(expired)],error:null};}};repo.db={from(){return q;}};const r=await new SpeakingWorker(repo,{now:()=>new Date('2026-11-02T00:00:00Z')}).cleanup();assert.equal(r.expiredDeleted,1);assert.ok(!repo.audio.has('expired.webm'));assert.ok(repo.audio.has('fresh.webm'));assert.ok((await repo.byId(uid,transcript.id,'transcript')).payload.text);assert.equal((await repo.byId(uid,fresh.id,'audio')).payload.deletedAt,null);});
test('corrected transcript and rehearsed answer never award active mastery',async()=>{const repo=new MemoryRepo(),[state]=await repo.write(uid,[op('error','ielts:missing_be',{category:'missing_be',status:'practising',occurrences:[]},{exam:'ielts'})]),worker=new SpeakingWorker(repo),answer={id:randomUUID(),payload:{questionId:'q-new',attemptKind:'transfer',isFirstAttempt:true,hasSeenPrompt:false,hasSeenModelAnswer:false,sourceKind:'audio'}},check={answerId:answer.id,category:'missing_be',sourceQuote:'I am ready',correctUse:true,confidence:'high'},rows=[{answer,transcript:{payload:{uncertain:false,needsReview:true}}}],record={exam_mode:'ielts',payload:{attemptKind:'transcript_revision',targetChecks:[check],phraseUses:[],answerAnalyses:[]}};await worker.updateTransfer({user_id:uid},record,rows);assert.equal((await repo.byId(uid,state.id,'error')).payload.status,'practising');record.payload.attemptKind='transfer';answer.payload.hasSeenModelAnswer=true;rows[0].transcript.payload.needsReview=false;await worker.updateTransfer({user_id:uid},record,rows);assert.equal((await repo.byId(uid,state.id,'error')).payload.status,'practising');});
