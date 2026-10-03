import {benchById,benchEquipment} from './chemistry-bench-content.js';
import {cabbageColor} from './chemistry-lab-model.js';
import {bounded} from './atlas-experiment-math.js';
export const benchEquations={
 weakGas:{text:'CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂',left:[['C2H4O2',1],['NaHCO3',1]],right:[['C2H3O2Na',1],['H2O',1],['CO2',1]]},
 strongGas:{text:'HCl + NaHCO₃ → NaCl + H₂O + CO₂',left:[['HCl',1],['NaHCO3',1]],right:[['NaCl',1],['H2O',1],['CO2',1]]},
 neutral:{text:'HCl + NaOH → NaCl + H₂O',left:[['HCl',1],['NaOH',1]],right:[['NaCl',1],['H2O',1]]},
 weakNeutral:{text:'CH₃COOH + NaOH → CH₃COONa + H₂O',left:[['C2H4O2',1],['NaOH',1]],right:[['C2H3O2Na',1],['H2O',1]]},
 precipitate:{text:'CaCl₂ + Na₂CO₃ → CaCO₃↓ + 2NaCl',left:[['CaCl2',1],['Na2CO3',1]],right:[['CaCO3',1],['NaCl',2]]},
 rust:{text:'4Fe + 3O₂ → 2Fe₂O₃ (suvli zang tarkibi soddalashtirilgan)',left:[['Fe',4],['O2',3]],right:[['Fe2O3',2]]}
};
const atoms=side=>{const out={};side.forEach(([formula,count])=>{for(const m of formula.matchAll(/([A-Z][a-z]?)(\d*)/g))out[m[1]]=(out[m[1]]||0)+count*Number(m[2]||1)});return out};
export function atomBalance(eq){const left=atoms(eq.left),right=atoms(eq.right),keys=[...new Set([...Object.keys(left),...Object.keys(right)])];return {left,right,balanced:keys.every(k=>left[k]===right[k])}}
export function strongPH(delta){const root=Math.sqrt(delta*delta+4e-14),H=delta>=0?(delta+root)/2:2e-14/(root-delta);return -Math.log10(H)}
export function acetatePH(total,delta){if(!total)return strongPH(delta);let low=-14,high=0;for(let i=0;i<100;i++){const mid=(low+high)/2,H=10**mid,charge=H-1e-14/H-total*1.8e-5/(1.8e-5+H)-delta;if(charge>0)high=mid;else low=mid}return -(low+high)/2}
export function simulateBench(supplied={}){
 const p={equipment:benchEquipment.some(e=>e.id===supplied.equipment)?supplied.equipment:'beaker',temperature:bounded(supplied.temperature,-20,110,25),elapsed:bounded(supplied.elapsed,0,600,0),stir:supplied.stir===true,evaporated:bounded(supplied.evaporated,0,95,0),filtered:supplied.filtered===true,oxygen:supplied.oxygen!==false,rustDays:bounded(supplied.rustDays,0,30,7),additions:(Array.isArray(supplied.additions)?supplied.additions:[]).filter(a=>benchById[a.substance]).slice(0,20).map(a=>({substance:a.substance,amount:bounded(a.amount,0,benchById[a.substance].unit==='g'?40:benchById[a.substance].unit==='tomchi'?15:180,0),concentration:bounded(a.concentration,.01,.5,.1),at:bounded(a.at,0,600,0)}))};
 const state={strong:0,base:0,weak:0,soda:0,acetate:0,ca:0,carbonate:0,gas:0,precip:0,water:0,oil:0,salt:0,sugar:0,sand:0,soap:0,iron:0,indicator:0},events=[],all=p.additions.filter(a=>a.at<=p.elapsed);let dissolveAt=0;
 const react=(id,n,at)=>{if(n<=0)return;events.push({id,moles:n,at});};
 for(const a of all){const n=a.concentration*a.amount/1000,id=a.substance;
  if(['water','hcl','naoh','vinegar','cacl2','carbonate'].includes(id))state.water+=a.amount;
  if(id==='hcl')state.strong+=n;else if(id==='naoh')state.base+=n;else if(id==='vinegar')state.weak+=n;else if(id==='soda')state.soda+=a.amount/84.0066;else if(id==='cacl2')state.ca+=n;else if(id==='carbonate')state.carbonate+=n;else if(id!=='water')state[id]+=a.amount;
  if(['salt','sugar'].includes(id))dissolveAt=a.at;
  let q=Math.min(state.strong,state.base);state.strong-=q;state.base-=q;react('neutral',q,a.at);
  q=Math.min(state.weak,state.base);state.weak-=q;state.base-=q;state.acetate+=q;react('weakNeutral',q,a.at);
  q=Math.min(state.strong,state.soda);state.strong-=q;state.soda-=q;state.gas+=q;react('strongGas',q,a.at);
  q=Math.min(state.weak,state.soda);state.weak-=q;state.soda-=q;state.acetate+=q;state.gas+=q;react('weakGas',q,a.at);
  q=Math.min(state.ca,state.carbonate);state.ca-=q;state.carbonate-=q;state.precip+=q;react('precipitate',q,a.at);
 }
 const solvent=state.water*(p.equipment==='dish'?1-p.evaporated/100:1),volume=solvent+state.oil,capacity=benchEquipment.find(e=>e.id===p.equipment).capacity,gasMoles=events.filter(e=>e.id==='strongGas'||e.id==='weakGas').reduce((sum,e)=>sum+e.moles*(1-Math.exp(-Math.max(0,p.elapsed-e.at)/18*2**((p.temperature-25)/10)*(p.stir?1.5:1))),0),gasMl=gasMoles*8.314462618*(p.temperature+273.15)/101325*1e6,
 dissolve=1-Math.exp(-Math.max(0,p.elapsed-dissolveAt)/12*(p.stir?2:1)),saltLimit=solvent*.359,sugarLimit=solvent*2.04,dissolvedSalt=Math.min(state.salt,saltLimit)*dissolve,dissolvedSugar=Math.min(state.sugar,sugarLimit)*dissolve,residue=state.salt-dissolvedSalt+state.sugar-dissolvedSugar+state.sand+state.precip*100.0869;
 const L=Math.max(.00001,solvent/1000),unknownPH=state.soda>1e-12||state.carbonate>1e-12||state.gas>0||state.soap>0||state.iron>0||state.precip>0,pH=solvent<=0||unknownPH?null:acetatePH((state.weak+state.acetate)/L,(state.strong-state.base-state.acetate)/L),colour=state.indicator&&pH!==null?cabbageColor(pH):'#83c8d9';
 const rustFraction=state.iron>0&&solvent>0&&p.oxygen?1-Math.exp(-p.rustDays*.08*(1+Math.min(3,dissolvedSalt/5))*2**((p.temperature-25)/30)):0,rustMass=state.iron*rustFraction,conductivity=solvent>0?Math.min(1,(dissolvedSalt/58.44+events.filter(e=>e.id==='neutral'||e.id==='strongGas'||e.id==='precipitate').reduce((sum,e)=>sum+e.moles*(e.id==='precipitate'?2:1),0)+state.strong+state.base+state.acetate+state.ca+state.carbonate)*20):0,foamMl=gasMl*(.12+Math.min(1,state.soap/6)*1.4),overflow=Math.max(0,volume+foamMl-capacity),phase=!all.length?'namuna yo‘q':all.every(a=>a.substance==='water')?(p.temperature<0?'muz':p.temperature>=100?'bug‘':'suyuqlik'):solvent>0?'suvli aralashma':'aralashma';
 const notes=['Erish chegaralari 20 °C dagi NaCl va taxminiy saxaroza uchun; harorat eruvchanlikning to‘liq jadvalini almashtirmaydi.','pH muvozanati ideal 25 °C doimiysi bilan. Gaz, soda, karbonat, sovun, temir yoki cho‘kma borida to‘liq pH modeli yo‘q.','Gaz nRT/P bo‘yicha 1 atm da; vaqt bo‘yicha o‘sish, ko‘pik, zang va o‘tkazuvchanlik — sabab-oqibat sifat modellari.'];
 if(all.some(a=>a.substance!=='water'))notes.push('Faza chegaralari faqat sof suv uchun. Eritmalar muzlash va qaynash chegaralari bu modelda hisoblanmaydi.');
 if(all.some(a=>a.substance==='iron')&&all.some(a=>['hcl','vinegar'].includes(a.substance)))notes.push('Metall–kislota kombinatsiyasi bu modelda hisoblanmaydi; unga tasodifiy gaz chiqarilmaydi.');
 if((state.carbonate>0||state.precip>0)&&(state.strong>0||state.weak>0))notes.push('Kislota–karbonat yo‘li uchun ma’lumot yo‘q; ko‘rsatilgan natija bu kombinatsiyani tasdiqlamaydi.');
 if(!events.length)notes.push('Modeldagi kimyoviy reaksiya kuzatilmadi. Erish, qatlamlanish yoki faza o‘zgarishi fizik jarayon bo‘lishi mumkin.');
 return {parameters:p,events,water:solvent,volume,capacity,oil:state.oil,sand:state.sand,dissolvedSalt,dissolvedSugar,residue,filtered:p.filtered&&p.equipment==='funnel',gasTargetMoles:state.gas,gasMoles,gasMl,foamMl,overflow,pH,colour,phase,rustFraction,rustMass,conductivity,indicator:state.indicator,notes,readings:{'Suyuqlik hajmi (ml)':volume,'CO₂ (ml)':gasMl,'Erigan NaCl (g)':dissolvedSalt,'Qattiq qoldiq (g)':residue,'Ko‘pik (model ml)':foamMl,'O‘tkazuvchanlik (0–1)':conductivity,'Zanglash (0–1)':rustFraction}};
}
export function missionComplete(id,result,trials){
 const list=trials.filter((t,i,a)=>a.findIndex(v=>JSON.stringify(v.parameters)===JSON.stringify(t.parameters))===i),all=list.map(t=>simulateBench(t.parameters));
 if(id==='free')return result.parameters.additions.length>0;
 if(id==='volcano')return all.filter(r=>r.parameters.equipment==='volcano'&&r.gasMoles>0).length>=2;
 if(id==='gas')return all.filter(r=>r.gasMoles>0).length>=2;
 if(id==='ph')return all.some(r=>r.indicator&&r.pH!==null&&r.pH<7)&&all.some(r=>r.indicator&&r.pH!==null&&r.pH>7);
 if(id==='neutral')return all.some(r=>r.events.some(e=>e.id==='neutral')&&Math.abs(r.pH-7)<.01)&&all.some(r=>r.pH!==null&&Math.abs(r.pH-7)>.5);
 if(id==='solubility')return all.filter(r=>r.dissolvedSalt>0&&r.residue>0).length>=2;
 if(id==='crystals')return all.some(r=>r.parameters.equipment==='dish'&&r.parameters.evaporated>0&&r.residue>0&&r.parameters.additions.some(a=>a.substance==='salt'));
 if(id==='filter')return all.some(r=>r.filtered&&r.sand>0&&r.dissolvedSalt>0);
 if(id==='density')return all.filter(r=>r.water>0&&r.oil>0).length>=2;
 if(id==='phase')return ['muz','suyuqlik','bug‘'].every(phase=>all.some(r=>r.phase===phase&&r.parameters.additions.length&&r.parameters.additions.every(a=>a.substance==='water')));
 if(id==='rate')return all.some((a,i)=>all.some((b,j)=>i!==j&&a.gasMoles>0&&b.gasMoles>0&&a.parameters.temperature!==b.parameters.temperature&&a.parameters.elapsed===b.parameters.elapsed&&a.parameters.stir===b.parameters.stir&&JSON.stringify(a.parameters.additions)===JSON.stringify(b.parameters.additions)));
 if(id==='rust')return all.some(r=>r.rustFraction>0)&&all.some(r=>r.rustFraction===0&&r.parameters.additions.some(a=>a.substance==='iron'));
 if(id==='conductivity')return all.some(r=>r.parameters.equipment==='electrodes'&&r.dissolvedSalt>0)&&all.some(r=>r.parameters.equipment==='electrodes'&&r.dissolvedSugar>0&&!r.dissolvedSalt);
 return false;
}
