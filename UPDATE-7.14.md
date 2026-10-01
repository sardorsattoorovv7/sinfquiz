# SinfQuiz 7.14.0 — Matematika atlasi, Audio Labirint va reyting

## Yangiliklar

- Matematika atlasi: yangi bosh sahifa, mavzuga mos chizmali kartalar, uchta o‘rganish yo‘li, qidiruv va sinf filtrlari. Mavjud 55 interaktiv sahna saqlandi.
- Fazoviy jismlar: Three.js parametrik 3D modellar, aylantirish, kub va parallelepipedni oltita yoqqa yoyish, kesuvchi tekislikni ko‘rsatish, jonli hajm va sirt yuzi hisoblari. Chizma rejimi ham mavjud.
- Audio Labirint: Kenney Castle Kit GLB devor, darvoza, minora, daraxt va bayroq modellari bilan izometrik maydon. RobotExpressive qahramonlari, Idle/Running harakatlari, yashil o‘quvchi va binafsha izquvar belgilari. Mavjud 12 xarita va topshiriqlar ishlatiladi; o‘quvchiga faqat ustoz faollashtirganlari chiqadi.
- Bir xil xaritani ikki ustoz faollashtirsa, har birining kartasi alohida tanlanadi va natija tanlangan ustozga yuboriladi.
- Tungi/kunduzgi ko‘rinish, telefonda yig‘iladigan asosiy menyu. Barcha navigatsiya tugmalari shu menyuda mavjud.
- Ketma-ketlik sahnasidagi `topic` xatosi va prizma/piramida asos o‘lchami boshqaruvi tuzatildi.
- Labirint boshlanishidagi taymer yangilanadi; yakuniy sarflangan vaqt keyin o‘sib ketmaydi.

## “Hammaga 1-o‘rin” xatosi

7.6 SQL reyting hujjati testning `quizId` qiymatini hujjat darajasida beradi, lekin `rows` ichidagi har o‘quvchiga qo‘shmaydi. Eski natija sahifasi har bir qatorning `quizId` qiymatini tekshirib, barcha qatorlarni chiqarib tashlagan. So‘ng bo‘sh ro‘yxat uchun `|| 1` ishlatilgan.

Yangi kod hujjatning test doirasini qatorlarga to‘g‘ri bog‘laydi. Natija va jonli reyting bir xil saralashdan foydalanadi: mavjud ball bo‘yicha kamayish; ball teng bo‘lsa oldin tugatgan, keyin oldin boshlagan; barcha qiymatlar teng bo‘lsa barqaror ID tartibi. Amaldagi ball formulasi o‘zgarmadi. Reyting kelmasa 1-o‘rin to‘qib chiqarilmaydi. “Reytingni yangilash” tugmasi ma’lumotni qayta oladi. Hali topshirayotganlar natijasi o‘zgarganda o‘rin ham o‘zgarishi mumkin.

## O‘rnatish / yangilash

Bu versiya uchun **yangi SQL migratsiyasi kerak emas**. Mavjud ishlayotgan bazangiz, atlas va audio labirint RLS siyosatlarini saqlang. Schema fayllarini faqat ushbu dizayn yangilanishi uchun qayta RUN qilish shart emas.

1. Eski loyiha va `.env` / `.env.local` faylingizning zaxira nusxasini oling.
2. ZIPni alohida papkaga oching. Maxfiy kalitlar ZIPga kiritilmagan; mavjud mahalliy `.env` faylingizni yangi loyiha ildiziga ko‘chiring. `.env.example` faqat namuna.
3. Node.js 22.12 yoki undan yangi versiyada loyiha papkasida:

```sh
npm ci
npm run dev
```

4. Ishlab chiqarish yig‘masi:

```sh
npm test
npm run build
```

5. Vercel uchun yangilangan manba kodini joylang va yangi deploy yarating. Oldingi Production environment qiymatlari saqlansin. `public/models` papkasini to‘liq qo‘shing: tekstura fayli ham zarur.

## Ishlash xususiyatlari

3D kutubxonasi sahna kerak bo‘lgandagina yuklanadi. Modellar mahalliy fayllar, devorlar esa instanslar orqali chiziladi. Piksel zichligi 1.5 gacha cheklangan, render taxminan 30 kadr/sekund. Ko‘rinmayotgan sahna va yashirin brauzer oynasi renderni to‘xtatadi. Sahifadan chiqilganda renderer va kuzatuvchilar tozalanadi. `prefers-reduced-motion` animatsiyalarni kamaytiradi.

3D/WebGL ishlamasa yoki modellar yuklanmasa, yengil SVG chizma rejimi ochiladi. Foydalanuvchi ham “Chizma” tugmasi bilan o‘tishi mumkin. Ovoz brauzerning inglizcha Speech Synthesis ovoziga bog‘liq; real qurilmadagi ovoz mavjudligi farq qiladi.

## O‘zgargan asosiy fayllar

- `src/MathAtlas.jsx`, `src/MathAtlasScenes.jsx` — atlas UI va sahnalar.
- `src/EnglishAudioMaze.jsx` — labirint UI, 3D ulanishi va ustoz tanlovi.
- `src/LearningVisual.jsx`, `src/learning-3d.js`, `src/learning-visual.css`, `src/discovery-theme.css` — umumiy vizual komponentlar.
- `src/quiz-ranking.js`, `src/supabase-data.js`, `src/App.jsx` — reytingni to‘g‘ri bog‘lash va ko‘rsatish.
- `src/theme.css` — mobil menyu va natija sahifasi.
- `public/models/castle/*` — tayyor GLB va tekstura fayllari.
- `MODEL-SOURCES.md` — modellar muallifi, litsenziyasi va manbasi.
- `tests/math-atlas-ui.test.js`, `tests/quiz-ranking.test.js`, `tests/ranking-ui.test.js`, `tests/audio-maze.test.js`, `tests/discovery-browser.cjs` — regressiya tekshiruvlari.

## Tekshiruv doirasi

62 ta avtomatik test: atlasdagi 55 sahnaning ochilishi, algebra/geometriya hisoblari, Python muhiti, test/typing/1v1 oqimlari, ustoz ajratilishi va RLS. Reyting uchun eski `quizId`-siz server qatorlari bilan 1-, 2-, 3-o‘rin, jonli ball o‘zgarishi va bo‘sh reyting holati tekshirildi.

Brauzer tekshiruvi: haqiqiy WebGL render, kub hajmi/yoyilmasi/kesimi, telefon ekranida sig‘ish, tungi rejim, SVG fallback, beshta eshikdan o‘tib labirintni yakunlash, xato javobga izoh, tanlangan ustozga natija yuborilishi va yakuniy vaqtning o‘zgarmasligi. API javoblari nazorat qilinadigan sinov ma’lumotlari bilan bajarildi; sizning jonli Supabase bazangizga yozilmadi. Bu qurilmangizdagi FPS yoki internet tezligi kafolati emas.
