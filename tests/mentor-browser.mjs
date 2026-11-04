// Actual Chromium UI; reviewed location replies run through the real service.
// Paid teacher replies and the learner account are explicit local fixtures.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {assistantLocalAnswer} from '../server/assistant/service.js';

const origin=process.env.AI_QA_URL||'http://127.0.0.1:5173',out=join(process.cwd(),'qa-ai-mentor');mkdirSync(out,{recursive:true});
const installedChrome='C:/Program Files/Google/Chrome/Application/chrome.exe',browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:existsSync(installedChrome)?{executablePath:installedChrome}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),errors=[],requests=[],checks=[],accessibility=[];
const actor={id:'c44dd92f-2ca0-4f56-ae39-daf493b5d50a',name:'Sinov o‘quvchisi',role:'student'};
const quiz={answerUz:'Kasrlar bo‘yicha beshta savolni bajaramiz. Javoblaringizga qarab nimadan davom etishni tanlaymiz.',routeIds:[],quizType:'diagnostic',subjectUz:'Matematika',topicUz:'Kasrlar',questions:[
 {question:'3/4 kasrida maxraj qaysi son?',options:['3','4','7','1'],correctIndex:1,explanationUz:'Maxraj chiziq ostidagi 4 soni: butun to‘rtta teng qismga bo‘lingan.',skillUz:'Kasr tuzilishi',difficulty:'foundation'},
 {question:'8 ta olmaning 1/4 qismi nechta?',options:['1','2','4','8'],correctIndex:1,explanationUz:'Sakkizni to‘rtga bo‘lamiz: 8 ÷ 4 = 2.',skillUz:'Butunning qismi',difficulty:'foundation'},
 {question:'1/2 + 1/4 nechaga teng?',options:['2/6','3/4','1/6','1/8'],correctIndex:1,explanationUz:'1/2 = 2/4. Demak 2/4 + 1/4 = 3/4.',skillUz:'Kasrlarni qo‘shish',difficulty:'application'},
 {question:'Qaysi kasr kattaroq: 2/3 yoki 1/2?',options:['1/2','2/3','Ular teng','Taqqoslab bo‘lmaydi'],correctIndex:1,explanationUz:'2/3 = 4/6, 1/2 = 3/6. To‘rtta oltidan bir uchta oltidan birdan ko‘p, demak 2/3 kattaroq.',skillUz:'Kasrlarni solishtirish',difficulty:'application'},
 {question:'20 betlik matnning 3/4 qismini o‘qidingiz. Nechta bet o‘qildi?',options:['10','15','5','18'],correctIndex:1,explanationUz:'20 ÷ 4 × 3 = 15 bet.',skillUz:'Matnli masala',difficulty:'challenge'},
]};
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(id=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_theme','light');localStorage.setItem('sq_guide_746:'+id,'done');},actor.id);
await page.route(/\/(auth|api)\//,async route=>{
 const req=route.request(),path=new URL(req.url()).pathname;let data=path==='/auth/session'?{user:actor,csrf:'qa'}:{};
 if(path==='/api/ai-assistant'){
  if(req.method()==='GET')data={providerConfigured:true};
  else{
   const input=req.postDataJSON();requests.push(input);assert.match(req.headers().authorization||'',/^Bearer /);
   data=assistantLocalAnswer(input,actor);
   if(!data&&input.learning?.length){
    const practice=/3 ta yangi mashq/.test(input.message);
    data={answerUz:practice?'Natijangizga mos uchta yangi mashq.':'Maxraj — butun nechta teng bo‘lakka bo‘linganini bildiradi. Masalan, 3/4 da maxraj 4. Endi 2/5 ning maxrajini aytib ko‘ring.',routeIds:[],quizType:practice?'practice':'none',subjectUz:practice?'Matematika':'',topicUz:practice?'Kasrlar':'',questions:practice?Array.from({length:3},(_,i)=>({question:`${i+2}/9 kasrida maxraj qaysi?`,options:[String(i+2),'9','1','18'],correctIndex:1,explanationUz:'Maxraj chiziq ostidagi 9 soni.',skillUz:'Kasr tuzilishi',difficulty:'foundation'})):[]};
   }
   data??=/kasr/i.test(input.message)?quiz:{answerUz:'Albatta, birga aniqlaymiz. Qaysi fan bo‘yicha bilimni tekshirmoqchisiz?',routeIds:[],questions:[],quizType:'none',subjectUz:'',topicUz:''};
  }
 }
 await route.fulfill({json:data});
});
const fits=async label=>{const result=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(result.scroll<=result.width,label);checks.push(label);};
const axe=async label=>{if(!await page.evaluate(()=>!!window.axe))await page.addScriptTag({path:join(process.cwd(),'node_modules/axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await window.axe.run('.sp-guide',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));accessibility.push({label,violations});assert.deepEqual(violations,[],label);};
try{
 await page.goto(origin+'/#ai-yordamchi');await page.getByRole('heading',{name:'Qayerdan boshlaymiz?',exact:true}).waitFor();
 await page.evaluate(async actor=>{const {supabaseConfig}=await import('/src/supabase-sdk.js'),now=Math.floor(Date.now()/1000),project=new URL(supabaseConfig.url).hostname.split('.')[0],part=o=>btoa(JSON.stringify(o)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_'),token=part({alg:'HS256',typ:'JWT'})+'.'+part({sub:actor.id,role:'authenticated',aud:'authenticated',iat:now,exp:now+3600})+'.qa-signature';localStorage.setItem('sb-'+project+'-auth-token',JSON.stringify({access_token:token,refresh_token:'local-qa-only',token_type:'bearer',expires_in:3600,expires_at:now+3600,user:{id:actor.id,aud:'authenticated',role:'authenticated',email:'mentor-qa@example.test',app_metadata:{provider:'email',providers:['email']},user_metadata:{name:actor.name},created_at:new Date().toISOString()}}));window.__SINFQUIZ_LEGACY_TEST__=false;},actor);
 const input=page.getByRole('textbox',{name:'Savolingiz',exact:true}),send=page.getByRole('button',{name:'Yordamchidan so‘rash',exact:true});
 await input.fill('qayerdaman');await input.press('Enter');await page.getByText(/Siz hozir SinfQuizning “AI yordamchi” sahifasidasiz/).waitFor();assert.equal(requests[0].view,'aiGuide');assert.equal(requests[0].mode,'mentor');checks.push('location question names the actual AI page');
 await page.getByRole('navigation',{name:'Qo‘llanma bo‘limlari'}).getByRole('button',{name:'Atlaslar',exact:true}).click();await input.fill('Hozir qayerdaman?');await send.click();await page.waitForFunction(()=>document.querySelectorAll('.sp-guide-conversation>article').length===2);assert.equal(requests.at(-1).view,'aiGuide');assert.equal(requests.at(-1).focusView,'atlasHub');assert.equal(await page.getByText(/AtlasHub bo‘limi/).count(),0);checks.push('guide selection cannot masquerade as current location');
 await input.fill('Bilimimni tekshiring.');await send.click();await page.getByText(/Albatta, birga aniqlaymiz\. Qaysi fan yoki mavzu bo‘yicha/).waitFor();assert.equal(await page.locator('.sp-diagnostic').count(),0);checks.push('unknown subject gets one clarification');
 await input.fill('Matematika: kasrlar.');await input.press('Enter');const mini=page.getByRole('region',{name:'Darajani aniqlash mini-testi'});await mini.waitFor();await axe('diagnostic first question');assert.equal(await mini.locator('fieldset').count(),1);assert.ok(await mini.getByRole('button',{name:'Keyingi savol'}).isDisabled());
 for(let i=0;i<5;i++){
  assert.equal(await page.getByText(quiz.questions[0].explanationUz,{exact:true}).count(),0);
  const chosen=quiz.questions[i].options[i===0||i===2?0:1];await mini.getByRole('button',{name:new RegExp('^[AB]\\. '+chosen.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).click();await mini.getByRole('button',{name:i===4?'Natijani ko‘rish':'Keyingi savol'}).click();
 }
 const result=page.getByRole('region',{name:'Darajani aniqlash natijasi'});await result.getByRole('heading',{name:'Mini-test natijasi: 3 / 5'}).waitFor();await result.getByText('Asoslarni mustahkamlash kerak',{exact:true}).waitFor();assert.equal(requests.length,4);checks.push('five choices produce a topic estimate without an extra AI call');await axe('diagnostic result');await result.scrollIntoViewIfNeeded();await page.screenshot({path:join(out,'mentor-result-desktop.png'),fullPage:false});
 await result.getByRole('button',{name:'Xatolarimni tushuntiring'}).click();await page.getByText(/Maxraj — butun nechta teng bo‘lakka/).waitFor();assert.equal(requests.at(-1).learning[0].items.filter(item=>item.chosen===item.expected).length,3);assert.equal(requests.at(-1).learning[0].items[0].chosen,'3');assert.equal(requests.at(-1).learning[0].items[0].expected,'4');checks.push('teacher follow-up receives exact missed skills and choices');
 await result.getByRole('button',{name:'Natijamga mos mashq'}).click();await page.getByText('Natijangizga mos uchta yangi mashq.',{exact:true}).waitFor();assert.equal(await page.locator('.sp-assistant-quiz:not(.sp-diagnostic) fieldset').count(),3);checks.push('next practice uses the completed diagnostic context');
 for(const width of [320,390,768]){await page.setViewportSize({width,height:900});await fits('mentor '+width+'px');if(width===320)await axe('mentor 320px');}
 await page.setViewportSize({width:390,height:844});await result.scrollIntoViewIfNeeded();await page.screenshot({path:join(out,'mentor-result-mobile.png'),fullPage:false});
 await page.getByRole('button',{name:'Menyuni ochish',exact:true}).click();await page.getByRole('dialog',{name:'Bo‘limlar menyusi'}).getByRole('button',{name:'Tungi ko‘rinishga o‘tish',exact:true}).click();await page.keyboard.press('Escape');await axe('mentor dark 390px');
 await page.getByRole('button',{name:'Bosh sahifaga qaytish',exact:true}).click();await page.getByRole('button',{name:'Yordam',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Yordam',exact:true});await dialog.getByRole('textbox',{name:'Savolingiz',exact:true}).fill('qayerdaman');await dialog.getByRole('button',{name:'Yordamchidan so‘rash'}).click();await dialog.getByText(/Siz hozir SinfQuizning “Bosh sahifa” sahifasidasiz/).waitFor();assert.equal(requests.at(-1).view,'home');checks.push('floating teacher knows the page underneath the dialog');await axe('compact dark teacher');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'PASS',checks:checks.length,accessibilityChecks:accessibility.length,requests:requests.length}));
}finally{if(!checks.length){await page.screenshot({path:join(out,'browser-startup.png')});writeFileSync(join(out,'browser-startup.txt'),(await page.locator('body').innerText()).slice(0,3000));}writeFileSync(join(out,'browser-results.json'),JSON.stringify({checks,errors,accessibility,requests:requests.map(r=>({mode:r.mode,view:r.view,focusView:r.focusView,learningReports:r.learning?.length||0}))},null,2));await browser.close();}
