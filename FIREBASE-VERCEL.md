# SinfQuiz 5.3 ni Firebase va Vercel’da sozlash

## 1. Firebase loyihasi

1. Firebase Console’da `sinfquiz-c8522` loyihasini oching.
2. **Authentication → Sign-in method** bo‘limida **Anonymous** va **Email/Password** usullarini yoqing. Telegram foydalanuvchisi Firebase Custom Token orqali kiradi.
3. Firestore Database yarating.
4. `firestore.rules` faylidagi qoidalarni **Firestore → Rules** bo‘limiga ko‘chirib, **Publish** tugmasini bosing.

Firebase Web konfiguratsiyasi `src/firebase-sdk.js` fayliga kiritilgan. Vercel Environment Variables bo‘limiga `VITE_FIREBASE_*` qiymatlarini qayta kiritish shart emas.

## 2. Firebase Service Account — faqat Telegram uchun

Email/parol orqali kirish uchun Service Account kerak emas. Telegram foydalanuvchisi uchun Firebase Custom Token yaratish server tomonda bajariladi, shu sababli Telegram login yoqilsa quyidagi amallarni bajaring.

1. Firebase Console’da **Project settings → Service accounts** bo‘limini oching.
2. **Generate new private key** orqali JSON kalitni yuklab oling.
3. JSON faylni bir qatorli Base64 qiymatga aylantiring.

Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json"))
```

Linux yoki macOS:

```bash
base64 < service-account.json | tr -d '\n'
```

Hosil bo‘lgan qiymatni Vercel’da `FIREBASE_SERVICE_ACCOUNT_B64` nomi bilan saqlang. JSON faylni loyiha ichiga qo‘ymang.

## 3. Telegram bot

1. Telegram’da `@BotFather` orqali yangi bot yarating.
2. Bot username va tokenini saqlab oling.
3. `@BotFather` ichidagi `/setdomain` buyrug‘i orqali Vercel domenini kiriting. Masalan: `sinfquiz.vercel.app`.
4. Vercel’da quyidagilarni kiriting:

```text
VITE_TELEGRAM_BOT_USERNAME=bot_username
TELEGRAM_BOT_TOKEN=123456789:bot_token
```

`VITE_TELEGRAM_BOT_USERNAME` brauzerda ko‘rinishi mumkin — bu maxfiy emas. `TELEGRAM_BOT_TOKEN` esa maxfiy va faqat server muhitida saqlanishi shart.

## 4. Vercel Environment Variables — Telegram ixtiyoriy

Telegram login ishlatilsa, Vercel loyihasidagi **Settings → Environment Variables** bo‘limiga `.env.example` dagi quyidagi qiymatlarni kiriting:

```text
TELEGRAM_BOT_TOKEN
FIREBASE_SERVICE_ACCOUNT_B64
VITE_TELEGRAM_BOT_USERNAME
```

Telegram login kerak bo‘lmasa, bu qiymatlarni kiritmasdan ham email/parol orqali kirish, testlar, darsliklar va administrator paneli ishlaydi. O‘zgarishdan keyin Vercel’da qayta deploy qiling.

## 5. Ishlash tartibi

- Foydalanuvchi Telegram yoki email orqali kiradi. Yangi akkauntda O‘quvchi yoki O‘qituvchi roli tanlanadi.
- Email orqali yangi hisob ochishda parol kamida 12 belgidan iborat bo‘ladi.
- Tanlangan rol birinchi kirishda profilga yoziladi va keyingi kirishlarda o‘zgarmaydi.
- O‘qituvchi faqat o‘z test, darslik va natijalarini boshqaradi.
- `Faqat kod bilan` test katalogda ko‘rinmaydi.
- `Ommaviy` test faol qilinganda o‘quvchilar katalogida va boshqa o‘qituvchilarning kodlar bo‘limida ko‘rinadi.
- E’lon qilingan darsliklar barcha o‘quvchilarga, qoralamalar faqat muallif o‘qituvchiga ko‘rinadi.

## 6. Xavfsizlik

- Telegram Login Widget ma’lumotlari `api/telegram-auth.js` ichida HMAC orqali tekshiriladi.
- Email orqali tanlangan rol Firestore’dagi foydalanuvchi profiliga yoziladi va xavfsizlik qoidalari orqali tekshiriladi.
- `admin@sinfquiz.uz` emaili bilan kirgan foydalanuvchi Administrator bo‘ladi. Umumiy foydalanuvchilar statistikasi boshqa rollarga ko‘rinmaydi.
- Faollik paneli oxirgi 5 daqiqada signal yuborgan foydalanuvchini “Faol” deb ko‘rsatadi. Chiqish soni “Tizimdan chiqish” tugmasi bosilganda yoziladi.
- Eski yoki o‘zgartirilgan Telegram ma’lumoti qabul qilinmaydi.
- O‘qituvchi roli Firestore profilidan xavfsizlik qoidalari orqali tekshiriladi.
- Bot tokeni va Service Account qiymatini GitHub, chat yoki brauzer kodiga joylamang.
