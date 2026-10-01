import {elements} from './chemistry-elements.js';
export const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function atomIdentity(p,n,e){if(![p,n,e].every(Number.isInteger)||p<1||p>118||n<0||e<0)throw Error('Zarracha soni noto‘g‘ri');return {element:elements[p-1],mass:p+n,charge:p-e};}
export const shellsFirst20=e=>{let left=e;return [2,8,8,2].map(cap=>{const take=Math.min(left,cap);left-=take;return take}).filter(Boolean)};
export const molecules={
 water:{name:'Suv',formula:'H₂O',atoms:[['O',0,0,0],['H',.79,.61,0],['H',-.79,.61,0]],bonds:[[0,1,1],[0,2,1]],shape:'Burchakli, taxminan 104,5°. Ikki yolg‘iz elektron jufti shaklga ta’sir qiladi.'},
 methane:{name:'Metan',formula:'CH₄',atoms:[['C',0,0,0],['H',1,1,1],['H',-1,-1,1],['H',-1,1,-1],['H',1,-1,-1]],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],shape:'Tetraedr: H–C–H burchagi taxminan 109,5°.'},
 oxygen:{name:'Kislorod',formula:'O₂',atoms:[['O',-.65,0,0],['O',.65,0,0]],bonds:[[0,1,2]],shape:'Ikki atomli molekula, qo‘sh bog‘ning soddalashtirilgan modeli.'},
 nitrogen:{name:'Azot',formula:'N₂',atoms:[['N',-.65,0,0],['N',.65,0,0]],bonds:[[0,1,3]],shape:'Ikki atom orasida uch bog‘.'},
 dioxide:{name:'Karbonat angidrid',formula:'CO₂',atoms:[['C',0,0,0],['O',-1.2,0,0],['O',1.2,0,0]],bonds:[[0,1,2],[0,2,2]],shape:'Chiziqli, 180°. Ikki C=O bog‘i.'},
 ammonia:{name:'Ammiak',formula:'NH₃',atoms:[['N',0,.3,0],['H',1,-.4,0],['H',-.5,-.4,.87],['H',-.5,-.4,-.87]],bonds:[[0,1,1],[0,2,1],[0,3,1]],shape:'Uchburchakli piramida; azotda bitta yolg‘iz elektron jufti.'},
 ethene:{name:'Eten',formula:'C₂H₄',atoms:[['C',-.6,0,0],['C',.6,0,0],['H',-1.2,.8,0],['H',-1.2,-.8,0],['H',1.2,.8,0],['H',1.2,-.8,0]],bonds:[[0,1,2],[0,2,1],[0,3,1],[1,4,1],[1,5,1]],shape:'Qo‘sh bog‘ atrofida tekis model.'},
 ethyne:{name:'Etin',formula:'C₂H₂',atoms:[['C',-.55,0,0],['C',.55,0,0],['H',-1.55,0,0],['H',1.55,0,0]],bonds:[[0,1,3],[0,2,1],[1,3,1]],shape:'Chiziqli; uglerodlar orasida uch bog‘.'},
 ethanol:{name:'Etanol',formula:'C₂H₆O',atoms:[['C',-1,0,0],['C',0,0,0],['O',.9,.5,0],['H',1.5,.2,0],['H',-1.4,.9,0],['H',-1.4,-.5,.8],['H',-1.4,-.5,-.8],['H',.1,-.6,.8],['H',.1,-.6,-.8]],bonds:[[0,1,1],[1,2,1],[2,3,1],[0,4,1],[0,5,1],[0,6,1],[1,7,1],[1,8,1]],shape:'–OH funksional guruhi. Koordinatalar ko‘rgazmali, hisoblangan optimallashtirilgan geometriya emas.'}
};
export function composition(atoms){return atoms.reduce((a,[s])=>(a[s]=(a[s]||0)+1,a),{});}
export function moleculeValidation(atoms,bonds){const valence={H:1,O:2,N:3,C:4},used=Array(atoms.length).fill(0),pairs=new Set();for(const [a,b,n] of bonds){if(!Number.isInteger(a)||!Number.isInteger(b)||a===b||!atoms[a]||!atoms[b]||![1,2,3].includes(n))return {valid:false,reason:'Bog‘ning ikki turli atomi va 1–3 bog‘ tartibi bo‘lishi kerak.'};const k=[a,b].sort().join('-');if(pairs.has(k))return {valid:false,reason:'Bir juft atom uchun bitta bog‘ tartibini belgilang.'};pairs.add(k);used[a]+=n;used[b]+=n;}
 const exceeded=atoms.findIndex(([s],i)=>used[i]>valence[s]);if(exceeded>=0)return {valid:false,reason:`${atoms[exceeded][0]} uchun ushbu neytral modelda odatiy valentlik oshdi.`};
 if(atoms.length<2||used.some((v,i)=>v!==valence[atoms[i][0]]))return {valid:false,reason:'Ochiq valentlik bor. Bu cheklangan neytral molekula modeli ion va radikallarni baholamaydi.'};
 const seen=new Set([0]);let changed=true;while(changed){changed=false;for(const [a,b] of bonds)if(seen.has(a)!==seen.has(b)){seen.add(a);seen.add(b);changed=true}}
 if(seen.size!==atoms.length)return {valid:false,reason:'Bu bitta molekula emas: bog‘lanmagan alohida qismlar bor.'};return {valid:true,reason:'Valentlik va bog‘langanlik mos. Bu tekshiruv moddaning barqarorligini yoki real mavjudligini isbotlamaydi.'};}
export const reactions=[{id:'water',label:'Suv hosil bo‘lishi',left:[{f:'H₂',a:{H:2}},{f:'O₂',a:{O:2}}],right:[{f:'H₂O',a:{H:2,O:1}}],answer:[2,1,2]}, {id:'rust',label:'Temir oksidlanishi',left:[{f:'Fe',a:{Fe:1}},{f:'O₂',a:{O:2}}],right:[{f:'Fe₂O₃',a:{Fe:2,O:3}}],answer:[4,3,2]}, {id:'carbon',label:'Uglerod oksidlanishi',left:[{f:'C',a:{C:1}},{f:'O₂',a:{O:2}}],right:[{f:'CO₂',a:{C:1,O:2}}],answer:[1,1,1]}, {id:'methane',label:'Metan oksidlanishi',left:[{f:'CH₄',a:{C:1,H:4}},{f:'O₂',a:{O:2}}],right:[{f:'CO₂',a:{C:1,O:2}},{f:'H₂O',a:{H:2,O:1}}],answer:[1,2,1,2]}];
export function atomTotals(species,coefficients){return species.reduce((total,s,i)=>{for(const [a,n] of Object.entries(s.a))total[a]=(total[a]||0)+n*coefficients[i];return total},{});}
export function balanceReaction(r,c){const left=atomTotals(r.left,c.slice(0,r.left.length)),right=atomTotals(r.right,c.slice(r.left.length)),keys=[...new Set([...Object.keys(left),...Object.keys(right)])];return {left,right,keys,balanced:c.every(v=>Number.isInteger(v)&&v>0)&&keys.every(k=>left[k]===right[k])};}
export function neutralPH(acidMM,baseMM,volumeML=100){const net=(acidMM-baseMM)/volumeML,kw=1e-14,h=(net+Math.sqrt(net*net+4*kw))/2; // avoid cancellation on basic side
 const stable=net>=0?h:2*kw/(Math.sqrt(net*net+4*kw)-net);return -Math.log10(stable);}
export const phColor=p=>p<3?'#db5564':p<6?'#efb34c':p<8?'#69b788':p<11?'#46a5bd':'#8e6dcd';
export function waterPhase(t){return t<0?'qattiq':t===0?'muz va suyuqlik':t<100?'suyuq':t===100?'suyuqlik va gaz':'gaz';}
export const rateFactor=(t,c,s,catalyst=false)=>Math.exp(40000/8.314*(1/298.15-1/(t+273.15)))*c*s*(catalyst?2:1);
export function solubility(saltG,waterG){const capacity=35.9*waterG/100;return {dissolved:Math.min(saltG,capacity),residue:Math.max(0,saltG-capacity)};}

// A square section through the NaCl lattice: nearest neighbours alternate charge.
export function saltLattice(columns=6,rows=4){return Array.from({length:columns*rows},(_,i)=>{const x=i%columns,y=Math.floor(i/columns),chloride=(x+y)%2===1;return {x,y,symbol:chloride?'Cl⁻':'Na⁺',charge:chloride?-1:1};});}
