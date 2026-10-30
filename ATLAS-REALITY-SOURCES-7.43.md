# 7.43 — manbalar, miqyos va model chegaralari

## ENIAC

- Smithsonian saqlagan **1946-yil armiya hujjati**, xona 30×50 fut, 40 panelning tartibi va U joylashuvi, 150 kW: https://americanhistory.si.edu/comphist/pr4.pdf
- Smithsonian **Initiating Unit**, xona, og‘irlik, qismlar, 140 kW: https://americanhistory.si.edu/collections/object/nmah_334262
- Smithsonian **Accumulator #2**, qo‘llanish tarixi va sonli tenglamalar: https://www.si.edu/object/nmah_334742
- **A Report on the ENIAC**, 1946, I qism, 1-bob: o‘nlik arifmetika, akkumulyator, dastur impulslari va hisob sikli: https://ftp.arl.army.mil/~mike/comphist/46eniac-report/chap1.html
- University of Pennsylvania, dasturlovchilar, 20 akkumulyator va qayta ulash: https://penntoday.upenn.edu/news/penns-eniac-worlds-first-electronic-computer-turns-80
- Smithsonian o‘quv qo‘llanmasi, tarixiy vazifalar: https://www.si.edu/Content/SE/Educator%20Guides/D-DAY_Educators.pdf

30 AQSh qisqa tonnasi × 907,18474 kg = 27 215,5422 kg. UI “≈27,2 tonna” deydi. Manbalarda 140 va 150 kW, panel balandligi taxminan 8–9 fut deb farqlanadi; ular yagona aniq o‘lchov sifatida birlashtirilmaydi. Xona rejasi hujjatga asoslangan, jihoz detallari va bezaklar original o‘quv talqini. 18 000 elektron lampaning barchasi alohida chizilmagan. Old yuzadagi nuqtalar neon holat ko‘rsatkichlari; elektron lampalar bilan bir narsa emas.

Ulash mashqi qurilmaning umumiy mantiqini beradi; texnik port xaritasi yoki ENIACning to‘liq arxitektura emulyatori emas. Erkin tushish misoli havo qarshiligisiz h=h₀−gt²/2, v=gt (g=9,81 m/s²) bo‘yicha hisoblanadi. Bu ENIACning asl ballistik dasturi yoki tarixiy jadvali deb ko‘rsatilmaydi.

## Boshqa tarixiy qurilmalar

Har bekatdagi oldingi birlamchi/muzey manbalari `src/informatics/content.js` va `INFORMATIKA-ATLAS-SOURCES.md`da. Qo‘shimcha amaliy misollar original:

- Cho‘t ustunlari o‘nlik sanoqning o‘quv ko‘rinishi; bir xalqdagi aniq tarixiy modelga aynan tenglashtirilmagan.
- Paskal misoli o‘nlik ko‘tarilishni tushuntiradi; tarixiy valyuta g‘ildiraklarining hammasini qamramaydi.
- Analitik mashina loyihasi qurib tugallangan deb aytilmaydi; (a+b)×2 — o‘quv buyruqlari.
- Z3ning haqiqiy suzuvchi nuqtali arifmetikasi o‘rniga kichik ikkilik butun son misoli ko‘rsatiladi.
- Colossusdagi bit mosligi sanog‘i haqiqiy Lorenz kriptotahlilining nusxasi emas.
- Baby misoli olish/bajarish/yozish sikli; tarixiy 2¹⁸ bo‘luvchisi dasturi bilan aralashtirilmaydi.
- UNIVACdagi hududlar, IBM 1401dagi tariflar va PCdagi xaridlar — o‘quv ma’lumotlari.
- Intel 4004 mashqi 4 bitli yig‘indi va carry; asl takt yoki Busicom proshivkasi emas.
- RGB hisobi siqilmagan 8 bit × 3 kanalli tasvir uchun; PNG/JPEG hajmi deb ko‘rsatilmaydi.

## Besh fan atlasining amaliy muhitlari

Original ssenariylar `src/atlas-reality/contexts.js`da: har mavzuga alohida vaziyat, ish maqsadi va kuzatuv topshirig‘i. 170 mavzuning hisobi `science-model.js` / `math-model.js` orqali bog‘langan. Matematik formula va birliklar aniq, biologik indekslar hamda sifat modellarining chegaralari UI va oldingi manbalar ro‘yxatida ko‘rsatilgan.

- Matematika: OpenStax, https://openstax.org/details/books/prealgebra-2e va https://openstax.org/details/books/elementary-algebra-2e
- Biologiya: oldingi `BIOLOGY-SOURCES.md`, `biology-asset-catalog.js` va aktivlar litsenziyalari. Yangi amaliy ko‘rinish ayni `biologyResult` hisobidan foydalanadi; klinik/dala o‘lchovi emas.
- Kimyo: `CHEMISTRY-SOURCES.md`, `CHEMISTRY-TUTORIAL-SOURCES.md` va tegishli mavzudagi OpenStax havolalari; https://openstax.org/details/books/chemistry-2e. `labResult` bir xil parametr va vaqtda UI, jadval va eksport uchun ishlatiladi. Molekula koordinatalari, atom qavatlari va jihozlar — ko‘rgazmali modellardir.
- Fizika/koinot: oldingi `SPACE-SOURCES.md`, `PHYSICS-7.31-SOURCES.md` va mavzu izohlari; NASA https://science.nasa.gov/solar-system/, https://science.nasa.gov/universe/stars/, https://science.nasa.gov/universe/black-holes/. Mavjud kuzatuv formulalari va 53 sahna qayta ishlatiladi; kosmik masofa va vaqt siqilgan.

Yangi xona, stol, idish va matematik buyumlar Three.js geometriyasidan yaratilgan; tashqi fotosurat yoki skan yuklanmaydi. Biologiyadagi mavjud aktivlarning attribution/litsenziyalari saqlangan. Renderning chiroyli ko‘rinishi o‘lchov aniqligining dalili sifatida talqin qilinmaydi.
