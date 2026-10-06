# 7.24 — o‘zgargan fayllar

Asos: to‘liq 7.23.1 ZIP. Eski fayllar o‘chirilmagan; barcha oldingi public aktivlari o‘zg‘armagan.

## Yangilangan

- `README.md`
- `package-lock.json`
- `package.json`
- `src/CompetitionChallenges.jsx`
- `src/CompetitionRoom.jsx`
- `src/TeamCompetitions.jsx`
- `src/competition-model.js`
- `src/competition-service.js`
- `src/team-competitions.css`
- `tests/competition-browser.cjs`
- `tests/competition-model.test.js`
- `tests/vercel.test.js`

## Qo‘shilgan

- `CHANGED-FILES-7.24.md`
- `QA-7.24.md`
- `RELEASE-7.24.json`
- `UPDATE-7.24.md`
- `qa-7.24/all-tests.log`
- `qa-7.24/attendance-browser.log`
- `qa-7.24/attendance/accessibility.json`
- `qa-7.24/attendance/attendance-browser.json`
- `qa-7.24/attendance/attendance-mobile.png`
- `qa-7.24/attendance/partial-results-board.png`
- `qa-7.24/attendance/partial-results-dark-mobile.png`
- `qa-7.24/browser.log`
- `qa-7.24/browser/accessibility.json`
- `qa-7.24/browser/competition-browser.json`
- `qa-7.24/browser/competition-builder-desktop.png`
- `qa-7.24/browser/competition-builder-mobile.png`
- `qa-7.24/browser/competition-maze-mobile.png`
- `qa-7.24/browser/competition-results-board.png`
- `qa-7.24/browser/competition-results-dark-mobile.png`
- `qa-7.24/browser/competition-results-desktop.png`
- `qa-7.24/build.log`
- `qa-7.24/competition-load.json`
- `qa-7.24/e2e.log`
- `qa-7.24/load.log`
- `qa-7.24/playwright-install.log`
- `qa-7.24/sync-tests.log`
- `qa-7.24/targeted-tests.log`
- `scripts/package-competition-release.py`
- `src/competition-sync.js`
- `src/competition-typing.js`
- `src/competition-typing.worker.js`
- `supabase-migration-7.24.sql`
- `tests/competition-attendance-browser.cjs`
- `tests/competition-fixture.js`
- `tests/competition-http-fixture.js`
- `tests/competition-load.mjs`
- `tests/competition-sync.test.js`
- `tests/competition-upgrade.test.js`

## Ma’lumotlar modeli

- `sq_comp_members.excluded`: faollashtirilgan, ammo hali boshlanmagan musobaqada kelmaganlarni belgilash; tarixiy yozuv o‘chmaydi.
- `sq_comp_teams.started_size`: boshlash paytidagi haqiqiy tarkib; keyingi bosqichlar uchun barqaror bo‘luvchi.
- `sq_comp_member`: egasi/adminning boshlashgacha attendance amali.
- `sq_comp_poll`: revision o‘zgarmasa yengil javob; muddati tugagan o‘z urinishini yopishda to‘liq holat.
- `sq_comp_control`: mavjud tarkib bilan atomik boshlash, faol a’zolar tugashiga qarab next; natijani saqlab cancel.
- `sq_comp_state`: bir marta guruhlangan stage hisoblari va teng bo‘lmagan jamoa hajmi uchun o‘rtacha tie-breaker.
- `sq_comp_answer`: shaxsiy urinish locki, competition shared locki va serverda yangi typing hisoblash.

SQL alohida: `supabase-migration-7.24.sql`. Migratsiya boshqa fan, auth yoki chat jadvallariga tegmaydi; savollarni yoki natijalarni qayta ekmaydi.
