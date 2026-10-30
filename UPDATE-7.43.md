# SinfQuiz 7.43.0 — obyektni muhitida ko‘rish va ishlatish

Atlas endi faqat tavsif va aylantiriladigan buyumdan iborat emas: mavzuning nima uchun kerakligi, ishlash jarayoni va o‘zgartirilgan sharoitdagi hisoblangan natija birga ko‘rsatiladi.

## ENIAC xonasiga kirish

1. **Atlaslar → Informatika → Vaqt muzeyi → ENIAC**.
2. Boshlang‘ich ko‘rinish — tarixiy muhit. **Xonaga kirib yurish** orqali ko‘z balandligidagi ko‘rinishga o‘ting. W/A/S/D yoki telefon tugmalari bilan yuring; chap/o‘ng tugmalar qarash yo‘nalishini o‘zgartiradi. Home umumiy ko‘rinishga qaytaradi.
3. Kamera menyusida buyruq/kirish, akkumulyator, hisoblash va natija qurilmasini tanlang. Panel yuzasini bosib ham yaqinlashish mumkin.
4. Pastdagi **O‘quv ulash paneli**da karta/konstantani akkumulyatorga, natija akkumulyatorini karta chiqarish qurilmasiga ulang. Noto‘g‘ri yo‘l hisobni boshlatmaydi; namuna tugmasi yordam beradi.
5. **999 + 1**, **23 × 17** yoki o‘zingiz tanlagan sonlarni bosqichma-bosqich hisoblang. Xonadagi akkumulyator ko‘rsatkichi ham yangilanadi.
6. Harakat jadvali bo‘limida erkin tushishning balandlik/tezlik jadvali, nuqtali grafigi va vaqt oralig‘ini sinang. JSONni yuklab oling.

Xona 30 × 50 fut haqidagi tarixiy hujjatdan 9,14 × 15,24 metrga o‘tkazilgan. 40 panel U shaklida; 20 tasi akkumulyator. Odam belgisi taxminan 1,7 m. 30 AQSh qisqa tonnasi taxminan 27,2 metrik tonna. Elektr sarfi manbalardagi farq sabab 140–150 kW diapazonda yozilgan.

Bu original protsedurali o‘quv rekonstruksiyasi: xona bezagi va panel detali muzey skani emas. Old panellardagi neon holat chiroqlari bilan elektron lampalar ajratiladi. Ko‘rish uchun animatsiya sekinlashtirilgan; u mashinaning haqiqiy sekundlik tezligi emas.

## Barcha tarixiy bekatlar

| Bekat | Amalda bajariladigan misol |
|---|---|
| Hisob taxtasi / cho‘t | Sonni boncuk holatiga o‘tkazish, qo‘shish, xona ko‘tarilishi |
| Paskal hisoblagichi | 999 + 1, o‘nlik g‘ildirakdagi ko‘tarilish |
| Analitik mashina g‘oyasi | Kartadagi ketma-ket buyruqlar: (a+b)×2 |
| Z3 | Ikkilik sonlar va kontaktlarning ikki holati |
| Colossus | 5 bitli namunalarda mos o‘rinlarni sanash |
| ENIAC | Ulash, o‘nlik qo‘shish/ko‘paytirish, hisob jadvali |
| Manchester Baby | Buyruq va ma’lumot bir elektron xotirada, olish/bajarish/saqlash |
| UNIVAC I | Lenta yozuvlaridan jami aholi hisobi |
| IBM 1401 | Ish soati × tarif, printerdagi ish haqi satri |
| Intel 4004 | 4 bitli qo‘shish va carry |
| IBM PC | Dastur diskdan RAMga, xarid hisobi, natijani saqlash |
| Zamonaviy kompyuter | RGB tasvirning bayt hajmi va SSD/RAM/CPU/GPU yo‘li |

Har bekatda qurilmaning haqiqiy vazifasi va aynan ushbu mashqning soddalashtirilishi yozilgan. Bebbijning qurilmagan loyihasi ishlagan tarixiy mashina sifatida ko‘rsatilmaydi. Colossus mashqi Lorenz shifrini ochmaydi; Baby misoli asl birinchi dastur emas.

## Kompyuterning barcha 18 qismi

**Kompyuter ichida** bo‘limida qismni tanlab, **Qismni ishda ko‘rsatish**ni bosing. To‘g‘ri va uzilgan/mos kelmagan holatlarni solishtiring. Uch bosqichli yo‘l modelda yoritiladi. CPU sonlarni hisoblaydi; RAMning elektrsiz qolishi disk/firmwaredan ajratiladi; SATAning quvvat va ma’lumot kabellari, M.2/NVMe mosligi, videoning chiqishi va havo/issiqlik yo‘li ko‘rsatiladi. Haqiqiy harorat, RPM yoki tezlik bashorat qilinmaydi.

## Qolgan atlaslar

Har mavzuni ochganda **Amaliy muhitga kirish** tugmasi mavjud:

| Atlas | Qamrov | Muhit va ish |
|---|---:|---|
| Matematika | 62 mavzu | Termometr, do‘kon, taksi, narvon, pol, qadoq, suv baki va boshqa fizik buyumlar. Parametrlar geometriya va hisobni o‘zgartiradi. |
| Biologiya | 30 mavzu | O‘simlik, tuproq va organizmni tashqaridan ichki tuzilishigacha ko‘rish; mavjud 3D aktivlar va izohli chizmalar, jonli biologik model. |
| Kimyo | 25 mavzu/tajriba | Yoritilgan jihoz stoli, shaffof idish, filtr, distillash, indikator, zarrachalarga yaqinlashish; mavjud ilmiy model bilan natijalar. |
| Fizika va koinot | 53 hodisa | Mavjud 53 interaktiv 3D modelni kuzatuv missiyasi sifatida boshqarish, datchik hisobi va formulalar. |

Har muhitda uch bekat, boshqaruvlar, jarayon bosqichi, hisoblangan ko‘rsatkichlar, sabab va model chegarasi bor. **Sinovni qayd etish** qo‘lda taxminiy son kiritishni emas, ayni parametr va bosqichdagi hisobni jadvalga oladi. Bir xil holat takroran qo‘shilmaydi; oxirgi 6 sinov saqlanadi. Sinovlarni JSONga eksport qilish mumkin.

Tezkor sinov jadvali faqat shu ochiq muhitda turadi. Oldingi versiyaning hisob bo‘yicha saqlanadigan qo‘llanma qaydlari va ustozga topshiriladigan daftarlari o‘z vazifasida qolgan. Modelni kuzatishning o‘zi rasmiy baho bermaydi.

## Ishga tushirish

```sh
npm ci
npm run dev
```

Node.js 22.12 yoki keyinroq talab qilinadi. Supabase sozlamalari uchun oldingi README tartibi ishlaydi; ushbu versiyada yangi SQL migratsiyasi yoki loyiha bog‘liqligi yo‘q. `node_modules` va build chiqishi ZIPga kiritilmagan. Pythonning qayta hosil qilinadigan runtime fayllari `npm ci` / prebuild orqali tiklanadi.

```sh
npm test
npm run test:e2e:reality
npm run test:e2e:informatics
npm run build
npm run perf
```

WebGL ishlamasa, ENIACning 40 panelli 2D xona rejasi, tarixiy hisoblar va fanlardagi 2D/jonli hisoblar ishlaydi. Boshqaruvlar klaviatura va telefon uchun ham mavjud.
