// Local UI regression with simulated API responses. No live account/database writes.
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const artifacts=process.env.QA_ARTIFACT_DIR||path.join(require('node:os').tmpdir(),'sinfquiz-qa');fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['microphone']});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true});
 let active=false,national=null;
 const section={id:'fixture-national',title:'Regression variant',subject:'Matematika',description:'Fixture',questionCount:30,durationMinutes:60,visibility:'public',approvalStatus:'approved',ownerName:'Test teacher'};
 const nationalState=()=>({...national,section,question:national?.finished?null:{text:'Fixture question',options:['one','two','three','four']},selected:national?.answers[national.index]??null,result:national?.finished?{correct:0,total:30,score:0,scaleMax:75,level:'Mashq',method:'Fixture'}:null,review:national?.finished?[{id:'review-1',number:1,text:'Fixture question',topic:'Fixture topic',selected:0,selectedText:'one',correctText:'two',correct:false,explanation:'Review fixture explanation'}]:[]});
 await page.route(/\/(auth|api)\//,async route=>{const path=new URL(route.request().url()).pathname,data=route.request().postDataJSON()||{};let value={};
  if(path==='/auth/session')value={user:{id:'browser-student',role:'student',name:'UI test'},csrf:'fixture'};
  if(path==='/api/catalog')value={quizzes:[],lessons:[]};
  if(path==='/api/race/active')value=active?{active:true,phase:'lobby',playerCount:0,questionCount:10,title:'Race fixture'}:{active:false};
  if(path==='/api/typing/active')value={active};
  if(path==='/api/national')value={sections:[section]};
  if(path==='/api/national/start'){national={index:0,answers:Array(30).fill(null),startedAt:Date.now(),endsAt:Date.now()+3600000,finished:false};value=nationalState()}
  if(path==='/api/national/answer'){national.answers[national.index]=data.value;value=nationalState()}
  if(path==='/api/national/navigate'){national.index=data.index;value=nationalState()}
  if(path==='/api/national/session')value=nationalState();
  if(path==='/api/national/finish'){national.finished=true;value=nationalState()}
  if(path==='/api/national/leave'){national=null;value={ok:true}}
  await route.fulfill({json:value});
 });
 page.on('dialog',dialog=>dialog.accept());
 try{
  await page.goto('http://127.0.0.1:4173');await page.getByRole('heading',{name:'Barcha fanlar bir joyda. Bilimingizni sinab ko‘ring.'}).waitFor();
  assert.equal(await page.locator('.active-lessons').count(),0);
  assert.equal(await page.locator('.site-nav').getByText('CEFR / Multilevel').count(),0);
  assert.equal(await page.locator('.site-nav').getByRole('button',{name:/SinfQuiz/}).count(),0);
  active=true;await page.reload();await page.getByRole('heading',{name:'Hozir ochiq'}).waitFor();
  assert.equal(await page.locator('.active-lessons article').count(),2);
  await page.screenshot({path:path.join(artifacts,'qa-v73-home.png'),fullPage:true});
  await page.getByRole('button',{name:/Milliy test/}).click();await page.getByRole('button',{name:'Testni boshlash'}).click();
  await page.getByRole('heading',{name:'Fixture question'}).waitFor();
  await page.locator('.nav-brand').click();assert.equal(await page.locator('.national-exam-page').count(),1);
  assert.equal(await page.locator('.site-nav').getByRole('button',{name:'Tizimdan chiqish'}).count(),0);
  await page.evaluate(()=>location.hash='home');await page.waitForURL('**/#national-test');
  await page.getByRole('button',{name:'A one'}).click();await page.reload();await page.getByRole('heading',{name:'Fixture question'}).waitFor();
  await page.getByRole('button',{name:'Testni tugatish'}).click();await page.getByRole('heading',{name:'Xatolar tahlili'}).waitFor();
  assert.ok(await page.getByText('Review fixture explanation').isVisible());
  await page.screenshot({path:path.join(artifacts,'qa-v73-review.png'),fullPage:true});
  await page.getByRole('button',{name:'Bo‘limlarga qaytish'}).click();await page.getByRole('button',{name:'Bosh sahifaga chiqish'}).click();
  await page.getByRole('button',{name:/CEFR/}).click();
  await page.getByRole('button',{name:'Boshlash: Ingliz tili — aralash Reading'}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Boshlash',exact:true}).click();
  await page.getByRole('radio',{name:/Kathy Mellor, Rhode Island/}).check();
  await page.reload();await page.getByRole('radio',{name:/Kathy Mellor, Rhode Island/}).waitFor();
  assert.ok(await page.getByRole('radio',{name:/Kathy Mellor, Rhode Island/}).isChecked());
  await page.screenshot({path:path.join(artifacts,'qa-v73-reading.png'),fullPage:true});
  await page.getByRole('button',{name:'Tugatish',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Ha, tugatish'}).click();
  await page.getByRole('heading',{name:'Javoblar tahlili'}).waitFor();
  await page.getByRole('button',{name:'Testlarga qaytish'}).click();
  await page.getByRole('button',{name:'Python',exact:true}).click();
  await page.getByRole('button',{name:'Boshlash: Python asoslari'}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Boshlash',exact:true}).click();
  await page.getByRole('heading',{name:'IDE nima?'}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(artifacts,'qa-v73-python-mobile.png'),fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');
  assert.deepEqual(errors,[]);console.log('PASS: active-only home cards, logo guard, national review, sourced Reading persistence, explicit finish, Python and mobile overflow.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
