# Speaking sinovini ochishdagi xato

2026-11-04 yakuniy holat tekshirildi. Lokal API 200 qaytarmoqda, provider sozlangan.

## Sabab va tuzatish

Jonli sinovda Supabase so‘rovlari ba’zan `UND_ERR_CONNECT_TIMEOUT` va `ECONNRESET` bilan uzildi. Savol taymerini saqlashdagi yo‘qolgan javob umumiy saqlash xatosiga aylangan. Hisobda avval boshlangan savolning vaqti ham tugagan edi.

- Server o‘qish so‘rovlariga cheklangan qayta urinish va kutish muddati qo‘shildi.
- Yangi savol/audio kabi `insert` yozuvlari avvalgi kaliti bilan xavfsiz qayta yuboriladi. Taymer qayta boshlanmaydi.
- Javobi yo‘qolgan tahrir bazadan tekshiriladi; saqlangan javob va revision ikki marta yozilmaydi. Parallel o‘zgarishlar himoyasi saqlanadi.
- Limit hisoblagichlari avtomatik qayta yozilmaydi. Tarmoq xatosi noto‘g‘ri parol yoki migratsiya xatosi sifatida ko‘rsatilmaydi.
- Brauzer sessiyani o‘qishdagi vaqtinchalik uzilishni qayta tekshiradi. Javob yuborish kabi amallar nazoratsiz takrorlanmaydi.
- Vaqti tugagan savolda ishlamaydigan mikrofon tugmasi o‘rniga aniq holat va **Yangi sinov boshlash** tugmasi bor. Tasdiqlanganda eski sinov tarixda tugallanmagan sifatida qoladi; yangi sinov oldidan mikrofon va rozilik oynasi ochiladi.
- Saqlangan audio, savol vaqti tugagan bo‘lsa ham, yuborilishi mumkin.
- Lokal web server va Speaking worker qayta ishga tushirildi.

## Tekshiruvlar

**72/72 tegishli test va production build o‘tdi.** Qaydlar: `qa-speaking-fix/tests.txt`, `qa-speaking-fix/build.log`.

Alohida vaqtinchalik hisobda haqiqiy Supabase va localhost API orqali profil → sinov → birinchi savol → sessiyaga qaytish → private audio yuklash → javobni saqlash → keyingi savol oqimi o‘tdi. Takroriy yuborishda javob yoki savol navbati ikki marta oshmadi. Sinov hisobi va audiosi tozalandi. Natija: `qa-speaking-fix/live-result.json`.

Jonli transport sinovida sintetik PCM WAV ishlatildi. Bu tekshiruv inson nutqini AI bilan to‘liq baholash natijasi emas. Groq ulanishi va JSON javobi alohida runtime tekshiruvidan o‘tgan.

Haqiqiy brauzerda mavjud sinov ochildi va vaqti tugagan savoldan yangi sinovga o‘tish tugmasi tekshirildi. Tasvir: `qa-speaking-fix/recovery.jpg`.

Ochish: `http://localhost:5173/#ai-speaking`. Qayta ishga tushirish: `node scripts/dev-ai.mjs`.
