import {writeFile} from 'node:fs/promises';
import {office729Tasks,office729Quizzes} from '../data/office-729.js';
const rows=[...office729Quizzes.map(data=>({id:'quiz:'+data.templateKey,kind:'quiz',title:data.title,data})),...Object.entries(office729Tasks).map(([id,officeTask])=>({id:'office:'+id,kind:'quiz',title:officeTask.title,data:{officeTask}}))];
await writeFile(new URL('../data/competition-729/templates.sql',import.meta.url),`-- Original 34 questions and seven Office tasks; existing templates preserved.\ninsert into public.sq_comp_templates(id,kind,title,data)\nselect t.id,t.kind,t.title,t.data from jsonb_to_recordset($SQ729$${JSON.stringify(rows)}$SQ729$::jsonb) t(id text,kind text,title text,data jsonb)\non conflict(id) do update set kind=excluded.kind,title=excluded.title,data=excluded.data;\n`);
console.log('Built',office729Quizzes.map(q=>q.questions.length).join('/'),'question packs.');
