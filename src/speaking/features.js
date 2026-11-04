// Shared, reviewed app registry. AI may suggest only these existing routes.
export const appFeatures=[
 {id:'atlasHub',title:'Atlaslar',roles:['guest','student','teacher','admin'],description:'6 fan atlasi va mavzular qidiruvi.',steps:['Atlaslar tugmasini bosing.','Fan yoki mavzuni tanlang.','Model va qo‘llanmadagi ikki sinovni bajaring.']},
 {id:'informaticsAtlas',title:'Informatika 3D',roles:['guest','student','teacher','admin'],description:'Kompyuter tarixi, RAM, ROM, HDD, SSD, OS va 18 ta GLB model.',steps:['Kompyuter ichida bo‘limini oching.','Qism nomini tanlang.','Alohida 3D model yoki qismlarga ajratishni ishlating.']},
 {id:'biology',title:'Biologiya',roles:['guest','student','teacher','admin'],description:'30 mavzu va 11 anatomik guruh.',steps:['Organlar 3D laboratoriyasini oching.','Organni tanlang.','Qatlam va jarayon izohlarini solishtiring.']},
 {id:'historyAtlas',title:'Tarix',roles:['guest','student','teacher','admin'],description:'12 davr, xarita, dalil va tarixiy xulosa.',steps:['Bekatni tanlang.','3D sayohat yoki Vaqt va xaritani oching.','Dalil ustaxonasida kuzatuvni xulosadan ajrating.']},
 {id:'englishCourse',title:'Ingliz tili darslari',roles:['student','teacher','admin'],description:'108 dars va boshlang‘ich tekshiruv.',steps:['Boshlang‘ich tekshiruvni bajaring.','Ochilgan darsni tanlang.','Listening, reading, writing va speaking mashqlarini bajaring.']},
 {id:'speaking',title:'AI Speaking',roles:['guest','student','teacher','admin'],description:'IELTS va Multilevel sinovi, ovozli javob tahlili va kundalik mashqlar.',steps:['Hisobga kiring va maqsad hamda jadvalni tanlang.','Mikrofonni tekshirib, boshlang‘ich Speaking sinovini bajaring.','Hisobotdan keyin Bugungi reja va yangi savol mashqiga o‘ting.']},
 {id:'mathAtlas',title:'Matematika',roles:['student','teacher','admin'],description:'62 mavzu, formula va interaktiv modellar.',steps:['Mavzuni tanlang.','Bitta parametrni o‘zgartiring.','Ikki sinov natijasini yozing.']},
 {id:'chemistry',title:'Kimyo',roles:['student','teacher','admin'],description:'Atomlar, molekulalar va virtual tajribalar.',steps:['Mavzu yoki tajribani tanlang.','Sharoitni o‘zgartiring.','Natija va cheklovni qayd eting.']},
 {id:'space',title:'Fizika va koinot',roles:['student','teacher','admin'],description:'53 hodisa va fizika tajribalari.',steps:['Hodisani tanlang.','Boshqaruvlardan bitta omilni o‘zgartiring.','Jonli hisobni kuzating va xulosa yozing.']},
 {id:'cinemaPiano',title:'Kino Piano',roles:['guest','student','teacher','admin'],description:'Tayyor kuylar va Do–Re–Mi mashqi.',steps:['Mashqlar → Kino Pianoni oching.','Kuyni tanlang va tinglang.','Tutorialda yoritilgan klavishni bosing.']},
 {id:'books',title:'Darsliklar',roles:['student','teacher','admin'],description:'Darslik va mos amaliy ishlar.',steps:['Fan va darslikni tanlang.','Darsni oching.','Mavzuning amaliy ishiga o‘ting.']},
 {id:'competitions',title:'Musobaqalar',roles:['guest','student','teacher','admin'],description:'Ustoz ochgan jamoaviy musobaqalar.',steps:['Musobaqalar bo‘limini oching.','Ustoz bergan kod bilan qo‘shiling.','Tayyor bo‘lgach bosqichlarni bajaring.']},
 {id:'classroom',title:'Sinfxona',roles:['teacher','admin'],description:'Ustoz doskasi, taymer va dars vositalari.',steps:['Sinfxonani oching.','Darsga mos doska yoki taymerni tanlang.','Namoyish ko‘rinishidan foydalaning.']},
 {id:'admin',title:'Ustoz boshqaruvi',roles:['teacher','admin'],description:'Mavjud dars, test va guruh boshqaruvi.',steps:['Boshqaruv panelini oching.','Guruh yoki topshiriqni tanlang.','Mavjud ruxsatlaringiz doirasida darsni tayyorlang.']},
];
export const allowedFeatures=role=>[...appFeatures,...otherPages.filter(f=>['home','exerciseHub','practice','catalog','national','cefrManaged','audioMaze'].includes(f.id)).map(f=>({...f,steps:[f.description]}))].filter(f=>f.roles.includes(role||'guest'));

// Current location is separate from the feature selected in the help index.
// Labels come from this registry, never from a client-supplied page title.
const everyone=['guest','student','teacher','admin'],members=['student','teacher','admin'];
const otherPages=[
 {id:'home',title:'Bosh sahifa',roles:everyone,description:'Fan, dars yoki mashq tanlash va ustoz bergan kod bilan testga kirish.'},
 {id:'aiGuide',title:'AI yordamchi',roles:everyone,description:'AI ustoz bilan suhbat, mavzuni tushunish, qisqa test va keyingi mashqni tanlash.'},
 {id:'exerciseHub',title:'Mashqlar',roles:everyone,description:'Test, mantiq, til va musiqa mashqlarini tanlash.'},
 {id:'practice',title:'Tayyor testlar',roles:members,description:'Python, ingliz tili va matematika bo‘yicha mashq testlari.'},
 {id:'catalog',title:'Informatika amaliyoti',roles:members,description:'Ustoz darslari va informatika topshiriqlari.'},
 {id:'national',title:'Milliy test',roles:members,description:'Ustoz tayyorlagan variantlar va mashqlar.'},
 {id:'cefrManaged',title:'CEFR / Multilevel',roles:members,description:'Listening, Reading, Writing va Speaking mashqlari.'},
 {id:'profile',title:'Natijalar va profil',roles:['student'],description:'Shaxsiy profil va saqlangan mashq natijalarini ko‘rish.'},
 {id:'chat',title:'Ustoz bilan suhbat',roles:['student'],description:'Ustoz va dars bo‘yicha yozishmalar.'},
 {id:'lesson',title:'Dars matni',roles:members,description:'Ochilgan darsni o‘qish va uning topshiriqlarini bajarish.'},
 {id:'bookPractice',title:'Darslik amaliyoti',roles:members,description:'Tanlangan darslikning amaliy mashqlari.'},
 {id:'audioMaze',title:'Inglizcha labirint',roles:everyone,description:'Matn va ovoz bilan ingliz tilini mashq qilish.'},
 {id:'login',title:'Hisobga kirish',roles:everyone,description:'SinfQuiz hisobiga kirish yoki ro‘yxatdan o‘tish.'},
];
export const allowedAssistantPages=role=>[...appFeatures,...otherPages].filter(f=>f.roles.includes(role||'guest'));
export const assistantPage=(view,role)=>allowedAssistantPages(role).find(f=>f.id===view)||null;
