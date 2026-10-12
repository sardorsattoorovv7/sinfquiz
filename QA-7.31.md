# SinfQuiz 7.31.0 tekshiruvlari

- Node: 269/269, xato: 0. Fizik hisob, SQL/RLS, eski fanlar, typing, poyga, Office, Python va musobaqa testlari o‘tdi.
- Build muvaffaqiyatli. 9 ta sitemap manzili saqlandi, fizik atlasning public SEO sahifasida 53 hodisa ko‘rsatiladi.
- Fizika brauzeri: 17 tekshiruv. Quyoshning haqiqiy model koordinatasi, Yerning issiqlik rangi, qizish/sovish grafigi, suv zichligi, bosim, kabina ezilishi, gaz siqilishi va ikki kuzatuvning SQLga topshirilishi tekshirildi.
- Koinot atlasi: 53 sahna va 21 oqim tekshiruvi; qoralamani tiklash, kamera, pauza, JSON yuklash, guruh ishi, ustoz fikri, boshqa ustozdan ajratish va WebGLsiz fallback o‘tdi.
- Yana 4 browser suite: IQ/darslik/Python/Office/ingliz tili; Matematika/Kimyo va umumiy navigatsiya; qisman tarkibdagi jamoa, mustaqil bosqichlar va vaqt; mehmon quiz reytingi, split 1v1 va typing.
- 390 px telefon, 1024 px planshet, 1600 px desktop va 1920 px katta ekran; sahifa eni toshishi aniqlanmadi. Tungi rejim tekshirildi.
- Axe: 38 holatda avtomatik WCAG 2.0/2.1/2.2 A/AA tekshiruvlari, topilgan xato yo‘q. Bu to‘liq qo‘lda accessibility auditi emas.
- Yangi Quyosh modeli 322,040 bayt. Odam modeli mavjud BodyParts3D aktivini qayta ishlatadi. Oldingi SQL va public aktivlar baytlari o‘zgarmagan.
- ZIP CRC hamda paketlangan har bir faylning bayti tekshirildi; 7.30 dastur fayllari saqlangan. Ichki QA suratlari paketga kiritilmagan.

React, Three.js, haqiqiy Python worker va PGlite PostgreSQL ishlatildi. Auth/HTTP transport test fixture orqali berilgan. Production Supabase/Vercel, haqiqiy sho‘ng‘ish, haqiqiy kabina yoki 40 telefon yuklamasi bu ishda o‘lchanmagan. Fizik modellar ta’limiy soddalashtirish; server fizik natijani mustaqil attestatsiya qilmaydi. Qoralama tiklash hisob bo‘yicha ajratilgan, oldingi RLS siyosatlari o‘zgarmagan.

Dalillar `qa-7.31/` JSON va loglarida. Tekshiruv suratlari arxivga kiritilmagan. Migratsiya va ishga tushirish: `UPDATE-7.31.md`; model va aktivlar: `PHYSICS-7.31-SOURCES.md`.
