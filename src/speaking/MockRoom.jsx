import React, {useEffect, useRef, useState} from 'react';
import {ArrowRight, CheckCircle2, ChevronLeft, FileText, Headphones} from 'lucide-react';
import {speakingApi, timeLabel, uploadSpeaking} from './client.js';
import {removeDraft} from './drafts.js';
import Recorder from './Recorder.jsx';
import {JobPanel, Notice, Question} from './Common.jsx';
import './mock-room.css';

const parts = {
 ielts: [['1', 'Suhbat'], ['2', 'Mavzu kartasi'], ['3', 'Muhokama']],
 multilevel: [['1.1', 'Suhbat'], ['1.2', 'Rasmlar'], ['2', 'Mavzu'], ['3', 'Munozara']],
};

export default function MockRoom({initial, user, exam, onActive, onExit, onRestart, onReport}) {
 const [data, setData] = useState(initial);
 const [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 const [recorderBusy, setRecorderBusy] = useState(false);
 const [expired, setExpired] = useState(false);
 const [voice, setVoice] = useState(true);
 const [job, setJob] = useState(null);
 const turn = useRef(initial.turn);
 const offset = useRef(Date.parse(initial.serverNow) - Date.now());
 const operation = useRef(false);
 const roomTitle = useRef(null);
 const questionPane = useRef(null);
 const {session, answers} = data;
 const question = session.current;
 const draftKey = `${user.id}:mock:${session.id}:${question?.id}`;
 const examName = exam === 'ielts' ? 'IELTS Speaking' : 'Multilevel Speaking';
 const sectionName = parts[exam]?.find(([part]) => part === question?.part)?.[1];
 const locked = busy || recorderBusy;

 useEffect(() => {
  onActive?.(true);
  document.scrollingElement?.scrollTo?.({top: 0, behavior: 'instant'});
  roomTitle.current?.focus({preventScroll: true});
  return () => onActive?.(false);
 }, [onActive]);
 useEffect(() => {
  if (question?.prompt && session.examRoom) questionPane.current?.scrollIntoView?.({block: 'nearest'});
 }, [question?.prompt, session.examRoom]);

 function adopt(next) {
  turn.current = next.turn;
  offset.current = Date.parse(next.serverNow) - Date.now();
  setData(next);
  setExpired(false);
 }

 async function perform(action) {
  if (operation.current || recorderBusy) return;
  operation.current = true;
  setBusy(true);
  setError('');
  try { await action(); }
  catch (cause) { setError(cause.message); }
  finally { operation.current = false; setBusy(false); }
 }

 async function begin() {
  const response = await speakingApi('begin_turn', {sessionId: session.id, questionId: question.id});
  turn.current = response.turn;
  offset.current = Date.parse(response.serverNow) - Date.now();
  const visibleQuestion = response.question || question;
  setData(previous => ({...previous, turn: response.turn, session: {...previous.session, current: visibleQuestion}}));
  return {...response.turn.payload, prompt: visibleQuestion.prompt, serverOffset: offset.current};
 }

 async function stop(draft) {
  const current = turn.current;
  if (!current) throw Error('Savol holatini yangilang va saqlangan audioni qayta yuboring.');
  if (current.payload.stoppedAt && current.payload.sha256 === draft.sha256) return;
  const response = await speakingApi('stop_turn', {id: current.id, sha256: draft.sha256, technicalStatus: 'recorded'});
  turn.current = response.turn;
  setData(previous => ({...previous, turn: response.turn}));
 }

 async function submit(draft) {
  const audioId = await uploadSpeaking(draft.blob, {
   parentKind: 'session', parentId: session.id, examMode: exam, token: draft.token,
  });
  const next = await speakingApi('submit_answer', {sessionId: session.id, questionId: question.id, examMode: exam, audioId});
  adopt(next);
  setError('');
 }

 function skip(technicalStatus) {
  return perform(async () => {
   const current = turn.current || (await speakingApi('begin_turn', {sessionId: session.id, questionId: question.id})).turn;
   await speakingApi('stop_turn', {id: current.id, sha256: null, technicalStatus});
   const next = await speakingApi('submit_answer', {sessionId: session.id, questionId: question.id, examMode: exam});
   adopt(next);
   await removeDraft(draftKey).catch(() => {});
  });
 }

 function restart() {
  if (!window.confirm('Joriy sinov tarixda tugallanmagan holatda saqlanadi. Yangi sinovga o‘tasizmi?')) return;
  return perform(async () => {
   await speakingApi('cancel_session', {id: session.id});
   onRestart();
  });
 }

 function finish() {
  return perform(async () => {
   const response = await speakingApi('finish_mock', {id: session.id});
   setJob(response.job);
  });
 }

 return <main className="sp-page sp-mock sp-exam-room">
  <header className="sp-room-header">
   <div>
    <span className="sp-eyebrow">{examName} · {session.attemptKind === 'weekly_check' ? 'Mini-tekshiruv' : 'Sinov imtihoni'}</span>
    <h1 ref={roomTitle} tabIndex={-1}>Speaking imtihon xonasi</h1>
   </div>
   <button type="button" className="sp-btn" disabled={locked} onClick={onExit}><ChevronLeft size={17}/>Saqlab chiqish</button>
  </header>
  <ol className="sp-room-parts" aria-label="Speaking qismlari">
   {(parts[exam] || []).map(([part, name]) => <li key={part} aria-current={question?.part === part ? 'step' : undefined}>
    <b>{part}</b><span>{name}</span>
   </li>)}
  </ol>
  <div className="sp-room-progress">
   <progress value={Math.min(session.cursor, session.questionCount)} max={session.questionCount} aria-label="Sinov jarayoni"/>
   <span>{answers.length} ta javob qayd etildi</span>
  </div>
  {error && <Notice error>{error}</Notice>}
  {expired && !recorderBusy && <Notice>
   Bu savolning vaqti tugagan. Saqlangan audio bo‘lsa, uni yuborishingiz mumkin.
   <button type="button" className="sp-btn" disabled={locked} onClick={restart}>Yangi sinov boshlash</button>
  </Notice>}
  {job ? <>
   <JobPanel job={job} onComplete={result => onReport(result.result_id)}/>
   <button type="button" className="sp-btn" onClick={onExit}>Shaxsiy sahifaga qaytish</button>
  </> : question ? <div className="sp-mock-layout">
   <section ref={questionPane} className="sp-card sp-room-question" aria-label="Joriy topshiriq" aria-live="polite">
    <span className="sp-eyebrow">{session.cursor + 1}-savol{sectionName ? ` · ${sectionName}` : ''}</span>
    {question.prompt ? <Question question={question}/> : <>
     <h2>{question.part}-qism. {sectionName || 'Ovozli javob'}</h2>
     <p>Mikrofonni oching. Savol ekranda paydo bo‘ladi va ajratilgan vaqt yurishni boshlaydi.</p>
    </>}
   </section>
   <section className="sp-card sp-mock-controls" aria-label="Ovoz yozuvi">
    <h2>Javob vaqti</h2>
    <dl className="sp-room-times">
     {question.prepSeconds > 0 && <div><dt>Tayyorgarlik</dt><dd>{timeLabel(question.prepSeconds)}</dd></div>}
     <div><dt>{question.responseMaxSeconds ? 'Javob chegarasi' : 'Qism uchun qolgan vaqt'}</dt>
      <dd>{timeLabel(question.responseMaxSeconds ?? Math.ceil(session.sectionRemaining || 0))}</dd></div>
    </dl>
    {session.examRoom && !question.prompt && <label className="sp-room-voice">
     <input type="checkbox" checked={voice} disabled={locked} onChange={event => setVoice(event.target.checked)}/>
     <Headphones size={17}/>Savolni inglizcha ovozda eshitish
    </label>}
    <Recorder key={question.id} draftKey={draftKey} limit={question.responseMaxSeconds || Math.ceil(session.sectionRemaining)}
     prep={question.prepSeconds} onBegin={begin} onStop={stop} onSubmit={submit}
     onActive={setRecorderBusy} onExpired={setExpired} externalTurn={data.turn?.payload} serverOffset={offset.current}
     examRoom={session.examRoom} readPrompt={voice} disabled={busy}/>
    <p className="sp-note">{session.examRoom ? 'Vaqt tugaganda yozuv yuboriladi. Javobni oldinroq topshirish ham mumkin.' : 'Yozuv tugagach audioni yuboring.'} Sahifa yangilanganda boshlangan taymer davom etadi.</p>
    <details className="sp-room-support">
     <summary>Texnik yordam va o‘tkazish</summary>
     <div className="sp-actions">
      <button type="button" className="sp-btn" disabled={locked} onClick={() => skip('technical_error')}>Yozuv ishlamasa, o‘tkazish</button>
      <button type="button" className="sp-btn" disabled={locked} onClick={() => skip('skipped')}>Javobsiz o‘tish</button>
     </div>
    </details>
   </section>
  </div> : <section className="sp-card sp-mock-finish">
   <CheckCircle2 size={28}/>
   <h2>Javoblaringiz saqlandi.</h2>
   <p>Tahlilga yuboring. Hisobotda javoblaringizdan misollar va keyingi mashqlar beriladi.</p>
   <button type="button" className="sp-btn sp-primary" disabled={busy} onClick={finish}>
    <FileText size={17}/>{busy ? 'Yuborilmoqda…' : 'Sinovni yakunlash va tahlil olish'}<ArrowRight size={17}/>
   </button>
  </section>}
 </main>;
}
