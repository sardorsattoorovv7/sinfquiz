# SinfQuiz 7.25 — IQ va mantiq, yagona darsliklar

Bu yangilanish ishlayotgan 7.24 loyihasi uchun tayyorlangan. Mavjud foydalanuvchilar, ustoz kontenti, Informatika, Ingliz tili, musobaqalar, atlaslar va amaliy mashqlar saqlanadi.

## O‘rnatish

1. Supabase SQL Editor’da **supabase-migration-7.25.sql** faylini to‘liq ochib **RUN** qiling. Unda jadval, ruxsat, 144 topshiriq va 198 dars metama’lumoti birga. Fayl 150 KB dan kichik; Cron yoki yangi extension kerak emas. Amaldagi `documents` va 7.20 dagi guruhlar jadvallari mavjud bo‘lishi kerak. Xuddi shu migratsiyani qayta bajarish natijalar yoki tahrirlangan darslarni o‘chirmaydi.
2. ZIP ichidagi `sinf-quiz` fayllarini loyihangizga ko‘chiring. O‘zingizning mahalliy `.env` faylingizni saqlang; uni Gitga qo‘shmang.
3. Loyiha papkasida Node 22.12 yoki undan yangi versiya bilan ishlating:

```bash
npm ci
npm run dev
```

4. Vercel uchun yangi kodni deploy qiling. Ishlayotgan Supabase URL va publishable/anon kaliti sozlamalari saqlanadi; yangi maxfiy kalit talab etilmaydi. Faqat migratsiya bilan interfeys yangilanmaydi — yangi frontend ham kerak.

SQL Editor so‘rovni rad etsa, bir faylning o‘rniga `sql/7.25/01-schema.sql`, `02-iq-band-1.sql`, `03-iq-band-2.sql`, `04-iq-band-3.sql`, `05-book-keys.sql` fayllarini shu tartibda alohida bajaring. Bu aynan bir xil o‘rnatish. Ikkala yo‘lni birga bajarish zarur emas.

## Ingliz kursi avval o‘rnatilmagan bo‘lsa

Ingliz kursi hozir ishlayotgan bo‘lsa, bu qadamni o‘tkazing. `type public.sq_en_content does not exist` xatosi bo‘lsa, avval `sql/english-7.23/01-schema.sql`, keyin `02-lessons.sql` dan `18-lessons.sql` gacha fayllarni tartib bilan RUN qiling. Har biri 150 KB dan kichik, to‘liq SQL so‘rovlaridan iborat. Asosiy SinfQuiz va 7.20–7.22 bazasi oldindan o‘rnatilgan bo‘lishi kerak. Barcha qismlar bajarilguncha kursni boshlamang. Bu kichik qismlar eski katta 7.23 migratsiyasining muqobili; ikkisini ham bajarish shart emas.

## IQ va mantiq

- Bosh sahifa yoki asosiy menyudan **IQ va mantiq**ni oching. Mavjud hisob bilan kiriladi; yangi kirish usuli qo‘shilmaydi.
- 12 ta vaqtsiz namuna topshirig‘ida javob izohi bilan mashq qiling.
- Uchta erkin tayyorgarlik bosqichidan birini tanlang. Har birida 48 original topshiriq mavjud. 32 savollik urinishda shakllar, sonlar, mantiq va fazoviy fikrlashdan 8 tadan savol tanlanadi.
- 24 yoki 48 daqiqalik rejimni tanlang. Vaqtni server nazorat qiladi; sahifani yangilash vaqtni qayta boshlamaydi. Faol test davomida tasodifiy navigatsiya yopiq.
- Javob saqlanmay qolsa, qurilmadagi qoralamadan **Javobni qayta yuborish**ni bosing. Boshqa oynada javob o‘zgargan bo‘lsa, **Serverdagi holatni olish** joriy javobni oladi va yuborilmagan qoralamani bekor qiladi. Ikkinchi tugma javobni qayta yuborishning o‘rniga ishlatilmaydi.
- Yakunda to‘g‘ri javoblar soni, foizi, to‘rtta yo‘nalish profili, xato javob izohlari va yuklab olinadigan matnli hisobot chiqadi. Natija o‘z profilingizdagi urinishlar tarixida qoladi.
- O‘qituvchi faqat o‘z guruhlariga a’zo o‘quvchilarning natijalarini ko‘radi. Admin testni ochishi/yopishi va natijalarni ko‘rishi mumkin. Ommaviy IQ reytingi yo‘q.

**Ilmiy talqin:** bu original fikrlash mashqlari. Foiz — ushbu urinishdagi to‘g‘ri javoblar ulushi. U yosh bo‘yicha me’yorlashtirilgan IQ, aholiga nisbatan percentil yoki sertifikat emas. Savollarning murakkablik bosqichlari muallif tavsiyasi; tajribaviy kalibrlash hali bajarilmagan. Turli variant va vaqt rejimlarini teng IQ shkalasida taqqoslamang. Asos va keyingi validatsiya ishlari: `IQ-METHODS-7.25.md`.

## Darsliklar

**Darsliklar**ni bir marta bosing: Kimyo, Ingliz tili, Biologiya va Informatika shu oynada ko‘rinadi. Jami 198 asosiy dars: 12 + 108 + 30 + 48. Ustozlarning ommaviy darslari ham qo‘shiladi. Fan, bo‘lim va qidiruv bilan kerakli darsni toping; **Barcha darslarni ko‘rsatish** shu fan ro‘yxatini yoyadi.

Kimyo va Biologiyada tushuntirish, muallif chizgan sxema, hisob/misol, xato tushuncha, qisqa savol va mos atlas tajribasiga o‘tish bor. Kompyuter/Python darslari avvalgi to‘liq kontent va amaliy muharrirlarni ochadi. Ingliz darsi mavjud kurs ichida ochiladi: boshlang‘ich daraja aniqlash va darslar orasidagi kirish shartlari saqlanadi.

Ko‘rish belgisi taxminan 4.5 soniyadan keyin bir marta yoziladi. Bir hisob qayta ochishi o‘qiganlar sonini oshirmaydi. Bu belgi bilimni egallaganlik bahosi emas. Shaxsiy o‘quvchilar ro‘yxati ommaga berilmaydi; hisoblagich agregat sonni beradi. Ingliz tili o‘zlashtirish natijasi avvalgi kurs qoidasi bilan baholanadi.

Ustoz/admin **Darslarni boshqarish** orqali mavjud dars muharririga o‘tadi; faqat ruxsat berilgan kontentni tahrirlaydi. Avval bazada o‘rnatilib tahrirlangan kompyuter/Python darsi mos asosiy ro‘yxatdagi eski nusxaning o‘rnida ochiladi. Begona shaxsiy qoralamalar ko‘rinmaydi.

## Tekshiruvlarni qayta bajarish

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e:learning
```

Yangi brauzer sinovi localhost 4195 portini ishlatadi. U alohida mahalliy PostgreSQL/PGlite bazasi va test hisoblarini yaratadi, haqiqiy Supabase ma’lumotlarini o‘zgartirmaydi. O‘rnatilgan Chromiumni tanlash uchun `CHROME_EXECUTABLE` berish mumkin. Sinovlar, ekran suratlari va chegaralari `QA-7.25.md`da. O‘zgargan fayllar `CHANGED-FILES-7.25.md`da.
