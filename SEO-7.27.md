# Google uchun tayyorlash — SinfQuiz 7.27

Asosiy manzil: **https://www.sinfquiz.uz**. 2026-10-08 kuni `https://sinfquiz.uz/` shu manzilga yo‘nalishi tekshirildi. Vercel domen sozlamasida bitta asosiy domenni saqlang.

## Kodda tayyorlangan

| Manzil | Vazifa |
| --- | --- |
| `/` | Bilim oroli, fan tavsiflari va barcha fanlarga HTML havolalar |
| `/fanlar/` | Olti fanning tartibli ro‘yxati |
| `/fanlar/matematika/` | Matematika atlasi tavsifi va yuza mashqi |
| `/fanlar/kimyo/` | Kimyo laboratoriyasi tavsifi va atomlar saqlanishi mashqi |
| `/fanlar/biologiya/` | Tirik tabiat atlasi va barg parchalanishi tushunchasi |
| `/fanlar/ingliz-tili/` | Til darslari va Present Simple mashqi |
| `/fanlar/informatika/` | Informatika/Python/Office va Excel mashqi |
| `/fanlar/iq-mantiq/` | Mantiq mashqlari; standartlashtirilgan IQ tashxisi deb ko‘rsatilmaydi |

Bu sahifalar build vaqtida yaratiladi. JavaScript o‘chiq bo‘lsa ham matn, havola va ochiladigan javob ishlaydi. Maxfiy test, o‘quvchi natijasi yoki chat mazmuni bu sahifalarga chiqarilmaydi. Interaktiv modullardagi mavjud kirish tartibi saqlanadi.

- Har sahifada yagona title, description va o‘z canonical manzili bor.
- Open Graph, Twitter ulashish tasviri, `WebPage` va fan sahifalarida `BreadcrumbList` ma’lumotlari bor. Yolg‘on reyting, sertifikat, tashkilot manzili yoki mukofot qo‘shilmagan.
- `sitemap.xml` faqat yuqoridagi 8 ta manzilni sanaydi. Sana o‘zgarmagan kontentga sun’iy `lastmod` yozilmaydi.
- `robots.txt` sitemapni ko‘rsatadi; API va auth URLlarini qidiruvdan cheklaydi. Bu ruxsat nazorati o‘rnini bosmaydi: RLS/Auth avvalgidek ishlaydi.
- Hisob, chat va faol mashq ko‘rinishlariga `noindex` qo‘yiladi. Hash ekranlari alohida SEO sahifa sifatida ko‘rsatilmaydi.
- Barcha noma’lum manzillarni bosh sahifaga qaytaradigan Vercel rewrite olib tashlandi. `/app` ilova uchun saqlangan; qolgan noto‘g‘ri manzillar hostingning 404 javobini oladi. Lokal fan sahifalari `public-pages-plugin.mjs` orqali ochiladi.
- Versiyalangan orol rasmlari keshga olinadi. Telefon faqat mobil WebPni, desktop esa desktop WebPni tanlaydi. Google uchun rasm oddiy JPEG nusxada mavjud.

## Deploydan keyingi 5 qadam

1. Vercelda **eng yangi Production deploy** muvaffaqiyatli tugaganini tekshiring. Environment variable o‘zgarsa yangi build/deploy kerak.
2. Quyidagi manzillarni alohida oching: `https://www.sinfquiz.uz/`, `https://www.sinfquiz.uz/fanlar/matematika/`, `https://www.sinfquiz.uz/robots.txt`, `https://www.sinfquiz.uz/sitemap.xml`. Noto‘g‘ri manzil, masalan `/mavjud-emas-727`, haqiqiy 404 qaytarishini tekshiring.
3. [Google Search Console](https://search.google.com/search-console/)da `sinfquiz.uz` Domain property qo‘shing. Google bergan **aniq** TXT qiymatini Ahost DNSga kiriting va Verify bosing. Oldin tasdiqlangan property bo‘lsa undan foydalaning. Bu jarayonda A/CNAME sayt yozuvlarini almashtirish kerak emas.
4. **Sitemaps → Add a new sitemap**da `https://www.sinfquiz.uz/sitemap.xml`ni yuboring.
5. **URL Inspection**da bosh sahifa va fan sahifasini tekshirib, Live Test va Request Indexingdan foydalaning. Keyin Page indexing hisobotini kuzating.

Search Console shaxsiy hisobingizda bajariladi; ushbu ZIP uni sizning nomingizdan yubormaydi. Google indekslash vaqtini va qidiruvdagi o‘rinni o‘zi belgilaydi. Sitemap, to‘g‘ri HTML va meta ma’lumotlar indekslashni kafolatlamaydi.

## Boshqa domen ishlatilsa

`VITE_SITE_URL=https://sizning-asosiy-domeningiz.uz`ni lokal va Vercel production sozlamalariga kiriting. Faqat HTTPS origin yozing: oxirida sahifa yo‘li, query yoki maxfiy ma’lumot bo‘lmasin. `npm run build` barcha canonical/sitemap qiymatlarini shu domen bilan qayta yaratadi. Qiymat berilmasa `https://www.sinfquiz.uz` ishlatiladi. Preview manzillarini indekslashga yubormang; Search Console’da production domeni bilan ishlang.

## Tekshirilgan rasmiy manbalar

2026-10-08:

- [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Vercel: rewrites](https://vercel.com/docs/routing/rewrites)
