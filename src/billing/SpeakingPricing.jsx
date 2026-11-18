import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,Clock3,Copy,Mic,Send,ShieldCheck} from 'lucide-react';
import {PaperButton,PaperNotice} from '../paper/PaperUI.jsx';
import {speakingPlans,speakingPlan,speakingPrice,speakingExpiry} from './plans.js';
import {speakingBilling} from './client.js';
import './pricing.css';

const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const orderStates={
 pending:'Payme tasdig‘i kutilmoqda.',
 paid:'To‘lov tasdiqlandi. Tahlillar hisobingizga qo‘shildi.',
 cancelled:'Bu buyurtma bekor qilingan yoki to‘lov vaqti tugagan.',
};

export default function SpeakingPricing({user,authReady,onLogin,onSpeaking,selectedPlan}){
 const [status,setStatus]=useState(null),[account,setAccount]=useState(null),[error,setError]=useState('');
 const [recheck,setRecheck]=useState(0),[ordering,setOrdering]=useState(null);
 const checkoutInFlight=useRef(false);
 const orderStatus=useRef(null),focusOrder=useRef(false);
 const [queryOrder,setQueryOrder]=useState(()=>{
  const value=new URLSearchParams(location.search).get('order');
  return value&&uuid.test(value)?value:null;
 });

 useEffect(()=>{
  const controller=new AbortController(),{signal}=controller;
  let timer,checks=0;
  setAccount(null);setError('');
  async function poll(){
   try{
    const data=await speakingBilling('status',{order:queryOrder},signal);
    if(signal.aborted)return;
    setAccount(data);setError('');
    if(data.order?.status==='pending'&&data.order.method!=='transfer'&&checks++<10)timer=setTimeout(poll,3500);
   }catch(e){if(!signal.aborted)setError(e.message);}
  }
  speakingBilling(null,{},signal).then(config=>{
   if(signal.aborted)return;
   setStatus(config);
   if(config.available&&user)poll();
  }).catch(e=>{if(!signal.aborted)setError(e.message);});
  return()=>{controller.abort();clearTimeout(timer);};
 },[user?.id,queryOrder,recheck]);

 useEffect(()=>{
  if(queryOrder&&focusOrder.current){
   focusOrder.current=false;
   orderStatus.current?.focus();
  }
 },[queryOrder,recheck]);

 function openOrder(order){
  const url=new URL(location.href);
  url.searchParams.set('order',order);
  history.replaceState(history.state,'',url);
  focusOrder.current=true;
  setQueryOrder(order);
  setRecheck(value=>value+1);
 }

 async function buy(plan){
  if(!user){onLogin(plan.id);return;}
  if(checkoutInFlight.current)return;
  const pending=account?.transferOrders?.find(order=>order.plan===plan.id&&order.status==='pending');
  if(status?.method==='transfer'&&pending){openOrder(pending.id);return;}
  checkoutInFlight.current=true;setOrdering(plan.id);setError('');
  try{
   const checkout=await speakingBilling('order',{plan:plan.id},AbortSignal.timeout(12000));
   if(checkout.method==='transfer'){
    if(!uuid.test(checkout.orderId))throw Error('Buyurtma raqamini olib bo‘lmadi.');
    openOrder(checkout.orderId);
    checkoutInFlight.current=false;setOrdering(null);
    return;
   }
   const url=new URL(checkout.url);
   if(!['https://checkout.paycom.uz','https://test.paycom.uz'].includes(url.origin))throw Error('Payme manzili noto‘g‘ri.');
   location.assign(url.href);
  }catch(e){setError(e.message);checkoutInFlight.current=false;setOrdering(null);}
 }

 const transfer=status?.method==='transfer';
 const manualPending=account?.order?.method==='transfer'&&account.order.status==='pending';
 return <main className="sq-pricing">
  <header className="sq-pricing-head">
   <div><h1>Speaking tariflari</h1><p>Bepul namuna bilan boshlang. Ko‘proq shaxsiy tahlil kerak bo‘lsa, mos tarifni tanlang.</p></div>
   <PaperButton onClick={onSpeaking}><Mic size={18}/> Speaking’ga o‘tish</PaperButton>
  </header>
  {status?.mode==='test'&&<PaperNotice kind="warning">{transfer?'Kartaga to‘lov sinov rejimida.':'Payme sinov rejimi.'}</PaperNotice>}
  {error&&<PaperNotice kind="error">{error} <PaperButton onClick={()=>setRecheck(i=>i+1)}>Qayta urinish</PaperButton></PaperNotice>}
  {queryOrder&&<section ref={orderStatus} tabIndex={-1} className="sq-pricing-status" aria-label="Buyurtma holati" aria-live="polite">
   <Clock3 size={20} aria-hidden="true"/>
   <div><h2>Buyurtma holati</h2>
    <p>{manualPending?'Administrator tasdig‘i kutilmoqda.':account?.order?orderStates[account.order.status]:!authReady?'Hisob tekshirilmoqda…':!user?'Holatni ko‘rish uchun hisobga kiring.':account?'Bu hisob uchun buyurtma topilmadi.':error||status?.available===false?'Buyurtma holati olinmadi.':'Buyurtma tekshirilmoqda…'}</p>
   </div>
   {authReady&&!user&&<PaperButton onClick={()=>onLogin()}>Hisobga kirish</PaperButton>}
   {user&&<PaperButton onClick={()=>setRecheck(i=>i+1)}>Holatni tekshirish</PaperButton>}
  </section>}
  {manualPending&&account.payment&&<TransferOrder key={account.order.id} order={account.order} payment={account.payment}/>}
  <section className="sq-plan-grid" aria-label="Speaking tariflarini solishtirish">
   {speakingPlans.map(plan=><article key={plan.id} className={'sq-plan-card'+(plan.id==='plus'?' sq-plan-plus':'')+(selectedPlan===plan.id?' sq-plan-selected':'')}>
    <h2>{plan.name}</h2>
    <p className="sq-plan-price">{speakingPrice(plan.price)}{plan.id==='plus'&&<small> / 30 kun</small>}</p>
    <p>{plan.id==='free'?'Mashq qanday ishlashini ko‘rish uchun.':plan.id==='single'?'Yana bitta to‘liq natija kerak bo‘lganda.':'Haftama-hafta Speaking mashq qiladiganlar uchun.'}</p>
    <ul>
     {plan.id==='free'&&<li><Check aria-hidden="true"/> Hisobsiz savol va namunaviy hisobot</li>}
     <li><Check aria-hidden="true"/> {plan.full} ta to‘liq sinov tahlili{plan.id==='free'?' · hisob bilan':''}</li>
     {plan.short>0&&<li><Check aria-hidden="true"/> {plan.short} ta qisqa mashq tahlili</li>}
     {plan.id==='plus'&&<li><Check aria-hidden="true"/> Urinishlarni taqqoslash va shaxsiy reja</li>}
     {plan.id==='single'&&<li><Check aria-hidden="true"/> Tahlildan foydalanish uchun {plan.days} kun</li>}
    </ul>
    {plan.id==='free'?<PaperButton variant="secondary" onClick={onSpeaking}>Bepul boshlash <ArrowRight size={16}/></PaperButton>:
     <PaperButton variant={plan.id==='plus'?'primary':'secondary'} disabled={!authReady||!status?.available||status.salesPaused||ordering!==null} onClick={()=>buy(plan)}>
      {ordering===plan.id?'Buyurtma ochilmoqda…':plan.id==='plus'?'Plus’ni olish':'Bitta tahlilni olish'} <ArrowRight size={16}/>
     </PaperButton>}
   </article>)}
  </section>
  {status&&!status.available&&<p className="sq-pricing-note" role="status">To‘lov hozircha ochilmagan. Bepul mashqlarni boshlashingiz mumkin.</p>}
  {status?.salesPaused&&<p className="sq-pricing-note" role="status">Speaking tahlili hali to‘liq sozlanmagan. Bepul mashqlar ochiq.</p>}
  {account?.balances?.length>0&&<section className="sq-plan-balances" aria-label="Hisobingizdagi tahlillar">
   <h2>Hisobingizdagi tahlillar</h2>
   <ul>{account.balances.map((bucket,index)=><li key={bucket.plan+'-'+index}>
    <strong>{speakingPlan(bucket.plan)?.name}</strong>
    <span>{bucket.full} ta to‘liq · {bucket.short} ta qisqa</span>
    {bucket.expiresAt&&<small>{speakingExpiry(bucket.expiresAt)} gacha</small>}
   </li>)}</ul>
  </section>}
  <section className="sq-pricing-terms" aria-label="To‘lov va mashqlar">
   <ShieldCheck size={22} aria-hidden="true"/>
   <div><h2>To‘lov qanday ishlaydi?</h2>
    {transfer
     ? <p>Tarifni tanlang, kartaga o‘tkazing va chekni Telegram orqali yuboring. Administrator to‘lovni tekshirgach, tahlillar hisobingizda ochiladi.</p>
     : <p>To‘lov Payme’da tasdiqlangach tahlillar hisobingizga qo‘shiladi. Chek Payme’da saqlanadi.</p>}
    <p>Tarif bir marta to‘lanadi va 30 kundan keyin istasangiz o‘zingiz yangilaysiz.</p>
    <p>Tahlil muvaffaqiyatsiz tugasa, urinish qayta ochiladi. Oldingi hisobotlarni muddatdan keyin ham ko‘rishingiz mumkin.</p>
    <p>Kodli testlar, ochiq atlas mashqlari, ingliz tili boshlang‘ich testi va IQ namunasi bepul.</p>
   </div>
  </section>
 </main>;
}

function TransferOrder({order,payment}){
 const [notice,setNotice]=useState('');
 const plan=speakingPlan(order.plan);
 if(!plan)return null;
 const draft=`SinfQuiz · ${plan.name}\nBuyurtma ${order.id}\nSinfQuiz emaili yoki profil nomi `;
 const telegramUrl=`https://t.me/${payment.telegram}?text=${encodeURIComponent(draft)}`;

 async function copy(value,label){
  try{
   await navigator.clipboard.writeText(value);
   setNotice(label+' nusxalandi.');
  }catch{setNotice('Matnni belgilab, qo‘lda nusxa oling.');}
 }

 return <section className="sq-transfer" aria-labelledby="sq-transfer-title">
  <h2 id="sq-transfer-title">Kartaga o‘tkazma</h2>
  <dl>
   <div><dt>Tarif</dt><dd>{plan.name}</dd></div>
   <div><dt>To‘lov summasi</dt><dd><strong>{speakingPrice(order.amount/100)}</strong></dd></div>
   <div><dt>Karta egasi</dt><dd>{payment.recipient}</dd></div>
   <div>
    <dt>Karta raqami</dt>
    <dd><code>{payment.card}</code> <PaperButton variant="quiet" onClick={()=>copy(payment.card.replaceAll(' ',''),'Karta raqami')} aria-label="Karta raqamini nusxalash"><Copy size={16}/></PaperButton></dd>
   </div>
   <div>
    <dt>Buyurtma raqami</dt>
    <dd><code>{order.id}</code> <PaperButton variant="quiet" onClick={()=>copy(order.id,'Buyurtma raqami')} aria-label="Buyurtma raqamini nusxalash"><Copy size={16}/></PaperButton></dd>
   </div>
  </dl>
  <p>Telegram’da SinfQuiz emailingizni yoki profil nomingizni yozing va chekni biriktiring.</p>
  <a className="pw-button pw-button--primary" href={telegramUrl} target="_blank" rel="noreferrer"><Send size={17}/> Chekni Telegram’da yuborish</a>
  <span role="status">{notice}</span>
 </section>;
}
