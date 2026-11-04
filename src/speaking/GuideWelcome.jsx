import React,{useEffect,useState} from 'react';
import {Sparkles,ArrowRight} from 'lucide-react';
import './welcome.css';
import RobotAssistant from './RobotAssistant.jsx';

export default function GuideWelcome({user,onNavigate,hidden}){
 const key='sq_guide_746:'+user?.id,[visible,setVisible]=useState(false);
 useEffect(()=>{if(!user?.id){setVisible(false);return;}try{setVisible(localStorage.getItem(key)!=='done');}catch{setVisible(true);}},[key,user?.id]);
 function dismiss(){try{localStorage.setItem(key,'done');}catch{}setVisible(false);}
 if(!visible||hidden||!user)return null;
 return <aside className="sp-welcome" aria-label="Dastur bilan tanishish"><span className="sp-welcome-icon sp-welcome-icon--robot"><RobotAssistant size="mini"/></span><div><b>Dastur bilan birga tanishamiz</b><p>AI ustozdan yo‘l so‘rang, mavzuni tushuning yoki qisqa test bilan qayerdan boshlashni aniqlang.</p><div className="sp-actions"><button className="sp-btn sp-primary" onClick={()=>{dismiss();onNavigate('aiGuide');}}>Menga yo‘l ko‘rsating <ArrowRight size={15}/></button><button className="sp-btn sp-quiet" onClick={dismiss}>Keyinroq</button></div></div></aside>;
}
