# SinfQuiz 7.27.0 — tekshiruv natijalari

Tekshiruv sanasi: 2026-10-10. Node 24, Chromium 133, React/Vite loyihasining joriy kodi.

## Natija

| Tekshiruv | Natija | Dalil |
| --- | --- | --- |
| Node hisob/model/SQL/xavfsizlik testlari | 188/188 o‘tdi | `qa-7.27.0/all-tests.log` |
| Production build | O‘tdi | `qa-7.27.0/build.log` |
| Sinfxona brauzer tekshiruvi | 32/32 amaliy tekshiruv | `qa-7.27.0/classroom/results.json` |
| Mavjud Studio, Science, Learning, quiz/poyga oqimlari | 4 regression to‘plami o‘tdi | Shu nomdagi QA papkalari |
| WCAG 2.2 AA bilan avtomatik axe tekshiruvi | 33 holatda 0 aniqlangan buzilish | Har to‘plamning `accessibility.json` fayli |
| SEO sahifalari | 7 sahifa JavaScript o‘chiq brauzerda ochildi | Sinfxona brauzer natijasi va `tests/seo.test.js` |

Avtomatik axe natijasi to‘liq WCAG sertifikati yoki barcha yordamchi qurilmalarda sinov degani emas. Klaviatura, sensor, stilus va ko‘rinadigan fokus alohida boshqarildi.

## Sinfxona qanday sinab ko‘rildi

- Ustoz/admin menyusi va `/#sinfxona` orqali kirish ishladi; o‘quvchi va mehmon uchun doska ochilmadi. Boshqa ustozning UIDsi bilan bir brauzerda avvalgi doska chiqmagan.
- Qalam, marker va matn ajratish, undo/redo, chiziqning o‘rtasini o‘chirish, 5 shakl va chapga chizilgan strelka ishladi. Aylana teng diametrni saqlashi model testi bilan tekshirildi.
- Obyektni tanlash, sudrash, maydondan o‘lchamini o‘zgartirish, klaviatura orqali ko‘chirish/o‘chirish, matn tahriri/rang/shrift va matnning haqiqiy chegarasi tekshirildi.
- Rasm yuklandi, ustiga chizildi va 1600×900 PNG haqiqatan yuklab olindi. 10 fon almashtirilganda obyektlarning IDlari saqlangan.
- Sahifa yaratish va nomlash, avtomatik IndexedDB qoralamasidan reload orqali tiklash, localStorage zaxirasidan tiklash sinab ko‘rildi. Sun’iy quota xatosi ko‘rinadigan xabar berdi; xotira tiklanganda yana saqlandi.
- Hisoblash, bo‘sh joy, jadval va rasm shablonlari doskada haqiqiy obyektlar yaratdi.
- 10 taymer uslubi bitta tugash vaqtini saqladi. Doskada chizish taymerni to‘xtatmagan. Pauza, davom ettirish, ±1 daqiqa va qayta boshlash ishladi. Boshqa tabdan qaytishni ifodalovchi vaqt/visibility testi tugagan vaqtni to‘g‘ri ko‘rsatdi. Ovoz yoqilganda 3 signal, o‘chirilganda 0 signal kuzatildi.
- Uch xil son manbasi, ro‘yxatdagi takrorlar, takrorlanmas tanlov, tarix, tiklash, bo‘sh ro‘yxat va noto‘g‘ri oraliq tekshirildi. RNG rejection sampling va teng ehtimol algoritmi Node testlarida ham tekshirildi.
- Chromium mikrofon ruxsati va native AudioContext oqimi ishlatildi. Nazoratli sokin → baland → sokin signal darajani va sharlarning ko‘tarilish/tushishini o‘zgartirdi. Kalibrlash, chegara, sezgirlik, panelni ko‘chirish/yig‘ish, ruxsat rad etilishi va qayta urinish ishladi. MediaRecorder chaqirilmagan. To‘xtatish, sahifa tugmasi va brauzer Back mikrofon tracklarini tugatdi.
- Haqiqiy fullscreen rejimida doska 1920×1080 ekran balandligiga sig‘di. CDP sensor hodisasida sahifa surilmagan; stylus bosimi saqlangan.
- 1600×1080 desktop, 1920×1080 proyektor, 768×1024 planshet va 390×844 telefon ko‘rinishlari tekshirildi. Yorug‘/tungi rejim va reduced-motion ishladi; gorizontal overflow aniqlanmadi.

## Oldingi oqimlarning saqlanishi

Learning regression: 198 darslik, IQning Postgres orqali hisoblangan natijasi 32, haqiqiy Python worker, Office amaliy baholashi, Ingliz tili darsi va ustoz kontenti chegarasi tekshirildi.

Studio regression: navigatsiya/qidiruv, reload, uchburchakning jonli yuza hisobi, kimyo tajriba stoli, Ingliz tili 3D labirinti va matn savollari, ustoz paneli va chatga o‘tish ishladi.

Science regression: biologiya qoralamasi va 2 tajribani taqqoslash, haqiqiy modeldan CSV, litsenziyali anatomiya 3D modeli, kimyo amallari va reduced-motion/2D fallback ishladi.

Secure play regression: javob kaliti brauzer storage’ida yo‘q; mehmon kodli test va split poygaga kira olgan. Turli ballar turli o‘rin olgan; g‘olib tekshirilgan SQL/RPC modeli orqali aniqlangan.

Avvalgi `qa-7.26.2` va eski QA fayllari tarixiy dalil sifatida paketda saqlangan. Joriy natijalar aynan `qa-7.27.0` ichida.

## Tekshiruv chegaralari

Auth/catalog transporti sinov fixturelari bilan berildi; test haqiqiy foydalanuvchi paroli yoki Supabase production hisobi bilan kirish emas. SQL/PGlite, React, SVG, Canvas, IndexedDB, WebGL, Python worker va WebAudio haqiqatan bajarildi. Mikrofon shovqini native boshqariladigan oqim bilan tekshirildi; jismoniy sinfxona ovozi yoki dB kalibratsiyasi o‘lchanmadi. Vercel deploy, real proyektor va bir sinfning barcha telefonlari bilan yuklama sinovi bu tekshiruvga kirmaydi.

Sinfxona yangi server RPC/jadval ochmaydi. SQL migratsiyalar, biologiya modellari va 216 ta Ingliz tili audio fayli paketda oldingi baytlari bilan saqlangan. ZIP tuzilishi, CRC, har faylning baytlari va SHA-256 chiqarishda tekshiriladi.

## Qayta ishga tushirish

```powershell
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e:classroom
npm run test:e2e:studio
npm run test:e2e:science
npm run test:e2e:learning
npm run test:e2e:play
```

Sinfxona testi natijalarni `qa-7.27.0/classroom`ga yozadi. Boshqa testlar o‘z tarixiy standart QA manzillarini ishlatadi; `LEARNING_QA_DIR`, `STUDIO_QA_DIR`, `SCIENCE_QA_DIR`, `PLAY_QA_DIR` orqali alohida papka berish mumkin. Maxsus Chromium uchun `CHROME_EXECUTABLE`dan foydalaning.
