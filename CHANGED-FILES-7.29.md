# SinfQuiz 7.29.0 — o‘zgargan fayllar

To‘liq 7.28.0 ZIPdagi 1016 faylning barchasi saqlangan. Avvalgi SQL, model, audio va Python resurslari baytma-bayt bir xil. Yangi migratsiya: `supabase-migration-7.29.sql`.

## Asosiy o‘zgarishlar

- `src/CompetitionRoom.jsx`, `src/CompetitionStagePicker.jsx`, `src/CompetitionBuilder.jsx`: asosiy yarim tarkib starti, erkin bosqichlar va shaxsiy taymerlar.
- `src/CompetitionChallenges.jsx`, `src/competition-service.js`: qoralama tiklash/saqlash, almashtirishdan oldin yozish va muddat tugagandagi natija.
- `data/office-729.js`, `src/OfficeLab.jsx`, `src/office-lab-model.js`, `src/excel-formula.js`: 12/12/10 savol, sarlavha formati, jadval/rasm, nisbiy/mutlaq/aralash katak ko‘chirish va xavfsiz IF/AND/OR hisoblash.
- `data/competition-729/`, `scripts/build-competition-729.py`, `scripts/build-office-729.mjs`: qayta yaratiladigan qo‘shimcha SQL.
- `src/supabase-data.js`: ustozga tegishli yangi to‘plam nusxalari.
- `tests/competition-729.test.js`, `tests/competition-free-browser.cjs`, `tests/competition-free-load.mjs`: haqiqiy SQL, UI va 40 mijozli yuklama sinovi.

## Yangilangan fayllar

- `MIGRATIONS.md`
- `README.md`
- `SUPABASE-VERCEL.md`
- `migration-chain.json`
- `package-lock.json`
- `package.json`
- `src/CompetitionBuilder.jsx`
- `src/CompetitionChallenges.jsx`
- `src/CompetitionRoom.jsx`
- `src/OfficeLab.jsx`
- `src/ShortcutInput.jsx`
- `src/TeamCompetitions.jsx`
- `src/competition-model.js`
- `src/competition-service.js`
- `src/office-lab-model.js`
- `src/office-lab.css`
- `src/supabase-data.js`
- `src/team-competitions.css`
- `tests/competition-attendance-browser.cjs`
- `tests/competition-browser.cjs`
- `tests/competition-http-fixture.js`
- `tests/migration-chain-728.test.js`
- `tests/vercel.test.js`

## Qo‘shilgan fayllar

- `CHANGED-FILES-7.29.md`
- `CONTENT-7.29.md`
- `QA-7.29.md`
- `RELEASE-7.29.0.json`
- `UPDATE-7.29.md`
- `data/competition-729/core.sql`
- `data/competition-729/excel.sql`
- `data/competition-729/templates.sql`
- `data/office-729.js`
- `qa-7.29.0/all-tests.log`
- `qa-7.29.0/attendance-e2e.log`
- `qa-7.29.0/attendance/accessibility.json`
- `qa-7.29.0/attendance/attendance-browser.json`
- `qa-7.29.0/build.log`
- `qa-7.29.0/classroom-e2e.log`
- `qa-7.29.0/classroom/accessibility.json`
- `qa-7.29.0/classroom/results.json`
- `qa-7.29.0/competition-unit.log`
- `qa-7.29.0/competition/accessibility.json`
- `qa-7.29.0/competition/results.json`
- `qa-7.29.0/free-e2e.log`
- `qa-7.29.0/guided-e2e.log`
- `qa-7.29.0/guided/accessibility.json`
- `qa-7.29.0/guided/competition-browser.json`
- `qa-7.29.0/learning-e2e.log`
- `qa-7.29.0/learning/accessibility.json`
- `qa-7.29.0/learning/learning-browser.json`
- `qa-7.29.0/load.log`
- `qa-7.29.0/load/competition-free-load.json`
- `qa-7.29.0/play-e2e.log`
- `qa-7.29.0/play/results.json`
- `scripts/build-competition-729.py`
- `scripts/build-office-729.mjs`
- `scripts/package-729-release.py`
- `src/CompetitionStagePicker.jsx`
- `src/excel-formula.js`
- `supabase-migration-7.29.sql`
- `tests/competition-729-fixture.js`
- `tests/competition-729.test.js`
- `tests/competition-free-browser.cjs`
- `tests/competition-free-load.mjs`

Joriy tekshiruvlar `qa-7.29.0/`da. Eski QA faqat o‘z versiyasiga tegishli.
