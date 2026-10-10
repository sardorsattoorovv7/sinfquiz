// Test slow/error transports, not a fake model. Successful paths render the real GLB.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa-7.29/loading');fs.mkdirSync(out,{recursive:true});
const flags=['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
const model='/models/island/v7.29/fantasy-island.glb';
async function fixture(page){
 await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.clear();localStorage.setItem('sq_island_motion','off');});
 await page.route(/\/(auth|api)\//,async r=>{const p=new URL(r.request().url()).pathname;await r.fulfill({status:200,json:p==='/auth/session'?{user:null,csrf:'fixture'}:p==='/api/catalog'?{quizzes:[],lessons:[]}:[]});});
}
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({root,server:{host:'127.0.0.1',port:4195,hmr:false,strictPort:true}});await server.listen();
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:flags});
 const results={},errors=[],page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 try{
  await fixture(page);
  // A stalled model must not stall a code input or the existing auth gate.
  let release;const hold=new Promise(resolve=>release=resolve);let pending=false;
  await page.route('**'+model,async r=>{pending=true;await hold;await r.abort().catch(()=>{});});
  await page.goto('http://127.0.0.1:4195');await page.waitForFunction(()=>document.querySelector('.island-3d-map')?.dataset.sceneStatus==='loading');
  await page.getByLabel('6 xonali test kodi').fill('123456');assert.equal(await page.getByLabel('6 xonali test kodi').inputValue(),'123456');
  const started=Date.now();await page.getByRole('button',{name:'Matematika bo‘limini ochish',exact:true}).click();await page.getByRole('heading',{name:'Tizimga kirish',exact:true}).waitFor();
  results.stalledModelNavigationMs=Date.now()-started;results.navigationWorksWithoutModel=true;results.modelTransportWasStalled=pending;release();await page.unroute('**'+model);

  // Failed local model has an explicit retry and six functioning subject links.
  await page.route('**'+model,r=>r.fulfill({status:404,body:'Missing model'}));await page.goto('http://127.0.0.1:4195');
  await page.getByRole('button',{name:'3D orolni qayta ochish',exact:true}).waitFor();assert.equal(await page.locator('.island-destination').count(),6);
  await page.unroute('**'+model);await page.getByRole('button',{name:'3D orolni qayta ochish',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.island-webgl')?.__islandStats?.modelLoaded,{},{timeout:25000});results.missingModelRetry=true;

  // Data saver never imports/fetches 3D until the student chooses it.
  await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true,effectiveType:'2g'}}));
  const requests=[];page.on('request',r=>requests.push(r.url()));await page.goto('http://127.0.0.1:4195');
  await page.getByRole('button',{name:'3D orolni ochish',exact:true}).waitFor();await page.waitForTimeout(300);
  assert.ok(!requests.some(u=>u.endsWith(model)));assert.ok(!requests.some(u=>u.includes('island-world-3d.js')));
  await page.getByRole('button',{name:'3D orolni ochish',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.island-webgl')?.__islandStats?.modelLoaded,{},{timeout:25000});
  const stats=await page.locator('.island-webgl').evaluate(c=>c.__islandStats);assert.equal(stats.quality,'low');assert.ok(stats.drawCalls<35);results.dataSaverDefersActualModel=true;results.lowQuality=stats;
  await page.getByRole('button',{name:'Yengil ko‘rinishga o‘tish',exact:true}).click();await page.getByRole('button',{name:'3D orolni ochish',exact:true}).waitFor();assert.equal(await page.locator('.island-webgl').count(),0);
  await page.screenshot({path:path.join(out,'lightweight.png')});results.lightweightDisposesCanvas=true;
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'loading-browser.json'),JSON.stringify({passed:true,...results,runtimeErrors:errors,scope:'Actual React and local artist GLB; auth/API fixtures and controlled slow/404 model transport.'},null,2));
  console.log('PASS stalled model navigation, failed model retry, data saver and disposal');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
