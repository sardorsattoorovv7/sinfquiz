# SinfQuiz 7.37.0 — zamonaviy piano manbalari

Tekshirilgan sana: 2026-10-15. Manba: Free Piano Tutorials. Quyidagi 20 ta piano MIDI manba sahifalaridagi “Download Free Piano MIDI” havolalari orqali, to‘lovsiz va hisob ochmasdan yuklandi. Fayl sarlavhasi, nota hodisalari va butunligi tekshirildi. Har biri 30 soniyalik o‘quv parchasiga kesilgan; ovoz ilovaning Web Audio pianinosida yaratiladi. Qo‘shiq audiosi yoki matni paketga qo‘shilmagan.

Bu to‘plam inglizcha zamonaviy pop hitlaridan iborat. Turkcha/hindcha tayyor zamonaviy hitlar deb ko‘rsatilmagan. Eski xalq va mumtoz kuylar alohida bo‘limda saqlangan.

| Qo‘shiq | Ijrochi | Yil | MIDI parcha boshlanishi | Nota | Manba |
|---|---|---:|---:|---:|---|
| Espresso | Sabrina Carpenter | 2024 | 0 s | 142 | [Piano MIDI](https://www.freepianotutorials.net/2025/04/sabrina-carpenter-espresso-easy-piano.html) |
| APT. | ROSÉ, Bruno Mars | 2024 | 0 s | 193 | [Piano MIDI](https://www.freepianotutorials.net/2025/03/bruno-mars-rose-apt-easy-piano-tutorial.html) |
| Die With A Smile | Lady Gaga, Bruno Mars | 2024 | 50 s | 227 | [Piano MIDI](https://www.freepianotutorials.net/2025/03/lady-gaga-bruno-mars-die-with-smile.html) |
| Birds of a Feather | Billie Eilish | 2024 | 0 s | 147 | [Piano MIDI](https://www.freepianotutorials.net/2025/03/billie-eilish-birds-of-feather-piano.html) |
| Ordinary | Alex Warren | 2025 | 50 s | 368 | [Piano MIDI](https://www.freepianotutorials.net/2025/10/alex-warren-ordinary-piano-tutorial.html) |
| Azizam | Ed Sheeran | 2025 | 0 s | 245 | [Piano MIDI](https://www.freepianotutorials.net/2025/11/ed-sheeran-azizam-piano-tutorial.html) |
| Sailor Song | Gigi Perez | 2024 | 25 s | 306 | [Piano MIDI](https://www.freepianotutorials.net/2026/09/gigi-perez-sailor-song-piano-tutorial.html) |
| Love Me Not | Ravyn Lenae | 2024 | 40 s | 225 | [Piano MIDI](https://www.freepianotutorials.net/2025/12/ravyn-lenae-love-me-not-piano-tutorial.html) |
| Undressed | Sombr | 2025 | 40 s | 259 | [Piano MIDI](https://www.freepianotutorials.net/2025/12/sombr-undressed-piano-tutorial.html) |
| Anxiety | Doechii | 2025 | 25 s | 247 | [Piano MIDI](https://www.freepianotutorials.net/2026/01/doechii-anxiety-piano-tutorial.html) |
| Houdini | Dua Lipa | 2023 | 45 s | 245 | [Piano MIDI](https://www.freepianotutorials.net/2025/05/dua-lipa-houdini-piano-tutorial.html) |
| Fortnight | Taylor Swift, Post Malone | 2024 | 40 s | 161 | [Piano MIDI](https://www.freepianotutorials.net/2025/04/taylor-swift-post-malone-fortnight.html) |
| Too Sweet | Hozier | 2024 | 50 s | 209 | [Piano MIDI](https://www.freepianotutorials.net/2025/04/hozier-too-sweet-piano-tutorial.html) |
| Messy | Lola Young | 2024 | 60 s | 183 | [Piano MIDI](https://www.freepianotutorials.net/2025/03/lola-young-messy-piano-tutorial.html) |
| Abracadabra | Lady Gaga | 2025 | 0 s | 105 | [Piano MIDI](https://www.freepianotutorials.net/2025/03/lady-gaga-abracadabra-easy-piano.html) |
| That's So True | Gracie Abrams | 2024 | 45 s | 219 | [Piano MIDI](https://www.freepianotutorials.net/2025/01/gracie-abrams-thats-so-true-piano.html) |
| I Think They Call This Love | Elliot James Reay | 2024 | 30 s | 215 | [Piano MIDI](https://www.freepianotutorials.net/2025/05/elliot-james-reay-i-think-they-call.html) |
| I Like the Way You Kiss Me | Artemas | 2024 | 0 s | 260 | [Piano MIDI](https://www.freepianotutorials.net/2024/07/artemas-i-like-way-you-kiss-me-piano.html) |
| Carry You Home | Alex Warren | 2024 | 40 s | 382 | [Piano MIDI](https://www.freepianotutorials.net/2025/12/alex-warren-carry-you-home-piano.html) |
| we can't be friends | Ariana Grande | 2024 | 50 s | 96 | [Piano MIDI](https://www.freepianotutorials.net/2024/12/ariana-grande-we-cant-be-friends-piano.html) |

## Qayta yaratish va aniqlik

`data/piano-modern-7.37.json`da manba URL, asl fayl SHA-256 qiymati va parcha boshi mavjud. `public/piano/modern-7.37/manifest.json`da hosil qilingan har bir MIDI SHA-256 qiymati, nota soni va vaqt oralig‘i qayd etilgan. `src/piano-modern-ready.js` shu tekshirilgan MIDIlarning ixcham nota hodisalarini saqlaydi. Ijro va o‘rganish bir xil notalardan foydalanadi; qo‘shiq nomlari ostida o‘ylab topilgan melodiya ishlatilmagan.

MIDI aranjirovkasining birinchi notali yo‘li o‘ng, ikkinchisi chap qo‘l sifatida o‘qiladi. Bu yondashuv Do4 chegarasidan o‘tadigan haqiqiy melodiya notalarini saqlaydi. Ikki yo‘l bitta MIDI kanalidan foydalansa ham, bir xil balandlikdagi ustma-ust notalar har bir yo‘l ichida to‘g‘ri yakunlanadi. Eksportdagi 1-kanal — o‘ng, 2-kanal — chap qo‘l. Standart piano temperatsiyasi ishlatiladi. Parcha boshida avval bosilgan, hali tugamagan notaning qolgan qismi ham saqlanadi. Eksport 480 PPQ bo‘lgani sababli eng chekka vaqt farqi bir MIDI tickdan oshmaydi.

Qayta yaratish ixtiyoriy: `node scripts/build-modern-piano.mjs --source-dir /absolute/source-midi-folder` yoki `node scripts/build-modern-piano.mjs --fetch`. Oddiy `npm ci` / production build MIDIlarni internetdan yuklamaydi.

## Manba huquqlari

Asarlar va aranjirovkalar o‘z huquq egalariga tegishli. Manbada bepul MIDI yuklab olish taqdim etilgan; bu zamonaviy aranjirovkalar CC0, jamoat mulki yoki Creative Commons litsenziyasida deb ko‘rsatilmagan. Bepul yuklab olish alohida qayta tarqatish yoki tijoriy foydalanish litsenziyasi sifatida ko‘rsatilmaydi. Avvalgi Bella Ciao (CC0) va SymbTr (CC BY-NC-SA 4.0) ma’lumotlari o‘z oldingi manba shartlari bilan saqlangan.
