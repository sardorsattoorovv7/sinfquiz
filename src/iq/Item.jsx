import React from 'react';
const shapeNames=['doira','uchburchak','kvadrat','romb'],directions=['tepaga','o‘ngga','pastga','chapga'];
export function visualText(v){
 if(!v)return '';
 if(v.kind==='sequence')return `Ketma-ketlik: ${v.values.join(', ')}, so‘roq.`;
 if(v.kind==='arrows')return `Strelkalar: ${v.values.map(x=>directions[x]).join(', ')}; keyingisi noma’lum.`;
 if(v.kind==='matrix')return v.cells.map((x,i)=>`${Math.floor(i/3)+1}-qator ${i%3+1}-katak: ${x===null?'noma’lum':v.cellKind==='dots'?x+' nuqta':v.cellKind==='shape'?shapeNames[x]:`to‘rt katakda yuqori chap, yuqori o‘ng, pastki chap, pastki o‘ng bo‘yicha ${[0,1,2,3].map(k=>x&(1<<k)?'bor':'yo‘q').join(', ')}`}`).join('; ');
 if(v.kind==='gridShape')return `3 ga 3 to‘r. Belgilangan kataklar (ustun, qator): ${v.points.map(([x,y])=>`${x+1},${y+1}`).join('; ')}. ${v.axis?'Ko‘zgu o‘qi o‘rtadan tik o‘tadi.':''}`;
 if(v.kind==='sets'){const [a,b,c]=v.labels||['X','Y','Z'];return `${a} to‘plami ${b} ichida, ${b} esa ${c} ichida. ${v.legend?v.legend.map((n,i)=>`${v.labels[i]}: ${n}`).join('; '):''}`} return '';
}
function Symbol({kind,value}){
 if(value===null)return <text x="50" y="58" textAnchor="middle" className="iq-question-mark">?</text>;
 if(kind==='dots')return <g>{Array.from({length:value},(_,i)=><circle key={i} cx={26+i%4*16} cy={29+Math.floor(i/4)*18} r="5" fill="currentColor"/>)}</g>;
 if(kind==='shape')return value===0?<circle cx="50" cy="50" r="24" fill="none" stroke="currentColor" strokeWidth="3"/>:value===1?<path d="M50 23L77 72H23Z" fill="none" stroke="currentColor" strokeWidth="3"/>:value===2?<rect x="26" y="26" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="3"/>:<path d="M50 20L80 50 50 80 20 50Z" fill="none" stroke="currentColor" strokeWidth="3"/>;
 if(kind==='tiles')return <g>{[0,1,2,3].map(i=><rect key={i} x={23+i%2*28} y={23+Math.floor(i/2)*28} width="24" height="24" fill={value&(1<<i)?'currentColor':'none'} stroke="currentColor" strokeWidth="1"/>)}</g>;
 if(kind==='arrow')return <g transform={`rotate(${value*90},50,50)`}><path d="M50 76V23M32 42L50 23 68 42" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></g>;
 return <g>{Array.from({length:9},(_,i)=>{const x=i%3,y=Math.floor(i/3);return <rect key={i} x={14+x*25} y={14+y*25} width="23" height="23" fill={value.some(p=>p[0]===x&&p[1]===y)?'currentColor':'none'} stroke="currentColor" strokeWidth="1"/>})}</g>;
}
export function ItemVisual({visual}){
 if(!visual||visual.kind==='text')return null;const v=visual;
 if(v.kind==='sets')return <div className="iq-set-model"><svg viewBox="0 0 400 220" role="img" aria-label={visualText(v)}><ellipse cx="200" cy="112" rx="165" ry="97" className="iq-set"/><ellipse cx="174" cy="125" rx="110" ry="72" className="iq-set"/><ellipse cx="150" cy="143" rx="55" ry="40" className="iq-set"/>{[...(v.labels||['X','Y','Z'])].reverse().map((x,i)=><text key={x} x={200-i*25} y={42+i*50} textAnchor="middle" fill="currentColor">{x}</text>)}</svg>{v.legend&&<p>{v.legend.map((n,i)=>`${v.labels[i]}: ${n}`).join(' · ')}</p>}</div>;
 if(v.kind==='matrix')return <svg viewBox="0 0 324 324" role="img" aria-label={visualText(v)}>{v.cells.map((x,i)=><g key={i} transform={`translate(${i%3*108},${Math.floor(i/3)*108})`}><rect x="3" y="3" width="100" height="100" rx="13" className={x===null?'iq-empty-cell':'iq-cell'}/><Symbol kind={v.cellKind} value={x}/></g>)}</svg>;
 if(v.kind==='gridShape')return <svg viewBox="0 0 100 100" role="img" aria-label={visualText(v)}><Symbol kind="grid" value={v.points}/>{v.axis&&<path d="M50 4V96" stroke="currentColor" strokeDasharray="3 3"/>}</svg>;
 return <div className="iq-sequence" role="img" aria-label={visualText(v)}>{v.values.map((n,i)=>v.kind==='arrows'?<svg viewBox="0 0 100 100" key={i} aria-hidden="true"><Symbol kind="arrow" value={n}/></svg>:<span key={i}>{n}</span>)}<span className="iq-last">?</span></div>;
}
export function ChoiceVisual({item,value}){
 const kind=item.visual?.kind==='matrix'?item.visual.cellKind:item.visual?.kind==='gridShape'?'grid':item.visual?.kind==='arrows'?'arrow':null;
 if(!kind)return <span>{String(value)}</span>;let label=kind==='shape'?shapeNames[value]:kind==='arrow'?directions[value]:kind==='dots'?`${value} nuqta`:kind==='grid'?visualText({kind:'gridShape',points:value}):visualText({kind:'matrix',cellKind:'tiles',cells:[value]});
 return <svg viewBox="0 0 100 100" role="img" aria-label={label}><Symbol kind={kind} value={value}/></svg>;
}
