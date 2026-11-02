import test from 'node:test';
import assert from 'node:assert/strict';
import {groqRequest,structured} from '../server/speaking/groq.js';

const env={GROQ_API_KEY:'test-server-key'};

test('provider schema generation failures are retried while invalid request parameters are not',async()=>{
 let calls=0;
 const result=await groqRequest('/chat/completions',{}, {env,sleep:async()=>{},fetcher:async()=>{
  calls++;
  return calls===1?Response.json({error:{code:'json_validate_failed',message:'private generation detail'}},{status:400}):Response.json({ok:true});
 }});
 assert.deepEqual(result,{ok:true});assert.equal(calls,2);
 calls=0;
 await assert.rejects(groqRequest('/chat/completions',{}, {env,sleep:async()=>{},fetcher:async()=>{calls++;return Response.json({error:{code:'invalid_request_error'}},{status:400});}}),{code:'GROQ_400',retryable:false});
 assert.equal(calls,1);
});

test('interactive AI stops before a provider retry would exceed its total deadline',async()=>{
 let calls=0;
 await assert.rejects(groqRequest('/chat/completions',{}, {env,totalTimeoutMs:50,fetcher:async()=>{
  calls++;
  return new Response('{}',{status:429,headers:{'retry-after':'30'}});
 }}),{code:'GROQ_TIMEOUT',status:504});
 assert.equal(calls,1);
});

test('structured calls forward attempt limits and cancel a stalled provider request',async()=>{
 let calls=0;
 const schema={type:'object',properties:{answer:{type:'string'}},required:['answer'],additionalProperties:false};
 await assert.rejects(structured('Policy',{},schema,{env,totalTimeoutMs:50,maxAttempts:1,fetcher:async(_url,{signal})=>{
  calls++;
  return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));
 }}),e=>['GROQ_TIMEOUT','GROQ_NETWORK'].includes(e.code));
 assert.equal(calls,1);
});
