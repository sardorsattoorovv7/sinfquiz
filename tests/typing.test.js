import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createQuizServer} from '../server/app.js';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const lessons=JSON.parse(readFileSync(join(root,'data/typing-lessons.json'),'utf8'));

test('Typing: ACTIVE/PASSIVE, five Uzbek stages, accuracy, WPM and admin result',async()=>{
 const dataDir=mkdtempSync(join(tmpdir(),'sq-typing-')),origin='http://localhost:3988';
 const server=createQuizServer({root,dataDir,config:{origin,adminUsername:'admin',adminPassword:'admin123',adminName:'Administrator'}});
 await new Promise(resolve=>server.httpServer.listen(3988,'127.0.0.1',resolve));
 const request=(path,{cookie='',csrf='',data,method='GET'}={})=>fetch('http://127.0.0.1:3988'+path,{method,redirect:'manual',headers:{Origin:origin,Cookie:cookie,...(method!=='GET'?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},...(method!=='GET'?{body:JSON.stringify(data||{})}:{})});
 const cookieOf=response=>response.headers.get('set-cookie')?.split(';')[0]||'';
 try{
  assert.deepEqual(lessons.map(stage=>stage.text.trim().split(/\s+/u).length),[11,25,68,132,308]);
  assert.equal((await(await request('/api/typing/active')).json()).active,false);
  assert.equal((await request('/api/typing/join',{method:'POST',data:{name:'Ali',avatar:'🤖'}})).status,409);
  const loginResponse=await request('/auth/login',{method:'POST',data:{username:'admin',password:'admin123'}}),teacherCookie=cookieOf(loginResponse),login=await loginResponse.json(),teacher={cookie:teacherCookie,csrf:login.csrf};
  assert.equal((await request('/api/typing/status',{...teacher,csrf:'bad',method:'POST',data:{active:true}})).status,403);
  assert.equal((await request('/api/typing/status',{...teacher,method:'POST',data:{active:true}})).status,200);
  const publicState=await(await request('/api/typing/active')).json();assert.equal(publicState.active,true);assert.equal(publicState.stageCount,5);assert.equal(publicState.stages,undefined);
  const joinResponse=await request('/api/typing/join',{method:'POST',data:{name:'Ali',avatar:'🤖'}});assert.equal(joinResponse.status,201);let state=await joinResponse.json();const student={cookie:cookieOf(joinResponse),csrf:state.csrf};assert.equal(state.stage.level,1);assert.equal(state.stage.wordCount,11);
  assert.equal((await request('/api/typing/start',{...student,csrf:'bad',method:'POST'})).status,403);
  state=await(await request('/api/typing/start',{...student,method:'POST'})).json();assert.ok(state.stageStartedAt);
  state=await(await request('/api/typing/submit',{...student,method:'POST',data:{value:'x'}})).json();assert.equal(state.feedback.passed,false);assert.equal(state.index,0);
  for(let index=0;index<lessons.length;index++){
   state=await(await request('/api/typing/start',{...student,method:'POST'})).json();assert.equal(state.index,index);
   state=await(await request('/api/typing/submit',{...student,method:'POST',data:{value:lessons[index].text}})).json();assert.equal(state.feedback.passed,true);assert.equal(state.feedback.accuracy,100);assert.ok(state.feedback.wpm>0);
  }
  assert.equal(state.finished,true);assert.equal(state.index,5);assert.equal(state.results.length,5);
  const owner=await(await request('/api/quizzes',teacher)).json();assert.equal(owner.typing.active,true);assert.equal(owner.typing.results.length,1);assert.equal(owner.typing.results[0].name,'Ali');assert.equal(owner.typing.results[0].averageAccuracy,100);
  assert.equal((await request('/api/typing/status',{...teacher,method:'POST',data:{active:false}})).status,200);assert.equal((await request('/api/typing/session',student)).status,401);
 }finally{server.close();rmSync(dataDir,{recursive:true,force:true})}
});
