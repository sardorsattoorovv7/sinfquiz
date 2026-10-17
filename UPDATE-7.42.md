# SinfQuiz 7.42.0 — o‘zbekcha typing razminkasi

## Qayerdan ochiladi?

Ustoz ochgan **Typing / Mashqni boshlash → O‘zbekcha typing → Razminka** yo‘lidan kiring. O‘zbekcha bo‘limda razminka dastlab tanlangan. **5 bosqichli matn** tugmasi avvalgi baholanadigan mashqni ochadi. Allaqachon o‘zbekcha sessiyaga kirgan o‘quvchi bosqichni boshlashdan oldin **Avval razminka** tugmasidan ham foydalanishi mumkin.

## Nimalar ishlaydi?

- SinfQuiz uchun yozilgan **48 ta qisqa o‘zbekcha gap**: kundalik hayot, maktab, yozish va O‘/G‘ harflari.
- **Gaplar** rejimi: 1, 3 yoki 5 gap. **Vaqt** rejimi: 15, 30 yoki 60 soniya; gaplar tugay boshlaganda yangi gaplar qo‘shiladi.
- Monkeytype kabi matnning o‘zida yozish: joriy kursor, yozilgan harflar va osti chizilgan xatolar. Backspace va tanlangan qismni almashtirish ishlaydi.
- WPM, aniqlik, xatolar va vaqt. Taymer birinchi harfdan boshlanadi; vaqtli rejim tab yashiringanda ham yakunlanadi. Muddatdan keyingi harflar qabul qilinmaydi.
- Aniqlik hisobida keyin tuzatilgan xatolar ham qoladi; Backspace bosishning o‘zi xato sanalmaydi. WPM = joriy to‘g‘ri belgilar ÷ 5 ÷ daqiqa.
- **Tinish belgilari** orqali bosh harf va vergul/nuqtalarni yoqish mumkin. Oddiy rejim kichik harflar bilan ishlaydi.
- O‘ va G‘ yozishda oddiy `'` hamda keng tarqalgan tipografik apostroflar teng qabul qilinadi.
- Yangi gaplar tugmasi, klaviaturada Tab → Enter orqali qayta boshlash, yakuniy natija va asosiy bosqichga o‘tish.
- Sichqoncha, kompyuter va mobilning odatiy ekran klaviaturasi bilan yozish; reduced-motion va mavjud dark/light qog‘oz tokenlari.

Razminka **mahalliy erkin mashq**: ustoz reytingi yoki rasmiy typing natijasiga yuborilmaydi. Asosiy 5 bosqich, inglizcha tinglab yozish, xona tanlash, ism/avatar, server tekshiruvi va natijalar saqlanishi avvalgidek ishlaydi. Razminkani ishlatish rasmiy bosqichni boshlamaydi.

## O‘rnatish

ZIPni ochib `sinf-quiz` ichida Node.js 22.12+ bilan `npm ci`, keyin `npm run dev` bajaring. Production: `npm run build`, so‘ng `dist`ni hostingga joylashtiring. Mavjud `.env` Supabase sozlamalarini saqlang; misol `.env.example`da. **Yangi SQL va dependency kerak emas.**

Piano, 79 tayyor kuy, mobil yonlama sahna, balandroq ovoz, boshqa fanlar va boshqaruvlar saqlangan. O‘zgargan fayllar `CHANGED-FILES-7.42.md`, tekshiruvlar va chegaralari `QA-7.42.md` ichida.
