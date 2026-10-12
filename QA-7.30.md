# SinfQuiz 7.30.0 tekshiruvlari

- Node: 257/257, xato: 0. Model, SQL/RLS, Office tuzatishi va oldingi funksiyalar tekshirildi.
- Build muvaffaqiyatli. Yangi atlas JavaScript va 3D kutubxonalari lazy yuklanadi.
- Brauzer: 52 sahna va 21 oqim tekshiruvi. authRequired, all52Scenes, nasaModelsReady, realAnimationPixels, playPause, draftRestored, realSqlNotebook, exportWorks, svgFallback, tabletFits1024, mobileFits390, darkMode, projectorFits1920, learnerRole, notesArePlainText, teacherCreatesGroupWork, groupWorkSubmitted, teacherFeedback, teacherIsolation, noWebglRecovery, expiredSessionDoesNotLockNavigation.
- 390 px telefon, 1024 px planshet, 1600 px desktop va 1920 px katta ekran; gorizontal sahifa toshishi aniqlanmadi.
- Axe: 32 holat, WCAG 2.0/2.1/2.2 A/AA bo‘yicha avtomatik topilgan xato yo‘q. Bu to‘liq qo‘lda accessibility auditi yoki sertifikat emas.
- Python/Office/ingliz tili/IQ; Matematika/Kimyo/biologiya navigatsiyasi; mehmon quiz reytingi, typing, split 1v1; qisman tarkibdagi musobaqa va bosqich taymerlari uchun 4 qo‘shimcha browser suite o‘tdi.
- NASA Yer/Oy aktivlari: 829,472 bayt. Geometriya saqlandi, teksturalar optimallashtirildi.
- ZIP baseline fayllarini saqlaydi. Oldingi SQL va public aktivlar baytlari o‘zgarmagan. CRC va barcha paketlangan fayllarning baytlari tekshirildi.

Brauzerda React, Three.js, haqiqiy Python worker va PGlite PostgreSQL ishlatildi. Auth/HTTP transport test fixture bilan berilgan. Production Supabase/Vercel va 40 ta haqiqiy telefon bilan yuklama bu ishda o‘lchanmagan. Animatsiya har kadrda serverga so‘rov yubormaydi. Sahna hisobi ta’limiy; server brauzerdagi fizik modelni qayta attestatsiya qilmaydi.

Dalillar `qa-7.30/`dagi JSON va loglarda. Brauzer suratlari arxivga kiritilmadi. Ishga tushirish va migratsiya: `UPDATE-7.30.md`.
