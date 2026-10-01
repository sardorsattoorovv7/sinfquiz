# SinfQuiz 7.8 ni Supabase va Vercel’da sozlash

## 1. Supabase loyihasi

1. Supabase Dashboard’da yangi loyiha yarating.
2. **SQL Editor → New query** bo‘limini oching.
3. **Integrations → Cron** modulini yoqing. Yangi loyiha uchun `supabase-schema.sql` faylini **RUN** qiling. Keyin alohida so‘rovlarda `supabase-migration-7.2.sql`, `supabase-migration-7.4.sql`, `supabase-migration-7.7.sql`, `supabase-migration-7.8.sql` fayllarini ketma-ket RUN qiling.
4. Mavjud 7.7 bazada faqat `supabase-migration-7.8.sql` ni RUN qiling. Qadamlar `UPDATE-7.8.md` da. Eski ma’lumotlar saqlanadi.
5. **Authentication → Providers → Anonymous Sign-Ins** imkoniyatini yoqing.
6. Email orqali ro‘yxatdan o‘tganda darhol kirish kerak bo‘lsa, Auth sozlamasida **Confirm email** talabini o‘chiring.

## 2. Kerakli kalitlar

Supabase Dashboard’dagi **Project Settings → API** bo‘limidan quyidagilarni oling:

```text
VITE_SUPABASE_URL=https://project-id.supabase.co
VITE_SUPABASE_ANON_KEY=publishable_or_anon_key
SUPABASE_SERVICE_ROLE_KEY=service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` yoki yangi `SUPABASE_SECRET_KEY` admin tomonidan parol tiklash uchun ham kerak. Bu maxfiy kalit faqat server muhitida turadi; `VITE_` bilan boshlanadigan o‘zgaruvchiga yozmang.

### Localhostda admin parolini tiklash

1. Supabase **Project Settings → API Keys** sahifasidan `secret` (`sb_secret_...`) kalitni oling. Agar loyihada faqat eski kalitlar bo‘lsa, `service_role` kalitini oling. Publishable/anon kaliti bu ishga yaramaydi.
2. Loyiha ildizida `.env.local` faylini oching (yo‘q bo‘lsa `.env.example` dan nusxa yarating) va quyidagilarni kiriting:

```text
VITE_SUPABASE_URL=https://project-id.supabase.co
VITE_SUPABASE_ANON_KEY=publishable_or_anon_key
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
```

Eski `service_role` kaliti ishlatilsa oxirgi satr o‘rniga `SUPABASE_SERVICE_ROLE_KEY=...` yozing. Kalit va URL aynan **bitta Supabase loyihasiga** tegishli bo‘lsin. `.env.local` faylini GitHub yoki ZIP ichiga qo‘shmang, chatga yubormang.

3. Terminaldagi eski `npm run dev` jarayonini to‘xtating (`Ctrl+C`), so‘ng qayta `npm run dev` qiling. Admin hisobidan kirib parolni yangilang. Lokal Vite server endi `/api/admin-reset-password` so‘rovini o‘zi qabul qiladi.

## 3. Administrator

1. **Authentication → Users → Add user** bo‘limidan `admin@sinfquiz.uz` emailini yarating.
2. Kamida 12 belgili parol belgilang.
3. Saytda administrator bo‘limiga `admin` login va shu parol bilan kiring.

## 4. Vercel

1. Loyihani GitHub orqali yoki ZIP’dan Vercel’ga import qiling.
2. **Settings → Environment Variables** bo‘limiga `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` qiymatlarini kiriting.
3. Admin parol tiklash uchun `SUPABASE_SECRET_KEY` (yoki `SUPABASE_SERVICE_ROLE_KEY`) ni server env sifatida kiriting. Telegram login kerak bo‘lsa `VITE_TELEGRAM_BOT_USERNAME` va `TELEGRAM_BOT_TOKEN` ni ham kiriting.
4. **Redeploy** qiling.

## 5. Telegram ixtiyoriy sozlamasi

1. `@BotFather` orqali bot yarating.
2. `/setdomain` orqali Vercel domenini kiriting.
3. Bot username va tokenini Vercel Environment Variables bo‘limiga kiriting.

## 6. Muammo chiqsa

- “Supabase sozlanmagan” — Vercel env qiymatlarini tekshirib, qayta deploy qiling.
- “row-level security” — mavjud loyihada `supabase-migration-7.6.sql` ni, yangi loyihada `supabase-schema.sql` ni SQL Editor’da RUN qiling.
- O‘quvchi kod bilan kira olmasa — Anonymous Sign-Ins yoqilganini tekshiring.
- Realtime yangilanmasa — Database → Replication bo‘limida `documents` jadvali yoqilganini tekshiring; SQL fayli odatda buni avtomatik bajaradi.
