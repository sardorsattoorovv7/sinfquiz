import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';

function environment(){
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const name of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[name]=dom.window[name];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
 globalThis.matchMedia=window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 window.scrollTo=()=>{};globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 return dom;
}

test('home and its code form paint before auth, then navigation remains available while the teacher catalog loads',async()=>{
 const dom=environment();globalThis.__SINFQUIZ_LEGACY_TEST__=true;
 let resolveCatalog,resolveSession;
 globalThis.fetch=async path=>{
  if(path==='/api/quizzes')return new Promise(resolve=>{resolveCatalog=value=>resolve(new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}}))});
  if(path==='/auth/session')return new Promise(resolve=>{resolveSession=()=>resolve(new Response(JSON.stringify({user:{id:'performance-teacher',name:'Ustoz',role:'teacher'},csrf:'fixture'}),{status:200,headers:{'Content-Type':'application/json'}}));});
  const data={active:false};
  return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
 };
 const React=(await import('react')).default,{render,within,fireEvent,act,cleanup,waitFor}=await import('@testing-library/react');
 const vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-tests/performance',optimizeDeps:{noDiscovery:true,include:[]},root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:App}=await vite.ssrLoadModule('/src/App.jsx'),view=render(React.createElement(App)),ui=within(view.container);
  await ui.findByRole('heading',{level:1,name:/Test ishlang|Bilimni/});
  assert.equal(typeof resolveSession,'function');
  assert.ok(ui.getByRole('textbox',{name:/Test(?: yoki xona)? kodi|O‘YIN KODI/i}));
  assert.equal(ui.queryByRole('button',{name:'Boshqaruv paneli'}),null,'private controls stay hidden until the session resolves');
  await act(async()=>resolveSession());
  assert.equal(typeof resolveCatalog,'undefined','the home page does not fetch every teacher record');
  fireEvent.click(ui.getByRole('button',{name:'Boshqaruv paneli'}));
  await waitFor(()=>assert.equal(typeof resolveCatalog,'function'));
  assert.equal(ui.queryByRole('heading',{name:'Barcha testlar'}),null);
  assert.ok(ui.getByRole('navigation',{name:'Asosiy bo‘limlar'}));
  await act(async()=>resolveCatalog({quizzes:[],publicQuizzes:[],lessons:[],players:[],nationalSections:[]}));
  await waitFor(()=>assert.ok(ui.getByRole('heading',{name:'Barcha testlar'})),{timeout:20000});
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});

test('AI screens avoid the teaching catalog and live subscriptions; the dashboard loads them only when opened',async()=>{
 const dom=environment();globalThis.__SINFQUIZ_LEGACY_TEST__=true;location.hash='ai-yordamchi';
 const requests=[];let attached=0,detached=0;
 globalThis.__panelApi=async path=>{requests.push(path);if(path==='/auth/session')return {user:{id:'lazy-teacher',role:'teacher',name:'Ustoz'},csrf:'fixture'};return {quizzes:[],publicQuizzes:[],lessons:[],players:[],nationalSections:[]}};
 globalThis.__panelSubscribe=()=>{attached++;return()=>{detached++}};
 globalThis.fetch=async()=>Response.json({providerConfigured:true});
 const React=(await import('react')).default,{render,within,fireEvent,cleanup,waitFor}=await import('@testing-library/react');
 const vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-tests/performance',optimizeDeps:{noDiscovery:true,include:[]},root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom',plugins:[{name:'panel-transport',enforce:'pre',load(id){if(id.endsWith('/src/api.js'))return 'export const api=(...a)=>globalThis.__panelApi(...a);export const subscribeRealtime=(...a)=>globalThis.__panelSubscribe(...a);export const setPlayerCsrf=()=>{};export const setTeacherCsrf=()=>{};export const setRaceCsrf=()=>{};export const setTypingCsrf=()=>{};';}}]});
 try{
  const {default:App}=await vite.ssrLoadModule('/src/App.jsx'),v=render(React.createElement(App)),ui=within(v.container);
  await ui.findByRole('heading',{name:'Qayerdan boshlaymiz?'});assert.equal(requests.includes('/api/quizzes'),false);assert.equal(requests.includes('/api/catalog'),false);assert.equal(attached,0);
  fireEvent.click(ui.getByRole('button',{name:'Boshqaruv paneli'}));await ui.findByRole('heading',{name:'Barcha testlar'},{timeout:20000});await waitFor(()=>assert.equal(attached,1));assert.equal(requests.filter(p=>p==='/api/quizzes').length,1);
  fireEvent.click(ui.getByRole('button',{name:'Bosh sahifaga qaytish'}));await ui.findByRole('heading',{name:'Test ishlang. Mavzuni o‘rganing.'});assert.equal(detached,1);assert.equal(requests.filter(p=>p==='/api/quizzes').length,1);
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__;delete globalThis.__panelApi;delete globalThis.__panelSubscribe;}
});

test('the piano reuses a static canvas, redraws on resize/theme and keeps playback progress live',async()=>{
 const dom=environment(),frames=new Map();let frameId=0,paints=0,width=600;
 globalThis.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId};globalThis.cancelAnimationFrame=id=>frames.delete(id);
 const noteLabels=[],context=new Proxy({clearRect(){paints++},fillText(value){noteLabels.push(value)}},{get:(obj,key)=>key in obj?obj[key]:()=>{}});
 dom.window.HTMLCanvasElement.prototype.getContext=()=>context;
 const React=(await import('react')).default,{render,within,fireEvent,act,cleanup}=await import('@testing-library/react');
 const engine={ctx:{currentTime:0,state:'running'},ensure(){return this.ctx},apply(){},setSustain(){},noteOn(){return 1},release(){},stopScope(){},allOff(){},schedule(){},tick(){},dispose(){}};
 const vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-tests/performance',optimizeDeps:{noDiscovery:true,include:[]},root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Piano}=await vite.ssrLoadModule('/src/CinemaPiano.jsx'),view=render(React.createElement(Piano,{createAudio:()=>engine})),ui=within(view.container);
  fireEvent.click(ui.getByRole('button',{name:'Tayyor hitlar',exact:true}));
  fireEvent.click(ui.getByRole('button',{name:/APT\..*Tayyor/}));
  fireEvent.change(ui.getByRole('combobox',{name:'Ko‘rsatiladigan piano klavishlari'}),{target:{value:'25'}});
  const canvas=view.container.querySelector('canvas'),scroll=view.container.querySelector('.cp-keyboard-scroll');
  Object.defineProperties(canvas,{clientWidth:{get:()=>width},clientHeight:{value:220}});Object.defineProperty(scroll,'clientWidth',{value:600});
  const step=async now=>{const [id,callback]=frames.entries().next().value;frames.delete(id);await act(async()=>callback(now))};
  await step(1000);assert.equal(paints,1);
  for(let i=1;i<=60;i++)await step(1000+i*16);
  assert.equal(paints,1,'idle frames must reuse the unchanged note roll');
  width=560;await step(2100);assert.equal(paints,2,'responsive resize repaints even when stopped');
  document.documentElement.dataset.theme='dark';await step(2200);assert.equal(paints,3,'theme changes invalidate the cached palette');
  const beforeNotation=paints;noteLabels.length=0;
  fireEvent.change(ui.getByRole('combobox',{name:'Nota yozuvi'}),{target:{value:'letters'}});
  await step(2300);assert.equal(paints,beforeNotation+1,'changing note notation invalidates an idle roll');
  assert.ok(noteLabels.length>0&&noteLabels.every(n=>/^[A-G]♯?\d$/.test(n)));
  noteLabels.length=0;fireEvent.click(ui.getByRole('checkbox',{name:/Nota nomlari/}));
  await step(2400);assert.equal(noteLabels.length,0,'hidden labels disappear from the canvas as well as the keyboard');
  fireEvent.click(ui.getByRole('checkbox',{name:/Nota nomlari/}));await step(2500);
  await act(async()=>fireEvent.click(ui.getByRole('button',{name:'Kuyni tinglash',exact:true})));
  const before=paints;
  for(let i=1;i<=60;i++){engine.ctx.currentTime=i*.016;await step(2700+i*16)}
  assert.ok(paints-before>15&&paints-before<35,'animation is capped near 30 FPS instead of painting every display frame');
  assert.ok(Number(ui.getByLabelText('Piano ijro vaqti').value)>0);
 }finally{cleanup();await vite.close();dom.window.close()}
});
