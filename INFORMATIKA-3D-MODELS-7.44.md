# Informatika 3D modellari — 7.44.0

Tekshiruv sanasi: 2026-10-30. Mashina o‘qiydigan to‘liq ro‘yxat: [apparat modellari](public/informatics/v7.44/SOURCES.json), [tarixiy ko‘ruvchilar](public/informatics/v7.44/history/SOURCES.json). Ular asl manba, muallif, litsenziya, o‘zgarishlar, fayl hajmi va SHA-256 qiymatlarini saqlaydi. GLB ichida ham mualliflik va litsenziya ma’lumoti bor.

## Mahalliy apparat modellari

| Qism | Asl model / muallif | Tayyorlash |
| --- | --- | --- |
| Korpus | Fractal Meshify C · MUSHROOM_BUILDS | Tayyor teksturali GLB |
| Ona plata | ASUS Strix B550-F · MUSHROOM_BUILDS | Tayyor teksturali GLB |
| CPU | AMD Ryzen 5 3600 · Fochdog | Tayyor GLB |
| Sovutgich | AMD Wraith Stealth · PolyDavid | Tayyor GLB |
| RAM | Corsair VENGEANCE RGB PRO · Nouraiz | Tayyor GLB; yig‘mada ikki modul |
| ROM / UEFI chipi | SOIC-8 paketi · KiCad | STEP CAD → GLB |
| HDD | WD Green 1 TB · MajdyModels | Tayyor teksturali GLB |
| SATA SSD | SATA SSD · MarkCP | Tayyor GLB |
| NVMe SSD | Samsung 990 Pro · lime.ball.animations | Tayyor teksturali GLB |
| Videokarta | RTX 3080 Founders Edition · _surovic_ | Tayyor teksturali GLB |
| Quvvat bloki | Power supply · Groovex | Tayyor teksturali GLB |
| Chipset | B550-F · MUSHROOM_BUILDS | Ona plataning nomlangan geometriyasi |
| CMOS batareyasi | Keystone 1060 CR2032 tutqichi · KiCad | STEP CAD → GLB; batareya tanasi original qo‘shimcha |
| SATA portlari | B550-F · MUSHROOM_BUILDS | Ona plataning tegishli port sohasi |
| PCIe sloti | B550-F · MUSHROOM_BUILDS | Ona plataning uzun PCIe ulagichi sohasi |
| Orqa portlar | B550-F · MUSHROOM_BUILDS | Ona plataning tegishli geometriyasi |
| Ventilyator | 120 mm fan · kusuma844 | Tayyor GLB; yig‘mada ikki nusxa |
| Kabellar | ATX ulagichi va 24 sim · SinfQuiz | Original GLB |

11 tayyor muallif modeli, 4 ta shu modellar asosidagi fragment, 2 CAD aktiv va 1 original model — 18 ta GLB. Ikkinchi RAM va ventilyator sahnada nusxalanadi; ular alohida yuklanadigan fayllar deb sanalmaydi. PCIe uchun M.2 radiatori yoki SATA uchun keng SAS ulagichi ishlatilmagan.

Muallif yaratgan modellar va ona plata fragmentlari **CC BY 4.0** ostida; KiCad paketlari **CC BY-SA 4.0** va KiCad litsenziya istisnosi bilan tarqatiladi. KiCad asl litsenziyasi va STEP mualliflik sarlavhalari `public/informatics/v7.44/LICENSES/`da saqlangan. Kabel aktivining huquqlari loyiha egasida qoladi. Asl model sahifalari har qismning atlasdagi manba panelida mavjud.

GLB asl nusxalari ochiq GitHub repozitoriylarining aniq commitlaridan olindi; asar muallifi va litsenziyasi asl Sketchfab metadata manbasi bilan tekshirildi. Ko‘chirilgan tashqi loyiha kodi ishlatilmagan. Manifestdagi `downloadSource`, `commit` va `rawSha256` olingan nusxani qayta tekshirish imkonini beradi.

## Modelning aniqligi

Geometriya yengillashtirildi, teksturalar 1024 px gacha WebPga o‘tkazildi, Meshopt siqishi qo‘llandi. O‘lcham va yo‘nalish moslashtirildi; sahnada 1 birlik 100 mm. CPU 40 mm, RAM 133 mm, NVMe 80 mm kabi o‘lchamlar va plataning 305 mm PCB uzunligi testda tekshiriladi.

Bu turli mualliflar modellaridan tuzilgan **ta’limiy ATX yig‘ma**. U har vint va simning muhandislik yig‘ish chizmasi yoki komponent mosligini tasdiqlovchi konfigurator emas. ROM modeli chip qobig‘ini ko‘rsatadi; uning ichki tranzistor sxemasini ifodalamaydi. Chipset va portlar fragmenti alohida ko‘rish uchun kattalashtiriladi. Ularning sahnada ajralishi platadan amalda yechish mumkinligini bildirmaydi.

## Tarixiy ko‘ruvchilar

| Bekat | Model muallifi | Aniqlashtirish |
| --- | --- | --- |
| Cho‘t | pamruta | Zamonaviy o‘quv cho‘ti; qadimiy eksponat skani emas |
| Pascaline | Museu do Computador | Mexanik hisoblagichning tashqi modeli |
| Babbage analitik mashinasi | Paolo Mercogliano | Chizmalar asosidagi ishlamaydigan rekonstruksiya |
| UNIVAC | sudreyskr | Muallif yaratgan kompyuter modeli |
| IBM 1401 | Breno Valli · Museu do Computador | Markaziy blok modeli |
| Intel 4004 | Museu do Computador | Mikroprotsessorning tashqi modeli |
| IBM PC oilasi | denisstephane | Asl sarlavhadagi XT/5150 aralash nomi tarixiy fakt sifatida takrorlanmaydi |

Bu 7 model **internet orqali Sketchfab iframe**da ochiladi; ularning geometriyasi ZIPga ko‘chirilmagan. Mahalliy posterlar asl model ko‘rinishidan olingan, muallif/litsenziya/havola bilan berilgan. Har biri CC BY 4.0 metadata manbasi bilan tekshirilgan. Ular tarixiy qurilmalarning hisoblash jarayonini emulyatsiya qilmaydi; amaliy mashqlar SinfQuiz panelida ishlaydi.

ENIAC nomi bilan chiqqan, lekin boshqa personaj yoki fantastik buyum tasvirlangan modellar qo‘shilmadi. ENIAC, Z3, Colossus va qolgan bekatlarda oldingi original o‘quv xonalari saqlangan; ularga tashqi skan degan belgi berilmaydi. ENIAC manbalari: [INFORMATIKA-ATLAS-SOURCES.md](INFORMATIKA-ATLAS-SOURCES.md), [ATLAS-REALITY-SOURCES-7.43.md](ATLAS-REALITY-SOURCES-7.43.md).

## Qayta tayyorlash

Tayyor GLB fayllar ZIPda bor; foydalanuvchi ularni qayta qurishi shart emas. Ixtiyoriy xom manbalarni olish:

```bash
node scripts/fetch-informatics-sources-744.mjs /absolute/path/raw-models
```

Bu buyruq manifestdagi aniq commit fayllarini oladi va har birining SHA-256 qiymatini tekshiradi. O‘zgargan manbani avtomatik qabul qilmaydi. Alohida yordamchi papkada `@gltf-transform/core`, `@gltf-transform/functions`, `@gltf-transform/extensions`, `meshoptimizer`, `sharp` va `occt-import-js` o‘rnatilgach:

```bash
node scripts/build-informatics-assets-744.mjs /absolute/path/raw-models /absolute/path/tools/node_modules
```

Yordamchi paketlar ilovaning runtime dependency ro‘yxatiga qo‘shilmagan. Oddiy `npm ci` va build tayyor aktivlardan foydalanadi. Tayyorlash natijasini o‘zgartirsangiz, hashlar, litsenziya yozuvlari va testlarni ham qayta tekshiring.
