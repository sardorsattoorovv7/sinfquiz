import React from 'react';
import {Check,Clock3,Play} from 'lucide-react';
import {competitionKinds} from './competition-model.js';
export default function CompetitionStagePicker({stages,current,onChoose,busy,now}){
 const done=stages.filter(s=>s.finished).length;
 return <section className="comp-panel comp-stage-picker"><h2>Bosqichni o‘zingiz tanlang <span className="comp-badge">{done} / {stages.length} tugadi</span></h2><p>Istalganidan boshlang. Bosqichni birinchi ochishingiz bilan uning vaqti boshlanadi. Boshqasiga o‘tsangiz, avvalgi taymer davom etadi.</p>
 <div className="comp-choice-grid">{stages.map(s=>{
  const left=s.deadline?Math.max(0,Math.ceil((new Date(s.deadline).getTime()-now)/1000)):s.duration;
  return <button type="button" key={s.id} className={'comp-stage-choice '+(current?.id===s.id?'is-selected ':'')+(s.finished?'is-finished':'')} disabled={busy} aria-current={current?.id===s.id?'step':undefined} onClick={()=>onChoose(s.id)}>
   <span className="comp-stage-choice-number">{s.position}</span><span><b>{s.title}</b><small>{competitionKinds[s.kind]}</small><small>{s.finished?<><Check size={14}/> {Number(s.score||0).toLocaleString('uz-UZ',{maximumFractionDigits:2})} / 100 ball</>:<><Clock3 size={14}/> {Math.floor(left/60)}:{String(left%60).padStart(2,'0')} · {s.startedAt?'Davom etmoqda':'Hali boshlanmadi'}</>}</small></span><span>{s.finished?'Natijani ko‘rish':s.startedAt?'Davom etish':<><Play size={15}/> Boshlash</>}</span>
  </button>;
 })}</div></section>;
}
