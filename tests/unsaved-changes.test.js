import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';

test('editors preserve unsaved text when leaving is cancelled and release guards after unmount',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const key of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[key]=dom.window[key];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 window.scrollTo=()=>{};
 globalThis.__SINFQUIZ_LEGACY_TEST__=true;
 const React=(await import('react')).default,{render,within,fireEvent,cleanup}=await import('@testing-library/react');
 const vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 let allowed=false,prompts=0,cancelled=0;
 window.confirm=()=>{prompts++;return allowed};
 const beforeNavigation=()=>window.dispatchEvent(new window.Event('sq:before-navigation',{cancelable:true}));
 try{
  const {QuizEditor,NationalSectionEditor,LessonAdmin}=await vite.ssrLoadModule('/src/app-views/AdminViews.jsx');
  for(const [Editor,props,label] of [
   [QuizEditor,{onSave(){},onCancel(){cancelled++}},'Test nomi'],
   [NationalSectionEditor,{role:'teacher',onSave(){},onCancel(){cancelled++}},'Bo‘lim nomi'],
  ]){
   const view=render(React.createElement(Editor,props)),ui=within(view.container),back=ui.getByRole('button',{name:'Orqaga qaytish'}),before=prompts;
   fireEvent.click(back);assert.equal(prompts,before,'pristine editors leave without prompting');
   fireEvent.change(ui.getByLabelText(label),{target:{value:'Saqlanmagan sarlavha'}});
   const count=cancelled;fireEvent.click(back);assert.equal(cancelled,count);
   assert.equal(ui.getByLabelText(label).value,'Saqlanmagan sarlavha');
   assert.equal(beforeNavigation(),false,'surrounding navigation is also cancelled');
   const unload=new window.Event('beforeunload',{cancelable:true});window.dispatchEvent(unload);assert.equal(unload.defaultPrevented,true);
   allowed=true;fireEvent.click(back);assert.equal(cancelled,count+1);allowed=false;
   view.unmount();assert.equal(beforeNavigation(),true);
  }
  const view=render(React.createElement(LessonAdmin,{lessons:[],onSave(){},onDelete(){}})),ui=within(view.container);
  fireEvent.click(ui.getByRole('button',{name:'Yangi darslik'}));
  fireEvent.change(ui.getByLabelText('Sarlavha'),{target:{value:'Dars qoralamasi'}});
  fireEvent.click(ui.getByRole('button',{name:'Bekor qilish'}));assert.equal(ui.getByLabelText('Sarlavha').value,'Dars qoralamasi');
  allowed=true;fireEvent.click(ui.getByRole('button',{name:'Bekor qilish'}));assert.equal(ui.queryByLabelText('Sarlavha'),null);
  assert.equal(beforeNavigation(),true);view.unmount();
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});
