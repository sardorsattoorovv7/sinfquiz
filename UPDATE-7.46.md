# SinfQuiz 7.46.0 — AI Speaking va AI yo‘lko‘rsatuvchi

Asosiy menyuda ikkita alohida bo‘lim: **AI Speaking** (`/#ai-speaking`) va **AI yo‘lko‘rsatuvchi** (`/#ai-yordamchi`). Avvalgi atlaslar, darslar va foydalanuvchi ma’lumotlari saqlanadi.

## Foydalanish

1. O‘z SinfQuiz hisobingizga kiring. IELTS yoki CEFR / Multilevel yo‘nalishini tanlang.
2. Maqsad, kunlik 20 / 40 / 60 daqiqa, o‘qish kunlari, vaqt zonasi va ixtiyoriy imtihon sanasini saqlang. Hozirgi daraja oldindan tayinlanmaydi.
3. Mikrofonni 10 soniya tekshiring va yozuvni tinglang. Sinov audiosi faqat shu qurilmada qoladi, AIga yuborilmaydi.
4. Audio va Groq tahlili haqida rozilikni tasdiqlab, to‘liq boshlang‘ich mockni bajaring. Savol ochilishi bilan server taymeri boshlanadi; reload vaqtni qaytarmaydi. Tayyorlanish vaqtida mikrofon hali yozmaydi.
5. Har yozuvni tinglab, **Audioni yuborish**ni bosing. Uzilishda shu hisobga tegishli qurilma nusxasi orqali qayta yuborish mumkin. Texnik muammo yoki javobsiz o‘tish natijada alohida qayd qilinadi.
6. Mockni tugatib, tahlilga yuboring. Sahifani yopish serverdagi ishni yo‘qotmaydi. Navbat / ishlanmoqda / tayyor / xato / bekor qilingan holatlari ko‘rinadi.
7. Hisobotda original transkript, aniq iqtibosli tuzatish, qisqa drill va rivojlantirilgan namuna bor. ASR xatosini tuzatish yangi transkript va yangi tahlil yaratadi; original boshlang‘ich natija o‘zgarmaydi.
8. **Bugungi reja**, **Shaxsiy yo‘l**, **Iboralar**, **Xatolarim** va **Mashq**dan foydalaning. Avval mustaqil javob, keyin ikki muhim tuzatish, qayta aytish va boshqa yangi savol.
9. **Progress** bir xil format, rubric va topshiriq guruhidagi mustaqil audio urinishlarni ko‘rsatadi. Yozma mashq va yordamli qayta aytish alohida saqlanadi.

6 ta original IELTS va 6 ta original Multilevel mock, 54 ta qo‘shimcha transfer savoli bor. IELTSning qisqa savollari 4–5 daqiqalik bo‘lim vaqti ichidagi bank; har biriga qat’iy 30 soniya belgilanmaydi. Multilevel: 3 × 30 soniya; rasmli 45 / 30 / 30 soniya; Part 2 va Part 3 uchun 60 soniya tayyorgarlik + 120 soniya javob. Part 2dagi uch savol birga, Part 3dagi FOR / AGAINST ro‘yxatlari birga ochiladi. 12 juftlik va 6 kontekst uchun jami 30 ta original mahalliy SVG bor; ular rasmiy imtihon fotosurati emas.

Haftalik **mini-tekshiruv** 3 yangi savolni birlashtiradi; uning natijasi to‘liq mockdan alohida guruhda saqlanadi. Keyingi mini-check va full mock sanalari o‘qish jadvalingizga mos ko‘rsatiladi.

## AI yordamchi

Kirishdan keyin birinchi tanishuv kartasi chiqadi. **Menga yo‘l ko‘rsating** alohida qo‘llanmani ochadi; burchakdagi **Yordamchi** keyin ham ochiladi. Har bo‘limning tekshirilgan qadamlari, qidiruv, AIga savol berish va bevosita bo‘limga o‘tish tugmalari bor. Yordamchi faqat mavjud yo‘llarni tavsiya qiladi. O‘quvchiga ustoz paneli tavsiya qilinmaydi. Atlas yoki Speakingdan kelganda shu bo‘lim tanlanadi.

AI ishlamasa tekshirilgan qo‘llanma ochiq qoladi; bu javoblar AI yaratgan deb ko‘rsatilmaydi. AI suhbatlari hisobga bog‘lanadi. Speaking audio va transkriptlari yo‘lko‘rsatuvchi so‘roviga qo‘shilmaydi.

## Mavjud 7.31–7.45 loyihani yangilash

1. Amaldagi `.env.local`, Supabase loyiha va foydalanuvchilarni saqlang; yangi kod bilan almashtiring.
2. Supabase SQL Editor’da **supabase-migration-7.46.sql**ni to‘liq RUN qiling. U qo‘shiluvchi, qayta qo‘llash mumkin bo‘lgan migratsiya; eski `documents` va fan jadvallariga tegmaydi. Yangi o‘rnatishda barcha fayllarni `migration-chain.json` tartibida bajaring.
3. `npm ci` bajaring. Qo‘shimcha npm paketi yo‘q. Node.js kamida 22.12 kerak.
4. Web/API va worker muhitlariga quyidagi server qiymatlarini kiriting. Eski suhbatga yozilgan kalitni ishlatmang; yangi kalit serverda bo‘lsin.

| Muhit qiymati | Vazifasi |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Avvalgi brauzer hisob tizimi |
| `SUPABASE_URL` yoki `VITE_SUPABASE_URL` | Server / worker uchun o‘sha Supabase loyiha |
| `SUPABASE_SERVICE_ROLE_KEY` yoki `SUPABASE_SECRET_KEY` | Faqat server va worker; hech qachon `VITE_` bilan emas |
| `GROQ_API_KEY` | Yangi Groq kaliti; faqat server va worker |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` |
| `GROQ_ASSESSMENT_MODEL` | `openai/gpt-oss-120b` |
| `GROQ_PRACTICE_MODEL` | `openai/gpt-oss-20b` |
| `GROQ_TRANSCRIPTION_MODEL` | `whisper-large-v3` |
| `GROQ_PRACTICE_TRANSCRIPTION_MODEL` | `whisper-large-v3-turbo` |
| `SPEAKING_FFPROBE_PATH` | Workerda `ffprobe` yoki uning to‘liq yo‘li |
| `SPEAKING_AUDIO_RETENTION_DAYS` | Standart `30`; 1–365 kun |

Model qiymatlari ko‘rsatilmasa shu standartlar olinadi. Barcha limitlar `.env.example`da: upload 20 MB, kunlik foydalanuvchi / sayt so‘rov, token, audio va upload hajmi limitlari. Retry xarajati konservativ ravishda hisoblanadi. Foydalanuvchidan API kaliti so‘ralmaydi.

5. Webni va **alohida doimiy Node worker**ni ishga tushiring:

```bash
npm run dev
```

Boshqa terminal / server jarayonida, shu loyiha va shu muhit bilan:

```bash
npm run worker:speaking
```

Vercel API so‘rovlari faqat yozuv va navbatni boshqaradi. Uzun audio / AI ishlarini Vercel requesti ichida bajarmaydi. Worker VPS yoki Node konteynerda doimiy jarayon bo‘lib ishlashi, `ffprobe` o‘rnatilgan bo‘lishi, Supabase va Groq bilan HTTPS aloqasi bo‘lishi kerak. Worker qayta ishga tushsa navbat bazadan davom etadi. PM2/systemd kabi odatiy jarayon boshqaruvchisida yuqoridagi worker buyrug‘ini qayta boshlash bilan ishlating; kalitlarni repozitoriyga qo‘shmang.

Bir ish / retention tekshiruvi:

```bash
node --env-file=.env.local scripts/speaking-worker.mjs --once
node --env-file=.env.local scripts/speaking-worker.mjs --cleanup
```

Doimiy worker audio muddatini har 10 daqiqada tekshiradi. `--cleanup` faqat muddati tugagan private audiolarni o‘chiradi; transkript saqlanadi. `--once` ham retention tekshiruvidan so‘ng bitta navbat ishini oladi.

Mikrofon ishlab turgan sayt uchun HTTPS kerak. Oddiy lokal `localhost` ham brauzerda ishlashi mumkin; boshqa oddiy HTTP hostda mikrofon ochilmaydi. Production hostingni ushbu paket o‘zi o‘zgartirmaydi.

## Baholash va maxfiylik

Talaffuz evaluatori yo‘q. Shuning uchun **pronunciation, to‘liq fluency, overall IELTS Speaking bandi va UZBMB /75 doimo null**. Yetarli mustaqil matn bo‘lsa IELTS grammatika / lug‘at mezonlari faqat transkript bo‘yicha taxmin sifatida ko‘rsatilishi mumkin. Multilevel rasmiy raqamli shkala yoqilmagan. Matn profili umumiy Speaking sertifikati emas. Qisqa, javobsiz, noaniq ASR yoki buzilgan audio uchun uydirma daraja berilmaydi.

Owner tekshiruvi serverda va SQLda; RLS faqat egasining o‘qishiga ruxsat beradi. Javob, transkript, hisobot va review original yozuvlari almashtirilmaydi. Model javobidagi begona ID, mavjud bo‘lmagan iqtibos yoki qo‘llanmada yo‘q route rad qilinadi. User matni system promptga qo‘shilmaydi, HTML/SQL sifatida bajarilmaydi.

Private audio qisqa muddatli URL bilan ochiladi. **Tarix va sozlamalar**da audio o‘chirish, Speaking JSON eksporti va barcha Speaking ma’lumotini alohida tasdiqlab o‘chirish bor. JSON eksport audio faylning o‘zini emas, uning metadata va transkriptini oladi. Audio o‘chirilganda transkript / tahlil qoladi; barcha Speaking ma’lumotini o‘chirish ularni ham olib tashlaydi. Boshqa fanlardagi natijalar va SinfQuiz hisobi qoladi.

Iborani ko‘rish yoki “Esladim” belgilash faol o‘zlashtirish emas. `1 / 3 / 7 / 14 / 30` kunlik review va “barqaror” uchun ikki boshqa kun / savolda yangi mustaqil audio dalili — mahsulotning o‘quv siyosati, rasmiy imtihon formulasi emas.

## Tekshirish

```bash
npm test
npm run test:speaking
npm run build
npm run perf
```

Aniq natijalar va tekshirilmagan jonli xizmatlar [QA-7.46.md](QA-7.46.md)da. Manbalar [SPEAKING-SOURCES-7.46.md](SPEAKING-SOURCES-7.46.md)da.
