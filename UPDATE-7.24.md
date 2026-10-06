# SinfQuiz 7.24 — jamoaviy musobaqa

Bu paket 7.23.1 dagi barcha bo‘limlar ustiga tayyorlangan. Informatika, Python, Office amaliyoti, Ingliz tili, atlaslar, chat, auth va dars qoralamalari saqlangan.

## Mavjud saytingizni yangilash

1. Supabase SQL Editor’da **supabase-migration-7.24.sql** faylini ochib RUN qiling. Bu fayl 7.22 musobaqa jadvallari mavjud bo‘lganda ishlaydi. Agar musobaqa hali o‘rnatilmagan bo‘lsa, avval `supabase-migration-7.22.sql`, keyin 7.24 ni bajaring. Boshqa o‘rnatilgan migratsiyalarni qayta boshlamang.
2. ZIPdagi yangi kodni loyihangizga ko‘chiring. Mahalliy `.env` qiymatlaringizni saqlang; ZIPda maxfiy kalitlar yo‘q.
3. Node 22.12 yoki undan yangi versiyada terminalni loyiha papkasida oching:

```bash
npm ci
npm run dev
```

4. Vercel ishlatsangiz yangi kodni deploy qiling. Hozirgi Supabase environment qiymatlarini saqlang. Yangi environment variable, extension yoki Cron kerak emas.

Faqat SQLni bajarish yetarli emas: yangi tugmalar va yangi yangilanish oqimi uchun yangi frontend ham o‘rnatiladi. Eski frontenddagi odatiy `start` amali ishlayveradi. Yangisini SQLdan keyin o‘rnating.

## Dars kuni kelmagan o‘quvchi bo‘lsa

- Musobaqani oching. **Bugun qatnashadiganlar** ro‘yxatida kelmagan o‘quvchi yonidagi **Kelmagan** tugmasini bosing va tasdiqlang. Ro‘yxatdan o‘tishi o‘chirilmaydi.
- Noto‘g‘ri belgilangan bo‘lsa, boshlashdan oldin **Tarkibga qaytarish**ni bosing.
- **Hozirgi tarkib bilan boshlash**ni bosing. Tasdiqda qatnashuvchilar va jamoalar sonini tekshiring.
- Kamida ikki jamoada bittadan qatnashuvchi bo‘lsin. Bo‘sh jamoa saqlanadi, ammo o‘rin olmaydi; jadvalda «Qatnashmagan» ko‘rsatiladi.
- Boshlash paytida har bir jamoaning haqiqiy a’zolari soni qayd etiladi. Bir jamoa bir kishi, boshqasi ikki kishi bo‘lsa, ikkisi ham 0–100 ball shkalasida o‘rtacha natija oladi.
- Keyin musobaqadan chiqish jamoaning bo‘luvchisini kamaytirmaydi. Chiqib ketgan ishtirokchi keyingi bosqichni ochishga to‘sqinlik qilmaydi; uning bajarilmagan ishlari uchun ball berilmaydi.
- Boshlangandan keyin tarkib o‘zgarmaydi. Kechikkan yangi ishtirokchi qo‘shilmaydi; qatnashmagan deb belgilangan ishtirokchi mustaqil ravishda belgini olib tashlay olmaydi.

Jami ball teng bo‘lsa, bir a’zoga to‘g‘ri keladigan to‘g‘ri javoblar, keyin o‘rtacha vaqt solishtiriladi. Bu teng bo‘lmagan jamoa hajmlarini bir xil mezonda solishtiradi. Uchala mezon teng bo‘lsa, o‘rin ham teng.

## Typing qanday baholanadi?

Harflar bir xil indeksda turishi talab qilinmaydi. 1 belgi tushishi, ortishi yoki almashishi 1 tahrir hisoblanadi. Aniqlik: `100 × (max(kutilgan uzunlik, yozilgan uzunlik) − tahrirlar) / max(uzunliklar)`. Masalan, 25 belgili `I go to school every day.` gapining birinchi harfi tushib qolsa, aniqlik **96%**.

128 tagacha belgi tahriri uchun aniq Levenshtein masofasi ishlatiladi. Farq bundan ko‘p bo‘lsa, uzun matn **so‘zlar ketma-ketligining Levenshtein masofasi** bilan baholanadi. Bu so‘zlar sonini yoki tartibini hisobga oladi; so‘zlarni boshqa tartibda yuborish to‘liq ball bermaydi. Ushbu usul natijada ochiq ko‘rsatiladi. So‘z rejimida bo‘sh joy, tab va satr o‘tishlari ajratuvchi hisoblanadi. Registr va tinish belgilaridagi farqlar saqlanadi. So‘z rejimida ham aniqlangan eng kam belgi tahrirlari va umumiy uzunlik farqi aniqlikni cheklaydi; ko‘p bo‘sh joy qo‘shib yuqori ball olish mumkin emas.

Yakuniy ball avvalgidek aniqlik va server hisoblagan vaqtga bog‘liq. UI bahosi yordamchi ko‘rsatkich; o‘quvchi yuborgan ball qabul qilinmaydi. Hisob worker’da bajariladi; worker ochilmasa, kechiktirilgan mahalliy hisob ishlaydi. Eski topshirilgan typing natijalari qayta baholanmaydi.

## To‘xtatish

**Musobaqani to‘xtatish** qabul va javob berishni yopadi, mavjud ballarni saqlaydi va davom etayotgan urinishlarni tugatadi. Bu yangi bosqichga o‘tkazish yoki musobaqani qayta boshlash amali emas. Yakunlangan musobaqani bekor qilib natijasini o‘zgartirish mumkin emas.

## Tekshiruvlarni o‘zingiz ishlatish

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e:competition
npm run test:load:competition
```

Brauzer sinovlari localhost 4182 va 4185 portlarida ishlaydi. Yuklama taqqoslashi 4187/4186 portlarini ishlatadi. Sinovlarda sun’iy hisoblar va alohida mahalliy PGlite bazasi yaratiladi; haqiqiy Supabase foydalanuvchilari yoki ma’lumotlari o‘zgartirilmaydi. Hisobot va suratlar `qa-7.24/` ichida. O‘rnatilgan Chromiumdan foydalanish uchun ixtiyoriy `CHROME_EXECUTABLE` yo‘lini berish mumkin.

Haqiqiy Supabase/Vercel muhitidagi sig‘im ushbu mahalliy sinov natijasi bilan kafolatlanmaydi. Sinov doirasi va o‘lchovlar: **QA-7.24.md**.
