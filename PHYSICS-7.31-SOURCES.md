# 7.31 fizik modellar, manbalar va aktivlar

## Quyosh–Yer masofasi

Hisob `src/space/physical.js`da. Masofa r — AU, albedo A — birliksiz ulush.

- F = 1361 / r² W/m² — masofaga bog‘liq oqim.
- Q = F(1−A)/4 — butun shar bo‘yicha o‘rtacha so‘rilgan oqim.
- T_eq = (Q/σ)^(1/4), σ = 5,670374419 × 10⁻⁸ W/(m²·K⁴).
- T₀ 1 AU, A=0,3 uchun hisoblanadi. T(t)=T₀+(T_eq−T₀)(1−e^(−5t)); 0≤t≤1.
- Sof oqim Q−σT⁴. Grafikda harorat yoki boshqa o‘lchovni tanlash mumkin.

Qizish vaqtining eksponenti ko‘rgazmali yaqinlashish bo‘lib, Yerning haqiqiy issiqlik sig‘imi yoki atmosfera modeli emas. Atmosfera, bulut, okean oqimlari va albedo qayta aloqasi hisoblanmagan. Ekrandagi radiuslar va masofa haqiqiy nisbatda emas; slayderdagi masofa fizik hisobda qo‘llanadi. Harorat inson yashash imkoniyatining prognozi sifatida ishlatilmaydi.

[NASA — Climate and Earth’s Energy Budget](https://science.nasa.gov/earth/earth-observatory/climate-and-earths-energy-budget/). Bu manba radiatsion energiya balansi uchun tekshirildi; modelni NASA sertifikati yoki haqiqiy iqlim modeli deb atamaymiz.

## Okean: bosim zichlikdan farq qiladi

Sirtdagi atmosfera bosimi 101 325 Pa, g=9,81 m/s², boshlang‘ich dengiz suvi zichligi 1025 kg/m³ (o‘zgartirish mumkin).

O‘zgarmas zichlik rejimi: ΔP=ρ₀gh. Oz siqiladigan suv uchun doimiy hajmiy elastiklik K=2,2 GPa deb olinadi:

- q=ρ₀gh/K.
- ΔP=−K·ln(1−q).
- ρ=ρ₀/(1−q).
- Mutlaq bosim P=P_atm+ΔP. 1 bar =100 000 Pa.
- Ideal yopiq gaz namunasida V/V₀=P_atm/P. Harorat va molekulalar soni o‘zgarmaydi.
- Suv hajmining kamayishi 1−ρ₀/ρ.

Bu dP/dh=ρg va doimiy K ni birga yechgan ta’limiy model. Haqiqiy dengiz suvi harorati va sho‘rligi ham muhim; model TEOS-10 o‘rnini bosmaydi. Juda yuqori bosimda haqiqiy gaz ideal gaz qonunidan chetga chiqadi. Kabina ichidagi bosim 1 atmosfera deb olinadi; faqat ΔP / tanlangan chegara >1 bo‘lganda ko‘rgazmali bukilish paydo bo‘ladi. Qobiq deformatsiyasi haqiqiy material va konstruksiya mexanikasi bilan hisoblanmagan.

Standart parametrlar bilan 10 935 m da taxminan 1128,98 bar, 1078,92 kg/m³ va suv hajmining 5,00% kamayishi chiqadi. Ideal gaz namunasining hisobiy hajmi boshlang‘ich hajmning taxminan 0,08975%iga teng. Bu qiymatlar inson o‘pkasi yoki fiziologiyasiga tatbiq qilinmaydi. Odam 332,35 m da avtomatik maydalanadi degan chegara berilmaydi. Chuqurlik rekordi himoyalangan apparat yoki maxsus sho‘ng‘ish kontekstini talab qiladi.

Vertikal ko‘lam ln(1+h/500) bilan siqilgan, HUD va o‘lchovlar esa haqiqiy metr birlikda. Okean tubi tayyor batimetrik xarita emas.

Tekshirilgan tayanchlar:

- [NOAA — A Pressing Engagement](https://www.noaa.gov/jetstream/ll-engagement): suv ustuni va chuqurlik bosimi.
- [NOAA repository — Greenaway va boshqalar, 2021](https://repository.library.noaa.gov/view/noaa/33477): Challenger Deep o‘lchovi 10 935 ±6 m; bu modelda tub belgisi uchun olinadi.
- [Guinness — Ahmed Gabrning SCUBA rekordi](https://www.guinnessworldrecords.com/world-records/deepest-scuba-dive-male): 332,35 m, 2014-yil 18-sentabr. Xavfsizlik chegarasi emas.
- [TEOS-10 — gsw_rho](https://www.teos-10.org/pubs/gsw/html/gsw_rho.html): haqiqiy dengiz suvi zichligi uchun sho‘rlik, harorat va bosimga bog‘liqlik.

## 3D aktivlar

| Aktiv | Manba va huquq | Loyihadagi holat |
| --- | --- | --- |
| Quyosh | [NASA Sun 3D Model](https://science.nasa.gov/learn/heat/resource/sun-3d-model/), NASA/VTAD; NASA ta’limiy media qoidalari bo‘yicha kredit saqlangan, NASA qo‘llab-quvvatlashi da’vo qilinmaydi | `public/space/v7.31/sun-nasa.glb`; geometriya o‘zgarmagan, tekstura 2048 px JPEGga optimallashtirilgan, 322 040 bayt |
| Odamning tashqi tana modeli | [BodyParts3D](https://lifesciencedb.jp/bp3d/), Database Center for Life Science; CC BY 4.0 | Avvalgi `public/biology/v7.21/anatomy-skin.glb` qayta ishlatiladi. Rang ko‘k tusga o‘zgartiriladi, kabinada siluet sifatida ko‘rsatiladi; anatomiya/tibbiy model sifatida yangi da’vo yo‘q |
| Yer va Oy | Avvalgi 7.30 NASA/VTAD aktivlari; manba va kredit `public/space/v7.30/manifest.json`da | Fayllar baytlari o‘zgarmagan |
| Kabina, suv ustuni, qobiq bo‘laklari, strelkalar va 2D fallback | Shu loyiha uchun kodda yaratilgan geometriya | Chet model yoki tekstura ko‘chirilmagan. Vazifasi fizik sabab-oqibatni ko‘rsatish |

BodyParts3Dning mavjud litsenziya fayli saqlangan. Yangi NASA aktivining manbasi, huquqi, o‘lchami va SHA256 kodi `public/space/v7.31/manifest.json`da. Ishlatilgan modelni qayta optimallashtirish skripti `scripts/build-space-assets-731.py`.
