# SinfQuiz 7.41.0 — Informatika 3D atlasi

## Ochish

**Atlaslar → Informatika atlasi** yoki bosh sahifadagi **Informatika → Kashf qilish**.

Bevosita manzil: `/#informatika-atlasi`. Atlas mehmon uchun ham ochiq. Ushbu bo‘limning o‘zi Supabase sozlamasisiz ishlaydi; qolgan bo‘limlar avvalgi Supabase sozlamalaridan foydalanadi. Sozlash sahifasiga atlasni ochish tugmasi ham qo‘shildi. Oldingi `#informatika` manzili Python va Office amaliyoti uchun saqlandi.

## 1. Vaqt muzeyi

12 bekat: qadimgi hisoblash vositalari, Paskal hisoblagichi, Bebbij va Lavleys, Z3, Colossus, ENIAC, Manchester Baby, UNIVAC I, IBM 1401, Intel 4004, IBM PC va zamonaviy kompyuter.

Qo‘shni eksponatlari ko‘rinadigan 3D zal, oldinga-orqaga yurish, avtomatik sayohat, aylantirish, yaqinlashtirish va keng ekran mavjud. Har bir bekatda tarix, texnologiya, asosiy kashfiyot va muzey/ishlab chiqaruvchi manbasi berilgan. “Birinchi” so‘zining turli mezonlari tushuntiriladi. Bebbijning Analitik mashinasi hayotligida to‘liq qurilmagani hamda Colossus maxsus maqsadli bo‘lgani ochiq aytiladi.

## 2. Kompyuter ichida

18 tanlanadigan qism: korpus, ona plata, CPU, CPU sovitgichi, RAM, ROM / UEFI flash, HDD, SATA SSD, M.2 NVMe SSD, GPU, PSU, chipset, RTC/CMOS batareyasi, SATA portlari, PCIe sloti, orqa portlar, korpus ventilyatori va kabellar.

0–100% ajratish boshqaruvi, korpusni ochish/yopish, raqamlarni yoqish/o‘chirish va to‘rtta kamera burchagi bor. Qismdan yoki katalogdan tanlang, keyin **Yaqindan ko‘rish**ni bosing. CPU sovitgich ostida; qismlar ajratilganda ochiladi. Har bir qism uchun joylashuv, vazifa, ulanish va keng tarqalgan xato tushunchalar tushuntirilgan.

RAM, ROM, HDD, SATA SSD va NVMe SSD taqqoslash jadvali bor. M.2 shakli bilan NVMe protokoli, ROM bilan fayl diski, RTC batareyasi bilan asosiy quvvat farqlanadi.

## 3. OS va ma’lumot

Olti bosqichli yuklanish modeli: PSU → UEFI/BIOS → POST → yuklagich → OS yadrosi → ish muhiti. Windows, Linux va macOS nomlari bilan soddalashtirilgan namoyish bor; haqiqiy OS ishga tushirilmaydi.

Ikki tajriba: RAMdagi matnni SSDga saqlash va model quvvatini uzish; sakkiz bitni almashtirib 0–255 qiymat va bosiladigan ASCII belgilarini ko‘rish. Tashqi qurilmalar, hardware, firmware, OS, ilova va drayver tushunchalari ham berilgan.

## 4. Amaliy ishlar

- Sakkiz qadamda qismlarni kerakli joyga moslab kompyuter yig‘ish.
- To‘rtta holat bo‘yicha ehtimoliy nosoz qismni topish.
- 12 ta izohli savol va qayta mashq qilish.
- 50 bosqichli o‘rganish ko‘rsatkichi: 12 tarix + 18 qism + 8 yig‘ish + 12 to‘g‘ri javob.
- Natijani JSON fayl sifatida yuklab olish.

## Saqlash, telefon va moslik

Natija shu brauzerda, hisob identifikatoriga mos kalitda saqlanadi. Mehmon va turli hisoblar ajratilgan. Boshqa qurilmaga avtomatik sinxronlanmaydi. Xotira bloklangan bo‘lsa ogohlantirish va natijani yuklab olish mavjud. Ovoz/rang boshqaruvining localStorage himoyasi ham yaxshilandi.

Telefon, planshet, keng ekran va tungi ko‘rinish moslashtirildi. Kamaytirilgan harakat sozlamasi hurmat qilinadi. WebGL ishlamasa 2D sxema va o‘quv materiallari ochiladi; darslar 3Dga bog‘lanib qolmaydi.

Yangi SQL yoki environment o‘zgarishi, yangi dastur dependency talab qilinmaydi. `three` avvaldan bor edi. Atlas va 3D sahna alohida kechiktirib yuklanadi. Python va Office amaliyoti, piano va qolgan bo‘limlar saqlangan.

## Ishga tushirish

Node.js 22.12 yoki yangi versiya:

```sh
npm ci
npm run dev
```

So‘ng lokal manzil oxiriga `/#informatika-atlasi` qo‘shing. `npm ci` Python runtime fayllarini ham avtomatik tayyorlaydi.

```sh
npm test
npm run build
npm run perf
npx playwright install chromium
npm run test:e2e:informatics
```

Brauzer testida odatiy Playwright Chromium ishlatiladi; maxsus muhit uchun `CHROMIUM_PATH` va `QA_ARTIFACT_DIR` berish mumkin. Manbalar va model cheklovlari: [INFORMATIKA-ATLAS-SOURCES.md](INFORMATIKA-ATLAS-SOURCES.md).
