import {readFileSync} from 'node:fs';import {PGlite} from '@electric-sql/pglite';
const uid=n=>`72620000-0000-0000-0000-${String(n).padStart(12,'0')}`;
export const teacher=uid(1),student=uid(2),outsider=uid(3),otherTeacher=uid(4);
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
export const question=(id,correct=1)=>({id,type:'test',text:correct===0?'2 + 2 nechaga teng?':'2 + 3 nechaga teng?',options:['4','5','6','7'],correct,points:100,time:30});
export async function securePlayFixture(){
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;
 grant usage on schema auth to authenticated;grant execute on all functions in schema auth to authenticated;`);
 await db.exec(read('supabase-schema.sql').replace(/do \$\$ begin\s+alter publication supabase_realtime add table public.documents;\s+exception when duplicate_object then null;\s+end \$\$;/,''));
 for(const [id,role] of [[teacher,'teacher'],[student,'student'],[outsider,'student'],[otherTeacher,'teacher']]){await db.query('insert into auth.users values($1)',[id]);await db.query('insert into public.documents(collection,id,data) values($1,$2,$3)',['profiles',id,JSON.stringify({role,name:role})]);}
 await db.exec(read('supabase-migration-7.22.sql'));await db.exec(read('supabase-migration-7.24.sql'));
 await db.exec(read('supabase-migration-7.26.2.sql'));await db.exec(read('supabase-migration-7.26.2.sql'));
 const login=async id=>{await db.exec('reset role');await db.query("select set_config('request.uid',$1,false)",[id]);await db.exec('set role authenticated')};
 const rpc=async(name,args=[])=> (await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) value`,args.map(a=>a&&typeof a==='object'?JSON.stringify(a):a))).rows[0].value;
 const quiz={id:'test-one',ownerId:teacher,ownerName:'Ustoz',title:'Hisoblash',pin:'123456',status:'active',visibility:'public',questions:[question('q1'),question('q2',0)]};
 await login(teacher);await db.query('insert into public.documents(collection,id,data) values($1,$2,$3)',['quizzes',quiz.id,JSON.stringify(quiz)]);
 return {db,login,rpc,quiz};
}
