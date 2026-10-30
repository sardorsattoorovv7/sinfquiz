# SinfQuiz 7.44.0 — Informatika uchun tayyor 3D modellar

**Informatika atlasi → Kompyuter ichida**: 18 ta mahalliy GLB bilan teksturali kompyuter yig‘masi. Ona plata, CPU, RAM, ROM, HDD, SSD, videokarta, portlar va boshqa qismlarni aylantiring, ajrating va alohida kattalashtiring. Har qismda muallif, litsenziya, asl manba va GLB yuklab olish havolasi bor.

11 ta tayyor muallif modeli, 4 ta ona plata fragmenti, 2 ta CAD aktiv va 1 ta original kabel modeli. O‘lchamlar moslashtirilgan, joylashuv — ta’limiy yig‘ma. Apparat modellari sayt bilan tarqatiladi; tashqi viewer yoki hisob talab qilinmaydi. Izohli 3D sxema va WebGLsiz 2D rejim saqlangan.

**Vaqt muzeyi**dagi 7 bekatda internet orqali tayyor tarixiy 3D modelni ochish mumkin. ENIACning 40 panelli amaliy xonasi arxiv asosidagi o‘quv rekonstruksiyasi sifatida qoladi; tashqi skan deb ko‘rsatilmaydi.

Node.js 22.12+, `npm ci`, `npm run dev`. Yangi SQL yoki dependency yo‘q. Kirish: `/#informatika-atlasi`.

**339/339 test o‘tdi.** 18 haqiqiy GLB, eski informatika mashqlari va beshala atlas qo‘llanmalari brauzerda tekshirildi.

**[Yangilash va foydalanish](UPDATE-7.44.md) · [Modellar va manbalar](INFORMATIKA-3D-MODELS-7.44.md) · [QA](QA-7.44.md)**

---

# SinfQuiz 7.43.0 — atlasni muhitida ko‘ring, ishlating va tekshiring

**ENIAC xonasiga kiring:** 40 panelning U shaklidagi joylashuvi, odam bo‘yi bilan o‘lchamni solishtirish, xonada yurish, akkumulyator va kirish/chiqishga yaqinlashish. O‘quv ulash panelida yo‘lni ulang, o‘nlik qo‘shish/ko‘paytirishni bajaring va harakat jadvalini hisoblang.

Barcha **12 tarixiy bekat**da vazifaga mos jonli misol; kompyuterning **18 qismi** uchun ishlash mashqi. Qolgan fanlarda **170 mavzu**ga mos amaliy muhit: matematika 62, biologiya 30, kimyo 25, fizika/koinot 53. Har mavzuda **Amaliy muhitga kirish**ni bosing, parametrni o‘zgartiring, hisoblangan natijani qayd eting va ikki sinovni solishtiring. JSON eksport mavjud.

Xonalar va jihozlar — original o‘quv rekonstruksiyalari; tarixiy mashinalarning to‘liq emulyatori yoki joylarning skani emas. Har mavzuda modelning farazlari va chegaralari ko‘rsatilgan. Mobil boshqaruv, klaviatura va 2D zaxira rejimi mavjud.

Node.js 22.12+, `npm ci`, `npm run dev`. Yangi SQL yoki dependency yo‘q. Kirish: `/#atlaslar`, informatika: `/#informatika-atlasi`.

**333 test o‘tdi; yangi 87 matematika/kimyo 3D ko‘rinishi, 12 tarixiy tajriba va 18 qism brauzerda tekshirildi.**

**[Yangilash va foydalanish](UPDATE-7.43.md) · [QA](QA-7.43.md) · [Manbalar](ATLAS-REALITY-SOURCES-7.43.md)**

---

# SinfQuiz 7.42.0 — barcha atlaslar, tushunarli o‘rganish yo‘li

**Atlaslar markazi** qayta ishlangan: matematika, biologiya, kimyo, fizika/koinot va informatika bir joyda. Mavzuni barcha atlaslardan qidiring yoki oxirgi qaydingizdan davom eting.

| Atlas | Bosqichli qo‘llanma | O‘rganish yo‘li |
| --- | ---: | ---: |
| Matematika | 62 mavzu | 9 |
| Biologiya | 30 mavzu | 4 |
| Kimyo | 25 mavzu va virtual tajriba | 4 |
| Fizika va koinot | 53 hodisa | 8 |
| Informatika | 4 katta bo‘lim | 1 |

Har bir mavzuda **tushuncha va misol → atamalar → modelda ikki sinov → izohli savol → xulosa** tartibi bor. Shaxsiy qaydlar hisob bo‘yicha shu brauzerda saqlanadi; JSON eksport ishlaydi. Qo‘llanma yakuni rasmiy imtihon bali emas.

**326 avtomatik test o‘tdi.** Yangi o‘rganish tartibi beshala atlasda, fizikaning 53 ta haqiqiy 3D sahnasi, ustoz topshirig‘i va informatika regressiyasi brauzerda tekshirildi. Telefon, planshet, tungi ko‘rinish va 2D zaxira rejimi qo‘llanadi.

Yangi SQL yoki dependency kerak emas. Node.js 22.12+, `npm ci`, `npm run dev`. Kirish: `/#atlaslar`. Tekshiruv: `npm test`, `npm run build`, `npm run perf`, `npm run test:e2e:atlases`.

**[Yangilash](UPDATE-7.42.md) · [QA](QA-7.42.md) · [Manbalar](ATLAS-LEARNING-SOURCES-7.42.md)**

---

# SinfQuiz 7.41.0 — Informatika 3D atlasi

**Atlaslar → Informatika atlasi**: kompyuter tarixiga 12 bekatli 3D sayohat, 18 qismli kompyuter anatomiyasi, qismlarga ajratish, RAM / ROM / HDD / SSD farqlari, OS yuklanishi va amaliy mashqlar.

Bosh sahifadagi **Informatika → Kashf qilish** ham yangi atlasga olib boradi. Bevosita: `/#informatika-atlasi`. Atlas mehmon uchun ham ochiq va uning o‘zi Supabase sozlamasisiz ishlaydi. Oldingi Python va Office amaliyoti Mashqlar bo‘limida saqlangan.

8 qadamli yig‘ish mashqi, 4 diagnostika holati, 12 izohli savol, RAM / SSD quvvat tajribasi va 8 bitli sanoq laboratoriyasi mavjud. Natijalar shu brauzerda saqlanadi; JSON eksport bor. Telefon, planshet, tungi ko‘rinish, klaviatura boshqaruvi va WebGLsiz 2D rejim moslashtirilgan.

Yangi SQL, environment yoki dependency talab qilinmaydi. Ishga tushirish: Node.js 22.12+, `npm ci`, `npm run dev`. Tekshiruvlar: `npm test`, `npm run build`, `npm run perf`, `npm run test:e2e:informatics`.

**[Yangilash](UPDATE-7.41.md) · [Tekshiruvlar](QA-7.41.md) · [Manbalar va model cheklovlari](INFORMATIKA-ATLAS-SOURCES.md)**

---

# SinfQuiz 7.40.0 — 5 kuy va balandroq piano

**Mashqlar → Kino Piano → Yangi kuylar** ichiga Belalım, Çalıkuşu, Unutmak İstiyorum (Ufuk Çalışkan), Diet Mountain Dew va Bu Akşam Ölürüm qo‘shildi. Do–Re–Mi darsi, tinglash, tezlikni o‘zgartirish va MIDI yuklab olish darhol ishlaydi. Jami 77 tayyor kuy va 38 mashq bor.

Belalım va Bu Akşam Ölürüm — vokal naqorat; Diet Mountain Dew — naqorat tovushlari, soddalashtirilgan o‘quv ritmi; Çalıkuşu — Esin Engin asosiy mavzusi; Unutmak İstiyorum — ochiq notadagi asosiy takroriy qism. Beshtasi ham notadan tayyorlangan qisqa o‘quv aranjirovka.

**Nahotki shu bo‘lsa sevgi (Alisher Uzoqov) bu versiyaga qo‘shilmadi:** aniq naqorat melodiyasi tasdiqlanmadi. Faqat akorlardan yoki ishonchsiz avtomatik audio tahlilidan haqiqiy kuy deb foydalanilmadi.

Piano chiqishi kuchaytirildi, yangi boshlang‘ich ovoz 90%, Master Gain 1.10×. Oldingi shaxsiy ovoz va mute sozlamalari saqlanadi; kuchaytirish ularga ham tatbiq qilinadi. Kompressor va yumshoq chiqish cheklagichi bor. **Yonlama piano → sozlamalar** orqali ovozni ham boshqaring. Bu Akşam Ölürüm uchun 6/8 metronom urishi moslashtirildi.

**[Yangilash](UPDATE-7.40.md) · [Tekshiruvlar](QA-7.40.md) · [Manbalar](PIANO-SOURCES-7.40.md) · [Fayllar](CHANGED-FILES-7.40.md)**

# SinfQuiz 7.39.0 — 20 yangi kuy va yonlama piano

**Mashqlar → Kino Piano → Yangi kuylar**: Dua Lipa — Training Season’ning aynan naqorati, Çukur, Kara Sevda’dan ikki mavzu, Ezel, Eyşan, Aşk-ı Memnu, Yalı Çapkını, Leyla, Medcezir va 10 ta hindcha kino kuyi. “Ishq va qasos” (Marjaavaan) uchun Tum Hi Aana hamda Thodi Jagah kiritilgan.

20 ta yangi 30 soniyalik o‘ng qo‘l melodiyasi: **5 tasi bepul tayyor MIDI manbasidan, 15 tasi ochiq notadan tayyorlangan o‘quv parcha**. Do–Re–Mi darslari, tinglash, tezlik va MIDI eksport bor. Notadan olingan kuylar o‘quv tempida; uchta hindcha parchada soddalashtirilgan ritm aniq ko‘rsatilgan. Oldingi 52 kuy va 38 mashq saqlangan.

Telefon/planshetda **Yonlama piano** tugmasini bosing. Klavishlar va tutorial keng sahnada joylashadi. Aylantirish tugmasi ko‘rinishni 90° buradi. Brauzer qo‘llasa fullscreen va landscape ishlaydi; qo‘llamasa ilovaning o‘zida aylantirilgan sahna ochiladi. Qadamlar va sozlamalar saqlanadi.

**[O‘rnatish](UPDATE-7.39.md) · [Tekshiruvlar](QA-7.39.md) · [Kuylar va manbalar](PIANO-SOURCES-7.39.md) · [O‘zgargan fayllar](CHANGED-FILES-7.39.md)**

# SinfQuiz 7.38.0 — BLOK3 va Shohruxxon kinolari

**Mashqlar → Kino Piano → BLOK3 va hindcha**: 6 ta BLOK3 qo‘shig‘i va 5 ta hindcha kino melodiyasi qo‘shildi. Kusura Bakma, Git, Sebebi Yar, Napıyosun Mesela, Kırgınım, Kayıp Kalp; “O‘g‘irlanmagan kelin”dan Tujhe Dekha Toh, Kuch Kuch Hota Hai, Main Hoon Na, Baazigar O Baazigar va Yeh Kaali Kaali Aankhen.

Har biri 30 soniyalik **o‘ng qo‘l melodiyasi**: darhol tinglash, Do–Re–Mi bilan yoritib o‘rganish va MIDI eksport. **4 ta parcha tayyor MIDI’dan ajratilgan; 7 tasi notadan tayyorlangan.** BLOK3 uchun bepul tayyor MIDI tasdiqlanmadi. Notadan tayyorlangan parchalar 64 BPM mashq tempida; Tujhe Dekha Toh ritmi soddalashtirilgan. Ularning turi va manbasi trekda ko‘rsatiladi.

**[O‘rnatish](UPDATE-7.38.md) · [Tekshiruvlar](QA-7.38.md) · [11 ta trek va manbalar](PIANO-SOURCES-7.38.md) · [O‘zgargan fayllar](CHANGED-FILES-7.38.md)**

Oldingi 20 ta inglizcha hit “Tayyor hitlar”, Bella Ciao va 20 ta turkcha xalq/mumtoz kuy “Xalq va mumtoz” bo‘limida. 38 ta mashq va shaxsiy MIDIlar mavjud. Yangi to‘plam pianino bilan birga kechiktirib yuklanadi; bosh sahifa uchun yangi musiqa so‘rovi yo‘q.

# SinfQuiz 7.37.0 — zamonaviy hitlar va Do–Re–Mi

**Mashqlar → Kino Piano → Tayyor hitlar**: 20 ta zamonaviy pop qo‘shig‘ining tayyor 30 soniyalik piano parchasi. APT., Espresso, Die With a Smile, Birds of a Feather, Ordinary va boshqalar MIDI yuklamasdan darhol ishlaydi. Bu yangi to‘plam inglizcha hitlardan iborat.

Klavishlar, nota yo‘li va o‘rgatish kartasi **Do–Re–Mi–Fa–Sol–Lya–Si** yozuvida ishlaydi. Joriy nota, kompyuter harfi va keyingi olti qadam ko‘rsatiladi. To‘g‘ri nota yoki akkord chalinmaguncha mashq kutadi. Audio Lab orqali C–D–E yozuviga o‘tish mumkin; ♯ va oktava raqamlari saqlanadi.

**[O‘rnatish](UPDATE-7.37.md) · [Tekshiruvlar](QA-7.37.md) · [20 ta trek va manbalar](PIANO-SOURCES-7.37.md) · [O‘zgargan fayllar](CHANGED-FILES-7.37.md)**

# 7.36.0 — tayyor piano repertuari

20 ta turkcha xalq/mumtoz MIDI melodiyasi qo‘shildi; Bella Ciao bilan 21 ta tayyor kuy. Foydalanuvchidan MIDI ulash yoki obuna talab qilinmaydi. Bu zamonaviy trend hitlar to‘plami emas. Yangi musiqa ma’lumotlari CC BY-NC-SA 4.0 (notijoriy foydalanish); tafsilot: [PIANO-SOURCES-7.36.md](PIANO-SOURCES-7.36.md). [O‘rnatish va yangilash](UPDATE-7.36.md).

# SinfQuiz 7.35.0 — tezroq yuklanish

Boshlang‘ich JavaScript **33.63%**, CSS **15.64%** kichraytirildi. Administrator, o‘quvchi, login, milliy test va jonli mashqlar alohida modullarga ajratildi. Audio Labirint va uning xaritalari zaruratda yuklanadi. Pianino statik nota maydonini qayta ishlatadi; audio ijrosi saqlangan.

**[O‘rnatish va yangilash](UPDATE-7.35.md) · [Tekshiruv va o‘lchovlar](QA-7.35.md) · [O‘zgargan fayllar](CHANGED-FILES-7.35.md)**

Bu to‘liq loyiha. ZIPni ixchamlashtirish uchun qayta yaratiladigan beshta Python runtime fayli arxivda takrorlanmagan: **`npm ci`** ularni avtomatik yaratadi. Build oldidan ham nusxalanadi. Yangi SQL, dependency yoki environment o‘zgarishi kerak emas.

Node.js 22.12+: `npm ci`, `npm test`, `npm run build`, `npm run perf`. Lokal ochish: `npm run dev`.

# SinfQuiz 7.34.0 — Turkcha va trend

**Mashqlar → Kino Piano** endi **Bella Ciao** bilan ochiladi: 30 soniyalik tayyor piano, tinglash va yoritib o‘rganish. **KUSURA BAKMA — BLOK3** va yana 11 ta turkcha qo‘shiq uchun ijrochi, tinglash havolasi va shaxsiy MIDI ulash kartalari qo‘shildi. Ushbu 12 ta zamonaviy qo‘shiqning tayyor notalari kiritilmagan.

**[Yangilash](UPDATE-7.34.md) · [Repertuar va manbalar](PIANO-REPERTOIRE.md) · [Tekshiruvlar](QA-7.34.md) · [O‘zgargan fayllar](CHANGED-FILES-7.34.md)**

7.33.0 dan yangi SQL yoki dependency talab qilinmaydi. Paper Workshop dizayni va mavjud fanlar, rollar hamda Supabase ishlash mantiqi saqlangan.

# SinfQuiz 7.33.0 — Qog‘oz ustaxonasi

SinfQuiz interfeysi Paper Workshop uslubiga o‘tkazildi: tabiiy qog‘oz palitrasi, serif sarlavhalar, olti fan xatcho‘pi va interaktiv **Kashfiyot daftarim**. Kunduzgi va tungi rejim, rollarga mos navigatsiya hamda umumiy kodli qo‘shilish oynasi mavjud.

**[Yangilash va ishlatish](UPDATE-7.33.md) · [Dizayn tizimi](PAPER-WORKSHOP.md) · [Tekshiruvlar](QA-7.33.md) · [O‘zgargan fayllar](CHANGED-FILES-7.33.md)**

7.31.0 / 7.32.0 dan bu yangilanishga o‘tishda yangi SQL yoki npm dependency kerak emas. O‘zingizning `.env.local` qiymatlaringizni saqlang. Node.js 22.12+: `npm ci`, `npm run dev` yoki `npm run build`.

Administrator, ustoz, o‘quvchi va mehmon oqimlari; darslar, atlaslar, musobaqalar, natijalar va Kino Piano shu to‘liq manbada mavjud. Jonli mobil/brauzer QA chegaralari QA hisobotida aniq ko‘rsatilgan.

# SinfQuiz 7.32.0 — Kino Piano

**Mashqlar → Kino Piano**: virtual pianino, yoritib o‘rgatish, avtoijro, MIDI import/eksport va Audio Lab. 32 original mashq va 6 klassik kuy tayyor; 34 kino katalogi shaxsiy MIDI yuklash uchun.

**[Yangilash va ishlatish](UPDATE-7.32.md) · [Tekshiruvlar](QA-7.32.md) · [O‘zgargan fayllar](CHANGED-FILES-7.32.md)**

7.31.0 dan bu yangilanish uchun yangi SQL kerak emas. Amaldagi environment qiymatlarini saqlang.

# Audio Labirint dizayni tiklandi — 7.31.0

Tosh devorli bog‘ sahnasi, yashil daraxtlar, suv yo‘llari, yuqoridagi taymer va maydon ostidagi oq-ko‘k javob paneli qaytarildi. **[Yangilash va ishga tushirish](UPDATE-LABIRINT.md) · [Tekshiruvlar](QA-LABIRINT.md)**

# Yangilash: 7.30.0

Koinot atlasi uchun [UPDATE-7.30.md](UPDATE-7.30.md)ni o‘qing. 7.29 dan: `supabase-office-amaliy-fix.sql`, keyin `supabase-migration-7.30.sql`. Mavjud login va environment qiymatlari saqlanadi. To‘liq ketma-ketlik `migration-chain.json`da.

# SinfQuiz 7.29.0

To‘lmagan jamoa bilan boshlash, har ishtirokchi uchun erkin bosqichlar va alohida taymerlar, serverda qoralamadan qisman baholash. Klaviatura — 12, Word — 12, Excel — 10 ta yangi savol. Sinfxona doskasi, katta namoyish va boshqa fanlar saqlangan. **[Yangilash](UPDATE-7.29.md) · [SQL tartibi](MIGRATIONS.md) · [Tekshiruvlar](QA-7.29.md) · [Savollar](CONTENT-7.29.md)**

## Avvalgi Science Studio imkoniyatlari

7.26.1 Studio dizayni asosida kimyo va biologiya darslari, 3D sahnalar, jonli grafik va tajriba daftarini birlashtirgan yangilanish. Bu tarmoq avvalgi Informatika, Ingliz tili, Matematika, testlar, typing va musobaqa oqimlarini saqlaydi.

**[Yangilash tartibi](UPDATE-7.26.2.md) · [Tekshiruvlar](QA-7.26.2.md) · [Ilmiy hisob va modellar](SCIENCE-STUDIO-7.26.2.md) · [O‘zgargan fayllar](CHANGED-FILES-7.26.2.md)**

## Ishga tushirish

ZIP ichidagi `sinf-quiz` papkasini VS Code’da oching. Amaldagi loyihangizning `.env.local` faylini saqlang; yangi loyiha uchun `.env.example`ni nusxalab o‘z qiymatlaringizni kiriting.

**Ishlayotgan 7.28 bazasidan o‘tayotgan bo‘lsangiz:** Supabase SQL Editor’da `supabase-migration-7.29.sql` faylini to‘liq RUN qiling. 7.27 bazasi uchun avval 7.28, so‘ng 7.29 qo‘llanadi. Yangi Supabase loyiha uchun barcha 49 faylning tekshirilgan tartibi `MIGRATIONS.md` va `migration-chain.json`da. Oxirgi migratsiya — 7.29.

Node.js 22.12 yoki undan yangi versiyada:

```powershell
npm ci
npm run dev
```

Production:

```powershell
npm test
npm run build
```

Vercel: Vite, build `npm run build`, chiqish katalogi `dist`. Production muhitiga `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` kiriting va yangi kodni qayta deploy qiling. Server kalitlari va Telegram bot tokenining nomiga `VITE_` qo‘shilmaydi.

## Kimyo va biologiya

- Kimyo: 12 atlas mavzusi, 13 boshqariladigan laboratoriya shabloni, erkin tajriba stoli va 12 amaliy ish. Modda, jihoz, miqdor, konsentratsiya, harorat va vaqt natijaga ta’sir qiladi.
- Biologiya: 30 tushuncha, 24 turdagi sahna, 12 amaliy ish; barg–tuproq–ildiz, o‘simlik, hayvonlar va interaktiv anatomiya.
- Har mavzuga qisqa dars va bilimni tekshirish biriktirilgan. Grafiklar aynan sahnadagi modeldan hisoblanadi; CSV, sharoitlarni taqqoslash va tiklash ishlaydi.
- Biologiyada pauzadagi bosqich, parametrlar va daftar shu hisob/mavzu bo‘yicha qayta ochiladi.
- Tayyor biologiya modellarining litsenziyalari `MODEL-SOURCES.md` va `public/biology/v7.21/manifest.json`da. Yengil 3D va ishlaydigan 2D muqobil saqlangan.

## Kirish va natijalar

Darslar va atlaslar mavjud o‘quvchi kabineti orqali ochiladi. Ustoz o‘z ishlarini boshqaradi, o‘quvchi kuzatuvini ko‘radi va fikr beradi. Ommaviy ustoz nusxalari uchun mavjud admin tasdiqlashi va RLS cheklovlari saqlangan.

6 xonali kodli test, typing va 1v1 uchun email/Telegram hisobini yaratish shart emas. Mehmon kirishi uchun Supabase Anonymous Sign-Ins yoqilgan bo‘lsin. 6 xonali testning ball/taymeri va 1v1 javob/g‘olibi endi serverda hisoblanadi. Migratsiyadan oldingi aktiv test/poygaga kod bilan qayta kiriladi; yakuniy natijalar yo‘qolmaydi.

Telegram va admin parol APIlari `npm run dev` orqali lokalda ham ishlaydi. Telegram imzosi haqiqiy bot tokeni bilan tekshiriladi; server kaliti `SUPABASE_SECRET_KEY` yoki `SUPABASE_SERVICE_ROLE_KEY` bo‘lishi mumkin.

## Brauzer tekshiruvi

Playwright va Chromium o‘rnatilgach:

```powershell
npx playwright install chromium
npm run test:e2e:science
npm run test:e2e:play
npm run test:e2e:studio
npm run test:e2e:learning
npm run test:e2e:competition
```

Sinovlarda transport/Auth fixture ishlatilgan joylar QA hujjatida alohida ko‘rsatilgan. Production Supabase va Vercel bilan o‘z loyihangizda tekshirish kerak.

Bu virtual ta’lim modeli: murakkab tabiiy jarayonlarning qaysi jihatlari soddalashtirilgani sahnaning o‘zida ko‘rsatiladi. Anatomiya tashxis vositasi emas. Tarixiy reliz hujjatlari paketda saqlangan; ushbu yangilanish uchun `UPDATE-7.28.md`ni kuzating.
