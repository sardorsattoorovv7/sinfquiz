import {labParamSpecs} from './chemistry-labs.js';
import {chemistryScenes} from './chemistry-content.js';
export const chemistryParamSpecs={...labParamSpecs,atom:{protons:[8,1,20],neutrons:[8,0,35],electrons:[8,0,20]},states:{temperature:[20,-20,120]},rate:{temperature:[25,5,65]},ph:{acid:[1,0,10],base:[0,0,10]}};
export function validateChemistryForm(form){
 for(const [key,label,min,max] of [['title','Mavzu nomi',4,100],['definition','Ta’rif',12,700],['reason','Sabab izohi',12,700],['life','Hayotiy misol',12,700],['misconception','Xato tushuncha izohi',12,700],['challenge','Taxmin savoli',12,500],['feedback','Javob izohi',12,500]]){
  if(typeof form[key]!=='string'||form[key].trim().length<min||form[key].length>max)return `${label} ${min}–${max} belgi bo‘lsin.`;
 }
 if(!Object.hasOwn(chemistryScenes,form.scene))return 'Interaktiv sahnani tanlang.';
 if(!Number.isInteger(Number(form.grade))||Number(form.grade)<5||Number(form.grade)>11)return 'Sinf 5–11 oralig‘idagi butun son bo‘lsin.';
 if(!['number','string'].includes(typeof form.answer)||String(form.answer).trim()===''||!Number.isFinite(Number(form.answer))||Math.abs(Number(form.answer))>1000)return 'To‘g‘ri javobni −1000 dan 1000 gacha son bilan kiriting.';
 const params=form.parameters===undefined?{}:form.parameters;if(typeof params!=='object'||Array.isArray(params)||params===null)return 'Sahna parametrlari noto‘g‘ri.';
 const specs=chemistryParamSpecs[form.scene]||{};
 for(const [key,value] of Object.entries(params)){
  const spec=specs[key];if(!spec)return 'Bu sahna uchun begona parametr yuborildi.';
  if(typeof value!=='number'||!Number.isFinite(value)||value<spec[1]||value>spec[2]||(['protons','neutrons','electrons'].includes(key)&&!Number.isInteger(value)))return 'Boshlang‘ich parametr sahna chegarasiga mos emas.';
 }
 return '';
}
export function filterChemistryTopics(topics,{grade='all',source='all',query='',tab='map'}={}){
 const text=query.trim().toLocaleLowerCase('uz');
 return topics.filter(t=>(grade==='all'||t.grade<=Number(grade))&&(source==='all'||source==='builtin'&&!t.custom||source==='teachers'&&t.custom&&t.status==='published'&&t.active||source===`teacher:${t.ownerId}`&&t.custom&&t.status==='published'&&t.active)&&(!text||`${t.title} ${t.question||''} ${t.keywords||''} ${t.definition}`.toLocaleLowerCase('uz').includes(text))&&(tab==='lab'?t.scene.startsWith('lab-'):!t.scene.startsWith('lab-')));
}
export function readChemistryDraft(storage,key){
 try{const raw=storage.getItem(key);if(!raw)return {note:'',prediction:'',checked:false};
  try{const data=JSON.parse(raw);if(data?.version===1&&typeof data.note==='string')return {note:data.note.slice(0,1500),prediction:typeof data.prediction==='string'?data.prediction.slice(0,30):'',checked:data.checked===true,...(typeof data.sentKey==='string'?{sentKey:data.sentKey}:{}),...(typeof data.challengeKey==='string'?{challengeKey:data.challengeKey}:{})};}catch{}
  return {note:raw.slice(0,1500),prediction:'',checked:false};
 }catch{return {note:'',prediction:'',checked:false};}
}
export function writeChemistryDraft(storage,key,draft){try{storage.setItem(key,JSON.stringify({version:1,note:draft.note,prediction:draft.prediction,checked:draft.checked,...(typeof draft.sentKey==='string'?{sentKey:draft.sentKey}:{}),...(typeof draft.challengeKey==='string'?{challengeKey:draft.challengeKey}:{})}));return true;}catch{return false;}}
export const chemistrySubmissionKey=(prediction,note,challengeKey='')=>JSON.stringify([Number(prediction),note,challengeKey]);

export function chemistryDraftStorage(){try{return window.localStorage;}catch{return null;}}
