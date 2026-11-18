import React,{useEffect,useRef,useState} from 'react';
import {speakingBilling} from './client.js';
import {speakingExpiry,speakingPlans,speakingPrice} from './plans.js';

const paidPlans=speakingPlans.filter(plan=>plan.price>0);

export default function TransferAdmin({user,onClose}){
 const dialog=useRef(null);
 const submitLock=useRef(false);
 const [orders,setOrders]=useState(null);
 const [retry,setRetry]=useState(0);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');

 useEffect(()=>{
  if(!dialog.current.open)dialog.current.showModal();
 },[]);

 useEffect(()=>{
  const controller=new AbortController();
  const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(12000)]);
  setError('');
  speakingBilling('transfer_admin_orders',{userId:user.id},signal)
   .then(result=>{if(!controller.signal.aborted)setOrders(result.orders);})
   .catch(reason=>{if(!controller.signal.aborted)setError(reason.message);});
  return()=>controller.abort();
 },[user.id,retry]);

 async function approve(event,order,plan){
  event.preventDefault();
  if(submitLock.current)return;
  const reference=new FormData(event.currentTarget).get('reference').trim();
  if(reference.length<4){
   setError('Bank tarixidagi operatsiya raqamini kiriting.');
   return;
  }
  submitLock.current=true;
  setBusy(true);
  setError('');
  setMessage('');
  try{
   const result=await speakingBilling('transfer_approve',{
    userId:user.id,order:order.id,reference,
   },AbortSignal.timeout(12000));
   setOrders(current=>current.map(item=>item.id===order.id?result.order:item));
   setMessage(plan.name+' faollashtirildi.');
  }catch(reason){
   setError(reason.message);
  }finally{
   submitLock.current=false;
   setBusy(false);
  }
 }

 return <dialog ref={dialog} className="password-modal transfer-admin-modal" aria-labelledby="transfer-admin-title" onCancel={event=>{
  event.preventDefault();
  if(!submitLock.current)onClose();
 }}>
  <h2 id="transfer-admin-title">Speaking tarifini faollashtirish</h2>
  <p><strong>{user.name}</strong>{user.email&&' · '+user.email}</p>
  {orders&&<p>Bank tarixidan pul tushganini va summani tekshiring. Telegram’dagi buyurtma raqamini quyidagi buyurtma bilan solishtiring.</p>}
  {!orders&&!error&&<p role="status">Buyurtmalar yuklanmoqda…</p>}
  {orders&&paidPlans.map(plan=>{
   const order=orders.find(item=>item.plan===plan.id);
   return <section className="transfer-admin-plan" key={plan.id}>
    <h3>{plan.name} <span>{speakingPrice(order?order.amount/100:plan.price)}</span></h3>
    {!order&&<p>Xaridor bu tarif uchun hali buyurtma ochmagan.</p>}
    {order?.status==='paid'&&<p>{speakingExpiry(order.expiresAt)} gacha faollashtirilgan.</p>}
    {order?.status==='pending'&&<form onSubmit={event=>approve(event,order,plan)}>
     <div><span>Buyurtma raqami</span><code>{order.id}</code></div>
     <label>Bankdagi operatsiya raqami<input name="reference" required minLength={4} maxLength={100} autoComplete="off" disabled={busy}/></label>
     <button type="submit" className="btn btn-primary" disabled={busy} aria-label={plan.name+' tarifini faollashtirish'}>Faollashtirish</button>
    </form>}
   </section>;
  })}
  {error&&<p className="form-error" role="alert">{error}</p>}
  {message&&<p role="status">{message}</p>}
  <div className="password-modal-actions">
   {!orders&&error&&<button type="button" className="btn btn-outline" onClick={()=>setRetry(value=>value+1)}>Qayta urinish</button>}
   <button type="button" className="btn btn-outline" disabled={busy} onClick={onClose}>Yopish</button>
  </div>
 </dialog>;
}
