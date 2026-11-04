import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {transform} from 'lightningcss';
import {uiCopy} from '../src/ui-copy.js';

const tokens=readFileSync(new URL('../src/paper/paper-tokens.css',import.meta.url),'utf8');
const parse=text=>Object.fromEntries([...text.matchAll(/--sq-([\w-]+):\s*(#[\da-fA-F]{6})\s*;/g)].map(m=>[m[1],m[2]]));
const light=parse(tokens.split('}')[0]),dark={...light,...parse(tokens.split('}')[1])};
const luminance=hex=>{const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};

test('Scientific notebook tokens keep readable text, actions, status and focus in both themes',()=>{
 assert.equal(light.paper,'#F8F7F2');assert.equal(light.surface,'#FFFFFF');assert.equal(light.navy,'#102039');assert.equal(light.orange,'#F45A21');assert.equal(light.action,'#C2410C');
 for(const p of [light,dark]){
  for(const surface of ['paper','surface','soft','accent-soft'])for(const text of ['ink','muted'])assert.ok(contrast(p[text],p[surface])>=4.5,text+'/'+surface);
  for(const [fg,bg] of [['on-action','action'],['on-action','action-hover'],['success','success-soft'],['error','error-soft'],['on-navy','navy'],['muted-on-navy','navy']])assert.ok(contrast(p[fg],p[bg])>=4.5,fg+'/'+bg);
  assert.ok(contrast(p['control-line'],p.surface)>=3,'input border is visible');assert.ok(contrast(p.action,p.surface)>=3,'focus outline is visible');
 }
 for(const name of ['paper-tokens.css','paper-workshop.css','notebook-home.css'])assert.deepEqual(transform({filename:name,code:readFileSync(new URL('../src/paper/'+name,import.meta.url)),errorRecovery:false}).warnings,[]);
});
function setup(){
 const dom=new JSDOM('<!doctype html><html lang="uz" data-design="paper"><head><meta name="theme-color" content="#F8F7F2"></head><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const key of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[key]=dom.window[key];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.matchMedia=window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};
 globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);globalThis.cancelAnimationFrame=window.cancelAnimationFrame.bind(window);globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.__SINFQUIZ_LEGACY_TEST__=true;
 return dom;
}
const routeProps=['onJoin','onCatalog','onAtlasHub','onExerciseHub','onCompetitions','onIQ','onAudioMaze','onEnglishCourse','onPractice','onNational','onCefr','onRace','onTyping','onAtlas','onInformatics','onChemistry','onBiology','onSpace','onHistory','onSpeaking'];

test('Public home presents code entry first and routes all real subjects, atlas and Speaking actions',async()=>{
 const dom=setup(),React=(await import('react')).default,{render,within,fireEvent,cleanup}=await import('@testing-library/react'),vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-tests/paper',optimizeDeps:{noDiscovery:true,include:[]},root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Home}=await vite.ssrLoadModule('/src/paper/PaperHome.jsx'),calls=[],props=Object.fromEntries(routeProps.map(name=>[name,()=>calls.push(name)]));
  const view=render(React.createElement(Home,props)),ui=within(view.container),subjects=within(ui.getByRole('region',{name:'Faningizni tanlang.'}));
  assert.equal(ui.getByRole('heading',{level:1}).textContent,uiCopy.home.title);
  const field=ui.getByLabelText(uiCopy.join.label);assert.equal(view.container.querySelector('input'),field);assert.equal(field.getAttribute('inputmode'),'numeric');
  for(const [title,route] of [['Informatika','onInformatics'],['Biologiya','onBiology'],['Matematika','onAtlas'],['Tarix','onHistory'],['Ingliz tili','onEnglishCourse'],['Kimyo','onChemistry'],['Fizika','onSpace']]){fireEvent.click(subjects.getByRole('button',{name:new RegExp(title)}));assert.equal(calls.at(-1),route);}
  fireEvent.click(ui.getByRole('button',{name:'3D atlaslarni ko‘rish'}));assert.equal(calls.at(-1),'onAtlasHub');
  fireEvent.click(ui.getByRole('button',{name:'Speaking sinovini boshlash'}));assert.equal(calls.at(-1),'onSpeaking');
  assert.equal(view.container.querySelectorAll('.studio-home-shortcuts>button').length,4);
  assert.equal(view.container.querySelector('canvas'),null,'home does not start a live model viewer');
  assert.equal(view.container.querySelector('.sq-home-main').children[0].className,'sq-home-start');
  assert.equal(view.container.querySelector('.sq-home-main').children[1].id,'paper-subjects','mobile DOM order puts subjects before decorative atlas preview');
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});

test('Notebook navigation retains role-specific controls, mobile routes, search, theme and focus restoration',async()=>{
 const dom=setup(),React=(await import('react')).default,{render,within,fireEvent,cleanup}=await import('@testing-library/react'),vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-tests/paper',optimizeDeps:{noDiscovery:true,include:[]},root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Shell}=await vite.ssrLoadModule('/src/StudioShell.jsx');
  for(const role of [null,'student','teacher','admin']){
   const routes=[],user=role?{id:role,role,name:'Test '+role}:null,staff=['teacher','admin'].includes(role);
   const view=render(React.createElement(Shell,{user,view:'home',authReady:true,onNavigate:id=>routes.push(id),onJoin(){},onLogout:()=>routes.push('logout')},React.createElement('main',null,'Sahifa'))),ui=within(view.container),header=within(view.container.querySelector('.studio-topbar'));
   const bottom=within(ui.getByRole('navigation',{name:'Tezkor bo‘limlar'}));assert.deepEqual(bottom.getAllByRole('button').map(n=>n.textContent),['Bosh','Darslar','Atlaslar','Mashqlar','Natijalar']);
   for(const [label,id] of [['Bosh','home'],['Darslar','books'],['Atlaslar','atlasHub'],['Mashqlar','exerciseHub'],['Natijalar','results']]){fireEvent.click(bottom.getByRole('button',{name:label,exact:true}));assert.equal(routes.at(-1),id);}
   if(user){fireEvent.click(header.getByRole('button',{name:staff?'Boshqaruv paneli':'Profilim'}));assert.equal(routes.at(-1),staff?'admin':'results');}else{fireEvent.click(header.getByRole('button',{name:uiCopy.auth.submit,exact:true}));assert.equal(routes.at(-1),'login');}
   assert.equal(!!header.queryByRole('button',{name:'Test yaratish'}),staff);if(staff){fireEvent.click(header.getByRole('button',{name:'Test yaratish'}));assert.equal(routes.at(-1),'createQuiz');}
   const trigger=header.getByRole('button',{name:'Menyuni ochish'});trigger.focus();fireEvent.click(trigger);let dialog=ui.getByRole('dialog',{name:'Bo‘limlar menyusi'}),d=within(dialog);
   assert.ok(view.container.querySelector('.studio-content').hasAttribute('inert'));assert.equal(document.body.style.overflow,'hidden');assert.equal(!!d.queryByRole('button',{name:'Sinfxona',exact:true}),staff);
   const theme=d.getByRole('button',{name:/ko‘rinishga o‘tish/}),before=document.documentElement.dataset.theme;fireEvent.click(theme);assert.notEqual(document.documentElement.dataset.theme,before);assert.equal(localStorage.getItem('sq_theme'),document.documentElement.dataset.theme);
   fireEvent.change(d.getByRole('searchbox',{name:'Bo‘limni topish'}),{target:{value:'Informatika'}});fireEvent.click(d.getByRole('button',{name:'Informatika atlasi'}));assert.equal(routes.at(-1),'informaticsAtlas');assert.equal(ui.queryByRole('dialog'),null);assert.equal(document.activeElement,trigger);
   fireEvent.click(trigger);dialog=ui.getByRole('dialog');d=within(dialog);
   if(user){fireEvent.click(d.getByRole('button',{name:'Hisobdan chiqish'}));assert.equal(routes.at(-1),'logout');}else fireEvent.keyDown(document,{key:'Escape'});
   assert.equal(ui.queryByRole('dialog'),null);view.unmount();
  }
  const pending=render(React.createElement(Shell,{view:'home',authReady:false,onNavigate(){},onJoin(){},onLogout(){}},React.createElement('main',null,'Sahifa')));assert.equal(within(pending.container).queryByRole('button',{name:uiCopy.auth.submit}),null);assert.ok(within(pending.container).getByRole('status'));pending.unmount();
  const exam=render(React.createElement(Shell,{view:'play',inActivity:true,onNavigate(){},onJoin(){},onLogout(){}},React.createElement('main',null,'Savol')));assert.equal(within(exam.container).queryByRole('button',{name:'Yordam'}),null);exam.unmount();
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});

test('Code dialog preserves failed input and leading zeroes, deduplicates submit, cancels late navigation and restores focus',async()=>{
 const dom=setup(),React=(await import('react')).default,{render,within,fireEvent,act,waitFor,cleanup}=await import('@testing-library/react'),vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-tests/paper',optimizeDeps:{noDiscovery:true,include:[]},root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'}),originalFetch=globalThis.fetch;
 const received=[],resolved=[];let complete;
 globalThis.fetch=async(path,options)=>{assert.equal(path,'/api/resolve');const data=JSON.parse(options.body);received.push(data);if(data.pin==='222222')return new Promise(r=>{complete=()=>r(Response.json({ticket:'cancelled'}))});return Response.json(data.pin==='111111'?{error:'Kod topilmadi yoki test hali ochilmagan.'}:{ticket:'real-ticket',quiz:{id:'fixture-quiz'}},{status:data.pin==='111111'?404:200});};
 try{
  const {default:Shell}=await vite.ssrLoadModule('/src/StudioShell.jsx');const view=render(React.createElement(Shell,{view:'atlasHub',authReady:true,onNavigate(){},onLogout(){},onJoin:entry=>resolved.push(entry)},React.createElement('main',null,'Atlaslar'))),ui=within(view.container),trigger=within(view.container.querySelector('.studio-topbar')).getByRole('button',{name:'Kod bilan kirish'});
  trigger.focus();fireEvent.click(trigger);let d=within(ui.getByRole('dialog',{name:uiCopy.join.title}));assert.equal(document.activeElement,d.getByLabelText(uiCopy.join.label));fireEvent.keyDown(document,{key:'Escape'});assert.equal(document.activeElement,trigger);
  fireEvent.click(trigger);d=within(ui.getByRole('dialog'));fireEvent.change(d.getByLabelText(uiCopy.join.label),{target:{value:'111111'}});await act(async()=>fireEvent.click(d.getByRole('button',{name:uiCopy.join.submit})));assert.match(d.getByRole('alert').textContent,/Kod topilmadi/);assert.equal(d.getByLabelText(uiCopy.join.label).value,'111111');
  fireEvent.change(d.getByLabelText(uiCopy.join.label),{target:{value:'a00b1234x9'}});assert.equal(d.getByLabelText(uiCopy.join.label).value,'001234');await act(async()=>fireEvent.click(d.getByRole('button',{name:uiCopy.join.submit})));assert.deepEqual(received.at(-1),{pin:'001234'});assert.equal(resolved[0].ticket,'real-ticket');assert.equal(ui.queryByRole('dialog'),null);
  fireEvent.click(trigger);d=within(ui.getByRole('dialog'));fireEvent.change(d.getByLabelText(uiCopy.join.label),{target:{value:'222222'}});const form=d.getByLabelText(uiCopy.join.label).closest('form');fireEvent.submit(form);fireEvent.submit(form);await waitFor(()=>assert.equal(typeof complete,'function'));assert.equal(received.filter(v=>v.pin==='222222').length,1);fireEvent.click(d.getByRole('button',{name:'Oynani yopish'}));await act(async()=>complete());assert.equal(resolved.length,1);
 }finally{cleanup();await vite.close();dom.window.close();globalThis.fetch=originalFetch;delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});

test('Home and code dialog keep accessible form names and modal semantics',async()=>{
 const dom=setup(),React=(await import('react')).default,{render,within,fireEvent,cleanup}=await import('@testing-library/react'),vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-tests/paper',optimizeDeps:{noDiscovery:true,include:[]},root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Shell}=await vite.ssrLoadModule('/src/StudioShell.jsx'),{default:Home}=await vite.ssrLoadModule('/src/paper/PaperHome.jsx'),noop=()=>{},props=Object.fromEntries(routeProps.map(key=>[key,noop]));
  const view=render(React.createElement(Shell,{view:'home',authReady:true,onNavigate:noop,onLogout:noop,onJoin:noop},React.createElement(Home,props))),axe=(await import('axe-core')).default,options={runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']},rules:{'color-contrast':{enabled:false}}};
  assert.deepEqual((await axe.run(view.container,options)).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
  fireEvent.click(within(view.container.querySelector('.studio-topbar')).getByRole('button',{name:'Kod bilan kirish'}));assert.deepEqual((await axe.run(view.container,options)).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});
