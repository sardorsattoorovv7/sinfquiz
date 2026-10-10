export const BOARD_WIDTH = 1600;
export const BOARD_HEIGHT = 900;
export const canUseClassroom = user => !!user?.id && ['teacher', 'admin'].includes(user.role);
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const makeId = () => globalThis.crypto?.randomUUID?.() || `board-${Date.now().toString(36)}-${Array.from(globalThis.crypto.getRandomValues(new Uint32Array(3)),n=>n.toString(36)).join('-')}`;
export const BOARD_STYLES = [
  {id:'white', name:'Oq marker doskasi', background:'#ffffff', ink:'#142c48', pattern:'plain'},
  {id:'green', name:'Yashil bo‘r doskasi', background:'#16473d', ink:'#f5fbeb', pattern:'chalk'},
  {id:'black', name:'Qora bo‘r doskasi', background:'#252a2e', ink:'#fff8e9', pattern:'chalk'},
  {id:'dark', name:'Qorong‘i doska', background:'#112039', ink:'#eef8ff', pattern:'plain'},
  {id:'squared', name:'Katakli daftar', background:'#f9fcff', ink:'#173653', pattern:'grid'},
  {id:'ruled', name:'Chiziqli daftar', background:'#fffefa', ink:'#283853', pattern:'lines'},
  {id:'coordinates', name:'Koordinata tekisligi', background:'#f7fbff', ink:'#153954', pattern:'coordinates'},
  {id:'dotted', name:'Nuqtali fon', background:'#fbfcff', ink:'#233a54', pattern:'dots'},
  {id:'beige', name:'Och bej qog‘oz', background:'#fbf3e4', ink:'#483b2e', pattern:'paper'},
  {id:'pastel', name:'Pastel fon', background:'#edf8f4', ink:'#1e4a48', pattern:'plain'},
];
export const TIMER_STYLES = [
  ['digital','Raqamli'], ['flip','Flip-soat'], ['ring','Halqali'], ['analog','Analog'],
  ['hourglass','Qumsoat'], ['battery','Batareya'], ['water','Suv idishi'],
  ['runner','Yugurish yo‘lagi'], ['space','Kosmik'], ['traffic','Svetofor'],
].map(([id,name])=>({id,name}));
export const TOOLS = ['select','pen','marker','highlight','eraser','text','line','arrow','ellipse','rectangle','triangle'];
export const freshPage = (name='1-doska') => ({id:makeId(),name,style:'white',objects:[]});
export const freshTimer = () => ({durationMs:300000,remainingMs:300000,deadline:null,status:'idle',label:'Mustaqil ish',style:'ring',sound:false,runId:0});
export function freshClassroom() {
  const page = freshPage();
  return {version:1,pages:[page],activePage:page.id,timer:freshTimer(),
    noise:{threshold:55,sensitivity:1},random:{mode:'range',start:'1',end:'30',list:'3, 7, 12, 18, 25',count:1,unique:true,used:[],history:[],result:[],poolKey:''},
    panels:{timer:{open:true,dock:'right',order:0},noise:{open:false,dock:'right',order:1},random:{open:false,dock:'right',order:2}}};
}
export const boardStyle = id => BOARD_STYLES.find(s=>s.id===id)||BOARD_STYLES[0];
const finite = (n,min,max,fallback=min) => Number.isFinite(Number(n))?clamp(Number(n),min,max):fallback;
const text = (x,limit) => typeof x==='string'?x.slice(0,limit):'';
const color = x => x==='auto'||/^#[0-9a-f]{6}$/i.test(x)?x:'auto';
const safeImage = x => typeof x==='string' && x.length<=4500000 && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(x);

export function validateBoardObject(o) {
  if(!o||!['stroke','text','image','line','arrow','ellipse','rectangle','triangle'].includes(o.type))return null;
  const common={id:text(o.id,80)||makeId(),type:o.type,color:color(o.color),width:finite(o.width,1,64,4)};
  if(o.type==='stroke') {
    if(!Array.isArray(o.points)||o.points.length<2)return null;
    const points=o.points.slice(0,15000).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:finite(p.x,0,BOARD_WIDTH),y:finite(p.y,0,BOARD_HEIGHT),pressure:finite(p.pressure,.05,1,1)}));
    if(points.length<2)return null;
    return {...common,brush:['pen','marker','highlight'].includes(o.brush)?o.brush:'pen',points};
  }
  if(o.type==='image'&&!safeImage(o.src))return null;
  const w=finite(o.w,1,BOARD_WIDTH,200),h=finite(o.h,1,BOARD_HEIGHT,100);
  return {...common,x:finite(o.x,0,BOARD_WIDTH-w),y:finite(o.y,0,BOARD_HEIGHT-h),w,h,
    flipX:!!o.flipX,flipY:!!o.flipY,...(o.circle?{circle:true}:{}),
    ...(o.type==='text'?{text:text(o.text,4000),fontSize:finite(o.fontSize,12,150,34)}:{}),
    ...(o.type==='image'?{src:o.src}:{}),...(o.dashed?{dashed:true}:{})};
}
export function validateClassroom(raw) {
  if(!raw||raw.version!==1||!Array.isArray(raw.pages)||!raw.pages.length||raw.pages.some(p=>!p||typeof p!=='object'))return null;
  const pages=raw.pages.slice(0,20).map((p,i)=>({id:text(p.id,80)||makeId(),name:text(p.name,60)||`${i+1}-doska`,style:boardStyle(p.style).id,
    objects:Array.isArray(p.objects)?p.objects.slice(0,1500).map(validateBoardObject).filter(Boolean):[]}));
  if(new Set(pages.map(p=>p.id)).size!==pages.length)return null;
  const d=freshClassroom(),t=raw.timer||{};
  const timer={durationMs:finite(t.durationMs,1000,24*3600000,300000),remainingMs:finite(t.remainingMs,0,24*3600000,300000),
    deadline:t.status==='running'&&Number.isFinite(t.deadline)?t.deadline:null,status:['idle','running','paused','finished'].includes(t.status)?t.status:'idle',
    label:text(t.label,60)||'Mustaqil ish',style:TIMER_STYLES.some(s=>s.id===t.style)?t.style:'ring',sound:!!t.sound,runId:finite(t.runId,0,1e9)};
  if(timer.status==='running'&&timer.deadline===null)timer.status='paused';
  const r=raw.random||{},mode=['range','limit','list'].includes(r.mode)?r.mode:'range';
  return {...d,pages,activePage:pages.some(p=>p.id===raw.activePage)?raw.activePage:pages[0].id,timer,
    noise:{threshold:finite(raw.noise?.threshold,10,95,55),sensitivity:finite(raw.noise?.sensitivity,.4,2.5,1)},
    random:{mode,start:text(r.start,8)||'1',end:text(r.end,8)||'30',list:text(r.list,10000),count:finite(r.count,1,100,1),unique:!!r.unique,
      used:Array.isArray(r.used)?[...new Set(r.used.filter(Number.isSafeInteger))].slice(0,10000):[],
      history:Array.isArray(r.history)?r.history.slice(-30).filter(x=>x&&Array.isArray(x.values)&&x.values.every(Number.isSafeInteger)).map(x=>({values:x.values.slice(0,100),at:finite(x.at,0,1e15)})):[],
      result:Array.isArray(r.result)?r.result.filter(Number.isSafeInteger).slice(0,100):[],poolKey:text(r.poolKey,120000)},
    panels:Object.fromEntries(['timer','noise','random'].map((key,i)=>[key,{open:typeof raw.panels?.[key]?.open==='boolean'?raw.panels[key].open:d.panels[key].open,
      dock:['left','right','bottom'].includes(raw.panels?.[key]?.dock)?raw.panels[key].dock:'right',order:finite(raw.panels?.[key]?.order,0,20,i)}]))};
}

export function objectBounds(o) {
  if(o.type==='stroke') {
    const xs=o.points.map(p=>p.x),ys=o.points.map(p=>p.y),pad=o.width/2;
    return {x:Math.min(...xs)-pad,y:Math.min(...ys)-pad,w:Math.max(...xs)-Math.min(...xs)+2*pad,h:Math.max(...ys)-Math.min(...ys)+2*pad};
  }
  return {x:o.x,y:o.y,w:o.w,h:o.h};
}
export function translateObject(o,dx,dy) {
  const b=objectBounds(o);dx=clamp(dx,-b.x,BOARD_WIDTH-b.x-b.w);dy=clamp(dy,-b.y,BOARD_HEIGHT-b.y-b.h);
  return o.type==='stroke'?{...o,points:o.points.map(p=>({...p,x:p.x+dx,y:p.y+dy}))}:{...o,x:o.x+dx,y:o.y+dy};
}
export function resizeObject(o,w,h) {
  const b=objectBounds(o);w=clamp(w,16,BOARD_WIDTH-Math.max(0,b.x));h=clamp(h,16,BOARD_HEIGHT-Math.max(0,b.y));
  if(o.circle){const side=Math.min(Math.abs(w-o.w)>Math.abs(h-o.h)?w:h,BOARD_WIDTH-o.x,BOARD_HEIGHT-o.y);w=h=side;}
  if(o.type==='stroke')return {...o,points:o.points.map(p=>({...p,x:b.x+(p.x-b.x)*w/Math.max(1,b.w),y:b.y+(p.y-b.y)*h/Math.max(1,b.h)}))};
  return {...o,w,h,...(o.type==='text'?{fontSize:clamp(o.fontSize*h/o.h,12,150)}:{})};
}
export function shapeFromPoints(type,a,b,attributes={}) {
  const flipX=b.x<a.x,flipY=b.y<a.y,dx=Math.abs(b.x-a.x),dy=Math.abs(b.y-a.y);
  if(type==='ellipse'){
    const side=Math.max(1,Math.min(Math.max(dx,dy),flipX?a.x:BOARD_WIDTH-a.x,flipY?a.y:BOARD_HEIGHT-a.y));
    return {...attributes,type,circle:true,x:clamp(flipX?a.x-side:a.x,0,BOARD_WIDTH-side),y:clamp(flipY?a.y-side:a.y,0,BOARD_HEIGHT-side),w:side,h:side};
  }
  return {...attributes,type,x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.max(1,dx),h:Math.max(1,dy),flipX,flipY};
}
export function hitObject(o,p,tolerance=8) {
  const b=objectBounds(o);
  if(p.x<b.x-tolerance||p.x>b.x+b.w+tolerance||p.y<b.y-tolerance||p.y>b.y+b.h+tolerance)return false;
  if(o.type==='stroke')return o.points.some((q,i)=>i?segmentDistance(p,o.points[i-1],q)<=o.width/2+tolerance:Math.hypot(q.x-p.x,q.y-p.y)<=tolerance);
  if(['line','arrow'].includes(o.type))return segmentDistance(p,{x:o.x+(o.flipX?o.w:0),y:o.y+(o.flipY?o.h:0)},{x:o.x+(o.flipX?0:o.w),y:o.y+(o.flipY?0:o.h)})<=o.width/2+tolerance;
  return true;
}
export function segmentDistance(p,a,b) {
  const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy,t=den?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/den,0,1):0;
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
export function eraseObjects(objects,p,radius) {
  const output=[];
  for(const o of objects) {
    if(o.type!=='stroke') {if(!hitObject(o,p,radius))output.push(o);continue;}
    if(!hitObject(o,p,radius)){output.push(o);continue;}
    let segment=[];
    const flush=()=>{if(segment.length>1)output.push({...o,id:makeId(),points:segment});segment=[];};
    for(const point of o.points) {
      if(Math.hypot(point.x-p.x,point.y-p.y)<=radius+o.width/2)flush();
      else {if(segment.length&&segmentDistance(p,segment.at(-1),point)<=radius)flush();segment.push(point);}
    }
    flush();
  }
  return output;
}

export function contrastRatio(a,b) {
  const lum=hex=>{const v=hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2];};
  const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function visibleInk(value,style,forText=false) {
  const s=boardStyle(style);if(value==='auto')return s.ink;
  if(contrastRatio(value,s.background)>=(forText?4.5:3))return value;
  const rgb=value.slice(1).match(/../g).map(n=>parseInt(n,16)),target=contrastRatio('#ffffff',s.background)>contrastRatio('#142c48',s.background)?255:0;
  for(let t=.15;t<=1;t+=.1) {
    const c='#'+rgb.map(v=>Math.round(v+(target-v)*t).toString(16).padStart(2,'0')).join('');
    if(contrastRatio(c,s.background)>=(forText?4.5:3))return c;
  }
  return s.ink;
}

export const timerRemaining = (t,now=Date.now()) => t.status==='running'?clamp(t.deadline-now,0,24*3600000):t.remainingMs;
export function timerAction(t,action,now=Date.now(),value) {
  const remaining=timerRemaining(t,now);
  if(action==='set') {const ms=clamp(Number(value)||1000,1000,24*3600000);return {...t,durationMs:ms,remainingMs:ms,deadline:null,status:'idle'};}
  if(action==='start') {const ms=remaining||t.durationMs;return {...t,remainingMs:ms,deadline:now+ms,status:'running',runId:t.runId+1};}
  if(action==='pause')return {...t,remainingMs:remaining,deadline:null,status:remaining?'paused':'finished'};
  if(action==='reset')return {...t,remainingMs:t.durationMs,deadline:null,status:'idle'};
  if(action==='finish')return {...t,remainingMs:0,deadline:null,status:'finished'};
  if(action==='adjust') {
    const ms=clamp(remaining+(Number.isFinite(Number(value))?Number(value):0),0,24*3600000);
    return {...t,remainingMs:ms,deadline:t.status==='running'&&ms?now+ms:null,status:ms?(t.status==='finished'?'paused':t.status):'finished',durationMs:Math.max(t.durationMs,ms)};
  }
  return t;
}
export const formatTime = ms => {const n=Math.ceil(Math.max(0,ms)/1000),h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return `${h?`${String(h).padStart(2,'0')}:`:''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;};

export function numberPool(config) {
  let values;
  if(config.mode==='list') {
    const tokens=config.list.trim().split(/[\s,;]+/).filter(Boolean);
    if(!tokens.length)throw Error('Kamida bitta raqam kiriting.');
    if(tokens.some(t=>!/^[-+]?\d+$/.test(t)||!Number.isSafeInteger(Number(t))))throw Error('Ro‘yxatda faqat butun sonlar bo‘lsin.');
    values=tokens.map(Number);
  } else {
    const first=config.mode==='limit'?1:Number(config.start),last=Number(config.end);
    if(!String(config.end).trim()||(config.mode!=='limit'&&!String(config.start).trim())||!Number.isSafeInteger(first)||!Number.isSafeInteger(last)||first>last)throw Error('Boshlanish va tugash butun son bo‘lsin; boshlanish tugashdan oshmasin.');
    if(last-first+1>10000)throw Error('Bir ro‘yxatda ko‘pi bilan 10 000 ta raqam bo‘lishi mumkin.');
    values=Array.from({length:last-first+1},(_,i)=>first+i);
  }
  if(values.length>10000)throw Error('Ro‘yxat 10 000 ta raqamdan oshmasin.');
  const unique=[...new Set(values)].sort((a,b)=>a-b);
  return {values:unique,duplicates:values.length-unique.length,key:JSON.stringify(unique)};
}
// Rejection sampling removes modulo bias; every remaining position has equal probability.
export function randomIndex(size,crypto=globalThis.crypto) {
  if(!Number.isInteger(size)||size<1||size>10000)throw Error('Tanlash ro‘yxati noto‘g‘ri.');
  const upper=Math.floor(4294967296/size)*size,a=new Uint32Array(1);let n;
  do {crypto.getRandomValues(a);n=a[0];} while(n>=upper);
  return n%size;
}
export function chooseNumbers(config,crypto=globalThis.crypto,now=Date.now()) {
  const pool=numberPool(config),used=config.poolKey===pool.key?config.used:[],available=pool.values.filter(v=>!config.unique||!used.includes(v)),count=Number(config.count);
  if(!Number.isInteger(count)||count<1||count>100)throw Error('Bir tanlovda 1–100 ta raqam tanlang.');
  if(count>available.length)throw Error(`Faqat ${available.length} ta raqam qoldi. Miqdorni kamaytiring yoki ro‘yxatni tiklang.`);
  const selected=[];
  for(let i=0;i<count;i++){const n=randomIndex(available.length,crypto);selected.push(available[n]);available.splice(n,1);}
  return {...config,result:selected,used:config.unique?[...used,...selected]:[],poolKey:pool.key,history:[...config.history,{values:selected,at:now}].slice(-30)};
}
export const rmsLevel = samples => Math.sqrt(samples.reduce((sum,n)=>sum+n*n,0)/Math.max(1,samples.length));
export const relativeNoise = (rms,floorDb=-55,sensitivity=1) => clamp((20*Math.log10(Math.max(rms,1e-6))-floorDb+8)*1.8*sensitivity,0,100);
export const smoothNoise = (previous,current,elapsed=.08) => previous+(current-previous)*(1-Math.exp(-elapsed/.45));
export const noiseStatus = (level,threshold) => level>threshold?'Chegaradan oshdi':level>threshold*.72?'Ovoz ko‘tarilyapti':'Tinch';

export function taskObjects(kind,title,condition,image=null) {
  const height=(str,size)=>Math.max(1,str.split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/Math.floor(1400/(size*.6)))),0))*size*1.3;
  const t=(str,x,y,size=32)=>({id:makeId(),type:'text',x,y,w:1400,h:height(str,size),text:str,fontSize:size,color:'auto',width:2});
  const box=(x,y,w,h,dashed=false)=>({id:makeId(),type:'rectangle',x,y,w,h,color:'auto',width:2,dashed});
  const titleObject=t(title||'Doska topshirig‘i',80,50,40),conditionObject=t(condition||'Topshiriqni bajaring va yechimni izohlang.',80,50+titleObject.h+16,28);
  const top=Math.max(270,conditionObject.y+conditionObject.h+28),items=[titleObject,conditionObject];
  if(kind==='blanks')items.push(t('7 + ____ = 12        24 ÷ ____ = 6',100,top,42),t('Javob va izoh uchun joy',100,top+90,25),box(80,top+145,1440,Math.max(60,830-top-145),true));
  else if(kind==='table') {
    const x=100,y=top,w=1400,h=Math.min(420,830-top);
    for(let r=0;r<4;r++)for(let c=0;c<3;c++)items.push(box(x+c*w/3,y+r*h/4,w/3,h/4));
    items.push(...['Berilgan','Hisoblash','Natija'].map((label,i)=>({...t(label,x+i*w/3+20,y+24,30),w:w/3-40})));
  } else if(kind==='image'&&image){const fit=Math.min(1,1100/image.w,(830-top)/image.h);items.push({...image,id:makeId(),x:250,y:top,w:image.w*fit,h:image.h*fit});}
  else items.push(t('Yechim',100,top,28),box(80,top+60,1440,Math.max(60,830-top-60),true));
  return items;
}
