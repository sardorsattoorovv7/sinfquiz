import {useEffect} from 'react';

// This guards navigation inside the app; it does not trap users in the browser.
export function useActivityGuard({active,hash}){
 useEffect(()=>{
  if(!active){sessionStorage.removeItem('sq_active_hash');return}
  const expected=hash||'#practice';
  sessionStorage.setItem('sq_active_hash',expected);
  const restore=()=>{if(location.hash!==expected)history.replaceState(null,'',location.pathname+location.search+expected)};
  const warn=event=>{event.preventDefault();event.returnValue=''};
  window.addEventListener('hashchange',restore);
  window.addEventListener('popstate',restore);
  window.addEventListener('beforeunload',warn);
  return()=>{window.removeEventListener('hashchange',restore);window.removeEventListener('popstate',restore);window.removeEventListener('beforeunload',warn)};
 },[active,hash]);
}
