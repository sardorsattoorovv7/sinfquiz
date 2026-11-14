import {getSupabase,supabaseConfig} from '../supabase-sdk.js';
import {speakingRequest} from './request.js';
export async function speakingApi(action,data={},signal,timeoutMs){
 const {auth}=await getSupabase(),token=await auth.currentUser?.getIdToken();
 if(!token||auth.currentUser?.isAnonymous)throw Object.assign(Error('Shaxsiy Speaking bo‘limi uchun hisobga kiring.'),{code:'AUTH_REQUIRED'});
 return speakingRequest(action,data,token,{signal,timeoutMs});
}
export async function uploadSpeaking(blob,details,onStage){
 onStage?.('preparing-upload');
 const asset=await speakingApi('prepare_audio',{...details,bytes:blob.size,mime:blob.type.split(';')[0]});
 if(asset.submitted)return asset.assetId;
 if(!asset.assetId||typeof asset.path!=='string'||typeof asset.token!=='string')throw Error('Audio uchun yuklash manzili olinmadi. Qayta urinib ko‘ring.');
 const path=asset.path.split('/').map(encodeURIComponent).join('/');
 const url=new URL('/storage/v1/object/upload/sign/speaking-private/'+path,supabaseConfig.url);
 url.searchParams.set('token',asset.token);
 const body=new FormData();
 body.append('cacheControl','0');
 body.append('',blob);
 const timeoutMs=Math.min(90_000,12_000+Math.ceil(blob.size/32_768)*1000);
 onStage?.('uploading');
 for(let attempt=0;attempt<2;attempt++){
  let retry=false;
  try{
   const response=await fetch(url,{method:'PUT',headers:{'x-upsert':'false',apikey:supabaseConfig.anonKey},body,
    credentials:'omit',redirect:'error',signal:AbortSignal.timeout(timeoutMs)});
   if(response.ok)return asset.assetId;
   if(response.status===400||response.status===409){
    const problem=await response.json().catch(()=>null);
    // If Storage received the first PUT, its original object remains immutable.
    if(/already exists|duplicate|resource already|keyalreadyexists/i.test([problem?.message,problem?.error,problem?.code].join(' ')))return asset.assetId;
   }else{
    await response.body?.cancel().catch(()=>{});
   }
   retry=response.status===408||response.status>=500;
  }catch(error){retry=error.name!=='TimeoutError'&&error.name!=='AbortError';}
  if(!retry||attempt===1)break;
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw Object.assign(Error('Audio yuborilmadi. Aloqa tiklangach saqlangan yozuvni qayta yuboring.'),{code:'AUDIO_UPLOAD',retryable:true});
}
export const newToken=()=>{if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);};
export const categoryNames={missing_be:'Be fe’li',subject_verb_agreement:'Ega va kesim',verb_pattern:'Fe’l qolipi',tense_aspect:'Zamon',article:'Artikl',preposition:'Predlog',countability_number:'Son va sanalish',word_order:'So‘z tartibi',collocation:'Tabiiy birikma',pronoun_reference:'Olmosh',relevance:'Savolga moslik',answer_development:'Javobni rivojlantirish'};
export const taskNames={warmup:'Og‘zaki qizish',vocabulary:'Iboralar va takrorlash',drill:'Shaxsiy mashq',speaking:'Yangi savol',reflection:'Tahlil va qayta aytish'};
export const jobNames={queued:'Navbatda',running:'Ishlanmoqda',completed:'Tayyor',failed:'Qayta urinish kerak',cancelled:'Bekor qilingan'};
export const timeLabel=n=>`${Math.floor(Math.max(0,n)/60)}:${String(Math.max(0,n)%60).padStart(2,'0')}`;
export const phaseNames = {prompt: 'Savol taqdimoti', prep: 'Tayyorlanish vaqti', answer: 'Javob vaqti'};
export function turnTime(turn, now, fallback = 0) {
 if (!turn) return {phase: 'answer', seconds: fallback};
 const promptEnd = Date.parse(turn.promptUntil);
 const prepEnd = Date.parse(turn.prepUntil);
 const end = Date.parse(turn.deadline);
 if (now < promptEnd) return {phase: 'prompt', seconds: Math.ceil((promptEnd - now) / 1000)};
 if (now < prepEnd) return {phase: 'prep', seconds: Math.ceil((prepEnd - now) / 1000)};
 return {phase: 'answer', seconds: Math.ceil((end - now) / 1000)};
}
export function comparableAssessments(rows){return rows.filter(r=>['baseline','recheck','transfer','weekly_check'].includes(r.payload.attemptKind)&&r.payload.wordCount>=100).filter(r=>r.payload.answerAnalyses.every(a=>['baseline','recheck','transfer','weekly_check'].includes(a.attemptKind)&&a.isFirstAttempt&&!a.hasSeenPrompt&&!a.hasSeenModelAnswer&&a.sourceKind==='audio'&&a.status==='answered'&&!a.uncertain)).sort((a,b)=>a.created_at.localeCompare(b.created_at));}
