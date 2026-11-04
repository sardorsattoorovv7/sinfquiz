import {getSupabase} from '../supabase-sdk.js';
import {speakingRequest} from './request.js';
export async function speakingApi(action,data={},signal){
 const {auth}=await getSupabase(),token=await auth.currentUser?.getIdToken();
 if(!token||auth.currentUser?.isAnonymous)throw Object.assign(Error('Shaxsiy Speaking bo‘limi uchun hisobga kiring.'),{code:'AUTH_REQUIRED'});
 return speakingRequest(action,data,token,{signal});
}
export async function uploadSpeaking(blob,details){
 const asset=await speakingApi('prepare_audio',{...details,bytes:blob.size,mime:blob.type.split(';')[0]});
 const {app}=await getSupabase(),{error}=await app.storage.from('speaking-private').uploadToSignedUrl(asset.path,asset.token,blob,{contentType:blob.type.split(';')[0]});
 // A successful first upload can lose its response. The server worker verifies
 // the immutable object and hash; a duplicate object is safe to resubmit.
 if(error&&!/already exists|duplicate|resource already/i.test(error.message||''))throw Error('Audio yuborilmadi. Yozuv shu qurilmada saqlandi; qayta yuboring.');
 return asset.assetId;
}
export const newToken=()=>{if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);};
export const categoryNames={missing_be:'Be fe’li',subject_verb_agreement:'Ega va kesim',verb_pattern:'Fe’l qolipi',tense_aspect:'Zamon',article:'Artikl',preposition:'Predlog',countability_number:'Son va sanalish',word_order:'So‘z tartibi',collocation:'Tabiiy birikma',pronoun_reference:'Olmosh',relevance:'Savolga moslik',answer_development:'Javobni rivojlantirish'};
export const taskNames={warmup:'Og‘zaki qizish',vocabulary:'Iboralar va takrorlash',drill:'Shaxsiy mashq',speaking:'Yangi savol',reflection:'Tahlil va qayta aytish'};
export const jobNames={queued:'Navbatda',running:'Ishlanmoqda',completed:'Tayyor',failed:'Qayta urinish kerak',cancelled:'Bekor qilingan'};
export const timeLabel=n=>`${Math.floor(Math.max(0,n)/60)}:${String(Math.max(0,n)%60).padStart(2,'0')}`;
export function comparableAssessments(rows){return rows.filter(r=>['baseline','recheck','transfer','weekly_check'].includes(r.payload.attemptKind)&&r.payload.wordCount>=100).filter(r=>r.payload.answerAnalyses.every(a=>['baseline','recheck','transfer','weekly_check'].includes(a.attemptKind)&&a.isFirstAttempt&&!a.hasSeenPrompt&&!a.hasSeenModelAnswer&&a.sourceKind==='audio'&&a.status==='answered'&&!a.uncertain)).sort((a,b)=>a.created_at.localeCompare(b.created_at));}
