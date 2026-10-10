# Kimyo va biologiya — Studio 7.26.2

## Dars va tajriba oqimi

Atlas mavzusi endi qisqa dars, tekshiriladigan misol va haqiqiy parametrlar bilan bitta sahifada ishlaydi. Noto‘g‘ri javobdan keyin tegishli chalkashlik tushuntiriladi; batafsil yechim o‘quvchi xohlasa ochiladi. Tayyor izohlar o‘zbekcha va dars sahnalarida emoji yo‘q.

Kimyoda 12 atlas tushunchasi, 13 boshqariladigan mavzuli laboratoriya shabloni hamda moddalarni o‘zi tanlaydigan stolda 12 amaliy ish mavjud. Erkin rejim, bosqichli qo‘llanma, jihoz, reagent, miqdor, konsentratsiya, aralashtirish, harorat, vaqt, filtrlash va bug‘latish boshqaruvlari saqlangan. Har bir amaliy ish tegishli qisqa dars bilan bog‘landi.

Biologiyada 30 tushuncha, 24 turdagi sahna va 12 yakunlanadigan amaliy ish mavjud. Barg → parchalovchilar → tuproq → ildiz jarayonida namlik, harorat, kislorod, tuproq, yomg‘ir va barg massasi natijaga ta’sir qiladi. Odam tanasida tayyor organ, skelet, mushak va o‘pka modellaridan foydalaniladi. Boshlash tugmasi taxmin hali yozilmaganida ham faol; yakuniy ish uchun taxmin, kuzatish, xulosa va talab qilingan mustaqil sinovlar kerak.

## Yangi kuzatuv vositalari

- Grafik uchun 31 nuqta sahnada ishlaydigan **o‘sha hisob modeli** orqali olinadi. Chiziq bezak sifatida chizilmagan.
- Grafik o‘lchovini tanlash, joriy bosqich nuqtasi va CSV yuklash ishlaydi.
- Biologiyada oldingi sharoit aynan joriy bosqichda qayta hisoblanib taqqoslanadi. Barcha sinovlarning yakuniy natijasi alohida jadvalda qoladi.
- Kimyoda bir namunaning modda, miqdor, qo‘shish vaqti va boshqa parametrlari taqqoslashga yoziladi. Bir necha omil o‘zgargan bo‘lsa, buni ajratib ko‘rsatadigan izoh beriladi.
- Oldingi sharoitni tiklash va qayta sinash ishlaydi.
- Biologik qoralama hisob va mavzu bo‘yicha ajratilgan. Izohlar bilan birga sharoit va pauzadagi bosqich tiklanadi. Yangilangan yoki yaroqsiz parametr qoralamasi tajribani buzmaydi.

## Ilmiy hisoblarda tuzatishlar

1. Tuz va shakar har bir qo‘shilgan porsiyaning vaqti bo‘yicha eriydi. Keyinroq tuz qo‘shish avvalgi erigan miqdorni nolgacha tushirib yubormaydi.
2. Elektr o‘tkazuvchanligining **nisbiy** modeli ionlar konsentratsiyasiga bog‘liq: sof suv qo‘shilganda indeks kamayadi. Bu S/m birlikdagi o‘lchov yoki zaif kislotalarning to‘liq modeli emas.
3. CO₂ uchun cheklovchi reagentga mos maksimal hajm alohida ko‘rinadi. Hosil bo‘lish tezligi bilan umumiy stoixiometrik miqdor ajratilgan; sovun yangi CO₂ hosil qilmaydi.
4. Barg modelida mineral azotning yuvilishi yomg‘ir va tuproqdan pastga o‘tgan suvga bog‘landi. Yomg‘ir yo‘q holatda ushbu yo‘l nol. Uglerod va azot balansi saqlanadi.
5. pH neytrallanish, kuchsiz kislota muvozanati, atom tarkibi, fotosintez tenglamasi va anatomik yo‘llar oldingi ilmiy tekshiruvlar bilan birga qayta sinovdan o‘tkaziladi.

## 3D va ishlash tezligi

Tayyor GLB va teksturalar lokal `public/biology/v7.21/` katalogida. Barg–tuproq sahnasidagi keskin shaklli o‘simlik o‘rniga paketdagi Poly Haven o‘simligi ishlatiladi. Mualliflar, manbalar, litsenziyalar va SHA-256 qiymatlari manifestda saqlangan. Mavjud aktivlar qayta yuklab olinmagan yoki almashtirilmagan.

Kimyo stoli shisha idish, modda sathi, zarrachalar, gaz, ko‘pik, cho‘kma va boshqa hisobdan keladigan effektlar bilan ishlaydi. Bu modellar SinfQuiz uchun Three.js geometriyasida yaratilgan; tashqi laboratoriya modelidan ko‘chirilmagan.

Grafik egri chizig‘i har animatsiya kadrida qayta hisoblanmaydi; sharoit o‘zgarganda yangilanadi. 3D chizish yashirin sahifa va ekrandan tashqarida to‘xtaydi. Zaif qurilmalarda piksel zichligi va geometriya soddalashtiriladi. 3D ochilmasa, ishlaydigan 2D model va bir xil hisob/boshqaruvlar qoladi. Yangi bo‘limlar talab bo‘yicha yuklanadi; mavjud Informatika, Ingliz tili va Matematika sahnalari saqlangan.

## Model chegarasi

Bu ta’limiy simulyatsiya. Reagent sarfi va atomlar saqlanishi aniq stoixiometrik hisob, lekin ko‘pik, zang tezligi, suv oqimi, organizm o‘sishi va ekotizim indekslari dalada kalibrlangan bashorat emas. Vaqt tezlashtirilgan, zarrachalar masshtabi shartli. Virtual laboratoriya haqiqiy xavfli tajribani mustaqil takrorlash yo‘riqnomasi emas; anatomiya tashxis vositasi emas.

## Ilmiy tekshiruv manbalari

Quyidagi manbalar fakt va jarayonlarni tekshirish uchun o‘qildi. Ushbu yangilanish ulardan dars matni, rasm yoki 3D aktiv ko‘chirmaydi; yangi izohlar original.

- [OpenStax Chemistry 2e — 4.2: Classifying Chemical Reactions](https://openstax.org/books/chemistry-2e/pages/4-2-classifying-chemical-reactions): atomlar saqlanishi, cho‘kma va neytrallanish.
- [OpenStax Chemistry 2e — 14.7: Acid-Base Titrations](https://openstax.org/books/chemistry-2e/pages/14-7-acid-base-titrations): kuchli va kuchsiz kislota farqi, ekvivalent nuqtadagi pH.
- [OpenStax Biology 2e — 8.1: Overview of Photosynthesis](https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis): umumiy fotosintez va kislorod manbasi.
- [OpenStax Biology 2e — 46.3: Biogeochemical Cycles](https://openstax.org/books/biology-2e/pages/46-3-biogeochemical-cycles): organik qoldiq, moddalarning aylanishi va yuvilish.

Muvofiqlik yoki xalqaro sertifikatlanganlik haqida da’vo qo‘yilmagan. Tayyor modellar huquqlari uchun avvalgi `MODEL-SOURCES.md` va biologiya manifestiga qarang.
