import test from 'node:test';import assert from 'node:assert/strict';
import {createServer} from 'vite';import {fileURLToPath} from 'node:url';
test('local Vite exposes bounded JSON Telegram and admin routes instead of returning 404',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),configFile:fileURLToPath(new URL('../vite.config.js',import.meta.url)),server:{host:'127.0.0.1',port:0,hmr:false}});
 try{await server.listen();const base=`http://127.0.0.1:${server.httpServer.address().port}`;
  for(const endpoint of ['telegram-auth','admin-reset-password']){
   const response=await fetch(`${base}/api/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
   assert.notEqual(response.status,404);assert.match(response.headers.get('content-type'),/application\/json/);assert.ok((await response.json()).error);
  }
  const huge=await fetch(`${base}/api/telegram-auth`,{method:'POST',body:JSON.stringify({data:'x'.repeat(17000)})});assert.equal(huge.status,413);
 }finally{await server.close()}
});
