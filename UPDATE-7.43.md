# SinfQuiz 7.43.0 — PIANO va yonlama kuy tanlash

Bo‘lim nomi menyu, mashqlar kartasi, yuklanish yozuvi va piano sarlavhasida **PIANO** bo‘ldi.

## Telefon/planshetda kuyni almashtirish

1. **PIANO → Yonlama piano** yoki to‘liq ekran tugmasini bosing.
2. Yuqoridagi **kuy nomi** ustiga bosing. Kuylar ro‘yxati ochiladi.
3. Kuy, ijrochi yoki film nomini qidiring. **Kuylar**, **Mashqlar**, **Meniki** orasida o‘ting.
4. Kuyni tanlang. Ro‘yxat yopilib, tanlangan kuy o‘sha yonlama sahnada ochiladi. Play yoki O‘rganish tugmasi bilan davom eting.

Ro‘yxatning o‘zi ham piano bilan birga buriladi; sahifadan chiqish kerak emas. 79 tayyor kuy, 38 mashq va avval saqlangan shaxsiy MIDIlar tanlanadi. Ro‘yxat ochilganda ijro pauza qilinadi; tanlov bekor qilinsa tutorial qadami saqlanadi. Boshqa kuy tanlansa eski notalar to‘xtab, yangi tutorial boshidan tayyor turadi. Yozuv davomida kuy tanlash bloklanadi.

Qidiruv uchun mobil klaviatura ochilishi ekran o‘lchamini o‘zgartirsa ham joriy burilish saqlanadi. Jismoniy orientation change hamon ishlaydi. Tugmalar 44 px dan kichik emas; qidiruv matni 16 px. Tab fokusi ro‘yxatda qoladi. Esc avval ro‘yxatni, keyingi bosishda yonlama rejimni yopadi.

Ovoz, balandlik sozlamalari, sevimlilar, tutorial natijalari, shaxsiy MIDIlar va eski `#kino-piano` havolalari saqlangan. O‘zbekcha typing razminkasi va barcha fan modullari ham mavjud.

## Ishga tushirish

ZIPni oching. `sinf-quiz` papkasida Node.js 22.12+ bilan `npm ci`, so‘ng `npm run dev` bajaring. Production: `npm run build`, hostingga `dist` natijasini joylashtiring. Mavjud `.env` Supabase sozlamalarini saqlang; namuna `.env.example`da. **Yangi SQL yoki dependency kerak emas.**

O‘zgargan fayllar: `CHANGED-FILES-7.43.md`. Tekshiruv natijalari va chegaralari: `QA-7.43.md`.
