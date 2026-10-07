export const domains={patterns:{title:'Shakllar va qonuniyat',description:'Kataklar orasidagi qoida va aloqalar'},numbers:{title:'Sonli fikrlash',description:'Sonlar orasidagi o‘zgarish'},logic:{title:'Mantiqiy xulosa',description:'Berilgan shartdan aniq xulosa'},spatial:{title:'Fazoviy fikrlash',description:'Burish, akslantirish va yo‘nalish'}};
export const bands=['Tayanch · 5–6-sinfga mos mashqlar','O‘rta · 7–9-sinfga mos mashqlar','Murakkab · 10–11-sinfga mos mashqlar'];
export const resultNote='Bu mashqlarning natijasi. Yosh bo‘yicha me’yorlashtirilgan IQ balli, tashxis yoki rasmiy sertifikat emas. Turli variant va rejimlarni teng IQ shkalasi sifatida solishtirmang.';
export function scorePractice(items,answers={}){
 const profile=Object.keys(domains).map(domain=>{const selected=items.filter(x=>x.domain===domain),correct=selected.filter(x=>answers[x.id]===x.answer).length;return {domain,total:selected.length,correct,percent:selected.length?Math.round(100*correct/selected.length):0}});
 const correct=profile.reduce((s,x)=>s+x.correct,0),answered=items.filter(x=>Number.isInteger(answers[x.id])&&answers[x.id]>=0&&answers[x.id]<x.options.length).length;
 return {correct,total:items.length,answered,percent:items.length?Math.round(100*correct/items.length):0,profile};
}
export function formatTime(seconds){const n=Math.max(0,Math.floor(seconds));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`}
export function readPending(storage,key){try{const v=JSON.parse(storage.getItem(key));return v&&Array.isArray(v.changes)?v.changes.filter(x=>typeof x.questionId==='string'&&(x.choice===null||Number.isInteger(x.choice))&&Number.isInteger(x.expectedRevision)):[]}catch{return []}}
