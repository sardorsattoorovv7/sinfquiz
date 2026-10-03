# SinfQuiz 7.20.1 — tekshiruv natijalari

Tekshiruv sanasi: 2026-10-03. Yangilanish kimyo laboratoriyasidagi bosqichli qo‘llanma, modda qo‘shish va kuzatish sahnalariga tegishli.

## Avtomatik tekshiruv

- `npm test`: **114 test, 114 muvaffaqiyatli, 0 xato, 0 o‘tkazib yuborilgan**.
- `npm run build`: muvaffaqiyatli. Lucide kutubxonasining `use client` direktivasi haqidagi bundler ogohlantirishlari buildni to‘xtatmaydi.
- Yangi `tests/chemistry-tutorial.test.js` ichida 19 ta tekshiruv: 13 qo‘llanma, 23 namuna, qo‘shish tartibi, noto‘g‘ri modda/miqdor/konsentratsiya, kuzatish vaqti, gaz tezligi va vizual hisoblar.

Reaksiyalar uchun formula va atomlar saqlanishi, chegaralovchi reagent, miqdorga bog‘liq gaz hajmi va neytrallanish oldingi model testlari bilan birga tekshirildi. Gaz ajralish tezligi hajmning vaqt bo‘yicha o‘zgarishiga mos. Taqqoslash namunalarida kerakli sharoitlar va kuzatish vaqti haqiqatan bajarilmaguncha qo‘llanma tugamaydi.

Filtrlashda qoldiq filtrda qoladi, erigan tuz filtrat bilan o‘tadi. Gaz bermaydigan kombinatsiyada soxta pufakcha chiqmaydi. Sovun hajmi, indikatorning shartli 0,05 ml tomchisi va quruq soda miqdori hisob hamda ko‘rinishda tekshirildi.

## Haqiqiy brauzerda

`tests/chemistry-tutorial-browser.cjs` Chromiumda Vite dasturini ochib, foydalanuvchi boshqaruvlari orqali bajarildi:

- Erkin tajriba va barcha 12 amaliy ishning **23 namunasi** to‘liq bajarildi.
- Vulqon qo‘llanmasida noto‘g‘ri temir qo‘shish, uni olib tashlash, miqdorni tayyorlash, ikki namuna, yordam soni va tajriba daftarini saqlash tekshirildi. “Qayerdaligini ko‘rsat” reagentni avtomatik qo‘shmaydi.
- Barcha olti jihoz, oq cho‘kma, filtrlash, molekula qatlami, aylantirish/yaqinlashtirish, 2D/3D almashish va klaviatura boshqaruvi tekshirildi.
- Telefon (390 px), kompyuter va keng sinf doskasi (1920 px), yorug‘/tungi rejim hamda harakatni kamaytirish ko‘rinishlari ochildi. Voronka va uning tagidagi idish kamera ichida ko‘rinadi.
- Sahna ko‘rinmayotganda va tajriba to‘xtatilganda uzluksiz render to‘xtashi tekshirildi. Grafik qayta ochilganda oldingi quyish animatsiyasi takrorlanmaydi.
- Brauzerda ushlanmagan JavaScript yoki WebGL shader xatosi kuzatilmadi.
- Axe tekshiruvida kompyuter, telefon va tungi telefon sahifalarida **0 avtomatik aniqlangan buzilish**. Bu to‘liq WCAG sertifikatsiyasi degani emas.

Tekshiruvni takrorlash:

```bash
npm install
npm test
npm run build
CHROME_EXECUTABLE=/path/to/chromium node tests/chemistry-tutorial-browser.cjs
```

Oxirgi buyruq uchun Playwright va axe-core tekshiruv muhitida bo‘lishi kerak. Oddiy ishga tushirish uchun ular kerak emas; `npm run dev` yetarli.

## Boshqa bo‘limlar

Mavjud brauzer regressiya tekshiruvida Biologiya sinovini boshlash/qayta boshlash, Matematikaning 62 mavzusi va yettita fazoviy modeli, A2 matnli Ingliz labirinti, yopiq guruh/chat va ustoz topshirig‘i oqimi o‘tdi. Chatdagi HTML/XSS sinov matni oddiy matn sifatida ko‘rindi. Asosiy testlar kod orqali kirish, test natijasi, typing, 1v1 va Supabase/Vercel konfiguratsiyasini ham qamrab oladi.

Brauzer sinovlari nazorat qilinadigan API javoblari bilan bajarildi; haqiqiy foydalanuvchi ma’lumotlari o‘zgartirilmadi. Ishlab turgan Supabase loyihasi, Vercel domeni, haqiqiy telefon GPUsi va tarmoq kechikishlari alohida o‘lchanmadi. Ushbu patch autentifikatsiya yoki RLS siyosatini o‘zgartirmaydi, yangi SQL migratsiyasi talab qilmaydi.

## Dalillar

`qa-7.20.1/` ichida yakuniy test/build/brauzer jurnallari, `accessibility.json` va qo‘llanma, vulqon, cho‘kma, filtrlash hamda mobil/tungi/doska ko‘rinishlari bor. Ilmiy model chegaralari va aktivlarning kelib chiqishi `CHEMISTRY-TUTORIAL-SOURCES.md` hamda `UPDATE-7.20.1.md`da yozilgan.
