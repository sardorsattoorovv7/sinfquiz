import test from 'node:test';
import assert from 'node:assert/strict';
import {SpeakingStore} from '../server/speaking/store.js';
import {speakingFetch} from '../server/speaking/transport.js';
import {speakingRequest} from '../src/speaking/request.js';
import {createSpeakingHandler} from '../api/ai-speaking.js';
import {speakingStructured} from '../server/speaking/provider.js';
import {guideSchema} from '../server/speaking/schema.js';
import {MemoryRepo,uid,otherUid} from './speaking-fixtures.js';

const lost={message:'TypeError: fetch failed',code:''};
function database(repo,{when='before',error=lost}={}){
 let calls=0;
 return {
  get calls(){return calls},
  async rpc(_name,args){
   calls++;
   if(calls===1&&when==='before')return {data:null,error};
   const data=await repo.write(args.p_user,args.p_ops);
   return calls===1&&when==='after'?{data:null,error}:{data,error:null};
  },
  from(){const filters=[];const q={select(){return q},eq(key,value){filters.push(row=>row[key]===value);return q},in(key,values){filters.push(row=>values.includes(row[key]));return q},then(resolve,reject){return Promise.resolve({data:structuredClone(repo.rows.filter(row=>filters.every(f=>f(row)))),error:null}).then(resolve,reject)}};return q;},
 };
}

test('a first-turn insert safely retries a lost response and preserves one trusted clock',async()=>{
 const repo=new MemoryRepo(),db=database(repo,{when:'after'}),store=new SpeakingStore(db),ops=[{kind:'turn',key:'session:q1',payload:{deadline:'2026-11-03T10:00:30Z'},mode:'insert'}];
 const rows=await store.write(uid,ops);
 assert.equal(db.calls,2);assert.equal(repo.rows.length,1);assert.equal(rows[0].payload.deadline,ops[0].payload.deadline);assert.equal(rows[0].revision,1);
});

test('an acknowledged-by-read update is not replayed after its response is lost',async()=>{
 const repo=new MemoryRepo();await repo.write(uid,[{kind:'session',key:'one',payload:{cursor:0}}]);
 const db=database(repo,{when:'after'}),store=new SpeakingStore(db),ops=[{kind:'answer',key:'one:q1',payload:{text:'Original answer'},mode:'insert'},{kind:'session',key:'one',payload:{cursor:1},expectedRevision:1}];
 const rows=await store.write(uid,ops);
 assert.equal(db.calls,1);assert.equal(rows[0].payload.text,'Original answer');assert.equal(rows[1].revision,2);assert.equal(repo.rows.filter(r=>r.kind==='answer').length,1);
});

test('an uncommitted revision-guarded update retries once, and a later writer is protected',async()=>{
 const repo=new MemoryRepo();await repo.write(uid,[{kind:'session',key:'one',payload:{cursor:0}}]);
 const db=database(repo),store=new SpeakingStore(db),ops=[{kind:'session',key:'one',payload:{cursor:1},expectedRevision:1}];
 assert.equal((await store.write(uid,ops))[0].revision,2);assert.equal(db.calls,2);
 await repo.write(uid,[{kind:'session',key:'one',payload:{cursor:2},expectedRevision:2}]);
 const stale=database(repo);await assert.rejects(new SpeakingStore(stale).write(uid,ops),{code:'SPEAKING_NETWORK'});assert.equal(stale.calls,1);assert.equal(repo.rows[0].revision,3);
});

test('budget charges and real database failures are never blindly replayed',async()=>{
 let charges=0;const store=new SpeakingStore({rpc:async()=>{charges++;return {error:lost}}});
 await assert.rejects(store.reserve(uid,'api-minute',1,100,1000),{code:'SPEAKING_NETWORK'});assert.equal(charges,1);
 const db=database(new MemoryRepo(),{error:{code:'23514',message:'check constraint failed'}});
 await assert.rejects(new SpeakingStore(db).write(uid,[{kind:'turn',key:'q',payload:{},mode:'insert'}]),{code:'SPEAKING_DATABASE'});assert.equal(db.calls,1);
});

test('server reads retry one disconnected connection; mutations and caller cancellation do not',async()=>{
 let calls=0;const fetcher=async()=>{if(++calls===1)throw Error('fetch failed');return Response.json([])};
 assert.equal((await speakingFetch({fetcher,pause:async()=>{}})('https://fixture.test/data')).status,200);assert.equal(calls,2);
 calls=0;await assert.rejects(speakingFetch({fetcher,pause:async()=>{}})('https://fixture.test/data',{method:'POST'}),/fetch failed/);assert.equal(calls,1);
 const controller=new AbortController();controller.abort();calls=0;
 await assert.rejects(speakingFetch({fetcher})('https://fixture.test/data',{signal:controller.signal}),{name:'AbortError'});assert.equal(calls,0);
});

test('client session recovery retries only connection failures, keeping the same question and token',async()=>{
 const calls=[],fetcher=async(_url,options)=>{calls.push(options);return calls.length===1?Response.json({code:'SPEAKING_NETWORK',retryable:true},{status:503}):Response.json({turn:{id:'same-turn',deadline:'fixed-deadline'}})};
 const result=await speakingRequest('begin_turn',{questionId:'q1'},'fixture-token',{fetcher,pause:async()=>{}});
 assert.equal(result.turn.id,'same-turn');assert.equal(calls.length,2);assert.equal(calls[0].body,calls[1].body);assert.equal(calls[0].headers.Authorization,calls[1].headers.Authorization);
 for(const action of ['start_mock','stop_turn','submit_answer','finish_mock']){
  let attempts=0;await assert.rejects(speakingRequest(action,{},'fixture',{fetcher:async()=>{attempts++;throw Error('connection reset')},pause:async()=>{}}),{code:'SPEAKING_NETWORK'});assert.equal(attempts,1,action);
 }
 let attempts=0;await assert.rejects(speakingRequest('session',{},'fixture',{fetcher:async()=>{attempts++;return Response.json({code:'AUTH_REQUIRED',error:'Kiring'},{status:401})},pause:async()=>{}}),{code:'AUTH_REQUIRED'});assert.equal(attempts,1);
});

test('authentication transport failure stays retryable; an invalid identity remains unauthorized',async()=>{
 for(const [error,status,code] of [[{name:'AuthRetryableFetchError',message:'fetch failed'},503,'SPEAKING_NETWORK'],[{name:'AuthApiError',message:'invalid token',status:401},401,'AUTH_REQUIRED']]){
  const handler=createSpeakingHandler({client:()=>({auth:{getUser:async()=>({data:{user:null},error})}})}),res={setHeader(){},status(value){this.statusCode=value;return this},json(body){this.body=body;return this}};
  await handler({method:'POST',headers:{host:'localhost',authorization:'Bearer fixture'},body:{action:'session',data:{}}},res);
  assert.equal(res.statusCode,status);assert.equal(res.body.code,code);assert.equal(res.body.retryable,status===503);
 }
});

test('a local job claim belongs to the owner and survives a lost response without a duplicate lease',async()=>{
 const row={id:'job',user_id:uid,status:'queued',attempts:0,available_at:new Date(Date.now()-1000).toISOString()};
 let updates=0;
 const store=new SpeakingStore({from(table){
  assert.equal(table,'sq_sp_jobs');
  const conditions=[];
  let changes;
  const query={
   select(){return query;},
   eq(key,value){conditions.push(()=>row[key]===value);return query;},
   lte(key,value){conditions.push(()=>row[key]<=value);return query;},
   update(payload){changes=payload;return query;},
   async maybeSingle(){
    if(!conditions.every(check=>check()))return {data:null,error:null};
    if(!changes)return {data:{...row},error:null};
    updates++;
    Object.assign(row,changes);
    return {data:null,error:lost};
   },
  };
  return query;
 }});
 assert.equal(await store.claimJob(otherUid,row.id),null);
 const results=await Promise.all([store.claimJob(uid,row.id),store.claimJob(uid,row.id)]);
 assert.equal(results.filter(Boolean).length,1);
 assert.equal(results.find(Boolean).lease_token,row.lease_token);
 assert.equal(row.attempts,1);
 assert.equal(updates,1);
 assert.equal(await store.claimJob(uid,row.id),null);
});

test('Speaking schedules only the active job returned for an authenticated request',async()=>{
 const jobs=[],actors=[];
 const handler=createSpeakingHandler({
  client:()=>({auth:{getUser:async token=>({data:{user:token==='owner'?{id:uid}:null}})}}),
  service:()=>({run:async(actor,action)=>{
   actors.push(actor.id);
   return {job:{id:'saved-job',status:action==='job'?'running':action==='finish_mock'?'queued':'completed'}};
  }}),
  onJob:job=>jobs.push(job),
 });
 const request=(token,action)=>{
  const res={setHeader(){},status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}};
  return handler({method:'POST',headers:{host:'localhost',authorization:'Bearer '+token},body:{action,data:{id:'untrusted-id'}}},res);
 };
 assert.equal((await request('unknown','job')).statusCode,401);
 for(const action of ['job','finish_mock','assessment'])assert.equal((await request('owner',action)).statusCode,200);
 assert.deepEqual(jobs,[{userId:uid,jobId:'saved-job'},{userId:uid,jobId:'saved-job'}]);
 assert.deepEqual(actors,[uid,uid,uid]);
});

test('local Speaking sends structured model input only to the numeric loopback endpoint',async()=>{
 const env={SPEAKING_PROVIDER:'local',SPEAKING_LOCAL_WHISPER_PATH:'whisper',SPEAKING_LOCAL_WHISPER_MODEL:'model',GROQ_API_KEY:'fixture-server-key'};
 const value={answerUz:'Salom.',routeIds:[]};
 let requests=0;
 const fetcher=async(url,options)=>{
  requests++;
  assert.equal(url,'http://127.0.0.1:17863/v1/chat/completions');
  assert.equal(options.redirect,'error');
  assert.equal(options.headers.Authorization,undefined);
  const body=JSON.parse(options.body);
  assert.equal(body.chat_template_kwargs.enable_thinking,false);
  assert.deepEqual(body.response_format,{type:'json_schema',json_schema:{name:'sinfquiz_response',strict:true,schema:guideSchema}});
  assert.equal(body.model,'qwen3.5-4b-local');
  return Response.json({choices:[{message:{content:JSON.stringify(value)}}]});
 };
 assert.deepEqual((await speakingStructured('Guide',{},guideSchema,{env,fetcher})).value,value);
 await assert.rejects(speakingStructured('Guide',{},guideSchema,{env:{...env,SPEAKING_LOCAL_LLM_URL:'http://127.0.0.1.example.test'},fetcher}),{code:'LOCAL_AI_CONFIG'});
 assert.equal(requests,1);
});
