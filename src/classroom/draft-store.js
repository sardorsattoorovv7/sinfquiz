import {validateClassroom} from './model.js';
let connection;
const key = owner => `sq-classroom-v1:${owner}`;
const fallback = owner => {try{return JSON.parse(localStorage.getItem(key(owner))||'null');}catch{return null;}};
function database() {
  if(!globalThis.indexedDB)return Promise.reject(Error('IndexedDB mavjud emas.'));
  if(!connection)connection=new Promise((resolve,reject)=>{
    const req=indexedDB.open('sinfquiz-classroom',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('drafts');
    req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();connection=null;};resolve(req.result);};
    req.onerror=()=>{connection=null;reject(req.error);};
    req.onblocked=()=>{connection=null;reject(Error('Boshqa oynadagi eski Sinfxonani yoping.'));};
  });
  return connection;
}
export async function loadClassroomDraft(owner) {
  if(!owner)throw Error('Ustoz hisobi kerak.');
  try {
    const db=await database(),value=await new Promise((resolve,reject)=>{const q=db.transaction('drafts').objectStore('drafts').get(key(owner));q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
    const backup=fallback(owner),latest=(backup?.updatedAt||0)>(value?.updatedAt||0)?backup:value;
    return {document:validateClassroom(latest?.document),updatedAt:latest?.updatedAt||null,source:latest===backup?'localStorage':'IndexedDB'};
  } catch {
    const value=fallback(owner);
    return {document:validateClassroom(value?.document),updatedAt:value?.updatedAt||null,source:'localStorage'};
  }
}
export async function saveClassroomDraft(owner,document) {
  if(!owner)throw Error('Ustoz hisobi kerak.');
  const value={document,updatedAt:Date.now()};
  try {
    const db=await database();
    await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(value,key(owner));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
    return value.updatedAt;
  } catch {
    try {localStorage.setItem(key(owner),JSON.stringify(value));return value.updatedAt;}
    catch {throw Error('Brauzer qoralamani saqlay olmadi. Joy bo‘shating yoki doskani PNG sifatida yuklab oling.');}
  }
}
