# SinfQuiz 7.37.0 — tekshiruvlar

## Natija

- `npm test`: **295 test o‘tdi, 0 xato, 0 tashlab ketilgan test**. Yakuniy to‘liq log: `qa-7.37.0/all-tests.log`.
- `npm run build`: production build muvaffaqiyatli. Log: `qa-7.37.0/build-final.log`.
- `npm run perf`: boshlang‘ich resurs hajmi bo‘yicha barcha budget talablari bajarildi. Hisobot: `qa-7.37.0/performance.json`.

## Yangi piano tekshiruvlari

20 ta zamonaviy hitning har bir kartasi MIDI fayl yuklamasdan ochildi. Avtoijro shu trekning haqiqiy notalarini audio dvigateliga jo‘natdi. Har bir trekning o‘ng qo‘l mashqi boshlandi va birinchi qadam bosildi. “Espresso” mashqi oxirigacha bajarildi va natija saqlandi. Ushbu UI sinovida tashqi tarmoq so‘rovlari bloklangan: **0 tashqi MIDI so‘rovi**.

Do–Re–Mi–Fa–Sol–Lya–Si, beshta ♯ nota va A0–C8 oralig‘idagi oktavalar tekshirildi. Joriy nota, klavish nomi, kompyuter harfi va keyingi olti qadam bir xil qo‘shiq ma’lumotidan olinadi. Noto‘g‘ri nota mashqni oldinga o‘tkazmadi. Do–Re–Mi/C–D–E almashtirish va sozlamani saqlash, nota nomlarini klaviatura hamda canvasda yashirish ishladi. Nota yozuvi almashganda to‘xtagan canvas qayta chizilishi tekshirildi.

Manba MIDI fayllari SHA-256 bilan tekshirildi. 20 ta hosila MIDI klipining SHA-256 qiymati va barcha nota hodisalari ilovadagi nota ma’lumotiga solishtirildi: **4434 nota**, **38149 bayt MIDI**. Barcha parchalar 30 soniya. O‘ng qo‘l notasi Do4dan pastga o‘tishi saqlandi. Ikki qo‘l bitta MIDI kanali va bir xil balandlikdan foydalansa ham, nota yakuni o‘z yo‘lida to‘g‘ri juftlanishi alohida sinovdan o‘tdi.

Avvalgi 20 ta turkcha xalq/mumtoz kuy hamda Bella Ciao sinovlari saqlangan va o‘tdi. MIDI import/eksport, ovoz sozlamalari, sustain, kompyuter klaviaturasi, pointer release, MIDI kirish hodisalari, yozuv cheklovi va piano ekranidan qaytish testlari o‘tdi.

## SinfQuiz regressiyasi

Mehmon, o‘quvchi, ustoz va administrator uchun Kino Piano ochilishi hamda mashqlarga qaytish tekshirildi. Mavjud navigatsiya, kodli sinfga qo‘shilish, fan tanlash, testlar va natijalar, typing, musobaqalar, atlaslar, darslar, Paper Workshop ranglari, light/dark va tegishli RLS/SQL testlari o‘tdi.

Oldingi ZIPdagi 1192 fayl saqlangan. 480 ta oldingi SQL, public resurs va ma’lumot fayli baytma-bayt o‘zgarmagan. Yangi SQL yoki dependency yo‘q.

## Performance

- Boshlang‘ich JavaScript: **583,479 bayt**, gzip taxmini **171,606 bayt**.
- Boshlang‘ich CSS: **314,436 bayt**, gzip taxmini **55,345 bayt**.

JavaScript va CSSning boshlang‘ich siqilmagan hajmi 7.36.0 bilan bir xil. Yangi qo‘shiqlar va o‘rgatish interfeysi pianino bo‘limining kechiktirib yuklanadigan modulida. To‘xtagan canvas keshdan foydalanishi va ijro animatsiyasi taxminan 30 FPS bilan chegaralanishi testdan o‘tdi. Bu resurs hajmi o‘lchovi; real LCP/INP yoki Lighthouse natijasi emas.

## Tekshiruv chegaralari

Interfeys sinovlari Node/JSDOM/Vite SSR muhitida, audio jo‘natish esa tekshiriladigan dvigatel o‘rnini bosuvchi obyekt orqali bajarildi. Haqiqiy brauzerda screenshot, 320–390 px telefon/planshet/katta ekran, sensor qurilma, audio chiqishini eshitish yoki tashqi MIDI klaviaturada qo‘lda sinov bajarilmadi. Browser boshqaruvi mavjud bo‘lmagani uchun preview server yoki boshqa browser vositasi ishga tushirilmadi. Jonli Supabase hisoblarida end-to-end tekshiruv bajarilmadi; mavjud avtomatik API/RLS/SQL va rol sinovlari ishlatildi.

ZIP uchun CRC va barcha baytlar tekshiruvi paketlash skripti orqali bajariladi. Saqlangan ZIP nusxasi alohida qayta olinib, SHA-256 va CRC bilan tekshiriladi.
