import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const teacher='10000000-0000-0000-0000-000000000011',teacher2='10000000-0000-0000-0000-000000000012',student='10000000-0000-0000-0000-000000000013',admin='10000000-0000-0000-0000-000000000014';
const concept={title:'Mening uchburchagim',domain:'Geometriya',grade:7,scene:'triangle',definition:'Ikki jumladan iborat ta’rif.',reason:'Parametr o‘zgarsa natija ham o‘zgaradi.',life:'Bog‘ maydonini o‘lchashda ishlaydi.',challenge:'Asosni o‘zgartirib yuzani tekshiring.',misconception:'Qiya tomon tik balandlik bo‘lmaydi.',parameters:{base:10}};
test('atlas RLS: muallif ajratilishi va faqat admin nashr qilishi mumkin',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
   create table public.documents(collection text,id text,data jsonb,primary key(collection,id));
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt',true),'')::jsonb,'{}'::jsonb)$$; grant usage on schema auth to authenticated; grant execute on all functions in schema auth to authenticated;
   create function public.sq_role() returns text language sql stable security definer as $$select data->>'role' from public.documents where collection='profiles' and id=auth.uid()::text limit 1$$;
   create function public.sq_is_admin() returns boolean language sql stable as $$select lower(coalesce(auth.jwt()->>'email',''))='admin@sinfquiz.uz'$$;
   create function public.sq_is_teacher() returns boolean language sql stable as $$select public.sq_is_admin() or public.sq_role() in ('teacher','admin')$$;
   insert into auth.users values('${teacher}'),('${teacher2}'),('${student}'),('${admin}');
   insert into public.documents values('profiles','${teacher}','{"role":"teacher"}'),('profiles','${teacher2}','{"role":"teacher"}'),('profiles','${student}','{"role":"student"}'),('profiles','${admin}','{"role":"admin"}');`);
  await db.exec(readFileSync(new URL('../supabase-math-atlas.sql',import.meta.url),'utf8'));
  const login=async(uid,email='')=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[uid]);await db.query("select set_config('request.jwt',$1,false)",[JSON.stringify(email?{email}: {})]);await db.exec('set role authenticated')};
  await login(teacher);const inserted=await db.query('insert into public.math_atlas_concepts(owner_id,status,data) values($1,$2,$3) returning id',[teacher,'pending',JSON.stringify(concept)]);const id=inserted.rows[0].id;
  await login(teacher2);assert.equal((await db.query('select id from public.math_atlas_concepts')).rows.length,0);assert.equal((await db.query("update public.math_atlas_concepts set status='published' where id=$1 returning id",[id])).rows.length,0);
  await login(student);assert.equal((await db.query('select id from public.math_atlas_concepts')).rows.length,0);
  await login(admin,'admin@sinfquiz.uz');assert.equal((await db.query('select id from public.math_atlas_concepts')).rows.length,1);await db.query("update public.math_atlas_concepts set status='published' where id=$1",[id]);
  await login(student);assert.equal((await db.query('select id from public.math_atlas_concepts')).rows.length,1);
  await login(teacher2);assert.equal((await db.query("delete from public.math_atlas_concepts where id=$1 returning id",[id])).rows.length,0);
 }finally{await db.close()}
});
