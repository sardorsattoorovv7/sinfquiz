# SinfQuiz 7.23.1 — ovoz yozuvi va qoralama saqlash

Bu to‘liq loyiha ZIPi. `package.json` versiyasi **7.23.1**. Oldingi bo‘limlar hamda 108 ta Ingliz tili darsi va 216 ta audio saqlangan.

## Ishlayotgan 7.23 loyihani yangilash

1. Yangi ZIPdagi loyiha kodini o‘rnating. O‘zingizning lokal `.env` faylingizni saqlang; maxfiy kalitlarni Gitga qo‘shmang.
2. Supabase → **SQL Editor**da **supabase-migration-7.23.1.sql** faylini to‘liq **RUN** qiling. Bu kichik yangilanish mavjud kurs funksiyalarini almashtiradi; darslar, o‘quvchi ishlari, guruhlar, natijalar va kontent versiyalarini qayta yaratmaydi. Qayta RUN qilish mumkin.
3. Node.js 22.12 yoki yangiroq versiyada terminalni loyiha papkasida oching:

```bash
npm ci
npm run dev
```

4. Vercelda yangi kodni deploy qiling. Bu tuzatish uchun yangi environment variable, server kaliti yoki Cron sozlamasi kerak emas.
5. **Ingliz tili darsi** → dars → **Gapirish**da mikrofonni o‘zingiz yoqing. Yozuvni to‘xtating, eshiting va **Yozuvni yuborish**ni bosing. **Hisobga saqlandi** holatini kuting. Writing/speaking ustoz tomonidan baholanadi.

Mikrofon localhost yoki HTTPSda ishlaydi. Mikrofon ruxsatini bermasangiz jonli ustoz tekshiruvi saqlangan. Mikrofon so‘rovi kutilayotganda uni bekor qilish ham mumkin.

## Kurs hali o‘rnatilmagan bo‘lsa

7.20–7.22 baza va guruh migratsiyalaridan keyin ZIPdagi **supabase-migration-7.23.sql**ni bajaring. Uning ushbu ZIPdagi nusxasi 7.23.1 tuzatishlarini ham o‘z ichiga oladi; keyin kichik patchni alohida bajarish shart emas. Batafsil dastlabki sozlash: **UPDATE-7.23.md** va **SUPABASE-VERCEL.md**.

SQLni bajarish React kodini avtomatik yangilamaydi. Yangi kod va mos SQLni birga o‘rnating.

## Tuzatilgan oqimlar

- Qayta yozilgan lokal audio oldingi speaking dalilini almashtiradi. Yangi audio yuborilmaguncha u topshirish talabi sifatida qabul qilinmaydi.
- Audio avtomatik serverga yuborilmaydi. Yuborish muvaffaqiyatsiz bo‘lsa lokal yozuv qoladi va qayta urinishingiz mumkin. Fayl yuklangan, lekin qoralama javobi uzilgan bo‘lsa, qayta yuborish shu fayldan foydalanadi.
- Mikrofon ruxsati kechikkan yoki bekor qilingan so‘rov navigatsiyadan keyin yozishni boshlamaydi. Yozish davomida chiqish va dars qadami tugmalari vaqtincha yopiladi; avval yozuvni to‘xtating.
- Topshirilgan ishda o‘quvchi va ustoz serverdagi matn hamda audioni ko‘radi. Shu qurilmadagi boshqa, yuborilmagan yozuv ustozga ko‘rsatilmaydi.
- Matn, dars qadami, bajarilgan faoliyat va speaking tanlovi bir saqlash navbatida yuradi. Sekin so‘rov paytida yangi tahrir kelganda eng oxirgi nusxa ham saqlanadi.
- Internet uzilganda qoralama shu brauzerda qoladi. Aloqa qaytganda **Saqlashni qayta yuborish**ni bosing yoki `online` hodisasi avtomatik qayta urinishni boshlaydi. Javobi yo‘qolgan so‘rov aynan o‘sha token bilan takrorlanadi.
- Boshqa oyna yoki qurilma ishni yangilagan bo‘lsa, qoralamalar avtomatik bir-birining ustidan yozilmaydi. Lokal matnni yuklab olish, hisobdagi nusxani ochish yoki o‘z qoralamangizni hisobga yozishni tanlaysiz. Hisobdagi nusxa tanlanganda avvalgi lokal matn `:recovery` kalitida zaxira sifatida qoladi.
- Lokal xotira to‘lib qolsa, muvaffaqiyatli server saqlashi xato deb ko‘rsatilmaydi. Lokal saqlash imkonsiz va server ham javob bermayotgan bo‘lsa, sahifadan chiqishdan oldin matnni yuklab oling.

Brauzer sahifasi va dastur aktivlari to‘liq offline ishlash uchun keshlanmagan: butun internet uzilgan holda yangilashda sayt qayta ochilmasligi mumkin. Qoralama tiklash kurs yana ochilganda bajariladi. Faol yozuv paytida brauzerni majburan yopish yakunlanmagan audioni tiklashni kafolatlamaydi.

## Kod va tekshiruv

Yangi saqlash navbati: `src/english-course/draft-store.js` va `useDraft.jsx`. Ovoz komponenti va ikkala dars/tekshiruv oqimi yangilangan. SQL manbasi `data/english-course/schema.sql`; ikkala migratsiyani qayta yig‘ish:

```bash
node scripts/build-english-course.mjs
npm test
npm run build
```

Tekshiruv hisoboti: **QA-7.23.1.md**. Manbalar, audio litsenziyasi va ta’limiy chegaralar: **ENGLISH-COURSE-7.23.md**. Bu patch dars kontenti yoki immutable audio URLlarini o‘zgartirmaydi.
