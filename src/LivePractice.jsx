import React,{useEffect,useState} from 'react';
import {Flag,Keyboard} from 'lucide-react';
import {loadLiveRooms,roomWithCode} from './live-rooms.js';
import ClassJoinForm from './paper/ClassJoinForm.jsx';
import {PaperButton,PaperNotice} from './paper/PaperUI.jsx';
import './learning-hub.css';

const roomTypes=[
 {id:'typing',icon:Keyboard,title:'Matn terish',join:'Typing xonasiga kirish'},
 {id:'race',icon:Flag,title:'1v1 bilim poygasi',join:'Poyga xonasiga kirish'},
];

async function resolveRoom(code){
 const checks=await loadLiveRooms(),match=roomWithCode(checks,code);
 if(match)return match;
 if(Object.values(checks).some(check=>check.status==='rejected'))throw Error('Xonalar bilan aloqa uzildi. Kodni qayta tekshiring.');
 throw Error('Bu kod bilan ochiq Typing yoki 1v1 xonasi topilmadi. Kodni ustozingizdan tekshiring.');
}

export default function LivePractice({onTyping,onRace,onBack}){
 const [catalog,setCatalog]=useState(null),[refresh,setRefresh]=useState(0);
 useEffect(()=>{
  let current=true;
  setCatalog(null);
  loadLiveRooms().then(result=>{
   if(current)setCatalog(result);
  });
  return()=>{current=false;};
 },[refresh]);
 return <main className="learning-page">
  <PaperButton variant="quiet" onClick={onBack}>Mashqlarga qaytish</PaperButton>
  <header className="learning-card"><h1>Typing va 1v1</h1><p>Ochiq ustoz xonasini tanlang yoki ustoz bergan kodni kiriting.</p></header>
  <div className="learning-grid">
   {roomTypes.map(({id,icon:Icon,title,join})=>{
    const result=catalog?.[id];
    const offer=result?.status==='fulfilled'?result.value:null;
    return <section key={id} className="learning-card">
     <h2><Icon size={20} aria-hidden="true"/> {title}</h2>
     {!result?<PaperNotice>Xonalar tekshirilmoqda…</PaperNotice>
      :result.status==='rejected'?<PaperNotice kind="warning">Xonalarni tekshirib bo‘lmadi.</PaperNotice>
      :offer?.active?<><p>{offer.rooms?.length||1} ta xona ochiq.</p><PaperButton variant="primary"
       onClick={()=>id==='typing'?onTyping(offer):onRace(offer)}>{join}</PaperButton></>
      :<p>Hozir ochiq xona yo‘q. Ustozingiz xona ochganda qayta tekshiring.</p>}
    </section>;
   })}
  </div>
  <PaperButton onClick={()=>setRefresh(value=>value+1)} disabled={!catalog}>Xonalarni yangilash</PaperButton>
  <section className="learning-card"><h2>Ustozdan kod oldingizmi?</h2>
   <ClassJoinForm compact resolve={resolveRoom} onResolved={({kind,offer})=>kind==='typing'?onTyping(offer):onRace(offer)}/>
  </section>
 </main>;
}
