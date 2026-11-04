# AI ustoz — 2026-11-04

Yordamchi odatiy holatda **AI ustoz** sifatida suhbatlashadi. Yo‘l so‘rash, tushuntirish, bilimni tekshirish va keyingi mashqni tanlash uchun rejim almashtirish talab qilinmaydi. Maxsus qo‘llanma, tushuntirish va mashq tugmalari ham saqlangan; “Darajani aniqlash” qo‘shilgan.

“Qayerdaman?” muammosi tuzatildi: ochiq sahifa, oldingi sahifa va qo‘llanmadan tanlangan bo‘lim alohida uzatiladi. AI yordamchi sahifasi endi Atlaslar markazi sifatida ko‘rsatilmaydi. Sahifa nomlari serverdagi tekshirilgan, foydalanuvchi roliga mos registrdan olinadi. Oddiy joylashuv savoli modelni chaqirmasdan javob oladi; masalan: “Siz hozir SinfQuizning ‘AI yordamchi’ sahifasidasiz.” Biologiya ustidagi yordam oynasi esa Biologiyani hozirgi sahifa deb biladi. Javob matnidagi `AtlasHub` kabi ichki nomlar sahifada ko‘rinadigan nomga almashtiriladi.

Fan aytilmagan oddiy bilim tekshirish so‘rovi avval fan yoki mavzuni aniqlashtiradi. Ustoz yo‘riqnomasi qisqa, tabiiy o‘zbekcha javob, aniq misol, suhbatdagi oldingi savolni tushunish va xatoga qarab tushuntirishni talab qiladi. “AI ustoz” va diagnostika mavjud `GROQ_ASSESSMENT_MODEL`ni ishlatadi (ushbu muhitda `openai/gpt-oss-120b`); alohida eski yo‘l ko‘rsatish/tushuntirish/mashq rejimlari `GROQ_PRACTICE_MODEL`dan foydalanadi. Yangi kalit yoki SQL migratsiyasi kerak emas.

Mini-test oqimi:

1. Fan va mavzu aniqlanadi. Ustoz 5 ta original savol tayyorlaydi: 2 ta asos, 2 ta qo‘llash va 1 ta murakkabroq vazifa.
2. Savollar birma-bir ko‘rsatiladi. O‘quvchi oldingi savolga qaytib, javobini o‘zgartirishi mumkin. Javob kaliti va izohlar yakungacha ochilmaydi.
3. Barcha 5 javob topshirilgach, ball, yaxshi bajarilgan ko‘nikmalar, mustahkamlash kerak bo‘lgan joylar va keyingi qadam ko‘rsatiladi. Asosiy savollarda xato bo‘lsa, yuqori umumiy ball ham asoslarni o‘tkazib yuborishga sabab bo‘lmaydi.
4. “Xatolarimni tushuntiring” haqiqiy tanlangan/to‘g‘ri javoblarni keyingi ustoz suhbatiga uzatadi. “Natijamga mos mashq” yangi mashqlarni so‘raydi. Hisoblashning o‘zi qo‘shimcha AI so‘rovi yubormaydi.

Bu aynan shu mavzudagi beshta javobdan olingan dastlabki o‘quv xulosasi; standartlashtirilgan CEFR/IELTS yoki umumiy bilim darajasi emas. Savollarning mazmuniy qiyinligi AI tomonidan tuziladi va alohida psixometrik kalibrlashdan o‘tmagan.

Server savollar soni, variantlar, to‘g‘ri javob indeksi, ko‘nikma yorlig‘i va qiyinlik tartibini tekshiradi. Takror mashq yoki noto‘g‘ri format kelsa, ayni 15 soniyalik umumiy vaqt ichida bir marta tuzatib qayta yaratadi. Bir xil umumiy savol iborasi yangi javob mazmuni bilan kelishi texnik xato hisoblanmaydi. Avval bajarilgan ayni savol va to‘g‘ri javobni takrorlash esa qayta yaratiladi.

Mini-test dalillari shu sahifadagi suhbatda saqlanadi, akkaunt almashtirilganda o‘chadi. Ular rasmiy profil natijasini o‘zgartirmaydi. Server yuborilgan ball va “daraja” yozuviga ishonmaydi: natijani tanlangan/to‘g‘ri javob matnlaridan qayta hisoblaydi. Keyingi so‘rovga eng so‘nggi mini-test yuboriladi; katta suhbatda eski tarix UTF-8 bayt hajmiga qarab qisqartiriladi. Hozirgi savol va javob variantlari saqlanadi. Ovoz va boshqa shaxsiy mashq yozuvlari yordamchiga uzatilmaydi.

Tekshiruvlar:

- **53/53 test**: haqiqiy sahifa va tanlovni ajratish, rollar, to‘liq topshirishdan oldin natija bermaslik, keyingi darsga xatolarni uzatish, akkaunt almashishi, takror savolni qayta yaratish, ko‘p baytli katta so‘rov, Enter/Shift+Enter/IME, tarmoq xatosida matnni saqlash va yuklanish regressiyalari. [Test natijalari](qa-ai-mentor/tests.txt).
- Production build va boshlang‘ich hajm budjeti o‘tdi. JavaScript 361 879 bayt, CSS 118 025 bayt. Yangi mini-test uslublari yordamchi ochilganda yuklanadi. [Build](qa-ai-mentor/build.log), [hajm](qa-ai-mentor/performance.json).
- Chromiumda yangi ustoz oqimi uchun **10 ta**, mavjud yordamchi uchun **11 ta** tekshiruv; jami **11 ta accessibility auditi**, runtime xatosi yo‘q. 320/390/768/1440 px va qorong‘i mavzu tekshirildi. [Ustoz](qa-ai-mentor/browser-results.json), [yordamchi](qa-ai-integration/browser-results.json).
- Haqiqiy Groq modelida Present Simple bo‘yicha 5 savolli diagnostika va 3/5 natijaga mos 3 ta yangi mashq yaratildi. [Diagnostika](qa-ai-mentor/live-diagnostic.json), [keyingi mashq](qa-ai-mentor/live-followup.json). Bular sun’iy test javoblari; shaxsiy yozuvlar ishlatilmadi.

[Natija ko‘rinishi](qa-ai-mentor/mentor-result-desktop.png) · [Telefon ko‘rinishi](qa-ai-mentor/mentor-result-mobile.png) · [Localhostda ochish](http://localhost:5173/#ai-yordamchi)

Takrorlash: `node --test --test-concurrency=2 --test-timeout=90000 tests/assistant-mentor.test.js tests/assistant-mentor-ui.test.js tests/ai-assistant.test.js tests/ai-assistant-ui.test.js tests/speaking-ui.test.js tests/performance.test.js tests/lazy-provider.test.js`. Brauzer: `node tests/mentor-browser.mjs` va `node tests/ai-assistant-browser.mjs`.
