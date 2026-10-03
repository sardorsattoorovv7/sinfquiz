# SinfQuiz 7.20.1 — Kimyo laboratoriyasi

Kimyo atlasidagi **Tajriba qil** stoli yangilandi. O‘quvchi modda va jihozni o‘zi tanlaydi; qo‘llanma uning bajargan amallariga qarab keyingi qadamni ko‘rsatadi. Informatika, Matematika, Biologiya, Ingliz labirinti va mavjud kirish oqimlari saqlangan.

## Ishga tushirish

1. Yangilangan `sinf-quiz` papkasidagi kodni loyihangizga ko‘chiring. O‘zingizdagi `.env` faylini saqlang.
2. Terminalda `npm install`, keyin `npm run dev` bajaring. Node.js 22.12 yoki yangirog‘i kerak.
3. Agar 7.20 migratsiyasi oldin bajarilgan bo‘lsa, **yangi SQL migratsiyasi kerak emas**. Ushbu yangilanish mavjud tajriba natijasi va ustoz topshirig‘i modelidan foydalanadi.
4. Agar 7.19 dan yangilayotgan bo‘lsangiz, `UPDATE-7.20.md` bo‘yicha `supabase-migration-7.20.sql`ni bajaring. Atlaslar va asosiy jadvallar avval o‘rnatilgan bo‘lishi kerak.
5. Vercelda yangilangan kodni build/deploy qiling. `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` avvalgi qiymatlarida qoladi.

## Qo‘llanma qanday ishlaydi?

**Kimyo atlasi → Tajriba qil → Rejim va amaliy ish** dan mavzuni tanlang. Amaliy ish tanlanganda **Bosqichli qo‘llanma** ochiladi. Erkin laboratoriyada uni alohida tugmadan ochish mumkin.

Har namuna uchun kerakli modda, formula, miqdor, konsentratsiya, jihoz va sharoit ko‘rsatiladi. Tartib: jihoz → moddalarni qo‘shish → sharoit → kuzatish → natijani taqqoslashga qo‘shish. “Qayerdaligini ko‘rsat” kerakli boshqaruvni ajratib ko‘rsatadi. Modda bosqichida javon va miqdor maydoni tayyorlanadi; reagent o‘quvchi “Idishga qo‘shish”ni bosgandan so‘ng qo‘shiladi.

Qisman qo‘shilgan reagent uchun yetishmayotgan miqdor ko‘rsatiladi. Noto‘g‘ri modda, ortiqcha miqdor, mos bo‘lmagan konsentratsiya yoki kech qo‘shish haqida tushuntirish chiqadi. Bunday namuna qo‘llanma bosqichini avtomatik tugatmaydi. O‘quvchi qo‘llanmani yopib mustaqil sinashni davom ettira oladi; ishlayotgan tajriba saqlanadi.

Ikkinchi namuna oldidan “Yangi namuna uchun stolni tozalash”ni bosing. Oldingi taqqoslashlar qoladi. Sharoitni o‘zgartirib ikkinchi natijani ham jadvalga qo‘shing. Reaksiya tezligi ishida ikki namuna bir xil 10 soniyada taqqoslanadi. Yakunda kuzatish va xulosani tajriba daftariga yozing.

13 qo‘llanma mavjud: erkin rejimda tuzning erishi va 12 amaliy ish — vulqon maketi, indikator/pH, neytrallanish, eruvchanlik, kristallanish, filtrlash, zichlik qatlamlari, gaz hosil bo‘lishi, sof suv holatlari, reaksiya tezligi, zanglash, elektr o‘tkazuvchanligi. Ularda jami 23 virtual namuna bor.

## Vizuallar

- Shisha idishlar qalin devor, qirra va hajm belgilariga ega. Yorug‘lik va akslanish yuqori grafik rejimda hisoblanadi.
- Suyuqlik qo‘shishda oqim, qattiq moddalarda donalar ko‘rsatiladi. Suyuqlik sathi qo‘shilgan hajmga mos ko‘tariladi; sovun hajmi ham hisobga kiradi. Indikator tomchisi bu modelda shartli 0,05 ml. Quruq soda qattiq namuna sifatida ko‘rinadi.
- Aralashtirishda sirt o‘zgaradi, moy tomchilarga tarqaladi. Aralashtirish o‘chirilganda qatlamga qaytish ko‘rsatiladi.
- CO₂ pufakchalarining faolligi gaz ajralish tezligi bilan bog‘langan. Gaz bermaydigan kombinatsiyada pufakcha chiqmaydi.
- Ko‘pik alohida sath, mayda pufakchalar va oqim bilan ko‘rsatiladi. Vulqon maketining kesilgan tomoni ichki idishni ko‘rish uchun ochiq.
- CaCO₃ oq cho‘kmasi loyqalanish va zarrachalar bilan ko‘rinadi. Tinch holatda tubga tushadi. Filtrlashda qoldiq filtrda, erigan moddalar filtratda ko‘rsatiladi.
- Kristall qoldiq, muz, bug‘ belgisi, temir yuzasidagi zang va virtual lampaning yorug‘ligi mos kuzatishga bog‘langan.
- Molekula ko‘rinishida H₂O burchakli, CO₂ chiziqli, erigan NaCl ionlari alohida. Bu zarrachalar haqiqiy masshtabda emas.

Model barmoq yoki sichqoncha bilan aylantiriladi; klaviaturada strelkalar aylantirish, `+`/`−` yaqinlashtirish uchun. Yorug‘ va tungi rejim, telefon va doska ko‘rinishi bor. Kam quvvatli qurilmada yengil grafika tanlanadi; WebGL bo‘lmasa boshqariladigan 2D model qoladi. Harakatni kamaytirish sozlamasi animatsiya harakatlarini kamaytiradi, hisoblarni to‘xtatmaydi.

## Ilmiy chegaralar

Bu ta’limiy simulyatsiya, haqiqiy laboratoriya o‘lchovi yoki suyuqlikning to‘liq fizik hisoblash tizimi emas. Ko‘pik, oqish, cho‘kmaning tushishi, moyning ajralishi va zanglash — sabab-oqibatni ko‘rsatadigan sifat modellari. Ma’lum reaksiya nisbatlari, atomlar saqlanishi va chegaralovchi reagent hisoblanadi. CO₂ hajmi 1 atm da nRT/P bo‘yicha, tezligi ushbu ta’limiy gaz chiqish modelining hosilasidan olinadi.

pH ideal 25 °C modeli bilan hisoblanadi. Noma’lum yoki to‘liq muvozanati hisoblanmagan aralashmada pH berilmaydi. Faza chegaralari sof suvga tegishli. Suvning yengil tusi sathni ko‘rish uchun; haqiqiy sof suv rangsiz. Oq “bug‘” bulutcha ko‘rinmaydigan suv bug‘ining shartli belgisi. Vulqon maketi geologik vulqon emas.

Qo‘llanmadagi miqdorlar dasturdagi taqqoslash namunalari. Haqiqiy kimyoviy tajribani nazoratsiz bajarish uchun retsept sifatida foydalanilmaydi.

## Natijalar va ruxsatlar

Modda, miqdor, sharoit, taxmin, kuzatish, xulosa va taqqoslashlar mavjud tajriba daftariga yoziladi. “Qayerdaligini ko‘rsat” va ixtiyoriy yordam ochilishi yordam soniga kiradi. Ustoz topshirig‘i uchun natija shu topshiriq ruxsatlari bo‘yicha ko‘rinadi. Mustaqil natijalar boshqa ustozga avtomatik ochilmaydi. Supabase RLS siyosatlari va Telegram/email kirish kodlari o‘zgartirilmadi.

## O‘zgargan fayllar

Yangi:

- `src/BenchTutorial.jsx`
- `src/chemistry-bench-tutorial.js`
- `src/BenchFallback.jsx`
- `src/chemistry-bench-visual-model.js`
- `tests/chemistry-tutorial.test.js`
- `tests/chemistry-tutorial-browser.cjs`

Yangilangan:

- `src/ChemistryBench.jsx`
- `src/chemistry-bench-3d.js`
- `src/chemistry-bench-model.js`
- `src/chemistry-bench.css`
- `vite.config.js`
- `package.json`, `package-lock.json`, `README.md`
- `tests/vercel.test.js` — paket versiyasi 7.20.1 bilan tekshiriladi.

Tekshiruvlar: `QA-7.20.1.md`. Ilmiy va texnik manbalar: `CHEMISTRY-TUTORIAL-SOURCES.md`. Yangi model, tekstura va chizmalar kodda mustaqil yaratilgan; tashqi model aktivlari qo‘shilmadi.
