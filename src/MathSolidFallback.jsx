import React from 'react';
import {sectionMeasures} from './math-solid-models.js';

const blue='#087f83', ink='#183b59', gold='#ed9055';
const f=n=>Number(n.toFixed(3));
export function sectionData(p){return sectionMeasures(p)}

// Original vector models. Every unfolded face uses the supplied lengths.
export default function MathSolidFallback({kind,a,b,h,r,open,yaw,section,sectionAt,onPart}){
 const faces=[],rect=(x,y,w,h,name)=>faces.push({name,type:'rect',x,y,w,h}),poly=(points,name)=>faces.push({name,type:'poly',points});
 const height=kind==='cube'?a:h,depth=kind==='cube'?a:b,l=Math.hypot(r,h);
 if(kind==='cube'||kind==='cuboid'){
  rect(0,0,a,depth,'Asos');rect(0,-height,a,height,'Orqa yoq');rect(0,-height-depth,a,depth,'Yuqori yoq');rect(0,depth,a,height,'Old yoq');rect(-height,0,height,depth,'Chap yoq');rect(a,0,height,depth,'O‘ng yoq');
 }else if(kind==='prism'){
  const c=Math.hypot(a,b);rect(0,0,a,h,'Birinchi yon yoq');rect(a,0,c,h,'Ikkinchi yon yoq');rect(a+c,0,b,h,'Uchinchi yon yoq');poly([[0,0],[a,0],[0,-b]],'Yuqori uchburchak');poly([[0,h],[a,h],[0,h+b]],'Pastki uchburchak');
 }else if(kind==='pyramid'){
  const slope=Math.hypot(h,a/2);rect(0,0,a,a,'Kvadrat asos');poly([[0,0],[a,0],[a/2,-slope]],'Orqa uchburchak');poly([[a,0],[a,a],[a+slope,a/2]],'O‘ng uchburchak');poly([[0,a],[a,a],[a/2,a+slope]],'Old uchburchak');poly([[0,0],[0,a],[-slope,a/2]],'Chap uchburchak');
 }
 const all=faces.flatMap(s=>s.type==='rect'?[[s.x,s.y],[s.x+s.w,s.y+s.h]]:s.points),xmin=Math.min(0,...all.map(p=>p[0])),xmax=Math.max(1,...all.map(p=>p[0])),ymin=Math.min(0,...all.map(p=>p[1])),ymax=Math.max(1,...all.map(p=>p[1])),scale=Math.min(365/(xmax-xmin),174/(ymax-ymin)),nx=x=>220+(x-(xmin+xmax)/2)*scale,ny=y=>120+(y-(ymin+ymax)/2)*scale;
 const part=(name)=>({role:'button',tabIndex:0,'aria-label':name,onClick:()=>onPart(name),onKeyDown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onPart(name)}}});
 const cut=sectionMeasures({kind,a,b,h,r,sectionAt}),net=open>0,cutUnit=Math.min(190/Math.max(a,.001),142/Math.max(b,.001)),cutWidth=kind==='cuboid'?a*cutUnit:160,cutHeight=kind==='cuboid'?b*cutUnit:160;
 return <div className="ma-stage"><svg viewBox="0 0 440 250" role="group" aria-label={`${kind}: ${section?'ko‘ndalang kesim':net?'aniq o‘lchamli yoyilma':'hajmli chizma'}.`}>
  {section?<g>{['sphere','cylinder','cone'].includes(kind)?<circle cx="220" cy="120" r="76" fill="#ffd8b7" stroke={gold} strokeWidth="3" {...part('Doira kesimi')}/>:kind==='prism'?<polygon points="125,187 315,187 125,45" fill="#ffd8b7" stroke={gold} strokeWidth="3" {...part('Uchburchak kesimi')}/>:<rect x={220-cutWidth/2} y={120-cutHeight/2} width={cutWidth} height={cutHeight} fill="#ffd8b7" stroke={gold} strokeWidth="3" {...part('To‘rtburchak kesimi')}/>}<text x="220" y="228" textAnchor="middle">Kesim yuzi = {f(cut.area)} kvadrat birlik</text></g>:
   net?kind==='sphere'?<><circle cx="220" cy="115" r="82" fill="#d3f0ed" stroke={blue} strokeWidth="3" {...part('Shar sirti')}/><text x="220" y="225" textAnchor="middle">Shar sirtining cho‘zilmaydigan tekis yoyilmasi yo‘q.</text></>:
    kind==='cylinder'?<CylinderNet r={r} h={h} part={part}/>:
    kind==='cone'?<ConeNet r={r} l={l} part={part}/>:
    <>{faces.map((s,i)=>s.type==='rect'?<rect key={i} x={nx(s.x)} y={ny(s.y)} width={s.w*scale} height={s.h*scale} fill={i%2?'#d3f0ed':'#c4e7e0'} stroke={blue} strokeWidth="2" {...part(s.name)}/>:<polygon key={i} points={s.points.map(([x,y])=>`${nx(x)},${ny(y)}`).join(' ')} fill="#c4e7e0" stroke={blue} strokeWidth="2" {...part(s.name)}/>)}<text x="220" y="230" textAnchor="middle">Yoqni tanlang. Yoyilma o‘lchamlari jismga mos.</text></>:
    <Closed kind={kind} a={a} b={b} h={h} r={r} yaw={yaw} part={part}/>}
 </svg></div>;
}
function CylinderNet({r,h,part}){
 const unit=Math.min(340/(2*Math.PI*r),178/(h+4*r)),R=r*unit,H=h*unit,W=2*Math.PI*r*unit,x=220-W/2,y=27+2*R;
 return <><rect x={x} y={y} width={W} height={H} fill="#d3f0ed" stroke={blue} strokeWidth="2" {...part('Yon sirt: to‘g‘ri to‘rtburchak')}/>{[-1,1].map(sign=><circle key={sign} cx="220" cy={sign===-1?y-R:y+H+R} r={R} fill="#e7f3ed" stroke={blue} strokeWidth="2" {...part(sign===1?'Ikkinchi doira asos':'Birinchi doira asos')}/>)}<text x="220" y="238" textAnchor="middle">Yon sirt: 2πr × h; ikki doira asos</text></>;
}
function ConeNet({r,l,part}){
 const angle=2*Math.PI*r/l,R=86,start=-angle/2,end=angle/2,x1=150+R*Math.sin(start),y1=112+R*Math.cos(start),x2=150+R*Math.sin(end),y2=112+R*Math.cos(end);
 return <><path d={`M150 112L${x1} ${y1}A${R} ${R} 0 ${angle>Math.PI?1:0} 0 ${x2} ${y2}Z`} fill="#d3f0ed" stroke={blue} strokeWidth="2" {...part('Yon sirt: doira sektori')}/><circle cx="330" cy="120" r={R*r/l} fill="#d3f0ed" stroke={blue} strokeWidth="2" {...part('Doira asos')}/><text x="220" y="230" textAnchor="middle">Sektor radiusi l = {f(l)}; burchagi {f(360*r/l)}°</text></>;
}
function Closed({kind,a,b,h,r,yaw,part}){
 if(kind==='sphere')return <><circle cx="220" cy="118" r="86" fill="#d3f0ed" stroke={blue} strokeWidth="3" {...part('Shar sirti')}/><ellipse cx="220" cy="118" rx="86" ry="25" fill="none" stroke={blue}/><path d="M220 118h86" stroke={gold}/><text x="252" y="109">r = {r}</text></>;
 if(kind==='cylinder'||kind==='cone')return <><ellipse cx="220" cy="184" rx="84" ry="25" fill="#c4e7e0" stroke={blue} {...part('Doira asos')}/>{kind==='cone'?<path d="M136 184L220 35 304 184" fill="#d3f0ed" stroke={blue} strokeWidth="3" {...part('Konus yon sirti')}/>:<><path d="M136 53v131M304 53v131" stroke={blue} strokeWidth="3"/><ellipse cx="220" cy="53" rx="84" ry="25" fill="#d3f0ed" stroke={blue} {...part('Yuqori doira')}/></>}<text x="325" y="120">h = {h}</text><text x="220" y="233" textAnchor="middle">r = {r}</text></>;
 if(kind==='pyramid')return <><polygon points="100,173 220,213 342,164 215,129" fill="#c4e7e0" stroke={blue} {...part('Kvadrat asos')}/><path d="M100 173L220 32 342 164 220 213Z" fill="#d3f0ed" stroke={blue} strokeWidth="3" {...part('Uchburchak yon yoqlar')}/><path d="M220 32v139" stroke={gold} strokeDasharray="5 4"/><text x="230" y="110">h = {h}</text><text x="220" y="240" textAnchor="middle">a = {a}</text></>;
 if(kind==='prism')return <><polygon points="90,187 226,187 90,57" fill="#d3f0ed" stroke={blue} {...part('To‘g‘ri uchburchak asos')}/><polygon points="90,57 188,28 324,158 226,187" fill="#b4ded8" stroke={blue} {...part('Yon yoq')}/><polygon points="226,187 324,158 188,158 90,187" fill="#7fc6bd" stroke={blue}/><text x="130" y="215">a = {a}</text><text x="37" y="123">b = {b}</text><text x="294" y="90">h = {h}</text></>;
 const lengths=kind==='cube'?[a,a,a]:[a,h,b],theta=yaw*Math.PI/180,verts=[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>({x,y,z})))),project=p=>[220+(p.x*lengths[0]*Math.cos(theta)+p.z*lengths[2]*Math.sin(theta))*12,120-p.y*lengths[1]*15+(p.x*lengths[0]*Math.sin(theta)-p.z*lengths[2]*Math.cos(theta))*6],faces=[[1,3,7,5],[4,5,7,6],[2,3,7,6]];
 return <>{faces.map((indices,i)=><polygon key={i} points={indices.map(j=>project(verts[j]).join(',')).join(' ')} fill={['#d3f0ed','#7fc6bd','#b4ded8'][i]} stroke={ink} strokeWidth="2" {...part(['Old yoq','Yon yoq','Yuqori yoq'][i])}/>)}<text x="220" y="238" textAnchor="middle">a = {a}{kind==='cuboid'?`; b = ${b}; h = ${h}`:''}</text></>;
}
