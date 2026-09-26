import admin from 'firebase-admin';

function getAdmin(){
 if(admin.apps.length)return admin.app();
 const raw=process.env.FIREBASE_SERVICE_ACCOUNT_B64;
 if(!raw)throw Error('FIREBASE_SERVICE_ACCOUNT_B64 sozlanmagan.');
 const serviceAccount=JSON.parse(Buffer.from(raw,'base64').toString('utf8'));
 return admin.initializeApp({credential:admin.credential.cert(serviceAccount)});
}

const send=(res,status,body)=>res.status(status).setHeader('Cache-Control','no-store').json(body);

export default async function handler(req,res){
 if(req.method!=='POST')return send(res,405,{error:'Faqat POST so‘rovi qabul qilinadi.'});
 try{
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!token)return send(res,401,{error:'Login ma’lumoti topilmadi.'});
  getAdmin();
  const decoded=await admin.auth().verifyIdToken(token);
  if(!decoded.email)return send(res,400,{error:'Email manzili topilmadi.'});
  const ref=admin.firestore().collection('profiles').doc(decoded.uid),existing=await ref.get();
  const adminEmail=String(process.env.VITE_FIREBASE_ADMIN_EMAIL||process.env.FIREBASE_ADMIN_EMAIL||'admin@sinfquiz.uz').trim().toLowerCase();
  const isAdmin=!!adminEmail&&decoded.email.toLowerCase()===adminEmail;
  if(existing.exists){const stored=existing.data(),role=isAdmin?'admin':stored.role==='teacher'?'teacher':'student',profile={...stored,role,updatedAt:Date.now()};await admin.auth().setCustomUserClaims(decoded.uid,{role});await ref.set(profile,{merge:true});return send(res,200,{profile:{id:decoded.uid,...profile}})}
  const role=isAdmin?'admin':req.body?.role==='teacher'?'teacher':'student';
  const suppliedName=String(req.body?.name||'').trim().slice(0,60),name=suppliedName||(isAdmin?'Administrator':'');
  if(!name)return send(res,400,{error:'Ismingizni kiriting.'});
  const profile={uid:decoded.uid,email:decoded.email,name,role,provider:'email',updatedAt:Date.now(),createdAt:Date.now()};
  await admin.auth().setCustomUserClaims(decoded.uid,{role});
  await ref.set(profile);
  return send(res,200,{profile:{id:decoded.uid,...profile}});
 }catch(error){
  const known=error?.code==='auth/id-token-expired'?'Login muddati tugagan. Qayta urinib ko‘ring.':'Email profilini yaratib bo‘lmadi.';
  return send(res,400,{error:known});
 }
}
