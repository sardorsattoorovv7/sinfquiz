const {chromium} = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), {pathToFileURL} = require('node:url');

(async () => {
 const root = path.resolve(__dirname, '..'), out = path.join(root, 'qa-7.23.1'), load = file => import(pathToFileURL(path.join(root, file)));
 fs.mkdirSync(out, {recursive: true});
 const {englishDb, ids} = await load('tests/english-fixture.js'), ctx = await englishDb(), {db, rpc, raw} = ctx;
 const {createServer} = await load('node_modules/vite/dist/node/index.js');
 const server = await createServer({root, server: {host: '127.0.0.1', port: 4184, hmr: false}}); await server.listen();
 const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_EXECUTABLE, args: ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']});
 const context = await browser.newContext({viewport: {width: 1440, height: 1000}, permissions: ['microphone']});
 let queue = Promise.resolve(), failUpload = 0, blockSaves = false, lostSave = false, slowSave = null;
 const errors = [], calls = [], files = new Map(), checks = [], accessibility = [];
 const serial = (uid, fn) => { const task = queue.then(async () => { await ctx.login(uid); return fn() }); queue = task.catch(() => {}); return task; };
 const make = async (uid, role) => {
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  await page.addInitScript(() => { window.__SINFQUIZ_LEGACY_TEST__ = true; localStorage.setItem('sq_theme', 'light'); });
  await page.route(/\/(auth|api)\//, async route => {
   const request = route.request(), url = new URL(request.url()), pathname = url.pathname; let data = {}, status = 200;
   const binary = pathname.startsWith('/api/english-audio/upload/'), p = request.method() === 'POST' && !binary ? request.postDataJSON() : {};
   calls.push({pathname, uid, p});
   try {
    if (pathname === '/auth/session') data = {user: {id: uid, role, name: role === 'teacher' ? 'Ustoz' : 'Lola'}, csrf: 'fixture'};
    else if (pathname === '/api/catalog') data = {quizzes: [], lessons: []};
    else if (pathname === '/api/quizzes') data = {quizzes: [], publicQuizzes: [], lessons: [], players: [], results: [], typing: {texts: [], results: [], active: false}, race: {active: false}};
    else if (binary) {
     if (failUpload) { failUpload--; throw Error('Tarmoq uzildi. Yozuvni qayta yuboring.'); }
     const work = pathname.split('/').at(-1), body = request.postDataBuffer(), type = request.headers()['content-type'];
     assert.ok(body.length && body.length <= 12582912); assert.ok(['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'video/webm'].includes(type));
     const name = `${uid}/${work}/${crypto.randomUUID()}.webm`;
     // The same private storage.objects RLS policy as Supabase is enforced by PostgreSQL.
     await serial(uid, () => db.query('insert into storage.objects(bucket_id,name) values($1,$2)', ['english-recordings', name]));
     files.set(name, {body, type}); data = {mode: 'recording', path: name, bytes: body.length, type};
    } else if (pathname === '/api/english-audio/url') {
     const visible = await serial(uid, () => db.query('select name from storage.objects where bucket_id=$1 and name=$2', ['english-recordings', p.path]));
     if (!visible.rows.length) { status = 403; throw Error('Yozuvga ruxsat yo‘q.'); }
     data = {url: '/api/english-audio/play/' + encodeURIComponent(p.path)};
    } else if (pathname.startsWith('/api/english-audio/play/')) {
     const name = decodeURIComponent(pathname.slice('/api/english-audio/play/'.length));
     const visible = await serial(uid, () => db.query('select name from storage.objects where bucket_id=$1 and name=$2', ['english-recordings', name]));
     if (!visible.rows.length || !files.has(name)) { status = 403; throw Error('Yozuvga ruxsat yo‘q.'); }
     const file = files.get(name); await route.fulfill({status: 200, body: file.body, contentType: file.type}); return;
    } else if (pathname.startsWith('/api/english/')) {
     const action = pathname.split('/').at(-1);
     if (blockSaves && action === 'save') { await route.abort('internetdisconnected'); return; }
     data = await serial(uid, () => rpc(action, p));
     if (action === 'save' && lostSave) { lostSave = false; await route.abort('connectionreset'); return; }
     if (action === 'save' && slowSave) { const delay = slowSave; slowSave = null; delay.started(); await delay.wait; }
    }
   } catch (e) { data = {error: e.message, code: e.code}; if (status === 200) status = 400; }
   await route.fulfill({status, json: data});
  });
  return page;
 };
 const step = (page, name) => page.locator('.en-steps').getByRole('button', {name, exact: true}).click();
 const run = async id => (await serial(ids.student, () => rpc('run', {id}))).run;
 const waitCloud = page => page.locator('.en-sync').filter({hasText: /^Hisobga saqlandi/}).waitFor();
 const record = async page => {
  await page.getByRole('button', {name: 'Ovoz yozish', exact: true}).click();
  await page.getByRole('button', {name: /To‘xtatish ·/}).waitFor();
  assert.equal(await page.getByRole('button', {name: 'Darsni saqlab chiqish', exact: true}).isDisabled(), true);
  await page.waitForTimeout(650); await page.getByRole('button', {name: /To‘xtatish ·/}).click();
  await page.getByRole('button', {name: 'Yozuvni yuborish', exact: true}).waitFor({state: 'visible'});
  await page.waitForFunction(() => !Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Yozuvni yuborish')?.disabled);
 };
 const shot = async (page, name) => { await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'})); await page.screenshot({path: path.join(out, name + '.png'), fullPage: true}); };
 const axe = async (page, name) => {
  await page.addScriptTag({path: path.join(root, 'node_modules/axe-core/axe.min.js')});
  const violations = await page.evaluate(async () => (await axe.run('.en-course', {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']}})).violations.map(v => ({id: v.id, nodes: v.nodes.map(n => ({target: n.target, summary: n.failureSummary}))})));
  accessibility.push({name, violations}); assert.deepEqual(violations, [], name);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name + ' fits viewport');
  if (await page.locator('.en-lesson-footer').count()) assert.equal(await page.locator('.en-lesson-footer').evaluate(el => getComputedStyle(el).position), 'static', 'navigation must not cover lesson content');
 };
 let page;
 try {
  await serial(ids.teacher, () => rpc('override', {studentId: ids.student, level: 0, threshold: 80, reason: 'Boshlang‘ich suhbat asosida tayyorlov darajasi berildi.'}));
  const work = (await serial(ids.student, () => rpc('begin', {baseId: 'en-pre-01'}))).run;
  const p = await make(ids.student, 'student'); page = p;
  await p.goto('http://127.0.0.1:4184/#ingliz-darsi/lesson/en-pre-01'); await step(p, 'Gapirish');
  await record(p); assert.equal(files.size, 0, 'microphone never uploads automatically');
  assert.ok((await p.getByLabel('Lokal ovoz yozuvi').getAttribute('src')).startsWith('blob:'));
  failUpload = 1; await p.getByRole('button', {name: 'Yozuvni yuborish', exact: true}).click();
  await p.getByRole('alert').filter({hasText: 'Tarmoq uzildi'}).waitFor(); assert.equal(files.size, 0); assert.equal(await p.getByLabel('Lokal ovoz yozuvi').count(), 1);
  await p.getByRole('button', {name: 'Yozuvni yuborish', exact: true}).click(); await waitCloud(p);
  let current = await run(work.id); assert.equal(current.state.speaking.mode, 'recording'); const uploadedPath = current.state.speaking.path;
  assert.ok(uploadedPath.startsWith(ids.student + '/' + work.id + '/')); assert.ok(files.get(uploadedPath).body.length > 0);
  await p.getByRole('button', {name: 'Topshirilgan yozuvni eshitish', exact: true}).click();
  await p.getByLabel('Hisobdagi ovoz yozuvi').evaluate(audio => audio.play()); await p.waitForFunction(() => !document.querySelector('audio[aria-label="Hisobdagi ovoz yozuvi"]').paused);
  await p.getByLabel('Hisobdagi ovoz yozuvi').evaluate(audio => audio.pause());
  // Simulate a failed IndexedDB metadata update after a successful private upload.
  await p.evaluate(async key => { const {clip} = await import('/src/english-course/service.js'); const saved = await clip(key); await clip(key, {blob: saved.blob}); }, `${ids.student}:${work.id}`);
  await p.reload(); await p.getByRole('button', {name: 'Topshirilgan yozuvni eshitish', exact: true}).waitFor();
  await p.getByLabel('Lokal ovoz yozuvi').waitFor(); assert.equal((await run(work.id)).state.speaking.mode, 'recording');
  await record(p); await p.getByText('Yangi yozuv hali yuborilmagan.', {exact: false}).waitFor(); await waitCloud(p);
  assert.deepEqual((await run(work.id)).state.speaking, {mode: 'draft'}, 'new clip invalidates previous evidence');
  await p.reload(); await p.getByLabel('Lokal ovoz yozuvi').waitFor(); assert.equal(await p.getByRole('button', {name: 'Topshirilgan yozuvni eshitish', exact: true}).count(), 0);
  await p.getByRole('button', {name: 'Yozuvni yuborish', exact: true}).click(); await waitCloud(p); assert.equal(files.size, 2);
  await axe(p, 'speaking desktop'); await shot(p, 'speaking-desktop');
  await p.setViewportSize({width: 390, height: 844}); await axe(p, 'speaking mobile'); await shot(p, 'speaking-mobile');
  await p.evaluate(() => document.documentElement.dataset.theme = 'dark'); await axe(p, 'speaking dark'); await shot(p, 'speaking-dark');
  await p.setViewportSize({width: 1920, height: 1080}); await axe(p, 'speaking board'); await shot(p, 'speaking-board');
  await p.evaluate(() => document.documentElement.dataset.theme = 'light'); await p.setViewportSize({width: 1440, height: 1000});
  checks.push('native recording; explicit private upload; failure/retry; persisted clip; remote playback; replacement evidence'); console.log('PASS native audio, private upload/retry, replacement and accessible layouts');

  await step(p, 'Yozish'); blockSaves = true;
  await p.getByLabel('Matningiz', {exact: true}).fill('An original offline draft stays in this browser.');
  await p.locator('.en-sync').filter({hasText: 'Hisobga yuborish kutilmoqda.'}).waitFor();
  const local = await p.evaluate(key => JSON.parse(localStorage.getItem(key)), 'sq_en_draft:' + ids.student + ':' + work.id); assert.equal(local.dirty, true);
  blockSaves = false; await p.reload(); await p.getByLabel('Matningiz', {exact: true}).waitFor();
  assert.equal(await p.getByLabel('Matningiz', {exact: true}).inputValue(), 'An original offline draft stays in this browser.'); await waitCloud(p);
  assert.equal((await run(work.id)).state.writing, 'An original offline draft stays in this browser.');

  let released, started; const wait = new Promise(resolve => { released = resolve }), seen = new Promise(resolve => { started = resolve }); slowSave = {wait, started};
  await p.getByLabel('Matningiz', {exact: true}).fill('First draft during a slow connection.'); await seen;
  await p.getByLabel('Matningiz', {exact: true}).fill('Newest draft typed while the first save is still running.');
  await p.getByRole('button', {name: 'Darsni saqlab chiqish', exact: true}).click(); released();
  await p.getByRole('heading', {name: /Noldan C1/}).waitFor(); assert.equal((await run(work.id)).state.writing, 'Newest draft typed while the first save is still running.');
  await p.getByRole('button', {name: 'Bugungi darsni boshlash', exact: true}).click(); await p.getByLabel('Matningiz', {exact: true}).waitFor();

  lostSave = true; await p.getByLabel('Matningiz', {exact: true}).fill('The server saved this draft but its response was lost.');
  await p.locator('.en-sync').filter({hasText: 'Hisobga yuborish kutilmoqda.'}).waitFor();
  const committed = await run(work.id), failedRequest = calls.filter(c => c.pathname === '/api/english/save').at(-1).p;
  await p.reload(); await p.getByLabel('Matningiz', {exact: true}).waitFor(); await waitCloud(p);
  const retried = calls.filter(c => c.pathname === '/api/english/save').at(-1).p;
  assert.equal(failedRequest.token, retried.token); assert.equal((await run(work.id)).state.draftVersion, committed.state.draftVersion);
  checks.push('disconnected RPC draft recovery; edits during in-flight save; exact-token retry after committed response loss'); console.log('PASS disconnected draft, slow save and committed-response retry');

  current = await run(work.id); await serial(ids.student, () => rpc('save', {id: work.id, writing: 'New copy from another device.', expectedDraftVersion: current.state.draftVersion}));
  await p.getByLabel('Matningiz', {exact: true}).fill('I choose to keep my own new local copy.');
  await p.getByRole('button', {name: 'Qoralamamni hisobga yozish', exact: true}).waitFor();
  assert.equal(await p.getByLabel('Matningiz', {exact: true}).inputValue(), 'I choose to keep my own new local copy.');
  await p.getByRole('button', {name: 'Qoralamamni hisobga yozish', exact: true}).click(); await waitCloud(p);
  assert.equal((await run(work.id)).state.writing, 'I choose to keep my own new local copy.');
  current = await run(work.id); await serial(ids.student, () => rpc('save', {id: work.id, writing: 'Remote version I choose to open.', expectedDraftVersion: current.state.draftVersion}));
  await p.getByLabel('Matningiz', {exact: true}).fill('My old copy is retained as a recovery draft.');
  await p.getByRole('button', {name: 'Hisobdagi nusxani ochish', exact: true}).click();
  await p.waitForFunction(() => document.querySelector('textarea[aria-label="Matningiz"]').value === 'Remote version I choose to open.');
  assert.match(await p.evaluate(key => localStorage.getItem(key + ':recovery'), 'sq_en_draft:' + ids.student + ':' + work.id), /recovery draft/);
  await p.evaluate(() => { const original = Storage.prototype.setItem; window.restoreStorage = () => Storage.prototype.setItem = original; Storage.prototype.setItem = function(key, value) { if (key.startsWith('sq_en_draft:')) throw new DOMException('Quota', 'QuotaExceededError'); return original.call(this, key, value); }; });
  await p.getByLabel('Matningiz', {exact: true}).fill('The account still saves when browser storage is full.'); await waitCloud(p);
  assert.equal((await run(work.id)).state.writing, 'The account still saves when browser storage is full.'); await p.evaluate(() => window.restoreStorage());
  checks.push('parallel-device conflict choices; recovery copy; localStorage failure does not report server failure'); console.log('PASS explicit conflict resolution and full localStorage');

  const source = await serial(ids.student, () => raw('en-pre-01'));
  await serial(ids.student, async () => {
   await rpc('save', {id: work.id, completed: ['learn', 'vocabulary', 'listening'], writing: source.writing.model});
   for (const q of [...source.exercises, ...source.reading.questions, ...source.listening.questions]) await rpc('attempt', {id: work.id, questionId: q.id, answer: ['matching', 'table', 'collocation'].includes(q.type) ? q.answers : q.answers[0], heard: !!q.audio});
   await rpc('exit', {id: work.id, answers: Object.fromEntries(source.exit[0].map(q => [q.id, q.answers[0]]))}); await rpc('submit', {id: work.id});
  });
  await p.evaluate(async ({uid, id}) => { const {clip} = await import('/src/english-course/service.js'); await clip(`${uid}:${id}`, {blob: new Blob(['wrong unsent recording'], {type: 'audio/webm'})}); localStorage.setItem(`sq_en_draft:${uid}:${id}`, JSON.stringify({format: 2, dirty: true, version: 0, draft: {writing: 'Wrong unsent local text'}})); }, {uid: ids.student, id: work.id});
  await p.reload(); await p.getByLabel('Matningiz', {exact: true}).waitFor(); assert.equal(await p.getByLabel('Matningiz', {exact: true}).inputValue(), source.writing.model);
  assert.equal(await p.getByLabel('Matningiz', {exact: true}).getAttribute('readonly'), ''); await step(p, 'Gapirish');
  assert.equal(await p.getByLabel('Lokal ovoz yozuvi').count(), 0); await p.getByRole('button', {name: 'Topshirilgan yozuvni eshitish', exact: true}).waitFor();

  const t = await make(ids.teacher, 'teacher'); page = t; await t.goto('http://127.0.0.1:4184/#ingliz-darsi'); await t.getByRole('button', {name: 'Ustoz boshqaruvi', exact: true}).click();
  await t.locator('.en-review-item').first().click(); await t.getByRole('button', {name: 'Topshirilgan yozuvni eshitish', exact: true}).click();
  await t.getByLabel('Hisobdagi ovoz yozuvi').evaluate(audio => audio.play()); await t.waitForFunction(() => !document.querySelector('audio[aria-label="Hisobdagi ovoz yozuvi"]').paused);
  await t.getByLabel('Hisobdagi ovoz yozuvi').evaluate(audio => audio.pause()); await axe(t, 'teacher audio review'); await shot(t, 'teacher-audio-review');
  const other = await make(ids.other, 'teacher'); await other.goto('http://127.0.0.1:4184/#ingliz-darsi');
  const unauthorized = await other.evaluate(async path => { const r = await fetch('/api/english-audio/url', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({path})}); return r.status; }, (await run(work.id)).state.speaking.path); assert.equal(unauthorized, 403);
  for (let i = 0; i < 8; i++) await t.locator('.en-review fieldset select').nth(i).selectOption('4');
  await t.getByLabel('Feedback: yaxshi tomoni, tuzatish va keyingi amal', {exact: true}).fill('Ovoz yozuvi ochildi. Vazifa tushunarli, keyingi darsga tayyor.');
  await t.getByRole('button', {name: 'Rubrika bahosini saqlash', exact: true}).click(); await t.getByText('O‘zgarish saqlandi.', {exact: true}).waitFor();
  assert.ok((await serial(ids.student, () => rpc('home'))).lessons.find(l => l.id === 'en-pre-02').open);
  checks.push('submitted server text/audio chosen over local draft; class teacher native playback; unrelated teacher denied; human rubric opens next lesson'); console.log('PASS submitted snapshot and class-private teacher audio review');

  const late = await make(ids.student, 'student'); page = late; await late.goto('http://127.0.0.1:4184/#ingliz-darsi/lesson/en-pre-02'); await step(late, 'Gapirish');
  await late.evaluate(() => { const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); navigator.mediaDevices.getUserMedia = () => new Promise(resolve => { window.releaseMicrophone = () => original({audio: true}).then(stream => { window.lateTracks = stream.getTracks(); resolve(stream); }); }); });
  await late.getByRole('button', {name: 'Ovoz yozish', exact: true}).click(); await late.getByRole('button', {name: 'Yozishni bekor qilish', exact: true}).click();
  await late.getByRole('button', {name: 'Darsni saqlab chiqish', exact: true}).click(); await late.getByRole('heading', {name: /Noldan C1/}).waitFor();
  await late.evaluate(() => window.releaseMicrophone()); await late.waitForFunction(() => window.lateTracks?.every(track => track.readyState === 'ended'));
  checks.push('cancelled late microphone permission stops every track after navigation'); console.log('PASS cancelled late microphone request cleanup');
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(out, 'resilience-browser.json'), JSON.stringify({passed: true, browser: browser.version(), backend: 'local PGlite PostgreSQL + actual migration/RLS, storage transfer fixture', errors, checks, requests: calls.length}, null, 2));
  fs.writeFileSync(path.join(out, 'accessibility.json'), JSON.stringify(accessibility, null, 2));
 } catch (error) {
  if (page) { await shot(page, 'failure').catch(() => {}); fs.writeFileSync(path.join(out, 'failure.txt'), error.stack + '\n' + await page.locator('body').innerText().catch(() => '')); }
  throw error;
 } finally { await browser.close(); await server.close(); await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
