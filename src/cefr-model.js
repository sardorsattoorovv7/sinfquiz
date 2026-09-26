export const cefrSkills=['listening','reading','writing','speaking'];
export const cefrLabels={listening:'Listening',reading:'Reading',writing:'Writing',speaking:'Speaking'};
export const cefrParts=[[8,6,4,5,6,6],[6,8,6,9,6],[3],[3,3,1,1]];
export const newCefrQuestion=(skill,id)=>({id,type:['writing','speaking'].includes(skill)?skill:'text',text:'',options:['','',''],answers:[],explanation:''});
export function newCefrTest(full=false){return {title:'',description:'',level:'B1–C1',format:full?'multilevel':'practice',rightsConfirmed:false,sections:cefrSkills.map((skill,s)=>({skill,minutes:[45,60,60,15][s],parts:(full?cefrParts[s]:[1]).map((count,p)=>({id:`${skill}-p${p+1}`,title:`Part ${p+1}`,text:'',audioUrl:'',imageUrl:'',source:'',questions:Array.from({length:count},(_,q)=>newCefrQuestion(skill,`${skill}-${p+1}-${q+1}`))}))}))}}
export function safeMediaUrl(value){
 if(typeof value==='string'&&/^\/cefr-audio\/mock-(?:[1-9]|10)-part-[1-6]\.mp3$/.test(value))return true;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}
}
export function cefrIssues(test){
 const issues=[];if(!test.title?.trim())issues.push('Variant nomini kiriting.');
 if(!test.rightsConfirmed)issues.push('Materiallardan foydalanish huquqini tasdiqlang.');
 const ids=new Set();
 cefrSkills.forEach((skill,s)=>{const section=test.sections?.[s];if(section?.skill!==skill){issues.push(`${cefrLabels[skill]} bo‘limi yetishmayapti.`);return}
  if(!Number.isInteger(Number(section.minutes))||section.minutes<1||section.minutes>180)issues.push(`${skill}: vaqt 1–180 daqiqa bo‘lsin.`);
  if(!section.parts?.length)issues.push(`${skill}: kamida bitta qism kerak.`);
  if(test.format==='multilevel'&&JSON.stringify(section.parts?.map(p=>p.questions.length))!==JSON.stringify(cefrParts[s]))issues.push(`${cefrLabels[skill]}: qismlardagi savollar ${cefrParts[s].join(', ')} ta bo‘lishi kerak.`);
  section.parts?.forEach((part,p)=>{const label=`${cefrLabels[skill]} / ${p+1}-qism`;
   if(!part.source?.trim())issues.push(`${label}: muallif yoki manba kerak.`);
   if(skill==='listening'&&!safeMediaUrl(part.audioUrl))issues.push(`${label}: audio manzilini kiriting.`);
   if(skill==='reading'&&!part.text?.trim())issues.push(`${label}: matn kerak.`);
   if(part.imageUrl&&!safeMediaUrl(part.imageUrl))issues.push(`${label}: rasm manzili noto‘g‘ri.`);
   if(!part.questions?.length)issues.push(`${label}: savol kerak.`);
   part.questions?.forEach((q,i)=>{if(!q.id||ids.has(q.id))issues.push(`${label}: savol ID takrorlangan.`);ids.add(q.id);
    if(!q.text?.trim())issues.push(`${label}, ${i+1}-savol matni bo‘sh.`);
    if(s<2){if(!['choice','text'].includes(q.type)||!q.answers?.some(a=>a.trim())||!q.explanation?.trim())issues.push(`${label}, ${i+1}-savol: kalit va izoh kerak.`);
     if(q.type==='choice'&&(!q.options||q.options.length<2||q.options.some(o=>!o.trim())||new Set(q.options).size!==q.options.length||q.answers?.some(a=>!q.options.includes(a))))issues.push(`${label}, ${i+1}-savol: variantlar va javob kalitini tekshiring.`);
    }else if(q.type!==skill)issues.push(`${label}: topshiriq turi noto‘g‘ri.`);
   });
  });
 });return issues;
}
export const cefrQuestions=(test,step)=>test.sections[step].parts.flatMap(part=>part.questions.map(q=>({...q,part})));
