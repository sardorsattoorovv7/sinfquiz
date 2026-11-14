import React,{useEffect,useState} from 'react';
import {Activity,Users,Radio,LogOut,ArrowLeft,Search,LockKeyhole} from 'lucide-react';
import {api} from './api.js';
import {adminResetPassword} from './profile-service.js';

const dateFormat=new Intl.DateTimeFormat('uz-UZ',{
 day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tashkent'
});
const date=value=>Number.isFinite(value)&&value>0?dateFormat.format(value):'—';
const roles={student:'O‘quvchi',teacher:'O‘qituvchi',admin:'Administrator'};

export default function UserAnalytics({Stat}){
 const [query,setQuery]=useState(''),[role,setRole]=useState(''),[page,setPage]=useState(1),[snapshot,setSnapshot]=useState(null);
 const [pageError,setPageError]=useState(''),[retry,setRetry]=useState(0);
 const [target,setTarget]=useState(null),[resetResult,setResetResult]=useState(null),[resetError,setResetError]=useState(''),[resetBusy,setResetBusy]=useState(false);
 const search=query.trim();
 const result=snapshot?.search===search&&snapshot.role===role&&snapshot.page===page?snapshot.data:null;

 useEffect(()=>{
  let disposed=false,inFlight=false;
  async function load(){
   if(disposed||inFlight||document.hidden)return;
   inFlight=true;
   try{
    const data=await api('/api/admin/analytics',{method:'POST',data:{search,role,page}});
    if(disposed)return;
    setSnapshot({search,role,page,data});
    setPageError('');
   }catch(error){
    if(!disposed)setPageError(error.message);
   }finally{
    inFlight=false;
   }
  }
  const initial=setTimeout(load,200);
  const refresh=setInterval(load,15000);
  document.addEventListener('visibilitychange',load);
  window.addEventListener('online',load);
  return()=>{
   disposed=true;
   clearTimeout(initial);
   clearInterval(refresh);
   document.removeEventListener('visibilitychange',load);
   window.removeEventListener('online',load);
  };
 },[search,role,page,retry]);

 function changeFilter(setValue,value){
  setPageError('');
  setPage(1);
  setValue(value);
 }

 function goToPage(nextPage){
  setPageError('');
  setPage(nextPage);
 }

 const close=()=>{if(resetBusy)return;setTarget(null);setResetResult(null);setResetError('');};
 const reset=async()=>{
  setResetBusy(true);
  setResetError('');
  try{setResetResult(await adminResetPassword(target.id));}
  catch(error){setResetError(error.message);}
  finally{setResetBusy(false);}
 };
 const counts=snapshot?.data;

 return <div className="user-analytics">
  {counts&&<>
   <div className="stats-grid analytics-stats">
    <Stat icon={<Users/>} label="Jami foydalanuvchi" value={counts.totalUsers} color="purple"/>
    <Stat icon={<Radio/>} label="Hozir onlayn" value={counts.activeUsers} color="green"/>
    <Stat icon={<LogOut/>} label="Jami kirish" value={counts.totalLogins} color="blue"/>
    <Stat icon={<ArrowLeft/>} label="Jami chiqish" value={counts.totalLogouts} color="orange"/>
   </div>
   <section className="panel-card analytics-summary">
    <div><b>{counts.students}</b><span>O‘quvchi</span></div>
    <div><b>{counts.teachers}</b><span>O‘qituvchi</span></div>
    <div><b>{counts.admins}</b><span>Administrator</span></div>
    <div><b>{counts.todayUsers}</b><span>Bugun faol</span></div>
   </section>
  </>}
  <section className="panel-card users-panel">
   <div className="panel-head">
    <div><h2>Foydalanuvchilar</h2><p>Avval onlayn hisoblar, har guruhda oxirgi kirganlar yuqorida.</p></div>
    <div className="user-filters">
     <label><Search aria-hidden="true"/><input aria-label="Ism yoki email" value={query} onChange={event=>changeFilter(setQuery,event.target.value)} placeholder="Ism yoki email" maxLength={100}/></label>
     <select aria-label="Rol bo‘yicha filtrlash" value={role} onChange={event=>changeFilter(setRole,event.target.value)}>
      <option value="">Barcha rollar</option><option value="student">O‘quvchilar</option><option value="teacher">O‘qituvchilar</option><option value="admin">Administratorlar</option>
     </select>
    </div>
   </div>
   {pageError&&<div role="alert" className="form-error">{pageError} <button type="button" className="btn btn-outline" onClick={()=>{setPageError('');setRetry(value=>value+1);}}>Qayta urinish</button></div>}
   {!result&&!pageError&&<div className="analytics-loading" role="status"><Activity aria-hidden="true"/><p>Foydalanuvchilar yuklanmoqda…</p></div>}
   {result?.users.length>0&&<>
    <div className="table-wrap" tabIndex={0} role="region" aria-label="Foydalanuvchilar jadvali">
     <table className="users-table">
      <thead><tr><th>FOYDALANUVCHI</th><th>ROL</th><th>HOLAT</th><th>KIRISHLAR</th><th>CHIQISHLAR</th><th>OXIRGI KIRISH</th><th>OXIRGI FAOLLIK</th><th>PAROL</th></tr></thead>
      <tbody>{result.users.map(user=>{
       const {activity}=user;
       return <tr key={user.id}>
        <td><span className="user-initial">{(user.name||'?').slice(0,1).toUpperCase()}</span><div><b>{user.name||'Nomsiz foydalanuvchi'}</b><small>{user.email||user.provider||'Email ko‘rsatilmagan'}</small></div></td>
        <td><span className={`role-badge ${user.role}`}>{roles[user.role]||'—'}</span></td>
        <td><span className={`online-badge ${activity.online?'online':'offline'}`}><i/>{activity.online?'Onlayn':'Oflayn'}</span></td>
        <td>{activity.loginCount}</td><td>{activity.logoutCount}</td>
        <td>{date(activity.lastLoginAt)}</td><td>{date(activity.lastSeenAt)}</td>
        <td>{user.provider==='email'&&user.role!=='admin'?<button className="reset-link" onClick={()=>{setTarget(user);setResetResult(null);setResetError('');}}><LockKeyhole size={15}/> Yangilash</button>:'—'}</td>
       </tr>;
      })}</tbody>
     </table>
    </div>
    <p>{result.filteredUsers} ta hisob · {result.page} / {result.pageCount} sahifa</p>
    {result.pageCount>1&&<nav aria-label="Foydalanuvchilar sahifalari">
     <button className="btn btn-outline" disabled={result.page===1} onClick={()=>goToPage(result.page-1)}>Oldingi sahifa</button>{' '}
     <button className="btn btn-outline" disabled={result.page===result.pageCount} onClick={()=>goToPage(result.page+1)}>Keyingi sahifa</button>
    </nav>}
   </>}
   {result?.users.length===0&&<div className="empty-card compact"><Users/><h3>Foydalanuvchi topilmadi</h3><p>Qidiruv yoki rol filtrini o‘zgartirib ko‘ring.</p></div>}
  </section>
  {target&&<div className="password-modal-backdrop" role="presentation">
   <section className="password-modal" role="dialog" aria-modal="true" aria-labelledby="reset-heading">
    <h2 id="reset-heading">Email hisob parolini yangilash</h2>
    <p><b>{target.name}</b> · {target.email}</p>
    {resetResult?<>
     <p>Yangi parol faqat shu oynada ko‘rinadi. O‘quvchiga shaxsan yetkazing.</p>
     <code>{resetResult.password}</code>
     {resetResult.warning&&<p role="status" className="form-error">{resetResult.warning}</p>}
     <button className="btn btn-outline" onClick={()=>navigator.clipboard?.writeText(resetResult.password)}>Nusxa olish</button>
    </>:<p>Parol serverda tasodifiy yaratiladi. Eski parol bilan keyingi kirish ishlamaydi.</p>}
    {resetError&&<p role="alert" className="form-error">{resetError}</p>}
    <div className="password-modal-actions"><button className="btn btn-outline" disabled={resetBusy} onClick={close}>Yopish</button>
     {!resetResult&&<button className="btn btn-primary" disabled={resetBusy} onClick={reset}>{resetBusy?'Yangilanmoqda…':'Parolni yangilash'}</button>}
    </div>
   </section>
  </div>}
 </div>;
}
