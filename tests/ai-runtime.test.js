import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EventEmitter} from 'node:events';
import {checkAiRuntime,formatAiCheck,loadAiEnv} from '../scripts/ai-check.mjs';
import {startAiDevelopment} from '../scripts/dev-ai.mjs';

const baseEnv={GROQ_API_KEY:'gsk_runtime_fixture_key',VITE_SUPABASE_URL:'https://runtime-fixture.supabase.co',VITE_SUPABASE_ANON_KEY:'sb_publishable_'+('a'.repeat(40)),SUPABASE_SECRET_KEY:'sb_secret_'+('b'.repeat(40))};
const probe=async()=>({stdout:'ffprobe version fixture Copyright test'});
function transport(overrides={},calls=[]){return async(url,options)=>{
 const path=new URL(url).pathname;calls.push({url,options});
 if(Object.hasOwn(overrides,path)){const value=overrides[path];if(value instanceof Error)throw value;return value;}
 if(path==='/openai/v1/chat/completions')return Response.json({choices:[{message:{content:JSON.stringify({answerUz:'Salom! AI tayyor.'})}}]});
 if(path==='/auth/v1/settings')return Response.json({external:{email:true}});
 if(path==='/rest/v1/sq_sp_records'||path==='/rest/v1/sq_sp_jobs')return Response.json([]);
 if(path==='/storage/v1/bucket/speaking-private')return Response.json({id:'speaking-private',public:false});
 throw Error('Unexpected test request');
};}

test('runtime verifies a real structured request, authentication, both tables and private bucket',async()=>{
 const calls=[];const r=await checkAiRuntime({env:{...baseEnv,SPEAKING_FFPROBE_PATH:'fixture-ffprobe'},fetcher:transport({},calls),probe:async(file,args,options)=>{assert.equal(file,'fixture-ffprobe');assert.deepEqual(args,['-version']);assert.equal(options.windowsHide,true);return probe();}});
 assert.equal(r.assistantReady,true);assert.equal(r.speakingReady,true);assert.equal(r.exitCode,0);assert.equal(calls.length,5);
 const groq=calls.find(c=>c.url.includes('groq.com'));const body=JSON.parse(groq.options.body);assert.equal(body.response_format.type,'json_schema');assert.equal(body.response_format.json_schema.strict,true);
 for(const c of calls.filter(c=>!c.url.includes('groq.com'))){assert.ok(c.options.headers.apikey);assert.equal(c.options.headers.Authorization,undefined);assert.equal(c.options.redirect,'error');assert.ok(c.options.signal);}
 const output=formatAiCheck(r);assert.match(output,/AI yordamchi: tayyor/);assert.match(output,/worker ishga tushishi kerak/);
 assert.ok(!output.includes(baseEnv.GROQ_API_KEY));assert.ok(!output.includes(baseEnv.SUPABASE_SECRET_KEY));assert.ok(!output.includes(baseEnv.VITE_SUPABASE_URL));
});

test('assistant remains usable without service key; --speaking requires the missing server setup',async()=>{
 const env={...baseEnv};delete env.SUPABASE_SECRET_KEY;
 const options={env,fetcher:transport(),probe};const a=await checkAiRuntime(options),s=await checkAiRuntime({...options,speaking:true});
 assert.equal(a.assistantReady,true);assert.equal(a.speakingReady,false);assert.equal(a.exitCode,0);assert.equal(s.exitCode,1);assert.equal(a.checks.find(c=>c.id==='supabaseServiceKey').code,'SUPABASE_SERVICE_KEY_MISSING');
});

test('offline validates configurations without network and does not claim live readiness',async()=>{
 const r=await checkAiRuntime({env:baseEnv,offline:true,fetcher:async()=>{throw Error('Network forbidden in offline mode');},probe});
 assert.equal(r.assistantConfigured,true);assert.equal(r.speakingConfigured,true);assert.equal(r.assistantReady,false);assert.equal(r.speakingReady,false);assert.equal(r.exitCode,0);assert.match(formatAiCheck(r),/tashqi xizmatlar tasdiqlanmadi/);
});

test('live invalid key is blocked without exposing provider body, keys or URLs',async()=>{
 const privateText=baseEnv.GROQ_API_KEY+' '+baseEnv.SUPABASE_SECRET_KEY+' '+baseEnv.VITE_SUPABASE_URL;
 const r=await checkAiRuntime({env:baseEnv,fetcher:transport({'/openai/v1/chat/completions':new Response(privateText,{status:401})}),probe});
 assert.equal(r.assistantReady,false);assert.equal(r.exitCode,1);assert.equal(r.checks.find(c=>c.id==='groq').code,'GROQ_401');
 const output=JSON.stringify(r)+formatAiCheck(r);for(const secret of [baseEnv.GROQ_API_KEY,baseEnv.SUPABASE_SECRET_KEY,baseEnv.VITE_SUPABASE_URL])assert.ok(!output.includes(secret));
});

test('missing migration, public audio bucket and ffprobe each prevent full Speaking readiness',async()=>{
 for(const [id,overrides,probeFn,code] of [
  ['speakingRecords',{'/rest/v1/sq_sp_records':new Response('{}',{status:404})},probe,'SPEAKING_MIGRATION_REQUIRED'],
  ['speakingJobs',{'/rest/v1/sq_sp_jobs':new Response('{}',{status:403})},probe,'SUPABASE_SERVICE_KEY_REJECTED'],
  ['speakingStorage',{'/storage/v1/bucket/speaking-private':Response.json({id:'speaking-private',public:true})},probe,'SPEAKING_STORAGE_INVALID'],
  ['ffprobe',{},async()=>{throw Object.assign(Error('private executable details'),{code:'ENOENT'});},'FFPROBE_MISSING'],
 ]){const r=await checkAiRuntime({env:baseEnv,fetcher:transport(overrides),probe:probeFn,speaking:true});assert.equal(r.assistantReady,true);assert.equal(r.speakingReady,false);assert.equal(r.exitCode,1);assert.equal(r.checks.find(c=>c.id===id).code,code);}
});

test('legacy service-role JWT is supported while malformed configuration does not send secrets',async()=>{
 const calls=[],legacy='eyJfixture.payload.signature';
 const r=await checkAiRuntime({env:{...baseEnv,SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:legacy},fetcher:transport({},calls),probe});assert.equal(r.speakingReady,true);
 for(const c of calls.filter(c=>c.url.includes('/rest/')||c.url.includes('/storage/')))assert.equal(c.options.headers.Authorization,'Bearer '+legacy);
 const invalid=await checkAiRuntime({env:{...baseEnv,VITE_SUPABASE_URL:'https://user:password@example.test/path',GROQ_BASE_URL:'https://example.test'},fetcher:async()=>{throw Error('Must not fetch');},probe});
 assert.equal(invalid.assistantReady,false);assert.equal(invalid.exitCode,1);assert.ok(!formatAiCheck(invalid).includes('user:password'));
});

test('environment loader keeps external values above local values above base .env',()=>{
 const folder=mkdtempSync(join(tmpdir(),'sinfquiz-runtime-test-')),names=['SQ_RUNTIME_EXT_TEST','SQ_RUNTIME_LOCAL_TEST','SQ_RUNTIME_BASE_TEST'],before=Object.fromEntries(names.map(k=>[k,process.env[k]]));
 try{for(const k of names)delete process.env[k];process.env[names[0]]='external';writeFileSync(join(folder,'.env'),'SQ_RUNTIME_EXT_TEST=base\nSQ_RUNTIME_LOCAL_TEST=base\nSQ_RUNTIME_BASE_TEST=base\n');writeFileSync(join(folder,'.env.local'),'SQ_RUNTIME_EXT_TEST=local\nSQ_RUNTIME_LOCAL_TEST=local\n');
 const r=loadAiEnv({cwd:folder});assert.deepEqual(r.warnings,[]);assert.equal(r.env[names[0]],'external');assert.equal(r.env[names[1]],'local');assert.equal(r.env[names[2]],'base');
 }finally{for(const k of names){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}rmSync(folder,{recursive:true,force:true});}
});

class FakeChild extends EventEmitter{kill(signal){this.killedWith=signal;queueMicrotask(()=>this.emit('close',0));return true;}}
test('development starts direct Node children hidden on Windows and stops web when worker fails',async()=>{
 const calls=[],logs=[];const runtime=startAiDevelopment({env:baseEnv,registerSignals:false,log:m=>logs.push(m),spawnProcess:(file,args,options)=>{const child=new FakeChild();calls.push({file,args,options,child});return child;}});
 assert.equal(runtime.workerStarted,true);assert.equal(calls.length,2);assert.equal(calls[0].file,process.execPath);assert.match(calls[0].args[0],/vite[\\/]bin[\\/]vite\.js$/);assert.match(calls[1].args[0],/scripts[\\/]speaking-worker\.mjs$/);assert.ok(calls.every(c=>c.options.windowsHide===true));
 calls[1].child.emit('close',7);assert.equal(await runtime.done,7);assert.equal(calls[0].child.killedWith,'SIGTERM');assert.ok(!logs.join().includes(baseEnv.SUPABASE_SECRET_KEY));
});

test('development without service key runs the assistant web server and explains missing Speaking setup',async()=>{
 const env={...baseEnv};delete env.SUPABASE_SECRET_KEY;const logs=[],calls=[];
 const runtime=startAiDevelopment({env,registerSignals:false,log:m=>logs.push(m),spawnProcess:()=>{const c=new FakeChild();calls.push(c);return c;}});assert.equal(runtime.workerStarted,false);assert.equal(calls.length,1);assert.match(logs.join(),/AI Speaking uchun SUPABASE_SECRET_KEY/);runtime.stop();assert.equal(await runtime.done,0);
});

test('synchronous worker spawn failure terminates an already started web server',async()=>{
 let count=0;const web=new FakeChild();const runtime=startAiDevelopment({env:baseEnv,registerSignals:false,log(){},spawnProcess:()=>{if(count++===0)return web;throw Error('sensitive spawn diagnostics');}});
 assert.equal(await runtime.done,1);assert.equal(web.killedWith,'SIGTERM');assert.equal(runtime.workerStarted,false);
});
