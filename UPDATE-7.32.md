# SinfQuiz 7.32.0 — Kino Piano

## Qayerdan ochiladi

**Mashqlar → Kino Piano**. Yuqoridagi qidiruvdan “piano”, “pianino”, “musiqa”, “soundtrack” yoki “MIDI” deb topish mumkin. To‘g‘ridan-to‘g‘ri manzil: sayt domeningizdan keyin `/#kino-piano`.

Bo‘lim mehmon, o‘quvchi, o‘qituvchi va administrator uchun mavjud. Ijro yoki mashq davomida SinfQuizning amaldagi faol mashq himoyasi ishlaydi. Orqaga tugmasi ijroni to‘xtatib Mashqlar sahifasiga qaytaradi.

## O‘rnatish

1. ZIP ichidagi `sinf-quiz` papkasini oching. O‘zingizning `.env.local` faylingizni saqlang.
2. Node.js 22.12 yoki yangiroq versiyada `npm ci` ishlating.
3. Lokal ishga tushirish: `npm run dev`.
4. Vercel uchun: `npm run build`; amaldagi loyihangizga yangilangan manbani deploy qiling.

7.31.0 bazasidan o‘tayotganda **yangi SQL migratsiyasi kerak emas**. Birinchi o‘rnatishda mavjud `MIGRATIONS.md` tartibi amal qiladi.

## Pianino va ovoz

- Kompyuter klaviaturasi, sichqoncha, bir nechta sensor nuqtasi va tashqi MIDI kirishi.
- 25, 37, 49 yoki 88 klavish ko‘rinishi. 88 klavish A0–C8 oralig‘ini qamraydi. Yon tugmalar va aylantirish chizig‘i orqali pianino suriladi.
- Kompyuter notalari Z S X D C V G B H N J M va Q 2 W 3 E R 5 T 6 Y 7 U I orqali chalinadi. Ekrandagi yorliqlar joriy notaga mos keladi. O‘ng qo‘l uchun boshlang‘ich diapazon tanlangan kuyga moslanadi.
- Space — vaqtinchalik sustain; Audio Lab’dagi sustain doimiy pedal sifatida ishlaydi. Esc/Panic — ijroni to‘xtatish.
- Besh qatlamli tovush: ozgina farqlangan uch tor, o‘rta/yuqori garmonikalar va bolg‘acha shovqini. Har qatlamning so‘nishi alohida. Bu sintezlangan tembr, yozib olingan akustik sample banki emas.
- Reverb, Volume, Master Gain, oktava -2…+2, nota nomlari, kompyuter yorliqlari va metronom sozlanadi. Ovoz yo‘lida compressor bor. Bir vaqtdagi tovushlar 64 ta bilan chegaralangan.
- Ovoz birinchi foydalanuvchi harakatidan so‘ng faollashadi. Interactive latency rejimi ishlatiladi. Mutlaq 0 ms kechikish kafolatlanmaydi; bufer ko‘rsatkichi brauzer bergan taxmin, to‘liq tugma–karnay o‘lchovi emas.

## Uch rejim

**Tinglash:** Play/Pause, Stop, oldingi/keyingi kuy, 0.5×–1.5× tezlik, vaqt bo‘ylab o‘tish va takrorlash. Nota bosilishi bilan audio Web Audio soati bo‘yicha oldindan rejalashtiriladi.

**O‘rganish:** o‘ng qo‘l, chap qo‘l yoki ikkala qo‘l. Yoritilgan notalar to‘g‘ri bosilmaguncha keyingi guruh ochilmaydi. “Namuna” joriy akkordni eshittiradi. Xatolar va yakuniy aniqlik shu hisob uchun qurilmada saqlanadi. Bu vaqtni kutuvchi mashq bo‘lgani uchun foydalanuvchining umumiy o‘rganish vaqti 30 soniyadan uzun bo‘lishi mumkin.

**Erkin ijro:** virtual yoki tashqi klaviaturada chaling. “Ijroni yozish” siz bosgan notalarni yozadi; tugatgach shaxsiy MIDI sifatida saqlanadi. Avtoijro yozib olinmaydi. Bir yozuv besh daqiqagacha.

## Repertuar

- 32 ta yangi original kino kayfiyatidagi 30 soniyalik mashq.
- 6 ta jamoat mulkidagi melodiya asosida sodda mashq: Ode to Joy, Twinkle Twinkle, Frère Jacques, Au clair de la lune, Amazing Grace, Scarborough Fair.
- Interstellar, Titanic, Harry Potter, The Lord of the Rings, Inception, The Godfather, Amélie, La La Land va yana 26 kino uchun MIDI yuklash katalogi.

Kino katalogi asl soundtrack notalarini o‘z ichiga olmaydi. Kino nomini tanlab, o‘zingizdagi MIDI aranjirovkasini yuklang. Yuklangan kuy o‘sha nom bilan bog‘lanadi; tinglash va o‘rganish rejimlari uning notalarida ishlaydi.

## MIDI fayllar

`.mid` yoki `.midi`, Standard MIDI File format 0/1, 5 MB gacha. Running status, tempo o‘zgarishlari, sustain CC64 va SMPTE vaqti o‘qiladi. Baraban kanali chiqarib tashlanadi; A0–C8 notalari qabul qilinadi. Format 2 qo‘llanmaydi.

Parcha boshlanishini soniya bilan tanlang: undan keyingi 30 soniyagacha qism olinadi. Qisqa fayl sun’iy uzaytirilmaydi. MIDI’da o‘ng/chap qo‘l C4 chegarasi bilan taxminan ajratiladi. “MIDI” tugmasi joriy parchani qayta yuklaydi.

Tashqi klaviatura uchun brauzerdagi Web MIDI qo‘llovi, foydalanuvchi ruxsati va mos xavfsiz kontekst talab etiladi. Odatda HTTPS yoki localhost ishlatiladi. MIDI ulanmasa, ekran va kompyuter klaviaturasi ishlashda davom etadi.

## Saqlash

Sozlamalar, sevimlilar va mashq aniqligi localStorage’da; yuklangan/yozilgan MIDI’lar IndexedDB’da joriy hisobga ajratib saqlanadi. Fayllar serverga yuborilmaydi. Boshqa qurilmaga avtomatik sinxronlanmaydi; brauzer ma’lumotlarini tozalashdan oldin MIDI’ni eksport qiling. Saqlash rad etilganda sessiya davomida foydalanish mumkinligi haqida xabar chiqadi.

Audio Labirintning tiklangan dizayni va boshqa fanlar shu arxivda saqlangan.
