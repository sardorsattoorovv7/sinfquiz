# SinfQuiz 7.41.0

## Qo‘shilgan darslar

- **Dedublüman & Mavzer Tabancas — Belki**, naqorat: 30 soniya, 49 nota, 66 BPM o‘quv tempi. Ochiq notadagi ritm va pauzalar saqlangan, piano uchun bir oktava yuqorida.
- **Tujh Mein Rab Dikhta Hai — Rab Ne Bana Di Jodi**, naqorat: 30 soniya, 32 nota, 64 BPM. Ochiq harfli notadagi melodiya; davomiyliklar o‘quv uchun soddalashtirilgan.

Piano → **Yangi kuylar** bo‘limida tanlang. **Tinglash** avtoijroni boshlaydi. **O‘rganish** rejimida yoritilgan klavishlarni Do–Re–Mi ko‘rsatmasi bilan bosing. To‘g‘ri nota bosilmaguncha dars kutadi; yakunlangan qadamlar joriy brauzerda saqlanadi. `Belki`, `Dedubluman`, `Tujhme Rab`, `Shohruxxon` yoki film nomi orqali qidirish mumkin. Yangi darslar tayyor: MIDI ulash, to‘lov yoki tashqi musiqa yuklash kerak emas.

Jami **79 tayyor kuy va 38 mashq**. Avvalgi kuylar, ovozni kuchaytirish, Volume/Master Gain va telefon/planshet uchun 90° yonlama piano/tutor rejimi saqlangan.

## Ishga tushirish

1. ZIPni oching, `sinf-quiz` papkasiga kiring.
2. Node.js 22.12+ o‘rnating. `npm ci` bajaring.
3. Amaldagi Supabase sozlamalarini o‘zingizdagi `.env` orqali saqlang; namunasi `.env.example`da. Maxfiy kalitlar ZIPga kiritilmagan.
4. Dasturlash uchun `npm run dev`; production uchun `npm run build`. Hostingga `dist` natijasini joylashtiring.

Yangi dependency yoki SQL migratsiyasi talab qilinmaydi. Autentifikatsiya, rollar, API/RPC/RLS, natija saqlash, test va fan modullari mantiqi o‘zgartirilmagan. Oldingi sozlamalar va saqlangan shaxsiy MIDIlar o‘chirilmaydi.

## Qayta yaratish va tekshirish

- `node scripts/build-selected-piano.mjs` — yangi MIDI va dars ma’lumotlarini tashqi so‘rovsiz qayta yaratadi.
- `npm test` — mavjud va yangi avtomatik testlar.
- `npm run build` — production build.
- `npm run perf` — dastlabki JS/CSS hajmi budjeti.

Manbalar: `PIANO-SOURCES-7.41.md`. Haqiqiy tekshiruvlar va chegaralari: `QA-7.41.md`. Asosiy fayllar: `CHANGED-FILES-7.41.md`.
