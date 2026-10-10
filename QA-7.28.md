# SinfQuiz 7.28 — tekshiruv natijalari

Sana: 2026-10-09. Muhit: Node.js 24.19.0, Chromium 133.0.6943.0, Vite development va production preview, SQL sinovlari uchun mahalliy PGlite. Bazaviy reliz: 7.27. Bu tekshiruvlar jonli Vercel yoki foydalanuvchining Supabase bazasiga yozmaydi.

## Avtomatik tekshiruv

- `npm ci`: lockfile bo‘yicha o‘rnatildi; beshta mahalliy Python runtime fayli tiklandi.
- `npm test`: **166 / 166** o‘tdi; 0 ta xato, bekor qilingan yoki o‘tkazib yuborilgan test.
- `npm run build`: production build muvaffaqiyatli. Lucide modulidagi `use client` direktivasiga oid Vite/Rolldown ogohlantirishi mavjud; yig‘ish va production brauzer sinovi o‘tdi.
- Yangi 3D, navigatsiya va Studio oqimlarida jami **22 ta axe tekshiruvi, 0 ta aniqlangan buzilish**. Bu avtomatik tekshiruv natijasi, to‘liq WCAG muvofiqlik sertifikati emas.

## Haqiqiy brauzerda bajarilgan ishlar

| Oqim | Amaliy tekshiruv | Hisobot |
| --- | --- | --- |
| Haqiqiy 3D | WebGL buferi chizildi; geometriya va draw-call soni tekshirildi; yangi orol bitmap fon yuklamaydi | `qa-7.28/island/island-3d-browser.json` |
| Suv va pauza | Render qilingan canvas piksellari harakatda o‘zgaradi; pauzada ikkita surat baytma-bayt bir xil; kamera pauzada ham ishlaydi | Shu hisobot |
| Mahalliy vaqt | Bir xil UTC paytida Toshkentda 17:00/shom, Nyu-Yorkda 08:00/kunduz; tong, kunduz, tun va 00:00; qo‘lda tanlash va F5 dan keyin saqlanish | Shu hisobot |
| Kamera | Burish, yaqinlashtirish, tiklash, strelkalar va Home; chizilgan manzara haqiqatan o‘zgaradi | Shu hisobot |
| Tejamkor ishlash | Harakatni kamaytirish jonli yoqildi; sahna ekrandan tashqarida bo‘lganda kadrlar to‘xtadi; mobil piksel cheklovi unit testda tekshirildi | Shu hisobot va `tests/island-clock.test.js` |
| Tiklash | WebGL context yo‘qotilishi sun’iy chaqirildi, qayta ochish ishladi; WebGL yo‘q holatda fanlar va auth yo‘li ishladi | Shu hisobot |
| Mobil va doska | 320, 390, 768, 1024, 1280, 1600, 1920 px; gorizontal chiqish yo‘q, oltita fan tugmasi ko‘rinadi va bosiladi | Yangi 3D va navigatsiya hisobotlari |
| Kod va kirish | Noto‘g‘ri kod xabari, to‘g‘ri 6 xonali kod bilan mehmon kirishi, auth cheklovi, sekin auth paytida tanlangan bo‘lim, ommaviy deep link | `qa-7.28/navigation/island-browser.json` |
| Umumiy sayt | Klaviaturali qidiruv, Escape, tashqariga bosish; profil/chat/milliy testni F5 bilan tiklash; mobil menyu; ustoz paneli va chat yo‘li | `qa-7.28/studio/studio-browser.json` |
| Mavjud fanlar | Uchburchak yuzi 8×5÷2=20 va 10×5÷2=25; kimyoda 100 ml suv qo‘shish; WebGL labirintda yurish va matnli savol; 4 fan darsliklari; yorug‘/tungi rejim | Shu Studio hisoboti |
| Production | Hashli build chunklari 200 bilan yuklandi; haqiqiy 3D, kamera, auth yo‘li va JavaScriptsiz ochiq fan sahifalari ishladi | `qa-7.28/production/production-browser.json` |

Tekshirilgan brauzer oqimlarida ushlanmagan JavaScript xatosi kuzatilmadi. Production preview tekshiruvida muvaffaqiyatsiz asset so‘rovi bo‘lmadi. Yangi 3D chunk buildda taxminan 21 KB (gzipdan oldin); avvaldan bor umumiy Three.js dependency alohida yuklanadi.

## Hisoblar, ruxsatlar va kontent

166 ta Node testi matematika hisoblari, kimyoda moddalar/atomlar saqlanishi, biologiya modellari, SQL/RLS, egaga tegishli kontent, Telegram imzosi, admin parol vakolati, typing, reyting, jamoaviy musobaqa va mavjud 1v1/quiz UI oqimlarini qamraydi. Beshta yangi test mahalliy vaqt chegaralari, bir sutkadagi yoritish uzluksizligi, GPU bufer chegaralari va barcha oltita haqiqiy 3D modelni tekshiradi.

7.27 arxiv manifestidagi 925 faylning barchasi va manifestning o‘zi saqlangan: **926 ta avvalgi fayl yo‘qolmagan**. API, SQL migratsiyalari, auth/RLS, mavjud fan ma’lumotlari, audio, Python runtime va eski 3D aktivlar o‘zgartirilmagan. To‘liq farqlar `CHANGED-FILES-7.28.md`da, joriy fayl hashlar `ARCHIVE-MANIFEST-7.28.json`da.

Yangi SQL migratsiya yo‘q. Test natijalari production hisoblarining login/parol ishlashini tasdiqlamaydi: brauzer testlarida auth va API transporti fixture. Mahalliy SQL testlari alohida bajarildi. 30–40 ta haqiqiy telefon, haqiqiy past tezlikdagi internet, barcha fizik GPUlar yoki jonli Vercel deployment bu tekshiruvga kirmaydi. Google indekslash holati tekshirilgani yoki kafolatlangani da’vo qilinmaydi; mavjud ochiq HTML, canonical, sitemap va meta testlari saqlangan.

## Vizual ko‘rik va tuzatish

Desktop va telefon ekran tasvirlari ochib ko‘rildi: markaziy kitob, oltita maskan, darvoza, ko‘priklar, ko‘l va sharsharalar haqiqiy meshlar bilan chiziladi. Tog‘ ko‘rinishidagi ortiqcha uzoq konuslar olib tashlandi; ixcham boshqaruvlarda matn yashirilganda ham accessible nom saqlandi; resize paytida fan yorliqlari darhol joylashtiriladi. Sarlavhada bosishni to‘sib turgan `pointer-events` qoidasi tuzatildi va Studio sinovi qayta o‘tdi.

Yangi QA ekran tasvirlari `qa-7.28/` ichida hajmi kamaytirilgan WebP ko‘rinishida. Testlarni qayta ishlatish PNG natijalarini ham yaratadi. Oldingi `qa-7.27/` hisobotlari tarixiy ma’lumot sifatida qoldirilgan.

## Qayta tekshirish

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e:island
npm run test:e2e:studio
node tests/island-production-browser.cjs
```

Studio hisoboti odatda `qa-7.28/studio`ga yoziladi; `STUDIO_QA_DIR` orqali boshqa papka tanlash mumkin. Maxsus brauzer yo‘li `CHROME_EXECUTABLE` orqali beriladi. ZIPni yig‘ishda barcha a’zolar CRC bo‘yicha tekshiriladi; saqlangan faylni qayta olishda SHA-256 hamda a’zolar manifesti solishtiriladi.
