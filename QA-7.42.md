# SinfQuiz 7.42.0 — tekshiruvlar

Tekshiruv sanasi: 2026-10-17T04:38:59.279091+00:00. Linux, Node.js v24.19.0.

| Tekshiruv | Natija |
| --- | --- |
| `npm test` | **323 o‘tdi, 0 xato, 0 skip**; taxminan 102 soniya |
| Yangi razminka testlari | **6 o‘tdi**; ma’lumot, vaqt, metrika, UI va kirish oqimlari |
| `npm run build` | **Muvaffaqiyatli** |
| `node scripts/measure-performance.mjs dist --check` | **JS/CSS budjeti bajarildi** |
| Ochiq API va SQL | Implementatsiya o‘zgarmagan; mavjud regressiya/SQL testlari o‘tdi |
| Resurslar | 1337 eski yo‘l saqlanadi; 553 public/data/SQL fayli baytma-bayt bir xil |

## Razminka bo‘yicha tekshirilgan holatlar

48 ta gapning qisqaligi va takrorlanmasligi; 1/3/5 gap tanlash; tinish belgilari va kichik harflar; qayta boshlaganda birinchi gapni almashtirish; apostrof variantlari; Unicode belgi hisoblash; oraliqdagi tanlovni almashtirish; Backspace uchun qo‘shimcha xato yozilmasligi; tuzatilgan xatolarni umumiy aniqlikda saqlash; WPM hisoblash.

React interfeysida xato harf, nusxa qo‘yishni to‘sish, barcha harflarni yozib tugatish, yakuniy statistika, fokus va Tab → Enter orqali qayta boshlash tekshirildi. Native textarea va composition voqealari qo‘llangan. Vaqtli rejimda matnning davom etishi, yashirin tabdan qaytilganda aniq muddat, kechikkan inputni rad qilish va sozlamadan keyingi yangi sessiya tekshirildi.

Typing kirishida inglizcha yo‘nalish, o‘zbekcha razminka, xona tanlovining saqlanishi va avvalgi `longtext` / `english` so‘rov shartnomalariga o‘tish ishlaydi. Allaqachon kirilgan o‘zbekcha bosqichdan razminkaga o‘tib qaytish rasmiy taymerni boshlamaydi. Razminkada APIga natija yuborish implementatsiyasi yo‘q; jurnal va server baholashiga aralashmaydi.

Axe bilan komponentning WCAG 2 A/AA semantik tekshiruvi bajarildi; JSDOM’da ishonchli bo‘lmagan rang-kontrast qoidasi bu tekshiruvda o‘chirilgan. Mavjud Paper Workshop testlari kunduzgi/tungi tokenlar kontrastini hisoblab tekshiradi. Yangi CSS shu ink/muted/accent/danger tokenlaridan foydalanadi.

## Yuklanish hajmi

Boshlang‘ich JS: **583,779 bayt**, gzip hisobida **171,671 bayt**. Oldingi versiyadan **298 bayt** ko‘p. CSS: **314,436 bayt**, gzip **55,345 bayt**. Razminka kodi va CSS alohida lazy modul sifatida faqat ochilganda yuklanadi. Yangi kutubxona, shrift yoki tashqi kontent so‘rovi qo‘shilmagan. Siqilgan hajmlar hisobiy, haqiqiy tarmoq vaqti emas.

## Tekshiruv chegaralari

Bu muhitda boshqariladigan brauzer mavjud emas. Haqiqiy telefon/planshet, brauzer screenshotlari yoki jonli Supabase hisobi bilan sinov bajarilmagan. 320–390 px uchun oqim, kichik ekran qoidalari, 44 px tugmalar va reduced-motion CSS’da mavjud; JSDOM haqiqiy layout yoki mobil klaviaturani tasdiqlamaydi.

Buildda Lucide’ning `use client` direktivalari haqida bundler ogohlantirishlari bor; build muvaffaqiyatli tugadi. Tekshiruv loglari `qa-7.42.0` ichida. Barcha eski avtomatik testlar saqlangan; ular qisqartirilmagan.

ZIP skripti CRC, yo‘llar, takroriy nomlar va har bir fayl baytini tekshiradi. Arxiv to‘liq yopilib tekshirilgach atomar tarzda yakuniy nomga o‘tkaziladi. Maxfiy `.env`, `node_modules`, `dist` va vaqtinchalik tadqiqot fayllari kiritilmaydi. O‘rnatish: `UPDATE-7.42.md`.
