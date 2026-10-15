# SinfQuiz 7.34.0 — tekshiruvlar

| Tekshiruv | Natija |
| --- | --- |
| `npm test` | **288/288 o‘tdi**, xato 0; 61.85 soniya |
| `npm run build` | Production Vite build muvaffaqiyatli |
| Yangi repertuar testlari | 3/3 o‘tdi |
| Piano va Paper Workshop regressiyasi | To‘liq test to‘plamida o‘tdi |
| Piano + Paper Workshop CSS | Lightning CSS strict parser, warning 0 |
| Bella Ciao original MIDI | 2694 bayt, SHA-1 rasmiy manba qiymati bilan bir xil |
| Arxiv | Barcha oldingi fayllar saqlangan; CRC va ishchi manba bilan faylma-fayl tengligi tekshirildi |

## Yangi repertuar tekshiruvlari

- 254 ta original MIDI notasining pitch, davomiylik va vaqt nisbatlari manba bilan solishtirildi. Hech bir nota almashtirilmagan; butun aranjirovka 30 soniyaga moslangan.
- Tayyor notalar 30 soniya ichida va A0–C8 piano diapazonida. O‘ng va chap qo‘l uchun Guide guruhlari mavjud. MIDI eksport/parse round-trip barcha 254 notani saqlaydi.
- Standart sahifa Bella Ciao va 13 kartali “Turkcha va trend” bo‘limi bilan ochiladi. Mehmon, o‘quvchi, ustoz va administrator oqimlarida kirish va Mashqlar’ga qaytish tekshirildi.
- UI avtoijrosi Bella Ciao notalarini audio transportga beradi. O‘rganish rejimida o‘ng qo‘lning barcha guruhlari pointer hodisalari orqali yakunlandi; 100% natija localStorage’ga yozildi.
- Zamonaviy 12 kartada tayyor nota yo‘qligi, MIDI kutilishi va vaqt slayderi o‘chirilgani tekshirildi. Rasmiy tinglash havolalari HTTPS va yangi oyna uchun `noopener` bilan berilgan.
- `bella cio`, `Çav Bella`, ijrochi bilan `kusura BLOK3`, `cok guzel guluyorsun`, `atese dustum`, `napiyosun` qidiruvi tekshirildi.
- KUSURA BAKMA kartasiga yuklangan MIDI qo‘shiq nomi va ijrochisini saqlaydi. “Meniki”da ko‘rinadi; asl kartani qayta tanlash ulangan importni ochadi.
- Mavjud kino importlarining `filmId` bog‘lanishi bilan orqaga moslik tekshirildi. Avvalgi 38 tayyor mashq va 34 kino kartasi regressiyasi o‘tdi.
- Umumiy to‘plam autentifikatsiya, kodli kirish, fan modellari, test/natijalar, SQL ruxsatlari va boshqa mavjud oqimlarni ham qamrab oladi. Bu jonli production Supabase sinovi emas.

## Manba va muhit chegarasi

7.33.0 to‘liq ZIP bilan solishtirishda API/Supabase, SQL, savol ma’lumotlari, ilmiy modellar va Audio Labirintning manba fayllari o‘zgarmagani tekshirildi. Yangi SQL yoki dependency yo‘q. Production build’ning Lucide `use client` ko‘rsatmasi haqidagi mavjud ogohlantirishi build’ni to‘xtatmaydi.

Sinovlar Node/JSDOM va build muhitida bajarildi. Jonli brauzer viewport/overflow, haqiqiy telefon, eshitib baholash, audio chiqish kechikishi va jismoniy MIDI qurilmasi bu relizda tekshirilmagan. Avvalgi [Sites SKILL.md](skill://plugin_connector_1p_689987207de08191979cf68eca2941c6/sites/SKILL.md) ko‘rsatmasi: “If `$control-browser` is unavailable, skip browser QA”. Shu boshqaruv mavjud emasligi sabab boshqa browser yo‘li qo‘llanmadi.

Relizda jonli chart API yo‘q. Qo‘shiq metama’lumotlari va havolalari 2026-10-15 holatida tanlangan; ularning tashqi servisda ochilishi hisob, hudud va internetga bog‘liq. Bella Ciao notalari lokal to‘plamda bor.
