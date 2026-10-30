# QA — SinfQuiz 7.44.0

Sana: 2026-10-30.

## Avtomatik testlar

`npm test`: **339 test, 339 o‘tdi, 0 xato**. Oldingi 333 test va 6 ta yangi aktiv testi.

Yangi testlar 18 GLBning formati, yaxlitligi, SHA-256 qiymati, ichki resurslari, mualliflik yozuvi, o‘lchamlari va litsenziya manbalarini tekshiradi. Ona plataning 305 mm PCB o‘lchami, CPU/RAM/NVMe o‘lchamlari, haqiqiy PCIe/SATA ulagich sohalari tekshirilgan. Mahalliy aktiv havolalari, 7 tarixiy model metadatasi va poster hashlari, iframe manzillari hamda CSP cheklovi tekshiriladi. ENIAC uchun aloqasiz model qabul qilinmaydi.

## Yangi GLB modellari — brauzer

`npm run test:e2e:informatics-models`: **PASS**. Test Vercel konfiguratsiyasidagi CSP sarlavhasi bilan haqiqiy WebGL renderda bajarildi.

- **18/18 GLB** ochildi. Har qism alohida ko‘rsatildi; rendererning chizilgan uchburchaklari aktiv geometriyasiga nisbatan tekshirildi va canvas tasviri almashishi tasdiqlandi.
- Yig‘ilgan va ajratilgan kompyuter ko‘rinishlari, alohida CPU/ona plata/RAM/PCIe/SATA rasmlari olindi. PCIe va SATA alohida rasmlari qo‘lda ham ko‘rildi.
- Manba/muallif paneli va videokarta GLB faylini yuklab olish ishladi; yuklangan faylning SHA-256 qiymati tekshirildi.
- Tayyor GLB → izohli 3D sxema → tayyor GLB almashinuvida 18 ta aktiv qayta HTTP yuklanmadi.
- Bitta modelga 404 qaytarilganda **17/18** holati va tushunarli xabar chiqdi. Qayta urinishdan so‘ng **18/18** tiklandi; yetishmagan model yashirin soddalashtirilgan geometriya bilan almashtirilmadi.
- 320, 390 va 768 px kenglik, tungi ko‘rinish va yangi boshqaruv/model kartalarida avtomatik WCAG tekshiruvi: **0 buzilish**. `pageerror`: **0**.
- WebGL ataylab o‘chirilganda 2D zaxira ko‘rinish va ROM/UEFI darsi ishladi.
- 7 ta tarixiy ko‘ruvchining mahalliy posteri, ochish tugmasi, manba krediti va ruxsat etilgan iframe URLi tekshirildi. Iframe javobiga test HTMLi berildi. **Tashqi Sketchfabning haqiqiy geometriyasi ushbu avtomatik sinovda chizilgani da’vo qilinmaydi.** Asl ochiq metadata, litsenziya va posterlar alohida tekshirilgan; tashqi ko‘ruvchi internet va xizmat mavjudligiga bog‘liq.

Mashina o‘qiydigan natija: [qa-7.44.0/models-browser.json](qa-7.44.0/models-browser.json).

## Avvalgi funksiyalar

`npm run test:e2e:informatics`: **PASS**.

12 tarixiy bekat, 18 qism darsi, ajratish/kamera/keng ekran, 2D/3D almashinuvi, 6 yuklanish bosqichi, RAM/SSD quvvat tajribasi, bitlar, 8 yig‘ish topshirig‘i, 4 diagnostika, 12 savol, progressning qayta ochilganda saqlanishi, JSON eksporti va mehmon navigatsiyasi tekshirildi. Mobil, tungi ko‘rinish, WebGLsiz va localStorage bloklangan holatlar ishladi. Avtomatik accessibility buzilishi va `pageerror`: **0**.

`npm run test:e2e:atlases`: **PASS**.

Besh atlas markazi, qidiruv, 174 mavzu/bo‘lim uchun mavjud qo‘llanma tizimi, har atlasdan bittadan to‘liq qo‘llanma, qaydni tiklash, davom ettirish, hisoblar orasidagi ajratish, JSON, 320/390/768 px va tungi ko‘rinish tekshirildi. WebGLsiz informatika qo‘llanmasi yakunlandi. Avtomatik accessibility buzilishi va `pageerror`: **0**.

Boshqa fanlarning barcha 3D sahnalari bu versiyada qayta chizib tekshirilgani da’vo qilinmaydi. Ularning hisob testlari umumiy testlar ichida; oldingi keng qamrovli 3D tekshiruvlar `QA-7.42.md` va `QA-7.43.md`da.

## Build va ishlash

- `npm run build`: **PASS**. lucide-react paketining mavjud `use client` ogohlantirishi buildni to‘xtatmaydi.
- `npm run perf`: **PASS**. Boshlang‘ich JS 588 534 bayt, taxminiy gzip 173 064 bayt; CSS 314 436 bayt, taxminiy gzip 55 345 bayt. Bu boshlang‘ich sahifa o‘lchovi; keyin ochiladigan informatika geometriyasining xotira/GPU sarfi ushbu raqamlarga kirmaydi.
- 18 GLB jami **13 098 236 bayt**. Modellar informatika apparat sahnasida yuklanadi. Yuklangan baytlar tashrif davomida cheklangan keshda qayta ishlatiladi. Sahna yopilganda geometriya va teksturalar bo‘shatiladi.
- Yangi npm runtime dependency va SQL migratsiyasi: **0**. Tarixiy viewer uchun CSP `frame-src`iga faqat `https://sketchfab.com` qo‘shilgan.
- GitHub push yoki amaldagi saytga deploy bajarilmagan.

WebGLsiz maxsus testdagi `Error creating WebGL context` konsol xabari kutilgan holat. Avtomatik accessibility testi ekran o‘quvchi bilan qo‘lda audit yoki barcha haqiqiy telefonlardagi sinov o‘rnini bosmaydi.
