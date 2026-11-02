import test from 'node:test';
import assert from 'node:assert/strict';
import {runSpeakingWorker} from '../scripts/speaking-worker.mjs';

test('worker survives a transient claim error and resumes polling without logging exception details',async()=>{
 let calls=0,stopped=false;const waits=[],logs=[];
 const exit=await runSpeakingWorker({cleanup:async()=>{},once:async()=>{if(++calls===1)throw Error('private database URL and server secret');return {idle:true};}},{now:()=>0,isStopped:()=>stopped,log:item=>logs.push(item),sleep:async ms=>{waits.push(ms);if(calls===2)stopped=true;}});
 assert.equal(exit,0);assert.equal(calls,2);assert.deepEqual(waits,[2000,2000]);assert.deepEqual(logs,[{code:'WORKER_RETRY',retryInMs:2000}]);assert.doesNotMatch(JSON.stringify(logs),/private|secret|database URL/);
});

test('worker retry backoff stays bounded and shutdown prevents another claim',async()=>{
 let stopped=false,calls=0;const waits=[];
 await runSpeakingWorker({cleanup:async()=>{},once:async()=>{calls++;throw {message:'token must never be logged',code:'private-token'};}},{now:()=>0,isStopped:()=>stopped,log:()=>{},sleep:async ms=>{waits.push(ms);if(waits.length===6)stopped=true;}});
 assert.deepEqual(waits,[2000,4000,8000,16000,30000,30000]);assert.equal(calls,6);
});

test('--once returns a failure status without sleeping or exposing the thrown error',async()=>{
 const logs=[];let calls=0;
 const exit=await runSpeakingWorker({cleanup:async()=>{},once:async()=>{calls++;throw Error('gsk_private_test_secret');}},{once:true,now:()=>0,log:item=>logs.push(item),sleep:async()=>assert.fail('One-shot runs must not wait')});
 assert.equal(exit,1);assert.equal(calls,1);assert.deepEqual(logs,[{code:'WORKER_ONCE_FAILED'}]);assert.doesNotMatch(JSON.stringify(logs),/gsk_/);
 assert.equal(await runSpeakingWorker({cleanup:async()=>{},once:async()=>({idle:true})},{once:true,log:()=>{}}),0);
 for(const status of ['failed','queued'])assert.equal(await runSpeakingWorker({cleanup:async()=>{},once:async()=>({status})},{once:true,log:()=>{}}),1);
});

test('retention failure does not stop polling, and retention retries every ten minutes',async()=>{
 let clock=0,stopped=false,cleanups=0,polls=0;const logs=[];
 const exit=await runSpeakingWorker({cleanup:async()=>{if(++cleanups===1)throw Error('private storage path');},once:async()=>{polls++;return {idle:true};}},{now:()=>clock,isStopped:()=>stopped,log:item=>logs.push(item),sleep:async()=>{clock+=300000;if(polls===5)stopped=true;}});
 assert.equal(exit,0);assert.equal(polls,5);assert.equal(cleanups,3);assert.deepEqual(logs,[{code:'RETENTION_RETRY'}]);
});

test('cleanup-only failures return nonzero and a stopped worker performs no work',async()=>{
 const logs=[];
 assert.equal(await runSpeakingWorker({cleanup:async()=>{throw Error('secret');}},{cleanup:true,log:item=>logs.push(item)}),1);assert.deepEqual(logs,[{code:'RETENTION_RETRY'}]);
 const untouched={cleanup:async()=>assert.fail('Stopped worker must not clean'),once:async()=>assert.fail('Stopped worker must not claim')};
 assert.equal(await runSpeakingWorker(untouched,{isStopped:()=>true}),0);
});
