import React,{useEffect,useRef,useState} from 'react';
import {Play,Pause,RotateCcw,Mic,Square,Upload,Download,Trash2} from 'lucide-react';
import {clip,uploadAudio,audioUrl,audioDigest} from './service.js';
export function Audio({src,transcript='',onHeard=()=>{},label='Tinglash',synthetic=true}){
 const ref=useRef(null),[playing,setPlaying]=useState(false),[time,setTime]=useState(0),[duration,setDuration]=useState(0),[error,setError]=useState(''),[text,setText]=useState(false),[rate,setRate]=useState(1),[volume,setVolume]=useState(1);
 useEffect(()=>{setTime(0);setDuration(0);setError('');setPlaying(false)},[src]);
 const play=async()=>{setError('');try{if(ref.current.paused)await ref.current.play();else ref.current.pause()}catch{setError('Audio ochilmadi. Internetni tekshirib, “Qayta tinglash”ni bosing. Bu holat tinglangan deb hisoblanmaydi.')}};
 const repeat=()=>{ref.current.currentTime=Math.max(0,ref.current.currentTime-6);playIfPaused()};
 const playIfPaused=()=>{if(ref.current.paused)ref.current.play().catch(()=>setError('Audio ijro etilmadi.'))};
 return <div className="en-audio"><b>{label}</b><audio ref={ref} src={src} preload="none" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>{setPlaying(false);onHeard()}} onLoadedMetadata={()=>setDuration(ref.current.duration)} onTimeUpdate={()=>setTime(ref.current.currentTime)} onError={()=>{setError('Audio yuklanmadi. Qayta urinib ko‘ring.');setPlaying(false)}}/><div className="en-audio-row"><button className="en-primary" type="button" onClick={play}>{playing?<Pause size={17}/>:<Play size={17}/>} {playing?'To‘xtatish':'Tinglash'}</button><button type="button" onClick={()=>{ref.current.load();setError('');ref.current.currentTime=0;playIfPaused()}}><RotateCcw size={16}/> Qayta tinglash</button><button type="button" onClick={repeat}>6 soniya orqaga</button></div><label>Tinglash jarayoni <input aria-label="Audio vaqtini tanlash" type="range" min="0" max={duration||1} value={time} step="0.1" onChange={e=>{ref.current.currentTime=+e.target.value}}/></label><div className="en-audio-row"><label>Tezlik <select value={rate} onChange={e=>{setRate(+e.target.value);ref.current.playbackRate=+e.target.value}}>{[.75,1,1.25,1.5].map(v=><option key={v} value={v}>{v}×</option>)}</select></label><label>Ovoz <input type="range" min="0" max="1" step=".1" value={volume} onChange={e=>{setVolume(+e.target.value);ref.current.volume=+e.target.value}}/></label><span>{Math.floor(time)} / {Math.floor(duration)} s</span></div>{synthetic&&<small>Flite sun’iy ovozi. Asosiy mashq uchun original yozuv.</small>}{error&&<p role="alert" className="en-error">{error}</p>}{transcript&&<><button type="button" className="en-link" aria-expanded={text} onClick={()=>setText(!text)}>{text?'Transkriptni yopish':'Transkriptni ochish'}</button>{text&&<p lang="en">{transcript}</p>}</>}</div>
}
const noop = () => {};
export function Recorder({uid, id, value = {}, onChange = noop, onUploaded, onBusyChange = noop, readonly = false, disabled = false}) {
 const key = `${uid}:${id}`, recorder = useRef(null), stream = useRef(null), clock = useRef(null);
 const alive = useRef(false), generation = useRef(0), lock = useRef(false), pendingUpload = useRef(null);
 const callbacks = useRef({onChange, onUploaded, onBusyChange}); callbacks.current = {onChange, onUploaded, onBusyChange};
 const [blob, setBlob] = useState(null), [localUrl, setLocalUrl] = useState(''), [remoteUrl, setRemoteUrl] = useState('');
 const [status, setStatus] = useState('idle'), [seconds, setSeconds] = useState(0), [error, setError] = useState(''), [note, setNote] = useState(value.note || '');
 const stopTracks = () => { clearInterval(clock.current); stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; };
 const markBusy = active => callbacks.current.onBusyChange(active);
 useEffect(() => {
  alive.current = true; const current = ++generation.current; setBlob(null); setRemoteUrl(''); setStatus('idle'); pendingUpload.current = null;
  if (!readonly) clip(key).then(async saved => {
   if (!alive.current || generation.current !== current || !saved) return;
   const stored = saved instanceof Blob ? {blob: saved} : saved;
   if (!(stored.blob instanceof Blob)) return;
   // A failed metadata write must not turn a successfully uploaded identical clip into a new draft.
   const matchesUploaded = value.mode === 'recording' && value.sha256 && value.sha256 === await audioDigest(stored.blob);
   if (!alive.current || generation.current !== current) return;
   setBlob(stored.blob);
   if (stored.pending && stored.uploaded) pendingUpload.current = stored.uploaded;
   if (value.mode !== 'live' && !matchesUploaded && (!stored.uploaded || stored.uploaded.path !== value.path)) callbacks.current.onChange({mode: 'draft'});
  }).catch(() => { if (alive.current) setError('Brauzer audio xotirasi ochilmadi. Yozuvni yuklab olishingiz mumkin.'); });
  return () => {
   alive.current = false; ++generation.current; lock.current = false;
   if (recorder.current?.state === 'recording') recorder.current.stop();
   stopTracks(); markBusy(false);
  };
 }, [key, readonly]);
 useEffect(() => { setNote(value.note || '') }, [value.note]);
 useEffect(() => {
  setRemoteUrl('');
 }, [value.path]);
 useEffect(() => {
  if (!blob) { setLocalUrl(''); return; }
  const url = URL.createObjectURL(blob); setLocalUrl(url); return () => URL.revokeObjectURL(url);
 }, [blob]);
 const finish = () => { if (recorder.current?.state === 'recording') recorder.current.stop(); };
 const cancelRequest = () => { ++generation.current; lock.current = false; stopTracks(); setStatus('idle'); markBusy(false); };
 const start = async () => {
  if (lock.current || readonly || disabled) return;
  lock.current = true; markBusy(true); setStatus('requesting'); setError(''); const current = ++generation.current;
  try {
   if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw Error('Bu brauzer ovoz yozishni qo‘llamaydi. Jonli ustoz tekshiruvini tanlang.');
   const microphone = await navigator.mediaDevices.getUserMedia({audio: true});
   if (!alive.current || generation.current !== current) { microphone.getTracks().forEach(track => track.stop()); return; }
   stream.current = microphone;
   const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported(t));
   const activeRecorder = new MediaRecorder(microphone, type ? {mimeType: type} : {}), chunks = []; recorder.current = activeRecorder;
   activeRecorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
   activeRecorder.onstop = async () => {
    clearInterval(clock.current); microphone.getTracks().forEach(track => track.stop());
    const recording = new Blob(chunks, {type: activeRecorder.mimeType || 'audio/webm'});
    if (!recording.size) { if (alive.current && generation.current === current) { setError('Yozuv bo‘sh. Mikrofonni tekshirib, qayta yozing.'); setStatus('idle'); lock.current = false; markBusy(false); } return; }
    // Save the clip even if a browser navigation interrupted the component.
    let saved = true; try { await clip(key, {blob: recording}); } catch { saved = false; }
    if (!alive.current || generation.current !== current) return;
    setBlob(recording); pendingUpload.current = null; callbacks.current.onChange({mode: 'draft'});
    if (!saved) setError('Yozuv brauzer xotirasiga saqlanmadi. Sahifadan chiqishdan oldin yuklab oling.');
    setStatus('idle'); lock.current = false; markBusy(false);
   };
   activeRecorder.onerror = () => { if (alive.current) setError('Mikrofon bilan aloqa uzildi. Yozuvni tekshirib, qayta urinib ko‘ring.'); finish(); };
   activeRecorder.start(); setStatus('recording'); setSeconds(0); let elapsed = 0;
   clock.current = setInterval(() => { elapsed++; if (alive.current) setSeconds(elapsed); if (elapsed >= 240) finish(); }, 1000);
  } catch (e) {
   if (!alive.current || generation.current !== current) return;
   stopTracks(); lock.current = false; markBusy(false); setStatus('idle');
   setError(e.name === 'NotAllowedError' ? 'Mikrofon ruxsati berilmadi. Jonli ustoz tekshiruvi orqali ham topshirishingiz mumkin.' : e.message);
  }
 };
 const send = async () => {
  if (lock.current || !blob || readonly || disabled) return;
  lock.current = true; markBusy(true); setStatus('uploading'); setError(''); const current = generation.current;
  try {
   const uploaded = pendingUpload.current || await uploadAudio(id, blob); pendingUpload.current = uploaded;
   try { await clip(key, {blob, uploaded, pending: true}); } catch {}
   await (callbacks.current.onUploaded || callbacks.current.onChange)(uploaded);
   pendingUpload.current = null; try { await clip(key, {blob, uploaded, pending: false}); } catch {}
  } catch (e) { if (alive.current && generation.current === current) setError(e.message); }
  finally { if (alive.current && generation.current === current) { lock.current = false; setStatus('idle'); markBusy(false); } }
 };
 const playback = async () => {
  setError(''); try { const url = await audioUrl(value.path); if (alive.current) setRemoteUrl(url); } catch (e) { if (alive.current) setError(e.message); }
 };
 const extension = {'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'audio/wav': 'wav'}[blob?.type.split(';')[0]] || 'webm';
 const busy = status !== 'idle';
 return <div className="en-recorder">
  {!readonly && <><p>Yozuv avval shu brauzerda qoladi. “Yozuvni yuborish”ni bosgach hisobingizga saqlanadi.</p><div className="en-actions">
   <button type="button" disabled={disabled || busy && status !== 'recording'} onClick={status === 'recording' ? finish : start}>{status === 'recording' ? <Square size={17}/> : <Mic size={17}/>} {status === 'recording' ? `To‘xtatish · ${seconds}s` : status === 'requesting' ? 'Mikrofon ruxsati kutilmoqda…' : 'Ovoz yozish'}</button>
   {status === 'requesting' && <button type="button" onClick={cancelRequest}>Yozishni bekor qilish</button>}
   {blob && status !== 'recording' && <><button type="button" disabled={disabled || busy} onClick={send}><Upload size={16}/>{status === 'uploading' ? 'Yuborilmoqda…' : 'Yozuvni yuborish'}</button><a className="en-button" href={localUrl} download={`speaking.${extension}`}><Download size={16}/> Yuklab olish</a><button type="button" disabled={disabled || busy} onClick={async () => { try { await clip(key, null); setBlob(null); pendingUpload.current = null; } catch (e) { setError(e.message); } }}><Trash2 size={16}/> Lokal yozuvni o‘chirish</button></>}
  </div></>}
  {!readonly && localUrl && <><p>Lokal yozuv</p><audio aria-label="Lokal ovoz yozuvi" controls preload="none" src={localUrl}/></>}
  {value.mode === 'draft' && <p role="status">Yangi yozuv hali yuborilmagan. Uni yuboring yoki jonli ustoz tekshiruvini tanlang.</p>}
  {value.mode === 'recording' && <><p>Hisobga yuklangan yozuv. Ustoz dars topshirilgach tekshiradi.</p><button type="button" onClick={playback}>{remoteUrl ? 'Yozuvni qayta ochish' : 'Topshirilgan yozuvni eshitish'}</button>{remoteUrl && <audio aria-label="Hisobdagi ovoz yozuvi" controls preload="none" src={remoteUrl} onError={() => setError('Yozuv ochilmadi. “Yozuvni qayta ochish”ni bosing.')}/>}</>}
  {!readonly && <details><summary>Mikrofon o‘rniga jonli ustoz tekshiruvi</summary><label>Kim bilan va qachon tekshiriladi?<input disabled={disabled || busy} value={note} maxLength={1000} onChange={e => setNote(e.target.value)} placeholder="Ustoz bilan keyingi darsda, topshiriq bo‘yicha suhbat"/></label><button type="button" disabled={disabled || busy || note.trim().length < 10} onClick={() => callbacks.current.onChange({mode: 'live', note})}>Jonli tekshiruv uchun topshirish</button></details>}
  {readonly && value.mode === 'live' && <p>Jonli tekshiruv: {value.note}</p>}
  {error && <p role="alert" className="en-error">{error}</p>}
 </div>;
}
