import {getSupabase} from './supabase-sdk.js';
import {normalizedHistory} from './profile-results.js';

const profileFields=profile=>({name:profile.name||'',email:profile.email||'',role:profile.role,provider:profile.provider||'email',school:profile.school||'',className:profile.className||'',about:profile.about||'',createdAt:profile.createdAt||null});

export async function studentProfile(){
 const sdk=await getSupabase(),uid=sdk.auth.currentUser?.uid;
 if(!uid||sdk.auth.currentUser.isAnonymous)throw Error('Profil uchun hisobingizga kiring.');
 const snap=await sdk.getDoc(sdk.doc(sdk.db,'profiles',uid));
 if(!snap.exists())throw Error('Profil topilmadi.');
 return profileFields(snap.data());
}

export async function updateStudentProfile({name,school,className,about}){
 const sdk=await getSupabase(),uid=sdk.auth.currentUser?.uid;
 if(!uid||sdk.auth.currentUser.isAnonymous)throw Error('Hisobingizga kiring.');
 const clean={name:String(name||'').trim().slice(0,60),school:String(school||'').trim().slice(0,100),className:String(className||'').trim().slice(0,30),about:String(about||'').trim().slice(0,400)};
 if(clean.name.length<2)throw Error('Ism kamida 2 belgidan iborat bo‘lsin.');
 const ref=sdk.doc(sdk.db,'profiles',uid),snap=await sdk.getDoc(ref);
 if(!snap.exists()||snap.data().role!=='student')throw Error('O‘quvchi profili topilmadi.');
 await sdk.setDoc(ref,{...snap.data(),...clean,updatedAt:Date.now()});
 return profileFields({...snap.data(),...clean});
}

export async function changeOwnPassword(currentPassword,nextPassword){
 const sdk=await getSupabase(),user=sdk.auth.currentUser;
 if(!user||user.isAnonymous)throw Error('Hisobingizga kiring.');
 const snap=await sdk.getDoc(sdk.doc(sdk.db,'profiles',user.uid));
 if(snap.data()?.provider!=='email')throw Error('Parolni faqat email orqali kiradigan hisobda yangilash mumkin.');
 if(typeof nextPassword!=='string'||nextPassword.length<12)throw Error('Yangi parol kamida 12 belgidan iborat bo‘lsin.');
 if(!currentPassword||currentPassword===nextPassword)throw Error('Eski va yangi parol turlicha bo‘lsin.');
 const {error:signInError}=await sdk.app.auth.signInWithPassword({email:user.email,password:currentPassword});
 if(signInError)throw Error('Joriy parol noto‘g‘ri.');
 const {error}=await sdk.app.auth.updateUser({password:nextPassword});
 if(error)throw Error(error.message);
 return {ok:true};
}

export async function adminResetPassword(uid){
 const sdk=await getSupabase(),token=await sdk.auth.currentUser?.getIdToken();
 if(!token)throw Error('Qayta tizimga kiring.');
 let response;
 try{response=await fetch('/api/admin-reset-password',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({uid}),cache:'no-store'})}
 catch{throw Error('Lokal serverga ulanib bo‘lmadi. npm run dev serveri ishlayotganini tekshiring.')}
 if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Admin API topilmadi. Yangilangan loyihani npm run dev bilan qayta ishga tushiring.');
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(body.error||'Parolni yangilab bo‘lmadi.');
 if(typeof body.password!=='string')throw Error('Server javobi noto‘g‘ri. Parol holatini tekshiring.');
 return body;
}

export async function savePracticeResult(row){
 const sdk=await getSupabase(),uid=sdk.auth.currentUser?.uid;
 if(!uid||sdk.auth.currentUser.isAnonymous)return false;
 const id=`${uid}:${row.id}`;
 await sdk.setDoc(sdk.doc(sdk.db,'practiceResults',id),{uid,id:row.id,examId:row.examId,title:row.title,correct:row.correct,total:row.total,at:row.at});
 return true;
}

export async function loadStudentResults(localPractice=[]){
 const sdk=await getSupabase(),uid=sdk.auth.currentUser?.uid;
 if(!uid||sdk.auth.currentUser.isAnonymous)throw Error('Natijalar uchun hisobingizga kiring.');
 const names=['players','typingResults','nationalResults','practiceResults','raceResults'];
 const requests=names.map(name=>sdk.getDocs(sdk.query(sdk.collection(sdk.db,name),sdk.where('uid','==',uid))));
 requests.push(sdk.app.rpc('sq_student_result_history'));
 const settled=await Promise.allSettled(requests),groups={};
 settled.slice(0,5).forEach((result,index)=>{groups[['players','typing','national','practice','race'][index]]=result.status==='fulfilled'?result.value.docs.map(doc=>({id:doc.id,...doc.data()})):[]});
 const cefr=settled[5];groups.cefr=cefr.status==='fulfilled'&&!cefr.value.error?cefr.value.data||[]:[];
 const errors=settled.map((result,index)=>result.status==='rejected'?names[index]||'cefr':index===5&&result.value.error?'cefr':null).filter(Boolean);
 return {rows:normalizedHistory(groups,localPractice),partial:errors.length>0,missing:errors};
}
