# Tanlangan 3D model va uning litsenziyasi

| Maydon | Qiymat |
| --- | --- |
| Model | Fantasy Island in the sky |
| Muallif | [Violette_Lass](https://sketchfab.com/Violette_Lass) |
| Asl sahifa | [Sketchfab](https://sketchfab.com/3d-models/fantasy-island-in-the-sky-27910a201acb4a109f77baa5c073c7a3) |
| Model UID | `27910a201acb4a109f77baa5c073c7a3` |
| Litsenziya | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Tekshirilgan sana | 2026-10-09 |
| Asl model metama’lumoti | [Sketchfab Data API](https://api.sketchfab.com/v3/models/27910a201acb4a109f77baa5c073c7a3) |
| Saytdagi fayl | `public/models/island/v7.29/fantasy-island.glb` |

Amaldagi Sketchfab metama’lumoti modelni yuklab olish mumkinligini va CC Attribution ekanligini ko‘rsatdi. Sketchfab Download API esa akkauntga kirishni talab qiladi. Shu sababli Creative Commons modellarini qayta tarqatadigan ochiq [Sketchfab Backup](https://github.com/traines-source/sketchfab-backup) arxividagi aynan shu UID nusxasi olindi. Asl modelning o‘z `license.txt` fayli ham CC BY 4.0, muallif va model sahifasini tasdiqlaydi. Model boshqa nomdagi aktiv bilan almashtirilmagan; yopiq viewer resurslari chiqarib olinmagan.

Yuklab olish manbasi: `https://mirror.traines.eu/sketchfab-backup/27/27910a201acb4a109f77baa5c073c7a3.zip`.

`public/models/island/v7.29/LICENSE.txt` — original litsenziya va kredit yozuvi. `provenance.json` — yuklash manbasi, asl ZIP SHA-256, optimallashtirilgan GLB SHA-256, tekstura o‘lchamlari va animatsiya geometriyasi hisoblari.

Model formatida va teksturalarda optimallashtirish bajarildi; statik qismlar umumiy material va bir xil animatsiya ota tuguni bo‘yicha birlashtirildi. Kameraga mos o‘lcham va yoritish SinfQuiz sahnasida o‘zgartirildi. Modelning shakli uchburchaklarni soddalashtirish orqali o‘zgartirilmadi. Muallifning SinfQuiz’ni ma’qullashi haqida da’vo qilinmaydi.

Saytdagi muallif va litsenziya havolalari saqlanishi kerak. Sayt yoki uning o‘zgartirilgan nusxasini tarqatishda kreditni olib tashlamang.

## Optimallashtirishni qayta bajarish

Bu ishlab chiqarishdan oldingi jarayon; oddiy `npm ci` va `npm run build` uchun qayta bajarish shart emas. Tayyor GLB ZIPga kiritilgan. Vositalar saytning runtime bog‘liqliklariga qo‘shilmagan.

Tashqi papkaga `@gltf-transform/cli@4.5.0` o‘rnating. Asl ZIPdan `scene.gltf`, `scene.bin` va `textures/`ni bitta papkaga oching. So‘ng:

```bash
gltf-transform optimize scene.gltf optimized.glb --simplify false --instance false --texture-size 1024 --texture-compress webp --compress meshopt
```

`SQ_GLTF_TOOLS_DIR`ni vositalar o‘rnatilgan papkaga belgilang; bu papkada `package.json` va `node_modules` bo‘lishi kerak. Loyiha papkasida:

```bash
node scripts/batch-island-model.mjs optimized.glb public/models/island/v7.29/fantasy-island.glb
```

Skript faqat barg mesh tugunlarini eng yaqin animatsiya ota tuguni ostiga ko‘chiradi; ularning koordinatalarini oldindan saqlaydi. Animatsiya nishonlarini, ularning ierarxiyasini, 28 ta kanalni va sahna o‘lchovlarini tekshiradi. Asl va tayyor fayllarda har bir animatsiya ostidagi uchburchak soni ham tengligi alohida tasdiqlandi. Yangi eksportdan so‘ng `provenance.json` hashi va tegishli tekshiruv ma’lumotlarini yangilang.

## Texnik manbalar

- [glTF Transform CLI](https://gltf-transform.dev/cli): Meshopt, WebP, resample, weld va modelni tekshirish.
- [Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader): model va animatsiyalarni ochish.
- Three.js va uning Meshopt dekoderi loyihadagi mavjud `three` paketidan olinadi. Ularning litsenziya ma’lumotlari npm paketida saqlanadi.

Asl modelda sharshara yo‘q. Sahna uning orollari, ko‘prigi, havo shari va propellerlarini saqlaydi. Pastdagi suv effekti SinfQuiz muhitiga tegishli; bu muallif yaratgan modelning qismi deb taqdim etilmaydi.
