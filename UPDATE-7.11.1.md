# 7.11.1 — Python muhiti yuklanishidagi kutish tuzatildi

Oldingi kodda har bir bajarishda Pyodide tashqi CDN orqali sandboxed iframe ichida yuklanardi. Shu sabab ayrim brauzer va tarmoqlarda “Muhit tayyorlanmoqda…” ekrani uzoq turib qolardi.

Yangi kodda Pythonning beshta ishga tushirish fayli `public/python-runtime/` ichida sayt bilan birga joylanadi. `npm ci` yoki `npm run build` ularni `pyodide@0.29.4` paketidan nusxalaydi. Har bir kod alohida workerda ishlaydi; yuklash 35 soniyadan, kod 6 soniyadan oshsa ish to‘xtatiladi. **To‘xtatish** tugmasi darhol worker jarayonini tugatadi. Kod qoralamasi 52 soat shu brauzerda qoladi.

## Yangilash

1. Loyihaning yangi ZIP faylini oching, `.env.local` qiymatlaringizni saqlagan holda eski loyiha kodini yangilang.
2. `npm ci` va `npm run build` bajaring. `dist/python-worker.mjs` hamda `dist/python-runtime/` ichida `.mjs`, `.js`, `.wasm`, `.zip`, `.json` fayllari borligini tekshiring.
3. Yangi kodni GitHub/Vercel’ga joylang. Vercel’da yangi Production deployment tayyor bo‘lgach brauzerda sahifani qayta yuklang.
4. O‘quvchi kabineti → Python amaliyoti → `print("Salom")` → **Kodni ishga tushirish**. Natijada “Salom” chiqishi kerak. Ilk yuklash bir necha soniya olishi, keyingisi brauzer keshi sabab tezroq bo‘lishi mumkin.

Qo‘shimcha Supabase SQL yoki Auth sozlamasi talab qilinmaydi. Agar yangi deploymentda fayllardan biri 404 bersa, `npm run build` bosqichi va Vercel’ning `dist/python-runtime/` chiqishini tekshiring. Fayllarni GitHub’ga yuborishda maxfiy `.env` fayllarini qo‘shmang.

Python kodi serverda bajarilmaydi. Worker DOM va localStorage’ni ko‘rmaydi; ruxsat etilgan Python modullari cheklangan, tarmoq amallari ishga tushgandan keyin yopiladi. Har qanday zararli kodni statik tekshiruv bilan to‘liq aniqlash mumkin emas; kod bajarish chegarasi, worker’ni tugatish va alohida jarayon asosiy himoyadir.
