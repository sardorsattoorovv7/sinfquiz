import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';

const questions=()=>Array.from({length:5},(_,i)=>({question:`${i+2}/8 kasrida maxraj qaysi son?`,options:[String(i+2),'8','1','16'],correctIndex:1,explanationUz:`${i+1}-izoh: maxraj butunning teng qismlari sonini bildiradi.`,skillUz:i<2?'Kasrning tuzilishi':i<4?'Kasrni qo‘llash':'Yangi vaziyatda qo‘llash',difficulty:['foundation','foundation','application','application','challenge'][i]}));
const diagnostic=()=>({answerUz:'Kasrlar bo‘yicha beshta savolni bajaramiz.',routeIds:[],quizType:'diagnostic',subjectUz:'Matematika',topicUz:'Kasrlar',questions:questions()});
const answer={answerUz:'Birga maxrajni misol orqali ko‘rib chiqamiz.',routeIds:[],questions:[],quizType:'none'};

test('AI teacher uses actual location and turns completed diagnostic answers into the next lesson',async t=>{
 const dom=new JSDOM('<!doctype html><html lang="uz"><body></body></html>',{url:'http://localhost/#ai-yordamchi',pretendToBeVisual:true});
 for(const key of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[key]=dom.window[key];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const originalFetch=globalThis.fetch;globalThis.fetch=async()=>Response.json({providerConfigured:true});
 const React=(await import('react')).default,{render,within,fireEvent,cleanup,waitFor}=await import('@testing-library/react');
 const vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-tests/mentor-ui',optimizeDeps:{noDiscovery:true,include:[]},root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom',plugins:[{name:'mentor-transport',enforce:'pre',load(id){if(id.endsWith('/src/speaking/assistant-client.js'))return 'export const assistantApi=(...a)=>globalThis.__mentorTestApi(...a);'}}]});
 try{
  const {default:Guide}=await vite.ssrLoadModule('/src/speaking/AiGuide.jsx'),user={id:'mentor-student',role:'student'};
  await t.test('selecting an atlas cannot change the actual page sent to the teacher',async()=>{
   const calls=[];globalThis.__mentorTestApi=async data=>{calls.push(data);return answer};
   const v=render(React.createElement(Guide,{user,currentView:'aiGuide',originView:'biology',onNavigate(){},onLogin(){}})),ui=within(v.container);
   assert.equal(ui.getByRole('button',{name:'AI ustoz',exact:true}).getAttribute('aria-pressed'),'true');
   assert.match(v.container.querySelector('.sp-current-page').textContent,/AI yordamchi/);
   fireEvent.click(ui.getByRole('navigation',{name:'Qo‘llanma bo‘limlari'}).querySelector('button'));
   fireEvent.change(ui.getByRole('textbox',{name:'Savolingiz'}),{target:{value:'qayerdaman'}});fireEvent.click(ui.getByRole('button',{name:'Yordamchidan so‘rash'}));await ui.findByText(answer.answerUz);
   assert.equal(calls[0].mode,'mentor');assert.equal(calls[0].view,'aiGuide');assert.equal(calls[0].originView,'biology');assert.equal(calls[0].focusView,'atlasHub');cleanup();
  });
  await t.test('five answers are collected before revealing feedback, and a follow-up sends exact mistakes',async()=>{
   const calls=[];globalThis.__mentorTestApi=async data=>{calls.push(data);return calls.length===1?diagnostic():answer};
   const v=render(React.createElement(Guide,{user,onNavigate(){},onLogin(){}})),ui=within(v.container);
   const input=ui.getByRole('textbox',{name:'Savolingiz'});fireEvent.change(input,{target:{value:'Kasrlar bo‘yicha bilimimni tekshiring.'}});fireEvent.keyDown(input,{key:'Enter'});
   const quiz=await ui.findByRole('region',{name:'Darajani aniqlash mini-testi'}),mini=within(quiz);
   assert.equal(quiz.querySelectorAll('fieldset').length,1);assert.ok(mini.getByRole('button',{name:'Keyingi savol'}).disabled);
   fireEvent.click(mini.getByRole('button',{name:'A. 2'}));fireEvent.click(mini.getByRole('button',{name:'Keyingi savol'}));fireEvent.click(mini.getByRole('button',{name:'Oldingi savol'}));assert.equal(mini.getByRole('button',{name:'A. 2'}).getAttribute('aria-pressed'),'true');fireEvent.click(mini.getByRole('button',{name:'Keyingi savol'}));
   for(let i=1;i<5;i++){
    assert.equal(ui.queryByText(/-izoh: maxraj/),null);assert.equal(ui.queryByText(/Mini-test natijasi:/),null);
    fireEvent.click(mini.getByRole('button',{name:i===2?'A. 4':'B. 8'}));fireEvent.click(mini.getByRole('button',{name:i===4?'Natijani ko‘rish':'Keyingi savol'}));
   }
   await ui.findByRole('heading',{name:'Mini-test natijasi: 3 / 5'});assert.ok(ui.getByText('Asoslarni mustahkamlash kerak'));assert.equal(calls.length,1,'scoring does not require another provider call');
   fireEvent.click(ui.getByRole('button',{name:'Xatolarimni tushuntiring'}));await ui.findByText(answer.answerUz);assert.equal(calls[1].mode,'mentor');assert.equal(calls[1].learning[0].correct,3);assert.equal(calls[1].learning[0].items[0].chosen,'2');assert.equal(calls[1].learning[0].items[0].expected,'8');assert.match(calls[1].history.at(-1).content,/3\/5/);
   v.rerender(React.createElement(Guide,{user:{id:'other-student',role:'student'},onNavigate(){},onLogin(){}}));await waitFor(()=>assert.equal(ui.queryByRole('heading',{name:/Mini-test natijasi/}),null));fireEvent.change(ui.getByRole('textbox',{name:'Savolingiz'}),{target:{value:'Salom'}});fireEvent.click(ui.getByRole('button',{name:'Yordamchidan so‘rash'}));await waitFor(()=>assert.equal(calls.length,3));assert.equal(calls[2].learning,undefined);assert.deepEqual(calls[2].history,[]);cleanup();
  });
  await t.test('compact help can request a diagnostic without switching modes',async()=>{
   const calls=[];globalThis.__mentorTestApi=async data=>{calls.push(data);return diagnostic()};
   const v=render(React.createElement(Guide,{user,currentView:'biology',compact:true,onNavigate(){},onLogin(){}})),ui=within(v.container);
   fireEvent.change(ui.getByRole('textbox',{name:'Savolingiz'}),{target:{value:'Kasrlar bo‘yicha darajamni tekshiring.'}});fireEvent.click(ui.getByRole('button',{name:'Yordamchidan so‘rash'}));await ui.findByRole('region',{name:'Darajani aniqlash mini-testi'});
   assert.equal(calls[0].view,'biology');assert.equal(calls[0].mode,'mentor');assert.equal(v.container.querySelector('main'),null);cleanup();
  });
 }finally{cleanup();await vite.close();dom.window.close();globalThis.fetch=originalFetch;delete globalThis.__mentorTestApi;}
});
