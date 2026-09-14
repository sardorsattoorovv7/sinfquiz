# Firebase va Vercel’ni sozlash

Bu sozlash faqat bir marta bajariladi. Alohida server hosting kerak emas.

## 1. Firebase loyiha yarating

1. `https://console.firebase.google.com` saytini oching.
2. **Create a project** ni bosing va loyiha yarating.
3. Project Overview ichida **Web (`</>`)** belgisini bosing.
4. Web App’ga nom bering va **Register app** ni bosing.
5. Ko‘rsatilgan `firebaseConfig` qiymatlarini saqlab qo‘ying.

## 2. Authentication’ni yoqing

1. Firebase Console → **Authentication** → **Get started**.
2. **Sign-in method** ichida **Email/Password** ni yoqing.
3. **Anonymous** usulini ham yoqing.
4. **Users** bo‘limida yangi foydalanuvchi yarating:
   - Email: `admin@sinfquiz.uz`
   - Password: kamida 8 belgili maxfiy parol

Saytdagi admin login maydoniga `admin`, parol maydoniga shu Firebase parolini yozasiz.

## 3. Firestore va Security Rules

1. Firebase Console → **Firestore Database** → **Create database**.
2. Production mode’ni tanlang va yaqin hududni belgilang.
3. Firestore → **Rules** bo‘limini oching.
4. Loyihadagi `firestore.rules` faylining hamma matnini Rules oynasiga qo‘ying.
5. **Publish** ni bosing.

Admin emailini almashtirsangiz, `.env` dagi `VITE_FIREBASE_ADMIN_EMAIL` va `firestore.rules` ichidagi `admin@sinfquiz.uz` qiymatini bir xil o‘zgartiring.

## 4. Vercel Environment Variables

Vercel → Project → **Settings → Environment Variables** bo‘limida quyidagi 7 ta nomni kiriting:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_ADMIN_EMAIL=admin@sinfquiz.uz
```

Birinchi 6 ta qiymat Firebase Web App’dagi `firebaseConfig` ichidan olinadi. Qiymatlarga qo‘shtirnoq qo‘ymang.

## 5. Vercel deploy

1. ZIP’ni ochib GitHub repository’ga yuklang.
2. Vercel’da **Add New → Project** orqali repository’ni tanlang.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. **Deploy** ni bosing.
7. Environment Variables keyinroq kiritilgan bo‘lsa **Redeploy** qiling.

## 6. Vercel domeniga ruxsat

Firebase Console → Authentication → Settings → **Authorized domains** ichiga Vercel bergan domenni kiriting. Masalan:

```text
sinf-quiz.vercel.app
```

`https://` va oxiridagi `/` belgisi yozilmaydi.

## 7. Birinchi kirish

1. Vercel saytingizni oching.
2. **Admin kirishi** ni bosing.
3. Login: `admin`.
4. Firebase’da yaratgan parolni kiriting.

Birinchi kirishda admin hujjati va tayyor informatika testlari avtomatik yaratiladi. Keyin testlarni ACTIVE qilib kodini o‘quvchilarga berishingiz mumkin.

## Muammo bo‘lsa

- **Firebase sozlanmagan**: Vercel’dagi 7 ta environment variable’ni tekshiring va Redeploy qiling.
- **operation-not-allowed**: Email/Password yoki Anonymous Authentication yoqilmagan.
- **permission-denied**: `firestore.rules` hali Publish qilinmagan yoki admin emaili ikki faylda bir xil emas.
- **Kod topilmadi**: test admin panelda ACTIVE qilinmagan.
- **Auth domain xatosi**: Vercel domeni Firebase Authorized domains ro‘yxatiga kiritilmagan.
