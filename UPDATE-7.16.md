# SinfQuiz 7.16 — Kimyo atlasi va virtual laboratoriya

## Qo‘shildi

Informatika, Matematika va Ingliz tili oqimlaridan alohida Kimyo bo‘limi. Hisobga kirgandan keyin bosh navigatsiyada **Kimyo atlasi**, bosh sahifada **Kimyo atlasi va virtual laboratoriya** tugmasi orqali ochiladi. Bevosita manzil: `/#kimyo`.

12 faol sahna: atom quruvchisi; 118 elementli davriy jadval; aylantiriladigan molekula quruvchisi; ion/kovalent/metall bog‘; suv fazalari; 4 reaksiya balanslash; indikator/pH/neytrallanish; energiya va tezlik; eritma va ajratish; organik molekulalar; elektr-kimyo; kundalik hodisalar. Har birida izoh, boshqaruv, jonli natija, hayotiy misol, noto‘g‘ri tushuncha izohi va taxmin vazifasi bor.

**Tajriba qil** maydoni tajribalarni bir joyda tanlashga yordam beradi. O‘quvchi kuzatish qoralamasini yozadi, yuklab oladi va ustozning faol sahnasidagi natijani yuboradi. Mustaqil atlas qoralamasi foydalanuvchi/mavzu bo‘yicha shu brauzerda saqlanadi; serverga yuborilmaydi.

Ustoz tayyor sahnadan nusxa oladi yoki sahna shablonidan yangi mavzu yaratadi. Izoh, sinf, taxmin savoli/javobi va mavjud boshlang‘ich parametrlar boshqariladi. Faollashtirish/yopish muallifga tegishli. Ustoz matni administrator tasdig‘idan keyin o‘quvchilarga chiqadi. Matn o‘zgarsa qayta tasdiq talab qilinadi. Adminning o‘z sahnasi darhol e’lon qilinadi. Kuzatishlar paneli noto‘g‘ri taxminlar va o‘quvchi yozgan kuzatishlarni oxirgi 500 yozuv bo‘yicha ko‘rsatadi; har bir ustoz faqat o‘z sahnalariga yuborilgan natijalarni ko‘radi.

## Ishga tushirish — amaldagi 7.15 bazadan

1. Loyiha fayllaringiz va mahalliy `.env` ni zaxiralang.
2. Supabase → SQL Editor → yangi query. ZIP ichidagi **supabase-chemistry-atlas.sql** fayli matnini to‘liq joylashtirib **Run** bosing. Avvalgi SinfQuiz sxemasi va `sq_is_teacher()` / `sq_is_admin()` funksiyalari mavjud bo‘lishi kerak.
3. Yangilangan kodni joylashtiring, o‘zingizning `.env` sozlamalaringizni saqlang. Terminalda `npm install`, so‘ng `npm run dev`.
4. Kimyo sahifasida ustoz hisobidan **Ustoz boshqaruvi** → tayyor mavzu → izohni tekshirish → **Adminga tasdiqlash uchun yuborish**.
5. Administrator Kimyo → Ustoz boshqaruvi → tasdiq kutayotgan sahnani **Tekshirish**, so‘ng **Tasdiqlash**.
6. O‘quvchi faol ustoz sahnasini tanlaydi; taxminni tekshiradi, kuzatish yozadi va **Ustozga yuborish**ni bosadi.
7. Vercel’da odatdagi `npm run build`, mavjud Supabase environment qiymatlari bilan redeploy. Yangi maxfiy kalit talab qilinmaydi.

Migratsiya mavjud jadval yoki eski funksiyalarni almashtirmaydi. Faqat `chemistry_concepts` va `chemistry_observations`, ularning indekslari, triggerlari va RLS siyosatlari qo‘shiladi. Migratsiyani ikkinchi marta bajarish PGlite sinovidan o‘tdi. 7.15 dan oldingi bazada avval o‘sha versiyagacha mavjud migratsiyalarni bajaring; yangi bazada faqat kimyo SQL yetarli emas.

Migratsiyasiz tayyor 12 sahna ishlaydi, ammo ustoz sahnalari/natijalar uchun ulanish izohi chiqadi. Ustoz boshqaruvi va yuborish imkonlari uchun migratsiya zarur.

## O‘zgargan fayllar

- `src/App.jsx` — alohida navigatsiya, lazy loading va hisob orqali kirish.
- `src/ChemistryAtlas.jsx` — xarita, qidiruv, daraja, laboratoriya, tajriba daftari, boshqaruv, tasdiq va kuzatishlar.
- `src/ChemistryScenes.jsx` — 12 sahna va SVG orqali proyeksiyalangan fazoviy molekula modeli.
- `src/chemistry-content.js`, `src/chemistry-elements.js`, `src/chemistry-model.js` — o‘zbekcha kontent, 118 element, hisoblar va molekulalar.
- `src/chemistry-service.js` — mavjud Supabase SDK bilan ishlash; filtrlar va RLS.
- `src/chemistry-atlas.css` — responsive, kunduzgi/tungi, fokus va kamaytirilgan harakat.
- `supabase-chemistry-atlas.sql` — yangi jadvallar va ruxsatlar.
- `tests/chemistry-model.test.js`, `tests/chemistry-rls.test.js`, `tests/chemistry-browser.cjs` — hisoblar, PostgreSQL ruxsatlari va real brauzer oqimlari.
- `package.json`, `package-lock.json`, `tests/vercel.test.js`, `README.md` — 7.16.0 versiya va yo‘riqnoma.
- `CHEMISTRY-SOURCES.md`, `QA-7.16.md` — manbalar, model chegaralari va tekshiruv hisoboti.

Kimyo moduli ochilgandagina kod yuklanadi; model uchun tashqi CDN yoki server simulyatsiyasi kerak emas. Kuzatishlar tugma bilan yuboriladi; har bir slayder harakati serverga yozilmaydi. Tarmoqdan 300 sahna va oxirgi 500 kuzatishgacha olinadi; kuzatishlar avtomatik polling qilinmaydi.
