import React,{useEffect,useId,useRef,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {api} from '../api.js';
import {PaperButton,PaperInput} from './PaperUI.jsx';
import {uiCopy} from '../ui-copy.js';

export default function ClassJoinForm({onResolved,autoFocus=false,compact=false}){
 const id=useId(),[pin,setPin]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),alive=useRef(true),pending=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const submit=async e=>{e.preventDefault();if(pending.current)return;if(!/^\d{6}$/.test(pin)){setError('Ustozingiz bergan 6 xonali kodni kiriting.');return}pending.current=true;setBusy(true);setError('');try{const entry=await api('/api/resolve',{method:'POST',data:{pin}});if(alive.current)await onResolved(entry)}catch(err){if(alive.current)setError(err instanceof TypeError?uiCopy.common.network:err.message)}finally{pending.current=false;if(alive.current)setBusy(false)}};
 return <form className={'pin-box pw-class-join '+(compact?'is-compact':'')} onSubmit={submit} aria-busy={busy}><label className="pin-label" htmlFor={id+'-pin'}>{uiCopy.join.label}</label><div className="pin-row"><PaperInput id={id+'-pin'} data-autofocus={autoFocus?'true':undefined} aria-describedby={id+'-help'+(error?' '+id+'-error':'')} aria-invalid={!!error} autoComplete="off" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={pin} onChange={e=>{setPin(e.target.value.replace(/\D/g,'').slice(0,6));setError('')}} placeholder={uiCopy.join.placeholder} disabled={busy}/><PaperButton type="submit" variant="primary" disabled={busy||pin.length!==6}>{busy?uiCopy.join.loading:uiCopy.join.submit} <ArrowRight size={19}/></PaperButton></div><p id={id+'-help'} className="pin-help">6 xonali kod. Keyingi qadamda ismingizni kiritasiz.</p>{error&&<p id={id+'-error'} className="form-error" role="alert">{error}</p>}</form>;
}
