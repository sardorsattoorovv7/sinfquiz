import React,{useEffect,useRef,useState} from 'react';
import {Home,BookOpen,Compass,Gamepad2,Trophy,BarChart3,Search,UserRound,LogOut,Menu,X,ArrowRight,Shield,Keyboard,Brain,Code2,Headphones,GraduationCap,MessageCircle,Presentation,Piano,Mic,Sparkles} from 'lucide-react';
import {ExperienceControls} from './effects.jsx';
import StudioArt from './StudioArt.jsx';
import {findStudioRoutes,normalizeStudioSearch} from './studio-navigation.js';
import {PaperBrand,PaperButton,PaperDialog,PaperSkeleton} from './paper/PaperUI.jsx';
import ClassJoinForm from './paper/ClassJoinForm.jsx';
import RobotAssistant from './speaking/RobotAssistant.jsx';
import {uiCopy} from './ui-copy.js';
import './paper/notebook-home.css';

const CompactGuide=React.lazy(()=>import('./speaking/AiGuide.jsx'));

export const studioSections=[
 {id:'home',label:'Bosh sahifa',icon:Home,views:['home']},
 {id:'books',label:'Darsliklar',icon:BookOpen,views:['books','lesson','bookPractice','catalog','englishCourse']},
 {id:'atlasHub',label:'Atlaslar',icon:Compass,views:['atlasHub','mathAtlas','chemistry','biology','space','informaticsAtlas','historyAtlas']},
 {id:'exerciseHub',label:'Mashqlar',icon:Gamepad2,views:['exerciseHub','chat','iq','audioMaze','cinemaPiano','practice','national','nationalExam','cefr','cefrManaged','cefrExam','typing','typingJoin','race','raceJoin','join','play']},
 {id:'speaking',label:'AI Speaking',icon:Mic,views:['speaking']},
 {id:'aiGuide',label:'AI yordamchi',icon:Sparkles,views:['aiGuide']},
 {id:'competitions',label:'Musobaqalar',icon:Trophy,views:['competitions']},
 {id:'results',label:'Natijalar',icon:BarChart3,views:['profile','result']},
];
export const studioActivities=[
 {id:'historyAtlas',label:'Tarix atlasi',detail:'12 davrga 3D sayohat, O‘zbekiston va jahon tarixi, xarita, manba va dalil ustaxonasi.',subject:'history',type:'atlas'},
 {id:'informaticsAtlas',label:'Informatika atlasi',detail:'Kompyuter tarixi, 3D muzey, RAM, ROM, HDD, SSD va OS. Qismlarga ajratish va amaliy mashqlar.',subject:'informatics',type:'atlas'},
 {id:'space',label:'Koinot atlasi',detail:'53 hodisa, meteoritlar, orbitalar va yulduzlar. Fizika tajribalari.',subject:'space',type:'atlas'},
 {id:'mathAtlas',label:'Matematika atlasi',detail:'Son, formula, grafik va fazoviy shakllar.',subject:'math',type:'atlas'},
 {id:'chemistry',label:'Kimyo laboratoriyasi',detail:'Atomlar, molekulalar va boshqariladigan tajribalar.',subject:'chemistry',type:'atlas'},
 {id:'biology',label:'Biologiya atlasi',detail:'Tirik tabiat, odam tanasi va amaliy kuzatishlar.',subject:'biology',type:'atlas'},
 {id:'iq',label:'IQ va mantiq',detail:'32 savol va yechimlar tahlili.',icon:Brain,type:'exercise'},
 {id:'audioMaze',label:'Inglizcha labirint',detail:'Darajani tanlang. Matn yoki ovoz bilan yo‘l toping.',icon:Headphones,type:'exercise'},
 {id:'cinemaPiano',label:'Kino Piano',detail:'Pianino, musiqa, soundtrack, MIDI va 30 soniyalik kuylarni o‘rganish.',icon:Piano,type:'exercise'},
 {id:'englishCourse',label:'Ingliz tili darsi',detail:'108 dars, tinglash, o‘qish va kundalik suhbat.',icon:BookOpen,type:'exercise'},
 {id:'practice',label:'Tayyor testlar',detail:'Python, ingliz tili va matematika.',icon:Code2,type:'exercise'},
 {id:'national',label:'Milliy test',detail:'Ustoz variantlari va javoblar tahlili.',icon:GraduationCap,type:'exercise'},
 {id:'cefrManaged',label:'CEFR / Multilevel',detail:'Listening, Reading, Writing va Speaking.',icon:Headphones,type:'exercise'},
 {id:'catalog',label:'Informatika amaliyoti',detail:'Python muharriri, Word, Excel va PowerPoint.',icon:Keyboard,type:'exercise'},
 {id:'livePractice',label:'Typing va 1v1',detail:'Ustoz ochgan yozish mashqi va ikki kishilik poyga.',icon:Gamepad2,type:'exercise',key:'typing-race'},
 {id:'chat',label:'Ustozlar bilan chat',detail:'Darslar va guruhlar uchun suhbat.',icon:MessageCircle,type:'exercise'},
];
const roleLabel=u=>u?.role==='admin'?'Administrator':u?.role==='teacher'?'O‘qituvchi':u?'O‘quvchi':'Mehmon';

export default function StudioShell({children,user,view,onNavigate,onLogout,onJoin,inActivity,unfinished,authReady}){
 const [drawer,setDrawer]=useState(false),[query,setQuery]=useState(''),[joinOpen,setJoinOpen]=useState(false),[helpOpen,setHelpOpen]=useState(false);
 const drawerRef=useRef(null),menuRef=useRef(null);
 const drawerOpen=drawer&&!inActivity,homeView=view==='home',blocked=drawerOpen||joinOpen||helpOpen;
 const staff=['teacher','admin'].includes(user?.role);
 const active=studioSections.find(s=>s.views.includes(view))?.id||(['admin','classroom'].includes(view)?view:'home');
 const routes=[...studioSections,...studioActivities,...(staff?[{id:'admin',label:roleLabel(user)+' paneli'},{id:'classroom',label:'Sinfxona',detail:'Dars doskasi, taymer va dars vositalari'}]:[])];
 const matches=findStudioRoutes(routes,query),hasQuery=!!normalizeStudioSearch(query);
 const navigate=id=>{setDrawer(false);setJoinOpen(false);setHelpOpen(false);setQuery('');onNavigate(id);};
 useEffect(()=>{setDrawer(false);setJoinOpen(false);setHelpOpen(false);},[view,inActivity]);
 useEffect(()=>{
  if(!drawerOpen)return;
  const old=document.activeElement;drawerRef.current?.querySelector('button')?.focus();
  const esc=e=>{if(e.key==='Escape'){e.preventDefault();setDrawer(false);}if(e.key==='Tab'){const items=[...drawerRef.current?.querySelectorAll('button,a,input,[tabindex="0"]')||[]].filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
  document.addEventListener('keydown',esc);const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.removeEventListener('keydown',esc);document.body.style.overflow=previous;(old?.isConnected?old:menuRef.current)?.focus();};
 },[drawerOpen]);
 const links=()=> <nav className="studio-main-nav" aria-label="Barcha bo‘limlar">{studioSections.map(({id,label,icon:Icon})=><button type="button" key={id} className={active===id?'is-current':''} aria-current={active===id?'page':undefined} onClick={()=>navigate(id)}><Icon size={20}/><span>{label}</span></button>)}{staff&&<><span className="studio-nav-caption">BOSHQARUV</span><button type="button" onClick={()=>navigate('createQuiz')}><GraduationCap size={20}/><span>Test yaratish</span></button><button type="button" className={active==='classroom'?'is-current':''} aria-current={active==='classroom'?'page':undefined} onClick={()=>navigate('classroom')}><Presentation size={20}/><span>Sinfxona</span></button><button type="button" className={active==='admin'?'is-current':''} onClick={()=>navigate('admin')}><Shield size={20}/><span>{roleLabel(user)} paneli</span></button></>}</nav>;
 const topLinks=[{id:'subjects',label:'Fanlar',current:homeView||active==='books'},{id:'atlasHub',label:'3D Atlas',current:active==='atlasHub'},{id:'speaking',label:'AI Speaking',current:active==='speaking'},{id:'results',label:'Natijalar',current:active==='results'}];
 const login=()=>{setHelpOpen(false);try{sessionStorage.setItem('sq_ai_return','aiGuide');}catch{}navigate('login');};
 return <div className={'app-shell studio-app paper-workshop '+(homeView?'pw-home-shell ':'')+(inActivity?'studio-in-activity':'')}>
  <a className="studio-skip" href="#studio-main">Asosiy mazmunga o‘tish</a>
  <div className="studio-body"><header className="site-nav studio-topbar" aria-label="Asosiy navigatsiya" inert={blocked?true:undefined}>
   {!inActivity&&<button type="button" ref={menuRef} className="studio-menu-toggle" aria-expanded={drawerOpen} aria-controls="studio-drawer" aria-label="Menyuni ochish" onClick={()=>setDrawer(true)}><Menu size={22}/></button>}
   <button type="button" className="pw-brand-link pw-header-brand" aria-label="Bosh sahifaga qaytish" disabled={inActivity} onClick={()=>navigate('home')}><PaperBrand className="studio-mobile-brand nav-brand"/><span className="sq-brand-note">{uiCopy.brand.tagline}</span></button>
   {!inActivity&&<nav className="pw-top-links" aria-label="Asosiy bo‘limlar">{topLinks.map(link=><button type="button" key={link.id} aria-current={link.current?'page':undefined} onClick={()=>navigate(link.id)}>{link.label}</button>)}</nav>}
   {inActivity&&<span className="session-label">{unfinished?'Mashq davom etmoqda':'Natijalar'}</span>}
   {!inActivity&&<div className="nav-actions studio-top-actions">
    <PaperButton variant="secondary" className="pw-join-trigger" onClick={()=>setJoinOpen(true)}>Kod bilan kirish <ArrowRight size={16}/></PaperButton>
    {!authReady?<span role="status" className="sq-auth-loading">Hisob tekshirilmoqda…</span>:user?<>{staff&&<PaperButton variant="primary" className="sq-create-trigger" onClick={()=>navigate('createQuiz')}>Test yaratish <ArrowRight size={16}/></PaperButton>}<button type="button" className="studio-profile" onClick={()=>navigate(staff?'admin':'results')} aria-label={staff?'Boshqaruv paneli':'Profilim'}><UserRound size={18}/><span className="sq-header-profile-name">{user.name}<small>{roleLabel(user)}</small></span></button><button type="button" className="nav-logout" aria-label="Tizimdan chiqish" title="Hisobdan chiqish" onClick={onLogout}><LogOut size={19}/></button></>:<PaperButton variant="primary" className="teacher-entry" aria-label={uiCopy.auth.submit} onClick={()=>navigate('login')}><UserRound size={18}/><span className="sq-header-login-text">{uiCopy.auth.submit}</span></PaperButton>}
   </div>}
  </header><div id="studio-main" className="studio-content" tabIndex={-1} inert={blocked?true:undefined}>{children}</div></div>
  {drawerOpen&&<><div className="studio-drawer-shade" onClick={()=>setDrawer(false)} aria-hidden="true"/><aside id="studio-drawer" ref={drawerRef} className="studio-drawer" role="dialog" aria-modal="true" aria-label="Bo‘limlar menyusi"><div><PaperBrand className="studio-brand"/><button type="button" aria-label="Menyuni yopish" onClick={()=>setDrawer(false)}><X size={22}/></button></div><form role="search" onSubmit={e=>{e.preventDefault();if(hasQuery&&matches[0])navigate(matches[0].id);}}><label className="sq-menu-search">Bo‘limni topish<input type="search" maxLength={100} placeholder="Fan, atlas yoki mashq…" value={query} onChange={e=>setQuery(e.target.value)}/></label></form>{hasQuery?<div className="sq-menu-results" aria-label="Qidiruv natijalari"><p role="status">{matches.length?matches.length+' ta mos bo‘lim':'Bo‘lim topilmadi.'}</p>{matches.map(r=><button type="button" key={r.key||r.id} onClick={()=>navigate(r.id)}>{r.label}<ArrowRight size={16}/></button>)}</div>:links()}<PaperButton className="pw-drawer-join" variant="primary" onClick={()=>{setDrawer(false);setJoinOpen(true)}}>Kod bilan kirish <ArrowRight size={17}/></PaperButton><div className="sq-drawer-settings"><ExperienceControls/></div><div className="sq-drawer-account"><UserRound size={20}/><span>{user?.name||'SinfQuiz'}<small>{roleLabel(user)}</small></span>{user?<PaperButton variant="quiet" onClick={()=>{setDrawer(false);onLogout()}} aria-label="Hisobdan chiqish"><LogOut size={18}/></PaperButton>:authReady&&<PaperButton variant="quiet" onClick={()=>navigate('login')}>Hisobga kirish</PaperButton>}</div></aside></>}
  {!inActivity&&<nav className="studio-bottom-nav" aria-label="Tezkor bo‘limlar" inert={blocked?true:undefined}>{studioSections.filter(s=>['home','books','atlasHub','exerciseHub','results'].includes(s.id)).map(({id,label,icon:Icon})=><button type="button" key={id} className={active===id?'is-current':''} aria-current={active===id?'page':undefined} onClick={()=>navigate(id)}><Icon size={20}/><span>{id==='home'?'Bosh':id==='books'?'Darslar':label}</span></button>)}</nav>}
  {!inActivity&&!['aiGuide','speaking'].includes(view)&&<button type="button" className="sp-guide-float sp-guide-float--robot" aria-label={uiCopy.help.title} aria-haspopup="dialog" onClick={()=>setHelpOpen(true)}><RobotAssistant size="mini"/><span>{uiCopy.help.title}<small>AI robot</small></span></button>}
  <PaperDialog open={joinOpen&&!inActivity} onClose={()=>setJoinOpen(false)} title={uiCopy.join.title} description="Ustozingiz bergan 6 xonali kodni kiriting. Test kodi shaxsiy hisob paroli emas."><ClassJoinForm compact autoFocus onResolved={async entry=>{setJoinOpen(false);await onJoin(entry)}}/></PaperDialog>
  <PaperDialog open={helpOpen&&!inActivity} onClose={()=>setHelpOpen(false)} title={uiCopy.help.title} className="sq-help-dialog">{helpOpen&&<React.Suspense fallback={<PaperSkeleton label="Yordam ochilmoqda…"/>}><CompactGuide compact user={user} currentView={view} onNavigate={navigate} onLogin={login}/></React.Suspense>}</PaperDialog>
 </div>;
}

export function StudioHub({type,onNavigate}){
 const [q,setQ]=useState('');const isAtlas=type==='atlas';const cards=findStudioRoutes(studioActivities.filter(a=>a.type===type),q);
 return <main className="studio-hub"><header className="studio-page-heading"><small>SINFQUIZ / {isAtlas?'ATLASLAR':'MASHQLAR'}</small><h1>{isAtlas?'Ko‘ring. O‘zgartiring. Tushuning.':'O‘zingiz sinab ko‘ring.'}</h1><p>{isAtlas?'Tushunchani oching, modelni boshqaring va o‘zgarish sababini toping.':'Fikrlash, til va amaliy ko‘nikmalar uchun mashq tanlang.'}</p></header><label className="studio-filter"><Search size={18}/><input type="search" aria-label="Mashq yoki atlas qidirish" placeholder={isAtlas?'Fan yoki atlas qidirish…':'Mashq qidirish…'} value={q} onChange={e=>setQ(e.target.value)}/></label><div className={`studio-hub-grid ${isAtlas?'studio-atlas-grid':''}`}>{cards.map((a,i)=>{const Icon=a.icon||Compass;return <button key={a.key||a.id} className={`studio-hub-card studio-${a.subject||'exercise'}`} onClick={()=>onNavigate(a.id)}>{isAtlas?<StudioArt subject={a.subject}/>:<span className="studio-card-icon"><Icon size={25}/></span>}<small>{isAtlas?'INTERAKTIV ATLAS':String(i+1).padStart(2,'0')+' / MASHQ'}</small><h2>{a.label}</h2><p>{a.detail}</p><span className="studio-card-link">{isAtlas?'Atlasni ochish':'Mashqni ochish'} <ArrowRight size={18}/></span></button>;})}</div>{!cards.length&&<p role="status">Mos bo‘lim topilmadi. Qisqaroq so‘z yozing.</p>}</main>;
}
