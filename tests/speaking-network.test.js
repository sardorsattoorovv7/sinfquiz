import test from 'node:test';
import assert from 'node:assert/strict';
import {SpeakingStore} from '../server/speaking/store.js';
import {speakingFetch} from '../server/speaking/transport.js';
import {speakingRequest} from '../src/speaking/request.js';
import {createSpeakingHandler} from '../api/ai-speaking.js';
import {MemoryRepo,uid} from './speaking-fixtures.js';

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
