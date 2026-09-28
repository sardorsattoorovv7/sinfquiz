# SinfQuiz 7.9 — profil va natijalar tarixi

## Yangilash

1. ZIP ichidagi loyiha bilan Vercel deployni yangilang.
2. Supabase Dashboard → **SQL Editor** da `supabase-migration-7.9.sql` faylini ochib **RUN** qiling. 7.8 SQL oldin bajarilgan bo‘lishi kerak. Migratsiya qayta ishlatilsa ham xavfsiz.
3. Vercel → Environment Variables da `SUPABASE_SERVICE_ROLE_KEY` borligini tekshiring. Bu maxfiy kalit avval Telegram login uchun ham kerak edi; uni **VITE_** bilan boshlamang, brauzerga joylamang. O‘zgartirsangiz qayta deploy qiling.
4. Admin hisobida **Foydalanuvchilar** → email hisob qatori → **Yangilash** ni sinang. Tasodifiy yaratilgan parol faqat bir marta ekranda ko‘rinadi. Uni hisob egasiga shaxsan yetkazing.
5. O‘quvchi hisobida **Profilim** bo‘limida ism, maktab, sinf va parolni yangilang. Natijalar bo‘limini oching. Email hisobida parolni o‘zgartirish uchun joriy parol so‘raladi. Telegram hisobida Telegram orqali kirish davom etadi.

## Natijalar haqida

- Kodli sinf testi, typing va milliy test natijalari avvalgi yozuvlardan, CEFR natijalari shaxsiy CEFR jadvalidan olinadi.
- Mustaqil mashqlarning yangi natijalari `practiceResults` ga yoziladi; 1v1 poyga yakunlari `raceResults` ga avtomatik ko‘chadi. RLS har bir hisobga o‘z natijasini ko‘rsatadi.
- Shu brauzerda avval bajarilgan mustaqil mashqlar tarixi profilga qo‘shib ko‘rsatiladi. Hisobga kirmasdan ilgari ishlangan kodli test yoki typing natijasini keyin biror email hisobiga xavfsiz bog‘lab bo‘lmaydi.
- Bir monitordagi 1v1 poygada ikkala ishtirokchi bir hisob bilan kirgan bo‘lsa, ikkala natija shu hisobda ismlari bilan ko‘rinadi.
- O‘qituvchi test natijalarini o‘chirsa yoki typing tarixini tozalasa, tegishli yozuv profil tarixidan ham ketadi.

## Tekshiruv

`npm run build` va `npm test` bajariladi. SQL migratsiya maxsus PostgreSQL sinovida ishlatilib, begona hisob natijalariga kirish rad etilishi tekshiriladi. Jonli Supabase/Vercel loyihangizda deploy va SQL qadamlarini o‘zingiz bajarishingiz kerak.
