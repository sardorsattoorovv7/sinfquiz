# SinfQuiz 7.18 — Biologiya: Tirik tabiat atlasi

30 mavzu, 24 qayta ishlatiladigan sahna va 12 yakunlanadigan amaliy ish qo‘shildi. Botanika, zoologiya, odam tanasi va ekologiya xaritada ajratilgan. Sinf, savol va mavzu bo‘yicha qidirish mavjud.

Bargning sayohatida namlik, harorat, kislorod, tuproq, barg miqdori va yomg‘ir boshqariladi. Organik qoldiq, tuproqdagi organik modda, mineral azot, ildiz o‘zlashtirishi va uglerodning chiqishi alohida hisoblanadi. Suvning singishi va saqlanishi taqqoslanadi. Model tabiatni soddalashtiradi; raqamlar dala o‘lchovi emas.

Anatomiya original protsedurali 3D o‘quv modeli: aylantirish, yaqinlashtirish, qatlamlar, 11 organ va organ ichki tuzilmalari. WebGL bo‘lmasa boshqariladigan 2D model ishlaydi. Klinik yoki fotorealistik anatomiya modeli emas.

Amaliy ish: savol → taxmin → parametr → kuzatish → xulosa. Solishtirish ishlarida kamida ikki xil sharoit talab qilinadi. Qoralama hisob/mavzu bo‘yicha shu brauzerda saqlanadi; TXT daftar yuklanadi. Ustozning faol nusxasidagi ishni ustozga yuborish va fikr olish mumkin.

## O‘rnatish

1. ZIPni oching; mavjud loyiha sozlamalarini saqlang.
2. Mavjud Supabase asosiy sxemasidan keyin `supabase-biology-atlas.sql` faylini SQL Editor’da RUN qiling. Cron kerak emas. SQLning o‘zi yangi interfeysni o‘rnatmaydi.
3. Node 22.12 yoki yangiroq: `npm ci`, keyin `npm run dev`.
4. Mavjud hisob orqali kirib Biologiya bo‘limini oching (`#biologiya`).
5. Vercel uchun yangilangan kodni joylang va mavjud Supabase environment qiymatlari bilan redeploy qiling.

## Xavfsizlik

Migratsiya faqat yangi `biology_concepts` va `biology_observations` jadvallarini qo‘shadi. Mavjud fanlar jadvallari va auth tartibi o‘zgarmaydi. Ustoz o‘z ishini yaratadi; ommaga chiqishi admin tasdig‘ini talab qiladi. E’lon qilingan kontent tahrirlansa qayta tasdiqlanadi. Ustoz faqat o‘z ishiga yuborilgan natijani ko‘radi. O‘quvchi faqat o‘z kuzatuvlarini ko‘radi. Parametrlar, matn chegaralari va sinovlar serverda tekshiriladi. Takroriy yuborish token bilan cheklanadi.

## Fayllar

`src/BiologyAtlas.jsx`, `BiologyActivity.jsx`, `BiologyScenes.jsx`, `BiologyAnatomy.jsx`, `biology-anatomy-3d.js`, `biology-content.js`, `biology-model.js`, `biology-workflow.js`, `biology-service.js`, `biology-atlas.css`; navigatsiya `src/App.jsx`da. Migratsiya generatori `scripts/build-biology-migration.mjs`. Tekshiruvlar `tests/biology-model.test.js`, `biology-rls.test.js`, `biology-browser.cjs`.

Ilmiy manbalar va soddalashtirishlar `BIOLOGY-SOURCES.md`; amalda bajarilgan tekshiruvlar `QA-7.18.md`da.
