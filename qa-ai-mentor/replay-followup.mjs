import {readFileSync,writeFileSync} from 'node:fs';
import {runAssistant} from '../server/assistant/service.js';
import {diagnosticReport} from '../src/speaking/learning.js';
const previous=JSON.parse(readFileSync(new URL('./live-diagnostic.json',import.meta.url),'utf8')),raw=JSON.parse(readFileSync(new URL('./raw-followup.json',import.meta.url),'utf8'));
const choices=Object.fromEntries(previous.questions.map((q,i)=>[i,i===0||i===2?(q.correctIndex+1)%4:q.correctIndex]));
const report=diagnosticReport(previous.questions,choices,previous);
const result=await runAssistant({mode:'mentor',view:'aiGuide',message:'Natijamga mos 3 ta yangi mashq bering.',learning:[report]},{id:'synthetic-mentor-check',role:'student'},{env:{GROQ_API_KEY:'offline-fixture-key'},generate:async()=>({value:raw,model:previous.model})});
writeFileSync(new URL('./live-followup.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify({validated:true,quizType:result.quizType,questions:result.questions.length,evidenceCorrect:report.correct,model:result.model}));
