# SinfQuiz 7.31.0 — masofa, qizish va okean bosimi

Koinot atlasidagi «Quyosh yaqinlashsa» qayta ishlangan. Yangi «Okean tubiga sayohat» bilan atlasda 53 sahna bor. Boshqa fanlar, kirish, typing, split 1v1, testlar, chat va musobaqa oqimlari saqlangan.

## 7.30 ishlayotgan bo‘lsa

1. Supabase SQL Editor’da `supabase-migration-7.31.sql` faylini ochib RUN qiling. Bu ikki hodisaning katalogini yangilaydi; yangi jadval, kalit yoki cron talab qilmaydi. Qayta bajarish mumkin.
2. ZIPni oching. O‘zingizning `.env.local` sozlamalaringizni yangi `sinf-quiz` papkasiga saqlang. Haqiqiy maxfiy kalitlar ZIPga yoki Gitga kiritilmasin.
3. Node 22.12 yoki undan yangi versiyada papka terminalida:

```bash
npm ci
npm run dev
```

4. `npm run build` bilan production buildni tekshiring. Vercel uchun mavjud environment sozlamalari bilan redeploy qiling. Yangi majburiy environment o‘zgaruvchisi yo‘q.

7.29 dan o‘tayotgan bo‘lsangiz, oldin `supabase-office-amaliy-fix.sql`, keyin `supabase-migration-7.30.sql`, oxirida `supabase-migration-7.31.sql` fayllarini bajaring. Yangi baza uchun `migration-chain.json` → `freshInstall` ketma-ketligini ishlating. Eski SQLlar o‘zgartirilmagan.

## Quyoshni sinash

Atlaslar → Koinot atlasi → «Quyosh yaqinlashsa». Masofani 1 AU dan 0,5 AU ga o‘zgartiring: Quyoshning o‘zi Yerga yaqinlashadi. «Sinovni boshlash» yoki vaqt shkalasi bilan model haroratining asta oshishini, Yerning issiqlik rangini va grafikni kuzating. 1,5 AU bilan sovishni taqqoslang. Harorat ko‘rsatkichi atmosferasiz radiatsion modelga tegishli; haqiqiy ob-havo prognozi emas.

## Okean tubiga tushish

«Okean tubiga sayohat»ni oching. «1200 bar kabina»ni tanlab sinovni boshlang; kabina bilan kamera chuqurlikka tushadi. Bosim, suv zichligi va ideal gaz hajmi jonli hisoblanadi. «Butun chuqurlik» bilan ustunni to‘liq ko‘ring. Xuddi shu chuqurlikda 500 bar kabinani solishtiring: model bosim farqi chegarasidan oshganda qobiq eziladi. Kabinada BodyParts3D odam modeli bor.

«SCUBA rekordi belgisi» tarixiy 332,35 m o‘lchovini tanlaydi. Bu xavfsiz chuqurlik yoki insonning maydalanish chegarasi emas. Chuqurlikda odamga ta’sirni suv zichligigagina bog‘lash noto‘g‘ri. Shu sabab ezilish kabina qobig‘i, gazning siqilishi esa alohida ideal namuna orqali ko‘rsatilgan.

Vaqt, miqdorlar va bardoshlilikni almashtirib ikki kuzatuvni qayd eting. Taxmin, tushuncha javobi va xulosa bilan topshiring. Ustoz o‘z guruhi va o‘z ishining natijalarini ko‘radi; mavjud RLS chegaralari o‘zgarmagan. Oldingi qoralamalar tiklanadi. Yangi sahna uchun migratsiya qilinmagan bo‘lsa, interfeys kerakli SQL faylini ko‘rsatadi.

## Tezlik va kirish imkoniyati

Sahnalar lazy yuklanadi. Yangi NASA Quyosh GLB modeli 322 040 bayt; BodyParts3D odam modeli mavjud fayldan qayta foydalanadi. Versiyalangan public modellar brauzer keshida saqlanadi. Animatsiya serverga har kadrda so‘rov yubormaydi. Kamera, pauza, yengil grafik va 2D fallback ishlaydi. Telefon, tungi rejim va katta ekran tekshirilgan.

Model chegaralari va aktivlar: `PHYSICS-7.31-SOURCES.md`. Tekshiruv dalillari: `QA-7.31.md`, `qa-7.31/`. Brauzer testlari uchun Playwright Chromium yoki `CHROME_EXECUTABLE` kerak.
