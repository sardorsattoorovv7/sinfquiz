import {useEffect,useRef} from 'react';
import {uiCopy} from './ui-copy.js';

const navigationEvent='sq:before-navigation';

export function confirmUnsavedNavigation(){
 return window.dispatchEvent(new window.Event(navigationEvent,{cancelable:true}));
}

// The same guard is used by local editor buttons and the surrounding navigation.
export function useUnsavedChanges(dirty){
 const approved=useRef(false);
 useEffect(()=>{
  if(!dirty)return;
  const navigate=event=>{
   if(approved.current)return;
   if(!window.confirm(uiCopy.common.discardChanges)){event.preventDefault();return;}
   approved.current=true;
   queueMicrotask(()=>{approved.current=false});
  };
  const unload=event=>{event.preventDefault();event.returnValue=''};
  window.addEventListener(navigationEvent,navigate);
  window.addEventListener('beforeunload',unload);
  return()=>{
   window.removeEventListener(navigationEvent,navigate);
   window.removeEventListener('beforeunload',unload);
  };
 },[dirty]);
 return confirmUnsavedNavigation;
}
