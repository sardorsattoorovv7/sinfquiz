import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {atlasTopics} from '../src/math-atlas-content.js';

test('atlas UI: xarita, 6 sahna, klaviatura boshqaruvi va javobga fikr-mulohaza',async()=>{
 const root=dirname(dirname(fileURLToPath(import.meta.url))),dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost:3000',pretendToBeVisual:true});
 for(const key of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[key]=dom.window[key];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};
 const React=(await import('react')).default,{render,screen,within,fireEvent,cleanup}=await import('@testing-library/react'),user=(await import('@testing-library/user-event')).default.setup();const vite=await createServer({root,server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{const {default:MathAtlas}=await vite.ssrLoadModule('/src/MathAtlas.jsx');render(React.createElement(MathAtlas,{user:{id:'student-a',role:'student',name:'O‘quvchi'},onBack:()=>{}}));
  assert.ok(await screen.findByRole('heading',{name:'Matematika atlasi'}));
  for(const [name,resultLabel] of [['Sonlar va son chizig‘i','Boshlang‘ich son + qadam nechaga teng?'],['Tenglik va tenglama','Boshlang‘ich tenglamada x nechaga teng?'],['Chiziqli bog‘lanish','x = 2 bo‘lganda y qancha?'],['Uchburchak va uning yuzi','Hozirgi uchburchak yuzi qancha kvadrat birlik?'],['Ko‘chirish, burish va akslantirish','Yangi yuzaning eski yuzaga nisbati nechaga teng?'],['Kub va yoyilma','Jismning hajmi qancha kub birlik?']]){
   await user.click(screen.getAllByRole('button',{name:new RegExp(name)})[0]);assert.ok(await screen.findByRole('heading',{name:'Bu nima?'}));assert.ok(screen.getByText(resultLabel));assert.ok(document.querySelector('.ma-stage svg[aria-label]'));await user.click(screen.getByRole('button',{name:'Xarita'}));
  }
  await user.click(screen.getAllByRole('button',{name:/Chiziqli bog‘lanish/})[0]);let result=screen.getByText(/x birga oshsa y/);assert.match(result.textContent,/y = 5/);
  fireEvent.change(screen.getByRole('slider',{name:'m qiyalik'}),{target:{value:'3'}});result=screen.getByText(/x birga oshsa y/);assert.match(result.textContent,/y = 7/);
  await user.type(screen.getByPlaceholderText('Sonni kiriting'),'7');await user.click(screen.getByRole('button',{name:'Tekshirish'}));assert.ok(screen.getByText(/To‘g‘ri\./));
  await user.clear(screen.getByPlaceholderText('Sonni kiriting'));await user.type(screen.getByPlaceholderText('Sonni kiriting'),'6');await user.click(screen.getByRole('button',{name:'Tekshirish'}));assert.match(screen.getByText(/Yana bir bor ko‘rib chiqing/).textContent,/tanlangan parametrni/);
  const {AtlasScene}=await vite.ssrLoadModule('/src/MathAtlasScenes.jsx');
  for(const topic of atlasTopics){cleanup();render(React.createElement(AtlasScene,{topic}));assert.ok(document.querySelector('.ma-stage svg'),`${topic.id}: visual exists`);assert.ok(screen.getByRole('button',{name:'Tekshirish'}),`${topic.id}: experiment works`)}
  cleanup();render(React.createElement(AtlasScene,{topic:atlasTopics.find(t=>t.scene==='prism')}));
  const before=document.querySelector('.ma-result').textContent;
  fireEvent.change(screen.getByRole('slider',{name:'a uzunlik'}),{target:{value:'5'}});
  assert.notEqual(document.querySelector('.ma-result').textContent,before,'Prism base changes the measured volume');
 }finally{cleanup();await vite.close();dom.window.close()}
});
