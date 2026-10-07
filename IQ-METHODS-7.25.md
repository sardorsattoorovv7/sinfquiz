# IQ va mantiq — tuzilma, baholash va ilmiy talqin

## Maqsad va chegaralar

SinfQuiz topshiriqlari maktab o‘quvchisiga umumiy fikrlash qoidalarini mashq qilish va yechimni tushunish uchun yaratilgan. Mantiqiy fikrlash aqliy qobiliyatning barcha tomonlarini qamramaydi. Tilni tushunish, ko‘rish, avvalgi tajriba va boshqaruv vositasi ham bajarishga ta’sir qilishi mumkin. Natija bolaga tashxis qo‘yish, saralash yoki muhim ta’lim qarorini yakka holda chiqarish uchun mo‘ljallanmagan.

Topiq.uzning ochiq bosh sahifasidagi namuna → test → natija oqimi ko‘rib chiqildi. Uning savollari, normativ jadvallari, brendi, rasmlari yoki dizayni ko‘chirilmadi. SinfQuiz barcha topshiriq va SVG modellarini o‘z kodida yaratadi. Raven, WAIS, ICAR va boshqa testlardan savol olinmagan. Yangi tashqi aktiv yoki litsenziyalangan savol banki yo‘q.

## Hozirgi test spetsifikatsiyasi

| Qism | Amalga oshirilgan qoida |
|---|---|
| Savol banki | 144 noyob topshiriq; bir xil ko‘rinish takrorlari testda rad etiladi |
| Bosqich | 3 ta muallif tavsiya qilgan murakkablik bosqichi; har biri 48 savol |
| Shakllar | Qator yig‘indisi, shakllar ketma-ketligi va XOR kataklari |
| Sonlar | Arifmetik, geometrik va ikkinchi farq ketma-ketliklari |
| Mantiq | Faraziy to‘plam, tartib va qarama-qarshi mantiqiy xulosa |
| Fazoviy fikrlash | Tekis shaklni burish, akslantirish va yo‘nalish o‘zgarishi |
| Bir urinish | Har yo‘nalishdan 8 tadan, jami 32 savol |
| Javob | 4 variant, bitta aniq kalit; bir necha oynada revision nazorati |
| Vaqt | 24 yoki 48 daqiqa; serverning yakunlash muddati |
| Ball | To‘g‘ri 1; xato va bo‘sh 0; tezlik bonusi va manfiy ball yo‘q |
| Hisobot | x/32, 100×x/32 foiz va to‘rtta x/8 profil |
| O‘rganish | 12 alohida vaqtsiz namuna; izoh va keyingi mashq |

Foiz aholi orasidagi o‘rinni bildirmaydi. Server tasodifiy variantlarni bir xil yo‘nalish soni bilan tuzadi, ammo bu variantlarning psixometrik tengligini isbotlamaydi. Savollar bir necha generativ oiladan kelgani uchun javoblar o‘zaro bog‘liq bo‘lishi mumkin. Takroriy mashq tajribasi natijani o‘zgartiradi. Vaqt rejimlari alohida qayd etiladi.

## Tekshirilgan tavsiyalar

AERA/APA/NCME hujjatidagi talqin uchun dalil, aniq baholash va me’yorlash tamoyillari; ITC hujjatidagi testdan foydalanish maqsadi, moslik va natijani izohlash tamoyillari loyiha qarorlarini solishtirish uchun o‘qildi. Shu sabab ballning ma’nosi, vaqt rejimi va foydalanish chegarasi interfeysda ochiq yoziladi. Bu hujjatlarni o‘qishning o‘zi testni tasdiqlamaydi.

- [Standards for Educational and Psychological Testing, 2014](https://www.testingstandards.net/uploads/7/6/6/4/76643089/9780935302356.pdf): 1, 2, 3 va 5-boblar; ayniqsa 5.8–5.12 me’yorlash va solishtirish dalillari.
- [International Test Commission — Guidelines on Test Use](https://www.intestcom.org/files/guideline_test_use.pdf).
- [Topiq.uz](https://topiq.uz/): faqat mahsulot oqimi namunasi, ilmiy validatsiya dalili sifatida ishlatilmadi.

Hech qanday «xalqaro sertifikatlangan», «klinik IQ» yoki validatsiyalangan testga tenglik da’vosi berilmaydi.

## Haqiqiy normativ IQ uchun bajarilishi kerak bo‘lgan ish

Mustaqil psixometrist bilan o‘zbekcha topshiriqlar va ko‘zlangan qobiliyat modelini tekshirish; turli yosh, ta’lim va til guruhlarida pilot sinov; savol qiyinligi, ajratish qobiliyati, oilalar o‘rtasidagi bog‘liqlik va guruh tarafkashligini tahlil qilish; ishonchlilik, qayta sinash va o‘lchash xatosini baholash; vakillik qiladigan yosh me’yorlari va variantlar tengligini alohida tekshirish zarur. Faqat shunday dalil va foydalanish huquqi mavjud bo‘lgach tegishli IQ shkalasi hamda ishonch oralig‘i qo‘shiladi. Bu relizda ushbu tadqiqotlar o‘tkazilmagan.

## Texnik aniqlik va maxfiylik

Kalitlar private jadvalda saqlanadi; frontend faqat tanlangan topshiriq, variant va vizual modelni oladi. Muallif kodidagi 144 savol banki production bundle’ga import qilinmaydi. Server yakunlagach o‘quvchi faqat o‘z urinishining yechimlarini ko‘radi. Server scoring mijoz yuborgan ballni e’tiborga olmaydi. Bir tokenni takror yuborish ikkinchi yozuv yaratmaydi; muddati o‘tgan javob hisobga olinmaydi.

To‘g‘ridan-to‘g‘ri jadval hamda ichki scoring funksiyalariga authenticated/anon kirish yopiq. O‘qituvchi guruh a’zoligi orqali ruxsat oladi, admin boshqaradi. Bitta foydalanuvchi kuniga ko‘pi bilan 12 yangi urinish ochadi, har urinishda 512 javob o‘zgartirish chegarasi bor. Bu cheklovlar psixometrik standart emas; operatsion yukni chegaralaydi.

Hisoblar, variantlar va real SQLdagi ruxsat tekshiruvlari avtomatlashtirilgan. Ushbu texnik tekshiruvlar testning psixometrik ishonchliligi yoki normativ IQ haqiqiyligini tekshirish o‘rnini bosmaydi.
