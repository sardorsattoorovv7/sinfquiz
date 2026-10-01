# SinfQuiz 7.15 — Audio labirint

Namuna asosida ingliz tili labirintining yangi ko‘rinishi qo‘shildi: tosh devorlar, qumli yo‘laklar, daraxtlar, suv, bola, binafsha izquvar, raqamlangan yog‘och eshiklar va yorug‘ marra. Sahna SVG orqali haqiqiy xarita kataklaridan chiziladi; dekoratsiya uchun tashqi xizmat talab qilinmaydi.

Savollar maydon ostidagi panelda ochiladi. Taymer, ovozni qayta tinglash, yordam, boshqaruv tugmalari, ovoz effektlari sozlamasi va to‘liq ekran tugmasi mavjud. Mobil va tungi ko‘rinish saqlangan. Harakatni kamaytirish sozlamasi qo‘llab-quvvatlanadi.

## O‘zgargan fayllar
- src/ScenicMaze.jsx — qayta ishlatiladigan SVG sahna va qahramonlar.
- src/scenic-maze.css — sahna, taymer, savol paneli, mobil/tungi uslublar.
- src/EnglishAudioMaze.jsx — sahnani va boshqaruvlarni ulash.
- tests/audio-maze.test.js, tests/discovery-browser.cjs — yangi sahna tekshiruvlari.
- package.json, package-lock.json, tests/vercel.test.js — 7.15.0 versiya.

## O‘rnatish
1. Amaldagi loyiha va mahalliy .env faylingizni zaxiralang.
2. Yangilangan loyiha fayllarini joylashtiring. O‘zingizning .env qiymatlaringizni saqlang.
3. `npm install`, so‘ng `npm run dev`.
4. Vercel uchun `npm run build`; mavjud Production environment qiymatlari bilan redeploy qiling.

7.14 dan yangilashda yangi SQL migratsiyasi kerak emas. Avvalgi Supabase jadvallari va ruxsatlari o‘zgarmagan. Eski versiyadan yangilayotgan bo‘lsangiz, o‘sha versiyadan keyingi mavjud migratsiyalar ham kerak bo‘lishi mumkin.

## Tekshiruv
62 avtomatik test o‘tdi. Production build muvaffaqiyatli. Chromium brauzerida barcha 5 eshik, xato javob izohi, to‘liq yo‘l, natijadagi ustoz identifikatori, yakunlangan vaqtning o‘zgarmasligi, mobil ekran, tungi rejim, sozlamalar va ovoz effektlari tekshirildi. Matematika atlasining kub modeli, hajmi, yoyilmasi va kesimi regressiya tekshiruvidan o‘tdi. API tekshiruvlari sinov ma’lumotlari bilan bajarildi; jonli Supabase hisoblariga yozilmadi. To‘liq ekran va qurilma ovozlari brauzer imkoniyatlariga bog‘liq.

7.14 dagi olti xonali kodli test reytingi tuzatishi saqlangan. Natija kelmaganida soxta 1-o‘rin ko‘rsatilmaydi.
