import React,{useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import PythonWorkbench from './PythonWorkbench.jsx';
import OfficeLab from './OfficeLab.jsx';
import {gradeOffice} from './office-lab-model.js';
import {LessonChecks} from './LessonText.jsx';
import './learning-hub.css';
function officeTemplate(book){
 if(book.group==='Microsoft Word')return /reference|letter/.test(book.slug)?'word-reference':'word-report';
 if(book.group==='Microsoft PowerPoint')return 'ppt-presentation';
 if(book.group==='Microsoft Excel')return /average/.test(book.slug)?'excel-average-first':/sum/.test(book.slug)?'excel-sum-first':/formula/.test(book.slug)?'excel-add-subtract':'excel-cells-first';
 return null;
}
export default function BookPractice({book,user,onBack}){
 const template=officeTemplate(book),question=template?{officeTemplate:template,points:100}:null,[value,setValue]=useState(''),[result,setResult]=useState(null);
 return <main className="sq-learning"><header className="learning-top"><button onClick={onBack}><ArrowLeft size={17}/> Darsliklarga qaytish</button><span className="learning-kicker">INFORMATIKA / AMALIYOT</span></header><section className="learning-card"><h1>{book.title}</h1>{book.kind==='python'?<><p>{book.practice}</p><PythonWorkbench ownerId={user.id} taskId={'library:'+book.slug} initialCode={book.code}/></>:template?<><p>Bu mashq brauzerdagi o‘quv muharririda bajariladi. Microsoft Office dasturining barcha imkoniyatlarini takrorlamaydi.</p><OfficeLab question={question} onChange={setValue}/><button className="learning-primary" onClick={()=>setResult(gradeOffice(question,value))}>Ishimni tekshirish</button>{result&&<div role="status"><p>{Math.round(result.ratio*100)}/100 mashq balli</p>{result.checks?.map((c,i)=><p key={i}>{c.passed?'Bajarilgan':'Qayta tekshiring'}: {c.label}</p>)}</div>}</>:<><h2>Qurilmada bajariladigan mashq</h2><p>{book.guide?.setup}</p><ol>{book.guide?.steps.map((s,i)=><li key={i}>{s}</li>)}</ol><p>{book.guide?.result}</p><LessonChecks checks={book.guide?.checks}/></>}</section></main>
}
