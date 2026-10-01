# SinfQuiz 7.17 tekshiruvlari

2026-10-01. Lokal nusxada tekshirildi; ishlab turgan Supabase/Vercel bazasiga o‘zgarish yozilmadi.

## Avtomatik tekshiruv

`npm test`: **80/80 test o‘tdi**. Testlar mavjud auth, CEFR/milliy test, Informatika/Python, o‘quvchi natijalari, 6 raqamli test reytingi, poyga ruxsatlari, Matematika va Ingliz labirinti tekshiruvlarini ham qamraydi.

Yangi 13 laboratoriyada barcha boshlang‘ich, eng kichik va eng katta parametrlar, jarayonning 0 / 0,1 / 0,5 / 1 bosqichlari uchun hisoblar chekli ekanligi tekshirildi. Reagentning ortiqcha miqdori, gazsiz holat, ko‘pik darajasining gaz moliga ta’sir qilmasligi, kislota/asos balansi, tuz/suv/qum saqlanishi, Rf nisbati, kislorodsiz va namliksiz zanglash modeli tekshirildi. Noto‘g‘ri yoki begona boshlang‘ich parametrlar rad etiladi.

`npm run build`: o‘tdi. Kimyo bo‘limi alohida yuklanadigan JS chunk: taxminan **123 kB / 39,5 kB gzip**, CSS taxminan **20,6 kB / 4,7 kB gzip**. Yakuniy fayl hajmi Vite nom/hashiga qarab ozgina farq qilishi mumkin. Yangi paket yoki CDN bog‘liqligi qo‘shilmadi. Bu bundle o‘lchovi; barcha qurilmalarda bir xil FPS yoki ping kafolati emas.

## Ma’lumotlar bazasi

PGlite/Postgres test bazasida asosiy Kimyo migratsiyasi va yangi `supabase-chemistry-labs.sql` ikki martadan bajarildi. 13 laboratoriya nusxasi valid parametrlar bilan saqlandi; chegaradan chiqish va boshqa sahnaning parametrini yuborish rad etildi. Ustozlar ajratilishi, admin tasdig‘i, faol/yopiq sahna ko‘rinishi, muallifni almashtirishni bloklash, tahrirdan keyin qayta tasdiqlash va shaxsiy kuzatishlar RLS orqali tekshirildi.

Bu ishlab turgan Supabase loyihasida migratsiya bajarilgan degani emas. ZIPni o‘rnatishda migratsiyani foydalanuvchi o‘z loyihasida bajaradi.

## Brauzer

`tests/chemistry-browser.cjs`, headless Chromium, API fixturelar:

- Avvalgi 12 atlas sahnasi, 118 element, atom/ion va molekula quruvchisi ishladi.
- Yangi 13 laboratoriya ochildi. Tayyorlanmagan tajribani boshlash bloklandi; tayyorlash, boshlash, pauza, virtual vaqtni surish va yakunlash ishladi.
- Yakuniy o‘lchovlar matematik model bilan solishtirildi. Oxirgi sahna aralashuvsiz avtomatik yakunlandi, timer to‘xtadi va ikkinchi sinov jadvalga yozildi.
- Soda yo‘qligida gaz yo‘q; tajriba vaqtida miqdorni o‘zgartirish bloklanadi; qayta tayyorlash boshqaruvni ochadi.
- Sinov jadvali sahnadan chiqib qaytilganda saqlandi. CSV yuklash, atom jadvali va solishtirish jadvalini tozalash tekshirildi.
- Tajriba daftari qoralamasi, taxmin va oldingi yuborilgan natija belgisi saqlandi; TXT yuklash va ustozga yuborish ishladi.
- Ustoz 9 mmol sodali laboratoriya nusxasini yaratdi; admin tasdiqladi; o‘quvchi nusxada aynan 9 mmol boshlang‘ich qiymatni ko‘rdi.
- 1440 va 390 px kengliklar, tungi rejim, kamaytirilgan harakat va mobil jadvalning ichki scrolli tekshirildi. Sahifa eni viewportdan oshmadi.
- Axe WCAG 2 A/AA, 2.1 AA, 2.2 AA teglari: barcha 13 ish yorug‘ rejimda va mobil vulqon tungi rejimida **0 avtomatik buzilish**. Avtomatik axe to‘liq WCAG sertifikati yoki barcha assistiv texnologiyalar bo‘yicha qo‘lda audit emas.
- JavaScript pageerror qayd etilmadi. Vite dev fixture muhitida avval ham mavjud `Couldn't load preload assets` ogohlantirishi chiqadi; u sahnalarni yuklashni to‘xtatmadi.

`tests/discovery-browser.cjs`: Matematika 3D kub hajmi, yoyilma, kesim; ingliz labirintining to‘liq yo‘li, xato javob fikri, ustozga tegishli natija, WebGL va SVG fallback, mobil/tungi ko‘rinish qayta tekshirildi va o‘tdi.

## Chegaralar

Bu yangi sahnalar haqiqiy laboratoriyaning to‘liq raqamli egizagi emas. Stoixiometriya va massalar balansi aniq farazlar ichida, ko‘rinish/vaqt/kinetika esa ochiq aytilgan ta’limiy soddalashtirish bilan ishlaydi. Haqiqiy qurilmada o‘lchangan kinetika, real reagent partiyasi yoki tajriba vaqti bilan kalibrlash bajarilmagan. Ilmiy manbalar va aktiv huquqlari `CHEMISTRY-SOURCES.md`da.
