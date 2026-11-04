# SinfQuiz — sahifalar inventari

2026-11-03. React 19 + Vite 8, mavjud hash navigatsiyasi, Supabase Auth/Postgres/Realtime, Vercel server API va doimiy Speaking worker saqlandi. Dizayn uchun ma’lumot migratsiyasi, ikkinchi router yoki yangi auth tizimi yaratilmaydi.

## Kirish va umumiy qobiq

| Sahifa / ichki view | Manzil yoki kirish | Rollar | Haqiqiy manba va holatlar |
|---|---|---|---|
| Bosh sahifa `home` | `/` | Mehmon, o‘quvchi, ustoz, admin | Auth tayyor bo‘lguncha ochiq kod formasi; katalog va faol xonalar mavjud API’dan. Sun’iy progress yo‘q. |
| Kod formasi va keyingi `join` | Bosh sahifa / header | Mehmon ham ruxsat etilgan | `ClassJoinForm` → mavjud kod/xona qidiruvi → ism → `/api/play/join`; bo‘sh, tekshirish, topilmadi, yopilgan, aloqa va muvaffaqiyat. Boshdagi nollar saqlanadi. |
| Hisobga kirish `login` | Header | Hisobsiz foydalanuvchi | `AuthViews`: Supabase email/parol, ro‘yxatdan o‘tish, Telegram mavjud bo‘lsa; kod bilan kirishdan alohida. Xato va qayta urinishda forma qoladi. |
| Eski ustoz login oynasi | Mavjud administrator kirishi | Ustoz/admin | Mavjud `/auth/login`, shu notebook formalar. |
| Ochiq tanishtiruv sahifalari | `/fanlar/*`, `/darsliklar`, `/ingliz-tili`, `/ustozlar/sinfxona` | Barcha | `seo-pages.js`, o‘qiladigan statik matn; interaktiv ilovaga haqiqiy havolalar. |
| Sozlama yetishmaydi / yuklash / xato | Mavjud guard / error boundary | Tegishli foydalanuvchi | Haqiqiy so‘rovga bog‘langan holatlar, qayta urinish; xato tafsiloti alohida. |

## Fanlar, darslar va atlaslar

| Sahifa / ichki view | Manzil yoki kirish | Rollar | Manba / saqlanadigan holatlar |
|---|---|---|---|
| Fanlar | Bosh sahifa `#paper-subjects` | Barcha | Mavjud fan yo‘llari va faol materiallar; nom, izoh, haqiqiy ochish amali. |
| Atlaslar markazi `atlasHub` | `/#atlaslar` | Barcha | `atlas-learning/catalog.js`, 6 atlas, mavzu qidirish/filtr, hisobga ajratilgan mahalliy qaydlar. |
| Matematika `mathAtlas` | `/#matematika` | Amaldagi auth qoidasi | `MathAtlas`, 62 mavzu; o‘zgaruvchi hisoblar, 3D/fallback, topshiriq va qaydlar. |
| Biologiya `biology` | `/#biologiya` | Ochiq atlas; ustoz amallari himoyalangan | 30 mavzu, 11 anatomik guruh; organlar, kesimlar, qismlar, o‘simlik jarayonlari, amaliy ishlar. |
| Kimyo `chemistry` | `/#kimyo` | Amaldagi auth qoidasi | Kimyo atlasi/laboratoriya, reagentlar va haqiqiy sonli model; xatolar, kuzatuv va ustoz topshiriqlari. |
| Fizika/koinot `space` | `/#koinot` | Amaldagi auth qoidasi | 53 hodisa, 3D sahnalar, 2D fallback, amaliy hisoblar va faol mashg‘ulot guard’i. |
| Informatika `informaticsAtlas` | `/#informatika-atlasi` | Barcha | 18 GLB qism, 12 tarixiy bekat, ENIAC va OS/RAM laboratoriyalari; yuklash va WebGLsiz fallback. |
| Tarix `historyAtlas` | `/#tarix-atlasi` | Barcha | 12 davr, xarita, manba, dalil ustaxonasi, mahalliy foydalanuvchi qaydlari. |
| Darsliklar `books`, `bookPractice` | `/#darsliklar`, tanlangan kitob | O‘quvchi/ustoz/admin | `TextbookHub`, kitob va mavzular qidiruvi, o‘qish hamda mos amaliy ish. |
| Katalog `catalog`, dars `lesson` | Mavjud fan/dars tanlovi | Amaldagi ruxsat | `/api/catalog`, dars manbasi; yuklash, bo‘sh, xato, uzun matn, kod va jadval. |
| Ingliz tili `englishCourse` | `/#ingliz-darsi` | Mavjud ochiq/kirish oqimi | 108 dars, diagnostika, topshiriq va o‘zlashtirish qoidalari saqlangan. |

## Testlar, natijalar va amaliy mashqlar

| Sahifa / ichki view | Kirish | Rollar | Manba / saqlanadigan holatlar |
|---|---|---|---|
| Jonli test `play` va natija `result` | Kod bilan kirish | Qatnashuvchi | Server sessiyasi, haqiqiy savol turlari, taymer va baho; Python/Office muharriri, feedback, ranking va chiqish guard’i. |
| Milliy test `national`, `nationalExam` | Menyu / tanlangan variant | Kirgan foydalanuvchi | E’lon qilingan variantlar, server savol/vaqt/saqlash, natija va ruxsat etilgan xato ko‘rish. |
| CEFR `cefr`, `cefrManaged`, `cefrExam` | CEFR/Multilevel | Amaldagi auth/ustoz ruxsati | Listening/Reading/Writing/Speaking, audio, yuborish va tekshirish holatlari. |
| Ochiq imtihon `practice` | `/#open-exam` | Amaldagi ruxsat | Mavjud mashq banki, bilim qamrovi va natijalari. |
| IQ `iq` | `/#iq` | Kirgan foydalanuvchi | Haqiqiy savol banki, deadline, saqlangan urinish; IQ percentili uydirilmaydi. |
| Musobaqalar `competitions` | `/#musobaqa` | Mehmon/qatnashuvchi/ustoz/admin | Jamoa, davomat, xona kodi, kutish va bosqichlar; server ruxsatlari saqlangan. |
| Poyga `raceJoin`, `race` | Mavjud faol xona | Qatnashuvchi | Xona tanlash, ism, server holati/taymer/natija. |
| Matn terish `typingJoin`, `typing` | Mavjud faol xona | Qatnashuvchi | Asl foydalanuvchi tahriri saqlangan `typing-lessons.json`, tezlik va xato hisoblari. |
| Mashqlar katalogi `exerciseHub` | `/#mashqlar` | Barcha, ichki yo‘llar o‘z ruxsatida | Mavjud qidiruv, haqiqiy mashq yo‘llari. |
| Audio labirint `audioMaze` | `/#audio-maze` | Mavjud qoidalar | Audio topshiriqlar, sahna, boshqaruv va WebGL fallback. |
| Kino Piano `cinemaPiano` | `/#kino-piano` | Barcha | Tayyor kuy/MIDI, tovush, tezlik, nota, saqlangan sozlamalar va yonlama rejim. |
| Profil/natijalar `profile` | `/#profil` | O‘quvchi, faqat o‘z qaydlari | Haqiqiy natijalar, ko‘nikma turiga mos guruhlash, bo‘sh tarix va qayta yuklash. |
| Dars suhbati `chat` | `/#suhbatlar` | Amaldagi auth/rol | Shaxsiy guruh/dars xabarlari; eskirish, tarmoq va ruxsat holatlari. |

## Ustoz va administrator

`admin` → `/#dashboard`: foydalanuvchining haqiqiy roli tekshiriladi. Mavjud ichki bo‘limlar — testlar, savol muharriri, milliy testlar, darslar, ommaviy kodlar, poyga, matn terish, guruhlar, suhbatlar, natijalar, eksport, admin foydalanuvchi tahlili — shu notebook qobig‘i va forma tokenlarini ishlatadi. Header’dagi “Test yaratish” haqiqiy yangi test muharririni ochadi. Saqlash server javobidan keyin tasdiqlanadi; o‘chirishning mavjud aniq tasdig‘i saqlangan.

`classroom` → `/#sinfxona`: faqat ustoz/admin. Doska, taymer, son tanlash, ovoz paneli va namoyish boshqaruvlari saqlangan. `classroomDenied` ruxsat yo‘qligini ko‘rsatadi; client yashirishi server ruxsati o‘rnini bosmaydi.

## AI va Speaking

`speaking` → `/#ai-speaking`: maqsad/jadval, mikrofon tekshiruvi, rozilik, IELTS/Multilevel sinovi, yozuvni tinglash/yuborish, navbat, original transkript va hisobot, shaxsiy yo‘l, bugungi vazifalar, iboralar, xatolar, qayta mashq va yangi savoldagi tekshiruv. `/api/ai-speaking` + private Supabase saqlash + doimiy worker + Groq ishlatiladi. Talaffuz/audio baholovchisi yo‘q mezonlarga ball uydirilmaydi. Ovozli savol/PDF xizmatlari mavjud bo‘lmasa faol tugma bilan ko‘rsatilmaydi.

`aiGuide` → `/#ai-yordamchi`: haqiqiy `/api/ai-assistant`, roldagi mavjud yo‘llar, tushuntirish va interaktiv savollar. “Yordam” paneli oddiy sahifalarda ochiladi; test, imtihon yoki faol mashg‘ulotda yashirin yordam ochilmaydi. Hisob talabining sababi oddiy matnda aytiladi.

## Tekshiruv tartibi

Har guruh uchun desktop (1440/1024), planshet (768), mobil (390/360), kunduz/tun, klaviatura va loading/empty/error tekshiruvi qo‘llanadi. Asosiy inventar yakuniy QA’da ushbu ro‘yxat bilan solishtiriladi. Haqiqiy server ma’lumotini o‘chiradigan sinovlar bajarilmaydi; integration fixture’lari alohida ishlatiladi.
