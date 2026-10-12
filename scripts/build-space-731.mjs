import {writeFileSync} from 'node:fs';
import {spaceTopics} from '../src/space/content.js';
const q=s=>"'"+s.replaceAll("'","''")+"'";
const topics=spaceTopics.filter(t=>['sun-distance','ocean-depth'].includes(t.id));
const seed=topics.map(t=>`(${q(t.id)},${q(t.title)},${q(JSON.stringify({controls:t.controls,answer:t.answer}))}::jsonb)`).join(',\n');
writeFileSync(new URL('../supabase-migration-7.31.sql',import.meta.url),`-- SinfQuiz 7.31: run after 7.30. Catalog-only extension; RLS and previous results unchanged.\nbegin;\ninsert into public.sq_space_catalog(id,title,spec) values\n${seed}\non conflict(id) do update set title=excluded.title,spec=excluded.spec;\ncommit;\nnotify pgrst,'reload schema';\n`);
console.log('7.31 catalog:',topics.map(t=>t.id).join(', '));
