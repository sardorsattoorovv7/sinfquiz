import React,{useState} from 'react';
import {ArrowRight,Brain} from 'lucide-react';
import {PaperButton,PaperNotice} from '../paper/PaperUI.jsx';
import {practiceItems} from './practice.js';
import {ItemVisual,ChoiceVisual} from './Item.jsx';
import '../learning-hub.css';
import './exam.css';

const items=[practiceItems[0],practiceItems[1],practiceItems[2]];

export default function IQSample({onLogin,onBack}){
 const [answers,setAnswers]=useState([]);
 const item=items[answers.length];
 const [showExplanation,setShowExplanation]=useState(false);
 const current=showExplanation?items[answers.length-1]:item;
 const choice=answers.at(-1);
 return <main className="learning-page iq-page">
  <PaperButton variant="quiet" onClick={onBack}>Mashqlarga qaytish</PaperButton>
  <header className="learning-card">
   <h1>IQ va mantiq namunasi</h1>
   <p>Uchta savolni yeching va har birining izohini ko‘ring.</p>
  </header>
  {current?<section className="learning-card iq-question" aria-labelledby="iq-sample-question">
   <p>Savol {showExplanation?answers.length:answers.length+1} / {items.length}</p>
   <h2 id="iq-sample-question">{current.prompt}</h2>
   <div className="iq-model"><ItemVisual visual={current.visual}/></div>
   <div className="iq-options" role="group" aria-label="Javob variantlari">
    {current.options.map((value,index)=><button type="button" key={index}
     className={showExplanation&&index===current.answer?'correct':''}
     disabled={showExplanation}
     aria-pressed={showExplanation&&index===choice}
     onClick={()=>{setAnswers([...answers,index]);setShowExplanation(true);}}>
     <span className="iq-option-letter">{String.fromCharCode(65+index)}</span> <ChoiceVisual item={current} value={value}/>
    </button>)}
   </div>
   {showExplanation&&<>
    <PaperNotice kind={choice===current.answer?'success':'info'}>
     <strong>{choice===current.answer?'To‘g‘ri.':'Yechim.'}</strong> {current.explanation}
    </PaperNotice>
    <PaperButton variant="primary" onClick={()=>setShowExplanation(false)}>
     {item?'Keyingi savol':'Natijani ko‘rish'} <ArrowRight size={17}/>
    </PaperButton>
   </>}
  </section>:<section className="learning-card">
   <h2>Namuna yakunlandi</h2>
   <p>{answers.filter((answer,i)=>answer===items[i].answer).length} / {items.length} ta to‘g‘ri javob.</p>
   <div className="learning-actions">
    <PaperButton onClick={()=>{setAnswers([]);setShowExplanation(false);}}>Qayta ishlash</PaperButton>
    <PaperButton variant="primary" onClick={onLogin}><Brain size={17}/> Hisobga kirib 32 savolni ishlash</PaperButton>
   </div>
  </section>}
  {current&&<PaperButton variant="quiet" onClick={onLogin}>Hisob bilan to‘liq sinovga o‘tish <ArrowRight size={16}/></PaperButton>}
 </main>;
}
