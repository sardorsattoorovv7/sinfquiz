# SinfQuiz 7.29 — yangi klaviatura, Word va Excel savollari

34 ta savol SinfQuiz uchun o‘zbek tilida yangidan yozilgan. Ular ko‘chirilgan imtihon savollari emas; amallar va formulalar quyidagi Microsoft hujjatlari bilan tekshirildi. Har savolda to‘g‘ri javob va qisqa tushuntirish bor. Javob kaliti qatnashuvchi uchun serverdan yuboriladigan joriy savoldan olib tashlanadi.

| To‘plam | Jami | Tarkib | Asosiy mavzular |
| --- | ---: | --- | --- |
| Klaviatura: tahrirlash va boshqarish | 12 | 5 nazariy, 5 tugma kombinatsiyasi, 2 matn terish | Backspace/Delete, Shift, belgilash, Ctrl+Home, Ctrl+A/C/Z, so‘z bo‘ylab yurish, Enter va tinish belgilari |
| Word: hujjat bilan amaliy ishlash | 12 | 6 nazariy, 3 tugma kombinatsiyasi, 3 muharrirdagi amaliyot | Paragraf/satr, jadval, rasm o‘rami, sahifa yo‘nalishi, sarlavha, ma’lumotnoma, qalin yozuv, saqlash va yangi sahifa |
| Excel: $ havolalar va mantiqiy formulalar | 10 | 6 nazariy, 4 muharrirdagi amaliyot | Nisbiy/mutlaq/aralash havola, ikki yo‘nalishda ko‘chirish, IF, AND va OR |

## Ishlaydigan amaliy topshiriqlar

| Topshiriq | O‘quvchining amali | Tekshiriladigan natija |
| --- | --- | --- |
| Word: sarlavhani formatlash | Sarlavha va matn, qalin, markazda, 18 pt | 4 mustaqil mezon |
| Word: navbatchilik jadvali | 2×2 jadvalni sarlavha va ma’lumot bilan to‘ldirish | Tuzilish va Kun/Ism/Dushanba/Ali mazmuni |
| Word: rasm va matn | Rasm qo‘shish, o‘ngga o‘rash | Matn, rasm va o‘ram alohida |
| Excel: o‘zgarmas narx | `=B2*$D$1` ni C2 dan C3 ga ko‘chirish | 6000 va 10000, kerakli katak havolalari |
| Excel: aralash havolalar | `=$A2*B$1` ni o‘ngga va pastga ko‘chirish | 8, 10, 12 va 15 |
| Excel: IF va o‘zgarmas mezon | `IF(B2>=$D$1,1,0)` va pastki qator | 1 va 0, IF va mutlaq mezon |
| Excel: AND va OR | IF ichida AND/OR shartlari | D2=0 va D3=1; IF hamda tegishli mantiqiy funksiya |

`A1` — nisbiy, `$A$1` — mutlaq, `$A1` — ustuni qotirilgan aralash, `A$1` — qatori qotirilgan aralash havola. Formulada qo‘shtirnoq ichidagi `"A1"` matn bo‘lib qoladi, ko‘chirishda katak deb talqin qilinmaydi. Baholash ham qo‘shtirnoq ichidagi havola yoki funksiya nomini bajarilgan amal sifatida qabul qilmaydi.

Tugma savollari Windows Word va zarur joyda English interfeysiga tegishli deb yozilgan. Telefon/planshetda virtual tugmalar orqali ham javob beriladi. Office vazifalari sayt ichidagi o‘quv muharririda bajariladi; haqiqiy Word/Excel ilovasini ishga tushirish shart emas. Ikkala amaliy muharrirning yangi savollari ham SQLdagi aynan bir xil mezon bilan solishtirib tekshirildi.

## Birlamchi manbalar

- Microsoft Support: [Switch between relative and absolute references](https://support.microsoft.com/en-us/excel/switch-between-relative-and-absolute-references).
- Microsoft Support: [Keyboard shortcuts in Word](https://support.microsoft.com/en-us/accessibility/word/keyboard-shortcuts-in-word).
- Microsoft Support: [IF function](https://support.office.com/en-au/article/IF-function-0f1a0f81-f6e1-46e4-9cd4-9e65445fc3ab).

Bu yangilanishda yangi tashqi rasm yoki 3D model ishlatilmadi. Oldingi model, audio va tasvirlarning manbalari tegishli mavjud hujjatlarda saqlangan.

Manba kodi: `data/office-729.js`; muharrir va hisob: `src/OfficeLab.jsx`, `src/office-lab-model.js`, `src/excel-formula.js`; server andozalari: `data/competition-729/templates.sql`.
