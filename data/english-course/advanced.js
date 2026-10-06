import {make} from './factory.js';
// Each specification below is independently authored. This adapter only assembles exercise formats.
export function advanced(level,n,s){
 const id=`en-${level.toLowerCase()}-${String(n).padStart(2,'0')}`;
 const ex=s.ex,fill=s.fill,fix=s.fix;
 const lesson=make(level,n,{t:s.t,goal:s.goal,context:s.context,rule:s.rules,pattern:s.pattern,ex,v:s.v,
 read:s.read,rt:s.rt||'Asosiy matn va muallif pozitsiyasi',rq:s.rq,evidence:s.evidence,
 listen:s.listen,lt:s.lt||'Boshqa nuqtayi nazarni tinglang',lq:s.lq,table:s.table,
 gap:fill[0].join('|'),fix:fix.join('|'),mc:s.mc,
 exit:[fill[0],fill[1],fill[2],s.mc,s.rq[1]],
 wtask:s.task,audience:s.audience||'Maktab kengashi yoki loyiha guruhi',minWords:s.minWords|| (level==='C1'?120:90),write:s.model,
 plan:s.plan||['Da’vo va maqsadni aniqlang.','Reading va listeningdan bir dalilni qiyoslang.','Cheklov yoki qarshi fikrni tushuntiring.','Auditoriyaga mos amaliy xulosa yozing.'],
 wnotes:s.notes||['Kirishda auditoriya va maqsad aniq.','Asosiy qism dalilni talqin bilan bog‘laydi.','Yakun haddan tashqari umumlashtirmaydi.'],
 speak:s.speak,sprompts:['Reading va listening qayerda mos, qayerda farqli?','Sherigingizning e’tiroziga javob bering.','Qaysi dalil xulosangizni o‘zgartirishi mumkin?'],real:s.real||s.task,
 visual:s.visual||'argument',extra:[{id:id+'-transform',type:'transformation',skill:'grammar',prompt:s.transform[0],answers:[s.transform[1]],hint:s.pattern,explanation:s.rules[0]},
 {id:id+'-paragraphs',type:'paragraphOrder',skill:'reading',prompt:'Fikrni tartiblang: da’vo → dalil → talqin.',tokens:s.structure,answers:[s.structure.join('\n')],hint:'Da’vo nimani aytadi? Dalil nimani ko‘rsatadi?',explanation:'Dalil yakuniy xulosaning o‘rnini bosmaydi; talqin ularning aloqasini tushuntiradi.'}]});
 lesson.visuals[1]={kind:'argument',title:'Fikr va dalilning aloqasi',items:s.structure};
 return lesson;
}
export function brief(level,n,s){
 const [prompt,answer,wrong1,wrong2,reason]=s.question;
 const parts=s.read.match(/[^.!?]+[.!?]+|[^.!?]+$/g).map(x=>x.trim());
 const e=s.ex,words=s.v.split(';');
 return advanced(level,n,{...s,rules:s.rules.split('|'),v:words,
 rq:[s.question,[s.inference[0],s.inference[1],s.inference[2],s.inference[3],s.inference[4]]],
 listen:s.listen||`Speaker one: ${parts[0]} ${parts[1]} Speaker two: ${s.response}`,lq:[s.question,[s.inference[0],s.inference[1],s.inference[2],s.inference[3],s.inference[4]]],
 table:[['Birinchi gapdagi asosiy so‘z',s.keyword],['Sherikning asosiy fikri',s.responseKey]],
 // The two keywords are explicitly spoken, not inferred from absent details.
 ...(s.listen?{}:{listen:`Speaker one: Our key word is ${s.keyword}. ${parts[0]} ${parts[1]} Speaker two: My main point is ${s.responseKey}. ${s.response} ${s.read}`}),
 fill:s.fill,fix:s.fix,mc:s.question,
 transform:s.transform,structure:s.structure,
 minWords:s.minWords||70,goal:s.goal,context:s.context||s.t,
 speak:s.speak||`Reading va listeningni taqqoslang. ${s.task} Sherigingizning e’tiroziga javob bering.`});
}
