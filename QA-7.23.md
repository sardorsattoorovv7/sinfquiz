# Tekshiruv — SinfQuiz 7.23

Tekshiruv sanasi: 2026-10-05. Node 24.19.0, React/Vite, haqiqiy PostgreSQL WASM muhiti (PGlite), haqiqiy Chromium 141. Internetdagi haqiqiy Supabase credentials ishlatilmagan.

## Natijalar

| Tekshiruv | Natija |
| --- | --- |
| `npm test` — avvalgi va yangi modullar | **129 / 129 pass**, 0 fail, 0 skipped |
| Ingliz kursi va Vercel bo‘yicha oxirgi maqsadli server testlari | **6 / 6 pass** |
| `npm run build` | Pass, Vite production build |
| 108 dars kontenti | 108 unique ID, reading va writing matnlari; taqsimot 6/18/18/18/24/24 |
| Misollar va savollar | 648 misol; lesson/reading/listening va exit banklarida 2615 kalitli savol |
| Kalit bilan tekshirish | Barcha 108 darsdagi qabul qilinadigan javoblar haqiqiy SQL graderda tekshirildi |
| Aralash takrorlash | 25 darsda 75 savol, oldingi uch mavzudan |
| Audio | 216 mahalliy MP3; transkript va audio SHA-256, davomiylik, manba matni mosligi tekshirildi |
| Ingliz moduli brauzer oqimi | Placement, qulf, mashq, audio, draft, recorder, assignment, versiya, ustoz rubrikasi — pass |
| Responsive | 390 px telefon, 1440 px desktop, 1920 px sinf doskasi; gorizontal overflow yo‘q |
| Accessibility | Kursning tekshirilgan 5 light/dark/teacher sahnasida axe WCAG 2 A/AA, 2.1 AA, 2.2 AA rule set: 0 violation |
| Avvalgi jamoaviy musobaqa | 2 jamoa, 5 bosqich: 6 kodli quiz → typing → matnli labirint → amaliy Excel → custom quiz + haqiqiy Python worker; reyting 1/2, CSV — pass |
| Avvalgi aktivlar | Original 565 fayl saqlangan, avvalgi `public/` fayllari baytlari o‘zgarmagan |

129 testdan keyingi kontent/validation tuzatishlari yangi kurs/Vercelning 6 maqsadli testi bilan yana tekshirildi; avvalgi funksiya kodiga tegilmagan. Oxirgi test loglari `qa-7.23/`da, brauzer natijalari JSON va rasmlar bilan birga berilgan.

## Serverda amalda sinangan qoidalar

- Migratsiya ikki marta bajarildi: schema/seed qayta bajarishga mos.
- Yangi o‘quvchi placement tugamaguncha dars boshlay olmaydi; C1 ga to‘g‘ridan-to‘g‘ri RPC/URL kirish yopiq.
- Eng past placement to‘rt ko‘nikma namunasi olinib tugaydi. Yuqori obyektiv natija amaliy ustoz dalilisiz ko‘pi bilan A2 ni ochadi.
- Talaba jadvalga `open_level=5` yozib yoki grader helperni chaqirib darajani soxtalashtira olmaydi; raw content kalitlari unga ochiq emas.
- Mehmon UID ro‘yxatdan o‘tmasdan kurs guruhiga ism/kod bilan ulanadi. Guruhlar mavjud jadvalda qoladi.
- Darsda listening dalili, savollar, writing/speaking, chiqish mezoni talab qilinadi. Bo‘sh/null writing qoralamasi turi va yetishmaydigan rubrika tekshiriladi.
- Topshirilgan/o‘zlashtirilgan ish javob va exitni keyin o‘zgartirishga yopiq.
- Past ustoz bahosi keyingi darsni ochmaydi; qayta ishlash va qayta topshirishdan keyin mezonga yetgan baho keyingi darsni ochadi.
- Daraja finalining A/B banki turli darslardan; yaxshi MCQ natijasi ustoz writing/speaking tekshiruvisiz keyingi darajani ochmaydi. Past reading/listening/grammar/vocabularyni yaxshi writing bilan yopish mumkin emas.
- Ustoz boshqa ustozning o‘quvchisini baholay olmaydi yoki shaxsiy nusxasini biriktira olmaydi. Begona UID boshqa ishning qoralamasini o‘zgartira olmaydi.
- Private audio boshqa talaba va begona ustozga ko‘rinmaydi; UID/work path egaga tekshiriladi. Bucket public emas.
- Bir tokenni qayta yuborish ikki marta grade/history yozmaydi.
- Personal kontent versiyasi yangilanganda eski assignment/run snapshoti o‘zgarmaydi. Chala kontent va bo‘sh rubrika serverda rad qilinadi.

## Brauzer sinovi

`tests/english-browser.cjs` React/Vite sahifasini ochadi. RPC endpointlar lokal fixture orqali haqiqiy SQL funksiyasiga yuboriladi. Auth sessiyasi test UIDlari bilan beriladi; bu live Supabase Auth testi emas.

Native MP3 player play/pause va `ended` dalili tekshirildi. Test tezligi uchun audio oxiriga seek qilindi; 108 yozuvning hammasi odam tomonidan quloq bilan ko‘rib chiqilgan deb da’vo qilinmaydi. Matn va generatsiya SHA-256 bog‘lanishi esa barcha 216 yozuv uchun tekshirilgan.

Recorderda brauzerning sinov mikrofoni ishlatildi. Explicit bosishda yozish/to‘xtatish/playback va avtomatik upload yo‘qligi tekshirildi. Real mikrofon, iOS Safari va haqiqiy storage upload sifatini ishlab chiqarish hisobida alohida sinab ko‘ring.

Writing draft sahifa yangilanganda tiklandi. XSSga o‘xshash matn HTMLga aylantirilmadi. Ustoz vazifa biriktirdi, immutable nusxa saqladi, sakkiz mezonni baholadi va o‘quvchining keyingi darsi ochilgani serverdan tasdiqlandi.

Rasmlar: `english-home-desktop`, `english-home-mobile`, `placement-result`, `english-reading-mobile`, `english-reading-dark`, `english-reading-board`, `english-teacher-desktop`. Ko‘rinadigan kontrast va umumiy footer CSS to‘qnashuvlari topilib, kurs doirasida tuzatildi. Bu WCAG bo‘yicha sertifikatlangan audit emas; avtomatik qoidalar ko‘rsatgan sahnalar bo‘yicha natija.

## Qayta ishga tushirish

```sh
npm ci
npm test
npm run build
node --test tests/english-course.test.js tests/vercel.test.js
```

Playwright browser tekshiruvi uchun Playwright va Chromium alohida QA vositalari kerak. Dastur foydalanuvchisi ularni o‘rnatmaydi. `CHROME_EXECUTABLE` — o‘rnatilgan brauzer executable yo‘li, `CODEX_PRIMARY_RUNTIME_NODE_MODULES` — Playwright joylashgan node_modules yo‘li:

```sh
node tests/english-browser.cjs
node tests/competition-browser.cjs
```

Real Supabase/Vercel loyihasiga yangi SQL/kod deploy qilinmagan. Sizning loyihangizda migratsiya, Anonymous Auth sozlamasi, private bucket va role/gruppa holatini o‘rnatish tartibi UPDATE-7.23.md da.
