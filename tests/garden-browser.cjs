const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const out=path.resolve(__dirname,'../qa-7.34');fs.mkdirSync(out,{recursive:true});
 const vite=await import('vite');
 const server=process.env.QA_PRODUCTION?await vite.preview({root:path.resolve(__dirname,'..'),preview:{host:'127.0.0.1',port:5185,strictPort:true}}):await vite.createServer({root:path.resolve(__dirname,'..'),server:{host:'127.0.0.1',port:5185,strictPort:true}});
 if(!process.env.QA_PRODUCTION)await server.listen();
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1080},timezoneId:'Asia/Tashkent'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_island_motion','off');localStorage.setItem('sq_island_time_mode','day');localStorage.setItem('sq_theme','light');});
 await page.route(/\/(auth|api)\//,async r=>{const p=new URL(r.request().url()).pathname;await r.fulfill({status:200,json:p==='/auth/session'?{user:null,csrf:'fixture'}:p==='/api/catalog'?{quizzes:[],lessons:[]}:p==='/api/resolve'?{pin:'123456',title:'Test',kind:'quiz',id:'test'}:[]});});
 try{
  await page.route('**/models/registan/v7.34/*.glb',async route=>{await new Promise(r=>setTimeout(r,1200));await route.continue();});
  await page.goto('http://127.0.0.1:5185');
  const positions=()=>page.locator('.island-destination').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]}));
  const before=await positions();
  await page.waitForFunction(()=>document.querySelector('.island-webgl')?.__islandStats?.modelLoaded,{},{timeout:60000});
  const after=await positions();
  for(let i=0;i<before.length;i++)for(let j=0;j<4;j++)assert.ok(Math.abs(before[i][j]-after[i][j])<=1,'Loading layout stays stable');
  await page.unroute('**/models/registan/v7.34/*.glb');
  const stats=await page.locator('.island-webgl').evaluate(c=>c.__islandStats);
  await page.waitForTimeout(500);
  assert.equal(stats.paused,false);
  assert.notEqual(await page.locator('.island-webgl').evaluate(c=>c.__islandStats.azimuth),stats.azimuth);

  assert.equal(stats.modelId,'af54f5280eb249beb6501eab4769c351');assert.ok(stats.triangles>1000);
  assert.equal(await page.locator('.island-destination').count(),6);
  await page.screenshot({path:path.join(out,'desktop.png')});
  assert.equal(await page.locator('.island-motion-toggle,.island-lightweight').count(),0);
  assert.equal(await page.evaluate(async()=>!!(await(await caches.open('sinfquiz-public-garden-v1')).match('/models/registan/v7.34/registan.glb'))),true);
  await page.route('**/models/registan/v7.34/registan.glb',route=>route.abort());
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('.island-webgl')?.__islandStats?.modelLoaded,{},{timeout:60000});
  await page.unroute('**/models/registan/v7.34/registan.glb');

  await page.getByRole('button',{name:'Bog‘ni o‘ngga aylantirish',exact:true}).click();
  await page.waitForFunction(a=>Math.abs(document.querySelector('.island-webgl').__islandStats.azimuth-a)>.1,stats.azimuth);
  await page.getByRole('button',{name:'Bog‘ ko‘rinishini tiklash',exact:true}).click();
  await page.getByRole('button',{name:'Bog‘ga yaqinlashish',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.island-webgl').__islandStats.zoom>1);
  await page.getByRole('button',{name:'Bog‘ ko‘rinishini tiklash',exact:true}).click();
  await page.locator('.island-3d-host').focus();await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(a=>Math.abs(document.querySelector('.island-webgl').__islandStats.azimuth-a)>.1,stats.azimuth);
  await page.keyboard.press('Home');
  await page.getByRole('button',{name:'Tungi ko‘rinishga o‘tish',exact:true}).click();
  await page.screenshot({path:path.join(out,'dark.png')});
  await page.getByRole('button',{name:'Kunduzgi ko‘rinishga o‘tish',exact:true}).click();
  for(const width of [320,390,768,1024,1440]){
   await page.setViewportSize({width,height:width<760?1150:1080});
   await page.waitForTimeout(250);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${width}`);
   if(width===390)await page.screenshot({path:path.join(out,'mobile.png')});
  }
  await page.setViewportSize({width:390,height:1150});await page.reload();
  await page.waitForFunction(()=>document.querySelector('.island-webgl')?.__islandStats?.modelLoaded,{},{timeout:60000});
  assert.match(await page.locator('.island-webgl').evaluate(c=>c.__islandStats.assetUrl),/registan-low\.glb$/);
  await page.screenshot({path:path.join(out,'mobile.png')});
  await page.setViewportSize({width:1440,height:1080});
  await page.getByRole('button',{name:'Matematika bo‘limini ochish',exact:true}).click();
  await page.getByRole('heading',{name:'Tizimga kirish',exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify({passed:true,browser:await browser.version(),stats,responsiveWidths:[320,390,768,1024,1440],realLocalGLB:true,rotation:true,zoom:true,keyboard:true,darkTheme:true,guestAuthGate:true,errors,scope:'Local browser with auth/API fixtures; actual Three.js and local artist model.'},null,2));
  console.log('PASS actual garden model, camera, keyboard, themes, five viewport sizes and existing auth gate');
 }finally{await browser.close();if(server.close)await server.close();else await new Promise(r=>server.httpServer.close(r));}
})().catch(e=>{console.error(e);process.exit(1);});
