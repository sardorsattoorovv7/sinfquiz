# SinfQuiz 4.8.1 — Vercel + Firebase

Informatika darslari uchun React/Vite platformasi. Alohida Express server, Socket.IO yoki doimiy kompyuter kerak emas. Sayt Vercel’da, ma’lumot va real-time yangilanishlar Firebase Firestore’da ishlaydi.

## Imkoniyatlar

- admin uchun login/parol;
- 45 ta tayyor informatika savoli va test muharriri;
- oddiy testga 6 xonali kod orqali kirish;
- ACTIVE/PASSIVE, ball va jonli reyting;
- bitta kompyuter va bitta monitorda split-screen 1v1 poyga;
- tayyor `Running` 3D animation clip va SFX;
- 192 savollik bankdan 10 ta adaptiv A1–B2 daraja testi;
- inglizcha audio, sekin talaffuz, tarjima, vocabulary va to‘liq gap terish;
- avvalgi 5 bosqichli uzun matn Typing, yakunda 300–500 so‘z;
- typing tezligi, aniqligi, darajasi va admin natijalari;
- dark/light va mobil dizayn.
- sekin internetda so‘rov va login kutish chegarasi, avtomatik qayta urinish va yengil polling.

O‘quvchi ro‘yxatdan o‘tmaydi. Firebase Anonymous Auth avtomatik ishlaydi. Admin Firebase Email/Password orqali himoyalanadi.

Inglizcha talaffuz brauzerning Web Speech funksiyasi orqali ishlaydi. Alohida audio serveri yoki API kaliti talab qilinmaydi. Eng yaxshi natija uchun Chrome yoki Edge ishlating.

## Vercel’ga joylash

Birinchi marta sozlash uchun `FIREBASE-VERCEL.md` faylidagi bosqichlarni bajaring. Sozlangach Vercel quyidagilarni avtomatik bajaradi:

```text
Build command: npm run build
Output directory: dist
```

`vercel.json` ichida SPA rewrite va xavfsizlik headerlari tayyor.

## Lokal ishga tushirish

`.env.example` dan `.env` nusxa oling, Firebase Web App qiymatlarini kiriting va:

```bash
npm install
npm run dev
```

Brauzerda `http://localhost:5173` ni oching. Windows’da `START.bat` ham ishlaydi. Endi `127.0.0.1:3000`, Express yoki alohida backendni ishga tushirish kerak emas.

## Admin

- Saytdagi login: `admin`
- Parol: Firebase Authentication’da o‘zingiz yaratgan parol
- Boshlang‘ich misol: `admin@sinfquiz.uz` / `admin123`

Internetga chiqarishdan oldin `admin123` o‘rniga uzun va maxfiy parol tanlang. Birinchi muvaffaqiyatli admin kirishida 45 ta tayyor savol Firestore’ga avtomatik yoziladi.

## Xavfsizlik

`firestore.rules` admin bo‘lmagan foydalanuvchiga PASSIVE testlarni bermaydi, o‘quvchiga boshqa ishtirokchi nomidan natija yozishga ruxsat bermaydi va sozlamalarni faqat admin o‘zgartirishiga ruxsat beradi.

Muhim: serversiz brauzer arxitekturasida tajribali foydalanuvchi DevTools orqali o‘z natijasini soxtalashtirishga urinishi mumkin. Maktab ichidagi foydalanish uchun ruxsatlar cheklangan, ammo imtihon darajasidagi qat’iy anti-cheat uchun Firebase Cloud Functions kabi ishonchli server-side tekshiruv talab qilinadi.

## Tekshiruv

```bash
npm test
npm run build
```

Firebase SDK rasmiy browser ESM modulidan yuklanadi. `firebase` npm paketini alohida o‘rnatish talab qilinmaydi.
