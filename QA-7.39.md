# SinfQuiz 7.39.0 — tekshiruvlar

- `npm test`: **308 test o‘tdi, 0 xato, 0 tashlab ketilgan**. Log: `qa-7.39.0/all-tests.log`.
- `npm run build`: production build muvaffaqiyatli. Log: `qa-7.39.0/build-final.log`.
- `npm run perf`: resurs hajmi chegaralari bajarildi. Hisobot: `qa-7.39.0/performance.json`.

## Yangi kuylar

20 ta yangi melodiya: Training Season naqorati, 9 ta turk seriali mavzusi va 10 ta hindcha kino kuyi. Jami **1,209 nota**, **11,294 bayt yangi MIDI**. 5 ta tayyor MIDI manbasi va 15 ta notadan tayyorlangan o‘quv parcha ochiq belgilangan. 3 ta pitch-only hindcha notada o‘quv ritmi soddalashtirilgani tavsifda yozilgan.

Barcha 20 karta tashqi so‘rovlar bloklangan holatda ochilib, haqiqiy nota ma’lumotini audio scheduler’ga jo‘natdi. Har bir kuyning ilk ikki tutorial qadami chalindi. Training Season’ning 55 qadamli naqorat darsi oxirigacha bajarilib, natijasi saqlandi. Noto‘g‘ri nota oldinga o‘tkazmadi. Tashqi musiqa so‘rovlari: **0**.

Har bir eksport faylining SHA-256 qiymati, nota balandligi, davomiyligi va vaqti ilovadagi darsga solishtirildi. Anlatamam boshidagi 0.46875 s pauza darsda ham, MIDI’da ham saqlandi. Tayyor MIDI parseri boshlang‘ich sukunatni odatda olib tashlaydi; generator manbadagi pauzani aniq tiklaydi. Oxirdagi 32 ms dan qisqa kesilgan nota bo‘laklari tashlanib, qayta o‘qishda 30 soniyadan oshishning oldi olingan.

5 ta original bepul MIDI’ning haqiqiy fayl SHA-256 qiymatlari tekshirildi; manbaning dastlabki 30 soniyasidagi notalar input darsga balandlik va son bo‘yicha aynan, vaqt/davomiylik bo‘yicha <2 ms farq bilan mos. Main Agar Kahoon’ning−12 semiton oktava moslashi hisobga olingan. Hisobot: `qa-7.39.0/source-fidelity.json`. To‘liq manba fayllari ZIPga kiritilmagan.

`Dua Lipa Training Season`, `Chuqur`, `Kara Sevda`, `Ish va qasos`, `Ishq va qasos`, `Janam Janam` va film nomi orqali qidiruv tekshirildi. Kara Sevda ikki alohida mavzuni, Ishq va qasos esa Marjaavaan’dan Tum Hi Aana va Thodi Jagah’ni beradi.

## Yonlama piano

Avtomatik viewport hisoblari 320×640, 390×844, 768×1024, 1024×768, 1920×1080 va 3840×2160 o‘lchamlarda tekshirildi. Bu real ekran renderi emas; aylanish va maydon o‘lchamini hisoblash sinovidir.

JSDOM UI sinovlari quyidagilarni tekshirdi:

- Fullscreen API bo‘lmasa ham 90° sahna ochilishi; root dialog va fonning vaqtincha `inert` holati.
- Tutorial’ni yonlama sahnada davom ettirish, notalarni pointer bilan bosish, ikki qadamdan keyin qaytganda shu qadamni saqlash.
- Aylantirish vaqtida ushlangan notalarni qo‘yib yuborish; nota yozuvi sozlamasining ekranga va saqlashga o‘tishi.
- Qurilma orientation hodisasiga javoban avtomatik joylashuvni tiklash; viewport kengligi va balandligi yangilanishi.
- Native fullscreen’ni tashqi qobiqda ochish, landscape so‘rash, fullscreen’dan tashqaridan chiqqanda ekran qulfini bo‘shatish.
- Fullscreen/orientation rad etilganda CSS sahnaning ishlashi, Esc orqali chiqish va audio transport’ni pauza qilish.
- Fullscreen so‘rovi hali kutilayotganda sahnani yopish: kech kelgan javob sahnani qayta ochmasligi va orientation lock qoldirmasligi.
- Chiqishda body scroll, oldindan mavjud `inert` holati va fokusni tiklash.

CSS safe-area va visualViewport hisoblari, minimal 44 px boshqaruvlar, qo‘lda tanlangan tor yo‘nalishda tutorialning ustga o‘tishi va reduced-motion qoidalari kiritilgan. Ularning haqiqiy mobil brauzerdagi joylashuvi qo‘lda ko‘rilmagan.

## Mavjud SinfQuiz

Oldingi 52 kuy va 38 mashq, MIDI import/eksport, audio, sustain, qayd yozish, keyboard/pointer hodisalari va canvas performance testlari o‘tdi. Mehmon, o‘quvchi, ustoz va administrator uchun yangi asosiy kuy ochilishi va mashqlarga qaytish tekshirildi. Sinfga kodli kirish, navigatsiya, fanlar, test/natija, musobaqa, typing, darslar, atlaslar, theme/kontrast, RPC/RLS/SQL va haqiqiy Python runtime testlari o‘tdi.

7.38.0 ZIPdagi **1,254 faylning barchasi** saqlangan; oldingi **517 ta SQL/public/data resursi baytma-bayt o‘zgarmagan**. Auth, API, RPC, RLS va natijalarni saqlash kodi o‘zgarmagan. Yangi SQL, dependency yoki environment yo‘q.

## Performance va sinov chegaralari

Boshlang‘ich JavaScript **583,481 bayt**, gzip taxmini **171,609 bayt**. CSS **314,436 bayt**, gzip taxmini **55,345 bayt**. 7.38.0 ga nisbatan siqilmagan JS+2 bayt, CSS o‘zgarishsiz. Yangi piano JS moduli 362,086 bayt va CSS 42,623 bayt; ular pianino bilan birga kechiktirib yuklanadi. Bu resurs hajmi o‘lchovi, real LCP/INP/Lighthouse natijasi emas.

Sinovlar Node/JSDOM/Vite SSR va mock audio engine orqali o‘tdi. Haqiqiy brauzer screenshot’i, iPhone/Android/planshetda sensor va viewport sinovi, ovozni eshitib solishtirish, tashqi MIDI qurilma hamda jonli Supabase hisoblarida E2E bajarilmadi. Browser boshqaruvi mavjud bo‘lmagani sabab preview server ishga tushirilmadi yoki yangi brauzer o‘rnatilmadi.

ZIP paketlash skripti barcha bazaviy fayllar va arxiv yozuvlarini solishtiradi, CRC va SHA-256ni tekshiradi. Saqlangan nusxa yakunda qayta yuklab olinib, lokal ZIP hajmi, SHA-256 va CRCsi bilan solishtiriladi. O‘rnatish: UPDATE-7.39.md; barcha manbalar: PIANO-SOURCES-7.39.md; o‘zgargan fayllar: CHANGED-FILES-7.39.md.
