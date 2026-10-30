import {history,components,questions,assemblyTasks} from './content.js';

export const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,Number(value)||0));
export const emptyProgress=()=>({version:1,eras:[],parts:[],assembly:[],answers:{}});
const known=(values,allowed)=>[...new Set((Array.isArray(values)?values:[]).filter(v=>allowed.includes(v)))];
export function validateProgress(input){
 const p=input&&typeof input==='object'?input:{};
 const answers={};
 for(const q of questions){const v=p.answers?.[q.id];if(Number.isInteger(v)&&v>=0&&v<q.options.length)answers[q.id]=v;}
 return {version:1,eras:known(p.eras,history.map(x=>x.id)),parts:known(p.parts,components.map(x=>x.id)),assembly:known(p.assembly,assemblyTasks.map(x=>x.id)),answers};
}
export function readProgress(key,storage){try{return validateProgress(JSON.parse(storage.getItem(key)||'null'));}catch{return emptyProgress();}}
export function scoreQuiz(answers={}){return questions.reduce((n,q)=>n+(answers[q.id]===q.answer?1:0),0);}
export function learningProgress(p){const v=validateProgress(p),done=v.eras.length+v.parts.length+v.assembly.length+scoreQuiz(v.answers);return {done,total:history.length+components.length+assemblyTasks.length+questions.length,percent:Math.round(done/(history.length+components.length+assemblyTasks.length+questions.length)*100)};}
export function byteValue(bits){return Array.from({length:8},(_,i)=>bits?.[i]===1?1:0).reduce((v,b)=>v*2+b,0);}
export function byteLabel(value){const n=clamp(value,0,255);return n>=32&&n<=126?String.fromCharCode(n):'Bosilmaydigan / ASCII doirasidan tashqari';}
export function memoryAction(state,action){
 switch(action.type){
  case 'edit':return state.power?{...state,ram:String(action.value).slice(0,160)}:state;
  case 'save':return state.power?{...state,disk:state.ram}:state;
  case 'load':return state.power?{...state,ram:state.disk}:state;
  case 'power':return {...state,power:!state.power,ram:''};
  default:return state;
 }
}
export function progressKey(owner){return `sq:informatics-atlas:v1:${owner||'guest'}`;}
