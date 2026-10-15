# Audio Labirint — dizaynni tiklash

Bu arxiv yuklangan SinfQuiz 7.31.0 Fizika loyihasining to‘liq nusxasi va labirint ko‘rinishining tuzatishlarini o‘z ichiga oladi.

## Nima tuzatildi

- O‘yin davomida umumiy 3D Qal’a maydoni o‘rnida tosh devorli bog‘ labirinti ko‘rsatiladi. Daraxtlar, o‘simliklar, ikki tomondagi suv va yorug‘ chiqish darvozasi mavjud xaritaning haqiqiy kataklariga mos chiziladi.
- Katta taymer yuqorida; tinglash, matn va javoblar paneli butun eni bo‘ylab labirint ostida. Savol ochilganda maydon ko‘rinib turadi. Desktopda uchta javob yonma-yon, telefonda ketma-ket joylashadi.
- Yo‘nalish savollarida ko‘k chap, qizil to‘g‘ri va yashil o‘ng strelkalari ko‘rsatiladi.
- O‘yin paytidagi ortiqcha sayt navigatsiyasi yashiriladi; mashq tugaganda qayta ko‘rinadi.
- 12 xarita, A1/A2/B1 tanlovi, ovozli va matnli rejim, xatolar, ishoralar, izquvar, 3 daqiqalik muddat va natijalar oqimi saqlanadi.

## Ishga tushirish

1. ZIPni oching va `sinf-quiz` papkasini VS Code’da oching.
2. O‘zingizning amaldagi `.env.local` faylingizni saqlang. Yangi o‘rnatishda `.env.example` asosida o‘z qiymatlaringizni kiriting.
3. Node.js 22.12 yoki yangiroq versiyada quyidagilarni bajaring:

```bash
npm ci
npm run dev
```

Tayyor build: `npm run build`. Vercel loyihasiga shu manba fayllarini joylab qayta deploy qiling.

## Baza

7.31.0 dan ushbu dizayn tuzatishiga o‘tishda yangi SQL ishlatilmaydi. Avvalgi loyiha migratsiyalari shu arxivda saqlangan; loyiha birinchi marta o‘rnatilayotgan bo‘lsa `MIGRATIONS.md` dagi tartibni bajaring.

## Asosiy o‘zgargan fayllar

- `src/EnglishAudioMaze.jsx`
- `src/ScenicMaze.jsx`
- `src/scenic-maze.css`
- `tests/studio-browser.cjs`

O‘yin chizmasi jonli SVG: qahramon, izquvar va darvozalar o‘yin holatiga qarab yangilanadi. Namuna surat o‘yin foniga qo‘yilmagan.
