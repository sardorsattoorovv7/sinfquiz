import {waitForAuth} from '../supabase-sdk.js';
async function rpc(name,action,p={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  if(globalThis.__SINFQUIZ_LEGACY_TEST__){const r=await fetch(`/api/${name==='sq_books'?'books':'iq'}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p),signal:controller.signal}),d=await r.json();if(!r.ok)throw Object.assign(Error(d.error||'So‘rov bajarilmadi.'),{code:d.code});return d}
  const sdk=await waitForAuth();if(!sdk.auth.currentUser)throw Error('Avval hisobingizga kiring.');
  const {data,error}=await sdk.db.rpc(name,{p_action:action,p}).abortSignal(controller.signal);
  if(error){if(['42883','42P01','PGRST202','PGRST205'].includes(error.code))throw Error('Yangi bo‘lim uchun sql/7.25 fayllarini tartib bilan SQL Editor’da RUN qiling.');throw Object.assign(Error(error.message),{code:error.code})}return data;
 }catch(e){if(e.name==='AbortError')throw Error('So‘rov kechikdi. Javobni qayta yuborishingiz mumkin.');throw e}finally{clearTimeout(timer)}
}
export const iq=(action,p={})=>rpc('sq_iq',action,p);
export const books=(action,p={})=>rpc('sq_books',action,p);
