# SinfQuiz 7.29.0 — musobaqa va Office savollari

## Nimalar qo‘shildi

- Ustoz “Musobaqani boshlash” orqali to‘lmagan jamoalar bilan ham boshlaydi. Kamida ikki jamoada bittadan ishtirokchi bo‘lishi kerak. Bo‘sh jamoa reytingga kirmaydi; boshlashdagi a’zolar soni jamoaning o‘rtacha balli uchun qayd etiladi.
- Yangi musobaqalarda ishtirokchi bosqichlarni istalgan ketma-ketlikda tanlaydi. Xohlasa boshqa ochilgan bosqichga o‘tadi va avvalgi ishiga qaytadi. Ustoz boshqaradigan umumiy ketma-ket rejim ham saqlangan.
- Ustoz har bosqichga alohida daqiqa va sekund belgilaydi: 30 sekunddan 60 daqiqagacha. Erkin rejimda har ishtirokchining shu bosqich vaqti uni birinchi ochganda boshlanadi. Bosqichni almashtirish vaqtni to‘xtatmaydi, qayta ochish yoki sahifani yangilash vaqtni yangilamaydi.
- Quiz, klaviatura, Word, Excel va typing ishi o‘zgarsa, qoralama taxminan har 4 sekundda serverga saqlanadi. “Qoralamani saqlash”, javobni yuborish va bosqichni almashtirish oldidan ham saqlanadi. Labirintning amallari mavjud server yo‘li orqali qayd etiladi.
- Vaqt tugaganda muddatgacha saqlangan ish 0–100 ballga baholanadi. Ustoz “Hozir yakunlash” orqali tugallanmagan musobaqani yopishi mumkin; saqlangan ish baholanadi va boshlanmagan qismlar 0 ball oladi.
- Klaviatura bo‘yicha 12, Word bo‘yicha 12, Excel bo‘yicha 10 ta yangi savol. Uchta Word va to‘rtta Excel vazifasi ishlaydigan muharrir bilan bajariladi. Alohida amaliy bosqich sifatida biriktirish ham mumkin.
- Excel muharririda nisbiy, mutlaq va aralash havolalarni hisoblab ko‘chirish; IF, AND, OR, NOT, SUM va AVERAGE mavjud. Formulada `,` va `;` ajratgichlari, asosiy ruscha funksiya nomlari ham qabul qilinadi.

## Ishlayotgan loyihani yangilash

1. O‘z `.env.local` faylingizni saqlang. ZIP ichidagi `sinf-quiz` papkasidan yangi kodni oling; unda shaxsiy maxfiy kalitlar yo‘q.
2. Baza 7.28 bo‘lsa Supabase SQL Editor’da `supabase-migration-7.29.sql` faylini to‘liq RUN qiling. 7.27 bo‘lsa avval `supabase-migration-7.28.sql`, so‘ng 7.29. Yangi baza uchun [MIGRATIONS.md](MIGRATIONS.md)dagi 49 fayl tartibidan foydalaning.
3. Natijani tekshiring:

```sql
select public.sq_schema_status();
```

`version: 7.29.0`, `competitionFreeOrder: true` va `stageDraftGrading: true` chiqishi kerak. Migratsiya qayta qo‘llansa ham mavjud natijalar o‘chmaydi. Mavjud musobaqalar ketma-ket rejimda qoladi.

4. VS Code terminalida Node.js 22.12 yoki undan yangi versiyada:

```powershell
npm ci
npm run dev
```

5. Vercel’da yangi kod bilan qayta deploy qiling. Build — `npm run build`, chiqish katalogi — `dist`. O‘z Supabase muhit qiymatlaringiz saqlansin. Mehmon ishtirokchi uchun Anonymous Sign-Ins yoqilgan bo‘lsin.

## Darsda foydalanish

Ustoz kabineti → Musobaqalar → Musobaqa yaratish. Bosqich tartibini tanlang, klaviatura/Word/Excel to‘plamlari yoki mavjud o‘zingizga tegishli manbalarni biriktiring. Har bir bosqichning “Sozlash” qismida vaqtini kiriting. Kamida 4 bosqich yarating; typing yoki labirint ham biriktirishingiz mumkin.

Jamoalar hajmini belgilang, qoralamani saqlang va qabulni faollashtiring. Har jamoaning o‘z kodini tarqating. Kelmagan o‘quvchi sabab kutish shart emas: kirganlar bilan boshlashni tasdiqlang. Boshlashdan oldin kelmaganlarni ro‘yxatda chiqarish yoki qaytarish mumkin; boshlashdan keyin qayd etilgan tarkib reytingda saqlanadi.

Erkin rejimdagi o‘quvchi bosqich kartasini tanlaydi. Kartada uning holati, ajratilgan vaqt va balli ko‘rinadi. Ustoz barcha a’zolarning bosqich natijalarini ko‘radi va jadvalni CSV orqali Excel uchun oladi. Odatdagi yakunlash barcha faol ishtirokchi barcha bosqichni yopganda ochiladi. “Hozir yakunlash” tugmasi bilan ertaroq tugatish alohida tasdiqlanadi.

## Ball qanday hisoblanadi

Quiz bosqichi: `100 × yig‘ilgan ball / barcha savollarning maksimal balli`. Word va Excelning har mezoni alohida hisobga olinadi. Masalan, 3 savolli bosqichda birinchi Word savolining 4 mezonidan 3 tasi bajarilib, qolgan 2 savol ishlanmagan bo‘lsa, bosqich 25 ball oladi. Bitta Excel topshirig‘ining 2 mezonidan bittasi bajarilsa, 50 ball oladi. Tenglamalar, funksiya nomlari va havolalar server tomonidan tekshiriladi.

Typingdagi tahrir masofasi, tezlik va aniqlikni hisoblash saqlangan; boshida bitta belgi tushib qolishi keyingi barcha belgilarni xato qilmaydi. Jamoaning bosqich balli boshlashda qayd etilgan a’zolarning o‘rtachasidan va ustoz belgilagan koeffitsiyentdan olinadi. Chiqib ketish shu bo‘luvchini kichraytirmaydi.

Internet uzilgan holatda qoralama saqlash xabari chiqadi; qayta ulanganda yoki qo‘lda saqlanganda yana yuboriladi. Vaqt tugagach faqat server muddatidan oldin yetib kelgan ish hisobga olinadi. Kech kelgan yangi javob eski natijani almashtirmaydi. Aloqa tiklangandagi birinchi so‘rov tugagan bosqichlarni yakunlaydi; alohida Cron vazifasi kerak emas.

Office muharriri o‘quv simulyatori; Excel jadvali A1–D8 oralig‘ida. Python bajaruvchisi brauzerdagi mashq sifatida saqlangan; server tekshiruvisiz Python stdout reyting balli hisoblanmaydi. Ustozlarning shaxsiy savollari, boshqa fanlar va Sinfxona oqimlari saqlangan.

[Savollar va manbalar](CONTENT-7.29.md) · [Tekshiruv dalillari](QA-7.29.md) · [O‘zgargan fayllar](CHANGED-FILES-7.29.md)
