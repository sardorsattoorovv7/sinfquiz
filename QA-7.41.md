# QA — SinfQuiz 7.41.0

Tekshiruv sanasi: 2026-10-30.

## Avtomatik testlar

`npm test`: **320 test, 320 o‘tdi, 0 xato**. Mavjud piano, Supabase/RLS, testlar, ingliz tili, laboratoriyalar va boshqa regressiya testlari ham shu natijaga kiradi.

Informatika uchun yangi model testlari RAM / SSD quvvat tajribasi, 256 ta bayt qiymati, buzilgan qoralama, saqlash bloklanishi, progress va ball hisoblash, mehmon deep-linki hamda amaliy ishlarning qism identifikatorlarini tekshiradi.

`npm run build`: muvaffaqiyatli. Oldindan mavjud lucide-react `use client` bundler ogohlantirishlari buildni to‘xtatmaydi.

## Brauzerda haqiqiy WebGL bilan

`tests/informatics-browser.mjs`: **PASS**.

- 12 tarixiy sahna: dars, eksponat va o‘rganildi holati.
- 18 qism: tanlash, ma’lumotlar va o‘rganildi holati.
- Qismlarga ajratish, kamera burchagi, yaqin ko‘rish va keng ekran.
- Qo‘lda 2D / 3D o‘tish va WebGLsiz avtomatik 2D zaxira.
- 6 OS yuklanish bosqichi va Windows misoli.
- Saqlanmagan RAM o‘zgarishi quvvat uzilganda yo‘qolishi; saqlangan faylning SSDda qolishi va RAMga qayta ochilishi.
- 8 bitli laboratoriya: bitni o‘zgartirganda qiymat o‘zgarishi.
- Yig‘ish mashqida noto‘g‘ri tanlovdan keyin to‘g‘ri qayta urinish va 8 qadam yakuni.
- 4 diagnostika holati va 12 savolning to‘g‘ri javobi.
- 100% progress, sahifani yangilagandan keyin tiklash va JSON eksport.
- Atlaslar ro‘yxatidan mehmon navigatsiyasi.
- 390 px telefon ko‘rinishida sahifa yonlama chiqib ketmasligi.
- Tungi ko‘rinish, kamaytirilgan harakat va localStorage bloklangan holat.
- History, anatomy, system, practice, mobile, mobile-dark va WebGLsiz holatlarda axe WCAG 2 A/AA, 2.1 AA hamda 2.2 AA: **0 avtomatik aniqlangan buzilish**.
- Brauzerning `pageerror` hodisalari: **0**.

Sinov ish stoli va telefon o‘lchamida headless Chromiumning dasturiy WebGL rendererida bajarildi. Bu barcha real telefonlarda bir xil kadr tezligini kafolatlamaydi. Avtomatik axe testi barcha foydalanish holatlarini yoki qo‘lda accessibility auditini almashtirmaydi.

## Boshlang‘ich yuklanish

Atlas va 3D sahna alohida kechiktirib yuklanadi. Yangi atlas CSS fayli umumiy boshlang‘ich CSSga qo‘shilmadi. `npm run perf` budjeti o‘tdi.

- Boshlang‘ich JavaScript: 587,011 bayt; gzip: 172,552 bayt.
- Boshlang‘ich CSS: 314,436 bayt; gzip: 55,345 bayt.
