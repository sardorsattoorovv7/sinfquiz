# SinfQuiz 7.26.2 — tekshiruvlar

Tekshiruv sanasi: 2026-10-10. Asos: saqlangan 7.26.1 Studio paketining to‘rt qismi. Natijalar `qa-7.26.2/` ichida; avvalgi relizlarning QA fayllari tarix sifatida saqlanadi.

## Kod va hisoblar

- `npm test`: **165 test, 165 o‘tdi, 0 xato**. Kimyo, biologiya, matematika, ustoz kontenti, musobaqa, Office, Python, kirish va boshqa mavjud modul testlari shu hisobga kiradi.
- `npm run build`: production build o‘tdi. Dependency ichidagi `use client` ko‘rsatmasi haqida build ogohlantirishi bor; build to‘xtamadi.
- Kimyoda atomlar saqlanishi, ion zaryadi, pH, reagent sarfi va cheklovchi reagent tekshiriladi. Kech qo‘shilgan tuz oldingi erigan porsiyani yo‘qotmaydi; suv bilan suyultirish nisbiy o‘tkazuvchanlikni kamaytiradi.
- Biologiyada fotosintez, anatomik yo‘llar, uglerod/azot balansi va yomg‘ir bilan yuvilish tekshiriladi. Yomg‘irsiz sinovda azotning yomg‘ir bilan yuvilishi nol.
- Grafikdagi 31 nuqta aynan sahna hisobidan olinadi. CSV sonlari, birliklari va bosqichning 0–100% ko‘rinishi alohida tekshirildi.

## Haqiqiy React sahifalaridagi brauzer sinovlari

Chromium 133, desktop 1600×1050, telefon 390×844 va sinf doskasi 1920×1080. Three.js/WebGL hamda Python worker haqiqatan ishga tushirildi. Auth va transport uchun mahalliy fixture ishlatiladi; bu production hisobiga kirish sinovi emas.

| Sinov | Tekshirilgan natija |
| --- | --- |
| Science Studio | Dars va xato javob izohi; boshlash/pauza; qoralama va parametrlarni tiklash; ikki sinov va xulosa; haqiqiy model CSVsi; litsenziyalangan anatomiya; reagent qo‘shish, suyultirish va taqqoslash; 2D fallback; harakatni kamaytirish; tungi darslik tekshiruvi |
| Studio | Fanlar navigatsiyasi; klaviatura bilan qidiruv; telefon menyusi; qayta yuklash; uchburchakning 8×5÷2=20 va 10×5÷2=25 hisoblari; inglizcha 3D labirint va matn rejimi; ustoz paneli va chatga o‘tish |
| Secure Play | Hisob yaratmasdan kodli testga kirish; brauzer xotirasida javob kaliti yo‘qligi; turli ball uchun 1- va 2-o‘rin; bitta ekrandagi ikki poygachi, turli savollar va haqiqiy g‘olib |
| Learning | Haqiqiy Python worker; Word/Excel topshirig‘ining bahosi; ingliz tili darsi; IQ/test natijasi va tahlili; uzilishdan keyin tiklanish; ustoz kontentining ajratilishi |
| English | Daraja testi; mavzuga kirish qoidasi; so‘z tartibi va yordam; lokal MP3; yozish natijasi; mikrofon faqat foydalanuvchi amali bilan; XSS matnini xavfsiz chiqarish; ustoz topshirig‘i |
| Competition | Ikki jamoa, besh bosqich; quiz, typing, labirint va tayyorlangan topshiriqlar; yakuniy reytingda turli natijalar |

Joriy Science Studio va Studio sahnalarida **20 ta axe tekshiruvi, 0 aniqlangan buzilish**. Klaviatura boshqaruvi, fokus, yorug‘/tungi rejim va 2D fallback amalda tekshirildi. Axe natijasi to‘liq WCAG sertifikati degani emas.

## Supabase ruxsatlari va baholash

Mahalliy PostgreSQL/PGlite muhitida bazaviy schema, 7.22, 7.24 va yangi **7.26.2 migratsiyasi** bajarildi. Yangi migratsiya ikki marta bajarilib, qayta qo‘llash tekshirildi.

- O‘quvchi `documents/quizzes` orqali javob kalitini olmaydi. Test sessiyasidagi savollar va kalit serverda qoladi; faqat joriy savol yuboriladi.
- O‘quvchining to‘g‘ridan-to‘g‘ri ball yozishi va poyga g‘olibini almashtirishi rad etiladi. Ball/taymer/g‘olib SQL RPC orqali hisoblanadi.
- Boshqa o‘quvchining sessiyasidan javob yuborish rad etiladi. Takror yuborilgan javob ikki marta ball bermaydi.
- Boshqa ustozning shaxsiy kontenti ajratilgan. Kimyo va biologiyaning amaldagi egaga bog‘langan ruxsatlari saqlangan.
- Lokal Telegram va admin API yo‘llari 404 qaytarmaydi; noto‘g‘ri so‘rovga JSON xato, haddan katta JSONga 413 qaytadi. Server maxfiy kalitining eski va yangi nomi qo‘llanadi.

Bu himoya boshqariladigan quiz va poyga natijalarini qamraydi. Python uchun brauzer yuborgan chiqish matni serverda mezon bo‘yicha baholanadi; kod serverda mustaqil qayta bajarilmaydi. Mehmon UID bo‘yicha tezlik cheklovi bor, lekin bu yangi mehmon hisoblari yaratadigan barcha botlarni to‘liq to‘xtatish kafolati emas.

## Paketni tekshirish

Reliz skripti to‘rt bazaviy ZIPning CRC qiymatini, 877 fayl saqlanganini, mavjud `public/` aktivlari o‘zgarmaganini va inglizcha 216 audio faylning manifest SHA-256 qiymatini tekshiradi. Tayyor ZIPdagi har bir fayl manba bilan baytma-bayt solishtiriladi. Lokal Python muhiti uchun zarur `python_stdlib.zip` ham paketga kiritiladi.

`node_modules`, eski build, shaxsiy `.env` va maxfiy server kalitlari paketga kirmaydi. Ishga tushirish va SQL tartibi `UPDATE-7.26.2.md`da.

## Tekshiruv chegaralari

Production Supabase/Vercel hisobiga deploy qilinmadi. 30–40 ta haqiqiy telefonning bir vaqtda ishlashi va haqiqiy laboratoriya bilan miqdoriy kalibrlash o‘lchanmadi. Server migratsiyasi mahalliy Postgres muhitida, UI esa haqiqiy Chromium orqali tekshirildi. Biologik o‘sish, ko‘pik va reaksiya tezligi ta’limiy model; atomlar saqlanishi va stoixiometriya alohida aniq hisoblanadi.
