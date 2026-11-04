import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';

test('database SDK is deferred, retries client initialization, and shares concurrent auth work',async()=>{
 const source=readFileSync(new URL('../src/supabase-sdk.js',import.meta.url),'utf8');
 let created=0,sessionReads=0,resolveSession;
 globalThis.__sdkModuleLoads=0;
 const session=new Promise(resolve=>{resolveSession=resolve;});
 const client={auth:{getSession(){sessionReads++;return session;}}};
 globalThis.__makeDatabaseClient=()=>{if(++created===1)throw Error('Temporary initialization failure');return client;};
 const vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-tests/lazy-provider',optimizeDeps:{noDiscovery:true,include:[]},root:process.cwd(),server:{middlewareMode:true,hmr:false},ssr:{noExternal:['@supabase/supabase-js']},appType:'custom',plugins:[{
  name:'deferred-database-fixture',enforce:'pre',
  resolveId(id){if(id==='@supabase/supabase-js')return '\0database-client-fixture';},
  load(id){
   if(id==='\0database-client-fixture')return 'globalThis.__sdkModuleLoads++;export const createClient=(...args)=>globalThis.__makeDatabaseClient(...args);';
   if(id.endsWith('/src/supabase-sdk.js'))return source.replace('import.meta.env.VITE_SUPABASE_URL',"'https://fixture.supabase.co'").replace('import.meta.env.VITE_SUPABASE_ANON_KEY',"'fixture-publishable-key-with-more-than-forty-characters'");
  },
 }]});
 try{
  const sdk=await vite.ssrLoadModule('/src/supabase-sdk.js');
  assert.equal(globalThis.__sdkModuleLoads,0,'reading configuration does not download the database SDK');
  assert.equal(sdk.supabaseReady(),true);
  await assert.rejects(sdk.getSupabase(),/Temporary initialization failure/);
  const first=sdk.getSupabase(),second=sdk.getSupabase(),third=sdk.getSupabase();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(globalThis.__sdkModuleLoads,1);assert.equal(created,2);assert.equal(sessionReads,1);
  resolveSession({data:{session:null},error:null});
  const results=await Promise.all([first,second,third]);
  assert.ok(results.every(result=>result.app===client));
  await sdk.getSupabase();assert.equal(created,2);assert.equal(sessionReads,1);
 }finally{await vite.close();delete globalThis.__makeDatabaseClient;delete globalThis.__sdkModuleLoads;}
});

test('deferred API transport preserves requests and never attaches a cancelled subscription',async()=>{
 let releaseModule,loads=0,attached=0,stopped=0;const calls=[];
 globalThis.__providerArrival=new Promise(resolve=>{releaseModule=resolve;});
 globalThis.__providerLoaded=()=>{loads++;};
 globalThis.__providerRequest=async(...args)=>{calls.push(args);return {ok:true};};
 globalThis.__providerSubscribe=()=>{attached++;return()=>{stopped++;};};
 const vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-tests/lazy-provider',optimizeDeps:{noDiscovery:true,include:[]},root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom',plugins:[{
  name:'deferred-api-fixture',enforce:'pre',
  load(id){
   if(id.endsWith('/src/supabase-sdk.js'))return 'export const supabaseReady=()=>true;';
   if(id.endsWith('/src/supabase-data.js'))return 'globalThis.__providerLoaded();await globalThis.__providerArrival;export const supabaseApi=(...args)=>globalThis.__providerRequest(...args);export const subscribeSupabase=(...args)=>globalThis.__providerSubscribe(...args);';
  },
 }]});
 try{
  const transport=await vite.ssrLoadModule('/src/api.js');assert.equal(loads,0);
  const cancel=transport.subscribeRealtime({});assert.equal(typeof cancel,'function');cancel();
  const pending=transport.api('/api/resolve',{method:'POST',data:{pin:'000123'},role:'player'});
  releaseModule();assert.deepEqual(await pending,{ok:true});
  assert.equal(loads,1);assert.equal(attached,0);
  assert.deepEqual(calls,[['/api/resolve',{method:'POST',data:{pin:'000123'},role:'player'}]]);
  const cleanup=transport.subscribeRealtime({});await new Promise(resolve=>setImmediate(resolve));assert.equal(attached,1);cleanup();assert.equal(stopped,1);
 }finally{await vite.close();for(const name of ['__providerArrival','__providerLoaded','__providerRequest','__providerSubscribe'])delete globalThis[name];}
});
