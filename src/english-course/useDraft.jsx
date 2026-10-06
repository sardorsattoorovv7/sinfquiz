import React, {useEffect, useRef, useState} from 'react';
import {DraftStore} from './draft-store.js';

export function useDraft(options) {
 const saved = useRef(options.onSaved), remote = useRef(options.fetchRemote);
 saved.current = options.onSaved; remote.current = options.fetchRemote;
 const mounted = useRef(false), [store] = useState(() => new DraftStore({...options,
  onSaved: work => { if (mounted.current) saved.current?.(work) }, fetchRemote: () => remote.current()}));
 const [state, setState] = useState(() => store.snapshot());
 useEffect(() => {
  mounted.current = true; const stop = store.subscribe(setState); store.mount();
  const online = () => store.flush().catch(() => {}); window.addEventListener('online', online);
  return () => { mounted.current = false; stop(); store.dispose(); window.removeEventListener('online', online) };
 }, [store]);
 useEffect(() => { store.updateWork(options.work) }, [store, options.work]);
 return {...state, store, update: patch => store.update(patch), flush: () => store.flush()};
}

export function DraftNotice({draft}) {
 const [busy, setBusy] = useState(false), [error, setError] = useState('');
 const resolve = async local => {
  setBusy(true); setError('');
  try { await draft.store.resolveConflict(local) } catch (e) { setError(e.message) } finally { setBusy(false) }
 };
 const download = () => {
  const url = URL.createObjectURL(new Blob([draft.draft.writing || ''], {type: 'text/plain;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = 'english-draft.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
 };
 return <>{draft.error && <div className="en-error" role="alert"><p>{draft.error}</p><div className="en-actions">
  <button type="button" onClick={download}>Qoralamani yuklab olish</button>
  {draft.conflict ? <><button type="button" disabled={busy} onClick={() => resolve(false)}>Hisobdagi nusxani ochish</button><button type="button" disabled={busy} onClick={() => resolve(true)}>Qoralamamni hisobga yozish</button></> : <button type="button" onClick={() => draft.flush().catch(() => {})}>Saqlashni qayta yuborish</button>}
 </div></div>}{error && <p className="en-error" role="alert">{error}</p>}</>;
}
