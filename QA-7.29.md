# SinfQuiz 7.29 — tekshiruv

2026-10-09 kuni ushbu reliz kodida bajarildi. Natijalar `qa-7.29/` ichida, eski reliz hisobotlari o‘z papkalarida saqlangan.

| Tekshiruv | Natija |
| --- | --- |
| `npm test` | 168 / 168 o‘tdi; xato yoki o‘tkazib yuborilgan test yo‘q |
| `npm run build` | Muvaffaqiyatli |
| GLB validator | 0 error, 0 warning; 2 information yozuvi |
| Artist asset | Aynan tanlangan UID, 735 292 bayt, to‘liq GLB, SHA-256 va ichki teksturalar tekshirildi |
| Animatsiya | 28 kanal, 11 nishon; har bir nishon ostidagi geometriya asli bilan teng |
| Chiziladigan meshlar | 304 → 23 (oraliq bosqich 230); shakl uchburchaklari soddalashtirilmagan |
| Haqiqiy 3D | WebGL canvas, GLB, Meshopt dekoderi va muallif animatsiyasi fixture bilan almashtirilmagan |
| Kamera | Chap/o‘ng, yaqin/uzoq, tiklash, erkin aylantirish va klaviatura ishladi |
| Vaqt | Tashkent 17:00 → shom; shu paytdagi New York 08:00 → kunduz; oldindan ko‘rish va qayta yuklash saqlandi |
| Harakat | Pause holatidagi piksellar o‘zgarmaydi; davom ettirilganda o‘zgaradi; OS reduced-motion va ekran tashqarisida render to‘xtaydi |
| Qurilma o‘lchamlari | 320, 390, 768, 1024, 1280, 1600, 1920 px; gorizontal overflow va fan tugmalari ustini yopish aniqlanmadi |
| Accessibility | 22 ta WCAG 2.2 A/AA tekshiruvida aniqlangan buzilish yo‘q |
| Loading/fallback | Model so‘rovi ushlab turilganda kod va auth navigatsiyasi ishladi; 404 dan qayta urinish real GLBni ochdi |
| Trafikni tejash | Bosilmaguncha model ham, 3D modul ham yuklanmadi; tanlangach past grafik budjeti bilan ochildi |
| Resurslarni bo‘shatish | Yengil rejimga o‘tganda canvas olib tashlandi; sahnadan chiqishda fetch bekor qilinadi |
| Mavjud oqimlar | Kod bilan mehmon kirishi, auth gate, qidiruv, profil/chat navigatsiyasi, tungi rejim, ustoz paneli |
| Mavjud fanlar | Uchburchak 20 → 25 hisobi, kimyo ish stoli, haqiqiy 3D labirintning matn rejimi, to‘rtta fan darsliklari |
| Production preview | Hashli JS modul va lokal GLB 200; real 3D, kamera, auth gate va JSsiz ommaviy fan sahifalari ishladi |
| Runtime xatolari | Browser hisobotlarida 0 |

GLB validatorning information yozuvlari: validator `EXT_meshopt_compression` kengaytmasini tekshira olmasligi va muallif animatsiyasidagi bo‘sh tugun. Meshopt fayli amalda Three.js dekoderi bilan ochib, piksellar va boshqaruvlar orqali tekshirildi. Build’dagi Lucide `use client` direktivasi ogohlantirishi SPA build’ni to‘xtatmadi.

## Sinov chegarasi

Brauzer: Chromium 133, konteynerdagi software WebGL. Fizik telefon, alohida GPU, haqiqiy mobil internet yoki jonli Vercel/Supabase tizimida benchmark o‘tkazilmadi. Grafik piksel budjeti va FPS cheklovi tekshirildi; ular barcha qurilmalarda bir xil FPSga kafolat emas. Rendererning `drawMs` qiymati GPUning to‘liq ish vaqti sifatida talqin qilinmaydi.

Auth/API transportlari fixture ishlatdi. UI, navigatsiya, modellar, chizmalar, hisoblar, GLSL va kamera haqiqiy. Auth gate tekshirildi; jonli hisob yaratish, ustoz ma’lumotlarini o‘zgartirish yoki production SQL ishlatish bajarilmadi. Mavjud RLS va API kodining o‘zgarmagani fayl hashlari orqali tasdiqlanadi.

## Qayta tekshirish

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e:island
npm run test:e2e:studio
node tests/island-production-browser.cjs
```

Tizim Chromium’idan foydalanish uchun `CHROME_EXECUTABLE`ni uning to‘liq yo‘liga belgilang. PowerShell’da `$env:CHROME_EXECUTABLE = 'C:\...\chrome.exe'` usulidan foydalaniladi. Brauzer testlari localhostdagi alohida portlarda ishlaydi.

Arxivning CRC va fayllar SHA-256 tekshiruvi hamda oldingi relizdagi barcha fayllarning saqlanishi paketlash vaqtida tekshiriladi. `ARCHIVE-MANIFEST-7.29.json` shu relizning to‘liq fayl ro‘yxatini beradi.
