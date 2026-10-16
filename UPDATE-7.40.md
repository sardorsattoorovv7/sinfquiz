# SinfQuiz 7.40.0 — yangilash

Bu to‘liq loyiha ZIPi. Node.js 22.12+ bilan arxivdagi `sinf-quiz` jildini oching:

```sh
npm ci
npm test
npm run build
npm run perf
npm run dev
```

Production uchun yangilangan `dist`ni odatdagi hosting jarayoningizda joylang. Mavjud `.env` qiymatlaringizni saqlang; ZIPdagi `.env.example` namunadir. Yangi SQL, Supabase sozlamasi, RPC yoki dependency kerak emas. `npm ci` katta Python runtime fayllarini odatdagidek o‘rnatilgan paketdan nusxalaydi.

**Mashqlar → Kino Piano → Yangi kuylar**: yangi beshta kuy ro‘yxat boshida, oldingi 20 ta shu bo‘limda davom etadi. Boshqa to‘plamlar, shaxsiy MIDIlar, progress va sevimlilar saqlangan. Har bir qo‘shiqning aniq versiyasi va ritmga oid izohi manbalar faylida bor. Nahotki hali qo‘shilmagan.

**Ovoz:** chiqish darajasi kuchaytirilgan. Audio Lab’dan Ovoz balandligi va Master Gain’ni sozlang. Yangi sozlamalar 90% va 1.10×; mavjud foydalanuvchining saqlangan tanlovi, jumladan 0% ovoz, saqlanadi. “Sozlamalarni tiklash” yangi standartlarni qo‘llaydi. Yonlama piano sozlamalarida ovoz slayderi mavjud. Qurilmaning tizim ovoz darajasi alohida boshqariladi.

**Yonlama:** telefon/planshet uchun avvalgi 90° piano/tutor sahnasi saqlangan. Tugma orqali oching; sozlamalardan ovoz, klavishlar soni, oktava va nota yozuvini tanlang. Qaytishda tutorial qadami yo‘qolmaydi.

To‘liq tekshiruvlar: QA-7.40.md. Qo‘shilgan kuylar va cheklovlar: PIANO-SOURCES-7.40.md.
