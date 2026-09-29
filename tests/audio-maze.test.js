import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {audioMazeLevels,audioMazeTasks,mazePath,validateAudioMazeLevels} from '../src/audio-maze-content.js';

const teacher='20000000-0000-0000-0000-000000000011',teacher2='20000000-0000-0000-0000-000000000012',student='20000000-0000-0000-0000-000000000013',admin='20000000-0000-0000-0000-000000000014';

test('audio maze: twelve distinct maps, accessible gates, five-to-eight valid listening tasks',()=>{
 const info=validateAudioMazeLevels();assert.equal(info.levels,12);assert.equal(info.uniqueMaps,12);assert.equal(info.taskCount,36);
 for(const level of audioMazeLevels){const route=new Set(level.route.map(p=>p.join(',')));assert.equal(level.gateCells.length,level.tasks.length);for(const gate of level.gateCells)assert.ok(route.has(gate.join(',')),`${level.id}: gate ${gate} is on a verified route`);assert.ok(mazePath(level.grid,level.start,level.gateCells[0]));assert.ok(mazePath(level.grid,level.start,level.exit));for(const task of level.tasks){assert.ok(task.audio.length>5);assert.equal(task.options.length,3);assert.ok(task.answer>=0&&task.answer<3);assert.ok(task.translation);assert.equal(new Set(task.options).size,3)}}
 assert.deepEqual([...new Set(audioMazeTasks.map(x=>x.id))].length,audioMazeTasks.length);
});

test('audio maze RLS: teacher ownership, admin approval, active-level-only result insertion',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;
   create table public.documents(collection text,id text,data jsonb,updated_at timestamptz default now(),primary key(collection,id));
   alter table public.documents enable row level security;
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt',true),'')::jsonb,'{}'::jsonb)$$;
   create function public.sq_role() returns text language sql stable security definer as $$select data->>'role' from public.documents where collection='profiles' and id=auth.uid()::text limit 1$$;
   create function public.sq_is_admin() returns boolean language sql stable security definer as $$select lower(coalesce(auth.jwt()->>'email',''))='admin@sinfquiz.uz'$$;
    create function public.sq_is_teacher() returns boolean language sql stable security definer as $$select public.sq_is_admin() or public.sq_role() in ('teacher','admin')$$;
   insert into public.documents(collection,id,data) values
    ('profiles','${teacher}','{"role":"teacher"}'),('profiles','${teacher2}','{"role":"teacher"}'),
    ('profiles','${student}','{"role":"student"}'),('profiles','${admin}','{"role":"admin"}');
   grant usage on schema auth to authenticated;grant execute on all functions in schema auth to authenticated;grant select,insert,update,delete on public.documents to authenticated;`);
  await db.exec(readFileSync(new URL('../supabase-audio-maze.sql',import.meta.url),'utf8'));
  const login=async(uid,email='')=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[uid]);await db.query("select set_config('request.jwt',$1,false)",[JSON.stringify(email?{email}:{})]);await db.exec('set role authenticated')};
  const put=async(collection,id,data)=>db.query('insert into public.documents(collection,id,data) values($1,$2,$3)',[collection,id,JSON.stringify(data)]);
  const activation={id:`a-${teacher}`,ownerId:teacher,ownerName:'Ustoz A',active:true,levelId:'maze-01',taskCount:5};
  const custom={id:'custom-a',ownerId:teacher,title:'Yo‘l so‘rash',mapId:'maze-01',tasks:[{audio:'Turn left at the blue door.',options:['Left','Right','Straight'],answer:0}],visibility:'private',approvalStatus:'pending'};
  await login(teacher);await put('audioMazeLevels','custom-a',custom);
  await login(teacher2);assert.equal((await db.query("select id from public.documents where collection='audioMazeLevels'")).rows.length,0);await assert.rejects(put('audioMazeActivations',`a-${teacher}`,activation));
  await login(student);assert.equal((await db.query("select id from public.documents where collection='audioMazeLevels'")).rows.length,0);await assert.rejects(put('audioMazeResults','forged',{uid:student,ownerId:teacher,levelId:'maze-01',mode:'listen',outcome:'won',tasksTotal:5,correct:5,wrong:0,assisted:0,mistakes:[]}));
  await login(admin);await db.query("update public.documents set data=data||'{\"visibility\":\"public\",\"approvalStatus\":\"approved\"}'::jsonb where collection='audioMazeLevels' and id='custom-a'");
  await login(student);assert.equal((await db.query("select id from public.documents where collection='audioMazeLevels'")).rows.length,1);
  await login(teacher);await put('audioMazeActivations',activation.id,activation);
  await login(student);await put('audioMazeResults','result-a',{uid:student,ownerId:teacher,levelId:'maze-01',mode:'listen',outcome:'won',tasksTotal:5,correct:5,wrong:0,assisted:0,mistakes:[],name:'Ali'});
  assert.equal((await db.query("select id from public.documents where collection='audioMazeResults'")).rows.length,1);assert.equal((await db.query("update public.documents set data=data||'{\"correct\":0}'::jsonb where collection='audioMazeResults' and id='result-a' returning id")).rows.length,0);
  await login(teacher);assert.equal((await db.query("select id from public.documents where collection='audioMazeResults'")).rows.length,1);
  await login(teacher2);assert.equal((await db.query("select id from public.documents where collection='audioMazeResults'")).rows.length,0);
  await login(admin);await db.query("update public.documents set data=data||'{\"active\":false}'::jsonb where collection='audioMazeActivations' and id=$1",[`a-${teacher}`]);
 }finally{await db.close()}
});

test('audio maze UI is wired into guest home and teacher/admin panels',()=>{
 const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8'),ui=readFileSync(new URL('../src/EnglishAudioMaze.jsx',import.meta.url),'utf8'),data=readFileSync(new URL('../src/supabase-data.js',import.meta.url),'utf8');
 assert.match(app,/import EnglishAudioMaze from '\.\/EnglishAudioMaze\.jsx'/);assert.doesNotMatch(app,/React\.lazy\(\(\)=>import\('\.\/EnglishAudioMaze\.jsx'\)\)/);assert.match(app,/onAudioMaze=\{\(\)=>\{setView\('audioMaze'\);location\.hash='audio-maze'\}\}/);assert.match(app,/section==='audioMaze'/);assert.match(ui,/onPlayingChange/);assert.match(ui,/SpeechSynthesisUtterance/);assert.match(data,/audioMazeActivations/);assert.match(data,/audioMazeResults/);
});

test('Audio Labyrinth renders its active map after opening, without a separate chunk fetch',async()=>{
 const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost:5173',pretendToBeVisual:true});
 for(const key of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[key]=dom.window[key];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.matchMedia=globalThis.matchMedia;globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.__SINFQUIZ_LEGACY_TEST__=true;
 globalThis.fetch=async path=>new Response(JSON.stringify(path==='/api/audio-maze/active'?{active:[{id:'activation-a',ownerId:'teacher-a',ownerName:'Ustoz',level:audioMazeLevels[0]}]}:{}),{status:200,headers:{'Content-Type':'application/json'}});
 const React=(await import('react')).default,{render,screen,cleanup}=await import('@testing-library/react'),vite=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{const {default:Maze}=await vite.ssrLoadModule('/src/EnglishAudioMaze.jsx');render(React.createElement(Maze,{user:{id:'student-a',role:'student',name:'O‘quvchi'}}));await screen.findByRole('heading',{name:'O‘yin xaritasini tanlang'});assert.ok(screen.getByRole('button',{name:/Boshlash/}));assert.ok(screen.getByText(/A1/))}
 finally{cleanup();await vite.close();dom.window.close()}
});
