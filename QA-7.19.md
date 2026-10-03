# SinfQuiz 7.19 tekshiruv hisoboti

## Hisoblar va mavjud oqimlar

`npm test`: 88 ta test o‘tdi, 0 xato. Bunda mavjud auth, test reytingi, typing, poyga, migratsiya/RLS va biologiya modelining oldingi testlari bor. Biologiya formulalari va Supabase sxemasi bu yangilanishda o‘zgarmadi.

Production build muvaffaqiyatli. Quyidagi ikkala brauzer skripti ham yakuniy kodda PASS natijasini berdi.

## Brauzerdagi 3D tekshiruv

`tests/biology-3d-browser.cjs` quyidagilarni tekshiradi:

- 24 sahna turi haqiqiy WebGL bilan ochilishi; har bir tanlov parametrining barcha variantlari;
- sahna birinchi ochilgandagi kamera modelni ko‘rsatishi;
- qismlarni tanlash, vaqt slayderi va model holatining birga yangilanishi;
- nafas animatsiyasidagi haqiqiy tasvir o‘zgarishi;
- pauza, davom ettirish va pauzada ortiqcha render bo‘lmasligi;
- mobil o‘lcham/tungi rejimda ko‘rinadigan geometriya saqlanishi;
- 3D → chizma → 3D va WebGL context yo‘qolsa ishlaydigan zaxira chizma;
- runtime xatolari yo‘qligi.

`tests/biology-browser.cjs`: 30 mavzu, 12 yakunlanadigan amaliy ish, modelning chekli son natijalari, mobil sahifa kengligi va avtomatik WCAG axe tekshiruvi.

Birinchi mobil tekshiruvda boshlang‘ich kamera modeli ko‘rsatmasligi aniqlandi va kamera yo‘nalishini o‘rnatish bilan tuzatildi. Shu holat alohida tasvir regressiya tekshiruviga qo‘shildi.

## Chegaralar

Brauzer sinovlari Chromium/SwiftShader va test auth/API javoblari bilan bajarildi. Jonli Supabase yoki Vercelga yozish/deploy qilinmadi. Barcha telefonlar uchun aniq FPS kafolati yoki to‘liq qo‘lda WCAG auditi da’vosi yo‘q. Modellar original, soddalashtirilgan o‘quv tasvirlaridir.
