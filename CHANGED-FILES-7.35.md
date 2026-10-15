# SinfQuiz 7.35.0 — asosiy fayllar

| Fayl | O‘zgarish |
| --- | --- |
| `src/App.jsx` | Og‘ir sahifalar ajratildi; hisobdan keyingi katalog yuklanishi bosh sahifani to‘sib turmaydi |
| `src/app-views/AdminViews.jsx` | Administrator/ustoz panellari, test/dars tahriri va natijalar |
| `src/app-views/AuthViews.jsx` | Email, Telegram va administrator kirishi |
| `src/app-views/StudentViews.jsx` | O‘quvchi katalogi va dars o‘qish |
| `src/app-views/NationalViews.jsx` | Milliy test katalogi va sessiyasi |
| `src/app-views/SessionViews.jsx` | Kodli kirish, typing, 1v1, test ishlash va natija |
| `src/app-views/SharedViews.jsx` | Brend, fan belgisi va kichik umumiy yordamchilar |
| `src/deferred-view.jsx`, `src/lazy-audio-maze.jsx` | Navigatsiyani saqlovchi lazy/Suspense chegaralari |
| `src/supabase-data.js` | Shablon va xarita ma’lumotlari kerak bo‘lganda import qilinadi; amaldagi API yo‘llari va saqlash ishlari saqlangan |
| `src/CinemaPiano.jsx` | Statik canvas keshi, chizish tezligi chegarasi, klavishlarni memo qilish va nota/qidiruv hisoblarini qayta ishlatish |
| `vercel.json` | HTML va Python worker uchun qayta tekshirish keshi; mavjud xavfsizlik sarlavhalari va immutable asset keshi saqlangan |
| `scripts/measure-performance.mjs`, `package.json` | `npm run perf`, o‘lchov va hajm mezonlari; versiya 7.35.0 |
| `package-lock.json` | Versiya 7.35.0; dependency o‘zgarishi yo‘q |
| `tests/performance.test.js` | Sekin katalog va piano chizish regressiyasi |
| `tests/ui.test.js`, `tests/audio-maze.test.js`, `tests/vercel.test.js` | Ajratilgan modullar va asinxron sahifalarga mos tekshiruvlar |
| `public/python-runtime/README.md`, `.gitignore` | Avtomatik tiklanadigan beshta Python fayli ZIPda takrorlanmaydi |
| `README.md`, `UPDATE-7.35.md`, `QA-7.35.md`, `PERFORMANCE-7.35.json`, `RELEASE-7.35.0.json` | Ishlatish va tekshiruv natijalari |

Savollar, SQL, 3D sahnalar, dizayn tokenlari, Audio Labirint dizayni va piano repertuari mazmuni saqlangan.
