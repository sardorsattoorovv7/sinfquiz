# SinfQuiz Studio — dizayn va manbalar

## Vizual yo‘nalish

Oldingi «02 · Interaktiv Studio» va «03 · Tungi laboratoriya» namunalari asos qilib olindi. UI rasmdagi elementlarni kodga aylantiradi: doimiy chap menyu, ixcham yuqori qator, tiniq kartalar, katta model va alohida parametrlar paneli. Tungi rejimda to‘q ko‘k fonda yalpiz va binafsha aksentlar ishlatiladi.

Bu sahnalar generatsiya qilingan rasmning fotografik nusxasi emas: haqiqiy o‘zgaruvchi chizmalar va mavjud litsenziyali 3D modellar ishlatiladi. Funksiyaga mos boshqaruvlar, matnlar va kirish cheklovlari saqlangan.

## Asosiy ranglar

| Vazifa | Yorug‘ | Tungi |
| --- | --- | --- |
| Sahifa | `#f5f8fa` | `#101d2c` |
| Karta | `#ffffff` | `#182b3d` |
| Asosiy matn | `#142d48` | `#edf4ff` |
| Ikkinchi matn | `#51677e` | `#b5c6da` |
| Aksent | `#007780` | `#6de0c4` |
| Chegara | `#dbe6ed` | `#334e67` |

Tizim shriftlari ishlatiladi; avvalgi tashqi Google Fonts so‘rovi olib tashlangan. Fan kartalarining yengil SVG rasmlari `StudioArt.jsx` da SinfQuiz uchun alohida chizilgan. Yangi UI uchun qo‘shimcha npm kutubxonasi qo‘shilmagan.

## Joylashuv

- Desktop: 184–196 px asosiy menyu; matematika sahnasida mahalliy mavzular ro‘yxati, model va parametrlar.
- Kimyo: moddalar javoni → tajriba stoli → sharoit/kuzatish; telefon ekranida bloklar ketma-ket joylashadi.
- Labirint: 3D maydon va o‘ngda o‘qib yoki tinglab javob berish paneli. Telefondagi panel maydon ostida.
- Telefon: ochiladigan menyu va to‘rtta tezkor bo‘lim. Faol mashqda umumiy menyu yashiriladi.
- Klaviatura: ko‘rinadigan fokus, menyuda Tab/Escape, bosh mazmunga o‘tish havolasi, slayder bilan birga son kiritish va aylantirish tugmalari.
- Harakatni kamaytirish sozlamasi saqlanadi. Kichik ekranlarda yangi labirintning pixel ratio chegarasi 1; boshqa ekranlarda 1.5.

## Aktivlar va huquqlar

`public/` dagi avvalgi modellar/audio shu holicha saqlangan. Yangi tashqi model yuklanmagan. Mavjud Kenney Castle Kit, RobotExpressive va biologiya modellarining manbasi hamda litsenziyalari `MODEL-SOURCES.md` va tegishli mavjud aktiv hujjatlarida qayd etilgan. Three.js — MIT; Lucide — ISC. Yangi mavzu rasmlari asl SVG, emoji yoki uchinchi tomon rasmi emas.

## Haqiqiy parametrlar

Uchburchak uchun `8 × 5 ÷ 2 = 20`; asos 10 ga o‘zgartirilganda yuza 25. Barcha o‘lchovlar bitta hisob modelidan olinadi. Kimyo stolidagi miqdor va vaqt asl simulyatorga beriladi. Labirintdagi robot joyi va raqamli eshiklar haqiqiy o‘yin koordinatalariga bog‘langan.
