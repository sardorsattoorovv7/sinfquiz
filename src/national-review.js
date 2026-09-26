export function nationalReview(current){
 if(!current.finished)return [];
 return current.section.questions.map((q,index)=>({
  id:q.id,number:index+1,text:q.text,topic:q.topic||current.section.subject,
  selected:current.answers[index]??null,
  selectedText:q.options[current.answers[index]]??'Javob berilmagan',
  correctText:q.options[q.correct],correct:current.answers[index]===q.correct,
  explanation:q.explanation||'Ustoz bu savol uchun izoh kiritmagan.',
  sourceUrl:q.sourceUrl||current.section.sourceUrl||null,sourceReference:q.sourceReference||''
 }));
}

export function safeSourceUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null}catch{return null}
}
