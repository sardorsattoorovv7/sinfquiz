# 7.13 — English Audio Labirint

## Mahalliy ishga tushirish

1. `npm ci`
2. `.env.example` dan `.env.local` yarating, Supabase URL va publishable/anon kalitini qo‘ying.
3. Supabase Auth sozlamalarida Anonymous Sign-Ins funksiyasini yoqing.
4. `supabase-audio-maze.sql` ni Supabase SQL Editor’da bir marta RUN qiling.
5. `npm run dev`

Vercel’da yangi deploy kerak. Maxfiy service_role kalitini VITE_ bilan boshlanuvchi client variable qilib qo‘ymang; bu modul uchun maxfiy server kaliti kerak emas.

## O‘qituvchi oqimi

Admin paneli → **Audio labirint** → xarita tanlash → **Faollashtirish**. O‘quvchi bosh sahifadagi **Inglizcha audio labirint** kartasidan kiradi. O‘qituvchi savol to‘plami yaratsa, u admin tasdig‘idan keyin tanlanadigan xaritalar ro‘yxatiga qo‘shiladi.

Ko‘proq tafsilot: `AUDIO-MAZE.md`.
