# QA — SinfQuiz 7.42.0

Sana: 2026-10-30.

## Avtomatik tekshiruvlar

- `npm test`: **326 test, 326 o‘tdi, 0 xato**.
- Yangi qo‘llanma testlari: 174 mavzu va bo‘limning qamrovi; yo‘llardagi barcha identifikatorlar; mazmuni farqli mavzularning alohida savollari; ikki kuzatuv va to‘g‘ri javob talabi; hisoblar ajratilishi; eskirgan qo‘llanma belgisini bekor qilish; buzilgan va bloklangan qoralamalarni xavfsiz o‘qish.
- Yakuniy o‘rganish yo‘llari va progress o‘zgarishidan keyin yangi oltita qo‘llanma testi yana bajarildi: **6/6 PASS**.
- `npm run build`: **PASS**. Mavjud lucide-react `use client` ogohlantirishlari buildni to‘xtatmaydi.
- `npm run perf`: **PASS**.

## Yangi o‘rganish tartibi — haqiqiy brauzer

`tests/atlas-learning-browser.mjs`: **PASS**.

Tekshirildi: beshta atlas kartasi; umumiy qidiruv; qidiruvni tozalash; to‘rtta fan uchun kirish xaritasi; fizikadagi 53 hodisa ro‘yxati; har bir atlasda bir qo‘llanmani to‘liq yakunlash; xato javobdan keyin qayta urinish; to‘liq bo‘lmagan qaydni yakunlamaslik; real model boshqaruvining natijaga ta’siri; JSON yuklash; oxirgi mavzuga qaytish; qaydni tiklash; ikkinchi foydalanuvchida ajratilgan progress; WebGLsiz informatika qo‘llanmasi.

320, 390 va 768 px o‘lchamlarda mavzu sahifalari va atlaslar markazida yonlama chiqish aniqlanmadi. Tungi ko‘rinish va kamaytirilgan harakat rejimi tekshirildi. Yangi markaz, qo‘llanma va kirish komponentlari uchun axe WCAG 2 A/AA, 2.1 AA va 2.2 AA: **0 avtomatik aniqlangan buzilish**. Brauzer `pageerror`: **0**.

## Fizika va koinot regressiyasi

`tests/space-browser.cjs`: **PASS**. Haqiqiy PGlite SQL fixture va WebGL renderer bilan barcha **53 ta 3D sahna** tekshirildi. Shuningdek, parametrlar, real render farqi, qoralamani tiklash, serverga topshirish, JSON eksport, 2D zaxira, planshet/telefon/proyektor, ustoz topshirig‘i yaratish, guruh ishi, ustoz fikri va boshqa ustozdan ajratish ishladi. Oltita accessibility ko‘rinishi o‘tdi, `pageerror` **0**.

Yangi boshlang‘ich xarita sabab regressiya skripti avval xaritadan hodisani ochadi; model va SQL tekshiruvlari saqlangan.

## Informatika regressiyasi

`tests/informatics-browser.mjs`: **PASS**. 12 tarixiy sahna, 18 qism, qismlarga ajratish, kamera va keng ekran, 6 yuklanish bosqichi, RAM/SSD quvvat tajribasi, 8 bit, 8 yig‘ish qadami, 4 diagnostika holati, 12 savol, progress va yuklab olish, telefon/tungi ko‘rinish, bloklangan localStorage va WebGLsiz 2D rejim tekshirildi.

## Dastlabki yuklanish

Boshlang‘ich JavaScript: 587,994 bayt; gzip 172,864 bayt. CSS: 314,436 bayt; gzip 55,345 bayt. Atlaslar markazi va qo‘llanma kontenti kerak bo‘lganda yuklanadi.

## Tekshiruv chegarasi

Sinovlar headless Chromium va dasturiy WebGL bilan bajarildi; har bir real telefonning tezligi kafolatlanmaydi. Matnli xulosaning ilmiy to‘g‘riligi avtomatik baholandi deb ko‘rsatilmaydi. 3D modellar o‘quv uchun soddalashtirilgan. Avtomatik axe tekshiruvi qo‘lda to‘liq accessibility auditining o‘rnini bosmaydi. WebGL ataylab o‘chirilgan sinovda rendererning konsol xabari kutilgan; zaxira rejimiga o‘tish va o‘quv materiallari ishlashi tekshirildi.
