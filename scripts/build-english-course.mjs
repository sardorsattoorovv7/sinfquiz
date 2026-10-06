import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {lessons,levels,counts,levelNames} from '../data/english-course/index.js';
if(lessons.length!==108||new Set(lessons.map(l=>l.id)).size!==108)throw Error('108 unique lessons required');
for(let i=0;i<levels.length;i++)if(lessons.filter(l=>l.level===levels[i]).length!==counts[i])throw Error(levels[i]);
const catalog=lessons.map(({id,level,levelIndex,order,title,objective,minutes,prerequisites,project,recapEvery})=>({id,level,levelIndex,order,title,objective,minutes,prerequisites,project,recapEvery}));
writeFileSync('src/english-course/catalog.js',`// Generated metadata only. Answer keys stay in database versions.\nexport const levels=${JSON.stringify(levels)};\nexport const levelNames=${JSON.stringify(levelNames)};\nexport const catalog=${JSON.stringify(catalog)};\n`);
mkdirSync('generated',{recursive:true});writeFileSync('generated/english-course.json',JSON.stringify(lessons));
const seed=lessons.map(l=>`insert into public.sq_en_content(id,base_id,owner_id,level,ordinal,status,revision,payload) values(${quote(l.id)},${quote(l.id)},null,${l.levelIndex},${l.order},'published',1,${quote(JSON.stringify(l))}::jsonb) on conflict(id,revision) do nothing;`).join('\n');
writeFileSync('generated/english-course-seed.sql',seed+'\n');
const schema=readFileSync('data/english-course/schema.sql','utf8');
writeFileSync('supabase-migration-7.23.sql',schema+seed+'\ncommit;\n');
const checkStart=schema.indexOf('create or replace function public.sq_en_check_view('),rpcStart=schema.indexOf('create or replace function public.sq_en(p_action');
const checkEnd=schema.indexOf('create or replace function public.sq_en_recording_ok',checkStart),rpcEnd=schema.indexOf('-- No client table writes;',rpcStart);
if([checkStart,rpcStart,checkEnd,rpcEnd].some(i=>i<0))throw Error('Course upgrade function markers are missing');
const upgrade=[schema.slice(checkStart,checkEnd),schema.slice(rpcStart,rpcEnd)].join('\n');
writeFileSync('supabase-migration-7.23.1.sql',"-- SinfQuiz 7.23 -> 7.23.1. Existing work, roles, RLS and content revisions are preserved.\nbegin;\ndo $$begin if to_regclass('public.sq_en_runs') is null then raise exception 'Avval supabase-migration-7.23.sql ni bajaring.';end if;end$$;\n"+upgrade+"\nrevoke all on function public.sq_en_check_view(public.sq_en_checks) from public,anon,authenticated;\nrevoke all on function public.sq_en(text,jsonb) from public,anon;\ngrant execute on function public.sq_en(text,jsonb) to authenticated;\ncommit;\n");
console.log('108 immutable lessons, full 7.23 setup and safe 7.23.1 upgrade generated');
function quote(s){return "'"+s.replaceAll("'","''")+"'"}
