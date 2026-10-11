# SinfQuiz 7.29.0 — SQL va kodni birga yangilash

Ishlayotgan 7.28.0 bazasida Supabase SQL Editor’da faqat **supabase-migration-7.29.sql** faylini to‘liq RUN qiling. 7.27.0 uchun avval 7.28, keyin 7.29 bajariladi. Baza eskiroq bo‘lsa yetishmagan fayllarni quyidagi tartibdan oling; ishlab turgan bazaga hamma eski skriptlarni qayta qo‘llamang.

So‘ng terminalda `npm ci`, `npm run dev` bajaring. Vercel’da kod yangilanganidan keyin qayta deploy qiling. `.env.local` va Vercel muhitidagi o‘z qiymatlaringiz saqlansin. Bu relizga maxfiy kalitni brauzerga qo‘shish kerak emas. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ishlashda davom etadi. Kodli quiz, typing va 1v1 mehmonlari uchun Anonymous Sign-Ins yoqilgan bo‘lsin; milliy testlar mavjud hisob orqali ochiladi.

## 7.29 migratsiyasidan keyin

- Mavjud musobaqalar o‘z ketma-ket tartibida davom etadi. Ularning natijalari va boshlashdagi tarkibi saqlanadi.
- Yangi musobaqada “Ishtirokchi o‘zi tanlaydi” oldindan tanlangan. Bosqichlar ustoz navbati bilan ochilishi ham mavjud.
- Har bosqichning taymeri ishtirokchi uni birinchi ochganda boshlanadi. Almashtirish yoki sahifani qayta ochish vaqtni qaytarmaydi.
- Vaqt tugaganda muddatgacha serverga saqlangan joriy ish baholanadi; qolgan savollar 0 ball. Natija va reyting serverda hisoblanadi.
- Yangi uch savol to‘plami musobaqa katalogida ko‘rinadi; ustozning shaxsiy nusxalari keyingi katalog yuklanishida qo‘shiladi. Boshqa ustozning savollari bilan aralashmaydi.
- Cron, yangi maxfiy kalit yoki qo‘shimcha server o‘rnatish talab qilinmaydi.

## 7.28dan yangilanganda eslatmalar

- Ustoz typing va 1v1 xonasini qayta ochadi. Eski global xonalar yopiladi; yangi xonalar har bir ustozga alohida tegishli.
- O‘quvchi ustoz ismi va xona kodi orqali to‘g‘ri xonani tanlaydi. Bir nechta xona bo‘lsa tanlov majburiy.
- Natijalari saqlangan quizlar, darsliklar va milliy bo‘limlar o‘chirilmaydi. Eski typing/milliy natijalar tekshirilmagan mashq sifatida profil tarixida qoladi; yangi typing reytingi faqat server sessiyasidagi natijalarni oladi.
- Agar ikkita faol test bir xil PIN ishlatgan bo‘lsa, bittasiga yangi PIN ajratiladi. Ustoz panelidagi amaldagi PINni o‘quvchiga bering. Oldingi PIN `previousPin` maydonida qayd etiladi.
- Ochilgan eski typing/milliy sessiyalar qayta boshlanadi. Qoralama doska, rasmlar va sahifalar shu hisobning brauzerida saqlanadi.

## Yangi Supabase loyiha uchun aniq tartib

Quyidagi fayllarni bittadan, tartib bilan RUN qiling. CEFRning o‘nta varianti 01–12 fayllarga, English kursi esa 01–18 fayllarga bo‘lingan; har bir bo‘lak 150 KBdan kichik. Ular ZIPda tayyor. Cron o‘chirilgan bo‘lsa ham chat skripti xatosiz tugaydi. Chatdagi 24 soatlik o‘qish cheklovi ishlaydi; yozuvlarni avtomatik jismonan tozalash uchun Supabase Database → Extensions’da pg_cronni yoqing. Supabase’dagi `auth` va `storage` tizim jadvallari platforma tomonidan yaratiladi.

1. `supabase-schema.sql`
2. `supabase-migration-7.2.sql`
3. `supabase-migration-7.4.sql`
4. `sql/cefr-7.7/01-schema.sql`
5. `sql/cefr-7.7/02-mock.sql`
6. `sql/cefr-7.7/03-mock.sql`
7. `sql/cefr-7.7/04-mock.sql`
8. `sql/cefr-7.7/05-mock.sql`
9. `sql/cefr-7.7/06-mock.sql`
10. `sql/cefr-7.7/07-mock.sql`
11. `sql/cefr-7.7/08-mock.sql`
12. `sql/cefr-7.7/09-mock.sql`
13. `sql/cefr-7.7/10-mock.sql`
14. `sql/cefr-7.7/11-mock.sql`
15. `sql/cefr-7.7/12-finish.sql`
16. `supabase-cefr-results-fix.sql`
17. `supabase-migration-7.8-fixed.sql`
18. `supabase-migration-7.9.sql`
19. `supabase-math-atlas.sql`
20. `supabase-audio-maze.sql`
21. `supabase-chemistry-atlas.sql`
22. `supabase-chemistry-labs.sql`
23. `supabase-biology-atlas.sql`
24. `supabase-migration-7.20.sql`
25. `supabase-migration-7.22.sql`
26. `sql/english-7.23/01-schema.sql`
27. `sql/english-7.23/02-lessons.sql`
28. `sql/english-7.23/03-lessons.sql`
29. `sql/english-7.23/04-lessons.sql`
30. `sql/english-7.23/05-lessons.sql`
31. `sql/english-7.23/06-lessons.sql`
32. `sql/english-7.23/07-lessons.sql`
33. `sql/english-7.23/08-lessons.sql`
34. `sql/english-7.23/09-lessons.sql`
35. `sql/english-7.23/10-lessons.sql`
36. `sql/english-7.23/11-lessons.sql`
37. `sql/english-7.23/12-lessons.sql`
38. `sql/english-7.23/13-lessons.sql`
39. `sql/english-7.23/14-lessons.sql`
40. `sql/english-7.23/15-lessons.sql`
41. `sql/english-7.23/16-lessons.sql`
42. `sql/english-7.23/17-lessons.sql`
43. `sql/english-7.23/18-lessons.sql`
44. `supabase-migration-7.23.1.sql`
45. `supabase-migration-7.24.sql`
46. `supabase-migration-7.25.sql`
47. `supabase-migration-7.26.2.sql`
48. `supabase-migration-7.28.sql`
49. `supabase-migration-7.29.sql`

## Ruxsat yoki funksiya xatosi

`supabase-migration-7.6.sql`ni ruxsatni ochish uchun qayta RUN qilmang. Yangi yozuvlar faqat RPC orqali saqlanadi: eski to‘g‘ridan-to‘g‘ri natija yozish xatosi xavfsizlik cheklovi hisoblanadi. O‘z rolingiz, kontent egasi va yangilanish tartibini tekshiring. So‘nggi 7.29 SQL tranzaksiyasi muvaffaqiyatli tugaganini quyidagicha ko‘ring:

```sql
select public.sq_schema_status();
```

Natijada `version: 7.29.0`, `secureActivities: true`, `competitionFreeOrder: true` va `stageDraftGrading: true` chiqadi. Eski permissive siyosat tiklansa ham qo‘shimcha restrictive siyosat javoblar va natija yozishni himoya qiladi. Biroq eski migratsiyani qayta qo‘llash yangi funksiyalarni almashtirishi mumkin; oxirida tegishli 7.28 va 7.29 yangilanishlarini qo‘llang.

## Python bahosi

Python muhiti va `.py` yuklash ishlashda davom etadi. Hozir serverda alohida xavfsiz Python bajaruvchisi mavjud emas. Brauzer yuborgan stdout isbot bo‘lmagani uchun Python topshirig‘i mashq sifatida ko‘rsatiladi va reyting balli olmaydi. Quiz/Office/test va typing baholari server tomonidan tekshiriladi. Bu real imtihonda plagiat yoki tashqi yordamni aniqlaydigan proktorlik tizimi emas.
