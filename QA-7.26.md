# SinfQuiz 7.26 — amaliy tekshiruv

2026-10-08. Node.js 24.19.0, Chromium 133.0.6943.0. Quyidagi tekshiruvlar yangilangan kodda qayta bajarildi.

| Tekshiruv | Natija | Dalil |
| --- | --- | --- |
| Production build | O‘tdi | `qa-7.26/build.log` |
| Node regressiya, hisoblar va SQL | 156/156; 0 xato | `qa-7.26/all-tests.log` |
| Studio UI | Desktop, mobil, doska, yorug‘/tungi va haqiqiy SVG/WebGL boshqaruvlar | `qa-7.26/studio/studio-browser.json` |
| Darslik/IQ/Informatika | Python worker, Office javobi, IQ 32 ball, qoralama tiklanishi va ustozga tegishli kontent | `qa-7.26/learning/learning-browser.json` |
| Ingliz tili darslari | Daraja testi, yopiq darslar, MP3 ijrosi, writing, mikrofon va ustoz bahosi | `qa-7.26/english/english-browser.json` |
| Jamoaviy musobaqa | 5 bosqich, 6 xonali quiz, typing, labirint, Excel, Python, haqiqiy 1–2 o‘rin va CSV | `qa-7.26/competition/competition-browser.json` |
| Axe/WCAG tekshiruvi | 30 ko‘rik; 0 qayd etilgan buzilish | To‘rtta suite ichidagi `accessibility.json` |

## Nimalar amalda tekshirildi

- Asos 8, balandlik 5: uchburchak yuzi 20. Asos 10 ga o‘zgartirilsa: 25. Chizma va formula birga yangilandi.
- Kimyo laboratoriyasida suv va miqdor tanlandi, 100 ml idishga qo‘shildi, vaqt o‘zgartirildi; haqiqiy WebGL sahna ochildi.
- Labirintda matn rejimi tanlandi, robot yo‘l bo‘ylab yurdi, raqamli eshik oldida savol va javoblar ochildi. Faol mashqda asosiy navigatsiya yashirildi.
- To‘rt fan darsliklari bitta katalogda. Qidiruv ishlaydi; ochiq/yopiq ingliz darslari avvalgi server qoidalariga amal qiladi.
- Ustoz paneli desktop va telefonda ochildi. Ichki menyu aylantiriladi; jadval klaviaturadan aylantirish uchun fokus oladi.
- Musobaqada boshidagi bitta belgini tushirib qoldirgan typing javobi 95% dan yuqori aniqlik oldi; jamoalarning yakuniy o‘rni turlicha bo‘ldi.
- Telefon 390×844, desktop 1600×1050 va doska 1920×1080 ko‘rinishlari ochildi. Tekshirilgan sahifalarda gorizontal sahifa toshishi yo‘q.
- Mobil menyu Escape bilan yopildi; fokus qaytdi. Ko‘rinadigan fokus va harakatni kamaytirish uslublari mavjud.

Axe avtomatik mezonlarni qamrab oladi; butun mahsulot uchun WCAG sertifikati degan da’vo berilmaydi. Tungi tugmalarda topilgan kontrast tuzatildi va brauzer sinovlari qayta bajarildi.

## Sinov chegarasi

React sahifalari, SVG/WebGL, mahalliy audio va Python muhiti haqiqatan ishladi. Auth/katalog uchun transport fixture, natija va ruxsatlar uchun mahalliy PostgreSQL/PGlite RPC ishlatildi. Jonli Supabase yoki Vercel loyihasiga yozuv yuborilmadi; haqiqiy deploy, real qurilmalarning barchasi va ommaviy yuklama sinovi bajarilgan deb hisoblanmaydi.

Public aktivlar, API va SQL fayllari 7.25 bilan baytma-bayt solishtiriladi. 216 ingliz audio SHA-256 tekshiruvi, to‘rtta ZIP CRCsi va uch qismning to‘liq ZIPga aynan tengligi paketlash skriptida tekshiriladi. Yakuniy dalil: `RELEASE-7.26.json`.

## Qayta bajarish

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

Brauzer sinovlarini ketma-ket bajaring. Boshqa Chromium yo‘li uchun `CHROME_EXECUTABLE` ishlatiladi. `LEARNING_QA_DIR`, `ENGLISH_QA_DIR`, `COMPETITION_QA_DIR` natija papkasini almashtiradi. Tarixiy skriptlarning standart QA papkasi o‘z reliz raqamida qolgan; bu relizda `qa-7.26/` manzillari berildi.

Studio rasm namunalariga joylashuv, rang, model va boshqaruvlar bo‘yicha solishtirildi. Fotografik tasvir o‘rniga ishlaydigan parametrik model va mavjud litsenziyali 3D aktivlar ishlatilgan. Tanlangan ekran suratlari `qa-7.26/studio/` ichida.
