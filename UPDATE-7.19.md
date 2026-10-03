# SinfQuiz 7.19 — Biologiya 3D yangilanishi

## Nima o‘zgardi

30 mavzu foydalanadigan 24 sahna turining barchasida boshqariladigan 3D ko‘rinish mavjud. Anatomiya modeli yangilandi; qolgan 23 sahna turi uchun alohida hajmli obyektlar yaratildi. Modelni sichqoncha yoki barmoq bilan aylantirish, yaqinlashtirish, qismini bosib vazifasini o‘qish mumkin. Klaviaturada chap/o‘ng aylantiradi, yuqori/past masofani o‘zgartiradi, Home kamerani tiklaydi.

- Hujayra: devor, membrana, yadro, vakuola, mitoxondriya, xloroplast va qatlamlarni ajratish.
- Barg, tuproq, kompost: hajmli tuproq kesimi, bargning tushishi/parchalanishi, parchalovchi belgilar, suv, CO₂ va mineral oziqa yo‘llari.
- O‘simlik: urug‘, nihol, ildizlar, tomirli barglar, o‘sish, fotosintez, ksilema/floema va gulda chang naychasi.
- Zoologiya: hayvon vakillari, turli tumshuq va ozuqa, hayot davri hamda oziq zanjiri indekslari.
- Odam: qatlamli tana; nafas va diafragma, qon aylanish yo‘li, hazm, bo‘g‘im/mushak, nerv signali, nefron, gormonal aloqa, himoya va hujayra bo‘linishi sxemalari.

Jarayonning 3D holati o‘sha biologik hisoblar va vaqt slayderidan olinadi. Kamerani burish jarayon vaqtini o‘zgartirmaydi. Pauza jarayonni to‘xtatadi. Animatsiya brauzer kadr vaqtiga bog‘landi; taxminan 30 yangilanish/soniya chegarasi qo‘yilgan. Sekin qurilmada haqiqiy tezlik farq qilishi mumkin.

Sahna faqat jarayon, kamera, o‘lcham yoki ko‘rinish o‘zgarganda chiziladi. Bo‘limdan chiqishda GPU resurslari va tinglovchilar tozalanadi. 3D ochilmasa, mavjud interaktiv chizma avtomatik ishlaydi; uni «Izohli chizma» orqali ham tanlash mumkin. 8 soniyalik kutish chegarasi mavjud.

## O‘rnatish

7.18 biologiya migratsiyasi allaqachon bajarilgan bo‘lsa, **yangi SQL kerak emas**. Bu yangilanish frontendga tegishli.

1. Loyiha fayllarini yangilang; o‘zingizning Supabase environment sozlamalaringizni saqlang.
2. `npm ci`
3. `npm run dev` yoki Vercel’da redeploy.
4. Biologiya → mavzu → «3D model». Avval taxmin yozib, sinovni boshlang yoki vaqt slayderini o‘zgartiring.

Agar biologiya 7.18 hali o‘rnatilmagan bo‘lsa, oldingi `supabase-biology-atlas.sql`ni asosiy sxemadan keyin RUN qiling. Mavjud ustoz/admin ruxsatlari va natijalar modeli o‘zgarmadi.

## O‘zgargan fayllar

- `src/BiologyWorld.jsx`: 3D panel, qismlar, kamera, klaviatura va chizma zaxirasi.
- `src/biology-world-3d.js`: 23 turdagi parametrlarga bog‘liq 3D sahna.
- `src/biology-anatomy-3d.js`: tana detali, yorug‘lik, kamera va resurslarni boshqarish.
- `src/BiologyScenes.jsx`: 3D/chizma ulanishi.
- `src/BiologyActivity.jsx`: ravon vaqt boshqaruvi va pauza.
- `src/biology-atlas.css`: mobil/tungi 3D panel.
- Paket versiyasi, browser regressiya testi va ushbu yo‘riqnoma.

## Modellar

Barcha yangi modellar original, koddan quriladigan o‘quv modellaridir. Tashqi GLB/CDN talab qilinmaydi. Anatomik skan yoki fotorealistik model emas. Ranglar va zarracha o‘lchamlari shartli; yangi ilmiy prognoz formulalari kiritilmagan. Ilmiy chegaralar `BIOLOGY-SOURCES.md`da saqlangan.

Three.js (MIT): https://github.com/mrdoob/three.js/blob/dev/LICENSE
Texnik mos yozuvlar: https://threejs.org/manual/pages/rendering-on-demand.html va https://threejs.org/manual/pages/cleanup.html

Tekshiruv natijalari: `QA-7.19.md`.
