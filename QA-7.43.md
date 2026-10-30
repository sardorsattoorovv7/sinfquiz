# QA — SinfQuiz 7.43.0

Sana: 2026-10-30.

## Hisob va ma’lumot

- `npm test`: **333 test, 333 o‘tdi, 0 xato**. Bu oldingi 326 test va 7 yangi amaliy muhit testini o‘z ichiga oladi.
- Yangi 7 test: 170 fan mavzusining vaziyati, boshqaruvlarning chegaralari va hisoblarning yaroqliligi; aniq matematik misollar va birliklar; simmetriya va parallel tariflar; 12 tarixiy amaliyot; ENIACning 40 paneli/20 akkumulyatori va birlik aylantirishlari; 18 qismning bajariladigan holatlari; noma’lum parametrlarni cheklash.
- Keyingi integratsiya o‘zgarishlaridan so‘ng amaliy muhit, informatika va qo‘llanma bo‘yicha **19 test qayta bajarildi: 19/19 PASS**. Yakuniy amaliy hisoblar uchun **7/7 PASS**.
- Haqiqiy muhitdan o‘lchov olinayotgani da’vo qilinmaydi. Hisob va sifat modelining chegaralari mavzuda ochiq yozilgan.

## Yangi amaliy muhit — haqiqiy WebGL brauzer

`npm run test:e2e:reality`: **PASS**.

- Barcha **12 tarixiy bekat**ning xonasi ochildi; har birining bosqichli misoli yakunlandi va hisob javobi tekshirildi.
- ENIACning **40 panelli**, **9,14 × 15,24 m** xona modeli, ichkariga kirish, yurish, kamera bekatlari, noto‘g‘ri ulanishni bloklash, to‘g‘ri ulash va **23×17=391** tekshirildi. Erkin tushish jadvali ochildi.
- Barcha **18 kompyuter qismi**ning ishlash mashqi bajarildi.
- Matematika **62/62** va kimyo **25/25** mavzusining yangi 3D geometriyasi komponent probasida haqiqiy WebGLda chizildi; boshqaruvning yuqori chegarasi, jarayonning oxiri, boshqa kamera bekati va hisobni qayd etish ishladi.
- Haqiqiy ilova navigatsiyasi orqali matematika/Pifagor, biologiya/nafas, kimyo/filtrlash va fizika/og‘irlik amaliy muhitlari sinovdan o‘tdi. Hisobni jadvalga olish, bir xil sinovni takrorlamaslik va JSON yuklab olish tekshirildi.
- **320, 390 va 768 px**: to‘rtta fan amaliy muhiti va ENIACda yonlama chiqish yo‘q. Biologiya hujayrasi, kimyo titrlashi va okean modeli mobil holatda ochildi.
- Tungi rejim, kamaytirilgan harakat, klaviaturadagi kamera ko‘rsatmalari va sensor tugmalar mavjud.
- Yangi muhit va ENIAC boshqaruvlari uchun axe WCAG 2 A/AA, 2.1 AA va 2.2 AA: **0 avtomatik aniqlangan buzilish**. `pageerror`: **0**.
- WebGL ataylab o‘chirilganda ENIACning 40 panelli 2D rejasi va **999+1=1000** ishladi; matematik 2D rejimda Pifagor hisobi va sinov qaydi ishladi.

WebGLsiz maxsus sinovdagi `Error creating WebGL context` konsol xabari kutilgan: sinov rendererning ochilmasligini ataylab yaratadi. Foydalanuvchi o‘quvini davom ettira oldi.

## Oldingi funksiyalar regressiyasi

- `tests/informatics-browser.mjs`: **PASS**. 12 tarixiy mavzu, 18 qism, ajratish/yig‘ish, kamera, keng ekran, 2D/3D, 6 yuklanish bosqichi, RAM/SSD, bitlar, 8 yig‘ish vazifasi, diagnostika, 12 savol, qayta ochilgandagi progress, JSON, mehmon, mobil, tungi rejim, WebGLsiz va bloklangan localStorage holatlari.
- `tests/atlas-learning-browser.mjs`: **PASS**. Besh atlas markazi/qidiruvi, 174 mavzu va bo‘lim qo‘llanmasi, oldingi qaydlarni tiklash, yakunlash shartlari, hisoblar ajratilishi, JSON, mobil va tungi rejim. Har atlasdan bir qo‘llanma to‘liq bajarildi.
- Koinot va biologiyaning mavjud barcha 3D aktivlari ushbu versiyada alohida qayta test qilingani da’vo qilinmaydi; yangi integratsiya namunalar orqali, formulalar esa barcha mavzularda tekshirildi. Oldingi to‘liq 53 sahna testi `QA-7.42.md`da.

## Build va yuklanish

- `npm run build`: **PASS**. Mavjud lucide-react `use client` ogohlantirishi buildni to‘xtatmaydi.
- `npm run perf`: **PASS**; boshlang‘ich JS va CSS belgilangan limitlar ichida. Aniq miqdorlar `RELEASE-7.43.0.json`da.
- Amaliy 3D muhiti foydalanuvchi kirish tugmasini bosganda yuklanadi. Render o‘zgarish bo‘lganda chiziladi; ko‘rinmayotgan/berkitilgan sahnalar to‘xtaydi, resurslar chiqishda bo‘shatiladi.
- Yangi loyiha dependency yoki SQL migratsiyasi yo‘q. GitHubga push va ishlab turgan saytga deploy ushbu ZIP tayyorlash jarayonida bajarilmagan.

Avtomatik accessibility testi qo‘lda ekran o‘quvchi auditi yoki barcha haqiqiy telefonlarning tekshiruvi o‘rnini bosmaydi.
