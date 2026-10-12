# SinfQuiz 7.30.0 — Koinot atlasi

52 parametrli fizika sahnasi qo‘shildi. Atlaslar → Koinot atlasi yoki `/#koinot` orqali ochiladi. Amaldagi hisob va rollar ishlatiladi. Oldingi fanlar, Office, Python, typing, 1v1, chat va musobaqalar saqlangan.

## 7.29 dan yangilash

1. Supabase SQL Editor’da avval `supabase-office-amaliy-fix.sql` faylini RUN qiling. Oldin bajargan bo‘lsangiz ham qayta bajarish mumkin.
2. Keyin `supabase-migration-7.30.sql` faylini RUN qiling. U alohida atlas jadvallari, indekslar, RLS va RPC yaratadi. Cron va yangi maxfiy kalit kerak emas.
3. ZIPdagi `sinf-quiz` papkasida o‘zingizning `.env.local` qiymatlaringizni saqlang. Maxfiy kalitni Gitga qo‘shmang.
4. Node 22.12 yoki undan yangi versiyada `npm ci`, keyin `npm run dev`. Ishlab chiqarish tekshiruvi: `npm run build`.
5. Vercel’da mavjud Supabase environment qiymatlari bilan yangi build/redeploy qiling. Yangi majburiy environment o‘zgaruvchisi yo‘q.

Yangi baza uchun `migration-chain.json` → `freshInstall` ketma-ketligidan foydalaning. 7.29 ishlayotgan bazada barcha eski SQLlarni qayta bajarish shart emas.

## Birinchi tajriba

«Meteorit Yerga tushsa»ni oching. Avval taxmin yozing. Diametr, tarkib va tezlikni tanlang. «Sinovni boshlash» yoki vaqt shkalasidan foydalaning. Natijani qayd eting. Bitta parametrni o‘zgartirib ikkinchi sinovni qayd eting. Tushuncha savolini tekshiring va xulosa bilan topshiring.

Ustoz boshqaruvida hodisa, izoh, dastlabki parametrlar va ko‘rinishni belgilang. O‘z guruhingizga biriktirish mumkin; boshqa ustoz guruhiga biriktirish mumkin emas. Ustozning ommaviy ishi admin tasdig‘ini kutadi. Ustoz faqat o‘z ishlarining natijalariga fikr yozadi; admin barcha natijalarni ko‘ra oladi.

Model hisobi qurilmada ishlaydi; animatsiyaning har kadrida serverga so‘rov yuborilmaydi. Daftar qoralamasi shu hisob uchun brauzerda 52 soat saqlanadi. JSON yuklash va serverga topshirish alohida ishlaydi. 3D mavjud bo‘lmasa 2D model avtomatik ochiladi. Yengil grafik rejimi, pauza, vaqt va kamera tugmalari mavjud.

Hodisalar ta’limiy modellar. Haqiqiy tsunami balandligi, zarar hududi, krater diametri, iqlim yoki kosmik ob-havo prognozi berilmaydi. `SPACE-SOURCES.md`da hisoblar, model chegaralari va manbalar yozilgan.

## Tekshirish

`npm test`, `npm run build`, `npm run test:e2e:space`. Brauzer sinovi uchun Playwright Chromium yoki `CHROME_EXECUTABLE` orqali mavjud Chromium yo‘li kerak. Yakuniy tekshiruv natijalari `QA-7.30.md`da.
