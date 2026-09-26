# SinfQuiz 7.3 ni Supabase va Vercel’da sozlash

## 1. Supabase loyihasi

1. Supabase Dashboard’da yangi loyiha yarating.
2. **SQL Editor → New query** bo‘limini oching.
3. ZIP ichidagi `supabase-schema.sql` faylining hamma kodini joylashtiring. Oldin RUN qilgan bo‘lsangiz ham 7.0 dagi milliy test bo‘limlari va admin tasdiqlash himoyasi uchun yana bir marta bajaring; mavjud testlar o‘chmaydi.
4. **RUN** tugmasini bosing. Keyin alohida so‘rovda `supabase-migration-7.2.sql` faylini ham RUN qiling.
5. **Authentication → Providers → Anonymous Sign-Ins** imkoniyatini yoqing.
6. Email orqali ro‘yxatdan o‘tganda darhol kirish kerak bo‘lsa, Auth sozlamasida **Confirm email** talabini o‘chiring.

## 2. Kerakli kalitlar

Supabase Dashboard’dagi **Project Settings → API** bo‘limidan quyidagilarni oling:

```text
VITE_SUPABASE_URL=https://project-id.supabase.co
VITE_SUPABASE_ANON_KEY=publishable_or_anon_key
SUPABASE_SERVICE_ROLE_KEY=service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` faqat Telegram login server funksiyasiga kerak. Telegram ishlatilmasa uni kiritmaslik mumkin.

## 3. Administrator

1. **Authentication → Users → Add user** bo‘limidan `admin@sinfquiz.uz` emailini yarating.
2. Kamida 12 belgili parol belgilang.
3. Saytda administrator bo‘limiga `admin` login va shu parol bilan kiring.

## 4. Vercel

1. Loyihani GitHub orqali yoki ZIP’dan Vercel’ga import qiling.
2. **Settings → Environment Variables** bo‘limiga `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` qiymatlarini kiriting.
3. Telegram login kerak bo‘lsa `SUPABASE_SERVICE_ROLE_KEY`, `VITE_TELEGRAM_BOT_USERNAME` va `TELEGRAM_BOT_TOKEN` qiymatlarini ham kiriting.
4. **Redeploy** qiling.

## 5. Telegram ixtiyoriy sozlamasi

1. `@BotFather` orqali bot yarating.
2. `/setdomain` orqali Vercel domenini kiriting.
3. Bot username va tokenini Vercel Environment Variables bo‘limiga kiriting.

## 6. Muammo chiqsa

- “Supabase sozlanmagan” — Vercel env qiymatlarini tekshirib, qayta deploy qiling.
- “row-level security” — `supabase-schema.sql` faylini SQL Editor’da to‘liq RUN qiling.
- O‘quvchi kod bilan kira olmasa — Anonymous Sign-Ins yoqilganini tekshiring.
- Realtime yangilanmasa — Database → Replication bo‘limida `documents` jadvali yoqilganini tekshiring; SQL fayli odatda buni avtomatik bajaradi.
