# SinfQuiz 7.26 — Studio UI

Yorug‘ rejim «Interaktiv Studio», tungi rejim «Tungi laboratoriya» namunasiga moslashtirildi. Chapdagi asosiy bo‘limlar, atlas sahnalari, kimyo stoli, darslik kartalari va matnli 3D labirint yangilandi.

## Qanday o‘rnatiladi

1. Amaldagi loyiha papkasining nusxasini oling. Shaxsiy `.env.local` faylingizni alohida saqlang.
2. Yangi ZIPni yangi papkaga oching. Ichidagi `sinf-quiz` — to‘liq loyiha. Eski va yangi `node_modules` yoki `dist` papkalarini birlashtirmang.
3. O‘zingizdagi `.env.local` faylini yangi `sinf-quiz` papkasiga ko‘chiring. Unda `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` bo‘lsin. Maxfiy kalitlar faqat server sozlamalarida saqlanadi.
4. VS Code terminalida shu papkada buyruqlarni bajaring:

```bash
npm ci
npm run dev
```

Node.js 22.12 yoki undan yangi versiya kerak. Lokal manzil terminalda ko‘rsatiladi.

## Ma’lumotlar bazasi

**7.25 migratsiyalari ishlayotgan bo‘lsa, 7.26 uchun yangi SQL migratsiyasi kerak emas.** Bu reliz interfeysni yangilaydi. Supabase jadvallari, RLS, ustozga tegishli kontent, login va natija hisoblari o‘zgarmagan. Eski SQL fayllari arxivda saqlangan; faqat dizayn uchun ularni qayta ishga tushirish shart emas.

Yangi loyiha yoki ancha eski versiya uchun `SUPABASE-VERCEL.md`, tegishli `UPDATE-7.2x.md` va `sql/` yo‘riqnomalaridagi migratsiyalarni tekshiring.

## Vercel

```bash
npm run build
npm run preview
```

Avval lokal tekshiring, keyin odatdagi Git/Vercel jarayoni bilan deploy qiling. Vercel’dagi Supabase va server environment variables avvalgidek qoladi. `.env.local` yoki maxfiy kalitlarni Git’ga yubormang. Vercel yangi manba bilan qayta build qilishi kerak.

## Qayerda nimalar bor

- **Darsliklar:** Kimyo, Ingliz tili, Biologiya va Informatika bitta tartibli katalogda.
- **Atlaslar:** Matematika, Kimyo va Biologiya.
- **Mashqlar:** IQ, labirint, til darslari, testlar, CEFR, Informatika amaliyoti va suhbatga kirish.
- **Musobaqalar:** mavjud jamoaviy musobaqalar oqimi.
- **Natijalar:** o‘quvchida shaxsiy profil; ustozda o‘z sinfi natijalari.
- **6 xonali kod:** bosh sahifada, avvalgi mehmon kirish tartibi bilan.

Boshlangan test va o‘yin paytida boshqa bo‘limlarga olib ketadigan navigatsiya yashiriladi. Mashq ichidagi yakunlash/chiqish boshqaruvi saqlangan. Logotip sessiyani yopmaydi.

## Yuklab olish

To‘liq ZIP yoki `DOWNLOAD-7.26.md` dagi uchta kichik ZIPdan foydalaning. Kichik qismlar bir xil `sinf-quiz` papkasiga ochiladi; ularning jami to‘liq arxiv bilan bir xil loyiha.

Tekshiruvlar `QA-7.26.md` va `qa-7.26/` ichida. Mahalliy sinovlar haqiqiy Supabase/Vercel loyihasini avtomatik tekshirganini anglatmaydi.
