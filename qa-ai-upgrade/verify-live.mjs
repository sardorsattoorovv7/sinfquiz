import {readFileSync,writeFileSync} from 'node:fs';
import {speakingMockSets} from '../server/speaking/questions.js';
import {buildVariant,decodeVariant,questionHistory,variantQuestions,questionFingerprint,variantSchema} from '../server/speaking/variants.js';
import {validateSchema} from '../server/speaking/schema.js';
const results=['ielts','multilevel'].map(exam=>{
 const sets=speakingMockSets.filter(set=>set.exam===exam),template=sets[0],raw=JSON.parse(readFileSync(new URL('./raw-'+exam+'.json',import.meta.url)));
 validateSchema(raw,variantSchema(template));
 const history=questionHistory(sets.map(set=>({payload:{queue:variantQuestions(set),revealedIds:variantQuestions(set).map(q=>q.id)}}))),generated=buildVariant(decodeVariant(raw,template),template,history),questions=variantQuestions(generated);
 return {exam,questions:questions.length,allNew:questions.every(q=>!history.fingerprints.has(questionFingerprint(q))),firstPrompt:questions[0].prompt,formatPreserved:questions.every((q,i)=>q.prepSeconds===variantQuestions(template)[i].prepSeconds&&q.responseMaxSeconds===variantQuestions(template)[i].responseMaxSeconds)};
});
writeFileSync(new URL('./verified-generation.json',import.meta.url),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
