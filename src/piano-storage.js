let database;
function open(){
 if(!globalThis.indexedDB)return Promise.reject(Error('Bu brauzerda mahalliy MIDI saqlash mavjud emas.'));
 if(!database)database=new Promise((resolve,reject)=>{
  const request=indexedDB.open('sinfquiz-piano-v1',1);
  request.onupgradeneeded=()=>{const store=request.result.createObjectStore('tracks',{keyPath:'key'});store.createIndex('owner','owner',{unique:false})};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>{database=null;reject(request.error)};
  request.onblocked=()=>{database=null;reject(Error('Pianino saqlash oynasi boshqa tabda band.'))};
 });
 return database;
}
export async function loadPianoTracks(owner){
 const db=await open();return new Promise((resolve,reject)=>{const req=db.transaction('tracks','readonly').objectStore('tracks').index('owner').getAll(owner);req.onsuccess=()=>resolve(req.result.map(x=>x.track));req.onerror=()=>reject(req.error)});
}
export async function storePianoTrack(owner,track){
 const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put({key:owner+':'+track.id,owner,track});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});
}
export async function deletePianoTrack(owner,id){
 const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').delete(owner+':'+id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});
}
