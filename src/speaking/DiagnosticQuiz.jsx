import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,ClipboardCheck} from 'lucide-react';
import {diagnosticReport} from './learning.js';
import './mentor.css';

export default function DiagnosticQuiz({questions,subjectUz,topicUz,onComplete,onFollowup,busy}){
 const [step,setStep]=useState(0),[choices,setChoices]=useState({}),[report,setReport]=useState(null),submitted=useRef(false),heading=useRef(null);
 useEffect(()=>{if(step>0||report)heading.current?.focus();},[step,report]);
 function advance(e){
  e.preventDefault();if(choices[step]===undefined||submitted.current)return;
  if(step<questions.length-1){setStep(s=>s+1);return;}
  const result=diagnosticReport(questions,choices,{subjectUz,topicUz});if(!result)return;
  submitted.current=true;setReport(result);onComplete?.(result);
 }
 if(report){
  const strengths=report.skills.filter(s=>s.correct===s.total),gaps=report.skills.filter(s=>s.correct<s.total);
  return <section className="sp-assistant-quiz sp-diagnostic" aria-label="Darajani aniqlash natijasi"><span className="sp-pill">{subjectUz} · {topicUz}</span><h3 ref={heading} tabIndex={-1}>Mini-test natijasi: {report.correct} / {report.total}</h3><p className="sp-diagnostic-band">{report.band}</p><p className="sp-note">Bu 5 ta javob asosida aynan shu mavzu uchun dastlabki xulosa.</p>
   <div className="sp-diagnostic-skills">{strengths.length>0&&<div><b>Yaxshi bajardingiz</b><ul>{strengths.map(s=><li key={s.skillUz}>{s.skillUz}: {s.correct}/{s.total}</li>)}</ul></div>}{gaps.length>0&&<div><b>Birga mustahkamlaymiz</b><ul>{gaps.map(s=><li key={s.skillUz}>{s.skillUz}: {s.correct}/{s.total}</li>)}</ul></div>}</div>
   <div className="sp-diagnostic-plan"><b>Keyingi qadam</b><p>{gaps.length?`${gaps[0].skillUz} mavzusini bitta sodda misol bilan ko‘rib chiqamiz. Keyin shu ko‘nikma bo‘yicha yangi mashq qilamiz.`:'Barcha savollar to‘g‘ri. Endi bilimni yangi vaziyatda qo‘llaydigan murakkabroq mashq qilib ko‘ramiz.'}</p><div className="sp-actions"><button type="button" className="sp-btn sp-primary" disabled={busy} onClick={()=>onFollowup?.(gaps.length?'Oxirgi mini-testda xato qilgan ko‘nikmamni sodda misol bilan tushuntiring, so‘ng bitta tekshiruv savoli bering.':'Oxirgi mini-testdagi mavzuni murakkabroq misol bilan davom ettiraylik.')}><BookOpen size={16}/>{gaps.length?'Xatolarimni tushuntiring':'Mavzuni davom ettiraylik'}</button><button type="button" className="sp-btn" disabled={busy} onClick={()=>onFollowup?.('Oxirgi mini-test natijamga mos, oldingi savollar takrorlanmagan 3 ta yangi mashq bering.')}><ArrowRight size={16}/>Natijamga mos mashq</button></div></div>
   <details><summary>Javoblar va izohlarni ko‘rish</summary>{questions.map((q,i)=><article className="sp-diagnostic-review" key={i}><b>{i+1}. {q.question}</b><p>Sizning javobingiz: {q.options[choices[i]]}</p><p>{choices[i]===q.correctIndex?'To‘g‘ri javob.':'To‘g‘ri javob: '+q.options[q.correctIndex]}</p><p>{q.explanationUz}</p></article>)}</details>
  </section>;
 }
 const q=questions[step];
 return <section className="sp-assistant-quiz sp-diagnostic" aria-label="Darajani aniqlash mini-testi"><span className="sp-pill">{subjectUz} · {topicUz}</span><p className="sp-note">5 ta savolni birma-bir bajaring. Javob va izohlar test oxirida ochiladi.</p><div className="sp-diagnostic-progress"><span role="status">Savol {step+1} / {questions.length}</span><progress value={Object.keys(choices).length} max={questions.length} aria-label="Mini-test jarayoni"/></div><form onSubmit={advance}><fieldset key={step}><legend ref={heading} tabIndex={-1}>{step+1}. {q.question}</legend><div className="sp-assistant-options">{q.options.map((option,index)=><button type="button" key={index} className={'sp-btn'+(choices[step]===index?' is-picked':'')} aria-pressed={choices[step]===index} onClick={()=>setChoices(c=>({...c,[step]:index}))}><span>{String.fromCharCode(65+index)}.</span>{option}</button>)}</div></fieldset><div className="sp-actions">{step>0&&<button type="button" className="sp-btn" onClick={()=>setStep(s=>s-1)}><ArrowLeft size={16}/>Oldingi savol</button>}<button type="submit" className="sp-btn sp-primary" disabled={choices[step]===undefined}>{step<questions.length-1?<>Keyingi savol <ArrowRight size={16}/></>:<>Natijani ko‘rish <ClipboardCheck size={16}/></>}</button></div></form></section>;
}
