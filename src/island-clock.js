// Decorative local time cycle; no geolocation and no astronomical sunset claim.
export const TIME_LABELS={morning:'Tong',day:'Kunduz',evening:'Shom',night:'Tun'};
export function validTimeMode(v){return ['auto','morning','day','evening','night'].includes(v)?v:'auto';}
export function islandTime(date=new Date(),mode='auto'){
 mode=validTimeMode(mode);const m=mode==='auto'?date.getHours()*60+date.getMinutes()+date.getSeconds()/60:{morning:390,day:720,evening:1020,night:1320}[mode];let phase='night',day=0,dusk=0;
 if(m>=300&&m<420){phase='morning';if(m<360)dusk=(m-300)/60;else{day=(m-360)/60;dusk=1-day;}}
 else if(m>=420&&m<960){phase='day';day=1;}
 else if(m>=960&&m<1140){phase='evening';if(m<1020){dusk=(m-960)/60;day=1-dusk;}else if(m<1080)dusk=1;else dusk=(1140-m)/60;}
 return {mode,phase,label:TIME_LABELS[phase],day,dusk,night:Math.max(0,1-day-dusk),clock:`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`};
}
export function clockDelay(now=Date.now()){return 60000-((now%60000)+60000)%60000+25;}
export function graphicsBudget({width=1200,height=800,dpr=1,cores=8,saveData=false}={}){const low=width<761||cores<=4||saveData;return {low,fps:low?24:30,pixelRatio:Math.min(Math.max(.5,dpr),low?1:1.5,Math.sqrt((low?650000:1300000)/Math.max(1,width*height))),shadows:!low};}
export function readPreference(key,fallback){try{return localStorage.getItem(key)??fallback;}catch{return fallback;}}
export function savePreference(key,value){try{localStorage.setItem(key,value);}catch{}}
