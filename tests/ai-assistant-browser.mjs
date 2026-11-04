// Real Chromium UI; account/catalog and AI responses use explicit fixtures.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {chromium} from 'playwright';

const origin=process.env.AI_QA_URL||'http://127.0.0.1:5173',out=join(process.cwd(),'qa-ai-integration');mkdirSync(out,{recursive:true});
const installedChrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:existsSync(installedChrome)?{executablePath:installedChrome}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),errors=[],requests=[],checks=[],accessibility=[];
const actor={id:'c44dd92f-2ca0-4f56-ae39-daf493b5d50a',name:'AI sinov o‘quvchisi',role:'student'};
let failNext=false,delayNext=false;
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_theme','light');});
await page.route(/\/(auth|api)\//,async route=>{
 const request=route.request(),path=new URL(request.url()).pathname;
 let data=path==='/auth/session'?{user:actor,csrf:'qa'}:path==='/api/catalog'?{lessons:[],quizzes:[]}:{};
 if(path==='/api/ai-assistant'){
  if(request.method()==='GET')data={providerConfigured:true,modes:['guide','tutor','quiz']};
  else{
   const input=request.postDataJSON();requests.push(input);assert.match(request.headers().authorization||'',/^Bearer /);
   if(failNext){failNext=false;return route.fulfill({status:503,json:{error:'Sinov: aloqa vaqtincha uzildi.',code:'GROQ_NETWORK',retryable:true}});}
   if(delayNext){delayNext=false;await new Promise(resolve=>setTimeout(resolve,1000));}
   data={answerUz:input.mode==='quiz'?'Hujayra bo‘yicha uchta mashq savoli.':input.mode==='tutor'?'Hujayra tirik organizmning asosiy tuzilish birligi. Uni kichik ustaxona deb tasavvur qiling.':'Biologiya bo‘limini oching va organ yoki mavzuni tanlang.',routeIds:['guide','mentor'].includes(input.mode)?['biology','admin','invented']:[],questions:input.mode==='quiz'?Array.from({length:3},(_,i)=>({question:`Hujayra mashqi ${i+1}: energiya ishlab chiqaruvchi organoid qaysi?`,options:['Yadro','Mitoxondriya','Ribosoma','Golji apparati'],correctIndex:1,explanationUz:`${i+1}-izoh: mitoxondriya hujayrada energiya almashinuvida qatnashadi.`})):[]};
  }
 }
 try{await route.fulfill({json:data});}catch(error){if(!/closed|cancel|abort/i.test(error.message))throw error;}
});
const fits=async label=>{const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(dimensions.scroll<=dimensions.width,`${label}: ${JSON.stringify(dimensions)}`);checks.push(label);};
const axe=async label=>{if(!await page.evaluate(()=>!!window.axe))await page.addScriptTag({path:join(process.cwd(),'node_modules/axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await window.axe.run('.sp-guide',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));accessibility.push({label,violations});assert.deepEqual(violations,[],label);};
try{
 await page.goto(origin+'/#ai-yordamchi');await page.getByRole('heading',{name:'Qayerdan boshlaymiz?',exact:true}).waitFor();
 // A local-only Supabase session fixture exercises the real browser token wrapper.
 // The server route above is intercepted; this token is never sent to Supabase.
 await page.evaluate(async actor=>{const {supabaseConfig}=await import('/src/supabase-sdk.js');const now=Math.floor(Date.now()/1000),project=new URL(supabaseConfig.url).hostname.split('.')[0],jwtPart=o=>btoa(JSON.stringify(o)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_'),token=jwtPart({alg:'HS256',typ:'JWT'})+'.'+jwtPart({sub:actor.id,role:'authenticated',aud:'authenticated',iat:now,exp:now+3600})+'.qa-signature';localStorage.setItem('sb-'+project+'-auth-token',JSON.stringify({access_token:token,refresh_token:'local-qa-only',token_type:'bearer',expires_in:3600,expires_at:now+3600,user:{id:actor.id,aud:'authenticated',role:'authenticated',email:'ai-qa@example.test',app_metadata:{provider:'email',providers:['email']},user_metadata:{name:actor.name},created_at:new Date().toISOString()}}));window.__SINFQUIZ_LEGACY_TEST__=false;},actor);
 await fits('desktop 1440px');await axe('desktop guide');
 const input=page.getByRole('textbox',{name:'Savolingiz',exact:true}),send=page.getByRole('button',{name:'Yordamchidan so‘rash',exact:true});
 assert.ok(await page.locator('.sp-guide-robot .sq-robot').isVisible());
 await input.fill('Biologiya bo‘limini qanday ishlataman?');await input.press('Shift+Enter');assert.ok((await input.inputValue()).endsWith('\n'));assert.equal(requests.length,0);await input.press('Backspace');await input.press('Enter');await page.getByText('Biologiya bo‘limini oching va organ yoki mavzuni tanlang.',{exact:true}).waitFor();assert.equal(await input.inputValue(),'');assert.equal(requests.length,1);checks.push('robot, Enter submit and Shift+Enter newline work in the browser');
 await page.keyboard.press('Control+Home');await page.screenshot({path:join(process.cwd(),'qa-ai-upgrade/robot-desktop.png'),fullPage:false});
 assert.equal(await page.locator('.sp-guide-conversation').getByRole('button',{name:'Biologiya',exact:true}).count(),1);assert.equal(await page.locator('.sp-guide-conversation').getByRole('button',{name:'Ustoz boshqaruvi',exact:true}).count(),0);checks.push('guide renders permitted route and filters staff routes');
 await page.getByRole('button',{name:'Mavzuni tushuntirish',exact:true}).click();await input.fill('Hujayrani sodda tushuntiring.');await send.click();await page.getByText(/Hujayra tirik organizmning asosiy/).waitFor();assert.equal(requests.at(-1).mode,'tutor');assert.equal(requests.at(-1).history.length,2);checks.push('tutor follows prior conversation');
 await page.getByRole('button',{name:'Mashq savollari',exact:true}).click();await input.fill('Hujayra bo‘yicha 3 ta savol bering.');await send.click();await page.getByText('Hujayra bo‘yicha uchta mashq savoli.',{exact:true}).waitFor();assert.equal(await page.locator('.sp-assistant-quiz fieldset').count(),3);assert.equal(await page.getByText('1-izoh:',{exact:false}).count(),0);
 for(const item of await page.locator('.sp-assistant-quiz fieldset').all())await item.getByRole('button',{name:'B. Mitoxondriya',exact:true}).click();await page.getByText('Mashq yakuni: 3 / 3 ta to‘g‘ri javob.',{exact:true}).waitFor();assert.ok(await page.locator('.sp-assistant-quiz fieldset').first().getByRole('button',{name:'A. Yadro',exact:true}).isDisabled());checks.push('quiz reveals explanations after choice and scores practice');
 await page.screenshot({path:join(out,'assistant-desktop.png'),fullPage:true});await axe('desktop completed quiz');
 for(const width of [390,320,768]){await page.setViewportSize({width,height:900});await page.keyboard.press('Control+Home');await fits('assistant '+width+'px');await axe('assistant '+width+'px');}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:join(out,'assistant-mobile.png'),fullPage:true});
 failNext=true;await input.fill('Savolim yo‘qolmasin.');await send.click();await page.getByRole('alert').filter({hasText:'Sinov: aloqa vaqtincha uzildi.'}).waitFor();assert.equal(await input.inputValue(),'Savolim yo‘qolmasin.');checks.push('provider failure preserves question');
 delayNext=true;await send.click();await page.getByRole('button',{name:'Bekor qilish',exact:true}).click();assert.equal(await input.inputValue(),'Savolim yo‘qolmasin.');await send.waitFor({state:'visible'});checks.push('cancel preserves draft');
 await page.getByRole('button',{name:'Menyuni ochish',exact:true}).click();await page.getByRole('dialog',{name:'Bo‘limlar menyusi'}).getByRole('button',{name:'Tungi ko‘rinishga o‘tish',exact:true}).click();await page.keyboard.press('Escape');await axe('mobile dark assistant');await fits('dark assistant 390px');await page.screenshot({path:join(out,'assistant-mobile-dark.png'),fullPage:true});
 assert.deepEqual(errors,[],'runtime errors');console.log(JSON.stringify({status:'PASS',checks,accessibilityChecks:accessibility.length,aiRequests:requests.length},null,2));
}finally{writeFileSync(join(out,'browser-results.json'),JSON.stringify({checks,errors,accessibility,aiRequests:requests.map(r=>({mode:r.mode,historyLength:r.history.length}))},null,2));await browser.close();}
