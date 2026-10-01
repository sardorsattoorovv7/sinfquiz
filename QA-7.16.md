# Tekshiruv hisoboti — SinfQuiz 7.16

Tekshiruv 2026-10-01 kuni bajarildi.

## Avtomatik testlar

`npm test`: **69/69 test o‘tdi**. Shulardan 7 yangi kimyo testi.

- 118 elementning atom raqami, noyob belgisi, guruh/davr va jadval joyi.
- Atom Z, A, zaryad, izotop va ion hisobi; noto‘g‘ri zarracha qiymatlari.
- 9 tayyor molekula namunasi: formulaga mos atomlar va valentlik. Ochiq valentlik, takroriy bog‘ va valentlik oshishi rad etildi. Suvning burchagi ~104,5° bilan solishtirildi.
- To‘rt reaksiyada har elementning saqlanishi; noto‘g‘ri va ko‘paytirilgan koeffitsiyentlar tekshirildi.
- pH: teng miqdor, kislota/asos ortiqchaligi, nol miqdor va asosli tomondagi sonli barqarorlik.
- Faza chegaralari; Arrhenius tayanch/harorat/konsentratsiya; tuz eruvchanligi va massaning saqlanishi.
- PGlite PostgreSQL: migratsiyani takroriy bajarish; mualliflar ajratilishi; ustozning mustaqil nashri rad etilishi; admin tasdig‘i; yopiq sahnaning o‘quvchidan yashirilishi; boshqa o‘quvchi nomidan yuborish rad etilishi; boshqa ustozning natijani ko‘rmasligi; izoh o‘zgarsa qayta tasdiq; noto‘g‘ri parametrlar va javobi yo‘q kontent rad etilishi. `is_correct` klientdan ishonib olinmaydi, trigger qayta hisoblaydi.
- Avvalgi testlar: Informatika UI, kodli test, typing, 1v1, tema, profil/oqimlar, matematika va audio labirint, reyting, SQL ruxsatlari.

## Brauzer

`tests/chemistry-browser.cjs`, Chromium, 1440×1000 va 390×844:

- 12 sahna ochildi; atom/ion parametri, orbital qatlam, xato/to‘g‘ri taxmin.
- Jadvalda 118 element, qidirish va oltin/kislorodni ochish.
- Molekula tanlash/aylantirish; ortiqcha atomga valentlik izohi; bo‘sh quruvchida ikki H ni bog‘lash.
- Qattiq va gaz fazalari; suv tenglamasini balanslash va atomlarni qayta guruhlash.
- pH neytrallanishi va asos ortiqchaligi; tezlikning haroratga javobi; filtr/distillash natijalari.
- Kundalik havo qatlamidan N₂ modeliga o‘tish.
- Faol ustoz sahnasiga kuzatish yuborish; foydalanuvchi va sahna identifikatori; mahalliy qoralama va .txt yuklash.
- Ustoz sahnasini pending holatida saqlash; admin tasdiqlashi; xato taxminlar paneli.
- Mobil ekranda umumiy gorizontal overflow yo‘q; katta davriy jadval o‘z konteynerida aylantiriladi; tungi rejim.
- Kimyo xaritasi doirasida axe-core WCAG 2 A/AA, 2.1 AA, 2.2 AA teglaridagi avtomatik qoidalar: **0 violation**. Bu butun sayt bo‘yicha qo‘lda o‘tkazilgan WCAG sertifikati emas.

`tests/discovery-browser.cjs`: oldingi Matematika va Ingliz tili brauzer regressiyasi o‘tdi. Kub hajmi/yoyilma/kesim, WebGL va SVG fallback, mobil/dark, labirintning barcha 5 eshigi va to‘liq yo‘li, xato javob, ustoz identifikatori va o‘zgarmaydigan yakuniy vaqt tekshirildi.

`npm run build`: **muvaffaqiyatli**. Kimyo alohida lazy chunk: taxminan 73 kB JS / 25 kB gzip, 15 kB CSS / 3,5 kB gzip. Standart mavjud lucide `use client` bundler ogohlantirishlari buildni to‘xtatmaydi.

## Amaliy chegaralar

Brauzer API-lari sinov ma’lumotlari bilan almashtirildi; jonli Supabase loyihasiga yozilmadi. RLS haqiqiy PostgreSQL dvigateli PGlite’da tekshirildi; foydalanuvchining Supabase muhitida SQL Run va hisoblar bilan yakuniy ulash talab qilinadi. Tarmoq kechikishi yoki bir vaqtda ko‘p o‘quvchi uchun yuk testi o‘tkazilmadi. Barcha kimyo sahnalari ilmiy jihatdan cheklangan ta’limiy modellardir; chegaralar `CHEMISTRY-SOURCES.md` va sahnada berilgan.

Ko‘rinishlar: `previews/chemistry-desktop.png`, `chemistry-mobile.png`, `chemistry-molecule.png`, `chemistry-periodic.png`, `chemistry-reaction.png`.
