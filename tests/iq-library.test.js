import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';
import {buildBank} from '../data/iq/build-bank.js';import {scorePractice} from '../src/iq/model.js';import {practiceItems} from '../src/iq/practice.js';
import {builtinBooks,availableBooks,filterBooks,subjectId} from '../src/textbooks/model.js';
import {learningFixture,ids} from './learning-fixture.js';
const bank=buildBank(),pointKey=p=>JSON.stringify(p.map(x=>x.join(',')).sort());
test('144 original reasoning items have one distinct valid key; shapes, number rules and diagrams agree',()=>{
 assert.equal(bank.length,144);assert.equal(new Set(bank.map(x=>x.id)).size,144);assert.equal(new Set(bank.map(x=>JSON.stringify([x.prompt,x.visual]))).size,144);
 for(const b of [0,1,2])for(const d of ['patterns','numbers','logic','spatial'])assert.equal(bank.filter(x=>x.band===b&&x.domain===d).length,12);
 for(const q of bank){const p=q.parameters,answer=q.options[q.answer];assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(x=>Array.isArray(x)?pointKey(x):JSON.stringify(x))).size,4,q.id);assert.ok(q.explanation.length>35,q.id);let expected;
  switch(q.rule){case 'arithmetic':expected=q.visual.values.at(-1)+(q.visual.values[1]-q.visual.values[0]);break;case 'secondDifference':{const s=q.visual.values,d=s.slice(1).map((x,i)=>x-s[i]),dd=d[1]-d[0];expected=s.at(-1)+d.at(-1)+dd;break}case 'geometric':expected=q.visual.values.at(-1)*q.visual.values[1]/q.visual.values[0];break;case 'rowSum':expected=q.visual.cells[6]+q.visual.cells[7];break;case 'latin':expected=[0,1,2].find(x=>!q.visual.cells.slice(6,8).includes(x));break;case 'xor':expected=q.visual.cells[6]^q.visual.cells[7];break;case 'arrow':expected=(q.visual.values.at(-1)+p.step)%4;break;case 'rotation':{const pts=p.points.map(([x,y])=>{for(let i=0;i<p.k;i++)[x,y]=[2-y,x];return[x,y]});assert.equal(pointKey(answer),pointKey(pts),q.id);break}case 'reflection':assert.equal(pointKey(answer),pointKey(p.points.map(([x,y])=>[2-x,y])),q.id);break;case 'inclusion':assert.equal(answer,`Barcha ${p.names[0]} — ${p.names[2]}.`);break;case 'ordering':assert.equal(answer,p.names[0]);break;case 'contrapositive':assert.equal(answer,`P — ${p.names[0]} emas.`);break;default:assert.fail(q.rule)}if(expected!==undefined)assert.equal(answer,expected,q.id);
 }
});
test('198 ordered textbooks and teacher edits remain available without leaking drafts or private answer banks',()=>{
 assert.deepEqual(Object.fromEntries(['chemistry','english','biology','informatics'].map(s=>[s,builtinBooks.filter(b=>b.subject===s).length])),{chemistry:12,english:108,biology:30,informatics:48});
 assert.equal(new Set(builtinBooks.map(b=>b.id)).size,198);
 for(const b of builtinBooks){assert.ok(b.title&&b.summary);if(b.kind==='science'){assert.ok(b.example.length>100&&b.activity.length>55,b.id);assert.ok(b.diagram.length===3&&b.checks.length===1);assert.ok(b.prerequisites.every(id=>builtinBooks.some(x=>x.id===id)),b.id)}if(b.kind==='english')assert.equal(b.content,undefined)}
 const docs=[{id:'admin-computer-intro',sourcePackage:'computer-course-v2',subject:'Kompyuter asoslari',title:'Admin tahriri',summary:'Tahrir saqlanadi',visibility:'public',ownerId:ids.admin,ownerName:'Ustoz A'}, {id:'draft',subject:'Kimyo',title:'Maxfiy qoralama',visibility:'private',ownerId:ids.teacher},{id:'public',subject:'Biologiya',title:'Ustoz B mavzusi',visibility:'public',ownerId:ids.stranger}];
 const all=availableBooks(docs,{id:ids.student,role:'student'});assert.equal(all.find(x=>x.id==='book-computer-computer-intro').title,'Admin tahriri');assert.ok(!all.some(x=>x.title==='Maxfiy qoralama'));assert.equal(filterBooks(all,{query:'Ustoz B mavzusi'})[0].document.ownerId,ids.stranger);assert.ok(availableBooks(docs,{id:ids.teacher,role:'teacher'}).some(x=>x.title==='Maxfiy qoralama'));assert.equal(subjectId('Microsoft Excel'),'informatics');assert.ok(filterBooks(all,{query:'fotosintez'}).length>=1);
});
test('practice scoring is criterion based, treats blanks as zero and never invents IQ or a percentile',()=>{
 const answers=Object.fromEntries(practiceItems.map(q=>[q.id,q.answer])),result=scorePractice(practiceItems,answers);assert.equal(result.correct,12);assert.equal(result.percent,100);assert.ok(!('iq' in result));assert.ok(!('percentile' in result));assert.equal(scorePractice(practiceItems,{}).answered,0);assert.equal(scorePractice(practiceItems,{}).percent,0);
});
test('small English SQL chunks are complete, ordered and preserve all 108 original insert statements',()=>{
 const dir=new URL('../sql/english-7.23/',import.meta.url),files=readdirSync(dir).filter(x=>x.endsWith('.sql')).sort();assert.equal(files.length,18);const original=readFileSync(new URL('../generated/english-course-seed.sql',import.meta.url),'utf8').split('\n').filter(Boolean);
 assert.deepEqual(files.slice(1).flatMap(f=>readFileSync(new URL(f,dir),'utf8').split('\n').filter(l=>l.startsWith('insert into '))),original);for(const f of files)assert.ok(readFileSync(new URL(f,dir)).length<151000);assert.equal(readFileSync(new URL(files[0],dir),'utf8'),readFileSync(new URL('../data/english-course/schema.sql',import.meta.url),'utf8'));
});
test('real Postgres IQ scoring, deadlines, idempotence, restart, revision conflicts and teacher isolation',async t=>{
 const f=await learningFixture();try{
  let r;const mutation=(run,choice,questionId=run.items[0].id)=>({id:run.id,questionId,choice,token:crypto.randomUUID(),expectedRevision:run.revision});
  await t.test('anonymous reads denied; opening a test supplies 32 balanced tasks without keys',async()=>{
   await assert.rejects(f.call(null,'home'),/permission denied/);r=await f.call(ids.student,'start',{band:1,mode:'timed'});assert.equal(r.items.length,32);for(const d of ['patterns','numbers','logic','spatial'])assert.equal(r.items.filter(x=>x.domain===d).length,8);for(const q of r.items)assert.deepEqual(Object.keys(q).sort(),['domain','id','options','prompt','visual']);assert.equal((new Date(r.deadline)-new Date(r.startedAt))/60000,24);assert.equal((await f.call(ids.student,'start',{band:2,mode:'extended'})).id,r.id);
  });
  await t.test('other pupil cannot open or mutate a run; direct tables and helper functions are private',async()=>{
   await assert.rejects(f.call(ids.other,'run',{id:r.id}),/ruxsat/);await assert.rejects(f.call(ids.other,'answer',mutation(r,1)),/ruxsat/);
   await f.db.exec('set role authenticated');for(const table of ['sq_iq_items','sq_iq_runs','sq_iq_actions','sq_book_reads'])await assert.rejects(f.db.query(`select * from public.${table}`),/permission denied/);await assert.rejects(f.db.query('select public.sq_iq_close($1)',[r.id]),/permission denied/);await f.db.exec('reset role');
  });
  await t.test('answers save only at expected revision, duplicate tokens are idempotent, choice bounds are enforced',async()=>{
   const p=mutation(r,2);r=await f.call(ids.student,'answer',p);assert.equal(r.answers[p.questionId],2);const same=await f.call(ids.student,'answer',p);assert.equal(same.revision,r.revision);await assert.rejects(f.call(ids.student,'answer',{...p,choice:1}),/boshqa/);await assert.rejects(f.call(ids.student,'answer',{...mutation(r,1),expectedRevision:0}),/Boshqa oynada/);await assert.rejects(f.call(ids.student,'answer',mutation(r,4)),/noto‘g‘ri/);await assert.rejects(f.call(ids.student,'answer',mutation(r,1,'unknown')),/noto‘g‘ri/);await assert.rejects(f.call(ids.student,'answer',mutation(r,1.5)),/noto‘g‘ri/);
  });
  await t.test('all correct keys score 32 without client score input; finished runs cannot change and reports stay private',async()=>{
   const privateBank=(await f.db.query('select bank from public.sq_iq_runs where id=$1',[r.id])).rows[0].bank;
   for(const q of privateBank)r=await f.call(ids.student,'answer',{...mutation(r,q.answer,q.id),score:999999});
   const finish={id:r.id,token:crypto.randomUUID(),expectedRevision:r.revision};r=await f.call(ids.student,'finish',finish);assert.equal(r.result.correct,32);assert.equal(r.result.percent,100);assert.deepEqual(r.result.profile.map(p=>p.correct),[8,8,8,8]);assert.ok(r.items.every(x=>'answer' in x&&'explanation' in x));assert.equal((await f.call(ids.student,'finish',finish)).revision,r.revision);assert.equal((await f.call(ids.student,'answer',mutation(r,3))).result.correct,32);assert.ok(!('iq' in r.result));assert.equal((await f.call(ids.teacher,'staff')).rows.length,1);assert.equal((await f.call(ids.stranger,'staff')).rows.length,0);await assert.rejects(f.call(ids.student,'staff'),/ruxsati/);
  });
  await t.test('extended time, blank answers, server deadline, settings and migration rerun retain results',async()=>{
   r=await f.call(ids.student,'start',{band:2,mode:'extended'});assert.equal((new Date(r.deadline)-new Date(r.startedAt))/60000,48);await f.db.query("update public.sq_iq_runs set deadline=clock_timestamp()-interval '1 second' where id=$1",[r.id]);r=await f.call(ids.student,'answer',mutation(r,0));assert.equal(r.status,'finished');assert.equal(r.result.correct,0);assert.equal(r.result.answered,0);await assert.rejects(f.call(ids.teacher,'settings',{active:false}),/administrator/);await f.call(ids.admin,'settings',{active:false});await assert.rejects(f.call(ids.other,'start',{band:0,mode:'timed'}),/yopiq/);await f.call(ids.admin,'settings',{active:true});for(const file of ['01-schema.sql','02-iq-band-1.sql','03-iq-band-2.sql','04-iq-band-3.sql','05-book-keys.sql'])await f.db.exec(readFileSync(new URL('../sql/7.25/'+file,import.meta.url),'utf8'));assert.equal((await f.call(ids.student,'home')).history.length,2);
  });
  await t.test('complete single-file installer keeps all items, result snapshots and book keys on rerun',async()=>{
   const installer=readFileSync(new URL('../supabase-migration-7.25.sql',import.meta.url),'utf8');assert.ok(Buffer.byteLength(installer)<150000);await f.db.exec(installer);assert.equal((await f.db.query('select count(*) n from public.sq_iq_items')).rows[0].n,144);assert.equal((await f.db.query('select count(*) n from public.sq_book_keys')).rows[0].n,198);assert.equal((await f.call(ids.student,'home')).history.length,2);
  });
  await t.test('book reads count distinct identities without exposing reader names; SQL input remains plain data',async()=>{
   const id='book-biology-plant-cell';let p=await f.call(ids.student,'mark',{id},'sq_books');assert.equal(p[id].read,true);assert.equal(p[id].count,1);p=await f.call(ids.student,'mark',{id},'sq_books');assert.equal(p[id].count,1);p=await f.call(ids.other,'mark',{id},'sq_books');assert.equal(p[id].count,2);assert.ok(!('users' in p[id]));await assert.rejects(f.call(ids.other,'mark',{id:"';drop table public.documents;--"},'sq_books'),/topilmadi/);assert.equal((await f.db.query('select count(*) n from public.documents')).rows[0].n,5);
  });
 }finally{await f.db.close()}
});
