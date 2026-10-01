import {neutralPH,solubility,atomTotals} from './chemistry-model.js';
import {chemistryLabById,labDefaults} from './chemistry-labs.js';
export const GAS_ML_PER_MMOL=0.082057*298.15; // R in L atm / mol K; mmol -> ml
export function labParameters(id,supplied={}){
 const lab=chemistryLabById[id];if(!lab)throw new Error('Noma’lum tajriba');
 const params=labDefaults(lab);
 if(!supplied||typeof supplied!=='object'||Array.isArray(supplied))return params;
 for(const c of lab.controls){const v=supplied[c.key];if(typeof v==='number'&&Number.isFinite(v))params[c.key]=Math.max(c.min,Math.min(c.max,v));}
 return params;
}
export function carbonateGas(soda,acid){const mmol=Math.min(soda,acid);return {mmol,gasML:mmol*GAS_ML_PER_MMOL,sodaLeft:soda-mmol,acidLeft:acid-mmol,limiting:soda===acid?'Teng mol':soda<acid?'Soda':'Kislota'};}
export function cabbageColor(p){return p<3?'#c93865':p<5?'#b44483':p<8?'#8254ad':p<10?'#327caf':p<12?'#298c70':'#a39a25';}
export function labResult(id,supplied,progress=1){
 const p=labParameters(id,supplied),q=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0)),f=n=>Number(n.toFixed(3));
 const finish=(values,unit,explanation,extra={})=>({values,unit,explanation,...extra});
 if(id==='lab-volcano'||id==='lab-balloon'){const g=carbonateGas(p.soda,p.acid);return finish({'CO₂':f(g.mmol*q),'Gaz hajmi':f(g.gasML*q),'Qolgan soda':f(p.soda-g.mmol*q),'Qolgan kislota':f(p.acid-g.mmol*q)},'mmol; hajm ml',g.mmol===0?'Reagentlardan biri yo‘q: CO₂ hosil bo‘lmaydi.':`${g.limiting} reaksiyani chegaralaydi. Gaz chiqarish miqdori 1:1 mol nisbatidan keladi.`,{gas:g,foam:p.foam??0});}
 if(id==='lab-indicator')return finish({'pH':p.ph},'pH birliksiz','Indikator rangi pH ga bog‘liq; rangdan namunaning aniq modda nomini bilib bo‘lmaydi.',{color:cabbageColor(p.ph)});
 if(id==='lab-neutralisation'){const base=p.base*q,h=neutralPH(p.acid,base);return finish({'pH':f(h),'Neytrallangan':f(Math.min(p.acid,base)),'Ortiqcha kislota':f(Math.max(0,p.acid-base)),'Ortiqcha asos':f(Math.max(0,base-p.acid))},'pH; miqdor mmol',Math.abs(p.acid-base)<1e-8?'Teng mol: ideal kuchli kislota/asos uchun pH 7.':p.acid>base?'H₃O⁺ ortiqcha, eritma kislotali.':'OH⁻ ortiqcha, eritma asosli.',{ph:h});}
 if(id==='lab-dissolving'){const d=solubility(p.salt,p.water);return finish({'Erigan NaCl':f(d.dissolved*q),'Qattiq NaCl':f(p.salt-d.dissolved*q)},'g',d.residue>0?'To‘yinish chegarasi ortdi: ortiqcha tuz qattiq holda qoladi.':'Berilgan tuz muvozanatda to‘liq eriy oladi.');}
 if(id==='lab-crystals'){const water=100-p.evaporation*q,d=solubility(p.salt,water);return finish({'Qolgan suv':f(water),'Erigan NaCl':f(d.dissolved),'Kristall NaCl':f(d.residue)},'g','Suv kamayadi, tuz saqlanadi: eruvchanlik chegarasidan ortiq tuz kristallanadi.');}
 if(id==='lab-filtration')return finish({'Filtratdagi suv':f(100*q),'Filtratdagi NaCl':f(p.salt*q),'Filtrdagi qum':f(p.sand*q),'Hali quyilmagan qum':f(p.sand*(1-q))},'g','Qum filtrda; erigan tuz suv bilan filtratga o‘tadi.');
 if(id==='lab-distillation'){const water=100-p.collected*q,d=solubility(p.salt,water);return finish({'Yig‘ilgan suv':f(p.collected*q),'Qolgan suv':f(water),'Idishdagi jami NaCl':p.salt,'Kristall NaCl':f(d.residue)},'g','Suv bug‘i sovitilib yig‘ildi; uchmaydigan NaCl boshlang‘ich idishda qoldi.');}
 if(id==='lab-density')return finish({'Suv hajmi':100,'Moy hajmi':p.oil,'Jami hajm':100+p.oil,'Moy massasi':f(.9*p.oil)},'hajm ml; massa g','Aralashmaydigan va zichligi pastroq moy ustki qatlamga ajraladi.',{separation:q});
 if(id==='lab-diffusion'){const factor=(p.temperature+273.15)/293.15;return finish({'Nisbiy D':f(factor),'Shartli tarqalish kengligi':f(Math.sqrt(2*factor*q))},'nisbiy, birliksiz','Diffuziya kengligi √(2Dt) bilan o‘sadi. Haroratga bog‘liqlik bu model uchun shartli tanlangan.',{spread:Math.sqrt(2*factor*q)});}
 if(id==='lab-chromatography')return finish({'Front':f(p.front*q),'Sariq pigment':f(p.front*q*.8),'Qizil pigment':f(p.front*q*.55),'Ko‘k pigment':f(p.front*q*.25)},'sm','Pigmentlar turlicha Rf sabab turli masofaga ko‘chdi; frontdan oldinga o‘tmadi.');
 if(id==='lab-conductivity')return finish({'Nisbiy o‘tkazuvchanlik':f((.01+.99*p.salt/3)*q),'Shakar ion hissasi':0,'Shakar konsentratsiyasi':p.sugar},'indeks 0–1; shakar g/100 ml','NaCl ionlari zaryad tashiydi. Shakar ionlar bermaydi; ko‘rsatkich siemens yoki amper emas.',{conductivity:(.01+.99*p.salt/3)*q});
 if(id==='lab-corrosion'){const k=p.humidity/100*p.oxygen/100*(1+p.salt),index=1-Math.exp(-k*q);return finish({'Shartli korroziya indeksi':f(index),'Kislorod ulushi':p.oxygen,'Namlik':p.humidity},'indeks 0–1; ulush %',k===0?'Suv yoki kislorod yo‘q: bu modeldagi zanglash yo‘li to‘xtadi.':'Namlik va kislorod bilan korroziya boradi; tuz omili ushbu modelda tezlashtiradi.',{corrosion:index});}
 throw new Error('Model topilmadi');
}
export const carbonateReaction={left:[{f:'NaHCO₃',a:{Na:1,H:1,C:1,O:3}},{f:'CH₃COOH',a:{C:2,H:4,O:2}}],right:[{f:'CH₃COONa',a:{C:2,H:3,O:2,Na:1}},{f:'H₂O',a:{H:2,O:1}},{f:'CO₂',a:{C:1,O:2}}]};
export const carbonateAtoms={left:atomTotals(carbonateReaction.left,[1,1]),right:atomTotals(carbonateReaction.right,[1,1,1])};
