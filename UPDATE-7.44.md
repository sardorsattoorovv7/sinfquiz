# SinfQuiz 7.44.0 — Informatika uchun tayyor 3D modellar

## Nimalar qo‘shildi

**Atlaslar → Informatika atlasi → Kompyuter ichida** bo‘limi tayyor, teksturali GLB modellar bilan ochiladi. Korpus, ona plata, CPU, sovutgich, RAM, ROM/UEFI chipi, HDD, SATA SSD, NVMe SSD, videokarta, quvvat bloki, chipset, CMOS batareyasi, SATA portlari, PCIe sloti, orqa portlar, ventilyator va kabellar — jami **18 qism**.

11 ta qism mualliflarning tayyor modellaridan, 4 tasi ona plata modelining tegishli geometriyasidan, 2 tasi KiCad CAD paketlaridan tayyorlangan. Kabel modeli loyiha uchun yaratilgan. Bular muallif yaratgan 3D/CAD modellar; barchasi fotogrammetrik skan deb taqdim qilinmaydi.

## Qanday foydalaniladi

1. **Kompyuter ichida** bo‘limini oching va `18 ta GLB yuklandi` yozuvini kuting.
2. Qismni yon ro‘yxatdan tanlang yoki pastdagi **Har bir qismni alohida ko‘ring** kartasini bosing. **Alohida 3D model** va **Faqat tanlangan qism** orqali uni kattalashtiring.
3. Sichqoncha yoki barmoq bilan aylantiring. Kamera, yaqinlashtirish va keng ekran boshqaruvlaridan foydalaning.
4. **Qismlarga ajratish** bilan joylashuvni ko‘ring. **Ichki qismlar ko‘rinsin** korpusni shaffof qiladi. Plataga birikkan port va chipset fragmentlarining ajratilishi o‘quv ko‘rinishi; bu ularni amalda yechib olish yo‘riqnomasi emas.
5. Qism izohidagi **Tayyor 3D model va manbasi**ni oching: muallif, litsenziya, asl manba va GLB yuklab olish havolasi bor.
6. Soddalashtirilgan izoh uchun **Izohli 3D sxema**ni tanlang. WebGL ochilmasa, 2D sxema va darslar ishlaydi. Model yuklanishi uzilsa, qayta urinish tugmasi mavjud.

Modellar saytning o‘z fayllari bilan tarqatiladi; apparat qismlari uchun Sketchfab hisobi yoki tashqi viewer kerak emas. Birinchi ochishda taxminan 13 MB GLB yuklanadi; shu tashrifdagi takroriy ko‘rishda fayllar qayta olinmaydi.

## Tarixiy modellar

**Vaqt muzeyi**dagi 7 bekatda **Tayyor tarixiy 3D model** rejimi qo‘shildi: cho‘t namunasi, Pascaline, Babbage analitik mashinasi, UNIVAC, IBM 1401, Intel 4004 va IBM PC oilasi. **Tayyor tarixiy modelni ochish** tashqi Sketchfab ko‘ruvchisini foydalanuvchi bosgandan keyin yuklaydi; internet kerak. Asl model va muallif havolalari bor. Oldingi xonadagi amaliy panel shu yerda ishlaydi.

**ENIAC** uchun tekshirilgan, qayta foydalanishga ruxsatli tashqi model tasdiqlanmadi. Avvalgi 40 panelli xona, ichkarida yurish, ulash va hisoblash mashqlari arxiv ma’lumotlariga asoslangan o‘quv rekonstruksiyasi sifatida saqlangan. Bu asl ENIACning skani yoki to‘liq emulyatori emas. Babbage modeli ham chizmalar asosidagi ishlamaydigan rekonstruksiya; cho‘t modeli zamonaviy o‘quv namunasi sifatida belgilangan.

## O‘rnatish

Node.js **22.12+**:

```bash
npm ci
npm run dev
```

Bevosita kirish: `/#informatika-atlasi`. Oldingi `.env.local` qiymatlaringizni saqlang. Bu versiyaga yangi SQL migratsiyasi yoki npm dependency kerak emas. ZIPdagi beshta qayta yaratiladigan Python runtime fayli `npm ci` va build oldidan avtomatik tiklanadi.

Tekshirish:

```bash
npm test
npm run build
npm run perf
npm run test:e2e:informatics-models
npm run test:e2e:informatics
npm run test:e2e:atlases
```

Brauzer testlari Playwright Chromium o‘rnatilishini talab qiladi; tashqi Chromium uchun `CHROMIUM_PATH` qo‘llanadi. Tafsilotlar: [QA-7.44.md](QA-7.44.md), [modellar va manbalar](INFORMATIKA-3D-MODELS-7.44.md).

GitHubga push yoki ishlayotgan saytga deploy bu ZIP tayyorlashda bajarilmadi.
