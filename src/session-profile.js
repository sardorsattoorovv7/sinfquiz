import {adminEmail,waitForAuth} from './supabase-sdk.js';

export async function userProfile(sdk,user=sdk.auth.currentUser){
 if(!user||user.isAnonymous)return null;
 if(user.email?.toLowerCase()===adminEmail().toLowerCase())return {id:user.uid,uid:user.uid,role:'admin',name:user.displayName||'Administrator',email:user.email,username:'admin'};
 const snapshot=await sdk.getDoc(sdk.doc(sdk.db,'profiles',user.uid));
 return snapshot.exists()?{id:user.uid,...snapshot.data()}:null;
}
export async function sessionProfile(){
 const sdk=await waitForAuth(),user=sdk.auth.currentUser,profile=await userProfile(sdk,user);
 return {user:profile?{id:user.uid,...profile}:null,csrf:profile?'supabase':null};
}
