# SinfQuiz 7.22 — Jamoaviy musobaqalar va boshlang‘ich Excel

Bu to‘liq loyiha. 7.21 dagi biologiya modellari, kimyo qo‘llanmasi, matematika, Ingliz tili, Informatika, Python, chat, profil, typing, testlar va 1v1 poyga kiritilgan.

## Ishlayotgan 7.21 loyihani yangilash

1. ZIPni oching. Loyiha **sinf-quiz** papkasida; package.json versiyasi **7.22.0**.
2. Yangilangan kodni ko‘chiring. O‘zingizning **.env** yoki **.env.local** faylingizni saqlang. Arxivdagi .env.example faqat namuna.
3. Supabase → **SQL Editor**da **supabase-migration-7.22.sql** faylini to‘liq RUN qiling. Fayl qayta bajarishga mos; ma’lumotlarni o‘chirmaydi. Cron talab qilmaydi. Mavjud documents RLS siyosatlari almashtirilmaydi.
4. Node.js 22.12 yoki yangirog‘i bilan terminalda:

   ~~~sh
   npm ci
   npm run dev
   ~~~

5. Saytda **Jamoaviy musobaqalar** bo‘limini oching. U bosh sahifada, navigatsiya menyusida va ustoz/admin panelida bor.
6. Vercel uchun **npm run build**ni bajaring va yangi kodni deploy qiling. Oldingi Supabase URL va publishable/anon kaliti saqlanadi. Environment qiymati o‘zgarsa, yangi build/deploy kerak.

SQLning o‘zi interfeysni yangilamaydi: kod va migratsiya birga o‘rnatiladi. Ishlayotgan bazani qayta yaratmang. Yangi loyiha bo‘lsa, avval SUPABASE-VERCEL.md faylidagi baza va avvalgi atlas/guruh migratsiyalari tartibini bajaring, keyin 7.22 migratsiyasini qo‘shing.

Email yoki Telegram bilan kirish o‘zgarmadi. Mehmonlar kod orqali qatnashishi uchun Supabase **Authentication → Sign In / Providers → Anonymous Sign-Ins** yoqilgan bo‘lsin. U o‘chirilgan bo‘lsa, o‘quvchi o‘z hisobidan kiradi. Maxfiy server kaliti bu musobaqa uchun kerak emas; uni VITE_ qiymatiga yozmang.

## Ustoz musobaqani qanday tashkil qiladi?

1. Ustoz/admin hisobi bilan **Jamoaviy musobaqalar → Musobaqa yaratish**ni bosing.
2. Nom, izoh va ko‘rinishni belgilang. Ommaviy faol musobaqa katalogga chiqadi; kodli musobaqaga jamoa kodi bilan kiriladi.
3. **2–32 ta jamoa**, har biriga **1–12 ta a’zo** belgilang. Jamoalardagi a’zolar soni bir xil bo‘ladi.
4. Istasangiz ism-familiyalarni alohida qatorda yozing. Ro‘yxatda aynan belgilangan miqdorda, takrorlanmagan ismlar bo‘lsin. Bo‘sh ro‘yxatda kod bilan kirgan o‘quvchi bo‘sh o‘ringa yoziladi.
5. **4–24 bosqich** biriktiring. Materialni nom, fan yoki mavjud **6 raqamli quiz kodi** bilan qidiring. O‘z materiallaringiz va ommaviy ustoz testlari ko‘rinadi. Admin boshqa ustozlarning shaxsiy manbalarini ham tanlay oladi.
6. Typing uchun 30 ta A1–C2 inglizcha matn va 5 ta uzun matn, labirint uchun 12 xarita mavjud. Boshlang‘ich Excel to‘plami ham darhol tanlanadi.
7. **Quizni o‘zim tuzaman** orqali variantli, qisqa javob, tugmalar, Python, Office yoki mezonli yozma savol qo‘shing. **Typing matnini yozaman** orqali o‘z matningizni kiriting.
8. Har bosqichning vaqtini **30–3600 sekund**, ball koeffitsiyentini **1–10** qilib belgilang. Strelkalar tartibni o‘zgartiradi. Bir quiz bosqichiga 1–50 savol kiradi.
9. **Qoralamani saqlash → Qabulni faollashtirish**ni bosing. Har jamoaning alohida **8 belgili** kodini a’zolariga bering.
10. Barcha jamoalar to‘lgach, **Musobaqani boshlash** faollashadi. Har bosqich barcha jamoa uchun bir vaqtda boshlanadi.

Ismlar ro‘yxati kirish nomini tekshiradi. Taklif kodi egasining shaxsini mustaqil tasdiqlamaydi; kodni faqat kerakli o‘quvchilarga bering.

## O‘quvchi qanday qatnashadi?

**Jamoaviy musobaqalar**da jamoa kodi va ism-familiyasini yozadi. Har bir a’zo o‘z hisobidan yoki alohida brauzer/qurilmadan kiradi. Bir brauzerdagi bitta Supabase sessiyasi bir musobaqada bitta ishtirokchini bildiradi. Avvalgi ikki o‘yinchili bitta-ekran 1v1 poyga alohida ishlaydi.

Ustoz boshlaganda topshiriq ochiladi. Quiz javobi yuborilgach tushuntirish chiqadi va navbatdagi savol ochiladi. Word/Excel/PowerPoint amaliy muharrirlari va Pythonning mavjud ajratilgan muhiti ishlatiladi. Kod savollarida kod bloki ham ko‘rinadi.

Typingda matn yozma ko‘rinadi, inglizcha matnni xohlasa tinglaydi. Yopishtirish o‘chirilgan. Labirintda gap doim yoziladi; ovoz ixtiyoriy. Strelka/WASD yoki ekrandagi tugmalar bilan yuring. Yo‘l serverda tekshiriladi; devordan yoki yopiq eshikdan o‘tib bo‘lmaydi. Musobaqa labirintida ta’qibchi yo‘q — savollar va vaqt hisoblanadi.

Bosqich tugasa, o‘quvchi ustoz keyingisini ochishini kutadi. **Keyingi bosqich** barcha a’zo tugatganda yoki vaqt tugaganda ochiladi. Ustoz **Bosqichni hozir yopish**ni tasdiqlab ertaroq o‘tkazishi ham mumkin. Javobsiz topshiriqlar ball olmaydi. Faol qatnashishda asosiy menyudan boshqa bo‘limga ketish yopiladi; **Musobaqadan chiqish** tugmasi tasdiq so‘raydi.

Brauzer qayta yuklansa, a’zolik va yuborilgan javoblar serverdan tiklanadi. Hali yuborilmagan typing yoki labirint yurishlari sahifa xotirasida turadi; reload ularni saqlamaydi. Python qoralamasi avvalgi 52 soatlik qoida bilan saqlanadi.

## Ball va o‘rin

- Har bosqichning shaxsiy natijasi **0–100**.
- Quiz: bajarilgan savol ballari / bosqichdagi barcha savol ballari × 100. Office va yozma mezonlarda qisman ball bor.
- Typing: o‘z o‘rnida to‘g‘ri terilgan belgilar aniqligi va serverda o‘lchangan tezlik. Formula: **aniqlik × (0.75 + 0.25 × min(WPM / 75, 1))**.
- Labirint: ochilgan eshiklar hissasi. Har xato o‘sha eshik ballidan 15%, har yordam 20% kamaytiradi; ikki yordamgacha. Eshikning eng kam ulushi 30%. Yakunlash uchun barcha eshik va chiqish yo‘li bajariladi.
- **Jamoa bosqich balli**: a’zolar ballari yig‘indisi / belgilangan a’zolar soni. **Jami**: bosqich balli × koeffitsiyent, barcha bosqichlar bo‘yicha qo‘shiladi.
- Avval jami ball, keyin to‘g‘ri javob/belgilar soni, so‘ng kamroq sarflangan vaqt solishtiriladi. Uchala qiymat teng bo‘lsa, jamoalar bir o‘rinni bo‘lishadi. Tarkibdan chiqqan yoki bosqichga javob bermagan a’zo uchun maxraj kamaymaydi.

Masalan, 4 a’zoning ballari 100, 80, 60 va 0 bo‘lsa, jamoa o‘rtachasi **60**. Bosqich koeffitsiyenti 2 bo‘lsa, jami hisobga **120** qo‘shiladi.

Ustoz jamoalar jadvali, o‘quvchilarning bosqich ballari va mezonli tekshiruvlarni ko‘radi. **Natijalarni Excel uchun olish** UTF-8 CSV fayl beradi. Natijalar bazada saqlanadi; yopilgan musobaqani o‘z katalogingizdan qayta oching.

## Boshlang‘ich Excel

**32 savol: 20 nazariy, 6 qisqa javob/formula, 6 amaliy vazifa.**

Katak, ustun va qator; A1/B3 kabi manzillar; matn va son; =; qo‘shish, ayirish, ko‘paytirish va bo‘lish; qavs; B2:B4 oralig‘i; SUM va AVERAGE.

Ustoz kirganda **Sinf testlarim**ga **Excel: kataklardan formulalargacha** to‘plami qo‘shiladi. Oldingi tahrirlangan testlar almashtirilmaydi. To‘plamni odatiy 6 raqamli test sifatida faollashtiring yoki musobaqaga biriktiring.

Amaliy muharrirda tanlangan katak nomi, ustuni/qatori va formula qatori bor. AVERAGE bo‘sh yoki matnli katakni hisobga olmaydi, 0 ni hisobga oladi. Formulalar cheklangan parser bilan hisoblanadi; foydalanuvchi matni JavaScript yoki SQL sifatida bajarilmaydi. Bu o‘quv muharriri; Microsoft Excelning barcha imkoniyatlarini bajarmaydi.

## Texnik o‘zgarishlar

- TeamCompetitions.jsx, CompetitionBuilder.jsx, CompetitionRoom.jsx, CompetitionChallenges.jsx: katalog, tashkil qilish, kod bilan kirish, bosqichlar, reyting, CSV.
- competition-model.js, competition-service.js, team-competitions.css: model, RPC, Realtime, qayta yuborish, moslashuvchan ko‘rinish.
- App.jsx, theme.css: bo‘limga kirish va ko‘p bo‘limli navigatsiyaning ekranga sig‘ishi.
- ScenicMaze.jsx: musobaqada ta’qibchini yashirish parametri; odatiy labirint o‘z ko‘rinishini saqlaydi.
- data/excel-basics.js, office-lab-model.js, OfficeLab.jsx, office-lab.css, supabase-data.js: boshlang‘ich Excel va amaliy muharrir.
- supabase-migration-7.22.sql: yangi sq_comp_* jadvallari, ruxsatlar, server baholashi va 48 ta tayyor tanlanadigan material. scripts/build-competition-templates.mjs SQL ichidagi nusxalarni qayta tayyorlaydi.
- tests/competition-db.test.js, tests/competition-model.test.js, tests/competition-browser.cjs: bazadan brauzergacha tekshiruv.

Faqat tashkilotchi va admin musobaqani o‘zgartiradi. O‘quvchi ball, tarkib yoki javob kalitini jadvalga bevosita yoza olmaydi. Shaxsiy manbaga ruxsat nusxa olinayotgan vaqtda tekshiriladi. Manba keyin o‘zgarsa, saqlangan bosqich o‘zgarmaydi.

Javoblar serverda tekshiriladi, vaqt server soatidan olinadi. UUIDli takroriy yuborish ballni ko‘paytirmaydi. Python serverda bajarilmaydi: mavjud browser worker natijasi kutilgan natija bilan tekshiriladi; bu yashirin server testli kod hakami emas.

Noto‘g‘ri jamoa kodi ham 10 urinish/minut limitiga kiradi. Javoblar 120/minut bilan cheklangan. Matn React orqali chiqariladi; HTML bajarilmaydi. Bu choralar Supabase Auth limitlari va platformaning tarmoq himoyalariga qo‘shimcha.

Realtime faqat kichik yangilanish signalini yuboradi; holat so‘rovlari jamlanadi. 15 sekundlik zaxira bor, yashirin tab so‘rov yubormaydi. Fanlar va Python bo‘limlari avvalgidek kerak bo‘lganda yuklanadi.

Yangi 3D aktiv qo‘shilmadi. Biologiya va boshqa modellar/litsenziyalar: BIOLOGY-MODELS-7.21.md, ATLAS-SOURCES-7.20.md.

Formula manbasi: [Microsoft — AVERAGE](https://support.microsoft.com/en-us/office/average-function-047bac88-d466-426c-a32b-8f33eb960cf6). Ruxsatlar: [Supabase — Database Functions](https://supabase.com/docs/guides/database/functions), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security). Savollar SinfQuiz uchun alohida yozilgan.

Tekshiruv natijalari: **QA-7.22.md**.
