import React from 'react';

const f=n=>Number(n.toFixed(3));
export default function MathRelationViews({formula,rows,xLabel='x',yLabel='y',currentX,fn,discrete=false}){
 const xs=rows.map(r=>r[0]),ys=rows.map(r=>r[1]),lo=Math.min(0,...ys),hi=Math.max(1,...ys),xmin=Math.min(...xs),xmax=Math.max(...xs),px=x=>42+(x-xmin)/(xmax-xmin||1)*338,py=y=>202-(y-lo)/(hi-lo)*170;
 const points=discrete?rows:Array.from({length:121},(_,i)=>{const x=xmin+(xmax-xmin)*i/120;return [x,fn(x)]});
 return <section className="ma-linked" aria-label="Ifoda, jadval va grafik">
  <div><span>Ifoda</span><b>{formula}</b>{currentX!==undefined&&<small>{xLabel} = {f(currentX)} → {f(fn(currentX))}</small>}</div>
  <div className="ma-linked-table"><table><caption>Bir xil bog‘lanishning qiymatlari</caption><tbody><tr><th scope="row">{xLabel}</th>{rows.map(([x],i)=><td key={i}>{f(x)}</td>)}</tr><tr><th scope="row">{yLabel}</th>{rows.map(([,y],i)=><td key={i}>{f(y)}</td>)}</tr></tbody></table></div>
  <svg viewBox="0 0 440 250" role="img" aria-label={`${formula} grafigi. Gorizontal: ${xLabel}; vertikal: ${yLabel}.`}>
   <path d="M42 25v177h352" stroke="#9bb3c1"/>
   {[lo,(lo+hi)/2,hi].map((y,i)=><g key={i}><path d={`M42 ${py(y)}h338`} stroke="#dce8ef"/><text x="37" y={py(y)+4} textAnchor="end" fontSize="10">{f(y)}</text></g>)}
   <polyline points={points.map(([x,y])=>`${px(x)},${py(y)}`).join(' ')} fill="none" stroke="#087f83" strokeWidth="3" strokeDasharray={discrete?'4 5':undefined}/>
   {rows.map(([x,y],i)=><g key={i}><circle cx={px(x)} cy={py(y)} r={x===currentX?7:4} fill={x===currentX?'#ed9055':'#087f83'}/><text x={px(x)} y="220" fontSize="10" textAnchor="middle">{f(x)}</text></g>)}
   {currentX!==undefined&&!xs.includes(currentX)&&<circle cx={px(currentX)} cy={py(fn(currentX))} r="7" fill="#ed9055"/>}
   <text x="390" y="218" fontSize="12">{xLabel}</text><text x="47" y="17" fontSize="12">{yLabel}</text>
  </svg>
  {discrete&&<small>Hadlar butun tartib raqamlarida berilgan. Uzilgan chiziq yo‘nalishni ko‘rsatadi.</small>}
 </section>;
}
