import {getSupabase} from '../supabase-sdk.js';
export async function spaceAction(action,payload={}){
 if(globalThis.__SINFQUIZ_LEGACY_TEST__||globalThis.window?.__SINFQUIZ_LEGACY_TEST__){const r=await fetch('/api/space/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload})});const data=await r.json();if(!r.ok)throw Error(data.error||'So‘rov bajarilmadi.');return data}
 const {app}=await getSupabase(),{data,error}=await app.rpc('sq_space',{p_action:action,p_payload:payload});
 if(error){if(['42P01','42883','PGRST202','PGRST205'].includes(error.code))throw Error('Tajriba daftarini ulash uchun SQL Editor’da avval supabase-migration-7.30.sql, keyin supabase-migration-7.31.sql faylini bajaring.');if(error.message?.includes('Hodisa topilmadi'))throw Error('Yangi hodisani ulash uchun supabase-migration-7.31.sql faylini SQL Editor’da bajaring.');throw Error(error.message)}return data;
}
