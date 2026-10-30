import React,{lazy,Suspense,useMemo,useState} from 'react';
import {Eye,X} from 'lucide-react';
import {realityContext,realitySubjectNames} from './contexts.js';
import './reality.css';
const Experiment=lazy(()=>import('./ScenarioExperiment.jsx'));
export default function RealityExperience({subject,topic,user}){
 const [open,setOpen]=useState(false),context=useMemo(()=>realityContext(subject,topic),[subject,topic]);
 return <section className={`ar-experience ar-${subject}`} aria-label={`${topic.title}: amaliy muhit`}>
  <header className="ar-entry"><div><span className="ar-eyebrow">KO‘RING · BOSHQARING · NATIJANI TEKSHIRING</span><h3>{context.title}</h3><p>{context.life}</p></div><button className="ar-primary" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X size={17}/>:<Eye size={18}/>} {open?'Amaliy muhitni yopish':'Amaliy muhitga kirish'}</button></header>
  {open&&<Suspense fallback={<p className="ar-loading" role="status">{realitySubjectNames[subject]} tayyorlanmoqda…</p>}><Experiment key={`${subject}:${topic.id}:${user?.id||'guest'}`} subject={subject} topic={topic} context={context} user={user}/></Suspense>}
 </section>;
}
