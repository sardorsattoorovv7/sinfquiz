# Yangilash: 7.30.0

Koinot atlasi uchun [UPDATE-7.30.md](UPDATE-7.30.md)ni o‘qing. 7.29 dan: `supabase-office-amaliy-fix.sql`, keyin `supabase-migration-7.30.sql`. Mavjud login va environment qiymatlari saqlanadi. To‘liq ketma-ketlik `migration-chain.json`da.

# SinfQuiz 7.29.0

To‘lmagan jamoa bilan boshlash, har ishtirokchi uchun erkin bosqichlar va alohida taymerlar, serverda qoralamadan qisman baholash. Klaviatura — 12, Word — 12, Excel — 10 ta yangi savol. Sinfxona doskasi, katta namoyish va boshqa fanlar saqlangan. **[Yangilash](UPDATE-7.29.md) · [SQL tartibi](MIGRATIONS.md) · [Tekshiruvlar](QA-7.29.md) · [Savollar](CONTENT-7.29.md)**

## Avvalgi Science Studio imkoniyatlari

7.26.1 Studio dizayni asosida kimyo va biologiya darslari, 3D sahnalar, jonli grafik va tajriba daftarini birlashtirgan yangilanish. Bu tarmoq avvalgi Informatika, Ingliz tili, Matematika, testlar, typing va musobaqa oqimlarini saqlaydi.

**[Yangilash tartibi](UPDATE-7.26.2.md) · [Tekshiruvlar](QA-7.26.2.md) · [Ilmiy hisob va modellar](SCIENCE-STUDIO-7.26.2.md) · [O‘zgargan fayllar](CHANGED-FILES-7.26.2.md)**

## Ishga tushirish

ZIP ichidagi `sinf-quiz` papkasini VS Code’da oching. Amaldagi loyihangizning `.env.local` faylini saqlang; yangi loyiha uchun `.env.example`ni nusxalab o‘z qiymatlaringizni kiriting.

**Ishlayotgan 7.28 bazasidan o‘tayotgan bo‘lsangiz:** Supabase SQL Editor’da `supabase-migration-7.29.sql` faylini to‘liq RUN qiling. 7.27 bazasi uchun avval 7.28, so‘ng 7.29 qo‘llanadi. Yangi Supabase loyiha uchun barcha 49 faylning tekshirilgan tartibi `MIGRATIONS.md` va `migration-chain.json`da. Oxirgi migratsiya — 7.29.

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

Bu virtual ta’lim modeli: murakkab tabiiy jarayonlarning qaysi jihatlari soddalashtirilgani sahnaning o‘zida ko‘rsatiladi. Anatomiya tashxis vositasi emas. Tarixiy reliz hujjatlari paketda saqlangan; ushbu yangilanish uchun `UPDATE-7.28.md`ni kuzating.
