import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('assistant browser transport authenticates, propagates cancellation and preserves useful errors',async t=>{
 const originalFetch=globalThis.fetch;
 const vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-tests/assistant-transport',optimizeDeps:{noDiscovery:true,include:[]},root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom',plugins:[{name:'assistant-auth-test',enforce:'pre',load(id){if(id.endsWith('/src/supabase-sdk.js'))return 'export const getSupabase=async()=>({auth:globalThis.__assistantAuthForTest});';}}]});
 try{
  const {assistantApi}=await vite.ssrLoadModule('/src/speaking/assistant-client.js');
  await t.test('anonymous and signed-out users never send a provider request',async()=>{
   let calls=0;globalThis.fetch=async()=>{calls++;throw Error('unexpected request');};
   for(const currentUser of [null,{isAnonymous:true,getIdToken:async()=>'anonymous-token'}]){globalThis.__assistantAuthForTest={currentUser};await assert.rejects(assistantApi({mode:'tutor',message:'Savol'}),e=>e.code==='AUTH_REQUIRED');}
   assert.equal(calls,0);
  });
  await t.test('sends the signed-in session only to the same-origin server endpoint',async()=>{
   globalThis.__assistantAuthForTest={currentUser:{getIdToken:async()=>'test-session-token'}};
   const controller=new AbortController(),input={mode:'tutor',message:'Kasr nima?',view:'mathAtlas',history:[]},answer={answerUz:'Kasr butunning qismini ko‘rsatadi.',routeIds:['mathAtlas'],questions:[]};
   globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/ai-assistant');assert.equal(options.method,'POST');assert.equal(options.headers.Authorization,'Bearer test-session-token');assert.equal(options.signal,controller.signal);assert.deepEqual(JSON.parse(options.body),input);return Response.json(answer);};
   assert.deepEqual(await assistantApi(input,controller.signal),answer);
  });
  await t.test('keeps retry metadata and rejects malformed successful responses',async()=>{
   globalThis.fetch=async()=>Response.json({error:'AI limiti tugadi.',code:'AI_RATE_LIMIT',retryable:true},{status:429});
   await assert.rejects(assistantApi({}),e=>e.message==='AI limiti tugadi.'&&e.code==='AI_RATE_LIMIT'&&e.status===429&&e.retryable);
   globalThis.fetch=async()=>Response.json({answerUz:'Incomplete'});
   await assert.rejects(assistantApi({}),/to‘liq olinmadi/);
  });
  await t.test('long multilingual conversations keep the current question and exact quiz choices within the server byte limit',async()=>{
   const items=Array.from({length:5},(_,i)=>({question:'学'.repeat(240),skillUz:'学'.repeat(80),difficulty:['foundation','foundation','application','application','challenge'][i],chosen:'学'.repeat(299)+'A',expected:'学'.repeat(299)+'B'}));
   const data={mode:'mentor',message:'学'.repeat(1500),view:'aiGuide',history:Array.from({length:6},(_,i)=>({role:i%2?'assistant':'user',content:'学'.repeat(1500)})),learning:[{subjectUz:'学'.repeat(100),topicUz:'学'.repeat(160),correct:99,band:'untrusted',items}]};
   globalThis.fetch=async(_url,options)=>{const sent=JSON.parse(options.body);assert.ok(new TextEncoder().encode(options.body).byteLength<=19000);assert.equal(sent.message,data.message);assert.ok(sent.history.length<6);assert.equal(sent.learning[0].items[0].chosen,items[0].chosen);assert.equal(sent.learning[0].items[0].expected,items[0].expected);assert.equal(sent.learning[0].band,undefined);return Response.json({answerUz:'Davom etamiz.',routeIds:[],questions:[]})};
   await assistantApi(data);
  });
  await t.test('cancellation stays distinct from network failures',async()=>{
   globalThis.fetch=async()=>{throw new DOMException('Stopped','AbortError');};
   await assert.rejects(assistantApi({}),e=>e.name==='AbortError');
   globalThis.fetch=async()=>{throw Error('Connection reset');};
   await assert.rejects(assistantApi({}),/Savolingiz saqlandi/);
  });
 }finally{await vite.close();globalThis.fetch=originalFetch;delete globalThis.__assistantAuthForTest;}
});
