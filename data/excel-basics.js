// Original beginner questions. Function behaviour checked against Microsoft Support.
export const excelBasicsSource='https://support.microsoft.com/en-us/excel/functions/average-function';
const theory=[
 ['Excelda katak (yacheyka) qayerda hosil bo‘ladi?',['Ustun va qator kesishgan joyda','Ikki fayl orasida','Faqat jadval sarlavhasida','Faqat sahifa chetida'],0,'Har bir katak bitta ustun va bitta qatorga tegishli.'],
 ['Ustunlar odatda qanday belgilanadi?',['1, 2, 3','A, B, C','I, II, III','Faqat ranglar bilan'],1,'Ustunlar harf, qatorlar raqam bilan belgilanadi.'],
 ['Qatorlar qanday belgilanadi?',['Harf bilan','Fayl nomi bilan','1, 2, 3 kabi raqam bilan','Foiz bilan'],2,'Chap tomondagi raqamlar qator tartibini bildiradi.'],
 ['C4 manzili nimani bildiradi?',['C qator, 4 ustun','4-qatorning hamma kataklari','C ustundagi hamma kataklar','C ustun va 4-qator kesishmasi'],3,'Avval ustun harfi, keyin qator raqami yoziladi.'],
 ['B ustun va 3-qator kesishmasining manzili qaysi?',['B3','3B','B:3','BB3'],0,'Katak manzili B3 shaklida yoziladi.'],
 ['Oddiy formula qaysi belgi bilan boshlanadi?',['+','=',':','#'],1,'Masalan, =2+3 formulasi 5 natija beradi.'],
 ['Excelda ko‘paytirish operatori qaysi?',['x',':','*','&'],2,'Kompyuter formulasida ko‘paytirish uchun * ishlatiladi.'],
 ['Bo‘lish operatori qaysi?',['-',':','%','/'],3,'=12/3 natijasi 4 bo‘ladi.'],
 ['=7+5 formulasining natijasi nechaga teng?',['12','35','2','75'],0,'+ operatori ikki sonni qo‘shadi.'],
 ['=10-4 formulasining natijasi nechaga teng?',['14','6','40','2.5'],1,'- operatori ayirish amalini bajaradi.'],
 ['=3*4 formulasining natijasi nechaga teng?',['7','1','12','34'],2,'3 ni 4 ga ko‘paytirsak 12 chiqadi.'],
 ['=20/5 formulasining natijasi nechaga teng?',['25','15','100','4'],3,'20 ni 5 ga bo‘lsak 4 chiqadi.'],
 ['B2 da 8, C2 da 5 bo‘lsa, =B2+C2 nima beradi?',['13','85','3','40'],0,'Formula katak ichidagi sonlardan foydalanadi.'],
 ['=2+3*4 formulasining natijasi qaysi?',['20','14','24','9'],1,'Ko‘paytirish qo‘shishdan oldin bajariladi: 2+12=14.'],
 ['=(2+3)*4 formulasining natijasi qaysi?',['14','9','20','24'],2,'Qavs ichidagi 2+3 avval hisoblanadi, keyin 4 ga ko‘paytiriladi.'],
 ['B2:B4 oralig‘iga qaysi kataklar kiradi?',['B2 va B4 xolos','B2, C2, D2','A2, A3, A4','B2, B3, B4'],3,'Ikki nuqta oraliqning boshlanishi va tugashini bog‘laydi.'],
 ['5, 7 va 8 sonlarining yig‘indisini qaysi funksiya topadi?',['SUM','AVERAGE','PRINT','TYPE'],0,'SUM sonlarni qo‘shadi: 5+7+8=20.'],
 ['4, 5 va 3 sonlarining arifmetik o‘rtachasi nechaga teng?',['12','4','5','3'],1,'Yig‘indi 12, sonlar soni 3: 12/3=4.'],
 ['Sonlarning o‘rtachasini qaysi funksiya hisoblaydi?',['SUM','MAX','AVERAGE','INPUT'],2,'AVERAGE sonlar yig‘indisini ularning soniga bo‘ladi.'],
 ['B2=4, B3 bo‘sh, B4=0. =AVERAGE(B2:B4) natijasi qaysi?',['4/3','4','0','2'],3,'Bo‘sh katak hisobga olinmaydi. 0 esa son: (4+0)/2=2.'],
];
const practical=[
 ['C ustun va 3-qator kesishmasining manzilini yozing.','C3',[],'Katak manzilida ustun harfi raqamdan oldin keladi.'],
 ['B2 va C2 kataklarini qo‘shadigan formula yozing.','=B2+C2',['=C2+B2'],'Formula = bilan boshlanadi; kataklarni + bilan bog‘lang.'],
 ['B2 dagi miqdorni C2 dagi narxga ko‘paytiradigan formula yozing.','=B2*C2',['=C2*B2'],'Ko‘paytirish operatori *; natija manba kataklar o‘zgarsa yangilanadi.'],
 ['B2 dagi sonni C2 dagi songa bo‘ladigan formula yozing.','=B2/C2',[],'Bo‘lish operatori /. Bo‘luvchi nol bo‘lmasligi kerak.'],
 ['B2, B3 va B4 dagi sonlarning o‘rtachasini formula bilan toping.','=AVERAGE(B2:B4)',['=(B2+B3+B4)/3'],'Uch katak oralig‘i B2:B4. AVERAGE bilan yoki yig‘indini 3 ga bo‘lib hisoblash mumkin.'],
 ['B2 dan B4 gacha bo‘lgan sonlarning yig‘indisini formula bilan toping.','=SUM(B2:B4)',['=B2+B3+B4'],'SUM butun oraliqdagi sonlarni qo‘shadi.'],
];
export const excelBeginnerTemplateIds=['excel-cells-first','excel-add-subtract','excel-multiply-divide','excel-sum-first','excel-average-first','excel-order-first'];
const tasks=[
 'A2 katakka Matematika, B2 katakka 12 yozing. Katakning harfi va raqamiga e’tibor bering.',
 'D2 da B2+C2, D3 da B3-C3 ni formula orqali hisoblang.',
 'D2 da B2*C2, D3 da B3/C3 ni formula orqali hisoblang.',
 'B5 da B2:B4 sonlarining yig‘indisini SUM bilan hisoblang.',
 'B5 da B2:B4 sonlarining o‘rtachasini AVERAGE bilan hisoblang.',
 'D2 da B2 va C2 yig‘indisini 4 ga ko‘paytiring. Qavsdan foydalaning.',
];
export const excelBasicsQuiz={templateKey:'excel-beginner-7.22',title:'Excel: kataklardan formulalargacha',subject:'Excel',group:'Boshlang‘ich',color:'green',questions:[
 ...theory.map(([text,options,correct,explanation],i)=>({id:`excel-basic-${i+1}`,type:'test',subject:'Excel',text,options,correct,explanation,time:40,points:100})),
 ...practical.map(([text,answer,acceptedAnswers,explanation],i)=>({id:`excel-basic-write-${i+1}`,type:'practical',subject:'Excel',text,answer,acceptedAnswers,explanation,time:90,points:100})),
 ...excelBeginnerTemplateIds.map((officeTemplate,i)=>({id:`excel-basic-office-${i+1}`,type:'office',subject:'Excel',text:tasks[i],officeTemplate,explanation:'Sonni tayyor javob bilan almashtirmang. Ko‘rsatilgan kataklardan foydalanib amalni bajaring.',time:180,points:200})),
]};
