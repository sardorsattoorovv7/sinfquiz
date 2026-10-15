# SinfQuiz 7.36.0 — 20 ta tayyor turkcha kuy

Pianinoga 20 ta turkcha xalq va mumtoz kuyining haqiqiy MIDI notalari qo‘shildi. Har biri 30 soniyalik o‘ng qo‘l melodiyasi. Bella Ciao bilan jami 21 ta tayyor kuy. Bu zamonaviy trend hitlar to‘plami emas; hindcha hitlar kiritilmadi.

- “Tayyor kuylar”dan tanlang → “Tinglash” yoki “O‘rganish”ni bosing. MIDI yuklash va obuna talab qilinmaydi.
- Bo‘sh zamonaviy qo‘shiq va kino MIDI kartalari asosiy interfeysdan olib tashlandi. Oldingi shaxsiy fayllar “Meniki”da saqlanadi. Qo‘lda import va ijroni yozish ixtiyoriy imkoniyat sifatida ishlaydi.
- 32 original mashq, 6 klassik kuy, piano ovozi, pedal va sozlamalar saqlangan.
- MIDI o‘quvchisining boshlang‘ich BPM qiymati tuzatildi: fayldagi haqiqiy tempo olinadi.
- Yangi 20 ta MIDI parchasining umumiy hajmi 16.5 KB. Nota ma’lumoti faqat piano moduli bilan yuklanadi; bosh sahifa JS/CSS hajmi o‘smadi.

## O‘rnatish

Node.js 22.12+ bilan loyiha papkasida:

```sh
npm ci
npm test
npm run build
npm run perf
```

Lokal ishga tushirish: `npm run dev`. Production natijasi: `dist`. Amaldagi `.env.local` sozlamalaringizni saqlang. Python runtime fayllarini `npm ci` va build oldi skripti avtomatik tiklaydi. **Yangi SQL yoki dependency kerak emas.** Ushbu ZIP avtomatik deploy qilinmagan.

## Musiqa litsenziyasi

20 ta yangi nota/MIDI aktivi **CC BY-NC-SA 4.0**, ya’ni notijoriy foydalanish sharti bilan. Tijoriy ishlatish uchun mos alohida ruxsat kerak. Muallif va manba havolalari ilovada va `PIANO-SOURCES-7.36.md`da berilgan. Bella Ciao alohida CC0 litsenziyasida.

Tekshiruvlar: `QA-7.36.md`. O‘zgargan fayllar: `CHANGED-FILES-7.36.md`.
