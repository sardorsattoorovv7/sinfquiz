# SinfQuiz 7.20

Matematika tajribalari, o‘quvchi yig‘adigan kimyo laboratoriyasi, yopiq sinf guruhlari va matnli inglizcha labirint qo‘shildi. Mavjud Supabase hisoblari, Informatika, Python, kodli testlar va 1v1 poyga saqlangan.

## O‘rnatish

1. Ishlayotgan loyihangiz va Supabase ma’lumotlar bazasining zaxira nusxasini oling. ZIPdagi `sinf-quiz` papkasidan yangilangan kodni ko‘chiring. O‘zingizdagi `.env`ni saqlang; ZIPda haqiqiy kalitlar yo‘q.
2. Agar 7.19 ishlayotgan bo‘lsa, Supabase **SQL Editor**da faqat `supabase-migration-7.20.sql`ni to‘liq RUN qiling. Bu fayl takroran bajariladi, `cron` bo‘lmasa ham o‘rnatiladi. Eski `documents` RLS siyosatlarini almashtirmaydi.
3. Agar atlaslar hali o‘rnatilmagan bo‘lsa, avval `SUPABASE-VERCEL.md` va tegishli 7.16–7.19 yo‘riqnomalarini bajaring. `supabase-math-atlas.sql` jadvali 7.20 migratsiyasidan oldin mavjud bo‘lishi kerak.
4. Terminalda `npm install`, keyin `npm run dev`. Production tekshiruvi uchun `npm test` va `npm run build`.
5. Vercelda `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` Production muhitiga kiritilganini tekshirib, yangi kodni deploy qiling. Muhit qiymatini almashtirganda qayta build kerak. Maxfiy kalitni `VITE_` bilan brauzerga chiqarmang.

Migratsiyaning o‘zi yangi interfeysni o‘rnatmaydi: kodni ham yangilash kerak. Telegram/email kirish tartibi o‘zgarmadi. Kodli test, typing va poyga mavjud mehmon oqimidan foydalanadi.

## Matematika

62 ta mavzu: tayanch bilim, keyingi tushuncha, qisqa ta’rif, hayotiy misol va tekshiriladigan mashq. Kasrlar umumiy maxraj orqali qo‘shiladi; tarozida ikkala tomonga bir xil amal bajariladi; funksiya formulasi, jadval va grafik birga yangilanadi. Uchburchakning uchi sudraladi, tomon/burchak/balandlik/yuza qayta hisoblanadi. Pifagor, tengsizlik, nisbat, statistik ma’lumotlar va ehtimollik tajribalari bor.

Kub, parallelepiped, uchburchak prizma, kvadrat asosli piramida, silindr, konus va shar aylantiriladi, kesimi ochiladi. Tekis yoqli jismlarda yoyilma yuzlari o‘lchamini saqlaydi. Silindr va konusning yopiq/ochiq holatlari to‘g‘ri; oraliq sirt interpolatsiyasi haqiqiy material bukilishining fizik modeli emas. Shar sirtini cho‘zmasdan tekis yoyish mumkin emasligi aytiladi. 3D ishlamasa boshqariladigan vektor chizma qoladi.

## Kimyo

**Tajriba qil** ichida erkin stol va 12 amaliy ish bor. O‘quvchi 14 virtual modda, 6 jihoz, miqdor, konsentratsiya, qo‘shish tartibi, vaqt, harorat va aralashtirishni tanlaydi. Natija parametrga bog‘liq; noma’lum kombinatsiya tasodifiy portlamaydi. Oltita reaksiya uchun atomlar saqlanishi va chegaralovchi reagent tekshiriladi.

Amaliy ishlar: vulqon maketi, indikator/pH, neytrallanish, erish, kristallanish, filtrlash, zichlik qatlamlari, gaz, suv holatlari, reaksiya tezligi, zanglash va o‘tkazuvchanlik. Taqqoslash jadvali 6 sinovni saqlaydi va sharoitni tiklaydi. Alohida geologik vulqon modeli maket tajribasidan farqni tushuntiradi. Avvalgi kimyo sahnalari va **Yo‘naltirilgan modellar** ham ochiladi.

Bu ta’limiy simulyatsiya. Ideal pH hisobi 25 °C doimiysida, gaz nRT/P bo‘yicha 1 atmda olinadi. Gaz/soda/karbonat/sovun/temir/cho‘kma aralashmasida to‘liq muvozanat hisoblanmasa pH “Hisoblanmaydi” bo‘ladi. Gaz chiqish tezligi, ko‘pik, zang va elektr o‘tkazuvchanlik sifat modellari; haqiqiy laboratoriya o‘lchovi yoki xavf bashorati emas. Har sahnada cheklovlar ochib o‘qiladi.

## Biologiya va ingliz tili

Biologiyada **Sinovni boshlash** taxmin yozilmaganda ham ishlaydi; yakunlashda kuzatish va xulosa talab qilinadi. To‘xtatish, vaqt shkalasi va qayta boshlash ishlaydi. Avvalgi 3D atlas va 12 biologiya amaliy ishi saqlangan.

Inglizcha labirintda o‘quvchi A1/A2/B1 darajalarini va 12 tayyor xaritani mustaqil tanlaydi. **Matnli** rejimda gap yozma chiqadi va avtomatik ovoz ishlamaydi. **Ovozli** rejimda tinglash mumkin; ovoz mavjud bo‘lmasa savol matnga o‘tadi. Ustozning biriktirilgan xaritalari ham saqlangan.

## Guruh va natijalar

Kabinet → **O‘quvchilar bilan chat**: ustoz guruh yaratadi, 10 belgili taklif kodini bolalariga beradi. O‘quvchi kabinetdan kod bilan qo‘shiladi. Guruhni yopish/ochish, a’zoni chiqarish, xabarni o‘chirish, matn va 15 soniyagacha ovoz yuborish mavjud. Chat bosh sahifada ko‘rinmaydi.

Matematika va kimyoda **Amaliy ishlar va natijalar**: ustoz o‘z guruhiga ish biriktiradi; ommaviy ish admin tasdig‘idan o‘tadi. O‘quvchi taxmin, parametrlar, kuzatish, xulosa, taqqoslash va ishlatilgan yordam sonini yuboradi. Mustaqil mashq shaxsiy natija sifatida saqlanadi. Ustoz o‘ziga biriktirilgan ish natijasini ko‘rib fikr yozadi; boshqa ustoz o‘quvchisining shaxsiy natijasini o‘qiy olmaydi.

Tajriba daftari qoralamasi brauzerda 72 soat saqlanadi va JSON yuklanadi. Bu muddat serverga ataylab yuborilgan yakuniy natijaga tegishli emas.

## Xavfsizlik va tezlik

Chat matni React matni sifatida chiqadi, HTML bajarilmaydi. RLS guruh egasi/a’zosi va natija egasini serverda tekshiradi. Ovozning MIME, boshlang‘ich imzosi va 256 KiB hajm chegarasi tekshiriladi; bu antivirus yoki to‘liq audio dekoder emas. Ovoz fayli faqat eshitish ochilganda so‘raladi.

Server limitlari: guruh yaratish 2/min, kod bilan qo‘shilish 5/min, xabar 8/min, tajriba natijasi 8/min; kunlik limitlar ham bor. Noto‘g‘ri guruh kodi hisobga olinadi; parallel urinishlar advisory lock bilan tartiblanadi. Email kirishda kutish qo‘shilgan, haqiqiy Auth rate limiting Supabase tomonidan boshqariladi. CAPTCHA bu versiyada avtomatik yoqilmagan; uni dashboardda yoqishdan avval barcha kirish oqimlariga token qo‘shish kerak.

24 soatdan eski guruh xabari va ovozi RLS/RPC orqali ochilmaydi. Fizik o‘chirish: Supabase Cron mavjud bo‘lsa 5 daqiqalik vazifa; bo‘lmasa xabar yuborishda shu guruh tozalanadi. Umumiy tozalashni SQL Editor yoki tashqi rejalashtirgichda `select public.sq_groups_purge();` bilan bajaring. Cron bo‘lmasa barcha eski xabarlar darhol diskdan o‘chiriladi degan kafolat yo‘q.

Realtime orqali faqat kichik vaqt belgisi yuboriladi; xabarlar 5 soniyada jamlab olinadi. Faol Realtime bilan bo‘sh chat kamida bir daqiqalik tekshiruvga o‘tadi, aloqa bo‘lmasa 5 soniyalik zaxira ishlaydi. Yashirin tab so‘rovlari to‘xtaydi. 3D modellarda qurilma sifati, to‘xtatilgan kadr, xotirani bo‘shatish, 2D zaxira va reduced-motion qo‘llanadi. Har bir qurilma yoki internetda bir xil tezlik kafolatlanmaydi.

Manbalar: [ATLAS-SOURCES-7.20.md](ATLAS-SOURCES-7.20.md). Tekshiruv dalillari: [QA-7.20.md](QA-7.20.md).
