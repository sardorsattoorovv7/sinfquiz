# Bilim oroli — dizayn va tasvir manbalari

Asos: foydalanuvchi tanlagan SinfQuiz oroli konsepti. Shu konseptdagi olti maskan, tungi ko‘l, ochiq kitob, kirish darvozasi va ko‘priklar qayta ishlatilgan. Boshqa mahsulotning brendi, Human Atlas dizayni yoki uchinchi tomon xaritasi ko‘chirilmagan.

Desktop va mobil manzara tasvirlari ushbu loyiha uchun image generation vositasida original konsept asosida yaratildi. Ustidagi matnlar, tugmalar, menyu va test formasi React/HTML boshqaruvlaridir; ular rasm ichiga chizib qo‘yilmagan. Mavjud fan sahnalari o‘z SVG/WebGL modellaridan foydalanishda davom etadi. Bosh sahifadagi orol esa render qilingan manzara: uni erkin aylantiriladigan WebGL dunyo deb talqin qilmaslik kerak.

| Fayl | O‘lcham | Bayt | Ishlatilishi |
| --- | --- | ---: | --- |
| `public/island/v7.27/island-desktop.webp` | 1586 × 992 | 491050 | Katta ekran xaritasi |
| `public/island/v7.27/island-mobile.webp` | 1086 × 1448 | 538266 | Telefon xaritasi |
| `public/island/v7.27/island-social.jpg` | 1586 × 992 | 485739 | Ijtimoiy tarmoq ulashish tasviri |

PNG manbalar ishlab chiqarish uchun WebP/JPEG formatiga kodlandi; xarita ichidagi obyektlar dasturiy retush bilan almashtirilmagan. Alohida stok aktiv yoki shrift sotib olish talab qilinmaydi. Interfeys o‘zidagi mavjud shriftlar va tizim shriftlariga tayanadi. Lucide ikonkalari mavjud paketdan olinadi; uning litsenziyasi saqlanadi. Bu reliz oldingi 3D/audio manbalar va ularning litsenziya fayllarini o‘zgartirmaydi.

Vizual solishtirishda tekshirilgan qismlar: SinfQuiz yozuvi, yuqori qidiruv va boshqaruvlar, olti fan tugmasi, markazdagi kitob, oldingi darvoza/ko‘prik, 6 xonali forma, to‘rtta pastki menyu tugmasi. Qolgan dastur funksiyalari orol ostidagi yo‘llar va umumiy menyu orqali saqlangan.

Faqat markaziy yorug‘lik sokin puls bilan harakatlanadi. “Harakatni to‘xtatish” haqiqatan shu effektni o‘chiradi; tizimdagi `prefers-reduced-motion` ham hurmat qilinadi. Menyu klaviaturada ishlaydi, Escape bilan yopiladi, fokus dialog ichida qoladi. Mobil va planshetda sarlavha, tugma va test formasi uchun alohida joy ajratilgan.
