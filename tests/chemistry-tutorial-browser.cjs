// Real browser actions with API fixtures; never mutate live school accounts.
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'qa-7.20.1');fs.mkdirSync(out,{recursive:true});
 const load=f=>import(pathToFileURL(path.join(root,f))),{createServer}=await load('node_modules/vite/dist/node/index.js'),{benchTutorials}=await load('src/chemistry-bench-tutorial.js'),{benchById}=await load('src/chemistry-bench-content.js');
 const server=await createServer({root,server:{host:'127.0.0.1',port:4181,strictPort:true,hmr:false}});await server.listen();
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[],accessibility=[];let saved;
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|GL_INVALID|Shader|Uncaught|ReferenceError|TypeError/.test(m.text()))errors.push(m.text());});
 await page.addInitScript(()=>{window.__SINFQUIZ_LEGACY_TEST__=true;window.__benchDraws=0;for(const Type of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(Type){const fn=Type.prototype.drawElements;Type.prototype.drawElements=function(...args){if(this.canvas?.closest?.('.cb-webgl'))window.__benchDraws++;return fn.apply(this,args);};}});
 await page.route(/\/(auth|api)\//,async route=>{
  const url=new URL(route.request().url()),p=url.pathname;let data={};
  if(p==='/auth/session')data={user:{id:'qa-student',name:'Javlon',role:'student'},csrf:'qa'};
  if(/^\/api\/(chemistry|biology)\/(concepts|observations)$/.test(p))data=[];
  if(p==='/api/catalog')data={quizzes:[],lessons:[]};
  if(p==='/api/admin'||p==='/api/quizzes')data={quizzes:[],publicQuizzes:[],lessons:[],players:[],results:[],typing:{texts:[],results:[],active:false},race:{active:false}};
  if(p==='/api/experiments/assignments')data={assignments:[]};
  if(p==='/api/experiments/record'){saved=route.request().postDataJSON();data={result:{id:'qa-result',...saved}};}
  await route.fulfill({json:data});
 });
 const overflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal page overflow');
 const shot=async(name,selector='.chemistry-bench')=>{await page.locator(selector).screenshot({path:path.join(out,name+'.png')});};
 const axe=async name=>{await page.addScriptTag({path:path.join(root,'node_modules/axe-core/axe.min.js')});const violations=await page.evaluate(async()=> (await window.axe.run('.chemistry-bench',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})));accessibility.push({name,violations});assert.deepEqual(violations,[],name);};
 const put=async i=>{await page.locator(`[data-substance="${i.substance}"]`).click();await page.getByLabel(`Miqdor (${benchById[i.substance].unit})`,{exact:true}).fill(String(i.amount));if(['hcl','naoh','vinegar','cacl2','carbonate'].includes(i.substance))await page.getByLabel('Konsentratsiya (mol/l)',{exact:true}).fill(String(i.concentration));await page.getByRole('button',{name:'Idishga qo‘shish',exact:true}).click();};
 const conditions=async s=>{
  await page.getByLabel('Laboratoriya harorati').fill(String(s.temperature));await page.getByLabel('Aralashtirish',{exact:true}).setChecked(s.stir);
  if(s.evaporated!==undefined)await page.getByLabel('Bug‘latilgan suv',{exact:true}).fill(String(s.evaporated));
  if(s.oxygen!==undefined)await page.getByLabel('Kislorod mavjud',{exact:true}).setChecked(s.oxygen);
  if(s.rustDays!==undefined)await page.getByLabel('Zanglash kunlari',{exact:true}).fill(String(s.rustDays));
  if(s.filtered)await page.getByRole('button',{name:'Filtrlashni bajarish',exact:true}).click();
  await page.getByLabel('Laboratoriya vaqt shkalasi',{exact:true}).fill(String(s.elapsed));
 };
 try{
  await page.goto('http://127.0.0.1:4181/#kimyo');await page.getByRole('button',{name:'Tajriba qil',exact:true}).click();await page.locator('.cb-webgl canvas').waitFor({state:'visible',timeout:20000});
  await page.getByRole('button',{name:/Bosqichli qo‘llanma/}).click();assert.match(await page.locator('.cb-tutorial').innerText(),/Tuz suvda qanday eriydi/);
  await page.getByRole('button',{name:'Qayerdaligini ko‘rsat',exact:true}).click();assert.equal(await page.getByLabel('Miqdor (ml)',{exact:true}).inputValue(),'50');assert.equal(await page.locator('[data-guide-highlight=true]').getAttribute('data-substance'),'water');assert.equal(await page.locator('.cb-additions li').count(),0,'locate never adds a reagent');
  await page.getByLabel('Laboratoriya amaliy ishi').selectOption('volcano');assert.match(await page.locator('.cb-tutorial').innerText(),/1\/2 namuna/);
  await put({substance:'iron',amount:1,concentration:.1});assert.match(await page.locator('.cb-tutorial-warning').innerText(),/Temir.*tarkibiga kirmaydi/);assert.ok(!await page.locator('.cb-tutorial-done').count());await page.getByRole('button',{name:'1-moddani olib tashlash',exact:true}).click();
  const volcano=benchTutorials.volcano.rounds[0];await page.getByLabel('Laboratoriya jihozi').selectOption(volcano.equipment);
  await page.getByRole('button',{name:'Qayerdaligini ko‘rsat',exact:true}).click();assert.equal(await page.getByLabel('Miqdor (ml)',{exact:true}).inputValue(),'30');await page.getByRole('button',{name:'Idishga qo‘shish',exact:true}).click();
  assert.match(await page.locator('.cb-tutorial-steps [aria-current=step]').innerText(),/Sovun/);await put(volcano.ingredients[1]);await put(volcano.ingredients[2]);await conditions(volcano.settings);
  await page.locator('.cb-model').scrollIntoViewIfNeeded();await page.waitForTimeout(1600);await shot('volcano-3d','.cb-visual');await page.getByRole('button',{name:/^(Sinovni boshlash|Davom ettirish)$/}).click();await page.waitForTimeout(350);await page.getByRole('button',{name:'To‘xtatish',exact:true}).click();await page.waitForTimeout(200);const draws=await page.evaluate(()=>window.__benchDraws);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.__benchDraws),draws,'paused renderer is idle');
  await page.getByLabel('Laboratoriya vaqt shkalasi').fill('30');await page.getByRole('button',{name:'Natijani taqqoslashga qo‘shish',exact:true}).click();assert.match(await page.locator('.cb-tutorial').innerText(),/2\/2 namuna/);await shot('tutorial-desktop');await axe('desktop');await overflow();
  await page.getByRole('button',{name:'Yangi namuna uchun stolni tozalash',exact:true}).click();const second=benchTutorials.volcano.rounds[1];await page.getByLabel('Laboratoriya jihozi').selectOption(second.equipment);for(const i of second.ingredients)await put(i);await conditions(second.settings);await page.getByRole('button',{name:'Natijani taqqoslashga qo‘shish',exact:true}).click();await page.locator('.cb-tutorial-done').waitFor();assert.equal(await page.locator('.cb-compare tbody tr').count(),2);
  await page.getByRole('button',{name:/Tajriba daftariga o‘tish/}).click();await page.getByLabel('Avvalgi taxmin').fill('Kislota ko‘payganda soda yetarli bo‘lsa ko‘proq gaz chiqadi.');await page.getByLabel('Tajriba kuzatishi').fill('Ikki namunada gaz va ko‘pik hajmi turlicha bo‘ldi.');await page.getByLabel('Tajriba xulosasi').fill('CO₂ kislota va sodadan hosil bo‘ladi; sovun gazni ko‘pikda ushlaydi.');await page.getByRole('button',{name:'Natijani saqlash',exact:true}).click();await page.getByRole('button',{name:'Saqlangan',exact:true}).waitFor();assert.ok(saved.data.hintsUsed>=1);assert.equal(saved.data.snapshots.length,2);
  console.log('PASS full volcano tutorial, incorrect reagent feedback, locate, two real samples, hints saved and idle pause');
  for(const equipment of ['beaker','tube','dish','funnel','electrodes']){await page.getByLabel('Laboratoriya jihozi').selectOption(equipment);await page.locator('.cb-model').scrollIntoViewIfNeeded();await page.waitForTimeout(70);assert.ok(await page.locator('.cb-webgl canvas').isVisible());}
  await page.getByLabel('Laboratoriya amaliy ishi').selectOption('free');await page.getByLabel('Laboratoriya jihozi').selectOption('beaker');await put({substance:'cacl2',amount:30,concentration:.1});await put({substance:'carbonate',amount:30,concentration:.1});await page.getByLabel('Laboratoriya vaqt shkalasi').fill('5');await page.getByLabel('Aralashtirish',{exact:true}).check();await page.locator('.cb-model').scrollIntoViewIfNeeded();await page.waitForTimeout(1600);assert.match(await page.locator('.cb-live-caption').innerText(),/CaCO₃/);await shot('precipitate-3d','.cb-visual');
  await page.locator('.cb-model').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowUp');await page.keyboard.press('+');await page.getByRole('button',{name:'Zarrachalarga yaqinlashish',exact:true}).click();await page.getByRole('button',{name:'Idishga qaytish',exact:true}).click();
  await page.getByLabel('Laboratoriya grafik sifati').selectOption('2d');await page.locator('.cb-model svg').waitFor({state:'visible'});
  for(const [id,guide] of Object.entries(benchTutorials)){
   await page.getByLabel('Laboratoriya amaliy ishi').selectOption(id);if(!await page.locator('.cb-tutorial').count())await page.getByRole('button',{name:/Bosqichli qo‘llanma/}).click();
   // Free may already be selected: explicit clear prevents carrying an exploratory mixture.
   if(await page.locator('.cb-additions li').count())await page.getByRole('button',{name:'Yangi namuna uchun stolni tozalash',exact:true}).click();
   for(let n=0;n<guide.rounds.length;n++){
    if(n)await page.getByRole('button',{name:'Yangi namuna uchun stolni tozalash',exact:true}).click();const r=guide.rounds[n];await page.getByLabel('Laboratoriya jihozi').selectOption(r.equipment);for(const i of r.ingredients)await put(i);await conditions(r.settings);assert.equal(await page.locator('.cb-tutorial-warning').count(),0,id);await page.getByRole('button',{name:'Natijani taqqoslashga qo‘shish',exact:true}).click();
   }
   await page.locator('.cb-tutorial-done').waitFor();assert.equal(await page.locator('.cb-compare tbody tr').count(),guide.rounds.length,id);console.log('PASS UI tutorial: '+id);
  }
  await page.getByLabel('Laboratoriya amaliy ishi').selectOption('filter');const f=benchTutorials.filter.rounds[0];await page.getByLabel('Laboratoriya jihozi').selectOption('funnel');for(const i of f.ingredients)await put(i);await conditions(f.settings);assert.match(await page.locator('.cb-live-caption').innerText(),/filtratga/);await shot('filter-2d','.cb-visual');
  await page.setViewportSize({width:390,height:844});await overflow();await axe('mobile');await shot('tutorial-mobile');await page.getByRole('button',{name:'Tungi ko‘rinishga o‘tish',exact:true}).click();await axe('dark mobile');await shot('tutorial-dark');
  await page.getByLabel('Laboratoriya grafik sifati').selectOption('low');await page.locator('.cb-webgl canvas').waitFor({state:'visible'});assert.equal(await page.locator('.cb-visual>small[role=status]').count(),0,'ready 3D must clear old fallback messages');await page.locator('.cb-model').scrollIntoViewIfNeeded();await shot('filter-dark-3d','.cb-visual');await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:/^(Sinovni boshlash|Davom ettirish)$/}).click();await page.getByRole('button',{name:'To‘xtatish',exact:true}).click();
  await page.setViewportSize({width:1920,height:1080});await overflow();await shot('tutorial-board');assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify(accessibility,null,2));console.log('PASS all apparatus, visible precipitate/filter, 2D/3D, keyboard, mobile/dark/board, reduced motion and zero runtime errors');
 }catch(e){await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});console.error(errors);throw e;}finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
