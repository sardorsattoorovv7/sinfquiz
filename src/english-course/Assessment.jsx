import React, {useEffect, useState} from 'react';
import {course} from './service.js';
import {useDraft, DraftNotice} from './useDraft.jsx';
import {Audio, Recorder} from './Audio.jsx';
import Exercise from './Exercise.jsx';
import Writing from './Writing.jsx';
import {levels} from './catalog.js';

export default function Assessment({initial, uid, onBack, onUpdated, onActive, onStartLesson}) {
 const [check, setCheck] = useState(initial), [answer, setAnswer] = useState(''), [heard, setHeard] = useState(false);
 const [busy, setBusy] = useState(false), [voiceBusy, setVoiceBusy] = useState(false), [error, setError] = useState('');
 const editable = ['objective_complete', 'needs_revision'].includes(check.status);
 const draft = useDraft({key: `sq_en_checkdraft:${uid}:${initial.id}`, work: check, defaults: {writing: '', speaking: {}},
  send: body => course('checkSave', body), onSaved: setCheck,
  fetchRemote: async () => (await course('home')).checks.find(c => c.id === check.id)});
 const {writing, speaking} = draft.draft, sync = draft.sync, flush = draft.flush;
 const setWriting = writing => draft.update({writing}), setSpeaking = speaking => draft.update({speaking});
 const saveRecording = async speaking => { draft.update({speaking}); await flush() };
 useEffect(() => { onActive(true); return () => onActive(false) }, []);
 const act = async fn => {
  setBusy(true); setError('');
  try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false) }
 };
 const leave = (start = false) => act(async () => {
  await flush(); onActive(false); onUpdated();
  if (start) await onStartLesson(); else onBack();
 });
 const next = skip => act(async () => {
  const c = await course('checkAnswer', {id: check.id, cursor: check.state.cursor, answer, heard, skip});
  setCheck(c); setAnswer(''); setHeard(false);
  if (c.status !== 'started') onUpdated();
 });
 const task = check.writingTask;
 return <section className="en-assessment">
  <header className="en-actions">
   <button type="button" disabled={busy || voiceBusy} onClick={() => leave()}>Saqlab, keyin davom etish</button>
   <span className="en-badge">{check.kind === 'placement' ? 'Daraja tavsiyasi' : 'Daraja yakuniy tekshiruvi'} · {check.variant ? 'B' : 'A'} variant</span>
  </header>
  <h1>{check.kind === 'placement' ? 'Darajangizni aniqlang' : levels[check.level] + ' — amaliy tekshiruv'}</h1>
  <p>Osondan murakkabga o‘tamiz. Bilmasangiz o‘tkazib yuboring. Test davomida yechim ko‘rsatilmaydi.</p>
  {error && <p className="en-error" role="alert">{error}</p>}<DraftNotice draft={draft}/>
  {check.status === 'started' ? <>
   <p>Ko‘nikma: {check.question.skill} · {check.state.cursor + 1} / ko‘pi bilan {check.total}. Natijaga qarab ertaroq tugashi mumkin.</p>
   <progress value={check.state.cursor} max={check.total} aria-label="Daraja testi jarayoni"/>
   {check.question.audio && <Audio key={'audio-' + check.question.id} src={check.question.audio} onHeard={() => setHeard(true)} label="Test audiosi"/>}
   <Exercise key={check.question.id} q={{...check.question, audio: undefined}} exam onValue={setAnswer}/>
   <div className="en-actions">
    <button type="button" className="en-primary" disabled={busy || check.question.skill === 'listening' && !heard} onClick={() => next(false)}>Javobni yuborish</button>
    <button type="button" disabled={busy || voiceBusy} onClick={() => next(true)}>Bilmayman · o‘tkazib yuborish</button>
   </div>
  </> : <>
   <div className="en-placement-result">
    <h2>{check.kind === 'placement' ? 'Tavsiya: ' + levels[check.result.recommended] : 'Test qismi yakunlandi'}</h2>
    <p>{check.result.note}</p>
    <div className="en-skill-grid">{Object.entries(check.result.skills).map(([skill, v]) => <article key={skill}><b>{skill}</b><span>{v.total ? v.score + '%' : 'Dalil olinmadi'}</span><small>{v.correct} / {v.total}</small></article>)}</div>
    <p>Past natija olingan ko‘nikmalarni xaritadagi shu yo‘nalish darslari bilan mustahkamlang. Yuqori daraja tavsiyasi writing va speaking tekshirilmaguncha taxminiy.</p>
    {check.result.feedback && <details><summary>Test xatolarini tahlil qilish</summary>{check.result.feedback.map((f, i) => <p key={i}>{f.correct ? 'To‘g‘ri' : 'Qayta mashq'} · {f.prompt} · <span lang="en">{f.expected.join(' / ')}</span> · {f.explanation}</p>)}</details>}
    {check.kind === 'placement' && <p>Writing va speaking bahosi kutilayotganda ko‘pi bilan A2 ochiladi. Quyi darajalar “Test orqali o‘tilgan” deb belgilanadi.</p>}
    {check.kind === 'placement' && onStartLesson && <button type="button" className="en-primary" disabled={busy || voiceBusy} onClick={() => leave(true)}>Birinchi darsimni boshlash</button>}
   </div>
   {task && <>
    {editable && <p className="en-sync" role="status">{sync}</p>}
    <Writing task={task} value={writing} onChange={setWriting} readonly={!editable || busy}/>
    <h2>Speaking namunasi</h2><p>{check.speakingTask.task}</p>
    <Recorder uid={uid} id={check.id} value={speaking} onChange={setSpeaking} onUploaded={saveRecording} onBusyChange={setVoiceBusy} readonly={!editable} disabled={busy}/>
    {editable && <button type="button" disabled={busy || voiceBusy} className="en-primary" onClick={() => act(async () => { await flush(); const c = await course('checkSubmit', {id: check.id, writing, speaking, expectedDraftVersion: draft.store.version}); setCheck(c); onUpdated() })}>Amaliy namunalarni ustozga topshirish</button>}
   </>}
   {check.status === 'submitted' && <p className="en-success">Namunalar topshirildi. Ustozning rubrika bahosi kutilmoqda.</p>}
   {check.result.review && <div className="en-feedback"><b>{check.status === 'mastered' ? 'Tekshiruv o‘zlashtirildi' : 'Qayta ishlash kerak'}</b><p>{check.result.review.text}</p><p>Writing {check.result.review.writing}% · Speaking {check.result.review.speaking}%</p></div>}
   <button type="button" className="en-primary" disabled={busy || voiceBusy} onClick={() => leave()}>O‘quv xaritasiga qaytish</button>
  </>}
 </section>;
}
