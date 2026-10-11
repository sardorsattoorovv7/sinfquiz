import {ensureAnonymous,waitForAuth} from './supabase-sdk.js';
import {playRpc} from './secure-play-service.js';
export const secureActivityPath=path=>/^\/api\/typing\//.test(path)||/^\/api\/national\/(start|session|answer|navigate|finish|leave)$/.test(path)||/^\/api\/race\/(activate|stop)$/.test(path)||path==='/api/admin/analytics';
export async function secureActivityApi(path,payload,{runtime,load,save}){
 const typing=path.startsWith('/api/typing/'),sdk=typing?await ensureAnonymous():await waitForAuth(),action=path.split('/').at(-1);
 if(path==='/api/admin/analytics')return playRpc(sdk,'sq_admin_analytics',{p_after:payload.after||'',p_search:payload.search||'',p_role:payload.role||''});
 if(path.startsWith('/api/race/'))return playRpc(sdk,'sq_room_manage',{p_kind:'race',p_active:action==='activate',p_payload:payload});
 if(typing&&action==='active')return playRpc(sdk,'sq_room_catalog',{p_kind:'typing'});
 if(typing&&action==='status'){await playRpc(sdk,'sq_room_manage',{p_kind:'typing',p_active:!!payload.active});return {typing:(await playRpc(sdk,'sq_room_staff')).typing};}
 if(typing&&action==='reset')return playRpc(sdk,'sq_owned_bulk',{p_kind:'typing-reset'});
 const key=typing?'typing':'national',current=runtime[key]||load(key);
 const creating=typing?action==='join':action==='start';
 if(!creating){
  if(!current?.secure)throw Error('Yangilanishdan oldingi sessiya tugagan. Mashqni qayta boshlang.');
 }
 const data=await playRpc(sdk,typing?'sq_typing_action':'sq_national_action',{p_action:action,p_id:current?.id||null,p_payload:payload});
 if(action==='leave')save(key,null);else save(key,{id:typing?data.playerId:data.attemptId,secure:true});
 return data;
}
