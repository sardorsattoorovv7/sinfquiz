import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

const ADMIN_EMAIL='admin@sinfquiz.uz';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function client(){
 const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Object.assign(Error('Serverda Supabase maxfiy kaliti sozlanmagan.'),{status:503});
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

export async function resetEmailPassword(db,token,uid,now=Date.now()){
 if(!token||!UUID.test(uid||''))throw Object.assign(Error('So‘rov ma’lumotlari noto‘g‘ri.'),{status:400});
 const {data:identity,error:identityError}=await db.auth.getUser(token);
 if(identityError||!identity?.user)throw Object.assign(Error('Qayta tizimga kiring.'),{status:401});
 const actor=identity.user;
 if(actor.email?.toLowerCase()!==ADMIN_EMAIL)throw Object.assign(Error('Administrator ruxsati kerak.'),{status:403});
 const {data:admin,error:adminError}=await db.from('documents').select('data').eq('collection','profiles').eq('id',actor.id).maybeSingle();
 if(adminError)throw adminError;
 if(admin?.data?.role!=='admin')throw Object.assign(Error('Administrator ruxsati kerak.'),{status:403});
 if(uid===actor.id)throw Object.assign(Error('O‘z parolingizni profil sahifasida yangilang.'),{status:400});
 const {data:target,error:targetError}=await db.from('documents').select('data').eq('collection','profiles').eq('id',uid).maybeSingle();
 if(targetError)throw targetError;
 const profile=target?.data;
 if(!profile||profile.provider!=='email'||!['student','teacher'].includes(profile.role))throw Object.assign(Error('Email orqali kiradigan hisob tanlang.'),{status:400});
 if(now-Number(profile.lastAdminPasswordResetAt||0)<60_000)throw Object.assign(Error('Bir daqiqadan keyin qayta urinib ko‘ring.'),{status:429});
 const {data:found,error:lookupError}=await db.auth.admin.getUserById(uid);
 if(lookupError||!found?.user||found.user.email?.toLowerCase()!==profile.email?.toLowerCase())throw Object.assign(Error('Hisobning email manzili mos kelmadi.'),{status:400});
 const password=crypto.randomBytes(18).toString('base64url');
 const {error:changeError}=await db.auth.admin.updateUserById(uid,{password});
 if(changeError)throw changeError;
 const {error:saveError}=await db.from('documents').update({data:{...profile,lastAdminPasswordResetAt:now,updatedAt:now},updated_at:new Date(now).toISOString()}).eq('collection','profiles').eq('id',uid);
 return {password,email:profile.email,...(saveError?{warning:'Parol yangilandi, lekin oxirgi yangilanish sanasini saqlab bo‘lmadi.'}:{})};
}

export default async function handler(request,response){
 response.setHeader('Cache-Control','no-store');
 if(request.method!=='POST')return response.status(405).json({error:'Faqat POST so‘rovi qabul qilinadi.'});
 const token=/^Bearer\s+(\S+)$/i.exec(request.headers.authorization||'')?.[1];
 try{
  const result=await resetEmailPassword(client(),token,request.body?.uid);
  return response.status(200).json(result);
 }catch(error){
  return response.status(error.status||500).json({error:error.status?error.message:'Parolni yangilab bo‘lmadi. Keyinroq qayta urinib ko‘ring.'});
 }
}
