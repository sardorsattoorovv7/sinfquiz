import {computerCourse} from '../../data/computer-course.js';
import {courseGuides} from '../../data/course-guides.js';
import {pythonCourse,pythonGuides,pythonLessonContent} from '../../data/python-course.js';
import {chemistryTopics} from '../chemistry-content.js';
import {biologyTopics} from '../biology-content.js';
import {chemistryLessons,biologyLessons} from '../../data/science-textbooks.js';
import {catalog as englishCatalog} from '../english-course/catalog.js';
export const subjects=[{id:'chemistry',title:'Kimyo',subtitle:'Atomdan modda va reaksiyalargacha',color:'amber'},{id:'english',title:'Ingliz tili',subtitle:'Tayyorlovdan C1 gacha izchil kurs',color:'blue'},{id:'biology',title:'Biologiya',subtitle:'Hujayradan tirik tizimlargacha',color:'green'},{id:'informatics',title:'Informatika',subtitle:'Kompyuter, Office va amaliy Python',color:'violet'}];
const science=(topics,lessons,subject)=>topics.map((t,i)=>{
 const [example,activity,question,options,answer,explanation,diagram]=lessons[t.id];
 return {id:`book-${subject}-${t.id}`,subject,title:t.title,summary:t.question,group:t.group,ordinal:i+1,grade:t.grade,minutes:12,kind:'science',topicId:t.id,definition:t.definition,reason:t.reason,life:t.life,misconception:t.misconception,prerequisites:t.prerequisites.map(id=>`book-${subject}-${id}`),example,activity,diagram,checks:[{question,options,answer,explanation}],source:'SinfQuiz asosiy kursi'};
});
export const builtinBooks=[...science(chemistryTopics,chemistryLessons,'chemistry'),...englishCatalog.map((l,i)=>({id:'book-'+l.id,subject:'english',title:l.title,summary:l.objective,group:l.level==='PRE'?'Tayyorlov':l.level,ordinal:i+1,minutes:l.minutes,kind:'english',courseId:l.id,prerequisites:l.prerequisites.map(id=>'book-'+id),source:'SinfQuiz ingliz kursi'})),...science(biologyTopics,biologyLessons,'biology'),...computerCourse.map((l,i)=>({...l,id:'book-computer-'+l.slug,originalSubject:l.subject,subject:'informatics',group:l.subject,ordinal:i+1,minutes:15,kind:'computer',guide:courseGuides[l.slug],source:'SinfQuiz kompyuter kursi'})),...pythonCourse.map((l,i)=>({...l,id:'book-python-'+l.slug,subject:'informatics',group:'Python',ordinal:computerCourse.length+i+1,minutes:20,kind:'python',content:pythonLessonContent(l),guide:pythonGuides[l.slug],source:'SinfQuiz Python kursi'}))];
export const bookById=Object.fromEntries(builtinBooks.map(b=>[b.id,b]));
export const normalizeSearch=s=>String(s||'').toLowerCase().replace(/[‘’ʻʼ`']/g,'').replace(/\s+/g,' ').trim();
export function subjectId(name){const n=normalizeSearch(name);return /kimyo|chemistry/.test(n)?'chemistry':/ingliz|english/.test(n)?'english':/biolog|botan|zoolog/.test(n)?'biology':/informati|kompyuter|word|excel|powerpoint|python/.test(n)?'informatics':'other'}
export function availableBooks(documents,user){
 const docs=documents.filter(d=>d.visibility==='public'||['teacher','admin'].includes(user.role)&&d.ownerId===user.id);
 // An edited published course lesson supersedes its original only for that row;
 // teacher identity remains visible and no writes are made to existing lessons.
 const installed=new Map();for(const b of builtinBooks){if(!b.slug)continue;const row=docs.find(d=>/^(computer-course|python-course)/.test(d.sourcePackage||'')&&d.id.endsWith('-'+b.slug));if(row)installed.set(b.id,row)}
 const used=new Set([...installed.values()].map(d=>d.id));
 return [...builtinBooks.map(b=>installed.has(b.id)?{...b,title:installed.get(b.id).title,summary:installed.get(b.id).summary,document:installed.get(b.id),source:installed.get(b.id).ownerName||'Ustoz'}:b),...docs.filter(d=>!used.has(d.id)).map(d=>({id:'document:'+d.id,subject:subjectId(d.subject),title:d.title,summary:d.summary||String(d.content||'').slice(0,130),group:d.subject,ordinal:Number(d.courseOrder)||1000,kind:'document',document:d,source:d.ownerName||'Ustoz',originalSubject:d.subject}))];
}
export function filterBooks(books,{subject='all',query='',group='all'}={}){const q=normalizeSearch(query);return books.filter(b=>(subject==='all'||b.subject===subject)&&(group==='all'||b.group===group)&&(!q||normalizeSearch(`${b.title} ${b.summary} ${b.group} ${b.source} ${subjects.find(s=>s.id===b.subject)?.title}`).includes(q))).sort((a,b)=>a.ordinal-b.ordinal||a.title.localeCompare(b.title,'uz'))}
