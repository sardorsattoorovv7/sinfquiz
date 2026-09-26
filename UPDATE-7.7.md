# SinfQuiz 7.7 — 10 ta CEFR / Multilevel mockni yoqish

## Mavjud 7.6 loyiha

1. ZIP ichidagi `supabase-migration-7.7.sql` ni Supabase **SQL Editor**ga joylang va **RUN** qiling. Fayl 10 variantni serverdagi xususiy bankka qo‘shadi; mavjud o‘quvchi natijalarini o‘chirmaydi.
2. ZIPdagi yangi loyiha kodini Vercel’ga deploy qiling. Avvalgi Supabase URL/key sozlamalari saqlanadi. `public/cefr-audio` papkasi deployga kirganini tekshiring.
3. Admin hisobida saytga kiring va **Administrator paneli → CEFR / Multilevel** ni bir marta oching. 10 variant e’lon qilinadi. Keyingi ochishda nusxalari qayta qo‘shilmaydi.
4. O‘quvchi hisobida **CEFR / Multilevel** ni oching, variantni tanlang va Listening audiosini eshiting. Admin Speaking/Writing javoblarini **Natijalar** orqali baholaydi.

Oldingi bazada 7.4 CEFR jadvali yo‘q bo‘lsa, avval `supabase-migration-7.4.sql` ni bajaring. 7.5 dan kelsangiz, reyting o‘zgarishlari uchun 7.6 migratsiyasi ham kerak. Yangi bo‘sh bazada `supabase-schema.sql` → `supabase-migration-7.2.sql` → `supabase-migration-7.4.sql` → `supabase-migration-7.7.sql` ketma-ketligi ishlatiladi.

## Tarkib va baholash

Har bir variant: 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. 60 MP3 sun’iy ovoz bilan saytdan yetkaziladi. Listening va Reading javoblari serverda tekshiriladi; Writing va Speakingga admin mashq bahosi va izoh beradi. Rasmiy CEFR daraja, Rasch balli yoki sertifikat chiqarilmaydi. Savollar original imtihon uslubidagi mashqlar, real kelajak imtihonining oldindan ma’lum savollari emas.

SQL xatolansa, Supabase SQL Editor ko‘rsatgan to‘liq xato matnini tekshiring. **CEFR oynasida variantlarni yuklab bo‘lmadi** chiqsa, 7.7 migratsiyasi aynan sayt ulanayotgan Supabase loyihasida bajarilganini va admin huquqini tekshiring. Audio 404 bo‘lsa, Vercel deployidagi `cefr-audio` fayllarini tekshiring.
