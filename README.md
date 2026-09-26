# SinfQuiz 7.3

Sinf fanlari, kodli testlar, typing va umumiy maydondagi 1v1 poyga platformasi. React/Vite + Supabase; Vercel uchun tayyor loyiha.

## Yangi: sayt ichidagi tayyor testlar

Bosh sahifa → **Tayyor testlar**. Savol ishlash uchun boshqa saytga o‘tish yoki PDF yuklash shart emas.

| Fan | Takrorlanmagan savol | Tarkib |
| --- | ---: | --- |
| Ingliz tili | 30 | 6 ta asl VOA matni/dialogi; tanlash va qisqa javob |
| Matematika | 30 | Nisbat, chiziqli tenglama, sistema va kvadrat tenglama |
| Python | 15 | IDE, print, type, int, str, bool va operatorlar |

Ingliz tili va matematikaning har birida 30 savollik aralash variant bor. Mavzularni alohida ham ishlash mumkin: 6 ta ingliz tili, 4 ta matematika va 1 ta Python to‘plami. Jami 75 ta noyob savol; aralash variantlar shu savollarni birlashtiradi, yangi savollar sifatida sanalmaydi.

Python to‘plami ustoz panelidagi **Tayyor savollar to‘plami → Python** orqali shaxsiy testga nusxalanadi. Ustoz uni tahrirlashi, 6 xonali kod bilan faollashtirishi yoki 1v1 uchun savollarini tanlashi mumkin. Yangi ustozda boshlang‘ich shablonlar yaratiladi; mavjud ustoz testlariga avtomatik yozilmaydi. Chop etish uchun savol va kalit: `PYTHON-15-TEST.md`.

## Interfeys

- Fan bo‘yicha filtr, mavzu qidiruvi, aniq savol/vaqt kartalari.
- Reading matni va savollar yonma-yon; telefonda ketma-ket.
- Matn o‘lchamini sozlash, radio variantlar va qisqa javob maydoni.
- Javoblar xaritasi, “Keyin ko‘rish” belgisi va javobni tozalash.
- Taymer; vaqt tugaganda avtomatik yakunlash. Yakunlangan javoblar o‘zgarmaydi.
- Sahifa yangilanganda davom ettirish, qurilmada avtomatik saqlash.
- Xato, javobsiz yoki barcha savollar bo‘yicha javob/yechim tahlili; natijani JSON yuklash.
- Logo faol testdan chiqarmaydi; qaytish aniq tugma orqali.
- Ranglar, fokus holatlari, dark/light ko‘rinish va tor ekran moslashuvi.

Yangi mashqlarda har javob uchun server so‘rovi yuborilmaydi; test ochilgach ma’lumotlar qurilmada ishlaydi. Natijalar brauzerda saqlanadi, admin statistikasiga avtomatik yuborilmaydi. Ustozning kodli testi va uning jonli natijalari avvalgi tizimda ishlaydi.

## Manbalar va aniq chegaralar

VOA o‘z original matnlaridan ta’lim/tijorat maqsadida manba ko‘rsatib foydalanishga ruxsat bergan. Boydenning 1895-yilgi kitobi public domain. Asl matnlar va masalalar manbadan olindi; tanlash variantlari, tarjimalar va izohlar moslashtirilgan. Manba sanalari ko‘rsatilgan: 2004-yildagi matn raqamlari bugungi statistika sifatida berilmaydi.

To‘liq izoh va foydalanish qaydi: `CONTENT-SOURCES.md`. Python savollari original; rasmiy Python hujjatlari bilan tekshirilgan.

**Bu versiyada 10 ta to‘liq rasmiy CEFR mock mavjud emas.** Yangi ingliz tili bo‘limi Reading mashqlari, haqiqiy Listening audio to‘plami qo‘shilmagan. CEFRga rasmiy B1/B2/C1 daraja yoki Rasch sertifikat bali berilmaydi. 30 savollik algebra to‘plami rasmiy milliy sertifikat variantining aynan nusxasi emas.

Avvalgi mahalliy PDF/audio ish joyi faqat oldin boshlangan sessiyalarni tiklash uchun saqlangan; bosh sahifadagi CEFR tugmasi yangi Reading katalogini ochadi. Eski avtomatik demo mocklar ommaviy katalogda ko‘rsatilmaydi.

## O‘rnatish

Node.js 22.12+ kerak. `.env.example` dan `.env.local` yarating, Supabase URL va publishable/anon key’ni kiriting.

```bash
npm ci
npm run dev
```

7.2 bazadan yangilaganda yangi SQL kerak emas. Eski 7.0/7.1 bazada `supabase-migration-7.2.sql` ni bajaring. Yangi bazada avval `supabase-schema.sql`, so‘ng migratsiya bajariladi. Batafsil: `SUPABASE-VERCEL.md` va `UPDATE-7.3.md`.

Vercel’ga yangi kodni yuklang, env qiymatlarini saqlang va redeploy qiling. `SUPABASE_SERVICE_ROLE_KEY` va `TELEGRAM_BOT_TOKEN` serverda qoladi; ularni `VITE_` bilan boshlamang.

## Tekshiruv

```bash
npm test
npm run build
```

Kodli Python javoblarini tekshiruvchi test uchun Python 3 ham kerak. Saytning o‘zida Python o‘rnatilishi talab qilinmaydi.

Testlar savollar kaliti, matematik yechimlar, Pythonning haqiqiy chiqishi, sessiya, yakunlash, qayta ochish va UI oqimlarini tekshiradi. UI sinovi jsdom/simulyatsiya qilingan API bilan; haqiqiy mobil brauzer, mikrofon va live Supabase bu muhitda tekshirilmagan.

Mashq javob kalitlari mijoz kodida mavjud. Bu nazoratli rasmiy imtihon yoki soxtalashtirishdan to‘liq himoyalangan baholash tizimi emas. Global jonli poyga hali bir necha sinf uchun mustaqil xonalarga bo‘linmagan.
