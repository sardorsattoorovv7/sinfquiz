# SinfQuiz AI integratsiyasi

## Sozlash

Node.js 22.12 yoki undan yangisi kerak. `.env.example`dagi namunalarni `.env.local`ga kiriting. Muhitdagi mavjud qiymatlar fayllardan ustun turadi; `.env.local` esa `.env`dan ustun.

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

`SUPABASE_SECRET_KEY` o‘rniga avvalgi `SUPABASE_SERVICE_ROLE_KEY` ham ishlaydi. Maxfiy server kalitlariga `VITE_` qo‘shmang. Kalitlar `.env.example`, Git yoki brauzer bundle’iga yozilmaydi.

```sh
npm ci
npm run ai:check:speaking
npm run dev
```

`npm run dev` va `npm start` web serverni hamda server kaliti mavjud bo‘lsa Speaking worker’ni birga boshqaradi. Jarayon to‘xtatilganda ikkalasi yopiladi. `npm run dev:web` faqat webni ochadi; alohida worker uchun `npm run worker:speaking` saqlangan. Bir xil server uchun workerni ikki marta ochish shart emas.

`npm run ai:check` Groq JSON javobi va Supabase autentifikatsiyasini haqiqiy so‘rov bilan tekshiradi. `npm run ai:check:speaking` bazadagi AI jadvallari, private audio bucket va ffprobe’ni ham majburiy qiladi. `node scripts/ai-check.mjs --offline` faqat mahalliy sozlamalarni tekshiradi; tashqi xizmatlar tasdiqlandi degani emas. Tekshiruv kalitlarni yoki foydalanuvchi yozuvlarini chiqarmaydi. Avtomatik tekshiruvlar: `npm run test:ai`; ishlayotgan lokal serverda Chromium sinovi: `npm run test:e2e:ai`.

## AI yordamchi

Menyu: **AI yordamchi**, manzil: `/#ai-yordamchi`. Doimiy hisobga kiring va uch rejimdan birini tanlang:

- **Yo‘l ko‘rsatish** — faqat mavjud, rolingizga ruxsat etilgan bo‘limlar va tekshirilgan qadamlar.
- **Mavzuni tushuntirish** — o‘zbekcha tushuntirish, misol va suhbat davomi.
- **Mashq savollari** — 3–5 savol, to‘rttadan variant; tanlagandan keyin to‘g‘ri javob va izoh ochiladi.

So‘rovlar `/api/ai-assistant` orqali Groq’ga serverdan yuboriladi. Kalit foydalanuvchidan so‘ralmaydi. Oxirgi olti suhbat xabari kontekst sifatida yuboriladi. Suhbat sahifa xotirasida qoladi; alohida bazaga saqlanmaydi. Bekor qilish yoki aloqa xatosida savol matni qoladi. AI savollari mashq uchun; rasmiy imtihon topshiriqlari emas.

Matnli yordamchiga Speaking migratsiyasi yoki worker shart emas. Supabase server kaliti va 7.46 migratsiyasi mavjud bo‘lsa umumiy bazadagi limitlar ishlaydi: foydalanuvchiga kuniga 80, saytga 2000 so‘rov, shuningdek daqiqalik limit. Server sozlanmagan eski o‘rnatishda bir jarayon doirasidagi limit ishlaydi; bu ko‘p server uchun umumiy limit o‘rnini bosmaydi. Sozlangan bazada haqiqiy aloqa yoki limit xatosi AI so‘rovini to‘xtatadi.

## AI Speaking

7.31–7.45 bazasi ustiga `supabase-migration-7.46.sql` bir marta bajarilishi kerak. Tekshiruvchi `sq_sp_records`, `sq_sp_jobs` va `speaking-private` private bucket’ni tekshiradi. Audio, transkript, baholash va roadmap ishlari bazadagi navbat orqali worker’da bajariladi. Mikrofon uchun HTTPS yoki localhost kerak.

`@ffprobe-installer/ffprobe` serverga platformaga mos audio tekshiruv dasturini o‘rnatadi. Maxsus server binari uchun `SPEAKING_FFPROBE_PATH` kiriting; bo‘sh qiymat yoki `ffprobe` standartida npm paketi avtomatik topiladi. ffprobe brauzerga yuborilmaydi. Platforma paketi o‘rnatilmagan bo‘lsa tizimdagi `ffprobe` ishlatiladi.

Groq modellari server muhitida o‘zgartiriladi: tahlil uchun `GROQ_ASSESSMENT_MODEL`, yordamchi va mashq uchun `GROQ_PRACTICE_MODEL`, audio uchun `GROQ_TRANSCRIPTION_MODEL` va `GROQ_PRACTICE_TRANSCRIPTION_MODEL`. Standartlar `.env.example`da. Talaffuz va to‘liq fluency maxsus audio baholovchisiz baholanmaydi.

## Hosting

Vercel’da `api/ai-assistant.js` va `api/ai-speaking.js` server funksiyalaridir. Xuddi shu server kalitlarini hosting environmentiga ham qo‘shing. Speaking uchun doimiy Node worker’ni alohida xizmatda shu Supabase va Groq sozlamalari bilan ishga tushiring. Vercel statik build yoki `vite preview` worker’ni ishga tushirmaydi. `npm run dev` ishlab chiqish serveridir.

Integratsiya manbalari: [Groq API](https://console.groq.com/docs/openai), [Groq modellari](https://console.groq.com/docs/models), [Supabase kalitlari](https://supabase.com/docs/guides/getting-started/api-keys), [ffprobe o‘rnatuvchisi](https://github.com/SavageCore/node-ffprobe-installer).
