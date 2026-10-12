import {safeParameters} from './content.js';
import {solarExperiment,oceanExperiment} from './physical.js';
export const C={R:6371000,mu:3.98600435436e14,G:6.67430e-11,solarMass:1.98847e30,c:299792458,AU:149597870700,sigma:5.670374419e-8,flux:1361};
const rad=x=>x*Math.PI/180,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const kineticEnergy=(mass,speed)=>.5*mass*speed**2;
export const solarFlux=distance=>C.flux/distance**2;
export const equilibriumTemperature=(distance,albedo)=>Math.pow(solarFlux(distance)*(1-albedo)/(4*C.sigma),.25);
export const tideRatio=distance=>(384400/distance)**3;
export const moonIllumination=phase=>(1-Math.cos(rad(phase)))/2;
export function dayLength(tilt,latitude,season){const dec=Math.asin(Math.sin(rad(tilt))*Math.sin(rad(season))),x=-Math.tan(rad(latitude))*Math.tan(dec);return x<=-1?24:x>=1?0:24*Math.acos(x)/Math.PI}
export function overlapArea(r,R,d){
 if(d>=r+R)return 0;if(d<=Math.abs(R-r))return Math.PI*Math.min(r,R)**2;
 return r*r*Math.acos(clamp((d*d+r*r-R*R)/(2*d*r),-1,1))+R*R*Math.acos(clamp((d*d+R*R-r*r)/(2*d*R),-1,1))-.5*Math.sqrt(Math.max(0,(-d+r+R)*(d+r-R)*(d-r+R)*(d+r+R)));
}
export function orbitFacts(height,speed){const radius=C.R+height*1000,v=speed*1000,energy=v*v/2-C.mu/radius,a=energy<0?-C.mu/(2*energy):Infinity,e=Math.abs(v*v*radius/C.mu-1);return {radius,energy,circular:Math.sqrt(C.mu/radius)/1000,escape:Math.sqrt(2*C.mu/radius)/1000,eccentricity:e,period:energy<0?2*Math.PI*Math.sqrt(a**3/C.mu):0,perigee:energy<0?a*(1-e):radius}}
const orbitCache=new Map(),meteorCache=new Map();
function cached(map,key,fn){if(map.has(key))return map.get(key);const value=fn();if(map.size>=24)map.delete(map.keys().next().value);map.set(key,value);return value}
export function propagateOrbit(height,speed){return cached(orbitCache,`${height}:${speed}`,()=>{
 const facts=orbitFacts(height,speed),duration=Math.min(21600,facts.period||10000),dt=Math.min(8,duration/1200),points=[];let x=facts.radius,y=0,vx=0,vy=speed*1000,hit=false;
 for(let time=0,i=0;time<=duration&&i<8000;time+=dt,i++){
  const r=Math.hypot(x,y);if(r<=C.R){hit=true;break}
  points.push({time,x,y,r,energy:(vx*vx+vy*vy)/2-C.mu/r});
  const k=-C.mu/r**3,ax=k*x,ay=k*y,nx=x+vx*dt+.5*ax*dt*dt,ny=y+vy*dt+.5*ay*dt*dt,nr=Math.hypot(nx,ny),nk=-C.mu/nr**3;
  vx+=.5*(ax+nk*nx)*dt;vy+=.5*(ay+nk*ny)*dt;x=nx;y=ny;
 }
 return {facts,points,hit,escaped:facts.energy>=0};
})}
export const meteorMaterials={stone:{density:3300,strength:1e6,heat:6e6},iron:{density:7800,strength:50e6,heat:8e6},ice:{density:900,strength:1e4,heat:2.8e6}};
export function meteorEntry(parameters){
 const {diameter=40,speed=20,angle=45,material='stone'}=parameters;
 return cached(meteorCache,`${diameter}:${speed}:${angle}:${material}`,()=>{
  const mat=meteorMaterials[material]||meteorMaterials.stone,initialMass=mat.density*Math.PI*diameter**3/6,initialEnergy=kineticEnergy(initialMass,speed*1000),sin=Math.sin(rad(angle));
  let mass=initialMass,v=speed*1000,height=100000,x=0,time=0,breakHeight=null,maxPressure=0,peakLoss=0,peakAltitude=100000;
  const profile=[];
  for(let i=0;i<16000&&time<2000&&height>0&&mass>initialMass*1e-8;i++){
   const density=1.225*Math.exp(-height/8500),q=.5*density*v*v;maxPressure=Math.max(maxPressure,q);
   if(q>mat.strength&&breakHeight===null)breakHeight=height;
   const spread=breakHeight===null?1:1+15*clamp((breakHeight-height)/18000),d=Math.cbrt(6*mass/(Math.PI*mat.density)),area=Math.PI*d*d/4*spread;
   const dt=clamp(200/(Math.max(v,1)*sin),.002,.2),heat=.04*q*v*area,loss=Math.min(mass*.08,heat/mat.heat*dt);
   if(loss/dt>peakLoss){peakLoss=loss/dt;peakAltitude=height}
   profile.push({time,height,x,speed:v,mass,fraction:mass/initialMass,energy:kineticEnergy(mass,v),pressure:q,lossRate:loss/dt});
   mass-=loss;v=Math.max(.1,v+(9.81*sin-.9*q*area/Math.max(mass,1e-16))*dt);
   height=Math.max(0,height-v*sin*dt);x+=v*Math.cos(rad(angle))*dt;time+=dt;
  }
  const ground=height<=0,impactEnergy=ground?kineticEnergy(mass,v):0,hypervelocity=ground&&v>=3000;
  profile.push({time,height,x,speed:v,mass,fraction:mass/initialMass,energy:kineticEnergy(mass,v),pressure:0,lossRate:0});
  const outcome=ground?(hypervelocity?'Sirtga yuqori tezlikda yetdi':'Sekinlashgan meteorit sirtga yetdi'):mass<=initialMass*1e-8?'Atmosferada deyarli to‘liq ablyatsiya bo‘ldi':'Atmosferada sekinlashdi; tushish davom etadi';
  return {initialMass,initialEnergy,finalMass:mass,finalSpeed:v,ground,hypervelocity,impactEnergy,airEnergy:Math.max(0,initialEnergy-kineticEnergy(mass,v)),breakHeight,fragmented:breakHeight!==null,peakAltitude,maxPressure,outcome,profile};
 });
}
export const sampleProfile=(profile,t)=>profile[Math.min(profile.length-1,Math.floor(clamp(t)*(profile.length-1)))];
export function observation(topic,raw={},time=0){
 const p=safeParameters(topic,raw),t=clamp(time),id=topic.id;let metrics=[],formula='',why='',stage=topic.title;
 const add=(label,value,unit='')=>metrics.push({label,value:Number.isFinite(value)?value:0,unit});
 switch(topic.family){
 case 'earth':{
  const hours=dayLength(p.tilt,p.latitude,p.season);add('Yorug‘ vaqt',hours,'soat');add('Quyosh og‘ishi',Math.asin(Math.sin(rad(p.tilt))*Math.sin(rad(p.season)))*180/Math.PI,'°');
  formula='δ = asin(sin ε · sin λ); kun = 24 · acos(−tan φ · tan δ) / π';
  why=`O‘q ${p.tilt}° og‘gan. ${p.latitude}° kenglikda ushbu yillik holat uchun kun ${hours.toFixed(1)} soat. Atmosfera refraksiyasi kiritilmagan.`;break;
 }
 case 'sunlight':{
  const x=solarExperiment(p,t);add('Energiya oqimi',x.flux,'W/m²');add('Muvozanat harorati',x.equilibrium,'K');add('Model harorati',x.temperatureC,'°C');add('O‘rtacha so‘rilgan energiya',x.absorbed,'W/m²');add('Sof issiqlik oqimi',x.netFlux,'W/m²');add('Quyosh–Yer masofasi',x.distance,'AU');
  formula='F = 1361/r²; Tmuvozanat = [F(1−A)/(4σ)]¼; sof oqim = F(1−A)/4 − σT⁴';stage=Math.abs(x.netFlux)<1?'Muvozanatga yaqin':x.netFlux>0?'Yer modelida energiya to‘planmoqda':'Yer modeli energiya yo‘qotmoqda';
  why=`Masofa ${x.distance.toFixed(2)} AU. Oqim ${(1/x.distance**2).toFixed(2)} marta. Model ${x.netFlux>0?'qizimoqda':x.netFlux<0?'sovimoqda':'muvozanatda'}: kiruvchi va chiquvchi energiya farqi harorat bilan birga o‘zgaradi. Harorat atmosferasiz radiatsion modelga tegishli; vaqt siqilgan.`;break;
 }
 case 'ocean':{
  const x=oceanExperiment(p,t);add('Tashqi mutlaq bosim',x.bar,'bar');add('Joriy chuqurlik',x.depth,'m');add('Suv zichligi',x.density,'kg/m³');add('Sirtdagi bosimga nisbat',x.ratio,'×');add('Ideal gaz hajmi',x.airFraction*100,'%');add('Kabina bosim farqi',x.gaugeBar,'bar');add('Kabina chegarasiga yuklama',x.load*100,'%');add('Suv hajmi kamayishi',x.waterCompression*100,'%');
  formula='dP/dh = ρg; ρ(P) ≈ ρ₀ exp(ΔP/K); yopiq havo: PV = const';
  stage=x.failed?'Kabina chegarasi oshdi: ko‘rgazmali ezilish':p.mode==='air'?'Yopiq havo siqilmoqda':x.depth>=10929?'Challenger Deep tubi yaqinida':x.depth>332.35?'SCUBA rekordi belgisi pastida':'Yuqori suv qatlamlari';
  why=`${x.depth.toFixed(0)} m da bosim ${x.bar.toFixed(1)} bar, suv zichligi ${x.density.toFixed(1)} kg/m³. ${x.failed?'Tanlangan kabina bosim farqiga bardosh bera olmadi. Ezilish material muhandisligi hisobidan olinmagan ko‘rgazma.':'Bosim bilan zichlik bir xil kattalik emas. Kabina holati tanlangan bardoshlilikka bog‘liq.'} Ideal gaz namunasida molekulalar soni va harorat o‘zgarmas. Yuqori bosimdagi haqiqiy gaz bu qonundan chetga chiqadi; inson fiziologiyasi hisoblanmagan.`;break;
 }
 case 'tide':add('Qalqish kuchi nisbati',tideRatio(p.distance),'×');formula='Fqalqish ∝ 1 / d³';why=`Hozirgi masofaga nisbatan ta’sir ${tideRatio(p.distance).toFixed(2)} marta. Dengiz chuqurligi va qirg‘oq shakli bu modelda yo‘q.`;break;
 case 'moon':{
  const phase=p.phase+t*360,illum=moonIllumination(phase),offset=Math.abs(Math.sin(rad(p.inclination||0))*Math.cos(rad(phase))*12),aligned=id==='lunar-eclipse'?Math.cos(rad(phase))<-.98:Math.cos(rad(phase))>.98;
  add('Yoritilgan ulush',illum*100,'%');add('Soyaga moslik',aligned?Math.max(0,1-offset)*100:0,'%');formula='Yoritilgan ulush = (1 − cos θ) / 2';
  why=id==='tidal-lock'?'Oy belgisining bir tomoni Yerga qarab turadi, lekin Oy ham o‘z o‘qi atrofida aylanadi.':id.includes('eclipse')?'Faza mosligi yetarli emas: orbita og‘ishi soyadan o‘tishni o‘zgartiradi. Soyalar ko‘rgazma uchun kattalashtirilgan.':'Oy fazasi Quyosh yoritgan yarim sharni qanday ko‘rishimizga bog‘liq.';break;
 }
 case 'orbit':{
  const o=propagateOrbit(p.height,p.speed),x=sampleProfile(o.points,t);add('Aylana tezligi',o.facts.circular,'km/s');add('Qochish tezligi',o.facts.escape,'km/s');add('Joriy balandlik',Math.max(0,(x.r-C.R)/1000),'km');formula='vaylana = √(μ/r); E = v²/2 − μ/r';stage=o.hit?'Yo‘l sirt bilan kesishadi':o.escaped?'Bog‘lanmagan yo‘l':'Bog‘langan orbita';why='Markaziy tortish modeli sonli integratsiya bilan yechiladi. Atmosfera, Yerning notekisligi va boshqa jismlar kiritilmagan.';break;
 }
 case 'system':{
  if(id==='planet-rings'){add('Ichki / tashqi tezlik',Math.sqrt(p.radius),'×');formula='v ∝ 1 / √r';why='Ichki zarrachalar tashqi zarrachalardan tezroq aylanadi; halqa qattiq disk emas.'}
  else {add('Orbital davr',Math.sqrt(p.radius**3),'yil');add('Perigeliy',p.radius*(1-p.eccentricity),'AU');add('Afeliy',p.radius*(1+p.eccentricity),'AU');formula='T² = a³ (Quyosh massasi, yil va AU)';why=id==='comet-tail'?'Ion dumi Quyoshdan teskari. Chang dumi orbital harakat tufayli egiladi.':id==='retrograde'?'O‘zgarayotgan kuzatuv chizig‘i harakatni teskari ko‘rsatishi mumkin; orbital yo‘nalish almashtirilmaydi.':id==='protoplanetary-disk'?'Disk ichki qismi tezroq aylanadi; yig‘ilish animatsiyasi vaqt ko‘lamini juda qisqartiradi.':'Davr radiusning 3/2 darajasiga bog‘liq. Chizmada uzoq orbitaning ko‘lami siqilgan.'}break;
 }
 case 'gravity':{const g={earth:9.81,moon:1.62,mars:3.71}[p.world];add('Massa',p.mass,'kg');add('Og‘irlik kuchi',p.mass*g,'N');formula='F = m · g';why='Massa o‘zgarmaydi; tanlangan jismning gravitatsion tezlanishi og‘irlikni o‘zgartiradi.';break;}
 case 'rocket':add('Ideal tezlik o‘zgarishi',p.exhaust*Math.log(p.ratio),'km/s');formula='Δv = ve · ln(mboshlang‘ich / moxirgi)';why='Bu ideal raketa tenglamasi: tortish va aerodinamik yo‘qotishlar kiritilmagan. Gaz tezligi va massa nisbati birgalikda ta’sir qiladi.';break;
 case 'solar':{
  const coupling=p.activity*(1-(p.field||0))/2,reach=id==='cme'?Math.max(0,Math.cos(rad(p.direction))**8):1;
  add('Nisbiy oqim',p.activity,'model birligi');add('Nisbiy bog‘lanish',coupling*reach,'model birligi');formula='Ko‘rgazmali oqim ∝ faollik; yo‘nalish va maydon bog‘lanishni o‘zgartiradi';
  why=id==='sunspots'?'Dog‘lar soni ko‘rgazmali faollikka bog‘langan. Bu haqiqiy Quyosh dog‘i soni prognozi emas.':id==='aurora'?'Yuqori kenglikda magnit yo‘llar zarrachalarni atmosferaga yo‘naltiradi. Ranglar atmosfera qo‘zg‘alishini bildiradi.':id==='cme'?'Otilish yo‘nalishi Yerdan og‘sa, modeldagi Yerga moslik kamayadi.':'Bu plazma va magnit maydonning tushuntiruvchi modeli; haqiqiy kosmik ob-havo hisoblanmaydi.';break;
 }
 case 'meteor':{
  const m=meteorEntry(p),x=sampleProfile(m.profile,Math.min(1,t/.72));add('Boshlang‘ich massa',m.initialMass,'kg');add('Boshlang‘ich energiya',m.initialEnergy,'J');add('Joriy balandlik',x.height/1000,'km');add('Qolgan massa',x.fraction*100,'%');add('Joriy tezlik',x.speed/1000,'km/s');add('Sirtga uzatilgan energiya',m.impactEnergy,'J');formula='m = ρπd³/6; E = mv²/2; q = ρhavov²/2';stage=t<.72?(m.breakHeight!==null&&x.height<m.breakHeight?'Parchalanish va ablyatsiya':'Atmosfera bo‘ylab kirish'):m.outcome;why=`${m.outcome}. Diametr massa kubini, tezlik esa energiya kvadratini o‘zgartiradi. Atmosfera zichligi balandlik bilan kamayadi. Krater va suv halqalari faqat nisbiy ko‘rgazma.`;break;
 }
 case 'shower':{const n=p.count*(.2+.8*Math.cos(rad(p.phase-180))**8);add('Nisbiy ko‘rinadigan oqim',n,'model birligi');formula='Oqimga moslik Yer holatiga bog‘liq (sxematik)';why='Yer oqim markaziga yaqinlashganda ko‘proq iz ko‘rinadi. Meteorlar atmosferada paydo bo‘ladi; yulduzlar tushmaydi.';break;}
 case 'transit':{const dx=(t*2-1)*1.5,dy=3*Math.cos(rad(p.inclination)),blocked=overlapArea(p.ratio,1,Math.hypot(dx,dy))/Math.PI;add('Yorug‘lik kamayishi',100*blocked,'%');add('Ko‘rinadigan yorug‘lik',100*(1-blocked),'%');formula='To‘liq disk ichida kamayish = (Rsayyora / Ryulduz)²';why='Doiralar kesishgan yuza hisoblanadi. Yulduz sirtidagi limb qorayishi kiritilmagan.';break;}
 case 'resonance':add('Aylanishlar nisbati',p.inner/p.outer,'×');formula='ni / no = To / Ti';why='Orbitadagi belgilar butun son nisbatida takror uchrashadi. Bu ko‘p jismli kuchlarning to‘liq integratsiyasi emas.';break;
 case 'assist':{const dv=8*Math.sin(rad(p.bend)/2)*(p.side==='behind'?1:-1);add('Ko‘rgazmali oxirgi tezlik',Math.max(.1,p.speed+dv),'km/s');add('O‘zgarish',dv,'km/s');formula='Ko‘rgazma: Δv ∝ ± sin(burilish / 2)';why='Sayyora harakatiga nisbatan tanlangan tomon energiya olish yoki berishni ko‘rsatadi. Missiya trayektoriyasi uchun aniq hisob emas.';break;}
 case 'star':{
  const massive=p.mass>=8,age=p.age,radius=id==='protostar'?3-2*t:id==='white-dwarf'?.12:id==='red-giant'?1+age/12:id==='planetary-nebula'?1+5*t:id==='supernova'&&massive&&age>=85?1+8*t:age>70?1+(age-70)/8:Math.pow(p.mass,.65);
  add('Ko‘rgazmali radius',radius,'model birligi');add('Taxminiy asosiy ketma-ketlik muddati',10/p.mass**2.5,'mlrd yil');formula='Asosiy ketma-ketlik uchun qo‘pol t ∝ M⁻²⋅⁵; radius animatsiyasi konseptual';
  stage=id==='supernova'?(massive?(age>=85?'Massiv yulduz: kollaps yo‘li':'Hali kollaps bosqichi emas'):'Bu massa uchun kollaps supernovasi yo‘q'):age<20?'Boshlang‘ich bosqich':age<70?'Asosiy ketma-ketlik':massive?'Massiv yulduzning so‘nggi bosqichi':'Gigant va oq mitti yo‘li';
  why='Massa hayot yo‘lini o‘zgartiradi. Radius va rang ta’limiy soddalashtirish, yulduz ichki tuzilishi tenglamalari yechilmaydi.';break;
 }
 case 'binary':{const phase=t*2*Math.PI,dy=p.separation*Math.cos(rad(p.inclination)),d=Math.hypot(Math.sin(phase)*p.separation,dy),loss=id==='eclipsing-binary'?overlapArea(.7,1,d)/Math.PI*50:0;add('Nisbiy oraliq',p.separation*(id.includes('merger')?1-.9*t:1),'model birligi');add('Yorug‘lik',100-loss,'%');formula=id==='nova'?'Oq mittiga modda oqimi → sirt chaqnashi':'Ikki jism umumiy massa markazi atrofida aylanadi';why=id==='nova'?'Modda katta donor yulduzdan kichik oq mittiga oqadi. Chaqnashdan keyin oq mitti qoladi.':id.includes('merger')?'Orbital oraliq vaqt bilan qisqaradi va to‘lqin tarqaladi. Bu umumiy nisbiylikning sonli yechimi emas.':'Kuzatuv og‘ishi tutilish chuqurligini o‘zgartiradi.';break;}
 case 'compact':{const signal=id==='gamma-burst'?Math.exp(-5*t*3/p.duration)*Math.cos(rad(p.beam))**8:id==='magnetar'?(p.field**2)*Math.sin(Math.PI*t)**10:Math.max(0,Math.cos(2*Math.PI*t*3/p.spin))**8*Math.sin(rad(p.beam));add('Ko‘rgazmali signal',signal,'model birligi');if(p.spin)add('Aylanish davri',p.spin,'s');formula=id==='gamma-burst'?'Yo‘naltirilgan nur: kuzatuv o‘qiga yaqinlashganda signal ortadi':'Nur o‘qi aylanganda yo‘naltirilgan puls ko‘rinadi';why='Nur yo‘nalishi bilan signal birga o‘zgaradi. Haqiqiy spektr va magnit muhit yechilmagan.';break;}
 case 'hole':{const rs=2*C.G*p.mass*C.solarMass/C.c**2,gradient=2*C.G*p.mass*C.solarMass/(p.distance*rs)**3;add('Shvarsshild radiusi',rs/1000,'km');add('Nyuton gradienti',gradient,'s⁻²');formula='rₛ = 2GM/c²; uzoq sohada gradient ≈ 2GM/r³';why='Radius massasiga proporsional. Gradient formulasi Nyuton yaqinlashuvi, ufq yaqinidagi to‘liq nisbiylik hisobining o‘rnini bosmaydi.';break;}
 case 'wave':{add('Ko‘rgazmali deformatsiya',p.amplitude*Math.sin(2*Math.PI*p.frequency*t),'model birligi');formula='x = x₀(1+h); y = y₀(1−h)';why='Bir yo‘nalish cho‘zilganda perpendikulyar yo‘nalish qisqaradi. Haqiqiy amplituda juda kichik; chizmada kattalashtirilgan.';break;}
 case 'galaxy':{
  if(id==='galaxy-rotation'){const v=p.profile==='flat'?1:1/Math.sqrt(p.radius);add('Nisbiy orbital tezlik',v,'model birligi');add('Nisbiy davr',2*Math.PI*p.radius/v,'model birligi');formula=p.profile==='flat'?'v = const; T ∝ r':'v ∝ r⁻½; T ∝ r³ᐟ²';why='Tekis va markaziy massa tezlik profillari farqlanadi. Bu haqiqiy galaktika massasi fit modeli emas.'}
  else {add('Nisbiy markazlar masofasi',p.separation*(1-.8*t),'model birligi');formula='Tortish → orbital o‘zaro ta’sir → deformatsiya (konseptual)';why='Disk zarrachalari yulduzlar guruhini bildiradi. Yulduzlararo bo‘shliq katta; hammasi urilishi ko‘rsatilmaydi.'}break;
 }
 case 'expansion':add('Ko‘rilgan to‘lqin',p.scale*p.wavelength,'nm');add('Qizil siljish z',p.scale-1);formula='λkuzatilgan = a · λchiqarilgan; z = a − 1';why='Fazo masshtabi to‘lqin va katta masofalarni uzaytiradi. Bog‘langan Quyosh tizimi bu sahnada kengaymaydi.';break;
 case 'scale':add('Masshtab pog‘onasi',p.zoom);formula='Metr → sayyora → tizim → yulduzlar → galaktika';why='Har pog‘ona alohida ko‘lamni ko‘rsatadi. Modellardagi radius va masofalar bir xil umumiy masshtabda emas.';break;
 }
 return {parameters:p,metrics,formula,why,stage,primary:metrics[0]?.value||0};
}
export const series=(topic,p,index=0)=>Array.from({length:41},(_,i)=>({time:i/40,value:observation(topic,p,i/40).metrics[index]?.value||0}));
export const differentTrials=trials=>new Set(trials.map(x=>JSON.stringify(x.parameters))).size>=2;
export const notebookReady=(topic,n)=>n.prediction?.trim().length>=6&&n.conclusion?.trim().length>=12&&differentTrials(n.trials||[])&&n.choice===topic.answer;
export function sanitizedNotebook(t,n={}){return {prediction:typeof n.prediction==='string'?n.prediction.slice(0,400):'',conclusion:typeof n.conclusion==='string'?n.conclusion.slice(0,1200):'',choice:Number.isInteger(n.choice)&&n.choice>=0&&n.choice<3?n.choice:null,hints:Math.max(0,Math.min(3,Number(n.hints)||0)),wrongChecks:Math.max(0,Math.min(100,Number(n.wrongChecks)||0)),trials:(Array.isArray(n.trials)?n.trials:[]).slice(0,8).filter(x=>x&&typeof x==='object').map(x=>({parameters:safeParameters(t,x.parameters),progress:clamp(Number(x.progress)||0),metrics:observation(t,x.parameters,clamp(Number(x.progress)||0)).metrics}))}}
