# Biologiya aniqligi auditi — 7.45 tayyorlash

Sana: 2026-10-30. O‘zgartirilgan yagona ilova fayli: `review/sinf-quiz/src/biology-precision.js`. Mavjud renderer va organInfo o‘zgartirilmadi.

## Modul

- `organPrecision`: mavjud `organInfo`ning aynan 11 kaliti. Har birida `subtitle`, `position`, `connections`, 4 ta `structures: {id,name,detail}`, 4 ta ketma-ket `mechanism`, `misconception`, `question: {prompt,options,answer,why}`, `sources`, `limitation`.
- `topicPrecision(topic, parameters={})` va sinonimi `biologyPrecisionFor`: barcha 30 tayyor mavzuga profil beradi. Mavzu id satri yoki topic obyektini qabul qiladi; noma’lum mavzuda null.
- Har mavzuda 4 tuzilma va 4 bosqich, model chegarasi va manba bor. O‘simlik/hayvon hujayrasi `p.cell`ga, o‘simlik/qurbaqa/kapalak hayot davri `p.organism`ga moslashadi. `human-cell` va `plant-cycle` uchun mavzuga mos boshlang‘ich profil tanlanadi.
- `biologyPrecisionSources` manbalarning bitta registri. Matnlar original o‘zbekcha bayon; uzun manba matni yoki rasmlari ko‘chirilmadi.

## Tuzatilgan aniq tushunchalar

1. Yurak: o‘ng bo‘lmacha → o‘ng qorincha → o‘pka → chap bo‘lmacha → chap qorincha → aorta. O‘pka arteriyasi kislorodga kambag‘alroq qonni tashiydi; arteriya/vena yo‘nalish bilan tariflanadi. Qon ko‘k emas.
2. O‘pka: odam o‘ng o‘pkasi 3, chap o‘pkasi 2 asosiy bo‘lak. Diafragma faolligi, hajm/bosim farqi va alveoladagi gaz almashinuvi ajratilgan.
3. Miya: ko‘p sensor/motor yo‘llar qarama-qarshi tomonga bog‘langan, ammo barcha yo‘llar bir xil kesishmaydi. “Chap miyali/o‘ng miyali inson” afsonasi qo‘llanmaydi.
4. Buyrak: po‘stloq/mag‘iz/jom va nefron farqlanadi. Glomerul filtrati oxirgi siydik emas. Jom asosiy qon filtri emas.
5. Ichak: vorsinka ko‘p hujayrali, mikrovorsinka bitta hujayra yuzasi o‘simtasi. Ko‘p yog‘lar limfaga, ko‘p shakar/aminokislotalar qonga o‘tadi.
6. Jigar: safro ishlab chiqaradi; o‘t pufagi saqlaydi/quyuqlashtiradi. Safro ferment emas. Ovqat jigar yoki oshqozon osti bezining ichidan o‘tmaydi.
7. Oshqozon: aralashtirish, kislota va fermentlar ajratildi; to‘liq hazm va barcha oziqa so‘rilishi shu yerda tugaydi deyilmaydi.
8. Oshqozon osti bezi: ekzokrin shira ichakka, endokrin gormon qonga boradi. Insulin hazm fermenti emas.
9. Skelet/mushak: 206 kattalar skeletining odatiy hisobi, individual farqlar bor. Mushak tortadi; antagonistik guruhlar hamkorligi va sirpanadigan filamentlar modeli ajratildi.
10. Teri: epidermis va derma asosiy teri qavatlari, gipoderma odatda terining o‘zi emas. Epidermisda qon tomirlari yo‘q.
11. O‘simliklar: floema faqat pastga oqmaydi; barcha o‘simlik hujayralarida xloroplast yo‘q; O₂ suvdan keladi; changlanish urug‘lanish emas.
12. Ekologiya: organik qoldiqning hammasi darhol mineral o‘g‘itga aylanmaydi, modda aylanishi va energiya oqimi farqlanadi. Indekslar dalaga/klinikaga kalibrlanmagan.

## Tekshirish usuli va manbalar

Ikkala web-search engine ushbu muhitda `isError` qaytardi. Axborot birlamchi ochiq HTTPS sahifalaridan oddiy HTTP GET orqali tekshirildi; autentifikatsiya, kirish cheklovi yoki robots to‘sig‘i aylanib o‘tilmadi. Quyidagi ishlatilgan manbalar HTTP 200 va tegishli sahifa sarlavhasi bilan tasdiqlandi. Muvaffaqiyatsiz/404 nomzod URLlar modulga kiritilmadi; NINDS 403 sahifasi ham ishlatilmadi.

| Dalil | Birlamchi manba |
| --- | --- |
| Yurak kamerasi, joylashuv, tomir yo‘nalishi | https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy |
| O‘ng 3/chap 2 o‘pka bo‘lagi | https://openstax.org/books/anatomy-and-physiology-2e/pages/22-2-the-lungs |
| Nafas bosim/hajm mexanikasi | https://openstax.org/books/anatomy-and-physiology-2e/pages/22-3-the-process-of-breathing |
| Miya bo‘limlari | https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system |
| Motor yo‘llar kesishishi va refleks | https://openstax.org/books/anatomy-and-physiology-2e/pages/14-3-motor-responses |
| Buyrak filtrlashi/qayta so‘rilish | https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work |
| Buyrak po‘stloq/mag‘iz/jom | https://openstax.org/books/anatomy-and-physiology-2e/pages/25-3-gross-anatomy-of-the-kidney |
| Hazm, jigar safrosi, pankreatik shira | https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works |
| Ingichka/yo‘g‘on ichak, vorsinka/mikrovorsinka | https://openstax.org/books/anatomy-and-physiology-2e/pages/23-5-the-small-and-large-intestines |
| Insulin/glukagon, endokrin/ekzokrin farq | https://openstax.org/books/anatomy-and-physiology-2e/pages/17-9-the-endocrine-pancreas |
| Epidermis/derma/gipoderma | https://openstax.org/books/anatomy-and-physiology-2e/pages/5-1-layers-of-the-skin |
| Skelet va odatiy 206 suyak | https://openstax.org/books/anatomy-and-physiology-2e/pages/7-1-divisions-of-the-skeletal-system |
| Suyak vazifalari/ko‘mik | https://openstax.org/books/anatomy-and-physiology-2e/pages/6-1-the-functions-of-the-skeletal-system |
| Mushak tolalari/qavatlari | https://openstax.org/books/anatomy-and-physiology-2e/pages/10-2-skeletal-muscle |
| Aktin-miozin sirpanishi | https://openstax.org/books/anatomy-and-physiology-2e/pages/10-3-muscle-fiber-contraction-and-relaxation |
| Sezgi retseptorlari va idrok | https://openstax.org/books/anatomy-and-physiology-2e/pages/14-1-sensory-perception |
| Hujayra tuzilishi | https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells |
| Ildiz/poya, ksilema/floema | https://openstax.org/books/biology-2e/pages/30-5-transport-of-water-and-solutes-in-plants |
| O‘simlik to‘qimalari va meristema | https://openstax.org/books/biology-2e/pages/30-1-the-plant-body |
| Fotosintez va xloroplast | https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis |
| Changlanish, urug‘lanish, unish | https://openstax.org/books/biology-2e/pages/32-2-pollination-and-fertilization |
| Mineral ozuqa va tuproq | https://openstax.org/books/biology-2e/pages/31-1-nutritional-requirements-of-plants |
| Hayvonlar umumiy tuzilishi | https://openstax.org/books/biology-2e/pages/29-1-chordates |
| Baliq jabralari va suzgichlari | https://openstax.org/books/biology-2e/pages/29-2-fishes |
| Qurbaqa hayot davri | https://openstax.org/books/biology-2e/pages/29-3-amphibians |
| Qush tuzilishi va moslanish | https://openstax.org/books/biology-2e/pages/29-5-birds |
| Kapalakning tuxum/lichinka/g‘umbak/yetuk bosqichlari | https://www.floridamuseum.ufl.edu/educators/resource/butterfly-life-cycle/ |
| Energiyaning ekotizim bo‘ylab oqimi | https://openstax.org/books/biology-2e/pages/46-2-energy-flow-through-ecosystems |
| Kompost sharoiti | https://www.epa.gov/recycle/composting-home |
| Tug‘ma immunitet | https://openstax.org/books/biology-2e/pages/42-1-innate-immune-response |
| Moslashuvchan immun javob/antitanalar | https://openstax.org/books/biology-2e/pages/42-2-adaptive-immune-response |
| Meioz va gametalar | https://openstax.org/books/biology-2e/pages/11-1-the-process-of-meiosis |

## Integratsiya chegarasi

Bu yangi bilim va tushuntirish qatlami. Mavjud GLBning tashqi sirtini kesish yurakning to‘liq to‘rt kamerali kesimi yoki buyrak nefronining gistologik skaniga aylanmaydi. UI aniq sirt/konseptual ichki sxema farqini saqlashi kerak. Yangi GLB aktiv yoki mustaqil anatom mutaxassis sertifikati da’vo qilinmaydi.

Eski `organInfo.skin.inside` matni teri osti qavatini asosiy teri qatlamlari bilan bitta qatorda sanaydi; yangi panel izohida farq ochiq ko‘rsatilgan. Eski `BIOLOGY-SOURCES.md` boshidagi “tashqi GLB ishlatilmagan” jumlasi 7.18 holatiga tegishli; hozirgi loyiha allaqachon 7.21 BodyParts3D/HuBMAP tayyor sirtlarini ishlatadi. Yangilanish izohida shu farqni saqlash kerak.

Tekshiruv: Node assert bilan 11 organInfo kaliti aynan mosligi, har organda 4 tuzilma/4 bosqich/3 javobli savol, barcha 30 tayyor mavzu uchun profil borligi tekshirildi. Yakuniy ilova va brauzer tekshiruvi loyiha egasi agentga qoladi.
