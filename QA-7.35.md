# SinfQuiz 7.35.0 — performance va regressiya tekshiruvi

## Production fayllari o‘lchovi

Taqqoslash bazasi — topshirilgan 7.34.0 to‘liq ZIP. U alohida katalogga ochilib, xuddi shu o‘rnatilgan dependency versiyalari bilan qayta production build qilindi. So‘ng ikkala `dist/index.html`dagi lokal script, modulepreload va stylesheet fayllarining haqiqiy baytlari solishtirildi. KB = 1000 bayt.

| Dastlabki sahifa resursi | 7.34.0 | 7.35.0 | Kamayish |
| --- | --- | --- | --- |
| JavaScript | 879.1 KB | 583.5 KB | **33.63%** |
| JavaScript, gzip taxmini | 257.7 KB | 171.6 KB | 33.41% |
| JavaScript, Brotli taxmini | 215.9 KB | 147.4 KB | 31.73% |
| CSS | 372.7 KB | 314.4 KB | **15.64%** |
| CSS, gzip taxmini | 66.3 KB | 55.3 KB | 16.48% |

Siqilgan hajmlar Node zlib bilan hisoblangan takrorlanuvchi taxmindir. Ular Vercel javobining yoki real brauzer yuklanishining o‘lchovi emas. Atlas, Python, inglizcha audio va boshqa keyin ochiladigan resurslar dastlabki HTML grafigiga qo‘shilmagan. **Realdagi sekund, LCP, INP, FPS yoki Lighthouse ballari o‘lchanmagan.**

## Bajarilgan tekshiruvlar

| Tekshiruv | Natija |
| --- | --- |
| `npm test` | **290/290 o‘tdi**, xato 0; 64.90 soniya |
| Production Vite build | Muvaffaqiyatli |
| `npm run perf` mezonlari | O‘tdi: JS ≤ 650 KB / gzip ≤ 200 KB; CSS ≤ 380 KB / gzip ≤ 75 KB |
| Ajratilgan funksiyalar | 36 ta funksiya tanasi avvalgi manba bilan bir xil; modul yo‘llari joylashuvga moslashtirilgan |
| Python runtime’ni bo‘sh katalogda tiklash | 5/5 fayl dependency manbasi bilan baytma-bayt bir xil, jami 12,285,651 bayt |
| SQL, savol ma’lumotlari va fan sahnalari | 7.34.0 bilan solishtirildi: 69 SQL, 35 data, 28 model/sahna manbasi va Audio Labirintning 3 fayli o‘zgarmagan |
| ZIP | CRC, yagona nomlar, manba fayllari va faqat qayta yaratiladigan beshta runtime faylining chiqarilgani tekshirildi |

Yangi UI testida katalog so‘rovi ataylab tugatilmay turdi: ustozning bosh sahifasi va navigatsiyasi ochildi; boshqaruv paneli esa ma’lumot kelguncha kutdi. Javob kelgach mavjud testlar paneli ochildi.

Canvas testi 60 ta sun’iy idle frame’da faqat birinchi chizish bajarilishini; o‘lcham va rang rejimi o‘zgarsa qayta chizilishini; ijro boshlansa vaqt slayderi yurishini va chizish har bir display frame’da takrorlanmasligini tekshirdi. Bu haqiqiy qurilmada FPS sinovi emas.

Mavjud funksional to‘plam barcha kirish rollari, olti xonali kod, test, natijalar va rank, darsliklar, typing, 1v1, fan modellari, SQL ruxsatlari, Paper Workshop, Audio Labirint, Bella Ciao, turkcha MIDI bog‘lash va piano audio transportini qamrab oladi. Jonli Supabase/Vercel hisoblari yoki production bazaga yangi yozish bajarilmadi.

## Brauzer tekshiruvi chegarasi

Sinovlar Node/JSDOM va production build muhitida bajarildi. Jonli telefon, tarmoq tezligi, viewport/overflow va fizik audio/MIDI tekshiruvi bajarilmadi. Amaldagi [Sites SKILL.md](skill://plugin_connector_1p_689987207de08191979cf68eca2941c6/sites/SKILL.md): “If `$control-browser` is unavailable, skip browser QA”. Bu boshqaruv mavjud bo‘lmagani uchun preview server yoki boshqa browser yo‘li qo‘llanmadi.

## Qayta o‘lchash

```sh
npm run build
npm run perf
```

`scripts/measure-performance.mjs` haqiqiy build fayllarini o‘qiydi. `PERFORMANCE-7.35.json` oldin/keyin o‘lchovlarini saqlaydi. Vite’ning Lucide `use client` ko‘rsatmasi haqidagi mavjud ogohlantirishi build’ni to‘xtatmadi.
