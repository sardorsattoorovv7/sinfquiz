import {solidMeasures,polygonArea} from '../math-atlas-math.js';
const n=(key,label,initial,min,max,unit='',step=1)=>({key,label,initial,min,max,unit,step});
const choices=(key,label,initial,options)=>({key,label,initial,options,type:'enum'});
const dim=(key,label,initial=3)=>n(key,label,initial,1,8,' m',.5);
const metric=(label,value,unit='')=>({label,value,unit});
export function mathRealitySpec(topic){
 const id=topic.templateId||topic.id,s=topic.scene;let kind=s,controls;
 if(s==='number')controls=[n('start','Boshlang‘ich harorat',-3,-10,10,' °C'),n('change','Harorat o‘zgarishi',5,-10,10,' °C')];
 else if(id==='ulush-foiz')controls=[n('price','Boshlang‘ich narx',200,20,500,' ming so‘m',10),n('discount','Chegirma',25,0,100,' %',5)];
 else if(id==='nisbat')controls=[n('syrup','Sirop',1,1,6,' stakan'),n('water','Suv',3,1,18,' stakan')];
 else if(s==='fraction')controls=[n('numerator','Olingan qismlar',3,0,10),n('denominator','Jami teng qismlar',10,1,12)];
 else if(id==='tengsizlik')controls=[n('load','Yuk massasi',3,0,10,' kg',.5)];
 else if(s==='balance')controls=[n('count','Daftarlar soni',3,1,10),n('extra','Qo‘shimcha xarid',2,0,10,' ming so‘m'),n('total','Jami chek',17,11,60,' ming so‘m')];
 else if(['coordinate','line'].includes(s))controls=[n('x','Gorizontal masofa',3,-6,6,' m'),n('y','Vertikal masofa',4,-6,6,' m')];
 else if(s==='expression')controls=id==='amal-tartibi'?[choices('bracket','Hisoblash tartibi','normal',[['normal','2 + 3 × 4'],['bracket','(2 + 3) × 4']])]:[n('x',id==='ozgaruvchi'?'Bir chipta narxi':id==='ifoda'?'Yo‘l masofasi':'x uzunlik',3,1,8,id==='ozgaruvchi'?' ming so‘m':id==='ifoda'?' km':' m')];
 else if(s==='linear')controls=[n('x',id==='grafiklar'?'Vaqt':'Yo‘l masofasi',5,0,15,id==='grafiklar'?' min':' km'),n('m',id==='grafiklar'?'Oqim tezligi':'Har km uchun narx',2,1,5,id==='grafiklar'?' l/min':' ming so‘m/km'),n('b',id==='grafiklar'?'Boshlang‘ich suv':'Boshlang‘ich to‘lov',3,0,10,id==='grafiklar'?' l':' ming so‘m')];
 else if(s==='quadratic')controls=[n('speed','Boshlang‘ich tik tezlik',10,2,20,' m/s'),n('height','Boshlang‘ich balandlik',1,0,5,' m',.5)];
 else if(s==='power')controls=id==='ildizlar'?[n('area','Bog‘ yuzasi',49,1,100,' m²')]:id==='logarifm'?[n('base','Ko‘payish asosi',2,2,5),n('amount','Yakuniy miqdor',32,1,128)]:[n('base','Ko‘payish asosi',2,1,4),n('exponent','Bosqichlar soni',3,0,6)];
 else if(s==='sequence')controls=[n('first','Boshlang‘ich pul',10,0,50,' ming so‘m',5),n('step','Har hafta qo‘shiladi',5,1,10,' ming so‘m'),n('weeks','Haftalar',4,1,12)];
 else if(['angle','triangle'].includes(s))controls=id==='trigonometriya'?[dim('a','Binogacha masofa',4),n('angle','Ko‘tarilish burchagi',45,10,75,' °',5)]:s==='angle'?[n('angle','Ochish burchagi',90,0,150,' °',5)]:id==='teng-tomonli'?[dim('a','Tomon',4)]:[dim('a',id==='pifagor'||id==='togri-uchburchak'?'Gorizontal katet':'Asos',3),dim('b',id==='pifagor'||id==='togri-uchburchak'?'Tik katet':'Tik balandlik',4)];
 else if(s==='transform')controls=id==='simmetriya'?[n('dx','O‘qdan masofa',2,.5,4,' m',.5)]:[n('scale','Masshtab koeffitsiyenti',id==='kochirish'?1:2,.5,4,'',.5),n('dx','Gorizontal siljish',2,-4,4,' m'),n('angle','Burilish',30,0,180,' °',15)];
 else if(s==='statistics')controls=[n('minutes','Beshinchi o‘quvchi o‘qigan vaqt',30,0,120,' min',5)];
 else if(s==='probability')controls=[n('red','Qizil sharlar',3,0,10),n('blue','Ko‘k sharlar',7,1,10)];
 else if(['cube','cuboid','prism','pyramid','cylinder','cone','sphere'].includes(s))controls=['sphere'].includes(s)?[dim('r','Radius',2)]:['cylinder','cone'].includes(s)?[dim('r','Radius',2),dim('h','Balandlik',3)]:s==='cube'?[dim('a','Tomon',3)]:s==='pyramid'?[dim('a','Asos tomoni',3),dim('h','Tik balandlik',4)]:s==='prism'?[dim('a','Asos kateti',3),dim('b','Asosning ikkinchi kateti',4),dim('h','Prizma uzunligi',5)]:[dim('a','Uzunlik',3),dim('b','En',2),dim('c','Balandlik',4)];
 else if(s==='circle')controls=[n('r','G‘ildirak radiusi',.35,.1,1.2,' m',.05)];
 else if(s==='polygon')controls=id==='nomuntazam-kopburchak'?[n('shift','Yuqori burchak siljishi',1,0,4,' m',.5)]:[n('sides','Tomonlar soni',6,3,10),dim('r','Tashqi radius',3)];
 else controls=s==='square'?[dim('a','Tomon',3)]:s==='trapezoid'?[dim('a','Quyi asos',5),dim('b','Yuqori asos',3),dim('h','Tik balandlik',2)]:s==='rhombus'?[dim('a','Birinchi diagonal',4),dim('b','Ikkinchi diagonal',3)]:[dim('a','Asos / uzunlik',4),dim('b','Tik balandlik / en',3)];
 return {kind,controls,defaults:Object.fromEntries(controls.map(c=>[c.key,c.initial]))};
}
export function mathRealityResult(topic,p,q=1){
 const id=topic.templateId||topic.id,s=topic.scene;let formula='',explanation='',metrics=[];const m=(...args)=>metrics.push(metric(...args));
 if(s==='number'){formula='T₂ = T₁ + ΔT';m('Joriy harorat',p.start+p.change*q,'°C');m('Yakuniy harorat',p.start+p.change,'°C');explanation='Bosqich o‘zgarganda termometr boshlang‘ich qiymatdan yakuniy qiymatga siljiydi. Bu muhitning termodinamik modeli emas, sonli o‘zgarishning ko‘rinishi.';}
 else if(id==='ulush-foiz'){formula='Chegirma = narx × foiz / 100';m('Chegirma',p.price*p.discount/100,'ming so‘m');m('To‘lanadi',p.price*(1-p.discount/100),'ming so‘m');}
 else if(id==='nisbat'){formula='Suv / sirop = 3 bo‘lsa 1:3 retsept';m('Suv / sirop',p.water/p.syrup);m('Jami hajm',p.water+p.syrup,'stakan');}
 else if(s==='fraction'){formula='Ulush = surat / maxraj';m('Ulush',p.numerator/p.denominator);m('Foiz',100*p.numerator/p.denominator,'%');explanation=p.numerator>p.denominator?'Noto‘g‘ri kasr: bir butundan ortiq. Tasvir bir nechta butun bilan ko‘rsatiladi.':'Butun teng qismlarga bo‘lingan.';}
 else if(id==='tengsizlik'){formula='m ≤ 5 kg';m('Yuk',p.load,'kg');m('Qolgan ruxsat',5-p.load,'kg');explanation=p.load<=5?'Yuk chegaraga mos.':'Yuk chegaradan oshgan.';}
 else if(s==='balance'){formula=`${p.count}x + ${p.extra} = ${p.total}`;m('Bir daftar narxi',(p.total-p.extra)/p.count,'ming so‘m');}
 else if(s==='coordinate'){formula='d = √(Δx² + Δy²)';m('x',p.x,'m');m('y',p.y,'m');m('Boshlanishdan masofa',Math.hypot(p.x,p.y),'m');}
 else if(s==='line'){formula=id==='parallel'?'Parallel chiziqlar kesishmaydi':'Kesma uzunligi = √(Δx² + Δy²)';m('Ko‘rsatilgan oraliq',Math.hypot(p.x,p.y),'m');explanation='Nur va to‘g‘ri chiziqning to‘liq uzunligi cheksiz; son faqat tasvirdagi ikki belgi oralig‘i.';}
 else if(s==='expression'){if(id==='amal-tartibi'){formula=p.bracket==='bracket'?'(2 + 3) × 4':'2 + 3 × 4';m('Chek hisobi',p.bracket==='bracket'?20:14);}else if(id==='ozgaruvchi'){formula='3x';m('Uch chipta',3*p.x,'ming so‘m');}else if(id==='ifoda'){formula='2000x + 3000';m('Yo‘l haqi',2000*p.x+3000,'so‘m');}else {formula='x² + 3x + 2 = (x+1)(x+2)';m('Yuza',(p.x+1)*(p.x+2),'m²');m('Birinchi tomon',p.x+1,'m');m('Ikkinchi tomon',p.x+2,'m');}}
 else if(s==='linear'){formula='y = mx + b';m(id==='grafiklar'?'Suv hajmi':'1-tarif narxi',p.m*p.x+p.b,id==='grafiklar'?'l':'ming so‘m');if(id==='sistema'){m('2-tarif narxi',p.x+8,'ming so‘m');if(p.m!==1)m('Tariflar teng masofa',(8-p.b)/(p.m-1),'km');else explanation=p.b===8?'Tariflar barcha masofada bir xil.':'Parallel tariflar: tenglashish nuqtasi yo‘q.';}}
 else if(s==='quadratic'){const end=(p.speed+Math.sqrt(p.speed*p.speed+19.62*p.height))/9.81,t=end*q;formula='h = h₀ + v₀t − gt²/2; g = 9,81 m/s²';m('Vaqt',t,'s');m('Balandlik',Math.max(0,p.height+p.speed*t-4.905*t*t),'m');m('Yerga qaytish',end,'s');explanation='Tik otilgan to‘p, havo qarshiligi yo‘q.';}
 else if(s==='power'){if(id==='ildizlar'){formula='a = √S';m('Bog‘ tomoni',Math.sqrt(p.area),'m');}else if(id==='logarifm'){formula='n = log_b(N)';m('Bosqichlar soni',Math.log(p.amount)/Math.log(p.base));explanation='Butun bo‘lmagan qiymat ikki butun bosqich orasidagi logarifmik qiymat.';}else {formula='N = bⁿ';m('Kataklar soni',p.base**p.exponent);}}
 else if(s==='sequence'){formula='Jami = boshlang‘ich + hafta × qo‘shimcha';m('Jamg‘arma',p.first+p.weeks*p.step,'ming so‘m');}
 else if(s==='angle'){formula=id==='perpendikulyar'?'Tik burchak = 90°':'Burilish burchagi';m('Burchak',p.angle,'°');explanation=p.angle===90?'Perpendikulyar holat.':p.angle<90?'O‘tkir burchak.':'O‘tmas burchak.';}
 else if(s==='triangle'){if(id==='trigonometriya'){formula='h = d · tan(α)';m('Bino balandligi',p.a*Math.tan(p.angle*Math.PI/180),'m');explanation='Kuzatish nuqtasi yer sathida deb olingan; qurilma balandligi qo‘shilmagan.';}else if(['pifagor','togri-uchburchak'].includes(id)){formula='c² = a² + b²';m('Narvon uzunligi',Math.hypot(p.a,p.b),'m');m('Uchburchak yuzi',p.a*p.b/2,'m²');}else if(id==='teng-tomonli'){formula='S = √3 · a² / 4';m('Yuza',Math.sqrt(3)*p.a*p.a/4,'m²');m('Har burchak',60,'°');}else {formula='S = ah / 2';m('Yopma yuzasi',p.a*p.b/2,'m²');if(id==='teng-yonli')m('Teng yon',Math.hypot(p.a/2,p.b),'m');}}
 else if(s==='transform'){if(id==='simmetriya'){formula='x′ = −x';m('Asl nuqta x',-p.dx,'m');m('Aks x',p.dx,'m');m('O‘qdan masofa',p.dx,'m');explanation='Akslantirish masofalarni saqlaydi; ikkala nuqta o‘qdan teng uzoqlikda.';}else {formula=id==='masshtab'?'1:1000 da 1 sm = 10 m':'Uzunlik × k; yuza × k²';m('Uzunlik koeffitsiyenti',p.scale);m('Yuza koeffitsiyenti',p.scale*p.scale);if(id==='masshtab')m('Xaritadagi k sm ga mos',p.scale*10,'m');explanation='Burish va ko‘chirish yuzani saqlaydi; masshtab o‘zgarsa yuza ham o‘zgaradi.';}}
 else if(s==='statistics'){formula='O‘rtacha = yig‘indi / soni';m('O‘rtacha vaqt',(10+20+30+40+p.minutes)/5,'min');m('Jami vaqt',100+p.minutes,'min');}
 else if(s==='probability'){formula='P(qizil) = qizil / jami';m('Qizil ehtimoli',p.red/(p.red+p.blue));m('Jami sharlar',p.red+p.blue);}
 else if(['cube','cuboid','prism','pyramid','cylinder','cone','sphere'].includes(s)){const r=solidMeasures(s,p);formula=r.formula;m('Ichki hajm',r.volume,'m³');m('Sirt yuzasi',r.surface,'m²');explanation='Devor qalinligi va material isrofi olinmagan.';}
 else if(s==='circle'){formula='C = 2πr; S = πr²';m('Bir aylanishdagi yo‘l',2*Math.PI*p.r,'m');m('Doira yuzasi',Math.PI*p.r*p.r,'m²');}
 else if(s==='polygon'){if(id==='nomuntazam-kopburchak'){formula='Koordinatalar bo‘yicha yuza';m('Hovli yuzasi',polygonArea([{x:0,y:0},{x:5,y:0},{x:4+p.shift,y:3},{x:1,y:4}]),'m²');}else {formula='S = nr²sin(2π/n)/2';m('Plitka yuzasi',p.sides*p.r*p.r*Math.sin(2*Math.PI/p.sides)/2,'m²');m('Perimetr',2*p.sides*p.r*Math.sin(Math.PI/p.sides),'m');}}
 else {let area,perimeter;formula='S = ah';if(s==='square'){area=p.a*p.a;perimeter=4*p.a;formula='S = a²; P = 4a';}else if(s==='trapezoid'){area=(p.a+p.b)*p.h/2;formula='S = (a+b)h/2';}else if(s==='rhombus'){area=p.a*p.b/2;formula='S = d₁d₂/2';perimeter=4*Math.hypot(p.a/2,p.b/2);}else {area=p.a*p.b;if(s!=='parallelogram')perimeter=2*(p.a+p.b);}m('Qoplama yuzasi',area,'m²');if(perimeter!==undefined)m('Chegara uzunligi',perimeter,'m');}
 return {metrics,formula,explanation};
}
