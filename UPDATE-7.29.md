# SinfQuiz 7.29 — Fantasy Island

Bosh sahifaga siz tanlagan **Fantasy Island in the sky** modeli ulandi. Bu Violette_Lass yaratgan modelning o‘zi: ikki orol, bozor, o‘rmon, ko‘prik, havo shari va propellerlar. Aylantirish, yaqinlashtirish, bosh ko‘rinishga qaytish, animatsiyani to‘xtatish va mahalliy vaqtga mos yoritish ishlaydi.

Model `public/models/island/v7.29/fantasy-island.glb` ichida. Sayt undan to‘g‘ridan-to‘g‘ri foydalanadi; o‘quvchi Sketchfab hisobiga kirmaydi. Modelni ochish uchun tashqi viewer yoki internetdagi asl model sahifasi chaqirilmaydi. Muallif va CC BY 4.0 litsenziyasi bosh sahifa ostida ko‘rsatilgan.

## Tezlik uchun nima o‘zgardi

- 10,25 MB hajmdagi asl glTF resurslari bitta **735 292 bayt** GLBga yig‘ildi.
- Asl modeldagi 304 ta mesh tuguni 23 taga birlashtirildi (standart optimallashtirishdan keyingi oraliq bosqichda 230 ta edi). Barcha 28 ta animatsiya kanali va har bir animatsiya ostidagi geometriya saqlandi. Uchburchaklarni kamaytirish orqali shakl soddalashtirilmadi.
- Teksturalar WebP; eng katta o‘lcham 1024 piksel. Meshopt dekoderi saytning o‘z JavaScript paketida.
- Fanlar va test kodi avval ochiladi, 3D alohida yuklanadi. Model yuklanishi yoki xatosi navigatsiyani to‘xtatmaydi.
- Telefon va kuchsiz qurilmada grafik piksel soni, kadr tezligi va soyalar cheklanadi. Uzoq chizilayotgan kadrlarda aniqlik yana kamaytiriladi.
- Orol ekrandan chiqsa yoki brauzer oynasi yashirilsa, render to‘xtaydi. Boshqa bo‘limga o‘tilganda transport bekor qilinadi va 3D resurslari bo‘shatiladi.
- Trafikni tejash yoki 2G holatida 3D foydalanuvchi bosgandan keyin ochiladi. Ko‘z belgili tugma orqali istalgan qurilmada yengil ko‘rinishga o‘tish mumkin.
- Versionlangan `/models/` fayli amaldagi Vercel sozlamasi bilan bir yil keshlanadi.

3D GPU va xotiradan foydalanadi. Yukni kamaytirish mexanizmlari tekshirildi; barcha qurilmalarda tezlikka mutlaqo ta’sir qilmasligi yoki muayyan FPS kafolati berilmaydi.

## Ishga tushirish

7.28 ishlayotgan bo‘lsa, **yangi SQL migratsiya kerak emas**. Mavjud Supabase auth, API, RLS va o‘qituvchiga tegishli kontent qoidalari o‘zgarmadi.

1. Hozirgi loyihangizdagi `.env.local`ni saqlang.
2. ZIPni yangi papkaga oching va `sinf-quiz` papkasini VS Code’da oching.
3. `.env.local`ni shu papkaga ko‘chiring. Maxfiy kalitlarni Git’ga yubormang.
4. Node.js 22.12 yoki yangiroq versiyada bajaring:

```bash
npm ci
npm run dev
```

Vercelga chiqarish uchun shu loyihani odatdagi Git oqimi bilan yuboring yoki deploy qiling. Build: `npm run build`; output: `dist`. Environment qiymatlari avvalgi ishlaydigan qiymatlarda qoladi. ZIP ichidagi `public/models/island/v7.29/` papkasini ham yuboring.

## Tekshiruv va manbalar

[QA-7.29.md](QA-7.29.md) — natijalar va sinov chegaralari.

[ISLAND-MODEL-7.29.md](ISLAND-MODEL-7.29.md) — model, litsenziya, optimallashtirish va manbalar.

[CHANGED-FILES-7.29.md](CHANGED-FILES-7.29.md) — o‘zgargan fayllar. Arxiv butun loyiha, patch emas. Oldingi funksiyalar va resurslar saqlangan.
