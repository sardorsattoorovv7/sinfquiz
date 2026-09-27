# SinfQuiz 7.8 — darslik hisoblagichi va 24 soatlik chat

## Mavjud 7.7.1 loyihani yangilash

1. Supabase Dashboard → **Integrations → Cron** bo‘limida `pg_cron` modulini yoqing. Bu matn va audio baytlarini muntazam tozalash uchun kerak.
2. SQL Editor’da ZIP ichidagi `supabase-migration-7.8.sql` faylini to‘liq **RUN** qiling. Yakunida `sinfquiz-chat-24h-purge` nomli har daqiqalik job yaratiladi. Baza xato qaytarsa, Cron yoqilganini tekshirib, faylni qayta RUN qiling.
3. ZIPdagi kodni Vercel’ga deploy qiling. Yangi env kaliti yoki alohida server kerak emas. 7.7 bazadagi darslik va natijalar saqlanadi.
4. O‘quvchi hisobida ommaviy darslikni oching. Taxminan 4–5 soniyadan keyin sanog‘i bir martaga oshadi. “Ustozga yozish” orqali matn, emoji yoki qisqa ovoz yuboring. Ustoz panelining “O‘quvchilar bilan chat” bo‘limida javob beradi.
5. Dashboard → Cron → Jobs’da `sinfquiz-chat-24h-purge` faol ekanini va History’da ishga tushayotganini tekshiring.

Yangi bo‘sh bazada `supabase-schema.sql` → `supabase-migration-7.2.sql` → `supabase-migration-7.4.sql` → `supabase-migration-7.7.sql` → `supabase-migration-7.8.sql` ketma-ketligini bajaring. 7.5 bazadan yangilansa, 7.6 migratsiyasini ham tegishli o‘rinda bajaring.

## Xavfsizlik va muddat

- Chat faqat ro‘yxatdan o‘tgan o‘quvchi va uning ommaviy darsligi muallifiga ochiladi. Kod bilan anonim kirgan o‘quvchi chatga kira olmaydi. Admin faqat shikoyat qilingan, muddati o‘tmagan xabarlarni ko‘radi.
- Xabarlar oddiy matn sifatida ko‘rsatiladi. Ovoz formati va hajmi serverda tekshiriladi (256 KB, 15 soniya). Xabar tezligi cheklangan. Ovoz boshqa fayl omboriga qo‘yilmaydi.
- Xabar yuborilganidan keyin 24 soat o‘tsa, u API’da ko‘rinmaydi; Cron odatda keyingi daqiqada matn va audio baytlarini bazadan o‘chiradi. Cron o‘chirilsa avtomatik o‘chirish ishlamaydi; shu sabab Job holatini kuzating. Supabase’ning ichki zaxira nusxalari va jurnal saqlash muddati alohida xizmat siyosatiga bog‘liq, ushbu SQL ularni o‘chirmaydi.
- Darslik sanog‘i noyob hisoblar soni. O‘quvchi darslikdan 4,5 soniyadan oldin chiqsa, hisoblanmaydi. Ustoz oynasi ochiq bo‘lsa, sanog‘i besh soniyalik bitta jamlangan so‘rov bilan yangilanadi.
