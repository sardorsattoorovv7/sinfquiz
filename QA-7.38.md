# SinfQuiz 7.38.0 — tekshiruv natijalari

- `npm test`: **300 ta test o‘tdi, 0 xato, 0 tashlab ketilgan**. Yakuniy log: `qa-7.38.0/all-tests.log`.
- `npm run build`: production build muvaffaqiyatli. Log: `qa-7.38.0/build-final.log`.
- `npm run perf`: barcha hajm chegaralari bajarildi. Hisobot: `qa-7.38.0/performance.json`.

## Yangi repertuar

6 ta BLOK3 va 5 ta hindcha kino melodiyasi: 11 ta karta, 616 ta nota, 5,869 bayt yangi MIDI. 4 ta tayyor MIDI manbasi va 7 ta notadan tayyorlangan qisqa dars alohida belgilangan. Har bir faylning SHA-256 qiymati va barcha nota hodisalari ilovadagi darsga solishtirildi. Eksport va ekran bitta nota ketma-ketligini ishlatadi. Klip chegarasida 30 ms dan qisqa yakuniy nota bo‘lagi tashlanadi, shunda MIDI qayta o‘qilganda 30 soniyadan cho‘zilmaydi.

Barcha 11 karta tarmoq bloklangan holatda ochildi; yuklash oynasisiz tinglash boshlandi va haqiqiy repertuar notalari tekshiriladigan audio dvigateliga jo‘natildi. Har bir kuyda Do–Re–Mi darsi boshlandi va dastlabki ikki qadam bosildi. Kusura Bakma darsi oxirigacha bajarilib natija saqlandi. Noto‘g‘ri nota darsni oldinga o‘tkazmadi. Joriy qadamni eshittirish, nota yozuvi va oldingi kuylar sinovlari ham o‘tdi. Tashqi MIDI so‘rovlari: **0**.

`ogirlanmagan kelin`, `O‘g‘irlanmagan kelin`, `DDLJ`, film nomi va `shoxruxxon` qidiruvlari tekshirildi. Turkcha saralagich 6 ta, hindcha 5 ta natija beradi. Oldingi chap qo‘l sozlamasi yangi o‘ng qo‘l melodiyasiga moslanadi. Oldingi ikki qo‘l repertuari saqlangan.

Kusura Bakma’dagi bog‘langan nota, Sebebi Yar’dagi pauza va triolalar, Tujhe Dekha Toh boshidagi manba nota ketma-ketligi alohida tekshirildi. MIDI parserida tanlangan kanal/trek ajratilishi metronom tempi, vaqtlar va o‘ng qo‘lning Do4dan pastga o‘tishini saqlaydi. Oddiy MIDI importi o‘zgarishsiz ishlaydi.

## SinfQuiz regressiyasi

Mehmon, o‘quvchi, ustoz va administrator uchun yangi asosiy kuy ochilishi hamda mashqlarga qaytish tekshirildi. Oldingi 20 inglizcha hit va 21 Bella Ciao/turkcha xalq-mumtoz kuy sinovlari saqlangan. Navigatsiya, kodli kirish, fan tanlash, test va natijalar, typing, musobaqalar, darslar, atlaslar, Paper Workshop, rang kontrasti, theme, API/RLS/SQL sinovlari o‘tdi. Python runtime standart tayyorlash skripti bilan tiklandi va haqiqiy print/input hamda import cheklovi testi bajarildi.

7.37.0 ZIPdagi 1,227 faylning barchasi saqlangan. Oldingi 503 ta SQL, public va data resursi baytma-bayt o‘zgarmagan. Auth, API, RPC, RLS va natijalarni saqlash kodi o‘zgarmagan; yangi SQL, dependency yoki environment yo‘q.

## Performance

Boshlang‘ich JavaScript **583,479 bayt**, gzip taxmini **171,612 bayt**. Boshlang‘ich CSS **314,436 bayt**, gzip taxmini **55,345 bayt**. Siqilmagan boshlang‘ich hajm 7.37.0 bilan bir xil; gzip JS farqi 6 bayt. Pianino kechiktirib yuklanadigan JS moduli 302,836 bayt, CSS 34,703 bayt. Yangi kuylar bosh sahifada yuklanmaydi. Bu resurs hajmi o‘lchovi; real qurilmadagi tezlik yoki Lighthouse/LCP/INP o‘lchovi emas.

## Sinov chegaralari va arxiv

UI sinovlari Node/JSDOM/Vite SSR orqali, audio hodisalari esa mock dvigatel bilan bajarildi. Haqiqiy brauzer, 320–390 px telefon/planshet/katta ekran, sensor qurilma, tashqi MIDI klaviatura, jonli Supabase hisoblari va ovozni eshitib solishtirish sinovi bajarilmadi. Browser boshqaruvi mavjud bo‘lmagani sabab preview server yoki yangi browser o‘rnatilmadi.

To‘liq ZIP paketlash skripti bazadagi barcha fayllarni solishtiradi, har bir arxiv yozuvining baytlarini va CRCni tekshiradi. Yuklab olinadigan saqlangan nusxa yakunda alohida qayta olinib, lokal ZIPning hajmi, SHA-256 va CRCsi bilan solishtiriladi. O‘rnatish: UPDATE-7.38.md; manba va moslash tafsilotlari: PIANO-SOURCES-7.38.md.
