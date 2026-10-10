# 7.30 — Bilim bog‘i

## Nimalar o‘zgardi

- Bosh sahifada tayyor artist modeli: teksturali bino, tosh devor, daraxt, gullar va kichik suv yo‘li.
- Fanlar uchun o‘ng panel; kichik ekranda ikki ustunli kartalar. 6 xonali kod bilan mehmon kirishi saqlangan.
- Krem/oq va to‘q yashil interfeys, alohida tungi rejim; kontrast va fokus tekshirildi.
- Modelda aylantirish, zoom, erkin kamera va Home bilan tiklash. Avtomatik aylanish ixtiyoriy, boshlanishida o‘chiq.
- Model qurilma yukiga mos ikkita mahalliy GLB sifatida berilgan. Data Saver/yengil rejimda model foydalanuvchi xohlaganda ochiladi.
- 3D yuklanishi fanlar va test kodini to‘smaydi. Pastki modullar va barcha avvalgi manbalar saqlangan.
- Qidiruv va ommaviy sahifalar nomlari yangilandi; ijtimoiy ulashish uchun haqiqiy ekran tasviri qo‘yildi.

## Yangilash

1. Yangi ZIPni yangi papkaga oching.
2. O‘zingizning mavjud mahalliy konfiguratsiyangizni shu papkaga ko‘chiring; maxfiy qiymatlarni Gitga kiritmang.
3. Node.js 22.12 yoki yangiroq versiyada terminalni `sinf-quiz` papkasida oching.
4. `npm ci`, keyin `npm run dev` bajaring.
5. Vercel sozlamalarida mavjud Supabase/Telegram qiymatlarini saqlang. Build: `npm run build`, katalog: `dist`.

**Yangi SQL migratsiya yo‘q.** Autentifikatsiya, Supabase jadvallari, RLS, ustoz kontenti va API o‘zgartirilmadi.

## Ko‘rinish va boshqaruv

Bog‘ sahnasi tayyor CC BY modelidir. U avvalgi AI dizayn rasmining aynan nusxasi emas. Bino fanlarni ifodalaydigan oltita alohida pavilion sifatida ko‘rsatilmaydi: haqiqiy bo‘limlar fan tugmalaridan ochiladi. Suv yo‘li va o‘simliklar modelning statik qismlari; ixtiyoriy harakat kamera aylanishidir.

Mahalliy qurilma soati avtomatik yoritishni boshqaradi. Tashqi ko‘rinish va tajribadagi tun/kunduzni alohida tanlash mumkin. Harakatni kamaytirish yoqilganda avtomatik aylanish ishlamaydi.
