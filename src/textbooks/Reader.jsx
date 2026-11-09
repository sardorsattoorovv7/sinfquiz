import React, {useEffect, useRef, useState} from 'react';
import {NotebookPanel} from '../paper/PaperUI.jsx';
import {ScienceLesson} from '../ScienceStudio.jsx';
import {ArrowLeft, ArrowRight, Check, FlaskConical} from 'lucide-react';
import {books} from '../iq/service.js';
import {bookById} from './model.js';
import {LessonSections, LessonChecks} from '../LessonText.jsx';

function Diagram({labels,title}){return <figure className="book-diagram" tabIndex="0" aria-label="O‘quv sxemasi; kichik ekranda yon tomonga aylantirish mumkin"><svg viewBox="0 0 660 132" role="img" aria-label={`${title}. Sxema: ${labels.join(' → ')}`}><defs><marker id="book-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0L6 3 0 6" fill="currentColor"/></marker></defs>{labels.map((l,i)=><g key={l}><rect x={10+i*222} y="22" width="192" height="86" rx="15" className="book-diagram-box"/><text x={106+i*222} y="57" textAnchor="middle" fill="currentColor" fontSize="12">{i+1 < 10?'0':''}{i+1}</text><text x={106+i*222} y="83" textAnchor="middle" fill="currentColor" fontSize="13">{l}</text>{i<2&&<path d={`M${205+i*222} 65h20`} fill="none" stroke="currentColor" strokeWidth="2" markerEnd="url(#book-arrow)"/>}</g>)}</svg><figcaption>O‘quv sxemasi. Tuzilmalar va bosqichlar o‘rtasidagi aloqani ko‘rsatadi; haqiqiy o‘lcham yoki barcha oraliq jarayonlar emas.</figcaption></figure>}

export default function BookReader({book, onBack, onOpen, onActivity, onProgress, progress, next}) {
 const [saving, setSaving] = useState(false);
 const [notice, setNotice] = useState('');
 const title = useRef(null);
 const read = !!progress[book.id]?.read;
 const guide = book.guide;
 const image = typeof guide?.image === 'string' && /^\/course-visuals\/[a-z0-9-]+\.svg$/.test(guide.image) ? guide.image : null;
 const science = book.kind === 'science';
 const chapters = science ? [
  ['concept', 'Asosiy tushuncha'],
  ['example', 'Sabab va misol'],
  ['context', 'Hayotdagi bog‘lanish'],
  ['practice', 'Amaliy topshiriq'],
 ] : [
  ['concept', 'Dars matni'],
  ...(guide ? [['example', 'Birga bajaramiz'], ['practice', 'O‘zingizni tekshiring']] : []),
 ];

 useEffect(() => {title.current?.focus({preventScroll: true});}, [book.id]);

 function openChapter(id) {
  const chapter = document.getElementById('book-chapter-' + id);
  chapter?.scrollIntoView({block: 'start'});
  chapter?.querySelector('h2')?.focus({preventScroll: true});
 }

 async function markRead() {
  if (read || saving) return;
  setSaving(true);
  setNotice('');
  try { onProgress(await books('mark', {id: book.id})); }
  catch (error) { setNotice(error.message); }
  finally { setSaving(false); }
 }

 return <article className="learning-book library-reader">
  <header className="library-reader-head">
   <button type="button" onClick={onBack}><ArrowLeft size={18}/> Darsliklarga qaytish</button>
   <div className="learning-kicker">{book.group} · {book.ordinal}-DARS</div>
   <h1 ref={title} tabIndex={-1}>{book.title}</h1>
   <p className="book-lead">{book.summary}</p>
   <dl className="book-metadata">
    <div><dt>O‘qish vaqti</dt><dd>{book.minutes} daqiqa</dd></div>
    {book.grade && <div><dt>Tayanch</dt><dd>{book.grade}-sinf</dd></div>}
    <div><dt>Holat</dt><dd>{read ? 'O‘qilgan' : 'O‘qish davom etmoqda'}</dd></div>
   </dl>
  </header>
  <div className="book-reader-grid">
   <aside className="learning-card book-roadmap">
    <h2>Mundarija</h2>
    <nav aria-label="Dars mundarijasi">
     {chapters.map(([id, name], index) => <button key={id} type="button" onClick={() => openChapter(id)}>
      <span>{String(index + 1).padStart(2, '0')}</span>{name}
     </button>)}
    </nav>
    {book.prerequisites?.some(id => bookById[id]) && <section>
     <h3>Tayanch darslar</h3>
     {book.prerequisites.map(id => bookById[id] && <button key={id} type="button" onClick={() => onOpen(bookById[id])}>{bookById[id].title}</button>)}
    </section>}
   </aside>
   <NotebookPanel as="div" className="learning-card book-content">
    {science ? <>
     <section className="book-chapter" id="book-chapter-concept">
      <h2 tabIndex={-1}>Asosiy tushuncha</h2>
      <p>{book.definition}</p>
      <Diagram labels={book.diagram} title={book.title}/>
     </section>
     <section className="book-chapter" id="book-chapter-example">
      <h2 tabIndex={-1}>Sabab va misol</h2>
      <p>{book.reason}</p>
      <div className="book-worked-example"><h3>Misol</h3><p>{book.example}</p></div>
     </section>
     <section className="book-chapter" id="book-chapter-context">
      <h2 tabIndex={-1}>Hayotdagi bog‘lanish</h2>
      <p>{book.life}</p>
      <aside className="book-misconception"><h3>Ko‘p uchraydigan chalkashlik</h3><p>{book.misconception}</p></aside>
     </section>
     <section className="book-chapter" id="book-chapter-practice">
      <h2 tabIndex={-1}>Amaliy topshiriq</h2>
      <p>{book.activity}</p>
      <ScienceLesson key={book.id} subject={book.subject} reviewOnly topic={{...book, id: book.topicId, scene: book.topicId}}/>
     </section>
    </> : <>
     <section className="book-chapter" id="book-chapter-concept">
      <h2 tabIndex={-1}>Dars matni</h2>
      {image && <figure>
       <img src={image} alt={`${guide.visualTitle}. ${guide.visualCaption}`} loading="lazy" decoding="async"/>
       <figcaption>{guide.visualCaption}</figcaption>
      </figure>}
      <LessonSections content={book.content}/>
     </section>
     {guide && <>
      <section className="book-chapter" id="book-chapter-example">
       <h2 tabIndex={-1}>Birga bajaramiz</h2>
       <p>{guide.setup}</p><ol>{guide.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
       <div className="book-worked-example"><h3>Kutilgan natija</h3><p>{guide.result}</p></div>
      </section>
      <section className="book-chapter" id="book-chapter-practice">
       <h2 tabIndex={-1}>Mustaqil tekshiruv</h2>
       <h3>Ko‘p uchraydigan xatolar</h3>
       <ul>{guide.mistakes.map((mistake, index) => <li key={index}>{mistake}</li>)}</ul>
       <LessonChecks checks={guide.checks}/>
      </section>
     </>}
    </>}
    <footer className="book-reader-footer">
     <p className="learning-help">{book.source}</p>
     <div className="learning-actions">
      <button type="button" onClick={markRead} disabled={read || saving}><Check size={17}/>{read ? 'O‘qilgan' : saving ? 'Saqlanmoqda…' : 'O‘qishni yakunlash'}</button>
      <button type="button" className="learning-primary" onClick={() => onActivity(book)}>
       <FlaskConical size={17}/>{book.subject === 'informatics' ? 'Amaliyot oynasini ochish' : 'Atlasda sinab ko‘rish'}
      </button>
      {next && <button type="button" onClick={() => onOpen(next)}>Keyingi dars <ArrowRight size={17}/></button>}
     </div>
     {notice && <p className="learning-message" role="alert">{notice}</p>}
    </footer>
   </NotebookPanel>
  </div>
 </article>;
}
