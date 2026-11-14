import React, {useEffect, useRef, useState} from 'react';
import {Mic, Square, Upload, RotateCcw, Volume2} from 'lucide-react';
import {loadDraft, saveDraft, removeDraft, blobHash} from './drafts.js';
import {newToken, phaseNames, timeLabel, turnTime} from './client.js';

const formats = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];
const checkpointMs = 2000;

export default function Recorder({
 draftKey, limit = 120, prep = 0, onBegin, onStop, onSubmit, onActive, onExpired,
 test = false, externalTurn = null, serverOffset = 0, examRoom = false, disabled = false,
 onPresent, onPromptEnd, onPhase, autoStart = false, startLabel,
}) {
 const [state, setState] = useState('loading');
 const [draft, setDraft] = useState(null);
 const [url, setUrl] = useState('');
 const [error, setError] = useState('');
 const [tick, setTick] = useState(Date.now());
 const [turn, setTurn] = useState(externalTurn);
 const recorder = useRef(null);
 const stream = useRef(null);
 const startTimer = useRef(null);
 const autoStarted = useRef(false);
 const saveChain = useRef(Promise.resolve());
 const mounted = useRef(false);
 const locked = useRef(false);
 const stopping = useRef(false);
 const latest = useRef(null);
 const callbacks = useRef({});
 callbacks.current = {onActive, onStop, onSubmit};

 function releaseMic() {
  clearTimeout(startTimer.current);
  stream.current?.getTracks().forEach(track => track.stop());
  stream.current = null;
 }

 function unlock() {
  locked.current = false;
  callbacks.current.onActive?.(false);
 }

 function showError(cause) {
  if (mounted.current) setError(cause.message);
 }

 useEffect(() => {
  mounted.current = true;
  let alive = true;
  loadDraft(draftKey).then(saved => {
   if (!alive) return;
   latest.current = saved || null;
   setDraft(saved || null);
   setState(saved?.blob?.size ? 'ready' : 'idle');
  }).catch(cause => {
   if (!alive) return;
   showError(cause);
   setState('idle');
  });
  return () => {
   alive = false;
   mounted.current = false;
   if (recorder.current?.state === 'recording') recorder.current.stop();
   releaseMic();
   unlock();
  };
 }, [draftKey]);

 useEffect(() => {
  if (!draft?.blob || examRoom) return;
  const src = URL.createObjectURL(draft.blob);
  setUrl(src);
  return () => URL.revokeObjectURL(src);
 }, [draft, examRoom]);

 useEffect(() => {
  if (externalTurn) {
   setTurn(externalTurn);
   setTick(Date.now());
  }
 }, [externalTurn]);

 const time = turnTime(turn, tick + serverOffset, limit);
 const expired = !!turn && !turn.stoppedAt && time.phase === 'answer' && time.seconds <= 0;
 const phase = state === 'presenting' ? 'prompt' : state === 'recording' ? time.phase : state;
 useEffect(() => {onExpired?.(expired);}, [expired, onExpired]);
 useEffect(() => {onPhase?.(phase);}, [phase, onPhase]);

 useEffect(() => {
  if (!autoStart || autoStarted.current || disabled || state !== 'idle' || turn) return;
  autoStarted.current = true;
  void start();
 }, [autoStart, disabled, state, turn]);

 useEffect(() => {
  if (state !== 'recording' && (!turn || turn.stoppedAt || expired)) return;
  const timer = setInterval(() => setTick(Date.now()), 200);
  return () => clearInterval(timer);
 }, [state, turn, expired]);

 useEffect(() => {
  if (state === 'recording' && expired) stop();
 }, [state, expired]);

 async function persist(saved) {
  latest.current = saved;
  try { await saveDraft(draftKey, saved); }
  catch { showError(Error('Qurilma xotirasiga yozilmadi. Audioni yuborib bo‘lguncha sahifani ochiq tuting.')); }
 }

 async function complete(saved) {
  const completeDraft = {...saved, sha256: saved.sha256 || await blobHash(saved.blob), complete: true};
  await saveChain.current;
  await persist(completeDraft);
  return completeDraft;
 }

 async function transmit(saved) {
  if (mounted.current) setState('uploading');
  await callbacks.current.onSubmit(saved, {
   rememberUpload: assetId => persist({...saved, assetId}),
   onStage: stage => {if (mounted.current) setState(stage);},
  });
  await removeDraft(draftKey).catch(() => {});
  latest.current = null;
  if (mounted.current) {
   setDraft(null);
   setState('idle');
  }
 }

 async function finishCapture(automatic) {
  releaseMic();
  const captured = latest.current;
  if (!mounted.current) return;
  try {
   if (!captured?.blob?.size) throw Error('Audio olinmadi. Mikrofon sozlamasini tekshiring.');
   const saved = await complete(captured);
   if (automatic && examRoom && callbacks.current.onSubmit) await transmit(saved);
   else {
    await callbacks.current.onStop?.(saved);
    setDraft(saved);
    setState('ready');
   }
  } catch (cause) {
   showError(cause);
   if (mounted.current) {
    setDraft(latest.current?.blob?.size ? latest.current : null);
    setState(latest.current?.blob?.size ? 'ready' : 'idle');
   }
  } finally {
   if (mounted.current) unlock();
  }
 }

 async function start() {
  if (locked.current || disabled || expired || turn?.stoppedAt) return;
  setError('');
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
   setError('Audio yozish uchun HTTPS va mikrofonli brauzer kerak.');
   return;
  }
  locked.current = true;
  callbacks.current.onActive?.(true);
  setState('opening');
  try {
   const microphone = await navigator.mediaDevices.getUserMedia({audio: {channelCount: {ideal: 1}, echoCancellation: true, noiseSuppression: true}, video: false});
   if (!mounted.current) {
    microphone.getTracks().forEach(track => track.stop());
    return;
   }
   stream.current = microphone;
   const mimeType = formats.find(type => MediaRecorder.isTypeSupported(type));
   if (!mimeType) throw Error('Brauzer audio formatini qo‘llamaydi. Boshqa brauzerda urinib ko‘ring.');
   const media = new MediaRecorder(microphone, {mimeType, audioBitsPerSecond: mimeType === 'audio/mp4' ? 64_000 : 48_000});
   recorder.current = media;
   let info = onBegin ? await onBegin() : {
    prepUntil: new Date(Date.now() + prep * 1000).toISOString(),
    deadline: new Date(Date.now() + (prep + limit) * 1000).toISOString(),
   };
   if (!mounted.current) return;
   let offset = info.serverOffset ?? serverOffset;
   setTurn(info);
   setTick(Date.now());
   if (info.stoppedAt || Date.parse(info.deadline) <= Date.now() + offset) throw Error('Bu savolning vaqti tugagan. Saqlangan javob bilan davom eting.');

   const presentationTime = Date.parse(info.promptUntil) - (Date.now() + offset);
   if (onPresent && presentationTime > 0) {
    setState('presenting');
    await onPresent(info, presentationTime);
    if (!mounted.current) return;
   }
   if (info.examinerPending && onPromptEnd) {
    info = await onPromptEnd();
    if (!mounted.current) return;
    offset = info.serverOffset ?? serverOffset;
    setTurn(info);
    setTick(Date.now());
   }

   const chunks = [];
   const token = newToken();
   let interrupted = false;
   latest.current = null;
   stopping.current = false;
   media.ondataavailable = event => {
    if (!event.data.size) return;
    chunks.push(event.data);
    const partial = {token, blob: new Blob(chunks, {type: mimeType.split(';')[0]}), complete: stopping.current};
    latest.current = partial;
    if (!stopping.current || !mounted.current) saveChain.current = saveChain.current.then(() => saveDraft(draftKey, partial)).catch(showError);
   };
   media.onstop = () => finishCapture(!interrupted);
   media.onerror = () => {
    interrupted = true;
    showError(Error('Mikrofon bilan aloqa uzildi. Saqlangan yozuvni tekshiring.'));
    stop();
   };

   const beginAudio = () => {
    if (!mounted.current || stopping.current) return;
    try {
     if (info.stoppedAt || Date.now() + offset >= Date.parse(info.deadline)) throw Error('Bu savolning vaqti tugagan.');
     media.start(checkpointMs);
    } catch (cause) {
     releaseMic();
     showError(cause);
     setTick(Date.now());
     setState('idle');
     unlock();
    }
   };
   const wait = Date.parse(info.prepUntil) - (Date.now() + offset);
   setState('recording');
   if (wait > 0) startTimer.current = setTimeout(beginAudio, wait);
   else beginAudio();
  } catch (cause) {
   releaseMic();
   if (mounted.current) {
    setError(cause.name === 'NotAllowedError' ? 'Mikrofonga ruxsat berilmadi. Sayt sozlamasidan mikrofonni yoqing.' : cause.message);
    setState('idle');
    unlock();
   }
  }
 }

 function stop() {
  if (stopping.current) return;
  stopping.current = true;
  if (recorder.current?.state === 'recording') {
   setState('saving');
   recorder.current.stop();
  } else {
   releaseMic();
   setState('idle');
   unlock();
  }
 }

 async function submit() {
  if (locked.current || disabled) return;
  locked.current = true;
  callbacks.current.onActive?.(true);
  setState('uploading');
  setError('');
  try {
   const saved = await complete(latest.current || draft);
   await transmit(saved);
  } catch (cause) {
   if (mounted.current) {
    showError(cause);
    setDraft(latest.current || draft);
    setState('ready');
   }
  } finally {
   if (mounted.current) unlock();
  }
 }

 async function reset() {
  try {
   await removeDraft(draftKey);
   latest.current = null;
   setDraft(null);
   setTurn(null);
   setState('idle');
   setError('');
  } catch (cause) {
   showError(cause);
  }
 }

 const recording = phase === 'answer';
 const status = state === 'recording'
  ? recording ? 'Audio yozilmoqda' : phaseNames[time.phase]
  : {loading: 'Saqlangan yozuv tekshirilmoqda…', saving: 'Qurilmada saqlanmoqda…', 'preparing-upload': 'Audio tayyorlanmoqda…', uploading: 'Audio yuborilmoqda…', registering: 'Javob qayd etilmoqda…', opening: 'Mikrofon ochilmoqda…', presenting: 'Suhbat oluvchining navbati', ready: test ? 'Mikrofon sinovi tayyor' : 'Saqlangan audio tayyor'}[state]
    || (expired ? 'Savol vaqti tugagan' : examRoom ? 'Mikrofonni oching' : 'Mikrofon tayyor');
 const runningTurn = state === 'idle' && turn && !turn.stoppedAt && !expired;
 return <div className="sp-recorder" data-phase={phase}>
  {!examRoom && <div className={`sp-mic-orb ${recording ? 'is-recording' : ''}`}><Mic size={28}/></div>}
  <div className="sp-record-status" role="status">{recording && examRoom && <span className="sp-live-dot" aria-hidden="true"/>}{status}</div>
  {(state === 'recording' || runningTurn) && <strong className="sp-clock" role="timer" aria-label={phaseNames[time.phase]}>{timeLabel(Math.max(0, time.seconds))}</strong>}
  {state === 'recording' && (recording || !examRoom) && <button type="button" className="sp-btn sp-danger" onClick={stop}>
   <Square size={16}/>{recording ? examRoom ? 'Javobni topshirish' : 'Yozuvni tugatish' : 'Tayyorgarlikni to‘xtatish'}
  </button>}
  {runningTurn && <p className="sp-note">Taymer allaqachon boshlangan. Qolgan vaqtda yozishni davom ettiring.</p>}
  {state === 'idle' && (expired || turn?.stoppedAt) && <p className="sp-note" role="status">Bu savol uchun yozuv vaqti yakunlangan. Saqlangan javob bilan davom eting yoki yangi sinovni tanlang.</p>}
  {state === 'idle' && !expired && !turn?.stoppedAt && <button type="button" className="sp-btn sp-primary" disabled={disabled} onClick={start}>
   <Mic size={18}/>{test ? '10 soniyalik sinov' : examRoom ? runningTurn ? 'Yozishni davom ettirish' : startLabel || 'Savolni boshlash' : onBegin ? 'Ovoz yozishni boshlash' : 'Ovozli javob yozish'}
  </button>}
  {state === 'ready' && draft?.blob && <>
   {!examRoom && <audio controls src={url || undefined} aria-label={test ? 'Sinov audiosini tinglash' : 'O‘z javobingizni tinglash'}/>}
   {!draft.complete && <p className="sp-note">Oldingi yozuv uzilgan. Saqlangan qismini yuborishingiz mumkin.</p>}
   <div className="sp-actions">
    {onSubmit && <button type="button" className="sp-btn sp-primary" disabled={disabled} onClick={submit}><Upload size={16}/>{error ? 'Audioni qayta yuborish' : 'Audioni yuborish'}</button>}
    {test && <button type="button" className="sp-btn" onClick={reset}><RotateCcw size={16}/>Qayta sinash</button>}
   </div>
  </>}
  {error && <p className="sp-error" role="alert">{error}</p>}
  {test && <p className="sp-note"><Volume2 size={14}/> Yozuvni tinglang. Ovoz tushunarli bo‘lsa, sinovga o‘ting.</p>}
 </div>;
}
