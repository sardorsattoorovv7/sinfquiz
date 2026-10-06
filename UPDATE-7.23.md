# SinfQuiz 7.23 — Ingliz tili darsi

**7.23.1 ZIPi uchun:** 7.23 bazani yangilash tartibi [UPDATE-7.23.1.md](UPDATE-7.23.1.md)da. Quyidagi matn dastlabki 7.23 kursini o‘rnatishga tegishli; ZIPdagi to‘liq 7.23 SQLga 7.23.1 tuzatishlari ham kiritilgan.

To‘liq loyiha, patch emas. `package.json` versiyasi 7.23.0. Informatika, Python, Word/Excel/PowerPoint amaliyoti, Matematika/Kimyo/Biologiya atlaslari, Ingliz tili labirinti, chat, musobaqa, quiz, typing, profil va 1v1 poyga saqlangan.

## Ishlayotgan 7.22 loyihani yangilash

1. ZIPni oching. Ish papkasi: **sinf-quiz**. O‘zingizning `.env` yoki `.env.local` qiymatlaringizni saqlang; ZIPda maxfiy kalitlar yo‘q.
2. Supabase → **SQL Editor** → yangi query. **supabase-migration-7.23.sql** faylini to‘liq joylang va **RUN** qiling. Faylning ichida schema, RPC, storage siyosatlari va barcha 108 dars seed’i bor. Qayta bajarish mavjud dars versiyalari va o‘quvchi natijalarini o‘chirmaydi.
3. Terminalda loyiha papkasidan:

   ```sh
   npm ci
   npm run dev
   ```

   Node.js 22.12 yoki yangirog‘i kerak. Terminaldagi Local manzilni oching va terminalni ishlab turgan holatda qoldiring.
4. Bosh menyu yoki bosh sahifadagi **Ingliz tili darsi** tugmasini bosing. Bevosita manzil: `/#ingliz-darsi`. O‘quvchi avval **Darajamni aniqlash**ni bajaradi.
5. Vercel uchun:

   ```sh
   npm test
   npm run build
   ```

   Yangilangan kodni deploy qiling. Supabase URL/publishable key avvalgidek qoladi. Vercel Environment Variables o‘zgarsa, yangi build/deploy kerak.

**SQL interfeysni o‘zi yangilamaydi.** Migratsiya bilan yangi React kodini birga o‘rnating. Ishlayotgan bazani qayta yaratish kerak emas. 7.23 yangi server kaliti yoki Cron kengaytmasini talab qilmaydi.

Yangi yoki eski loyiha bo‘lsa, avval **SUPABASE-VERCEL.md**, **UPDATE-7.20.md** va **UPDATE-7.22.md** dagi baza/guruh migratsiyalari tartibini bajaring. 7.23 mavjud `sq_class_groups`, `sq_class_members`, `documents`, `sq_is_teacher()` va `sq_is_admin()`ni ishlatadi.

## Kirish va sozlamalar

- Email/Telegram oqimi o‘zgarmagan. Kursga yangi majburiy ro‘yxatdan o‘tish qo‘shilmagan.
- Mehmon o‘quvchi uchun Supabase **Authentication → Sign In / Providers → Anonymous Sign-Ins** yoqilgan bo‘lsin. U o‘chirilgan bo‘lsa, mavjud hisobdan kirish mumkin.
- Brauzer uchun avvalgi `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` yetarli. Publishable key ham shu ikkinchi maydonda ishlaydi. Maxfiy kalitlarni `VITE_` nomiga yozmang.
- Mikrofon localhost yoki HTTPSda ishlaydi. Ruxsat faqat **Ovoz yozish** bosilganda so‘raladi.
- **english-recordings** xususiy bucket migratsiya bilan ochiladi. Upload 12 MB gacha; yozish 4 daqiqagacha. Avval brauzerga yoziladi, **Yozuvni yuborish** bosilmaguncha serverga yuklanmaydi.
- Mikrofon o‘rniga **Jonli ustoz tekshiruvi** bor. Bu avtomatik baho emas: ustoz amaliy suhbatdan so‘ng rubrika beradi.

## O‘quvchi oqimi

Daraja testi → birinchi ochiq dars → ko‘rib tushunish → lug‘at/talaffuz → grammatika → listening → reading → writing → speaking → chiqish tekshiruvi → ustoz bahosi.

Quyi darajalar placement orqali o‘tilgan bo‘lsa, **Test orqali o‘tilgan** deb ko‘rsatiladi. Bu darsma-dars o‘zlashtirish emas. Yuqori placement natijasi amaliy writing/speaking dalilisiz ko‘pi bilan A2 ni ochadi. C1 ni faqat variantli test bilan ochish mumkin emas.

Standart mezon 80%. Keyingi dars uchun majburiy o‘rganish/listening, barcha mashqlar, chiqish tekshiruvi va writing/speaking ustoz bahosi kerak. Har 4-darsda oldingi uch mavzudan aralash tekshiruv bor. Daraja yakunida barcha majburiy darslar va reading/listening/grammar/vocabulary hamda writing/speaking mezonlari tekshiriladi. Past natija ilgari o‘zlashtirilgan darslarni avtomatik yopmaydi.

## Ustoz va admin

**Ingliz tili darsi → Ustoz boshqaruvi**:

1. Mavjud guruhni tanlang yoki guruh yarating. Guruh kodi 10 belgili; kursdagi o‘quvchi ism va kod bilan ulanadi.
2. Faol kontent versiyasi, guruh, muddat va mezonni tanlab dars biriktiring. Muddat o‘quvchi kartasida ko‘rinadi; kursdagi kech topshirish avtomatik bloklanmaydi.
3. Topshirilgan ishni oching. Writing va speaking uchun to‘rttadan mezon, har biri 0–5. Mazmunli feedback yozing.
4. Past mezonda **Qayta ishlash kerak**, mezonga yetganda **O‘zlashtirilgan** holati chiqadi. O‘quvchi qayta yozib topshiradi; oldingi topshirilgan variant saqlanadi.
5. Darsni tahrirlang: oddiy maydonlar yoki to‘liq JSON modeli. Ustoz nusxasi shaxsiy; admin umumiy versiyani yangilashi mumkin. Qoralama biriktirilmaydi. Boshlangan ish immutable snapshotda qoladi.
6. Amaliy baholash asosida darajani o‘zgartirish zarur bo‘lsa, sabab yozing. O‘zgarish auditda saqlanadi.

Admin modul faolligini va standart mezonni boshqaradi. Ustoz faqat o‘z guruh a’zolarining ishlarini ko‘radi; admin umumiy boshqaruvga ega. Guruhga biriktirishning o‘zi yuqori daraja qulfini chetlab o‘tmaydi.

## Kontentni qayta tayyorlash

Tayyor ZIPda audio ham bor, ishlab chiqarish serverida FFmpeg kerak emas.

```sh
node scripts/build-english-course.mjs
```

Bu katalog, to‘liq ma’lumot modeli, seed va yagona 7.23 migratsiyasini `data/english-course/`dan yig‘adi. Nashr qilingan v1 seed qayta RUN qilinganda almashtirilmaydi. Kontent tuzatishini ustoz/admin muharriridagi yangi versiya sifatida saqlang.

Audio qayta yaratish uchun Python 3, FFmpegning Flite filtri va ffprobe kerak:

```sh
python scripts/generate-english-audio.py
```

Audio/transkript o‘zgarsa, cache uchun yangi versiya yo‘lini tanlang, kontent yo‘llarini yangilang va yangi content revision nashr qiling. `manifest.json` SHA-256 va davomiyliklarni saqlaydi.
