# SinfQuiz 7.25 — amalda bajarilgan tekshiruvlar

2026-10-07 kuni shu paketning yakuniy kodida bajarildi. Oldingi QA fayllari tarixiy dalil sifatida saqlanadi; ushbu reliz natijalari `qa-7.25/` ichida.

## Hisoblar, SQL va build

- **156/156 test**, 0 xato, 0 o‘tkazilgan/skipped test: `qa-7.25/all-tests.log`.
- Vite production build bajarildi: `qa-7.25/build.log`. Yangi runtime dependency qo‘shilmadi. IQ, Darsliklar va Amaliyot komponentlari alohida lazy chunklarda yuklanadi. Build logidagi Lucide `use client` directive ogohlantirishi buildni to‘xtatmadi.
- 144 topshiriqning ko‘rinishi noyobligi, har bosqich/yo‘nalishda 12 tadan savol borligi, to‘rtta variantning farqi va kalitning mustaqil hisobga mosligi tekshirildi. Sonli ketma-ketlik, matritsa, XOR, burish, akslantirish va mantiq kalitlari hisoblandi.
- 32 savollik urinish 8×4 yo‘nalishdan tuziladi. Ochilgan savollarda faqat `id`, `domain`, `prompt`, `visual`, `options` bor; kalit, izoh va muallifning yechim parametrlari yakunlashdan oldin berilmaydi.
- Server foydalanuvchi yuborgan ballni e’tiborga olmaydi. 32 to‘g‘ri javob → 32/32 va 8/8 profillar; bo‘sh test → 0. Xato variant, kasr variant, begona savol, stale revision va qayta ishlatilgan token rad qilinadi. Aynan bir token/javobni qayta yuborish revisionni ikki marta oshirmaydi.
- 24/48 daqiqa, server muddati, muddatdan keyingi javob, tugagan testning o‘zgarmasligi va bir foydalanuvchi ikki oynadan boshlaganda bitta test qaytishi tekshirildi.
- Anon jadval/RPC kirishi, begona o‘quvchining urinishni ochishi, ichki scoring funksiyasini chaqirish va ustozning begona guruh natijasini ko‘rishi yopiq. Admin faollikni boshqaradi; o‘qituvchi bunga ruxsat olmaydi.
- Migratsiyaning beshta qismi va to‘liq bir faylli o‘rnatish qayta bajarildi. 144 savol, 198 dars kaliti va yakunlangan natija snapshotlari saqlanadi.
- Dars ko‘rish soni bir hisob uchun bitta: takror mark oshirmaydi, boshqa hisob 2 ga oshiradi. SQL injectionga o‘xshash kirish oddiy parametr sifatida qoladi; o‘quvchilar nomi bu RPCda berilmaydi.
- Barcha 198 darsning matn/metama’lumoti, fan tartibi, tayanch aloqalari, ustoz tahririni ochish va begona qoralamani yashirish tekshirildi. Ingliz frontend katalogiga private dars javoblari qo‘shilmadi.
- Ingliz SQLining 17 kichik seed qismi asl 108 INSERTni to‘liq va aynan tartibda saqlaydi; schema asl 7.23.1 bilan bir xil. Har so‘rov fayli 150 KB dan kichik.

Avvalgi testlar Office/Excel, xavfsiz Python muhiti, 6-kodli quiz reytingi, 1v1, typing, Ingliz tili, atlaslar, chat, auth va Vercel qoidalarini ham tekshiradi. Hamma 156 test shu relizda qayta bajarildi.

## Haqiqiy Chromiumda ishlatilgan oqimlar

Playwright 1.62.1 + Chromium 133.0.6943.0 ishlatildi. 3 oqimda **0 JavaScript runtime xatosi**, 18 ta axe tekshiruvida **0 aniqlangan WCAG 2/2.1/2.2 A/AA buzilishi**. Bu to‘liq qo‘lda WCAG auditining o‘rnini bosmaydi.

| Oqim | Haqiqatan bajarilgan amallar | Dalil |
|---|---|---|
| IQ va yagona darsliklar | 4 fan ochish, qidiruv, Kimyo savoli va 4.5s mark, Biologiya mobil o‘qish, XSS matni, Python worker `42`, Excel 100/100, Ingliz kirish sharti va dars, IQ namuna, 32 savol, reload, uzilgan javobni qayta yuborish, 32/32, yuklab olish, javob tahlili, ikki ustozning ruxsati | `qa-7.25/browser/learning-browser.json` |
| Eski jamoaviy musobaqa | 6-kodli quiz, typing, to‘liq matnli labirint, Excel, o‘zi tuzgan quiz/Python worker; 5 bosqich; ikki jamoaning 1/2 o‘rni; CSV va faol navigatsiya | `qa-7.25/regression/competition/competition-browser.json` |
| Eski Ingliz kursi | Adaptiv placement, yopiq dars, so‘z tartibi, yordam, audio tinglash dalili, writing reload, mikrofon, XSS matni, ustoz biriktirishi, yangi kontent versiyasi va o‘zlashtirish rubrikasi | `qa-7.25/regression/english/english-browser.json` |

IQ/library oqimida 8, musobaqada 5, Ingliz kursida 5 accessibility tekshiruvi. Fokus, native radio tanlovi, Escape bilan yakunlash dialogini yopish, dialog ichida fokusni ushlash va read-diagram scroll hududi tekshirildi. Harakatni kamaytirish CSSi yangi sahnalarda animatsiya/transitionni o‘chiradi. Avtomatik tekshiruv odam tomonidan ekran o‘quvchisi va barcha klaviatura kombinatsiyalarini sinash degani emas.

390×844 mobil, 1440×1000 kompyuter va 1920×1080 sinf doskasi o‘lchamlari ochildi. IQ/darsliklar va eski bo‘limlar yorug‘/tungi rejimda tekshirildi; gorizontal sahifa toshishi yo‘q. Yangi menu keng ekranda ham ixcham ochiladi. Yakuniy screenshotlar tegishli QA papkalarida; darsliklar, IQ namuna/modeli, mobil savol va tungi natija vizual ko‘rib chiqildi.

## Sinov doirasi

React va haqiqiy Chromium ishladi. Auth/API transporti sun’iy test hisobi bilan moslashtirilgan; baho, savol tanlash, ruxsat va kirish shartlari mahalliy PostgreSQL/PGlite funksiyalaridan olindi. Python haqiqiy workerda, Excel haqiqiy Office gradingda bajarildi. Bu haqiqiy Supabase yoki Vercel deploy sinovi emas. Jonli loyihada yangi migratsiyani RUN qilish va yangi frontendni deploy qilish kerak.

PGlite bitta WASM PostgreSQL instansiyasi; foydalanuvchi SQL kontekstlari navbat bilan ishlaydi. Ushbu relizda 40 telefonning IQ/darsliklar yuklamasi yoki yangi Supabase Realtime sig‘imi o‘lchanmadi. Oldingi musobaqa yuklama hisoboti `QA-7.24.md`da saqlangan va 7.25 uchun yangi o‘lchov deb taqdim etilmaydi. Tarmoq kechikishi va joylashtirishdagi sig‘imga kafolat berilmaydi.

Texnik testlar original testning psixometrik validatsiyasi, yosh me’yorlari yoki haqiqiy IQ shkalasini tasdiqlamaydi. Ilmiy doira: `IQ-METHODS-7.25.md`.

## Arxiv va aktivlar

Paket yig‘uvchisi oldingi 7.24 arxividagi 905 faylning mavjudligini, barcha eski public aktivlarining o‘zgarmagan baytlarini va 216 Ingliz audio SHA256 qiymatini tekshiradi. Yangi sxema va IQ rasmlari loyiha ichida mualliflik SVGlari; tashqi 3D model/rasm yoki savol banki qo‘shilmadi. ZIP yig‘ilgach har bir fayl CRCsi va audio SHA256 qayta tekshiriladi; reliz natijasi `RELEASE-7.25.json`ga yoziladi. `node_modules`, `dist` va mahalliy maxfiy `.env` fayllari arxivga kiritilmaydi.

Bosqichlar: `UPDATE-7.25.md`. O‘zgargan fayllar: `CHANGED-FILES-7.25.md`.
