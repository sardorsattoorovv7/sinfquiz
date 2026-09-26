const FIREBASE_VERSION='12.19.0';
const base=`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
let sdkPromise;
const withDeadline=(promise,ms,message)=>new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>reject(Error(message)),ms);
 Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)});
});

export const firebaseConfig={
 apiKey:'AIzaSyCZG3oGYGNR2U3oRerzPewMCVryyMwdh0A',
 authDomain:'sinfquiz-c8522.firebaseapp.com',
 projectId:'sinfquiz-c8522',
 storageBucket:'sinfquiz-c8522.firebasestorage.app',
 messagingSenderId:'1060458952701',
 appId:'1:1060458952701:web:55f69da8e8f165e15f0b94',
};

const ADMIN_EMAIL='admin@sinfquiz.uz';

export const firebaseReady=()=>globalThis.__SINFQUIZ_LEGACY_TEST__!==true&&Object.values(firebaseConfig).every(Boolean);
export const adminEmail=()=>ADMIN_EMAIL;
export const telegramBotUsername=()=>import.meta.env.VITE_TELEGRAM_BOT_USERNAME||'';

export async function getFirebase(){
 if(!firebaseReady())throw Error('Firebase konfiguratsiyasi to‘liq kiritilmagan.');
 if(!sdkPromise){
  const imports=Promise.all([
   import(/* @vite-ignore */`${base}/firebase-app.js`),
   import(/* @vite-ignore */`${base}/firebase-auth.js`),
   import(/* @vite-ignore */`${base}/firebase-firestore.js`),
  ]).then(([appSdk,authSdk,storeSdk])=>{
   const app=appSdk.getApps().length?appSdk.getApp():appSdk.initializeApp(firebaseConfig);
   return {...authSdk,...storeSdk,app,auth:authSdk.getAuth(app),db:storeSdk.getFirestore(app)};
  });
  sdkPromise=withDeadline(imports,15000,'Firebase modullari sekin yuklandi. Internetni tekshirib, qayta urinib ko‘ring.').catch(error=>{sdkPromise=null;throw error});
 }
 return sdkPromise;
}

export async function waitForAuth(){
 const sdk=await getFirebase();
 await new Promise((resolve,reject)=>{
  let stop=()=>{};
  const timer=setTimeout(()=>{stop();reject(Error('Login tekshiruvi uzoq davom etdi. Sahifani yangilab, qayta urinib ko‘ring.'))},8000);
  stop=sdk.onAuthStateChanged(sdk.auth,()=>{clearTimeout(timer);stop();resolve()},error=>{clearTimeout(timer);stop();reject(error)});
 });
 return sdk;
}

export async function ensureAnonymous(){
 const sdk=await waitForAuth();
 if(!sdk.auth.currentUser)await sdk.signInAnonymously(sdk.auth);
 return sdk;
}

export async function signInWithTelegram(telegram,role){
 const response=await fetch('/api/telegram-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telegram,role})});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(result.error||'Telegram orqali kirib bo‘lmadi.');
 const sdk=await getFirebase();
 await sdk.signInWithCustomToken(sdk.auth,result.token);
 await sdk.auth.currentUser?.getIdToken(true);
 return result.profile;
}

export async function signInWithEmail(email,password){
 const sdk=await getFirebase();
 const credential=await sdk.signInWithEmailAndPassword(sdk.auth,email.trim(),password);
 if(credential.user.email?.toLowerCase()===ADMIN_EMAIL){await sdk.setDoc(sdk.doc(sdk.db,'profiles',credential.user.uid),{uid:credential.user.uid,email:credential.user.email,name:credential.user.displayName||'Administrator',role:'admin',provider:'email',updatedAt:Date.now()},{merge:true})}
 return credential.user;
}

export async function registerWithEmail({email,password,name,role}){
 if(password.length<12)throw Error('Parol kamida 12 belgidan iborat bo‘lsin.');
 const sdk=await getFirebase();
 const credential=await sdk.createUserWithEmailAndPassword(sdk.auth,email.trim(),password);
 const safeRole=credential.user.email?.toLowerCase()===ADMIN_EMAIL?'admin':role==='teacher'?'teacher':'student',profile={uid:credential.user.uid,email:credential.user.email,name:safeRole==='admin'?'Administrator':name.trim(),role:safeRole,provider:'email',updatedAt:Date.now(),createdAt:Date.now()};
 try{await sdk.setDoc(sdk.doc(sdk.db,'profiles',credential.user.uid),profile);return profile}
 catch(error){await credential.user.delete().catch(()=>{});throw error}
}

export async function recordActivity(event){
 const sdk=await getFirebase(),user=sdk.auth.currentUser;
 if(!user||user.isAnonymous)return null;
 const storageKey='sinfquiz_session_id';
 let sessionId=sessionStorage.getItem(storageKey);
 if(!sessionId){sessionId=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;sessionStorage.setItem(storageKey,sessionId)}
 const ref=sdk.doc(sdk.db,'userActivity',user.uid),profileRef=sdk.doc(sdk.db,'profiles',user.uid),now=Date.now();
 await sdk.runTransaction(sdk.db,async transaction=>{const [activitySnap,profileSnap]=await Promise.all([transaction.get(ref),transaction.get(profileRef)]),current=activitySnap.exists()?activitySnap.data():{},profile=profileSnap.exists()?profileSnap.data():{},next={uid:user.uid,name:profile.name||user.displayName||user.email||'Foydalanuvchi',email:profile.email||user.email||'',role:profile.role||(user.email?.toLowerCase()===ADMIN_EMAIL?'admin':'student'),lastSeenAt:now,updatedAt:now,loginCount:current.loginCount||0,logoutCount:current.logoutCount||0};if(event==='login'&&current.lastSessionId!==sessionId){next.loginCount++;next.lastLoginAt=now;next.lastSessionId=sessionId}if(event==='logout'&&current.lastLogoutSessionId!==sessionId){next.logoutCount++;next.lastLogoutAt=now;next.lastLogoutSessionId=sessionId}transaction.set(ref,{...current,...next},{merge:true})});
 if(event==='logout')sessionStorage.removeItem(storageKey);
 return {ok:true,at:now};
}
