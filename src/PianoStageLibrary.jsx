import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Check,Music2,Search,X} from 'lucide-react';
import {matchesPianoSearch} from './piano-repertoire.js';

// Kept in the rotated/fullscreen surface, including orientation-lock fallback.
export default function PianoStageLibrary({songs,practice,imports,selected,onChoose,onClose,triggerRef}){
 const [query,setQuery]=useState(''),[category,setCategory]=useState(()=>practice.some(t=>t.id===selected)?'practice':imports.some(t=>t.id===selected)?'mine':'songs');
 const searchRef=useRef(null),list=category==='practice'?practice:category==='mine'?imports:songs;
 const visible=useMemo(()=>list.filter(t=>matchesPianoSearch(t,query)),[list,query]);
 useEffect(()=>{searchRef.current?.focus({preventScroll:true});return()=>{const trigger=triggerRef.current;if(trigger?.isConnected)trigger.focus({preventScroll:true})}},[triggerRef]);
 return <section id="cp-stage-library" className="cp-stage-library" aria-label="Yonlama kuylar kutubxonasi" data-stage-library>
  <header><div><span className="cp-overline">PIANO / KUYLAR</span><h2>Kuyni tanlang</h2></div><button type="button" className="cp-icon" data-stage-library-close aria-label="Yonlama kuylar ro‘yxatini yopish" onClick={onClose}><X size={21}/></button></header>
  <div className="cp-stage-library-tools"><label className="cp-stage-search"><Search size={18}/><input ref={searchRef} aria-label="Yonlama kuyni qidirish" placeholder="Kuy, ijrochi yoki film…" value={query} onChange={e=>setQuery(e.target.value)}/></label><div role="group" aria-label="Yonlama kuylar bo‘limi">{[['songs','Kuylar'],['practice','Mashqlar'],['mine','Meniki']].map(([id,label])=><button type="button" key={id} aria-pressed={category===id} onClick={()=>{setCategory(id);setQuery('')}}>{label}</button>)}</div></div>
  <p className="cp-stage-library-count" role="status">{visible.length} ta {category==='practice'?'mashq':'kuy'} · tanlagach pianoga qaytasiz</p>
  <ul className="cp-stage-song-list" aria-label="Yonlama kuylar ro‘yxati">{visible.map(track=><li key={track.id}><button type="button" aria-pressed={selected===track.id} onClick={()=>onChoose(track)}><Music2 size={18}/><span><b>{track.title}</b><small>{track.artist||track.description||'Piano mashqi'}</small></span>{selected===track.id&&<Check size={19}/>}</button></li>)}</ul>
  {!visible.length&&<p className="cp-stage-library-empty">{category==='mine'&&!imports.length?'Shaxsiy MIDI hali yo‘q. Oddiy ko‘rinishdagi “Meniki” bo‘limidan yuklang.':'Mos kuy topilmadi. Qidiruvni o‘zgartiring.'}</p>}
 </section>;
}
