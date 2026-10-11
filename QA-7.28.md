# SinfQuiz 7.28.0 — tekshiruvlar

Tekshirildi: 2026-10-10. Baza: to‘liq 7.27.0 ZIP. Joriy natijalar `qa-7.28.0/` ichida; eski QA hujjatlari avvalgi versiyalarga tegishli.

`npm test`: **207/207**, 0 fail, 0 skip. Production build muvaffaqiyatli. Brauzerning oltita regressiya suite va yangi baza migratsiya zanjiri o‘tdi.

## Audit bo‘yicha tuzatishlar

| Topilma | Amal va tasdiq |
|---|---|
| Soxta Python stdout ball olishi | Python amaliy mashq sifatida qoldi. Mijoz yasagan stdout quiz va musobaqa reytingiga ball bermadi; aralash quizning ball maxraji Pythonni hisoblamaydi. Xavfsiz server Python bajaruvchisi qo‘shilgan emas. |
| Typing/milliy natijani to‘g‘ridan-to‘g‘ri yasash | Bevosita INSERT/UPDATE rad etildi. Kanonik topshiriq, UID, vaqt va yakuniy hisob RPCda. Milliy natija 29/30 uchun 72.5, tugagandan keyin 30 savol tahlili; vaqt tugashi va replay tekshirildi. |
| Ustozlar xonalari aralashishi | Ikki ustoz alohida typing va 1v1 xonasini bir vaqtda ochdi. Boshqa ustoz yopishi yoki boshqa UID sessiyaga kirishi rad etildi. To‘lgan/ishlayotgan race yangi ishtirokchilar katalogidan olinadi. |
| Private savol/kalit ko‘rinishi | Ikkinchi ustoz raw private quizni SELECT qila olmadi. Katalogda faqat metadata; tugamagan sessiyada javob va izoh kaliti yo‘q. |
| Eski 7.6 ruxsat tavsiyasi | Kod va amaldagi yo‘riqnoma 7.28ga o‘tdi. 7.6 permissive policy sinovda qayta qo‘llanganda ham restrictive guard kalit va soxta natijani himoya qildi. Eski skript funksiyalarni almashtirishi mumkin; qayta qo‘llash tavsiya etilmaydi. |
| Faol PIN takrorlanishi | Eski takroriy PIN ma’lumotni o‘chirmasdan yangilandi. Noyob indeks, PIN format guard va server retries tekshirildi. |
| 500 yozuv kesilishi | Adapter 1 203 yozuvni to‘liq/tartibli o‘qidi. Admin hisobida 607 foydalanuvchi serverdan sanaldi va 50 tadan pagination bilan olindi. |
| Atomik bo‘lmagan yozuvlar/bulk | Ikkinchi amal RLSda rad etilsa birinchi amal ham rollback bo‘ldi. 1 003 natija birdan tozalandi; boshqa ustozning natijasi saqlandi. Reset tegishli quiz sessiyalarini ham yopadi. |
| Typingdagi ketma-ket xatolar | Yakuniy baho Unicode tahrir masofasi bilan. Boshidan bitta belgi tushgan matn bitta xato bilan baholandi; jonli preview yozilmagan qolgan qismni xato sanamaydi va workerda hisoblanadi. 128dan ortiq belgi farqida tartibli so‘z tahrirlari ishlatiladi. |
| Yangi bazaning SQL tartibi | `migration-chain.json`dagi barcha fayllar yangi PostgreSQL/PGlite bazasida tartib bilan bajarildi. Cron yo‘q va cron sxemasi bo‘sh holatlar xatosiz; CEFRning 10 mocki asl JSON bilan teng. 7.28ni ikki marta qo‘llash tekshirildi. |

## Sinfxona

- Native jadval: 1–12 qator va 1–12 ustun; matn/sarlavha/shrift, ikki marta bosib tahrirlash, ko‘chirish/resize, undo/redo, qoralama va PNG. Juda uzun matn sig‘masa tushunarli xabar; yozuv jim kesilmaydi.
- Qalam, marker, matn ajratish, qisman o‘chirish, matn, besh shakl, rasm va ustiga yozish, sahifa nomi/tiklash, to‘rt topshiriq shabloni, o‘nta doska uslubi.
- O‘nta taymer bir deadline bilan ishlaydi. Katta namoyish/ko‘rinishni almashtirish va doskada yozish vaqtni qayta boshlamaydi. Background tab, pauza/davom, ±1 daqiqa, vaqt tugashi va ixtiyoriy WebAudio signali tekshirildi.
- Shovqin: Chrome mikrofon qurilmasi va boshqariladigan native audio oqimi bilan sharlarning ko‘tarilishi/pasayishi, kalibrlash, sezgirlik, ruxsatni rad qilish/qayta urinish, chiqishda va Backda stream to‘xtashi. Yozish yoki serverga audio yuborish yo‘q. Katta oynada ikkinchi mikrofon oqimi ochilmaydi.
- Raqam: uch manba, deduplikatsiya, takrorlanmas tanlov, tarix, reset, bo‘sh/noto‘g‘ri oraliq/ortiqcha miqdor. Katta oynadan tanlov umumiy tarixga tushadi.
- IndexedDB per-UID, localStorage fallback, avtomatik tiklash, quota xabari va qayta saqlash. Qoralama bulut bilan sinxronlangan emas.
- Ustoz/admin kirishi; student/guest deep-link rad etilishi. 390×844, 768×1024, 1600×1080 va 1920×1080; touch scroll bloklanishi va stilus bosimi; dark/light va reduced motion.

## Boshqa oqimlar

Quiz va 1v1 haqiqiy React adapteri hamda SQL RPC orqali bajarildi: ikki xil ball — 1- va 2-o‘rin; mahalliy split savollari turlicha, g‘olib serverdan. Typing besh bosqichi yakunlandi; milliy testni tugatishda to‘g‘ri ball va xatolar tahlili ochildi. Auth identifikatori fixture orqali berilgan, production hisoblariga tegilmagan.

Informatika/Python worker/Office, 4 fan bo‘yicha 198 dars, IQning 32 savolli oqimi, ustoz kontentining ajratilishi, Matematika hisoblari, WebGL matnli labirint, kimyo va biologiya amaliyotlari, CSV va qoralama regressiyasi o‘tdi. Admin parolni almashtirishning haqiqiy tashqi API amali bu QAda bajarilmadi.

Jamoaviy musobaqada absent/restored o‘quvchi, qisman boshlash, bo‘sh jamoaning reytingdan chiqarilishi, typing worker fallback, cancellation va saqlangan natijalar tekshirildi.

## Yuklama va SEO chegarasi

40 parallel HTTP mijoz × 4 jamoa × 10 bosqich, 974 so‘rov, 0 xato. O‘zgarmagan holat so‘rovlari javob hajmi eski yo‘lga nisbatan 98.2% kam. Bu mavjud 7.24 musobaqa sync/baholash oqimining lokal takroriy o‘lchovi: bir PGlite bazasi auth/RLS ishlarini navbatlaydi. Production Supabase sig‘imi, turli internet tarmoqlari yoki 40 jismoniy telefon sinovi emas. Productionda p95, DB yuklamasi va Realtime yetkazilishini alohida o‘lchash zarur.

7 ta ochiq HTML sahifasi JavaScript o‘chirilgan brauzerda HTTP 200, H1 va canonical bilan ochildi. Sitemap 8 URL, robots va metadata saqlangan. Google indekslash muddati yoki qidiruv o‘rni kafolatlanmaydi; yakuniy domen bilan Search Console orqali tekshiriladi.

## Qayta bajarish

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e:classroom
npm run test:e2e:play
npm run test:e2e:studio
npm run test:e2e:science
npm run test:e2e:learning
node tests/competition-attendance-browser.cjs
npm run test:load:competition
```

Brauzer sinovlari lokal Vite serverlarini o‘zlari ochib-yopadi. Test muhitida Chromium boshqa joyda bo‘lsa `CHROME_EXECUTABLE` orqali ko‘rsating. `CLASSROOM_QA_DIR`, `PLAY_QA_DIR`, `STUDIO_QA_DIR`, `SCIENCE_QA_DIR`, `LEARNING_QA_DIR`, `COMPETITION_QA_DIR` natija kataloglarini belgilaydi.

Joriy brauzer natijalari: 36 Sinfxona tekshiruvi, 6 server o‘yin oqimi, 6 brauzer suite; 40 axe holati, 0 aniqlangan buzilish. Axe avtomatik tekshiruv; to‘liq qo‘lda WCAG sertifikati emas.
