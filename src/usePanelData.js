import {useEffect,useRef,useState} from 'react';
import {api} from './api.js';
const emptyDb=()=>({quizzes:[],publicQuizzes:[],lessons:[],players:[]});
const emptyCatalog=()=>({quizzes:[],lessons:[]});

// The teaching dashboard can contain every lesson, test and live result. Keep
// that work off public pages, atlases and the two independent AI screens.
export function usePanelData(user,view,authReady){
 const [db,setDb]=useState(emptyDb),[catalog,setCatalog]=useState(emptyCatalog),[dbOwner,setDbOwner]=useState(null),[catalogOwner,setCatalogOwner]=useState(null),[error,setError]=useState(null);
 const currentOwner=useRef(user?.id),inFlight=useRef({}),loadedAt=useRef({});currentOwner.current=user?.id;
 const wanted=view==='admin'&&['admin','teacher'].includes(user?.role)?'db':view==='catalog'&&user?'catalog':null;
 async function load(kind,owner=user?.id){
  if(!owner)return;
  if(inFlight.current[kind]?.owner===owner)return inFlight.current[kind].promise;
  setError(null);
  const promise=api(kind==='db'?'/api/quizzes':'/api/catalog').then(value=>{
   if(currentOwner.current===owner){loadedAt.current[kind]=Date.now();if(kind==='db'){setDb(value);setDbOwner(owner)}else{setCatalog(value);setCatalogOwner(owner)}}
   return value;
  }).catch(e=>{if(currentOwner.current===owner)setError({kind,owner,message:e.message});throw e;}).finally(()=>{if(inFlight.current[kind]?.promise===promise)delete inFlight.current[kind];});
  inFlight.current[kind]={owner,promise};return promise;
 }
 useEffect(()=>{
  loadedAt.current={};setDb(emptyDb());setCatalog(emptyCatalog());setDbOwner(null);setCatalogOwner(null);setError(null);
 },[user?.id]);
 useEffect(()=>{
  if(authReady&&wanted&&((wanted==='db'?dbOwner:catalogOwner)!==user.id||Date.now()-(loadedAt.current[wanted]||0)>15000))load(wanted,user.id).catch(()=>{});
 },[authReady,user?.id,wanted,dbOwner,catalogOwner]);
 return {db,setDb,catalog,setCatalog,reload:()=>load('db'),panelPending:!!wanted&&(wanted==='db'?dbOwner:catalogOwner)!==user.id,panelError:error?.owner===user?.id&&error?.kind===wanted?error.message:null,retryPanel:()=>load(wanted).catch(()=>{}),dbReady:dbOwner===user?.id};
}
