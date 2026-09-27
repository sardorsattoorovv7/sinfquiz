import {mkdir,writeFile} from 'node:fs/promises';
import {computerCourse} from '../data/computer-course.js';
import {courseGuides} from '../data/course-guides.js';

const root=new URL('../public/course-visuals/',import.meta.url);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const box=(x,y,w,h,fill='#fff',stroke='#cbd5e1',r=13)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const txt=(x,y,s,size=19,color='#1e293b',weight=500)=>`<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}">${esc(s)}</text>`;
const line=(x,y,x2,y2,color='#94a3b8')=>`<path d="M${x} ${y} L${x2} ${y2}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
const arrow=(x,y,x2,y2,color='#7c3aed')=>`${line(x,y,x2,y2,color)}<path d="M${x2-9} ${y2-7} L${x2} ${y2} L${x2-9} ${y2+7}" fill="none" stroke="${color}" stroke-width="3"/>`;
const wrap=(s,max=48)=>{const out=[''];for(const word of s.split(' ')){const n=out.length-1;if((out[n]+' '+word).trim().length>max)out.push(word);else out[n]=(out[n]+' '+word).trim()}return out};
const pill=(x,y,s,fill='#ede9fe',color='#5b21b6')=>`${box(x,y,Math.max(110,s.length*11+25),35,fill,fill,16)}${txt(x+13,y+24,s,15,color,700)}`;

const computer={
 'computer-intro':{type:'flow',nodes:['Klaviatura','Protsessor + RAM','SSD / ekran'],hint:'Buyruq → hisoblash → saqlash yoki ko‘rsatish'},
 'files-folders':{type:'tree',nodes:['Hujjatlar','Informatika','Word   Excel   Taqdimot','Mening_maktabim.docx'],hint:'Papka yo‘li faylni qayta topishga yordam beradi'},
 'keyboard':{type:'keys',nodes:['Shift','Enter','Backspace','Ctrl + S','Ctrl + Z','Ctrl + C / V'],hint:'Saqlash, qaytarish va nusxa olishni sinab ko‘ring'},
 'mouse':{type:'flow',nodes:['1 bosish: tanlash','2 bosish: ochish','O‘ng bosish: menyu'],hint:'Oyna sarlavhasini sudrab joyini o‘zgartiring'},
 'internet-safety':{type:'browser',nodes:['Manzil satri: sayt nomi','Muallif + sana','Ikkinchi mustaqil manba'],hint:'Qulf belgisi mazmun rostligini bildirmaydi'},
};
const word={
 'word-intro':['Home','Mening maktabim','Yangi hujjatni .docx shaklida saqlang','File → Save As'],
 'word-text':['Home','Mening maktabim','maktab so‘zini qidiring va tekshirib almashtiring','Ctrl + F'],
 'word-format':['Home','Kirish','Heading 2 uslubi Navigation Pane’da ko‘rinadi','Styles → Heading 2'],
 'word-layout':['Layout','Kutubxona qoidalari','A4, chetlar, sahifa raqami va ro‘yxat','Insert → Page Number'],
 'word-images':['Insert','Maktab kutubxonasi','Rasm yonida manba va tavsif yozing','Pictures / Wrap Text'],
 'word-tables':['Insert','Haftalik jadval','Fan | Kun | Soat: jadval kataklari','Table → 3 × 4'],
 'word-reference':['References','Mundarija','Heading uslublari asosida avtomatik mundarija','Table of Contents'],
 'word-practice':['Review','Tayyor hujjat','Imlo → sahifalar → PDF eksportni tekshiring','File → Export → PDF'],
};
const excel={
 'excel-intro':['Home','A1: Fan','B1: Ball','C1: Izoh','=SUM(B2:B5)','Katak manzili ustun harfi va satr raqamidan iborat'],
 'excel-entry':['Home','A2: Matematika','B2: 15','A3: Ingliz tili','B3: 18','Sarlavha, matn va sonni alohida kataklarga kiriting'],
 'excel-formulas':['Formulas','A1: Narx','B1: Soni','C2: =A2*B2','12000 × 3 = 36000','Formula = belgisi bilan boshlanadi'],
 'excel-functions':['Formulas','B2: 10','B3: 20','B4: 30','=AVERAGE(B2:B4) → 20','SUM, AVERAGE, MIN va MAX ni taqqoslang'],
 'excel-references':['Formulas','B1: 12%','A2: 100000','C2: =A2*$B$1','Natija: 12000','$B$1 manzili pastga nusxalanganda o‘zgarmaydi'],
 'excel-if':['Formulas','B2: 75','C2: =IF(B2>=60;"O‘tdi";"Qayta")','Natija: O‘tdi','Ayrim sozlamada vergul ajratgich ishlatiladi'],
 'excel-tables-filter':['Data','Fan: Matematika','Ball: 78','Fan: Ingliz tili','Ball: 85','Filter faqat mos satrlarni ko‘rsatadi; o‘chirmaydi'],
 'excel-charts':['Insert','Matematika: 78','Ingliz tili: 85','Tarix: 70','Ustunli diagramma','Nom va o‘qlarni ko‘rsating'],
 'excel-project':['Review','Oy: Yanvar','Kirim: 400000','Xarajat: 270000','Qoldiq: =B2-C2','Natijani qo‘lda ham tekshiring'],
};
const ppt={
 'ppt-intro':['Home','Mening taqdimotim','Sarlavha + asosiy fikr','New Slide'],
 'ppt-design':['Design','Maktab loyihasi','O‘qilishi oson shrift va qarama-qarshi rang','Themes'],
 'ppt-media':['Insert','Kutubxona','Rasmga mazmunli izoh yozing','Pictures / Alt Text'],
 'ppt-motion':['Transitions','1. Muammo → 2. Yechim','Slayd almashishi va obyekt harakati farq qiladi','Transitions / Animations'],
 'ppt-present':['Slide Show','Xulosa','Speaker Notes ma’ruzachiga ko‘rinadi','From Beginning'],
 'ppt-project':['Review','Yakuniy loyiha','Sarlavha → dalil → xulosa → manba','Rehearse / Export'],
};

function computerScene(spec){
 const {type,nodes,hint}=spec;
 if(type==='flow')return nodes.map((v,i)=>`${box(60+i*302,155,250,172,i===1?'#ede9fe':'#f8fafc',i===1?'#8b5cf6':'#cbd5e1')}${txt(82+i*302,222,v,20,'#1e293b',700)}${txt(82+i*302,268,['Kiritish','Qayta ishlash','Natija'][i],17,'#64748b')}${i<2?arrow(315+i*302,240,354+i*302,240):''}`).join('')+pill(92,380,hint,'#e0f2fe','#075985');
 if(type==='tree')return `${box(80,128,800,308,'#f8fafc')}${nodes.map((v,i)=>`${line(144+i*58,171+i*63,144+i*58,212+i*63)}${box(115+i*58,149+i*63,610-i*60,49,i===3?'#ede9fe':'#fff')}${txt(136+i*58,181+i*63,(i===3?'Fayl: ':'Papka: ')+v,19)}`).join('')}${pill(100,455,hint,'#e0f2fe','#075985')}`;
 if(type==='keys')return `${box(65,125,830,307,'#e2e8f0')}${nodes.map((v,i)=>{const x=91+(i%3)*270,y=150+Math.floor(i/3)*125;return `${box(x,y,243,94,i===3?'#ddd6fe':'#fff')}${txt(x+19,y+57,v,23,'#334155',700)}`}).join('')}${pill(110,457,hint,'#e0f2fe','#075985')}`;
 return `${box(68,126,825,320,'#fff')}${box(68,126,825,57,'#e2e8f0','#e2e8f0',12)}${txt(90,163,'●  ●  ●',20,'#64748b')}${pill(230,137,nodes[0],'#fff','#334155')}${nodes.slice(1).map((v,i)=>`${box(104,208+i*91,754,66,i?'#f0fdf4':'#f8fafc')}${txt(128,250+i*91,v,22)}`).join('')}${pill(140,457,hint,'#e0f2fe','#075985')}`;
}
function wordScene([tab,heading,body,control]){
 const tabs=['File','Home','Insert','Layout','References','Review'];
 return `${box(35,108,890,380,'#f8fafc')}${box(35,108,890,67,'#e2e8f0','#e2e8f0')}${tabs.map((t,i)=>txt(57+i*139,149,t,16,t===tab?'#6d28d9':'#475569',t===tab?800:500)).join('')}${line(56+tabs.indexOf(tab)*139,162,105+tabs.indexOf(tab)*139,162,'#7c3aed')}${box(54,189,235,263,'#fff')}${txt(71,222,'Tasma / buyruq',16,'#64748b')}${pill(70,247,control)}${box(322,190,535,280,'#fff')}${txt(348,238,heading,25,'#1e293b',750)}${line(348,253,798,253,'#cbd5e1')}${wrap(body,49).map((v,i)=>txt(348,299+i*27,v,17,'#475569')).join('')}${[0,1].map(i=>line(348,383+i*32,770-i*55,383+i*32,'#cbd5e1')).join('')}`;
}
function excelScene([tab,...cells]){
 const note=cells.pop();
 return `${box(32,105,896,376,'#fff')}${box(32,105,896,57,'#e2e8f0','#e2e8f0')}${txt(58,142,'Home       Insert       Formulas       Data       Review',17,'#475569')}${pill(77,172,tab)}${box(230,171,666,43,'#f8fafc')}${txt(248,199,cells.find(x=>x.startsWith('='))||'fx    Katakni tanlang',17,'#334155')}${['A','B','C','D'].map((t,i)=>`${box(72+i*207,235,207,43,'#ede9fe','#cbd5e1',1)}${txt(92+i*207,264,t,18,'#5b21b6',700)}`).join('')}${Array.from({length:3},(_,r)=>Array.from({length:4},(_,c)=>`${box(72+c*207,278+r*52,207,52,r===1&&c===2?'#dcfce7':'#fff','#cbd5e1',1)}`).join('')).join('')}${cells.map((v,i)=>txt(88+(i%3)*207,311+Math.floor(i/3)*52,v.replace(/^[A-D]\d?:\s*/,''),16,'#334155',i===0?700:500)).join('')}${pill(88,451,note,'#e0f2fe','#075985')}`;
}
function pptScene([tab,heading,body,control]){
 return `${box(34,112,892,375,'#f8fafc')}${box(34,112,892,54,'#e2e8f0','#e2e8f0')}${txt(60,146,`Home        Insert        Design        Transitions        Animations        Slide Show`,15,'#475569')}${box(54,188,164,117,'#ede9fe')}${txt(74,232,'1  Kirish',17,'#5b21b6',700)}${box(54,318,164,116,'#fff')}${txt(74,360,'2  Asosiy fikr',16)}${box(248,188,638,248,'#fff')}${txt(289,263,heading,27,'#1e293b',750)}${wrap(body,45).map((v,i)=>txt(290,315+i*29,v,20,'#475569')).join('')}${line(290,390,780,390,'#cbd5e1')}${pill(250,450,`${tab}: ${control}`,'#ede9fe','#5b21b6')}`;
}
await mkdir(root,{recursive:true});
for(const source of computerCourse){
 const slug=source.slug,guide=courseGuides[slug];
 let scene=computer[slug]?computerScene(computer[slug]):word[slug]?wordScene(word[slug]):excel[slug]?excelScene(excel[slug]):ppt[slug]?pptScene(ppt[slug]):null;
 if(!scene)throw Error(`Visual missing: ${slug}`);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 520" role="img" aria-labelledby="title desc"><title id="title">${esc(guide.visualTitle)}</title><desc id="desc">${esc(guide.visualCaption)} Bu dastur oynasining aynan skrinshoti emas, tushuntiruvchi sxema.</desc><rect width="960" height="520" fill="#f1f5f9"/>${txt(36,59,guide.visualTitle,27,'#172554',750)}${txt(36,87,'TUSHUNTIRUVCHI SXEMA',13,'#64748b',700)}${scene}</svg>`;
 await writeFile(new URL(`${slug}.svg`,root),svg);
}
console.log(`${computerCourse.length} SVG written to public/course-visuals`);
