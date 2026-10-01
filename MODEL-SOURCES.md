# SinfQuiz 7.14 — 3D model manbalari

## Qal’a va labirint

- Kenney, **Castle Kit 2.0**, 27.03.2024.
- Manba: https://kenney.nl/assets/castle-kit
- Litsenziya: CC0 1.0. Asl litsenziya: `public/models/castle/LICENSE.txt`.
- Mahalliy GLB fayllari: devor, darvoza, minora, daraxt, bayroq va toshlar. Tekstura `Textures/colormap.png` bilan birga berilgan.
- SinfQuiz o‘zgarishlari: o‘lchamni moslash, devorlarni instanslash, yoritish, soyalar va xaritaga joylash. Xaritalar va topshiriqlar mavjud SinfQuiz ma’lumotlaridan olinadi.

## Harakatlanuvchi qahramon

- RobotExpressive — Tomás Laulhé (Quaternius), CC0 1.0.
- Three.js namunasi va muallif ma’lumoti: https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive
- Don McCurdy: yuz ifodalari, FBX2GLTF konvertatsiyasi va materiallar optimallashtirilishi.
- Loyihadagi mavjud `public/models/RobotExpressive.glb` qayta ishlatiladi. Izquvar uchun material rangi o‘zgartirilgan. Idle va Running animatsiyalari yurish holatiga bog‘langan.

## Matematika jismlari

Matematik modellar tasodifiy dekorativ GLB emas: Three.js standart geometriyalari va o‘lchamlarga bog‘langan parametrik yuzalar ishlatiladi. Kub va parallelepipedning oltita yog‘i ilgak bo‘ylab yoyiladi. Prizma — to‘g‘ri burchakli uchburchak asosli; piramida — kvadrat asosli. Kesim rejimidagi to‘q sariq tekislik kesuvchi tekislikni bildiradi.

Three.js: https://threejs.org/docs/ — MIT, litsenziya o‘rnatilgan npm paketida mavjud.

Tashqi model xizmati, API kaliti yoki iframe talab qilinmaydi. Aktivlar sayt bilan birga joylanadi. Matematik dars matnlari uchun oldingi `CONTENT-SOURCES.md` va atlas hujjatlariga qarang.

## 7.16 Kimyo

Kimyo bo‘limi tashqi 3D aktivlardan foydalanmaydi. Fazoviy molekulalar koordinatalardan SVG orqali proyeksiyalanadi; qolgan sxemalar loyiha uchun chizildi. Ilmiy manbalar va cheklovlar: [CHEMISTRY-SOURCES.md](CHEMISTRY-SOURCES.md).
