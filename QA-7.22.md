# SinfQuiz 7.22 — Tekshiruv natijalari

Tekshiruv: 2026-10-05. Node.js 22, React/Vite, mahalliy Postgres/PGlite va haqiqiy Chromium. Foydalanuvchining production bazasiga yozilmadi.

## Avtomatik tekshiruv

- **124/124 test**: fan modellari, autentifikatsiya, RLS, kurslar, CEFR, 6 raqamli quiz reytingi, typing, Python, profil va 1v1 oqimlari.
- Yangi musobaqa/Excel tekshiruvlari **6/6**. Migratsiya ikki marta bajarildi. Cron va sinf chat jadvallarisiz ham yangi bo‘lim o‘rnatildi.
- **npm run build** muvaffaqiyatli. Musobaqa alohida lazy chunkda; bosh sahifa hamma fan/3D modellarni birdan yuklamaydi.

Buyruqlar:

~~~sh
npm ci
npm test
npm run build
node --test tests/competition-db.test.js tests/competition-model.test.js
~~~

## Musobaqaning boshidan oxirigacha brauzer sinovi

Haqiqiy React interfeysi so‘rovlari mahalliy Postgres RPClariga ulandi. Ball va jadval fixtureda oldindan yozilmadi.

1. Ustoz panelidan musobaqa ochildi. 6 raqamli **654321** manba quiz qidirib biriktirildi.
2. Typing, labirint va Excel amaliyoti tanlandi. Ustoz beshinchi bosqichga o‘z variantli savoli va Python amaliy savolini qo‘shdi.
3. 2 jamoa, har birida 1 a’zo belgilandi. Barcha o‘rinlar to‘lmaguncha boshlash yopiq qoldi.
4. Ikki o‘quvchi turli jamoa kodi bilan kirdi. Ustoz boshladi; bosqichlar barcha o‘quvchiga bir vaqtda ochildi.
5. Quizda to‘g‘ri va xato javoblar berildi: jamoalar **1- va 2-o‘rin** oldi. Reload yuborilgan natijani saqladi.
6. Typingda to‘liq va xatoli matnlar yuborildi. Aniqlik/tezlik serverda baholandi.
7. O‘quvchi yozma inglizcha savollar bilan butun labirintdan yurib chiqdi. Avtomatik ovoz ishlamadi. Boshqa o‘quvchi tugatmagan bosqichni ustoz tasdiq bilan yopdi.
8. Excelda **=AVERAGE(B2:B4)** bajarildi; noto‘g‘ri **=SUM(B2:B4)** shu vazifadan ball olmadi.
9. O‘quvchilar Pythonni haqiqiy browser workerda ishlatdi: print(12) qabul qilindi, print(11) kutilgan natijaga mos kelmadi. Konsoldagi yakuniy yangi qator to‘g‘ri qayta ishlanadi. Kod ishga tushirilmaguncha yuborish yopiq.
10. Yakunda Zukko **500**, Bilimdon **97.96** ball oldi; o‘rinlar **1 va 2**. Har o‘quvchi 5 bosqich natijasini ko‘rdi. UTF-8 CSV yuklandi.

Dalillar: qa-7.22/competition-browser.json va qa-7.22/accessibility.json. Brauzer tekshiruvini qaytarish uchun Playwright va CHROME_EXECUTABLE qiymati kerak; tests/competition-browser.cjs faylida tartib bor.

## Baza va hisoblash

- Begona ustozning shaxsiy testi tanlanmadi; ommaviy manba tanlandi. O‘quvchi manba katalogi, javob kalitlari va xom natija jadvallarini o‘qiy olmadi.
- 3 bosqichli musobaqa rad etildi. Faollashtirilgan tarkib tahrirlanmadi. To‘lgan jamoaga ortiqcha o‘quvchi kirmadi.
- Hali hamma tugatmagan bosqich oddiy Next bilan o‘tkazilmadi. Vaqt tugagach o‘tkazildi; javobsiz topshiriq 0 hissaga ega.
- Bir UUIDli javob takrorlansa ball oshmadi. Eskirgan Next so‘rovi ikkinchi bosqichni tashlab ketmadi. Soxta score qiymati hisobga olinmadi.
- Labirintda to‘g‘ridan-to‘g‘ri uzoq nuqtaga sakrash rad etildi; ketma-ket yurishlar, eshiklar va chiqish tasdiqlandi.
- Noto‘g‘ri jamoa kodi 10/minut limitida sanaldi. O‘quvchi musobaqani faollashtira yoki to‘xtata olmadi.
- SQL va mavjud JS baholashi qisqa javob, kombinatsiya, Python natijasi, yozma mezon, Word, PowerPoint va Excel uchun solishtirildi. Xato yozma mezon qoralamani yarim holatda qoldirmadi: tranzaksiya ortga qaytdi.
- Excelda katakka tayangan hisob, qavs, SUM, AVERAGE, bo‘sh katak va 0 farqi tekshirildi. AVERAGE(4, bo‘sh, 0) = 2; matnli katak o‘rtachaga kirmaydi.
- 6 yangi amaliy Excel vazifasi to‘g‘ri bajarilganda to‘liq, bo‘sh holatda 0 natija berdi. Aylanma havola, nolga bo‘lish va bajariladigan kod ko‘rinishidagi formula rad etildi.
- CSVda formula sifatida bajarilishi mumkin bo‘lgan jamoa nomi zararsizlantirildi. Savoldagi HTML/XSS satri oddiy matn bo‘lib ko‘rindi.

## Ko‘rinish va mavjud bo‘limlar

Musobaqa **1440×1000**, **390×844**, **1920×1080** ko‘rinishlarida ochildi. Sahifa gorizontal chiqib ketmadi; keng jadval o‘z hududida siljiydi va klaviatura bilan fokus oladi. Yorug‘ va tungi ko‘rinish tekshirildi. Builder, telefon labirinti va natijalar uchun axe WCAG 2.2 tegli avtomatik skanlarda **0 xato**. Bu to‘liq qo‘lda WCAG auditi yoki sertifikat emas.

Yangi navigatsiya qo‘shilgach torroq desktoplarda menyu yig‘iladi; atlas sahifalari ekran chetiga chiqib ketmaydi.

Mavjud bo‘limlar haqiqiy Chromiumda qayta tekshirildi:

- Matematika: 62 mavzu, 7 tayanch tajriba, 7 WebGL jism, yorug‘/tungi/mobil/sinf doskasi.
- Kimyo: modda miqdorlari, animatsiya, taqqoslash, daftar saqlash/yuklash va 12 amaliy ish.
- Ingliz tili: to‘liq A2 matnli labirint, avtomatik ovozsiz.
- Biologiya: sinovni boshlash/qayta boshlash; tayyor GLB, anatomiya qatlamlari, kesim, mobil/doska, aktiv xatosidan 2Dga o‘tish va 3Dni qayta yuklash.
- Guruh chatida matn/XSS, ovoz va ustoz topshirig‘i. Kodli test, typing va bitta ekrandagi 1v1 regression UI sinovlari ham o‘tdi.

Vite/lucide buildida “use client” direktivasi haqida ogohlantirish bor; buildni to‘xtatmaydi. Parallel test serverlari ba’zan HMR porti haqida ogohlantiradi; funksional tekshiruvlar o‘tdi. Brauzer sinovida ushlangan runtime xatolari: **0**.

Production Supabase/Vercel loyihasida migratsiya va deploy foydalanuvchi tomonidan bajariladi. Katta sinfga server yuklama sinovi, uzoq muddatli production monitoring va har bir qurilma uchun tezlik kafolati bu tekshiruvga kirmaydi.
