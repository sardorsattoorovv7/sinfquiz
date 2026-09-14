import {randomToken,safeQuestion} from './security.js';
import {gradeAnswer} from '../src/grading.js';
const fail=(status,message)=>Object.assign(Error(message),{status});
export const TIE_WINDOW_MS=100;
export function decideDuel(players){
 const [a,b]=players;if(!a||!b||!a.done||!b.done)return null;
 if(a.correct!==b.correct){const seat=a.correct>b.correct?0:1;return {kind:'win',winnerSeat:seat,winnerId:players[seat].id,reason:'accuracy'}}
 if(a.correct===0||Math.abs(a.elapsedMs-b.elapsedMs)<=TIE_WINDOW_MS)return {kind:'draw',winnerSeat:null,winnerId:null,reason:'draw'};
 const seat=a.elapsedMs<b.elapsedMs?0:1;return {kind:'win',winnerSeat:seat,winnerId:players[seat].id,reason:'speed'};
}
export function createDuels({db,save,publish,now=Date.now}){
 db.duels ||= [];const sessions=new Map();
 for(const m of db.duels)if(!['finished','cancelled'].includes(m.phase)){m.phase='cancelled';m.cancelReason='Server qayta ishga tushirilgan.';m.endedAt=now()}save();
 const active=m=>['waiting','countdown','running'].includes(m.phase);
 function summary(m){return {id:m.id,title:m.title,group:m.group,pin:m.pin,phase:m.phase,questionCount:m.questions.length,startsAt:m.startsAt||null,hardDeadline:m.hardDeadline||null,endedAt:m.endedAt||null,result:m.result||null,cancelReason:m.cancelReason||null,serverNow:now(),revision:m.revision,players:m.players.map(p=>({id:p.id,name:p.name,avatar:p.avatar,seat:p.seat,ready:p.ready,answers:p.index,correct:p.correct,done:p.done,elapsedMs:p.elapsedMs||0}))}}
 const get=id=>{const m=db.duels.find(x=>x.id===id);if(!m)throw fail(404,'Kurash topilmadi.');return m};
 const changed=m=>{m.revision++;save();publish(m,summary(m))};
 function finish(m){if(!m.players.every(p=>p.done)||m.players.length!==2)return;const result=decideDuel(m.players);m.phase='finished';m.endedAt=now();m.result={...result,endedAt:m.endedAt,animationAt:m.endedAt+800,correct:m.players.map(p=>p.correct),elapsedMs:m.players.map(p=>p.elapsedMs)}}
 function applyAnswer(m,p,value,expired,at){
  const q=m.questions[p.index];const result=expired?{correct:false,ratio:0}:gradeAnswer(q,value,Math.max(0,(p.deadline-at)/1000));
  p.responses.push({questionId:q.id,value:expired?'':value,correct:result.correct,ratio:result.ratio,expired,receivedAt:at});p.correct+=Number(result.correct);p.index++;
  if(p.index===m.questions.length){p.done=true;p.elapsedMs=Math.max(0,at-m.startsAt)}else p.deadline=Math.min(m.hardDeadline,at+m.questions[p.index].time*1000);
 }
 function tickOne(m){let dirty=false;const t=now();if(m.phase==='countdown'&&t>=m.startsAt){m.phase='running';dirty=true}
  if(m.phase==='running'){for(const p of m.players){while(!p.done&&t>=p.deadline){applyAnswer(m,p,null,true,p.deadline);dirty=true}}if(m.players.every(p=>p.done)){finish(m);dirty=true}}
  if(dirty)changed(m);
 }
 function view(session){const m=get(session.matchId);tickOne(m);const p=m.players.find(p=>p.id===session.playerId);if(!p)throw fail(410,'Bu joy bo‘shatilgan. Kod bilan qayta kiring.');return {match:summary(m),playerId:p.id,csrf:session.csrf,question:m.phase==='running'&&!p.done?safeQuestion(m.questions[p.index]):null,index:p.index,deadline:p.deadline||null,serverNow:now()}}
 return {
  summary,get,active,view,
  list:ownerId=>db.duels.filter(m=>m.ownerId===ownerId).map(summary),
  session:token=>{const s=sessions.get(token);if(!s||s.expires<now()){sessions.delete(token);return null}return s},
  byPin:pin=>db.duels.find(m=>m.pin===pin&&active(m)),
  create(ownerId,quiz,title,pin){if(typeof title!=='string'||!title.trim()||title.length>160||!/^\d{6}$/.test(pin))throw fail(400,'Kurash nomi va 6 xonali kodni kiriting.');if(db.quizzes.some(q=>q.pin===pin)||db.duels.some(m=>m.pin===pin))throw fail(409,'Bu kod band. Boshqa kod tanlang.');const m={id:randomToken(),ownerId,title:title.trim(),group:quiz.group,pin,sourceQuizId:quiz.id,questions:structuredClone(quiz.questions),players:[],phase:'waiting',createdAt:now(),revision:1};db.duels.push(m);changed(m);return summary(m)},
  join(matchId,name,avatar,priorToken){const m=get(matchId);tickOne(m);const prior=this.session(priorToken);if(prior){const old=get(prior.matchId);if(active(old)){if(prior.matchId===matchId)return {token:priorToken,state:view(prior)};throw fail(409,'Avval ochiq kurashdan chiqing.')}}
   if(m.phase!=='waiting'||m.players.length>=2)throw fail(409,'Bu kurashda ikki o‘rin band yoki o‘yin boshlangan.');if(typeof name!=='string'||!name.trim()||name.length>30)throw fail(400,'Ismingizni kiriting.');
   const p={id:randomToken(),seat:m.players.length,name:name.trim(),avatar,ready:false,index:0,correct:0,done:false,elapsedMs:0,responses:[]};m.players.push(p);const token=randomToken(),s={matchId:m.id,playerId:p.id,csrf:randomToken(),expires:now()+8*3600000};sessions.set(token,s);changed(m);return {token,state:view(s)};
  },
  ready(s){const m=get(s.matchId);if(m.phase==='countdown'||m.phase==='running'||m.phase==='finished')return view(s);if(m.phase!=='waiting')throw fail(409,'Kurash yopilgan.');const p=m.players.find(p=>p.id===s.playerId);p.ready=true;if(m.players.length===2&&m.players.every(p=>p.ready)){m.phase='countdown';m.startsAt=now()+3000;m.hardDeadline=m.startsAt+m.questions.reduce((n,q)=>n+q.time*1000,0);for(const p of m.players)p.deadline=m.startsAt+m.questions[0].time*1000}changed(m);return view(s)},
  answer(s,questionId,value){const m=get(s.matchId);tickOne(m);const p=m.players.find(p=>p.id===s.playerId);if(p.responses.some(r=>r.questionId===questionId))return view(s);if(m.phase!=='running'||p.done)throw fail(409,'Kurash hali boshlanmagan yoki tugagan.');const q=m.questions[p.index];if(q.id!==questionId)throw fail(409,'Savol tartibi o‘zgargan. Yangilanishni kuting.');if(q.type==='test'&&(!Number.isInteger(value)||value<0||value>3))throw fail(400,'Javobni tanlang.');if(q.type!=='test'&&(typeof value!=='string'||!value.trim()||value.length>8000))throw fail(400,'Javob 1–8000 belgidan iborat bo‘lsin.');applyAnswer(m,p,value,false,now());finish(m);changed(m);return view(s)},
  cancel(ownerId,id){const m=get(id);if(m.ownerId!==ownerId)throw fail(404,'Kurash topilmadi.');if(!active(m))throw fail(409,'Kurash allaqachon yopilgan.');m.phase='cancelled';m.cancelReason='O‘qituvchi kurashni bekor qildi.';m.endedAt=now();changed(m);return summary(m)},
  leave(token){const s=this.session(token);if(!s)return;const m=get(s.matchId);if(['waiting','countdown'].includes(m.phase)){m.players=m.players.filter(p=>p.id!==s.playerId);m.players.forEach((p,i)=>{p.seat=i;p.ready=false;p.deadline=null});m.phase='waiting';m.startsAt=null;m.hardDeadline=null;changed(m)}else if(m.phase==='running'){m.phase='cancelled';m.cancelReason='Qatnashchi kurashdan chiqdi. G‘olib belgilanmadi.';m.endedAt=now();changed(m)}sessions.delete(token)},
  tick(){for(const m of db.duels)if(['countdown','running'].includes(m.phase))tickOne(m);for(const [token,s]of sessions)if(s.expires<now())sessions.delete(token)}
 };
}
