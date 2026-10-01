# SinfQuiz 7.14.0 — tekshiruv natijalari

- `npm test`: **62 / 62 PASS**, 0 xato.
- `npm run build`: **PASS**. Lucide paketining `use client` direktivasi haqida Vite ogohlantirishi bor; yig‘ma muvaffaqiyatli yaratildi.
- `tests/discovery-browser.cjs`: **PASS**, haqiqiy Chromium/WebGL renderer.
- WebGL modellar ochilishi, kub hajmi (a=4 → V=64), yoyilma va kesim, aylantirish/chizma almashinuvi tekshirildi.
- 390 px mobil ekran va 1440 px kompyuter ekranida maket tekshirildi. Sahifa eni ekrandan chiqmaydi.
- Tungi rejim va WebGL o‘chirilgan holatdagi SVG chizma tekshirildi.
- Labirintning 5 ta eshigi ochildi, bitta noto‘g‘ri javobga fikr-mulohaza tekshirildi, marra va natija qaydi tekshirildi.
- Bir xil xaritani faollashtirgan ikki ustozdan ikkinchisi tanlanib, natijadagi `ownerId` aynan ikkinchi ustozniki ekani tekshirildi.
- Yakunlangan labirint natijasidagi vaqt o‘zgarmasligi tekshirildi.
- 6 xonali test natijasida eski Supabase qatorlari bilan uch o‘quvchining o‘rni mos ravishda 1, 2, 3. Reyting yo‘q bo‘lsa 1-o‘rin chiqarilmaydi.
- 55 atlas sahnasi, hisoblar va mavjud RLS/typing/1v1/Python regressiyalari avtomatik testlar tarkibida bajarildi.

API tekshiruvlari nazorat qilinadigan javoblar bilan bajarilgan. Jonli Supabase hisoblari yoki production bazaga o‘zgartirish kiritilmadi. RLS Postgres-mos PGlite sinov bazasida tekshirildi. Skrinshotlar `previews/` papkasida.
