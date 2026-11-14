import {practiceTransferQuestions} from './questions.js';

const weeklyGoals=[
 ['Savolga aniq javob bering.','Birinchi gap fikringizni ochiq aytadi.'],
 ['Javobni sabab va misol bilan kengaytiring.','Misol bergan sababingizni tushuntiradi.'],
 ['Hisobotdagi tuzatishlarni yangi mavzuda qo‘llang.','Yangi gapda tuzatilgan shaklni ishlatasiz.'],
 ['Yangi savolga vaqt bilan javob bering.','Javobni rejasiz boshlab, fikrni yakunlaysiz.'],
 ['Aniqroq so‘z va iboralarni qo‘llang.','Iborani ikki turli mavzuga moslab aytasiz.'],
 ['Fikrning boshqa tomonini ko‘rib chiqing.','Ikki nuqtai nazarni misollar bilan izohlaysiz.'],
 ['Oldingi qiyin savol turini qayta mashq qiling.','Yangi misolda o‘rgangan tuzatishni qo‘llaysiz.'],
 ['To‘liq sinovni yangi savollar bilan bajaring.','Keyingi tahlilga mustaqil javoblar topshirasiz.'],
];

export function roadmapFromReport({target,evidence,priorities,weekCount,dailyBudgets}){
 const seen=new Set(evidence.map(answer=>answer.questionId));
 const bank=practiceTransferQuestions.filter(question=>question.exam===target.exam_mode&&!question.imageIds.length);
 const questions=[...bank.filter(question=>!seen.has(question.id)),...bank.filter(question=>seen.has(question.id))].slice(0,7);
 const focus=priorities.map(({category,examples})=>({
  category,reasonUz:examples[0].explanationUz,sourceErrorIds:examples.slice(0,2).map(error=>error.errorId),
 }));
 const examples=priorities.flatMap(priority=>priority.examples.slice(0,2));
 const days=questions.map((question,index)=>{
  const example=examples.length?examples[index%examples.length]:null;
  const drillPrompts=[
   example?.minimalCorrection?`Say the corrected phrase aloud. “${example.minimalCorrection}”`:'Answer the question in one complete sentence.',
   'Use the same structure in a sentence about yourself.',
   'Say a similar sentence about a different person.',
   'Add when or where it happened.',
   'Explain why using “because”.',
   'Give one new example from memory.',
  ];
  const tasks=[
   {kind:'warmup',instructionsUz:'Mavzuga oid ikki fikrni ovoz chiqarib ayting.',successUz:'Har bir fikrni to‘liq gap bilan ifodalaysiz.',promptsEn:['Name two ideas you associate with this topic.',question.prompt]},
   {kind:'vocabulary',instructionsUz:'Savoldan bir foydali iborani tanlab, yangi gap tuzing.',successUz:'Iboraning ma’nosi yangi gapga mos keladi.',promptsEn:['Use an expression from the question in a different situation.']},
   {kind:'drill',instructionsUz:'Har bir topshiriq uchun bittadan yangi gapni ovoz chiqarib ayting.',successUz:'Tuzatilgan shaklni yangi misolda ishlatasiz.',promptsEn:drillPrompts},
   {kind:'speaking',instructionsUz:'Savolga javob bering, sabab va hayotiy misol keltiring.',successUz:'Javob savolga mos va misol bilan asoslangan.',promptsEn:[question.prompt,...question.taskPoints,...(question.argumentFor||[]),...(question.argumentAgainst||[])]},
   {kind:'reflection',instructionsUz:'Javobingizdagi bir kuchli jihatni va bir tuzatishni yozing.',successUz:'Keyingi javobda sinaydigan o‘zgarishni belgilaysiz.',promptsEn:['Which part of your answer would you change next time?']},
  ].map((task,position)=>({...task,minutes:dailyBudgets[position],sourceErrorIds:task.kind==='drill'&&example?[example.errorId]:[]}));
  return {topic:question.topic,whyUz:example?.explanationUz||'Javobni sabab va misol bilan kengaytirishni mashq qiling.',tasks};
 });
 return {
  diagnosisUz:target.payload.summaryUz||'Mashqlar Speaking hisobotingiz asosida tanlandi.',
  focus,weeks:weeklyGoals.slice(0,weekCount).map(([goalUz,successUz],i)=>({week:i+1,goalUz,successUz})),days,
  adaptationUz:'Mashqlar saqlangan Speaking hisoboti va o‘qish jadvalingiz asosida tuzildi.',
 };
}
