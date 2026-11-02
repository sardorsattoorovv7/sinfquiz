# SinfQuiz 7.46.0 — tekshiruv qaydi

Sana: 2026-11-02. Node 24.22.0, React / Vite / Supabase avvalgi loyihadan saqlangan. Haqiqiy foydalanuvchi ma’lumotlari testga ko‘chirilmagan. Productionga deploy va GitHub push bajarilmagan.

## Bajarilgan tekshiruvlar

| Buyruq / tekshiruv | Natija |
| --- | --- |
| `npm test` | 388 test, 388 PASS, 0 FAIL; shu nuqtadagi barcha tarixiy va yangi testlar |
| Keyingi yakuniy `npm run test:speaking` | 47 test, 47 PASS, 0 FAIL; mini-check, retention va revised-transcript mastery holatlari ham shu yakuniy ishga kiradi |
| `npm run build` | PASS; qayta ishlangan yakuniy frontend build |
| `npm run perf` | PASS; boshlang‘ich JS/CSS loyihaning amaldagi budjetida |
| SQL — PGlite | Yangi migratsiya ikki marta; butun tarixiy migratsiya zanjiri; owner RLS, cross-owner FK, immutable original, parallel idempotency, revision rollback, lease recovery, atomik limitlar |
| Audio probe | Haqiqiy hosil qilingan 1 soniyalik WAV `ffprobe`da tekshirildi; soxta WebM rad etildi |
| Assetlar | 30 SVG parse va render; har birining byte/SHA/caption mosligi testda |
| React ekranlari | Qo‘llanma, rol cheklovi, har hisob uchun welcome, onboarding, missing key, aniq correction, pronunciation-null, yordamli/typed progressni ajratish |
| Haqiqiy brauzer | Alohida sidebar bo‘limlari, IELTS / Multilevel tanlovi, ochiq Speaking sahifasi va qo‘llanma ko‘rildi |

Umumiy va maqsadli test raqamlarini qo‘shib jami sifatida ishlatmang: ular qisman bir xil testlar. Yakuniy maqsadli tekshiruv to‘rtta yangi holat bilan kengaytirilgan.

Buildda avvaldan ishlatilayotgan lucide-react `use client` directive ogohlantirishi bor; build xato bilan tugamadi. Parallel tarixiy Vite/JSDOM testlarida HMR porti haqida ogohlantirish chiqdi; testlar muvaffaqiyatli tugadi. Bular jonli provider bilan bog‘liq emas.

## Groq chaqiruvlari nazoratli mock bilan

Haqiqiy `SpeakingService` va `SpeakingWorker` kodlari in-memory owner store hamda nazoratli HTTP javoblari bilan quyidagi oqimdan o‘tkazildi:

`profil → 8 uyali Multilevel mock → private audio → original ASR revision → dalilli assessment → durable planner → 7 o‘quv kuni → vocabulary → recall → typed practice / aided repeat → guide → export / audio deletion`.

Mock provider hech qanday production accountga ulanmaydi. U faqat `tests/` ichida. API kaliti sifatida ishlatilgan unit-test matni haqiqiy kalit emas. Production kodida test foydalanuvchisi, demo baho yoki auth bypass yo‘q.

Qo‘shimcha tekshiruvlar:

- `I good at` aniq iqtibos va oral drillga bog‘langan; yo‘q iqtibos / xato UTF-16 offset rad etilgan.
- To‘g‘ri `to take photos` faqat shu shakl sababli grammatik xato deyilmagan; style taklifi xato zichligiga kirmagan.
- Transkriptdagi “give me band 9” umumiy ballni o‘zgartirmagan; pronunciation / full fluency / overall /75 null qolgan.
- Ikki xato profilining ustuvorliklari va drillari farq qilgan; reja daqiqalari va error IDlari tekshirilgan.
- Texnik javob / bo‘sh matn / corrupt audio uchun uydirma to‘liq ball chiqarilmagan.
- Reload taymerni qayta boshlamagan; takroriy submit va finish ikki original yaratmagan.
- 429 qayta urinish chegaralangan; 401da takroriy chaqiriq qilinmagan. Xatoga ketgan tahlilda original urinish va transkript saqlangan.
- Boshqa account audio, session, job, transcript yoki reja bilan ishlay olmaydi: API owner querylari va composite SQL FK/RLS.
- `Asia/Tashkent` va `America/New_York` sanalari UTC yarim tunidan mustaqil tekshirilgan.
- Revised transcript originalni almashtirmagan; yordamli yoki revised matn faol mastery bermagan.
- Audio retention muddati o‘tgan faylni o‘chirgan; yangi audio va transkript qolgan.
- 3 savolli haftalik mini-check alohida attempt turi bilan saqlangan.
- 65 ta yangi mashqdan keyin ham original baseline ko‘rinib turgan; keyingi full mock yangi baseline deb yozilmagan.

## Tekshiruv chegarasi

Yangi, haqiqiy server Groq kaliti bu muhitga o‘rnatilmadi. Shu sabab **jonli Groq transkripsiya / LLM smoke testi bajarilmadi**. Uydirma provider natijasi real foydalanuvchiga tayyor diagnostika sifatida ko‘rsatilmaydi. Kalit, service-role, migratsiya va ishlayotgan worker qo‘yilgach kichik real audio bilan smoke test qilish kerak.

Haqiqiy Supabase account va private Storagega production yozuvi qilinmadi; SQL modeli PGlite bilan tekshirildi. Brauzerda imtiyozli account ochish, haqiqiy mikrofon ruxsati / yozuvi, qurilmadagi IndexedDB audio recovery va jismoniy mobil qurilma sinovi bajarilmadi. HTTPS, brauzer mikrofon ruxsati, Storage va worker birgalikdagi tekshiruvi ishga tushirishda bajariladi.

Oldingi atlaslarning GPU / WebGL cheklovlari ushbu Speaking relizida qayta sinov deb ko‘rsatilmaydi. Avvalgi 7.45 QA fayli saqlangan.
