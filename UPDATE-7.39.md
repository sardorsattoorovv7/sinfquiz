# SinfQuiz 7.39.0 — o‘rnatish va yangilash

Bu 7.38.0 loyihasining to‘liq yangilangan manbasi. Yangi SQL, dependency yoki environment qiymati talab qilinmaydi. Auth, API, RPC, RLS, savollar va natijalarni saqlash mantiqi saqlangan.

1. ZIPni yangi bo‘sh papkaga oching.
2. Amaldagi `.env.local` qiymatlaringizni saqlang va yangi papkaga ko‘chiring.
3. Node.js 22.12+ bilan `npm ci` bajaring. Python runtime fayllari avtomatik tayyorlanadi.
4. Lokal ochish: `npm run dev`. Production: `npm run build`; natija `dist`.
5. Tekshirish: `npm test`, builddan keyin `npm run perf`.

## Kuylar

Mashqlar → Kino Piano → Yangi kuylar. Bo‘lim Training Season — naqorat bilan ochiladi. Bu aynan Chorus 21–28-taktlar,64 BPM o‘quv tempi; kirish qismi emas. Qidiruvga `Dua Lipa`, `Chuqur`, `Kara Sevda`, `Ish va qasos`, `Ishq va qasos`, film yoki kuy nomini yozing. Saralagichda Pop, Turk seriallari va Hindcha guruhlari bor.

Tinglash → Play:30 soniyalik qisqa melodiya. O‘rganish → Play: Do–Re–Mi ko‘rsatmasiga qarab yoritilgan klavishlarni bosing. Dars to‘g‘ri nota yoki akkord tugamaguncha kutadi. Eshitib ko‘rish joriy qadamni eshittiradi. MIDI tugmasi darsdagi notalarni yuklab beradi.

Yangi20 parchaning 5 tasi tayyor MIDI’dan,15 tasi notadan tayyorlangan. Bular o‘ng qo‘l asosiy melodiyasidir. Notadan olingan serial kuylari sekin64 BPM mashq tempida. Uchta hindcha pitch-only nota manbasida ritm o‘quv uchun soddalashtirilgan; karta buni tavsiflaydi. Manbalar PIANO-SOURCES-7.39.md’da. Qo‘shiqni ishlatish uchun foydalanuvchi fayl yuklashi, obuna olishi yoki to‘lov qilishi shart emas.

## Telefon/planshet: yonlama sahna

1. Kuy va Tinglash yoki O‘rganish rejimini tanlang.
2. **Yonlama piano** yoki yuqoridagi to‘liq ekran belgisini bosing. Telefonni yon tuting. Brauzer ruxsat bersa ekran to‘liq ochilib, landscape so‘raladi.
3. Ekran qulfi yoki brauzer ruxsat bermasa ham sahna ilovaning o‘zida90° aylanadi. **Aylantirish** belgisi90° va oddiy yo‘nalish o‘rtasida almashtiradi. Qurilmani jismonan aylantirsangiz joylashuv qayta moslanadi.
4. O‘rganishda tutorial klavishlarning yonida turadi. Pastdagi tugmalar orqali past/yuqori notalarga suring. Bir nechta klavishni birga bosish ham ishlaydi.
5. **Sozlamalar** belgisi:25/37/49/88 klavish, oktava−2…+2, Do–Re–Mi/C–D–E yozuvi va sustain. Pastda Play/Pause, to‘xtatish, takrorlash va0.5×…1.5× tezlik.
6. **X** oddiy sahifaga qaytaradi va joriy dars qadamini saqlaydi. **Esc** sahnani yopadi hamda ijroni pauza qiladi. Sozlamalar oynasi ochiq bo‘lsa birinchi Esc faqat shu oynani yopadi.

Yonlama sahna tashqi sahifa va navigatsiyani vaqtincha nofaol qiladi, orqa sahifani surishni to‘xtatadi va chiqishda tiklaydi. Telefonning safe-area, brauzer paneli va viewport o‘lchami hisobga olinadi. Klavishlar kamida44 px oq-klavish kengligida; pan tugmalari, asosiy boshqaruvlar 44 px bosish maydonida. Juda tor yo‘nalishni qo‘lda tanlaganda tutorial ustki qatorga o‘tadi.

Audio birinchi foydalanuvchi bosishidan keyin yoqiladi. Fullscreen/orientation qo‘llovi brauzerga bog‘liq; zaxira sahna bunisiz ham ochiladi. Haqiqiy telefon va planshetda qo‘lda sinov chegaralari QA-7.39.md’da aniq yozilgan.
