# SinfQuiz 7.45.0 — aniq biologiya va yangi tarix atlasi

## Biologiya

**Atlaslar → Biologiya → Organlar 3D laboratoriyasini ochish**. Avvalgi BodyParts3D va HuBMAP sirt modellari saqlanib, ularni ko‘rish boshqaruvlari kengaytirildi:

- Tanlangan organni alohida ko‘rish va uning haqiqiy model qismlariga yaqinlashish.
- Old, orqa, odamning o‘ng/chap tomoni va yuqoridan qarash. Chap va o‘ng odamning o‘z tomoniga nisbatan beriladi.
- Qismlar ustidagi raqamli belgilar; organning qismlarini ajratib ko‘rish.
- Old, yon va ko‘ndalang yo‘nalishdagi kesim. Bu uch yo‘nalishli sirtni kesish; gistologik tekshiruv yoki KT tasviri emas.
- **11 organ va tayanch tizim** uchun to‘rttadan tuzilma, to‘rttadan jarayon bosqichi, aloqalar, izohli savol va rasmiy manba.

**Barcha 30 biologiya mavzusi** uchun “Tuzilish → vazifa → aloqa” paneli qo‘shildi: qismni tanlang, vazifasini o‘qing, jarayonning to‘rt bosqichini kuzating va keng tarqalgan xatoni tekshiring. Hujayra turi hamda hayot davri parametriga qarab izohlar moslashadi.

Hujayra 3D sxemasi ham to‘ldirildi: o‘simlik hujayrasining devori va ichki membranasi, yadro, yadrocha, endoplazmatik to‘r, ribosomalar, Golji apparati, mitoxondriyaning ichki burmalari, xloroplastdagi grana belgisi va hayvon hujayrasidagi sentrosoma. Bular kattalashtirilgan o‘quv geometriyasi; mikroskop tasviri yoki barcha hujayralarning nusxasi emas.

Oddiy biologiya sahnalarida qismni tanlagach **Tanlangan qismga yaqinlashish** yoki **Tanlangan qismga diqqat**dan foydalaning. 3D ochilmasa chizma, izoh va daftar ishlaydi. Biologiyaning tayyor mavzulari mehmon uchun ham ochildi; ustoz boshqaruvi va serverga yuborilgan ishlar mavjud hisob/ruxsatlar bilan ishlaydi.

## Tarix atlasi

**Atlaslar → Tarix atlasi** yoki `/#tarix-atlasi`. Uch bo‘lim:

1. **3D sayohat** — har bekatda 4 tanlanadigan qism, kamera, jarayon bosqichi, qismlarni ajratish va amaliy qaror savoli.
2. **Vaqt va xarita** — Natural Earth asosidagi jahon xaritasida joylar, davrlarni taqqoslash va xronologiya. `≈` taxminiy tayanch sanani bildiradi.
3. **Dalil ustaxonasi** — bevosita kuzatuv, undan chiqarilgan xulosa va hali bilmaydigan jihatni ajrating.

| Bekat | Asosiy mavzu |
| --- | --- |
| 1 | Neolit qishlog‘i, dehqonchilik va zaxira |
| 2 | Mesopotamiya shahri va yozuv |
| 3 | Misr piramidalari va qurilish taxminlari |
| 4 | Afina polisi va jamoat hayoti |
| 5 | Samarqand va Buyuk Ipak yo‘llari |
| 6 | Buxoro, darvoza va qal’a |
| 7 | Ulug‘bek rasadxonasi va o‘lchov yoyi |
| 8 | Ko‘chma harflar va bosma kitob |
| 9 | Bug‘ mashinasi va sanoat |
| 10 | Markaziy Osiyo temiryo‘llari |
| 11 | Urush yillaridagi O‘zbekiston, ko‘chirish va yordam |
| 12 | 1991-yil mustaqillik hujjati va keyingi jarayonlar |

To‘g‘ri javob va kamida 20 belgili dalilli xulosa yozilgach **Bekatni yakunlash** ochiladi. Qaydlar hisob/mehmon bo‘yicha shu brauzerda saqlanadi, **Qaydlarim** orqali JSON olinadi. Bu rasmiy baho emas. Uchta o‘rganish yo‘li ham mavjud; umumiy atlaslar markazida endi **6 atlas va 186 mavzu/bo‘lim qo‘llanmasi** bor.

Tarixiy sahnalar original ta’limiy rekonstruksiyalar. Qal’a tayyor Kenney GLB modellarini ham ishlatadi; ular Arkning aniq arxeologik nusxasi sifatida taqdim qilinmaydi. Boshqa sahnalar ham skan deb ko‘rsatilmaydi. Har bekatda UNESCO, muzey, kutubxona yoki hujjat manbasi va model chegarasi mavjud.

## O‘rnatish va tekshirish

Node.js **22.12+**:

```bash
npm ci
npm run dev
```

Yangi SQL migratsiyasi, npm dependency yoki environment qiymati kerak emas. Eski `.env.local` va Supabase ma’lumotlaringizni saqlang. ZIPdagi beshta qayta yaratiladigan Python runtime fayli `npm ci` va build oldidan avtomatik tiklanadi.

```bash
npm test
npm run build
npm run perf
```

Biologiya: `/#biologiya`. Tarix: `/#tarix-atlasi`. Informatika: `/#informatika-atlasi`.

**Tekshiruv chegarasi:** ushbu muhitning bulut brauzerida WebGL o‘chirilgan. Yangi 3D renderni o‘sha brauzerda tasdiqlashning imkoni bo‘lmadi. Geometriya, mahalliy GLBlarning yaxlitligi va anatomik koordinatalari testda; 2D zaxira rejimi, 12 tarixiy bekat, 11 organ izohi, xarita va qaydlar esa haqiqiy brauzerda tekshirildi. Tafsilot: [QA-7.45.md](QA-7.45.md).

GitHubga push va ishlab turgan saytga deploy bajarilmadi.
