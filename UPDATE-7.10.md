# SinfQuiz 7.10: 1v1 va Python darslari

## Mavjud loyiha uchun yangilash

1. ZIPdagi loyiha fayllarini mavjud loyiha ustiga ko‘chiring. Mahalliy `.env.local` va Vercel Environment Variables qiymatlarini saqlang. Maxfiy kalitlarni gitga qo‘shmang.
2. `npm ci`, `npm test` va `npm run build` ni bajaring. So‘ng GitHubga yuboring va Vercelda yangi Production deployment tayyor bo‘lishini kuting. Eski deploymentni qayta deploy qilish yangi kodni olmaydi.
3. Supabase SQL Editor’da oldin qo‘llagan sxemani qayta ishga tushirish shart emas. Poyga tuzatishi JavaScript yangilanishidir. Agar loyihangizda `sq_update` siyosatining `live` qoidasi umuman bo‘lmasa, ZIPdagi `supabase-schema.sql` bilan sxemani solishtiring; eskirgan bazani alohida migratsiya bilan moslang.
4. Admin hisobiga kiring. **Darsliklar** ichida Python bo‘limidagi 20 darsning bir marta qo‘shilganini tekshiring. Eski 28 dars va qo‘lda tahrirlangan darslar saqlanadi. O‘quvchi hisobida (email yoki Telegram) **Darsliklar → Video darslar** bo‘limini ochib ko‘ring.
5. Ustoz 6 xonali testini tanlab kamida ikkita savolni 1v1 poygaga biriktirsin, keyin **Poygani ochish**ni bossin. Bosh sahifadan ikki ismni kiritib poygaga qo‘shiling. Ikki yo‘lakdagi savollar navbati farq qiladi; to‘g‘ri javob har bir yuguruvchini oldinga olib boradi.

## Nima o‘zgardi?

- Mehmonning faol poyga satri avval `upsert` orqali saqlangan: Supabase uni `INSERT` deb ham tekshirgan va mehmon uchun yozish rad etilgan. Endi mavjud satr `UPDATE` bilan yangilanadi va qaytgan satr tekshiriladi.
- Python uchun 20 ta bosqichli, original dars va 40 ta dars ichidagi tekshiruv savoli qo‘shildi. Kod namunalarining natijalari Python interpreteri bilan tekshirilgan.
- Tayyor Python testi 15 mavzuli savolga yangilandi. Eski shablonning savollari o‘zgarmagan bo‘lsa yangilanadi; ustoz tahriri avtomatik almashtirilmaydi.
- Darslik kartalari va matnida emoji o‘rniga oddiy belgi va mavzu nomlari ishlatiladi. Video bo‘limi hozircha bo‘sh va ochiq yozuv bilan ko‘rsatiladi.

Bu muhitda haqiqiy Supabase loyihasining login va Realtime sessiyasini sinash uchun hisobga kirish mavjud emas. PostgreSQL ruxsat qoidasi bilan mehmonning `UPDATE` va `UPSERT` holatlari alohida tekshirildi; Vercelda yuqoridagi 1v1 sinovini bajaring.
