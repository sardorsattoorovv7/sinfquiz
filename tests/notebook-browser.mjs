// Actual React/browser flows. Only account/catalog/test transport uses fixtures.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const root=process.cwd(),out=join(root,'qa-notebook');mkdirSync(out,{recursive:true});
const server=await createServer({root,cacheDir:'node_modules/.vite-tests/notebook-browser',server:{host:'127.0.0.1',port:4197,hmr:false}});await server.listen();
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:existsSync(chrome)?{executablePath:chrome}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page.setDefaultTimeout(15000);
const origin='http://127.0.0.1:4197',checks=[],accessibility=[],errors=[],requests=[];let role=null;
const question={id:'notebook-q',type:'test',text:'2 + 2 nechaga teng?',options:['3','4','5','6'],correct:1,points:100,time:60,subject:'Matematika'};
const quiz={id:'notebook-quiz',title:'Hisoblash mashqi',subject:'Matematika',group:'Sinov guruhi',questionCount:1,questions:[question],pin:'001234',status:'active'};
const player={id:'notebook-player',name:'Sinov ishtirokchisi',avatar:'🧑‍💻',score:100,correct:1,answers:1};
const game={quiz,player:{...player,score:0,correct:0,answers:0},question,index:0,deadline:Date.now()+60000,serverNow:Date.now(),csrf:'qa',ranking:[],finished:false};
let rejectNextDialog=false;
page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{if(rejectNextDialog){rejectNextDialog=false;await d.dismiss()}else await d.accept()});
await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_theme','light');localStorage.setItem('sq_guide_746:notebook-user','done');window.speechSynthesis.speak=()=>{};});
await page.route('https://**',route=>route.abort());
await page.route(/\/(auth|api)\//,async route=>{
 const req=route.request(),path=new URL(req.url()).pathname,body=req.method()==='POST'?req.postDataJSON():{};requests.push({path,method:req.method(),...(path==='/api/resolve'?{pin:body.pin}:{})});
 let data={};
 if(path==='/auth/session')data={user:role?{id:'notebook-user',name:'Sinov foydalanuvchisi',role}:null,csrf:'qa'};
 else if(path==='/api/catalog'||path==='/api/lessons')data={quizzes:[],lessons:[]};
 else if(path==='/api/quizzes')data={quizzes:[quiz],publicQuizzes:[],lessons:[],players:[{...player,quizId:quiz.id}],results:[],typing:{active:false,results:[]},race:{active:false},nationalSections:[]};
 else if(path==='/api/resolve'){if(body.pin!=='001234')return route.fulfill({status:404,json:{error:'Kod topilmadi. Ustozingizdan kodni tekshiring.'}});data={quiz,ticket:'notebook-ticket'};}
 else if(path==='/api/play/join')data={...game,player:{...game.player,name:body.name}};
 else if(path==='/api/play/answer')data={...game,player:{...player,lastEarned:100},feedback:{correct:true,ratio:1,correctIndex:1,checks:[],explanation:'Ikki va ikki — to‘rt.'}};
 else if(path==='/api/play/next'||path==='/api/play/session')data={...game,player,finished:true,ranking:[{...player,quizId:quiz.id}]};
 else if(path==='/api/ai-speaking'||path==='/api/ai-assistant')data={providerConfigured:true};
 else if(path.includes('concepts')||path.includes('observations'))data=[];
 else if(path.endsWith('/active'))data={active:false};
 await route.fulfill({status:200,json:data});
});
const fits=async label=>{assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+': page overflow');checks.push({label,overflow:false});};
const shot=async label=>{await page.screenshot({path:join(out,label+'.png'),fullPage:true});};
const axe=async label=>{await page.addScriptTag({path:join(root,'node_modules/axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await window.axe.run('.studio-app',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));accessibility.push({label,violations});assert.deepEqual(violations,[],label);};
let navigation=0;
const open=async(hash='')=>{await page.goto(origin+'/?notebook-qa='+(++navigation)+hash);await page.locator('.studio-app').waitFor();};

try{
 await open();await page.getByRole('heading',{name:'Test ishlang. Mavzuni o‘rganing.',exact:true}).waitFor();await fits('guest-home-1440');await shot('home-desktop');await axe('guest home desktop');
 const pin=page.locator('.sq-notebook-home .pw-class-join input');await pin.fill('999999');await pin.press('Enter');await page.getByRole('alert').filter({hasText:'Kod topilmadi'}).waitFor();assert.equal(await pin.inputValue(),'999999');
 await pin.fill('001234');await pin.press('Enter');await page.getByRole('heading',{name:'Testga tayyorlaning',exact:true}).waitFor();assert.equal(requests.filter(r=>r.path==='/api/resolve').at(-1).pin,'001234');await fits('guest-code-resolved');await shot('join-desktop');
 await page.getByLabel('Ismingiz',{exact:true}).fill('Sinov ishtirokchisi');await page.getByRole('button',{name:'Testni boshlash',exact:true}).click();await page.getByRole('heading',{name:question.text,exact:true}).waitFor();await fits('test-question');await shot('test-question-desktop');
 await page.locator('.answer-grid button').nth(1).click();await page.getByRole('button',{name:'Javobni yuborish',exact:true}).click();await page.getByRole('button',{name:'Yakunlash',exact:true}).click();await page.locator('.result-card').waitFor();assert.match(await page.locator('.result-stats').innerText(),/100/);await fits('test-result');await shot('test-result-desktop');
 checks.push({label:'guest wrong/valid code → name → actual answer request → result fixture',passed:true});

 for(const width of [1024,768,390,360]){await page.setViewportSize({width,height:900});await open();await page.getByRole('heading',{name:'Test ishlang. Mavzuni o‘rganing.',exact:true}).waitFor();await page.locator('.studio-topbar .teacher-entry').waitFor();await fits('home-'+width);const input=page.locator('.sq-notebook-home .pw-class-join input');assert.ok((await input.boundingBox()).y<900,'code field is visible before decorative atlas');assert.ok(await page.locator('.studio-topbar .teacher-entry svg').isVisible(),'account action has a visible icon at '+width);if(width===390){await shot('home-mobile');await axe('guest home mobile');}}

 await page.setViewportSize({width:1440,height:1000});await open('/#atlaslar'.replace(/^\//,''));await page.locator('.atlas-learning-hub').waitFor();await fits('atlas-catalog');await shot('atlas-desktop');await axe('atlas catalog');
 await page.setViewportSize({width:390,height:900});await fits('atlas-mobile');await shot('atlas-mobile');
 await open('#ai-speaking');await page.locator('.sp-page').waitFor();await page.getByRole('heading',{name:'Inglizcha gapirishni mashq qiling.',exact:true}).waitFor();await fits('speaking-mobile');await shot('speaking-mobile');await axe('guest speaking mobile');

 role='teacher';await page.setViewportSize({width:1440,height:1000});await open();await page.getByRole('button',{name:'Test yaratish',exact:true}).waitFor();await page.getByRole('button',{name:'Test yaratish',exact:true}).click();await page.getByRole('heading',{name:'Yangi test yaratish',exact:true}).waitFor();await fits('teacher-new-quiz');await shot('teacher-editor-desktop');await axe('teacher quiz editor');
 await page.setViewportSize({width:390,height:900});await fits('teacher-editor-mobile');await shot('teacher-editor-mobile');
 await page.getByLabel('Test nomi',{exact:true}).fill('Saqlanmagan test');
 rejectNextDialog=true;await page.getByRole('navigation',{name:'Tezkor bo‘limlar'}).getByRole('button',{name:'Bosh',exact:true}).click();
 assert.equal(await page.getByLabel('Test nomi',{exact:true}).inputValue(),'Saqlanmagan test');
 rejectNextDialog=true;await page.evaluate(()=>{location.hash='atlaslar'});await page.waitForFunction(()=>location.hash==='#dashboard');
 assert.equal(await page.getByLabel('Test nomi',{exact:true}).inputValue(),'Saqlanmagan test');
 await page.getByRole('navigation',{name:'Tezkor bo‘limlar'}).getByRole('button',{name:'Bosh',exact:true}).click();await page.locator('.sq-notebook-home').waitFor();
 checks.push({label:'unsaved editor survives cancelled shell and hash navigation; confirmed exit works',passed:true});
 role='student';
 for(const [hash,selector,label] of [['#matematika','.math-atlas','math'],['#biologiya','.biology-atlas','biology'],['#kimyo','.chemistry-atlas','chemistry'],['#koinot','.space-atlas','space'],['#informatika-atlasi','.informatics-atlas','informatics'],['#tarix-atlasi','.history-atlas','history'],['#darsliklar','.textbook-hub','textbooks']]){
  await page.setViewportSize({width:1440,height:1000});await open(hash);await page.locator(selector).waitFor();await fits(label+'-desktop');await shot(label+'-desktop');
  await page.setViewportSize({width:390,height:900});await fits(label+'-mobile');await shot(label+'-mobile');
 }
 role='teacher';await open('#sinfxona');await page.locator('.cr-classroom').waitFor();await fits('classroom-mobile');await shot('classroom-mobile');
 role='student';await open('#sinfxona');assert.equal(await page.locator('.cr-classroom').count(),0);checks.push({label:'student classroom role restriction retained',passed:true});
 role=null;await open();await page.getByRole('button',{name:'Hisobga kirish',exact:true}).first().waitFor();await page.evaluate(()=>{window.__SINFQUIZ_LEGACY_TEST__=false;});await page.getByRole('button',{name:'Hisobga kirish',exact:true}).first().click();await page.locator('.auth-portal').waitFor();await fits('account-login-mobile');await shot('login-mobile');await axe('account login mobile');
 await page.evaluate(()=>{localStorage.setItem('sq_theme','dark');document.documentElement.dataset.theme='dark';});await fits('login-dark');await shot('login-mobile-dark');
 assert.deepEqual(errors,[],'browser runtime errors');
 writeFileSync(join(out,'browser-results.json'),JSON.stringify({checks,accessibility,errors,requestCounts:requests.reduce((a,r)=>(a[r.path]=(a[r.path]||0)+1,a),{})},null,2)+'\n');
 for(const name of ['browser-failure.json','failure.png'])if(existsSync(join(out,name)))unlinkSync(join(out,name));
 console.log(JSON.stringify({checks:checks.length,accessibility:accessibility.length,errors:errors.length,passed:true}));
}catch(error){await shot('failure');writeFileSync(join(out,'browser-failure.json'),JSON.stringify({error:error.message,checks,accessibility,errors},null,2)+'\n');throw error;}
finally{await browser.close();await server.close();}
