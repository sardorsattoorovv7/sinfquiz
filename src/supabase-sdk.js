import {orderedPages} from './ordered-pages.js';
import {createClient} from '@supabase/supabase-js';

const SUPABASE_URL=String(import.meta.env.VITE_SUPABASE_URL||'').trim().replace(/\/+$/,'');
const SUPABASE_ANON_KEY=String(import.meta.env.VITE_SUPABASE_ANON_KEY||'').trim();
const ADMIN_EMAIL='admin@sinfquiz.uz';
let client=null;
let channelCounter=0;
let authLoaded=false;
let authLoadPromise=null;
let anonymousPromise=null;

const fail=error=>{if(error)throw Error(error.message||String(error))};
const getClient=()=>{if(!supabaseReady())throw Error('Supabase sozlanmagan. VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY qiymatlarini kiriting.');if(!client)client=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},realtime:{params:{eventsPerSecond:12}}});return client};
const mapUser=user=>user?{...user,uid:user.id,isAnonymous:user.is_anonymous===true,displayName:user.user_metadata?.name||user.user_metadata?.full_name||'',getIdToken:async()=>{const {data,error}=await getClient().auth.getSession();fail(error);return data.session?.access_token||''},delete:async()=>{await getClient().auth.signOut()}}:null;

export const supabaseConfig={url:SUPABASE_URL,anonKey:SUPABASE_ANON_KEY};
export const supabaseReady=()=>globalThis.__SINFQUIZ_LEGACY_TEST__!==true&&/^https:\/\/.+\.supabase\.co$/i.test(SUPABASE_URL)&&SUPABASE_ANON_KEY.length>40;
export const adminEmail=()=>ADMIN_EMAIL;
export const telegramBotUsername=()=>import.meta.env.VITE_TELEGRAM_BOT_USERNAME||'';

const docRef=(collection,id)=>({kind:'doc',collection:String(collection),id:String(id)});
const collectionRef=collection=>({kind:'collection',collection:String(collection)});
const snapshotDoc=(ref,row)=>({id:ref.id,ref,exists:()=>!!row,data:()=>row?.data||undefined});
const snapshotQuery=(ref,rows=[])=>{const docs=rows.map(row=>snapshotDoc(docRef(ref.collection,row.id),row));return {docs,empty:docs.length===0,size:docs.length,forEach:callback=>docs.forEach(callback)}};
const applyFilters=(builder,filters=[])=>filters.reduce((query,item)=>item.op==='=='?query.eq(`data->>${item.field}`,String(item.value)):query,builder);

async function getDoc(ref){const {data,error}=await getClient().from('documents').select('id,data').eq('collection',ref.collection).eq('id',ref.id).maybeSingle();fail(error);return snapshotDoc(ref,data)}
async function getDocs(ref){const rows=await orderedPages(async(after,size)=>{let q=applyFilters(getClient().from('documents').select('id,data').eq('collection',ref.collection),ref.filters).order('id',{ascending:true});if(after)q=q.gt('id',after);const {data,error}=await q.limit(size);fail(error);return data||[]},{limit:ref.limit||Infinity});return snapshotQuery(ref,rows)}
async function setDoc(ref,value,options={}){const {error}=await getClient().rpc('sq_documents_batch',{p_ops:[{op:options.merge?'merge':'set',collection:ref.collection,id:ref.id,data:value}]});fail(error)}
async function updateDoc(ref,value){const {error}=await getClient().rpc('sq_documents_batch',{p_ops:[{op:'update',collection:ref.collection,id:ref.id,data:value}]});fail(error)}
async function deleteDoc(ref){const {error}=await getClient().from('documents').delete().eq('collection',ref.collection).eq('id',ref.id);fail(error)}
function writeBatch(){const operations=[];const add=(op,ref,value)=>operations.push({op,collection:ref.collection,id:ref.id,...(value?{data:value}:{})});return {set:(ref,value,options)=>add(options?.merge?'merge':'set',ref,value),update:(ref,value)=>add('update',ref,value),delete:ref=>add('delete',ref),commit:async()=>{const {error}=await getClient().rpc('sq_documents_batch',{p_ops:operations});fail(error)}}}
const query=(ref,...filters)=>({...ref,kind:'query',filters:filters.filter(Boolean)});
const where=(field,op,value)=>({field,op,value});

function onSnapshot(ref,onNext,onError=()=>{}){
 const supabase=getClient(),name=`sq-${ref.collection}-${ref.id||'all'}-${++channelCounter}`;let stopped=false,timer;
 const refresh=()=>{clearTimeout(timer);timer=setTimeout(async()=>{if(stopped)return;try{onNext(ref.kind==='doc'?await getDoc(ref):await getDocs(ref))}catch(error){onError(error)}},45)};
 const channel=supabase.channel(name).on('postgres_changes',{event:'*',schema:'public',table:'documents',filter:`collection=eq.${ref.collection}`},refresh).subscribe(status=>{if(status==='SUBSCRIBED')refresh()});refresh();
 return()=>{stopped=true;clearTimeout(timer);supabase.removeChannel(channel)};
}

function onChanges(collection,onNext,onError=()=>{}){
 const supabase=getClient(),name=`sq-change-${collection}-${++channelCounter}`;
 const channel=supabase.channel(name).on('postgres_changes',
   {event:'*',schema:'public',table:'documents',filter:`collection=eq.${collection}`},
   onNext).subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')onError(Error('Jonli aloqa uzildi.'))});
 return()=>{supabase.removeChannel(channel)};
}

const auth={currentUser:null};
async function syncAuth(){const {data,error}=await getClient().auth.getSession();fail(error);auth.currentUser=mapUser(data.session?.user);authLoaded=true;return auth.currentUser}

export async function getSupabase(){
 const supabase=getClient();if(!authLoaded){if(!authLoadPromise)authLoadPromise=syncAuth().finally(()=>{authLoadPromise=null});await authLoadPromise}
 return {app:supabase,db:supabase,auth,doc:(_db,collection,id)=>docRef(collection,id),collection:(_db,collection)=>collectionRef(collection),query,where,getDoc,getDocs,setDoc,updateDoc,deleteDoc,writeBatch:()=>writeBatch(),onSnapshot,onChanges,
  onAuthStateChanged:(_auth,callback,error)=>{let active=true;syncAuth().then(()=>active&&callback(auth.currentUser)).catch(error);const {data}=supabase.auth.onAuthStateChange((_event,session)=>{auth.currentUser=mapUser(session?.user);active&&callback(auth.currentUser)});return()=>{active=false;data.subscription.unsubscribe()}},
  signInWithEmailAndPassword:async(_auth,email,password)=>{const {data,error}=await supabase.auth.signInWithPassword({email,password});fail(error);auth.currentUser=mapUser(data.user);return {user:auth.currentUser}},
  createUserWithEmailAndPassword:async(_auth,email,password)=>{const {data,error}=await supabase.auth.signUp({email,password});fail(error);if(!data.session)throw Error('Email tasdiqlash yoqilgan. Supabase Auth sozlamasida Confirm email’ni o‘chiring yoki emailni tasdiqlang.');auth.currentUser=mapUser(data.user);return {user:auth.currentUser}},
  signInAnonymously:async()=>{const {data,error}=await supabase.auth.signInAnonymously();fail(error);auth.currentUser=mapUser(data.user);return {user:auth.currentUser}},
  signOut:async()=>{const {error}=await supabase.auth.signOut();fail(error);auth.currentUser=null}};
}

export async function waitForAuth(){return getSupabase()}
export async function ensureAnonymous(){
 if(!anonymousPromise)anonymousPromise=(async()=>{const sdk=await getSupabase();if(!sdk.auth.currentUser)await sdk.signInAnonymously(sdk.auth);return sdk})().finally(()=>{anonymousPromise=null});
 return anonymousPromise;
}

export async function signInWithTelegram(telegram,role){const response=await fetch('/api/telegram-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telegram,role})});const result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error||'Telegram orqali kirib bo‘lmadi.');const sdk=await getSupabase(),credential=await sdk.signInWithEmailAndPassword(sdk.auth,result.email,result.password);return {...result.profile,uid:credential.user.uid}}
export async function signInWithEmail(email,password){const sdk=await getSupabase(),credential=await sdk.signInWithEmailAndPassword(sdk.auth,email.trim(),password);if(credential.user.email?.toLowerCase()===ADMIN_EMAIL)await sdk.setDoc(sdk.doc(sdk.db,'profiles',credential.user.uid),{uid:credential.user.uid,email:credential.user.email,name:credential.user.displayName||'Administrator',role:'admin',provider:'email',updatedAt:Date.now()},{merge:true});return credential.user}
export async function registerWithEmail({email,password,name,role}){if(password.length<12)throw Error('Parol kamida 12 belgidan iborat bo‘lsin.');const sdk=await getSupabase(),credential=await sdk.createUserWithEmailAndPassword(sdk.auth,email.trim(),password),safeRole=credential.user.email?.toLowerCase()===ADMIN_EMAIL?'admin':role==='teacher'?'teacher':'student',profile={uid:credential.user.uid,email:credential.user.email,name:safeRole==='admin'?'Administrator':name.trim(),role:safeRole,provider:'email',updatedAt:Date.now(),createdAt:Date.now()};await sdk.setDoc(sdk.doc(sdk.db,'profiles',credential.user.uid),profile);return profile}

export async function recordActivity(event){const sdk=await getSupabase(),user=sdk.auth.currentUser;if(!user||user.isAnonymous)return null;const key='sinfquiz_session_id';let id=sessionStorage.getItem(key);if(!id){id=globalThis.crypto.randomUUID();sessionStorage.setItem(key,id)}const {data,error}=await sdk.app.rpc('sq_record_activity',{p_event:event,p_session:id});fail(error);if(event==='logout')sessionStorage.removeItem(key);return data}
