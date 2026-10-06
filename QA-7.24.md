# SinfQuiz 7.24 — tekshiruv natijalari

Tekshiruvlar 2026-10-06 kuni shu paket kodida bajarildi. Oldingi 7.22/7.23/7.23.1 hisobotlari tarixiy dalil sifatida saqlangan; quyidagi natijalar yangi ishga tushirishlardir.

## SQL va hisoblar

- `npm test`: **144/144**, 0 xato. Log: `qa-7.24/all-tests.log`.
- `npm run build`: Vite production build bajarildi. Log: `qa-7.24/build.log`.
- 7.24 migratsiyasi ikki marta bajarildi. Avvalgi musobaqa urinishlari va savol shablonlari o‘zgarmasligi tekshirildi.
- Qabul ochilgach kelmaganlarni chiqarish/qaytarish; 1 va 2 kishili jamoalar bilan boshlash; boshlashdan keyin tarkibni muzlatish; bo‘sh jamoani reytingdan chiqarish sinovdan o‘tdi.
- Teng bo‘lmagan hajmdagi bir xil natijali jamoalar bir xil o‘rin oladi. Musobaqadan chiqish bo‘luvchini kamaytirmaydi va keyingi bosqichni to‘smaydi.
- Kelmagan deb belgilangan kishi javob bera olmaydi, kechikkan yangi odam qo‘shila olmaydi. Begona ustoz/o‘quvchi boshqaruv RPCsidan foydalana olmaydi; admin va egasi boshqara oladi.
- `cancel`: qabul/javob yopiladi, ball saqlanadi; qayta yuborish idempotent. O‘quvchi natija tarixini ko‘ra oladi.
- Typing: boshlanishdagi tushgan/ortiqcha belgi, almashish, bo‘sh javob, uzun matn, Unicode, matn chegarasi, takroriy javob tokeni va JS/SQL natijalarining mosligi tekshirildi. Ko‘p farqli matnda so‘zlar tartibi hamda tab/satr ajratuvchilari tekshirildi.
- RLS va grantlar: to‘g‘ridan-to‘g‘ri score/answer jadvallari, ichki hisob funksiyalari, begona shaxsiy kontent yopiq. Tayyor kalitlar o‘quvchi sahnasida yuborilmaydi.
- Oldingi testlar Informatika, Office/Excel, Python xavfsiz muhiti, 6-kodli reyting, Ingliz tili qoralama/ovoz oqimi, atlaslar, chat va auth/Vercel arxitekturasi tekshiruvlarini ham qamraydi. Ushbu reliz ularga oid production kodini o‘zgartirmaydi.

## Amalda qayta ishlatilgan brauzer

**Playwright 1.62.1 + haqiqiy Chromium 133.0.6943.0** ishlatildi; bu muhitda mavjud Chromium yo‘li berildi. 2 oqim, 0 JavaScript runtime xatosi va 8 ta axe tekshiruvida 0 WCAG buzilishi qayd etildi.

1. `tests/competition-browser.cjs`: React orqali yaratish → 6-kodli quizni biriktirish → typing → inglizcha labirintni yurib tugatish → Excel amaliyoti → o‘zi tuzgan quiz va haqiqiy Python worker → yakunlash, o‘rin 1/2, CSV, reload va faol mashq navigatsiyasi. **5 bosqich** amalda bajarildi. Auth/API transportining bir qismi test fixture; musobaqa RPC javoblari haqiqiy mahalliy SQLdan olingan. Dalil: `qa-7.24/browser/competition-browser.json`.
2. `tests/competition-attendance-browser.cjs`: haqiqiy localhost HTTP orqali kelmaganni belgilash → qaytarish → qayta belgilash → 6 o‘rindan 2 qatnashuvchi bilan boshlash → bo‘sh jamoa o‘rinsiz → quiz → typingdagi tushgan birinchi harf va worker yuklanmay qolishidagi zaxira hisob → to‘xtatish, saqlangan tarix va faol navigatsiyadan chiqish. Test auth hisoblari ishlatilgan, SQL/RLS esa haqiqiy PGlite’da bajarilgan. Dalil: `qa-7.24/attendance/attendance-browser.json`.

390×844 telefon, 1440×1000 desktop, 1920×1080 sinf doskasi va tungi rejim ochildi. Sahifa gorizontal sig‘ishi tekshirildi; keng natija jadvallari o‘z scroll hududida ko‘riladi. Klaviatura, Escape bilan tasdiqni yopish, fokus, radio va worker natijasi ishlatildi. Suratlar ikki brauzer hisobot papkasida.

## 40 ishtirokchi bilan yuklama

`npm run test:load:competition` haqiqatan bajarildi: **40 HTTP ishtirokchi, 4×10 jamoa, 10 bosqich**. Eski 7.22 va yangi 7.24 bazalari alohida yaratildi. Har birida **974 so‘rov, 0 xato**; 40 o‘quvchining 10 bosqich natijasi yakunda mavjudligi tekshirildi.

| O‘lchov | 7.22 p95 | 7.24 p95 |
|---|---:|---:|
| 40 kishi bosqichni ochishi | 231.29 ms | 136.67 ms |
| Holat o‘zgarmaganda 40 yangilanish | 191.01 ms | 77.09 ms |
| 40 quiz javobi bir vaqtda | 203.91 ms | 156.8 ms |
| 40 ta 4 000 belgili typing javobi | 5696.42 ms | 248.51 ms |
| 40 kishi 10-bosqichni ochishi | 567.07 ms | 279.11 ms |

Holat o‘zgarmagan uchta yangilanish turida javob baytlari **98.2%** kamaydi. To‘liq holat faqat revision o‘zgarganda, muddat tugaganda yoki foydalanuvchi majburiy yangilaganda hisoblanadi. Oddiy so‘rov javobi taxminan 76 bayt. Katalog/room yangilanishlari yashirin yoki offline oynada to‘xtaydi. Realtime signallari guruhlanadi; zaxira so‘rovlari 12–18 sekundga tarqatiladi, jonli ulanish bo‘lsa 24–36 sekundlik tekshiruv ishlaydi. Xatolarda kutish oshadi.

**O‘lchovning chegarasi:** haqiqiy localhost HTTP so‘rovlari bir vaqtda yuborildi, lekin PGlite bitta WASM PostgreSQL instansiyasi va foydalanuvchi kontekstlari navbat bilan bajarildi. Bu Supabase Realtime serveri, parallel Postgres connection pool, Vercel tarmog‘i yoki 40 jismoniy telefon sinovi emas. Sinov hech qanday jonli loyiha kalitidan foydalanmadi. Natijalar shu muhitdagi eski/yangi kod taqqoslashi; ishlab turgan server uchun sig‘im yoki ping kafolati berilmaydi. Ikkala bazaning ishga tushirish/JIT tartibi ham raqamlarga ta’sir qilishi mumkin.

SQLda butun musobaqa uchun `FOR UPDATE` o‘rniga javobda `FOR SHARE` va shaxsiy urinish qulfi ishlatiladi; tashkilotchining bosqich almashishi alohida `FOR UPDATE` bilan himoyalanadi. PGlite sinovi ushbu native Postgres lock parallelizmini o‘lchamaydi.

To‘liq o‘lchovlar: `qa-7.24/competition-load.json`, `qa-7.24/load.log`. 40 mijozning yangilanishlari bir vaqtda urilmasligi, Realtime signal bo‘roni, yashirin/offline holat, qayta ulanish va takroriy refresh uchun alohida testlar `tests/competition-sync.test.js`da.

## Manba va ishga tushirish

Tayyor yangi aktiv yoki 3D model qo‘shilmadi. Oldingi public fayllari va 216 Ingliz tili ovozi o‘zgarmasligi ZIP yig‘ilishida bayt/SHA256 bo‘yicha tekshiriladi. Yangi runtime dependency yo‘q; Playwright faqat brauzer QA uchun dev dependency. [Bosqichlar](UPDATE-7.24.md).
