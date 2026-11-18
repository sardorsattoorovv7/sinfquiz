import {api} from './api.js';

const kinds=['typing','race'];
export async function loadLiveRooms(){
 const results=await Promise.allSettled(kinds.map(kind=>api(`/api/${kind}/active`)));
 return Object.fromEntries(kinds.map((kind,index)=>[kind,results[index]]));
}

export function roomWithCode(catalog,code){
 for(const [kind,result] of Object.entries(catalog)){
  if(result.status!=='fulfilled')continue;
  const room=result.value?.rooms?.find(entry=>entry.code===code);
  if(room)return {kind,offer:{...result.value,...room,rooms:[room]}};
 }
 return null;
}
