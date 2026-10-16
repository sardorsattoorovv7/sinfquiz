# SinfQuiz 7.38.0 — o‘rnatish va foydalanish

Bu 7.37.0 loyihasining to‘liq yangilangan manbasi.

1. ZIPni yangi bo‘sh papkaga oching.
2. Amaldagi `.env.local` qiymatlaringizni saqlang va yangi papkaga ko‘chiring.
3. Node.js 22.12+ bilan `npm ci` bajaring. Bu Python runtime fayllarini ham avtomatik tayyorlaydi.
4. Lokal ishga tushirish: `npm run dev`. Production: `npm run build`, natija `dist`.
5. Tekshirish: `npm test`, builddan keyin `npm run perf`.

Yangi SQL, dependency yoki environment qiymati talab qilinmaydi. Auth, API, RPC, RLS va natijalarni saqlash kodi o‘zgarmagan.

## Yangi kuylar

Mashqlar → Kino Piano → BLOK3 va hindcha. Asosiy bo‘lim Kusura Bakma bilan ochiladi. Qidiruvga `ogirlanmagan kelin`, `DDLJ`, `shoxruxxon`, kuy yoki film nomini yozish mumkin. Saralagichdagi “Turkcha” olti BLOK3, “Hindcha” beshta kino kuyini ko‘rsatadi.

“Tinglash” va katta Play tugmasi bilan parchani eshiting. “O‘rganish” va Play bilan darsni boshlang. Ko‘rsatilgan Do4, Re4, Mi4 kabi notalarni sensor/sichqoncha yoki klavish ustidagi kompyuter harfi bilan bosing. Akkord ko‘rsatilsa barcha notalar kerak; noto‘g‘ri nota darsni oldinga o‘tkazmaydi. “Eshitib ko‘rish” joriy qadamni eshittiradi, yonida keyingi olti qadam bor.

Do=C, Re=D, Mi=E, Fa=F, Sol=G, Lya=A, Si=B. ♯ — yarim ton yuqori nota, raqam — oktava. Audio Lab’da nota yozuvi, ovoz, reverb, sustain va oktava sozlanadi. Tezlik 0.5× va 0.75× ga tushirilishi mumkin. MIDI tugmasi aynan darsdagi parchani yuklab beradi.

Yangi 11 ta dars asosiy melodiya uchun o‘ng qo‘lga tayyorlangan; chap qo‘l jo‘rligi kiritilmagan. Shu kuylarda “Chap · jo‘r bo‘lish” tanlovi o‘chiq; eski chap qo‘l sozlamasi o‘ng qo‘lga moslanadi. Boshqa repertuardagi ikki qo‘l darslari ishlashda davom etadi.

4 ta kuy tayyor MIDI manbasidan, 7 tasi nota manbasidan tayyorlangan. BLOK3 uchun bepul tayyor MIDI topilgan deb ko‘rsatilmaydi. Tujhe Dekha Toh ritmi o‘quv uchun soddalashtirilgan; Git’dagi to‘rt takt ikki marta takrorlanadi; ikki qisqa hindcha manba 30 soniyaga yetkazish uchun sekinlashtirilgan. Tafsilotlar PIANO-SOURCES-7.38.md va ma’lumot manifestida.

Bu 11 ta tanlangan kuy; oldingi “20 tacha” so‘rovi bo‘yicha 20 ta yangi BLOK3/hindcha MIDI topildi degan da’vo yo‘q. Tashqi fayl yuklash, obuna yoki to‘lov yangi darslarni ishlatish uchun kerak emas. Brauzer ovozni birinchi bosishdan keyin yoqadi.
