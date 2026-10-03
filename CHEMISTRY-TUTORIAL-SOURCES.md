# Kimyo qo‘llanmasi va vizual model manbalari

Tekshirildi: 2026-10-03. Izohlar, tajriba qo‘llanmalari, chizmalar va parametrli modellar SinfQuiz uchun mustaqil yozilgan. Manbalardan matn, surat yoki tajriba retsepti ko‘chirilmagan. Xalqaro sertifikat yoki ilmiy tadqiqot simulyatori degan da’vo berilmaydi.

## Ilmiy tekshiruv

- OpenStax Chemistry 2e, **4.2 Classifying Chemical Reactions**: cho‘kma hosil bo‘lishi, eruvchanlik qoidalari va kislota–asos reaksiyalarini tasniflash. https://openstax.org/books/chemistry-2e/pages/4-2-classifying-chemical-reactions
- OpenStax Chemistry 2e, **11.5 Colloids**: eritma, suspenziya, moy tomchilari va ko‘pik orasidagi farqlar; tinch holatda zarracha cho‘kishi va aralashmaydigan suyuqliklar. https://openstax.org/books/chemistry-2e/pages/11-5-colloids
- Mavjud tenglama, pH, gaz va davriy jadval tekshiruvlari: `CHEMISTRY-SOURCES.md`, `ATLAS-SOURCES-7.20.md`.

Ushbu vizual modeldagi cho‘kish va qatlamga ajralish vaqt doimiylari ta’limiy tanlovdir, manbadan olingan tajriba o‘lchovi emas. Rangsiz eritma sathini ko‘rsatish uchun yengil tus ishlatiladi. Oq bulutcha ko‘rinmaydigan suv bug‘ini belgilaydi.

## Dasturiy va vizual texnika

- Three.js `MeshPhysicalMaterial`: shisha uchun sirt va akslanish; ko‘proq grafik quvvat talab qiladi. Yengil rejim oddiyroq materiallardan foydalanadi. https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- Three.js `RoomEnvironment` — Three.js tarkibidagi parametrli yoritish muhiti; MIT litsenziyasi. https://github.com/mrdoob/three.js/blob/r180/examples/jsm/environments/RoomEnvironment.js
- Three.js litsenziyasi (MIT): https://github.com/mrdoob/three.js/blob/r180/LICENSE
- Vite `optimizeDeps.include`: lokal ishga tushishda 3D kutubxona importlarini oldindan tayyorlash. https://vite.dev/config/dep-optimization-options#optimizedeps-include

Shisha idishlar, moy va suyuqlik yuzalari, kristallar, filtr, vulqon kesimi, ko‘pik va sirt teksturalari `chemistry-bench-3d.js` ichida matematik geometriyadan yaratiladi. Vulkan teksturasi algoritm bilan chiziladi; muallif fotosurati yoki tashqi 3D model ishlatilmagan. Zarrachalar uchun qayta ishlatiladigan InstancedMesh, harakatni kamaytirish va ko‘rinmay turganda renderni to‘xtatish ishlatiladi.

Avvaldan loyihada bo‘lgan boshqa fanlar aktivlarining manbalari `MODEL-SOURCES.md`da saqlangan.
