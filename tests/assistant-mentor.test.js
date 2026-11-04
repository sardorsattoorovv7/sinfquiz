import test from 'node:test';
import assert from 'node:assert/strict';
import {assistantInput,assistantLocalAnswer,mentorSchema,runAssistant} from '../server/assistant/service.js';
import {createAssistantHandler} from '../api/ai-assistant.js';
import {diagnosticReport} from '../src/speaking/learning.js';
import {validateSchema} from '../server/speaking/schema.js';

const actor={id:'mentor-student',role:'student'},env={GROQ_API_KEY:'test-only-provider-key'};
const quiz=()=>({answerUz:'Kasrlar bo‘yicha beshta savolni bajaramiz. Natijaga qarab keyingi mashqni tanlaymiz.',routeIds:[],quizType:'diagnostic',subjectUz:'Matematika',topicUz:'Kasrlar',questions:Array.from({length:5},(_,i)=>({question:`${i+2}/8 kasrida maxraj qaysi son?`,options:[String(i+2),'8','1','16'],correctIndex:1,explanationUz:'Kasr chizig‘i ostidagi son maxraj bo‘lib, butun nechta teng qismga bo‘linganini bildiradi.',skillUz:i<2?'Kasrning tuzilishi':i<4?'Kasrni qo‘llash':'Yangi vaziyatda qo‘llash',difficulty:['foundation','foundation','application','application','challenge'][i]}))});
const input={mode:'mentor',message:'Kasrlar bo‘yicha bilimimni tekshiring.',view:'aiGuide'};
const generate=value=>async()=>({value,model:'fixture'});

test('current page, previous page and guide selection remain distinct and role-scoped',()=>{
 const data=assistantInput({...input,originView:'biology',focusView:'mathAtlas'},'student');
 assert.equal(data.currentPage.title,'AI yordamchi');assert.equal(data.openedFrom.title,'Biologiya');assert.equal(data.focusedFeature.title,'Matematika');
 const denied=assistantInput({...input,view:'admin',originView:'classroom',focusView:'admin'},'student');
 assert.equal(denied.view,'aiGuide');assert.equal(denied.openedFrom,null);assert.equal(denied.focusedFeature,null);
 assert.equal(assistantInput({...input,mode:'guide',message:'Darajamni tekshiring.'}).mode,'diagnostic');
});

test('where am I answers the real page immediately, without a model or a fabricated atlas lesson',async()=>{
 const result=await runAssistant({...input,message:'qayerdaman',originView:'biology',focusView:'atlasHub'},actor,{env:{},generate:()=>{throw Error('must not call provider')}});
 assert.match(result.answerUz,/“AI yordamchi” sahifasidasiz/);assert.doesNotMatch(result.answerUz,/AtlasHub|Model|ikki sinov/);assert.deepEqual(result.routeIds,[]);
 for(const view of ['home','biology','practice']){
  const reply=assistantLocalAnswer({...input,view,message:'Men hozir qayerdaman?'},actor);
  assert.match(reply.answerUz,new RegExp(assistantInput({...input,view}).currentPage.title));
 }
 assert.equal(assistantLocalAnswer({...input,message:'Atlasni qayerdan ochaman?'},actor),null);
});

test('local location help still authenticates, but skips paid/shared AI quotas',async()=>{
 let reserves=0,providers=0;
 const handler=createAssistantHandler({env:{},authenticate:async()=>actor,reserve:async()=>{reserves++},respond:async()=>{providers++}}),res={setHeader(){},status(code){this.code=code;return this},json(data){this.data=data;return this}};
 await handler({method:'POST',headers:{authorization:'Bearer fixture',host:'localhost'},body:{...input,message:'Hozir qayerdaman?'}},res);
 assert.equal(res.code,200);assert.equal(reserves,0);assert.equal(providers,0);assert.match(res.data.answerUz,/AI yordamchi/);
});

test('mentor diagnostic enforces five distinct questions with reviewed difficulty order and topic metadata',async()=>{
 const value=quiz();validateSchema(value,mentorSchema);
 let options;
 assert.equal((await runAssistant(input,actor,{env,generate:async(_p,_d,_s,opts)=>{options=opts;return {value}}})).questions.length,5);
 assert.equal(options.model,'openai/gpt-oss-120b');
 for(const change of [v=>v.questions.pop(),v=>v.questions[1]=structuredClone(v.questions[0]),v=>v.questions[0].difficulty='challenge',v=>v.subjectUz='',v=>v.questions[0].skillUz='']){
  const bad=structuredClone(value);change(bad);await assert.rejects(runAssistant(input,actor,{env,generate:generate(bad)}),{code:'AI_INVALID_OUTPUT'});
 }
 const clarification={answerUz:'Qaysi fan bo‘yicha bilimni tekshiramiz?',routeIds:[],quizType:'none',subjectUz:'',topicUz:'',questions:[]};
 assert.deepEqual((await runAssistant({...input,message:'Bilimimni tekshiring.'},actor,{env,generate:generate(clarification)})).questions,[]);
 const placeholder={...clarification,subjectUz:'placeholder',questions:[{question:''}]};
 const textReply=await runAssistant({...input,message:'Buni yanada sodda qilib ayting.'},actor,{env,generate:generate(placeholder)});
 assert.deepEqual(textReply.questions,[]);assert.equal(textReply.subjectUz,'');
});

test('a vague level-check request asks for the subject, while an established topic remains available to the teacher',async()=>{
 const reply=await runAssistant({...input,message:'Bilimimni qisqa test bilan tekshiring.'},actor,{env:{},generate:()=>{throw Error('no arbitrary quiz')}});
 assert.match(reply.answerUz,/Qaysi fan yoki mavzu/);assert.equal(reply.quizType,'none');
 assert.equal(assistantLocalAnswer({...input,message:'Bilimimni tekshiring.',history:[{role:'user',content:'Kasrlarni tushuntiring.'}]},actor),null);
 assert.equal(assistantLocalAnswer({...input,message:'Darajamni aniqlang.',view:'biology'},actor),null);
});

test('a diagnostic is scored only after five choices, and a foundation gap is reflected in the next step',()=>{
 const value=quiz();assert.equal(diagnosticReport(value.questions,{0:1},value),null);
 const report=diagnosticReport(value.questions,{0:0,1:1,2:1,3:1,4:1},value);
 assert.equal(report.correct,4);assert.match(report.band,/Asoslarni mustahkamlash/);assert.equal(report.skills[0].correct,1);
 const perfect=diagnosticReport(value.questions,{0:1,1:1,2:1,3:1,4:1},value);assert.match(perfect.band,/Murakkabroq/);
});

test('next teacher turn receives actual missed skills and choices; inflated totals and claimed level are discarded',async()=>{
 const value=quiz(),report=diagnosticReport(value.questions,{0:0,1:1,2:0,3:1,4:1},value),next={...input,message:'Xatolarimni tushuntiring.',learning:[{...report,correct:5,total:99,band:'IELTS 9'}]};
 let context,prompt;
 const response={answerUz:'Avval kasrning maxrajini ko‘rib chiqamiz.',routeIds:[],quizType:'none',subjectUz:'',topicUz:'',questions:[]};
 await runAssistant(next,actor,{env,generate:async(p,data)=>{prompt=p;context=data;return {value:response}}});
 assert.equal(context.learning[0].correct,3);assert.equal(context.learning[0].total,5);assert.doesNotMatch(context.learning[0].band,/IELTS/);assert.equal(context.learning[0].items[0].chosen,value.questions[0].options[0]);assert.match(prompt,/patient tutor/);
 const repeated={...value,quizType:'practice',questions:value.questions.slice(0,3)};
 await assert.rejects(runAssistant({...next,message:'Keyingi mashqni bering.'},actor,{env,generate:generate(repeated)}),{code:'AI_INVALID_OUTPUT'});
 const malformed=structuredClone(next);malformed.learning[0].items[0].expected='x'.repeat(351);
 assert.throws(()=>assistantInput(malformed),{code:'ASSISTANT_LEARNING'});
});

test('teacher replies replace internal camelCase route identifiers with visible page labels',async()=>{
 const result=await runAssistant({...input,message:'Atlaslar haqida ayting.'},actor,{env,generate:generate({answerUz:'AtlasHub bo‘limida mavzuni tanlang.',routeIds:['atlasHub','admin'],quizType:'none',subjectUz:'',topicUz:'',questions:[]})});
 assert.equal(result.answerUz,'Atlaslar bo‘limida mavzuni tanlang.');assert.deepEqual(result.routeIds,['atlasHub']);
});

test('a generic question stem with new answer content is a new exercise, not a technical failure',async()=>{
 const value=quiz(),report=diagnosticReport(value.questions,{0:0,1:1,2:0,3:1,4:1},value);
 report.items[0]={...report.items[0],question:'Choose the correct sentence.',chosen:'She go to school.',expected:'She goes to school.'};
 const next={...value,quizType:'practice',subjectUz:'Ingliz tili',topicUz:'Present Simple',questions:[{question:'Choose the correct sentence.',options:['He plays football.','He play football.','He playing football.','He played footballs.'],correctIndex:0,skillUz:'Uchinchi shaxs birlik',difficulty:'foundation',explanationUz:'He bilan plays shakli ishlatiladi.'},...value.questions.slice(1,3).map((q,i)=>({...q,question:'Yangi masala '+i+': '+q.question}))]};
 assert.equal((await runAssistant({...input,message:'Yangi mashqni bering.',learning:[report]},actor,{env,generate:generate(next)})).questions.length,3);
});

test('an accidental repeated exercise is regenerated once within the original time budget',async()=>{
 const value=quiz(),report=diagnosticReport(value.questions,{0:0,1:1,2:0,3:1,4:1},value),repeated={...value,quizType:'practice',questions:value.questions.slice(0,3)},fresh={...repeated,questions:repeated.questions.map(q=>({...q,question:'Yangi vaziyat: '+q.question}))};
 const calls=[];
 const result=await runAssistant({...input,message:'Natijamga mos yangi mashq.',learning:[report]},actor,{env,generate:async(_prompt,data,_schema,options)=>{calls.push({data,options});return {value:calls.length===1?repeated:fresh}}});
 assert.equal(calls.length,2);assert.equal(calls[1].data.repair.reason,'repeated-exercise');assert.equal(calls[1].options.maxAttempts,1);assert.ok(calls[1].options.totalTimeoutMs<=15000);assert.equal(result.questions[0].question,fresh.questions[0].question);
});
