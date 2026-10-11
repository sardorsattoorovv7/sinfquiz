# SinfQuiz 7.28.0 — o‘zgargan fayllar

To‘liq 7.27.0 ZIP bilan solishtirildi: 958 ta avvalgi faylning barchasi saqlangan. Barcha `public/` modellar, audio va Python resurslari baytma-bayt bir xil. 7.8-fixed Cron mavjud bo‘lmagan holatga, 7.25 IQ taymeri esa bitta server soatiga tuzatildi. Yangi asosiy migratsiya: `supabase-migration-7.28.sql`.

## Asosiy qismlar

- `src/Classroom.jsx`, `src/classroom/`, `src/classroom.css`: tahrirlanadigan jadval, kattaroq animatsiyalar, taymer/shovqin/raqam uchun katta namoyish.
- `src/secure-activities.js`, `src/RoomChoice.jsx`, `src/supabase-data.js`: UIDga bog‘langan server sessiyalari va ustozga tegishli xonalar.
- `src/ordered-pages.js`, `src/UserAnalytics.jsx`, `src/supabase-sdk.js`: pagination, server statistikasi, atomik yozuvlar va hisoblagichlar.
- `supabase-migration-7.28.sql`: RLS, PIN, server baholash va bulk RPC.
- `MIGRATIONS.md`, `migration-chain.json`, `sql/cefr-7.7/`: to‘liq yangi baza tartibi va mazmuni o‘zgarmagan o‘nta CEFR variantining kichik SQL bo‘laklari.

## Yangilangan fayllar

- `README.md`
- `SUPABASE-VERCEL.md`
- `package-lock.json`
- `package.json`
- `sql/7.25/01-schema.sql`
- `src/App.jsx`
- `src/Classroom.jsx`
- `src/CompetitionChallenges.jsx`
- `src/classroom.css`
- `src/classroom/BoardCanvas.jsx`
- `src/classroom/TimerPanel.jsx`
- `src/classroom/board-renderer.js`
- `src/classroom/model.js`
- `src/competition-typing.js`
- `src/competition-typing.worker.js`
- `src/grading.js`
- `src/profile-results.js`
- `src/secure-play-service.js`
- `src/styles.css`
- `src/supabase-data.js`
- `src/supabase-sdk.js`
- `supabase-migration-7.25.sql`
- `supabase-migration-7.8-fixed.sql`
- `tests/classroom-browser.cjs`
- `tests/classroom-lab.test.js`
- `tests/classroom-model.test.js`
- `tests/competition-attendance-browser.cjs`
- `tests/competition-db.test.js`
- `tests/competition-load.mjs`
- `tests/secure-play-browser.cjs`
- `tests/ui.test.js`
- `tests/vercel.test.js`

## Qo‘shilgan fayllar

- `CHANGED-FILES-7.28.md`
- `MIGRATIONS.md`
- `QA-7.28.md`
- `RELEASE-7.28.0.json`
- `UPDATE-7.28.md`
- `migration-chain.json`
- `qa-7.24/attendance/attendance-mobile.png`
- `qa-7.28.0/all-tests.log`
- `qa-7.28.0/audit-tests.log`
- `qa-7.28.0/build.log`
- `qa-7.28.0/classroom-e2e.log`
- `qa-7.28.0/classroom/accessibility.json`
- `qa-7.28.0/classroom/jadval-doska.png`
- `qa-7.28.0/classroom/results.json`
- `qa-7.28.0/classroom/table-export.png`
- `qa-7.28.0/classroom/taymer-katta.png`
- `qa-7.28.0/competition-e2e.log`
- `qa-7.28.0/competition/accessibility.json`
- `qa-7.28.0/competition/attendance-browser.json`
- `qa-7.28.0/learning-e2e.log`
- `qa-7.28.0/learning/accessibility.json`
- `qa-7.28.0/learning/learning-browser.json`
- `qa-7.28.0/load.log`
- `qa-7.28.0/load/competition-load.json`
- `qa-7.28.0/migration-chain.log`
- `qa-7.28.0/play-e2e.log`
- `qa-7.28.0/play/results.json`
- `qa-7.28.0/science-e2e.log`
- `qa-7.28.0/science/accessibility.json`
- `qa-7.28.0/science/results.json`
- `qa-7.28.0/studio-e2e.log`
- `qa-7.28.0/studio/accessibility.json`
- `qa-7.28.0/studio/studio-browser.json`
- `scripts/package-728-release.py`
- `scripts/split-cefr-setup.py`
- `sql/cefr-7.7/01-schema.sql`
- `sql/cefr-7.7/02-mock.sql`
- `sql/cefr-7.7/03-mock.sql`
- `sql/cefr-7.7/04-mock.sql`
- `sql/cefr-7.7/05-mock.sql`
- `sql/cefr-7.7/06-mock.sql`
- `sql/cefr-7.7/07-mock.sql`
- `sql/cefr-7.7/08-mock.sql`
- `sql/cefr-7.7/09-mock.sql`
- `sql/cefr-7.7/10-mock.sql`
- `sql/cefr-7.7/11-mock.sql`
- `sql/cefr-7.7/12-finish.sql`
- `sql/cefr-7.7/manifest.json`
- `src/RoomChoice.jsx`
- `src/UserAnalytics.jsx`
- `src/classroom/TableEditor.jsx`
- `src/classroom/table-model.js`
- `src/ordered-pages.js`
- `src/secure-activities.js`
- `src/useTypingPreview.js`
- `supabase-migration-7.28.sql`
- `tests/audit-728.test.js`
- `tests/migration-chain-728.test.js`

`qa-7.28.0/` — joriy tekshiruvlar. Eski QA fayllari faqat o‘z versiyasining dalilidir.
