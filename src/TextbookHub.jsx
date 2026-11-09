import React, {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, ArrowRight, Atom, BookOpen, Check, Code2, Languages, Leaf, Search} from 'lucide-react';
import {api} from './api.js';
import {books} from './iq/service.js';
import {subjects, availableBooks, filterBooks} from './textbooks/model.js';
import BookReader from './textbooks/Reader.jsx';
import './learning-hub.css';
import './textbooks/library.css';

const icons = {chemistry: Atom, english: Languages, biology: Leaf, informatics: Code2, other: BookOpen};

export default function TextbookHub({user, onBack, onEnglish, onDocument, onActivity, onCatalog, onManage}) {
 const [documents, setDocuments] = useState([]);
 const [subject, setSubject] = useState('all');
 const [query, setQuery] = useState('');
 const [group, setGroup] = useState('all');
 const [progress, setProgress] = useState({});
 const [selected, setSelected] = useState(null);
 const [expanded, setExpanded] = useState({});
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(true);

 async function reload() {
  setLoading(true);
  setError('');
  const staff = ['teacher', 'admin'].includes(user.role);
  const results = await Promise.allSettled([
   Promise.all([api('/api/catalog'), staff ? api('/api/lessons') : {lessons: []}]),
   books('home'),
  ]);
  const [library, reads] = results;
  if (library.status === 'fulfilled') {
   const [catalog, own] = library.value;
   const merged = new Map([...(catalog.lessons || []), ...(own.lessons || [])].map(lesson => [lesson.id, lesson]));
   setDocuments([...merged.values()]);
  }
  if (reads.status === 'fulfilled') setProgress(reads.value);
  setError(results.filter(result => result.status === 'rejected').map(result => result.reason.message).join(' '));
  setLoading(false);
 }

 useEffect(() => {reload();}, [user.id]);

 const all = useMemo(() => availableBooks(documents, user), [documents, user.id, user.role]);
 const filtered = useMemo(() => filterBooks(all, {subject, query, group}), [all, subject, query, group]);
 const groups = [...new Set(all.filter(book => subject === 'all' || book.subject === subject).map(book => book.group))];
 const book = all.find(item => item.id === selected);
 const ordered = book ? filterBooks(all, {subject: book.subject, group: book.group}) : [];
 const next = book && ordered[ordered.findIndex(item => item.id === book.id) + 1];
 const sections = [...subjects, ...(filtered.some(item => item.subject === 'other') ? [
  {id: 'other', title: 'Ustozlarning boshqa fanlari', subtitle: 'Ustoz e’lon qilgan darslar'},
 ] : [])];

 function chooseSubject(id) {
  setSubject(id);
  setGroup('all');
  setSelected(null);
  setExpanded({});
 }

 function open(item) {
  if (item.document) return onDocument(item.document, item.id);
  if (item.kind === 'english') return onEnglish(item.courseId);
  setSelected(item.id);
  window.scrollTo({top: 0, behavior: 'instant'});
 }

 return <main className="sq-learning textbook-hub">
  <header className="learning-top">
   <button type="button" onClick={onBack}><ArrowLeft size={18}/> Bosh sahifa</button>
   <span className="learning-kicker">SINFQUIZ / O‘QUV KUTUBXONASI</span>
   <button type="button" onClick={onCatalog}>Testlar va kabinet <ArrowRight size={17}/></button>
  </header>
  {book ? <BookReader key={book.id} book={book} onBack={() => {
   setSelected(null);
   window.scrollTo({top: 0, behavior: 'instant'});
  }} onOpen={open}
   onActivity={onActivity} onProgress={setProgress} progress={progress} next={next}/> : <>
   <section className="library-heading">
    <div>
     <h1>Darsliklar</h1>
     <p>Fan va bo‘limni tanlab, dars matni, misollar va amaliy topshiriqlarni oching.</p>
    </div>
    <div className="learning-search">
     <Search size={19}/>
     <label className="sr-only" htmlFor="book-search">Dars yoki mavzu qidirish</label>
     <input id="book-search" type="search" placeholder="Masalan, Present Simple" value={query} onChange={event => setQuery(event.target.value)}/>
    </div>
   </section>
   <div className="library-layout">
    <aside className="learning-card library-index">
     <h2>Fanlar</h2>
     <button type="button" className="library-all" aria-pressed={subject === 'all'} onClick={() => chooseSubject('all')}>Barcha fanlar</button>
     <nav className="book-subjects" aria-label="Darslik fanlari">
      {subjects.map(item => {
       const Icon = icons[item.id];
       const count = all.filter(candidate => candidate.subject === item.id).length;
       return <button type="button" key={item.id} className={`book-subject ${subject === item.id ? 'selected' : ''}`}
        aria-pressed={subject === item.id} onClick={() => chooseSubject(subject === item.id ? 'all' : item.id)}>
        <Icon size={18}/><span><b>{item.title}</b><small>{count} dars</small></span>
       </button>;
      })}
     </nav>
     <label className="library-group">Bo‘lim
      <select value={group} onChange={event => setGroup(event.target.value)}>
       <option value="all">Barcha bo‘limlar</option>
       {groups.map(item => <option key={item}>{item}</option>)}
      </select>
     </label>
     {onManage && <button type="button" onClick={onManage}>Darsliklarimni boshqarish</button>}
    </aside>
    <div className="library-results">
     <p className="library-result-count" role="status">{filtered.length} dars topildi</p>
     {error && <div className="learning-message" role="status">
      <p>{error} Asosiy darsliklarni o‘qishingiz mumkin.</p>
      <button type="button" disabled={loading} onClick={reload}>Qayta ulanish</button>
     </div>}
     {loading && <p role="status">Ustoz darslari va o‘qish tarixi olinmoqda…</p>}
     <div className="books-sections">
      {sections.map(section => {
       const items = filtered.filter(item => item.subject === section.id);
       if (!items.length) return null;
       const Icon = icons[section.id];
       const preview = subject === 'all' && !query && group === 'all' && items.length > 6;
       const visible = preview && !expanded[section.id] ? items.slice(0, 6) : items;
       return <section className="learning-card book-section" key={section.id} aria-labelledby={`book-section-${section.id}`}>
        <header>
         <Icon size={22}/>
         <div><h2 id={`book-section-${section.id}`}>{section.title}</h2><p>{section.subtitle}</p></div>
         <span>{items.length} dars</span>
        </header>
        <ol>{visible.map(item => <li key={item.id}>
         <button type="button" onClick={() => open(item)}>
          <span className="book-number">{String(item.ordinal).padStart(2, '0')}</span>
          <span className="book-list-text">
           <small>{item.group} · {item.minutes ? `${item.minutes} daqiqa · ` : ''}{item.source}</small>
           <b>{item.title}</b>
           <span>{item.summary}</span>
          </span>
          {progress[item.id]?.read && <Check size={18} aria-label="O‘qilgan"/>}
          <ArrowRight size={16} aria-hidden="true"/>
         </button>
        </li>)}</ol>
        {preview && <button type="button" className="book-expand" aria-expanded={!!expanded[section.id]}
         onClick={() => setExpanded(current => ({...current, [section.id]: !current[section.id]}))}>
         {expanded[section.id] ? 'Ro‘yxatni qisqartirish' : `${section.title} bo‘yicha barcha ${items.length} dars`} <ArrowRight size={17}/>
        </button>}
       </section>;
      })}
     </div>
     {!filtered.length && <section className="learning-card">
      <h2>Mavzu topilmadi</h2><p>Qisqaroq so‘z yozing yoki boshqa bo‘limni tanlang.</p>
      <button type="button" onClick={() => {setQuery(''); chooseSubject('all');}}>Barcha darsliklarni ko‘rish</button>
     </section>}
    </div>
   </div>
  </>}
 </main>;
}
