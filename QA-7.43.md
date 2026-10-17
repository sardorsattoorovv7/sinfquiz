# SinfQuiz 7.43.0 — tekshiruv natijalari

Tekshiruv sanasi: 2026-10-17T05:09:31.930697+00:00. Linux, Node.js v24.19.0.

| Tekshiruv | Natija |
| --- | --- |
| `npm test` | **326 o‘tdi, 0 xato, 0 skip**; taxminan 111 soniya |
| `npm run build` | **Muvaffaqiyatli** |
| `node scripts/measure-performance.mjs dist --check` | **Budjetdan o‘tdi** |
| Yangi yonlama ro‘yxat testlari | **3 o‘tdi**; sahna, tanlov, fokus va qidiruv klaviaturasi |
| Eski fayllar | Barcha 1349 yo‘l saqlanadi; 553 public/data/SQL fayli baytma-bayt o‘zgarmagan |

## Tekshirilgan yangi xatti-harakatlar

390×844 telefon geometriyasidagi 90° sahnada kuyni tanlash ro‘yxati ochiladi. Ro‘yxat shu portal ichida qoladi. 79 tayyor kuy va 38 mashq, qidiruv natijasi va bo‘sh shaxsiy MIDI holati tekshirildi. Tujh Mein Rab Dikhta Hai tanlanganda sahna yopilmaydi; joriy nom yangilanadi, eski ushlab turilgan notalar bo‘shatiladi va tutorial 0/32 holatiga qaytadi. Yangi avtoijro o‘zidan boshlanmaydi.

Sevimlilar va oldindan saqlangan tutorial natijalari tanlovdan keyin saqlandi. Mashq tanlanganda ham yonlama holat saqlanib, oddiy ko‘rinishga qaytganda tanlov o‘zgarmadi. Ro‘yxat ochilganda orqadagi boshqaruvlar inert qilinadi; fokus qidiruvga o‘tadi va Tab/Shift+Tab ro‘yxat chegarasida qoladi. Esc ro‘yxatni yopib, fokusni kuy nomiga qaytaradi; keyingi Esc sahnadan chiqaradi.

Native fullscreen/orientation lock maketi va qo‘llanmaydigan fullscreen fallback holatlari tekshirildi. Qidiruv klaviaturasi uchun visual viewport balandligi 844 → 280 → 844 px qilib modellashtirildi; 90° holat saqlandi va ko‘rinish yangi o‘lchamga moslandi.

Mavjud rol testlari mehmon, o‘quvchi, ustoz va administratorda PIANO ochilishi va Mashqlarga qaytishini tekshiradi. Bo‘lim kartasi/sarlavhasi PIANO. Eski hash, saqlash kalitlari, ovoz mexanizmi, tayyor notalar va o‘zbekcha typing razminkasi o‘zgarmagan.

## Yuklanish va chegaralar

Dastlabki JavaScript: **583,769 bayt**, gzip **171,663 bayt**; 7.42 dan o‘zgarish **-10 bayt**. CSS: **314,436 bayt**, gzip **55,345 bayt**. Yangi ro‘yxat PIANO lazy moduliga kiradi. Yangi dependency yoki tashqi kontent yuklovi yo‘q. Siqilgan hajmlar hisobiy, haqiqiy tarmoq tezligi o‘lchanmagan.

Sinovlar Node/JSDOM, React va audio/fullscreen maketlariga asoslangan. Boshqariladigan brauzer mavjud bo‘lmagani uchun haqiqiy iPhone/Android/planshet, mobil klaviatura, ekran screenshotlari yoki jonli Supabase bilan sinov bajarilmagan. CSS’da 44 px tugmalar, 16 px qidiruv, scroll, tor ekran va mavjud reduced-motion qo‘llovi saqlangan; JSDOM haqiqiy layoutni tasdiqlamaydi.

Builddagi Lucide `use client` ogohlantirishlari fatal emas. Loglar `qa-7.43.0` ichida. ZIP skripti CRC, barcha yo‘llar, takroriy nomlar, avvalgi resurslar va har bir fayl baytini tekshiradi; to‘liq yopilgan arxiv atomar yakunlanadi. Maxfiy `.env`, `node_modules`, `dist` yoki vaqtinchalik tadqiqotlar kiritilmaydi.
