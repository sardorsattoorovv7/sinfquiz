import {loadAiEnv} from '../scripts/ai-check.mjs';
import {serverClient} from '../server/speaking/store.js';
loadAiEnv();
const base=(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL).replace(/\/+$/,'');
const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
try{
 const response=await fetch(base+'/rest/v1/sq_sp_records?select=id&limit=0',{headers:{apikey:key},signal:AbortSignal.timeout(5000)});
 console.log(JSON.stringify({probe:'raw',status:response.status}));
}catch(error){console.log(JSON.stringify({probe:'raw',code:error.code,cause:error.cause?.code,name:error.name}));}
const db=serverClient(process.env,{timeoutMs:5000});
const result=await db.from('sq_sp_records').select('id').limit(0);
console.log(JSON.stringify({probe:'sdk',status:result.status,code:result.error?.code,message:result.error?.message,details:result.error?.details?.replace(/https?:\/\/\S+/g,'[url]').slice(0,500)}));
