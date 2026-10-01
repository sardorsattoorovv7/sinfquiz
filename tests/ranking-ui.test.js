import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';

test('finished six-digit quiz displays 1st/2nd/3rd for legacy server rows, refreshes and handles missing rank',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:5173/#play',pretendToBeVisual:true});
 for(const key of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[key]=dom.window[key];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});window.scrollTo=()=>{};window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});globalThis.matchMedia=window.matchMedia;globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.__SINFQUIZ_LEGACY_TEST__=true;
 const players=[{id:'p1',name:'Ali',score:3000,correct:3,avatar:'🐼',startedAt:1,finishedAt:2},{id:'p2',name:'Vali',score:1800,correct:2,avatar:'🐼',startedAt:1,finishedAt:3},{id:'p3',name:'Zebo',score:900,correct:1,avatar:'🐼',startedAt:1,finishedAt:4}];let selected=0,ranking=players;
 globalThis.fetch=async url=>new Response(JSON.stringify(url==='/auth/session'?{user:null}:url==='/api/play/session'?{finished:true,quiz:{id:'q1',title:'Olti xonali test',questionCount:3},player:players[selected],ranking}:{}),{status:200,headers:{'Content-Type':'application/json'}});
 const React=(await import('react')).default,{render,screen,cleanup,waitFor}=await import('@testing-library/react'),user=(await import('@testing-library/user-event')).default.setup(),vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{const {default:App}=await vite.ssrLoadModule('/src/App.jsx');for(selected=0;selected<3;selected++){render(React.createElement(App));await screen.findByRole('heading',{name:`Barakalla, ${players[selected].name}!`});assert.equal(document.querySelector('.result-rank strong').textContent,`${selected+1}-o‘rin`);cleanup()}
 selected=2;render(React.createElement(App));await screen.findByRole('heading',{name:'Barakalla, Zebo!'});ranking=players.map(p=>p.id==='p3'?{...p,score:4000}:p);await user.click(screen.getByRole('button',{name:'Reytingni yangilash'}));await waitFor(()=>assert.equal(document.querySelector('.result-rank strong').textContent,'1-o‘rin'));
 ranking=[];await user.click(screen.getByRole('button',{name:'Reytingni yangilash'}));await screen.findByText('O‘rin aniqlanmadi. Reyting ma’lumotini qayta oling.');assert.equal(document.querySelector('.result-rank strong'),null);
 }finally{cleanup();await vite.close();dom.window.close()}
});
