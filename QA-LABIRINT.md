# Audio Labirint — tekshiruvlar

- `npm test`: 269/269 muvaffaqiyatli, xato 0.
- `npm run build`: muvaffaqiyatli.
- Mavjud Studio brauzer suite’i: muvaffaqiyatli; 13 ta avtomatik accessibility holati, aniqlangan buzilish 0.
- Audio Labirint alohida brauzer tekshiruvi: 12 xarita, A1/A2/B1 filtrlari; klaviatura va ekrandagi tugmalar; noto‘g‘ri javobda yopiq eshik; ishoralar; beshta to‘g‘ri javobdan keyin marraga yetish va mashq natijasining saqlanishi.
- Savollar paneli sahnaning ostida va sahna bilan bir xil endaligi real brauzer koordinatalari orqali tekshirildi. Desktopda uch javob yonma-yon.
- Ovoz sintezi va qayta tinglash chaqiruvlari, B1 matnli savollar, sozlamalar, to‘liq ekranga kirish/chiqish va chiqishda sayt navigatsiyasining qaytishi tekshirildi.
- 1920, 1600, 1366, 768, 390 va 360 px kengliklarda sahifa eni toshishi aniqlanmadi. Kunduzgi va tungi ko‘rinishlar ko‘zdan kechirildi.

Sinovlarda haqiqiy React va SVG o‘yini ishlatildi. Hisobga kirish va katalog transporti test ma’lumotlari bilan, ovoz chiqishi esa Speech Synthesis chaqiruvlarini yozuvchi test almashtirgichi bilan tekshirildi. Production Supabase, Vercel va jismoniy audio qurilmasi bu ishda sinalmadi.

ZIPdagi avvalgi barcha fayllar saqlanadi. Arxiv CRC tekshiruvi va paketlangan har bir faylning ishchi nusxa bilan baytma-bayt solishtirilishi bajariladi. Sinov rasmlari ZIPga qo‘shilmaydi.
