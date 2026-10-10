import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,BookOpen,Compass,Flag,Keyboard,LockKeyhole,Trophy} from 'lucide-react';
import {api} from './api.js';
import {islandDestinations,islandLinks} from './island-content.js';
import IslandWorld from './IslandWorld.jsx';

export default function IslandHome({onNavigate,onJoin,onRace,onTyping,user}){
 const [pin,setPin]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [race,setRace]=useState(null),[typing,setTyping]=useState(null);
 const inflight=useRef(false);
 useEffect(()=>{
  let alive=true,timer;
  const load=async()=>{
   if(!document.hidden){
    const results=await Promise.allSettled([api('/api/race/active'),api('/api/typing/active')]);
    if(alive){if(results[0].status==='fulfilled')setRace(results[0].value);if(results[1].status==='fulfilled')setTyping(results[1].value);}
   }
   if(alive)timer=setTimeout(load,18000);
  };
  load();return()=>{alive=false;clearTimeout(timer);};
 },[]);
 const join=async e=>{
  e.preventDefault();if(inflight.current)return;
  if(!/^\d{6}$/.test(pin)){setError('O‘qituvchi bergan 6 xonali kodni kiriting.');return;}
  inflight.current=true;setBusy(true);setError('');
  try{onJoin(await api('/api/resolve',{method:'POST',data:{pin}}));}
  catch(err){setError(err instanceof TypeError?'Server bilan aloqa yo‘q. Qayta urinib ko‘ring.':err.message);}
  finally{inflight.current=false;setBusy(false);}
 };
 const activeRace=race?.active&&race.phase==='lobby'&&race.playerCount<2;
 return <main className="island-landing">
  <section className="island-world" aria-labelledby="island-title">
   <div className="island-intro"><div><span className="campus-eyebrow">SINFQUIZ / BILIM VA TAJRIBA</span><h1 id="island-title">Bilim bog‘iga xush kelibsiz</h1><p>Fan tanlang. Ko‘rib tushuning, o‘zingiz sinab ko‘ring.</p></div><a className="campus-code-link" href="#island-code-title">Test kodi bilan kirish <ArrowRight size={17}/></a></div>
   <IslandWorld onNavigate={onNavigate}/>
   <form className="island-code pin-box" onSubmit={join} aria-labelledby="island-code-title">
    <h2 id="island-code-title">Testga kirish</h2><label htmlFor="game-pin">6 xonali kodni kiriting</label>
    <div className="island-pin-control"><div className="island-pin-slots" aria-hidden="true">{Array.from({length:6},(_,i)=><span key={i}>{pin[i]||''}</span>)}</div><input id="game-pin" aria-label="6 xonali test kodi" aria-describedby="pin-help pin-error" aria-invalid={!!error} autoComplete="off" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={e=>{setPin(e.target.value.replace(/\D/g,'').slice(0,6));setError('');}} disabled={busy}/></div>
    <button className="island-enter" type="submit" disabled={busy||pin.length!==6}>{busy?'Tekshirilmoqda…':'Kirish'}<ArrowRight size={18}/></button>
    <p id="pin-help"><LockKeyhole size={12}/> Kod bilan kirishda hisob ochish shart emas.</p><p id="pin-error" className="form-error" role="alert">{error}</p>
   </form>
  </section>
  <section className="island-beyond" aria-labelledby="island-beyond-title">
   <header><span>O‘RGANISHNI DAVOM ETTIRING</span><h2 id="island-beyond-title">O‘zingizga mos yo‘lni tanlang</h2><p>Darslik, tajriba yoki musobaqa — barchasi bir joyda.</p></header>
   <div className="island-shortcuts"><button onClick={()=>onNavigate('books')}><BookOpen/><span><b>Darsliklar</b><small>Kimyo, ingliz tili, biologiya va informatika.</small></span><ArrowRight/></button><button onClick={()=>onNavigate('atlasHub')}><Compass/><span><b>Atlaslar</b><small>Matematika, kimyo va tirik tabiat.</small></span><ArrowRight/></button><button onClick={()=>onNavigate('competitions')}><Trophy/><span><b>Jamoaviy musobaqalar</b><small>Ustoz biriktirgan bosqichlarda ishtirok eting.</small></span><ArrowRight/></button></div>
   <div className="island-tools">{islandLinks.filter(d=>d.id!=='chat'||user).map(d=><button key={d.id} onClick={()=>onNavigate(d.id)}><span><b>{d.label}</b><small>{d.detail}</small></span><ArrowRight size={18}/></button>)}</div>
   {(activeRace||typing?.active)&&<section className="active-lessons" aria-label="Ustoz ochgan mashqlar"><h2>Hozir ochiq</h2><p>Ustoz faollashtirgan mashqni tanlang.</p><div>{activeRace&&<article><Flag/><h3>{race.title||'1v1 bilim poygasi'}</h3><p>Bitta monitor, ikki ishtirokchi. {race.questionCount} ta savol.</p><button onClick={()=>onRace(race)}>Poygaga kirish</button></article>}{typing?.active&&<article><Keyboard/><h3>Typing va ingliz tili</h3><p>Tinglab yozish va uzun matn bilan ishlash.</p><button onClick={()=>onTyping(typing)}>Mashqni boshlash</button></article>}</div></section>}
   <section className="island-public-links" aria-labelledby="island-public-title"><h2 id="island-public-title">Fanlar bilan tanishing</h2><div>{islandDestinations.map(d=><article key={d.id}><h3><a href={d.path}>{d.title}</a></h3><p>{d.summary}</p><a href={d.path}>Mavzular va kichik mashq <ArrowRight size={14}/></a></article>)}</div></section>
   <footer><span className="island-wordmark">Sinf<span>Quiz</span></span><p>Bilimni ko‘rib, sinab va tushunib o‘rganing.</p><a href="/fanlar/">Fanlar haqida</a></footer>
  </section>
 </main>;
}
