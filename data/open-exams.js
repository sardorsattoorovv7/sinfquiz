import passages from './open-passages.json';
import pythonQuestions from './python-basics.json';
export const sourcePassages=passages;
const sources=Object.fromEntries(passages.map(p=>[p.id,p]));
function choice(id,text,answer,wrong,explanation,group){
 const options=[answer,...wrong],shift=Number(id.replace(/\D/g,''))%options.length;
 const rotated=[...options.slice(shift),...options.slice(0,shift)];
 return {id,text,type:'choice',options:rotated,answer:answer,explanation,group,sourceReference:id};
}
const original=(group,rows)=>rows.map(([answer,wrong,explanation],i)=>({...choice(group+'-'+(i+1),sources[group].questions[i],answer,wrong,explanation,group),sourceReference:'Comprehension Questions '+(i+1)}));
const english=[
 ...original('teacher',[
 ['Kathy Mellor, Rhode Island',['Nancy Steinbach, New York','Laura Bush, California','Faith Lapidus, Texas'],'Birinchi paragrafda ism va yashash joyi berilgan.'],
 ['Travel and speak about education',['Open a new university','Work as a newspaper editor','Move every student to another school'],'Oxirgi paragrafda uning AQSh va boshqa mamlakatlarga safarlari tushuntirilgan.'],
 ['One to three ESL periods according to skill level',['The same four lessons for every student','Only mathematics lessons','No classes with native speakers'],'Darslar soni listening, speaking, reading va writing ko‘nikmalariga bog‘liq.'],
 ['She formed a local parents group',['She banned home languages','She replaced teachers with parents','She closed family meetings'],'Ota-onalar guruhi bolalarga yordam berish imkonini oshirgan.'],
 ['The Council of Chief State School Officers and Scholastic',['The World Bank and NASA','Brown University alone','The local parents group'],'Matnda tanlovni tashkil qiluvchi ikki tashkilot nomi berilgan.']
 ]),
 ...original('motomen',[
 ['Electronic mail',['Electric motor','Emergency map','External memory'],'Manbadagi javob kaliti: Electronic mail.'],
 ['Thirteen',['Five','Thirty','One hundred'],'Birinchi gapda thirteen villages deyiladi.'],
 ['Sell their products internationally over the Internet',['Replace all village schools','Stop using solar energy','Move everyone to the capital'],'Loyiha fermer va qishloq aholisi uchun jahon bozoriga chiqishni ko‘zlagan.'],
 ['$500 per village',['$40 per village','$5,000 per student','$13 for the whole project'],'First Mile Solutions haqidagi paragrafda xarajat ko‘rsatilgan.'],
 ['Jill Moss',['Robert Cohen','Nancy Steinbach','Mario Ritter'],'Matnni Jill Moss yozgan; Robert Cohen uni o‘qigan.']
 ]),
 ...original('outsourcing',[
 ['Moving work to businesses with lower costs',['Making every product at home','Closing international trade','Only selling computer programs'],'Birinchi paragraf va asl javob kalitidagi ta’rif.'],
 ['They fear losing jobs to foreign workers',['They want higher import costs','They cannot watch television','They oppose all worker training'],'Mehnat guruhlari ish o‘rinlari yo‘qolishidan xavotir olgan.'],
 ['About 2.5 million',['About 250,000','About 25 million','About 500,000'],'Savol 2004-yil matnidagi davrga tegishli; hozirgi statistika emas.'],
 ['Lower costs and gains from international trade',['Guaranteed jobs for every worker','An end to foreign competition','Higher production costs'],'Mankiw va WTO vakili past xarajat va savdo o‘sishini dalil qilgan.'],
 ['Jobs are lost and domestic workers should be employed',['Imports are always unavailable','All wages immediately double','Companies cannot use technology'],'Asl javob kaliti AQShdagi ish o‘rinlarining yo‘qolishini ko‘rsatadi.']
 ]),
 ...original('ged',[
 ['Enter college and continue education',['Automatically receive a university degree','Become teachers without study','Avoid every further examination'],'Matnda GED bilan kollejga qabul qilinish imkoniyati aytilgan.'],
 ['More than 500,000',['Fewer than 5,000','Exactly 70,000','More than 50 million'],'Bu raqam 2004-yilda e’lon qilingan matnga tegishli.'],
 ['Writing, social studies, science, reading and mathematics',['Only reading and mathematics','Music, sport and art','English, French and geography'],'Matnda besh fan sanab o‘tilgan.'],
 ['About 11 percent',['About 70 percent','About 60 percent','About 90 percent'],'70% imtihondan o‘tish ulushi; 11% esa bir yil yoki undan ko‘p oliy ta’limni tugatganlar ulushi.'],
 ['It may require less sustained study and encourage early school leaving',['It takes too long and tests no subjects','It forbids college entry and tests only writing','It is available only to university graduates'],'Matndagi ikki tanqid alohida paragraflarda berilgan.']
 ]),
 choice('welcome-1','Who is meeting Anna?','Pete',['Jonathan','Marsha','Kathy'],'Dialogda Pete o‘zini tanishtiradi.','welcome'),
 {id:'welcome-2',group:'welcome',type:'text',text:'Write Anna’s name as she spells it (letters only).',answer:['Anna'],explanation:'A-N-N-A: ikkita n harfi.',sourceReference:'Conversation: Anna corrects the spelling'},
 {id:'welcome-3',group:'welcome',type:'text',text:'What is the street number of Anna’s new apartment?',answer:['1400'],explanation:'Pete: 1400 Irving Street.',sourceReference:'Conversation: address'},
 choice('welcome-4','Which expression is used when meeting someone?','Nice to meet you.',['See you yesterday.','How much is it?','Close the door.'],'Anna tanishganidan xursandligini shu ibora bilan aytadi.','welcome'),
 choice('welcome-5','What place is new for Anna?','Her apartment',['Her school','Her office','Her library'],'Oxirgi gap: My new apartment!','welcome'),
 {id:'hello-1',group:'hello',type:'text',text:'Jonathan lives in apartment ___.',answer:['B4'],explanation:'Jonathan: I am in apartment B4.',sourceReference:'Conversation: Jonathan'},
 {id:'hello-2',group:'hello',type:'text',text:'Anna lives in apartment ___.',answer:['C2'],explanation:'Anna: I am in apartment C2.',sourceReference:'Conversation: Anna'},
 {id:'hello-3',group:'hello',type:'text',text:'Pete lives in apartment ___.',answer:['D7'],explanation:'Pete: I am in Apartment D7.',sourceReference:'Conversation: Pete'},
 choice('hello-4','Where is Anna from?','A small town',['A large island','London','A place the dialogue does not mention'],'Anna: I am from a small town.','hello'),
 choice('hello-5','Who is Anna’s roommate?','Marsha',['Pete','Jonathan','Laura'],'Anna: Marsha is my roommate.','hello')
];
const mathSource={title:'A First Book in Algebra',publisher:'Wallace C. Boyden (1895)',sourceUrl:'https://www.gutenberg.org/ebooks/13309',rights:'Public domain',year:1895,adaptation:'Asl masalalar o‘zbekchaga tarjima qilingan; ayrim savollarda bitta noma’lum so‘raladi. Yechim izohlari SinfQuiz tomonidan yozilgan.'};
const math=[];
function number(group,n,text,answer,explanation,ref){
 math.push({id:group+'-'+n,group,type:'text',text,answer:[String(answer)],explanation,sourceReference:ref,numeric:true});
}
[
 ['Ikki son yig‘indisi 129. Kattasi kichigining ikki baravari. Kichik sonni toping.',43,'x + 2x = 129; 3x = 129; x = 43.','I.1'],
 ['500 dollarga ot va arava olindi. Arava otdan uch marta qimmat. Ot necha dollar?',125,'x + 3x = 500; x = 125.','I.2'],
 ['John va Charlesda jami 186 dollar bor. Johnda besh marta ko‘p. Charlesda necha dollar?',31,'x + 5x = 186; x = 31.','I.3'],
 ['64 sonini biri ikkinchisidan yetti marta katta bo‘lgan ikki qismga bo‘ling. Kichik qism?',8,'x + 7x = 64; x = 8.','I.4'],
 ['Yo‘lovchi bir kunda 24 mil yurdi. Ertalab tushdan keyingidan ikki marta ko‘p yurdi. Tushdan keyin necha mil?',8,'2x + x = 24; x = 8.','I.5'],
 ['72 sentga igna va ip olindi. Ip ignadan sakkiz marta qimmat. Igna necha sent?',8,'x + 8x = 72; x = 8.','I.6'],
 ['Maktabda 672 o‘quvchi bor. O‘g‘il bolalar qizlardan ikki marta ko‘p. O‘g‘il bolalar soni?',448,'Qizlar x: 3x = 672, x = 224. O‘g‘il bolalar 2x = 448.','I.7'],
 ['Ikki son ayirmasi 250. Kattasi kichigining 11 baravari. Kichik son?',25,'11x − x = 250; 10x = 250; x = 25.','I.8']
].forEach((v,i)=>number('ratio',i+1,...v.slice(0,3),'Exercise '+v[3]+', printed pp. 7–8'));
[
 ['2x + 17 = 147. x ni toping.',65,'2x = 130; x = 65.','4.4'],
 ['4x + 23 = 95. x ni toping.',18,'4x = 72; x = 18.','4.5'],
 ['3x − 25 = 47. x ni toping.',24,'3x = 72; x = 24.','4.6'],
 ['5x + 14 = 69. x ni toping.',11,'5x = 55; x = 11.','4.7'],
 ['Ikki uydagi xonalar jami 48. Ikkinchi uyda birinchidagidan ikki marta va yana 3 ta ko‘p xona bor. Birinchi uyda nechta xona?',15,'x + (2x + 3) = 48; x = 15.','4.9'],
 ['35 o‘quvchili sinfda qizlar o‘g‘il bolalardan 7 ta ko‘p. O‘g‘il bolalar soni?',14,'x + (x + 7) = 35; 2x = 28; x = 14.','3.1']
].forEach((v,i)=>number('linear',i+1,...v.slice(0,3),'Exercise '+v[3]+', printed pp. 10–12'));
const systems=[
 [1,1,4,3,-2,7,3,1],
 [1,-1,2,2,5,18,4,2],
 [5,2,47,2,-1,8,7,6],
 [4,-3,10,6,4,49,5.5,4],
 [8,-2,6,10,7,36,1.5,3],
 [2,-5,-11,3,1,9,2,3],
 [7,-3,41,2,1,12,77/13,2/13],
 [2,9,-5,11,15,7,2,-1]
];
const term=(v,s,first=false)=>(v<0?'−':first?'':'+')+(Math.abs(v)===1?'':Math.abs(v))+s;
systems.forEach(([a,b,c,d,e,f,x,y],i)=>{
 number('systems',i+1,term(a,'x',true)+' '+term(b,'y')+' = '+c+'; '+term(d,'x',true)+' '+term(e,'y')+' = '+f+'. x ni toping.',x,'Yechim: x = '+x+', y = '+y+'. Ikkala tenglamaga qo‘yilganda tenglik bajariladi.','Exercise 55.'+(i+1)+', printed pp. 110–111');
 math.at(-1).verification={kind:'system',a,b,c,d,e,f,x,y};
 if(i===6){math.at(-1).answer=['77/13'];math.at(-1).explanation='Ikkinchi tenglamadan y = 12 − 2x. Birinchiga qo‘ysak 13x − 36 = 41; x = 77/13, y = 2/13. Javobni kasr ko‘rinishida kiriting.'}
});
[
 ['5x² − 12 = 33',3,'5x² = 45; x² = 9; x = ±3.','56.1',[5,0,-45]],
 ['3x² + 4 = 16',2,'3x² = 12; x² = 4; x = ±2.','56.2',[3,0,-12]],
 ['4x² + 11 = 136 − x²',5,'5x² = 125; x² = 25; x = ±5.','56.3',[5,0,-125]],
 ['5(3x² − 1) = 11(x² + 1)',2,'15x² − 5 = 11x² + 11; x² = 4; x = ±2.','56.4',[4,0,-16]],
 ['x² + 3x = 18',3,'(x + 6)(x − 3) = 0; ildizlar −6 va 3.','57.1',[1,3,-18]],
 ['x² + 5x = 14',2,'(x + 7)(x − 2) = 0; ildizlar −7 va 2.','57.2',[1,5,-14]],
 ['x(x − 1) = 72',9,'(x − 9)(x + 8) = 0; ildizlar 9 va −8.','57.3',[1,-1,-72]],
 ['x² = 10x − 21',7,'(x − 3)(x − 7) = 0; ildizlar 3 va 7.','57.4',[1,-10,21]]
].forEach(([eq,answer,explanation,ref,coefficients],i)=>{number('quadratic',i+1,eq+'. Kattaroq ildizni toping.',answer,explanation,'Exercise '+ref+', printed pp. 113–114');math.at(-1).verification={kind:'quadratic',coefficients}});
const mathGroups=[['ratio','Nisbat va matnli masalalar'],['linear','Chiziqli tenglamalar'],['systems','Tenglamalar sistemasi'],['quadratic','Kvadrat tenglamalar']];
export const openGroups=[
 {id:'python',title:'Python asoslari',subject:'python',text:'',publisher:'SinfQuiz',rights:'Original questions',year:2026,sourceUrl:'https://docs.python.org/3/',adaptation:'Python rasmiy hujjatlariga tayangan holda yozilgan original savollar.',description:'IDE, print, type, int, str, bool va operatorlar.',questions:pythonQuestions},
 ...passages.map(p=>({...p,subject:'english',description:p.year===2004?'2004-yil arxiv matni; savollar aynan matnga tegishli.':'Kundalik inglizcha muloqot.',questions:english.filter(q=>q.group===p.id)})),
 ...mathGroups.map(([id,title])=>({...mathSource,id,title,subject:'math',text:'',description:'Manbadagi sonlar va masala shartlari saqlangan.',questions:math.filter(q=>q.group===id)}))
];
export const openQuestions=[...english,...math,...pythonQuestions];
export const openExams=[
 {id:'english-mixed',title:'Ingliz tili — aralash Reading',subject:'english',minutes:60,description:'6 ta asl matn · 30 ta savol · tanlash va qisqa javob',groups:passages.map(p=>p.id),questions:english},
 {id:'math-mixed',title:'Matematika — aralash algebra',subject:'math',minutes:60,description:'Nisbat, tenglama, sistema va kvadrat tenglama · 30 ta savol',groups:mathGroups.map(g=>g[0]),questions:math},
 ...openGroups.map(g=>({id:'unit-'+g.id,title:g.title,subject:g.subject,minutes:g.subject==='english'?12:20,description:g.description,groups:[g.id],questions:g.questions}))
];
export const getOpenExam=id=>openExams.find(e=>e.id===id);
export const getOpenGroup=id=>openGroups.find(g=>g.id===id);
