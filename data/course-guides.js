// 28 original darsning bosqichli qo‘llanmasi. Rasmlar mahalliy SVG sxemalardir.
const q=(question,options,answer,explanation)=>({question,options,answer,explanation});
const guide=(slug,visualTitle,visualCaption,setup,steps,result,mistakes,checks)=>({
 slug,visualTitle,visualCaption,setup,steps,result,mistakes,checks,
 image:`/course-visuals/${slug}.svg`,
});

export const courseGuides=Object.fromEntries([
 guide('computer-intro','Kompyuter qismlari va ma’lumot yo‘li','Kiritish → qayta ishlash → saqlash yoki chiqarish.',
  'Yon-atrofingizdagi kompyuterni kuzating; uning qismlarini xavfsiz holda faqat ko‘zingiz bilan ajrating.',[
   'Klaviatura yoki sichqonchadan buyruq yuboring: ular kiritish qurilmalari.',
   'Ekranda buyruq natijasini ko‘ring. Protsessor hisoblaydi, RAM ochiq ishni vaqtincha saqlaydi.',
   'Matnli faylni saqlang. SSD yoki disk uni kompyuter o‘chirilganda ham saqlaydi.',
   'Faylni qayta oching va matn joyida ekanini tekshiring. Printer yoki quloqchin natijani boshqa shaklda chiqaradi.'
  ],'Natija: kiritish qurilmasi, protsessor/RAM, saqlash qurilmasi va chiqarish qurilmasini farqlaysiz.',
  ['RAM va SSD’ni bir xil deb o‘ylamang: RAM vaqtinchalik ish maydoni, SSD esa fayllar uchun doimiy xotira.'],[
   q('Fayl kompyuter o‘chirilgandan keyin qayerda saqlanadi?',['RAM’da','SSD yoki diskda','Monitor ichida'],1,'Disk yoki SSD ma’lumotni uzoq muddat saqlaydi.'),
   q('Klaviaturaning vazifasi nima?',['Natijani chop etish','Ma’lumot kiritish','Tasvirni ko‘rsatish'],1,'Klaviatura orqali belgilar va buyruqlar kiritiladi.')
  ]),
 guide('files-folders','Fayl va papka tartibi','Bir papka ichida mavzular uchun alohida joy.',
  'File Explorer’ni oching. Hujjatlar papkasi mavjudligini tekshiring.',[
   'Hujjatlar ichida «Informatika» papkasini yarating: New → Folder.',
   'Uning ichida Word, Excel va Taqdimot nomli papkalarni oching.',
   'Word’da kichik hujjat yarating va File → Save As orqali Word papkasiga aniq nom bilan saqlang.',
   'File Explorer’da shu papkaga qayting; fayl nomi va .docx kengaytmasini tekshiring.',
   'Ctrl+C va Ctrl+V bilan nusxasini boshqa papkaga qo‘ying; asl nusxa joyida qolganini ko‘ring.'
  ],'Natija: Informatika/Word ichida nomlangan .docx fayl va uning boshqa papkadagi nusxasi bor.',
  ['Ko‘chirish uchun Ctrl+X ishlatiladi; Ctrl+C nusxa oladi. Fayl nomidagi kengaytmani tasodifan o‘zgartirmang.'],[
   q('Ctrl+C → Ctrl+V dan keyin asl fayl qoladimi?',['Ha','Yo‘q','Faqat internetda'],0,'Nusxa olish asl faylni o‘z joyida qoldiradi.'),
   q('Word hujjatining kengaytmasi odatda qaysi?',['.xlsx','.pptx','.docx'],2,'.docx tahrirlanadigan Word hujjatidir.')
  ]),
 guide('keyboard','Klaviatura: muhim tugmalar','Matn kiritish va tuzatish uchun kerakli tugmalar.',
  'Oddiy matn muharririni oching va bitta satrga «Mening sinfim» deb yozing.',[
   'Enter bilan yangi xatboshi oching, ikki so‘z orasiga Space bosing.',
   'Shift bilan bitta bosh harf yozing; Caps Lock’ni yoqib-o‘chirib farqni ko‘ring.',
   'Kursorni xato so‘zning oxiriga qo‘ying. Backspace chapdagi, Delete o‘ngdagi belgiga ta’sir qilishini sinang.',
   'Satrni tanlab Ctrl+C, Ctrl+V bilan nusxalang; Ctrl+Z bilan oxirgi amalni qaytaring.',
   'Ctrl+S bilan faylni saqlang va yana ochib yozuvlar saqlanganini tekshiring.'
  ],'Natija: ikki xatboshili saqlangan matn va kamida to‘rtta tushunarli tezkor buyruq.',
  ['Enter yangi satr yaratadi; Space ni qayta-qayta bosib matnni tekislashga urinmang.'],[
   q('Oxirgi amalni bekor qilish buyrug‘i qaysi?',['Ctrl+Z','Ctrl+S','Ctrl+V'],0,'Ctrl+Z odatda oxirgi tahrirni qaytaradi.'),
   q('Backspace odatda qaysi tomondagi belgini o‘chiradi?',['Kursorning chapidagi','Kursorning o‘ngidagi','Butun sahifani'],0,'Backspace kursor chapidagi belgini o‘chiradi.')
  ]),
 guide('mouse','Sichqoncha va oyna amallari','Bosish, ikki marta bosish, menyu va sudrash.',
  'Ish stolida yoki File Explorer’da bir fayl belgisi ko‘rinadigan joyni oching.',[
   'Belgini bir marta chap tugma bilan bosing: faqat tanlanadi.',
   'Uni ikki marta bosing: tegishli dasturda ochiladi.',
   'O‘ng tugmani bosib menyuni ko‘ring; hech narsa o‘zgartirmay Escape bilan yoping.',
   'Oyna sarlavhasidan ushlab boshqa joyga sudrang, so‘ng kichraytirib qayta oching.',
   'G‘ildirak bilan sahifani aylantiring va Alt+Tab orqali ikki ochiq oyna orasida o‘ting.'
  ],'Natija: faylni ochish, kontekst menyusini ko‘rish va oynani boshqarishni mustaqil bajarasiz.',
  ['Ikkita bosish oralig‘i juda uzoq bo‘lsa, fayl ochilmaydi. X tugmasi oynani yopadi; avval faylni saqlang.'],[
   q('Bir marta chap bosish odatda nima qiladi?',['Tanlaydi','Kompyuterni o‘chiradi','Faylni nusxalaydi'],0,'Bir marta bosish elementni tanlaydi.'),
   q('O‘ng bosish odatda nimani ochadi?',['Kontekst menyusini','Yangi printer','Parol oynasini'],0,'Kontekst menyuda elementga tegishli amallar bo‘ladi.')
  ]),
 guide('internet-safety','Brauzerda manbani tekshirish','Manzil satri, qidiruv va ikki mustaqil manba.',
  'Brauzerda maktab yoki kutubxona haqida oddiy, xavfsiz savol yozing.',[
   'Qidiruv natijasidagi saytlardan birini oching; yuqoridagi manzil satrini ko‘ring.',
   'Maqola sarlavhasi, muallifi va sanasini toping; reklama belgisini ham tekshiring.',
   'Xuddi shu faktni boshqa ishonchli manbadan qidiring va tafovut bo‘lsa qayd eting.',
   'Ikki manba nomi va ko‘rilgan sanani hujjatga yozing.',
   'Ish tugaganda umumiy kompyuterdagi hisobdan chiqing.'
  ],'Natija: bir fakt uchun ikki manba va ularga ishonish sababini ikki gapda tushuntira olasiz.',
  ['HTTPS xavfsiz ulanish belgisi, mazmunning rostligi kafolati emas. Noma’lum fayllarni yuklab olmang.'],[
   q('HTTPS belgisi sahifadagi barcha fikrlar rostligini kafolatlaydimi?',['Ha','Yo‘q','Faqat rasm uchun'],1,'HTTPS ulanishni himoya qiladi, mazmunni tekshirmaydi.'),
   q('Manbani solishtirganda eng foydali ma’lumot qaysi?',['Muallif va sana','Faqat fon rangi','Reklama soni'],0,'Muallif va sana ma’lumotni baholashda yordam beradi.')
  ]),
 guide('word-intro','Word: birinchi hujjat','Home tasmasi, ish sahifasi va Save As.',
  'Word’ni ochib Blank document tanlang. Kompyuteringizda Informatika/Word papkasi bo‘lsin.',[
   'Birinchi satrga «Mening maktabim» deb yozing, Enter bosing.',
   'Uch xatboshida maktabingiz haqida tekshiriladigan ma’lumot yozing. Har xatboshida bitta asosiy fikr bo‘lsin.',
   'File → Save As ni tanlang, Word papkasiga Mening_maktabim.docx deb saqlang.',
   'Hujjatga yana bir jumla qo‘shing va Ctrl+S bosing; bu avvalgi faylni yangilaydi.',
   'Word’ni yopib faylni qayta oching. Sarlavha va yangi jumla saqlanganini tekshiring.'
  ],'Natija: qayta ochilganda matni saqlangan .docx hujjat.',
  ['Save As yangi nom yoki joy tanlaydi; Ctrl+S joriy hujjatni saqlaydi. PDF keyingi bosqichda ulashish uchun olinadi.'],[
   q('Yangi hujjatga boshqa joy va nom tanlash uchun qaysi amal?',['Save As','Undo','Find'],0,'Save As saqlash joyi va nomini tanlashga imkon beradi.'),
   q('Word’ning tahrirlanadigan odatiy formati qaysi?',['.pptx','.xlsx','.docx'],2,'.docx Word hujjatining keng tarqalgan formatidir.')
  ]),
 guide('word-text','Word: qidirish va tahrirlash','Ctrl+F, almashtirish va oxirgi amalni qaytarish.',
  'Oldingi darsdagi .docx hujjatni oching va kamida ikki marta uchraydigan «maktab» so‘zini yozing.',[
   'Ctrl+F ni bosing va «maktab» deb qidiring; topilgan joylarni sanang.',
   'Kerakli bitta so‘zni tanlab «maktabimiz» deb o‘zgartiring; gap ma’nosini qayta o‘qing.',
   'Find and Replace orqali qolgan joylarni ko‘rib chiqing; hammasini birdan almashtirishdan oldin kontekstni tekshiring.',
   'Bir gapni kesib yangi xatboshiga joylang, keyin Ctrl+Z bilan amalni qaytaring.',
   'Ctrl+S bosing va faylni qayta ochib yakuniy tartibni ko‘ring.'
  ],'Natija: takroriy so‘zlar ongli tahrirlangan, xatboshi tartibi to‘g‘ri hujjat.',
  ['Replace All grammatik shaklni buzishi mumkin. Imlo tekshiruvi shaxs nomlarini ham xato deb belgilashi mumkin.'],[
   q('Ctrl+F ning vazifasi nima?',['Saqlash','Qidirish','Chop etish'],1,'Ctrl+F hujjatdagi so‘z yoki iborani izlaydi.'),
   q('Almashtirishdan keyin nima uchun matnni qayta o‘qish kerak?',['Har joyning ma’nosi mosligini ko‘rish uchun','Faylni kattalashtirish uchun','Klaviaturani almashtirish uchun'],0,'Bitta so‘z barcha gapga bir xil mos kelmasligi mumkin.')
  ]),
 guide('word-format','Word: uslub va xatboshi','Heading 1/2, qalin matn va interval.',
  'Ikki bo‘limli oddiy hujjat tayyorlang: «Kirish» va «Xulosa». Har birida ikki gap yozing.',[
   'Asosiy sarlavhani tanlab Home → Styles → Title yoki Heading 1 ni bosing.',
   '«Kirish» va «Xulosa»ni alohida tanlab Heading 2 uslubini qo‘llang.',
   'Muhim atamani tanlab Ctrl+B bilan qalin qiling; qolgan matnni bir xil o‘lchamda qoldiring.',
   'Paragraph bo‘limida matnni chapga tekislang va qator oralig‘ini o‘qishga qulay qiling.',
   'Navigation Pane yoki hujjat tuzilmasida bo‘lim nomlari chiqishini tekshiring.'
  ],'Natija: ko‘rinishi tartibli, sarlavhalari haqiqiy Heading uslubida saqlangan hujjat.',
  ['Sarlavhani faqat katta yoki qalin qilish Heading uslubining tuzilma afzalligini bermaydi.'],[
   q('Mundarija tuzishga yordam beradigan belgi qaysi?',['Heading uslubi','Ko‘p bo‘sh joy','Faqat matn rangi'],0,'Heading uslublari hujjat bo‘limlarini belgilaydi.'),
   q('Matnni qalin qilish tezkor tugmasi qaysi?',['Ctrl+B','Ctrl+P','Ctrl+F'],0,'Ctrl+B tanlangan matnga bold beradi.')
  ]),
 guide('word-layout','Word: sahifa va raqam','Margins, Orientation, ro‘yxat va Page Number.',
  'Bir sahifali «Kutubxona qoidalari» hujjatini oching.',[
   'Layout → Margins bo‘limida chetlar uchun tayyor mos sozlamani tanlang.',
   'Beshta qoidani alohida satrga yozing va Home → Numbering bilan raqamlangan ro‘yxat qiling.',
   'Insert → Page Number dan pastki joylashuvni tanlang.',
   'Keyingi sahifa kerak bo‘lsa Ctrl+Enter bosing; ko‘p Enter bosib bo‘sh sahifa yasamang.',
   'File → Print orqali oldindan ko‘rishni oching; raqam, chegaralar va sig‘ishni tekshiring.'
  ],'Natija: tartibli raqamlangan ro‘yxat va pastda sahifa raqami bor hujjat.',
  ['Sahifa raqamini har betga qo‘lda yozmang. Gorizontal sahifa faqat keng jadval yoki rasm uchun kerak bo‘lsa tanlanadi.'],[
   q('Yangi sahifani toza boshlash uchun qaysi amal?',['Ctrl+Enter','Ko‘p marta Space','Faqat Caps Lock'],0,'Ctrl+Enter page break yaratadi.'),
   q('Sahifa raqami qaysi bo‘limda?',['Insert → Page Number','Home → Bold','Review → Spelling'],0,'Insert bo‘limidan avtomatik raqam qo‘shiladi.')
  ]),
 guide('word-images','Word: rasm va matn o‘rami','Insert → Pictures, o‘lcham, izoh va alt matn.',
  'O‘zingiz olgan yoki foydalanishga ruxsat etilgan kichik rasm tayyorlang.',[
   'Word hujjatida matn ostiga kursorni qo‘ying, Insert → Pictures dan rasmni tanlang.',
   'Burchak tutqichidan tortib o‘lchamini o‘zgartiring, nisbat buzilmaganini tekshiring.',
   'Layout Options yoki Wrap Text’dan matnga mos joylashuvni tanlang.',
   'Rasm ostiga «1-rasm: ...» kabi mazmunli izoh yozing va uning manbasini ko‘rsating.',
   'Rasmga muqobil matn qo‘shing: unda asosiy ma’no bir-ikki gapda bayon qilinsin.'
  ],'Natija: matnni yopmaydigan, izoh va muqobil matnli rasmli hujjat.',
  ['Rasmni yon tutqichdan cho‘zish uni buzishi mumkin. Manbasi noma’lum internet rasmini o‘zingizniki deb ko‘rsatmang.'],[
   q('Rasm nisbatini saqlashga nima yordam beradi?',['Burchakdan o‘lchash','Faqat yonidan tortish','Ko‘p Enter bosish'],0,'Burchak tutqichi rasm nisbatini odatda saqlaydi.'),
   q('Alt Text nimaga xizmat qiladi?',['Rasm mazmunini tushuntirishga','Faylni o‘chirishga','Printer rangini tanlashga'],0,'Muqobil matn yordamchi texnologiyalar uchun rasm ma’nosini beradi.')
  ]),
 guide('word-tables','Word: jadvalni yaratish va tuzatish','Insert → Table, sarlavha qatori, satr/ustun.',
  '«Haftalik mashg‘ulotlar» nomli hujjat oching.',[
   'Insert → Table orqali 4 ustun va 5 satr tanlang.',
   'Birinchi satrga «Kun | Mavzu | Xona | Vaqt» sarlavhalarini yozing.',
   'To‘rt kun ma’lumotini kiriting; Table Layout’dan yana bitta satr qo‘shing.',
   'Ustun kengliklarini matnga moslang, sarlavha qatorini ajrating.',
   'Print Preview’da jadval sahifaga to‘liq sig‘ganini tekshiring.'
  ],'Natija: 4 ustunli, sarlavhali va kamida 5 ma’lumot satrli jadval.',
  ['Word jadvalida uzun hisob-kitob qilish noqulay: formula va katta ma’lumot uchun Excel qulayroq.'],[
   q('Jadval qaysi menyudan qo‘shiladi?',['Insert → Table','Design → Themes','File → Close'],0,'Insert → Table yangi jadval yaratadi.'),
   q('Birinchi satrda nima bo‘lishi ma’qul?',['Ustun nomlari','Faqat bo‘sh joy','Tasodifiy sonlar'],0,'Sarlavha qatori jadvalning har bir ustunini tushuntiradi.')
  ]),
 guide('word-reference','Word: ma’lumotnoma va mundarija','Fakt, manba, Heading va Table of Contents.',
  'Maktabdagi xavfsiz, ochiq ma’lumotlardan 2–3 fakt to‘plang; kerak bo‘lsa o‘qituvchidan tasdiq oling.',[
   'Hujjat sarlavhasiga «Kompyuter xonasi haqida ma’lumotnoma» deb yozing; sana va muallifni ko‘rsating.',
   '«Jihozlar» va «Foydalanish qoidalari» bo‘limlarini Heading 2 qiling.',
   'Har bir faktni aniq manba yoki kuzatuv bilan bog‘lang, taxminni fakt deb yozmang.',
   'Kerakli jumlaga References → Insert Footnote orqali izoh qo‘shing.',
   'Hujjat boshiga References → Table of Contents qo‘shing; sarlavhalar o‘zgarsa Update Table qiling.'
  ],'Natija: sarlavha, sana, ikki bo‘lim, manba izohi va yangilanadigan mundarijali ma’lumotnoma.',
  ['Mundarijadagi bo‘limlar chiqmasa Heading uslublarini tekshiring. Mavjud bo‘lmagan raqamni o‘ylab topmang.'],[
   q('Avtomatik mundarija qaysi belgilarga tayanadi?',['Heading uslublariga','Tasodifiy ranglarga','Fayl hajmiga'],0,'Heading uslublari mundarija tuzilmasini beradi.'),
   q('Sahifa raqamlari o‘zgarsa mundarijada nima qilinadi?',['Update Table','Barcha faylni o‘chirish','Faqat rangini o‘zgartirish'],0,'Mundarijani yangilash sahifa raqamlarini moslaydi.')
  ]),
 guide('word-practice','Word: ikki betlik hisobot','Reja → yozish → jadval/rasm → PDF tekshiruvi.',
  'Oldingi Word darslaridagi hujjatlarni saqlab qo‘ying; yangi «Sinf loyihasi» faylini oching.',[
   'Birinchi betga sarlavha, maqsad va ish bosqichlarini yozing; sarlavhalarga Heading qo‘llang.',
   'Ikkinchi betda «Vazifa | Mas’ul | Muddat» jadvali va bitta mazmunli rasmni joylang.',
   'Rasm ostiga izoh va manbani yozing; jadval ustunlari to‘liq ko‘rinishini tekshiring.',
   'Xulosa va keyingi ishlarni 3–4 gapda yozing. Imlo va sahifa raqamlarini tekshiring.',
   'Asl .docx ni saqlang, PDF nusxa oling va ikkisini ham qayta ochib solishtiring.'
  ],'Natija: tahrirlanadigan hisobot va o‘qishga tayyor PDF; ikkala faylda ham mazmun bir xil.',
  ['PDF’ni yagona ishchi nusxa deb qoldirmang: keyin tahrir uchun .docx kerak bo‘ladi.'],[
   q('Qayta tahrirlash uchun qaysi faylni saqlash kerak?',['.docx','.pdf rasmini','Faqat skrinshot'],0,'.docx asosiy tahrirlanadigan nusxadir.'),
   q('Yakuniy nazoratda qaysi ikki narsa ko‘riladi?',['Mazmun va joylashuv','Faqat fon rangi','Faqat fayl hajmi'],0,'Matn ham, sahifa va rasm joylashuvi ham tekshiriladi.')
  ]),
 guide('excel-intro','Excel: satr, ustun va katak','A1 manzili va A1:C4 oraliq.',
  'Yangi Excel ish kitobi oching. Pastdagi varaq nomini «Do‘kon» deb o‘zgartiring.',[
   'A1 katakni tanlang: ustun A, satr 1 kesishgan joy shu.',
   'A1, B1, C1 ga «Mahsulot», «Soni», «Narx» yozing.',
   'A2:C4 oralig‘iga uch mahsulot, miqdor va narx kiriting.',
   'A1:C4 ni belgilang; tanlangan oraliqdagi ustun va satrlarni sanang.',
   'File → Save As orqali Dokon.xlsx nomi bilan saqlang.'
  ],'Natija: 3 ustunli, sarlavhali va uchta ma’lumot qatori bor .xlsx ish kitobi.',
  ['A1 katak, A1:C4 esa oraliq. Matnli «12 000 so‘m» o‘rniga sonli 12000 kiriting.'],[
   q('C4 qaysi joy?',['C ustunining 4-satri','4-ustunning C-satri','Faqat formula nomi'],0,'Katak manzilida avval ustun harfi, keyin satr raqami keladi.'),
   q('Excel ish kitobi odatda qaysi formatda saqlanadi?',['.docx','.xlsx','.pptx'],1,'.xlsx Excel faylining keng tarqalgan formatidir.')
  ]),
 guide('excel-entry','Excel: ma’lumot va format','Haqiqiy qiymat bilan ekranda ko‘ringan format farqi.',
  'A ustunga mahsulot, B ga butun miqdor, C ga sonli narx kiriting.',[
   'C2 ga 12000 yozing va Enter bosing; «so‘m» so‘zini katakka yozmang.',
   'C2:C4 ni tanlab Home → Number Format orqali pul birligiga mos ko‘rinish tanlang.',
   'D ustunga sanalarni bir xil uslubda kiriting va sana formatini tekshiring.',
   'Ustun chegarasini ikki marta bosib AutoFit qiling; sarlavhani qalinlashtiring.',
   'C2 ni tanlab formula satrida asosiy qiymat 12000 ekanini tekshiring.'
  ],'Natija: qiymatlari hisoblashga yaroqli, ko‘rinishi bir xil mahsulot jadvali.',
  ['Katakka «12000 so‘m» deb matn yozish formulani buzishi mumkin. Format qiymatning o‘zini o‘zgartirmaydi.'],[
   q('C2 dagi 12000 ni pul ko‘rinishida chiqarish uchun nima qilasiz?',['Number Format tanlaysiz','Matnni uzunroq yozasiz','Boshqa varaq ochasiz'],0,'Raqam formati qiymatning ko‘rinishini boshqaradi.'),
   q('AutoFit nima qiladi?',['Ustun kengligini mazmunga moslaydi','Faylni o‘chiradi','Formulani bloklaydi'],0,'AutoFit ustun yoki satr hajmini moslaydi.')
  ]),
 guide('excel-formulas','Excel: birinchi formulalar','D2 = B2 × C2 va qiymat o‘zgargandagi natija.',
  'A2 ga «Qalam», B2 ga 3, C2 ga 12000 yozing. D1 ga «Jami» deb sarlavha kiriting.',[
   'D2 katakni tanlab aynan =B2*C2 yozing va Enter bosing.',
   'D2 da 36000 ko‘rinayotganini tekshiring: 3 × 12000 = 36000.',
   'B3/C3 ga 2 va 5000 kiriting; D2 formulasini D3 ga ko‘chiring.',
   'D3 formulasi =B3*C3, natija esa 10000 ekanini formula satrida tekshiring.',
   'B2 ni 4 ga almashtiring; D2 48000 ga o‘zgarganini kuzating.'
  ],'Natija: ikkita mahsulotning jami qiymati katak manzillariga bog‘langan formulalar bilan hisoblanadi.',
  ['Formula = bilan boshlanishi shart. Ko‘paytirish uchun x emas * ishlatiladi. #VALUE! chiqsa sonlar matn bo‘lib qolmaganini tekshiring.'],[
   q('B2=3 va C2=12000 bo‘lsa =B2*C2 natijasi?',['15000','36000','12000'],1,'3 × 12000 = 36000.'),
   q('B2 4 ga o‘zgarsa nima uchun D2 ham o‘zgaradi?',['Formula B2 ga murojaat qiladi','Excel tasodifiy son qo‘yadi','Rang o‘zgargani uchun'],0,'Katak manziliga bog‘langan formula qayta hisoblanadi.')
  ]),
 guide('excel-functions','Excel: umumiy hisoblar','SUM, AVERAGE, MIN, MAX, COUNT va COUNTA.',
  'D2:D4 ga 36000, 10000 va 14000 sonlarini kiriting.',[
   'D5 ga =SUM(D2:D4) yozing: 60000 chiqishi kerak.',
   'D6 ga =AVERAGE(D2:D4) yozing: 20000 chiqishini tekshiring.',
   'D7 va D8 ga =MIN(D2:D4), =MAX(D2:D4) qo‘shing: 10000 va 36000.',
   'D9 ga =COUNT(D2:D4) yozing: 3. A2:A4 dagi uch nomni COUNTA bilan sanang.',
   'D3 ga matn yozib yuborsangiz natijalar qanday o‘zgarishini sinang, keyin 10000 ni qaytaring.'
  ],'Natija: jami 60000, o‘rtacha 20000, eng kichik 10000, eng katta 36000, sonli kataklar 3.',
  ['AVERAGE matn kataklarini o‘rtachaga qo‘shmaydi; 0 esa hisobga olinadi. Formuladagi oraliq chegarasini tekshiring.'],[
   q('36000+10000+14000 jami nechchi?',['50000','60000','62000'],1,'SUM natijasi 60000.'),
   q('Matnli uch mahsulot nomini qaysi funksiya sanaydi?',['COUNT','COUNTA','MIN'],1,'COUNTA bo‘sh bo‘lmagan matnli kataklarni ham sanaydi.')
  ]),
 guide('excel-references','Excel: nisbiy va mutlaq manzil','D2*$G$1 formulasi ko‘chirilganda nima o‘zgaradi?',
  'D2 ga 36000, D3 ga 10000; G1 ga 0.1 deb yozing.',[
   'E2 katakka =D2*$G$1 kiriting: 3600 chiqadi.',
   'E2 ning to‘ldirish tutqichini E3 gacha torting.',
   'E3 formulasini tekshiring: =D3*$G$1 bo‘lishi kerak; natija 1000.',
   'Xuddi shuni =D2*G1 bilan sinab ko‘ring; pastga ko‘chirganda G2 ga siljishini kuzating.',
   'Keraksiz sinov ustunini o‘chirib, to‘g‘ri formulani saqlang.'
  ],'Natija: E2=3600, E3=1000; doimiy koeffitsiyent G1 da qoladi.',
  ['$G$1 ustun va satrni birga mahkamlaydi. Faqat $G1 yoki G$1 qisman mahkamlaydi.'],[
   q('E2 dan E3 ga ko‘chirilganda =D2*$G$1 qanday bo‘ladi?',['=D3*$G$1','=D3*G2','=D2*$G$2'],0,'Nisbiy D2 → D3, mutlaq $G$1 o‘zgarmaydi.'),
   q('Nimani $G$1 deb yozish qulay?',['Barcha qatorlarga bitta doimiy sonni','Har qator yangi ismni','Jadval sarlavhasini'],0,'Bir xil koeffitsiyent uchun mutlaq manzil kerak.')
  ]),
 guide('excel-if','Excel: shartli formula','IF(B2>=60,...) chegarani qanday tekshiradi?',
  'A1:C1 ga «Ism | Ball | Holat» yozing. B2:B4 ga 59, 60, 61 kiriting.',[
   'C2 ga =IF(B2>=60,"O‘tdi","Qayta ishlash") yozing. Excelingiz nuqtali vergul so‘rasa argumentlarni ; bilan ajrating.',
   'Formulani C3:C4 ga ko‘chiring.',
   'C2 «Qayta ishlash», C3 va C4 «O‘tdi» chiqqanini tekshiring.',
   'B2 ni 75 ga o‘zgartirib holat avtomatik yangilanishini ko‘ring.',
   'B2 ni 59 ga qaytaring va xulosa yozing: aynan 60 chegaraga kiradi.'
  ],'Natija: chegaradan past va yuqori balllar to‘g‘ri ajratilgan shartli jadval.',
  ['>60 bilan >=60 bir xil emas. #NAME? chiqsa funksiya nomi yoki mahalliy til sozlamasini tekshiring.'],[
   q('B2=60 bo‘lsa B2>=60 rostmi?',['Ha','Yo‘q','Faqat B2 matn bo‘lsa'],0,'>= belgisi tenglik holatini ham qamrab oladi.'),
   q('IF formulasining uch qismi nimadan iborat?',['Shart, rost natija, yolg‘on natija','Rang, shrift, sahifa','Ustun, satr, rasm'],0,'IF shart va ikkita muqobil natijani oladi.')
  ]),
 guide('excel-tables-filter','Excel: jadval va filtr','Butun qatorni saqlab saralash va filtrlash.',
  'A1:D5 oralig‘ida mahsulot, miqdor, narx va jami ustunlari bo‘lsin.',[
   'A1:D5 ni birga belgilang; Insert → Table ga o‘ting.',
   '«My table has headers» katagini sarlavha borligiga qarab belgilang.',
   'Narx ustunidagi filtr tugmasidan katta qiymatlarni tanlang.',
   'Filtrni olib tashlang; barcha qatorlar qaytganini tekshiring.',
   'Jami ustunini kichikdan kattaga saralang; har mahsulotning soni va narxi o‘sha qatorda qolganini tekshiring.'
  ],'Natija: sarlavhali jadval; filtr qatorlarni yashiradi, ma’lumotni o‘chirmaydi.',
  ['Faqat A ustunni saralash boshqa ustunlar bilan bog‘lanishni buzishi mumkin. Butun jadvalni tanlang.'],[
   q('Filtr bilan yashirilgan qator o‘chadimi?',['Ha','Yo‘q','Faqat jadval nomi'],1,'Filtr faqat ko‘rinishni cheklaydi.'),
   q('Saralashdan oldin nimani belgilash muhim?',['Tegishli butun jadvalni','Faqat ism ustunini','Faqat bitta katak rangini'],0,'Butun qatorlar birga siljishi kerak.')
  ]),
 guide('excel-charts','Excel: diagramma','Ustunli diagrammada nom va birlikni ko‘rsatish.',
  'A2:A4 ga Qalam, Daftar, Ruchka; D2:D4 ga 36000, 10000, 14000 kiriting.',[
   'Mahsulot nomlari va tegishli jami sonlardan diagramma uchun oraliq tanlang.',
   'Insert → Column Chart orqali ustunli diagramma yarating.',
   'Sarlavhani «Mahsulotlar jami qiymati» deb o‘zgartiring.',
   'Qiymat o‘qiga «so‘m» birligini ko‘rsating; barcha uch ustun to‘g‘ri nomlanganini tekshiring.',
   'D3 ni 20000 ga o‘zgartirib Daftar ustuni ham o‘zgarganini ko‘ring.'
  ],'Natija: uchta mahsulotning qiymatini solishtirish mumkin bo‘lgan nomli diagramma.',
  ['O‘qlarni noto‘g‘ri masshtabda kesib ko‘rsatish farqni oshirib yuborishi mumkin.'],[
   q('Toifalar miqdorini solishtirish uchun qaysi tur qulay?',['Ustunli','Faqat matnli','Tasodifiy rasm'],0,'Ustunli diagramma toifalar o‘rtasidagi farqni ko‘rsatadi.'),
   q('Diagrammada qiymat o‘qi yoniga nima yoziladi?',['Birlik','Parol','Fayl kengaytmasi'],0,'Birlik 36000 nimani anglatishini ko‘rsatadi.')
  ]),
 guide('excel-project','Excel: xarajatlar loyihasi','Kirish jadvali, formulalar, filtr, grafik va bosma ko‘rinish.',
  '«Sinf tadbiri — namunaviy hisob» nomli yangi kitob oching.',[
   'A:E ustunlarga Narsa, Miqdor, Birlik narx, Jami, Toifa yozing; kamida 8 namunaviy qator kiriting.',
   'D2 ga =B2*C2 yozib barcha satrga ko‘chiring. Oxirida =SUM(D2:D9) bilan jami hisoblang.',
   'E ustundagi toifani filtrlang va bir toifa xarajatlarini ko‘ring; filtrni qaytaring.',
   'Narsa va jami qiymatni tanlab ustunli diagramma yarating; sarlavha va birligini qo‘shing.',
   'File → Print Preview’da bitta sahifaga sig‘ishini tekshiring, .xlsx va kerak bo‘lsa PDF saqlang.'
  ],'Natija: formula bilan qayta hisoblanadigan, filtrlanadigan va diagrammali namunaviy xarajat jadvali.',
  ['Miqdor va narx son bo‘lsin. Umumiy SUM oraliqning barcha sakkiz qatorini qamrab olishini tekshiring.'],[
   q('D2 dagi jami qiymat formulasi qaysi?',['=B2*C2','=B2+C2','=A2*C2'],0,'Miqdor × birlik narx jami qiymatni beradi.'),
   q('Hisob-kitobni keyin o‘zgartirish uchun qaysi fayl kerak?',['.xlsx','.png','.mp3'],0,'.xlsx formulalarni va kataklarni tahrirlashga imkon beradi.')
  ]),
 guide('ppt-intro','PowerPoint: slaydlar xaritasi','Chapda slaydlar, o‘rtada joriy slayd, pastda notes.',
  'PowerPoint’ni ochib yangi taqdimot yarating va «Kompyuter qismlari» deb nomlang.',[
   'Birinchi Title Slide maketiga mavzu va muallifni yozing.',
   'Home → New Slide bilan yana uch slayd qo‘shing.',
   'Slaydlar sarlavhasi: Kiritish, Qayta ishlash, Natija. Har biriga bir asosiy fikr yozing.',
   'Chapdagi kichik rasmlar tartibini sudrab o‘zgartiring; hikoya oqimi mantiqli ekanini tekshiring.',
   'File → Save As bilan .pptx ni saqlang va Slide Show → From Beginning bilan ko‘ring.'
  ],'Natija: mavzusi aniq, to‘rt slaydli tahrirlanadigan taqdimot.',
  ['Slaydni daftar sahifasidek matnga to‘ldirmang. Bitta slayd — bitta asosiy fikr.'],[
   q('Yangi slayd qaysi amal bilan qo‘shiladi?',['Home → New Slide','File → Print','Review → Spelling'],0,'Home → New Slide keyingi slaydni qo‘shadi.'),
   q('Tahrirlanadigan PowerPoint fayli qaysi?',['.pptx','.xlsx','.docx'],0,'.pptx slaydlar va ularning elementlarini saqlaydi.')
  ]),
 guide('ppt-design','PowerPoint: tema va maket','Bitta tema, turli mazmunga mos layout.',
  'Oldingi darsdagi to‘rt slaydli taqdimotni oching.',[
   'Design → Themes’dan bir sodda tema tanlang va barcha slaydda bir xil uslubni ko‘ring.',
   'Birinchi slaydga Title Slide, keyingi slaydlarga Title and Content yoki ikki ustunli maket tanlang.',
   'Har slayd sarlavhasini aniq gapga aylantiring: «Klaviatura ma’lumot kiritadi» kabi.',
   'Matnni qisqartiring; uzun jumla o‘rniga uchta qisqa band yozing.',
   'Slide Show’da matnning oxirgi qatordan ham o‘qilishini va fon bilan farqini tekshiring.'
  ],'Natija: izchil rang/shrift va mazmunga mos joylashuvdagi to‘rt slayd.',
  ['Oq fonda och kulrang matn o‘qilishi qiyin; kontrastni kuchaytiring. Har slaydga yangi tema bermang.'],[
   q('Theme qanday vazifani bajaradi?',['Umumiy rang/shrift uslubini uyg‘unlashtiradi','Barcha matnni o‘chiradi','Faqat ovoz yozadi'],0,'Tema slaydlar ko‘rinishini bir xil tutadi.'),
   q('Layout nimani belgilaydi?',['Slayd elementlarining joylashuvini','Wi-Fi tezligini','Printer turini'],0,'Maket sarlavha, matn va rasm joyini belgilaydi.')
  ]),
 guide('ppt-media','PowerPoint: rasm, jadval, diagramma','Kichik ma’lumotni ko‘rsatish va manbani yozish.',
  'Uchta namunaviy qiymat tayyorlang: Qalam 36, Daftar 10, Ruchka 14.',[
   '«Kiritish qurilmalari» slaydiga Insert → Pictures bilan o‘zingizga tegishli yoki ruxsatli rasm qo‘shing.',
   'Rasmga muqobil matn va pastiga manba izohi yozing.',
   'Boshqa slaydda Insert → Table orqali «Nomi | Vazifasi» ikki ustunli 3 qatorli jadval tuzing.',
   'Uchinchi slaydda Insert → Chart bilan uch qiymatli ustunli diagramma yarating; «namuna» va birlikni ko‘rsating.',
   'Namoyishda kichik yozuvlar ko‘rinishini tekshiring; jadvalni keragidan ortiq kengaytirmang.'
  ],'Natija: rasm, ixcham jadval va nomlangan diagramma bilan izohlangan slaydlar.',
  ['Grafikdagi raqamni haqiqiy o‘lchov deb ko‘rsatmang: bu darsdagi sonlar namunadir.'],[
   q('Rasmning muqobil matni nima uchun?',['Rasm mazmunini tushuntirish uchun','Slaydni avtomatik o‘chirish uchun','Fayl nomini yashirish uchun'],0,'Alt text vizual mazmunni tushuntiradi.'),
   q('Ko‘p sonli jadvalni bitta slaydga siqish o‘rniga nima qilinadi?',['Faqat muhim qismini ko‘rsatish','Shriftni o‘qilmas darajada kichraytirish','Sarlavhani o‘chirish'],0,'Slaydga eng muhim ma’lumotni tanlash yaxshiroq.')
  ]),
 guide('ppt-motion','PowerPoint: o‘tish va animatsiya','Transitions slaydga, Animations obyektga ta’sir qiladi.',
  'Kamida uchta slaydli taqdimotni oching.',[
   'Ikkinchi slaydni tanlab Transitions bo‘limidan sodda Fade turini bosing.',
   'Preview’da birinchi slayddan ikkinchisiga o‘tishni ko‘ring.',
   'Ikkinchi slaydda bitta matn qutisini tanlab Animations → Appear ni qo‘llang.',
   'Slide Show’da bosganda matn paydo bo‘lishini tekshiring.',
   'Keraksiz effektlarni olib tashlang; o‘tish va animatsiya mazmunni tushuntirishga xizmat qilsin.'
  ],'Natija: bitta slayd o‘tishi va bitta obyekt animatsiyasining farqini amalda ko‘rasiz.',
  ['Har bir slaydga turli tovushli effekt qo‘shish diqqatni chalg‘itadi. Animatsiya bosilish tartibini namoyishda tekshiring.'],[
   q('Slaydlar orasidagi effekt qaysi?',['Transition','Animation','Footer'],0,'Transition bir slayddan boshqasiga o‘tishda ishlaydi.'),
   q('Slayd ichidagi matnning paydo bo‘lishi qaysi?',['Animation','Margin','AutoSum'],0,'Animation obyektga qo‘llanadi.')
  ]),
 guide('ppt-present','PowerPoint: spiker qaydlari','Notes yozish, namoyish va uch daqiqalik mashq.',
  'To‘rt slaydli taqdimot oching va auditoriya uchun asosiy fikrni belgilang.',[
   'Har slayd ostidagi Notes joyiga o‘zingizga kerakli ikki eslatma yozing.',
   'Slaydda notes matni chiqmasligini Slide Show rejimida tekshiring.',
   'Slide Show → From Beginning bilan boshlang; slayddagi matnni takrorlamay tushuntiring.',
   'Agar ikkinchi ekran mavjud bo‘lsa Presenter View’da joriy/keyingi slayd va qaydlarni tekshiring.',
   'Uch daqiqalik mashq qiling, ortiqcha matnli slaydni qisqartiring.'
  ],'Natija: slaydda faqat asosiy fikrlar, nutq uchun alohida notes va sinovdan o‘tgan namoyish.',
  ['Presenter View mavjudligi qurilma va dastur versiyasiga bog‘liq; bitta ekranda oldindan tekshiring.'],[
   q('Notes kim uchun yoziladi?',['Taqdimotchi uchun','Faqat printer uchun','Formula uchun'],0,'Qaydlar taqdimotchining nutqiga yordam beradi.'),
   q('Namoyishda auditoriya odatda nimani ko‘radi?',['Slaydni','Spikerning barcha shaxsiy qaydlarini','Fayl papkasini'],0,'Slayd mazmuni auditoriyaga ko‘rsatiladi.')
  ]),
 guide('ppt-project','PowerPoint: yakuniy taqdimot','Olti slayd, manba, imlo, namoyish va ikki format.',
  '«Texnologiya bilan mas’uliyatli ishlash» mavzusini tanlang; manbali bitta fakt va ruxsatli bitta rasm tayyorlang.',[
   '6 slayd rejasini yozing: mavzu, muammo, ikki yechim, misol, xulosa.',
   'Design’dan bitta tema tanlang, har slaydda bitta asosiy fikr qoldiring.',
   'Rasm va uch qiymatli namuna diagrammasi qo‘shing; manba va birlikni yozing.',
   'Kamida bitta slaydga notes yozing, imlo va kontrastni tekshiring.',
   'Namoyishni boshidan oxirigacha 3 daqiqada sinang; .pptx ni saqlang va kerak bo‘lsa PDF nusxa oling.'
  ],'Natija: ko‘rsatishga tayyor, mazmuni tekshirilgan 6 slaydli taqdimot va tahrirlanadigan asl fayl.',
  ['PDF ulashish uchun qulay, keyingi tahrirga .pptx ni saqlang. Rasm va raqam manbasini unutmaslik kerak.'],[
   q('Keyingi safar slaydni tahrirlash uchun nima saqlanadi?',['.pptx','.png','.mp3'],0,'.pptx tahrirlanadigan taqdimotdir.'),
   q('6 slaydli ishda yakuniy nazorat nimalarni qamraydi?',['Mazmun, imlo, manba, o‘qilish va namoyish','Faqat fon rangi','Faqat fayl nomi'],0,'Taqdimot mazmuni va ko‘rinishi birga tekshiriladi.')
  ]),
].map(item=>[item.slug,item]));
