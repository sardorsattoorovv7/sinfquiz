# SinfQuiz 7.34.0 — Turkcha va trend piano repertuari

**Mashqlar → Kino Piano → Turkcha va trend** bo‘limi qo‘shildi. Pianino ochilganda Bella Ciao tanlanadi.

- **Bella Ciao:** 30 soniyalik tayyor piano aranjirovkasi. “Tinglash” avtoijrosi, “O‘rganish” rejimida yoritilgan notalar, qo‘llarni alohida mashq qilish va MIDI eksport ishlaydi. Bu vokal yoki studiya audio yozuvi emas: ilovaning piano tembri bilan ijro etiladi.
- **KUSURA BAKMA — BLOK3** va yana 11 ta turkcha qo‘shiq: ijrochi, rasmiy servisdagi tinglash havolasi va shaxsiy MIDI faylini ulash. Zamonaviy qo‘shiqlarning tayyor notalari kiritilmagan. MIDI ulashdan keyin 30 soniyagacha parchani tinglash va o‘rganish mumkin.
- Qidiruv ijrochi, oddiy lotin yozuvi (`cok guzel`, `atese dustum`, `napiyosun`) va `bella cio` kabi taxalluslarni tushunadi.
- Avvalgi 32 original mashq, 6 klassik kuy, 34 kino MIDI kartasi, shaxsiy ijrolar, sozlamalar va Paper Workshop dizayni saqlangan.

## O‘rnatish

Amaldagi `.env.local` faylingizni saqlang. ZIP ichidagi `sinf-quiz` — to‘liq loyiha. Node.js 22.12 yoki yangi versiya kerak.

```sh
npm ci
npm test
npm run build
```

Lokal foydalanish uchun `npm run dev`. Production build chiqishi — `dist`.

**7.33.0 dan o‘tishda yangi SQL, migration yoki npm dependency kerak emas.** Supabase, API, RPC, RLS, autentifikatsiya va natijalarni saqlash mantiqi o‘zgartirilmadi. Hech qayerga avtomatik deploy qilinmagan.

Manbalar va repertuar jadvali: [PIANO-REPERTOIRE.md](PIANO-REPERTOIRE.md). Tekshiruvlar: [QA-7.34.md](QA-7.34.md).
