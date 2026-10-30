import {useCallback,useEffect,useRef,useState} from 'react';
import {progressStorageKey,readLearning,updateLearning} from './progress.js';
const eventName='sq-atlas-learning-update';
function storage(){try{return globalThis.localStorage;}catch{return null;}}
export function useLearning(owner){
 const key=progressStorageKey(owner),[data,setData]=useState(()=>readLearning(storage(),key)),[blocked,setBlocked]=useState(false),current=useRef(data),unavailable=useRef(false);
 useEffect(()=>{const initial=readLearning(storage(),key);current.current=initial;unavailable.current=false;setData(initial);setBlocked(false);const accept=value=>{current.current=value;setData(value);};const update=e=>{if(e.detail?.key===key)accept(e.detail.data);};const external=e=>{if(e.key===key)accept(readLearning(storage(),key));};window.addEventListener(eventName,update);window.addEventListener('storage',external);return()=>{window.removeEventListener(eventName,update);window.removeEventListener('storage',external);};},[key]);
 const update=useCallback((subject,id,patch)=>{const store=storage(),source=unavailable.current?current.current:readLearning(store,key),next=updateLearning(source,subject,id,patch);let failed=false;try{if(!store)throw Error('blocked');store.setItem(key,JSON.stringify(next));}catch{failed=true;}current.current=next;unavailable.current=failed;setData(next);setBlocked(failed);window.dispatchEvent(new window.CustomEvent(eventName,{detail:{key,data:next}}));},[key]);
 return {data,update,blocked};
}
