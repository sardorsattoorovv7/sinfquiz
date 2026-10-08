import React,{useEffect,useRef,useState} from 'react';
import {Home,BookOpen,Compass,Gamepad2,Trophy,BarChart3,Search,UserRound,LogOut,Menu,X,ArrowRight,Shield,Keyboard,Brain,Code2,Headphones,GraduationCap,MessageCircle} from 'lucide-react';
import {ExperienceControls} from './effects.jsx';
import StudioArt from './StudioArt.jsx';
import {findStudioRoutes,normalizeStudioSearch} from './studio-navigation.js';

export const studioSections=[
 {id:'home',label:'Bosh sahifa',icon:Home,views:['home']},
 {id:'books',label:'Darsliklar',icon:BookOpen,views:['books','lesson','bookPractice','catalog','englishCourse']},
 {id:'atlasHub',label:'Atlaslar',icon:Compass,views:['atlasHub','mathAtlas','chemistry','biology']},
 {id:'exerciseHub',label:'Mashqlar',icon:Gamepad2,views:['exerciseHub','chat','iq','audioMaze','practice','national','nationalExam','cefr','cefrManaged','cefrExam','typing','typingJoin','race','raceJoin','join','play']},
 {id:'competitions',label:'Musobaqalar',icon:Trophy,views:['competitions']},
 {id:'results',label:'Natijalar',icon:BarChart3,views:['profile','result']},
];
export const studioActivities=[
 {id:'mathAtlas',label:'Matematika atlasi',detail:'Son, formula, grafik va fazoviy shakllar.',subject:'math',type:'atlas'},
 {id:'chemistry',label:'Kimyo laboratoriyasi',detail:'Atomlar, molekulalar va boshqariladigan tajribalar.',subject:'chemistry',type:'atlas'},
 {id:'biology',label:'Biologiya atlasi',detail:'Tirik tabiat, odam tanasi va amaliy kuzatishlar.',subject:'biology',type:'atlas'},
 {id:'iq',label:'IQ va mantiq',detail:'32 savol va yechimlar tahlili.',icon:Brain,type:'exercise'},
 {id:'audioMaze',label:'Inglizcha labirint',detail:'Darajani tanlang. Matn yoki ovoz bilan yo‘l toping.',icon:Headphones,type:'exercise'},
 {id:'englishCourse',label:'Ingliz tili darsi',detail:'108 dars, tinglash, o‘qish va kundalik suhbat.',icon:BookOpen,type:'exercise'},
 {id:'practice',label:'Tayyor testlar',detail:'Python, ingliz tili va matematika.',icon:Code2,type:'exercise'},
 {id:'national',label:'Milliy test',detail:'Ustoz variantlari va javoblar tahlili.',icon:GraduationCap,type:'exercise'},
 {id:'cefrManaged',label:'CEFR / Multilevel',detail:'Listening, Reading, Writing va Speaking.',icon:Headphones,type:'exercise'},
 {id:'catalog',label:'Informatika amaliyoti',detail:'Python muharriri, Word, Excel va PowerPoint.',icon:Keyboard,type:'exercise'},
 {id:'livePractice',label:'Typing va 1v1',detail:'Ustoz ochgan yozish mashqi va ikki kishilik poyga.',icon:Gamepad2,type:'exercise',key:'typing-race'},
 {id:'chat',label:'Ustozlar bilan chat',detail:'Darslar va guruhlar uchun suhbat.',icon:MessageCircle,type:'exercise'},
];
const roleLabel=u=>u?.role==='admin'?'Administrator':u?.role==='teacher'?'O‘qituvchi':u?'O‘quvchi':'Mehmon';

export default function StudioShell({children,user,view,onNavigate,onLogout,inActivity,unfinished,authReady}){
 const [drawer,setDrawer]=useState(false),[query,setQuery]=useState(''),[searchOpen,setSearchOpen]=useState(false);
 const drawerRef=useRef(null),menuRef=useRef(null),mainRef=useRef(null),searchRef=useRef(null),searchInputRef=useRef(null);
 const drawerOpen=drawer&&!inActivity;
 const staff=['teacher','admin'].includes(user?.role);
 const active=studioSections.find(s=>s.views.includes(view))?.id||(view==='admin'?'admin':'home');
 const routes=[...studioSections,...studioActivities,...(staff?[{id:'admin',label:roleLabel(user)+' paneli'}]:[])];
 const matches=findStudioRoutes(routes,query),hasQuery=!!normalizeStudioSearch(query);
 const navigate=id=>{setDrawer(false);setSearchOpen(false);setQuery('');onNavigate(id);};
 const closeSearch=()=>{searchInputRef.current?.focus();setSearchOpen(false);};
 const searchKeys=e=>{
  if(e.key==='Escape'){e.preventDefault();closeSearch();return;}
  if(!hasQuery||!['ArrowDown','ArrowUp'].includes(e.key))return;
  e.preventDefault();const step=e.key==='ArrowDown'?1:-1;
  const focusChoice=()=>{
   const items=[...searchRef.current?.querySelectorAll('.studio-search-results button:not(.studio-search-close)')||[]];
   if(!items.length)return;
   const index=items.indexOf(document.activeElement);
   if(index===0&&step<0){searchInputRef.current?.focus();return;}
   items[index<0?(step>0?0:items.length-1):Math.min(items.length-1,index+step)]?.focus();
  };
  if(searchOpen)focusChoice();else{setSearchOpen(true);window.requestAnimationFrame(focusChoice);}
 };
 useEffect(()=>{
  if(!searchOpen)return;
  const dismiss=e=>{if(!searchRef.current?.contains(e.target))setSearchOpen(false);};
  document.addEventListener('pointerdown',dismiss);
  return()=>document.removeEventListener('pointerdown',dismiss);
 },[searchOpen]);

 useEffect(()=>{setDrawer(false);setSearchOpen(false);},[view,inActivity]);
 useEffect(()=>{
  if(!drawerOpen)return;
  const old=document.activeElement;drawerRef.current?.querySelector('button')?.focus();
  const esc=e=>{if(e.key==='Escape'){e.preventDefault();setDrawer(false);}if(e.key==='Tab'){const items=[...drawerRef.current?.querySelectorAll('button,a,[tabindex="0"]')||[]].filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
  document.addEventListener('keydown',esc);const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.removeEventListener('keydown',esc);document.body.style.overflow=previous;(old?.isConnected?old:menuRef.current)?.focus();};
 },[drawerOpen]);
 const links=(mobile=false)=><nav className="studio-main-nav" aria-label={mobile?'Mobil bo‘limlar':'Asosiy bo‘limlar'}>{studioSections.map(({id,label,icon:Icon})=><button key={id} className={active===id?'is-current':''} aria-current={active===id?'page':undefined} onClick={()=>navigate(id)}><Icon size={20}/><span>{label}</span></button>)}{staff&&<><span className="studio-nav-caption">BOSHQARUV</span><button className={active==='admin'?'is-current':''} onClick={()=>navigate('admin')}><Shield size={20}/><span>{roleLabel(user)} paneli</span></button></>}</nav>;
 return <div className={`app-shell studio-app ${inActivity?'studio-in-activity':''}`}>
 <a className="studio-skip" href="#studio-main">Asosiy mazmunga o‘tish</a>
 {!inActivity&&<aside className="studio-sidebar" inert={drawerOpen?true:undefined}><span className="studio-brand nav-brand" aria-label="SinfQuiz">Sinf<span>Quiz</span></span>{links()}<div className="studio-sidebar-foot"><span className="studio-person-icon"><UserRound size={20}/></span><div><b>{user?.name||'Xush kelibsiz'}</b><small>{roleLabel(user)}</small></div></div></aside>}
 <div className="studio-body"><header className="site-nav studio-topbar" aria-label="Asosiy navigatsiya" inert={drawerOpen?true:undefined}>
 {!inActivity&&<button ref={menuRef} className="studio-menu-toggle" aria-expanded={drawer} aria-controls="studio-drawer" aria-label="Menyuni ochish" onClick={()=>setDrawer(true)}><Menu size={22}/></button>}
 <span className="studio-mobile-brand nav-brand" aria-label="SinfQuiz">Sinf<span>Quiz</span></span>
 {!inActivity&&<div className="studio-search" ref={searchRef} onKeyDown={searchKeys}><form role="search" onSubmit={e=>{e.preventDefault();if(hasQuery&&matches[0])navigate(matches[0].id);}}><Search size={18}/><input ref={searchInputRef} type="search" maxLength={100} aria-label="Bo‘lim qidirish" aria-controls={searchOpen&&hasQuery?'studio-search-results':undefined} placeholder="Bo‘lim yoki mashq qidirish…" value={query} onFocus={()=>setSearchOpen(true)} onChange={e=>{setQuery(e.target.value);setSearchOpen(true);}}/></form>{searchOpen&&hasQuery&&<div id="studio-search-results" className="studio-search-results" role="region" aria-label="Qidiruv natijalari"><p className="studio-search-status" role="status">{matches.length?`${matches.length} ta mos bo‘lim`:'Bo‘lim topilmadi.'}</p>{matches.map(r=><button key={r.id} onClick={()=>navigate(r.id)}>{r.label}<ArrowRight size={16}/></button>)}<button className="studio-search-close" onClick={closeSearch}>Qidiruvni yopish</button></div>}</div>}
 {inActivity&&<span className="session-label">{unfinished?'Mashq davom etmoqda':'Natijalar'}</span>}
 <div className="nav-actions studio-top-actions"><ExperienceControls/>{!inActivity&&authReady&&(user?<><button className="studio-profile" onClick={()=>navigate(staff?'admin':'results')} aria-label={staff?'Boshqaruv paneli':'Profilim'}><UserRound size={18}/><span>{user.name}</span></button><button className="nav-logout" aria-label="Tizimdan chiqish" title="Hisobdan chiqish" onClick={onLogout}><LogOut size={19}/></button></>:<button className="btn btn-primary teacher-entry" onClick={()=>navigate('login')}>Kirish <ArrowRight size={16}/></button>)}</div>
 </header><div ref={mainRef} id="studio-main" className="studio-content" tabIndex={-1} inert={drawerOpen?true:undefined}>{children}</div></div>
 {drawerOpen&&<><div className="studio-drawer-shade" onClick={()=>setDrawer(false)} aria-hidden="true"/><aside id="studio-drawer" ref={drawerRef} className="studio-drawer" role="dialog" aria-modal="true" aria-label="Bo‘limlar menyusi"><div><span className="studio-brand">Sinf<span>Quiz</span></span><button aria-label="Menyuni yopish" onClick={()=>setDrawer(false)}><X size={22}/></button></div>{links(true)}<p>{roleLabel(user)} · {user?.name||'SinfQuiz'}</p></aside></>}
 {!inActivity&&<nav className="studio-bottom-nav" aria-label="Tezkor bo‘limlar" inert={drawerOpen?true:undefined}>{studioSections.filter(s=>['home','books','competitions','results'].includes(s.id)).map(({id,label,icon:Icon})=><button key={id} className={active===id?'is-current':''} aria-current={active===id?'page':undefined} onClick={()=>navigate(id)}><Icon size={20}/><span>{label}</span></button>)}</nav>}
 </div>;
}

export function StudioHub({type,onNavigate}){
 const [q,setQ]=useState('');const isAtlas=type==='atlas';const cards=findStudioRoutes(studioActivities.filter(a=>a.type===type),q);
 return <main className="studio-hub"><header className="studio-page-heading"><small>SINFQUIZ / {isAtlas?'ATLASLAR':'MASHQLAR'}</small><h1>{isAtlas?'Ko‘ring. O‘zgartiring. Tushuning.':'O‘zingiz sinab ko‘ring.'}</h1><p>{isAtlas?'Tushunchani oching, modelni boshqaring va o‘zgarish sababini toping.':'Fikrlash, til va amaliy ko‘nikmalar uchun mashq tanlang.'}</p></header><label className="studio-filter"><Search size={18}/><input type="search" aria-label="Mashq yoki atlas qidirish" placeholder={isAtlas?'Fan yoki atlas qidirish…':'Mashq qidirish…'} value={q} onChange={e=>setQ(e.target.value)}/></label><div className={`studio-hub-grid ${isAtlas?'studio-atlas-grid':''}`}>{cards.map((a,i)=>{const Icon=a.icon||Compass;return <button key={a.key||a.id} className={`studio-hub-card studio-${a.subject||'exercise'}`} onClick={()=>onNavigate(a.id)}>{isAtlas?<StudioArt subject={a.subject}/>:<span className="studio-card-icon"><Icon size={25}/></span>}<small>{isAtlas?'INTERAKTIV ATLAS':String(i+1).padStart(2,'0')+' / MASHQ'}</small><h2>{a.label}</h2><p>{a.detail}</p><span className="studio-card-link">{isAtlas?'Atlasni ochish':'Mashqni ochish'} <ArrowRight size={18}/></span></button>;})}</div>{!cards.length&&<p role="status">Mos bo‘lim topilmadi. Qisqaroq so‘z yozing.</p>}</main>;
}
