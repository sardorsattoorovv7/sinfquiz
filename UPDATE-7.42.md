# SinfQuiz 7.42.0 — barcha atlaslar uchun tushunarli o‘rganish yo‘li

## Ochish

**Atlaslar** menyusidan yangi atlaslar markazi ochiladi. Barcha fanlarning mavzularini bir joydan qidiring, boshlang‘ich mavzuni yoki keyingi o‘rganish yo‘lini tanlang.

| Atlas | Qo‘llanma qamrovi | Tavsiya etilgan yo‘llar |
| --- | ---: | ---: |
| Matematika | 62 mavzu | 9 |
| Biologiya | 30 mavzu | 4 |
| Kimyo | 12 tushuncha + 13 virtual tajriba | 4 |
| Fizika va koinot | 53 hodisa | 8 |
| Informatika | 4 katta bo‘lim | 1 |

Jami 174 mavzu va bo‘lim uchun bosqichli qo‘llanma, 26 o‘rganish yo‘li bor. Har bir mavzu kamida bitta yo‘lga kiritilgan. Qidiruv va asl mavzular xaritalari orqali erkin tanlash ham mumkin.

## Har bir mavzudagi yangi tartib

### 1. Tushuncha

Sodda izoh, aniq misol va ochib o‘qiladigan kichik atamalar lug‘ati. **Modelga o‘tish** tugmasi shu mavzudagi modelni topib, unga olib boradi.

### 2. Ikki sinov

Bir safar bitta omilni yoki ko‘rish qatlamini almashtiring. Modeldan kuzatilgan ikki holatni yozing: nimani o‘zgartirdingiz, birinchi natija qanday edi, ikkinchi natija qanday bo‘ldi? O‘lchov birligi va bir xil vaqt/holatni ayting. Bu maydonlar foydalanuvchi tomonidan to‘ldiriladi; avtomatik o‘lchangan qiymat deb ko‘rsatilmaydi.

### 3. Xulosa va savol

Izohli tushuncha savoliga javob bering va ikki sinovga tayangan xulosa yozing. Noto‘g‘ri javobdan keyin izohni o‘qib qayta urinishingiz mumkin. Qo‘llanma belgisi uchun ikki qayd, o‘zgargan omil, kamida 15 belgili xulosa va to‘g‘ri javob talab qilinadi.

Qaydni JSON sifatida yuklab olish, keyingi mavzuga o‘tish va yo‘lga qaytish bor. Qo‘llanma yakuni shaxsiy mashq belgisidir; rasmiy imtihon bali yoki ustozga yuborilgan ish bilan tenglashtirilmaydi. Atlasdagi mavjud yuborish oynasi server topshirig‘i uchun ishlatiladi.

## Fanlar bo‘yicha qayta ishlangan jihatlar

- **Matematika:** sonlardan algebra va grafiklarga, tekis shakllardan fazoviy jismlargacha yo‘llar. Ildiz bilan tenglama yechimlari, logarifm bilan daraja, yuza bilan perimetr, konus bilan silindr kabi tushunchalar alohida misollar bilan tushuntiriladi.
- **Biologiya:** hujayra → o‘simlik; hayvon → muhit; hujayra → to‘qima → organ; barg → tuproq → ekotizim. Har bir model oilasi uchun kuzatish yo‘nalishi, tushuncha savoli va lug‘at bor.
- **Kimyo:** zarracha va modda, reaksiyalar va saqlanish, boshlang‘ich laboratoriyalar hamda chuqurroq solishtirish yo‘llari. Atom tarkibi, Mendeleyev jadvali, pH, filtrlash, distillash va boshqa tajribalar izohlanadi.
- **Fizika/koinot:** yangi kirish xaritasi avval kun–tun singari tanish hodisalardan boshlashni taklif qiladi. Oy fazasi bilan tutilish, nova bilan birlashish, chaqnash bilan CME, disk bilan gorizont kabi tushunchalar alohida ajratilgan.
- **Informatika:** tarix, qismlar, OS va amaliyot uchun umumiy ketma-ketlik va ochiladigan bosqichli qo‘llanmalar qo‘shildi. Avvalgi tarix muzeyi, 18 qismli kompyuter va amaliy simulyatsiyalar ishlaydi.

## Saqlash va davom ettirish

Yangi qaydlar shu brauzerda foydalanuvchi hisobiga mos kalitda saqlanadi. Atlaslar markazi oxirgi qayd qoldirilgan mavzuni davom ettirishni taklif qiladi. Boshqa qurilmaga avtomatik sinxronlanmaydi.

Qo‘llanma mazmuni o‘zgarsa oldingi yakun belgisi yangilangan savol bilan qayta tekshiriladi. Boshqa foydalanuvchi qaydlari ajratilgan. Brauzer xotirasi bloklansa qaydni yuklab olish haqida xabar chiqadi.

## Telefon va foydalanish qulayligi

320, 390 va 768 px o‘lchamlar tekshirildi. Tungi ko‘rinish kontrasti, tablarni klaviatura bilan almashtirish va kamaytirilgan harakat sozlamasi qo‘llanadi. Mavjud 2D zaxira rejimlari saqlangan; qo‘llanma 3D ochilmaganda ham ishlaydi.

## O‘rnatish

Yangi SQL migratsiyasi, environment o‘zgarishi yoki dependency kerak emas. Mavjud Supabase sozlamalari bilan yangilangan loyiha odatdagi usulda ishga tushadi:

```sh
npm ci
npm run dev
```

To‘liq atlaslar markazi: `/#atlaslar`. Hisob talab qiladigan atlaslar amaldagi autentifikatsiyadan foydalanadi. Informatika avvalgi kabi mehmon uchun ham ochiq: `/#informatika-atlasi`.

```sh
npm test
npm run build
npm run perf
npx playwright install chromium
npm run test:e2e:atlases
npm run test:e2e:informatics
npm run test:e2e:space
```

Tekshiruv tafsilotlari: [QA-7.42.md](QA-7.42.md). Manbalar va model chegaralari: [ATLAS-LEARNING-SOURCES-7.42.md](ATLAS-LEARNING-SOURCES-7.42.md).
