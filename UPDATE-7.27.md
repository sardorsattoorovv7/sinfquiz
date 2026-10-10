# SinfQuiz 7.27 — Bilim oroli

Tanlangan tungi orol namunasi ishlaydigan bosh sahifaga aylantirildi. Oltita maskan — Matematika, Kimyo, Biologiya, Ingliz tili, Informatika, IQ va mantiq — mavjud bo‘limlarni ochadi. Kitob maydoni, bog‘lovchi yo‘laklar, oldingi darvoza va ko‘prik tasvirda saqlangan. Desktop va telefon uchun alohida tasvir yuklanadi.

Qidiruv, ovoz, kunduz/tun, profil va barcha bo‘limlar menyusi yuqorida. Pastki menyuda Fanlar, Darsliklar, Musobaqalar, Profil/Natijalar bor. Katta ekrandagi chap menyu yuqoridagi menyu tugmasiga ko‘chirildi; uning bo‘limlari olib tashlanmagan. Orol ostida atlaslar, CEFR, milliy test, tayyor test, inglizcha labirint va boshqa mashqlarga yo‘llar bor. Typing va 1v1 kartalari avvalgidek ustoz faollashtirganda ko‘rinadi.

6 xonali kod oynasi haqiqiy testni qidiradi. Oltita katak bitta kiritish maydonini ko‘rsatadi: kodni birdan yozish yoki qo‘yish mumkin. Takroriy yuborish to‘silgan; server xatosi formaning o‘zida ko‘rinadi. Kirish, faol mashqdan chiqish cheklovlari va ustozga tegishli kontent ruxsatlari saqlangan.

## Ishga tushirish

1. Hozir ishlayotgan loyiha va o‘zingizdagi `.env.local` faylini saqlang.
2. **SinfQuiz-v7.27-Bilim-Oroli.zip**ni yangi papkaga oching. Ichidagi `sinf-quiz` to‘liq loyiha; u eski ZIP ustiga qo‘shiladigan kichik patch emas.
3. Mavjud `.env.local`ni yangi loyiha papkasiga qo‘ying. ZIPga haqiqiy maxfiy kalitlar kiritilmagan.
4. Node.js 22.12 yoki yangiroq versiyada, `sinf-quiz` papkasida bajaring:

```bash
npm ci
npm run dev
```

Terminalda ko‘rsatilgan manzilni oching. Lokal server ishlashi uchun terminalni yopmang.

5. Vercelga chiqarishdan oldin:

```bash
npm run build
```

Git orqali odatdagi deployni bajaring. Vercelda mavjud Supabase/Telegram environment variablesni saqlang, Framework `Vite`, Output Directory `dist`, Build Command `npm run build` bo‘lsin. Eng yangi Production deploymentni tekshiring. Ushbu topshirishda jonli Vercel saytingiz o‘zgartirilmadi.

**7.25–7.26.1 bazasi ishlab turgan bo‘lsa, 7.27 uchun yangi SQL migratsiyasi kerak emas.** SQL, RLS, Auth, server API, baholash modellari va mavjud audio/3D modellar o‘zgartirilmagan. Ancha eski bazani yangilash uchun oldingi reliz yo‘riqnomalari ZIPda saqlangan.

## Google qidiruvi

Root sahifa va oltita fan sahifasi hamda umumiy fanlar sahifasi dastlabki HTMLda mazmun beradi. `robots.txt`, `sitemap.xml`, canonical, sahifaga xos title/description, ulashish rasmi va tuzilmali ma’lumotlar bor. Dastur ichidagi shaxsiy sahifalar sitemapga kiritilmagan. To‘liq bosqichlar: [SEO-7.27.md](SEO-7.27.md).

Tekshiruvlar: [QA-7.27.md](QA-7.27.md). O‘zgargan fayllar: [CHANGED-FILES-7.27.md](CHANGED-FILES-7.27.md). Tasvirlar: [ISLAND-ASSETS-7.27.md](ISLAND-ASSETS-7.27.md).
