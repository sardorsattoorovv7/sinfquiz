import {ensureAnonymous,getSupabase} from './supabase-sdk.js';
const fixtures=()=>globalThis.__SINFQUIZ_LEGACY_TEST__||globalThis.window?.__SINFQUIZ_LEGACY_TEST__;
const calls={list:['sq_comp_list',()=>({})],catalog:['sq_comp_catalog',()=>({})],state:['sq_comp_state',d=>({p_id:d.id})],save:['sq_comp_save',d=>({p_id:d.config.id,p_config:d.config})],join:['sq_comp_join',d=>({p_code:d.code,p_name:d.name})],control:['sq_comp_control',d=>({p_id:d.id,p_action:d.action,p_expected_stage:d.stage||0})],answer:['sq_comp_answer',d=>({p_id:d.id,p_stage:d.stageId,p_action:d.actionId,p_data:d.body})],leave:['sq_comp_leave',d=>({p_id:d.id})]};
export async function competitionApi(action,payload={}){
 if(!Object.hasOwn(calls,action))throw Error('Noma’lum musobaqa amali.');
 if(navigator.onLine===false)throw Error('Internet aloqasi yo‘q. Javobingiz shu sahifada qoladi; ulanishni tiklab yana yuboring.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
 try{
  if(fixtures()){const r=await fetch('/api/competitions/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal}),data=await r.json();if(!r.ok||data.error)throw Error(data.error||'So‘rov bajarilmadi.');return data}
  const sdk=['list','state','join','answer','leave'].includes(action)?await ensureAnonymous():await getSupabase();
  const [name,args]=calls[action],{data,error}=await sdk.db.rpc(name,args(payload)).abortSignal(controller.signal);
  if(error){if(['42P01','42883','PGRST202','PGRST205'].includes(error.code))throw Error('Musobaqa uchun supabase-migration-7.22.sql faylini Supabase SQL Editor’da RUN qiling.');throw Error(error.message)}
  if(data?.error)throw Error(data.error);return data;
 }catch(e){if(e.name==='AbortError'||/aborted|fetch/i.test(e.message)&&e instanceof TypeError)throw Error('Aloqa sekinlashdi. Holatni yangilang yoki javobni qayta yuboring.');if(/Anonymous sign-ins are disabled/i.test(e.message))throw Error('Kirish uchun hisobingizdan foydalaning yoki Supabase’da Anonymous Sign-Ins usulini yoqing.');throw e}finally{clearTimeout(timer)}
}
export async function watchCompetition(id,onChange,onConnected){
 if(fixtures()){onConnected(false);return ()=>{}};
 const {db}=await getSupabase();let gone=false,timer;
 const channel=db.channel('sq-comp:'+id+':'+crypto.randomUUID()).on('postgres_changes',{event:'*',schema:'public',table:'sq_comp_signals',filter:'competition_id=eq.'+id},()=>{if(timer)return;timer=setTimeout(()=>{timer=null;if(!gone)onChange()},1800)}).subscribe(status=>{if(!gone)onConnected(status==='SUBSCRIBED')});
 return ()=>{gone=true;clearTimeout(timer);db.removeChannel(channel)};
}
