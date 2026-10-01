// A leaderboard document is scoped to one quiz; legacy 7.6 rows omit quizId.
// Keep the existing score/time ordering shared by the teacher and student UI.
const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const finish=value=>value?number(value,Infinity):Infinity;
export function rankRows(players=[]){
 return [...(Array.isArray(players)?players:[])].sort((a,b)=>
  number(b.score)-number(a.score)||finish(a.finishedAt)-finish(b.finishedAt)||
  number(a.startedAt)-number(b.startedAt)||String(a.id).localeCompare(String(b.id),'en'));
}
export function quizRanking(rows,quizId){
 if(!quizId||!Array.isArray(rows))return [];
 // Accept rows without quizId only here, where the API contract already supplies the scope.
 return rankRows(rows.filter(row=>row&&typeof row.id==='string'&&(!row.quizId||row.quizId===quizId))
  .map(row=>({...row,quizId})));
}
export function quizPlacement(rows,quizId,playerId){
 const ranked=quizRanking(rows,quizId),index=ranked.findIndex(row=>row.id===playerId);
 return {rows:ranked,rank:index<0?null:index+1,total:ranked.length};
}
