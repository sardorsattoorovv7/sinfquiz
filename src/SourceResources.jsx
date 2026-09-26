import React from 'react';
import {examSources,sourceCheckedAt} from '../data/exam-sources.js';
export default function SourceResources({kind}){
 return <section className="source-resources"><h2>Rasmiy manbalar</h2><p>Manba ro‘yxati: {sourceCheckedAt}. Materiallar muallif saytida ochiladi; ular SinfQuiz savollari sifatida qayta nashr qilinmagan.</p><div>{examSources.filter(s=>s.kind===kind).map(s=><article key={s.id}><small>{s.publisher}</small><h3>{s.title}</h3><p>{s.description}</p><a href={s.url} target="_blank" rel="noopener noreferrer">Asl manbani ochish ↗</a></article>)}</div></section>
}
