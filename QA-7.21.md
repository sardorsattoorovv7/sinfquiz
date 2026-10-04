# SinfQuiz 7.21 — amalda bajarilgan tekshiruvlar

Tekshiruv sanasi: **2026-10-04**. Node.js 22 va Chromium 141 bilan bajarildi. Brauzer sinovlari haqiqiy GLB fayllarini Three.js/WebGL orqali ochadi; foydalanuvchi va API javoblari lokal sinov ma’lumotlari bilan beriladi.

## Natijalar

| Tekshiruv | Natija |
| --- | --- |
| `npm test` | **118/118** test o‘tdi. Biologiya hisoblari, model fayllari, matematika, kimyo, natijalar, autentifikatsiya va SQL ruxsatlari bo‘yicha mavjud tekshiruvlar bajarildi. |
| `npm run build` | Production build muvaffaqiyatli yaratildi; modellar `dist/biology/v7.21/`ga ko‘chirildi. |
| Biologiyaning 24 sahna turi | Har biri WebGLda ochildi; barcha tanlov variantlari, qismlarni tanlash, vaqt shkalasi, boshlash/pauza/davom ettirish tekshirildi. |
| Tayyor anatomiya | Tashqi tana, skelet, mushak, organ va ichki kesim; o‘ng/chap organlarning joylashuvi; klaviatura va kamera boshqaruvi tekshirildi. |
| Nafas modeli | Faqat ko‘rsatiladigan o‘pka, traxeya va diafragma hisobga olinib kattalashtiriladi. Yashirilgan organlar modelni kichraytirib yubormaydi. |
| Haqiqiy kesim | Kesim qiymati 0 va 65 bo‘lganda organ geometriyasining ko‘rinadigan qismi haqiqatan o‘zgaradi. |
| Yuklash va qayta urinish | Xarita barcha GLBlarni oldindan yuklamaydi. Gul fayliga 503 xato berilib, ishlaydigan 2D chizma va sahifadan chiqmasdan muvaffaqiyatli qayta ochish tekshirildi. |
| Vercel CSP | Sinov serveriga loyihadagi CSP sarlavhasi qo‘yildi; ichki teksturalar, tayyor modellar va qayta urinish ishladi. |
| Mobil va sinf doskasi | 390 × 844 va 1920 × 1080 o‘lchamlar, tungi rejim, sahna boshqaruvi va gorizontal toshib chiqmasligi tekshirildi. |
| Accessibility | Anatomiya boshqaruvlari bo‘yicha axe avtomatik WCAG tekshiruvida **0 xato**. Klaviaturadagi aylantirish, yaqinlashtirish va Home tekshirildi. Bu butun saytning rasmiy WCAG sertifikati emas. |
| Resurs sarfi | Pauza va harakatsiz sahnada ortiqcha renderlar yo‘q. 2Dga o‘tganda 3D resurslari bo‘shatiladi. WebGL yo‘qolganda chizma qoladi. |
| Boshqa fanlar | 62 mavzuli matematika, asosiy tajribalar va 7 fazoviy jism; kimyoda miqdor, animatsiya, solishtirish, daftar va 12 amaliy ish; ovozsiz A2 labirint yakunigacha sinab ko‘rildi. |
| Guruhlar va chat | Shaxsiy guruh, XSS matnining kod sifatida bajarilmasligi, ovoz xabari va ustoz topshirig‘i; runtime xatolari kuzatilmadi. |

## Fayllar va ilmiy model

16 ta mahalliy, mustaqil GLB fayli bor; ularning jami hajmi **11 206 460 bayt**. Teksturalar GLB ichiga joylangan. SHA-256 summalari va GLB tuzilishi avtomatik tekshirildi. Manbalar hamda litsenziyalar `public/biology/v7.21/` va `BIOLOGY-MODELS-7.21.md`da berilgan.

BodyParts3D suyak guruhlari haqiqiy suyaklardan yig‘ildi. Bronx/tomir daraxtlari o‘pkaning tashqi sirtidan alohida belgilandi; butun o‘pka sirtlari HuBMAPdan olindi. O‘ng va chap tomon bemor nuqtayi nazaridan beriladi. Nafas deformatsiyasi va rangli yo‘llar ta’limiy soddalashtirishdir. Ildiz, hujayra, molekula va ayrim hayvon guruhlarining sxemalari tayyor anatomik skan deb ko‘rsatilmaydi.

7.20.1 arxivi bilan fayl summalari solishtirildi: `src/App.jsx`, Supabase SDK/data qatlami, Telegram kirishi, Python amaliyoti va **barcha mavjud SQL fayllari o‘zgarishsiz**. 7.21 uchun yangi migratsiya kiritilmagan.

## Tekshiruv dalillari

`qa-7.21/`da anatomiya qatlamlari, o‘pka kesimi, gullar, qush, tulki, mobil va katta ekran ko‘rinishlari mavjud. Avvalgi fanlar rasmlari `qa-7.21/previous-modules/`da. Yakuniy test jurnallari ham shu papkaga kiritilgan.

Avtomatik tekshiruv: `npm test` va `npm run build`. Qo‘shimcha brauzer skriptlari: `tests/biology-3d-browser.cjs`, `tests/biology-ready-models-browser.cjs`, `tests/upgrade-7.20-browser.cjs`; ular Playwright va Chromium o‘rnatilgan tekshiruv muhitida bajarildi.

## Amaliy chegaralar

Production Supabase akkauntlariga ma’lumot yozilmadi va Vercelga yangi deploy bajarilmadi. Kirish/API brauzer sinovlari lokal fixture bilan, SQL va egaga tegishli ruxsatlar esa mavjud PGlite tekshiruvlari bilan baholandi. O‘zingiz deploy qilganda oldingi `.env` qiymatlari va biologiya bazasi saqlanishi kerak. Ishga tushirish tartibi `UPDATE-7.21.md`da.

ZIP topshirishdan oldin barcha yozuvlar CRC bilan tekshiriladi, qayta ochiladi va har bir faylning SHA-256 summasi loyiha bilan solishtiriladi. Yuklab olinadigan nusxa ham asl ZIP bilan baytma-bayt tekshiriladi.
