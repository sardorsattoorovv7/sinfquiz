# Biologiya modellari — manbalar va foydalanish huquqi

SinfQuiz 7.21 tayyor sirtlar va teksturalardan foydalanadi. Barcha GLB fayllari `public/biology/v7.21` ichida; tashqi fayl yoki pullik xizmat runtime vaqtida talab qilinmaydi. `manifest.json` har bir modelning manbasi, muallifi, litsenziyasi, hajmi va SHA-256 tekshiruv summasini beradi.

| Fayl | Manba va muallif | Litsenziya | Moslashtirish |
| --- | --- | --- | --- |
| `anatomy-organs.glb`, `anatomy-skin.glb`, `anatomy-skeleton.glb`, `anatomy-muscles.glb`, `anatomy-eye.glb` | [BodyParts3D 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), Database Center for Life Science | [CC BY 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) | Tayyor OBJ sirtlari guruhlangan, normallar hisoblangan, murakkab sirtlar yengillashtirilgan; nomlar o‘zbekcha. |
| `anatomy-lungs.glb` | Kristen Browne va Heidi Schlehlein, [HuBMAP Lung Male v1.4](https://doi.org/10.48539/HBM532.KLZD.394), Visible Human/NLM ma’lumotlari | CC BY 4.0 | 20 ta tayyor bronx-o‘pka segmentining sirtlari ikki o‘pka sifatida guruhlangan; butun juftlik bir xil koeffitsiyent bilan ta’limiy tana sahnasiga moslangan. |
| `living-plant.glb` | Rico Cilliers, [Poly Haven Potted Plant 02](https://polyhaven.com/a/potted_plant_02) | [CC0](https://polyhaven.com/license) | Asl geometriya va UV saqlangan; 1K teksturalar GLB ichiga joylangan. Tuproq sahnalarida gultuvak yashiriladi. |
| `flower.glb` | Jenelle van Heerden (fotografiya), Rico Cilliers (modellashtirish), [Poly Haven Flower Empodium](https://polyhaven.com/a/flower_empodium) | CC0 | Asl geometriya, UV va teksturalar saqlangan; darsda bitta o‘sish varianti ko‘rsatiladi. |
| `plant.glb`, `seedling.glb`, `leaf.glb`, `tree.glb`, `fungus.glb` | [Kenney Nature Kit](https://kenney.nl/assets/nature-kit) | CC0 | Original GLB sirtlari; ayrim sahnalarda o‘lcham va rang ta’limiy parametr bilan o‘zgaradi. |
| `fish.glb` | Microsoft, [BarramundiFish](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/BarramundiFish) | CC0 | Asl geometriya/UV saqlangan; teksturalar 1024 px gacha qisqartirilgan. |
| `fox.glb` | PixelMannen (geometriya), tomkranis (rig/animatsiya), AsoboStudio va scurest (glTFga o‘tkazish), [Fox](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox) | Geometriya CC0; rig, animatsiya va konversiya CC BY 4.0 | Skelet va animatsiyalar saqlangan. Animatsiya mustaqil soat bilan emas, tajriba vaqti bilan boshqariladi. |
| `bird.glb` | [Mesh2Motion contributors](https://github.com/Mesh2Motion/mesh2motion-app/blob/main/static/models/model-bird.glb) | CC0 | Default tayyor qush modeli; geometry/UV saqlangan. Tumshuq taqqoslash yoniga alohida sxema sifatida qo‘shilgan. CC BY-SA variant modellar ishlatilmagan. |

BodyParts3D attribution: **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**.

BodyParts3D ning eski OBJ izohlarida CC BY-SA 2.1 Japan matni uchraydi. Rasmiy litsenziya sahifasining 2025-02-27 dagi yangilanishi bazani CC BY 4.0 ostida beradi. 2026-10-04 kuni tekshirilgan sahifa nusxasi `BodyParts3D-license.txt` ichida. U ilovada HTML/script sifatida bajarilmaydi.

HuBMAP: **Browne, Kristen, and Heidi Schlehlein. 2024. “3D Reference Organ for Lung, Male v1.4.” https://doi.org/10.48539/HBM532.KLZD.394. CC BY 4.0.** Mualliflar, litsenziya va ontologiya xaritasi `HuBMAP-Lung-metadata.yaml` va `HuBMAP-Lung-crosswalk.csv`da berilgan. Rasmiy [metadata](https://github.com/hubmapconsortium/hra-kg/blob/main/digital-objects/ref-organ/lung-male/v1.4/raw/metadata.yaml) modelning kelib chiqishini tasdiqlaydi.

Kenney litsenziyasi, Khronos model README fayllari va Mesh2Motion CC0/README fayllari ham modellar bilan birga berilgan. Ushbu loyihalar SinfQuizni tasdiqlagan yoki hamkor deb ko‘rsatilmaydi.

## Ilmiy chegaralar

BodyParts3D katta yoshli erkak anatomiyasini ifodalaydi. HuBMAP o‘pka juftligi boshqa tayanch manbadan kelgan; uning sirtlari uniform masshtab va siljitish bilan joylashtirilgan. Yig‘ilgan sahna bitta odamning tibbiy skani emas. Organlar joylashuvi ta’limiy maqsadda tekshirilgan, individual farqlar va barcha mayda tuzilmalar qamralmagan.

BodyParts3D `right-lung`/`left-lung` agregatlari asosan bronx va tomirlardan iborat. Ular to‘liq o‘pka tashqi sirtlari deb berilmaydi; yangi sahnada HuBMAP sirtlari va bronx/tomirlar alohida strukturalardir. Orqa miya manbasi markaziy kanal bilan cheklangan va shunday nomlangan.

Nafas deformatsiyasi fiziologiyani tushuntiradigan soddalashtirish; bu klinik hajm yoki kuch hisobi emas. Qon ko‘k bo‘lmaydi — ko‘k rang faqat kislorodi kam yo‘lni bildiradi. Oziqa yo‘li bezlar ichidan o‘tmaydi. Kesim sirtlarni ko‘rinishdan chiqaradigan clipping plane; to‘qima, hujayra va mikroskopik FTUning haqiqiy 3D skani emas. Izohli chizma shu jarayonlarni alohida tushuntiradi.

Teksturali o‘simlik/gul bitta turni ifodalaydi. Ildizlar, tomir oqimi, chang naychasi va hujayra belgilarida sxema ishlatiladi. Tayyor qushning turini o‘zgartirgandek da’vo qilinmaydi: tumshuq parametrlari kattalashtirilgan taqqoslashga ta’sir qiladi. Oziq zanjirida model kattaligi populyatsiya indeksini bildiradi. Ayrim hayvon guruhlari, g‘umbak/tuxum bosqichlari, hujayra va mikroorganizmlar umumlashtirilgan modellar bilan beriladi.

## Texnik moslashtirish va qayta tayyorlash

BodyParts3D koordinatalari mm dan `(x, z, −y)/200` ga o‘tkazilgan va balandlikdan 4.25 ayirilgan. Bir manbadagi organlar alohida siljitilmagan. QEM orqali sirtlar yengillashtiriladi; SHA-256 va boshlang‘ich/final uchburchak sonlari manifestda beriladi. Suyaklar aynan suyak nomlari bo‘yicha olinadi: o‘pka/ko‘z kabi yumshoq to‘qimalar skeletga kiritilmaydi.

Qayta tayyorlash **o‘rnatish uchun kerak emas**. Zarur bo‘lsa, rasmiy manbalardan quyidagilarni alohida SOURCE_DIRECTORYga oling:

- BodyParts3D: `partof_parts_list_e.txt`, `partof_element_parts.txt`, `partof_BP3D_4.0_obj_99.zip`, `isa_parts_list_e.txt`, `isa_element_parts.txt`, `isa_BP3D_4.0_obj_99.zip` va `BodyParts3D-license.html`.
- Kenney: `kenney_nature-kit.zip`.
- Khronos: `BarramundiFish.glb`, `Fox.glb` va mos README fayllari.
- Poly Haven API qaytargan 1K glTF/BIN/teksturalar: `polyhaven-plant/potted_plant_02.gltf` va `polyhaven-flower/flower_empodium.gltf` bilan ularning bog‘liq fayllari.
- HuBMAP: `hra-lung.glb`, `hra-lung-crosswalk.csv`, `hra-lung-metadata.yaml`.
- Mesh2Motion: `Mesh2Motion-Bird.glb`, `Mesh2Motion-CC0.md`, `Mesh2Motion-README.md`.

```sh
node scripts/extract-biology-lungs.mjs SOURCE_DIRECTORY
python -m pip install numpy Pillow fast-simplification
python scripts/build-biology-models.py SOURCE_DIRECTORY
```

Bular development uchun optional vositalar; saytda Python server ishlatilmaydi. O‘quvchi brauzeri faqat bir xil versiyadagi, oldindan tayyorlangan GLB fayllarini yuklaydi.
