# SinfQuiz 7.11: amaliy sinf savollari

1. ZIP ichidagi loyihani eski loyiha bilan almashtiring. O‘zingizdagi `.env.local` faylini yangi loyiha ildiziga ko‘chiring; server maxfiy kalitini GitHub’ga yubormang.
2. Terminalda `npm ci`, keyin `npm run dev` bajaring. Word va Excel sinf testini, Python amaliyotini va kod yuklashni ko‘ring.
3. `npm test` va `npm run build` bilan o‘rnatishni tekshiring.
4. Vercel’ga yangi kodni yuklang va yangi Production deployment yarating. Muhim: `vercel.json` da Python worker CSP ruxsatlari yangilandi. Qo‘shimcha Supabase SQL talab qilinmaydi.
5. Ustoz paneliga kiring. Tahrirlanmagan eski Word, Excel, PowerPoint va Python shablonlari yangilanadi. Ustoz o‘zgartirgan shablonlar avtomatik yozib yuborilmaydi. Agar eski shablon o‘zgartirilgan bo‘lsa, test muharriridagi **Office amaliyoti** yoki **Python kodi** turini qo‘lda qo‘shing.

## Nimalar bor?

- Word: sarlavha, matn, ikki ustunli jadval, rasm kiritish, rasmni chap/o‘ngga joylash, ma’lumotnoma rekvizitlari.
- Excel: A–D va 1–6 katakli ish varag‘i, `=B2*C2`, `=SUM(D2:D3)`, `=AVERAGE(B2:B4)` kabi hisoblar. Kod sifatida JavaScript bajarilmaydi.
- PowerPoint: ikki va undan ortiq slayd, matn, namuna rasm, so‘zlovchi qaydlari.
- Python: kod muharriri, har qatorda `input()` qiymati, natija, `.py` yuklash. So‘nggi tahrirdan 52 soat shu brauzerda saqlanadi. Brauzer ma’lumotlari o‘chirilsa yoki boshqa qurilma ishlatilsa, qoralama tiklanmaydi.

Office muharrirlari mustaqil o‘quv simulyatsiyasidir, haqiqiy Word/Excel/PowerPoint dasturlarini ochmaydi va `.docx`, `.xlsx`, `.pptx` fayllarini yaratmaydi. Ustoz yuborilgan kod va amaliy javoblarni panelda ko‘rib bahoni tekshirishi kerak. Python natijasining avtomatik bahosi rasmiy yoki serverda tasdiqlangan ijro emas.

Pythonning ilk ishga tushishi Pyodide fayllarini saytning o‘zidan oladi va brauzerda keshlaydi. Yuklash 35 soniyadan oshsa xato chiqaradi; kodning ishlash chegarasi 6 soniya. Faylga va internetga chiqish uchun mo‘ljallanmagan. Worker bir martalik, shubhali importlar to‘siladi. Har qanday Python kodining zararli ekanini mukammal aniqlash mumkin emas; asosiy himoya kodning saytdan va serverdan ajratilishidir.
