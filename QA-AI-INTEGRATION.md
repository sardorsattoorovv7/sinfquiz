# AI integratsiyasi tekshiruvi — 2026-11-02

## O‘tgan tekshiruvlar

- AI yordamchi, Speaking, worker, audio, runtime va lokal API: **88/88** test. Buyruq: `npm run test:ai` (yoki to‘g‘ridan-to‘g‘ri `node --test tests/ai-*.test.js tests/speaking-*.test.js tests/local-admin-api.test.js`). Natija: `qa-ai-integration/targeted-tests.txt`.
- Ishlab chiqarish build’i: **PASS** (`node scripts/copy-python-runtime.mjs`, `node node_modules/vite/bin/vite.js build`). Lucide paketining `use client` direktivasi haqida bloklamaydigan ogohlantirish mavjud.
- Hajm byudjeti: **PASS**. Boshlang‘ich JS 593748 bayt, gzip 174461; CSS 314436 bayt, gzip 55345.
- Chromium: 1440, 768, 390 va 320 px; uch rejim, suhbat davomi, rolga mos havolalar, javobni ochish, qayta yuborish, bekor qilish va tungi ko‘rinish. Gorizontal overflow va runtime xatosi yo‘q; 6 ta axe accessibility tekshiruvida buzilish yo‘q. Buyruq: `node tests/ai-assistant-browser.mjs`. UI javoblari test fixture; haqiqiy hisoblar o‘zgartirilmagan.
- Jonli Groq: `openai/gpt-oss-20b` bilan yo‘lko‘rsatish, mavzu tushuntirish va 3 savolli mashq tekshirildi. `whisper-large-v3` ochiq mahalliy inglizcha namunadagi 25.632 soniya audioni 71 so‘zga transkripsiya qildi. Natija: `qa-ai-integration/live-smoke.json`.
- Haqiqiy `openai/gpt-oss-120b` bilan Speaking worker sintetik yozma javobni tahlil qildi: 2 tekshirilgan tuzatish, aniq asl iqtiboslar, overall va talaffuz bahosi `null`. Faqat xotiradagi test bazasi ishlatildi; production yozuvlari o‘zgarmadi. Modelning mezon nomlari va UTF-16 pozitsiyalari bilan bog‘liq jonli xatolar tuzatildi; yo‘q yoki bir ma’noli bo‘lmagan iqtiboslar hanuz rad etiladi. Natija: `qa-ai-integration/speaking-live.json`. To‘liq ko‘p savolli mock, jonli roadmap va vocabulary bu smoke doirasida provayderda bajarilmadi; ularning jarayoni fixture testlarida tekshirildi.
- Jonli Supabase: autentifikatsiya, server kaliti, `sq_sp_records`, `sq_sp_jobs` va private `speaking-private` bucket ishlaydi. Bundled ffprobe haqiqiy WAV davomiyligini tekshirdi.
- `/api/ai-assistant` va `/api/ai-speaking` GET 200 va sozlangan provider holatini qaytardi; hisobsiz yordamchi POST 401 qaytardi. Kalitlar `.env.local`da, Git ignore tekshirildi. Kuzatiladigan matn fayllari va browser build’da haqiqiy Groq/Supabase secret kaliti topilmadi.
- Web va Speaking worker bitta launcher orqali ishga tushirildi. Worker bazadagi vaqtinchalik xatodan keyin qayta urinadi.

## Umumiy eski testlar

Butun `npm test` to‘plami to‘liq tasdiqlanmadi: avvaldan qolgan `tests/google-token.test.js` o‘rnatilmagan `jose` modulini import qiladi; keyinchalik umumiy jarayon yakunlanmay qoldi va to‘xtatildi. Alohida `tests/vercel.test.js:48` ham mavjud eski `firestore.rules` fayli yo‘q bo‘lishini kutadi va xato beradi. Ushbu integratsiya eski Firebase fayllarini o‘chirmadi yoki Google login dependency’larini o‘zgartirmadi.

Bu kompyuterda PowerShell `npm.ps1` siyosati va sandboxdagi Corepack cache cheklovi sabab tekshiruvlar ekvivalent to‘g‘ridan-to‘g‘ri Node buyruqlarida bajarildi. Npm paket o‘rnatish va jonli tashqi tekshiruvlar ruxsat bilan bajarildi.

Hostingga avtomatik deploy qilinmagan. Vercel muhitiga server kalitlari va alohida doimiy Speaking worker kerak; qarang `AI-INTEGRATION.md`.
