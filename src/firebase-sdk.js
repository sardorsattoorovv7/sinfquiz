const FIREBASE_VERSION='12.19.0';
const base=`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
let sdkPromise;

export const firebaseConfig={
 apiKey:import.meta.env.VITE_FIREBASE_API_KEY,
 authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
 projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,
 storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
 messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
 appId:import.meta.env.VITE_FIREBASE_APP_ID,
};

// DEBUG QISMI
console.log("🔥 Firebase ENV qiymatlar:", {
  apiKey: Boolean(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: Boolean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: Boolean(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: Boolean(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: Boolean(import.meta.env.VITE_FIREBASE_APP_ID),
  adminEmail: Boolean(import.meta.env.VITE_FIREBASE_ADMIN_EMAIL),
});
console.log("firebaseReady() natija:", firebaseReady());
console.log("Config qiymatlar:", firebaseConfig);

export const firebaseReady=()=>Object.values(firebaseConfig).every(Boolean)&&!!import.meta.env.VITE_FIREBASE_ADMIN_EMAIL;
export const adminEmail=()=>import.meta.env.VITE_FIREBASE_ADMIN_EMAIL||'';

export async function getFirebase(){
 if(!firebaseReady())throw Error('Firebase sozlanmagan. Vercel Environment Variables qiymatlarini kiriting.');
 if(!sdkPromise)sdkPromise=Promise.all([
  import(/* @vite-ignore */`${base}/firebase-app.js`),
  import(/* @vite-ignore */`${base}/firebase-auth.js`),
  import(/* @vite-ignore */`${base}/firebase-firestore.js`),
 ]).then(([appSdk,authSdk,storeSdk])=>{
  const app=appSdk.getApps().length?appSdk.getApp():appSdk.initializeApp(firebaseConfig);
  return {...authSdk,...storeSdk,app,auth:authSdk.getAuth(app),db:storeSdk.getFirestore(app)};
 });
 return sdkPromise;
}

export async function waitForAuth(){
 const sdk=await getFirebase();
 await new Promise(resolve=>{const stop=sdk.onAuthStateChanged(sdk.auth,()=>{stop();resolve()})});
 return sdk;
}

export async function ensureAnonymous(){
 const sdk=await waitForAuth();
 if(!sdk.auth.currentUser)await sdk.signInAnonymously(sdk.auth);
 return sdk;
}