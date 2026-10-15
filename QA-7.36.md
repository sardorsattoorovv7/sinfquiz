# SinfQuiz 7.36.0 — tekshiruvlar

- `npm test`: **291/291**, xato 0; `qa-7.36.0/all-tests.log`.
- Toza `dist` bilan `npm run build`: muvaffaqiyatli; `qa-7.36.0/build-final.log`.
- `npm run perf`: belgilangan boshlang‘ich JS/CSS hajm chegaralari o‘tdi. JS 583 479 bayt, CSS 314 436 bayt; 7.35.0 bilan bir xil. Bu brauzer LCP/INP o‘lchovi emas.
- 20 ta asl MIDI SHA-256 bilan manba commitiga tekshirildi; 20 ta tayyor MIDI parchasining baytlari va JS nota ma’lumotlari tekshirildi. Jami 1 846 yangi nota; barcha parchalar 30 soniya doirasida (MIDI tick aniqligi uchun 1 ms chegara).
- React/JSDOM: har bir yangi kuyni tanlash → ijro jadvaliga to‘g‘ri notalar → Guide boshlash va birinchi notani bosish tekshirildi. Sarı Gelin barcha notalari bilan tugatildi va natija 100% saqlandi. Shu sinovda tashqi `fetch` chaqiruvi yo‘q.
- “Tayyor kuylar”da 21 ta ishlaydigan kuy bor; pullik yoki “MIDI yuklang” kartasi yo‘q. Eski shaxsiy fayl bog‘lanishlari va yangi shaxsiy import tekshirildi.
- MIDI import/export, haqiqiy boshlang‘ich BPM, sustain, ovoz transporti, klaviatura/sensor/MIDI kiritishi, yozuv limiti, barcha rollardan piano moduliga kirish va qaytish mavjud testlar orqali tekshirildi.
- Oldingi 7.35.0 ZIPdagi barcha fayllar paketda saqlanadi. SQL, modellar, oldingi audio va labirint fayllari o‘zgarmagani arxiv yig‘ishda tekshiriladi.

## Qamrov chegarasi

Yangi 20 kuy — **turkcha xalq va mumtoz melodiyalar**. Zamonaviy trend hitlar va hindcha kuylar bu yangilanishda yo‘q. Barcha yangi nota/MIDI ma’lumotlari CC BY-NC-SA 4.0, notijoriy foydalanish sharti bilan. O‘ng qo‘l melodiyasi va standart 12 notali piano talqini; manbaning mikrotonal pitch bend hodisalari ijro etilmaydi.

Testlar mahalliy fixture/JSDOM bilan bajarildi. Joriy muhitda qo‘llab-quvvatlangan brauzer boshqaruvi mavjud emas, shuning uchun yangi brauzer/screenshot, real telefon, haqiqiy MIDI qurilma, akustik chiqish yoki jonli Supabase tekshiruvi bajarilmadi. CSS o‘zgarmadi. Avvalgi browser QA faqat o‘sha versiyaga tegishli. Ushbu ZIP deploy qilinmagan.
