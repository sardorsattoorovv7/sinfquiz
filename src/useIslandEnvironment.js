import {useEffect,useState} from 'react';
import {clockDelay,islandTime,readPreference,savePreference,validTimeMode} from './island-clock.js';
export function useIslandEnvironment(){
 const [mode,setModeState]=useState(()=>validTimeMode(readPreference('sq_island_time_mode','auto'))),[now,setNow]=useState(()=>new Date()),[requested,setRequested]=useState(()=>readPreference('sq_garden_motion','off')!=='off'),[reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
 useEffect(()=>{let timer;const tick=()=>{clearTimeout(timer);setNow(new Date());if(!document.hidden)timer=setTimeout(tick,clockDelay());},visibility=()=>{if(document.hidden)clearTimeout(timer);else tick();};tick();document.addEventListener('visibilitychange',visibility);window.addEventListener('focus',tick);window.addEventListener('pageshow',tick);return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('focus',tick);window.removeEventListener('pageshow',tick);};},[]);
 return {mode,time:islandTime(now,mode),reduced,motion:requested&&!reduced,setMode:v=>{v=validTimeMode(v);savePreference('sq_island_time_mode',v);setModeState(v);},toggleMotion:()=>setRequested(v=>{savePreference('sq_garden_motion',v?'off':'on');return !v;})};
}
