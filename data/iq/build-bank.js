// Original SinfQuiz reasoning tasks. Not Raven, WAIS, WISC or ICAR test items.
const domains=['patterns','numbers','logic','spatial'];
const rotate=(points,k=1)=>points.map(([x,y])=>{for(let i=0;i<k;i++)[x,y]=[2-y,x];return [x,y]});
const key=p=>JSON.stringify(p);
const points=[[0,0],[0,1],[0,2],[1,2]];
function choices(answer,others,seed){
 const candidates=[answer,...others].filter((v,i,a)=>a.findIndex(x=>key(x)===key(v))===i).slice(0,4);
 if(candidates.length!==4)throw Error('Four distinct answers required');
 const shift=seed%4,options=[...candidates.slice(shift),...candidates.slice(0,shift)];return {options,answer:options.findIndex(x=>key(x)===key(answer))};
}
export function buildBank(){
 const bank=[];
 for(let band=0;band<3;band++)for(const domain of domains)for(let family=0;family<3;family++)for(let v=0;v<4;v++){
  const seed=band*19+family*5+v,id=`iq-1-${band}-${domain}-${family}-${v}`;let prompt,visual,expected,distractors,explanation,rule,parameters;
  if(domain==='numbers'){
   const a=2+v+band*7,d=2+band+v;
   if(family===0){const series=Array.from({length:5},(_,i)=>a+i*d);expected=a+5*d;prompt='Bir xil qoida davom etadi. Keyingi sonni tanlang.';visual={kind:'sequence',values:series};distractors=[expected-d,expected+1,expected+d];explanation=`Har safar ${d} qo‘shiladi: ${series[4]} + ${d} = ${expected}.`;rule='arithmetic';parameters={a,d};}
   if(family===1){const series=Array.from({length:5},(_,i)=>a+i*(i+1)*(band+1));expected=a+30*(band+1);prompt='Farqlar qanday o‘zgaradi? Keyingi sonni toping.';visual={kind:'sequence',values:series};distractors=[expected-2*(band+1),expected+2*(band+1),series[4]+6*(band+1)];explanation=`Farqlar ${[2,4,6,8,10].map(x=>x*(band+1)).join(', ')} bo‘lib ortadi. ${series[4]} + ${10*(band+1)} = ${expected}.`;rule='secondDifference';parameters={a,step:band+1};}
   if(family===2){const r=2+band,series=Array.from({length:4},(_,i)=>a*r**i);expected=a*r**4;prompt='Ko‘paytirish qoidasini davom ettiring.';visual={kind:'sequence',values:series};distractors=[series[3]+r,expected+r,expected/r];explanation=`Har son ${r} marta ortadi: ${series[3]} × ${r} = ${expected}.`;rule='geometric';parameters={a,r};}
  }
  if(domain==='patterns'){
   if(family===0){const a=v+1,b=band+1,c=band+2;expected=a+c;prompt='Har qatorda dastlabki ikki katak qanday bog‘langan? Bo‘sh katakni to‘ldiring.';visual={kind:'matrix',cellKind:'dots',cells:[1,b,1+b,2,c,2+c,a,c,null]};distractors=[expected+1,a,Math.max(0,expected-1)];explanation=`Har qatorda nuqtalar qo‘shiladi. Oxirgi qatorda ${a} + ${c} = ${expected} ta nuqta.`;rule='rowSum';parameters={a,c};}
   if(family===1){const idx=band*4+v,a=idx%3,dir=Math.floor(idx/3)%2?-1:1,mod=n=>(n+12)%3,rows=Array.from({length:3},(_,r)=>Array.from({length:3},(_,c)=>mod(a+dir*(r+c))));if(idx>=6)[rows[0],rows[1]]=[rows[1],rows[0]];const cells=rows.flat();expected=cells[8];cells[8]=null;prompt='Har qator va ustunda doira, uchburchak va kvadrat bir martadan uchraydi. Yetishmagan shakl qaysi?';visual={kind:'matrix',cellKind:'shape',cells};distractors=[(expected+1)%3,(expected+2)%3,3];explanation='Qator va ustunlarda uchta shakl bir martadan uchraydi. Romb bu uchlikka kirmaydi.';rule='latin';parameters={a};}
   if(family===2){const masks=Array.from({length:15},(_,i)=>i+1),a=masks[(v+band*4)%15],b=masks[(v+band*4+3)%15];expected=a^b;prompt='Ustma-ust qo‘yilganda ikkala katakda bor bo‘lak o‘chadi, faqat bittasida bor bo‘lak qoladi. Uchinchi katakni toping.';visual={kind:'matrix',cellKind:'tiles',cells:[1,2,3,3,1,2,a,b,null]};distractors=[expected^1,expected^2,expected^4];explanation='Bir xil joydagi ikkita bo‘lak bekor bo‘ladi. Faqat bittasida bo‘lgan bo‘laklar yakuniy shaklda qoladi.';rule='xor';parameters={a,b};}
  }
  if(domain==='logic'){
   if(family===0){const names=[['doiralar','ko‘k shakllar','belgilangan shakllar'],['kvadratlar','katta shakllar','ko‘k shakllar'],['X guruhidagilar','Y guruhidagilar','Z guruhidagilar'],['uchburchaklar','kichik shakllar','belgilangan shakllar'],['romblar','qizil shakllar','ramkadagi shakllar'],['yulduzlar','yashil shakllar','katta shakllar'],['R guruhidagilar','S guruhidagilar','T guruhidagilar'],['beshburchaklar','sariq shakllar','ramkadagi shakllar'],['P guruhidagilar','Q guruhidagilar','R guruhidagilar'],['kichik doiralar','oq shakllar','chegaradagi shakllar'],['olti burchaklar','qora shakllar','belgilangan shakllar'],['M guruhidagilar','N guruhidagilar','O guruhidagilar']][band*4+v];prompt=`Barcha ${names[0]} — ${names[1]}. Barcha ${names[1]} — ${names[2]}. Qaysi xulosa albatta kelib chiqadi?`;expected=`Barcha ${names[0]} — ${names[2]}.`;distractors=[`Barcha ${names[2]} — ${names[0]}.`,`Hech bir ${names[0]} — ${names[2]} emas.`,`Barcha ${names[2]} — ${names[1]}.`];explanation='Birinchi to‘plam ikkinchisining, ikkinchisi uchinchisining ichida. Demak birinchisi uchinchiga kiradi; teskari yo‘nalish kafolatlanmaydi.';visual={kind:'sets',labels:['X','Y','Z'],legend:names};rule='inclusion';parameters={names};}
   if(family===1){const names=[['Ali','Lola','Aziz'],['Nodira','Dilshod','Malika'],['Sardor','Zilola','Otabek'],['Madina','Javlon','Anvar'],['Gulnora','Akmal','Diyor'],['Laylo','Komil','Aziza'],['Kamola','Olim','Ozoda'],['Nargiza','Umid','Farida'],['Zafar','Iroda','Said'],['Nilufar','Islom','Shahnoza'],['Baxtiyor','Feruza','Adham'],['Munisa','Temur','Murod']][band*4+v];prompt=`${names[0]} ${names[1]}dan oldinda. ${names[1]} ${names[2]}dan oldinda. Uchalasidan kim eng oldinda?`;expected=names[0];distractors=[names[1],names[2],'Aniqlab bo‘lmaydi'];explanation=`Tartib: ${names.join(' → ')}. Ikki berilgan munosabatdan eng oldinda ${names[0]} ekanligi kelib chiqadi.`;visual={kind:'text'};rule='ordering';parameters={names};}
   if(family===2){const names=[['to‘rtburchak','qizil'],['doira','katta'],['uchburchak','belgilangan'],['romb','yashil'],['beshburchak','ko‘k'],['yulduz','sariq'],['olti burchak','katta'],['kvadrat','kichik'],['doira','belgilangan'],['uchburchak','oq'],['romb','katta'],['kvadrat','qora']][band*4+v];prompt=`Bu vazifadagi barcha ${names[0]}lar ${names[1]}. P shakli ${names[1]} emas. P haqida nimani aniq aytish mumkin?`;expected=`P — ${names[0]} emas.`;distractors=[`P — ${names[0]}.`,`P — ${names[1]}.`,'P haqida hech qanday xulosa yo‘q.'];explanation=`Agar P ${names[0]} bo‘lganida ${names[1]} bo‘lishi kerak edi. Bu shart bajarilmaydi, shuning uchun P bu guruhga kirmaydi.`;visual={kind:'text'};rule='contrapositive';parameters={names};}
  }
  if(domain==='spatial'){
   const shape=band===0?points:band===1?[...points,[2,2]]:[...points,[2,2],[1,1]],p=rotate(shape,(v+band)%4);
   if(family===0){const k=band===2?2:1;expected=rotate(p,k);prompt=`Shaklni markaz atrofida soat yo‘nalishida ${k*90}° buring. Qaysi natija mos?`;distractors=[rotate(p,(k+1)%4),rotate(p,(k+2)%4),rotate(p,(k+3)%4)];visual={kind:'gridShape',points:p};explanation=`Kataklar markaz atrofida ${k*90}° buriladi. Shaklning kataklari soni va bir-biriga ulanishi saqlanadi.`;rule='rotation';parameters={points:p,k};}
   if(family===1){expected=p.map(([x,y])=>[2-x,y]);prompt='Shaklni o‘rtadagi tik o‘qqa nisbatan akslantiring. O‘ng va chap o‘rin almashadi. Natijani tanlang.';distractors=[p,p.map(([x,y])=>[x,2-y]),p.map(([x,y])=>[2-x,2-y])];visual={kind:'gridShape',points:p,axis:true};explanation='Tik ko‘zgu o‘qida balandlik saqlanadi, chapdagi katak o‘ngga o‘tadi. Burish bilan akslantirish turli amallar.';rule='reflection';parameters={points:p};}
   if(family===2){const a=v,step=band+1;expected=(a+3*step)%4;distractors=[(expected+1)%4,(expected+2)%4,(expected+3)%4];prompt=`Har gal strelka soat yo‘nalishida ${step*90}° buriladi. Keyingi yo‘nalishni toping.`;visual={kind:'arrows',values:[a,(a+step)%4,(a+2*step)%4]};explanation=`Har qadam ${step*90}° burilish. Oxirgi strelkani yana shuncha burib keyingi yo‘nalishni toping.`;rule='arrow';parameters={a,step};}
  }
  const c=choices(expected,distractors,seed);bank.push({id,band,domain,family,order:family*4+v,prompt,visual,...c,explanation,rule,parameters,version:1});
 }
 return bank;
}
export {rotate};
