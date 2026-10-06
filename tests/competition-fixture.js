import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
export const uid=n=>`72400000-0000-0000-0000-${String(n).padStart(12,'0')}`;
export const teacher=uid(1),other=uid(2),admin=uid(3),students=Array.from({length:45},(_,i)=>uid(i+10));
export async function competitionFixture({patched=true}={}){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create table public.documents(collection text,id text,data jsonb,primary key(collection,id));create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;create function public.sq_is_admin() returns boolean language sql stable as $$select coalesce(auth.uid()='${admin}'::uuid,false)$$;create function public.sq_is_teacher() returns boolean language sql stable security definer as $$select (d.data->>'role') in ('teacher','admin') from public.documents d where d.collection='profiles' and d.id=auth.uid()::text$$;`);
 for(const [id,role] of [[teacher,'teacher'],[other,'teacher'],[admin,'admin'],...students.map(s=>[s,'student'])]){
  await db.query('insert into auth.users values($1)',[id]);await db.query('insert into public.documents values($1,$2,$3)',['profiles',id,JSON.stringify({role,name:role+' '+id.slice(-3)})]);
 }
 await db.exec(readFileSync(new URL('../supabase-migration-7.22.sql',import.meta.url),'utf8'));
 if(patched){const patch=readFileSync(new URL('../supabase-migration-7.24.sql',import.meta.url),'utf8');await db.exec(patch);await db.exec(patch)}
 let queue=Promise.resolve();
 const call=(id,name,args=[])=>{const job=queue.then(async()=>{
  await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[id]);await db.exec('set role authenticated');
  try{return (await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) value`,args.map(v=>v&&typeof v==='object'?JSON.stringify(v):v))).rows[0].value}finally{await db.exec('reset role')}
 });queue=job.catch(()=>{});return job};
 return {db,call};
}
export const config=(overrides={})=>({title:'Sinfning jamoaviy musobaqasi',teamSize:2,visibility:'public',teams:[{title:'Zukko',roster:[]},{title:'Bilimdon',roster:[]},{title:'Kelmagan jamoa',roster:[]}],stages:[
 {title:'Birinchi quiz',kind:'quiz',sourceKind:'custom',duration:120,weight:1,custom:{questions:[{type:'test',text:'2 + 3 nechaga teng?',options:['5','4','6','7'],correct:0,points:100}]}},
 {title:'Typing amaliyoti',kind:'typing',sourceKind:'custom',duration:120,weight:1,custom:{text:'I go to school every day.',language:'en'}},
 {title:'Uchinchi quiz',kind:'quiz',sourceKind:'custom',duration:120,weight:1,custom:{questions:[{type:'test',text:'3 + 4 nechaga teng?',options:['7','8','5'],correct:0,points:100}]}},
 {title:'Yakuniy quiz',kind:'quiz',sourceKind:'custom',duration:120,weight:1,custom:{questions:[{type:'test',text:'4 + 4 nechaga teng?',options:['8','9','7'],correct:0,points:100}]}}
 ],...overrides});
