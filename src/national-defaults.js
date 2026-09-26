import {nationalReadyVariants} from '../data/national-ready.js';
import {publicationError} from './national-validation.js';

const markerId='national-ready-v75';
let inFlight=null;

export async function ensureNationalDefaults(sdk,profile){
 if(profile?.role!=='admin'||!sdk.auth.currentUser?.uid)return false;
 if(inFlight)return inFlight;
 inFlight=(async()=>{
  const marker=sdk.doc(sdk.db,'settings',markerId);
  if((await sdk.getDoc(marker)).exists())return false;
  const uid=sdk.auth.currentUser.uid,now=Date.now();
  for(const source of nationalReadyVariants){
   const issue=publicationError(source);if(issue)throw Error(`Tayyor variant: ${issue}`);
   const ref=sdk.doc(sdk.db,'nationalSections',source.id);
   if((await sdk.getDoc(ref)).exists())continue; // Preserve edits and approval state.
   await sdk.setDoc(ref,{...source,builtin:false,visibility:'public',approvalStatus:'approved',
    ownerId:uid,ownerName:'SinfQuiz administratori',reviewedBy:uid,reviewedAt:now,
    createdAt:now,updatedAt:now,questionCount:30,sourcePackage:'open-practice-v7.5'});
  }
  await sdk.setDoc(marker,{version:1,createdBy:uid,createdAt:now});
  return true;
 })();
 try{return await inFlight}finally{inFlight=null}
}
