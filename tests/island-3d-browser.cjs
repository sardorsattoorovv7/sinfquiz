// Real WebGL and rendered pixels. Only existing auth/API transports use fixtures.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa-7.29/island');
fs.mkdirSync(out,{recursive:true});
const launch={headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']};
async function fixture(page){
 await page.addInitScript(()=>{
  window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_theme','light');
  // Override only zero-argument Date construction. Timers and performance stay real.
  window.__islandNow='2026-10-09T12:00:00Z';const NativeDate=Date;
  window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[window.__islandNow]));}};
 });
 await page.route(/\/(auth|api)\//,async r=>{const p=new URL(r.request().url()).pathname;
  const json=p==='/auth/session'?{user:null,csrf:'fixture'}:p==='/api/catalog'?{quizzes:[],lessons:[]}:p.endsWith('/active')?{active:false}:[];
  await r.fulfill({status:200,json});
 });
}
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({root,server:{host:'127.0.0.1',port:4198,hmr:false}});await server.listen();
 const browser=await chromium.launch(launch);let nyBrowser;
 const page=await browser.newPage({viewport:{width:1600,height:1050},timezoneId:'Asia/Tashkent'}),errors=[],requests=[],checks=[],results={};
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await fixture(page);
 const ready=async()=>{await page.waitForFunction(()=>document.querySelector('.island-3d-map')?.dataset.sceneStatus==='ready'&&document.querySelector('.island-webgl')?.__islandStats?.modelLoaded,{},{timeout:25000});};
 const stats=()=>page.locator('.island-webgl').evaluate(c=>c.__islandStats);
 const phase=p=>page.waitForFunction(p=>document.querySelector('.island-3d-map')?.dataset.phase===p,p);
 const pause=async()=>{if(!(await stats()).paused)await page.getByRole('button',{name:'Harakatni to‘xtatish',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.island-webgl')?.__islandStats?.paused);await page.waitForTimeout(180);};
 const start=async()=>{if((await stats()).paused)await page.getByRole('button',{name:'Harakatni yoqish',exact:true}).click();};
 const axe=async label=>{await page.addScriptTag({path:path.join(root,'node_modules/axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));checks.push({label,violations});fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify(checks,null,2));assert.deepEqual(violations,[],label);};
 try{
  await page.goto('http://127.0.0.1:4198');await ready();await phase('evening');
  assert.match(await page.locator('.island-time-picker summary').innerText(),/17:00/);
  assert.equal(await page.locator('.island-background img').count(),0);
  const initial=await stats();assert.ok(initial.triangles>40000);assert.ok(initial.drawCalls<35);assert.equal(initial.modelId,'27910a201acb4a109f77baa5c073c7a3');assert.equal(initial.animationClips,1);assert.ok(initial.width*initial.height<=1300000+5000);
  results.realGeometry=true;results.automaticDuskAt17=true;console.log('PASS actual 3D and local 17:00 dusk');
  await pause();const canvas=page.locator('.island-webgl');
  const a=await canvas.screenshot();await page.waitForTimeout(350);const b=await canvas.screenshot();assert.ok(a.equals(b),'paused pixels stay identical');
  const elapsed=(await stats()).elapsed;await start();await page.waitForFunction(t=>document.querySelector('.island-webgl').__islandStats.elapsed>t+.4,elapsed);await pause();const c=await canvas.screenshot();assert.ok(!b.equals(c),'artist animation and water change rendered pixels');results.artistAnimationAndPause=true;
  fs.writeFileSync(path.join(out,'island-evening.png'),c);console.log('PASS moving and paused pixels');
  await page.getByRole('button',{name:'Orolni o‘ngga aylantirish',exact:true}).click();const z=(await stats()).azimuth;await page.waitForTimeout(180);const rotated=await canvas.screenshot();assert.ok(!rotated.equals(c));
  await page.getByRole('button',{name:'Orolga yaqinlashish',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.island-webgl').__islandStats.zoom>1);
  await page.getByRole('button',{name:'Orol ko‘rinishini tiklash',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.island-webgl').__islandStats.zoom===1);
  await page.locator('.island-3d-host').focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(a=>document.querySelector('.island-webgl').__islandStats.azimuth>a+.1,initial.azimuth);await page.keyboard.press('Home');await page.waitForFunction(a=>Math.abs(document.querySelector('.island-webgl').__islandStats.azimuth-a)<.001,initial.azimuth);
  results.cameraAndKeyboard=true;console.log('PASS camera and keyboard');
  for(const [time,p] of [['2026-10-09T01:30:00Z','morning'],['2026-10-09T07:00:00Z','day'],['2026-10-09T15:00:00Z','night'],['2026-10-09T19:00:00Z','night']]){
   await page.evaluate(t=>{window.__islandNow=t;dispatchEvent(new Event('focus'));},time);await phase(p);await page.waitForTimeout(150);
   await canvas.screenshot({path:path.join(out,`island-${p}.png`)});
  }
  assert.match(await page.locator('.island-time-picker summary').innerText(),/00:00/);
  await page.getByLabel('Orol vaqtini sozlash',{exact:true}).click();await page.getByLabel('Orol vaqti',{exact:true}).selectOption('day');await phase('day');await page.keyboard.press('Escape');
  await page.reload();await ready();await phase('day');assert.match(await page.locator('.island-time-picker summary').innerText(),/17:00/);
  await page.getByLabel('Orol vaqtini sozlash',{exact:true}).click();await page.getByLabel('Orol vaqti',{exact:true}).selectOption('auto');await phase('evening');await page.keyboard.press('Escape');
  await axe('desktop 1600');results.clockAndManualPersistence=true;
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.island-webgl').__islandStats.paused);assert.ok(await page.getByRole('button',{name:'Harakat kamaytirilgan',exact:true}).isDisabled());
  const reduced=(await stats()).elapsed;await page.waitForTimeout(300);assert.equal((await stats()).elapsed,reduced);
  await page.emulateMedia({reducedMotion:'no-preference'});await start();
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForFunction(()=>document.querySelector('.island-webgl').__islandVisible===false);const f=(await stats()).frames;await page.waitForTimeout(300);assert.equal((await stats()).frames,f);
  await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(t=>document.querySelector('.island-webgl').__islandStats.frames>t,f);await pause();
  results.reducedMotionAndOffscreenPause=true;console.log('PASS time, reduced motion and offscreen suspension');
  for(const [width,height] of [[1600,1050],[1920,1080],[1280,800],[1024,768],[768,1024],[390,844],[320,720]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(200);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no overflow ${width}`);
   const hits=await page.locator('.island-destination').evaluateAll(buttons=>buttons.map(b=>{b.scrollIntoView({block:'center',behavior:'instant'});const r=b.getBoundingClientRect();return {name:b.textContent,clear:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),inside:r.left>=0&&r.right<=innerWidth};}));assert.equal(hits.length,6);assert.ok(hits.every(x=>x.clear&&x.inside),JSON.stringify({width,hits}));
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,`home-${width}.png`)});
   if([390,320].includes(width))await axe(`mobile ${width}`);
  }
  results.responsiveWidths=[1600,1920,1280,1024,768,390,320];console.log('PASS seven responsive widths');
  await page.setViewportSize({width:1600,height:1050});await page.evaluate(()=>scrollTo(0,0));
  await page.locator('.island-webgl').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await page.getByRole('button',{name:'3D orolni qayta ochish',exact:true}).waitFor();await page.getByRole('button',{name:'3D orolni qayta ochish',exact:true}).click();await ready();results.contextLossRecovery=true;
  assert.ok(!requests.some(u=>/\/island\/.*\.(webp|jpg|png)/.test(u)),'world never fetches a bitmap background');
  assert.ok(requests.some(u=>u.endsWith('/models/island/v7.29/fantasy-island.glb')));assert.ok(!requests.some(u=>/sketchfab|traines/.test(u)),'no runtime dependency on the model source');results.packagedLocalArtistAsset=true;
  // Separate browser process: some single-process Chromium builds share timezone state between contexts.
  nyBrowser=await chromium.launch(launch);const ny=await nyBrowser.newPage({viewport:{width:1200,height:900},timezoneId:'America/New_York'});await fixture(ny);await ny.goto('http://127.0.0.1:4198');await ny.waitForFunction(()=>document.querySelector('.island-time-picker summary')?.textContent.includes('08:00'));assert.equal(await ny.locator('.island-3d-map').getAttribute('data-phase'),'day');results.deviceTimezone=true;await nyBrowser.close();nyBrowser=null;
  await page.addInitScript(()=>Object.defineProperty(window,'WebGL2RenderingContext',{value:undefined,configurable:true}));await page.reload();await page.waitForFunction(()=>document.querySelector('.island-3d-map')?.dataset.sceneStatus==='unsupported');assert.equal(await page.locator('.island-destination').count(),6);await page.getByRole('button',{name:'Matematika bo‘limini ochish',exact:true}).click();await page.getByRole('heading',{name:'Tizimga kirish',exact:true}).waitFor();results.fallbackAndAuthGate=true;
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify(checks,null,2));assert.equal(JSON.parse(fs.readFileSync(path.join(out,'accessibility.json'),'utf8')).length,checks.length);fs.writeFileSync(path.join(out,'island-3d-browser.json'),JSON.stringify({passed:true,browser:await browser.version(),fixture:'Only auth/API transports; actual React, mesh geometry, WebGL, shader pixels and controls.',...results,accessibilityChecks:checks.length,runtimeErrors:errors},null,2));console.log('PASS WebGL, local timezones, recovery, auth gate and accessibility');
 }catch(e){await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});throw e;}
 finally{await nyBrowser?.close();await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
