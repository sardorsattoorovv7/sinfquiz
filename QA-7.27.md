# SinfQuiz 7.27 — amaliy tekshiruv

Sana: 2026-10-08. Bazaviy loyiha: **7.26.1**, 877 ta fayl. Sinov muhiti: Node.js 22+, Chromium 133.0.6943.0, mahalliy Vite, SQL tekshiruvlarida PGlite/Postgres. Bular jonli Vercel yoki foydalanuvchining Supabase hisobiga yozilgan sinovlar emas.

## Natija

- `npm test`: **161 / 161** o‘tdi; muvaffaqiyatsiz yoki o‘tkazib yuborilgan test yo‘q.
- `npm run build`: production build yig‘ildi. Vite/Lucide `use client` haqida bundler ogohlantirishi chiqaradi; bu loyiha client React ilovasi bo‘lib, build va brauzer sinovlari muvaffaqiyatli tugadi.
- Oltita brauzer oqimi bajarildi; **40 ta axe accessibility tekshiruvida 0 ta topilgan buzilish**. Bu avtomatik tekshiruv natijasi, to‘liq WCAG sertifikati emas.
- 320, 390, 768, 1024, 1280, 1600 va 1920 px kengliklarda bosh sahifada gorizontal chiqib ketish yo‘q. Oltita fan tugmasining markazi bosiladi, sarlavha tugmalarni yopmaydi.
- Orolning desktop va mobil tasviri haqiqatan yuklangach ekran tasvirlari olindi. Tanlangan konsept bilan maskanlar, kitob maydoni, darvoza, ko‘prik, qidiruv, kod formasi va pastki menyu solishtirildi.

## Brauzerda nima bajarildi?

| Oqim | Tekshirilgan xatti-harakat | Hisobot |
| --- | --- | --- |
| Bilim oroli | 7 ekran kengligi, mobil rasm tanlanishi, kodni birdan kiritish, noto‘g‘ri kod xabari, hisob ochmasdan testga kirish, auth cheklovi, sekin auth paytida tanlovning saqlanishi, ochiq fan havolasining kirish oynasiga yo‘naltirilishi, harakatni kamaytirish, JavaScriptsiz fan sahifasi | `qa-7.27/island/island-browser.json` |
| Umumiy navigatsiya | Qidiruvda klaviatura/Escape/tashqariga bosish, profil/chat/milliy testni F5 bilan tiklash, mobil menyu fokus cheklovi, ustoz paneli va ustozning chat yo‘li | `qa-7.27/studio/studio-browser.json` |
| Atlas va labirint | Uchburchak 8×5÷2=20, asos 10 bo‘lganda 25; kimyoda 100 ml suv qo‘shish; real WebGL labirintda yurish va matnli savol; light/dark, telefon/doska | Shu Studio hisoboti |
| Darslik va amaliyot | To‘rtta fan, haqiqiy Python Workerda `print(6 * 7)` → 42; Excel yacheykalarini kiritish va baholash; IQning 32 javobi, SQL balli, tarmoqdan keyin tiklash, XSS matn sifatida qolishi, boshqa ustozdan ajratish | `qa-7.27/learning/learning-browser.json` |
| Ingliz tili | Daraja testi, yopiq darsni chetlab o‘tmaslik, dars, mahalliy audio, yozuv qoralamasi, foydalanuvchi bosganida mikrofon, ustoz biriktirishi, kontent versiyasi, rubrika bahosi | `qa-7.27/english/english-browser.json` |
| Jamoaviy musobaqa | 5 bosqich: 6 kodli quiz, typing, to‘liq matnli labirint, Excel amaliyoti, ustoz savoli; haqiqiy reyting, CSV, Python Worker | `qa-7.27/competition/competition-browser.json` |
| Qatnashish va tugatish | 6 o‘rin bo‘lsa ham kelgan 2 o‘quvchi bilan boshlash, bo‘sh jamoaga soxta o‘rin bermaslik, kelmaganni qaytarish/chiqarish, birinchi harfi tushib qolgan typing, bekor qilishda natijani saqlash | `qa-7.27/attendance/attendance-browser.json` |

Studio transportida auth/katalog fixturelari ishlatiladi; u jonli login yoki haqiqiy profil tahririni tasdiqlamaydi. Learning, English va competition oqimlarida hisob rollari fixture, natija va egaga tegishli ruxsatlar esa mahalliy SQL funksiyalarida hisoblanadi. Server ma’lumotlari tasodifiy “tayyor natija” bilan almashtirilmagan.

## Hisob, xavfsizlik va SEO tekshiruvlari

Node testlari matematika hisoblari, kimyoda atom/modda saqlanishi, biologik modellar, typing bahosi, reyting, SQL/RLS, ustoz egaligi, Telegram imzosi, parol yangilash vakolati, Python cheklovlari va mavjud foydalanuvchi oqimlarini qamraydi. Bu reliz Auth yoki RLS siyosatini yangidan yozmaydi.

Yangi SEO testlari barcha 8 sahifada mazmunli dastlabki HTML, yagona H1, o‘z canonical manzili, noyob title, description, ulashish meta ma’lumoti, JSON-LD, haqiqiy fan havolalari va ochiladigan misolni tekshiradi. Sitemapda shaxsiy ekranlar yo‘q. Noma’lum manzilni bosh sahifaga qaytaradigan global Vercel rewrite yo‘qligi tekshirildi. Lokal fan sahifalari JavaScriptsiz Chromiumda ochildi. Production 404 va Google indeks holati deploydan keyin alohida tekshirilishi kerak.

Jonli saytga deploy, Search Console verifikatsiyasi, Google indekslash natijasi va real 30–40 telefonning internet tezligi ushbu mahalliy tekshiruvga kirmaydi. Ular bajarildi deb da’vo qilinmaydi.

## Takrorlash

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e:island
npm run test:e2e:studio
npm run test:e2e:learning
node tests/english-browser.cjs
npm run test:e2e:competition
```

Yangi ekran tasvirlari `qa-7.27/previews/`da; brauzer testini qayta bajarsangiz asl PNGlar ham tegishli hisobot papkasiga yoziladi. Yakuniy ZIPdagi eski model, audio va SQL fayllari bazaviy 7.26.1 bilan baytma-bayt solishtiriladi; arxivning har bir a’zosi CRC orqali tekshiriladi.
