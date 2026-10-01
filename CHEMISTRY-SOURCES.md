# Kimyo: ilmiy manbalar, chizmalar va model chegaralari

Kontent o‘zbek tilida SinfQuiz uchun mustaqil yozildi. Kitob matni yoki rasm nusxasi ko‘chirilmadi. Quyidagi birlamchi/ta’limiy manbalar ilmiy fakt va metodik tekshiruv uchun ishlatildi (2026-10-01).

| Sahna | Tekshiruv manbasi | Qo‘llanishi |
|---|---|---|
| Atom va davriy jadval | [IUPAC Periodic Table](https://iupac.org/what-we-do/periodic-table-of-elements/), [OpenStax elektron konfiguratsiyasi](https://openstax.org/books/chemistry-2e/pages/6-4-electronic-structure-of-atoms-electron-configurations) | 118 elementning tartibi, nomi/belgisi; elektron modeli bilan orbitalni ajratish |
| Molekula va bog‘ | [OpenStax Molecular Structure and Polarity](https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity) | Suvning burchakli, metanning tetraedrik, CO₂ ning chiziqli geometriyasi |
| Modda holati | [OpenStax Phase Transitions](https://openstax.org/books/chemistry-2e/pages/10-3-phase-transitions) | Faza va molekula kimligini ajratish; qaynash bosimga bog‘liqligi |
| Reaksiya | [OpenStax Classifying Chemical Reactions](https://openstax.org/books/chemistry-2e/pages/4-2-classifying-chemical-reactions) | Reagent, mahsulot, ion va atomlar saqlanishi |
| pH | [OpenStax pH and pOH](https://openstax.org/books/chemistry-2e/pages/14-2-ph-and-poh), [14-bob xulosasi](https://openstax.org/books/chemistry-2e/pages/14-summary) | 25 °C dagi Kᵥ va konsentratsiya balansi |
| Tezlik/energiya | [OpenStax Collision Theory](https://openstax.org/books/chemistry-2e/pages/12-5-collision-theory), [Catalysis](https://openstax.org/books/chemistry-2e/pages/12-7-catalysis) | Arrhenius, aktivlanish energiyasi, katalizator va ΔH farqi |
| Aralashma | [OpenStax Dissolution](https://openstax.org/books/chemistry-2e/pages/11-1-the-dissolution-process), [Electrolytes](https://openstax.org/books/chemistry-2e/pages/11-2-electrolytes), [PubChem Sodium Chloride](https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-chloride) | Erigan ionlar va erimagan zarrachalarni ajratish |
| Elektr-kimyo | [OpenStax Electrolysis](https://openstax.org/books/chemistry-2e/pages/17-7-electrolysis) | Galvanik element va elektrolizni ajratish, elektrolitga bog‘liq mahsulotlar |

## Aktivlar va foydalanish huquqi

Kimyo sahnasining SVG chizmalari, atom sharlari, bog‘lari, energiya grafigi, kristall va laboratoriya sxemalari ushbu loyiha uchun kod orqali yaratildi. Tashqi GLB, tekstura yoki surat import qilinmadi. Molekula koordinatalari ta’limiy geometriya namunalaridir. Ikonkalar mavjud `lucide-react` paketidan (ISC litsenziyasi) olinadi. Oldingi bo‘limlarning GLB aktivlari va atributsiyalari `MODEL-SOURCES.md` da saqlangan.

## Model chegaralari

- Atom raqami Z=protonlar, massa soni A=protonlar+neytronlar, zaryad=protonlar−elektronlar. Atom quruvchisi 1–20 proton uchun; davriy jadvalda barcha 118 element mavjud. Har hisobiy kombinatsiya barqaror izotop yoki ion emas.
- Qavat rasmi 20 elektrongacha 2/8/8/2 taqsimotning cheklangan hisob modeli. Elektronlar aniq orbitada aylantirilmaydi. 1s/2p tasviri orbital shaklini taqqoslaydi, tanlangan atomning to‘liq konfiguratsiyasi emas.
- Jadval massani neytron soni bilan aralashtirmaslik uchun atom og‘irliklarini bermaydi. Yuqori atom raqamli elementlarda individual fizik xossalar o‘rniga cheklangan bilim haqida izoh beriladi. Umumiy oilaviy xossalar alohida element uchun aniq raqamli ma’lumot emas.
- Molekula modeli fazoviy koordinatalarni aylantirib, SVG da chuqurlik bo‘yicha chizadi; WebGL talab qilmaydi. H/C/N/O odatiy neytral valentlik va graf bog‘langanligi tekshiriladi. Ionlar, radikallar, rezonans va moddalar barqarorligi hisoblanmaydi. Erkin joylashuv optimallashtirilgan geometriya emas.
- Suvning qattiq/suyuq/gaz sahnasi sof suv, 1 atm va yaxlitlangan 0/100 °C chegaralari uchun. Faza ulushi, latent issiqlik va zichlik hisoblanmaydi; chegarada ikki faza bo‘lishi ko‘rsatiladi.
- Reaksiya chizmasi atom hisobini guruhlaydi, haqiqiy kinetik mexanizmni emas. Zang Fe₂O₃ bilan soddalashtirilgan; haqiqiy zang gidratlangan oksidlar aralashmasi.
- pH: 100 ml yakuniy eritma, 25 °C, bir protonli kuchli kislota/asos, ideal faollik. H₃O⁺−OH⁻ miqdor balansi va Kᵥ=10⁻¹⁴ hisoblanadi. Teng miqdor pH=7; indikator ranglari taxminiy.
- Tezlik: Eₐ=40 kJ/mol, tayanch 25 °C; konsentratsiya va sirt koeffitsiyenti chiziqli, katalizator shartli 2×. Natija muayyan real reaksiyaning o‘lchovi emas. Barlar bir xil masshtabda ikki nisbiy tezlikni taqqoslaydi.
- Aralashma: NaCl uchun 20 °C da taxminiy 35,9 g/100 g suv eruvchanligi tanlangan. Ideal filtrlash, to‘liq bug‘latish va distillash; real apparat, yo‘qotish, aralashmadagi boshqa uchuvchan moddalar hisoblanmaydi.
- Galvanik model Zn/Cu qaytarilish/oksidlanish hisobini; elektroliz modeli esa ideal suvning 2:1 H₂/O₂ nisbatini ko‘rsatadi. Kuchlanish yoki real apparat hisoblanmaydi.

Bular uyda bajariladigan laboratoriya yo‘riqnomalari emas. Xavfli reagent miqdori, apparat yig‘ish yoki amaliy jarayon shartlari berilmaydi.

## 7.17 laboratoriya ishlari: manba va farazlar

Tekshiruv sanasi: 2026-10-01. Tajriba matnlari, parametrlar va grafikalar mustaqil yaratilgan; quyidagi manbalardan tajriba rasmi, video, kitob matni yoki aktiv ko‘chirilmagan.

| Sahna | Birlamchi ta’lim manbasi | Hisob va chegara |
|---|---|---|
| Ko‘pik vulqoni, shar | [ACS — Controlling the Amount of Products](https://www.acs.org/middleschoolchemistry/lessonplans/chapter6/lesson2.html), [OpenStax ideal gas](https://openstax.org/books/chemistry-2e/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law) | NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂; n(CO₂)=min(n(soda),n(kislota)). V=nRT/P, 25 °C va 1 atm. Ko‘pik va shar elastikligi sifat chizmasi, CO₂ ning suvda erishi hisoblanmagan. |
| Karam indikatori | [ACS — Red Cabbage Indicator](https://www.acs.org/education/activities/red-cabbage-indicator.html) | Antosianin rang diapazonlari taxminiy; pH kiritiladi, indikator muvozanati hisoblanmaydi. |
| Neytrallanish | [OpenStax pH/pOH](https://openstax.org/books/chemistry-2e/pages/14-2-ph-and-poh) | 100 ml, kuchli bir protonli kislota va kuchli asos; ortiqcha konsentratsiya hamda Kᵥ=10⁻¹⁴. Byuretka oqimi fizik hisob emas. |
| NaCl erishi, kristallash | [ACS — Why Does Water Dissolve Salt?](https://www.acs.org/middleschoolchemistry/lessonplans/chapter5/lesson3.html), [OpenStax Solubility](https://openstax.org/books/chemistry-2e/pages/11-3-solubility), yuqoridagi PubChem NaCl manbasi | 20 °C uchun 35,9 g / 100 g suv o‘quv modeli. Kristallash suvni yo‘qotish bilan, sovitish bilan emas. Tuz massasi saqlanadi. |
| Filtrlash, distillash, moy/suv | [OpenStax Phases and Classification](https://openstax.org/books/chemistry-2e/pages/1-2-phases-and-classification-of-matter), yuqoridagi erish/faza manbalari | Ideal filtr erimagan qumni ushlaydi. Ideal kondensator suvni yig‘adi. Moy/suv aralashmaydi; ρ=0,90 va 1,00 g/ml deb berilgan. |
| Diffuziya | [OpenStax Effusion and Diffusion](https://openstax.org/books/chemistry-2e/pages/9-4-effusion-and-diffusion-of-gases) — zarracha tarqalishi uchun metodik qiyos | Suvdagi aniq bo‘yoq D koeffitsiyenti bu manbadan olinmagan. Sahna D=(T+273,15)/293,15 va kenglik √(2Dq) bo‘lgan **shartli** Gauss tarqalishi; gaz uchun Graham qonuni suyuqlikka ko‘chirilmagan. |
| Xromatografiya | [ACS Color Quest](https://www.acs.org/education/activities/color-quest.html), [RSC Paper Chromatography](https://edu.rsc.org/mixtures-and-separation/paper-chromatography-practical-videos-14-16-years/4018537.article) | Uch sun’iy pigment Rf=0,25/0,55/0,80; bular ma’lum siyoh yoki modda uchun o‘lchangan qiymatlar emas. |
| O‘tkazuvchanlik | [OpenStax Electrolytes](https://openstax.org/books/chemistry-2e/pages/11-2-electrolytes) | NaCl ionlar, shakar asosan neytral molekulalar beradi. I=0,01+0,99·(tuz/3) — shartli nisbiy datchik; amper/siemens va real elektrod reaksiyasi emas. |
| Zanglash | [OpenStax Corrosion](https://openstax.org/books/chemistry-2e/pages/17-6-corrosion) | I=1−exp(−namlik·kislorod·(1+tuz)·q), ulushlar 0–1: **shartli ko‘rgazmali indeks**, haqiqiy korroziya tezligi yoki temir yo‘qotilishi emas. |

`q` — virtual jarayon bosqichi (0–1), haqiqiy soniya emas. Stexiometriya va massalar balansi aniq berilgan o‘quv farazlari ichida hisoblanadi. Issiqlik almashinuvi, suyuqlik oqimi, to‘liq kinetika, apparat xatolari va xavfsizlik reglamenti bu simulyatorning raqamli egizagi emas. Har sahna o‘z farazini ko‘rsatadi; bular mustaqil uy tajribasi yo‘riqnomalari emas.
