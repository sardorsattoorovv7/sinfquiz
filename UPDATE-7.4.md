# SinfQuiz 7.4 — CEFR admin bo‘limi

## Ishga tushirish

1. ZIP’ni yangi papkaga oching. Eski `.env.local` qiymatlaringizni ko‘chiring.
2. Supabase → SQL Editor → New query. ZIP ichidagi **supabase-migration-7.4.sql** matnini to‘liq joylang va **RUN** bosing. 7.2/7.3 bazada boshqa SQL kerak emas. Yangi loyiha bo‘lsa, avval `supabase-schema.sql` va `supabase-migration-7.2.sql` bajariladi.
3. VS Code terminalida `npm ci`, so‘ng `npm run dev` bajaring.
4. Administrator hisobida kiring → **CEFR / Multilevel**.
5. **Multilevel shabloni** yoki **Qisqa mashq yaratish**ni tanlang.
6. Variant nomi, darajasi, matnlar, savollar, javoblar, izohlar va manbalarni kiriting. Listening’ga to‘g‘ridan-to‘g‘ri ishlaydigan HTTPS audio URL bering; muharrirdagi player’da sinab ko‘ring. YouTube sahifasi URL’i audio fayl emas.
7. **Qoralamani saqlash → Variantlar → E’lon qilish**. To‘liq bo‘lmagan variantni server ham e’lon qilmaydi.
8. O‘quvchi bosh sahifadagi **CEFR / Multilevel** orqali kiradi. O‘zi PDF yoki savol fayli yuklamaydi.
9. Topshirilgan Writing/Speaking ishlari **Tekshirish** oynasida ko‘rinadi. Audio yozuvni tinglang, 0–75 oralig‘ida mashq bahosi va izoh kiriting.
10. Vercel’da yangi kodni deploy qiling. Yangi env kaliti kerak emas; mavjud Supabase sozlamalari ishlatiladi.

## Ishlash tartibi

- CEFR variant yaratish va baholash bu versiyada faqat administrator uchun. Oddiy ustozning sinf testlariga aralashmaydi.
- Multilevel shabloni: Listening 6 qism/35 savol; Reading 5 qism/35 savol; Writing 3 topshiriq; Speaking 4 qism. Maqsadli B1/B2/C1 — variant belgisi, o‘quvchining tayyor sertifikat bahosi emas.
- Bo‘limlar ketma-ket ishlanadi; topshirilgan bo‘limga qaytib bo‘lmaydi. “Tugatish” testni muddatidan oldin ham topshiradi.
- Taymer serverda tekshiriladi. Internet uzilsa qurilma javoblari saqlanadi; ularni muddat tugamasdan serverga yuborish kerak. Vaqt serverda tugagach kechikkan javoblar qabul qilinmaydi.
- Audio takror tinglanishi mumkin — bu mashq rejimi. Bu jihatdan rasmiy nazoratli imtihonning aynan nusxasi emas.
- Speaking: HTTPS yoki localhost’da mikrofon ruxsati kerak. Yozib bo‘lgach **Audioni topshirish**ni bosing. Mikrofon ishlamasa, audio fayl tanlang. Har fayl 20 MB gacha; browser qo‘llaydigan MP3, WAV, M4A, WebM/Ogg ishlatiladi.
- Javoblar va natijalar foydalanuvchi ID’siga bog‘langan. Faqat o‘z sessiyasi ochiladi. Admin variantni tahrir qilganda boshlangan sessiyalarning matni/kaliti o‘zgarmaydi.
- “Yopish” yangi boshlashni to‘xtatadi; boshlangan sessiyani o‘chirmaydi. Bitta o‘quvchida bir paytning o‘zida bitta faol CEFR sessiyasi bo‘ladi.
- Fayllar xususiy `cefr-recordings` bucket’da turadi. Bu migratsiya foydalanuvchining boshqa fayllariga ruxsat bermaydi. Audio saqlash hajmi Supabase tarifingizdan foydalanadi.

## Nima hali yo‘q

Bu paket 10 ta tayyor rasmiy mock bilan to‘ldirilmagan. Admin muharriri, o‘quvchi ishlash tizimi va baholash oynasi qo‘shildi; variant savollari va audiolarini admin kiritadi. Sayt rasmiy Rasch kalibrovkasi yoki sertifikat darajasini hisoblamaydi. Avvalgi 75 ta tayyor savol, Python, typing va 1v1 saqlangan.

## Tekshiruv

`npm test` va `npm run build`.

CEFR uchun PostgreSQL (PGlite) sinovi: admin ruxsati, kalitlarning yashirilishi, o‘zga sessiyani bloklash, kechikkan javob, bo‘limni qulflash, variant tahririda sessiyani saqlash, baholash va audio uchun RLS. UI sinovi: tahrirlash/e’lon qilish, javob saqlash/tiklash, bo‘lim topshirish va bahoni ko‘rish. Live Supabase, haqiqiy mikrofon va mobil browser ijrosi alohida tekshirilmagan.

Format uchun tayanch: https://uzbmb.uz/page/test_sinovlari_formati va https://uzbmb.uz/page/cefr_speaking . Bu sahifalardagi savollar ko‘chirilmadi; shablon to‘ldirish uchun tuzilma sifatida berilgan.
