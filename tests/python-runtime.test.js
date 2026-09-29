import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {loadPyodide} from 'pyodide';
import {runPythonIsolated} from '../src/python-runner.js';

const workerSource=readFileSync(new URL('../public/python-worker.mjs',import.meta.url),'utf8');
const wrapper=workerSource.match(/const PYTHON_WRAPPER=`([\s\S]*?)`;/)?.[1];

test('bundled Python actually runs print/input and rejects system imports',async()=>{
 assert.ok(wrapper);
 for(const file of ['pyodide.mjs','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json']){
  assert.ok(statSync(new URL(`../public/python-runtime/${file}`,import.meta.url)).size>1000,file);
 }
 const python=await loadPyodide();
 const run=async(code,input='')=>{
  let result='';const append=line=>result+=line+'\n';
  python.setStdout({batched:append});python.setStderr({batched:append});
  python.globals.set('_sq_source',code);python.globals.set('_sq_input_text',input);
  await python.runPythonAsync(wrapper);return result;
 };
 assert.match(await run('name = input()\nprint("Salom", name)','Ali'),/Salom Ali/);
 assert.match(await run('print(2 * 3)'),/6/);
 assert.match(await run('import os\nprint(os.getcwd())'),/ruxsat etilmagan|faqat math/);
});

test('runner terminates workers on success and cancellation',async()=>{
 const Original=globalThis.Worker,instances=[];
 class StubWorker{
  constructor(url,options){assert.equal(url,'/python-worker.mjs');assert.equal(options.type,'module');this.terminated=false;instances.push(this)}
  postMessage(data){queueMicrotask(()=>{this.onmessage?.({data:{id:data.id,kind:'loaded'}});this.onmessage?.({data:{id:data.id,kind:'result',output:'Natija\n'}})})}
  terminate(){this.terminated=true}
 }
 try{
  globalThis.Worker=StubWorker;
  assert.equal(await runPythonIsolated('print("Natija")'),'Natija\n');
  assert.equal(instances[0].terminated,true);
  StubWorker.prototype.postMessage=function(){/* wait for cancellation */};
  const controller=new AbortController(),pending=runPythonIsolated('while True: pass','',{signal:controller.signal});
  controller.abort();await assert.rejects(pending,/to‘xtatildi/);
  assert.equal(instances[1].terminated,true);
 }finally{globalThis.Worker=Original}
});
