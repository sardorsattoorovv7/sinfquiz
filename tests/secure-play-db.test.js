import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {PGlite} from '@electric-sql/pglite';
import {securePlayFixture as setup,teacher,student,outsider,otherTeacher,question} from './secure-play-fixture.js';
test('7.26.2: students cannot fetch answer keys, forge scores, impersonate sessions or bypass server deadlines',async()=>{
 const {db,login,rpc,quiz}=await setup();try{
  await login(student);assert.equal((await db.query("select * from public.documents where collection='quizzes'")).rows.length,0);
  const catalog=await rpc('sq_quiz_catalog');assert.equal(catalog[0].questionCount,2);assert.equal(catalog[0].questions,undefined);
  assert.equal((await rpc('sq_quiz_ticket',['123456'])).ticket,quiz.id);
  let state=await rpc('sq_quiz_join',[quiz.id,'123456','Aziza','🦊']),id=state.player.id;
  assert.equal(state.question.correct,undefined);assert.equal(state.question.answer,undefined);
  const spoof=await db.query("update public.documents set data=data||'{\"score\":1000000}'::jsonb where collection='players' and id=$1 returning id",[id]);assert.equal(spoof.rows.length,0);
  await assert.rejects(db.query('select * from public.sq_quiz_sessions'),/permission denied/);
  state=await rpc('sq_quiz_action',[id,'answer',{questionId:'q1',value:1,score:1000000}]);assert.equal(state.player.correct,1);assert.ok(state.player.score<=100);const score=state.player.score;
  state=await rpc('sq_quiz_action',[id,'answer',{questionId:'q1',value:1}]);assert.equal(state.player.answers,1);assert.equal(state.player.score,score);
  state=await rpc('sq_quiz_action',[id,'next',{}]);assert.equal(state.question.id,'q2');
  await assert.rejects(rpc('sq_quiz_action',[id,'answer',{questionId:'q1',value:1}]),/Savol yangilangan/);
  await db.exec('reset role');await db.query('update public.sq_quiz_sessions set deadline=0 where id=$1',[id]);await login(student);
  state=await rpc('sq_quiz_action',[id,'answer',{questionId:'q2',value:0}]);assert.equal(state.feedback.expired,true);assert.equal(state.feedback.earned,0);
  state=await rpc('sq_quiz_action',[id,'next',{}]);assert.equal(state.finished,true);assert.equal(state.player.answers,2);assert.equal(state.ranking[0].score,score);
  await login(outsider);await assert.rejects(rpc('sq_quiz_action',[id,'session',{}]),/sessiyasi/);assert.equal((await db.query("select * from public.documents where collection='players'")).rows.length,0);
  let second=await rpc('sq_quiz_join',[quiz.id,'123456','Vali','🐼']);
  second=await rpc('sq_quiz_action',[second.player.id,'answer',{questionId:'q1',value:0}]);
  second=await rpc('sq_quiz_action',[second.player.id,'next',{}]);
  second=await rpc('sq_quiz_action',[second.player.id,'answer',{questionId:'q2',value:1}]);
  second=await rpc('sq_quiz_action',[second.player.id,'next',{}]);
  assert.equal(second.ranking.length,2);assert.equal(second.ranking[0].id,id);assert.equal(second.ranking[1].id,second.player.id);
  await login(otherTeacher);assert.equal((await db.query("select * from public.documents where collection='players'")).rows.length,0);
  await login(teacher);assert.equal((await db.query("select * from public.documents where collection='players'")).rows.length,2);
 }finally{await db.close()}
});
test('7.26.2: split race grades on the server, rejects unrelated writes and duplicate/replayed answers',async()=>{
 const {db,login,rpc}=await setup();try{
  const race={id:'race-one',active:true,ownerId:teacher,title:'1v1',phase:'lobby',questionCount:2,questionsByLane:[[question('a1'),question('a2')],[question('b1',0),question('b2')]],racers:[],winnerId:null};
  await login(teacher);await db.query("insert into public.documents(collection,id,data) values('live','race',$1)",[JSON.stringify(race)]);
  await login(student);assert.equal((await db.query("select * from public.documents where collection='live'")).rows.length,0);
  let state=await rpc('sq_race_action',['join',null,[],{players:[{name:'Ali',avatar:'🦊'},{name:'Vali',avatar:'🐼'}]}]);const ids=state.playerIds;
  assert.equal(state.localMode,true);assert.equal(state.race.phase,'countdown');assert.equal(state.race.questionsByLane,undefined);
  await login(outsider);const edited=await db.query("update public.documents set data=data||'{\"phase\":\"finished\",\"winnerId\":\"fake\"}'::jsonb where collection='live' returning id");assert.equal(edited.rows.length,0);
  await assert.rejects(rpc('sq_race_action',['session','race-one',ids,{}]),/sizga tegishli/);
  await login(student);await assert.rejects(rpc('sq_race_action',['session','race-one',[ids[0],ids[0]],{}]),/sessiyasi/);
  await db.exec('reset role');await db.query("update public.documents set data=data||'{\"startsAt\":0}'::jsonb where collection='live' and id='race'");await login(student);
  state=await rpc('sq_race_action',['session','race-one',ids,{}]);assert.equal(state.race.phase,'running');assert.notEqual(state.questions[0].id,state.questions[1].id);assert.equal(state.questions[0].correct,undefined);
  state=await rpc('sq_race_action',['answer','race-one',ids,{playerId:ids[0],questionId:'a1',value:1}]);assert.equal(state.race.racers[0].index,1);
  state=await rpc('sq_race_action',['answer','race-one',ids,{playerId:ids[0],questionId:'a1',value:1}]);assert.equal(state.race.racers[0].index,1);assert.equal(state.race.racers[0].attempts,1);
  state=await rpc('sq_race_action',['answer','race-one',ids,{playerId:ids[0],questionId:'a2',value:1}]);assert.equal(state.race.winnerId,ids[0]);assert.equal(state.race.phase,'finished');
  await rpc('sq_race_action',['leave','race-one',ids,{}]);assert.equal((await rpc('sq_race_action',['active'])).phase,'lobby');
 }finally{await db.close()}
});
