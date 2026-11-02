// Audio drafts stay on this device until an authenticated upload succeeds.
// Keys include the real account ID. Signing out never exposes another draft.
const open=()=>new Promise((resolve,reject)=>{const r=indexedDB.open('sinfquiz-speaking-746',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('Qurilmada audio saqlash ochilmadi. Brauzer xotirasini tekshiring.'));});
async function operation(mode,fn){const db=await open();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('drafts',mode),req=fn(tx.objectStore('drafts'));let value;req.onsuccess=()=>{value=req.result;};tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(Error('Audio nusxasi saqlanmadi. Qurilma xotirasini tekshiring.'));tx.onabort=()=>reject(Error('Audio saqlash to‘xtadi.'));});}finally{db.close();}}
export const loadDraft=key=>operation('readonly',s=>s.get(key));
export const saveDraft=(key,value)=>operation('readwrite',s=>s.put(value,key));
export const removeDraft=key=>operation('readwrite',s=>s.delete(key));
export async function clearUserDrafts(id){const db=await open();try{await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite'),r=tx.objectStore('drafts').openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(String(c.key).startsWith(id+':'))c.delete();c.continue();}};tx.oncomplete=resolve;tx.onerror=reject;});}finally{db.close();}}
export async function blobHash(blob){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('');}
