import {ensureAnonymous} from './supabase-sdk.js';
import {quizRanking} from './quiz-ranking.js';

export async function playRpc(sdk,name,args={}){
 const {data,error}=await sdk.app.rpc(name,args);
 if(error){if(error.code==='PGRST202'||error.code==='42883')throw Error('Supabase SQL Editor’da supabase-migration-7.26.2.sql faylini RUN qiling, keyin sahifani yangilang.');throw Error(error.message||'So‘rov bajarilmadi.')}
 return data;
}
const gameState=data=>({...data,ranking:quizRanking(data.ranking,data.quiz.id)});
export const securePlayPath=path=>path==='/api/resolve'||path.startsWith('/api/play/')||/^\/api\/race\/(active|join|session|ready|answer|leave)$/.test(path);
export async function securePlayApi(path,payload,{runtime,load,save}){
 const sdk=await ensureAnonymous();
 if(path==='/api/resolve'){
  const data=await playRpc(sdk,'sq_quiz_ticket',{p_pin:payload.pin||''});
  runtime.ticket={id:data.ticket,pin:payload.pin};return data;
 }
 if(path==='/api/play/join'){
  if(!runtime.ticket||runtime.ticket.id!==payload.ticket)throw Error('Avval ustoz bergan 6 xonali kodni kiriting.');
  const data=await playRpc(sdk,'sq_quiz_join',{p_ticket:payload.ticket,p_pin:runtime.ticket.pin,p_name:payload.name||'',p_avatar:payload.avatar||''});
  save('game',{playerId:data.player.id,quiz:{id:data.quiz.id},questionId:data.question?.id,secure:true});runtime.ticket=null;return gameState(data);
 }
 if(path.startsWith('/api/play/')){
  const current=runtime.game||load('game');
  if(!current?.secure){save('game',null);throw Error('Yangilanishdan oldingi sessiya tugagan. Test kodini qayta kiriting.')}
  const action=path.split('/').at(-1);
  if(action==='answer'&&!payload.questionId)payload={...payload,questionId:current.questionId};
  const data=await playRpc(sdk,'sq_quiz_action',{p_id:current.playerId,p_action:action,p_payload:payload});
  if(action==='leave'){save('game',null);return data}
  if(data.closed&&!data.finished)throw Error('O‘qituvchi testni to‘xtatgan.');
  save('game',{...current,questionId:data.question?.id});return gameState(data);
 }
 if(path==='/api/race/active')return playRpc(sdk,'sq_race_action',{p_action:'active'});
 if(path==='/api/race/join'){
  const data=await playRpc(sdk,'sq_race_action',{p_action:'join',p_payload:payload});
  save('race',{raceId:data.race.id,localMode:!!data.localMode,playerIds:data.playerIds||[data.playerId],playerId:data.playerId,secure:true});return data;
 }
 const current=runtime.race||load('race');if(!current?.secure){save('race',null);throw Error('Poyga sessiyasi tugagan. Qayta kiring.')}
 const action=path.split('/').at(-1),data=await playRpc(sdk,'sq_race_action',{p_action:action,p_race_id:current.raceId,p_ids:current.playerIds,p_payload:payload});
 if(action==='leave')save('race',null);return data;
}
