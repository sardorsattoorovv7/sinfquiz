import {readFile,writeFile} from 'node:fs/promises';
import {audioMazeLevels} from '../src/audio-maze-content.js';
import {officeTemplates} from '../src/office-lab-model.js';
import {excelBasicsQuiz} from '../data/excel-basics.js';
const url=new URL('../supabase-migration-7.22.sql',import.meta.url);
const english=JSON.parse(await readFile(new URL('../data/english-typing-lessons.json',import.meta.url),'utf8'));
const long=JSON.parse(await readFile(new URL('../data/typing-lessons.json',import.meta.url),'utf8'));
const templates=[
 {id:'quiz:excel-beginner-7.22',kind:'quiz',title:excelBasicsQuiz.title,data:excelBasicsQuiz},
 ...english.map((data,i)=>({id:`typing:english-${i+1}`,kind:'typing',title:`${data.englishLevel} · ${data.title}`,data:{...data,language:'en',level:data.englishLevel}})),
 ...long.map((data,i)=>({id:`typing:long-${i+1}`,kind:'typing',title:`Uzun matn · ${data.title}`,data:{...data,language:'uz',level:'Matn terish'}})),
 ...audioMazeLevels.map(data=>({id:`maze:${data.id}`,kind:'maze',title:data.title,data})),
 ...Object.entries(officeTemplates).map(([id,task])=>({id:`office:${id}`,kind:'quiz',title:task.title,data:{officeTask:task}})),
];
const marker='-- BEGIN BUNDLED 7.22 TEMPLATES';let sql=await readFile(url,'utf8');sql=sql.split(marker)[0];
sql=sql.replace(/-- Bundled templates[^]*$/,'');
sql+=`${marker}\ninsert into public.sq_comp_templates(id,kind,title,data)\nselect t.id,t.kind,t.title,t.data from jsonb_to_recordset($SQ722$${JSON.stringify(templates)}$SQ722$::jsonb) as t(id text,kind text,title text,data jsonb)\non conflict(id) do update set kind=excluded.kind,title=excluded.title,data=excluded.data;\n-- END BUNDLED 7.22 TEMPLATES\nnotify pgrst,'reload schema';\ncommit;\n`;
await writeFile(url,sql);console.log(`Bundled ${templates.length} ready sources and Office tasks in 7.22 migration.`);
