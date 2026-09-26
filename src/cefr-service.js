import {getSupabase} from './supabase-sdk.js';
export async function cefrRpc(name,args={}){
 if(globalThis.__SINFQUIZ_CEFR_TEST__)return globalThis.__SINFQUIZ_CEFR_TEST__(name,args);
 const sdk=await getSupabase();const {data,error}=await sdk.app.rpc(name,args).abortSignal(AbortSignal.timeout(18000));
 if(error){if(['PGRST202','42P01'].includes(error.code))throw Error('CEFR bazasi sozlanmagan. supabase-migration-7.4.sql faylini SQL Editor’da RUN qiling.');throw Error(error.message)}return data;
}
export async function uploadSpeaking(attempt,qid,file){
 if(file.size>20*1024*1024)throw Error('Audio 20 MB dan oshmasin.');
 if(!/^audio\//.test(file.type))throw Error('Audio fayl tanlang.');
 const sdk=await getSupabase(),ext=file.type.includes('mp4')?'m4a':file.type.includes('mpeg')?'mp3':file.type.includes('wav')?'wav':'webm';
 const path=`${sdk.auth.currentUser.uid}/${attempt}/${qid}/${crypto.randomUUID()}.${ext}`;
 const {error}=await sdk.app.storage.from('cefr-recordings').upload(path,file,{contentType:file.type,upsert:false});if(error)throw Error(error.message);return path;
}
export async function speakingUrl(path){const sdk=await getSupabase();const {data,error}=await sdk.app.storage.from('cefr-recordings').createSignedUrl(path,600);if(error)throw Error(error.message);return data.signedUrl}
