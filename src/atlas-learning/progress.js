import {guideFor} from './guides.js';
export const subjects=['math','biology','chemistry','space','informatics','history'];
export const progressStorageKey=owner=>`sq:atlas-learning:v742:${owner||'guest'}`;
export const emptyLearning=()=>({version:1,entries:{},last:null});
const text=(v,max)=>typeof v==='string'?v.slice(0,max):'';
const safeId=id=>typeof id==='string'&&id.length>0&&id.length<=180&&!['__proto__','constructor','prototype'].includes(id);
export function sanitizeLearning(input){
 const output=emptyLearning();if(!input||typeof input!=='object')return output;
 for(const subject of subjects){const rows=input.entries?.[subject];if(!rows||typeof rows!=='object'||Array.isArray(rows))continue;
  output.entries[subject]={};for(const [id,row]of Object.entries(rows).slice(-400)){if(!safeId(id)||!row||typeof row!=='object')continue;
   output.entries[subject][id]={revision:text(row.revision,300),answer:Number.isInteger(row.answer)&&row.answer>=0&&row.answer<8?row.answer:null,observation:text(row.observation,1200),before:text(row.before,160),after:text(row.after,160),changed:text(row.changed,160),completed:row.completed===true,updatedAt:Number.isFinite(row.updatedAt)?Math.max(0,row.updatedAt):0};
  }
 }
 if(subjects.includes(input.last?.subject)&&safeId(input.last?.id))output.last={subject:input.last.subject,id:input.last.id};return output;
}
export function readLearning(storage,key){try{return sanitizeLearning(JSON.parse(storage?.getItem(key)||'null'));}catch{return emptyLearning();}}
export function lessonRevision(topic,guide){const value=JSON.stringify([topic.definition||guide.idea,guide.check.question,guide.check.options,guide.check.answer]);let hash=2166136261;for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);return `v1:${(hash>>>0).toString(36)}`;}
export function lessonRow(data,subject,id,revision){const row=data.entries?.[subject]?.[id];return row?.revision===revision?row:{revision,answer:null,observation:'',before:'',after:'',changed:'',completed:false,updatedAt:0};}
export function canComplete(row,check){return row.answer===check.answer&&row.observation.trim().length>=15&&row.changed.trim().length>=2&&row.before.trim().length>0&&row.after.trim().length>0;}
export function updateLearning(data,subject,id,patch){
 if(!subjects.includes(subject)||!safeId(id))return sanitizeLearning(data);
 return sanitizeLearning({...data,entries:{...data.entries,[subject]:{...data.entries?.[subject],[id]:{...data.entries?.[subject]?.[id],...patch,updatedAt:Date.now()}}},last:{subject,id}});
}
export function lessonCompleted(data,subject,topic){const guide=topic&&guideFor(subject,topic),row=topic&&data.entries?.[subject]?.[topic.id];return !!(guide&&row?.completed&&row.revision===lessonRevision(topic,guide)&&canComplete(row,guide.check));}
export function completedFor(data,subject,topics){return topics.filter(t=>lessonCompleted(data,subject,t)).length;}
export function nextInPath(path,data,subject,topics){return path.ids.find(id=>topics?!lessonCompleted(data,subject,topics.find(t=>t.id===id)):!data.entries?.[subject]?.[id]?.completed)||path.ids[0];}
