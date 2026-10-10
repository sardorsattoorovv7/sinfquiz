# SinfQuiz 7.27 — o‘zgargan fayllar

Bazaviy 7.26.1 arxivdagi **877 ta faylning barchasi** saqlangan. API, SQL/RLS, ma’lumotlar banklari, Python runtime, audio va mavjud 3D aktivlar baytma-bayt solishtirildi: o‘zgarmagan.

## Asosiy o‘zgarishlar

- `src/IslandHome.jsx`, `src/island.css`, `src/island-content.js`: Bilim oroli bosh sahifasi va ishlaydigan fan/code/menyu yo‘llari.
- `src/StudioShell.jsx`: yuqori boshqaruv va barcha ekranlarda pastki menyu; katta ekranda ham ochiladigan umumiy menyu.
- `src/App.jsx`: bosh sahifaga ulash, sekin auth paytida navbatga olingan tanlov, ochiq fan havolasidan kerakli kirish oynasi, sahifa meta ma’lumotlari.
- `src/page-metadata.js`, `scripts/build-public-pages.mjs`: sakkizta ommaviy HTML sahifasi, meta, canonical, sitemap va robots.
- `scripts/public-pages-plugin.mjs`, `vite.config.js`: mahalliy dev/previewda statik fan sahifalari.
- `vercel.json`: aniq yo‘nalishlar, 404ni yo‘qotmaydigan routing, yangi rasm keshi; mavjud xavfsizlik headerlari saqlangan.
- `public/island/v7.27/`: ikki responsive manzara va ulashish rasmi.
- `tests/`: yangi SEO/orol testlari va yangi menyuga moslangan eski regressiya tekshiruvlari. SQL/ball testlari kuchsizlantirilmagan.

## O‘zgargan mavjud fayllar

- `.env.example`
- `README.md`
- `index.html`
- `package-lock.json`
- `package.json`
- `public/manifest.webmanifest`
- `public/robots.txt`
- `src/App.jsx`
- `src/StudioShell.jsx`
- `tests/competition-attendance-browser.cjs`
- `tests/competition-browser.cjs`
- `tests/english-browser.cjs`
- `tests/learning-browser.cjs`
- `tests/studio-browser.cjs`
- `tests/ui.test.js`
- `tests/vercel.test.js`
- `vercel.json`
- `vite.config.js`

## Qo‘shilgan fayllar

- `ISLAND-ASSETS-7.27.md`
- `QA-7.27.md`
- `SEO-7.27.md`
- `UPDATE-7.27.md`
- `public/404.html`
- `public/fanlar/biologiya/index.html`
- `public/fanlar/index.html`
- `public/fanlar/informatika/index.html`
- `public/fanlar/ingliz-tili/index.html`
- `public/fanlar/iq-mantiq/index.html`
- `public/fanlar/kimyo/index.html`
- `public/fanlar/matematika/index.html`
- `public/island/v7.27/island-desktop.webp`
- `public/island/v7.27/island-mobile.webp`
- `public/island/v7.27/island-social.jpg`
- `public/public-pages.css`
- `public/python-runtime/python_stdlib.zip`
- `public/sitemap.xml`
- `qa-7.27/attendance/accessibility.json`
- `qa-7.27/attendance/attendance-browser.json`
- `qa-7.27/competition/accessibility.json`
- `qa-7.27/competition/competition-browser.json`
- `qa-7.27/english/accessibility.json`
- `qa-7.27/english/english-browser.json`
- `qa-7.27/island/accessibility.json`
- `qa-7.27/island/island-browser.json`
- `qa-7.27/learning/accessibility.json`
- `qa-7.27/learning/learning-browser.json`
- `qa-7.27/previews/bilim-oroli-board.webp`
- `qa-7.27/previews/bilim-oroli-desktop.webp`
- `qa-7.27/previews/bilim-oroli-mobile.webp`
- `qa-7.27/previews/kimyo-desktop.webp`
- `qa-7.27/previews/labirint-savol.webp`
- `qa-7.27/previews/matematika-desktop.webp`
- `qa-7.27/previews/matematika-no-js-mobile.webp`
- `qa-7.27/studio/accessibility.json`
- `qa-7.27/studio/studio-browser.json`
- `qa-7.27/verification.json`
- `scripts/build-public-pages.mjs`
- `scripts/public-pages-plugin.mjs`
- `src/IslandHome.jsx`
- `src/island-content.js`
- `src/island.css`
- `src/page-metadata.js`
- `tests/island-browser.cjs`
- `tests/public-pages.test.js`

Ushbu ro‘yxat va `ARCHIVE-MANIFEST-7.27.json` ham relizga qo‘shilgan. `node_modules`, `dist` va haqiqiy `.env.local` ZIPga kirmaydi; ular o‘rnatish/build vaqtida hosil bo‘ladi yoki shaxsiy loyiha sozlamalaridan olinadi. Dastur kodi, darslar, modellar va audio to‘liq kiritilgan.
