import {readFileSync} from 'node:fs';
import {securePlayFixture} from './secure-play-fixture.js';
import {teacher,other,admin,students,config} from './competition-fixture.js';
export {teacher,other,admin,students,config};
export async function competition729Fixture(){
 const f=await securePlayFixture(),{db}=f;await db.exec('reset role');
 for(const [id,role] of [[teacher,'teacher'],[other,'teacher'],[admin,'admin'],...students.map(id=>[id,'student'])]){
  await db.query('insert into auth.users values($1) on conflict do nothing',[id]);
  await db.query('insert into public.documents(collection,id,data) values($1,$2,$3) on conflict(collection,id) do nothing',['profiles',id,JSON.stringify({role,name:role+' '+id.slice(-3)})]);
 }
 await db.exec(`create or replace function auth.jwt() returns jsonb language sql stable as $$select case when auth.uid()='${admin}'::uuid then jsonb_build_object('email','admin@sinfquiz.uz') else '{}'::jsonb end$$`);
 for(const version of ['7.28','7.29'])await db.exec(readFileSync(new URL('../supabase-migration-'+version+'.sql',import.meta.url),'utf8'));
 let queue=Promise.resolve();
 const call=(id,name,args=[])=>{const job=queue.then(async()=>{await f.login(id);try{return await f.rpc(name,args)}finally{await db.exec('reset role')}});queue=job.catch(()=>{});return job};
 return {...f,call};
}
