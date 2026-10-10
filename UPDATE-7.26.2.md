# SinfQuiz 7.26.2 — yangilash

Bu paket 7.26.1 Studio tarmog‘idan tayyorlandi. Bitta to‘liq ZIP ichida kod, tayyor 3D modellar, inglizcha audio va lokal Python muhiti bor. Avvalgi to‘rt arxivni qo‘shimcha yuklash kerak emas.

## Ishlayotgan 7.26 / 7.26.1 loyihani yangilash

1. `.env.local` faylingiz va o‘zingiz kiritgan fayllarni alohida saqlang.
2. ZIPni oching. `sinf-quiz` ichidagi yangi fayllarni loyiha papkangizga ko‘chiring. `node_modules` va eski `dist` paketga kiritilmagan.
3. Supabase loyihangizning **SQL Editor** bo‘limida `supabase-migration-7.26.2.sql` faylining hammasini **RUN** qiling. Amaldagi 7.26 bazasida oldingi migratsiyalar mavjud bo‘lishi kerak; skript `sq_comp_grade` yo‘qligini aniqlasa, avval 7.22, keyin 7.24 migratsiyasini bajaring.
4. Node.js 22.12 yoki undan yangi versiyada terminalni loyiha papkasida oching:

```powershell
npm ci
npm run dev
```

5. Terminal ko‘rsatgan lokal manzilni oching. O‘quvchi kabinetida **Atlaslar → Kimyo laboratoriyasi / Biologiya atlasi** orqali kiring. Darslikdagi «Amaliyotni ochish» tegishli sahnaga olib boradi.
6. Production tekshiruvi:

```powershell
npm test
npm run build
```

7. Vercel’ga shu kodni yuborib qayta deploy qiling. `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` Production muhitida bo‘lsin. Email/Telegram orqali kirgan foydalanuvchilar va mavjud ustoz kontenti o‘zgarmaydi.

## Muhim farq: 6 xonali test va 1v1

Bu yangilanishda javoblar kaliti o‘quvchi brauzeriga yuborilmaydi. Ball, taymer va poyga g‘olibini SQL RPC hisoblaydi. Shu sabab **kod va yangi SQL birga yangilanadi**. Migratsiyasiz eski, brauzerda hisoblangan ball usuliga qaytish yo‘li yo‘q; sayt SQLni bajarish haqida aniq xabar beradi.

Yangi relizga o‘tish paytidagi eski test/poyga sessiyasiga kod bilan qayta kiriladi. Saqlangan yakuniy natijalar, ustozning savollari va darslari saqlanadi. 6 xonali test, typing va 1v1 uchun email yoki Telegram hisobini yaratish majburiy emas; mehmonlar uchun Supabase **Anonymous Sign-Ins** yoqilgan bo‘lishi kerak.

## Telegram va admin API

`npm run dev` endi `/api/telegram-auth` va `/api/admin-reset-password` server yo‘llarini lokalda ham ishlatadi. Telegram uchun `TELEGRAM_BOT_TOKEN`, server Supabase kaliti uchun `SUPABASE_SECRET_KEY` yoki eski `SUPABASE_SERVICE_ROLE_KEY` kerak. Bu qiymatlarni `.env.local` va Vercel server muhitida saqlang; nomiga `VITE_` qo‘shmang.

Telegram botining domenga bog‘lanishi va Supabase Auth URL sozlamalari o‘z loyihangizga mos bo‘lsin. Ushbu paket boshqa hisobning maxfiy kalitlarini o‘z ichiga olmaydi.

## Yangi loyiha uchun

`SUPABASE-VERCEL.md` dagi bazaviy sozlash va ketma-ket migratsiyalarni bajaring, oxirida **7.26.2** migratsiyasini qo‘shing. Kimyo va biologiya uchun mavjud `supabase-chemistry-atlas.sql`, `supabase-chemistry-labs.sql`, `supabase-biology-atlas.sql` va tajriba daftarining 7.20 migratsiyasi kerak.

## Tekshiruv hujjatlari

- `QA-7.26.2.md` — bajarilgan tekshiruvlar va cheklovlar.
- `SCIENCE-STUDIO-7.26.2.md` — darslar, hisoblar, 3D sifat va ilmiy manbalar.
- `CHANGED-FILES-7.26.2.md` — aniq o‘zgargan va qo‘shilgan fayllar.
- `MODEL-SOURCES.md`, `BIOLOGY-MODELS-7.21.md`, `public/biology/v7.21/manifest.json` — modellar va litsenziyalar.
