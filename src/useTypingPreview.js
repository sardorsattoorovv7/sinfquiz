import {useEffect,useRef,useState} from 'react';
import {typingPreview} from './competition-typing.js';

export function useTypingPreview(target,typed){
 const [match,setMatch]=useState(()=>typingPreview(target,typed));
 const worker=useRef(null),serial=useRef(0),latest=useRef({target,typed});latest.current={target,typed};
 useEffect(()=>{
  let instance;
  try{
   instance=new Worker(new URL('./competition-typing.worker.js',import.meta.url),{type:'module'});
   worker.current=instance;
   instance.onmessage=({data})=>{if(data.id===serial.current)setMatch(data.match)};
   instance.onerror=event=>{event.preventDefault();instance.terminate();worker.current=null;setMatch(typingPreview(latest.current.target,latest.current.typed))};
  }catch{worker.current=null}
  return()=>{instance?.terminate();worker.current=null};
 },[]);
 useEffect(()=>{
  const id=++serial.current;
  const delay=setTimeout(()=>{if(worker.current)worker.current.postMessage({id,target,typed,preview:true});else setMatch(typingPreview(target,typed))},100);
  return()=>clearTimeout(delay);
 },[target,typed]);
 return match;
}
