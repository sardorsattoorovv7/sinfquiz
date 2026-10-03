# Tekshiruvlar — SinfQuiz 7.20

Sana: 2026-10-03. React/Vite build; Node 22+; haqiqiy headless Chromium; WebGL SwiftShader; Postgres/PGlite. API fixture va test hisoblari ishlatildi, jonli Supabase yoki foydalanuvchi ma’lumotlariga yozilmadi.

## Avtomatik hisob va ruxsatlar

`npm test`: **95 / 95**, xato 0. Bunga avvalgi Informatika, Python muhiti va cheklovlari, Telegram HMAC, CEFR, milliy test, 6 xonali kod reytingi, typing, split 1v1, profil va eski RLS testlari ham kiradi.

Yangi `atlas-experiments.test.js`: 1/4 + 1/3 = 7/12; tarozining ikki tomonida tenglikni saqlash; nolga bo‘lish/ko‘paytirish rad etilishi; kvadrat va degenerativ tenglamalar; 8×5/2=20, C surilganda yuza saqlanishi, burchaklar 180°; teng tomonli uchburchak 60°; 3–4–5 va kvadrat yuzalari. Prizma/piramida yoyilmalarining 0/35/100% holatida yuza, silindr/konusning tekis yoyilmasi va 6 jism kesimi hisoblandi. Uchburchak meshning yaxlitlash/discretizatsiya chegarasi testda ko‘rsatilgan.

Kimyoda barcha 6 tenglama atom balansi; chegaralovchi reagent; har reaksiya uchun o‘z vaqt hisobi; harorat va tartibning ta’siri; noma’lum metall–kislota kombinatsiyasiga gaz qo‘shilmasligi; erigan/qoldiq NaCl yig‘indisi; pH, neytrallanish, tuz o‘tkazuvchanligi va hisoblanmaydigan pH; aralashmalarga sof suv fazasi qo‘llanmasligi tekshirildi. 12 amaliy ishning kuzatish shartlari berilgan to‘g‘ri sinovlarda bajariladi, bo‘sh sinovlarda bajarilmaydi.

`experiments-rls.test.js`: migratsiya **Cron yo‘q** muhitda ikki marta o‘rnatildi. Begona ustoz guruh/xabar/natijani o‘qimaydi; noto‘g‘ri kod urinishlari hisoblanadi; 6-urinish va 9-xabar limitdan o‘tmaydi. Guruh egasi/kodi o‘zgarmaydi. Ovoz ustuni to‘g‘ridan-to‘g‘ri ochilmaydi; noto‘g‘ri fayl imzosi rad etiladi; 25 soatlik xabar/ovoz o‘qilmaydi. Realtime signalida matn/ovoz yo‘q. Ustoz o‘z guruhiga ish beradi, ommaviy ish admin tasdig‘idan o‘tadi, o‘zgartirilgan ommaviy mazmun qayta tasdiqlanadi. O‘quvchi boshqa ID bilan yozmaydi, server ismni profildan oladi; takroriy client token va buzilgan daftar rad etiladi; ustoz natijani almashtirmay, faqat fikr yozadi.

## Brauzerda bajarilgan oqimlar

`tests/upgrade-7.20-browser.cjs` o‘tdi:

- Biologiyani taxmin yozmasdan boshlash, pauza va yakunidan qayta boshlash.
- 62 mavzu xaritasi, 7 asosiy tajriba va 7 fazoviy jismning haqiqiy WebGL modeli, yoyilma va kesim. Uchburchak 8×6/2=24; gorizontal siljishdan keyin ham 24.
- Javondan sirka/soda/sovun tanlash, miqdor kiritish, maket jihozini tanlash, vaqt/harorat, pauza, ikki sinovni saqlash va qayta ko‘rish. Pauzada 500 ms ichida WebGL `drawElements` soni oshmadi. 12 amaliy ish ochildi, 2D va molekula ko‘rinishi ishladi.
- Daftarda uchta modda va ikkita taqqoslash natijasi yuborildi; JSON yuklandi.
- Mustaqil A2 matnli labirintning to‘liq yo‘li va barcha savollar. Avtomatik speech chaqiruvlari **0**.
- Ustozning guruh yaratishi, matn va mikrofon yozuvi, guruhga topshiriq biriktirishi. `<img ... onerror=...>` oddiy matn bo‘lib qoldi; DOMda rasm yoki bajarilgan skript yo‘q. Mikrofon uchun Chromiumning sinov qurilmasi ishlatilgan.

Oldingi brauzer regressiyalari ham o‘tdi:

- `biology-browser.cjs`: 30 mavzu, yakunlangan 12 amaliy ish, barcha o‘lchovlar chekli, mobil va tungi rejim.
- `chemistry-browser.cjs`: 12 atlas sahnasi, 118 element, atom/ion, molekula qurish, holatlar, balans/pH/tezlik/ajratish; 13 eski yo‘naltirilgan model, ustoz nusxasi, qoralama, yuborish va admin tasdig‘i.
- `discovery-browser.cjs`: WebGL, kub hajmi/yoyilma/kesim, SVG zaxira, to‘liq ovozli labirint, xato javobga izoh, natija vaqti va ustozga tegishli natijani ajratish.

## UI va foydalanish qulayligi

**1440×1000 desktop, 390×844 telefon, 1920×1080 sinf doskasi** o‘lchamlarida ochildi. Sahifaning gorizontal chiqib ketishi aniqlanmadi. Yorug‘/tungi ko‘rinish, fokus, klaviatura va reduced-motion sinovdan o‘tdi. Matematika va kimyo ekranlari rasmlari ko‘z bilan ko‘rildi; laboratoriya stoli tungi rejimga moslashtirildi. Oldingi dizayn rasmining fayli mavjud bo‘lmagani sababli aynan o‘sha rasm bilan yonma-yon tekshiruv bajarilmadi.

Axe WCAG 2 A/AA, 2.1 AA va 2.2 AA: yangi matematika desktop/tungi mobil, kimyo desktop/tungi va guruh chatida **0 avtomatik violation**. Biologiya va eski kimyo sahnalarining axe tekshiruvlari ham o‘tdi. Bu qo‘lda ekran o‘quvchi sinovi yoki WCAG sertifikati emas.

`npm run build` muvaffaqiyatli. Vite/Reactning uchinchi tomon modul direktivalari haqida build ogohlantirishlari bor; buildni to‘xtatmadi. Brauzerda preload ogohlantirishlari uchradi, lekin tekshirilgan oqimlar va WebGL ishladi; yangi yakuniy brauzer testida runtime xato **0**.

## Amaliy chegaralar

Bu dalillar lokal Chromium va Postgres muhitiga tegishli. Supabase Realtime serverining ulangan holati, Vercel muhit kalitlari, real email/Telegram, haqiqiy mobil mikrofon va uzoq davom etuvchi ko‘p foydalanuvchili yuklama alohida production tekshiruvini talab qiladi. Kimyo modelining fizik soddalashtirishlari `UPDATE-7.20.md` va sahnalarning chuqur izohlarida yozilgan. Eski chatlarni fizik tozalash uchun Cron yoki rejalashtirgich kerak; 24 soatlik o‘qish cheklovi ularsiz ham ishlaydi.
