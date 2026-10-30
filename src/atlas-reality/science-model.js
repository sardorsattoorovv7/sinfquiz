import {mathRealitySpec,mathRealityResult} from './math-model.js';
import {biologyScenes} from '../biology-content.js';
import {biologyDefaults,biologyResult} from '../biology-model.js';
import {chemistryLabById} from '../chemistry-labs.js';
import {labParameters,labResult} from '../chemistry-lab-model.js';
import {atomIdentity,molecules,reactions,balanceReaction,neutralPH,rateFactor,solubility,waterPhase} from '../chemistry-model.js';
import {elements} from '../chemistry-elements.js';
import {defaultParameters} from '../space/content.js';
import {observation} from '../space/model.js';
const num=(key,label,initial,min,max,unit='',step=1)=>({key,label,initial,min,max,unit,step});
const select=(key,label,initial,options)=>({key,label,initial,options,type:'enum'});
const chemicalControls={
 atom:[num('protons','Protonlar',8,1,20),num('neutrons','Neytronlar',8,0,35),num('electrons','Elektronlar',8,0,20)],
 periodic:[num('z','Element tartib raqami',8,1,118)],
 molecule:[select('molecule','Molekula','water',Object.entries(molecules).map(([k,v])=>[k,`${v.name} · ${v.formula}`]))],
 bonds:[select('bond','Bog‘ turi','ionic',[['ionic','NaCl ion kristalli'],['covalent','H₂O kovalent molekulasi'],['metal','Metall panjara']])],
 states:[num('temperature','Harorat',20,-20,120,' °C',5)],
 reaction:[num('hydrogen','H₂ koeffitsiyenti',1,1,4),num('oxygen','O₂ koeffitsiyenti',1,1,4),num('water','H₂O koeffitsiyenti',1,1,4)],
 ph:[num('acid','Kuchli kislota',5,0,10,' mmol',.5),num('base','Kuchli asos',3,0,10,' mmol',.5)],
 rate:[num('temperature','Harorat',25,5,80,' °C',5),num('concentration','Nisbiy konsentratsiya',1,.5,3,'',.5),select('catalyst','Katalizator','no',[['no','Yo‘q'],['yes','Bor']])],
 mixture:[num('salt','Tuz',40,0,60,' g'),num('water','Suv',100,50,200,' g',10)],
 organic:[select('molecule','Uglerodli molekula','methane',Object.entries(molecules).filter(([,v])=>v.atoms.some(a=>a[0]==='C')).map(([k,v])=>[k,`${v.name} · ${v.formula}`]))],
 electric:[select('circuit','Zanjir','open',[['open','Ochiq'],['closed','Yopiq']])],
 life:[num('temperature','Suv harorati',-10,-20,120,' °C',5)],
};
export function realitySpec(subject,topic){
 if(subject==='math')return {...mathRealitySpec(topic),subject};
 if(subject==='biology'){const controls=biologyScenes[topic.scene]?.controls||[];return {subject,kind:topic.scene,controls,defaults:biologyDefaults(topic.scene,topic.parameters)};}
 if(subject==='space')return {subject,kind:topic.family,controls:topic.controls.map(c=>({...c,initial:c.value})),defaults:defaultParameters(topic)};
 const lab=chemistryLabById[topic.scene],controls=lab?.controls||chemicalControls[topic.scene];
 if(!controls)throw Error(`Amaliy muhit topilmadi: ${subject}/${topic.id}`);
 return {subject,kind:topic.scene,controls,defaults:lab?labParameters(topic.scene,topic.parameters):Object.fromEntries(controls.map(c=>[c.key,c.initial]))};
}
export function safeRealityParameters(spec,raw={}){
 const p={...spec.defaults};for(const c of spec.controls){const v=raw[c.key];if(c.options){const options=c.options.map(o=>Array.isArray(o)?o[0]:o.value);if(options.includes(v))p[c.key]=v;}else if(Number.isFinite(Number(v))){const min=c.min??0,max=c.max??100,step=c.step||1;p[c.key]=Math.max(min,Math.min(max,min+Math.round((Number(v)-min)/step)*step));}}
 return p;
}
const m=(label,value,unit='')=>({label,value,unit});
export function realityResult(subject,topic,p,q=1){
 if(subject==='math')return mathRealityResult(topic,p,q);
 if(subject==='biology'){const r=biologyResult(topic.scene,p,q);return {metrics:Object.entries(r.readings).map(([k,v])=>m(k,v,r.unit||'')),explanation:r.cause,raw:r};}
 if(subject==='space'){const r=observation(topic,p,q);return {...r,explanation:r.why};}
 if(chemistryLabById[topic.scene]){const r=labResult(topic.scene,p,q),scene=topic.scene;
  const unit=k=>k==='pH'?'':scene==='lab-volcano'||scene==='lab-balloon'?(k==='Gaz hajmi'?'ml':'mmol'):scene==='lab-neutralisation'?'mmol':scene==='lab-density'?(k==='Moy massasi'?'g':'ml'):scene==='lab-conductivity'?(k==='Shakar konsentratsiyasi'?'g/100 ml':'indeks'):scene==='lab-corrosion'?(k==='Shartli korroziya indeksi'?'indeks':'%'):r.unit;
  return {metrics:Object.entries(r.values).map(([k,v])=>m(k,v,unit(k))),explanation:r.explanation,raw:r};}
 switch(topic.scene){
  case 'atom':{const r=atomIdentity(p.protons,p.neutrons,p.electrons);return {metrics:[m('Element',r.element.symbol),m('Massa soni',r.mass),m('Ion zaryadi',r.charge)],formula:'Z = p; A = p+n; zaryad = p−e',explanation:'Elementni protonlar soni belgilaydi; neytron izotopni, elektron esa zaryadni o‘zgartiradi.'};}
  case 'periodic':{const e=elements[p.z-1];return {metrics:[m('Element',e.symbol),m('Davr',e.period),m('Guruh',e.group??'f-blok')],explanation:e.life};}
  case 'molecule':case 'organic':{const r=molecules[p.molecule];return {metrics:[m('Formula',r.formula),m('Atomlar',r.atoms.length),m('Bog‘lar juftligi',r.bonds.length)],explanation:r.shape};}
  case 'bonds':return {metrics:[m('Namuna',{ionic:'NaCl',covalent:'H₂O',metal:'Metall'}[p.bond])],explanation:{ionic:'Na⁺ va Cl⁻ orasidagi tortishuv kristall panjarani bog‘laydi. Alohida NaCl molekulalari deb tasvirlanmaydi.',covalent:'H₂O ichidagi O–H bog‘larida elektronlar umumlashadi. Molekulalararo kuchlar bundan boshqa tushuncha.',metal:'Metall bog‘lanish modeli: musbat ion yadrolari va delokallashgan elektronlar.'}[p.bond]};
  case 'states':case 'life':return {metrics:[m('Harorat',p.temperature,'°C'),m('Suv holati',waterPhase(p.temperature))],formula:'1 atm bosimdagi ideal faza chegaralari: 0 °C va 100 °C',explanation:'Muz, suv va bug‘da kimyoviy formula H₂O saqlanadi. 0 va 100 °C da fazalar birga mavjud bo‘lishi mumkin.'};
  case 'reaction':{const r=balanceReaction(reactions[0],[p.hydrogen,p.oxygen,p.water]);return {metrics:r.keys.flatMap(k=>[m(`${k}: kirish`,r.left[k]),m(`${k}: chiqish`,r.right[k])]),formula:`${p.hydrogen}H₂ + ${p.oxygen}O₂ → ${p.water}H₂O`,explanation:r.balanced?'Atomlar soni ikki tomonda teng: tenglama balanslangan.':'Atomlar soni mos emas. Indekslarni emas, koeffitsiyentlarni o‘zgartiring.'};}
  case 'ph':return {metrics:[m('Yakuniy pH',neutralPH(p.acid,p.base)),m('Kislota − asos',p.acid-p.base,'mmol')],formula:'Kuchli bir protonli kislota/asos; 100 ml; 25 °C',explanation:'pH qiymatlarini o‘rtachalash mumkin emas; ortiqcha H₃O⁺ yoki OH⁻ va suv muvozanati hisoblanadi.'};
  case 'rate':return {metrics:[m('Nisbiy tezlik',rateFactor(p.temperature,p.concentration,1,p.catalyst==='yes'))],formula:'Arreniusga asoslangan nisbiy model; 25 °C boshlang‘ich sharoit = 1',explanation:'Katalizator modeli tezlikni ikki marta oshiradi; mahsulotning muvozanat miqdori haqida xulosa bermaydi.'};
  case 'mixture':{const r=solubility(p.salt,p.water);return {metrics:[m('Erigan tuz',r.dissolved,'g'),m('Qattiq qoldiq',r.residue,'g')],formula:'20 °C: 100 g suvga 35,9 g NaCl',explanation:'Filtr qattiq qoldiqni ushlaydi; erigan ionlar suv bilan o‘tadi.'};}
  case 'electric':return {metrics:[m('Zanjir',p.circuit==='closed'?'Yopiq':'Ochiq'),m('Davomli tok',p.circuit==='closed'?'Sifat modelida bor':'Yo‘q')],formula:'Zn + Cu²⁺ → Zn²⁺ + Cu',explanation:'Elektronlar tashqi simda, ionlar elektrolit va tuz ko‘prigida zaryad tashiydi; real volt yoki amper hisoblanmaydi.'};
  default:throw Error('Kimyo muhiti aniqlanmagan');
 }
}
