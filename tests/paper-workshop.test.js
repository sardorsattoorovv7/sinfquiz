import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {transform} from 'lightningcss';

const tokenCSS=readFileSync(new URL('../src/paper/paper-tokens.css',import.meta.url),'utf8');
const palettes=tokenCSS.split('}').slice(0,2).map(s=>Object.fromEntries([...s.matchAll(/--pw-([\w-]+):\s*(#[\da-fA-F]{6})\s*;/g)].map(m=>[m[1],m[2]])));
const luminance=hex=>{const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
test('Paper Workshop keeps the requested palettes and readable text, actions and state colors in both themes',()=>{
 const required=[['#EEE5D5','#F8F2E7','#38382B','#68604F','#BEB29B','#C74B2D','#E7CC73','#B8C6E3'],['#302A24','#494034','#F2E6CF','#C8BCA3','#756951','#FFAF83','#74612B','#4D607E']];
 const keys=['page','paper','ink','muted','border','accent','tape','blue'];
 for(const [i,p] of palettes.entries()){
  assert.deepEqual(keys.map(k=>p[k]),required[i]);
  for(const surface of ['page','paper','paper-alt','blue-soft','accent-soft'])for(const text of ['ink','muted'])assert.ok(contrast(p[text],p[surface])>=4.5,`${i}: ${text}/${surface}`);
  for(const [fg,bg] of [['on-accent','accent'],['on-tape','tape'],['ink','blue'],['accent-ink','paper'],['accent-ink','page'],['success','success-soft'],['danger','danger-soft']])assert.ok(contrast(p[fg],p[bg])>=4.5,`${i}: ${fg}/${bg}`);
  assert.ok(contrast(p.accent,p.paper)>=3,'large serif accents have at least 3:1');assert.ok(contrast(p.focus,p.paper)>=3);assert.ok(contrast(p['control-border'],p.paper)>=3);assert.ok(contrast(p['control-border'],p['paper-alt'])>=3);
 }
 for(const name of ['paper-tokens.css','paper-workshop.css']){const code=readFileSync(new URL('../src/paper/'+name,import.meta.url));const result=transform({filename:name,code,errorRecovery:false});assert.deepEqual(result.warnings,[])}
});
function setup(){
 const dom=new JSDOM('<!doctype html><html lang="uz" data-design="paper"><head><meta name="theme-color" content="#EEE5D5"></head><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const key of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[key]=dom.window[key];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.matchMedia=window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};
 globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);globalThis.cancelAnimationFrame=window.cancelAnimationFrame.bind(window);globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.__SINFQUIZ_LEGACY_TEST__=true;
 return dom;
}
test('Home bookmarks support keyboard selection and open each existing subject callback',async()=>{
 const dom=setup(),React=(await import('react')).default,{render,within,fireEvent,cleanup}=await import('@testing-library/react'),vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Home}=await vite.ssrLoadModule('/src/paper/PaperHome.jsx'),calls=[],props={};
  const routes=[['Matematika','onAtlas'],['Ingliz tili','onEnglishCourse'],['Informatika','onInformatics'],['Kimyo','onChemistry'],['Biologiya','onBiology'],['Fizika','onSpace']];
  for(const name of ['onJoin','onCatalog','onAtlasHub','onExerciseHub','onCompetitions','onIQ','onAudioMaze','onEnglishCourse','onPractice','onNational','onCefr','onRace','onTyping',...routes.map(x=>x[1])])props[name]=()=>calls.push(name);
  const view=render(React.createElement(Home,props)),ui=within(view.container),tabs=ui.getByRole('tablist',{name:'Fan xatcho‘plari'});
  assert.equal(within(tabs).getAllByRole('tab').length,6);assert.equal(ui.getByRole('tabpanel').getAttribute('aria-labelledby'),'paper-tab-math');
  for(const [title,route] of routes){fireEvent.click(within(tabs).getByRole('tab',{name:new RegExp(title)}));assert.ok(within(ui.getByRole('tabpanel')).getByRole('heading',{name:title,exact:true}));fireEvent.click(ui.getByRole('button',{name:'Kashf qilish'}));assert.equal(calls.at(-1),route)}
  const math=within(tabs).getByRole('tab',{name:/Matematika/});fireEvent.keyDown(math,{key:'ArrowDown'});assert.equal(document.activeElement.id,'paper-tab-english');assert.equal(ui.getByRole('tabpanel').getAttribute('aria-labelledby'),'paper-tab-english');
  fireEvent.keyDown(document.activeElement,{key:'End'});assert.equal(document.activeElement.id,'paper-tab-physics');fireEvent.keyDown(document.activeElement,{key:'Home'});assert.equal(document.activeElement.id,'paper-tab-math');
  assert.equal(view.container.querySelectorAll('.studio-home-shortcuts>button').length,4);assert.match(ui.getByRole('heading',{level:1}).textContent,/Bilimni/);assert.equal(view.container.querySelectorAll('.pw-notebook-content button').length,1);
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});
test('Workshop navigation retains role-specific panels, five mobile routes and saved light/dark controls',async()=>{
 const dom=setup(),React=(await import('react')).default,{render,within,fireEvent,cleanup}=await import('@testing-library/react'),vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Shell}=await vite.ssrLoadModule('/src/StudioShell.jsx');
  for(const role of [null,'student','teacher','admin']){
   const routes=[],user=role?{id:role,role,name:'Test '+role}:null;
   const view=render(React.createElement(Shell,{user,view:'home',authReady:true,onNavigate:id=>routes.push(id),onJoin:()=>{},onLogout:()=>routes.push('logout')},React.createElement('main',null,'Sahifa'))),ui=within(view.container),header=within(view.container.querySelector('.studio-topbar'));
   const bottom=within(ui.getByRole('navigation',{name:'Tezkor bo‘limlar'}));assert.deepEqual(bottom.getAllByRole('button').map(n=>n.textContent),['Bosh','Darslar','Atlaslar','Mashqlar','Natijalar']);
   for(const [label,id] of [['Bosh','home'],['Darslar','books'],['Atlaslar','atlasHub'],['Mashqlar','exerciseHub'],['Natijalar','results']]){fireEvent.click(bottom.getByRole('button',{name:label,exact:true}));assert.equal(routes.at(-1),id)}
   const main=within(ui.getByRole('navigation',{name:'Asosiy bo‘limlar'})),staff=['teacher','admin'].includes(role);assert.equal(!!main.queryByRole('button',{name:'Sinfxona',exact:true}),staff);
   if(user){fireEvent.click(header.getByRole('button',{name:staff?'Boshqaruv paneli':'Profilim'}));assert.equal(routes.at(-1),staff?'admin':'results')}else{fireEvent.click(header.getByRole('button',{name:'Kirish',exact:true}));assert.equal(routes.at(-1),'login')}
   const theme=header.getByRole('button',{name:/ko‘rinishga o‘tish/}),before=document.documentElement.dataset.theme;fireEvent.click(theme);assert.notEqual(document.documentElement.dataset.theme,before);assert.equal(localStorage.getItem('sq_theme'),document.documentElement.dataset.theme);assert.equal(document.querySelector('meta[name="theme-color"]').content,document.documentElement.dataset.theme==='dark'?'#302A24':'#EEE5D5');
   fireEvent.click(header.getByRole('button',{name:'Menyuni ochish'}));const dialog=ui.getByRole('dialog',{name:'Bo‘limlar menyusi'});assert.ok(view.container.querySelector('.studio-content').hasAttribute('inert'));assert.equal(document.body.style.overflow,'hidden');
   if(user){fireEvent.click(within(dialog).getByRole('button',{name:'Hisobdan chiqish'}));assert.equal(routes.at(-1),'logout')}else fireEvent.keyDown(document,{key:'Escape'});
   assert.equal(ui.queryByRole('dialog'),null);view.unmount();
  }
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});
test('Shared class-code dialog handles errors, leading zeroes, focus restoration and cancellation during resolution',async()=>{
 const dom=setup(),React=(await import('react')).default,{render,within,fireEvent,act,waitFor,cleanup}=await import('@testing-library/react'),vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 const received=[],resolved=[];let complete;
 globalThis.fetch=async(path,options)=>{assert.equal(path,'/api/resolve');const data=JSON.parse(options.body);received.push(data);if(data.pin==='222222')return new Promise(r=>{complete=()=>r(new Response(JSON.stringify({ticket:'cancelled'}),{status:200}))});return new Response(JSON.stringify(data.pin==='111111'?{error:'Kod topilmadi yoki test hali ochilmagan.'}:{ticket:'real-ticket',quiz:{id:'fixture-quiz'}}),{status:data.pin==='111111'?404:200,headers:{'Content-Type':'application/json'}})};
 try{
  const {default:Shell}=await vite.ssrLoadModule('/src/StudioShell.jsx');const view=render(React.createElement(Shell,{view:'atlasHub',authReady:true,onNavigate:()=>{},onLogout:()=>{},onJoin:entry=>resolved.push(entry)},React.createElement('main',null,'Atlaslar'))),ui=within(view.container),trigger=within(view.container.querySelector('.studio-topbar')).getByRole('button',{name:'Sinfga qo‘shilish'});
  trigger.focus();fireEvent.click(trigger);let dialog=ui.getByRole('dialog',{name:'Sinfga qo‘shilish'}),d=within(dialog);assert.ok(document.activeElement===d.getByLabelText('O‘YIN KODI'),'code input receives initial focus');assert.ok(view.container.querySelector('.studio-content').hasAttribute('inert'));
  fireEvent.keyDown(document,{key:'Escape'});assert.equal(ui.queryByRole('dialog'),null);assert.ok(document.activeElement===trigger,'closing returns focus to the join button');
  fireEvent.click(trigger);d=within(ui.getByRole('dialog'));fireEvent.change(d.getByLabelText('O‘YIN KODI'),{target:{value:'111111'}});await act(async()=>fireEvent.click(d.getByRole('button',{name:'Qo‘shilish'})));assert.match(d.getByRole('alert').textContent,/Kod topilmadi/);
  fireEvent.change(d.getByLabelText('O‘YIN KODI'),{target:{value:'a00b1234x9'}});assert.equal(d.getByLabelText('O‘YIN KODI').value,'001234');await act(async()=>fireEvent.click(d.getByRole('button',{name:'Qo‘shilish'})));assert.deepEqual(received.at(-1),{pin:'001234'});assert.equal(resolved[0].ticket,'real-ticket');assert.equal(ui.queryByRole('dialog'),null);
  fireEvent.click(trigger);d=within(ui.getByRole('dialog'));fireEvent.change(d.getByLabelText('O‘YIN KODI'),{target:{value:'222222'}});fireEvent.click(d.getByRole('button',{name:'Qo‘shilish'}));await waitFor(()=>assert.equal(typeof complete,'function'));fireEvent.click(d.getByRole('button',{name:'Oynani yopish'}));await act(async()=>complete());assert.equal(resolved.length,1,'closing a busy dialog must not navigate after its late response');
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});

test('Paper home and class-code dialog pass DOM accessibility rules apart from browser-only color measurements',async()=>{
 const dom=setup(),React=(await import('react')).default,{render,within,fireEvent,cleanup}=await import('@testing-library/react'),vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Shell}=await vite.ssrLoadModule('/src/StudioShell.jsx'),{default:Home}=await vite.ssrLoadModule('/src/paper/PaperHome.jsx');
  const noop=()=>{},props={onJoin:noop,onCatalog:noop,onAtlasHub:noop,onExerciseHub:noop,onCompetitions:noop,onIQ:noop,onAudioMaze:noop,onEnglishCourse:noop,onPractice:noop,onNational:noop,onCefr:noop,onRace:noop,onTyping:noop,onAtlas:noop,onInformatics:noop,onChemistry:noop,onBiology:noop,onSpace:noop};
  const view=render(React.createElement(Shell,{view:'home',authReady:true,onNavigate:noop,onLogout:noop,onJoin:noop},React.createElement(Home,props))),axe=(await import('axe-core')).default;
  const options={runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']},rules:{'color-contrast':{enabled:false}}};
  const home=await axe.run(view.container,options);assert.deepEqual(home.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
  fireEvent.click(within(view.container.querySelector('.studio-topbar')).getByRole('button',{name:'Sinfga qo‘shilish'}));const modal=await axe.run(view.container,options);assert.deepEqual(modal.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});
