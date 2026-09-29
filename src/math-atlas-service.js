import {getSupabase} from './supabase-sdk.js';

const table='math_atlas_concepts';
const explain=error=>{if(error){if(error.code==='42P01'||error.code==='PGRST205')throw Error('Matematika atlasi migratsiyasini Supabase SQL Editor’da ishga tushiring (supabase-math-atlas.sql).');throw Error(error.message||'Atlas ma’lumotlari yuklanmadi.')}};
export async function loadAtlasConcepts(){const {db}=await getSupabase();const {data,error}=await db.from(table).select('id,owner_id,status,data,created_at,updated_at').order('updated_at',{ascending:false}).limit(250);explain(error);return data||[]}
export async function saveAtlasConcept({id,ownerId,status,data}){
 const sdk=await getSupabase();if(!sdk.auth.currentUser||sdk.auth.currentUser.uid!==ownerId)throw Error('Ushbu kontentni faqat uning muallifi saqlay oladi.');
 const payload={owner_id:ownerId,status,data};
 if(id){const {data:row,error}=await sdk.db.from(table).update(payload).eq('id',id).eq('owner_id',ownerId).select().single();explain(error);return row}
 const {data:row,error}=await sdk.db.from(table).insert(payload).select().single();explain(error);return row;
}
export async function deleteAtlasConcept(id,ownerId){const sdk=await getSupabase();if(sdk.auth.currentUser?.uid!==ownerId)throw Error('Faqat muallif o‘chira oladi.');const {error}=await sdk.db.from(table).delete().eq('id',id).eq('owner_id',ownerId);explain(error)}
export async function reviewAtlasConcept(id,status){const {db}=await getSupabase();const {data,error}=await db.from(table).update({status}).eq('id',id).select().single();explain(error);return data}
