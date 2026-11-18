import React from 'react';
import {ArrowRight,Quote} from 'lucide-react';

const samples={
 ielts:{
  question:'What do you enjoy doing after school or work?',
  answer:'I enjoy to read after school because it help me relax.',
  corrections:[
   ['I enjoy to read','I enjoy reading','Enjoy fe’lidan keyin -ing shaklini ishlating.'],
   ['it help me relax','it helps me relax','It bilan hozirgi zamonda helps shakli kerak.'],
  ],
  exercise:'I enjoy reading because it helps me relax. Endi shu qolipda o‘zingiz haqingizda bir gap ayting.',
 },
 multilevel:{
  question:'Do you prefer studying at home or in a library? Why?',
  answer:'I prefer study at home because there is less distractions.',
  corrections:[
   ['I prefer study','I prefer studying','Prefer fe’lidan keyin studying yoki to study ishlatish mumkin.'],
   ['there is less distractions','there are fewer distractions','Distractions ko‘plikda. There are va fewer ishlatiladi.'],
  ],
  exercise:'I prefer studying at home because there are fewer distractions. Endi sababni bitta misol bilan kengaytiring.',
 },
};

export default function SpeakingSample({exam='ielts',onStart}){
 const sample=samples[exam]||samples.ielts;
 return <details className="sp-card sp-sample">
  <summary><Quote size={18} aria-hidden="true"/> Hisobsiz Speaking namunasini ko‘rish</summary>
  <div className="sp-sample-content">
   <div>
    <h3>{exam==='multilevel'?'Multilevel':'IELTS'} savoli</h3>
    <p lang="en" className="sp-sample-question">{sample.question}</p>
    <p>30–45 soniya ichida sabab va bitta misol aytib ko‘ring.</p>
    <h3>Namunaviy javob</h3>
    <blockquote lang="en">{sample.answer}</blockquote>
   </div>
   <div>
    <h3>Namunaviy tahlil</h3>
    <ul>{sample.corrections.map(([original,correction,note])=><li key={original}>
     <p lang="en"><s>{original}</s><ArrowRight size={16} aria-hidden="true"/><strong>{correction}</strong></p>
     <span>{note}</span>
    </li>)}</ul>
    <p><strong>Keyingi mashq</strong> {sample.exercise}</p>
    {onStart&&<button className="sp-btn sp-primary" onClick={onStart}>O‘z javobim bilan sinash <ArrowRight size={16}/></button>}
   </div>
  </div>
 </details>;
}
