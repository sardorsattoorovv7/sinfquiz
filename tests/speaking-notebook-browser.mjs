// Real guest UI and styles; API availability uses explicit fixtures.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {chromium} from 'playwright';

const root=process.cwd(),out=join(root,'qa-notebook-speaking'),origin=process.env.AI_QA_URL||'http://127.0.0.1:5173';
mkdirSync(out,{recursive:true});
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[],checks=[];
page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_theme','light');});
await page.route(/\/(auth|api)\//,async route=>{const path=new URL(route.request().url()).pathname;await route.fulfill({json:path==='/auth/session'?{user:null,csrf:'qa'}:path==='/api/ai-speaking'?{providerConfigured:true,sources:[]}:{lessons:[],quizzes:[]}});});
try{
 await page.goto(origin+'/#ai-speaking');
 await page.getByRole('heading',{name:'Inglizcha gapirishni mashq qiling.',exact:true}).waitFor();
 assert.ok(await page.getByRole('button',{name:'Alohida qismni mashq qilish',exact:true}).isDisabled());
 await page.addScriptTag({path:join(root,'node_modules/axe-core/axe.min.js')});
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
  for(const width of [1440,1024,768,390,360]){
   await page.setViewportSize({width,height:900});
   const size=await page.evaluate(()=>({screen:innerWidth,content:document.documentElement.scrollWidth}));
   assert.ok(size.content<=size.screen,'Horizontal overflow '+theme+' '+width+': '+JSON.stringify(size));
   const violations=await page.evaluate(async()=>(await window.axe.run('.sp-speaking-page',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
   assert.deepEqual(violations,[],theme+' '+width);
   checks.push({theme,width,overflow:false,violations:violations.length});
   if(width===1440||width===390)await page.screenshot({path:join(out,'speaking-'+theme+'-'+width+'.png'),fullPage:true});
  }
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',checks:checks.length,runtimeErrors:errors.length}));
}finally{writeFileSync(join(out,'results.json'),JSON.stringify({checks,errors},null,2));await browser.close();}
