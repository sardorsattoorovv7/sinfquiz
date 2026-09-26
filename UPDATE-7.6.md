# SinfQuiz 7.6 — reytingni ustoz va test bo‘yicha ajratish

1. Supabase Dashboard → **SQL Editor → New query** ni oching. ZIP ichidagi `supabase-migration-7.6.sql` matnini to‘liq joylashtirib **RUN** bosing. Xatolik bo‘lmasa eski o‘quvchilar natijalari yangi ixcham reytingga ko‘chiriladi.
2. Vercel’da yangi ZIPdagi kodni deploy qiling. Eski `.env.local` / Vercel env qiymatlarini saqlang. `npm ci && npm run build` ham bajariladi.
3. Ikki ustoz hisobida tekshiring: birinchi ustozning test natijasi ikkinchisida chiqmasin. Ikki o‘quvchi bir testga kirsa, faqat shu testning ism va ball reytingi yangilansin.

Yangi Supabase loyihasi bo‘lsa, `supabase-schema.sql` 7.6 qoidasini o‘z ichiga oladi; so‘ng 7.2 va 7.4 SQL migratsiyalarini ishga tushiring. 7.6 migratsiyasini yana bir marta bajarish xavfsiz. Agar eski `supabase-schema.sql` faylini keyinchalik qayta RUN qilsangiz, 7.6 migratsiyasini oxirida yana bajaring.

Yangi indeks va bitta ixcham reyting hujjati javoblar paytida o‘quvchiga butun `players` ro‘yxatini qayta olib kelmaydi. Ustoz oynasida ham xabarlar avval keraksiz alohida ro‘yxat so‘rovini qo‘zg‘atmaydi. Bu o‘zgarish internet kechikishini butunlay yo‘qotmaydi, lekin keraksiz almashinuvni kamaytiradi.
