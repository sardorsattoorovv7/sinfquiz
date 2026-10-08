// Real Chromium -> React -> local Postgres RPCs; no live accounts or data are changed.
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..'),load=file=>import(pathToFileURL(path.join(root,file))),out=path.resolve(root,process.env.COMPETITION_QA_DIR||'qa-7.24/browser');
 fs.mkdirSync(out,{recursive:true});
 const {PGlite}=await load('node_modules/@electric-sql/pglite/dist/index.js'),{createServer}=await load('node_modules/vite/dist/node/index.js'),{audioMazeLevels,mazePath}=await load('src/audio-maze-content.js');
 const db=new PGlite(),teacher='72200000-0000-0000-0000-000000000001',a='72200000-0000-0000-0000-000000000002',b='72200000-0000-0000-0000-000000000003';
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create table public.documents(collection text,id text,data jsonb,primary key(collection,id));create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;create function public.sq_is_admin() returns boolean language sql stable as $$select false$$;create function public.sq_is_teacher() returns boolean language sql stable security definer as $$select (data->>'role') in ('teacher','admin') from public.documents where collection='profiles' and id=auth.uid()::text$$;");
 for(const id of [teacher,a,b])await db.query('insert into auth.users values($1)',[id]);
 for(const [id,role,name] of [[teacher,'teacher','Ustoz'],[a,'student','Ali'],[b,'student','Lola']])await db.query('insert into public.documents values($1,$2,$3)',['profiles',id,JSON.stringify({role,name})]);
 await db.exec(fs.readFileSync(path.join(root,'supabase-migration-7.22.sql'),'utf8'));await db.exec(fs.readFileSync(path.join(root,'supabase-migration-7.24.sql'),'utf8'));
 const quiz={ownerId:teacher,ownerName:'Ustoz',title:'Olti kodli boshlang‘ich quiz',pin:'654321',subject:'Excel',visibility:'private',questions:[{type:'test',text:'Excel formulasini nima bilan boshlaymiz?',options:['=','+','A','#'],correct:0,points:100,explanation:'Formula tenglik belgisi bilan boshlanadi.'}]};
 await db.query('insert into public.documents values($1,$2,$3)',['quizzes','quiz-6',JSON.stringify(quiz)]);
 await db.query('insert into public.documents values($1,$2,$3)',['quizzes','excel-lab',JSON.stringify({...quiz,title:'Excel o‘rtacha amaliyoti',pin:'654322',questions:[{type:'office',text:'B5 katakka o‘rtacha qiymat formulasini yozing.',officeTemplate:'excel-average-first',points:100}]})]);
 let queue=Promise.resolve(),serial=0;const errors=[],accessibility=[],actions=[];
 const rpc=(uid,method,args=[])=>{const job=queue.then(async()=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[uid]);await db.exec('set role authenticated');try{return (await db.query('select public.'+method+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') value',args.map(x=>typeof x==='object'&&x!==null?JSON.stringify(x):x))).rows[0].value}finally{await db.exec('reset role')}});queue=job.catch(()=>{});return job};
 const server=await createServer({root,server:{host:'127.0.0.1',port:4182,hmr:false}});await server.listen();
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const makePage=async(uid,role,name)=>{
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_theme','light');window.__speechCalls=0;window.speechSynthesis.speak=()=>window.__speechCalls++});
  await page.route(/\/(auth|api)\//,async route=>{
   const p=new URL(route.request().url()).pathname,body=route.request().method()==='POST'?route.request().postDataJSON():{};let result={},status=200;
   try{
    if(p==='/auth/session')result={user:{id:uid,role,name},csrf:'fixture'};
    else if(p==='/api/catalog')result={quizzes:[],lessons:[]};
    else if(p==='/api/quizzes')result={quizzes:[{...quiz,id:'quiz-6'}],publicQuizzes:[],lessons:[],players:[],results:[],typing:{texts:[],results:[],active:false},race:{active:false}};
    else if(p.startsWith('/api/competitions/')){
     const action=p.split('/').at(-1);actions.push({uid,action,...body});
     const fn={list:['sq_comp_list',[]],catalog:['sq_comp_catalog',[]],state:['sq_comp_state',[body.id]],poll:['sq_comp_poll',[body.id,body.revision??-1]],member:['sq_comp_member',[body.id,body.userId,body.included]],save:['sq_comp_save',[body.config?.id,body.config]],join:['sq_comp_join',[body.code,body.name]],control:['sq_comp_control',[body.id,body.action,body.stage||0]],answer:['sq_comp_answer',[body.id,body.stageId,body.actionId,body.body]],leave:['sq_comp_leave',[body.id]]}[action];
     result=await rpc(uid,...fn);
    }
   }catch(e){result={error:e.message};status=400}
   await route.fulfill({status,json:result});
  });return page;
 };
 const pages=[];let current;
 const shot=async(page,name)=>{await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:path.join(out,name+'.png'),fullPage:true})};
 const noOverflow=async page=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page must fit viewport');
 const axe=async(page,label)=>{await page.addScriptTag({path:path.join(root,'node_modules/axe-core/axe.min.js')});const v=await page.evaluate(async()=>(await window.axe.run('.team-competitions',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));accessibility.push({label,violations:v});assert.deepEqual(v,[],label)};
 const refresh=async page=>{await page.locator('.comp-room-stats').getByRole('button',{name:'Yangilash',exact:true}).click();await page.waitForTimeout(100)};
 try{
  const t=await makePage(teacher,'teacher','Ustoz');pages.push(t);current=t;
  await t.goto('http://127.0.0.1:4182/#dashboard');await t.locator('.admin-shell').getByRole('button',{name:'Jamoaviy musobaqalar',exact:true}).click();await t.getByRole('heading',{name:'Jamoaviy musobaqalar',exact:true}).waitFor();
  await t.getByRole('button',{name:'Musobaqa yaratish',exact:true}).click();await t.getByLabel('Musobaqa nomi',{exact:true}).fill('Sinf bilim va mahorat bahsi');await t.getByLabel('Har bir jamoada',{exact:true}).fill('1');
  const attach=async search=>{await t.getByLabel('Material nomi yoki 6 raqamli quiz kodi').fill(search);const source=t.locator('.comp-source-list article').first();await source.getByRole('button',{name:'Biriktirish',exact:true}).click()};
  await attach('654321');await attach('A1 ·');await attach('Birinchi burilish');await attach('Excel o‘rtacha amaliyoti');
  console.log('PASS sources selected');assert.equal(await t.locator('.comp-stage-editor').count(),4);
  await t.getByRole('button',{name:'Quizni o‘zim tuzaman',exact:true}).click();const q=t.locator('.comp-question-editor');await q.getByLabel('Savol yoki vazifa').fill('<img src=x onerror=window.__xss=1> 2+2 nechaga teng?');
  for(const [i,text] of ['4','3','5','6'].entries())await q.getByLabel('1-savol '+String.fromCharCode(65+i)+' varianti',{exact:true}).fill(text);
  await q.getByLabel('Javobdan keyingi tushuntirish').fill('2 ga 2 qo‘shilsa 4 chiqadi.');
  await t.getByRole('button',{name:'Savol qo‘shish',exact:true}).click();const py=t.locator('.comp-question-editor').nth(1);await py.locator('select').first().selectOption('python');await py.getByLabel('Savol yoki vazifa').fill('Python bilan konsolga 12 sonini chiqaring.');await py.getByLabel('Kutilgan konsol natijasi').fill('12');
  await t.getByRole('button',{name:'Yopish',exact:true}).click();
  for(let i=0;i<5;i++){const row=t.locator('.comp-stage-editor').nth(i);await row.getByRole('button',{name:'Sozlash',exact:true}).click();await row.getByLabel('Vaqt (sekund)').fill('3600');await row.getByRole('button',{name:'Yopish',exact:true}).click()}
  await noOverflow(t);await axe(t,'builder desktop');await shot(t,'competition-builder-desktop');
  await t.setViewportSize({width:390,height:844});await noOverflow(t);await axe(t,'builder mobile');await shot(t,'competition-builder-mobile');await t.setViewportSize({width:1440,height:1000});
  await t.getByRole('button',{name:'Qoralamani saqlash',exact:true}).click();await t.getByRole('button',{name:'Qabulni faollashtirish',exact:true}).waitFor();console.log('PASS draft saved');const codes=[await t.locator('.comp-team-codes article').filter({has:t.getByText('Zukko',{exact:true})}).locator('code').innerText(),await t.locator('.comp-team-codes article').filter({has:t.getByText('Bilimdon',{exact:true})}).locator('code').innerText()];assert.equal(codes.length,2);
  await t.getByRole('button',{name:'Qabulni faollashtirish',exact:true}).click();await t.getByRole('button',{name:'Musobaqani boshlash',exact:true}).waitFor();assert.ok(await t.getByRole('button',{name:'Musobaqani boshlash',exact:true}).isDisabled());
  console.log('PASS lobby ready');const pa=await makePage(a,'student','Ali'),pb=await makePage(b,'student','Lola');pages.push(pa,pb);
  for(const [p,code] of [[pa,codes[0]],[pb,codes[1]]]){current=p;await p.goto('http://127.0.0.1:4182/#musobaqa');await p.getByLabel('Jamoa kodi',{exact:true}).fill(code);await p.getByRole('button',{name:'Jamoaga kirish',exact:true}).click();await p.getByRole('heading',{name:'Sinf bilim va mahorat bahsi',exact:true}).waitFor()}
  current=t;await refresh(t);assert.ok(await t.getByRole('button',{name:'Musobaqani boshlash',exact:true}).isEnabled());await t.getByRole('button',{name:'Musobaqani boshlash',exact:true}).click();
  for(const p of [pa,pb])await refresh(p);
  await pa.getByRole('radio',{name:/=/}).check();await pa.getByRole('button',{name:'Javobni yuborish',exact:true}).click();await pb.getByRole('radio',{name:/#/}).check();await pb.getByRole('button',{name:'Javobni yuborish',exact:true}).click();
  await pa.getByRole('heading',{name:'Bosqich yakunlandi',exact:true}).waitFor();assert.equal(await pa.getByRole('button',{name:'Tizimdan chiqish'}).count(),0);assert.equal(await pa.evaluate(()=>sessionStorage.getItem('sq_active_hash')),'#musobaqa');await pa.reload();await pa.getByRole('heading',{name:'Bosqich yakunlandi',exact:true}).waitFor();assert.equal(await pa.locator('.comp-personal-history article').count(),1);
  await refresh(t);assert.deepEqual(await t.locator('.comp-leaderboard').first().locator('tbody .comp-rank').allTextContents(),['1','2']);
  await t.getByRole('button',{name:'Keyingi bosqich',exact:true}).click();for(const p of [pa,pb])await refresh(p);
  console.log('PASS quiz ranked');const text=await pa.locator('.comp-typing-target').innerText();await pa.getByLabel('Musobaqa typing matni').fill(text);await pa.getByRole('button',{name:'Typingni yakunlash',exact:true}).click();await pb.getByLabel('Musobaqa typing matni').fill(text.slice(1));await pb.getByRole('button',{name:'Typingni yakunlash',exact:true}).click();await pb.getByRole('heading',{name:'Bosqich yakunlandi',exact:true}).waitFor();assert.ok(Number((await pb.locator('.comp-feedback').innerText()).match(/([\d.]+)% aniqlik/)[1])>95);await pa.getByRole('heading',{name:'Bosqich yakunlandi',exact:true}).waitFor();
  await refresh(t);await t.getByRole('button',{name:'Keyingi bosqich',exact:true}).click();await refresh(pa);await refresh(pb);
  current=pb;await pb.setViewportSize({width:390,height:844});await noOverflow(pb);await axe(pb,'maze mobile');await shot(pb,'competition-maze-mobile');await pb.setViewportSize({width:1440,height:1000});
  console.log('PASS typing finished');current=pa;const level=audioMazeLevels[0],route=mazePath(level.grid,level.start,level.exit);let prev=route[0];
  await pa.locator('.comp-maze-map').focus();
  for(const point of route.slice(1)){
   const dx=point[0]-prev[0],dy=point[1]-prev[1];await pa.locator('.comp-maze-map').focus();await pa.keyboard.press(dx===1?'ArrowRight':dx===-1?'ArrowLeft':dy===1?'ArrowDown':'ArrowUp');
   const gate=level.gateCells.findIndex(g=>g[0]===point[0]&&g[1]===point[1]);
   if(gate>=0){await pa.locator('.comp-door').waitFor();assert.equal(await pa.locator('.comp-english-sentence').innerText(),level.tasks[gate].audio);await pa.locator('.comp-door input[type=radio]').nth(level.tasks[gate].answer).check();await pa.getByRole('button',{name:'Eshikni ochish',exact:true}).click();await pa.locator('.comp-door').waitFor({state:'detached'})}
   prev=point;
  }
  await pa.getByRole('button',{name:'Labirintni yakunlash',exact:true}).click();await pa.getByRole('heading',{name:'Bosqich yakunlandi',exact:true}).waitFor();assert.equal(await pa.evaluate(()=>window.__speechCalls),0);
  console.log('PASS full maze');current=t;await refresh(t);assert.ok(await t.getByRole('button',{name:'Keyingi bosqich',exact:true}).isDisabled());await t.getByRole('button',{name:'Bosqichni hozir yopish',exact:true}).click();await t.getByRole('alertdialog').getByRole('button',{name:'Tasdiqlash',exact:true}).click();for(const p of [pa,pb])await refresh(p);
  current=pa;await pa.getByLabel('Katak B5',{exact:true}).fill('=AVERAGE(B2:B4)');await pa.getByRole('button',{name:'Javobni yuborish',exact:true}).click();await pa.getByRole('heading',{name:'Bosqich yakunlandi',exact:true}).waitFor();assert.match(await pa.locator('.comp-feedback').innerText(),/Bajarildi/);
  await pb.getByLabel('Katak B5',{exact:true}).fill('=SUM(B2:B4)');await pb.getByRole('button',{name:'Javobni yuborish',exact:true}).click();await pb.getByRole('heading',{name:'Bosqich yakunlandi',exact:true}).waitFor();
  current=t;await refresh(t);await t.getByRole('button',{name:'Keyingi bosqich',exact:true}).click();for(const p of [pa,pb])await refresh(p);
  for(const [p,n] of [[pa,0],[pb,1]]){await p.locator('.comp-answer-options input').nth(n).check();assert.equal(await p.evaluate(()=>window.__xss),undefined);assert.equal(await p.locator('.comp-challenge img').count(),0);await p.getByRole('button',{name:'Javobni yuborish',exact:true}).click();await p.getByLabel('Python kodi',{exact:true}).waitFor();assert.ok(await p.getByRole('button',{name:'Javobni yuborish',exact:true}).isDisabled());await p.getByLabel('Python kodi',{exact:true}).fill(n===0?'print(12)':'print(11)');await p.getByRole('button',{name:'Kodni ishga tushirish',exact:true}).click();await p.waitForFunction(o=>document.querySelector('.py-output pre')?.textContent.trim()===o,String(n===0?12:11),{timeout:25000});assert.ok(await p.getByRole('button',{name:'Javobni yuborish',exact:true}).isEnabled());await p.getByRole('button',{name:'Javobni yuborish',exact:true}).click();await p.getByRole('heading',{name:'Bosqich yakunlandi',exact:true}).waitFor()}
  await refresh(t);await t.getByRole('button',{name:'Musobaqani yakunlash',exact:true}).click();for(const p of [pa,pb])await refresh(p);
  assert.equal(await pa.locator('.comp-personal-history article').count(),5);const ranks=await t.locator('.comp-leaderboard').first().locator('tbody tr').allTextContents();assert.match(ranks[0],/Zukko/);assert.match(ranks[1],/Bilimdon/);assert.match(ranks[0],/500/);assert.equal(await pa.evaluate(()=>sessionStorage.getItem('sq_active_hash')),null);
  await axe(t,'results desktop');await shot(t,'competition-results-desktop');await t.setViewportSize({width:1920,height:1080});await noOverflow(t);await shot(t,'competition-results-board');
  await pa.getByRole('button',{name:'Tungi ko‘rinishga o‘tish',exact:true}).click();await pa.setViewportSize({width:390,height:844});await pa.waitForTimeout(350);await noOverflow(pa);await axe(pa,'results dark mobile');await shot(pa,'competition-results-dark-mobile');
  const download=t.waitForEvent('download');await t.getByRole('button',{name:'Natijalarni Excel uchun olish',exact:true}).click();assert.match((await download).suggestedFilename(),/\.csv$/);
  await pa.locator('#studio-main').getByRole('button',{name:'Musobaqalar',exact:true}).click();await pa.getByRole('heading',{name:'Jamoaviy musobaqalar',exact:true}).waitFor();
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify(accessibility,null,2));fs.writeFileSync(path.join(out,'competition-browser.json'),JSON.stringify({status:'pass',browser:await browser.version(),stages:5,teams:2,sourceQuizPin:'654321',results:ranks,runtimeErrors:errors,answerCalls:actions.filter(a=>a.action==='answer').length},null,2));
  console.log('PASS actual five-stage team competition: 6-code quiz, typing, full text maze, Excel practical, custom quiz and real Python worker, true rank and CSV; responsive/axe checks pass.');
 }catch(e){if(current&&!current.isClosed())await shot(current,'failure').catch(()=>{});fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify(accessibility,null,2));console.error('Browser failure at',current?.url());throw e}
 finally{await browser.close();await server.close();await db.close()}
})().catch(e=>{console.error(e);process.exit(1)});
