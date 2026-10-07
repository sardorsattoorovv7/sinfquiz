import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
export const ids={student:'72500000-0000-0000-0000-000000000001',other:'72500000-0000-0000-0000-000000000002',teacher:'72500000-0000-0000-0000-000000000003',stranger:'72500000-0000-0000-0000-000000000004',admin:'72500000-0000-0000-0000-000000000005'};
export async function learningFixture(){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;create table public.documents(collection text,id text,data jsonb,primary key(collection,id));create function public.sq_is_admin() returns boolean language sql stable as $$select coalesce(auth.uid()='${ids.admin}'::uuid,false)$$;create function public.sq_is_teacher() returns boolean language sql stable security definer as $$select (d.data->>'role') in ('teacher','admin') from public.documents d where collection='profiles' and id=auth.uid()::text$$;create table public.sq_class_groups(id uuid primary key,owner_id uuid,active boolean);create table public.sq_class_members(group_id uuid,student_id uuid,student_name text);`);
 for(const [role,id] of Object.entries(ids)){await db.query('insert into auth.users values($1)',[id]);await db.query('insert into public.documents values($1,$2,$3)',['profiles',id,JSON.stringify({role:role==='admin'?'admin':role==='teacher'||role==='stranger'?'teacher':'student',name:role==='student'?'Ali':'Test '+role})])}
 await db.query('insert into public.sq_class_groups values($1,$2,true)',[ids.teacher,ids.teacher]);await db.query('insert into public.sq_class_members values($1,$2,$3)',[ids.teacher,ids.student,'Ali']);
 const root=new URL('../sql/7.25/',import.meta.url);
 for(const f of ['01-schema.sql','02-iq-band-1.sql','03-iq-band-2.sql','04-iq-band-3.sql','05-book-keys.sql'])await db.exec(readFileSync(new URL(f,root),'utf8'));
 let queue=Promise.resolve();
 const call=(user,action,p={},name='sq_iq')=>{const job=queue.then(async()=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[user||'']);await db.exec(user?'set role authenticated':'set role anon');try{return (await db.query(`select public.${name}($1,$2::jsonb) value`,[action,JSON.stringify(p)])).rows[0].value}finally{await db.exec('reset role')}});queue=job.catch(()=>{});return job};
 return {db,call};
}
