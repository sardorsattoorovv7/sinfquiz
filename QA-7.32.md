# SinfQuiz 7.32.0 — tekshiruvlar

- `npm test`: **277/277**, xato 0.
- Vite production build muvaffaqiyatli; Kino Piano alohida lazy chunk sifatida yig‘ildi.
- Yangi 8 ta test: 38 ta takrorlanmaydigan 30 soniyalik mashq; A440 va A0–C8 geometriyasi; oktava cheklovlari; qo‘llar va birgalikdagi notalar; MIDI import/eksport; sustain va tempo xaritasi; running status; yaroqsiz MIDI; audio soati bilan pause/resume va tezlik.
- React/JSDOM: qidiruv, nota nomlarini yashirish, noto‘g‘ri javob va to‘liq Guide mashqini bajarish, natijani saqlash, MIDI importi va qo‘llanma ochish/yopish tekshirildi.
- To‘liq App integratsiyasi: mehmon, student, teacher va admin `#kino-piano` manzilini ochdi; orqaga tugmasi Mashqlar sahifasiga qaytdi.
- OfflineAudioContext’ga mos JS audio renderer bilan 44.1 kHz stereo signal hisoblandi. Akkord, A0–C8 registrlari va reverb yo‘liga ulangan ovoz holatlarida signal mavjud, qiymatlar finite; o‘lchangan eng katta peak 0.414 dan past. Bu renderer natijasi; real brauzer akustik o‘lchovi emas.
- Sustain bosilganda qo‘yib yuborilgan nota ushlanishi va pedal qo‘yib yuborilganda release holatiga o‘tishi tekshirildi.
- Avval tiklangan `EnglishAudioMaze.jsx`, `ScenicMaze.jsx`, `scenic-maze.css` bazadagi arxiv bilan baytma-bayt bir xil.
- ZIP CRC hamda uning ichidagi har bir fayl ishchi manba bilan solishtiriladi. node_modules, build va vaqtinchalik sinov fayllari arxivga kiritilmaydi.

## Tekshiruv chegarasi

Bu yangilanishda jonli brauzerning vizual/audio sinovi, telefon yoki jismoniy MIDI qurilmasi bilan sinov va production Supabase/Vercel sinovi bajarilmadi. React oqimlari JSDOM orqali, audio signal mos JS renderer orqali tekshirildi. Responsive uslublar yozilgan; real qurilmada yakuniy ovoz va ko‘rinishni tekshirish kerak.

Oldingi versiyalarning QA fayllari avvalgi ishlarning dalili; u yerdagi browser sinovlari ushbu pianino moduli uchun yangi browser sinovi deb hisoblanmaydi.
