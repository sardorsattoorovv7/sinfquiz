import React,{useEffect,useId,useRef,useState} from 'react';
import {ArrowRight,LockKeyhole} from 'lucide-react';
import {api} from '../api.js';
import {PaperButton,PaperInput} from './PaperUI.jsx';

export default function ClassJoinForm({onResolved,autoFocus=false,compact=false}){
 const id=useId(),[pin,setPin]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const submit=async e=>{e.preventDefault();if(busy)return;if(!/^\d{6}$/.test(pin)){setError('O‘qituvchi bergan 6 xonali kodni kiriting.');return}setBusy(true);setError('');try{const entry=await api('/api/resolve',{method:'POST',data:{pin}});if(alive.current)await onResolved(entry)}catch(err){if(alive.current)setError(err instanceof TypeError?'Server bilan aloqa yo‘q. Qayta urinib ko‘ring.':err.message)}finally{if(alive.current)setBusy(false)}};
 return <form className={'pin-box pw-class-join '+(compact?'is-compact':'')} onSubmit={submit} aria-busy={busy}><label className="pin-label" htmlFor={id+'-pin'}>O‘YIN KODI</label><div className="pin-row"><PaperInput id={id+'-pin'} data-autofocus={autoFocus?'true':undefined} aria-describedby={id+'-help'+(error?' '+id+'-error':'')} aria-invalid={!!error} autoComplete="off" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={e=>{setPin(e.target.value.replace(/\D/g,'').slice(0,6));setError('')}} placeholder="000000" disabled={busy}/><PaperButton type="submit" variant="primary" disabled={busy||pin.length!==6}>{busy?'Tekshirilmoqda…':'Qo‘shilish'} <ArrowRight size={19}/></PaperButton></div><p id={id+'-help'} className="pin-help"><LockKeyhole size={14}/> Faqat o‘qituvchi bergan kod yetarli.</p>{error&&<p id={id+'-error'} className="form-error" role="alert">{error}</p>}</form>;
}
