# SinfQuiz 7.21 — Biologiya: tayyor 3D modellar

Biologiya atlasida organlar, skelet va mushaklar tayyor anatomik sirt modellari bilan almashtirildi. O‘simlik va gulda teksturali modellar, zoologiyada baliq, qush va tulki modellari ishlatiladi. Kamera, qatlamlar, qismlarni tanlash, o‘pka kesimi va amaliy ishlarning vaqt boshqaruvi ishlaydi. 7.20.1 dagi kimyo qo‘llanmasi va boshqa fanlar ham arxivga kiritilgan.

## O‘rnatish

1. ZIPni to‘liq oching. Loyiha `sinf-quiz` papkasida joylashgan; `package.json` versiyasi **7.21.0**.
2. Avvalgi loyihangizdagi `.env` faylini saqlang. Uni Gitga qo‘shmang. Yangi fayllarni loyihangizga ko‘chiring; `src` bilan birga **`public/biology/v7.21`** papkasi ham bo‘lishi shart.
3. Node.js 22.12 yoki yangirog‘i bilan terminalda bajaring:

   ```sh
   npm install
   npm run dev
   ```

4. Saytda **Biologiya atlasi → Odam tanasini qatlamlarda ochish** bo‘limini oching. Skelet/mushak qatlamlarini tanlang, organ nomiga bosing, yaqinlashtiring va ichki tuzilma kesimini o‘zgartiring.
5. **Nafas: diafragma va o‘pka**, o‘simlik o‘sishi, gul, yashash muhiti va oziq zanjiri sahnalarini tekshiring. Vaqt shkalasi modelning o‘zini o‘zgartiradi; pauza harakatni to‘xtatadi.

## Ma’lumotlar bazasi

**7.21 uchun yangi SQL migratsiyasi kerak emas.** Yangi modellar statik fayllar sifatida berilgan. Mavjud Supabase Auth, biologiya topshiriqlari, natijalar va o‘qituvchiga tegishli kontent ruxsatlari ishlatiladi. Ishlayotgan 7.20/7.20.1 bazasini qayta yaratmang.

Agar biologiya jadvallari hali o‘rnatilmagan bo‘lsa, avval mavjud `UPDATE-7.18.md` va keyingi yangilash yo‘riqnomalaridagi tartibni bajaring. Arxivda oldingi SQL fayllari saqlangan.

## Vercel

`npm run build` bilan tekshiring, keyin yangilangan kodni deploy qiling. Avvalgi Supabase environment qiymatlari kerak. Modellar tashqi CDNdan olinmaydi; ular `/biology/v7.21/` manzilida saytning o‘zidan keladi. `vercel.json` bu versiyalangan fayllarni keshlaydi. GLB ichidagi teksturalar uchun `img-src` va `connect-src`da `blob:` ruxsati bor; script va worker cheklovlari kengaytirilmagan.

Fayl topilmasa yoki 3D ishlamasa, **Izohli chizma** ochiq qoladi. **3Dni qayta ochish** xato so‘rovni qaytadan yuboradi. Qayta urinish uchun sahifadan chiqish shart emas.

## Nima tayyor model, nima ta’limiy sxema?

- Organlar, suyaklar va mushaklar: BodyParts3D sirtlari; o‘pkaning tashqi sirtlari: HuBMAP.
- O‘simlik va gul: Poly Haven teksturali modellar; tuproq sahnasidagi stilizatsiyalangan o‘simlik/zamburug‘: Kenney.
- Baliq va tulki: Khronos namunalar to‘plamidagi tayyor modellar; qush: Mesh2Motion.
- Ildizlar, oziqa yo‘li, signal, hujayra va molekula belgilarida o‘quv sxemasi saqlangan. Ayrim hayvon guruhlari va hayot davri bosqichlari ham umumlashtirilgan sxemada ko‘rsatiladi. Ular haqiqiy skan sifatida berilmaydi.

Batafsil manba, litsenziya va moslashtirishlar: **BIOLOGY-MODELS-7.21.md**. Amalda bajarilgan tekshiruvlar: **QA-7.21.md**.

## Muhim o‘zgargan fayllar

- `src/BiologyAnatomy.jsx`, `src/biology-anatomy-3d.js` — qatlamli anatomiya, tanlash, kamera va kesim.
- `src/BiologyWorld.jsx`, `src/biology-world-3d.js`, `src/biology-imported-scenes.js` — amaliy ishlardagi modellar va jarayon boshqaruvi.
- `src/biology-asset-loader.js`, `src/biology-asset-catalog.js` — mahalliy GLB yuklash, cheklangan kesh, model nusxalari va resurslarni bo‘shatish.
- `src/BiologyModelSources.jsx`, `src/biology-atlas.css`, `src/biology-content.js` — manbalar, mobil/tungi ko‘rinish va aniqlashtirilgan izohlar.
- `public/biology/v7.21/` — modellar, teksturalar, litsenziyalar va tekshiruv summalari.
- `scripts/build-biology-models.py`, `scripts/extract-biology-lungs.mjs` — tayyor sirtlarni qayta tayyorlash vositalari.
- `tests/biology-assets.test.js`, `tests/biology-ready-models-browser.cjs` — model tarkibi va brauzer tekshiruvlari. Mavjud regressiya tekshiruvlari ham saqlangan.
- `package.json`, `package-lock.json`, `vercel.json` — versiya, kesh va teksturalar uchun CSP.
