// Run after npm run build. Tests the hashed production chunks, not the Vite dev transform.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'qa-7.29/production');fs.mkdirSync(out,{recursive:true});
 const {preview}=await import('vite');const server=await preview({root,preview:{host:'127.0.0.1',port:4199,strictPort:true}});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'Asia/Tashkent'}),errors=[],failed=[],assets=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));page.on('response',r=>{if(r.url().includes('/assets/')||r.url().includes('/models/island/'))assets.push({path:new URL(r.url()).pathname,status:r.status()});});
 await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_island_motion','off');localStorage.setItem('sq_island_time_mode','evening');});
 await page.route(/\/(auth|api)\//,async r=>{const p=new URL(r.request().url()).pathname;await r.fulfill({status:200,json:p==='/auth/session'?{user:null,csrf:'fixture'}:p==='/api/catalog'?{quizzes:[],lessons:[]}:[]});});
 try{
  await page.goto('http://127.0.0.1:4199');await page.waitForFunction(()=>document.querySelector('.island-webgl')?.__islandStats?.modelLoaded,{},{timeout:25000});
  assert.ok(assets.some(a=>a.path.includes('island-world-3d-')&&a.status===200));
  assert.ok(assets.some(a=>a.path==='/models/island/v7.29/fantasy-island.glb'&&a.status===200));
  assert.equal(await page.locator('.island-webgl').evaluate(c=>c.__islandStats.modelId),'27910a201acb4a109f77baa5c073c7a3');
  assert.equal(await page.locator('.island-destination').count(),6);
  await page.getByRole('button',{name:'Orolni o‘ngga aylantirish',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.island-webgl').__islandStats.azimuth>.1);
  await page.getByRole('button',{name:'Orol ko‘rinishini tiklash',exact:true}).click();
  await page.screenshot({path:path.join(out,'home-production.png')});
  await page.getByRole('button',{name:'Matematika bo‘limini ochish',exact:true}).click();await page.getByRole('heading',{name:'Tizimga kirish',exact:true}).waitFor();
  const plain=await browser.newPage({javaScriptEnabled:false});await plain.goto('http://127.0.0.1:4199/fanlar/');assert.equal(await plain.locator('.public-card').count(),6);await plain.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.ok(assets.every(a=>a.status===200));
  fs.writeFileSync(path.join(out,'production-browser.json'),JSON.stringify({passed:true,browser:await browser.version(),realBuiltWebGL:true,hashedIslandChunk:true,camera:true,authGate:true,noJsPublicPages:true,assetResponses:assets,runtimeErrors:errors,failedRequests:failed,scope:'Local Vite production preview; auth/API fixtures; no live Vercel or Supabase mutation.'},null,2));console.log('PASS production chunks, actual 3D, camera, auth gate and no-JS pages');
 }finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1);});
