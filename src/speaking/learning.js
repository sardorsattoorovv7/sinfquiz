// A small, topic-specific practice estimate. It is never a course/CEFR score.
export function diagnosticReport(questions,choices,{subjectUz,topicUz}){
 if(questions.length!==5||questions.some((q,i)=>!Number.isInteger(choices[i])||choices[i]<0||choices[i]>=q.options.length))return null;
 const items=questions.map((q,i)=>({question:q.question.slice(0,240),skillUz:q.skillUz,difficulty:q.difficulty,chosen:q.options[choices[i]].slice(0,350),expected:q.options[q.correctIndex].slice(0,350),correct:choices[i]===q.correctIndex}));
 return learningSummary(items,{subjectUz,topicUz});
}

export function learningSummary(items,{subjectUz,topicUz}){
 const correct=items.filter(q=>q.correct).length,groups=new Map();
 for(const item of items){const group=groups.get(item.skillUz)||{skillUz:item.skillUz,total:0,correct:0};group.total++;if(item.correct)group.correct++;groups.set(item.skillUz,group);}
 const skills=[...groups.values()],foundation=items.filter(q=>q.difficulty==='foundation');
 const band=foundation.some(q=>!q.correct)?'Asoslarni mustahkamlash kerak':correct>=4?'Murakkabroq mashqqa tayyorsiz':'Asoslar bor, amaliyot kerak';
 return {subjectUz,topicUz,total:5,correct,band,skills,items};
}

export function reportContext(report){
 return `${report.subjectUz} / ${report.topicUz}: ${report.correct}/${report.total}. Shu qisqa test xulosasi: ${report.band}. Mustahkamlash: ${report.skills.filter(s=>s.correct<s.total).map(s=>s.skillUz).join(', ')||'murakkabroq qo‘llash mashqlari'}.`;
}
