# SinfQuiz AI va yuklanish yangilanishi — 2026-11-04

AI yordamchiga yengil SVG robot qo‘shildi. Ko‘rinishi so‘rovning haqiqiy holatiga mos o‘zgaradi; harakatni kamaytirish sozlamasi hisobga olinadi. Enter so‘rov yuboradi, Shift+Enter yangi qator ochadi. IME orqali yozish va bir so‘rovni tez-tez bosib takrorlash alohida tekshirildi. Suhbat maydoni qo‘llanma qadamlaridan oldin joylashgan.

Yangi IELTS/Multilevel sinovlari avval ko‘rilmagan tayyor variantlarni tasodifiy tanlaydi. Olti tayyor variant tugagach, server mavjud Groq modeli orqali yangi savollar yaratadi. Kundalik mashq savollari tugaganda ham shu yo‘l ishlaydi. Server bo‘lim tartibi, savol soni, vaqt va topshiriq shaklini belgilaydi; yaratilgan matn format, takror va uzunlik bo‘yicha tekshiriladi. Ko‘rsatilgan savollarning fingerprintlari hisob va imtihon turi bo‘yicha saqlanadi, eski sessiyalar ro‘yxati qisqarganda ham hisobga olinadi.

Mavjud sinovni davom ettirish ayni savol va vaqt chegarasini saqlaydi. “Yangi savollar bilan sinov” eski urinishni arxivlaydi va yangi rozilik bosqichini ochadi. Tarmoq uzilganda qayta urinish ayni yaratish tokenini ishlatadi; keshlangan natija ikkinchi AI chaqiruvini oldini oladi. Generatsiya ikki urinish va jami 12 soniya bilan cheklangan; shaxsiy javoblar savol generatsiyasiga yuborilmaydi. Yangi SQL migratsiyasi yoki qo‘shimcha kalit talab qilinmaydi.

Yuklanishda akkaunt profili og‘ir faoliyat modulidan ajratildi. Ustoz paneli va o‘quvchi katalogi faqat tegishli sahifada yuklanadi; AI sahifalarida umumiy panelning 15 soniyalik yangilanishi ishlamaydi. Panel so‘rovlari birlashtiriladi, akkauntga bog‘langan kesh ishlatiladi. Eski sahifalar uslublari kerak bo‘lganda ochiladi. Speaking bosh sahifasi butun savollar navbati o‘rniga sessiyaning ixcham xulosasini o‘qiydi.

Quyidagi hajmlar boshlang‘ich HTML yuklaydigan resurslar uchun. “Oldin” — ushbu yangilanishdan oldingi daftar versiyasi; vaqt emas, fayl hajmi solishtirilgan.

| Ko‘rsatkich | Oldin | Hozir |
| --- | ---: | ---: |
| CSS, bayt | 259 027 | 118 025 (54,4% kam) |
| CSS, gzip bayt | 47 821 | 21 147 |
| JavaScript, bayt | 355 760 | 359 670 |

Robot va yuklash boshqaruvi JavaScriptga 3 910 bayt qo‘shdi. Boshlang‘ich hajm budjeti o‘tdi. Mahalliy production buildning uchta alohida sovuq Chromium kontekstida, akkaunt so‘rovi 1 500 ms kechiktirilganda, bosh sahifa median 380 ms da ko‘rindi; bu internet yoki production server tezligi uchun kafolat emas. O‘lchovlar: [hajm farqi](qa-ai-upgrade/performance-delta.json), [to‘liq hajm hisoboti](qa-ai-upgrade/performance-after.json), [ochilish o‘lchovi](qa-ai-upgrade/startup-after.json).

Tekshiruvlar:

- 67/67 tegishli test o‘tdi: Speaking servis/tarmoq/SQL, variant yaratish, yordamchi klaviaturasi, yangi sinov oqimi, kechiktirilgan ma’lumot yuklash va daftar interfeysi. [Yakuniy natija](qa-ai-upgrade/validation-final.txt).
- Production build muvaffaqiyatli yakunlandi. [Build log](qa-ai-upgrade/build.log).
- Haqiqiy Chromiumda daftar uchun 33 ta, yordamchi uchun 11 ta tekshiruv; jami 12 ta accessibility auditi. Runtime xatosi yo‘q. Robot, Enter/Shift+Enter, 320/390/768/1440 px, qorong‘i mavzu, xato/bekor qilishda matnni saqlash tekshirildi. [Daftar natijalari](qa-notebook/browser-results.json), [yordamchi natijalari](qa-ai-integration/browser-results.json), [robot rasmi](qa-ai-upgrade/robot-desktop.png).
- Haqiqiy Groq javobidan IELTS uchun 18 ta, Multilevel uchun 8 ta yangi savol tasdiqlandi; server formati saqlandi. [Natija](qa-ai-upgrade/verified-generation.json).
- Alohida vaqtinchalik akkaunt bilan lokal HTTP API va haqiqiy Supabaseda profil, yangi sinov, muddatni saqlab davom ettirish, ixcham bosh sahifa, signed private audio upload, bir marta javob saqlash va keyingi savolga o‘tish tekshirildi. Takroriy so‘rov navbatni ikkinchi marta siljitmadi. Sinov audiosi va akkaunti o‘chirildi. [Natija](qa-speaking-fix/live-result.json). Bu tekshiruv sun’iy WAV ishlatgan; to‘liq inson nutqining AI baholashi ushbu yangilanishda qayta sinovdan o‘tkazilmadi.

Generatsiya sxemasi uchun [Groq structured outputs rasmiy hujjati](https://console.groq.com/docs/structured-outputs) ishlatildi.

Mahalliy ishga tushirish: `node scripts/dev-ai.mjs --host 127.0.0.1 --port 5173`. [Yordamchi](http://localhost:5173/#ai-yordamchi), [Speaking](http://localhost:5173/#ai-speaking). Build: `node node_modules/vite/bin/vite.js build`; hajm budjeti: `node scripts/measure-performance.mjs dist --check`. Brauzer tekshiruvlari: `node tests/notebook-browser.mjs` va `node tests/ai-assistant-browser.mjs`.

Tegishli testlarni qaytarish: `node --test --test-concurrency=2 --test-timeout=90000 tests/speaking-variants.test.js tests/speaking-ui.test.js tests/performance.test.js tests/lazy-provider.test.js tests/speaking-service.test.js tests/speaking-network.test.js tests/speaking-sql.test.js tests/paper-workshop.test.js`.
