# SinfQuiz 7.33.0 — tekshiruv natijalari

| Tekshiruv | Natija |
| --- | --- |
| `npm test` | **285/285 o‘tdi**, xato 0 |
| Production Vite build | Muvaffaqiyatli |
| Paper Workshop yangi testlari | 5 ta, barchasi o‘tdi |
| CSS sintaksisi | Lightning CSS strict parser, warning 0 |
| Bosh sahifa + kod oynasi | axe-core DOM qoidalari, qoidabuzarlik 0; brauzer color-contrast qoidasi chiqarilgan |
| Palitra kontrasti | Haqiqiy token HEX qiymatlaridan WCAG luminance hisoblandi |
| API/Supabase, SQL, savollar va ilmiy model manbalari | Oldingi to‘liq ZIP bilan baytma-bayt solishtirildi |
| Arxiv | Barcha bazaviy fayllar, CRC va ishchi manba bilan faylma-fayl solishtirish |

## Bajarilgan funksional tekshiruvlar

- Olti fan xatcho‘pining mos daftar mazmunini ko‘rsatishi va to‘g‘ri mavjud modul callback’ini ochishi.
- Arrow Up/Down/Left/Right, Home va End bilan tanlash va klaviatura fokusi.
- Mehmon, o‘quvchi, ustoz va administrator navigatsiyasi; profil/boshqaruv yo‘llari; mobil menyuning beshta yo‘li; rolga mos Sinfxona va chiqish.
- Light/dark o‘zgarishi, localStorage va brauzer theme-color qiymati.
- Kod oynasi: avtomatik fokus, Escape, fokusni qaytarish, xato kod, boshlang‘ich nol, muvaffaqiyatli `/api/resolve` va kutayotgan so‘rovni oyna yopilishi bilan bekor qilish.
- Mavjud to‘liq UI regressiyasi: kodli kirish, avatar, test javobini yuborish, natija va xatolar tahlili; 1v1, typing, milliy test va mustaqil testni davom ettirish.
- Mavjud SQL/model testlari: ruxsatlar va izolyatsiya, fan modellari, natijalar va API oqimlari. Bu production Supabase sinovi emas.
- Kino Piano: Guide, MIDI import/eksport va virtual MIDI kirishi, nota diapazoni, audio soati bilan pauza/tezlik, metronomni to‘xtatish, canvas yo‘q paytda taymer va 5 daqiqalik yozuv limiti, pointer release va kuzatishni o‘chirish.
- Offline JS audio renderer: rejalashtirilgan metronom ovozi mavjudligi va bekor qilinganda deyarli nol signal. Jismoniy qurilmada audio o‘lchovi bajarilmagan.

## Kontrast

Matn va yordamchi matn qog‘oz, sahifa, sokin yuza, ko‘k va terrakotta aralash yuzalarda 4.5:1 dan yuqori. Asosiy tugma: kunduz 4.70:1, tun 7.90:1. Katta terrakotta sarlavha kunduz qog‘ozda 4.21:1; kichik matnda to‘qroq `--pw-accent-ink` ishlatiladi. Input chegarasi va fokus uchun 3:1 ajralish tekshirildi. Bu token juftlari hisobi; butun real sahifani brauzerda pikselma-piksel audit qilish emas.

## Ekran va jonli muhit chegarasi

320–390 px telefon, 768–1024 px planshet, desktop va 1920 px doska uchun responsiv CSS qoidalari yozildi. Ularning sintaksisi, markup, fokus va tegishli DOM oqimlari tekshirildi. **Jonli brauzerda viewport/overflow o‘lchovi, screenshot yoki real telefon sinovi bajarilmadi.**

Amaldagi [Sites SKILL.md](skill://plugin_connector_1p_689987207de08191979cf68eca2941c6/sites/SKILL.md) ko‘rsatmasi: “If `$control-browser` is unavailable, skip browser QA”. Ushbu sessiyada bu boshqaruv mavjud bo‘lmagani sabab preview server yoki boshqa browser yo‘li ishga tushirilmadi.

Mavjud Playwright ssenariylaridagi bosh sahifa va mobil navigatsiya selektorlari yangi UI uchun yangilandi; ularning JS sintaksisi tekshirildi, bu ssenariylar shu yangilanishda bajarilmadi. Jonli Supabase/Vercel deployment, haqiqiy hisoblar, telefon brauzeri va jismoniy MIDI sinovlari ham bajarilmadi. Oldingi QA fayllaridagi browser natijalari yangi dizayn uchun browser tekshiruvi hisoblanmaydi.
