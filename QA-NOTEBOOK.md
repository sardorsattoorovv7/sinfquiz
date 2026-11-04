# Ilmiy daftar — implementatsiya va tekshiruv

2026-11-03. Sahifalar, rollar va ma’lumot manbalari: [NOTEBOOK-PAGES.md](NOTEBOOK-PAGES.md).

## Bajarilgan ishlar

- Umumiy rang, tipografika, masofa, sirt, input, tugma, fokus va holat tokenlari `src/paper/paper-tokens.css`da. Light/dark ko‘rinishlar bir xil komponentlardan foydalanadi. Kataklar 24 px va 120 px.
- Bosh sahifada kod formasi birinchi ekranda. Haqiqiy 6 raqamli kod, boshidagi nollar, API xatosi, qayta urinish va yuborish holati saqlanadi. Ikki marta yuborish va yopilgan oynaning kechikkan javobi boshqariladi.
- Fanlar, atlaslar va haqiqiy mashqlarga yo‘llar; ilmiy SVG chizmalar va to‘q ko‘k Speaking paneli. Bosh sahifada jonli Three.js viewer yoki barcha GLB fayllari yuklanmaydi.
- Mehmon/o‘quvchi/ustoz/admin navigatsiyasi, mobil menyu, qidiruv, modal fokusini boshqarish va imtihonda yordamchini yashirish. Ustozning “Test yaratish” tugmasi haqiqiy muharrirni ochadi.
- Kirish, savol/javob/natija, darsliklar, atlaslar, o‘qituvchi paneli va laboratoriyalar umumiy token va modul adapterlariga bog‘landi. Mavjud auth, baholash, marshrutlar va 3D sahnalar saqlandi.
- O‘zbekcha asosiy UI matnlari `src/ui-copy.js`da; Speaking matnlari `src/speaking/copy.js`da. Kompakt “Yordam” mavjud AI xizmatidan foydalanadi.
- Test, milliy test va darslik muharrirlarida saqlanmagan matnni tashlab chiqishni bekor qilish mumkin; sahifani yangilashda brauzer ogohlantiradi. Oddiy ochilgan, o‘zgarmagan forma tasdiq so‘ramaydi.

## Typing belgisi

O‘zbekcha va inglizcha typing matnlari, tarjima/lug‘at satrlari va 7.28 seed to‘plamlarida apostrof ASCII `'` bo‘ldi. Baholashdagi registr, bo‘shliq va boshqa belgilar qoidasi saqlandi.

Ulangan Supabase’dagi `sq_typing_content` jadvalining 7 ta kanonik to‘plami ham yangilandi; tekshiruvda eski apostrofli to‘plamlar soni 0. Avval boshlangan sessiyalar va natijalar o‘zgartirilmagan. Qayd: `qa-notebook/typing-normalization-result.json`. Boshqa mavjud bazaga tatbiq qilish uchun qayta ishlatish mumkin bo‘lgan [SQL patch](supabase-typing-apostrophes.sql) bor. Dizayn uchun yangi schema migratsiyasi kerak emas.

## Tezlik o‘lchovi

Production buildning dastlabki HTML, script, modulepreload va stylesheet resurslari:

| Resurs | Avval | Hozir | Kamayish |
|---|---:|---:|---:|
| JavaScript | 593 748 bayt | 355 760 bayt | 40,1% |
| CSS | 314 436 bayt | 259 027 bayt | 17,6% |
| JavaScript, gzip hisobi | 174 461 bayt | 112 392 bayt | 35,6% |
| CSS, gzip hisobi | 55 345 bayt | 47 821 bayt | 13,6% |

Supabase SDK va ma’lumot provayderi kerak bo‘lganda ochiladi, bir vaqtdagi chaqiriqlar bitta klientni ishlatadi. Practice/course/admin stillari tegishli bo‘lim ochilishiga ko‘chirildi. Ochiq bosh sahifa hisob tekshirilishini kutmaydi; shaxsiy ekranlar auth orqali himoyalanadi.

Bir xil mahalliy production build, sovuq Chromium, 1440 px ekran va hisob so‘roviga ataylab qo‘yilgan 1500 ms kechikish bilan 3 tadan o‘lchov: bosh sahifa sarlavhasi ko‘rinishi medianasi **2375 → 382 ms**. Bu auth kutishini olib tashlashni tekshiradigan laboratoriya natijasi; production tarmoq tezligi yoki umumiy Core Web Vitals kafolati emas. Birinchi kontent chizilishi medianasi 304 → 140 ms; hozirgi o‘lchovda paint entry mavjud bo‘lgan 2 namuna hisoblangan, mavjud bo‘lmagan qiymat JSONda `null`.

Xom natijalar: `qa-notebook/performance-{before,after,delta}.json`, `qa-notebook/startup-{before,after}.json`. Yangi JS/CSS hajm budjetlari ham o‘tdi.

## Tekshirilgan oqimlar

- Build muvaffaqiyatli: `qa-notebook/build.log`.
- Asosiy komponent, navigatsiya, Supabase lazy klient, saqlanmagan forma, typing, haqiqiy SQL baholash va migratsiya zanjiri: **21/21** (`final-foundation-tests.txt`).
- AI yordamchi, timeout, Speaking UI/domain/service: **63/63** (`ai-tests.txt`).
- Kengroq o‘quv UI regressiyasi: **2/2** (`legacy-ui-tests.txt`). Ustoz kirishi, testni nusxalash/saqlash, Office amaliyoti, kod bilan kirish, javob/natija, 1v1, typing, milliy test, ochiq imtihonni davom ettirish va darslik o‘qish.
- Haqiqiy Chromium UI: **33 tekshiruv**, **6 axe auditi**, **0 runtime xatosi** (`browser-results.json`). Mehmon kodi → ism → savol → natija; 360/390/768/1024/1440 px; ustoz muharriri; bekor qilingan menyu/hash navigatsiyasida matnni saqlash; oltita atlas va darsliklar; sinfxona rol cheklovi; kirish/dark ko‘rinishi. Gorizontal overflow topilmadi.
- Speaking brauzeri: **10 ekran/tema kombinatsiyasi**, axe xatosi va overflow 0 (`qa-notebook-speaking/results.json`).
- Namunaviy skrinshotlar `qa-notebook/` va `qa-notebook-speaking/`da.

Brauzer sinovlarida hisob, katalog va imtihon transporti fixture bilan almashtirilgan; UI, formalar va so‘rov yuborishning o‘zi haqiqiy komponentlar orqali bajarilgan. Ushbu bosqichda yangi mikrofon yozuvini real Groq orqali pullik baholash, real hisob bilan to‘liq imtihon va barcha GPU modellari alohida qayta tekshirilmadi. To‘liq repository testlarining barchasi o‘tdi degan da’vo qilinmaydi; yuqorida aniq bajarilgan to‘plamlar keltirilgan. Namunaviy rasm biriktirilmaganligi sabab dizayn yuborilgan matn talablari bilan solishtirildi.

## Ishga tushirish va qayta tekshirish

Node.js 22.12+ va `.env.local` sozlangan muhitda:

```sh
npm ci
npm run ai:check
npm run dev
npm run build
npm run perf
node tests/notebook-browser.mjs
node tests/speaking-notebook-browser.mjs
```

PowerShell `npm.ps1`ni bloklasa, `npm.cmd` ishlating. O‘rnatilgan loyihada bevosita ishga tushirish: `node scripts/dev-ai.mjs`. Mahalliy manzil: `http://localhost:5173`.

Tezlik vaqtini qayta o‘lchash uchun alohida terminalda `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4196`, so‘ng `node qa-notebook/measure-startup.mjs http://127.0.0.1:4196 qa-notebook/startup-check.json`.

Kalitlar `.env.local` va hostingning server environmentida saqlanadi. AI xizmatining mavjud server/worker shartlari [AI-INTEGRATION.md](AI-INTEGRATION.md)da.
