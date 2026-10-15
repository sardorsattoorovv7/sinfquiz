# Paper Workshop dizayn tizimi

## Markaziy tokenlar

`src/paper/paper-tokens.css` — ilova palitrasi, serif/sans/mono shriftlar, 4–64 px masofa shkalasi, chegaralar, radiuslar, iliq soyalar va 180 ms o‘tishlar manbasi. `data-theme="dark"` tungi qiymatlarni yoqadi; `data-design="paper"` yagona dizayn doirasini belgilaydi.

| Vazifa | Kunduz | Tun |
| --- | --- | --- |
| Sahifa | #EEE5D5 | #302A24 |
| Qog‘oz | #F8F2E7 | #494034 |
| Matn | #38382B | #F2E6CF |
| Yordamchi matn | #68604F | #C8BCA3 |
| Chegara | #BEB29B | #756951 |
| Terrakotta | #C74B2D | #FFAF83 |
| Lenta | #E7CC73 | #74612B |
| Xira ko‘k | #B8C6E3 | #4D607E |

Kichik terrakotta matn uchun `--pw-accent-ink` kunduzda #AD3E25: asosiy #C74B2D qog‘oz fonida 4.21:1 beradi va katta sarlavhada ishlaydi. To‘qroq tus kichik havolalarni 4.5:1 dan yuqori qiladi. Asosiy tugma foni berilgan #C74B2D; oq yozuv bilan 4.70:1. Tunda #FFAF83 ustidagi to‘q yozuv 7.90:1. `--pw-control-border` input chegarasiga kamida 3:1 ajralish beradi; dekorativ qog‘oz chegarasi asl palitrada qoladi.

Asosiy shrift — Inter mavjud bo‘lsa, aks holda sifatli tizim sans-serif. Sarlavhalar — Georgia. O‘qish matni 16–18 px, qator oralig‘i 1.75–1.85, tavsiya etilgan uzunlik 74ch gacha. Tashqi shrift yuklash majburiy emas.

## Qayta ishlatiladigan komponentlar

`src/paper/PaperUI.jsx`:

| Komponent | Ishlatilishi |
| --- | --- |
| PaperBrand | `sinfquiz.` yozuvi va kichik yulduzcha |
| PaperButton | Asosiy, ikkilamchi va sokin tugma |
| PaperInput | Umumiy input |
| PaperBookmark | Fan xatcho‘pi |
| NotebookPanel | Daftar yuzasi, spiral va lenta |
| PaperDialog | Fokus chegarasi, Escape va fokusni qaytaruvchi oyna |
| PaperNotice | Xabar, xato va ogohlantirish |
| PaperSkeleton | Yengil yuklanish holati |

`ClassJoinForm.jsx` bosh sahifa va umumiy oynada qayta ishlatiladi. `PaperHome.jsx` haqiqiy mavjud modullarga bog‘langan olti fan daftarini yaratadi.

## Mavjud modullarga ulanish

`paper-workshop.css` eski modul tokenlarini umumiy qog‘oz tokenlariga moslaydi: Studio, Math, Chemistry, Biology, Space, English Course, CEFR, Open Exam, Classrooms, Competitions, Maze va Piano. Lazy yuklangan modul CSS’i umumiy palitrani almashtirib yubormasligi uchun dizayn selektorlari aniq doiraga ega.

UI mavzularining ranglari boshqariladi; ilmiy 3D model va sahna ma’lumotlari alohida saqlanadi. Natija ranglari, xavf/xato va to‘g‘ri javob holatlari semantik ranglar orqali ajratiladi. Formadagi uzun matnlar, jadvallar, savollar va tajriba maydonlari qiyshaytirilmaydi.

## Responsiv va harakat

320/390 px uchun ixcham xatcho‘plar, bitta ustundagi daftar, besh yo‘lli pastki menyu va kod formasi uchun vertikal tartib mavjud. Planshetda qidiruv alohida qatorga o‘tadi; keng desktop va doskada sahna/kontent kengayadi. Keng jadval va piano o‘z konteynerida suriladi.

Muhim tugmalarning bosish maydoni kamida 44 px. Hover ko‘tarilishi 2–3 px; o‘tishlar 180–190 ms. `prefers-reduced-motion` o‘tish va bezak animatsiyalarini o‘chiradi. Lenta, teshiklar va qog‘oz qatlamlari `aria-hidden` va `pointer-events:none` bilan boshqaruvlardan ajratilgan.

Responsiv qoidalar yozilgan va CSS parser tekshiruvidan o‘tgan. Bu haqiqiy 320/390 px brauzer o‘lchovi o‘rnini bosmaydi; cheklovlar QA faylida yozilgan.
