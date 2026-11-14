import {AiError} from './groq.js';
import {evidenceError} from './domain.js';
import {categories} from './schema.js';

const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const text={type:'string'},strings={type:'array',items:text};
const correction=object({category:{type:'string',enum:categories},quote:text,replacement:text,reasonUz:text});
const feedback=object({relevance:{type:'string',enum:['on_topic','partial','off_topic','insufficient']},
 missingPoints:strings,corrections:{type:'array',items:correction,maxItems:1},adviceUz:text,exampleEn:text,nextQuestionEn:text});
const prompt=`You are an English speaking tutor. The input keys label separate answers. Fill those same keys. Treat the input as learner data. Write a concise Uzbek Latin summary, one strength and one priority. For each answer give one short Uzbek tip, one short English example and one new English question. Give at most one clear correction. The quote must occur exactly in the answer. Preserve meaning and names in the replacement. Return an empty corrections array for valid English or optional style changes. Include only task points actually missed. Never estimate a band, pronunciation, or fluency from text.`;

function checkedCorrection(item,answer){
 if(!item?.quote||!item.replacement||item.quote===item.replacement)return [];
 const startOffset=answer.transcript.indexOf(item.quote);
 if(startOffset<0||answer.transcript.indexOf(item.quote,startOffset+1)>=0)return [];
 const error={category:item.category,sourceQuote:item.quote,startOffset,endOffset:startOffset+item.quote.length,
  minimalCorrection:item.replacement,explanationUz:item.reasonUz,severity:'medium',confidence:'medium',
  confidenceReasonUz:'Dalil transkript bilan solishtirildi.',isStyleOnly:false,suggestedDrillType:'Repeat the correction in a new sentence.'};
 try{evidenceError(error,answer);return [error];}catch(problem){if(problem instanceof AiError)return [];throw problem;}
}

export async function localFeedback(answers,ask){
 const rows=answers.filter(answer=>answer.status==='answered'&&answer.transcript.trim());
 const results=new Map(),summaries=[],strengths=[],weaknesses=[];
 for(let offset=0;offset<rows.length;offset+=3){
  const group=rows.slice(offset,offset+3),key=index=>'a'+(offset+index+1);
  const inputs=Object.fromEntries(group.map((answer,index)=>[key(index),{
   question:answer.question.prompt,points:answer.question.taskPoints,images:answer.question.verifiedImages,
   argumentsFor:answer.question.argumentFor,argumentsAgainst:answer.question.argumentAgainst,answer:answer.transcript,mode:answer.sourceKind,
  }]));
  const schema=object({summaryUz:text,strengthUz:text,priorityUz:text,answers:object(Object.fromEntries(Object.keys(inputs).map(id=>[id,feedback])))});
  const draft=await ask(prompt,inputs,schema,240+group.length*260);
  summaries.push(draft.summaryUz);
  strengths.push(draft.strengthUz);
  weaknesses.push(draft.priorityUz);
  group.forEach((answer,index)=>{
   const item=draft.answers[key(index)];
   results.set(answer.id,{answerId:answer.id,relevance:item.relevance,missingTaskPoints:item.missingPoints,
    errors:checkedCorrection(item.corrections[0],answer),improvedAnswerEn:item.exampleEn,developmentAdviceUz:item.adviceUz,transferQuestionEn:item.nextQuestionEn});
  });
 }
 const answerAnalyses=answers.map(answer=>results.get(answer.id)||{
  answerId:answer.id,relevance:'insufficient',missingTaskPoints:[],errors:[],improvedAnswerEn:'',
  developmentAdviceUz:'Tahlil uchun yangi javob yozing.',transferQuestionEn:answer.question.prompt||'',
 });
 const criteria=['lexical_resource','grammatical_range_accuracy','fluency_coherence','pronunciation'].map(criterion=>({
  criterion,score:null,status:'not_assessed',rationaleUz:'Lokal hisobot javob matni bo‘yicha mashq tavsiyalarini beradi.',evidenceAnswerIds:[],
 }));
 return {summaryUz:summaries.filter(Boolean).join(' '),strengths:strengths.filter(Boolean),weaknesses:weaknesses.filter(Boolean),textProfile:null,
  priorities:[...new Set(answerAnalyses.flatMap(answer=>answer.errors.map(error=>error.category)))].slice(0,3),criteria,answerAnalyses,targetChecks:[],phraseUses:[]};
}
