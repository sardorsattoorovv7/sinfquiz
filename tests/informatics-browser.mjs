import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {history,components,assemblyTasks,questions,diagnostics,bootSteps} from '../src/informatics/content.js';

const output=process.env.QA_ARTIFACT_DIR||join(tmpdir(),'sinfquiz-informatics-741');mkdirSync(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:0,strictPort:false,hmr:false},logLevel:'error'});
await server.listen();const url=`http://127.0.0.1:${server.httpServer.address().port}/#informatika-atlasi`;
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--disable-gpu-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],violations=[],counts={history:0,components:0,boot:0,assembly:0,questions:0,diagnostics:0};
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
async function ready(p=page){await p.locator('.ia-viewer').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('.ia-canvas-host')?.dataset.ready==='true');assert.ok(Number(await p.locator('.ia-canvas-host').getAttribute('data-meshes'))>10);}
async function axe(p,label){await p.addScriptTag({path:join(process.cwd(),'node_modules/axe-core/axe.min.js')});const result=await p.evaluate(async()=>{const a=await globalThis.axe.run('.informatics-atlas',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));});if(result.length)violations.push({label,result});}
async function shot(name,p=page){const viewer=p.locator('.ia-viewer');await viewer.scrollIntoViewIfNeeded();await p.evaluate(()=>{const r=document.querySelector('.ia-viewer').getBoundingClientRect();scrollBy(0,r.top-130);});await p.screenshot({path:join(output,name),fullPage:false});}
try{
 await page.goto(url);await page.getByRole('heading',{name:'Hisobdan kompyutergacha.'}).waitFor();
 for(let i=0;i<history.length;i++){
  await page.locator('.ia-timeline button').nth(i).click();await ready();assert.equal(await page.locator('.ia-story-card h3').innerText(),history[i].name);
  await page.getByRole('button',{name:'Bu bosqichni o‘rgandim',exact:true}).click();counts.history++;
  if(history[i].id==='eniac'){await shot('history-eniac-desktop.png');await axe(page,'history');}
 }
 await page.getByRole('tab',{name:/Kompyuter ichida/}).click();await ready();
 for(const c of components){await page.locator(`[data-part="${c.id}"]`).click();assert.equal(await page.locator('.ia-component-title h3').innerText(),c.name);await page.getByRole('button',{name:'O‘rgandim',exact:true}).click();counts.components++;}
 await page.locator('[data-part="ram"]').click();await page.getByRole('button',{name:'Qismlarga ajratish',exact:true}).click();assert.equal(await page.getByLabel('Qismlarni ajratish',{exact:false}).inputValue(),'100');await shot('anatomy-exploded-desktop.png');await axe(page,'anatomy');
 await page.getByLabel('Kamera ko‘rinishi').selectOption('top');await page.getByRole('button',{name:'Yaqindan ko‘rish'}).click();
 await page.getByRole('button',{name:'Keng ekranga ochish'}).click();assert.equal(await page.getByRole('dialog',{name:'Kengaytirilgan atlas sahnasi'}).count(),1);await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 await page.getByRole('button',{name:'2D sxemaga o‘tish'}).click();assert.equal(await page.locator('.ia-flat-diagram').count(),1);await page.getByRole('button',{name:'3D ko‘rinishga o‘tish'}).click();await ready();
 await page.getByRole('tab',{name:/OS va ma’lumot/}).click();await ready();
 for(let i=0;i<bootSteps.length;i++){await page.locator('.ia-boot-steps button').nth(i).click();assert.match(await page.locator('.ia-boot-panel h3').innerText(),new RegExp(bootSteps[i].title.replace('/','\\/')));counts.boot++;}
 await page.getByLabel('Misol tizim').selectOption('Windows');assert.match(await page.locator('.ia-boot-screen').innerText(),/Windows/);
 await page.getByRole('textbox',{name:'RAMdagi matn'}).fill('Saqlanmagan o‘zgarish');await page.getByRole('button',{name:'Quvvatni uzish',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'RAMdagi matn'}).inputValue(),'');assert.equal(await page.getByTestId('ia-disk-data').innerText(),'Saqlangan fayl');
 await page.getByRole('button',{name:'Quvvatni yoqish',exact:true}).click();await page.getByRole('textbox',{name:'RAMdagi matn'}).fill('Muhim fayl');await page.getByRole('button',{name:'SSDga saqlash',exact:true}).click();await page.getByRole('button',{name:'Quvvatni uzish',exact:true}).click();await page.getByRole('button',{name:'Quvvatni yoqish',exact:true}).click();await page.getByRole('button',{name:'SSDdan ochish',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'RAMdagi matn'}).inputValue(),'Muhim fayl');
 await page.getByRole('button',{name:'128 qiymatli bit'}).click();assert.equal(await page.locator('.ia-byte-result>div').first().locator('b').innerText(),'193');await axe(page,'system');
 await page.getByRole('tab',{name:/Sinab ko‘ring/}).click();await ready();
 await page.locator('.ia-assembly-options').getByRole('button',{name:'ROM / UEFI',exact:true}).click();assert.equal(await page.locator('.ia-feedback-bad').count(),1);
 for(const task of assemblyTasks){const c=components.find(c=>c.id===task.id);await page.locator('.ia-assembly-options').getByRole('button',{name:c.short,exact:true}).click();counts.assembly++;}
 await page.getByRole('heading',{name:'Qismlar o‘z joyini topdi!'}).waitFor();
 for(const [i,d] of diagnostics.entries()){await page.locator('.ia-diagnostic-grid select').nth(i).selectOption(d.part);counts.diagnostics++;}
 for(const [i,q] of questions.entries()){await page.locator('.ia-question').nth(i).locator('[role=group]>button').nth(q.answer).click();counts.questions++;}
 assert.match(await page.locator('.ia-quiz-result').innerText(),/12 ta to‘g‘ri/);assert.match(await page.locator('.ia-progress-card').innerText(),/100/);await axe(page,'practice');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Natijani yuklab olish'}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'informatika-atlas-natijam.json');
 await page.reload();await page.locator('.informatics-atlas').waitFor();assert.match(await page.locator('.ia-progress-card').innerText(),/100/);
 await page.locator('.ia-back').click();await page.locator('.studio-hub-card').filter({has:page.getByRole('heading',{name:'Informatika atlasi',exact:true})}).click();await page.locator('.informatics-atlas').waitFor();
 await page.setViewportSize({width:390,height:844});await page.getByRole('tab',{name:/Kompyuter ichida/}).click();await ready();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('anatomy-mobile.png');await axe(page,'mobile');
 await page.getByRole('button',{name:'Tungi ko‘rinishga o‘tish',exact:true}).click();await shot('anatomy-mobile-dark.png');await axe(page,'mobile-dark');
 for(const label of [/Vaqt muzeyi/,/OS va ma’lumot/,/Sinab ko‘ring/]){await page.getByRole('tab',{name:label}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 // Explicit fallback and blocked storage still leave the lessons usable.
 const fallback=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});fallback.on('pageerror',e=>errors.push(e.message));
 await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='webgl2'||type==='experimental-webgl')return null;return original.call(this,type,...args);};Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});});
 await fallback.goto(url);await fallback.locator('.ia-fallback-note').waitFor();assert.equal(await fallback.locator('.ia-flat-diagram').count(),1);assert.equal(await fallback.locator('.ia-storage-warning').count(),1);await fallback.getByRole('tab',{name:/Kompyuter ichida/}).click();await fallback.locator('.ia-fallback-note').waitFor();await fallback.locator('[data-part="rom"]').click();assert.match(await fallback.locator('.ia-component-title h3').innerText(),/UEFI/);await axe(fallback,'no-webgl-storage-blocked');await fallback.close();
 assert.deepEqual(violations,[],'WCAG checks');assert.deepEqual(errors,[],'Browser runtime errors');
 console.log(JSON.stringify({status:'PASS',counts,checks:['real WebGL 3D','all 12 historical exhibits','all 18 component lessons','exploded view and camera','fullscreen and 2D switch','boot process','RAM / SSD power simulation','8-bit binary','assembly and diagnostics','quiz scoring','progress after reload','result download','guest navigation','mobile overflow','dark mode','WebGL fallback','blocked localStorage','WCAG axe'],screenshots:output},null,2));
}finally{writeFileSync(join(output,'browser-checks.json'),JSON.stringify({counts,errors,violations},null,2));await browser.close();await server.close();}
