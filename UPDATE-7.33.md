# SinfQuiz 7.33.0 — Qog‘oz ustaxonasi

## Ishga tushirish

1. To‘liq ZIP ichidagi `sinf-quiz` papkasini oching.
2. Amaldagi loyihangizning `.env.local` qiymatlarini saqlang. Yangi o‘rnatishda `.env.example`dan foydalaning.
3. Node.js 22.12 yoki yangiroq versiyada `npm ci` ishlating.
4. Lokal ishga tushirish: `npm run dev`.
5. Tekshirish: `npm test`; production uchun `npm run build`.

7.31.0 yoki 7.32.0 bazasidan ushbu yangilanishga o‘tishda **yangi SQL migratsiyasi kerak emas**. Birinchi o‘rnatishda mavjud `MIGRATIONS.md` tartibi amal qiladi. Yangi npm dependency qo‘shilmagan. Arxiv to‘liq manbani o‘z ichiga oladi; `node_modules` va `dist` o‘rnatish/build orqali yaratiladi.

## Yangi bosh sahifa

“Bilimni / qo‘lingiz bilan / sinab ko‘ring.” sarlavhasi, iliq qog‘oz palitrasi va olti fan xatcho‘pi. Fan tanlovi “Kashfiyot daftarim” mazmunini yangilaydi; “Kashf qilish” mavjud matematika, ingliz tili, informatika, kimyo, biologiya yoki fizika modulini ochadi.

Xatcho‘plar: sichqoncha, sensor, Arrow Up/Down/Left/Right, Home va End. Tab tanlangan xatcho‘pga keladi. Tanlangan fan `aria-selected` bilan, daftar esa `tabpanel` sifatida berilgan.

Yuqoridagi “Sinfga qo‘shilish” oynasi va bosh sahifadagi kod formasi bir xil `/api/resolve` oqimidan foydalanadi. Oltita raqam, boshidagi nollar, xato/band holati va bekor qilish qo‘llanadi. Oyna yopilgandan keyin kech kelgan javob foydalanuvchini boshqa sahifaga o‘tkazmaydi.

## Rollar va navigatsiya

| Rol | Saqlangan yo‘llar |
| --- | --- |
| Mehmon | Bosh sahifa, kodli kirish, ochiq mashqlar va kirish oynasi; himoyalangan fan uchun hisobga kirish |
| O‘quvchi | Darslar, atlaslar, mashqlar, musobaqalar, profil va natijalar |
| Ustoz | Mavjud boshqaruv paneli, test/darslar, guruhlar, natijalar, chat va Sinfxona |
| Administrator | Foydalanuvchilar, tasdiqlashlar va amaldagi administrator boshqaruvi |

Telefonning pastki menyusi: **Bosh · Darslar · Atlaslar · Mashqlar · Natijalar**. To‘liq menyuda musobaqalar va rolga mos boshqaruv yo‘llari mavjud. Hisobdan chiqish mobil menyuda ham bor. Faol mashqni himoyalash mantiqi saqlangan.

## Umumiy interfeys

Darsliklar daftar sahifasi va xatcho‘pli mundarija; atlaslar laboratoriya daftari boshqaruvlari; testlar ish varag‘i; ustoz/admin paneli jurnal ko‘rinishida. Kunduzgi/tungi rejim `sq_theme` orqali saqlanadi. Ranglar va qayta ishlatiladigan komponentlar [PAPER-WORKSHOP.md](PAPER-WORKSHOP.md)da tushuntirilgan.

3D/SVG sahnalar, grafiklar, hisoblashlar, test savollari, API/RPC/RLS va natija saqlash manbalari saqlangan. Audio Labirintning bog‘ sahnasi va maydon ostidagi javob paneli joylashuvi qolgan.

Kino Piano ham kiritilgan. Taymer ko‘rinmayotgan nota oynasiga bog‘liq emas; besh daqiqalik yozuv limiti, metronomni pauzada bekor qilish, tashqi pointer release va avtoijroda notani kuzatish tuzatishlari mavjud.

## Tekshiruv chegarasi

Testlar va production build bajarildi. Ushbu muhitda jonli brauzer, telefon ekrani, jismoniy MIDI va production Supabase/Vercel sinovi bajarilmadi. Aniq natijalar va tekshiruv usullari [QA-7.33.md](QA-7.33.md)da.
