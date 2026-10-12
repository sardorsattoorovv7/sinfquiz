import {readFileSync,writeFileSync} from 'node:fs';
// Frozen 7.30 catalog: rebuilding a historical migration cannot include newer scenes.
const spaceTopics=JSON.parse(readFileSync(new URL('../data/space-730/catalog.json',import.meta.url),'utf8'));
const q=s=>"'"+s.replaceAll("'","''")+"'";
const seed=spaceTopics.map(t=>`(${q(t.id)},${q(t.title)},${q(JSON.stringify({controls:t.controls,answer:t.answer}))}::jsonb)`).join(',\n');
writeFileSync(new URL('../supabase-migration-7.30.sql',import.meta.url),readFileSync(new URL('../data/space-730/schema.sql',import.meta.url),'utf8')+`\ninsert into public.sq_space_catalog(id,title,spec) values\n${seed}\non conflict(id) do update set title=excluded.title,spec=excluded.spec;\ncommit;\nnotify pgrst,'reload schema';\n`);
console.log('7.30 migration generated for',spaceTopics.length,'topics');
