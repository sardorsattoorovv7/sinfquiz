import {getSupabase} from './supabase-sdk.js';

async function rpc(name,params={}){
 const sdk=await getSupabase();
 const {data,error}=await sdk.app.rpc(name,params);
 if(error){
  if(error.code==='42883'||error.code==='PGRST202')throw Error('Chat va darslik hisoblagichi uchun supabase-migration-7.8.sql ni RUN qiling.');
  throw Error(error.message||'So‘rov bajarilmadi.');
 }
 return data;
}

export const lessonCounts=ids=>ids.length?rpc('sq_lesson_counts',{p_ids:ids.slice(0,100)}):Promise.resolve({});
export const markLessonRead=id=>rpc('sq_lesson_mark_read',{p_id:id});
export const openLessonChat=id=>rpc('sq_chat_open',{p_lesson_id:id});
export const chatInbox=()=>rpc('sq_chat_inbox');
export const chatMessages=id=>rpc('sq_chat_messages_for',{p_thread:id});
export const sendChatText=(id,body)=>rpc('sq_chat_send',{p_thread:id,p_kind:'text',p_body:body});
export const sendChatVoice=(id,base64,mime,duration)=>rpc('sq_chat_send',{
 p_thread:id,p_kind:'voice',p_audio_base64:base64,p_mime:mime,p_duration:duration
});
export const chatAudio=id=>rpc('sq_chat_audio',{p_message:id});
export const blockChat=(id,blocked)=>rpc('sq_chat_block',{p_thread:id,p_block:blocked});
export const reportChat=id=>rpc('sq_chat_report',{p_message:id});
export const chatReports=()=>rpc('sq_chat_reports');
export const moderateChat=(id,suspend)=>rpc('sq_chat_moderate',{p_thread:id,p_suspend:suspend});
