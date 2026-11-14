const english = /^en(?:[-_]|$)/i;
const british = /^en[-_]GB$/i;
const preferenceKey = 'sq_speaking_interviewer';

export const interviewers = [
 {id: 'alex', name: 'Alex', gender: 'male', label: 'Erkak'},
 {id: 'emma', name: 'Emma', gender: 'female', label: 'Ayol'},
];
export const getInterviewer = id => interviewers.find(item => item.id === id) || interviewers[0];
export const voiceKey = voice => voice.voiceURI || voice.name;

export function readInterviewerPreference() {
 try {
  const saved = JSON.parse(localStorage.getItem(preferenceKey));
  return {interviewerId: getInterviewer(saved?.interviewerId).id, voiceId: typeof saved?.voiceId === 'string' ? saved.voiceId : ''};
 } catch {
  return {interviewerId: 'alex', voiceId: ''};
 }
}

export function saveInterviewerPreference(preference) {
 try {localStorage.setItem(preferenceKey, JSON.stringify(preference));} catch {}
}

export function englishVoices(voices) {
 const rank = voice => (voice.localService ? 2 : 0) + (british.test(voice.lang) ? 1 : 0);
 return voices.filter(voice => english.test(voice.lang)).sort((a, b) => rank(b) - rank(a));
}

function voiceGender(voice) {
 if (/\b(female|zira|hazel|aria|jenny|sonia|samantha|karen|moira|tessa|serena|victoria|ava|emily|susan|emma|allison|shelley|fiona|kate)\b/i.test(voice.name)) return 'female';
 if (/\b(male|david|mark|guy|ryan|daniel|alex|fred|tom|oliver|lee|arthur|james|george|brian|thomas|ralph|aaron)\b/i.test(voice.name)) return 'male';
 return null;
}

export function interviewerVoice(voices, interviewerId, voiceId = '') {
 const gender = getInterviewer(interviewerId).gender;
 return voices.find(voice => voiceKey(voice) === voiceId) || voices.find(voice => voiceGender(voice) === gender) || voices[0];
}

function speechParts(text) {
 const parts = [];
 let line = '';
 for (const word of text.trim().split(/\s+/)) {
  if (line && line.length + word.length > 174) {
   parts.push(line);
   line = '';
  }
  line = line ? `${line} ${word}` : word;
 }
 if (line) parts.push(line);
 return parts;
}

export function playInterviewer(lines, {signal, timeoutMs, onStart, onWord, interviewerId = 'alex', voiceId = ''}) {
 const engine = window.speechSynthesis;
 if (signal.aborted) return Promise.resolve('stopped');
 if (!engine || !window.SpeechSynthesisUtterance) return Promise.resolve('unavailable');
 const parts = lines.filter(Boolean).flatMap(speechParts);
 return new Promise(resolve => {
  let index = 0;
  let active;
  let voice;
  let ended = false;
  const timer = setTimeout(() => finish('unavailable'), timeoutMs);
  const abort = () => finish('stopped');
  signal.addEventListener('abort', abort, {once: true});

  function finish(outcome) {
   if (ended) return;
   ended = true;
   clearTimeout(timer);
   signal.removeEventListener('abort', abort);
   if (active) {
    active.onstart = active.onend = active.onerror = active.onboundary = null;
    if (outcome !== 'played') {
     try {engine.cancel();} catch {}
    }
   }
   resolve(outcome);
  }

  function speakNext() {
   if (ended) return;
   if (index === parts.length) return finish('played');
   try {
    if (index === 0) {
     const voices = engine.getVoices();
     voice = interviewerVoice(englishVoices(voices), interviewerId, voiceId);
     if (voices.length && !voice) return finish('unavailable');
    }
    active = new window.SpeechSynthesisUtterance(parts[index++]);
    active.lang = voice?.lang || 'en-GB';
    if (voice) active.voice = voice;
    active.rate = .95;
    active.onstart = onStart;
    const text = active.text;
    active.onboundary = event => {
     if (!ended && (!event.name || event.name === 'word')) onWord?.(text.slice(event.charIndex).match(/^\S+/)?.[0] || '');
    };
    active.onend = speakNext;
    active.onerror = () => finish('unavailable');
    engine.speak(active);
   } catch {
    finish('unavailable');
   }
  }

  speakNext();
 });
}
