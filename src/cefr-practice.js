export const practiceSkills=['listening','reading','writing','speaking'];
export const practiceMinutes=[45,60,60,15];
export function validPractice(s){
 return !!s&&s.version===1&&typeof s.source?.title==='string'&&Number.isInteger(s.step)&&s.step>=0&&s.step<4&&Number.isFinite(s.endsAt)&&typeof s.finished==='boolean'&&Number.isInteger(s.plays)&&s.plays>=0&&s.plays<=2&&Array.isArray(s.completed)&&['listening','reading'].every(k=>Array.isArray(s.answers?.[k])&&s.answers[k].length===35&&s.answers[k].every(v=>typeof v==='string'))&&Array.isArray(s.writing)&&s.writing.length===3&&s.writing.every(v=>typeof v==='string');
}
export function newPractice(source,now=Date.now()){
 return {version:1,source,step:0,startedAt:now,endsAt:now+practiceMinutes[0]*60000,finished:false,plays:0,answers:{listening:Array(35).fill(''),reading:Array(35).fill('')},writing:['','',''],notes:'',completed:[]};
}
export function advancePractice(current,now=Date.now(),manual=false){
 let s=current;
 while(!s.finished&&(manual||now>=s.endsAt)){
  const end=manual?now:s.endsAt,completed=[...s.completed,{skill:practiceSkills[s.step],at:end}];
  if(s.step===3)return {...s,completed,finished:true,finishedAt:end};
  s={...s,completed,step:s.step+1,endsAt:end+practiceMinutes[s.step+1]*60000};
  if(manual)break;
 }
 return s;
}
export function setPracticeAnswer(current,index,value,now=Date.now()){
 const state=advancePractice(current,now);
 if(state!==current||state.finished||state.step>1||!Number.isInteger(index)||index<0||index>34)return state;
 const skill=practiceSkills[state.step],answers=[...state.answers[skill]];
 answers[index]=String(value).slice(0,120);
 return {...state,answers:{...state.answers,[skill]:answers}};
}
export function finishPractice(current,now=Date.now()){
 if(current.finished)return current;
 return {...current,finished:true,finishedAt:now};
}
export function wordCount(text){return text.trim().match(/\S+/gu)?.length||0}
