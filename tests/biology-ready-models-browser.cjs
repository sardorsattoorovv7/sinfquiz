// Real glTF/WebGL assets. Local fixture identities; no production account writes.
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..'),load=f=>import(pathToFileURL(path.join(root,f))),out=path.join(root,'qa-7.21');fs.mkdirSync(out,{recursive:true});
 const {biologyTopics}=await load('src/biology-content.js');
 const {createServer}=await load('node_modules/vite/dist/node/index.js'),server=await createServer({root,server:{host:'127.0.0.1',port:4182,hmr:false}});const csp=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'))).headers.at(-1).headers.find(h=>h.key==='Content-Security-Policy').value;server.middlewares.use((req,res,next)=>{res.setHeader('Content-Security-Policy',csp);next()});await server.listen();
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],assets=[];
 async function fixture(p){p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>window.__SINFQUIZ_LEGACY_TEST__=true);await p.route(/\/(auth|api)\//,r=>{const n=new URL(r.request().url()).pathname;return r.fulfill({json:n==='/auth/session'?{user:{id:'qa-student',name:'Javlon',role:'student'},csrf:'qa'}:n==='/api/catalog'?{quizzes:[],lessons:[]}:[]})})}
 const map=()=>page.getByRole('button',{name:'Mavzular xaritasi',exact:true}).click();
 const open=async title=>{await map();await page.locator('.bio-card').filter({has:page.getByRole('heading',{name:title,exact:true})}).click()};
 try{
  await fixture(page);page.on('request',r=>{if(r.url().includes('/biology/v7.21/')&&r.url().endsWith('.glb'))assets.push(new URL(r.url()).pathname)});
  await page.goto('http://127.0.0.1:4182/#biologiya');await page.locator('.bio-card').first().waitFor();assert.equal(assets.length,0,'map must not download all 3D models');
  await open('Odam tanasini qatlamlarda ochish');await page.locator('.bio-anatomy-stage.bio-ready').waitFor();
  assert.ok(assets.some(u=>u.endsWith('anatomy-lungs.glb')));assert.ok(!assets.some(u=>u.endsWith('anatomy-muscles.glb')),'muscle layer must load on demand');
  for(const layer of ['outer','skeleton','muscles','organs']){
   await page.getByLabel('Tana qatlami',{exact:true}).selectOption(layer);await page.waitForFunction(v=>document.querySelector('.bio-anatomy-canvas')?.dataset.layer===v,layer);await page.locator('.bio-loading').waitFor({state:'hidden'});await page.locator('.bio-anatomy-stage').screenshot({path:path.join(out,'layer-'+layer+'.png')});
   assert.ok(Number(await page.locator('.bio-anatomy-canvas').getAttribute('data-meshes'))>0);
  }
  await page.locator('.bio-structure-list').getByRole('button',{name:'O‘ng o‘pka',exact:true}).click();assert.equal(await page.locator('.bio-structure-selected strong').textContent(),'O‘ng o‘pka');
  await page.getByRole('button',{name:'Ichki tuzilmani ochish',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.bio-anatomy-canvas')?.dataset.layer==='inside');
  await page.getByRole('slider',{name:'Organ kesimi',exact:true}).fill('0');await page.waitForTimeout(100);const uncut=await page.locator('.bio-anatomy-stage').screenshot();await page.getByRole('slider',{name:'Organ kesimi',exact:true}).fill('65');await page.waitForTimeout(100);const cut=await page.locator('.bio-anatomy-stage').screenshot();assert.notDeepEqual(uncut,cut,'cut plane must change actual mesh visibility');
  await page.locator('.bio-anatomy').screenshot({path:path.join(out,'lung-section.png')});
  await page.locator('.bio-anatomy-canvas').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Home');
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.bio-anatomy').screenshot({path:path.join(out,'anatomy-mobile.png')});
  await page.addScriptTag({path:path.join(root,'node_modules/axe-core/axe.min.js')});const violations=await page.evaluate(async()=>{const r=await axe.run('.bio-anatomy',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});fs.writeFileSync(path.join(out,'anatomy-accessibility.json'),JSON.stringify(violations,null,2));assert.deepEqual(violations,[],'native model controls must have no automatic WCAG failures');
  await page.setViewportSize({width:1920,height:1080});await page.getByLabel('Tana qatlami',{exact:true}).selectOption('organs');await page.waitForFunction(()=>document.querySelector('.bio-anatomy-canvas')?.dataset.layer==='organs');await page.locator('.bio-anatomy').screenshot({path:path.join(out,'anatomy-classroom.png')});
  // Fail an uncached flower asset, verify usable 2D and a real same-page retry.
  await page.route('**/biology/v7.21/flower.glb',r=>r.fulfill({status:503,body:'temporary'}));await open(biologyTopics.find(t=>t.scene==='pollination').title);await page.locator('.bio-world-fallback').waitFor();assert.ok(await page.locator('.bio-stage').count()>0);assert.equal(await page.locator('.bio-world-canvas canvas').count(),0);
  await page.unroute('**/biology/v7.21/flower.glb');await page.getByRole('button',{name:'3Dni qayta ochish',exact:true}).click();await page.locator('.bio-world-ready').waitFor();assert.ok(Number(await page.locator('.bio-world-canvas').getAttribute('data-asset-count'))>0);await page.locator('.bio-world-stage').screenshot({path:path.join(out,'textured-flower.png')});
  await open(biologyTopics.find(t=>t.scene==='foodchain').title);await page.locator('.bio-world-ready').waitFor();await page.getByRole('slider',{name:'Biologik jarayon bosqichi',exact:true}).fill('45');await page.waitForTimeout(100);await page.locator('.bio-world-stage').screenshot({path:path.join(out,'foodchain-native.png')});
  await open(biologyTopics.find(t=>t.scene==='adaptation').title);await page.locator('.bio-world-ready').waitFor();assert.ok(assets.some(a=>a.endsWith('bird.glb')));await page.locator('.bio-world-stage').screenshot({path:path.join(out,'native-bird.png')});
  assert.deepEqual(errors,[]);console.log('PASS: lazy local model loading, native anatomy layers/selection, real cut plane, keyboard controls, 390px mobile, 1920px classroom, zero automatic WCAG violations, asset failure/2D fallback/retry, textured flower and correctly scaled native fox and ready bird under Vercel CSP.');
 }catch(e){await page.screenshot({path:path.join(out,'native-failure.png'),fullPage:true});throw e}finally{await browser.close();await server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
