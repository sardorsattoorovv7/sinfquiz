// Models can quote text accurately while miscounting character positions.
// Align only an unambiguous, exact substring; the domain validator remains
// responsible for rejecting missing/ambiguous evidence and unsafe corrections.
export function alignAssessmentEvidence(value,answers){
 const result=structuredClone(value),byId=new Map(answers.map(answer=>[answer.id,answer.transcript]));
 const align=(item,text)=>{
  if(typeof text!=='string'||typeof item.sourceQuote!=='string'||!item.sourceQuote)return;
  const {startOffset,endOffset,sourceQuote}=item;
  if(Number.isInteger(startOffset)&&Number.isInteger(endOffset)&&startOffset>=0&&endOffset>startOffset&&text.slice(startOffset,endOffset)===sourceQuote)return;
  const first=text.indexOf(sourceQuote);
  if(first<0||text.indexOf(sourceQuote,first+1)>=0)return;
  item.startOffset=first;item.endOffset=first+sourceQuote.length;
 };
 for(const analysis of result.answerAnalyses||[])for(const error of analysis.errors||[])align(error,byId.get(analysis.answerId));
 for(const field of ['targetChecks','phraseUses'])for(const item of result[field]||[])align(item,byId.get(item.answerId));
 return result;
}
