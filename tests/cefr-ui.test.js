import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {newCefrTest} from '../src/cefr-model.js';
test('CEFR UI: admin edits and publishes; student saves, submits and sees reviewed scores',async()=>{
 const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 for(const k of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[k]=dom.window[k];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.confirm=()=>true;
 const React=(await import('react')).default,{render,screen,cleanup,within}=await import('@testing-library/react'),user=(await import('@testing-library/user-event')).default.setup();
 const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
 const payload=newCefrTest();payload.title='Four skills';payload.rightsConfirmed=true;payload.sections.forEach((s,i)=>s.parts.forEach(p=>{p.text='Reading and task fixture';p.audioUrl='https://example.org/audio.mp3';p.source='Original fixture';p.questions[0].text=s.skill+' question';if(i<2){p.questions[0].answers=['yes'];p.questions[0].explanation='Explanation'}}));
 let row={id:'test',revision:1,status:'draft',payload},attempt=null,assessment=null;const actions=[];
 globalThis.__SINFQUIZ_CEFR_TEST__=async(name,args)=>{actions.push([name,args]);
  if(name==='sq_cefr_admin'){
   if(args.p_action==='list')return [structuredClone(row)];if(args.p_action==='results')return [];
   if(args.p_action==='save'){row={...row,payload:args.p_body.payload,revision:2,status:'draft'};return structuredClone(row)}
   if(args.p_action==='publish'){row.status='published';return structuredClone(row)}
  }
  if(name==='sq_cefr_catalog')return {tests:row.status==='published'?[{id:row.id,...row.payload}]:[],attempts:attempt?[{id:attempt.id,title:row.payload.title,finished_at:attempt.finished_at}]:[]};
  if(name==='sq_cefr_start'){const p=structuredClone(row.payload);for(const s of p.sections)for(const part of s.parts)for(const q of part.questions){delete q.answers;delete q.explanation}attempt={id:'attempt',step:0,revision:1,answers:{},payload:p,serverNow:new Date().toISOString(),ends_at:new Date(Date.now()+60000).toISOString(),finished_at:null};return structuredClone(attempt)}
  if(name==='sq_cefr_session'){
   if(args.p_action==='save'||args.p_action==='next'||args.p_action==='finish'){attempt.answers={...attempt.answers,...args.p_answers};attempt.revision++}
   if(args.p_action==='next')attempt.step++;
   if(args.p_action==='finish'){attempt.finished_at=new Date().toISOString();attempt.result={scores:{listening:{correct:1,total:1},reading:{correct:1,total:1}},review:[{id:'r',text:'reading question',selected:'yes',correct:true,answers:['yes'],explanation:'Explanation'}]}}
   attempt.assessment=assessment;attempt.serverNow=new Date().toISOString();return structuredClone(attempt);
  }
  throw Error('Unexpected RPC '+name);
 };
 try{
  const Admin=(await vite.ssrLoadModule('/src/CefrAdmin.jsx')).default;render(React.createElement(Admin));
  await screen.findByText('Four skills');await user.click(screen.getByRole('button',{name:'Tahrirlash'}));
  await user.clear(screen.getByLabelText('Variant nomi'));await user.type(screen.getByLabelText('Variant nomi'),'Updated variant');
  await user.click(screen.getByRole('button',{name:'Reading',exact:true}));assert.equal(screen.getByLabelText('Reading matni').value,'Reading and task fixture');
  await user.click(screen.getByRole('button',{name:'Qoralamani saqlash'}));await screen.findByText(/Qoralama saqlandi/);assert.equal(row.payload.title,'Updated variant');
  await user.click(screen.getByRole('button',{name:'Variantlar',exact:true}));await user.click(screen.getByRole('button',{name:'E’lon qilish'}));await screen.findByText('Variant o‘quvchilarga ochildi.');assert.equal(row.status,'published');cleanup();
  const Hub=(await vite.ssrLoadModule('/src/CefrHub.jsx')).default;let active=false;const props={user:{id:'student'},onBack(){},onPractice(){},onStatus:v=>{active=v}};render(React.createElement(Hub,props));
  await screen.findByRole('button',{name:/Variantni boshlash/});await user.click(screen.getByRole('button',{name:/Variantni boshlash/}));await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Tasdiqlash'}));
  await screen.findByRole('heading',{name:'listening question'});assert.equal(active,true);await user.type(screen.getByLabelText('Javobingiz'),'yes');await user.click(screen.getByRole('button',{name:'Saqlash',exact:true}));await screen.findByText('Serverga saqlandi');
  assert.equal(attempt.answers['listening-1-1'],'yes');cleanup();render(React.createElement(Hub,props));await screen.findByRole('heading',{name:'listening question'});assert.equal(screen.getByLabelText('Javobingiz').value,'yes');
  await user.click(screen.getByRole('button',{name:'Bo‘limni topshirish'}));await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Tasdiqlash'}));await screen.findByRole('heading',{name:'reading question'});
  await user.type(screen.getByLabelText('Javobingiz'),'yes');await user.click(screen.getByRole('button',{name:'Bo‘limni topshirish'}));await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Tasdiqlash'}));await screen.findByRole('heading',{name:'writing question'});
  await user.type(screen.getByLabelText(/Yozma javobingiz/),'A short written response.');await user.click(screen.getByRole('button',{name:'Tugatish',exact:true}));await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Bekor qilish'}));assert.equal(active,true);
  await user.click(screen.getByRole('button',{name:'Tugatish',exact:true}));await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Tasdiqlash'}));await screen.findByText('Javoblaringiz admin tekshiruvini kutmoqda.');assert.equal(active,false);assert.equal(attempt.answers['writing-1-1'],'A short written response.');
  assessment={writing:55,speaking:0,feedback:'Add supporting details.'};await user.click(screen.getByRole('button',{name:'Bahoni yangilash'}));await screen.findByText('Add supporting details.');assert.ok(actions.some(([n,a])=>n==='sq_cefr_admin'&&a.p_action==='publish'));
 }finally{cleanup();delete globalThis.__SINFQUIZ_CEFR_TEST__;await vite.close();dom.window.close()}
});
