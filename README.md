# SinfQuiz 7.7

## 10 ta tayyor CEFR / Multilevel mock

Administrator Supabase SQL Editor’da `supabase-migration-7.7.sql` faylini bir marta ishga tushiradi. So‘ng yangi kodni deploy qilib, **Administrator paneli → CEFR / Multilevel** sahifasini ochadi. Sahifa 10 ta variantni bir marta e’lon qiladi; ular o‘quvchilarning CEFR katalogida ko‘rinadi. Oldingi variant va natijalar saqlanadi. Batafsil ketma-ketlik: `UPDATE-7.7.md`.

Har variantda 35 ta Listening (6 qism, mahalliy MP3), 35 ta Reading (5 qism), 3 ta Writing va 8 ta Speaking topshirig‘i bor. Jami 700 ta kalit bilan tekshiriladigan Listening/Reading savoli va 110 ta yozma/og‘zaki topshiriq. Audio 60 ta qisqa sun’iy ovoz yozuvidan iborat; brauzer saytdan yuklaydi. Mavzular va matnlar original mashq materiallari. Ular kutilayotgan imtihonning haqiqiy savollari yoki rasmiy sertifikat emas; Writing va Speaking ishlari administrator tomonidan baholanadi.

## Reyting va tezlik yangilanishi

Ustozning natija qatorlari Supabase RLS orqali faqat o‘ziga va natijani topshirgan o‘quvchiga ochiq. O‘quvchi faqat o‘zi qatnashgan testning ixcham jonli reytingini (ism, avatar, ball) ko‘radi; boshqa test qatnashchilarining javoblari yuborilmaydi. Reyting jadvali bazada avtomatik yangilanadi. Ustoz paneli jonli xabarlarni olayotganda har safar ortiqcha ro‘yxat so‘rovlarini yubormaydi.

**Mavjud 7.5 bazadan yangilash:** ZIPdagi `supabase-migration-7.6.sql` faylini Supabase SQL Editor’da RUN qiling, keyin 7.6 kodini Vercel’ga deploy qiling. Eski natijalar o‘chirilmaydi. Yangi loyiha uchun `supabase-schema.sql` bu o‘zgarishni o‘z ichiga oladi; undan keyin 7.2 va 7.4 migratsiyalarini bajaring. Batafsil `UPDATE-7.6.md`.

Sinf fanlari, kodli testlar, typing va umumiy maydondagi 1v1 poyga platformasi. React/Vite + Supabase; Vercel uchun tayyor loyiha.

## Yangi: bo‘sh milliy test katalogiga tayyor variantlar

Admin hisobida birinchi kirishda ikkita 30 savollik variant bir marta Supabase’ga tasdiqlangan va ommaga ochiq holda joylanadi: **Matematika — manbali algebra** va **Ingliz tili — Reading**. Ular “Milliy test → Matematika / Ingliz tili” kartalarida darhol ishlanadi, adminning “Milliy testlar” panelida tahrirlanadi yoki o‘chiriladi. O‘qituvchining mavjud savollari va tasdiq jarayoni saqlanadi. Admin biror variantni o‘chirgach, u qayta avtomatik yaratilmaydi.

Har ikkisi mavjud 75 savollik ochiq to‘plamdagi manbali mashqlardan moslashtirilgan: matematika uchun 30 ta Boyden masalasi, ingliz tili uchun VOA matnlari asosida 30 ta savol. Inglizcha savollar oynasida kerakli Reading matni ham ochiladi. To‘rt variantli format uchun yangi chalg‘ituvchi javoblar qo‘shilgan, izoh va manba saqlangan. Bular rasmiy milliy sertifikatning aynan nusxasi emas, mashq natijasi.

7.4 bazasidan yangilash uchun **yangi SQL kerak emas**. Admin hisobida kirib, “Milliy testlar” yoki bosh sahifadagi “Milliy test” bo‘limini bir marta oching. Batafsil: `UPDATE-7.5.md`.

## Admin boshqaradigan CEFR

**Administrator paneli → CEFR / Multilevel**: to‘rt bo‘limli variant yaratish, qoralama saqlash, tekshirish, e’lon qilish va yopish. Listening uchun HTTPS audio manzili, Reading uchun matn, Writing va Speaking uchun topshiriqlar kiritiladi. Manba/muallif va foydalanish huquqi qaydi talab qilinadi.

O‘quvchi **CEFR / Multilevel** kartasidan e’lon qilingan variantni ishlaydi. Taymer server vaqtiga asoslanadi, topshirilgan bo‘limga qaytilmaydi, javoblar har 5 soniyada serverga va darhol qurilmaga saqlanadi. Internet uzilsa, xabar va qayta saqlash tugmasi bor; muddatdan keyingi javoblar qabul qilinmaydi. Speaking mikrofon yoki 20 MB gacha audio fayl orqali topshiriladi.

Listening/Reading kalit bo‘yicha bazada tekshiriladi. **Tekshirish** oynasida admin Writing va Speaking ishlariga 0–75 mashq bahosi va izoh beradi. O‘quvchi natija sahifasida yangilangan bahoni ko‘radi. Rasmiy CEFR darajasi avtomatik chiqarilmaydi.

Yangi jadval va RPC ruxsatlari: faqat admin variantlarni boshqaradi; o‘quvchi faqat o‘z sessiyasini ko‘radi. Javob kaliti test tugaguncha yuborilmaydi. Speaking yozuvlari xususiy bucket’da; o‘quvchi o‘z audiosini, admin topshirilgan audioni ochadi. Variant tahriri qoralamaga qaytadi, boshlangan sessiya o‘z nusxasida davom etadi.

7.4 bazangiz ishlayotgan bo‘lsa, CEFR uchun SQL qayta bajarilmaydi. Yangi loyihada `supabase-migration-7.4.sql` ham kerak; batafsil `UPDATE-7.5.md` da.

## Sayt ichidagi tayyor testlar

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

10 ta tayyor CEFR mock **mustaqil mashq** sifatida qo‘shilgan. CEFR muharriri ham mavjud: admin o‘z savollari va audio materiallarini joylay oladi. Rasmiy B1/B2/C1 darajasi yoki Rasch sertifikat bali avtomatik berilmaydi. 30 savollik algebra to‘plami rasmiy milliy sertifikat variantining aynan nusxasi emas.

Avvalgi mahalliy PDF/audio ish joyi faqat oldin boshlangan sessiyalarni tiklash uchun saqlangan; bosh sahifadagi CEFR tugmasi admin e’lon qilgan CEFR variantlarini ochadi. Tayyor Reading esa “Tayyor testlar” ichida qolgan. Eski avtomatik demo mocklar ommaviy katalogda ko‘rsatilmaydi.

## O‘rnatish

Node.js 22.12+ kerak. `.env.example` dan `.env.local` yarating, Supabase URL va publishable/anon key’ni kiriting.

```bash
npm ci
npm run dev
```

Mavjud 7.6 bazada `supabase-migration-7.7.sql` ni bajaring. Eski 7.0/7.1 bazada avval `supabase-migration-7.2.sql`, 7.2/7.3 bazada `supabase-migration-7.4.sql`, 7.5 bazada `supabase-migration-7.6.sql` ham kerak. Yangi bazada ketma-ket `supabase-schema.sql`, `supabase-migration-7.2.sql`, `supabase-migration-7.4.sql`, `supabase-migration-7.7.sql` bajariladi. Batafsil: `SUPABASE-VERCEL.md` va `UPDATE-7.7.md`.

Vercel’ga yangi kodni yuklang, env qiymatlarini saqlang va redeploy qiling. `SUPABASE_SERVICE_ROLE_KEY` va `TELEGRAM_BOT_TOKEN` serverda qoladi; ularni `VITE_` bilan boshlamang.

## Tekshiruv

```bash
npm test
npm run build
```

Kodli Python javoblarini tekshiruvchi test uchun Python 3 ham kerak. Saytning o‘zida Python o‘rnatilishi talab qilinmaydi.

Testlar savollar kaliti, matematik yechimlar, Pythonning haqiqiy chiqishi, sessiya, yakunlash, qayta ochish va UI oqimlarini tekshiradi. CEFR SQL migratsiyasi PGlite (PostgreSQL) ichida, ruxsatlar va deadline bilan sinovdan o‘tadi. UI sinovi jsdom/simulyatsiya qilingan API bilan; haqiqiy mobil brauzer, mikrofon va live Supabase bu muhitda tekshirilmagan.

Tayyor 75 savollik mustaqil mashqning javob kalitlari mijoz kodida mavjud. Yangi admin CEFR variantlarining kalitlari bazada yashiriladi. Bu nazoratli rasmiy imtihon yoki soxtalashtirishdan to‘liq himoyalangan baholash tizimi emas. Global jonli poyga hali bir necha sinf uchun mustaqil xonalarga bo‘linmagan.
