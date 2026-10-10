# SinfQuiz 7.28 — o‘zgargan fayllar

7.27 dagi barcha 926 fayl saqlangan; 916 tasi o‘zgarmagan. API, SQL/RLS, auth, fan kontenti, audio, Python va avvalgi modellar o‘zgarmadi. Yangi SQL migratsiya yo‘q.

## O‘zgartirilgan

- `README.md`
- `index.html`
- `package-lock.json`
- `package.json`
- `scripts/build-public-pages.mjs`
- `src/App.jsx`
- `src/IslandHome.jsx`
- `tests/island-browser.cjs`
- `tests/studio-browser.cjs`
- `tests/vercel.test.js`

## Qo‘shilgan

- `QA-7.28.md`
- `UPDATE-7.28.md`
- `src/IslandWorld.jsx`
- `src/island-clock.js`
- `src/island-models.js`
- `src/island-world-3d.js`
- `src/island-world.css`
- `src/useIslandEnvironment.js`
- `tests/island-3d-browser.cjs`
- `tests/island-clock.test.js`
- `tests/island-production-browser.cjs`
- `CHANGED-FILES-7.28.md` — ushbu ro‘yxat.
- `ARCHIVE-MANIFEST-7.28.json` — har bir fayl SHA-256 hashi.
- `qa-7.28/` — yangi JSON tekshiruv hisobotlari va WebP ekran tasvirlari.

Arxiv butun loyihani o‘z ichiga oladi; patch yoki alohida resurs arxivi emas. `node_modules`, build natijasi `dist` va haqiqiy `.env` kalitlari arxivga kiritilmaydi. Ular `npm ci`, `npm run build` va o‘zingizdagi environment sozlamalari orqali tiklanadi.
