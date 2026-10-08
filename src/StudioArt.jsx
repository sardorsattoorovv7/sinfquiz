import React,{useId} from 'react';

// Original lightweight vector artwork. No external requests or bitmap UI.
export default function StudioArt({subject='math',className=''}){
 const id=useId().replace(/:/g,'');
 const colors={chemistry:['#c5f0f0','#138d9f'],biology:['#d9f4db','#327e56'],english:['#eee3fb','#9274bc'],informatics:['#d7eafa','#3676ae'],math:['#d2efea','#149795']};
 const [light,dark]=colors[subject]||colors.math;
 return <svg className={`studio-art ${className}`} viewBox="0 0 120 100" aria-hidden="true" focusable="false"><defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor={light}/><stop offset="1" stopColor={dark}/></linearGradient></defs><ellipse cx="61" cy="91" rx="39" ry="5" fill={dark} opacity=".1"/>
 {subject==='chemistry'?<><path d="M47 9h25M51 10v29L30 81q-4 7 5 7h50q9 0 5-7L69 39V10" fill="white" fillOpacity=".5" stroke={dark} strokeWidth="3"/><path d="M42 58h36l12 23q3 5-5 5H35q-6 0-4-5Z" fill={`url(#${id})`}/><path d="M52 18h16M53 27h13M43 53h34" stroke={dark} opacity=".5"/><g fill="white"><circle cx="55" cy="65" r="3"/><circle cx="71" cy="75" r="3.5"/><circle cx="47" cy="80" r="2"/><circle cx="61" cy="80" r="1.5"/></g></>:
 subject==='biology'?<><path d="M58 88 76 23M60 70 32 41M65 54 93 37" stroke={dark} strokeWidth="3" fill="none"/><path d="M60 71C31 72 14 47 24 31c23 0 41 17 36 40Z" fill={`url(#${id})`} stroke={dark}/><path d="M66 57C66 24 87 12 102 20c1 27-16 38-36 37Z" fill={`url(#${id})`} stroke={dark}/><path d="m30 41 27 28m39-44L69 55" stroke="#e0f5de" strokeWidth="1.5"/></>:
 subject==='english'?<><path d="m51 20 16-5 20 65-16 5Z" fill="#f4c569" stroke="#af7731" strokeWidth="2"/><path d="m51 20 4-15 12 10Z" fill="#e9daca" stroke="#af7731"/><path d="m55 5 4 5-6 2Z" fill="#29405a"/><path d="m52 25 17-5M55 36l16-5m1 54 6 6 10-3-1-8" stroke="#c89343" fill="none"/><path d="M29 31h15M29 46h18M29 61h19M29 76h23" stroke={dark} strokeWidth="3" strokeLinecap="round"/></>:
 subject==='informatics'?<><rect x="24" y="16" width="73" height="54" rx="5" fill="#1e3851"/><rect x="29" y="21" width="63" height="43" rx="2" fill={`url(#${id})`}/><path d="m23 70-11 14q-2 5 5 5h88q6 0 4-5L97 70Z" fill="#759aba" stroke="#244863" strokeWidth="2"/><path d="M29 76h65m-68 5h70m-42 4h17" stroke="#d8e8f5" strokeWidth="2"/><path d="m51 35-9 7 9 7m19-14 9 7-9 7m-7-14-7 16" stroke="white" strokeWidth="2" fill="none"/></>:
 <><path d="M20 79 58 20l46 59Z" fill={`url(#${id})`} stroke={dark} strokeWidth="3"/><path d="M58 20v59m0-9h9v9M20 88h84m-84-4v8m84-8v8" stroke="#294d68" strokeDasharray="4 3" fill="none"/><g fill={dark} stroke="white" strokeWidth="2"><circle cx="20" cy="79" r="4"/><circle cx="58" cy="20" r="4"/><circle cx="104" cy="79" r="4"/></g></>}
 </svg>;
}
