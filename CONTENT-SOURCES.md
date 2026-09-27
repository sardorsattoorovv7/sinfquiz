# Kontent manbalari — 2026-09-26

Bu fayl manbalar, o‘zgartirishlar va tekshiruv chegaralarini qayd etadi. Manba saytiga kirish test ishlashning sharti emas: matn, savol va kalit loyiha ichiga kiritilgan.

## Ingliz tili: VOA Learning English

Foydalanish siyosati: https://learningenglish.voanews.com/p/6861.html

VOA original Learning English matnlari public domain ekanini va manba ko‘rsatilgan holda ta’lim/tijorat maqsadida qayta nashr qilish mumkinligini bildiradi. AP, Reuters, AFP materiallari bundan mustasno. Loyiha uchinchi tomon fotosuratlarini yoki agentlik materiallarini nusxalamaydi.

| Mahalliy ID | Asl material | Sana |
| --- | --- | --- |
| teacher | Teacher of the Year — Nancy Steinbach | 2004 |
| motomen | Motomen Carry E-Mail in Cambodia — Jill Moss | 2004 |
| outsourcing | Debate Over Outsourcing — Mario Ritter | 2004 |
| ged | Getting a GED Certificate — Nancy Steinbach | 2004 |
| welcome | Let's Learn English, Lesson 1: Welcome! | 2019 sahifa sanasi |
| hello | Let's Learn English, Lesson 2: Hello, I'm Anna! | 2018 sahifa sanasi |

Har materialning aniq URL’i, asl matni va savollari `data/open-passages.json` ichida. Birinchi to‘rtta matnning 20 ta original comprehension savoli saqlangan; avtomatik tekshirish uchun tanlash variantlari qo‘shilgan. So‘nggi ikki dialogdagi 10 ta savol SinfQuiz tomonidan matndan tuzilgan. Shuning uchun bu to‘plam “o‘zgarmagan rasmiy test nusxasi” deb berilmaydi.

Original matnlar tarixiy nashrlar. Savollardagi “now”, “this year”, “past three years” iboralari nashr davriga tegishli. Yangi raqamlar bilan matn mazmuni almashtirilmagan. Javoblar matnga qarab tekshirilgan.

## Matematika: Wallace C. Boyden

Asl asar: A First Book in Algebra (1895).

- Muallif: Wallace C. Boyden, 1858–1937.
- Raqamli manba: https://www.gutenberg.org/ebooks/13309
- PDF: https://www.gutenberg.org/files/13309/13309-pdf.pdf
- Status: public domain. Kitobdan tanlangan masalalar o‘zbekchaga tarjima qilindi; original sonlar saqlandi.
- Exercise I.1–8: 8 ta nisbat masalasi.
- Exercise 4.4–7, 4.9 va 3.1: 6 ta chiziqli masala.
- Exercise 55.1–8: 8 ta sistema; faqat x qiymati so‘raladi.
- Exercise 56.1–4 va 57.1–4: 8 ta kvadrat tenglama; kattaroq ildiz so‘raladi.

Manbada Exercise 55.7 uchun javoblar bo‘limidagi 5, −2 juftligi bosilgan tenglamalarga mos kelmaydi. PDF’dagi 7x − 3y = 41 va 2x + y = 12 tenglamalarini qayta yechib, x = 77/13, y = 2/13 to‘g‘ri yechim kiritildi. Raqamlarni oddiy ko‘chirish bilan cheklanilmagan.

Tarjima va yechim izohlari SinfQuiz tomonidan yozilgan. Bu to‘plam O‘zbekiston milliy sertifikat imtihoni tomonidan tasdiqlanmagan.

## Python

15 ta original boshlang‘ich savol quyidagi rasmiy hujjatlardagi faktlar asosida tuzilgan:

- https://docs.python.org/3/library/functions.html
- https://docs.python.org/3/library/stdtypes.html
- https://docs.python.org/3/library/idle.html

Hujjatlardan uzun parchalar ko‘chirilmagan. Kod chiqishlari testda Python 3 interpreteri bilan tekshiriladi. Savollar: `data/python-basics.json`; matn va kalit: `PYTHON-15-TEST.md`.

## Milliy katalogdagi admin variantlari (7.5)

`data/national-ready.js` yuqoridagi 30 algebra va 30 VOA Reading savolini milliy mashqning to‘rt variantli ko‘rinishiga o‘tkazadi. Matematika natijalarining sonlari va matnlar Boyden kitobidagi masalalarga tayanadi; chalg‘ituvchi sonlar SinfQuiz tomonidan tuzilgan. Ingliz tilidagi 5 ta qisqa javob mashqi uchun to‘rt variant yozilgan. Reading matnlari o‘quvchiga savol yonida beriladi; manba va nashr sanasi savollar bilan saqlanadi. Ushbu 60 savol yangi noyob savollar sifatida sanalmaydi, mavjud savollarning yana bir ishlash rejimidir. Baho rasmiy milliy sertifikatning Rash bahosi emas.

## CEFR / Multilevel mashq variantlari (7.7)

Formatga yo‘nalish: Bilim va malakalarni baholash agentligining [test formatlari](https://uzbmb.uz/page/test_sinovlari_formati) va [Speaking formati](https://uzbmb.uz/upload/file/pdf/phone/Speaking_format.pdf). Platformadagi savollar, vaziyatlar, suhbatlar, matnlar, javob variantlari va izohlar SinfQuiz uchun original yozilgan; rasmiy savollar ko‘chirilmagan. 10 ta mavzu `data/cefr-ready-cases.js` da, jami 810 topshiriq `data/cefr-ready-bank.json` da. Listening matnlari `data/cefr-audio-scripts.json` da; 60 ta MP3 mahalliy flite sintezida yaratilgan, inson ovozi yozuvi emas. Tayyorlash kodi `scripts/generate-cefr-ready.mjs` va `scripts/generate-cefr-audio.py` da. Imtihonda aynan shu savollar tushishi kafolatlanmaydi.

## Kompyuter savodxonligi darslari

`data/computer-course.js` dagi 28 dars va amaliy mashqlar SinfQuiz uchun original yozilgan. Word, Excel va PowerPoint amallarining umumiy yo‘nalishi Microsoft’ning quyidagi qo‘llanmalariga solishtirildi; ulardan matn ko‘chirilmagan:

- Word: https://support.microsoft.com/en-us/word/basic-tasks-in-word
- Excel: https://support.microsoft.com/en-US/Excel/basic-tasks-in-excel
- Formulalar: https://support.microsoft.com/en-us/excel/get-started/overview-of-formulas-in-excel
- PowerPoint: https://support.microsoft.com/en-us/powerpoint/basic-tasks-for-creating-a-powerpoint-presentation

Menyularning joylashuvi Microsoft 365, boshqa versiyalar va tizim tiliga qarab farq qilishi mumkin. Darslar maktabda mashq qilish uchun tuzilgan, Microsoft’ning rasmiy sertifikat kursi emas.

Ko‘rgazmali v2 qo‘llanma `data/course-guides.js` da: 28 ta bosqichli amaliy topshiriq, kutiladigan natijalar, ko‘p uchraydigan xatolar va 56 ta izohli savol. `public/course-visuals/` dagi 28 ta mahalliy SVG sxema `scripts/generate-course-visuals.mjs` bilan yaratiladi. Ular dastur ekranining aynan suratlari emas, original tushuntiruvchi chizmalar; uchinchi tomon rasmlari ko‘chirilmagan. Dastur oynasi va ayrim menyu nomlari versiyaga qarab farqlanishi mumkin.
