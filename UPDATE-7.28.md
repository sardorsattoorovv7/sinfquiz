# SinfQuiz 7.28.0

Bu to‘liq paket 7.27.0 asosida yangilandi: mavjud fanlar, GLB modellar, audio, Python muhiti va foydalanuvchi oqimlari ichida bor.

1. Supabase SQL Editor’da `supabase-migration-7.28.sql`ni RUN qiling. Batafsil ketma-ketlik: `MIGRATIONS.md`.
2. Loyiha fayllarini yangilang; o‘z `.env.local` faylingizni saqlang.
3. `npm ci`, `npm run dev`. Vercel uchun `npm run build` va qayta deploy.
4. Ustoz typing yoki 1v1 xonasini qayta ochadi. O‘quvchilar o‘sha ustozning xonasini tanlaydi.
5. **Sinfxona → Jadval qo‘shish** orqali qator, ustun va matnlarni kiriting. Doskada jadvalni ikki marta bosing yoki tanlab **Jadvalni tahrirlash**ni ishlating. Undo/redo, qoralama, PNG va doska uslublari saqlanadi.
6. Taymer, shovqin yoki raqam panelidagi **Katta namoyish** tugmasini bosing. Vaqt va mikrofon holati davom etadi. Oyna ichidagi parametrlar odatiy panel bilan bir xil.

Typingdagi jonli hisob va yakuniy baho bitta harf tushsa keyingi barcha belgini xato hisoblamaydi.

Typing va milliy test javoblari UIDga bog‘langan server sessiyasida hisoblanadi; mijoz taymer yoki ballini yuborib natijani o‘zgartira olmaydi. Ustozlar boshqa ustozning savollari/kalitlarini ocholmaydi. Faol quiz PINi bazada noyob. Atomik yozuvlar, server hisoblagichlari va 50 tadan foydalanuvchi sahifalari qo‘shildi.

Python amaliyoti reytingdan ajratildi: brauzer natijasi serverdagi xavfsiz bajaruvchida tekshirilmaguncha unga reyting balli berilmaydi. Eski typing/milliy natijalarning tarixi saqlanadi, ammo ular tekshirilmagan mashq sifatida belgilanadi.

Tekshiruvlar va chegaralar `QA-7.28.md`, o‘zgargan fayllar `CHANGED-FILES-7.28.md` ichida.
