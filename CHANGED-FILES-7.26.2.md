# SinfQuiz 7.26.2 — o‘zgargan fayllar

7.26.1 Studio paketining to‘rt qismi bilan baytlar bo‘yicha solishtirildi. Bazadagi 877 faylning barchasi saqlangan. Mavjud 3D modellar, audio va oldingi SQL migratsiyalari o‘zgarmagan.

## Asosiy o‘zgarishlar

- `ScienceStudio.jsx`, `science-studio.css`, `science-measurements.js`: qisqa dars, tekshiruv, grafik, birliklar, taqqoslash va CSV.
- `BiologyActivity.jsx`, biologiya model/workflow/3D: qoralama, faol boshlash, sharoitlarni taqqoslash, yomg‘ir hisobi va tayyor o‘simlik.
- `ChemistryBench.jsx`, kimyo model/3D: dars bilan bog‘lanish, porsiya va suyultirish hisobi, ko‘rinadigan tajriba stoli.
- `supabase-migration-7.26.2.sql`, `secure-play-service.js`, `supabase-data.js`: kalit serverda; ball, taymer va poyga g‘olibi serverda; sessiya va ustoz chegaralari.
- `local-admin-api.js`, `api/telegram-auth.js`, `vite.config.js`: lokal server API va yangi Supabase server kaliti nomi.
- `public/python-runtime/python_stdlib.zip`: lokal Python uchun zarur standart kutubxona.

## Yangilangan fayllar

- `README.md`
- `api/telegram-auth.js`
- `local-admin-api.js`
- `package-lock.json`
- `package.json`
- `src/App.jsx`
- `src/BiologyActivity.jsx`
- `src/BiologyAtlas.jsx`
- `src/ChemistryAtlas.jsx`
- `src/ChemistryBench.jsx`
- `src/biology-asset-catalog.js`
- `src/biology-model.js`
- `src/biology-workflow.js`
- `src/biology-world-3d.js`
- `src/chemistry-bench-3d.js`
- `src/chemistry-bench-model.js`
- `src/supabase-data.js`
- `src/textbooks/Reader.jsx`
- `tests/learning-browser.cjs`
- `tests/vercel.test.js`
- `vite.config.js`

## Qo‘shilgan fayllar

- `CHANGED-FILES-7.26.2.md`
- `QA-7.26.2.md`
- `RELEASE-7.26.2.json`
- `SCIENCE-STUDIO-7.26.2.md`
- `UPDATE-7.26.2.md`
- `public/python-runtime/python_stdlib.zip`
- `qa-7.26.2/all-tests.log`
- `qa-7.26.2/build.log`
- `qa-7.26.2/competition.log`
- `qa-7.26.2/competition/accessibility.json`
- `qa-7.26.2/competition/competition-browser.json`
- `qa-7.26.2/english.log`
- `qa-7.26.2/english/accessibility.json`
- `qa-7.26.2/english/english-browser.json`
- `qa-7.26.2/learning.log`
- `qa-7.26.2/learning/accessibility.json`
- `qa-7.26.2/learning/learning-browser.json`
- `qa-7.26.2/science.log`
- `qa-7.26.2/science/accessibility.json`
- `qa-7.26.2/science/biology-workbench.png`
- `qa-7.26.2/science/chemistry-studio.png`
- `qa-7.26.2/science/results.json`
- `qa-7.26.2/secure-play.log`
- `qa-7.26.2/secure-play/results.json`
- `qa-7.26.2/studio.log`
- `qa-7.26.2/studio/accessibility.json`
- `qa-7.26.2/studio/studio-browser.json`
- `scripts/package-science-studio-release.py`
- `src/ScienceStudio.jsx`
- `src/science-measurements.js`
- `src/science-studio.css`
- `src/secure-play-service.js`
- `supabase-migration-7.26.2.sql`
- `tests/local-api.test.js`
- `tests/science-measurements.test.js`
- `tests/science-studio-browser.cjs`
- `tests/secure-play-browser.cjs`
- `tests/secure-play-db.test.js`
- `tests/secure-play-fixture.js`

`qa-7.26.2/` joriy tekshiruv loglari, JSON natijalari va ikkita haqiqiy brauzer ekran suratini o‘z ichiga oladi.
