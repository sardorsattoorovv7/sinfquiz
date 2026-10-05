import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {audioMazeLevels,mazePath} from '../src/audio-maze-content.js';
import {officeTemplates,gradeOffice} from '../src/office-lab-model.js';
import {gradeAnswer} from '../src/grading.js';
const ids=Array.from({length:9},(_,i)=>`72200000-0000-0000-0000-${String(i+1).padStart(12,'0')}`),[teacher,other,admin,...students]=ids;
const migration=readFileSync(new URL('../supabase-migration-7.22.sql',import.meta.url),'utf8');
async function setup(){
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create table public.documents(collection text,id text,data jsonb,primary key(collection,id));create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;create function public.sq_is_admin() returns boolean language sql stable as $$select coalesce(auth.uid()='${admin}'::uuid,false)$$;create function public.sq_is_teacher() returns boolean language sql stable security definer as $$select (d.data->>'role') in ('teacher','admin') from public.documents d where d.collection='profiles' and d.id=auth.uid()::text$$;`);
 for(const id of ids)await db.query('insert into auth.users values($1)',[id]);
 for(const [id,role] of [[teacher,'teacher'],[other,'teacher'],[admin,'admin'],...students.slice(0,4).map(id=>[id,'student'])])await db.query('insert into public.documents values($1,$2,$3)',['profiles',id,JSON.stringify({role,name:role+' '+id.slice(-1)})]);
 await db.exec(migration);await db.exec(migration);
 const login=async id=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[id]);await db.exec('set role authenticated')};
 const rpc=async(name,args=[])=>{const row=await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) value`,args.map(a=>typeof a==='object'&&a!==null?JSON.stringify(a):a));return row.rows[0].value};
 return {db,login,rpc};
}
const question={type:'test',text:'2 + 3 nechaga teng?',options:['5','4','6','7'],correct:0,points:100};
const stage=(kind,custom,title)=>({title,kind,sourceKind:'custom',custom,duration:30,weight:1});
const make=()=>({title:'Jamoalar bilim musobaqasi',description:'To‘rt bosqich: hamma o‘z hissasini qo‘shadi.',visibility:'public',teamSize:2,teams:[{title:'Zukko',roster:['Ali','Vali']},{title:'Bilimdon',roster:['Lola','Nodira']}],stages:[stage('quiz',{questions:[question]},'Birinchi quiz'),stage('typing',{text:'I go to school every day.',language:'en'},'Typing'),{title:'Inglizcha labirint',kind:'maze',sourceKind:'template',sourceId:'maze:maze-01',duration:180,weight:1},stage('quiz',{questions:[{type:'office',text:'B5 da o‘rtacha bahoni hisoblang.',officeTemplate:'excel-average-first',points:100}]},'Excel amaliyoti')]});
const comp='72210000-0000-0000-0000-000000000001';
test('7.22: repeatable migration, private sources, minimum stages and protected answer keys',async()=>{
 const {db,login,rpc}=await setup();try{
  await db.query('insert into public.documents values($1,$2,$3)',['quizzes','private-other',JSON.stringify({ownerId:other,title:'Begona shaxsiy test',visibility:'private',status:'active',questions:[question]})]);
  await db.query('insert into public.documents values($1,$2,$3)',['quizzes','public-other',JSON.stringify({ownerId:other,title:'Ommaviy test',visibility:'public',questions:[question]})]);
  await login(teacher);const catalog=await rpc('sq_comp_catalog');assert.ok(catalog.sources.some(s=>s.sourceId==='public-other'));assert.ok(!catalog.sources.some(s=>s.sourceId==='private-other'));assert.ok(catalog.sources.some(s=>s.sourceId==='quiz:excel-beginner-7.22'));
  await assert.rejects(rpc('sq_comp_save',[comp,{...make(),stages:make().stages.slice(0,3)}]),/Kamida 4/);
  const bad=make();bad.stages[0]={...bad.stages[0],sourceKind:'quiz',sourceId:'private-other'};await assert.rejects(rpc('sq_comp_save',[comp,bad]),/ruxsat yo‘q/);
  await rpc('sq_comp_save',[comp,make()]);let state=await rpc('sq_comp_state',[comp]);assert.equal(state.stages.length,4);assert.ok(state.teams.every(t=>/^[A-F0-9]{8}$/.test(t.code)));
  await login(other);assert.equal((await rpc('sq_comp_list')).competitions.length,0);await assert.rejects(rpc('sq_comp_state',[comp]));await assert.rejects(rpc('sq_comp_control',[comp,'publish',0]));
  await login(students[4]);await assert.rejects(rpc('sq_comp_save',['72210000-0000-0000-0000-000000000002',make()]),/Ustoz/);await assert.rejects(rpc('sq_comp_catalog'),/Ustoz/);
  await assert.rejects(db.query('select * from public.sq_comp_templates'));await assert.rejects(db.query('select public.sq_comp_grade($1,$2)',[JSON.stringify(question),'0']));await assert.rejects(db.query('select * from public.sq_comp_attempts'));await assert.rejects(db.query("update public.sq_competitions set status='running'"));
  await login(teacher);await rpc('sq_comp_control',[comp,'publish',0]);await assert.rejects(rpc('sq_comp_save',[comp,make()]),/tarkibi o‘zgarmaydi/);
  await login(students[0]);state=await rpc('sq_comp_state',[comp]);assert.equal(state.current,null);assert.ok(state.teams.every(t=>!Object.hasOwn(t,'code')&&!Object.hasOwn(t,'roster')));assert.ok(state.stages.every(t=>!Object.hasOwn(t,'custom')));
  for(let i=0;i<10;i++){const e=await rpc('sq_comp_join',['FFFFFFFF','Xato ism']);assert.ok(e.error)}assert.match((await rpc('sq_comp_join',['FFFFFFFF','Xato ism'])).error,/Urinishlar/);
  await login(admin);assert.equal((await rpc('sq_comp_state',[comp])).manager,true);
 }finally{await db.close()}
});
test('7.22: four-stage team journey, true ranks, capacity, idempotent grades, maze paths and timeout',async()=>{
 const {db,login,rpc}=await setup();try{
  await login(teacher);await rpc('sq_comp_save',[comp,make()]);let owner=await rpc('sq_comp_control',[comp,'publish',0]);const teamA=owner.teams.find(t=>t.title==='Zukko'),teamB=owner.teams.find(t=>t.title==='Bilimdon');
  await assert.rejects(rpc('sq_comp_control',[comp,'start',0]),/to‘liq/);
  for(const [i,name] of ['Ali','Vali','Lola','Nodira'].entries()){await login(students[i]);const s=await rpc('sq_comp_join',[i<2?teamA.code:teamB.code,name]);assert.equal(s.me.name,name)}
  await login(students[4]);assert.ok((await rpc('sq_comp_join',[teamA.code,'Beshinchi'])).error);
  await login(teacher);owner=await rpc('sq_comp_control',[comp,'start',0]);await assert.rejects(rpc('sq_comp_control',[comp,'next',1]),/tugatmagan/);
  for(let i=0;i<4;i++){
   await login(students[i]);let s=await rpc('sq_comp_state',[comp]);assert.ok(!Object.hasOwn(s.current.data.question,'correct'));const id=crypto.randomUUID(),body={questionId:s.current.data.question.id,answer:i<2?0:1,score:999999};s=await rpc('sq_comp_answer',[comp,s.current.id,id,body]);assert.equal(s.current.score,i<2?100:0);assert.equal(s.current.finished,true);const again=await rpc('sq_comp_answer',[comp,s.current.id,id,body]);assert.equal(again.current.score,s.current.score);
  }
  await login(teacher);owner=await rpc('sq_comp_state',[comp]);assert.equal(owner.teams.find(t=>t.id===teamA.id).rank,1);assert.equal(owner.teams.find(t=>t.id===teamB.id).rank,2);assert.equal(owner.teams.find(t=>t.id===teamA.id).score,100);await rpc('sq_comp_control',[comp,'next',1]);assert.equal((await rpc('sq_comp_control',[comp,'next',1])).competition.currentStage,2);
  for(let i=0;i<4;i++){await login(students[i]);const s=await rpc('sq_comp_state',[comp]);const result=await rpc('sq_comp_answer',[comp,s.current.id,crypto.randomUUID(),{text:i<2?s.current.data.text:'wrong'}]);assert.ok(i<2?result.current.score>70:result.current.score<30)}
  await login(teacher);await rpc('sq_comp_control',[comp,'next',2]);
  await login(students[0]);let s=await rpc('sq_comp_state',[comp]);const model=audioMazeLevels[0];assert.ok(s.current.data.tasks.every(t=>!Object.hasOwn(t,'answer')));
  await assert.rejects(rpc('sq_comp_answer',[comp,s.current.id,crypto.randomUUID(),{gate:0,path:[model.start,model.gateCells[0]],answer:model.tasks[0].answer}]),/devordan/);
  for(let step=0;step<model.tasks.length;step++){
   const d=s.current.data,closed=model.gateCells.filter((_,i)=>!d.opened.includes(i));let gate,path;
   for(let i=0;i<model.tasks.length;i++){if(d.opened.includes(i))continue;const p=mazePath(model.grid,d.position,model.gateCells[i],closed.filter(v=>v!==model.gateCells[i]));if(p){gate=i;path=p;break}}
   assert.ok(path,'an unopened gate must be reachable');s=await rpc('sq_comp_answer',[comp,s.current.id,crypto.randomUUID(),{gate,path,answer:model.tasks[gate].answer}]);
  }
  const path=mazePath(model.grid,s.current.data.position,model.exit);s=await rpc('sq_comp_answer',[comp,s.current.id,crypto.randomUUID(),{mode:'finish',path}]);assert.equal(s.current.score,100);assert.equal(s.current.finished,true);
  await db.exec('reset role');await db.query("update public.sq_competitions set stage_started_at=now()-interval '5 minutes' where id=$1",[comp]);
  await login(teacher);owner=await rpc('sq_comp_control',[comp,'next',3]);assert.equal(owner.competition.currentStage,4);
  for(let i=0;i<4;i++){
   await login(students[i]);s=await rpc('sq_comp_state',[comp]);const q=s.current.data.question;assert.ok(!Object.hasOwn(q.officeTask,'rubric'));const cells={...q.officeTask.initialCells,B5:i<2?'=AVERAGE(B2:B4)':'=0'};s=await rpc('sq_comp_answer',[comp,s.current.id,crypto.randomUUID(),{questionId:q.id,answer:JSON.stringify({kind:'excel',cells})}]);assert.equal(s.current.score,i<2?100:0);
  }
  await login(teacher);owner=await rpc('sq_comp_control',[comp,'next',4]);assert.equal(owner.competition.status,'finished');assert.equal(owner.members.length,4);assert.equal(owner.teams.find(t=>t.id===teamA.id).rank,1);assert.equal(owner.teams.find(t=>t.id===teamB.id).rank,2);assert.ok(owner.teams.find(t=>t.id===teamA.id).score>300);
  await login(students[0]);assert.equal((await rpc('sq_comp_state',[comp])).history.length,4);await assert.rejects(rpc('sq_comp_control',[comp,'cancel',4]));
 }finally{await db.close()}
});
test('7.22: server Excel parser matches references, ignores blank/text in averages, rejects execution and cycles',async()=>{
 const {db,login,rpc}=await setup();try{
  const value=async(cells,cell)=>((await db.query('select public.sq_comp_excel($1,$2) n',[JSON.stringify(cells),cell])).rows[0].n);
  assert.equal(Number(await value({B2:'4',B3:'',B4:'0',B5:'=AVERAGE(B2:B4)'},'B5')),2);assert.equal(Number(await value({B2:'4',B3:'hello',B4:'6',B5:'=AVERAGE(B2:B4)'},'B5')),5);
  assert.equal(Number(await value({B2:'2',C2:'3',D2:'=(B2+C2)*4'},'D2')),20);
  await assert.rejects(value({B2:'=B3',B3:'=B2'},'B2'));await assert.rejects(value({B2:"=1;DELETE FROM public.documents"},'B2'));await assert.rejects(value({B2:'=1/0'},'B2'));
  const task=officeTemplates['excel-average-first'],q={type:'office',officeTask:task},answer=JSON.stringify({kind:'excel',cells:{...task.initialCells,B5:'=AVERAGE(B2:B4)'}}),graded=(await db.query('select public.sq_comp_grade($1,$2) result',[JSON.stringify(q),JSON.stringify(answer)])).rows[0].result;assert.equal(Number(graded.ratio),gradeOffice(q,answer).ratio);
  const cases=[
   [{type:'practical',subject:'Excel',answer:'=B2+C2',acceptedAnswers:['=C2+B2']},'= C2 + B2'],
   [{type:'shortcut',answer:'Ctrl+C'},'C + Control'],
   [{type:'python',answer:'12'},JSON.stringify({code:'print(12)',output:'12\n'})],
   [{type:'python',answer:'12'},JSON.stringify({code:'print(11)',output:'11'})],
   [{type:'prompt',criteria:[{label:'SUM',keywords:['sum']},{label:'Misol',keywords:['misol','namuna']}]},'SUM uchun bitta misol yozing.'],
   [{type:'prompt',criteria:[{label:'SUM',keywords:['sum']},{label:'Misol',keywords:['misol','namuna']}]},'SUM nima?'],
   [{type:'office',officeTask:officeTemplates['word-report']},JSON.stringify({kind:'word',title:'Kutubxona',body:'Maktabdagi yangi kitoblar',table:[['Fan','Kitob'],['Algebra','5']],imageInserted:true,wrap:'right'})],
   [{type:'office',officeTask:officeTemplates['ppt-presentation']},JSON.stringify({kind:'ppt',slides:[{title:'Maktab',body:'Dars haqida',imageInserted:true},{title:'Kutubxona',body:'Kitoblar haqida',notes:'Batafsil ayting'}]})],
  ];
  for(const [question,submission] of cases){
   const sql=(await db.query('select public.sq_comp_grade($1,$2) result',[JSON.stringify(question),JSON.stringify(submission)])).rows[0].result;
   assert.ok(Math.abs(Number(sql.ratio)-gradeAnswer({...question,time:30,points:100},submission,30).ratio)<1e-9,question.type+' grading agrees');
  }
  await login(teacher);
  const prompt={...cases[4][0],text:'SUMni tushuntiring va misol yozing.',points:100};
  const config=make();config.stages[0]=stage('quiz',{questions:[prompt]},'Yozma savol');
  await rpc('sq_comp_save',[comp,config]);assert.equal((await rpc('sq_comp_state',[comp])).stages[0].custom.questions[0].criteria[0].keywords[0],'sum');
  const broken={...config,stages:config.stages.map((s,i)=>i?s:stage('quiz',{questions:[{...prompt,criteria:['sum']}]},'Noto‘g‘ri mezon'))};
  await assert.rejects(rpc('sq_comp_save',[comp,broken]),/nom va kalit/);
  assert.equal((await rpc('sq_comp_state',[comp])).stages[0].title,'Yozma savol','failed edit rolls back its partial writes');
 }finally{await db.close()}
});
