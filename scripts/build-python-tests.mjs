import {readFileSync,writeFileSync} from 'node:fs';

// Bir xil original savollar ikki mashq oynasida ishlatiladi: 6 xonali kod va mustaqil test.
const docs='https://docs.python.org/3/';
const questions=[
 ['IDE','Kod yozgan o‘quvchi uni ishga tushirib, xatoni ko‘rmoqchi. Qaysi vosita aynan shu ishlarga yordam beradi?',null,['Dasturlash muhiti (masalan, IDLE)','Fayl siqish dasturi','Faqat rasm ko‘ruvchi','Printer drayveri'],0,'IDE kodni yozish, ishga tushirish va xatoni tekshirishda yordam beradi.','library/idle.html'],
 ['print','Quyidagi kod ekranda nima chiqaradi?','print("Fan:", "Python")',['Fan: Python','Fan:Python','"Fan:" "Python"','Hech narsa'],0,'print vergul bilan ajratilgan qiymatlar orasiga odatda bitta bo‘sh joy qo‘yadi.','library/functions.html#print'],
 ['O‘zgaruvchi','Ikkinchi qatordan so‘ng ball qancha bo‘ladi?','ball = 3\nball = ball + 4\nprint(ball)',['7','34','4','3'],0,'O‘ngdagi 3 + 4 hisoblanib, yangi 7 qiymati ball ga yoziladi.','tutorial/introduction.html'],
 ['type','Sonning matndan farqini tekshiring. Qaysi ikki tur chiqadi?','print(type("8").__name__)\nprint(type(8).__name__)',['str\nint','int\nstr','str\nstr','bool\nint'],0,'Qo‘shtirnoqli 8 matn; qo‘shtirnoqsiz 8 butun son.','library/functions.html#type'],
 ['input','O‘quvchi input orqali 12 kiritdi. Natijani hisoblash uchun avval nima qilish kerak?',null,['int() bilan songa aylantirish','print() bilan o‘chirish','type() bilan ikki marta bo‘lish','Hech narsa: input doim int'],0,'input har doim str qaytaradi; int("12") butun son hosil qiladi.','library/functions.html#input'],
 ['int va str','Matn songa aylantirilgach natija qancha?','print(int("12") + 3)',['15','123','12','Xato'],0,'int("12") natijasi 12 bo‘lib, 3 qo‘shilganda 15 chiqadi.','library/functions.html#int'],
 ['bool','Nol va bo‘sh bo‘lmagan matn uchun natija nima?','print(bool(0))\nprint(bool("0"))',['False\nTrue','False\nFalse','True\nTrue','True\nFalse'],0,'0 soni False; "0" esa ichida bitta belgi bor matn, shuning uchun True.','library/functions.html#bool'],
 ['Operatorlar','17 ta kitobni 5 ta javonga teng joylashtirsak nechta ortadi?','print(17 % 5)',['2','3','5','12'],0,'% bo‘lishdan qolgan qoldiqni hisoblaydi: 17 = 5 × 3 + 2.','tutorial/introduction.html'],
 ['Mantiqiy shart','Bahosi va davomat sharti birgalikda bajarildimi?','baho = 4\ndavomat = 80\nprint(baho >= 4 and davomat >= 75)',['True','False','4','80'],0,'Har ikkala solishtirish True, and natijasi ham True.','tutorial/controlflow.html'],
 ['if/else','Chegara 60 ball. 58 ball uchun qanday xabar chiqadi?','ball = 58\nif ball >= 60:\n    print("O‘tdi")\nelse:\n    print("Mashq qiling")',['Mashq qiling','O‘tdi','58','Hech narsa'],0,'58 >= 60 yolg‘on, shu sabab else bo‘limi bajariladi.','tutorial/controlflow.html#if-statements'],
 ['Ro‘yxat','Ikkinchi fan nomi qaysi?','fanlar = ["Ingliz tili", "Python", "Matematika"]\nprint(fanlar[1])',['Python','Ingliz tili','Matematika','1'],0,'Ro‘yxatdagi birinchi indeks 0, ikkinchisi 1.','tutorial/introduction.html#lists'],
 ['for/range','Sikl nechta belgi chiqaradi?','for _ in range(3):\n    print("X")',['X\nX\nX','X\nX','3','Hech narsa'],0,'range(3) uch aylanish beradi: 0, 1, 2. Har safar bir X chiqariladi.','tutorial/controlflow.html#the-range-function'],
 ['while','Sanoq uchga yetganda sikl natijasi nima?','sanoq = 1\nwhile sanoq < 3:\n    print(sanoq)\n    sanoq += 1',['1\n2','1\n2\n3','3','Cheksiz davom etadi'],0,'1 va 2 chiqariladi; sanoq 3 bo‘lganda shart False va sikl tugaydi.','reference/compound_stmts.html#the-while-statement'],
 ['Lug‘at','Kalit orqali qaysi qiymat olinadi?','kitob = {"nom": "Dasturlash", "bet": 120}\nprint(kitob["bet"])',['120','Dasturlash','bet','Xato'],0,'Lug‘atdagi bet kaliti 120 qiymatiga bog‘langan.','tutorial/datastructures.html#dictionaries'],
 ['Funksiya','Funksiya chaqirilganda natija nima?','def uch_baravar(son):\n    return son * 3\nprint(uch_baravar(4))',['12','7','3','None'],0,'return 4 × 3 = 12 qiymatini qaytaradi, tashqi print uni chiqaradi.','tutorial/controlflow.html#defining-functions'],
];

const bank=JSON.parse(readFileSync(new URL('../data/question-bank.json',import.meta.url),'utf8'));
const quiz=bank.find(item=>item.id==='python-basics');
if(!quiz)throw Error('Python testi topilmadi');
const exercises=questions.map(([topic,text,code,options,answerIndex,explanation,reference],index)=>({
 id:`python-basics-${index+1}`,type:'choice',group:'python',text,code,options,
 answer:options[answerIndex],explanation,topic,sourceUrl:docs+reference,sourceReference:topic,
}));
quiz.questions=exercises.map(question=>({
 id:question.id,type:'test',text:question.code?`${question.text}\n\n${question.code}`:question.text,
 options:question.options,correct:question.options.indexOf(question.answer),points:100,time:45,
 explanation:question.explanation,subject:'Python',sourceUrl:question.sourceUrl,
}));
writeFileSync(new URL('../data/python-basics.json',import.meta.url),JSON.stringify(exercises,null,2)+'\n');
writeFileSync(new URL('../data/question-bank.json',import.meta.url),JSON.stringify(bank,null,2)+'\n');
const sheet=['# Python: boshlang‘ich 15 ta savol','',
 'Savollar original. Mavzular dasturlash muhitidan funksiya va siklgacha bosqichma-bosqich berilgan. Har bir savolning izohi va kaliti oxirida.', ''];
for(const [index,question] of exercises.entries()){
 sheet.push(`## ${index+1}. ${question.text}`,'');
 if(question.code)sheet.push('```python',question.code,'```','');
 question.options.forEach((option,choice)=>sheet.push(`${'ABCD'[choice]}) ${option.replaceAll('\n',' / ')}`));
 sheet.push('');
}
sheet.push('## Javob kaliti','');
for(const [index,question] of exercises.entries())sheet.push(`${index+1}. ${'ABCD'[question.options.indexOf(question.answer)]} — ${question.explanation}`,'');
writeFileSync(new URL('../PYTHON-15-TEST.md',import.meta.url),sheet.join('\n'));
