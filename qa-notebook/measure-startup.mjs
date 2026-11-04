import {chromium} from 'playwright';
import {existsSync,writeFileSync} from 'node:fs';

const origin=process.argv[2]||'http://127.0.0.1:4196',output=process.argv[3]||'qa-notebook/startup.json';
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--no-sandbox']});
const samples=[];
try{
 for(let i=0;i<3;i++){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_theme','light');});
  await page.route(/\/(auth|api)\//,async route=>{
   const path=new URL(route.request().url()).pathname;
   if(path==='/auth/session'){await new Promise(resolve=>setTimeout(resolve,1500));return route.fulfill({json:{user:null,csrf:'fixture'}});}
   return route.fulfill({json:{active:false}});
  });
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{level:1,name:/Bilimni|Test ishlang/}).waitFor({state:'visible'});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const sample=await page.evaluate(()=>({
   homeContentVisibleMs:Math.round(performance.now()),
   firstContentfulPaintMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime?Math.round(performance.getEntriesByName('first-contentful-paint')[0].startTime):null,
   javascriptBytes:performance.getEntriesByType('resource').filter(entry=>/\.js(?:$|\?)/.test(entry.name)).reduce((sum,entry)=>sum+entry.encodedBodySize,0),
   cssBytes:performance.getEntriesByType('resource').filter(entry=>/\.css(?:$|\?)/.test(entry.name)).reduce((sum,entry)=>sum+entry.encodedBodySize,0),
  }));
  samples.push({...sample,errors});await context.close();
 }
 const median=key=>{
  const values=samples.map(sample=>sample[key]).filter(Number.isFinite).sort((a,b)=>a-b),middle=Math.floor(values.length/2);
  return values.length?(values.length%2?values[middle]:Math.round((values[middle-1]+values[middle])/2)):null;
 };
 const result={scenario:'Cold Chromium desktop, local production build, 1500 ms delayed account lookup, guest fixture, three isolated contexts',samples,median:{homeContentVisibleMs:median('homeContentVisibleMs'),firstContentfulPaintMs:median('firstContentfulPaintMs'),javascriptBytes:median('javascriptBytes'),cssBytes:median('cssBytes')}};
 writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 if(samples.some(sample=>sample.errors.length))process.exitCode=1;
}finally{await browser.close();}
