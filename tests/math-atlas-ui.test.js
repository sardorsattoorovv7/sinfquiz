import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

test('atlas UI: xarita, 6 sahna, klaviatura boshqaruvi va javobga fikr-mulohaza',async()=>{
 const root=dirname(dirname(fileURLToPath(import.meta.url))),dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost:3000',pretendToBeVisual:true});
 for(const key of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[key]=dom.window[key];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};
 const React=(await import('react')).default,{render,screen,within,fireEvent,cleanup}=await import('@testing-library/react'),user=(await import('@testing-library/user-event')).default.setup();const vite=await createServer({root,server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{const {default:MathAtlas}=await vite.ssrLoadModule('/src/MathAtlas.jsx');render(React.createElement(MathAtlas,{user:{id:'student-a',role:'student',name:'O‘quvchi'},onBack:()=>{}}));
  assert.ok(await screen.findByRole('heading',{name:'Matematika atlasi'}));
  for(const [name,resultLabel] of [['Sonlar va son chizig‘i','Boshlang‘ich son + qadam nechaga teng?'],['Tenglik va tenglama','Tarozidagi tenglikda x nechaga teng?'],['Chiziqli bog‘lanish','x = 2 bo‘lganda grafikdagi y qancha?'],['Uchburchak va uning yuzi','Hozirgi uchburchakning yuzi nechta kvadrat birlik?'],['Ko‘chirish, burish va akslantirish','Yangi yuzaning eski yuzaga nisbati nechaga teng?'],['Kub va yoyilma','Jismning hajmi qancha kub birlik?']]){
   await user.click(screen.getAllByRole('button',{name:new RegExp(name)})[0]);assert.ok(await screen.findByRole('heading',{name:'Bu nima?'}));assert.ok(screen.getByText(resultLabel));assert.ok(document.querySelector('.ma-stage svg[aria-label]'));await user.click(screen.getByRole('button',{name:'Xarita'}));
  }
  await user.click(screen.getAllByRole('button',{name:/Chiziqli bog‘lanish/})[0]);let result=screen.getByText(/Har 1 x qadamda y/);assert.match(result.textContent,/y = 5/);
  fireEvent.change(screen.getByRole('slider',{name:'m qiyalik'}),{target:{value:'3'}});result=screen.getByText(/Har 1 x qadamda y/);assert.match(result.textContent,/y = 7/);
  await user.type(screen.getByPlaceholderText('Sonni kiriting'),'7');await user.click(screen.getByRole('button',{name:'Tekshirish'}));assert.ok(screen.getByText(/To‘g‘ri\./));
  await user.clear(screen.getByPlaceholderText('Sonni kiriting'));await user.type(screen.getByPlaceholderText('Sonni kiriting'),'6');await user.click(screen.getByRole('button',{name:'Tekshirish'}));assert.match(screen.getByText(/Yana bir bor ko‘rib chiqing/).textContent,/Jadvaldagi/);
 }finally{cleanup();await vite.close();dom.window.close()}
});
