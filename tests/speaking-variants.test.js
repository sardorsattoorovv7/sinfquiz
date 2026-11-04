import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SpeakingService} from '../server/speaking/service.js';
import {speakingMockSets,practiceTransferQuestions} from '../server/speaking/questions.js';
import {variantQuestions,questionHistory,questionFingerprint,buildVariant,variantSchema,decodeVariant} from '../server/speaking/variants.js';
import {validateSchema} from '../server/speaking/schema.js';
import {MemoryRepo,profile,uid,testEnv} from './speaking-fixtures.js';
import {AiError} from '../server/speaking/groq.js';

const actor={id:uid,role:'student'};
const draft=(template,tag)=>({title:'Fresh practice '+tag,questions:variantQuestions(template).map((q,i)=>({prompt:`Tell me about a new example of ${tag} in situation ${i+1}.`,taskPoints:q.taskPoints||[],forPoints:q.argumentFor||q.forPoints||[],againstPoints:q.argumentAgainst||q.againstPoints||[]}))});
const setup=async exam=>{
 const repo=new MemoryRepo();let generated=0;
 repo.fingerprints=async()=>new Set(repo.rows.filter(row=>row.record_key.startsWith('seen-question:')).map(row=>row.payload.fingerprint));
 const service=new SpeakingService(repo,{env:testEnv,pick:values=>values.at(-1),generate:async(template,history)=>buildVariant(draft(template,'topic-'+(++generated)),template,history)}),run=(action,data={})=>service.run(actor,action,{examMode:exam,...data});
 await run('profile',{profile:profile(exam)});
 return {repo,service,run,get generated(){return generated}};
};

for(const exam of ['ielts','multilevel'])test(exam+': fresh mocks remain different beyond six variants; reload preserves the active question and deadline',async()=>{
 const state=await setup(exam),seen=new Set();let last,token;
 for(let i=0;i<8;i++){
  token=randomUUID();const result=await state.run('start_mock',{token,consent:true});last=result;
  assert.equal(seen.has(result.session.current.prompt),false);seen.add(result.session.current.prompt);
  const repeat=await state.run('start_mock',{token,consent:true});assert.equal(repeat.session.id,result.session.id);assert.equal(repeat.turn.payload.deadline,result.turn.payload.deadline);
  await state.run('cancel_session',{id:result.session.id});
 }
 assert.equal(state.generated,2);assert.equal(seen.size,8);assert.equal(state.repo.rows.filter(r=>r.kind==='session').length,8);
 // Compact long-history reads must not permit an old question to return.
 const list=state.repo.list.bind(state.repo);state.repo.list=(user,kind,...args)=>['session','receipt'].includes(kind)?Promise.resolve([]):list(user,kind,...args);
 const next=await state.run('start_mock',{token:randomUUID(),consent:true});assert.equal(seen.has(next.session.current.prompt),false);assert.equal(state.generated,3);
 assert.equal(last.session.attemptKind,'baseline','unfinished attempts never invent a completed baseline');
});

test('generated format is fixed by server slots, and duplicate or malformed questions are rejected',()=>{
 const template=speakingMockSets.find(s=>s.exam==='ielts'),value=draft(template,'unique'),history=questionHistory();
 const generated=buildVariant(value,template,history),before=variantQuestions(template),after=variantQuestions(generated);
 assert.equal(after.length,before.length);for(let i=0;i<before.length;i++){assert.equal(after[i].prepSeconds,before[i].prepSeconds);assert.equal(after[i].responseMaxSeconds,before[i].responseMaxSeconds);assert.equal(after[i].section,before[i].section);}
 const blocked=questionHistory([{payload:{queue:[after[0]],revealedIds:[after[0].id]}}]);assert.throws(()=>buildVariant(value,template,blocked),{code:'QUESTION_GENERATION'});
 assert.throws(()=>buildVariant({...value,questions:value.questions.slice(1)},template,history),{code:'QUESTION_GENERATION'});
 const schema=variantSchema(template),raw={title:value.title,questions:{}};
 value.questions.forEach((q,i)=>{const item={prompt:q.prompt};for(const key of ['taskPoints','forPoints','againstPoints'])if(q[key].length)item[key]=Object.fromEntries(q[key].map((p,n)=>['p'+(n+1),p]));raw.questions['q'+(i+1)]=item;});
 assert.doesNotThrow(()=>validateSchema(raw,schema));assert.deepEqual(decodeVariant(raw,template),value);
 assert.throws(()=>validateSchema({...raw,questions:{...raw.questions,q999:{prompt:'Extra'}}},schema),/AI_SCHEMA/);
 assert.equal(questionFingerprint(after[0]),questionFingerprint({...after[0],prompt:after[0].prompt.toUpperCase()}));
 const other=speakingMockSets.find(s=>s.exam==='multilevel'),otherGenerated=buildVariant(draft(other,'unique'),other,questionHistory());assert.notEqual(variantQuestions(otherGenerated)[0].id,after[0].id,'question registries are separate for the two exams');
});

test('a failed question registry write reuses the cached generated variant without another model call',async()=>{
 const state=await setup('multilevel');
 for(let i=0;i<6;i++){const s=await state.run('start_mock',{token:randomUUID(),consent:true});await state.run('cancel_session',{id:s.session.id});}
 const write=state.repo.write.bind(state.repo);let fail=true;
 state.repo.write=async(user,ops)=>{if(fail&&ops.some(op=>op.key.startsWith('generated-question:'))){fail=false;throw new AiError('SPEAKING_NETWORK','Connection reset',503,true)}return write(user,ops)};
 const token=randomUUID();await assert.rejects(state.run('start_mock',{token,consent:true}),{code:'SPEAKING_NETWORK'});
 const result=await state.run('start_mock',{token,consent:true});assert.ok(result.session.current.id.startsWith('sp-new-'));assert.equal(state.generated,1);
});

test('practice gets a new generated prompt after the original pool, and aided re-recording still resolves its question',async()=>{
 const state=await setup('ielts');
 await state.repo.write(uid,[{kind:'assessment',key:'baseline',exam:'ielts',payload:{attemptKind:'baseline'}}]);
 await state.repo.write(uid,practiceTransferQuestions.filter(q=>q.exam==='ielts').map(q=>({kind:'receipt',key:'question:'+q.id,exam:'ielts',payload:{questionId:q.id,modelSeen:true}})));
 const fresh=await state.run('practice_question');assert.ok(fresh.question.id.startsWith('sp-new-'));
 const same=await state.run('practice_question');assert.equal(same.question.id,fresh.question.id);
 const answer=await state.run('practice_submit',{questionId:fresh.question.id,token:randomUUID(),text:'I enjoy learning new things with my friends.'});assert.equal(answer.answer.payload.attemptKind,'transfer');
 await state.run('mark_model_seen',{questionId:fresh.question.id});
 const repeat=await state.run('practice_submit',{questionId:fresh.question.id,retakeOf:answer.answer.id,token:randomUUID(),text:'I enjoy learning new skills with my classmates.'});assert.equal(repeat.answer.payload.attemptKind,'aided_repeat');
});

test('a pending generated practice question survives an interrupted exposure write without a second AI call',async()=>{
 const state=await setup('ielts');await state.repo.write(uid,[{kind:'assessment',key:'baseline',exam:'ielts',payload:{attemptKind:'baseline'}}]);
 await state.repo.write(uid,practiceTransferQuestions.filter(q=>q.exam==='ielts').map(q=>({kind:'receipt',key:'question:'+q.id,exam:'ielts',payload:{questionId:q.id,modelSeen:true}})));
 const write=state.repo.write.bind(state.repo);let fail=true;
 state.repo.write=async(user,ops)=>{if(fail&&ops.some(op=>op.key.startsWith('question:'))){fail=false;throw new AiError('SPEAKING_NETWORK','Response lost',503,true)}return write(user,ops)};
 await assert.rejects(state.run('practice_question'),{code:'SPEAKING_NETWORK'});const fresh=await state.run('practice_question');assert.ok(fresh.question.id.startsWith('sp-new-'));assert.equal(state.generated,1);
});
