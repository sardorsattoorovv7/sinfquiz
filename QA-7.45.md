# QA — SinfQuiz 7.45.0

Sana: 2026-10-30 (Asia/Tashkent).

## Avtomatik tekshiruv

- To‘liq `npm test`: **345 test, 345 o‘tdi, 0 xato**. Oldingi 339 test va 6 ta yangi mazmun/geometriya/saqlash/HTTP UUID testi.
- Yakuniy qatlam va resurs tozalash tuzatishlaridan keyin biologiya aktivlari, atlas qo‘llanmalari, fan hisoblari va yangi tarix/biologiya bo‘yicha **23 test qayta bajarildi: 23/23 PASS**.
- `npm run build`: **PASS**. lucide-react paketining mavjud `use client` ogohlantirishi buildni to‘xtatmaydi.
- `npm run perf`: **PASS**; boshlang‘ich JS/CSS limit ichida. Aniq o‘lchovlar `qa-7.45.0/performance.json`da. Keyin ochiladigan barcha GLBlar hajmi bu boshlang‘ich sahifa o‘lchoviga kirmaydi.

Yangi testlar: 12 bekatning xronologiyasi, koordinatalari, dalil/xulosa farqi va manbalari; barcha 12 dioramaning to‘rt tanlanadigan 3D guruhi va animatsiya chegaralaridagi chekli geometriyasi; qayd yakunlash shartlari, foydalanuvchi kalitlari va buzuq/prototip shaklidagi saqlash ma’lumotlari; 11 organ va 30 mavzu profili; anatomik uch kesim tekisligi va odamning o‘ng/chap koordinatalari; HTTPda `randomUUID` bo‘lmaganda kriptografik UUID v4 yaratish.

Mavjud biologiya GLBlarining hashlari, sirtlar tarkibi, umumiy koordinatalari va asl materiallarning nusxalar bilan buzilmasligi ham tekshirilgan. Yangilanish ularni yangi skan deb taqdim qilmaydi.

## Haqiqiy brauzer tekshiruvi

Managed preview va ruxsat etilgan bulut Chrome ishlatildi. Brauzerning o‘zi `GL_VENDOR = Disabled, GL_RENDERER = Disabled` bilan WebGL kontekstini yaratmadi. **Yangi 3D render, kesimning haqiqiy GPU tasviri va yangi kamera joylashuvlari brauzerda tasdiqlangani da’vo qilinmaydi.** Bu cheklovga boshqa brauzer yoki GPU bayrog‘i bilan chetlab o‘tish qo‘llanmadi.

Shu muhitda tekshirilgan natijalar:

- Atlaslar markazida oltita atlas, jumladan yangi Tarix kartasi ochildi.
- Tarixning **12/12 bekati**, **48/48 qismi** va har birining manba havolalari brauzerda ochildi; WebGL ishlamaganda 2D reja ko‘rindi.
- Tarixiy savolda to‘g‘ri javob va yetarli xulosa yozilmaguncha yakunlash yopiq; yozilgach yakunlash va **1 bekat yakunlandi** holati ishladi. Sahifalar almashganda qayd saqlandi.
- Xarita, Ulug‘bek rasadxonasi joyi, davr ro‘yxati, `≈` bilan taxminiy sanalar va dalil ustaxonasi ishladi. 1363 px tekshiruv oynasida gorizontal chiqish aniqlanmadi.
- Biologiya mehmon uchun ochildi. Anatomiyaning **11/11 organ/tayanch tizimi** tanlandi; har birida to‘rttadan tuzilma va to‘rttadan jarayon bosqichi ko‘rindi. Chizmada organ ichiga o‘tish ishladi.
- Bir nechta botanika, zoologiya, odam tanasi va ekologiya mavzusi haqiqiy brauzerda ochildi; yangi tuzilish panellari hamda WebGLsiz chizmalar mavjud edi. Barcha 30 mavzu profili avtomatik testda to‘liq tekshirildi.
- Mahalliy HTTPda aniqlangan `crypto.randomUUID is not a function` muammosi tuzatildi. Anatomiya darsi undan keyin ochildi.

Mobil/tungi CSS qo‘shildi, biroq bu versiyada haqiqiy telefon va barcha mobil o‘lchamlarda qo‘lda sinov yoki yangi ranglar uchun to‘liq WCAG brauzer auditi bajarilgani da’vo qilinmaydi. Oldingi avtomatik semantik/kontrast testlari umumiy testlar ichida o‘tdi.

## Saqlash va chegaralar

- Eski atlas qaydlari uchun mavjud `v742` kaliti saqlandi; yangi tarix uchun alohida `v745` qayd kaliti ishlatiladi. To‘g‘ri javob, dalilli matn va savol reviziyasi yakunlash uchun talab qilinadi.
- Ustoz/admin va serverdagi ruxsat tekshiruvlari saqlandi. Yangi tayyor biologiya va tarix darslari mehmon uchun ochiq; yangi SQL yoki ruxsat migratsiyasi yo‘q.
- Tarixiy qayta qurishlar arxeologik skan emas; xaritada tarixiy imperiya yoki siyosiy chegara da’vosi yo‘q. Qal’a aktivlari Kenney CC0; xarita Natural Earth public domain.
- Biologiya sirt kesimi gistologik to‘qima kesimi emas. Qismlarni ajratish paytida tabiiy anatomik joylashuv buzilishi izohlangan.
- GitHub push, saytga deploy va ishlab turgan ma’lumotlar bazasini o‘zgartirish bajarilmadi.
