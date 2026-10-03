import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {atlasTopics} from '../src/math-atlas-content.js';

const t1='50000000-0000-0000-0000-000000000001',t2='50000000-0000-0000-0000-000000000002',s1='50000000-0000-0000-0000-000000000003',s2='50000000-0000-0000-0000-000000000004',admin='50000000-0000-0000-0000-000000000005';
test('7.20 migration: repeatability without Cron, private groups, throttling, voice TTL and notebook ownership',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create table public.documents(collection text,id text,data jsonb,primary key(collection,id));create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on all functions in schema auth to authenticated;create function public.sq_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;create function public.sq_is_teacher() returns boolean language sql stable as $$select auth.uid() in ('${t1}'::uuid,'${t2}'::uuid,'${admin}'::uuid)$$;insert into auth.users values('${t1}'),('${t2}'),('${s1}'),('${s2}'),('${admin}');`);
  for(const [id,role] of [[t1,'teacher'],[t2,'teacher'],[s1,'student'],[s2,'student'],[admin,'admin']])await db.query('insert into public.documents values($1,$2,$3)',['profiles',id,JSON.stringify({name:role+' '+id.slice(-1),role})]);
  await db.exec(readFileSync(new URL('../supabase-math-atlas.sql',import.meta.url),'utf8'));
  const sql=readFileSync(new URL('../supabase-migration-7.20.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
  const login=async id=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[id]);await db.exec('set role authenticated')};
  await login(t1);const group=(await db.query('select public.sq_group_create($1) as value',['7-A sinfi'])).rows[0].value,id=group.id;assert.match(group.join_code,/^[A-F0-9]{10}$/);
  await assert.rejects(db.query('update public.sq_class_groups set owner_id=$1 where id=$2',[t2,id]));
  await login(t2);assert.equal((await db.query('select * from public.sq_class_groups')).rows.length,0);await assert.rejects(db.query('select public.sq_group_send($1,$2)',[id,'Begona xabar']));assert.equal((await db.query('select * from public.sq_group_signals')).rows.length,0);
  await login(s2);for(let i=0;i<5;i++){const wrong=(await db.query('select public.sq_group_join($1) as value',['BADCODE'])).rows[0].value;assert.ok(wrong.error)}await assert.rejects(db.query('select public.sq_group_join($1)',[group.join_code]),/So‘rovlar juda ko‘p/);
  await login(s1);assert.equal((await db.query('select public.sq_group_join($1) as value',[group.join_code])).rows[0].value.id,id);
  const literal='<img src=x onerror=alert(1)>',msg=(await db.query('select public.sq_group_send($1,$2) as value',[id,literal])).rows[0].value;assert.equal(msg.body,literal);assert.equal(msg.sender_name,'student 3');
  await assert.rejects(db.query('select audio_base64 from public.sq_group_messages'));
  const bad=Buffer.alloc(110).toString('base64');await assert.rejects(db.query('select public.sq_group_send($1,$2,$3,$4,$5)',[id,'',bad,'audio/webm',1]));
  const voice=Buffer.concat([Buffer.from('1a45dfa3','hex'),Buffer.alloc(110)]).toString('base64'),vm=(await db.query('select public.sq_group_send($1,$2,$3,$4,$5) as value',[id,'',voice,'audio/webm',2])).rows[0].value;assert.equal(vm.kind,'voice');assert.equal((await db.query('select public.sq_group_audio($1) as value',[vm.id])).rows[0].value.base64,voice);
  const signal=(await db.query('select * from public.sq_group_signals')).rows[0];assert.deepEqual(Object.keys(signal).sort(),['group_id','members_at','messages_at','settings_at']);await assert.rejects(db.query('update public.sq_group_signals set messages_at=now()'));
  await login(t2);assert.equal((await db.query('select public.sq_group_audio($1) as value',[vm.id])).rows[0].value,null);
  await db.exec('reset role');await db.query("update public.sq_group_messages set created_at=now()-interval '25 hours' where id=$1",[vm.id]);await login(s1);assert.equal((await db.query('select public.sq_group_audio($1) as value',[vm.id])).rows[0].value,null);assert.equal((await db.query('select id from public.sq_group_messages where id=$1',[vm.id])).rows.length,0);
  for(let i=0;i<6;i++)await db.query('select public.sq_group_send($1,$2)',[id,'Xabar '+i]);await assert.rejects(db.query('select public.sq_group_send($1,$2)',[id,'Limitdan keyin']),/So‘rovlar juda ko‘p/);

  await login(t1);const privateWork=(await db.query("insert into public.sq_experiment_assignments(owner_id,subject,topic_id,title,instructions,group_id,visibility,status) values($1,'chemistry','volcano','Vulqon taqqoslash','Bir omilni o‘zgartirib natijalarni taqqoslang.',$2,'group','published') returning id",[t1,id])).rows[0].id;
  await assert.rejects(db.query("insert into public.sq_experiment_assignments(owner_id,subject,topic_id,title,instructions,visibility,status) values($1,'math','uchburchak','Ommaviy mashq','Asos va balandlikni o‘zgartirib ko‘ring.','public','published')",[t1]));
  const publicWork=(await db.query("insert into public.sq_experiment_assignments(owner_id,subject,topic_id,title,instructions,visibility,status) values($1,'math','uchburchak','Ommaviy mashq','Asos va balandlikni o‘zgartirib ko‘ring.','public','pending') returning id",[t1])).rows[0].id;
  for(const scene of ['statistics','probability']){const data=atlasTopics.find(t=>t.scene===scene);await db.query('insert into public.math_atlas_concepts(owner_id,data) values($1,$2)',[t1,JSON.stringify(data)])}
  await login(t2);assert.equal((await db.query('select id from public.sq_experiment_assignments')).rows.length,0);
  await login(admin);await assert.rejects(db.query('update public.sq_experiment_assignments set instructions=$1 where id=$2',['Begona mazmunni o‘zgartirib bo‘lmaydi.',publicWork]));await db.query("update public.sq_experiment_assignments set status='published' where id=$1",[publicWork]);
  await login(t1);await assert.rejects(db.query('update public.sq_experiment_assignments set instructions=$1 where id=$2',['Yangi mazmun qayta tasdiqlanishi kerak.',publicWork]));await db.query("update public.sq_experiment_assignments set status='pending',instructions=$1 where id=$2",['Yangi mazmun qayta tasdiqlanishi kerak.',publicWork]);
  await login(s2);assert.equal((await db.query('select id from public.sq_experiment_assignments where id=$1',[privateWork])).rows.length,0);
  const data={prediction:'Gaz ko‘payadi.',observation:'Ikki xil miqdorda gaz hajmini taqqosladim.',conclusion:'Chegaralovchi reagent natijaga ta’sir qildi.',parameters:{additions:[{substance:'vinegar',amount:30}]},checks:[],snapshots:[],hintsUsed:1},token='60000000-0000-0000-0000-000000000001';
  const insert=(uid,d,client=token)=>db.query("insert into public.sq_experiment_attempts(student_id,student_name,subject,topic_id,topic_title,assignment_id,data,client_token,feedback) values($1,'Soxta ism','chemistry','volcano','Vulqon maketi',$2,$3,$4,'Soxta fikr') returning *",[uid,privateWork,JSON.stringify(d),client]);
  await login(s1);await assert.rejects(insert(s2,data));await assert.rejects(insert(s1,{...data,hintsUsed:undefined}));await assert.rejects(insert(s1,{...data,hintsUsed:1.5}));
  const attempt=(await insert(s1,data)).rows[0];assert.equal(attempt.student_name,'student 3');assert.equal(attempt.feedback,'');await assert.rejects(insert(s1,data));assert.equal((await db.query('update public.sq_experiment_attempts set feedback=$1 where id=$2 returning id',['O‘zim baho berdim',attempt.id])).rows.length,0);
  await login(s2);assert.equal((await db.query('select * from public.sq_experiment_attempts')).rows.length,0);await login(t2);assert.equal((await db.query('select * from public.sq_experiment_attempts')).rows.length,0);
  await login(t1);await assert.rejects(db.query('update public.sq_experiment_attempts set data=$1 where id=$2',[JSON.stringify({...data,hintsUsed:0}),attempt.id]));const review=await db.query('update public.sq_experiment_attempts set feedback=$1 where id=$2 returning reviewed_at',['Yaxshi kuzatuv; miqdor nisbatini ham tushuntiring.',attempt.id]);assert.ok(review.rows[0].reviewed_at);
  await db.exec('reset role');await db.query("insert into public.sq_group_messages(group_id,sender_id,sender_name,kind,body,created_at) values($1,$2,'Oldingi xabar','text','Muddati o‘tgan',now()-interval '25 hours')",[id,s1]);await db.exec('select public.sq_groups_purge()');assert.equal((await db.query("select id from public.sq_group_messages where created_at<=now()-interval '24 hours'")).rows.length,0);
 }finally{await db.close()}
});
