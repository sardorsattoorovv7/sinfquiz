# SinfQuiz 7.16.1 — Kimyo oqimlari tuzatildi

7.16 dagi 12 sahna va laboratoriya saqlangan. Davomiy tekshiruvda aniqlangan kamchiliklar tuzatildi:

- Qoralama 800 ms kutishdan oldin sahnadan chiqilganda ham saqlanadi. Sahna yopilishi va brauzerning pagehide hodisasi oxirgi yozuvni saqlaydi. Taxmin, tekshirilganlik holati va kuzatish qayta ochilganda tiklanadi. Eski oddiy matnli qoralamalar o‘qiladi.
- Bir xil savol, taxmin va kuzatish uchun yuborish tugmasi muvaffaqiyatli javobdan keyin o‘chadi. Shu brauzerda sahnaga qaytganda ham yuborilganlik eslanadi. Matn yoki taxmin o‘zgarsa yangi yuborish mumkin. Ustoz savol/javobini o‘zgartirsa oldingi tekshiruv holati qayta ishlatilmaydi. Bu mijozdagi takroriy bosishni cheklash; serverda umumiy urinishlar bazasi o‘zgarmagan.
- Brauzer mahalliy saqlashni taqiqlasa sahna qulamaydi: daftarni yuklab olish haqida izoh chiqadi.
- NaCl kristalining kesimida musbat/manfiy ionlar gorizontal va vertikal qo‘shnichilikda almashadi. Eritmaga o‘tganda ionlar kristall panjaradan tarqalib ko‘rinadi. Kovalent molekula ko‘rinishida ta’sirsiz holat boshqaruvi olib tashlandi.
- Ustoz formasidagi bo‘sh to‘g‘ri javob 0 sifatida qabul qilinmaydi. Javob diapazoni, sinf, zarrachalarning butun sonligi va sahna parametrlari saqlashdan oldin tekshiriladi.
- Laboratoriyada mos tajriba topilmasa aniq bo‘sh natija izohi chiqadi. Qidiruv bosh/oxiridagi bo‘sh joylarni e’tiborga olmaydi. Ustoz bo‘yicha filtr saqlangan.
- Tenglamadagi koeffitsiyent kiritish 1–12 oralig‘idagi butun sonlarga moslanadi.
- Kuzatish va izoh maydonlari uchun o‘zgarmaydigan accessibility nomlari qo‘shildi.

## Yangilash

7.16 uchun `supabase-chemistry-atlas.sql` ni bajargan bo‘lsangiz, **yangi SQL kerak emas**. Kodni almashtiring, mahalliy `.env` ni saqlang, `npm install` va `npm run dev` ni bajaring. Vercel’da odatdagi build/redeploy yetarli.

7.16 migratsiyasi hali bajarilmagan bo‘lsa, ZIPdagi `supabase-chemistry-atlas.sql` faylini avvalgi ishlayotgan SinfQuiz sxemasidan keyin RUN qiling. Yangi baza uchun oldingi migratsiyalar ham kerak. Tafsilotlar: `UPDATE-7.16.md`.

## Fayllar

`src/ChemistryAtlas.jsx`, `src/ChemistryScenes.jsx`, `src/chemistry-model.js` yangilandi. Yangi `src/chemistry-workflow.js` forma tekshiruvi, filtr va qoralama formatini bir joyda boshqaradi. `tests/chemistry-workflow.test.js` qo‘shildi; `tests/chemistry-browser.cjs` kengaytirildi. Versiya fayllari va README yangilandi.

## Tekshiruv

`npm test`: **75/75 test o‘tdi**. `npm run build`: muvaffaqiyatli.

Chromium’da 12 sahna, 118 element, ion/molekula hisobi, tenglama, pH, faza, ajratish, ustoz saqlashi va admin tasdig‘i tekshirildi. Qo‘shimcha: sahnadan tez chiqishda qoralama va taxminni tiklash, pagehide saqlashi, yuborilgan kuzatishni qayta ochganda tugma o‘chiqligi, bo‘sh javobning serverga yuborilmasligi, NaCl qo‘shnichiligi, laboratoriya bo‘sh qidiruvi. Mobil, tungi ko‘rinish va xaritadagi axe accessibility tekshiruvi o‘tdi.

API-lar brauzerda sinov ma’lumotlari bilan almashtirilgan. Jonli Supabase hisobiga yozilmagan. Mavjud RLS testlari ham umumiy test to‘plamida o‘tdi. Ilmiy model chegaralari o‘zgarmagan: `CHEMISTRY-SOURCES.md`.
