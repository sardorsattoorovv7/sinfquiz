# SinfQuiz 7.23.1 — tekshiruv, 2026-10-06

## Natija

- **npm test: 135/135 PASS**, 42 test fayli, xato yoki skip yo‘q. Log: `qa-7.23.1/all-tests.log`.
- **npm run build: PASS**. Ingliz tili bo‘limi lazy yuklanadi: JS 102 399 bayt, CSS 13 324 bayt. Yangi dependency qo‘shilmadi.
- **Ikki haqiqiy brauzer sinovi: PASS**, sahifa JavaScript xatosi yo‘q. React/Vite, Chromium 133.0.6943.0 va lokal PostgreSQL/PGlite ishlatildi.
- **10 avtomatik accessibility tekshiruvi: 0 violation**. WCAG 2/2.1/2.2 A/AA axe qoidalari: uy sahifasi, reading, speaking va ustozning audio tekshiruvi. Bu to‘liq WCAG audit yoki sertifikat degani emas.

## Ovoz yozuvi va qayta yuborish

`tests/english-resilience-browser.cjs` haqiqiy MediaRecorder bilan audio yozdi. Mikrofon faqat tugma orqali yoqildi, avtomatik upload bo‘lmadi. Yuborishdagi tarmoq xatosidan keyin lokal audio qoldi va keyingi urinish ishladi. Binary audio uzatildi; haqiqiy SQLdagi `storage.objects` RLS qoidasiga mos yozuv yaratildi va speaking qoralamasiga saqlandi. Native audio player server nusxasini ijro etdi.

Keyingi yozuv oldingi speaking dalilini `draft`ga almashtirdi. Audio yuborilmagan holat darsni topshirishda server tomonidan rad etildi. Sahifa yangilanganda lokal yozuv qaytdi. Lokal metadata yozilmay qolishi simulyatsiya qilindi: audio mazmunining SHA-256 izi bir xil bo‘lsa, muvaffaqiyatli upload noto‘g‘ri ravishda yangi qoralamaga aylantirilmadi. Bu iz lokal nusxalarni moslashtiradi; o‘quvchini masofadan proktorlik qilish vositasi emas.

Topshirilgan ishga ataylab boshqa lokal matn va audio joylandi. O‘quvchi sahifasi haqiqiy topshirilgan server matnini ko‘rsatdi, lokal audioni ko‘rsatmadi. O‘z guruhidagi ustoz audioni eshitdi; boshqa ustozning audio URL so‘rovi 403 bilan rad etildi. Ustozning rubrika bahosidan keyin keyingi dars ochildi.

Mikrofon ruxsati ataylab kechiktirildi. O‘quvchi so‘rovni bekor qilib sahifadan chiqqach kech kelgan barcha audio tracklar `ended` holatiga o‘tdi.

## Qoralama navbati

Brauzer va alohida navbat testlarida quyidagilar tekshirildi:

1. SQL aloqasi uzilganda matn lokal qoldi; kurs yana ochilganda tiklandi va hisobga saqlandi.
2. Birinchi saqlash javobi sekin kelayotganda yangi matn yozildi. Chiqish tugmasi eng oxirgi matn ham saqlanishini kutdi.
3. Server saqlagan, lekin javobi yo‘qolgan so‘rov sahifa yangilangach aynan oldingi token bilan takrorlandi. Server ikkinchi marta yangi versiya yaratmadi.
4. Boshqa qurilma yozgan nusxa bilan to‘qnashuvda lokal matn saqlanib qoldi. Hisobdagi nusxani olish va o‘z qoralamasini yozish tanlovlarining ikkalasi ishladi. Almashtirilgan lokal matn recovery kalitida qoldi.
5. localStorage to‘lishi simulyatsiya qilindi. Muvaffaqiyatli SQL saqlashi xato deb ko‘rsatilmagan.

Sahifa/aktivlar uchun to‘liq offline ilova keshi qo‘shilmagan. Testda kurs aktivlari Vite orqali ochiq, saqlash RPCsi esa uzilgan edi. Butun internet uzilgan holda yangilangan sahifani ochish kafolatlanmaydi.

## SQL va xavfsizlik

`tests/english-upgrade.test.js` patchni ketma-ket ikki marta bajardi. Oldingi ishlar va barcha kontent payloadlari aynan saqlandi. Draft version tekshiruvi eskirgan saqlashni `P7231` bilan rad etdi; eski tokenning javobi xavfsiz qaytarildi. Dars va daraja tekshiruvi qoralamalari uchun bir xil qoida sinovdan o‘tdi. Upload va playbackda egaga/guruhga tegishli ruxsatlar saqlangan; javob banki o‘quvchiga bevosita berilmadi. Topshirilgan ishni qayta tahrirlash bloklandi.

Mavjud matematika/kimyo hisoblari, biologiya modellari, Python, Office, quiz reytingi, guruh musobaqasi, chat, autentifikatsiya va 1v1/typingning oldingi avtomatik testlari umumiy 135 testga kiradi. Ushbu patch ularning ishlab chiqarish kodini o‘zgartirmaydi. Real Supabase Auth yoki real Telegram hisobiga yangi kirish bajarilmadi.

## Vizual tekshiruv

Speaking desktop 1440×1000, telefon 390×844, sinf doskasi 1920×1080 hamda tungi rejimda ochildi. Gorizontal overflow yo‘q. Rasmlar ko‘rib tekshirildi. Mobil matn ustiga chiqib qolgan pastki panel normal hujjat oqimiga o‘tkazildi; tugma va formalar mahalliy tizim shriftidan foydalanadi. Shu o‘zgarishdan keyin ikkala brauzer testi yana PASS bo‘ldi.

Dalillar: `qa-7.23.1/resilience-browser.json`, `accessibility.json`, `speaking-*.png`, `teacher-audio-review.png`; avvalgi ingliz tili oqimlari qayta tekshiruvi `qa-7.23.1/regression/`da. `qa-7.23/` esa oldingi reliz dalillarini saqlaydi.

## Amaliy chegaralar

SQL lokal PostgreSQLda va transferlar test adapterida tekshirildi. Sizning Supabase Storage HTTP xizmatingizga audio yuborilmadi, yangi migratsiya loyihangizga avtomatik o‘rnatilmadi va Vercelga deploy qilinmadi. O‘rnatish: **UPDATE-7.23.1.md**. Browserlar uchun yozuv formatlari tekshiriladi; bu sinovdagi native yozuv WebM edi. Yakunlanmagan audioni brauzerni majburan yopgandan keyin tiklash kafolati yo‘q.

ZIP CRCsi, ichidagi 216 audio xeshi, eski fayllar mavjudligi va eski public aktivlarning o‘zgarmaganligi paketlashda tekshiriladi. Paket hisoboti `release-7.23.1.json` faylida berilgan.
