// User-supplied PDF/audio and recordings remain in this browser, per account.
const database=()=>new Promise((resolve,reject)=>{
 const req=indexedDB.open('sinfquiz-practice-assets',1);
 req.onupgradeneeded=()=>req.result.createObjectStore('files');
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
export async function asset(action,uid,name,value){
 const db=await database();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction('files',action==='get'?'readonly':'readwrite'),store=tx.objectStore('files'),key=uid+':'+name;
  const request=action==='get'?store.get(key):action==='delete'?store.delete(key):store.put(value,key);
  let result;request.onsuccess=()=>{result=request.result};
  tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 })}finally{db.close()}
}
