# Inglizcha audio labirint — 7.13

O‘yin o‘quvchiga inglizcha jumlani tinglab, uning ma’nosiga mos javob topishni mashq qildiradi. To‘g‘ri javob eshikni ochadi; harakat va audio ijro qurilmada bajariladi.

## Ishga tushirish

1. `npm ci` buyrug‘ini bering.
2. `.env.example` faylidan nusxa olib `.env.local` yarating. `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` ga loyiha qiymatlarini kiriting.
3. Supabase Dashboard → **Authentication → Sign In / Providers** ichida **Anonymous Sign-Ins** ni yoqing. O‘quvchi hisobi shart emas; guest mashqi Supabase’ning anonim Auth sessiyasidan foydalanadi.
4. Supabase SQL Editor’da `supabase-audio-maze.sql` faylini bir marta ishga tushiring. Bu fayl `documents` jadvaliga RLS siyosatlari qo‘shadi, yangi jadval yaratmaydi.
5. `npm run dev` bilan mahalliy ishga tushiring yoki Vercel’ga `main` branchni deploy qiling.

7.12 bazasi va boshqa SinfQuiz qismlari o‘zgarmaydi. Migratsiya audio labirint yo‘nalishlari uchun alohida RLS siyosatlarini qo‘shadi; boshqa `documents` to‘plamlarining mavjud siyosatlarini o‘chirmaydi.

## Nimalar qo‘shildi

- 12 ta takrorlanmaydigan oldindan hisoblangan labirint, beshtadan sakkiztagacha qulflangan eshik va A1, A2, B1 mazmunidagi 36 ta tinglash vazifasi.
- WASD, yo‘nalish tugmalari va ekrandagi sensor boshqaruvlari. Izquvar yo‘lni BFS usuli bilan qidiradi va yopiq eshikdan o‘ta olmaydi.
- Brauzerning Speech Synthesis API’si bilan inglizcha to‘liq jumla. Ovoz qurilmada sintez qilinadi; inglizcha ovozlar va sifati brauzer/qurilmaga qarab farqlanishi mumkin.
- Standart tinglash hamda tarjima va ishorali o‘rganish rejimi. Ovoz sintezi va qisqa javob effektlari alohida boshqariladi.
- O‘qituvchi/admin xaritani faollashtiradi. O‘qituvchi yozgan savollar qoralama bo‘lib saqlanadi va faqat administrator tasdiqlagach ommaga ochiladi.
- Natija foydalanuvchining joriy Auth UID’si va faol o‘qituvchi xaritasi bilan saqlanadi. O‘quvchi o‘z natijasini, o‘qituvchi faqat o‘z xaritasiga tegishli natijalarni, admin esa boshqaruv uchun umumiy natijalarni ko‘ra oladi.

## Xarita manbasi va litsenziya

12 ta xarita SinfQuiz uchun alohida, oldindan tayyorlangan tekis katakli joylashuvlardir; ular tashqi loyiha aktivlari sifatida ko‘chirilmagan. Labirint yaratish yondashuvini o‘rganish uchun [emadehsan/maze](https://github.com/emadehsan/maze) loyihasidagi randomizatsiyalangan Prim usuli ko‘rib chiqilgan; uning kodi MIT litsenziyasida. Savollar va matnlar SinfQuiz uchun yozilgan.

## Ma’lumotlar xavfsizligi

- Ommaviy savollar `approvalStatus='approved'` va `visibility='public'` bo‘lmaguncha o‘quvchilarga yuborilmaydi.
- Faollashtirish hujjati faqat uni yaratgan o‘qituvchiga tegishli. Bir o‘qituvchi boshqasining faol xaritasi yoki natijasini o‘zgartira olmaydi.
- Natija kiritish uchun aynan shu `ownerId` va `levelId` juftligidagi faol xarita bo‘lishi shart. O‘quvchi o‘zi yuborgan natijani keyin tahrirlay olmaydi.
- Savollar anonim o‘yinchiga berilganda javob raqami UI javob holatini tekshirish uchun ishlatiladi. Brauzerda bajariladigan har qanday mashqni mutlaq aldashga chidamli imtihon deb bo‘lmaydi; natija o‘quv mashqi uchun mo‘ljallangan.
