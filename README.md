# SinfQuiz 7.27.0 — Sinfxona

7.26.2 Science Studio asosida elektron doska, topshiriq shablonlari, 10 ko‘rinishli taymer, mikrofon orqali nisbiy shovqin nazorati va xolis raqam tanlash qo‘shildi. Sinfxona faqat ustoz/admin uchun. Mavjud fanlar, kirish va ruxsat oqimlari saqlangan.

**[7.27 yangilash tartibi](UPDATE-7.27.0.md) · [7.27 tekshiruvlar](QA-7.27.0.md) · [7.27 o‘zgargan fayllar](CHANGED-FILES-7.27.0.md)**

Sinfxona uchun yangi SQL kerak emas. 7.26.2 migratsiyasi oldindan bajarilgan bo‘lsa, kodni yangilab `npm ci` va `npm run dev` qiling. Qidiruv uchun ochiq fan sahifalari, metadata va `sitemap.xml` build vaqtida yaratiladi; domenni `VITE_PUBLIC_SITE_URL` bilan belgilang.

## Avvalgi Science Studio imkoniyatlari

7.26.1 Studio dizayni asosida kimyo va biologiya darslari, 3D sahnalar, jonli grafik va tajriba daftarini birlashtirgan yangilanish. Bu tarmoq avvalgi Informatika, Ingliz tili, Matematika, testlar, typing va musobaqa oqimlarini saqlaydi.

**[Yangilash tartibi](UPDATE-7.26.2.md) · [Tekshiruvlar](QA-7.26.2.md) · [Ilmiy hisob va modellar](SCIENCE-STUDIO-7.26.2.md) · [O‘zgargan fayllar](CHANGED-FILES-7.26.2.md)**

## Ishga tushirish

ZIP ichidagi `sinf-quiz` papkasini VS Code’da oching. Amaldagi loyihangizning `.env.local` faylini saqlang; yangi loyiha uchun `.env.example`ni nusxalab o‘z qiymatlaringizni kiriting.

**7.26 bazasidan o‘tayotgan bo‘lsangiz:** Supabase SQL Editor’da `supabase-migration-7.26.2.sql` faylini RUN qiling. Bu migratsiya oldindan bajarilgan bo‘lsa takrorlash talab qilinmaydi. 7.27.0 Sinfxona uchun qo‘shimcha SQL yo‘q. Yangi loyiha uchun bazaviy schema va oldingi migratsiyalarni `SUPABASE-VERCEL.md` bo‘yicha bajarib, 7.26.2 migratsiyasini oxirida qo‘shing.

Node.js 22.12 yoki undan yangi versiyada:

```powershell
npm ci
npm run dev
```

Production:

```powershell
npm test
npm run build
```

Vercel: Vite, build `npm run build`, chiqish katalogi `dist`. Production muhitiga `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` kiriting va yangi kodni qayta deploy qiling. Server kalitlari va Telegram bot tokenining nomiga `VITE_` qo‘shilmaydi.

## Kimyo va biologiya

- Kimyo: 12 atlas mavzusi, 13 boshqariladigan laboratoriya shabloni, erkin tajriba stoli va 12 amaliy ish. Modda, jihoz, miqdor, konsentratsiya, harorat va vaqt natijaga ta’sir qiladi.
- Biologiya: 30 tushuncha, 24 turdagi sahna, 12 amaliy ish; barg–tuproq–ildiz, o‘simlik, hayvonlar va interaktiv anatomiya.
- Har mavzuga qisqa dars va bilimni tekshirish biriktirilgan. Grafiklar aynan sahnadagi modeldan hisoblanadi; CSV, sharoitlarni taqqoslash va tiklash ishlaydi.
- Biologiyada pauzadagi bosqich, parametrlar va daftar shu hisob/mavzu bo‘yicha qayta ochiladi.
- Tayyor biologiya modellarining litsenziyalari `MODEL-SOURCES.md` va `public/biology/v7.21/manifest.json`da. Yengil 3D va ishlaydigan 2D muqobil saqlangan.

## Kirish va natijalar

Darslar va atlaslar mavjud o‘quvchi kabineti orqali ochiladi. Ustoz o‘z ishlarini boshqaradi, o‘quvchi kuzatuvini ko‘radi va fikr beradi. Ommaviy ustoz nusxalari uchun mavjud admin tasdiqlashi va RLS cheklovlari saqlangan.

6 xonali kodli test, typing va 1v1 uchun email/Telegram hisobini yaratish shart emas. Mehmon kirishi uchun Supabase Anonymous Sign-Ins yoqilgan bo‘lsin. 6 xonali testning ball/taymeri va 1v1 javob/g‘olibi endi serverda hisoblanadi. Migratsiyadan oldingi aktiv test/poygaga kod bilan qayta kiriladi; yakuniy natijalar yo‘qolmaydi.

Telegram va admin parol APIlari `npm run dev` orqali lokalda ham ishlaydi. Telegram imzosi haqiqiy bot tokeni bilan tekshiriladi; server kaliti `SUPABASE_SECRET_KEY` yoki `SUPABASE_SERVICE_ROLE_KEY` bo‘lishi mumkin.

## Brauzer tekshiruvi

Playwright va Chromium o‘rnatilgach:

```powershell
npx playwright install chromium
npm run test:e2e:science
npm run test:e2e:play
npm run test:e2e:studio
npm run test:e2e:learning
npm run test:e2e:competition
```

Sinovlarda transport/Auth fixture ishlatilgan joylar QA hujjatida alohida ko‘rsatilgan. Production Supabase va Vercel bilan o‘z loyihangizda tekshirish kerak.

Bu virtual ta’lim modeli: murakkab tabiiy jarayonlarning qaysi jihatlari soddalashtirilgani sahnaning o‘zida ko‘rsatiladi. Anatomiya tashxis vositasi emas. Tarixiy reliz hujjatlari paketda saqlangan; ushbu yangilanish uchun `UPDATE-7.26.2.md`ni kuzating.
