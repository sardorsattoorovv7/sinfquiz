import {writeFileSync} from 'node:fs';
import {loadAiEnv} from '../scripts/ai-check.mjs';
import {speakingMockSets} from '../server/speaking/questions.js';
import {generateVariant,questionHistory,variantQuestions,questionFingerprint} from '../server/speaking/variants.js';
loadAiEnv();
const exams=[process.argv.includes('--multilevel')?'multilevel':'ielts'];
const results=await Promise.allSettled(exams.map(async exam=>{
 const sets=speakingMockSets.filter(set=>set.exam===exam),history=questionHistory(sets.map(set=>({payload:{queue:variantQuestions(set),revealedIds:variantQuestions(set).map(q=>q.id)}})));
 const fetcher=async(url,options)=>{const response=await fetch(url,options),body=await response.clone().json();const content=body.choices?.[0]?.message?.content;if(content){try{writeFileSync(new URL('./raw-'+exam+'.json',import.meta.url),JSON.stringify(JSON.parse(content),null,2)+'\n')}catch{}}if(body.error)console.log(JSON.stringify({status:response.status,providerCode:body.error.code,message:String(body.error.message||'').replace(/gsk_[A-Za-z0-9]+|sb_secret_[A-Za-z0-9_-]+|org_[A-Za-z0-9_-]+/g,'[redacted]').slice(0,900)}));return response;};
 const generated=await generateVariant(sets[0],history,{fetcher});
 return {exam,count:variantQuestions(generated).length,allNew:variantQuestions(generated).every(q=>!history.fingerprints.has(questionFingerprint(q))),variant:generated};
}));
writeFileSync(new URL('./live-questions.json',import.meta.url),JSON.stringify(results.map((r,i)=>r.status==='fulfilled'?r.value:{exam:exams[i],error:r.reason.code||r.reason.name}),null,2)+'\n');
for(const r of results){if(r.status==='fulfilled')console.log(JSON.stringify({exam:r.value.exam,count:r.value.count,allNew:r.value.allNew}));else{console.log(JSON.stringify({error:r.reason.code||r.reason.name}));process.exitCode=1;}}
