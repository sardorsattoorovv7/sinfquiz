import React, {useEffect, useId, useRef, useState} from 'react';
import {Volume2, VolumeX} from 'lucide-react';
import {englishVoices, getInterviewer, interviewers, interviewerVoice, playInterviewer, voiceKey} from './interviewer.js';
import './examiner.css';

export const voicePreview = name => `Hello, I’m ${name}. I’ll ask you questions in English. When I finish, it’s your turn to speak.`;

export function useExaminerSpeech({interviewerId, voiceId}) {
 const [speech, setSpeech] = useState(null);
 const [mouth, setMouth] = useState('open');
 const [error, setError] = useState('');
 const request = useRef(null);

 useEffect(() => () => {
  const current = request.current;
  request.current = null;
  current?.abort();
 }, []);

 function stop() {request.current?.abort();}

 async function play(lines, timeoutMs) {
  stop();
  const current = new AbortController();
  request.current = current;
  setError('');
  setMouth('open');
  setSpeech('loading');
  const outcome = await playInterviewer(lines, {
   signal: current.signal, timeoutMs, interviewerId, voiceId,
   onStart: () => {if (request.current === current) setSpeech('speaking');},
   onWord: word => {
    if (request.current !== current) return;
    const vowel = /[aeiouy]/i.exec(word)?.[0].toLowerCase();
    setMouth(vowel === 'o' || vowel === 'u' ? 'round' : vowel === 'e' || vowel === 'i' || vowel === 'y' ? 'wide' : 'open');
   },
  });
  if (request.current !== current) return;
  request.current = null;
  setSpeech(null);
  if (outcome === 'unavailable') setError('Inglizcha ovoz ochilmadi. Savol matni orqali davom etishingiz mumkin.');
 }

 return {speech, mouth, error, play, stop};
}

export function ExaminerVoice({preference, onChange}) {
 const examiner = getInterviewer(preference.interviewerId);
 const [voices, setVoices] = useState([]);
 useEffect(() => {
  const engine = window.speechSynthesis;
  if (!engine) return;
  const update = () => setVoices(englishVoices(engine.getVoices()));
  update();
  engine.addEventListener('voiceschanged', update);
  return () => engine.removeEventListener('voiceschanged', update);
 }, []);
 const automatic = interviewerVoice(voices, examiner.id);
 const selectedVoice = voices.some(voice => voiceKey(voice) === preference.voiceId) ? preference.voiceId : '';
 return <label className="sp-field">Examiner ovozi<select value={selectedVoice} onChange={event => onChange({...preference, voiceId: event.target.value})}>
  <option value="">Avtomatik{automatic ? ` · ${automatic.name}` : ''}</option>
  {voices.map(voice => <option key={voiceKey(voice)} value={voiceKey(voice)}>{voice.name} · {voice.lang}</option>)}
 </select></label>;
}

export function ExaminerPicker({preference, onChange, disabled}) {
 const group = useId();
 const examiner = getInterviewer(preference.interviewerId);
 const audio = useExaminerSpeech(preference);
 useEffect(() => {if (disabled) audio.stop();}, [disabled]);

 function select(next) {
  audio.stop();
  onChange(next);
 }

 return <fieldset className="sp-examiner-picker" disabled={disabled}>
  <legend>Examiner va ovoz</legend>
  <div className="sp-examiner-options">
   {interviewers.map(item => <label key={item.id}>
    <input type="radio" name={group} value={item.id} checked={examiner.id === item.id} onChange={() => select({interviewerId: item.id, voiceId: ''})}/>
    <span><strong>{item.name}</strong><small>{item.label}</small></span>
   </label>)}
  </div>
  <div className="sp-examiner-voices">
   <ExaminerVoice preference={preference} onChange={select}/>
   <button type="button" className="sp-btn" onClick={audio.speech ? audio.stop : () => audio.play([voicePreview(examiner.name)], 12_000)}>
    {audio.speech ? <><VolumeX size={16}/>Ovozni to‘xtatish</> : <><Volume2 size={16}/>Ovozni sinash</>}
   </button>
  </div>
  {audio.error && <p className="sp-note" role="status">{audio.error}</p>}
 </fieldset>;
}

export function ExaminerStage({examiner, phase, speech, mouth, caption, error, canPreview, onPreview, onSilence}) {
 const mood = speech === 'speaking' ? 'speaking' : ['answer','writing'].includes(phase) ? 'listening' : 'idle';
 const status = speech === 'speaking' ? `${examiner.name} gapiryapti`
  : speech === 'loading' ? 'Ovoz tayyorlanmoqda…'
  : {answer: `${examiner.name} tinglayapti`, writing: `${examiner.name} yozma javobingizni kutyapti`, prep: `${examiner.name} javobingizni kutyapti`, prompt: 'Savol taqdimoti',
   saving: 'Javob saqlanmoqda', 'preparing-upload': 'Audio tayyorlanmoqda', uploading: 'Audio yuborilmoqda',
   registering: 'Javob qayd etilmoqda', complete: 'Suhbat yakunlandi'}[phase] || 'Suhbatga tayyor';
 return <div className="sp-interviewer" data-mood={mood} data-mouth={mouth}>
  <div className="sp-interviewer-video">
   <ExaminerPortrait female={examiner.gender === 'female'}/>
   <div className="sp-interviewer-name"><strong>{examiner.name}</strong><span>AI suhbat oluvchi</span></div>
  </div>
  <div className="sp-interviewer-info">
   <div className="sp-interviewer-status" role="status"><span className="sp-interviewer-wave" aria-hidden="true"><i/><i/><i/><i/></span>{status}</div>
   {caption && <p className="sp-interviewer-caption" lang="en">{caption}</p>}
   {error && <p className="sp-interviewer-caption" role="status">{error}</p>}
  </div>
  {speech ? <button type="button" className="sp-btn sp-quiet" onClick={onSilence}><VolumeX size={16}/>Ovozni to‘xtatish</button>
   : canPreview && <button type="button" className="sp-btn sp-quiet" onClick={onPreview}><Volume2 size={16}/>Ovozni sinash</button>}
 </div>;
}

function ExaminerPortrait({female}) {
 const hair = female ? '#543735' : '#2d272b';
 const skin = female ? '#edbb9e' : '#d8a481';
 const shade = female ? '#d99b81' : '#bc8468';
 const jacket = female ? '#50636b' : '#354e64';
 return <svg className="sp-interviewer-portrait" viewBox="0 0 420 220" aria-hidden="true" focusable="false">
  <path d="M24 18h102v114H24zm51 0v114M24 74h102m191 26h65m-49 0 13-36h31l13 36m-29 0v89m-26 0h52" fill="none" stroke="#e3edf4" strokeWidth="2" opacity=".14"/>
  <path d="M0 190h420v30H0z" fill="#152936" opacity=".28"/>
  <g className="sp-examiner-body">
   <path d="M111 220c3-37 15-59 45-68l32-10h44l32 10c29 9 41 31 45 68Z" fill={jacket}/>
   <path d="M188 140h44l11 14-33 66-33-66z" fill="#e5e6e4"/>
   <path d="m184 144-23 12 16 15-7 12 28 37h13zm52 0 23 12-16 15 7 12-28 37h-13z" fill="#0e2032" opacity=".25"/>
   <path d="M194 114h32v30l-16 19-16-19z" fill={shade}/>
  </g>
  <g className="sp-examiner-head">
   {female && <path d="M174 71c-8-34 12-50 37-50 25 0 43 20 38 49l6 78c-6 10-16 10-25 6l-20-27-18 25c-13 7-24 5-27-3z" fill={hair}/>}
   <ellipse cx="176" cy="88" rx="7" ry="11" fill={shade}/><ellipse cx="244" cy="88" rx="7" ry="11" fill={shade}/>
   <path d="M177 65c0-24 15-39 33-39s33 15 33 39v21c0 26-16 48-33 48s-33-22-33-48z" fill={skin}/>
   <path d="M232 54c8 16 8 46-3 62-6 10-12 15-19 18 17 0 33-22 33-48V65c0-12-4-19-11-26z" fill={shade} opacity=".45"/>
   {female ? <>
    <path d="M176 79c-12-16-10-42 7-52 24-17 55-7 63 19 3 9 2 24-2 37l-7-23c-11-3-20-11-25-20-7 14-19 23-34 26z" fill={hair}/>
    <path d="M178 101v15m65-15v15" stroke="#e4bb76" strokeWidth="3" strokeLinecap="round"/>
   </> : <path d="M175 79c-5-8-10-28-2-39 7-14 23-19 41-17 23 1 34 11 34 31l-5 25-6-20c-10 0-21-4-27-11-8 8-18 11-31 11z" fill={hair}/>}
   <path d="M186 74q8-4 16 0m16 0q8-4 16 0" fill="none" stroke={hair} strokeWidth="2" strokeLinecap="round"/>
   <g className="sp-examiner-eyes">
    <path d="M185 83q9-8 17 0-8 6-17 0zm33 0q9-8 17 0-8 6-17 0z" fill="#fff5ee"/>
    <circle cx="194" cy="82" r="3.6" fill="#3c302b"/><circle cx="226" cy="82" r="3.6" fill="#3c302b"/>
    <path d="M194 81h1m31 0h1" stroke="#fff" strokeLinecap="round"/>
   </g>
   <path d="m210 83-4 17 6 1" fill="none" stroke={shade} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
   <path className="sp-examiner-rest" d="M200 111q10 7 20 0" fill="none" stroke="#8b4f46" strokeWidth="2.5" strokeLinecap="round"/>
   <g className="sp-examiner-talk"><ellipse cx="210" cy="113" rx="10" ry="5" fill="#673e3b"/><path d="M204 110h12l-2 2h-8z" fill="#f9e6d7"/></g>
  </g>
 </svg>;
}
