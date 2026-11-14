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

async function checkQuickEntry() {
 const visitor = await browser.newPage();
 let finishAuth;
 const pendingAuth = new Promise(resolve => {finishAuth = resolve;});
 let statusRequests = 0;
 await visitor.addInitScript(() => {window.__SINFQUIZ_LEGACY_TEST__ = true;});
 await visitor.route('**/auth/session', async route => {
  await pendingAuth;
  await route.fulfill({json: {user: null, csrf: 'qa'}}).catch(() => {});
 });
 await visitor.route('**/api/ai-speaking', async route => {statusRequests++; await route.fulfill({json: {sources: {}}});});
 try {
  await visitor.goto(origin + '/#ai-speaking', {waitUntil: 'commit'});
  await visitor.getByRole('heading', {name: 'Inglizcha gapirishni mashq qiling.', exact: true}).waitFor({timeout: 8000});
  assert.ok(await visitor.getByRole('button', {name: 'Hisob tekshirilmoqda…'}).isDisabled());
  assert.equal(statusRequests, 0);
  assert.ok(await visitor.getByLabel('Examiner ovozi').isVisible());
  assert.ok(await visitor.getByRole('radio', {name: /Emma/}).isVisible());
  finishAuth();
  await visitor.getByRole('button', {name: 'Speaking sinovini boshlash', exact: true}).waitFor();
  checks.push({entryBeforeAuth: true, lazyFormatSources: true});
 } finally {
  finishAuth();
  await visitor.close();
 }
}

async function checkExamRoom(written = false) {
 const repo = new MemoryRepo();
 let currentTime;
 const service = new SpeakingService(repo, {env: testEnv, now: () => currentTime || new Date()});
 const actor = {id: uid, role: 'student', name: 'Sinov o‘quvchisi'};
 await service.run(actor, 'profile', {examMode: 'multilevel', profile: profile('multilevel')});
 const candidate = await browser.newPage({viewport: {width: 1440, height: 900}, permissions: ['microphone']});
 const actions = [];
 let activeTurn, sessionId, uploads = 0, writtenSubmissions = 0, lostAudioReceipt = false;
 candidate.on('pageerror', error => errors.push(error.message));
 await candidate.addInitScript(() => {
  window.__SINFQUIZ_LEGACY_TEST__ = true;
  window.__interviewerLines = [];
  window.__interviewerVoices = [];
  window.__microphoneRequests = 0;
  window.__recordingStarts = 0;
  localStorage.setItem('sq_theme', 'light');
  const microphone = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async constraints => {
   window.__microphoneRequests++;
   await new Promise(resolve => {window.__permitMicrophone = resolve;});
   return microphone(constraints);
  };
  window.SpeechSynthesisUtterance = class {constructor(text) {this.text = text;}};
  speechSynthesis.getVoices = () => [
   {name: 'Test Daniel', voiceURI: 'fixture-daniel', lang: 'en-GB', localService: true},
   {name: 'Test Emma', voiceURI: 'fixture-emma', lang: 'en-GB', localService: true},
   {name: 'Test Zira', voiceURI: 'fixture-zira', lang: 'en-US', localService: true},
  ];
  speechSynthesis.speak = utterance => {
   window.__interviewerLines.push(utterance.text);
   window.__interviewerVoices.push(utterance.voice?.voiceURI);
   window.__examinerSpeaking = true;
   window.__wordExaminer = () => utterance.onboundary?.({name: 'word', charIndex: 0});
   window.__endExaminer = (fail = false) => {
    window.__examinerSpeaking = false;
    if (fail) utterance.onerror?.();
    else utterance.onend?.();
   };
   queueMicrotask(() => utterance.onstart?.());
  };
  speechSynthesis.cancel = () => {window.__examinerSpeaking = false;};
  const start = MediaRecorder.prototype.start;
  MediaRecorder.prototype.start = function (...args) {
   if (window.__examinerSpeaking) throw Error('Examiner voice was captured with the answer');
   window.__recordingStarts++;
   window.__audioBitrate = this.audioBitsPerSecond;
   return start.apply(this, args);
  };
 });
 await candidate.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
 await candidate.route('**/storage/v1/object/upload/sign/**', async route => {
  const headers = {'access-control-allow-origin': origin, 'access-control-allow-methods': 'PUT, OPTIONS', 'access-control-allow-headers': '*'};
  if (route.request().method() === 'OPTIONS') return route.fulfill({status: 204, headers});
  assert.ok(route.request().postDataBuffer()?.length > 100);
  uploads++;
  await route.fulfill(uploads <= 2 ? {status: 503, headers, json: {message: 'QA network interruption'}} : {headers, json: {Key: 'qa-audio'}});
 });
 await candidate.route(/\/(auth|api)\//, async route => {
  const request = route.request(), path = new URL(request.url()).pathname;
  if (path === '/auth/session') return route.fulfill({json: {user: actor, csrf: 'qa'}});
  if (path !== '/api/ai-speaking') return route.fulfill({json: {lessons: [], quizzes: []}});
  if (request.method() === 'GET') return route.fulfill({json: {providerConfigured: true, sources: []}});
  const {action, data} = request.postDataJSON();
  actions.push(action);
  if (written && action === 'submit_answer' && ++writtenSubmissions === 1) return route.abort('failed');
  try {
   const result = await service.run(actor, action, data);
   if (!written && action === 'submit_answer' && !lostAudioReceipt) {
    lostAudioReceipt = true;
    return route.abort('failed');
   }
   if (action === 'start_mock') sessionId = result.session.id;
   if (['begin_turn', 'finish_prompt'].includes(action)) activeTurn = result.turn;
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
  if (written) {
   await candidate.getByRole('button', {name: 'Yozma javob', exact: true}).click();
   assert.equal(await candidate.getByRole('button', {name: '10 soniyalik sinov'}).count(), 0);
  }
  await candidate.getByRole('radio', {name: /Emma/}).check();
  assert.match(await candidate.locator('.sp-examiner-voices option').first().textContent(), /Test Emma/);
  await candidate.getByLabel('Examiner ovozi').selectOption('fixture-zira');
  await candidate.getByRole('button', {name: 'Ovozni sinash', exact: true}).click();
  await candidate.waitForFunction(() => window.__interviewerVoices.at(-1) === 'fixture-zira');
  assert.match(await candidate.evaluate(() => window.__interviewerLines.at(-1)), /I’m Emma/);
  await candidate.getByRole('button', {name: 'Ovozni to‘xtatish', exact: true}).click();
  assert.deepEqual(await candidate.evaluate(() => JSON.parse(localStorage.getItem('sq_speaking_interviewer'))), {interviewerId: 'emma', voiceId: 'fixture-zira'});
  await candidate.locator('.sp-consent input').check();
  await candidate.getByRole('button', {name: 'Boshlang‘ich sinovni boshlash', exact: true}).click();
  await candidate.getByRole('heading', {name: 'Speaking imtihon xonasi'}).waitFor();
  assert.equal(await candidate.getByLabel('Examiner ovozi').inputValue(), 'fixture-zira');
  assert.equal(await candidate.locator('.sp-interviewer-name strong').textContent(), 'Emma');
  assert.equal(await candidate.locator('.sp-examiner-eyes').evaluate(el => getComputedStyle(el).animationName), 'sp-examiner-blink');
  await candidate.emulateMedia({reducedMotion: 'reduce'});
  assert.equal(await candidate.locator('.sp-examiner-eyes').evaluate(el => getComputedStyle(el).animationName), 'none');
  await candidate.emulateMedia({reducedMotion: 'no-preference'});
  if (!written) await candidate.screenshot({path: join(out, 'exam-room-desktop.png')});
  await candidate.setViewportSize({width: 390, height: 844});
  await candidate.evaluate(() => {document.documentElement.dataset.theme = 'dark';});
  assert.ok(await candidate.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await candidate.addScriptTag({path: join(root, 'node_modules/axe-core/axe.min.js')});
  const violations = await candidate.evaluate(async () => (await axe.run('.sp-exam-room', {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']}})).violations.map(v => ({id:v.id,nodes:v.nodes.map(n=>n.target)})));
  assert.deepEqual(violations, []);

  await candidate.clock.install();
  await candidate.getByRole('button', {name: 'Ovozni sinash', exact: true}).click();
  await candidate.getByText('Emma gapiryapti', {exact: true}).waitFor();
  assert.match(await candidate.evaluate(() => window.__interviewerLines.at(-1)), /I’m Emma/);
  await candidate.getByRole('button', {name: 'Ovozni to‘xtatish', exact: true}).click();
  assert.equal(await candidate.evaluate(() => window.__examinerSpeaking), false);
  await candidate.evaluate(() => {window.__interviewerLines = [];});
  await candidate.getByRole('button', {name: 'Suhbatni boshlash', exact: true}).click();
  if (!written) {
   await candidate.waitForFunction(() => typeof window.__permitMicrophone === 'function');
   assert.equal(actions.includes('begin_turn'), false);
   assert.equal(await candidate.locator('.sp-room-question h2[lang=en]').count(), 0);
   await candidate.evaluate(() => {window.__permitMicrophone();});
  }
  await candidate.getByText('Emma gapiryapti', {exact: true}).waitFor();
  const prompt = await candidate.locator('.sp-room-question h2[lang=en]').textContent();
  assert.match(await candidate.evaluate(() => window.__interviewerLines[0]), /I'm Emma/);
  assert.equal(await candidate.evaluate(() => window.__interviewerVoices.at(-1)), 'fixture-zira');
  await candidate.evaluate(() => window.__wordExaminer());
  await candidate.locator('.sp-interviewer[data-mood="speaking"][data-mouth="wide"]').waitFor();
  assert.equal(await candidate.evaluate(() => window.__recordingStarts), 0);
  assert.equal(actions.includes('finish_prompt'), false);
  assert.equal(await candidate.getByRole('timer', {name: 'Javob vaqti', exact: true}).count(), 0);
  if (written) {
   assert.equal(await candidate.getByRole('textbox', {name: 'Yozma javobingiz'}).count(), 0);
   assert.equal(await candidate.evaluate(() => window.__microphoneRequests), 0);
  } else await candidate.screenshot({path: join(out, 'exam-room-mobile.png')});
  await candidate.evaluate(() => window.__endExaminer());
  assert.equal(await candidate.evaluate(() => window.__interviewerLines[1]), prompt);
  assert.equal(await candidate.evaluate(() => window.__recordingStarts), 0);
  assert.equal(actions.includes('finish_prompt'), false);
  currentTime = new Date(Date.parse(activeTurn.payload.startedAt) + 3000);
  await candidate.clock.fastForward(3000);
  await candidate.evaluate(() => window.__endExaminer());
  await candidate.getByRole('timer', {name: 'Javob vaqti', exact: true}).waitFor();
  assert.equal(activeTurn.payload.examinerPending, false);
  assert.equal(Date.parse(activeTurn.payload.deadline) - Date.parse(activeTurn.payload.prepUntil), 30_000);
  if (written) {
   const text = 'I enjoy reading because it helps me discover new ideas.';
   const deadline = activeTurn.payload.deadline;
   const input = candidate.getByRole('textbox', {name: 'Yozma javobingiz'});
   await input.fill(text);
   await candidate.getByText('Emma yozma javobingizni kutyapti', {exact: true}).waitFor();
   await candidate.screenshot({path: join(out, 'written-answer-mobile.png')});
   await candidate.getByRole('button', {name: 'Saqlab chiqish', exact: true}).click();
   await candidate.getByRole('button', {name: 'Sinovni davom ettirish', exact: false}).click();
   await input.waitFor();
   assert.equal(await input.inputValue(), text);
   assert.equal((await service.run(actor, 'session', {id: sessionId})).turn.payload.deadline, deadline);
   currentTime = new Date(deadline);
   await candidate.clock.fastForward(31_000);
   const retry = candidate.getByRole('button', {name: 'Matnni qayta yuborish', exact: true});
   await retry.waitFor();
   assert.equal(writtenSubmissions, 1);
   assert.equal(await input.inputValue(), text);
   assert.equal(await input.getAttribute('readonly'), '');
   await retry.click();
   await candidate.getByText('1 ta javob qayd etildi', {exact: true}).waitFor();
   await candidate.getByText('Emma gapiryapti', {exact: true}).waitFor();
   const snapshot = await service.run(actor, 'session', {id: sessionId});
   assert.equal(snapshot.answers[0].payload.text, text);
   assert.equal(snapshot.answers[0].payload.sourceKind, 'typed');
   assert.equal(await candidate.evaluate(() => window.__microphoneRequests), 0);
   assert.equal(uploads, 0);
   checks.push({writtenAnswer: true, timed: true, recoveredDraft: true, retriedText: true, automaticNext: true, microphoneRequests: 0, violations: violations.length});
   return;
  }
  await candidate.getByText('Emma tinglayapti', {exact: true}).waitFor();
  assert.equal(await candidate.locator('.sp-examiner-head').evaluate(el => getComputedStyle(el).animationName), 'sp-examiner-nod');
  await candidate.getByLabel('Examiner ovozi').selectOption('fixture-emma');
  await candidate.getByText('Tanlangan ovoz keyingi savoldan ishlaydi.', {exact: true}).waitFor();
  await candidate.waitForTimeout(1200);
  assert.ok(await candidate.evaluate(() => window.__audioBitrate > 0 && window.__audioBitrate <= 64_000));
  currentTime = new Date(activeTurn.payload.deadline);
  await candidate.clock.fastForward(31_000);
  const retryAudio = candidate.getByRole('button', {name: 'Audioni qayta yuborish', exact: true});
  await retryAudio.waitFor();
  assert.equal(uploads, 2);
  assert.equal(await candidate.locator('.sp-recorder audio').count(), 0);
  await retryAudio.click();
  await candidate.getByText('Speaking serveri bilan aloqa uzildi.', {exact: false}).waitFor();
  assert.equal(uploads, 3);
  await retryAudio.click();
  await candidate.getByText('1 ta javob qayd etildi', {exact: true}).waitFor();
  assert.equal(uploads, 3);
  assert.equal(actions.filter(action => action === 'prepare_audio').length, 2);
  assert.equal(actions.filter(action => action === 'submit_answer').length, 2);
  assert.equal(actions.filter(action => action === 'stop_turn').length, 0);
  await candidate.waitForFunction(() => window.__microphoneRequests === 2);
  assert.equal(await candidate.locator('.sp-room-question h2[lang=en]').count(), 0);
  await candidate.evaluate(() => window.__permitMicrophone());
  await candidate.getByText('Emma gapiryapti', {exact: true}).waitFor();
  assert.equal(await candidate.evaluate(() => window.__interviewerLines.at(-1)), 'All right.');
  assert.equal(await candidate.evaluate(() => window.__interviewerVoices.at(-1)), 'fixture-emma');
  await candidate.evaluate(() => window.__endExaminer(true));
  await candidate.getByText('Inglizcha ovoz ochilmadi.', {exact: false}).waitFor();
  await candidate.getByRole('timer', {name: 'Javob vaqti', exact: true}).waitFor();
  checks.push({examRoom: true, examinerPreference: true, liveVoiceChange: true, animatedSpeech: true, microphoneGate: true, actualVoiceEnd: true, automaticNext: true, voiceFallback: true, automaticStop: true, uploadRetry: true, noRepeatedUpload: true, violations: violations.length});
 } finally {
  await candidate.close();
 }
}

try{
 await checkQuickEntry();
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
  await checkExamRoom(true);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',checks:checks.length,runtimeErrors:errors.length}));
}finally{writeFileSync(join(out,'results.json'),JSON.stringify({checks,errors},null,2));await browser.close();}
