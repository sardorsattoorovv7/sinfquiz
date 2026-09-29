# SinfQuiz — Matematika atlasi

Matematika xaritasida 55 ta mustaqil yozilgan tushuncha va mavzu yo‘li mavjud. Ular qayta ishlatiladigan interaktiv sahna turlarida ko‘rsatiladi. Mavzular 5–11-sinf oralig‘ida tayanchlardan algebra va geometriyagacha tartiblanadi. Sinf filtri o‘rganishga yo‘l ko‘rsatadi, foydalanishni cheklamaydi. Har bir mavzu ta’rif, interaktiv ko‘rinish, boshqaruv, sabab izohi, hayotiy misol, tayanch bog‘lanishlar, keng tarqalgan xato va javobga fikr bildirish bilan keladi.

## Supabase’ga ulash

1. Supabase loyihasida **SQL Editor → New query** ni oching.
2. Loyihaning `supabase-math-atlas.sql` faylini to‘liq qo‘yib, **Run** ni bosing.
3. React ilovasini qayta yuklang. Dars sahnalari jadval migratsiyasiz ham ishlaydi; ustozning yangi mavzulari uchun migration zarur.

Yangi `public.math_atlas_concepts` jadvali auth foydalanuvchisiga bog‘lanadi. RLS faqat e’lon qilingan sahnalarni o‘quvchilarga ko‘rsatadi; ustoz o‘z qoralamasi va yuborgan mavzusini ko‘radi. Ustoz boshqa muallifning yozuvini o‘zgartira olmaydi. Admin yuborilgan mavzuni e’lon qiladi yoki qoralamaga qaytaradi; muallif identifikatori o‘zgartirilmaydi. Jadvaldagi trigger matn uzunligi, sinf va parametr turini ham tekshiradi.

## Kirish

- O‘quvchi mavjud akkaunt orqali kiradi. Bosh sahifadagi **Matematika atlasi** tugmasi yoki navigatsiyadagi **Matematika atlasi** orqali bo‘lim ochiladi.
- Ustoz/admin chap paneldagi shu nomli menyudan kiradi. Tayyor mavzuni nusxalab moslashi yoki yangi sahna yaratishi mumkin.
- Ustoz **Qoralama saqlash** yoki **Adminga yuborish**ni tanlaydi. Admin **Matematika atlasi** bo‘limida yuborilgan mavzuni ochib tasdiqlaydi.

## Tekshirilgan sahnalar

- Son chizig‘i: qiymat va qadam o‘zgarganda nuqta, siljish va natija yangilanadi.
- Tenglama tarozisi: ikki palladan bir xil miqdorni olib, yechimni hisoblaydi.
- Chiziqli funksiya: `m` va `b` o‘zgarganda grafik, jadval va natija birga yangilanadi.
- Uchburchak: C uchini sudrash yoki klaviatura slayderlarida o‘zgartirish; tomonlar, balandlik, burchaklar va yuza qayta hisoblanadi. Ikki nusxa bitta parallelogramni hosil qiladi.
- Geometrik harakat: ko‘chirish, burish, akslantirish va masshtablashda koordinatalar hamda yuza nisbati ko‘rsatiladi.
- Fazoviy shakllar: asosiy jismni burish, kesimni ko‘rsatish, yoyilmani ochish va yopish, sirt yuzi hamda hajmni taqqoslash.

## Dasturiy sinovlar

`node --test tests/math-atlas*.test.js` — mazmun, geometriya va algebra hisoblari, interfeys va Postgres RLS tekshiruvlari. `npm test` — butun loyihaning regression to‘plami. `npm run build` — Vercel uchun production build.

Mavzular tartibini Cambridge Lower Secondary Mathematics hujjatidagi “thinking and working mathematically” yondashuvi va Common Core Mathematics standartlaridagi matematik amaliyot hamda bosqichma-bosqich mavzu yo‘nalishlari bilan solishtirdik. Dastur bu tashkilotlar tomonidan sertifikatlangan degan da’vo yo‘q. Interfeys klaviatura fokusini, kontrastni, SVG tavsiflarini, slayderlarni va `prefers-reduced-motion` sozlamasini hisobga oladi.

## Manba hujjatlar

- [Cambridge Lower Secondary Mathematics](https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-lower-secondary/curriculum/mathematics/)
- [Common Core Mathematics Standards](https://corestandards.org/mathematics-standards/)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
