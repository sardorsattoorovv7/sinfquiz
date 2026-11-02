const obj=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const str={type:'string'},num={type:'number'},integer={type:'integer'},boolean={type:'boolean'},strings={type:'array',items:str},nullable=type=>({type:[type,'null']}),enm=(...values)=>({type:'string',enum:values}),arr=items=>({type:'array',items});
export const categories=['missing_be','subject_verb_agreement','verb_pattern','tense_aspect','article','preposition','countability_number','word_order','collocation','pronoun_reference','relevance','answer_development'];
const error=obj({category:enm(...categories),sourceQuote:str,startOffset:integer,endOffset:integer,minimalCorrection:str,explanationUz:str,severity:enm('low','medium','high'),confidence:enm('low','medium','high'),confidenceReasonUz:str,isStyleOnly:boolean,suggestedDrillType:str});
const use=obj({answerId:str,sourceQuote:str,startOffset:integer,endOffset:integer,confidence:enm('low','medium','high'),correctUse:boolean});
export const assessmentSchema=obj({summaryUz:str,textProfile:nullable('string'),strengths:strings,weaknesses:strings,priorities:arr(enm(...categories)),criteria:arr(obj({criterion:enm('lexical_resource','grammatical_range_accuracy','fluency_coherence','pronunciation'),score:nullable('number'),status:enm('estimate','not_assessed'),rationaleUz:str,evidenceAnswerIds:strings})),answerAnalyses:arr(obj({answerId:str,relevance:enm('on_topic','partial','off_topic','insufficient'),missingTaskPoints:strings,errors:arr(error),improvedAnswerEn:str,developmentAdviceUz:str,transferQuestionEn:str})),targetChecks:arr(obj({...use.properties,category:enm(...categories)})),phraseUses:arr(obj({...use.properties,vocabularyId:str}))});
const task=obj({kind:enm('warmup','vocabulary','drill','speaking','reflection'),minutes:integer,instructionsUz:str,successUz:str,promptsEn:strings,sourceErrorIds:strings});
export const roadmapSchema=obj({diagnosisUz:str,focus:arr(obj({category:enm(...categories),reasonUz:str,sourceErrorIds:strings})),weeks:arr(obj({week:integer,goalUz:str,successUz:str})),days:arr(obj({topic:str,whyUz:str,tasks:arr(task)})),adaptationUz:str});
export const vocabSchema=obj({items:arr(obj({phraseEn:str,meaningUz:str,pattern:str,usageNoteUz:str,exampleEn:str,exampleUz:str,personalisedExampleEn:str,commonMistake:str,correctVersion:str,recallTask:str,transferQuestion:str,sourceErrorIds:strings}))});
export const guideSchema=obj({answerUz:str,routeIds:strings});
export function validateSchema(value,schema,path='$'){
 const types=Array.isArray(schema.type)?schema.type:[schema.type],type=value===null?'null':Array.isArray(value)?'array':typeof value;
 if(!types.includes(type)&&!(type==='number'&&types.includes('integer')&&Number.isInteger(value)))throw Error('AI_SCHEMA:'+path);
 if(schema.enum&&!schema.enum.includes(value))throw Error('AI_SCHEMA:'+path);
 if(type==='number'&&!Number.isFinite(value))throw Error('AI_SCHEMA:'+path);
 if(type==='object'){for(const key of schema.required||[])if(!Object.hasOwn(value,key))throw Error('AI_SCHEMA:'+path+'.'+key);for(const [key,item] of Object.entries(value)){if(!Object.hasOwn(schema.properties,key))throw Error('AI_SCHEMA:'+path+'.'+key);validateSchema(item,schema.properties[key],path+'.'+key);}}
 if(type==='array'){if(value.length>150)throw Error('AI_SCHEMA:too_many_items');value.forEach((v,i)=>validateSchema(v,schema.items,path+'['+i+']'));}
 if(type==='string'&&value.length>60000)throw Error('AI_SCHEMA:too_long');return value;
}
