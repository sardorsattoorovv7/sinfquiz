import {openExams,getOpenGroup} from './open-exams.js';

// Both variants reuse the sourced, reviewed exercises. Only answer options are
// adapted for the four-choice national-practice runner.
const mathWrong=[
 ['86','129','42'],['375','500','250'],['155','186','37'],['56','64','7'],
 ['16','24','12'],['64','72','9'],['224','672','336'],['275','250','20'],
 ['130','147','82'],['72','95','23'],['72','47','25'],['55','69','14'],
 ['30','18','16'],['21','28','7'],['1','4','7'],['2','5','18'],
 ['6','8','47'],['4','6','10'],['3','6','36'],['3','9','11'],
 ['2/13','77/3','5'],['-1','7','11'],['-3','9','-6'],['-2','4','-4'],
 ['-5','25','-25'],['-2','4','-4'],['-6','6','-3'],['-7','7','-2'],
 ['-8','8','-9'],['3','-3','-7']
];
const englishWrong={
 'welcome-2':['Ana','Anne','Annie'],
 'welcome-3':['400','1040','140'],
 'hello-1':['B3','A4','C4'],
 'hello-2':['C3','B2','D2'],
 'hello-3':['D4','C7','B7']
};
function convert(exam){
 return exam.questions.map((q,index)=>{
  const group=getOpenGroup(q.group),answer=String(Array.isArray(q.answer)?q.answer[0]:q.answer);
  const raw=q.type==='choice'?q.options:[answer,...(exam.subject==='math'?mathWrong[index]:englishWrong[q.id]||[])];
  const shift=index%4,options=[...raw.slice(shift),...raw.slice(0,shift)];
  return {id:'ready-'+q.id,type:'test',text:q.text,passage:group.text||'',topic:group.title,
   sourceUrl:group.sourceUrl,sourceReference:q.sourceReference,options,correct:options.indexOf(answer),
   answer,explanation:q.explanation,subject:exam.subject==='math'?'Matematika':'Ingliz tili',points:1,time:120};
 });
}
export const nationalReadyVariants=[
 {id:'ready-math-75',title:'Matematika — manbali algebra',subject:'Matematika',description:'Boydenning ochiq 1895-yilgi algebra kitobidan nisbat, tenglama, sistema va kvadrat tenglamalar.',durationMinutes:60,scoringModel:'general-certificate',questions:convert(openExams.find(e=>e.id==='math-mixed'))},
 {id:'ready-english-75',title:'Ingliz tili — Reading',subject:'Ingliz tili',description:'VOA Learning English matnlaridan 30 savol. 2004-yil arxiv raqamlari matn chop etilgan davrga tegishli.',durationMinutes:60,scoringModel:'general-certificate',questions:convert(openExams.find(e=>e.id==='english-mixed'))}
];
