# SinfQuiz 7.26.1 — tekshiruv natijalari

2026-10-08. Node.js 24.19.0 va Chromium 133.0.6943.0.

| Tekshiruv | Natija | Dalil |
| --- | --- | --- |
| Production build | O‘tdi | `qa-7.26.1/build.log` |
| Node, SQL va hisoblar | 158/158, 0 xato | `qa-7.26.1/all-tests.log` |
| Studio | Qidiruv, klaviatura, sahifani tiklash, ustoz chat yo‘li, mobil/doska va haqiqiy SVG/WebGL | `qa-7.26.1/studio/studio-browser.json` |
| Darslik va IQ | 4 fan, qoralama, 32 ball, egaga tegishli natija, Python va Office | `qa-7.26.1/learning/learning-browser.json` |
| Ingliz tili | Daraja, cheklov, audio, writing, mikrofon va ustoz bahosi | `qa-7.26.1/english/english-browser.json` |
| Musobaqa | 5 bosqich, quiz, typing, labirint, Excel, Python, haqiqiy reyting va CSV | `qa-7.26.1/competition/competition-browser.json` |
| Axe/WCAG | 31 ko‘rik, 0 qayd etilgan buzilish | Har bir suite ichidagi `accessibility.json` |

Qidiruvga `  Word  ` kiritildi; strelka bilan natija tanlandi, Escape bilan fokus qaytdi. Profil, suhbat, Informatika va milliy test sahifalari qayta yuklanganda o‘sha bo‘limda qoldi. Ustoz kabinetidan chat ochilganda boshqaruv panelining suhbatlar qismiga o‘tildi.

Uchburchakda 8 × 5 ÷ 2 = 20 va 10 × 5 ÷ 2 = 25 amalda tekshirildi. Kimyo idishiga 100 ml suv qo‘shildi. Labirintda haqiqiy 3D model va matnli savol ishladi. 390, 1600 va 1920 px ko‘rinishlarda tekshirilgan sahifalar gorizontal toshmaydi.

Auth/katalog transport fixture; hisob va ruxsatlar uchun mahalliy PostgreSQL/PGlite ishlatildi. Profil/chat tiklanish sinovlari navigatsiyani tekshiradi; jonli hisobni tahrirlash yoki haqiqiy suhbat yuborish deb hisoblanmaydi. Jonli Supabase/Vercelga yozuv yuborilmadi. 31 ta avtomatik accessibility ko‘rigi butun mahsulot uchun WCAG sertifikati degani emas.

API, SQL/RLS va barcha public aktivlar 7.26 bilan baytma-bayt solishtiriladi. 216 audio hash, beshta ZIP CRCsi va to‘rtta qismning to‘liq ZIPga tengligi paketlash skriptida tekshiriladi. Saqlangan nusxalar qayta olinib hash/CRCsi solishtirilgandan keyin havolalar topshiriladi.

## Qayta tekshirish

```bash
npm ci
npm test
npm run build
npx playwright install chromium
node tests/studio-browser.cjs
node tests/learning-browser.cjs
node tests/english-browser.cjs
node tests/competition-browser.cjs
```

Ketma-ket bajaring. `STUDIO_QA_DIR`, `LEARNING_QA_DIR`, `ENGLISH_QA_DIR`, `COMPETITION_QA_DIR` bilan natija manzillarini tanlash mumkin. Bu relizda ular `qa-7.26.1/` ostiga berildi. Boshqa Chromium uchun `CHROME_EXECUTABLE` ishlatiladi.
