// O‘quvchi uchun original, bosqichma-bosqich amaliy darslar.
const lesson=(subject,cover,slug,title,summary,content)=>({subject,cover,slug,title,summary,content});

export const computerCourse=[
  lesson('Kompyuter asoslari','DARS','computer-intro','1. Kompyuter nima?',
    'Kompyuter qismlari, dastur va fayl o‘rtasidagi farqni tushuning.',`## Maqsad
Kompyuter ma’lumotni qabul qiladi, qayta ishlaydi, saqlaydi va natijani ko‘rsatadi. Masalan, klaviaturada yozilgan gap xotirada saqlanadi va ekranda ko‘rinadi.

## Asosiy qismlar
Sistem blok yoki noutbuk ichida protsessor hisoblaydi, operativ xotira ochiq dasturlarga vaqtincha joy beradi, SSD yoki disk fayllarni uzoq muddat saqlaydi. Monitor natijani ko‘rsatadi; klaviatura va sichqoncha buyruq kiritadi. Printer va quloqchin qo‘shimcha qurilmalardir.

## Dastur va fayl
Windows — operatsion tizim; Word — dastur; .docx — hujjat fayli. Dasturni o‘chirib yuborish bilan unda yaratilgan hujjatni o‘chirish bir xil amal emas.

## Amaliy mashq
O‘zingiz ishlatayotgan kompyuterda kirish, chiqish va saqlash qurilmalaridan uchtasini sanang. So‘ng bir dastur nomi va shu dasturda yaratiladigan fayl turini yozing.

## Tekshiring
Monitor ma’lumotni saqlaydimi? Yo‘q, u ko‘rsatadi. Kompyuter o‘chsa ochiq, saqlanmagan hujjatga nima bo‘lishi mumkin? U yo‘qoladi.`),
  lesson('Kompyuter asoslari','DARS','files-folders','2. Ish stoli, papka va fayllar',
    'Faylni yaratish, nomlash, saqlash, ko‘chirish va topishni mashq qiling.',`## Maqsad
Ish stoli tezkor kirish joyidir. Papka fayllarni tartiblaydi; fayl nomi uning mazmunini, kengaytma esa turini bildiradi: .docx matn, .xlsx jadval, .pptx taqdimot.

## Ketma-ket amallar
File Explorer’ni oching. Hujjatlar ichida Informatika papkasini yarating. Uning ichida Word, Excel va Taqdimot nomli uchta papka oching. Yangi fayl saqlaganda aniq nom bering: 6A_sinf_loyiha.docx kabi. Ko‘chirish uchun Ctrl+X, nusxa uchun Ctrl+C, joylash uchun Ctrl+V ishlatiladi.

## Ehtiyot bo‘ling
Fayl kengaytmasini tasodifan o‘zgartirmang. O‘chirishdan oldin to‘g‘ri fayl tanlanganini tekshiring. Muhim ishlarni ikkinchi joyga zaxiralang.

## Amaliy mashq
Informatika papkasini yarating, ichida Mashq.txt yozing, uni Word papkasiga ko‘chiring, keyin qidiruv orqali toping.

## Tekshiring
Nusxalash bilan ko‘chirish farqi nima? Nusxalashda asl fayl qoladi, ko‘chirishda joyi o‘zgaradi.`),
  lesson('Kompyuter asoslari','DARS','keyboard','3. Klaviaturadan foydalanish',
    'Harf, raqam, maxsus tugma va asosiy tezkor buyruqlarni o‘rganing.',`## Tugmalar guruhlari
Harf va raqamlar matn kiritadi. Space bo‘sh joy, Enter yangi xatboshi yoki tasdiqlash, Backspace chapdagi belgini, Delete tanlangan yoki o‘ngdagi belgini o‘chiradi. Shift bosh harf va yuqori belgini, Caps Lock esa bosh harf rejimini yoqadi. Tab maydonlar orasida o‘tadi.

## Ishda kerak bo‘ladigan buyruqlar
Ctrl+S saqlash, Ctrl+Z oxirgi amalni bekor qilish, Ctrl+C nusxalash, Ctrl+V joylash, Ctrl+A hammasini tanlash. Tezkor buyruqni dastur oynasi faol turganda bajaring. Windows va Mac kombinatsiyalari farq qilishi mumkin.

## Amaliy mashq
Matn muharririda ismingiz, maktabingiz va uchta sevimli faningizni alohida satrlarga yozing. Bitta so‘zni tanlab nusxalang, yangi satrga joylang, keyin Ctrl+Z bilan qaytaring. Ctrl+S orqali faylni saqlang.

## Tekshiring
Backspace va Delete bir xil joydagi belgini o‘chiradimi? Yo‘q. Tasodifiy xatodan keyin eng tez qaytarish qaysi? Ctrl+Z.`),
  lesson('Kompyuter asoslari','DARS','mouse','4. Sichqoncha va oynalar bilan ishlash',
    'Bosish, ikki marta bosish, sudrash va oynani boshqarishni sinang.',`## Sichqoncha amallari
Chap tugmani bir marta bosish elementni tanlaydi, ikki marta bosish ko‘pincha uni ochadi. O‘ng tugma kontekst menyusini chiqaradi. G‘ildirak sahifani aylantiradi. Sudrash uchun chap tugmani bosib turing va ko‘rsatkichni siljiting.

## Oynalar
Oynaning yuqori qismidan sudrab joyini o‘zgartiring. Kichraytirish oynani vazifalar paneliga tushiradi; kattalashtirish ish maydonini kengaytiradi; X esa oynani yopadi. Yopishdan oldin ishni saqlang. Alt+Tab bilan ochiq oynalar o‘rtasida almashish mumkin.

## Amaliy mashq
Ikki dastur oynasini oching, navbat bilan faol qiling, birini kichraytiring va qayta oching. Fayl belgisini bir marta tanlang, so‘ng ikki marta bosib oching.

## Tekshiring
O‘ng tugma odatda nimani ko‘rsatadi? Tegishli amallar menyusini. Oynani yopish faylni ham avtomatik saqlaydimi? Har doim emas.`),
  lesson('Kompyuter asoslari','DARS','internet-safety','5. Internet va xavfsiz ishlash',
    'Brauzer, qidiruv, ishonchli manba va shaxsiy ma’lumotni ajrating.',`## Brauzer va manzil
Brauzer veb sahifalarni ochadi. Manzil satriga sayt manzilini yozing; qidiruvga esa savol yoki kalit so‘z kiriting. Qidiruv natijasidagi reklama bilan manbaning o‘zini farqlang. HTTPS ulanishni himoyalaydi, ammo sayt mazmunining to‘g‘riligini kafolatlamaydi.

## Ma’lumotni tekshirish
Muallif va sanani qidiring, muhim da’voni kamida ikkita ishonchli manbadan solishtiring. Rasm yoki matndan foydalanishda manbani yozing. Noma’lum faylni yuklab olishdan oldin o‘qituvchidan so‘rang.

## Shaxsiy xavfsizlik
Parolni boshqalar bilan ulashmang. Begona xabar yuborgan havolaga shoshilmay bosing; avval manzilni tekshiring. Umumiy kompyuterda ishlagach hisobdan chiqing.

## Amaliy mashq
Bir mavzuni qidiring, ikkita manbaning muallifi va sanasini solishtiring. Birini tanlash sababini ikki gapda yozing.

## Tekshiring
HTTPS belgisi xabar albatta rostligini anglatadimi? Yo‘q.`),

  lesson('Microsoft Word','DARS','word-intro','6. Wordga kirish: birinchi hujjat',
    'Hujjat yaratish, tasma bo‘limlari va .docx formatida saqlash.',`## Word nima uchun kerak?
Word xat, hisobot, ma’lumotnoma va boshqa matnli hujjatlarni tayyorlashga xizmat qiladi. Yangi hujjatni Blank document orqali oching. Yuqoridagi Home matn va xatboshi, Insert jadval va rasm, Layout sahifa parametrlari uchun ishlatiladi. Versiyaga qarab tugmalar joyi biroz farq qilishi mumkin.

## Birinchi fayl
Sarlavha yozing, Enter bosing va ikki gapli izoh qo‘shing. File → Save As orqali papka va nom tanlang. .docx tahrirlanadigan ishchi format; PDF ulashish va chop etishda ko‘rinishni saqlash uchun qulay. Ish davomida Ctrl+S ni tez-tez bosing.

## Amaliy mashq
«Mening maktabim» nomli hujjat tuzing: sarlavha, uchta xatboshi va yakuniy xulosa. Uni Word papkangizga saqlang, yopib qayta oching.

## Tekshiring
Save As qachon kerak? Yangi nom, joy yoki format tanlaganda. Enter nega ishlatiladi? Yangi xatboshi yaratish uchun.`),
  lesson('Microsoft Word','DARS','word-text','7. Wordda matnni tahrirlash',
    'Tanlash, qidirish, xatoni qaytarish va imloni tekshirish.',`## Matnni tanlash
So‘zni ikki marta bosing yoki sichqoncha bilan belgilang. Tanlangan matn ustida kesish, nusxalash va joylash ishlaydi. Ctrl+F so‘zlarni qidiradi; Find and Replace ko‘p marta uchragan atamani almashtirishda foydali. Almashtirishdan oldin natijani ko‘zdan kechiring.

## Tahrir odati
Har bir fikrni alohida xatboshida yozing. Bo‘sh joylarni ketma-ket bosib matnni tekislamang; xatboshi sozlamalaridan foydalaning. Imlo belgilari tavsiya beradi, lekin shaxs ismlari va atamalarni o‘zingiz tekshiring. Xato amalni Ctrl+Z qaytaradi.

## Amaliy mashq
Besh gapli matn yozing. Bir so‘zni Ctrl+F bilan toping, ikki takrorini to‘g‘rilang. Bir gapni boshqa xatboshiga ko‘chiring va saqlang.

## Tekshiring
Qidirish va almashtirishdan keyin nega o‘qib chiqish kerak? Har bir o‘rin mazmunga mos kelishini ko‘rish uchun.`),
  lesson('Microsoft Word','DARS','word-format','8. Sarlavha, uslub va xatboshi',
    'Sarlavha uslublari, shrift, interval va matnni tekislash.',`## O‘qilishi oson hujjat
Sarlavha uchun Home → Styles ichidagi Title yoki Heading 1 ni tanlang; bo‘limlar uchun Heading 2 ishlating. Uslublar hujjatning tuzilishini saqlaydi va avtomatik mundarijaga yordam beradi. Har bir satrni alohida kattalashtirishdan ko‘ra uslub tanlash qulayroq.

## Bezash me’yori
Bold muhim so‘zni ajratadi, Italic atamani ko‘rsatadi, Underline kam ishlatiladi. Matnning asosiy qismida bir xil shrift va qulay o‘lcham saqlang. Paragraph orqali chap/o‘ng tekislash, qator oralig‘i va xatboshilar orasidagi masofani sozlang.

## Amaliy mashq
Oldingi hujjatingizda sarlavhani Heading 1, ikki kichik bo‘limni Heading 2 qiling. Matnni chapga tekislang, qator oralig‘ini o‘qishga qulay qiling. Ko‘rinishini oldingi nusxa bilan solishtiring.

## Tekshiring
Nega sarlavhani faqat qalin qilib qo‘yish yetarli emas? Heading uslubi hujjat tuzilishini ham belgilaydi.`),
  lesson('Microsoft Word','DARS','word-layout','9. Sahifa, ro‘yxat va kolontitul',
    'Chegaralar, yo‘nalish, raqamlangan ro‘yxat va sahifa raqamini qo‘shish.',`## Sahifani tayyorlash
Layout → Margins sahifa chetlarini, Orientation tik yoki yotiq ko‘rinishni tanlaydi. Yangi sahifa kerak bo‘lsa Ctrl+Enter bilan page break qo‘ying; ko‘p Enter bosish boshqa kompyuterda joylashuvni buzishi mumkin.

## Tuzilmali ro‘yxatlar
Ketma-ket amallar uchun raqamlangan ro‘yxat, bir xil darajadagi fikrlar uchun nuqtali ro‘yxat ishlating. Insert → Page Number sahifalarni raqamlaydi; Header/Footer doimiy yuqori yoki pastki ma’lumotni qo‘shadi. Hujjatda bir xil ko‘rinish saqlanishiga e’tibor bering.

## Amaliy mashq
«Maktab kutubxonasi qoidalari» nomli bir sahifalik hujjat tayyorlang. Beshta qoida yozing, raqamlangan ro‘yxat qiling, pastiga sahifa raqamini qo‘shing. Print Preview’da chetlarini tekshiring.

## Tekshiring
Yangi sahifaga o‘tish uchun bir necha marta Enter bosish to‘g‘rimi? Yo‘q, page break ishlating.`),
  lesson('Microsoft Word','DARS','word-images','10. Wordda rasm va shakllar',
    'Rasm joylash, o‘lchamini saqlash va izohli hujjat tayyorlash.',`## Rasm qo‘shish
Insert → Pictures orqali qurilmadagi rasmni tanlang. Burchak tutqichidan tortsangiz nisbatni saqlash oson; yon tutqichni noto‘g‘ri tortish rasmni cho‘zishi mumkin. Text Wrapping matnning rasm atrofida qanday joylashishini boshqaradi.

## Tushunarli ko‘rinish
Rasm mavzuga xizmat qilsin. Zarur bo‘lsa qisqa izoh yozing va manbasini ko‘rsating. Muqobil matn (Alt Text) ekran o‘quvchi orqali foydalanadiganlarga rasm mazmunini tushunishga yordam beradi. Matn o‘qilishiga xalaqit beradigan bezaklarni kamaytiring.

## Amaliy mashq
Kompyuter qismlarini tushuntiruvchi hujjatga o‘zingiz olgan yoki foydalanishga ruxsatli bir rasm qo‘shing. Rasm ostiga bitta izoh yozing, o‘lcham va matn o‘ramini sozlang.

## Tekshiring
Nega rasmni faqat bezak uchun ortiqcha qo‘shmaslik kerak? U mazmun va o‘qishni qiyinlashtirishi mumkin.`),
  lesson('Microsoft Word','DARS','word-tables','11. Wordda jadvallar bilan ishlash',
    'Jadval yaratish, satr/ustun qo‘shish, sarlavha va kataklarni sozlash.',`## Jadvalni yaratish
Insert → Table orqali ustun va satr sonini tanlang. Yuqori qatorda ustun nomlari bo‘lsin: №, Mavzu, Sana, Natija kabi. Table Layout orqali satr yoki ustun qo‘shing/o‘chiring; Table Design ko‘rinishini o‘zgartiradi. Ayrim versiyalarda bo‘lim nomi boshqacha ko‘rinadi.

## Ma’lumotni tartiblash
Har bir katakka bitta mazmun kiriting. Uzun matn uchun ustun kengligini sozlang. Sarlavha qatori ajralib tursin; jadvalga tashqaridan aniq nom qo‘ying. Jadval sahifaga sig‘masa, yotiq sahifa yoki torroq ustunlardan foydalaning.

## Amaliy mashq
4 ustun va 6 satrli dars jadvalini tuzing. Birinchi satr sarlavha bo‘lsin; yana bir satr qo‘shib o‘zgartirishni saqlang. Jadvalni chop etishdan oldin Print Preview’da ko‘ring.

## Tekshiring
Word jadvali ma’lumotni joylashtiradi; hisob-kitob ko‘p bo‘lsa qaysi dastur qulay? Excel.`),
  lesson('Microsoft Word','DARS','word-reference','12. Wordda ma’lumotnoma va manbalar',
    'Mundarija, havola, manba yozuvi va qisqa ma’lumotnoma tayyorlash.',`## Ma’lumotnoma tuzilishi
Ma’lumotnoma odatda aniq sarlavha, sana, asosiy faktlar va yakuniy xulosadan iborat. Fikr bilan faktni ajrating: «2026-yilda kutubxonaga 40 kitob keldi» tekshiriladigan fakt; «eng yaxshi kutubxona» bahodir. Agar raqam ishlatsangiz, uning manbasini belgilang.

## Word vositalari
Heading 1/2 uslublaridan keyin References → Table of Contents bilan mundarija yaratish mumkin. References → Insert Footnote pastki izoh qo‘shadi. Havola kiritilganda sayt nomi, sahifa sarlavhasi va ko‘rilgan sanani yozing. Avtomatik mundarijadan so‘ng sahifalar o‘zgarsa, uni yangilang.

## Amaliy mashq
«Maktab kompyuter xonasi» haqida bir bet ma’lumotnoma yozing: sarlavha, sana, uch fakt, ikki kichik bo‘lim, bitta manba va xulosa. Faktlarni o‘ylab topmang; o‘zingiz tekshirgan ma’lumotlardan foydalaning.

## Tekshiring
Manba qachon kerak? O‘zingiz yaratmagan ma’lumot, rasm yoki raqamdan foydalanganda.`),
  lesson('Microsoft Word','DARS','word-practice','13. Wordda amaliy ish: xat va hisobot',
    'Bir hujjatda sarlavha, xatboshi, ro‘yxat, jadval va rasmni birlashtirish.',`## Vazifa
«Sinf loyihasi» deb nomlangan ikki betlik hisobot tayyorlang. Birinchi betda loyiha nomi, maqsad va bajarilgan ishlar, ikkinchisida natija va keyingi qadamlar bo‘lsin. Kamida bitta rasm va 3 ustunli kichik jadval qo‘shing.

## Bosqichlar
Avval reja tuzing: nima qilindi, kim qatnashdi, qanday natija chiqdi. Sarlavhalarga Heading uslubini bering. Jadvalga «Vazifa | Mas’ul | Muddat» ustunlarini kiriting. Rasm ostiga izoh yozing. Yakunda imlo va sahifa ko‘rinishini tekshiring, .docx faylni saqlang, PDF nusxasini chiqaring.

## O‘zingizni baholang
- Fayl aniq nomlanganmi?
- Sarlavhalar bir xil uslubdami?
- Jadvalni tushunish osonmi?
- Rasm manbasi ko‘rsatilganmi?
- PDF’ni ochganda sahifalar to‘g‘ri ko‘rinadimi?

## Tekshiring
Yakuniy hujjatni saqlagach qayta oching: bu buzilgan joylashuv yoki yetishmagan rasmni payqashga yordam beradi.`),

  lesson('Microsoft Excel','DARS','excel-intro','14. Excelga kirish: katak va varaqlar',
    'Ish kitobi, varaq, ustun, satr va katak manzilini ajrating.',`## Excel qanday ishlaydi?
Excelda bitta fayl ish kitobi (workbook), uning ichidagi sahifalar varaqlar (worksheets) deyiladi. Ustunlar A, B, C harflari, satrlar 1, 2, 3 raqamlari bilan belgilanadi. A1 birinchi ustunning birinchi katagi; A1:B5 esa oraliq.

## Ma’lumot turlari
Katakka matn, son, sana yoki formula kiritiladi. Formula doim = belgisi bilan boshlanadi. Ma’lumotni ustunlarga bir xil qoidada joylang: A ustunda ism, B da miqdor, C da narx. Ustun sarlavhasini birinchi satrga yozing.

## Amaliy mashq
Yangi kitobda «Do‘kon» nomli varaq yarating. A1 ga Mahsulot, B1 ga Soni, C1 ga Narx yozing; uchta mahsulot kiriting va .xlsx holida saqlang.

## Tekshiring
B3 nimani bildiradi? B ustunining 3-satri. .xlsx fayl turi nimaga tegishli? Excel ish kitobiga.`),
  lesson('Microsoft Excel','DARS','excel-entry','15. Excelda ma’lumot kiritish va format',
    'Son, sana, foiz, valyuta va ustun kengligini to‘g‘ri qo‘llang.',`## Toza jadval qoidasi
Bir ustunda bitta turdagi ma’lumot saqlang. Masalan, narx katagiga «12000 so‘m» deb matn yozish o‘rniga 12000 sonini kiriting va Number Format orqali valyuta ko‘rinishini tanlang. Sana uchun yagona uslub qo‘llang. Format katak ko‘rinishini o‘zgartiradi, qiymatni emas.

## Jadvalni o‘qish oson bo‘lsin
Ustun chegarasini tortib kenglikni moslang yoki AutoFit qiling. Sarlavha qatorini qalin qiling. Juda ko‘p rang ishlatmang; raqamlarni o‘qiladigan holatda qoldiring. Xatolik chiqsa katak ichidagi haqiqiy qiymatni formula satridan tekshiring.

## Amaliy mashq
Beshta mahsulot nomi, miqdori, narxi va kiritilgan sanani yozing. Narxni valyuta, sana ustunini sana formatiga o‘tkazing. Natijani saqlang.

## Tekshiring
Katakni foiz formatiga o‘tkazish hisob-kitob mantiqini avtomatik to‘g‘rilaydimi? Yo‘q; avval qiymatni tekshiring.`),
  lesson('Microsoft Excel','DARS','excel-formulas','16. Formulalar va asosiy arifmetika',
    'Kataklar yordamida qo‘shish, ko‘paytirish va natijani qayta hisoblash.',`## Formula yozish
Excel formulasi = bilan boshlanadi: =B2*C2 miqdor va narxni ko‘paytiradi. =B2+C2 qo‘shadi, =B2-C2 ayiradi, =B2/C2 bo‘ladi. Qavslar tartibni o‘zgartiradi: =(B2+C2)*D2. Katak manzilidan foydalaning; qiymat o‘zgarsa natija yangilanadi.

## Xatolarni topish
#DIV/0! nolga bo‘lishni, #VALUE! noto‘g‘ri turdagi qiymatni anglatishi mumkin. Formula matn bo‘lib ko‘rinsa, katak formati yoki oldida apostrof borligini tekshiring. Nuqta/vergul va funksiya argument ajratgichi dastur tili/sozlamasiga bog‘liq.

## Amaliy mashq
Jadvalingizda D1 ga Jami deb yozing. D2 ga =B2*C2 kiriting va formulani pastga ko‘chiring. B2 dagi miqdorni o‘zgartirib D2 o‘zgarishini kuzating.

## Tekshiring
Nega =2*12000 o‘rniga =B2*C2 qulay? Katakdagi ma’lumot yangilansa formula ham qayta hisoblanadi.`),
  lesson('Microsoft Excel','DARS','excel-functions','17. SUM, AVERAGE, MIN, MAX va COUNT',
    'Bir nechta katakdagi natijalarni funksiyalar bilan hisoblang.',`## Eng kerakli funksiyalar
=SUM(D2:D6) jami qiymatni, =AVERAGE(D2:D6) o‘rtachani, =MIN(D2:D6) eng kichik, =MAX(D2:D6) eng katta sonni hisoblaydi. =COUNT(D2:D6) sonli kataklarni sanaydi; =COUNTA(A2:A6) bo‘sh bo‘lmagan kataklarni sanaydi. Funksiya nomi va qavs ichidagi oraliqni tekshiring.

## Natijani sharhlang
O‘rtacha qiymatni ko‘rib, barcha mahsulotlar aynan shunday narxda degan xulosaga kelmang. Bo‘sh katak va matn natijaga ta’sir qilishi mumkin. AVERAGE raqamli qiymatlardan foydalanadi; COUNT esa faqat sonli kataklarni sanaydi.

## Amaliy mashq
Beshta mahsulotning D ustundagi jami qiymatini hisoblang. D7 da umumiy SUM, D8 da AVERAGE, D9 va D10 da MIN/MAX yozing. Natijalarni qo‘lda taxminan tekshiring.

## Tekshiring
COUNT bilan COUNTA bir xilmi? Yo‘q: COUNTA matnli bo‘sh bo‘lmagan kataklarni ham sanaydi.`),
  lesson('Microsoft Excel','DARS','excel-references','18. Nisbiy va mutlaq manzillar',
    'Formulani ko‘chirishda A1 va $A$1 qanday farq qilishini biling.',`## Nisbiy manzil
=B2*C2 formulasi D2 dan D3 ga ko‘chirilsa =B3*C3 bo‘ladi. Shu sababli bir qator hisobni tezda barcha satrga ko‘chirish mumkin.

## Mutlaq manzil
Agar barcha satr bitta doimiy koeffitsiyentdan foydalansa, uni masalan G1 ga yozing. =D2*$G$1 formulasi pastga ko‘chirilganda D2 qismi o‘zgaradi, $G$1 esa o‘zgarmaydi. $G1 faqat ustunni, G$1 faqat satrni mahkamlaydi.

## Amaliy mashq
G1 ga 0.1 yozing. E2 ga =D2*$G$1, F2 ga =D2+E2 kiriting. E2:F2 ni pastga ko‘chiring va formulalarni qatorlar bo‘yicha solishtiring.

## Tekshiring
Nega G1 ni $ bilan mahkamlash kerak? Formula boshqa qatorga ko‘chirilganda o‘sha doimiy katakdan foydalanish uchun.`),
  lesson('Microsoft Excel','DARS','excel-if','19. IF va shartli natija',
    'Shartni tekshirish va to‘g‘ri/noto‘g‘ri holat uchun matn chiqarish.',`## Shartli formula
=IF(B2>=60,"O‘tdi","Qayta ishlash") B2 kamida 60 bo‘lsa birinchi, aks holda ikkinchi matnni ko‘rsatadi. Ayrim mahalliy sozlamalarda argumentlar vergul emas, nuqtali vergul bilan ajratiladi; Excel ko‘rsatgan yordamga qarang.

## Ehtiyotkor talqin
Shart chegarasini oldindan belgilang. B2 matn bo‘lsa yoki bo‘sh bo‘lsa natijani alohida tekshiring. Shartli formatlash qiymatni o‘zgartirmasdan katakni rang bilan ajratishga yordam beradi; uni baho o‘rniga ishlatmang.

## Amaliy mashq
Ism va ball ustunli besh o‘quvchidan iborat namunaviy jadval tuzing. Ballni o‘zingiz o‘ylab tanlang, C2 ga IF formulasi yozing va pastga ko‘chiring. 59, 60 va 61 qiymatlarida natija qanday chiqishini tekshiring.

## Tekshiring
«>=60» bilan «>60» farqi nima? Birinchisida 60 ham shartni bajaradi.`),
  lesson('Microsoft Excel','DARS','excel-tables-filter','20. Jadval, saralash va filtr',
    'Sarlavhali ma’lumotni jadvalga aylantirish va qatorlarni filtrlash.',`## Jadvalga aylantirish
Ma’lumotlar oralig‘ini tanlang va Insert → Table ni bosing. «My table has headers» belgisini sarlavha borligiga qarab tekshiring. Jadval qatorlarni bir xil formatlaydi va yangi satr qo‘shilganda oraliqni kengaytirishga yordam beradi.

## Saralash va filtr
Data → Sort A–Z ism yoki kichikdan kattaga tartiblaydi; Filter faqat shartga mos satrlarni ko‘rsatadi. Saralashdan oldin barcha tegishli ustunlarni birga tanlang, aks holda ism va ball bir-biridan ajralib qolishi mumkin. Filtr qatorni o‘chirmaydi, vaqtincha yashiradi.

## Amaliy mashq
Mahsulot jadvalingizni Table ko‘rinishiga o‘tkazing. Narx bo‘yicha tartiblang, keyin bitta mahsulotni filtr bilan ko‘rsating. Filtrni olib tashlab barcha qator qaytganini tekshiring.

## Tekshiring
Filtr ma’lumotni o‘chiradimi? Yo‘q. Saralashdan oldin nega butun jadval tanlanadi? Qatorlar bog‘lanishi saqlanishi uchun.`),
  lesson('Microsoft Excel','DARS','excel-charts','21. Diagramma va natijani ko‘rsatish',
    'Ma’lumotga mos ustunli, chiziqli va doiraviy diagrammani tanlang.',`## Diagramma qachon kerak?
Toifalarni solishtirish uchun ustunli, vaqt bo‘yicha o‘zgarish uchun chiziqli diagramma qulay. Doiraviy diagramma bir butunning qismlarini ko‘rsatadi; juda ko‘p bo‘lim bo‘lsa o‘qish qiyinlashadi.

## Tayyorlash
Sarlavhalar bilan birga kerakli kataklarni tanlang, Insert → Chart orqali turini belgilang. Diagrammaga aniq nom, o‘qlar uchun birliklar qo‘shing. Raqamlarni buzib ko‘rsatadigan noto‘g‘ri masshtabdan saqlaning. Ma’lumotlar yangilansa diagramma bog‘langan oraliqni tekshiring.

## Amaliy mashq
Beshta mahsulotning nomi va jami qiymatidan ustunli diagramma tuzing. «Mahsulotlar qiymati» deb nomlang, son o‘qi qanday birlikda ekanini ko‘rsating. Eng yuqori ustunning jadvaldagi qiymatini toping.

## Tekshiring
Qaysi diagramma haftalar bo‘yicha o‘zgarishni ko‘rsatishga mos? Chiziqli diagramma.`),
  lesson('Microsoft Excel','DARS','excel-project','22. Excelda yakuniy loyiha',
    'Xarajat jadvali, formula, filtr, diagramma va chop etishni birlashtiring.',`## Vazifa
Bir haftalik sinf tadbiri uchun namunaviy xarajatlar jadvalini tuzing. Ustunlar: Narsa, Miqdor, Birlik narx, Jami, Toifa. Kamida 8 qator kiriting; haqiqiy xarajat deb ko‘rsatmasdan, «namuna» deb belgilang.

## Bosqichlar
D2 ga =B2*C2 yozib qolgan satrlarga ko‘chiring. Pastida SUM bilan umumiy xarajatni, AVERAGE bilan qator o‘rtachasini hisoblang. Toifa bo‘yicha filtrlang, jami qiymatni diagrammada ko‘rsating. Print Area yoki Page Layout orqali sahifaga sig‘ishini tekshiring; .xlsx ni saqlang, kerak bo‘lsa PDF chiqaring.

## O‘zingizni baholang
- Ustunlarning nomi bormi?
- Narxlar matn emas, sonmi?
- Formulalar har qatorga mosmi?
- Diagramma sarlavhasi bor-mi?
- Filtrni olib tashlaganda barcha ma’lumot saqlanganmi?

## Tekshiring
Umumiy qiymatni kalkulyator bilan ham solishtiring. Kutilmagan tafovut bo‘lsa manzil va formatni tekshiring.`),

  lesson('Microsoft PowerPoint','DARS','ppt-intro','23. PowerPointga kirish va slaydlar',
    'Taqdimot fayli, slayd, maket va namoyish rejimini tushuning.',`## PowerPoint nima?
Taqdimot ketma-ket slaydlardan iborat. Bir slayd bitta asosiy fikrni ko‘rsatganda tinglovchi uni tezroq tushunadi. Yangi taqdimot ochib Title Slide maketini tanlang, keyin Home → New Slide bilan yangi slayd qo‘shing. Layout sarlavha, matn va rasmning joyini belgilaydi.

## Tuzilma
Boshida mavzu va muallif, keyin asosiy 3–5 fikr, oxirida xulosa bo‘lsin. Har slaydga aniq sarlavha qo‘ying. Fayl .pptx formatida tahrirlanadi; Slide Show uni to‘liq ekranda namoyish qiladi.

## Amaliy mashq
«Kompyuter qismlari» haqida 4 slayd yarating: sarlavha, kiritish qurilmalari, chiqarish qurilmalari, xulosa. Slaydlarni tartiblab .pptx faylni saqlang.

## Tekshiring
Bir slaydga uzun insho sig‘dirish kerakmi? Yo‘q; asosiy fikrlar va izohni og‘zaki yoki notes orqali bering.`),
  lesson('Microsoft PowerPoint','DARS','ppt-design','24. Mavzu, maket va matn dizayni',
    'Yagona tema, o‘qiladigan shrift va rang qarama-qarshiligini qo‘llang.',`## Bir xil ko‘rinish
Design → Themes orqali umumiy rang va shrift uslubini tanlang. Layout har slaydning vazifasiga mos joylashuv beradi. Bitta taqdimotda juda ko‘p turli shrift va rang aralashtirmang. Sarlavha katta va tushunarli, asosiy matn qisqa bo‘lsin.

## O‘qilishi muhim
Matn bilan fon o‘rtasida aniq farq qoldiring. Qorong‘i fonda ochiq matn yoki aksincha, ekran va proyektorda tekshiring. Har bir slaydni sinf oxiridan ham o‘qish mumkinligini ko‘zdan kechiring. Rasmning ustiga yozuv qo‘ysangiz fon matnni berkitmasin.

## Amaliy mashq
Oldingi 4 slaydga bitta tema tanlang. Har slayd sarlavhasini moslang, uzun gaplarni 3 ta qisqa bandga aylantiring. Slaydlar orasida shrift va rang izchil bo‘lsin.

## Tekshiring
Tema nima uchun kerak? Taqdimotning rang, shrift va joylashuvini bir xil uslubda tutish uchun.`),
  lesson('Microsoft PowerPoint','DARS','ppt-media','25. Rasm, jadval va diagrammalar',
    'Vizual materialni qo‘shish va mazmun bilan bog‘lash.',`## Mazmunli rasm
Insert → Pictures orqali rasm qo‘shing va nisbatini saqlab o‘lchamini o‘zgartiring. Rasmni matn takroriga emas, tushuntirishga xizmat qildiring. Muqobil matn rasm mazmunini ovozli yordamchi orqali yetkazishga xizmat qiladi.

## Jadval va grafik
Insert → Table orqali ixcham taqqoslash jadvali, Insert → Chart orqali sonli ma’lumot diagrammasini yarating. Jadvalda ko‘p sonli mayda kataklarni slaydga tiqmang; batafsil jadvalni ilova yoki alohida faylga qo‘ying. Diagrammadagi sonlar manbasini bilib oling.

## Amaliy mashq
«Maktab fanlari» haqida bir slaydga mos rasm, boshqa slaydga 3 ustunli kichik jadval qo‘shing. Diagramma uchun o‘zingiz kiritgan uchta namunaviy sonni ishlating va «namuna» deb belgilang.

## Tekshiring
Diagrammada manba va birliklar nega kerak? Sonning nimani anglatishini to‘g‘ri tushunish uchun.`),
  lesson('Microsoft PowerPoint','DARS','ppt-motion','26. O‘tish va animatsiya',
    'Slayd o‘tishi bilan obyekt animatsiyasini farqlang va me’yorida ishlating.',`## Ikki xil harakat
Transitions slaydlar orasidagi o‘tishni boshqaradi. Animations esa slayddagi matn yoki rasmning paydo bo‘lishini sozlaydi. Effektni mazmunga yordam bersagina tanlang; tez-tez sakrash yoki ovoz ishlatish diqqatni chalg‘itishi mumkin.

## Nazorat
Bir slaydga oddiy o‘tish qo‘shing, davomiyligini sinab ko‘ring. Muhim uch bosqichni ketma-ket tushuntirish kerak bo‘lsa, Animations orqali navbat bilan chiqaring. Namoyishni boshidan va o‘rtasidan tekshiring: barcha obyektlar kerakli vaqtda ko‘rinishi lozim.

## Amaliy mashq
To‘rt slaydli taqdimotingizga bitta sodda o‘tish turini qo‘llang. Faqat bitta slaydda uchta bandni navbat bilan chiqaring. Animatsiyali va animatsiyasiz ko‘rinishni solishtiring.

## Tekshiring
Transitions qayerda ishlaydi? Slaydlar o‘rtasida. Animations-chi? Slayd ichidagi obyektlarda.`),
  lesson('Microsoft PowerPoint','DARS','ppt-present','27. Nutq, notes va taqdim etish',
    'Spiker qaydlari, taymer va namoyish rejimida mashq qilish.',`## Tayyorlanish
Slaydga faqat tayanch so‘zlarni yozing, to‘liq tushuntirishni Speaker Notes joyiga kiriting. Nutqni yoddan o‘qib bermang; har bir slayd fikrini o‘z so‘zingiz bilan ayting. Vaqtni oldindan o‘lchang va ovoz balandligini sinang.

## Namoyish
Slide Show → From Beginning orqali boshidan ishga tushiring. Presenter View qo‘shimcha ekran bilan ishlaganda taqdimotchiga joriy/keyingi slayd va qaydlarni ko‘rsatishi mumkin; auditoriya slaydni ko‘radi. Bitta ekran bo‘lsa rejimni oldindan tekshiring.

## Amaliy mashq
Har bir slayd uchun 2 ta qisqa qayd yozing. 3 daqiqalik mashq namoyishini o‘tkazing, qaysi slaydda ortiqcha matn borligini belgilab tuzating.

## Tekshiring
Nega barcha nutqni slaydga yozmaslik kerak? Tinglovchi o‘qishga chalg‘ib, tushuntirishni kamroq eshitadi.`),
  lesson('Microsoft PowerPoint','DARS','ppt-project','28. PowerPoint yakuniy amaliyoti',
    'Taqdimotni boshidan oxirigacha yaratish, tekshirish va ulashish.',`## Vazifa
«Texnologiya bilan mas’uliyatli ishlash» mavzusida 6 slayd tayyorlang: sarlavha, muammo, ikki yechim, misol, xulosa. O‘zingiz yozgan fikrlardan foydalaning; boshqa manbadan olingan rasm yoki raqam manbasini ko‘rsating.

## Sifat nazorati
Bir xil tema va aniq sarlavhalar bo‘lsin. Kamida bitta mazmunli rasm, bitta sodda diagramma va bir slaydda notes ishlating. O‘tish effektlarini me’yorida qo‘llang. Imlo, kontrast va rasmning muqobil matnini tekshiring. Faylni .pptx qilib saqlang; kerak bo‘lsa PDF nusxasini ham tayyorlang.

## O‘zingizni baholang
- Bir slaydda bitta asosiy fikr bormi?
- Matn uzoqdan ko‘rinadimi?
- Vizualning manbasi va birliklari aniqmi?
- Slaydlarni tartib bilan tushuntira olasizmi?
- Namoyish boshqa qurilmada ham to‘g‘ri ochiladimi?

## Tekshiring
Taqdimotni boshidan oxirigacha ko‘rib chiqing va 3 daqiqada sinfdoshingizga tushuntirib bering.`),
];

export const computerCourseModules=['Kompyuter asoslari','Microsoft Word','Microsoft Excel','Microsoft PowerPoint'];
