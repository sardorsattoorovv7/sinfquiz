# Koinot atlasi: manbalar, aktivlar va model chegaralari

Matnlar va sahna kodi ushbu loyiha uchun o‘zbek tilida yozildi. Quyidagi manbalar tekshiruv va tushuntirish tayanchi; ulardan maqolalar nusxalanmagan. Human Atlas yoki PhET interfeysi/aktivlari ishlatilmadi.

## Tayyor 3D aktivlar

| Aktiv | Manba va muallif | O‘zgarish |
|---|---|---|
| Yer va bulutlar | [NASA Earth with Clouds / VTAD](https://science.nasa.gov/resource/earth-with-clouds-3d-model/) | Geometriya saqlandi; GLB ichidagi teksturalar 2048 px JPEGga kichraytirildi. |
| Oy | [NASA Moon / VTAD interaktiv modeli](https://solarsystem.nasa.gov/gltf_embed/2366/) | Geometriya saqlandi; tekstura 2048 px JPEGga kichraytirildi. |

Fayllar `public/space/v7.30/`da. Manba URLlari, o‘lchamlar va SHA256 `manifest.json`da. NASA ta’limiy/informatsion media foydalanish qoidalari: https://www.nasa.gov/nasa-brand-center/images-and-media/. NASA tomonidan tasdiqlangan mahsulot deb da’vo qilinmaydi; NASA logotipi ko‘chirilmagan. Aktiv sahifalarida VTAD krediti berilgan. Qolgan geometriya, chiziqlar, zarrachalar va SVGlar loyiha kodi yaratgan ta’limiy modellardir.

## Ilmiy tayanch

- Meteor, meteoroid va meteorit farqi: https://science.nasa.gov/solar-system/meteors-meteorites/
- Atmosfera va bolid kuzatuvi: https://cneos.jpl.nasa.gov/fireballs/intro.html
- Astronomik konstantalar: https://ssd.jpl.nasa.gov/astro_par.html
- Fasllar: https://spaceplace.nasa.gov/seasons/en/
- Qalqish: https://science.nasa.gov/moon/tides/ va https://oceanservice.noaa.gov/education/tutorial_tides/tides02_cause.html
- Oy aylanishi: https://science.nasa.gov/moon/tidal-locking/
- Orbital mexanika: https://science.nasa.gov/learn/basics-of-space-flight/chapter4-1/
- Kometalar: https://science.nasa.gov/solar-system/comets/facts/
- Quyosh faolligi va yog‘du: https://science.nasa.gov/sun/solar-storms-and-flares/ va https://science.nasa.gov/sun/auroras/
- Yulduzlar: https://science.nasa.gov/universe/stars/
- Nova: https://science.nasa.gov/universe/whats-a-nova-inside-the-chaos-of-erupting-and-exploding-stars/
- Qora tuynuk: https://science.nasa.gov/universe/black-holes/anatomy/
- Neytron yulduzlar qo‘shilishi, ko‘p vositali kuzatuv (birlamchi tadqiqot): https://arxiv.org/abs/1710.05843
- Ekzosayyora tranziti: https://www.esa.int/Science_Exploration/Space_Science/Exoplanets/How_to_find_an_exoplanet
- Koinot evolyutsiyasi: https://www.esa.int/Science_Exploration/Space_Science/Cosmic_eras

## Qaysi hisob haqiqiy, qaysi qism ko‘rgazmali?

| Model | Hisob | Chegara |
|---|---|---|
| Orbita | SI birliklarda Nyuton markaziy tortishi; Velocity Verlet; energiya tekshiruvi | Atmosfera, ko‘p jismli ta’sir va Yerning notekisligi yo‘q. |
| Meteor kirishi | Eksponensial atmosfera; dinamik bosim, qarshilik, issiqlik/ablyatsiya va mustahkamlikka bog‘liq parchalanish | Kirish burchagi o‘zgarmas. Koeffitsiyentlar ta’limiy. Krater, chang, ejecta va suv halqalari nisbiy effekt; tsunami yoki zarar hisoblanmaydi. Past tezlikdagi meteoritga katta portlash berilmaydi. |
| Energiya | E=mv²/2, sfera massasi ρπd³/6 | Tuzilishi haqiqiy murakkab asteroid shakli emas. |
| Quyosh masofasi | F∝r⁻², albedo bilan radiatsion muvozanat harorati | Haqiqiy sirt harorati, issiqxona, ob-havo va hayot prognozi emas. |
| Oy qalqishi | Gravitatsion farq ∝d⁻³ | Har qirg‘oqdagi suv sathi shu nisbatda o‘zgarmaydi. |
| Kun uzunligi | O‘q og‘ishi, kenglik, yillik holat geometriyasi | Atmosfera refraksiyasi va haqiqiy taqvim sanasi yo‘q. |
| Tranzit | Ikki doira kesishgan yuza | Limb qorayishi, spektroskopiya va real kuzatuv shovqini yo‘q. |
| Raketa | Ideal Tsiolkovskiy tenglamasi | Gravitatsion va aerodinamik yo‘qotishlar yo‘q. |
| Qora tuynuk | Shvarsshild radiusi; Nyuton gradienti faqat yaqinlashuv | GR trayektoriya yoki ufq ichki tuzilishi yechilmaydi. Jet va disk tashqarida. |
| Qizil siljish | λobs=aλemit, z=a−1 | Kosmologik sabab; Doppler va gravitatsion sabablar alohida hisoblanmagan. |
| Yulduz, plazma, galaktika, qo‘shilish | Parametrga bog‘liq konseptual o‘zgarishlar | Yulduz ichki tuzilishi, MHD, N-body va GR sonli prognozlari emas. |

## Natijalar va ruxsatlar

Server parametr nomi/turi/oralig‘ini, kamida ikki xil sinov mavjudligini, izoh va xulosa hajmini, o‘lchovlarning skalyar turlarini va tushuncha savolining javobini tekshiradi. Muallif va o‘quvchi identifikatori Auth sessiyasidan olinadi. Natija tokeni takroriy yuborishni bitta yozuvga aylantiradi. O‘quvchi o‘lchovlari brauzer kuzatuvlaridir; server ularni fizik modelni qayta ishlatib attestatsiya qilmaydi. Bu rasmiy imtihon bali emas.
