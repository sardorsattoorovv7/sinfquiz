# SinfQuiz 7.28 — haqiqiy 3D Bilim oroli

Bu reliz bosh sahifadagi orolni haqiqiy, aylantiriladigan 3D sahnaga almashtiradi. Matematika, kimyo, biologiya, ingliz tili, informatika va IQ uchun alohida hajmli binolar, markaziy ochiq kitob, ko‘priklar, daraxtlar va sakkizta sharshara bor. Fanlar avvalgi kirish va ruxsat tartibi orqali ochiladi.

## Nima o‘zgardi?

- Orol rasm yoki video fon emas. Three.js geometrik modellari brauzerda chiziladi; kamerani aylantirish va yaqinlashtirish mumkin.
- Suv yuzasi, sharsharalar oqimi, ko‘pik halqalari va suv tomchilari harakatlanadi. Markazdagi armillyar globus ham sekin aylanadi.
- Yorug‘lik qurilmaning mahalliy vaqtiga mos: tong 05:00–07:00, kunduz 07:00–16:00, shom 16:00–19:00, tun 19:00–05:00. 17:00 da shom manzarasi. Yoritish chegaralarda asta o‘zgaradi.
- Soat tugmasidan vaqtni qo‘lda tanlab ko‘rish yoki avtomatik holatga qaytish mumkin. Tanlov shu brauzerda saqlanadi.
- Aylantirish, yaqinlashtirish, ko‘rinishni tiklash va harakatni to‘xtatish tugmalari ishlaydi. Telefon ekranida oltita fan tartibli tugmalar qatorida chiqadi.
- 3D yuklanmasa ham fanlar va testga kirish formasi ishlaydi. WebGL uzilsa, qayta ochish tugmasi bor.

Bu vaqt jadvali bezakli muhit uchun mo‘ljallangan; shahar koordinatasi, ob-havo yoki astronomik quyosh botishi hisoblanmaydi. Geolokatsiya ruxsati so‘ralmaydi. Fan binolari mavzularni belgilovchi me’moriy modellar; binoning o‘zi ilmiy simulyatsiya sifatida taqdim etilmaydi.

## Yangilash va ishga tushirish

1. ZIPni alohida papkaga oching. Loyihangizdagi haqiqiy `.env.local` yoki `.env` qiymatlarini saqlang; ularni Gitga qo‘shmang.
2. Node.js 22.12 yoki undan yangi versiyada `sinf-quiz` papkasini terminalda oching.
3. Bog‘liqliklarni o‘rnating va ishga tushiring:

```bash
npm ci
npm run dev
```

Production yig‘ish va mahalliy ko‘rish:

```bash
npm run build
npm run preview
```

Vercelda yangi kodni odatdagi tarzda joylab, yangi deployment yarating. Mavjud Supabase va server environment qiymatlari o‘z joyida qoladi. Ushbu 7.28 yangilanishi uchun yangi SQL migratsiya kerak emas: jadval, RLS, Supabase kalitlari va kirish mexanizmi o‘zgarmagan. Boshqa versiyadan ancha oldin qolgan baza bo‘lsa, avvalgi relizlarning mavjud migratsiya tartibi amal qiladi.

## Boshqaruv va qulaylik

- 3D maydonni klaviatura bilan tanlang: chap/o‘ng strelka aylantiradi, `+` / `−` yaqinlashtiradi, `Home` boshlang‘ich ko‘rinishga qaytaradi.
- «Erkin aylantirish» yoqilganda sichqoncha yoki barmoq bilan surish, ikki barmoq bilan yaqinlashtirish mumkin.
- «Harakatni to‘xtatish» faqat avtomatik oqimni to‘xtatadi; kamera va fan tugmalari ishlashda davom etadi.
- Qurilmada harakatni kamaytirish yoqilgan bo‘lsa, avtomatik animatsiya o‘chadi. Sahna ekrandan tashqarida yoki brauzer yashirilganda chizish to‘xtaydi.
- 3D uchun WebGL 2 kerak. U mavjud bo‘lmasa, matnli fan navigatsiyasi va mavjud sayt funksiyalari saqlanadi.

## Tezlik

Statik modellar material bo‘yicha birlashtiriladi. Animatsiya React holatini har kadrda yangilamaydi. Bitta `requestAnimationFrame` sikli ishlaydi: mobil/tejamkor muhitda ko‘pi bilan 24, odatiy muhitda 30 kadr/soniya. Bu yuqori chegara, har bir qurilmada shu tezlik kafolati emas.

Render buferi mobil yoki zaif qurilmada 650 ming, desktopda 1,3 million piksel bilan chegaralanadi. Mobil holatda soyalar o‘chadi; chizish juda sustlashsa, ruxsat qo‘shimcha pasayadi. Sahna yopilganda geometriya, materiallar, kuzatuvchilar va WebGL resurslari tozalanadi. Yangi 3D geometriya va suv effektlari uchun tashqi model yoki rasm serveriga so‘rov yuborilmaydi.

## Fayllar va model manbalari

Asosiy yangi kod: `src/IslandWorld.jsx`, `src/island-world-3d.js`, `src/island-models.js`, `src/island-clock.js`, `src/useIslandEnvironment.js`, `src/island-world.css`.

Ulash joylari: `src/IslandHome.jsx`, `src/App.jsx`, `scripts/build-public-pages.mjs`, `package.json`, `package-lock.json`. To‘liq ro‘yxat `CHANGED-FILES-7.28.md`da.

Yangi orolning geometriyasi loyiha uchun dasturiy tarzda yaratilgan original modeldir. Tayyor pulli yoki boshqa brendga tegishli 3D aktivlar ishlatilmagan. Three.js MIT litsenziyasi (`https://github.com/mrdoob/three/blob/r180/LICENSE`), Lucide ISC litsenziyasi (`https://lucide.dev/license`) bilan ishlatiladi; mavjud dependency versiyalari o‘zgartirilmagan. Avvalgi biologiya, kimyo va boshqa bo‘limlardagi aktivlar hamda ularning litsenziya hujjatlari saqlangan.

## Tekshiruv

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e:island
npm run test:e2e:studio
```

Maxsus Chromium o‘rnatilgan muhitda `CHROME_EXECUTABLE` qiymatini ko‘rsatish mumkin. Natijalar va sinov chegaralari `QA-7.28.md`da. Avvalgi `QA-7.27.md` avvalgi reliz hisoboti bo‘lib qoladi; u 7.28 sinovlari o‘rnida ishlatilmaydi.
