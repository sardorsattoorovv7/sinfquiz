const normalize=s=>String(s??'').trim().normalize('NFKC').toLowerCase().replace(/[‘’]/g,"'").replace(/\s+/g,' ');
function numeric(s){
 const value=String(s).trim().replace('−','-').replace(',','.');
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/[+-]?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(value))return NaN;
 const [a,b]=value.split('/');return Number(a)/(b===undefined?1:Number(b));
}
export function correctAnswer(q,value){
 if(normalize(value)==='')return false;
 const values=Array.isArray(q.answer)?q.answer:[q.answer];
 return values.some(answer=>q.numeric?Number.isFinite(numeric(value))&&Math.abs(numeric(value)-numeric(answer))<1e-9:normalize(value)===normalize(answer));
}
export function newAttempt(exam,now=Date.now()){
 return {version:1,revision:'7.3',examId:exam.id,questionIds:exam.questions.map(q=>q.id),answers:{},flags:{},index:0,startedAt:now,endsAt:now+exam.minutes*60000,finished:false};
}
export function validAttempt(state,exam){
 return !!exam&&state?.version===1&&state.revision==='7.3'&&state.examId===exam.id&&JSON.stringify(state.questionIds)===JSON.stringify(exam.questions.map(q=>q.id))&&Number.isInteger(state.index)&&state.index>=0&&state.index<exam.questions.length&&Number.isFinite(state.endsAt)&&Number.isFinite(state.startedAt)&&typeof state.finished==='boolean'&&state.answers&&typeof state.answers==='object'&&!Array.isArray(state.answers)&&state.flags&&typeof state.flags==='object'&&Object.values(state.answers).every(v=>typeof v==='string');
}
export function finishAttempt(state,now=Date.now()){
 return state.finished?state:{...state,finished:true,finishedAt:Math.min(now,state.endsAt),reason:now>=state.endsAt?'time':'submitted'};
}
export function updateAttempt(state,change,now=Date.now()){
 if(state.finished)return state;
 if(now>=state.endsAt)return finishAttempt(state,now);
 if(change.type==='answer'&&state.questionIds.includes(change.id))return {...state,answers:{...state.answers,[change.id]:String(change.value).slice(0,200)}};
 if(change.type==='flag'&&state.questionIds.includes(change.id))return {...state,flags:{...state.flags,[change.id]:!state.flags[change.id]}};
 if(change.type==='navigate'&&Number.isInteger(change.index)&&change.index>=0&&change.index<state.questionIds.length)return {...state,index:change.index};
 return state;
}
export function attemptReview(state,exam){
 if(!state.finished)return [];
 return exam.questions.map((q,index)=>({...q,number:index+1,selected:state.answers[q.id]||'',correct:correctAnswer(q,state.answers[q.id])}));
}
