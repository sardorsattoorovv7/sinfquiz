# SinfQuiz 7.27.0 — Sinfxona

Bu paket 7.26.2 Science Studio loyihasiga ustozning dars vositalari va qidiruv uchun ochiq sahifalarni qo‘shadi. Informatika, Ingliz tili, Matematika, Kimyo, Biologiya, testlar, typing, 1v1 va guruh musobaqalari saqlangan.

## Yangilash

1. Eski loyiha va `.env.local` faylingizni zaxiralang. ZIPdagi `sinf-quiz` papkasini alohida oching; amaldagi `.env.local`ni shu papkaga ko‘chiring. Maxfiy qiymatlar ZIPga kiritilmagan.
2. Node.js **22.12 yoki yangi** versiyada terminalda:

```powershell
npm ci
npm run dev
```

3. Ustoz yoki admin hisobi bilan kiring. Chap menyuda **Sinfxona** ochiladi. To‘g‘ridan-to‘g‘ri manzil: `/#sinfxona`. O‘quvchi va mehmon bu ish maydonini ocholmaydi.
4. **7.26.2 migratsiyasi allaqachon bajarilgan bo‘lsa, Sinfxona uchun qo‘shimcha SQL kerak emas.** Sinfxona Supabase’ga yangi jadval yoki RPC qo‘shmaydi; mavjud kirish va rollardan foydalanadi. Agar hali 7.26.2ga o‘tmagan bo‘lsangiz, `UPDATE-7.26.2.md` bo‘yicha `supabase-migration-7.26.2.sql`ni bajaring. Yangi baza uchun `SUPABASE-VERCEL.md`dagi avvalgi tartib ham zarur.

## Doskada ishlash

- Asbobni tanlab sichqoncha, sensor yoki stilus bilan chizing. Stilus bosimi qalam qalinligiga ta’sir qiladi. Aylana asbobi aylana chizadi; rang va qalinlik yuqoridagi paneldan o‘zgaradi.
- Klaviatura bilan matn yoki shakl asbobini tanlab, doskaga fokus bering va `Enter` bosing. Tayyor obyektni strelkalar bilan ko‘chirish yoki parametr maydonlaridan o‘lchamini o‘zgartirish mumkin.
- **Tanlash** bilan obyektni bosing va sudrang. Pastki o‘ng burchakdagi tutqich yoki **Eni/Balandligi** maydonlari o‘lchamni o‘zgartiradi. Aylana o‘lchami o‘zgarganda aylanaligini saqlaydi.
- Tanlangan obyektni klaviatura strelkalari 1 birlik, `Shift + strelka` 10 birlik ko‘chiradi. `Delete` o‘chiradi. `Ctrl+Z` / `Ctrl+Y` oxirgi amallarni bekor qiladi va qaytaradi. Matn maydonida bu tugmalar odatdagi matn tahriri sifatida ishlaydi.
- **Doska obyektlari** ro‘yxatidan chizmani klaviatura orqali tanlash mumkin. Matnni tanlab **Matnni tahrirlash**, rang va shrift o‘lchamini ishlating. Juda katta matn sig‘masa, izoh chiqadi va amal bajarilmaydi.
- **Rasm yuklash** PNG/JPG/WebPni tekshiradi, kichraytiradi va doskaga qo‘yadi. Rasmni ko‘chirish, o‘lchamini o‘zgartirish va ustiga yozish mumkin. SVG, HTML va tashqi URL doska rasmi sifatida qabul qilinmaydi.
- **Sahifa** yangi doska yaratadi. Nomi tahrirlanadi; ro‘yxatdan boshqa sahifaga o‘tiladi. Bir qoralamada 20 sahifa, sahifada 1500 obyektgacha. Undo/redo har sahifa uchun alohida 40 amalni saqlaydi; sahifa qayta yuklanganda oxirgi ish tiklanadi, tahrir tarixi qayta boshlanadi.
- **Topshiriq shabloni** misol, bo‘sh joy, jadval yoki rasm ustida belgilash uchun yangi sahifa yaratadi. Ustozning ochiq doskasida o‘quvchi topshiriqni bajarishi mumkin.
- **Doska uslubi** 10 fonni almashtiradi. Ish saqlanadi, ko‘rinmay qoladigan rang fon uchun moslashtiriladi. **PNG yuklash** fon va rasmlar bilan 1600×900 rasm beradi.

## Taymer, shovqin va raqamlar

**Taymer:** nom, soat/daqiqa/soniya yoki 30 soniya, 1/3/5/10/45 daqiqa tanlang. Boshlash, pauza, davom ettirish, qayta boshlash, bir daqiqa qo‘shish/ayirish ishlaydi. 10 ko‘rinish bitta holat va tugash vaqtiga bog‘langan; uslub o‘zgarishi taymerni qayta boshlamaydi. Boshqa tabdan qaytganda haqiqiy o‘tgan vaqt hisoblanadi. Signalni alohida yoqing; ovoz brauzerning foydalanuvchi amali va fon tab cheklovlariga bo‘ysunadi. Vaqt tugashi ekranda ham ko‘rsatiladi.

**Shovqin:** panelni ochib “Shovqin nazoratini boshlash”ni bosing. Mikrofon faqat shu amaldan so‘ng ochiladi. `localhost` yoki HTTPS kerak. Chegara va sezgirlikni o‘zgartiring; odatiy fon ovozida **Kalibrlash**ni bosing. 0–100 — nisbiy ko‘rsatkich, professional dB o‘lchovi emas. Sharlar shovqin chegarasidan oshganda ko‘tariladi, tinchlanganda tushadi. Panelni yig‘ish nazoratni davom ettiradi; yuqori indikator ko‘rinadi. **Nazoratni o‘chirish** va bo‘limdan chiqish mikrofonni to‘xtatadi. Ovoz yozilmaydi, saqlanmaydi va serverga yuborilmaydi.

**Raqam tanlash:** 1..N, oraliq yoki maxsus ro‘yxat; bir safar 1–100 ta. Takroriy kiritilgan sonlar bir marta hisoblanadi. Har qolgan son uchun ehtimol teng: `crypto.getRandomValues` va modulo og‘ishini yo‘qotuvchi tanlov qo‘llanadi. Takrorlanmasin rejimida chiqqan raqamlar chiqariladi. Qolganlar soni, so‘nggi 30 tanlov tarixi va ro‘yxatni tiklash mavjud. Bir ro‘yxatda 10 000 son chegarasi bor.

**Panellar:** o‘ng, chap yoki doska ostiga qo‘ying. Sarlavha tutqichini boshqa panelga sudrab yoki yuqoriga/pastga tugmalari bilan tartiblang. Panellar doska ustiga chiqmaydi. Kichik ekranda doska yuqorida, panellar uning ostida turadi. **Dars namoyishi** haqiqiy to‘liq ekranni ochadi; brauzer ruxsat bermasa keng ish maydoni ishlaydi.

## Qoralama va ruxsatlar

Qoralama har ustoz/admin UIDsi uchun shu brauzerning IndexedDB xotirasida saqlanadi. Har tugallangan tahrirdan keyin qisqa kutish bilan yoziladi; ko‘rinish, sahifalar, taymer va raqam tanlovlari tiklanadi. IndexedDB vaqtincha ishlamasa localStorage zaxirasi qo‘llanadi. Saqlash xatosi yashirilmaydi; PNG olish mumkin. Brauzer ma’lumotlarini tozalash qoralamani o‘chiradi. Ish boshqa qurilmaga avtomatik sinxronlanmaydi.

Menyu, yo‘lni tiklash, hash orqali o‘tish va komponentda teacher/admin ruxsati tekshiriladi. Bu modul serverga doska/mikrofon ma’lumotlarini yubormaydi. Mavjud Supabase RLS, ustoz kontenti chegaralari va server baholashi o‘zgarmagan. Bir kompyuterda boshqa ustoz hisobiga o‘tilsa uning alohida qoralamasi ochiladi; umumiy qurilmada hisobdan chiqishni unutmang.

## SEO va Vercel

Build yettita ochiq HTML sahifa chiqaradi:

- `/ustozlar/sinfxona`
- `/fanlar/informatika`, `/fanlar/matematika`, `/fanlar/kimyo`, `/fanlar/biologiya`
- `/ingliz-tili`, `/darsliklar`

Ular JavaScript o‘chiq bo‘lsa ham tavsif va haqiqiy havolalarni ko‘rsatadi. Har sahifada alohida title/description, canonical, Open Graph, Twitter va JSON-LD bor. O‘quvchining natijasi, shaxsiy sinf ma’lumoti, chat va savol kalitlari ochiq sahifaga kiritilmaydi. `sitemap.xml` faqat bosh sahifa va shu yettita sahifani sanaydi.

Vercel Production Environment Variables:

```dotenv
VITE_PUBLIC_SITE_URL=https://www.sinfquiz.uz
# Search Console HTML tag tasdiqlash qiymati; butun <meta> emas.
VITE_GOOGLE_SITE_VERIFICATION=
```

Asosiy domeningiz `sinfquiz.uz` bo‘lsa `VITE_PUBLIC_SITE_URL=https://sinfquiz.uz` qilib, ikkinchi domenni asosiy domenga redirect qiling. URL qiymati yo‘lsiz HTTPS domeni bo‘lsin. Supabase va Telegram sozlamalari amaldagicha qoladi. O‘zgartirgach yangi deploy qiling: build `npm run build`, Output Directory `dist`.

`vercel.json` cleanUrls orqali ochiq `.html` sahifalarni toza manzilda beradi. Ilova hash yo‘llaridan foydalanadi. `/app` ildizdagi ilovaga rewrite qilinadi; noma’lum yo‘llar barcha hollarda 200ga almashtirilmaydi.

Google Search Console’da domenni DNS TXT orqali yoki yuqoridagi HTML tag bilan tasdiqlang. So‘ng **Sitemaps → `sitemap.xml` → Submit**. **URL inspection** orqali bosh sahifa va fan sahifalarini tekshirib, indekslashni so‘rash mumkin. Sitemap yuborish yoki texnik SEO Google’da indekslashni va reytingni kafolatlamaydi.

Manbalar:
- Google JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Google sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Vercel cleanUrls/rewrites: https://vercel.com/docs/project-configuration/vercel-json
- Mikrofon API: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

## Tekshirish

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e:classroom
```

CI yoki maxsus Chromium uchun `CHROME_EXECUTABLE` qiymatini kiriting. E2E natijasi `qa-7.27.0/classroom`ga yoziladi. Test autentifikatsiya transportini ustoz/admin/o‘quvchi/mehmon fixture bilan almashtiradi; React, Canvas, IndexedDB, WebAudio va taymer haqiqatan ishlaydi. Real Supabase hisoblari va Vercelga deploy tekshiruvi alohida; bu paket ularni avtomatik o‘zgartirmaydi. Batafsil dalillar: `QA-7.27.0.md`.
