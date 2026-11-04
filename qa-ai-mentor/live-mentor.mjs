// Only synthetic learning examples are sent to the configured provider.
import {writeFileSync,readFileSync} from 'node:fs';
import {runAssistant} from '../server/assistant/service.js';
import {diagnosticReport} from '../src/speaking/learning.js';
import {structured} from '../server/speaking/groq.js';

const actor={id:'synthetic-mentor-check',role:'student'},mode=process.argv.includes('--clarify')?'clarify':process.argv.includes('--followup')?'followup':'diagnostic';
const base={mode:'mentor',view:'aiGuide',message:mode==='clarify'?'Bilimimni tekshirib, qayerdan boshlashimni ayting.':mode==='followup'?'Oxirgi mini-test natijamga mos, xatolarimni tuzatish uchun 3 ta yangi mashq bering.':'Ingliz tili Present Simple mavzusidan bilimimni 5 savol bilan tekshiring.'};
if(mode==='followup'){
 const previous=JSON.parse(readFileSync(new URL('./live-diagnostic.json',import.meta.url),'utf8'));
 const choices=Object.fromEntries(previous.questions.map((q,i)=>[i,i===0||i===2?(q.correctIndex+1)%4:q.correctIndex]));
 base.learning=[diagnosticReport(previous.questions,choices,previous)];
 base.history=[{role:'user',content:'Ingliz tili Present Simple mavzusidan bilimimni tekshiring.'},{role:'assistant',content:previous.answerUz}];
}
try{
 const started=Date.now(),result=await runAssistant(base,actor,{generate:async(...args)=>{const result=await structured(...args);writeFileSync(new URL(`./raw-${mode}.json`,import.meta.url),JSON.stringify(result.value,null,2));return result;}});
 writeFileSync(new URL(`./live-${mode}.json`,import.meta.url),JSON.stringify(result,null,2));
 console.log(JSON.stringify({mode,elapsedMs:Date.now()-started,quizType:result.quizType,questions:result.questions.length,answerUz:result.answerUz,subjectUz:result.subjectUz,topicUz:result.topicUz}));
 if(mode==='diagnostic'&&(result.quizType!=='diagnostic'||result.questions.length!==5))process.exitCode=1;
 if(mode==='clarify'&&(result.quizType!=='none'||result.questions.length!==0))process.exitCode=1;
 if(mode==='followup'&&(result.quizType!=='practice'||result.questions.length!==3))process.exitCode=1;
}catch(error){console.log(JSON.stringify({mode,error:error.code||'NETWORK',message:error.message}));process.exitCode=1;}
