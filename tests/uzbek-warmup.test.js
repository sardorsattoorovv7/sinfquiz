import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {DEFAULT_WARMUP,UZBEK_WARMUP_SENTENCES,advanceWarmup,finishWarmup,makeWarmupText,newWarmupSession,normalizeWarmup,warmupMetrics} from '../src/typing/uzbek-warmup.js';

test('Uzbek warmup contains 48 original short sentences and distinct configurable practice sets',()=>{
 assert.equal(UZBEK_WARMUP_SENTENCES.length,48);assert.equal(new Set(UZBEK_WARMUP_SENTENCES).size,48);
 for(const s of UZBEK_WARMUP_SENTENCES){assert.ok(s.split(/\s/u).length>=3&&s.split(/\s/u).length<=8);assert.ok(s.length<=65);assert.ok(s.endsWith('.'));}
 const random=()=>.2;
 for(const count of [1,3,5]){
  const text=makeWarmupText({...DEFAULT_WARMUP,count,punctuation:true},random);
  assert.equal(text.split('.').filter(s=>s.trim()).length,count);assert.equal(new Set(text.split('.').filter(s=>s.trim()).map(s=>s.trim())).size,count);
  const simple=makeWarmupText({...DEFAULT_WARMUP,count},random);assert.doesNotMatch(simple,/[.,!?;:A-Z]/u);
  assert.notEqual(makeWarmupText({...DEFAULT_WARMUP,count},random,simple),simple,'restart avoids repeating the first sentence');
 }
 assert.equal(makeWarmupText({...DEFAULT_WARMUP,mode:'time',punctuation:true},random).split('.').filter(s=>s.trim()).length,24);
 assert.equal(normalizeWarmup("O'g’ gʻ gʼ g`"),'O‘g‘ g‘ g‘ g‘');
});

test('Warmup counts corrected mistakes, quote variants and selection edits without charging Backspace',()=>{
 const text='o‘qi',options={...DEFAULT_WARMUP,count:1};let s=newWarmupSession();
 s=advanceWarmup(s,text,'x',0,options);assert.equal(s.startedAt,0);assert.equal(s.attempts,1);
 s=advanceWarmup(s,text,'',200,options);assert.equal(s.attempts,1);assert.equal(s.startedAt,0);
 for(const [i,value] of ['o',"o'","o'q","o'qi"].entries())s=advanceWarmup(s,text,value,1000+i*1000,options);
 const m=warmupMetrics(s,text,50000);assert.equal(m.correct,4);assert.equal(m.errors,1);assert.equal(m.accuracy,80);assert.equal(m.elapsedMs,4000);assert.equal(m.wpm,12);
 assert.equal(s.endedAt,4000);assert.equal(advanceWarmup(s,text,'tamper',8000,options),s);
 let edit=advanceWarmup(newWarmupSession(),'abc def','axc',0,options);
 edit=advanceWarmup(edit,'abc def','abc',1000,options);assert.equal(warmupMetrics(edit,'abc def',1000).errors,1);assert.equal(edit.attempts,4);assert.equal(edit.correctAttempts,3);
 const unicode=advanceWarmup(newWarmupSession(),'a😀b','a😀',100,options);assert.equal(unicode.attempts,2);assert.equal(warmupMetrics(unicode,'a😀b',1100).correct,2);
});

test('Timed warmup starts on input, enforces its deadline before late keystrokes, and supports partial finish',()=>{
 const options={...DEFAULT_WARMUP,mode:'time',seconds:15};let s=newWarmupSession();
 assert.equal(advanceWarmup(s,'hello','',5000,options),s);assert.equal(warmupMetrics(s,'hello',20000).elapsedMs,0);
 s=advanceWarmup(s,'hello','h',5000,options);s=advanceWarmup(s,'hello','he',6000,options);
 const expired=advanceWarmup(s,'hello','hel',22000,options);assert.equal(expired.typed,'he');assert.equal(expired.endedAt,20000);assert.equal(warmupMetrics(expired,'hello',40000).elapsedMs,15000);
 assert.equal(finishWarmup(newWarmupSession(),20000,options).endedAt,null);
 assert.equal(finishWarmup(s,9000,options).endedAt,9000);assert.equal(finishWarmup(s,22000,options).endedAt,20000);
 assert.equal(warmupMetrics(finishWarmup(s,9000,options),'hello',40000).wpm,6);
});

function setup(){
 const dom=new JSDOM('<!doctype html><html lang="uz" data-design="paper"><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const name of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location','KeyboardEvent'])globalThis[name]=dom.window[name];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
 globalThis.matchMedia=window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.__SINFQUIZ_LEGACY_TEST__=true;return dom;
}

test('Warmup UI supports native typing, wrong-character feedback, correction, completion, keyboard restart and accessible controls',async()=>{
 const dom=setup(),React=(await import('react')).default,{render,within,fireEvent,act,cleanup}=await import('@testing-library/react'),user=(await import('@testing-library/user-event')).default.setup({document,delay:null});
 const vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});let time=1000,continued=0;
 try{
  const {default:Warmup}=await vite.ssrLoadModule('/src/typing/UzbekTypingWarmup.jsx');
  const view=render(React.createElement(Warmup,{clock:()=>time,onContinue:()=>continued++})),ui=within(view.container);
  fireEvent.click(ui.getByRole('button',{name:'1 gap',exact:true}));const getInput=()=>ui.getByLabelText('Qisqa gaplarni yozish'),getTarget=()=>view.container.querySelector('.uw-words').textContent;
  const target=getTarget();assert.equal(ui.getByRole('button',{name:'1 gap',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(view.container.querySelector('[data-metric="wpm"]').textContent,'0');
  fireEvent.click(ui.getByRole('button',{name:'Yozishni boshlash'}));assert.equal(document.activeElement,getInput());
  fireEvent.change(getInput(),{target:{value:target[0]==='x'?'z':'x'}});assert.equal(view.container.querySelectorAll('.uw-char.is-wrong').length,1);
  time+=100;fireEvent.change(getInput(),{target:{value:''}});assert.equal(view.container.querySelector('[data-metric="errors"]').textContent,'1');
  assert.equal(fireEvent.paste(getInput()),false);assert.match(view.container.textContent,/klaviaturada o‘zingiz tering/);
  let value='';for(const char of target){value+=char==='‘'?"'":char;time+=100;fireEvent.change(getInput(),{target:{value}});}
  assert.ok(ui.getByText('Razminka yakunlandi.'));assert.equal(view.container.querySelector('[data-metric="errors"]').textContent,'1');assert.ok(parseInt(view.container.querySelector('[data-metric="accuracy"]').textContent)<100);
  assert.equal(document.activeElement,ui.getByRole('button',{name:'Yangi razminka'}));fireEvent.click(ui.getByRole('button',{name:'5 bosqichli mashqqa o‘tish'}));assert.equal(continued,1);
  fireEvent.click(ui.getByRole('button',{name:'Yangi razminka'}));await act(async()=>new Promise(r=>requestAnimationFrame(r)));assert.equal(getInput().value,'');assert.notEqual(getTarget(),target);assert.equal(view.container.querySelector('[data-metric="errors"]').textContent,'0');
  act(()=>getInput().focus());fireEvent.change(getInput(),{target:{value:'x'}});await user.tab();assert.equal(document.activeElement,ui.getByRole('button',{name:'Yangi razminka'}));await user.keyboard('{Enter}');await act(async()=>new Promise(r=>requestAnimationFrame(r)));assert.equal(getInput().value,'');
  const axe=(await import('axe-core')).default,report=await axe.run(view.container,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']},rules:{'color-contrast':{enabled:false}}});
  assert.deepEqual(report.violations.map(v=>v.id),[]);
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});

test('Warmup timed UI extends short sentences and ends on wall time while hidden without accepting late input',async()=>{
 const dom=setup(),React=(await import('react')).default,{render,within,fireEvent,act,cleanup}=await import('@testing-library/react'),vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});let time=5000;
 try{
  const {default:Warmup}=await vite.ssrLoadModule('/src/typing/UzbekTypingWarmup.jsx');
  const view=render(React.createElement(Warmup,{clock:()=>time})),ui=within(view.container);
  fireEvent.click(ui.getByRole('button',{name:'Tinish belgilari'}));assert.match(view.container.querySelector('.uw-words').textContent,/[.,]/);
  fireEvent.click(ui.getByRole('button',{name:'Vaqt',exact:true}));fireEvent.click(ui.getByRole('button',{name:'15 s',exact:true}));
  const input=ui.getByLabelText('Qisqa gaplarni yozish'),target=view.container.querySelector('.uw-words').textContent,typed=target.slice(0,-100);
  fireEvent.change(input,{target:{value:typed}});assert.ok(view.container.querySelector('.uw-words').textContent.length>target.length,'next short sentences are appended without resetting the clock');
  time+=17000;Object.defineProperty(document,'hidden',{value:true,configurable:true});act(()=>document.dispatchEvent(new window.Event('visibilitychange')));
  assert.ok(ui.getByText('Razminka yakunlandi.'));assert.equal(view.container.querySelector('[data-metric="time"]').textContent,'15 s');
  assert.ok(ui.getByText(new RegExp(typed.length+' / '+typed.length+' belgi to‘g‘ri')));
  fireEvent.click(ui.getByRole('button',{name:'Yangi razminka'}));fireEvent.change(ui.getByLabelText('Qisqa gaplarni yozish'),{target:{value:'a'}});time+=16000;
  fireEvent.change(ui.getByLabelText('Qisqa gaplarni yozish'),{target:{value:'ab'}});assert.ok(ui.getByText('Razminka yakunlandi.'));assert.ok(ui.getByText(/\/ 1 belgi to‘g‘ri/));
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});

test('Typing entry warms up locally, preserves room selection and joins the original Uzbek/English course contracts',async()=>{
 const dom=setup(),React=(await import('react')).default,{render,within,fireEvent,cleanup}=await import('@testing-library/react'),vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'}),received=[];
 try{
  const {TypingJoin,TypingScreen}=await vite.ssrLoadModule('/src/app-views/SessionViews.jsx');
  const offer={rooms:[{id:'teacher-one',title:'Birinchi ustoz',code:'123456'},{id:'teacher-two',title:'Ikkinchi ustoz',code:'654321'}]};
  const view=render(React.createElement(TypingJoin,{offer,onBack:()=>{},onStart:p=>received.push(p)})),ui=within(view.container);
  assert.ok(ui.getByRole('button',{name:/Darajani aniqlash/}));fireEvent.change(ui.getByRole('combobox',{name:'Ustozning xonasi'}),{target:{value:'teacher-two'}});
  fireEvent.click(ui.getByRole('button',{name:/O‘zbekcha typing/}));await ui.findByRole('heading',{name:'Barmoqlar uchun razminka.'});assert.equal(received.length,0);assert.equal(ui.queryByPlaceholderText('Ismingizni kiriting'),null);
  fireEvent.click(ui.getByRole('button',{name:'5 bosqichli matn'}));fireEvent.change(ui.getByPlaceholderText('Ismingizni kiriting'),{target:{value:'Malika'}});fireEvent.click(ui.getByRole('button',{name:/Mashqni boshlash/}));
  assert.equal(received.length,1);assert.equal(received[0].courseMode,'longtext');assert.equal(received[0].entryMode,'longtext');assert.equal(received[0].roomId,'teacher-two');
  fireEvent.click(ui.getByRole('button',{name:/Ingliz tili.*Daraja testi/}));fireEvent.click(ui.getByRole('button',{name:/Darajani o‘zim tanlayman/}));fireEvent.click(await ui.findByRole('button',{name:'A1 darajasini boshlash'}));assert.equal(received.at(-1).courseMode,'english');assert.equal(received.at(-1).roomId,'teacher-two');
  view.unmount();const game={courseMode:'longtext',name:'Malika',stageCount:5,stage:{id:'uz-1',title:'Qisqa matn',text:'Bugun havo yaxshi.',level:1,wordCount:3},stageStartedAt:null,results:[],finished:false};
  const next=render(React.createElement(TypingScreen,{game,onUpdate:()=>{},onLeave:()=>{}})),screen=within(next.container);fireEvent.click(screen.getByRole('button',{name:'Avval razminka'}));await screen.findByRole('heading',{name:'Barmoqlar uchun razminka.'});fireEvent.click(screen.getByRole('button',{name:'Bosqichga qaytish',exact:true}));assert.ok(screen.getByRole('heading',{name:'Qisqa matn',level:1}));assert.equal(game.stageStartedAt,null);
 }finally{cleanup();await vite.close();dom.window.close();delete globalThis.__SINFQUIZ_LEGACY_TEST__}
});
