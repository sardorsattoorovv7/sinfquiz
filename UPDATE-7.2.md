# 7.0 / 7.1 dan 7.2 ga o‘tish

1. Eski loyiha va Supabase ma’lumotlarining zaxira nusxasini saqlang.
2. ZIP’ni yangi papkaga oching. O‘zingizdagi `.env.local` qiymatlarini kiriting.
3. Supabase → SQL Editor → New query: `supabase-migration-7.2.sql` ni RUN qiling. Yangi baza bo‘lsa, avval `supabase-schema.sql` bajariladi.
4. VS Code terminalida `npm ci`, keyin `npm run dev` bajaring.
5. O‘qituvchi hisobida milliy variantni oching. Ommaga yuborishdan oldin har savolga mavzu, manba, sahifa/savol raqami va izoh kiriting. Kamida 3 mavzu bo‘lsin.
6. Admin hisobida savollar va foydalanish huquqini manbadan tekshirib tasdiqlang. To‘ldirilgan maydonlar savolning to‘g‘riligini isbotlamaydi.
7. `npm test` va `npm run build` bajaring. Vercel’ga yangi kodni joylang va redeploy qiling.

## O‘zingizda tekshiring

- Faol bo‘lmagan typing va 1v1 pastdagi jonli mashqlar qismida chiqmasin.
- Faol testda logo, menyu va brauzerning orqaga tugmasi bosh sahifani ochmasin. “Tugatish” natijani ochsin.
- Natijada xato/javobsiz savollar, to‘g‘ri javob, izoh va manba ko‘rinsin.
- CEFR PDF/audio yuklab bir necha javob yozing; sahifa yangilanganda saqlansin. Mikrofonga ruxsat berib ovozni yozing va yuklab oling.
- Ikki ustoz hisobida shaxsiy testlar alohida ko‘rinsin; ommaviy variant admin tasdig‘idan keyin chiqsin.

## Kontent o‘zgarishi

Eski shablon milliy va CEFR demo variantlari ommaviy katalogda ko‘rsatilmaydi. Siz yaratgan variantlar bazadan o‘chirilmaydi. Manbasi yetishmagan eski variantni tahrirlab qayta yuborish kerak.

10 ta tekshirilgan CEFR mock hali kiritilmagan. Hozir rasmiy namunalarga havolalar va asl PDF/audio bilan mashq rejimi mavjud. Rasmiy arxivlarni ushbu muhitda yuklab tekshirish yakunlanmadi.

Milliy natija — mashq hisobi. CEFR avtomatik B1/B2/C1 baho bermaydi. Avval boshlangan eski demo CEFR sessiyasi yopilib, manbali mashq boshlanadi.
