// Real browser rendering; only auth/catalog/quiz transport is a fixture.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'qa-7.34/navigation');fs.mkdirSync(out,{recursive:true});
 const {createServer}=await import('vite'),server=await createServer({root,server:{host:'127.0.0.1',port:4197,hmr:false}});await server.listen();
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:1050}}),errors=[],checks=[],requests=[];let user=null,authDelay=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_theme','light');});
 await page.route(/\/(auth|api)\//,async route=>{
  const p=new URL(route.request().url()).pathname;requests.push(p);let data={},status=200;
  if(p==='/auth/session'){if(authDelay)await new Promise(resolve=>setTimeout(resolve,authDelay));data={user,csrf:'fixture'};}
  else if(p==='/api/catalog')data={quizzes:[],lessons:[]};
  else if(p.endsWith('/concepts'))data=[];
  else if(p.endsWith('/active'))data={active:false};
  else if(p==='/api/resolve'){
   const pin=route.request().postDataJSON().pin;
   if(pin==='123456')data={quiz:{id:'fixture',title:'Kod bilan sinov',questionCount:1,subject:'Word',group:'8-A'},ticket:'fixture-ticket'};
   else{status=404;data={error:'Kod topilmadi yoki test hali ochilmagan.'};}
  }
  await route.fulfill({status,json:data});
 });
 const home=async()=>{await page.goto('http://127.0.0.1:4197');await page.getByRole('heading',{name:'Bilim bog‘iga xush kelibsiz',exact:true}).waitFor();await page.locator('.teacher-entry, .studio-profile').waitFor();};
 const axe=async label=>{await page.addScriptTag({path:path.join(root,'node_modules/axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));checks.push({label,violations});fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify(checks,null,2));assert.deepEqual(violations,[],label);};
 try{
  await home();
  for(const [width,height] of [[1600,1050],[1920,1080],[1280,800],[1024,768],[768,1024],[390,844],[320,720]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));
   await page.waitForFunction(()=>document.querySelector('.island-webgl')?.__islandStats);await page.waitForTimeout(150);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no overflow ${width}`);
   const hits=await page.locator('.island-destination').evaluateAll(buttons=>buttons.map(b=>{b.scrollIntoView({block:"center",behavior:"instant"});const r=b.getBoundingClientRect();return {text:b.textContent,visible:r.left>=0&&r.right<=innerWidth,clear:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
   assert.equal(hits.length,6);assert.ok(hits.every(h=>h.visible&&h.clear),`six unobstructed destinations at ${width}: ${JSON.stringify(hits)}`);
   const overlap=await page.evaluate(()=>{const r=document.querySelector('.island-intro').getBoundingClientRect();return [...document.querySelectorAll('.island-destination')].some(b=>{const q=b.getBoundingClientRect();return q.left<r.right&&q.right>r.left&&q.top<r.bottom&&q.bottom>r.top;});});
   assert.equal(overlap,false,`intro does not cover subjects at ${width}`);
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,`home-${width}.png`),fullPage:false});
   if([1600,390,320].includes(width))await axe(`home ${width}`);
  }
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('.island-background img').count(),0);
  const pin=page.getByLabel('6 xonali test kodi',{exact:true});await pin.fill('111111');await page.locator('.island-code').getByRole('button',{name:'Kirish',exact:true}).click();await page.getByRole('alert').filter({hasText:'Kod topilmadi'}).waitFor();
  await pin.fill('123456');assert.equal(await page.locator('.island-pin-slots').innerText(),'1\n2\n3\n4\n5\n6');
  await page.locator('.island-code').getByRole('button',{name:'Kirish',exact:true}).click();await page.getByRole('heading',{name:'Testga tayyorlaning'}).waitFor();assert.equal(requests.filter(p=>p==='/api/resolve').length,2);
  await home();await page.getByRole('button',{name:'Matematika bo‘limini ochish',exact:true}).click();await page.getByRole('heading',{name:'Tizimga kirish',exact:true}).waitFor();assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex, follow');
  await page.goto('http://127.0.0.1:4197/#matematika');await page.getByRole('heading',{name:'Tizimga kirish',exact:true}).waitFor();
  user={id:'student-island',name:'Lola',role:'student'};authDelay=800;await page.goto('http://127.0.0.1:4197');await page.getByRole('button',{name:'Matematika bo‘limini ochish',exact:true}).click();await page.getByRole('heading',{name:'Matematika atlasi',exact:true}).waitFor();user=null;authDelay=0;
  await home();await page.getByRole('button',{name:'Menyuni ochish',exact:true}).click();await page.getByRole('dialog').waitFor();await axe('mobile menu');await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.getByRole('heading',{name:'Bilim bog‘iga xush kelibsiz'}).waitFor();await page.waitForFunction(()=>document.querySelector('.island-webgl')?.__islandStats?.paused===true);
  await page.goto('http://127.0.0.1:4197/fanlar/kimyo/');await axe('public chemistry mobile');await page.setViewportSize({width:1600,height:1050});await page.goto('http://127.0.0.1:4197/fanlar/');await axe('public subject index');
  const plain=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await plain.goto('http://127.0.0.1:4197/fanlar/');assert.equal(await plain.locator('.public-card').count(),6);
  await plain.getByRole('link',{name:'Matematika atlasi',exact:true}).click();await plain.getByRole('heading',{name:'Matematika atlasi',exact:true}).waitFor();await plain.getByText('Javob va tushuntirishni ochish',{exact:true}).click();assert.ok(await plain.locator('details[open]').isVisible());assert.match(await plain.locator('details').innerText(),/20 sm²/);assert.ok(await plain.locator('a[href="/#matematika"]').isVisible());
  await plain.screenshot({path:path.join(out,'public-math-mobile-no-js.png'),fullPage:true});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify(checks,null,2));assert.equal(JSON.parse(fs.readFileSync(path.join(out,'accessibility.json'),'utf8')).length,checks.length);fs.writeFileSync(path.join(out,'island-browser.json'),JSON.stringify({passed:true,viewports:[1600,1920,1280,1024,768,390,320],accessibilityChecks:checks.length,guestCodeJoin:true,authGate:true,slowAuthNavigation:true,publicDeepLinkGate:true,noJsPublicPages:true,reducedMotion:true,runtimeErrors:errors},null,2));console.log('PASS Bilim bog‘i responsive map, 6-digit guest join, auth gate, no-JS public pages and '+checks.length+' accessibility checks.');
 }catch(e){await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});throw e;}
 finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
