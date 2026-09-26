# SinfQuiz 7.5 — milliy testlarga tayyor variantlar

1. 7.4 kodini yangi ZIP bilan almashtiring. Mavjud `.env.local` yoki Vercel env qiymatlari qoladi.
2. `npm ci` va `npm run dev` (Vercel’da esa yangi deploy) qiling.
3. Administrator hisobiga kiring. Birinchi admin kirishida **Matematika — manbali algebra** va **Ingliz tili — Reading** nomli 30 savollik ikkita tasdiqlangan variant Supabase’da yaratiladi. Admin panelidagi “Milliy testlar” bo‘limida ularni ko‘rasiz.
4. Bosh sahifa → “Milliy test”. Matematika yoki Ingliz tilini tanlab, testni boshlang. Inglizcha savolda matn oynasi ochiladi; yakunda javoblar tahlili beriladi.
5. Admin bu variantlarni tahrirlashi, yopishi yoki o‘chirishi mumkin. Qayta kirganda o‘chirilgan variant avtomatik tiklanmaydi. O‘qituvchilar yaratgan boshqa variantlar o‘zgarmaydi.

7.4 bazadan yangilash uchun yangi SQL migratsiya kerak emas. Yangi loyiha bo‘lsa, avval `supabase-schema.sql`, keyin `supabase-migration-7.2.sql` va `supabase-migration-7.4.sql` bajariladi. Admin hisobida birinchi kirish uchun Supabase aloqasi va shu SQL ruxsatlari ishlashi kerak. Variantlar birinchi marta saqlanmay qolsa, admin “Milliy testlar”ni qayta ochishi mumkin; ekranda xato sababi chiqadi.

Savollar VOA Learning English va Wallace C. Boydenning public-domain kitobidagi mavjud mashqlardan moslashtirilgan. 60 ta savol mustaqil mashq bo‘limida ham bor — yangi noyob savol sifatida hisoblanmaydi. 75 ballik shkala mashq uchun xolos, rasmiy sertifikat bahosi emas. Batafsil manbalar `CONTENT-SOURCES.md` faylida.
