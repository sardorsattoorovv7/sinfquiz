// Actual browser and scene calculations. Only account/catalog transport is a fixture.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=process.env.STUDIO_QA_DIR||path.join(root,'qa-7.26/studio');fs.mkdirSync(out,{recursive:true});
 const {createServer}=await import(pathToFileURL(path.join(root,'node_modules/vite/dist/node/index.js')));
 const {audioMazeLevels,mazePath}=await import(pathToFileURL(path.join(root,'src/audio-maze-content.js')));
 const server=await createServer({root,server:{host:'127.0.0.1',port:4196,hmr:false}});await server.listen();
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:1050}}),errors=[],checks=[],results={};let role='student';
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;localStorage.setItem('sq_theme','light')});
 await page.route(/\/(auth|api)\//,async route=>{
  const p=new URL(route.request().url()).pathname;let data={};
  if(p==='/auth/session')data={user:{id:'studio-user',name:'Javlon',role},csrf:'fixture'};
  else if(p==='/api/catalog'||p==='/api/lessons')data={quizzes:[],lessons:[]};
  else if(p==='/api/quizzes')data={quizzes:[],publicQuizzes:[],lessons:[],players:[],results:[],typing:{active:false,results:[]},race:{active:false}};
  else if(p.includes('concepts')||p.includes('observations'))data=[];
  else if(p==='/api/audio-maze/active')data={active:[]};
  else if(p==='/api/audio-maze/admin')data={levels:[],results:[],pending:[]};
  else if(p.endsWith('/active'))data={active:false};
  await route.fulfill({status:200,json:data});
 });
 const shot=async name=>{await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:path.join(out,name+'.png'),fullPage:true})};
 const fits=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
 const axe=async label=>{
  await page.addScriptTag({path:path.join(root,'node_modules/axe-core/axe.min.js')});
  const violations=await page.evaluate(async()=>(await window.axe.run('.studio-app',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
  checks.push({label,violations});fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify(checks,null,2));assert.deepEqual(violations,[],label);
 };
 const nav=id=>page.locator('.studio-sidebar').getByRole('button',{name:id,exact:true}).click();
 try{
  await page.goto('http://127.0.0.1:4196');await page.getByRole('heading',{name:'Bugun nimani o‘rganamiz?'}).waitFor();await fits();await shot('home-desktop');await axe('home desktop');
  assert.equal(await page.locator('.studio-sidebar .studio-main-nav button').count(),6);assert.equal(await page.locator('.studio-home-shortcuts>button').count(),4);results.purposeNavigation=true;
  const search=page.getByLabel('Bo‘lim qidirish',{exact:true});
  await search.fill('  Word  ');await page.getByRole('region',{name:'Qidiruv natijalari'}).waitFor();await axe('header search keyboard');
  await search.press('ArrowDown');assert.match(await page.evaluate(()=>document.activeElement.textContent),/Informatika amaliyoti/);
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('region',{name:'Qidiruv natijalari'}).count(),0);assert.ok(await search.evaluate(el=>el===document.activeElement));
  await search.press('ArrowDown');await page.getByRole('region',{name:'Qidiruv natijalari'}).getByRole('button',{name:'Informatika amaliyoti',exact:true}).click();
  await page.getByRole('heading',{name:'O‘rganing va bilimingizni sinang',exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'#informatika');
  await page.reload();await page.getByRole('heading',{name:'O‘rganing va bilimingizni sinang',exact:true}).waitFor();
  await nav('Natijalar');await page.getByRole('heading',{name:'Mening profilim',exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'#profil');
  await page.reload();await page.getByRole('heading',{name:'Mening profilim',exact:true}).waitFor();
  await nav('Mashqlar');await page.getByLabel('Mashq yoki atlas qidirish').fill('  chat  ');await page.locator('.studio-hub-card').click();await page.locator('.chat-modes').waitFor();assert.equal(new URL(page.url()).hash,'#suhbatlar');
  await page.reload();await page.locator('.chat-modes').waitFor();assert.equal(await page.locator('.studio-sidebar').getByRole('button',{name:'Mashqlar',exact:true}).getAttribute('aria-current'),'page');
  await nav('Mashqlar');await page.getByLabel('Mashq yoki atlas qidirish').fill('  milliy  ');await page.locator('.studio-hub-card').click();await page.getByRole('heading',{name:'Fan va bo‘limni tanlang',exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'#milliy-testlar');
  await page.reload();await page.getByRole('heading',{name:'Fan va bo‘limni tanlang',exact:true}).waitFor();results.topLevelReload=true;results.keyboardSearch=true;
  await nav('Bosh sahifa');await search.fill('Kimyo');await page.getByRole('region',{name:'Qidiruv natijalari'}).waitFor();await page.getByRole('heading',{name:'Bugun nimani o‘rganamiz?'}).click();assert.equal(await page.getByRole('region',{name:'Qidiruv natijalari'}).count(),0);await search.fill('');await search.press('Enter');assert.equal(new URL(page.url()).hash,'');results.searchDismissAndEmptyEnter=true;

  await nav('Atlaslar');await page.locator('.studio-hub-card').filter({hasText:'Matematika atlasi'}).click();await page.getByRole('heading',{name:'Matematika atlasi',exact:true}).waitFor();
  await page.locator('.ma-card').filter({has:page.locator('strong').filter({hasText:/^Uchburchak yuzi$/})}).click();await page.getByRole('heading',{name:'Uchburchak yuzi',exact:true}).waitFor();
  assert.match(await page.locator('.ma-result').innerText(),/20 kvadrat/);await page.getByLabel('Asos uzunligi, son bilan',{exact:true}).fill('10');assert.match(await page.locator('.ma-result').innerText(),/25 kvadrat/);await page.getByLabel('Asos uzunligi, son bilan',{exact:true}).fill('8');results.triangleLiveCalculation=true;
  await fits();await shot('math-triangle-desktop');await axe('math triangle desktop');await page.setViewportSize({width:1920,height:1080});await fits();await shot('math-triangle-board');
  await page.setViewportSize({width:390,height:844});await fits();await shot('math-triangle-mobile');await axe('math triangle mobile');
  await page.getByRole('button',{name:'Menyuni ochish',exact:true}).click();await page.getByRole('dialog',{name:'Bo‘limlar menyusi'}).waitFor();assert.ok(await page.locator('.studio-topbar').evaluate(el=>el.inert));assert.ok(await page.locator('.studio-bottom-nav').evaluate(el=>el.inert));await page.keyboard.press('Shift+Tab');assert.ok(await page.getByRole('dialog',{name:'Bo‘limlar menyusi'}).evaluate(el=>el.contains(document.activeElement)));await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog',{name:'Bo‘limlar menyusi'}).count(),0);results.mobileDrawerEscape=true;
  await page.locator('.studio-bottom-nav').getByRole('button',{name:'Darsliklar',exact:true}).click();await page.getByRole('heading',{name:'Darsliklar, bitta joyda.'}).waitFor();assert.equal(await page.locator('.book-subjects button').count(),4);await fits();await shot('books-mobile');await axe('books mobile');
  await page.getByRole('button',{name:'Tungi ko‘rinishga o‘tish',exact:true}).click();await shot('books-dark-mobile');await axe('books dark mobile');results.subjectsAndTheme=true;
  await page.setViewportSize({width:1600,height:1050});await nav('Atlaslar');await page.locator('.studio-hub-card').filter({hasText:'Kimyo laboratoriyasi'}).click();await page.getByRole('button',{name:'Tajriba qil',exact:true}).click();
  await page.getByRole('button',{name:'H₂O Suv',exact:true}).click();await page.getByLabel('Miqdor (ml)',{exact:true}).fill('100');await page.getByRole('button',{name:'Idishga qo‘shish',exact:true}).click();await page.getByLabel('Laboratoriya vaqt shkalasi').fill('10');await page.locator('.cb-webgl canvas').waitFor({timeout:20000});assert.match(await page.locator('.cb-additions').innerText(),/100/);results.actualChemistryWorkbench=true;
  await fits();await shot('chemistry-dark-desktop');await axe('chemistry dark desktop');await page.getByRole('button',{name:'Kunduzgi ko‘rinishga o‘tish',exact:true}).click();await shot('chemistry-desktop');await axe('chemistry desktop');await page.setViewportSize({width:390,height:844});await fits();await shot('chemistry-mobile');await axe('chemistry mobile');
  await page.setViewportSize({width:1600,height:1050});await nav('Mashqlar');await page.getByLabel('Mashq yoki atlas qidirish').fill('labirint');assert.equal(await page.locator('.studio-hub-card').count(),1);await page.locator('.studio-hub-card').click();await page.getByLabel('Labirint savol rejimi').selectOption('text');await page.getByRole('button',{name:'Boshlash',exact:true}).click();await page.locator('.lv-maze.lv-ready').waitFor({timeout:20000});assert.equal(await page.locator('.studio-sidebar').count(),0);assert.equal(await page.getByRole('button',{name:'Tizimdan chiqish'}).count(),0);await page.getByRole('button',{name:'Tungi ko‘rinishga o‘tish',exact:true}).click();
  await fits();await shot('maze-dark-desktop');await axe('maze dark desktop');
  const level=audioMazeLevels[0],trail=mazePath(level.grid,level.start,level.gateCells[0]);assert.ok(trail);
  for(let i=1;i<trail.length;i++){const dx=trail[i][0]-trail[i-1][0],dy=trail[i][1]-trail[i-1][1];await page.getByRole('button',{name:dx===1?'O‘ngga':dx===-1?'Chapga':dy===1?'Pastga':'Yuqoriga',exact:true}).click();if(await page.locator('.am-written-question').count())break;}
  await page.locator('.am-written-question').waitFor();await shot('maze-text-question');await axe('maze text question');results.real3DMazeAndTextMode=true;
  await page.getByRole('button',{name:'Mashqdan chiqish',exact:true}).click();await page.locator('.am-result').waitFor();role='teacher';await page.goto('http://127.0.0.1:4196/#dashboard');await page.reload();await page.getByRole('heading',{name:'Sinf testlarini boshqarish',exact:true}).waitFor();await fits();await shot('teacher-desktop');await axe('teacher desktop');
  await page.setViewportSize({width:390,height:844});await fits();await page.getByRole('button',{name:'Panel menyusini ochish',exact:true}).click();await page.locator('.admin-sidebar.open').waitFor();await shot('teacher-mobile');await page.getByRole('button',{name:'Panel menyusini yopish',exact:true}).click();await axe('teacher mobile');results.teacherPanel=true;await page.setViewportSize({width:1600,height:1050});await page.getByLabel('Bo‘lim qidirish',{exact:true}).fill('Word');await page.getByRole('region',{name:'Qidiruv natijalari'}).getByRole('button',{name:'Informatika amaliyoti',exact:true}).click();await page.locator('.catalog-tabs').getByRole('button',{name:'Ustozlar bilan chat',exact:true}).click();await page.locator('.admin-shell').waitFor();assert.equal(new URL(page.url()).hash,'#dashboard');await page.getByRole('heading',{name:'O‘quvchilar bilan chat',exact:true}).waitFor();await page.locator('.chat-modes').waitFor();assert.ok(await page.locator('.admin-sidebar').getByRole('button',{name:'O‘quvchilar bilan chat',exact:true}).isVisible());results.teacherChatRoute=true;
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify(checks,null,2));assert.equal(JSON.parse(fs.readFileSync(path.join(out,'accessibility.json'),'utf8')).length,checks.length);fs.writeFileSync(path.join(out,'studio-browser.json'),JSON.stringify({passed:true,browser:await browser.version(),fixture:'Auth/catalog transport fixtures; profile/chat reload checks only verify navigation. Real React, SVG and WebGL; no live deployment or account-editing test.',viewports:[1600,1920,390],accessibilityChecks:checks.length,...results,runtimeErrors:errors},null,2));console.log('PASS studio desktop/mobile/board, real scene controls, dark mode, text maze, teacher panel and '+checks.length+' accessibility checks.');
 }catch(e){await shot('failure').catch(()=>{});fs.writeFileSync(path.join(out,'failure.txt'),String(e.stack));throw e}
 finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
