# SinfQuiz 7.3 ga yangilash

1. ZIP’ni alohida papkaga oching va mavjud `.env.local` qiymatlaringizni kiriting.
2. Terminalda `npm ci`, keyin `npm run dev` bajaring.
3. Bosh sahifa → **Tayyor testlar**: English, matematika yoki Python’ni tanlang.
4. Python’ni sinfga berish: **O‘qituvchi paneli → Sinf testlarim → Tayyor savollar to‘plami → Python → Saqlash**. So‘ng faollashtirib 6 xonali kodni o‘quvchilarga bering.
5. Avvalgi 7.2 bazada yangi SQL yo‘q. 7.0/7.1 dan o‘tsangiz `supabase-migration-7.2.sql` ni RUN qiling.
6. `npm test` va `npm run build` dan keyin Vercel’da yangi kodni deploy qiling. Python testini terminalda tekshirish uchun Python 3 kerak; saytda ishlash uchun kerak emas.

75 ta noyob savol bor. Aralash variantlar alohida mavzulardagi savollarni birlashtiradi. Mustaqil testlar qurilmada ishlaydi va natijalar shu brauzerda saqlanadi. Ustozning kodli test natijalari mavjud Supabase tizimida qoladi.

Ingliz tili bo‘limi Reading mashqlaridir. 10 ta to‘liq CEFR mock, haqiqiy Listening audio to‘plami va rasmiy baholash hali qo‘shilmagan.
