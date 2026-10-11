# SinfQuiz 7.29.0 — tekshiruvlar

Tekshirildi: 2026-10-11. Node.js 24, Chromium 133, React/Vite va PGlite Postgres. Login transporti test hisoblari bilan almashtirilgan; komponentlar, brauzer muharrirlari, SQL funksiyalari va RLS tekshiruvi haqiqiy. Vercel/Supabase production loyihasiga o‘zgartirish kiritilmadi.

## Avtomatik tekshiruvlar

`npm test`: **220 ta test o‘tdi, 0 xato, 0 tashlab ketilgan**. `npm run build`: muvaffaqiyatli. Yangi baza uchun 49 migratsiya to‘liq qo‘llandi; 7.29 qayta qo‘llanganda natijalar yo‘qolmasligi tekshirildi.

Yangi SQL testlari: 2/6 o‘rin bilan asosiy start, bo‘sh jamoaning reytingga kirmasligi, mustaqil bosqich tanlovi, birinchi ochishdan boshlangan taymer, almashtirish/qayta yuklashda muddat saqlanishi, qoralama so‘rovining takrorlanishga chidamliligi, vaqt tugashida yuborilmagan tanlov va typingni baholash, boshqa bosqichga o‘tgandan keyin Word/Excel qisman ishini hisoblash, kech kelgan javobni rad etish va egaga tegishli ruxsatlar.

Wordda 4 mezonning 3 tasi bajarilgan birinchi savol va qolgan 2 ta javobsiz savol — 25/100. Excelda bitta topshiriqning 2 mezonidan bittasi — 50/100. O‘quvchi boshqa bosqichga o‘tganda ham avvalgi taymer tugab shu natijani saqladi. Soxta `score`, tezlik va vaqt qiymatlari server bahosini almashtirmadi. Katta/noto‘g‘ri qoralama, yopiq yordamchi RPC, begona o‘qituvchi boshqaruvi va begona o‘quvchi amali rad etildi.

JS va SQL barcha 7 ta yangi Office vazifasining to‘liq va qisman javoblarini bir xil baholadi. To‘rtta katak havolasi, matn ichidagi havolani o‘zgartirmaslik, IFning tanlangan tarmog‘i, AND/OR/NOT, ruscha nomlar va ajratgichlar tekshirildi. Noto‘g‘ri formula, aylanma havola, nolga bo‘lish, JavaScript/SQL buyruq shakllari qabul qilinmadi. Qo‘shtirnoq ichidagi katak/funksiya nomi amalda ishlatilgan havola deb olinmadi; talab etilgan IFni tashlab ketish to‘liq ball bermadi.

## Brauzerda bajarilgan 6 oqim

| Oqim | Amalda tekshirildi | Dalil |
| --- | --- | --- |
| Yangi erkin musobaqa | 4 bosqich uchun 65/125/185/245 s; 2/6 bilan boshlash; ikki o‘quvchining boshqa-boshqa tartibi; 4 s qoralama; reload; timeout; Word 100 va Excel 100 | `qa-7.29.0/competition/results.json` — 14 tekshiruv |
| Avvalgi ketma-ket musobaqa | 6 xonali quiz, typing, to‘liq matnli labirint, Excel amaliyoti va maxsus quiz; haqiqiy Python worker; to‘g‘ri reyting va CSV | `qa-7.29.0/guided/competition-browser.json` |
| Davomat va yarim jamoa | Kelmaganni chiqarish/qaytarish, asosiy start, bo‘sh jamoa, typing worker muqobili, bekor qilishda natijani saqlash | `qa-7.29.0/attendance/attendance-browser.json` |
| Darsliklar va amaliyot | Fan darslari, IQ, o‘zlashtirish sharti, SQL ball, qoralama, ustozga tegishli kontent, haqiqiy Python/Office | `qa-7.29.0/learning/learning-browser.json` |
| Mehmon mashqlari | Javob kaliti omborga tushmasligi, 6 xonali testning haqiqiy o‘rni, split 1v1, typing, milliy test va xatolar tahlili | `qa-7.29.0/play/results.json` |
| Sinfxona | Ustoz/admin cheklovi, doska va jadval, 10 uslub, qoralama, 10 taymer, katta namoyish, mikrofon va sharlar, raqam tanlash | `qa-7.29.0/classroom/results.json` — 36 tekshiruv |

Erkin musobaqa 1440×1000 desktop, 390×844 telefon va 1920×1080 proyektor ko‘rinishida tekshirildi. Yorug‘/tungi rejim, klaviatura va WCAG teglari bo‘yicha axe tekshiruvlari xatosiz tugadi. Qolgan brauzer oqimlarida ham runtime xato yo‘q. Yangi QA rasmlari ichki vizual tekshiruv uchun ishlatildi; topshiriladigan ZIPda natijalar JSON va log ko‘rinishida.

## 40 ishtirokchi yuklamasi

Bir vaqtdagi 40 HTTP mijoz 48 o‘rinli musobaqaga kirdi, to‘lmagan tarkib bilan start ishladi. Bosqichlarni tanlash, qoralama yuborish, polling, almashtirish, qaytish, 80 ochilgan bosqichni muddat bilan yopish va yakuniy reyting bo‘yicha **365 so‘rov, 0 xato**.

| Bosqich, 40 so‘rov | p95 |
| --- | ---: |
| Kirish | 448.10 ms |
| Bosqichni ochish | 301.53 ms |
| Qoralamani saqlash | 144.01 ms |
| O‘zgarmagan holatni so‘rash | 87.51 ms |
| Bosqichni almashtirish | 220.46 ms |
| Vaqt tugagandagi natija | 212.28 ms |

Bu mahalliy HTTP va bitta navbatdagi PGlite SQL o‘lchovi. Haqiqiy internet pinglari, 40 fizik telefon yoki Supabase production quvvati o‘lchanmadi. Qoralama faqat o‘zgarganda yoziladi; sof qoralama yozuvi barcha ishtirokchiga Realtime xabari tarqatmaydi. O‘zgarmagan polling javobi ixcham; yashirin/oflayn tablarda mavjud so‘rovni kamaytirish saqlangan.

## Qayta tekshirish

```powershell
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e:competition
npm run test:e2e:learning
npm run test:e2e:play
npm run test:e2e:classroom
npm run test:load:competition-free
```

Sinov fixturelari tashqi foydalanuvchilarga yoki production bazaga yozmaydi. Amaldagi modellar/audio, fanlar va avvalgi SQL fayllari 7.28 ZIP bilan baytma-bayt taqqoslandi. Yakuniy arxivdagi barcha fayllarning qayta ochilishi va ZIP CRC tekshiruvi paketlash skriptida bajariladi.
