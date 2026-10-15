# SinfQuiz 7.35.0 — yuklanish va performance

7.34.0 ga nisbatan dastlabki sahifaga kerak JavaScript **33.63%**, CSS **15.64%** kamaydi. Dizayn, savollar, 3D sahnalar va musiqa repertuari saqlangan.

## Nimalar tezlashtirildi

- Administrator, login, o‘quvchi darslari, milliy test va jonli o‘yin sahifalari alohida bo‘lib yuklanadi. Audio Labirint sahifa ochilgandagina yuklanadi.
- Savol shablonlari faqat ustoz uchun kerak bo‘lganda, labirint xaritalari esa tegishli API oqimida yuklanadi.
- Hisob aniqlangandan keyin bosh sahifa va navigatsiya ustoz katalogining tugashini kutmaydi. Ma’lumotga bog‘liq panel yuklanish holatini ko‘rsatadi.
- Pianino to‘xtab turganda bir xil nota maydonini qayta chizmaydi. Ijroda canvas taxminan 30 FPS bilan cheklanadi; audio transporti o‘z audio soatida ishlashda davom etadi. Klavishlar daraxti taymer yangilanishlaridan ajratildi.
- HTML va Python worker qayta tekshiriladi; hash nomli assetlarning amaldagi uzoq keshi saqlanadi.
- Qayta yaratiladigan Python runtime nusxasi ZIPdan chiqarildi. O‘rnatish va build uni avtomatik tiklaydi. Bu media sifatini kamaytirish emas.

## O‘rnatish va yangilash

ZIP — barcha manba kodlari, media, SQL va konfiguratsiyali to‘liq loyiha. Faqat `npm ci` orqali avtomatik yaratiladigan beshta Pyodide runtime fayli ZIPda takrorlanmaydi.

1. Amaldagi `.env.local` qiymatlaringizni saqlang.
2. ZIP ichidagi `sinf-quiz` papkasini oching. Node.js 22.12 yoki yangi versiya ishlating.
3. Buyruqlarni bajaring:

```sh
npm ci
npm test
npm run build
npm run perf
```

`npm ci` tugaganda va build oldidan Pythonning beshta mahalliy fayli `public/python-runtime`ga nusxalanadi. Lokal ishga tushirish: `npm run dev`. Production natijasi: `dist`.

**7.34.0 dan yangi SQL, migration, dependency yoki environment o‘zgarishi kerak emas.** Yangilangan kod va `vercel.json` bilan qayta deploy qiling. Ushbu paket avtomatik deploy qilinmagan.

O‘lchov va tekshiruv chegaralari: [QA-7.35.md](QA-7.35.md). Mashina o‘qiydigan natijalar: [PERFORMANCE-7.35.json](PERFORMANCE-7.35.json).
