import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

function adminClient(){
 const url=process.env.VITE_SUPABASE_URL||process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('SUPABASE_SERVICE_ROLE_KEY yoki VITE_SUPABASE_URL kiritilmagan.');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

export function verifiedTelegramUser(payload){
 const token=process.env.TELEGRAM_BOT_TOKEN;if(!token)throw Error('TELEGRAM_BOT_TOKEN kiritilmagan.');
 const {hash,...fields}=payload||{};if(!hash||!fields.id||!fields.auth_date)throw Error('Telegram ma’lumotlari to‘liq emas.');
 const age=Math.abs(Date.now()/1000-Number(fields.auth_date));if(!Number.isFinite(age)||age>600)throw Error('Telegram tasdiqlashi eskirgan. Qayta kiring.');
 const checkString=Object.entries(fields).filter(([,value])=>value!==undefined&&value!==null&&value!=='').sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>`${key}=${value}`).join('\n');
 const secret=crypto.createHash('sha256').update(token).digest(),expected=crypto.createHmac('sha256',secret).update(checkString).digest('hex');
 const given=String(hash);if(given.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(given,'hex')))throw Error('Telegram tasdiqlashi haqiqiy emas.');return fields;
}

export default async function handler(request,response){
 if(request.method!=='POST')return response.status(405).json({error:'Faqat POST so‘rovi qabul qilinadi.'});
 try{
  const selectedRole=request.body?.role==='teacher'?'teacher':'student',telegram=verifiedTelegramUser(request.body?.telegram),supabase=adminClient(),telegramId=String(telegram.id),name=[telegram.first_name,telegram.last_name].filter(Boolean).join(' ').trim()||telegram.username||'Foydalanuvchi';
  const {data:rows,error:profileError}=await supabase.from('documents').select('id,data').eq('collection','profiles').eq('data->>telegramId',telegramId).limit(1);if(profileError)throw profileError;
  const saved=rows?.[0],email=`telegram-${telegramId}@login.sinfquiz.uz`,password=crypto.randomBytes(32).toString('base64url');let uid=saved?.id;
  if(uid){const {error}=await supabase.auth.admin.updateUserById(uid,{password,user_metadata:{name,telegramId}});if(error)throw error}
  else{const {data,error}=await supabase.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name,telegramId}});if(error)throw error;uid=data.user.id}
  const finalRole=saved?.data?.role||selectedRole,profile={uid,role:finalRole,name,username:telegram.username||'',photoUrl:telegram.photo_url||'',telegramId,provider:'telegram',updatedAt:Date.now(),createdAt:saved?.data?.createdAt||Date.now()};
  const {error}=await supabase.from('documents').upsert({collection:'profiles',id:uid,data:profile,updated_at:new Date().toISOString()},{onConflict:'collection,id'});if(error)throw error;
  return response.status(200).setHeader('Cache-Control','no-store').json({email,password,profile});
 }catch(error){return response.status(400).json({error:error.message||'Telegram orqali kirib bo‘lmadi.'})}
}
