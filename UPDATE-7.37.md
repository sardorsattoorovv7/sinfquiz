# SinfQuiz 7.37.0 — o‘rnatish va yangilash

Bu oldingi 7.36.0 loyihaning to‘liq yangilangan manbasi.

1. ZIPni yangi bo‘sh papkaga oching.
2. Amaldagi `.env.local` qiymatlaringizni saqlang va shu papkaga ko‘chiring.
3. Node.js 22.12+ bilan `npm ci` bajaring.
4. Lokal foydalanish uchun `npm run dev`; production uchun `npm run build` bajaring. Vercel build buyrug‘i `npm run build`, natija `dist`.
5. Tekshirish: `npm test`, so‘ng builddan keyin `npm run perf`.

Yangi SQL, Supabase sxemasi, environment qiymati yoki dependency qo‘shilmagan. Python runtime fayllari oldingi versiyadagi kabi `npm ci` va build oldidan tayyorlanadi.

## Pianinoda o‘rganish

Mashqlar → Kino Piano → Tayyor hitlar ichidan qo‘shiqni tanlang. “Tinglash” bilan 30 soniyalik parchani eshiting. “O‘rganish” va katta Play tugmasini bosing. Ekrandagi Do4, Re4, Mi4 kabi nomlarni kuzatib, yoritilgan klavishni sensor/sichqoncha bilan yoki ko‘rsatilgan kompyuter harfi orqali chaling. Akkord bo‘lsa barcha ko‘rsatilgan notalarni bosing. “Eshitib ko‘rish” joriy qadamni eshittiradi.

Do=C, Re=D, Mi=E, Fa=F, Sol=G, Lya=A, Si=B. ♯ — yarim ton yuqori qora klavish; raqam — oktava. Audio Lab → Nota yozuvi tanlovi orqali Do–Re–Mi va C–D–E orasida almashing. Tezlikni 0.5× yoki 0.75× qilib sekinlashtirish mumkin.

Yangi 20 ta zamonaviy hit inglizcha pop repertuaridir. Bella Ciao va 20 ta avvalgi turkcha xalq/mumtoz kuy “Xalq va mumtoz” bo‘limida saqlangan. “Mashqlar” va “Meniki” ishlaydi. Yangi hitlar uchun tashqi MIDI fayl, to‘lov yoki hisob ochish talab qilinmaydi.

Sozlamalar, yutuqlar va shaxsiy MIDIlar avvalgidek har bir hisob uchun shu brauzerda saqlanadi. Eski sozlamalarda nota yozuvi yo‘q bo‘lsa, Do–Re–Mi avtomatik yoqiladi.
