import {buildBank} from '../data/iq/build-bank.js';
import {builtinBooks} from '../src/textbooks/model.js';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const root=new URL('../',import.meta.url),write=(name,text)=>writeFileSync(new URL(name,root),text),quote=s=>`'${s.replaceAll("'","''")}'`;
mkdirSync(new URL('sql/7.25/',root),{recursive:true});mkdirSync(new URL('generated/',root),{recursive:true});
const items=buildBank();if(items.length!==144)throw Error('Expected 144 original items');
write('data/iq/items.json',JSON.stringify(items,null,2)+'\n');
const schema=readFileSync(new URL('data/iq/schema.sql',root),'utf8');write('supabase-migration-7.25.sql',schema);write('sql/7.25/01-schema.sql',schema);
for(let band=0;band<3;band++){
 const inserts=items.filter(x=>x.band===band).map(q=>{
  const {id,domain,prompt,visual,options,answer,explanation}=q,payload={id,domain,prompt,visual,options,answer,explanation};
  return `insert into public.sq_iq_items(id,bank_version,band,domain,payload) values(${quote(id)},1,${band},${quote(domain)},${quote(JSON.stringify(payload))}::jsonb) on conflict(id) do nothing;`;
 });write(`sql/7.25/0${band+2}-iq-band-${band+1}.sql`,'-- Original tasks. Run after 01-schema. Existing runs keep immutable snapshots.\nbegin;\n'+inserts.join('\n')+'\nnotify pgrst,\'reload schema\';\ncommit;\n');
}
const keys=builtinBooks.map(b=>`insert into public.sq_book_keys(id,subject,title,ordinal) values(${quote(b.id)},${quote(b.subject)},${quote(b.title)},${b.ordinal}) on conflict(id) do update set title=excluded.title,ordinal=excluded.ordinal;`);
write('sql/7.25/05-book-keys.sql','-- Lesson metadata only: no English answer keys or class content.\nbegin;\n'+keys.join('\n')+'\nnotify pgrst,\'reload schema\';\ncommit;\n');
const installParts=['01-schema.sql','02-iq-band-1.sql','03-iq-band-2.sql','04-iq-band-3.sql','05-book-keys.sql'];
write('supabase-migration-7.25.sql','-- COMPLETE 7.25 INSTALL: schema + 144 original IQ practice items + 198 book keys.\n-- Run this file ONCE after the existing SinfQuiz migrations.\n-- Alternative: run sql/7.25/01–05 separately in order. English 7.23 chunks are optional.\n'+installParts.map(f=>readFileSync(new URL('sql/7.25/'+f,root),'utf8')).join('\n'));
// Older English seed can exceed SQL Editor request size. Each generated line is
// a complete INSERT; never split inside its JSON or quoted SQL text.
mkdirSync(new URL('sql/english-7.23/',root),{recursive:true});
write('sql/english-7.23/01-schema.sql',readFileSync(new URL('data/english-course/schema.sql',root),'utf8'));
const rows=readFileSync(new URL('generated/english-course-seed.sql',root),'utf8').split('\n').filter(Boolean);
let parts=[],buffer=[],bytes=0;
for(const row of rows){const size=Buffer.byteLength(row+'\n');if(size>150000)throw Error('English statement exceeds chunk limit');if(bytes+size>150000&&buffer.length){parts.push(buffer);buffer=[];bytes=0}buffer.push(row);bytes+=size}if(buffer.length)parts.push(buffer);
const englishNames=[];parts.forEach((part,i)=>{const name=`${String(i+2).padStart(2,'0')}-lessons.sql`;englishNames.push(name);write('sql/english-7.23/'+name,'begin;\n'+part.join('\n')+'\ncommit;\n')});
write('sql/english-7.23/README.md',`# Ingliz kursini kichik so‘rovlar bilan o‘rnatish\n\n7.20–7.22 bazasi kerak. English kursi ishlayotgan bo‘lsa qayta o‘rnatish kerak emas.\n\n1. Avval 01-schema.sql ni SQL Editor’da RUN qiling. Bu sq_en_content turini ham yaratadi.\n2. Keyin ${englishNames.join(', ')} ni shu tartibda, har birini alohida RUN qiling. Har bir fayl to‘liq INSERTlardan iborat, 150 KB dan kichik.\n3. Yangi interfeysga qayting va sahifani yangilang.\n\nFayllar takror bajarilganda mavjud darslar va javoblarni almashtirmaydi (asl seedning ON CONFLICT DO NOTHING qoidasi saqlanadi). Qismlar oralig‘ida o‘quvchi kursni boshlamasin: barcha dars va yakuniy banklar kiritilgach kurs tayyor bo‘ladi. **01-schema** bajarilmasdan lesson fayllarini RUN qilmang.\n`);
write('generated/iq-library-manifest.json',JSON.stringify({version:'7.25.0',items:items.length,domains:4,itemsPerBand:48,itemsPerTimedForm:32,books:builtinBooks.length,subjects:Object.fromEntries(['chemistry','english','biology','informatics'].map(s=>[s,builtinBooks.filter(b=>b.subject===s).length])),englishSeedParts:parts.length},null,2)+'\n');
console.log(JSON.stringify({items:items.length,books:builtinBooks.length,englishSeedParts:parts.length}));
