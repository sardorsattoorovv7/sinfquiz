import React,{useState} from 'react';
import {safeSourceUrl} from './national-review.js';
export default function NationalReview({review}){
 const [filter,setFilter]=useState('wrong');
 const wrong=review.filter(q=>!q.correct),list=filter==='all'?review:wrong;
 return <section className="answer-review" aria-label="Xatolar tahlili"><header><div><h2>Xatolar tahlili</h2><p>{wrong.length} ta xato yoki javobsiz savol</p></div><div className="review-filters"><button aria-pressed={filter==='wrong'} onClick={()=>setFilter('wrong')}>Xatolar</button><button aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>Barcha javoblar</button></div></header>{!review.length?<p>Bu eski sessiyada tahlil saqlanmagan.</p>:!list.length?<p>Barcha javoblar to‘g‘ri. Barakalla!</p>:list.map(q=><article key={q.id} className={q.correct?'is-correct':'is-wrong'}><small>{q.number}-savol · {q.topic} · {q.correct?'To‘g‘ri':q.selected===null?'Javobsiz':'Xato'}</small><h3>{q.text}</h3><dl><dt>Sizning javobingiz</dt><dd>{q.selectedText}</dd><dt>To‘g‘ri javob</dt><dd>{q.correctText}</dd></dl><p>{q.explanation}</p>{safeSourceUrl(q.sourceUrl)&&<a href={safeSourceUrl(q.sourceUrl)} target="_blank" rel="noopener noreferrer">Savol manbasi{q.sourceReference?` · ${q.sourceReference}`:''} ↗</a>}</article>)}</section>
}
