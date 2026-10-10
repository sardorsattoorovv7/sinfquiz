# SinfQuiz 7.30 tekshiruvlari

- `npm test`: 170/170 o‘tdi, xato va tashlab ketilgan test yo‘q.
- `npm run build`: o‘tdi. Lucide paketidagi `use client` haqidagi bundler eslatmalari buildni to‘xtatmadi.
- Haqiqiy Chromium 133/WebGL, Vite dev va production preview: model, teksturalar, kamera, zoom, klaviatura, yorug‘/tungi rejim, beshta ekran kengligi tekshirildi.
- Productiondagi 390 px yangi ochilishda yengil GLB ishlatilishi tekshirildi.
- Navigatsiya: 320, 390, 768, 1024, 1280, 1600, 1920 px; olti fan tugmasi ko‘rinadi va bosiladi.
- 6 xonali kod bilan mehmon oqimi, noto‘g‘ri kod xabari, faoliyatdagi kirish cheklovi, sekin auth javobi, menyu Escape, reduced motion, JavaScriptsiz fan sahifalari tekshirildi.
- WCAG 2.2 bo‘yicha axe: olti tekshiruv, avtomatik aniqlangan buzilish yo‘q.
- Materiallarning eski qo‘llanmaydigan formati olib tashlangan; teksturalar mahalliy, GLB ichida, fayl uzunligi va SHA-256 mos.
- Matematika, kimyo, biologiya, Python/Office, SQL ruxsatlar, quiz/race/typing/competition bo‘yicha mavjud Node tekshiruvlari o‘tdi.

Hisobotlar: `qa-7.30/browser.json`, `qa-7.30/navigation/island-browser.json`, `qa-7.30/navigation/accessibility.json`. Ekran tasvirlari `qa-7.30/SinfQuiz-v7.30-Desktop.webp` va `qa-7.30/SinfQuiz-v7.30-Mobile.webp`.

## Qayta tekshirish

`npm test`, `npm run build`. Playwright/Chromium o‘rnatilgan muhitda `npm run test:e2e:island` ishlatiladi. Standart Chromium topilmasa CHROME_EXECUTABLE bilan uning yo‘lini bering. Production sinovi: `QA_PRODUCTION=1 node tests/garden-browser.cjs`.

## Tekshiruv chegarasi

Auth/API transporti mahalliy fixture bilan tekshirildi, 3D esa haqiqiy renderer va haqiqiy mahalliy GLB edi. Jonli Supabase akkauntlari/Vercelga yozish amalga oshirilmadi. Chromium dasturiy WebGL ishlatdi; bu haqiqiy telefondagi FPS yoki 30–40 o‘quvchi yukini o‘lchamaydi. Barcha qurilmalarda bir xil tezlik kafolatlanmaydi. Avtomatik aylanish o‘chiq bo‘lganda sahna faqat kamera/yoritish/o‘lcham o‘zgarsa qayta chiziladi.
