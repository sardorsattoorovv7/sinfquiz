import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,Plus,RefreshCw,Trophy,Users} from 'lucide-react';
import {competitionApi} from './competition-service.js';
import {competitionStatuses} from './competition-model.js';
import CompetitionBuilder from './CompetitionBuilder.jsx';
import CompetitionRoom,{CompetitionJoin} from './CompetitionRoom.jsx';
import './team-competitions.css';

export default function TeamCompetitions({user,onBack,onLogin,onActive}){
 const key='sq_comp_room:'+(user?.id||'guest'),teacher=['teacher','admin'].includes(user?.role);
 const [room,setRoom]=useState(()=>sessionStorage.getItem(key)||null),[initial,setInitial]=useState(null),[draft,setDraft]=useState(null),[creating,setCreating]=useState(false);
 const [list,setList]=useState([]),[catalog,setCatalog]=useState([]),[catalogError,setCatalogError]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false),[filter,setFilter]=useState('active');
 const loadingRef=useRef(false);
 const reload=useCallback(async()=>{if(loadingRef.current||document.hidden||navigator.onLine===false)return;loadingRef.current=true;setLoading(true);try{const data=await competitionApi('list');setList(data.competitions);setError('')}catch(e){setError(e.message)}finally{loadingRef.current=false;setLoading(false)}},[]);
 const reloadCatalog=useCallback(async()=>{if(!teacher)return;try{const data=await competitionApi('catalog');setCatalog(data.sources.map(s=>({...s,ownerName:s.owner,subject:s.subtitle,pin:s.sourceKind==='quiz'?(s.subtitle||'').match(/^\d{6}/)?.[0]:null})));setCatalogError('')}catch(e){setCatalogError(e.message)}},[teacher]);
 useEffect(()=>{if(!room&&!creating)reload();const timer=setInterval(()=>{if(!room&&!creating)reload()},30000),focus=()=>{if(!document.hidden&&!room&&!creating)reload()};document.addEventListener('visibilitychange',focus);window.addEventListener('online',focus);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',focus);window.removeEventListener('online',focus)}},[reload,room,creating]);
 useEffect(()=>{if(creating)reloadCatalog()},[creating,reloadCatalog]);
 const open=(id,next=null)=>{sessionStorage.setItem(key,id);setInitial(next);setRoom(id);setCreating(false);window.scrollTo({top:0,behavior:'instant'})};
 const close=()=>{sessionStorage.removeItem(key);setRoom(null);setInitial(null);onActive(false);reload()};
 const joined=next=>open(next.competition.id,next);
 const edit=next=>{setDraft(next);setCreating(true);onActive(false)};
 const visible=list.filter(c=>filter==='all'||filter==='mine'&&(c.joined||c.manager)||filter==='active'&&['lobby','running'].includes(c.status));
 return <main className="team-competitions">{creating?<CompetitionBuilder initial={draft} catalog={catalog} catalogError={catalogError} onReloadCatalog={reloadCatalog} onSaved={id=>open(id)} onCancel={()=>{setCreating(false);setDraft(null)}}/>:room?<CompetitionRoom key={room} id={room} initial={initial} user={user} onBack={close} onEdit={edit} onActive={onActive} onJoinedOther={joined}/>:<>
 <header className="comp-page-head"><div><span className="comp-eyebrow">BIRGA O‘YLANG. BIRGA NATIJA QILING.</span><h1>Jamoaviy musobaqalar</h1><p>Quiz, typing, labirint va amaliy mashqlarni bir musobaqada bajaring. Har bir a’zoning hissasi jamoa balliga qo‘shiladi.</p></div><div className="comp-row"><button className="btn btn-outline" onClick={onBack}><ArrowLeft size={17}/> Bosh sahifa</button>{teacher&&<button className="btn btn-primary" onClick={()=>{setDraft(null);setCreating(true)}}><Plus size={17}/> Musobaqa yaratish</button>}</div></header>
 <CompetitionJoin user={user} onJoined={joined}/>{!user&&<p className="comp-muted">Hisobsiz kirish yoqilgan bo‘lsa, kod bilan qatnashishingiz mumkin. <button className="btn btn-ghost" onClick={onLogin}>Hisobimga kirish</button></p>}
 <section className="comp-panel"><div className="comp-active-head"><h2><Trophy size={22}/> Musobaqalarni tanlang</h2><button className="btn btn-outline" disabled={loading} onClick={reload}><RefreshCw size={16}/> {loading?'Yangilanmoqda…':'Yangilash'}</button></div><div className="comp-filters" role="group" aria-label="Musobaqalarni filtrlash">{[['active','Faol'],['mine',teacher?'Men tashkil qilgan':'Men qatnashgan'],['all','Barchasi']].map(([id,label])=><button className={'btn '+(filter===id?'btn-primary':'btn-outline')} aria-pressed={filter===id} key={id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
 {error&&<div className="comp-error" role="alert"><p>{error}</p>{!user&&<button className="btn btn-outline" onClick={onLogin}>Hisob orqali kirish</button>}</div>}
 {visible.length?<div className="comp-event-grid">{visible.map(c=><article key={c.id}><span className="comp-badge">{competitionStatuses[c.status]}</span><h3>{c.title}</h3><p>{c.description||c.ownerName+' tashkil qilgan musobaqa'}</p><div><span><Users size={16}/> {c.teamCount} jamoa × {c.teamSize} a’zo</span><span>{c.stageCount} bosqich</span></div><button className="btn btn-primary" onClick={()=>open(c.id)}>{c.manager?'Boshqarish':c.joined?'Davom etish':'Musobaqani ko‘rish'}</button></article>)}</div>:!loading&&!error&&<div className="comp-empty"><Trophy size={36}/><h3>Bu ro‘yxatda hozircha musobaqa yo‘q</h3><p>{teacher?'Yangi musobaqa yarating yoki boshqa filtrni tanlang.':'Ustoz bergan jamoa kodi bilan yuqoridagi oynadan kiring.'}</p></div>}
 </section><details className="comp-panel comp-rules"><summary>Musobaqa qanday ishlaydi?</summary><ol><li>Ustoz kamida 4 bosqich va jamoalardagi a’zolar sonini belgilaydi.</li><li>Har jamoa o‘z kodini oladi. Har a’zo alohida kiradi.</li><li>Ustoz to‘liq tarkib yoki hozirgi qatnashchilar bilan boshlaydi. Kamida ikki jamoada bittadan o‘quvchi bo‘lishi kerak. Bosqichlar barcha jamoa uchun bir vaqtda ochiladi.</li><li>Har bosqich 100 ballgacha. Jamoa balli boshlash paytida qayd etilgan a’zolar natijasining o‘rtachasiga bosqich koeffitsiyentini ko‘paytirish orqali hisoblanadi.</li><li>Bir xil ballarda to‘g‘ri javoblar, keyin sarflangan vaqt solishtiriladi. To‘liq teng natijalar bir o‘rinni bo‘lishadi.</li></ol></details>
 </>}</main>;
}
