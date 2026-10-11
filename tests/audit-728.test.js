import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {securePlayFixture,teacher,otherTeacher,student,outsider,question} from './secure-play-fixture.js';
import {orderedPages} from '../src/ordered-pages.js';
import {newTable,tableCellAt,resizeTableCells} from '../src/classroom/table-model.js';
import {typingPreview} from '../src/competition-typing.js';
import {validateBoardObject,validateClassroom,freshClassroom,translateObject,resizeObject} from '../src/classroom/model.js';
const migration=readFileSync(new URL('../supabase-migration-7.28.sql',import.meta.url),'utf8');
test('Live typing preview counts an early dropped/extra letter without cascading errors or penalizing the untyped tail',()=>{
 assert.equal(typingPreview('I go to school every day.','I go').accuracy,100);
 assert.equal(typingPreview('I go to school every day.',' go to school').distance,1);
 assert.equal(typingPreview('I go to school every day.','XI go to school').distance,1);
 assert.equal(typingPreview('O‘quvchi yozishni o‘rganadi.','‘quvchi yozishni').distance,1);
 assert.equal(typingPreview('abc','').accuracy,100);
});
test('7.28 ordered pagination reads 1,203 records without dropping or repeating rows',async()=>{
 const records=Array.from({length:1203},(_,i)=>({id:String(i).padStart(6,'0')})),calls=[];
 const rows=await orderedPages(async(after,size)=>{calls.push([after,size]);return records.filter(r=>r.id>after).slice(0,size)});
 assert.deepEqual(rows,records);assert.equal(calls.length,3);
 assert.equal((await orderedPages(async(a,n)=>records.filter(r=>r.id>a).slice(0,n),{limit:51})).length,51);
 await assert.rejects(orderedPages(async()=>[{id:'a'},{id:'a'}]),/tartibi/);
});
test('Native table keeps cells through moving, resizing, draft recovery and changing dimensions',()=>{
 const table=newTable(4,3);table.cells[0]=['Ism','Ball','Izoh'];table.cells[2][1]='20';
 assert.deepEqual(tableCellAt(table,{x:table.x+1,y:table.y+table.h*.55}),{row:2,column:0});
 assert.equal(tableCellAt(table,{x:-1,y:0}),null);
 const moved=translateObject(table,20,30),resized=resizeObject(moved,1300,420);assert.deepEqual(resized.cells,table.cells);
 const changed=resizeTableCells(resized,6,4);assert.equal(changed.cells[2][1],'20');assert.equal(changed.cells[5][3],'');
 const d=freshClassroom();d.pages[0].objects=[changed];assert.equal(validateClassroom(d).pages[0].objects[0].cells[2][1],'20');
 assert.equal(validateBoardObject({...table,cells:[['a'],['a','b']]}),null);
});
test('7.28 PostgreSQL audit regression: grading, isolation, unique codes, counters, rollback and full bulk',async t=>{
 const f=await securePlayFixture(),{db,login,rpc,quiz}=f;
 const root=async()=>db.exec('reset role');
 const admin='72800000-0000-0000-0000-000000000001';
 let race1,race2,typing1,typing2;
 try{
  await root();await db.query("insert into public.documents(collection,id,data) values('quizzes','duplicate',$1)",[JSON.stringify({...quiz,id:'duplicate',ownerId:otherTeacher,visibility:'private'})]);
  await db.exec(migration);await db.exec(migration);
  await t.test('Migration repairs conflicting active PINs and reruns without data loss',async()=>{
   const pins=(await db.query("select data->>'pin' pin from public.documents where collection='quizzes'")).rows.map(r=>r.pin);assert.equal(new Set(pins).size,2);assert.equal((await rpc('sq_schema_status')).version,'7.28.0');
  });
  await t.test('Other teacher cannot read a private active quiz or its answer key',async()=>{
   await login(otherTeacher);assert.equal((await db.query("select * from public.documents where collection='quizzes' and id=$1",[quiz.id])).rows.length,0);
   const catalog=await rpc('sq_quiz_catalog');assert.equal(catalog.length,1);assert.equal(catalog[0].pin,quiz.pin);assert.ok(!('questions' in catalog[0]));
   await assert.rejects(rpc('sq_quiz_save',[quiz.id,{...quiz,title:'Hijack'}]),/boshqa ustoz/);
  });
  await t.test('Server PIN allocation resolves activation collision and unique index blocks bypass',async()=>{
   const saved=await rpc('sq_quiz_save',['new-other',{...quiz,id:'new-other',pin:quiz.pin,ownerId:otherTeacher}]);assert.notEqual(saved.pin,quiz.pin);
   await assert.rejects(db.query("insert into public.documents(collection,id,data) values('quizzes','bypass',$1)",[JSON.stringify({...saved,id:'bypass',pin:quiz.pin})]),/unique|duplicate/);
   await assert.rejects(db.query("insert into public.documents(collection,id,data) values('quizzes','bad-pin',$1)",[JSON.stringify({...saved,id:'bad-pin',pin:null})]),/row-level security/);
  });
  await t.test('Forged Python stdout never earns ranking points',async()=>{
   await root();const grade=await rpc('sq_comp_grade',[{type:'python',answer:'42'},JSON.stringify({code:'pass # audit',output:'42'})]);assert.equal(grade.ratio,0);assert.equal(grade.practiceOnly,true);
   await login(teacher);await rpc('sq_quiz_save',['python-audit',{...quiz,id:'python-audit',pin:'789012',questions:[{id:'py',type:'python',answer:'42',text:'42 ni chiqaring',points:200,time:300}]}]);
   await login(student);const session=await rpc('sq_quiz_join',['python-audit','789012','Sinov','🦊']);const answer=await rpc('sq_quiz_action',[session.player.id,'answer',{questionId:'py',value:JSON.stringify({code:'pass # audit',output:'42'})}]);assert.equal(answer.player.score,0);assert.equal(answer.feedback.practiceOnly,true);
  });
  await t.test('Two teachers activate independent race and typing rooms; students must select one',async()=>{
   await login(teacher);race1=(await rpc('sq_room_manage',['race',true,{quizId:quiz.id,questionIds:['q1','q2']}])).room;typing1=(await rpc('sq_room_manage',['typing',true])).room;
   await login(otherTeacher);race2=(await rpc('sq_room_manage',['race',true,{quizId:'new-other',questionIds:['q1','q2']}])).room;typing2=(await rpc('sq_room_manage',['typing',true])).room;
   assert.notEqual(race1.id,race2.id);assert.notEqual(typing1.code,typing2.code);
   assert.equal((await rpc('sq_room_staff')).race.id,race2.id);
   await login(student);assert.equal((await rpc('sq_room_catalog',['race'])).rooms.length,2);
   await assert.rejects(rpc('sq_race_action',['join',null,[],{name:'S',avatar:'a'}]),/yopilgan/);
   assert.equal((await db.query('select * from public.sq_live_rooms').catch(()=>({rows:[]}))).rows.length,0);
   const joined=await rpc('sq_race_action',['join',race1.id,[],{players:[{name:'Ali',avatar:'a'},{name:'Vali',avatar:'b'}]}]);assert.equal(joined.race.id,race1.id);assert.equal(joined.playerIds.length,2);assert.ok(!('questionsByLane' in joined.race));
   await login(outsider);await assert.rejects(rpc('sq_race_action',['session',race1.id,joined.playerIds,{}]),/tegishli emas/);
   await login(otherTeacher);await rpc('sq_room_manage',['race',false]);await login(student);assert.equal((await rpc('sq_room_catalog',['race'])).rooms.length,0);
   await login(teacher);assert.equal((await rpc('sq_room_staff')).race.id,race1.id);await login(student);
  });
  await t.test('An authenticated anonymous UID without a profile cannot manage rooms or start a national exam',async()=>{
   const guest='72800000-0000-0000-0000-000000000009';await root();await db.query('insert into auth.users values($1)',[guest]);await login(guest);
   await assert.rejects(rpc('sq_room_manage',['typing',true]),/Ustoz/);
   await assert.rejects(rpc('sq_room_staff'),/Ustoz/);
   await assert.rejects(rpc('sq_national_action',['start',null,{sectionId:'national-audit'}]),/Hisob|kiring/);
   await login(student);
  });
  await t.test('Direct client writes of invented typing/national/activity results are denied',async()=>{
   for(const collection of ['typingResults','nationalResults','userActivity'])await assert.rejects(db.query('insert into public.documents(collection,id,data) values($1,$2,$3)',[collection,'forged-'+collection,JSON.stringify({uid:student,ownerId:teacher,averageWpm:100000,stages:[1,2,3,4,5],score:75})]),/row-level security/);
  });
  await t.test('Typing grades canonical content, server elapsed time and fair edit distance; rejects replay/UID substitution',async()=>{
   let s=await rpc('sq_typing_action',['join',null,{roomId:typing1.id,name:'O‘quvchi',avatar:'a',courseMode:'english',englishLevel:'A1'}]);const id=s.playerId;
   assert.equal(s.stageCount,5);assert.ok(!('stages' in s));
   s=await rpc('sq_typing_action',['start',id,{}]);await assert.rejects(rpc('sq_typing_action',['submit',id,{value:s.stage.text,elapsedMs:999999,accuracy:100}]),/juda tez|vaqt/);
   for(let i=0;i<5;i++){
    if(i)s=await rpc('sq_typing_action',['start',id,{}]);await root();await db.query("update public.sq_typing_sessions set data=jsonb_set(data,'{stageStartedAt}',to_jsonb(floor(extract(epoch from clock_timestamp())*1000)::bigint-60000)) where id=$1",[id]);await login(student);
    s=await rpc('sq_typing_action',['submit',id,{value:s.stage.text.slice(1),accuracy:100,wpm:100000}]);assert.equal(s.feedback.errors,1);assert.ok(s.feedback.accuracy>90);assert.ok(s.feedback.wpm<300);
    const replay=await rpc('sq_typing_action',['submit',id,{value:'tamper'}]);assert.equal(replay.index,s.index);
   }
   assert.equal(s.finished,true);const rows=(await db.query("select data from public.documents where collection='typingResults' and id=$1",[id])).rows;assert.equal(rows.length,1);assert.equal(rows[0].data.verified,true);assert.equal(rows[0].data.ownerId,teacher);
   await login(outsider);await assert.rejects(rpc('sq_typing_action',['session',id,{}]),/topilmadi/);await login(student);
  });
  let section;
  await t.test('National catalog and unfinished session contain no answer keys',async()=>{
   await root();await db.query("select set_config('request.uid',$1,false)",[teacher]);await db.exec("create or replace function auth.jwt() returns jsonb language sql stable as $$select '{\"email\":\"admin@sinfquiz.uz\"}'::jsonb$$;");section={id:'national-audit',title:'Aralash matematika',subject:'Matematika',ownerId:teacher,visibility:'public',approvalStatus:'approved',durationMinutes:60,questions:Array.from({length:30},(_,i)=>({...question('n'+i,0),explanation:'2 + 2 = 4.'}))};await db.query("insert into public.documents(collection,id,data) values('nationalSections',$1,$2)",[section.id,JSON.stringify(section)]);await root();await db.exec("create or replace function auth.jwt() returns jsonb language sql stable as $$select '{\"email\":\"admin@sinfquiz.uz\"}'::jsonb$$;update public.documents set data=data||'{\"approvalStatus\":\"approved\",\"visibility\":\"public\"}'::jsonb where collection='nationalSections';create or replace function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;");await login(student);
   assert.equal((await db.query("select * from public.documents where collection='nationalSections'")).rows.length,0);assert.ok(!(await rpc('sq_national_catalog')).sections[0].questions);
   const s=await rpc('sq_national_action',['start',null,{sectionId:section.id}]);assert.ok(!('correct' in s.question));assert.deepEqual(s.review,[]);assert.equal(s.result,null);
   await assert.rejects(rpc('sq_national_action',['start',null,{sectionId:'nonexistent'}]),/variantni/);
  });
  await t.test('National grading ignores forged score, finishes idempotently and releases full mistake review',async()=>{
   let s=await rpc('sq_national_action',['start',null,{sectionId:section.id}]);const id=s.attemptId;
   for(let i=0;i<30;i++){s=await rpc('sq_national_action',['navigate',id,{index:i}]);s=await rpc('sq_national_action',['answer',id,{value:i===0?1:0,score:999}]);}
   s=await rpc('sq_national_action',['finish',id,{score:75,correct:30}]);assert.equal(s.result.correct,29);assert.equal(s.result.score,72.5);assert.equal(s.review.length,30);assert.equal(s.review[0].correct,false);assert.equal(s.review[0].correctText,'4');assert.equal((await rpc('sq_national_action',['finish',id,{}])).result.correct,29);
   await login(outsider);await assert.rejects(rpc('sq_national_action',['session',id,{}]),/topilmadi/);await login(student);
   let expired=await rpc('sq_national_action',['start',null,{sectionId:section.id}]);await root();await db.query("update public.sq_national_sessions set data=jsonb_set(data,'{endsAt}','1') where id=$1",[expired.attemptId]);await login(student);expired=await rpc('sq_national_action',['answer',expired.attemptId,{value:0}]);assert.equal(expired.finishReason,'time');assert.equal(expired.result.correct,0);
  });
  await t.test('Batch rolls back earlier changes if a later operation fails RLS',async()=>{
   await login(teacher);await assert.rejects(rpc('sq_documents_batch',[[{op:'set',collection:'lessons',id:'rollback',data:{ownerId:teacher,title:'draft',visibility:'private'}},{op:'set',collection:'quizzes',id:'forbidden-owner',data:{...quiz,ownerId:otherTeacher}}]]),/row-level security/);
   assert.equal((await db.query("select * from public.documents where collection='lessons' and id='rollback'")).rows.length,0);
   await rpc('sq_documents_batch',[[{op:'set',collection:'lessons',id:'merge',data:{ownerId:teacher,title:'one',visibility:'private'}},{op:'merge',collection:'lessons',id:'merge',data:{summary:'two'}}]]);assert.equal((await db.query("select data from public.documents where collection='lessons' and id='merge'")).rows[0].data.title,'one');
  });
  await t.test('Server counters are session-idempotent and analytics counts exceed 500 users',async()=>{
   await login(student);await rpc('sq_record_activity',['login','same']);await rpc('sq_record_activity',['login','same']);await rpc('sq_record_activity',['logout','same']);assert.equal((await db.query("select data from public.documents where collection='userActivity'")).rows[0].data.loginCount,1);
   await assert.rejects(rpc('sq_admin_analytics'),/Administrator/);
   await root();await db.query('insert into auth.users values($1)',[admin]);await db.exec(`create or replace function auth.jwt() returns jsonb language sql stable as $$select case when auth.uid()='${admin}'::uuid then '{"email":"admin@sinfquiz.uz"}'::jsonb else '{}'::jsonb end$$;`);
   await db.query("insert into public.documents(collection,id,data) select 'profiles','bulk-user-'||lpad(n::text,4,'0'),jsonb_build_object('role','student','name','User '||n,'email','user'||n||'@example.test') from generate_series(1,603) n");await login(admin);let a=await rpc('sq_admin_analytics');assert.equal(a.totalUsers,607);assert.equal(a.users.length,50);let count=a.users.length;while(a.nextCursor){a=await rpc('sq_admin_analytics',[a.nextCursor]);count+=a.users.length;}assert.equal(count,607);assert.equal((await rpc('sq_admin_analytics',['','User 603','student'])).users.length,1);
  });
  await t.test('A bulk clear removes 1,003 results atomically and preserves the other teacher',async()=>{
   await root();await db.query("select set_config('request.uid',$1,false)",[student]);
   await db.query("insert into public.documents(collection,id,data) select 'players','bulk-result-'||n,jsonb_build_object('id','bulk-result-'||n,'uid',$1::text,'ownerId',$2::text,'quizId',$3::text,'score',n,'name','Bulk','correct',0,'answers',0) from generate_series(1,1003) n",[student,teacher,quiz.id]);
   await db.query("insert into public.documents(collection,id,data) values('typingResults','other-result',$1)",[JSON.stringify({uid:student,ownerId:otherTeacher,verified:true})]);
   await login(teacher);await rpc('sq_owned_bulk',['players-reset']);assert.equal((await db.query("select * from public.documents where collection='players' and data->>'ownerId'=$1",[teacher])).rows.length,0);await rpc('sq_owned_bulk',['typing-reset']);
   await root();assert.equal((await db.query("select * from public.documents where id='other-result'")).rows.length,1);await db.exec(migration);assert.equal((await db.query("select * from public.documents where id='other-result'")).rows.length,1);
  });
  await t.test('Restrictive guards survive a mistakenly replayed permissive 7.6 policy',async()=>{
   await root();await db.exec(readFileSync(new URL('../supabase-migration-7.6.sql',import.meta.url),'utf8'));
   await login(otherTeacher);assert.equal((await db.query("select * from public.documents where collection='quizzes' and id=$1",[quiz.id])).rows.length,0);
   await login(student);await assert.rejects(db.query("insert into public.documents(collection,id,data) values('typingResults','legacy-policy-bypass',$1)",[JSON.stringify({uid:student,ownerId:teacher,averageWpm:999})]),/row-level security/);
   await root();await db.exec(migration);
  });
 }finally{await db.close()}
});
