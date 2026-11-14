import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {securePlayFixture,student,outsider,teacher} from './secure-play-fixture.js';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const admin='72810000-0000-0000-0000-000000000001';
const laptop='72810000-0000-0000-0001-000000000001';
const phone='72810000-0000-0000-0001-000000000002';

test('user activity sorts globally, preserves login times and tracks concurrent sessions',async()=>{
 const {db,login,rpc}=await securePlayFixture();
 const root=()=>db.exec('reset role');
 try{
  await root();
  await db.exec(read('supabase-migration-7.28.sql'));
  await db.exec(`
   alter table auth.users add column last_sign_in_at timestamptz;
   create table auth.sessions(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null);
   create or replace function auth.jwt() returns jsonb language sql stable as $$
    select jsonb_build_object('email',case when auth.uid()='${admin}'::uuid then 'admin@sinfquiz.uz' end,
      'session_id',nullif(current_setting('request.session_id',true),''))
   $$;
   insert into auth.users(id) values('${admin}');
   update auth.users set last_sign_in_at=statement_timestamp()-interval '1 day' where id='${student}';
   update auth.users set last_sign_in_at=statement_timestamp()-interval '1 hour' where id='${outsider}';
   insert into auth.sessions values('${laptop}','${student}',statement_timestamp()-interval '1 day'),
     ('${phone}','${student}',statement_timestamp()-interval '1 minute');
   update public.documents set data=data||jsonb_build_object('name','Sinov o‘quvchi','email','speaker@example.test') where collection='profiles' and id='${student}';
   insert into public.documents(collection,id,data) values
     ('userActivity','${student}',jsonb_build_object('lastLoginAt',floor(extract(epoch from (now()-interval '2 hours'))*1000),'loginCount',3,'logoutCount',1)),
     ('userActivity','${teacher}',jsonb_build_object('lastSeenAt',floor(extract(epoch from now())*1000),'lastEvent','logout')),
     ('profiles','legacy-missing-auth',jsonb_build_object('name','Eski hisob','role','student')),
     ('userActivity','legacy-missing-auth',jsonb_build_object('lastLoginAt','123','lastSeenAt','invalid'));
   insert into public.documents(collection,id,data)
   select 'profiles','bulk-user-'||lpad(n::text,3,'0'),jsonb_build_object('name','Demo '||n,'role','student')
   from generate_series(1,55) n;
  `);
  const activityMigration=read('supabase-user-activity.sql');
  await db.exec(activityMigration);
  await db.exec(activityMigration);

  const switchSession=async session=>{
   await login(student);
   await db.query("select set_config('request.session_id',$1,false)",[session]);
  };
  await switchSession(laptop);
  await assert.rejects(rpc('sq_admin_user_page'),/Administrator/);
  const activity=event=>rpc('sq_record_activity',[event,'legacy-browser-id']);
  await activity('login');
  await activity('login');
  await switchSession(phone);
  await activity('login');
  await rpc('sq_record_activity',['login','independent-browser-tab']);
  const page=async(number=1,search='',role='')=>{
   await login(admin);
   return rpc('sq_admin_user_page',[search,role,number]);
  };
  const initial=await page();
  assert.equal(initial.activeUsers,1);
  assert.equal(initial.totalUsers,60);
  assert.deepEqual(initial.users.slice(0,3).map(user=>user.id),[student,outsider,'legacy-missing-auth']);
  assert.equal(initial.users[0].activity.loginCount,4);
  assert.ok(initial.users[0].activity.lastSeenAt>initial.users[0].activity.lastLoginAt);
  assert.equal(initial.users.find(user=>user.id===teacher)?.activity.online,false);
  const last=await page(2);
  assert.equal(last.users.length,10);
  assert.equal(new Set([...initial.users,...last.users].map(user=>user.id)).size,initial.totalUsers);
  const filtered=await page(999,' SPEAKER@EXAMPLE.TEST ','student');
  assert.deepEqual(filtered.users.map(user=>user.id),[student]);
  assert.equal(filtered.page,1);
  assert.equal(filtered.activeUsers,1);

  await switchSession(phone);
  await activity('logout');
  await activity('logout');
  assert.equal((await page()).users[0].activity.online,true);
  await root();
  await db.query("update public.sq_activity_presence set last_seen_at=now()-interval '6 minutes' where session_id=$1",[laptop]);
  const expired=await page();
  assert.equal(expired.activeUsers,0);
  assert.equal(expired.users[0].id,outsider);
  assert.equal(expired.users.find(user=>user.id===student).activity.logoutCount,2);

  await switchSession(laptop);
  await activity('heartbeat');
  const reconnected=await page();
  assert.equal(reconnected.users[0].id,student);
  assert.equal(reconnected.users[0].activity.lastLoginAt,initial.users[0].activity.lastLoginAt);
  await root();
  await db.query('delete from auth.sessions where id=$1',[laptop]);
  assert.equal((await page()).activeUsers,0);
  await switchSession(laptop);
  assert.deepEqual(await activity('heartbeat'),{ok:false});
 }finally{
  await db.close();
 }
});
