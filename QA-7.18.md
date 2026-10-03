# SinfQuiz 7.18 — tekshiruv hisoboti

- `npm test`: 88 ta test, 88 o‘tdi, 0 xato. Mavjud auth, typing, poyga, reyting, algebra/geometriya, migratsiyalar va biologiya hisoblari tekshirildi.
- Biologiya modeli: C/N va suv balansi, chegaraviy sharoitlar, fotosintez atomlari, tugatish uchun turli parametrlar va qoralama ajratilishi.
- PGlite RLS: o‘quvchi/ustoz/admin chegaralari, mualliflik, tasdiqlash, parametr tekshiruvi va natija himoyasi.
- `tests/biology-browser.cjs`: barcha 30 sahna ochildi, hisoblarda NaN/Infinity yo‘q; 12 amaliy ish yakunlandi; WCAG axe avtomatik mezonlarida barcha sahnalarda buzilish topilmadi; 390px mobil, tungi rejim va runtime xatolari tekshirildi.
- `tests/discovery-browser.cjs`: matematika, 3D/WebGL, SVG zaxira model, ingliz labirinti, mobil va tungi rejim o‘tdi.
- `tests/chemistry-browser.cjs`: 13 laboratoriya va mavjud kimyo sahnalari, ustoz/admin oqimi, mobil va tungi rejim o‘tdi.
- Production build muvaffaqiyatli.

Brauzer sinovlari test API va test foydalanuvchilari bilan bajarilgan. Jonli Supabase bazasiga migratsiya yoki yozish bajarilmadi. SQLni o‘z loyihangizda RUN qilish kerak. Avtomatik WCAG sinovi to‘liq qo‘lda accessibility auditi o‘rnini bosmaydi. Barcha real telefonlarda tezlik kafolati berilmaydi.

Original 3D tana modeli ta’limiy sxema; tibbiy aniqlikdagi tashqi anatomiya aktivi emas. Ilmiy manbalar va model cheklovlari `BIOLOGY-SOURCES.md`da.
