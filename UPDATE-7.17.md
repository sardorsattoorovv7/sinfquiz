# SinfQuiz 7.17 — 13 virtual laboratoriya ishi

Kimyo → **Tajriba qil** orqali yangi laboratoriya ishlarini oching. Atlasdagi avvalgi 12 yo‘nalish, 118 element, Informatika, Matematika va Ingliz tili bo‘limlari saqlandi.

## Ishga tushirish

1. ZIPni oching. Mavjud loyihani yangilashda o‘zingizning `.env` faylingizni saqlang; ZIPda maxfiy kalitlar yo‘q.
2. `npm ci` buyrug‘ini bajaring. Node.js 22.12 yoki yangiroq kerak.
3. Kimyo migratsiyasi avval bajarilgan bo‘lsa Supabase SQL Editor’da faqat `supabase-chemistry-labs.sql`ni RUN qiling. Kimyo hali o‘rnatilmagan bo‘lsa avval `supabase-chemistry-atlas.sql`, keyin `supabase-chemistry-labs.sql`ni bajaring. SinfQuiz asosiy sxemasi oldindan o‘rnatilgan bo‘lishi kerak.
4. Lokal: `npm run dev`. Vercel: loyihani push qiling yoki deploy qiling; kerakli `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` environment qiymatlari mavjud bo‘lsin. Frontend o‘zgargani uchun faqat SQLni RUN qilish yetmaydi.
5. Tegishli hisob orqali kiring, Kimyo atlasi → Tajriba qil.

Tayyor 13 laboratoriya sahnasi brauzerda ishlaydi. Migratsiya ustozning laboratoriya nusxalarini, boshlang‘ich parametrlarni saqlash va tasdiqlash uchun kerak. Yangi SQL RLS siyosatlarini almashtirmaydi; sahna ro‘yxati va har bir sahna uchun parametr chegaralarini kengaytiradi. Migratsiyani takror bajarish mumkin.

## Tajribalar

| Ish | Boshqaruv | Kuzatiladigan natija |
|---|---|---|
| Virtual ko‘pik vulqoni | Soda, kislota, ko‘pik darajasi | CO₂ miqdori, ideal gaz hajmi, ortiqcha reagent, kraterdan ko‘pik oqishi |
| Gazni elastik sharda yig‘ish | Ikki reagent miqdori | Shar kengayishi, CO₂ va hajm |
| Qizil karam indikatori | Namuna pH | Kislotali/neytral/asosli rang diapazoni |
| Neytrallanish | Kislota va asos mmol | Jonli pH, ekvivalent miqdor va ortiqcha ionlar |
| NaCl erishi | Tuz va suv massasi | Erigan tuz va qattiq qoldiq |
| Bug‘lanish va kristallash | Tuz, bug‘langan suv foizi | Qolgan suv, erigan tuz, kristall massasi |
| Filtrlash | Qum va erigan tuz | Filtrdagi qum, tuzli filtrat |
| Distillash | Tuz, yig‘iladigan suv foizi | Kondensator, yig‘ilgan suv va qolgan tuz |
| Suv va moy | Moy hajmi | Tomchilar va qayta hosil bo‘lgan ikki qatlam |
| Diffuziya | Suv harorati | Shartli tarqalish kengligi va nisbiy D |
| Qog‘oz xromatografiyasi | Erituvchi fronti masofasi | Uch shartli pigment masofasi va Rf |
| O‘tkazuvchanlik | Tuz va shakar konsentratsiyasi | Ionlar va nisbiy datchik ko‘rsatkichi |
| Korroziya | Namlik, kislorod, tuz omili | Shartli zanglash indeksi va temir yuzasidagi belgilash |

Har sahnada tayyorlash → boshlash → kuzatish oqimi, pauza, virtual bosqich slayderi va qayta tayyorlash bor. Miqdorlarni tajriba davomida almashtirish bloklanadi. Yangi sinov uchun qayta tayyorlang.

Yakunlangan oxirgi 6 sinov hisob/mavzu bo‘yicha shu brauzerda saqlanadi. CSV yuklash va jadvalni tozalash ishlaydi. Mavjud tajriba daftari sonli taxmin, javob izohi, kuzatish qoralamasi va TXT yuklashni saqlaydi. Ustoz nusxasidagi daftarni ustozga yuborish mumkin. Serverga animatsiya yoki slayderning har bir o‘zgarishi yuborilmaydi.

## Ustoz va admin

Ustoz boshqaruvi ichidan laboratoriya shablonini tanlang, izoh va boshlang‘ich miqdorlarni o‘zgartiring. Ustoz nusxasi admin tasdig‘iga yuboriladi. Admin tasdiqlagach faol nusxa o‘quvchi laboratoriyasida chiqadi. Boshqa ustoz qoralamasi va shaxsiy kuzatishlar RLS orqali ajratilgan. Ustoz o‘z nusxasini yopishi mumkin. Tahrir qilingan e’lon yana tasdiqlanadi.

## Aniqlik va ko‘rinish

Bu tajribalarning birga-bir real fizik nusxasi emas. Stoixiometriya, ideal gaz, pH va massalar balansi berilgan farazlar asosida hisoblanadi. Ko‘pik oqimi, indikator rangi, diffuziya, o‘tkazuvchanlik, zanglash va real vaqtlar ta’limiy soddalashtirishdir; sahna va `CHEMISTRY-SOURCES.md`da chegaralari ochiq ko‘rsatilgan. Virtual vulqon lava emas, kislota–gidrokarbonatning CO₂ ko‘pigidir.

Chizmalar loyiha uchun SVG orqali yaratildi; rasm/3D aktiv va yangi CDN olinmadi. Yorug‘/tungi rejim, mobil joylashuv, klaviatura slayderlari, fokus va kamaytirilgan harakat sozlamasi saqlandi.

## O‘zgargan fayllar

Yangi: `src/chemistry-labs.js`, `src/chemistry-lab-model.js`, `src/VirtualChemistryLab.jsx`, `src/chemistry-labs.css`, `supabase-chemistry-labs.sql`, `tests/chemistry-labs.test.js`, ushbu yo‘riqnoma va `QA-7.17.md`.

Yangilangan: `ChemistryAtlas.jsx`, `ChemistryScenes.jsx`, `chemistry-content.js`, `chemistry-workflow.js`, `chemistry-rls.test.js`, `chemistry-browser.cjs`, `CHEMISTRY-SOURCES.md`, versiya fayllari. Informatika, poyga, typing, auth va boshqa fanlarning bajariladigan kodi o‘zgartirilmadi.
