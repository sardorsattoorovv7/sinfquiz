import {getSupabase} from '../supabase-sdk.js';

export async function speakingBilling(action,data={},signal){
 let request={signal,cache:'no-store'};
 if(action){
  const {auth}=await getSupabase(),user=auth.currentUser;
  const token=user&&!user.isAnonymous&&await user.getIdToken();
  if(!token)throw Error('Avval hisobga kiring.');
  request={
   ...request,method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({action,...data}),
  };
 }
 const response=await fetch('/api/speaking-billing',request);
 const result=await response.json().catch(()=>null);
 if(!response.ok||!result)throw Error(result?.error||'To‘lov holatini tekshirib bo‘lmadi. Qayta urinib ko‘ring.');
 return result;
}
