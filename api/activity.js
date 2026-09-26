import admin from 'firebase-admin';

function getAdmin(){
 if(admin.apps.length)return admin.app();
 const raw=process.env.FIREBASE_SERVICE_ACCOUNT_B64;
 if(!raw)throw Error('FIREBASE_SERVICE_ACCOUNT_B64 sozlanmagan.');
 return admin.initializeApp({credential:admin.credential.cert(JSON.parse(Buffer.from(raw,'base64').toString('utf8')))});
}

const send=(res,status,body)=>res.status(status).setHeader('Cache-Control','no-store').json(body);

export default async function handler(req,res){
 if(req.method!=='POST')return send(res,405,{error:'Faqat POST so‘rovi qabul qilinadi.'});
 try{
  getAdmin();
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const decoded=await admin.auth().verifyIdToken(token);
  const event=['login','heartbeat','logout'].includes(req.body?.event)?req.body.event:'heartbeat';
  const sessionId=String(req.body?.sessionId||'').slice(0,100);
  if(!sessionId)return send(res,400,{error:'Sessiya topilmadi.'});
  const db=admin.firestore(),ref=db.collection('userActivity').doc(decoded.uid),profileRef=db.collection('profiles').doc(decoded.uid),now=Date.now();
  await db.runTransaction(async transaction=>{
   const [activitySnap,profileSnap]=await Promise.all([transaction.get(ref),transaction.get(profileRef)]),current=activitySnap.exists?activitySnap.data():{},profile=profileSnap.exists?profileSnap.data():{};
   const next={uid:decoded.uid,name:profile.name||decoded.name||decoded.email||'Foydalanuvchi',email:profile.email||decoded.email||'',role:profile.role||decoded.role||'student',lastSeenAt:now,updatedAt:now,loginCount:current.loginCount||0,logoutCount:current.logoutCount||0};
   if(event==='login'&&current.lastSessionId!==sessionId){next.loginCount++;next.lastLoginAt=now;next.lastSessionId=sessionId}
   if(event==='logout'&&current.lastLogoutSessionId!==sessionId){next.logoutCount++;next.lastLogoutAt=now;next.lastLogoutSessionId=sessionId}
   transaction.set(ref,{...current,...next},{merge:true});
  });
  return send(res,200,{ok:true,at:now});
 }catch(error){return send(res,401,{error:error?.code==='auth/id-token-expired'?'Login muddati tugagan.':'Faollikni saqlab bo‘lmadi.'})}
}
