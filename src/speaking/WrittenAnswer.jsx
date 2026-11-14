import React, {useEffect, useRef, useState} from 'react';
import {PenLine, Send} from 'lucide-react';
import {WRITTEN_ANSWER_MAX} from './answer-mode.js';
import {phaseNames, timeLabel, turnTime} from './client.js';
import {loadDraft, removeDraft, saveDraft} from './drafts.js';

const emptyDraft = {text: '', sealed: false};

export default function WrittenAnswer({draftKey, turn, serverOffset, onBegin, onPresent, onPromptEnd, onSubmit,
 onActive, onPhase, onExpired, onSkip, autoStart, disabled, startLabel}) {
 const [draft, setDraft] = useState(emptyDraft);
 const [loading, setLoading] = useState(true);
 const [action, setAction] = useState(null);
 const [tick, setTick] = useState(Date.now());
 const [error, setError] = useState('');
 const [storageError, setStorageError] = useState(false);
 const latest = useRef(emptyDraft);
 const saves = useRef(Promise.resolve());
 const mounted = useRef(false);
 const busy = useRef(false);
 const startedAutomatically = useRef(false);
 const submittedAutomatically = useRef(false);
 const answerBox = useRef(null);
 const scrolledToAnswer = useRef(false);

 useEffect(() => {
  let alive = true;
  mounted.current = true;
  loadDraft(draftKey).then(saved => {
   if (!alive || typeof saved?.text !== 'string') return;
   latest.current = {text: saved.text.slice(0, WRITTEN_ANSWER_MAX), sealed: saved.sealed === true};
   setDraft(latest.current);
  }).catch(() => {if (alive) setStorageError(true);})
   .finally(() => {if (alive) setLoading(false);});
  return () => {alive = false; mounted.current = false; onActive?.(false);};
 }, [draftKey]);

 const time = turnTime(turn, tick + serverOffset);
 const expired = !!turn && !turn.stoppedAt && time.phase === 'answer' && time.seconds <= 0;
 const ready = !!turn && !turn.stoppedAt && time.phase === 'answer';
 const needsStart = !turn || (turn.examinerPending && time.phase === 'prompt');
 const canWrite = ready && !expired && !draft.sealed && !action && !disabled;
 const phase = action === 'opening' || action === 'presenting' ? 'prompt'
  : action === 'sending' ? 'uploading' : ready ? expired ? 'idle' : 'writing' : turn ? time.phase : 'idle';

 useEffect(() => {
  if (!turn || turn.stoppedAt) return;
  setTick(Date.now());
  const timer = setInterval(() => setTick(Date.now()), 200);
  return () => clearInterval(timer);
 }, [turn, serverOffset]);
 useEffect(() => {onPhase?.(phase);}, [phase, onPhase]);
 useEffect(() => {onExpired?.(expired);}, [expired, onExpired]);
 useEffect(() => {
  if (!canWrite || loading || scrolledToAnswer.current || !window.matchMedia?.('(max-width: 780px)').matches) return;
  scrolledToAnswer.current = true;
  answerBox.current?.scrollIntoView?.({block: 'nearest'});
 }, [canWrite, loading]);
 useEffect(() => {
  if (autoStart && !loading && !turn && !disabled && !startedAutomatically.current) {
   startedAutomatically.current = true;
   void start();
  }
 }, [autoStart, loading, turn, disabled]);
 useEffect(() => {
  if (expired && !loading && !action && !disabled && draft.text.trim() && !draft.sealed && !submittedAutomatically.current) {
   submittedAutomatically.current = true;
   void submit();
  }
 }, [expired, loading, action, disabled, draft]);

 function store(next) {
  latest.current = next;
  setDraft(next);
  saves.current = saves.current.then(() => saveDraft(draftKey, next)).catch(() => {
   if (mounted.current) setStorageError(true);
  });
  return saves.current;
 }

 async function perform(status, work) {
  if (busy.current || disabled) return;
  busy.current = true;
  onActive?.(true);
  setAction(status);
  setError('');
  try {await work();}
  catch (cause) {if (mounted.current) setError(cause.code === 'SPEAKING_NETWORK' ? 'Javob yuborilmadi. Aloqa tiklangach shu javobni qayta yuboring.' : cause.message);}
  finally {
   busy.current = false;
   if (mounted.current) {
    setAction(null);
    setTick(Date.now());
    onActive?.(false);
   }
  }
 }

 function start() {
  return perform('opening', async () => {
   const info = await onBegin();
   if (!mounted.current || info.stoppedAt) return;
   const remaining = Date.parse(info.promptUntil) - (Date.now() + (info.serverOffset ?? serverOffset));
   if (remaining > 0) {
    setAction('presenting');
    await onPresent(info, remaining);
   }
   if (mounted.current && info.examinerPending) await onPromptEnd();
  });
 }

 function submit(event) {
  event?.preventDefault();
  const text = latest.current.text.trim();
  if (!ready || !text) return;
  return perform('sending', async () => {
   await store({...latest.current, sealed: true});
   await onSubmit(text);
   await removeDraft(draftKey).catch(() => {});
  });
 }

 return <div ref={answerBox} className="sp-written-answer" aria-busy={!!action}>
  {loading ? <p role="status">Saqlangan matn tekshirilmoqda…</p> : <>
   {needsStart && !action && <button type="button" className="sp-btn sp-primary" disabled={disabled} onClick={start}>
    <PenLine size={17}/>{turn ? 'Savolni davom ettirish' : startLabel || 'Savolni boshlash'}
   </button>}
   {action === 'opening' && <p role="status">Savol ochilmoqda…</p>}
   {action === 'presenting' && <p role="status">Suhbat oluvchining navbati</p>}
   {turn && !turn.stoppedAt && !action && !needsStart && <div className="sp-written-clock">
    <span>{expired ? 'Javob vaqti tugadi' : phaseNames[time.phase]}</span>
    <strong className="sp-clock" role="timer" aria-label={phaseNames[time.phase]}>{timeLabel(Math.max(0, time.seconds))}</strong>
   </div>}
   {ready && (action === null || action === 'sending') && <form onSubmit={submit}>
    <label className="sp-field">Yozma javobingiz
     <textarea lang="en" rows={5} maxLength={WRITTEN_ANSWER_MAX} spellCheck={false} autoCorrect="off"
      value={draft.text} readOnly={!canWrite} placeholder="Javobingizni ingliz tilida yozing…"
      onChange={event => {
       const current = turnTime(turn, Date.now() + serverOffset);
       if (canWrite && current.phase === 'answer' && current.seconds > 0) store({text: event.target.value, sealed: false});
      }}/>
    </label>
    <div className="sp-written-actions"><span className="sp-note">{draft.text.length} / {WRITTEN_ANSWER_MAX}</span>
     <button type="submit" className="sp-btn sp-primary" disabled={disabled || !!action || !draft.text.trim()}>
      <Send size={16}/>{action === 'sending' ? 'Yuborilmoqda…' : draft.sealed ? 'Matnni qayta yuborish' : 'Yozma javobni topshirish'}
     </button>
     {expired && !draft.text.trim() && <button type="button" className="sp-btn" disabled={disabled} onClick={onSkip}>Javobsiz o‘tish</button>}
    </div>
   </form>}
  </>}
  {storageError && <p className="sp-note" role="status">Qurilma xotirasiga yozib bo‘lmadi. Javobni yuborguncha sahifani ochiq tuting.</p>}
  {error && <p className="sp-error" role="alert">{error}</p>}
 </div>;
}
