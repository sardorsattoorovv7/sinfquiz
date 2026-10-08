# SinfQuiz 7.26.1 — qidiruv va navigatsiya

- Qidiruv ortiqcha bo‘shliq, katta-kichik harf va o‘zbek apostroflarining turli ko‘rinishlarini qabul qiladi. Word, Excel va Python nomlari bilan amaliyot bo‘limi topiladi.
- Qidiruv natijalarini yuqori/past strelka bilan tanlash mumkin. Escape oynani yopadi va fokusni qaytaradi. Tashqariga bosilganda natijalar yopiladi; bo‘sh qidiruvda Enter sahifani almashtirmaydi.
- Profil, suhbat, Informatika amaliyoti va milliy testlar asosiy menyudan ochilgach F5 bosilsa o‘sha bo‘lim qayta ochiladi. Ochiq mashqlar uchun mavjud chiqish cheklovlari saqlangan.
- Ustoz Informatika kabinetidagi chat tugmasini bossa o‘z boshqaruv panelidagi suhbatlar ochiladi. Avval u o‘quvchiga tegishli sahifaga o‘tib, bo‘sh oynada qolardi.
- Mobil menyu ochilganda orqa sahifadagi boshqaruvlar vaqtincha inert bo‘ladi. Tab dialog ichida qoladi; Escape bilan yopiladi.
- Ingliz audio arxivi ikki kichik ZIPga ajratildi. Barcha 216 audio o‘z holicha saqlangan.

## O‘rnatish

1. Ishlayotgan loyiha va shaxsiy `.env.local` sozlamalaringizni saqlang.
2. To‘liq yangi ZIPni alohida papkaga oching. Kichik ZIPdan foydalansangiz `DOWNLOAD-7.26.1.md` dagi to‘rttalasini bitta papkaga oching.
3. `.env.local` faylingizni yangi `sinf-quiz` papkasiga ko‘chiring. Node.js 22.12+ bilan shu papkada bajaring:

```bash
npm ci
npm run dev
```

Lokal server terminalini ochiq qoldiring. Vercel uchun `npm run build` ni tekshiring, odatdagi Git/deploy jarayonidan foydalaning va mavjud environment variables qiymatlarini saqlang.

**7.25 yoki 7.26 bazasi ishlayotgan bo‘lsa, yangi SQL migratsiyasi kerak emas.** API, Supabase Auth, SQL/RLS, egaga tegishli kontent va hisoblashlar o‘zgartirilmagan. Yangi yoki ancha eski bazani o‘rnatish uchun oldingi relizlarning yo‘riqnomalari saqlangan.

Tekshiruvlar: `QA-7.26.1.md`. Fayllar: `CHANGED-FILES-7.26.1.md`. Dizayn: `STUDIO-DESIGN-7.26.md`.
