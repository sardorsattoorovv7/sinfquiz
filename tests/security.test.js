import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createQuizServer} from '../server/app.js';
import {io} from 'socket.io-client';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const sample=JSON.parse(readFileSync(join(root,'data/question-bank.json')))[0];

test('Local admin, CSRF, private answers, server scoring and code-only student flow',async()=>{
 const dataDir=mkdtempSync(join(tmpdir(),'sq-security-'));
 const config={origin:'http://localhost:3987',adminUsername:'admin',adminPassword:'admin123',adminName:'Test Administrator'};
 const server=createQuizServer({root,dataDir,config});
 await new Promise(resolve=>server.httpServer.listen(3987,'127.0.0.1',resolve));
 const sockets=[];
 const request=(path,{cookie='',csrf='',data,method='GET',origin=config.origin}={})=>fetch('http://127.0.0.1:3987'+path,{method,redirect:'manual',headers:{Cookie:cookie,Origin:origin,...(method!=='GET'?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},...(method!=='GET'?{body:JSON.stringify(data||{})}:{})});
 const cookieOf=response=>response.headers.get('set-cookie')?.split(';')[0]||'';
 try{
  assert.equal((await request('/api/quizzes')).status,401);
  assert.equal((await request('/auth/login',{method:'POST',data:{username:'admin',password:'wrong'}})).status,401);
  assert.equal((await request('/auth/login',{method:'POST',origin:'https://evil.example',data:{username:'admin',password:'admin123'}})).status,403);

  const loginResponse=await request('/auth/login',{method:'POST',data:{username:'admin',password:'admin123'}});
  assert.equal(loginResponse.status,200);
  assert.match(loginResponse.headers.get('set-cookie'),/HttpOnly/i);
  assert.match(loginResponse.headers.get('set-cookie'),/SameSite=Lax/i);
  const teacherCookie=cookieOf(loginResponse),login=await loginResponse.json();
  assert.equal(login.user.id,'local-admin');
  const teacher={cookie:teacherCookie,csrf:login.csrf};
  const session=await(await request('/auth/session',{cookie:teacherCookie})).json();
  assert.equal(session.user.username,'admin');

  assert.equal((await request('/api/quizzes',{...teacher,csrf:'bad',method:'POST',data:sample})).status,403);
  const create=await request('/api/quizzes',{...teacher,method:'POST',data:{...sample,questions:[sample.questions[0],sample.questions[1]]}});
  assert.equal(create.status,201);
  const quiz=(await create.json()).quiz;
  assert.equal(quiz.ownerId,'local-admin');
  assert.equal((await request('/api/duels',{...teacher,method:'POST',data:{}})).status,404);

  const resolved=await(await request('/api/resolve',{method:'POST',data:{pin:quiz.pin}})).json();
  assert.equal(resolved.quiz.questions,undefined);
  assert.equal(resolved.quiz.pin,undefined);
  const joinResponse=await request('/api/play/join',{method:'POST',data:{ticket:resolved.ticket,name:'O‘quvchi',avatar:'🤖'}});
  assert.equal(joinResponse.status,201);
  let game=await joinResponse.json();
  const player={cookie:cookieOf(joinResponse),csrf:game.csrf};
  assert.equal(game.question.correct,undefined);
  assert.equal(game.question.answer,undefined);
  assert.equal((await request('/api/play/join',{method:'POST',data:{ticket:resolved.ticket,name:'Takror',avatar:'🤖'}})).status,401);

  const socket=io('http://127.0.0.1:3987',{transports:['websocket'],extraHeaders:{Origin:config.origin,Cookie:teacherCookie}});sockets.push(socket);
  await new Promise((resolve,reject)=>{socket.once('state',resolve);socket.once('connect_error',reject);setTimeout(()=>reject(Error('Socket timeout')),2000).unref()});
  const liveUpdate=new Promise((resolve,reject)=>{socket.on('state',state=>{if(state.players[0]?.answers===1)resolve(state)});setTimeout(()=>reject(Error('Live score timeout')),2000).unref()});
  const answer=await request('/api/play/answer',{...player,method:'POST',data:{questionId:game.question.id,value:0,score:999999,earned:999999}});
  assert.equal(answer.status,200);
  const scored=await answer.json();
  assert.ok(scored.player.score>=85&&scored.player.score<=100);
  await liveUpdate;
  const replay=await(await request('/api/play/answer',{...player,method:'POST',data:{questionId:game.question.id,value:0}})).json();
  assert.equal(replay.player.answers,1);
  assert.equal(replay.player.score,scored.player.score);

  game=await(await request('/api/play/next',{...player,method:'POST',data:{questionId:game.question.id}})).json();
  assert.equal(game.question.type,'shortcut');
  game=await(await request('/api/play/answer',{...player,method:'POST',data:{questionId:game.question.id,value:'Ctrl+B'}})).json();
  assert.equal(game.feedback.correct,true);
  game=await(await request('/api/play/next',{...player,method:'POST',data:{questionId:game.question.id}})).json();
  assert.equal(game.finished,true);
  assert.equal(game.ranking[0].responses,undefined);

  const publicSocket=io('http://127.0.0.1:3987',{transports:['websocket'],reconnection:false,extraHeaders:{Origin:config.origin}});sockets.push(publicSocket);
  await new Promise((resolve,reject)=>{publicSocket.once('connect_error',resolve);publicSocket.once('connect',()=>reject(Error('Public socket accepted'))) });

  assert.equal((await request('/api/race/activate',{method:'POST'})).status,401);
  const activated=await request('/api/race/activate',{...teacher,method:'POST'});assert.equal(activated.status,201);const raceAdmin=(await activated.json()).race;assert.equal(raceAdmin.questionCount,10);assert.equal(raceAdmin.questions,undefined);
  const publicRace=await(await request('/api/race/active')).json();assert.equal(publicRace.active,true);assert.equal(publicRace.playerCount,0);assert.equal(publicRace.questions,undefined);
  const joined=[];for(const name of ['Ali','Vali']){const response=await request('/api/race/join',{method:'POST',data:{name,avatar:'🤖'}});assert.equal(response.status,201);const state=await response.json();assert.equal(state.question,null);joined.push({cookie:cookieOf(response),csrf:state.csrf,id:state.playerId})}
  assert.equal((await request('/api/race/join',{method:'POST',data:{name:'Uchinchi',avatar:'🤖'}})).status,409);
  await request('/api/race/ready',{...joined[0],method:'POST'});const ready=await(await request('/api/race/ready',{...joined[1],method:'POST'})).json();assert.equal(ready.race.phase,'countdown');assert.equal((await request('/api/race/answer',{...joined[0],method:'POST',data:{questionId:'early',value:0}})).status,409);
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,ready.race.startsAt-Date.now())+80));
  const raceSocket=io('http://127.0.0.1:3987',{transports:['websocket'],extraHeaders:{Origin:config.origin,Cookie:joined[0].cookie}});sockets.push(raceSocket);await new Promise((resolve,reject)=>{raceSocket.once('race',resolve);raceSocket.once('connect_error',reject);setTimeout(()=>reject(Error('Race socket timeout')),2000).unref()});
  const answerKey=new Map(JSON.parse(readFileSync(join(dataDir,'db.json'))).race.questions.map(question=>[question.id,question.correct]));
  for(let number=0;number<10;number++){let state=await(await request('/api/race/session',joined[0])).json();assert.equal(state.question.correct,undefined);const before=state.index;state=await(await request('/api/race/answer',{...joined[0],method:'POST',data:{questionId:state.question.id,value:answerKey.get(state.question.id)}})).json();assert.ok(state.index>before||state.race.phase==='finished')}
  const raceEnd=await(await request('/api/race/session',joined[0])).json();assert.equal(raceEnd.race.phase,'finished');assert.equal(raceEnd.race.winnerId,joined[0].id);assert.equal(raceEnd.race.racers[0].index,10);
  assert.equal((await request('/api/race/stop',{...teacher,method:'POST'})).status,200);assert.equal((await(await request('/api/race/active')).json()).active,false);assert.equal((await request('/api/race/session',joined[0])).status,401);
  assert.equal((await request('/auth/logout',{...teacher,method:'POST'})).status,200);
  assert.equal((await request('/api/quizzes',teacher)).status,401);
 }finally{for(const socket of sockets)socket.close();server.close();rmSync(dataDir,{recursive:true,force:true})}
});
