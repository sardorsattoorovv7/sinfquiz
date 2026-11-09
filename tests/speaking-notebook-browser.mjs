// Real guest UI and styles; API availability uses explicit fixtures.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {SpeakingService} from '../server/speaking/service.js';
import {MemoryRepo, profile, testEnv, uid} from './speaking-fixtures.js';

const root=process.cwd(),out=process.env.SPEAKING_QA_DIR||join(root,'qa-notebook-speaking'),origin=process.env.AI_QA_URL||'http://127.0.0.1:5173';
mkdirSync(out,{recursive:true});
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[],checks=[];
page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_theme','light');});
await page.route(/\/(auth|api)\//,async route=>{const path=new URL(route.request().url()).pathname;await route.fulfill({json:path==='/auth/session'?{user:null,csrf:'qa'}:path==='/api/ai-speaking'?{providerConfigured:true,sources:[]}:{lessons:[],quizzes:[]}});});

async function checkExamRoom() {
 const repo = new MemoryRepo();
 let currentTime;
 const service = new SpeakingService(repo, {env: testEnv, now: () => currentTime || new Date()});
 const actor = {id: uid, role: 'student', name: 'Sinov o‘quvchisi'};
 await service.run(actor, 'profile', {examMode: 'multilevel', profile: profile('multilevel')});
 const candidate = await browser.newPage({viewport: {width: 1440, height: 900}, permissions: ['microphone']});
 const actions = [];
 let firstTurn, uploads = 0;
 candidate.on('pageerror', error => errors.push(error.message));
 await candidate.addInitScript(() => {
  window.__SINFQUIZ_LEGACY_TEST__ = true;
  localStorage.setItem('sq_theme', 'light');
  const microphone = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async constraints => {
   await new Promise(resolve => {window.__permitMicrophone = resolve;});
   return microphone(constraints);
  };
  speechSynthesis.speak = utterance => {window.__examinerPrompt = utterance.text; window.__examinerSpeaking = true;};
  speechSynthesis.cancel = () => {window.__examinerSpeaking = false;};
  const start = MediaRecorder.prototype.start;
  MediaRecorder.prototype.start = function (...args) {
   if (window.__examinerSpeaking) throw Error('Examiner voice was captured with the answer');
   return start.apply(this, args);
  };
 });
 await candidate.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
 await candidate.route('**/storage/v1/object/upload/sign/**', async route => {
  const headers = {'access-control-allow-origin': origin, 'access-control-allow-methods': 'PUT, OPTIONS', 'access-control-allow-headers': '*'};
  if (route.request().method() === 'OPTIONS') return route.fulfill({status: 204, headers});
  assert.ok(route.request().postDataBuffer()?.length > 100);
  uploads++;
  await route.fulfill(uploads === 1 ? {status: 503, headers, json: {message: 'QA network interruption'}} : {headers, json: {Key: 'qa-audio'}});
 });
 await candidate.route(/\/(auth|api)\//, async route => {
  const request = route.request(), path = new URL(request.url()).pathname;
  if (path === '/auth/session') return route.fulfill({json: {user: actor, csrf: 'qa'}});
  if (path !== '/api/ai-speaking') return route.fulfill({json: {lessons: [], quizzes: []}});
  if (request.method() === 'GET') return route.fulfill({json: {providerConfigured: true, sources: []}});
  const {action, data} = request.postDataJSON();
  actions.push(action);
  try {
   const result = await service.run(actor, action, data);
   if (action === 'begin_turn') firstTurn = result.turn;
   await route.fulfill({json: result});
  } catch (error) {
   await route.fulfill({status: error.status || 500, json: {error: error.message, code: error.code}});
  }
 });
 try {
  await candidate.goto(origin);
  await candidate.getByRole('button', {name: 'Tizimdan chiqish'}).waitFor();
  await candidate.evaluate(async user => {
   const {supabaseConfig} = await import('/src/supabase-sdk.js');
   const project = new URL(supabaseConfig.url).hostname.split('.')[0];
   const now = Math.floor(Date.now() / 1000);
   const part = value => btoa(JSON.stringify(value)).replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
   const token = part({alg: 'HS256', typ: 'JWT'}) + '.' + part({sub: user.id, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600}) + '.qa-signature';
   localStorage.setItem('sb-' + project + '-auth-token', JSON.stringify({
    access_token: token, refresh_token: 'local-qa-only', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600,
    user: {id: user.id, aud: 'authenticated', role: 'authenticated', email: 'exam-qa@example.test', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString()},
   }));
   window.__SINFQUIZ_LEGACY_TEST__ = false;
   location.hash = 'ai-speaking';
  }, actor);
  await candidate.getByRole('button', {name: 'Multilevel Speaking', exact: true}).click();
  await candidate.getByRole('button', {name: 'Speaking sinovini boshlash', exact: true}).click();
  await candidate.locator('.sp-consent input').check();
  await candidate.getByRole('button', {name: 'Boshlang‘ich sinovni boshlash', exact: true}).click();
  await candidate.getByRole('heading', {name: 'Speaking imtihon xonasi'}).waitFor();
  await candidate.screenshot({path: join(out, 'exam-room-desktop.png')});
  await candidate.setViewportSize({width: 390, height: 844});
  await candidate.evaluate(() => {document.documentElement.dataset.theme = 'dark';});
  assert.ok(await candidate.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await candidate.addScriptTag({path: join(root, 'node_modules/axe-core/axe.min.js')});
  const violations = await candidate.evaluate(async () => (await axe.run('.sp-exam-room', {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']}})).violations.map(v => ({id:v.id,nodes:v.nodes.map(n=>n.target)})));
  assert.deepEqual(violations, []);

  await candidate.clock.install();
  await candidate.getByRole('button', {name: 'Savolni boshlash', exact: true}).click();
  await candidate.waitForFunction(() => typeof window.__permitMicrophone === 'function');
  assert.equal(actions.includes('begin_turn'), false);
  assert.equal(await candidate.locator('.sp-room-question [lang=en]').count(), 0);
  await candidate.evaluate(() => {window.__permitMicrophone();});
  await candidate.getByRole('timer', {name: 'Savol taqdimoti', exact: true}).waitFor();
  const prompt = await candidate.locator('.sp-room-question h2[lang=en]').textContent();
  assert.equal(await candidate.evaluate(() => window.__examinerPrompt), prompt);
  await candidate.screenshot({path: join(out, 'exam-room-mobile.png')});
  const presentation = Date.parse(firstTurn.payload.promptUntil) - Date.parse(firstTurn.payload.startedAt);
  await candidate.clock.fastForward(presentation + 200);
  await candidate.getByRole('timer', {name: 'Javob vaqti', exact: true}).waitFor();
  await candidate.waitForTimeout(1200);
  currentTime = new Date(firstTurn.payload.deadline);
  await candidate.clock.fastForward(31_000);
  await candidate.getByRole('button', {name: 'Audioni yuborish', exact: true}).waitFor();
  assert.equal(uploads, 1);
  assert.equal(await candidate.locator('.sp-recorder audio').count(), 0);
  await candidate.getByRole('button', {name: 'Audioni yuborish', exact: true}).click();
  await candidate.getByText('1 ta javob qayd etildi', {exact: true}).waitFor();
  assert.equal(uploads, 2);
  assert.equal(actions.filter(action => action === 'submit_answer').length, 1);
  assert.equal(await candidate.locator('.sp-room-question [lang=en]').count(), 0);
  checks.push({examRoom: true, microphoneGate: true, automaticStop: true, uploadRetry: true, violations: violations.length});
 } finally {
  await candidate.close();
 }
}

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
 await checkExamRoom();
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',checks:checks.length,runtimeErrors:errors.length}));
}finally{writeFileSync(join(out,'results.json'),JSON.stringify({checks,errors},null,2));await browser.close();}
