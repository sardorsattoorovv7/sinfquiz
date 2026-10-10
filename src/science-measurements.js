import {biologyResult} from './biology-model.js';
import {simulateBench} from './chemistry-bench-model.js';

// Curves sample the very same model as the scene, not a decorative animation.
export function scienceCurve(evaluate, end=1, count=31) {
 const limit=Number.isFinite(end)&&end>0?end:1;
 return Array.from({length:count},(_,i)=>{const x=limit*i/(count-1);return {x,values:evaluate(x).readings};});
}
export const biologyCurve=(scene,parameters)=>scienceCurve(q=>biologyResult(scene,parameters,q));
export const benchCurve=(parameters,duration)=>scienceCurve(elapsed=>simulateBench({...parameters,elapsed}),duration);
export function comparisonChanges(a,b) {
 return [...new Set([...Object.keys(a||{}),...Object.keys(b||{})])].filter(k=>JSON.stringify(a?.[k])!==JSON.stringify(b?.[k]));
}
export function csvCell(value){return '"'+String(value??'').replaceAll('"','""')+'"';}
export function curveCSV(points,metric,xLabel,{unit='',xUnit=''}={}){
 return '\uFEFF'+[`${csvCell(xLabel+(xUnit?' ('+xUnit+')':''))},${csvCell(metric+(unit?' ('+unit+')':''))}`,...points.map(p=>`${csvCell(xUnit==='%'?p.x*100:p.x)},${csvCell(p.values[metric])}`)].join('\r\n');
}
export function curveExtent(points,metric){
 const values=points.map(p=>p.values[metric]).filter(Number.isFinite);
 const lo=Math.min(0,...values),hi=Math.max(...values,lo+1e-6);
 return {lo,hi:hi===lo?lo+1:hi};
}
