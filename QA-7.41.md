# SinfQuiz 7.41.0 — tekshiruv natijalari

Tekshiruv: 2026-10-17T03:07:58.017756+00:00. Muhit: Node.js v24.19.0, Linux.

## Yakuniy tekshiruvlar

| Tekshiruv | Natija |
| --- | --- |
| `npm test` | **317 o‘tdi, 0 xato, 0 o‘tkazib yuborilgan**; taxminan 105 soniya |
| `npm run build` | **Muvaffaqiyatli** |
| `node scripts/measure-performance.mjs dist --check` | **Budjetdan o‘tdi** |
| Yangi ikki MIDI | 81 nota, 808 bayt; MIDI qayta o‘qilishi, SHA-256 va interfeys notalari mos |
| Offline avtoijro | Har ikkala yangi kuyda tashqi musiqa so‘rovisiz ishlashi tekshirildi |
| Do–Re–Mi tutorial | Belki 49 va Tujh 32 qadamining barchasi bajarildi; noto‘g‘ri nota kutishni saqlaydi; natija saqlanadi |
| Qidiruv | Dedubluman, Tujhme Rab, Shohruxxon, Shah Rukh Khan va film nomi ishlaydi |
| Oldingi resurslar | 1317 eski fayl saqlanadi; 548 public/data/SQL fayli baytma-bayt o‘zgarmagan |

## Tezlik va moslik

Dastlabki JavaScript **583,481 bayt**, gzip hisobida **171,596 bayt**. CSS **314,436 bayt**, gzip hisobida **55,345 bayt**. Yangi qo‘shiqlar lazy piano modulida; boshlang‘ich JS hajmi 7.40 bilan bir xil. Siqilgan hajmlar hisobiy natija; real tarmoq va qurilmadagi vaqt o‘lchanmagan. Katta tashqi akustik audio banki qo‘shilmagan.

Mavjud klaviatura/sensor, 90° sahna, fullscreen fallback, fokus, dark/light uslubi va balandroq chiqish/DSP testlari umumiy to‘plam ichida o‘tdi. DOM testlari React va haqiqiy dars holatlarini, audio testlari audio grafi/scheduling shartlarini tekshiradi. Oldingi testlarda faqat yangi umumiy kuy va filtr sanoqlari yangilandi; ko‘rinish tekshiruvlari qisqartirilmadi.

Ovoz mexanizmi, standart Volume/Master Gain, yonlama sahna kodi va CSS 7.40 dagi holat bilan baytma-bayt bir xil. Autentifikatsiya, rollar, Supabase, API/RPC/RLS va natija saqlash implementatsiyasi o‘zgartirilmagan; mavjud regressiya/SQL testlari bajarildi.

## Manba aniqligi va tekshiruv chegarasi

Belki PDF notasidagi chorak/sakkizlik/yarim notalar, 24-taktdagi pauza va yakuniy A tekshirildi. Tujh harfli notalar manbasida davomiylik yo‘q: ritm soddalashtirilgani ma’lumotda, kartada va qo‘llanmada belgilangan. Asl audioyozuv bilan tinglab solishtirish bajarilmagan.

Bu muhitda brauzer vizual tekshiruvi, haqiqiy telefon/planshet yoki audio karnayida sinash hamda jonli Supabase hisobiga kirish bajarilmagan. Ushbu tekshiruvlar bajarildi degan da’vo yo‘q. `all-tests.log`, `build-final.log`, `performance.json`, `source-fidelity.json` va qayta yaratish hisoboti `qa-7.41.0` ichida.

ZIP yig‘ish skripti barcha eski yo‘llar, himoyalangan fayllar, dependency/script mosligi, CRC, takroriy yo‘llar va barcha arxiv baytlarini tekshiradi. To‘liq PDF/HTML manbalar, tadqiqot fayllari, maxfiy `.env`, `node_modules` va `dist` ZIPga kiritilmagan.
