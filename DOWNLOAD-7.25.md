# SinfQuiz 7.25 — yuklab olish uchun ixcham paket

Dastur kodi, barcha SQL migratsiyalar, darsliklar, testlar, audio, Python muhiti va 3D modellar asl 7.25 bilan bir xil. Faqat QA va previews papkalaridagi sinov suratlari chiqarildi. Test kodi va matnli/JSON hisobotlari saqlangan. Eski QA hujjatlaridagi ayrim surat havolalari bu paketda ochilmaydi; dastur bundan foydalanmaydi.

Bitta to‘liq ZIPni yuklagan bo‘lsangiz, uni ochish kifoya.

Agar kichik ZIPlarni yuklasangiz, UCHALASINI ham bir xil manzilga oching:

1. SinfQuiz-v7.25-1-Kod-Modellar.zip
2. SinfQuiz-v7.25-2-Ingliz-Audio.zip
3. SinfQuiz-v7.25-3-CEFR-Audio.zip

Windowsda har safar «Extract All / Извлечь все» uchun bir xil papkani tanlang, masalan Desktop\SinfQuiz-7.25. Yakunda bitta sinf-quiz papkasi bo‘ladi. ZIPlarni nomiga qarab uchta alohida loyiha papkasiga ajratmang. O‘quvchi funksiyalarining to‘liq ishlashi uchun uchala ZIPdagi fayllar kerak.

sinf-quiz ichida terminal oching:

```bash
npm ci
npm run dev
```

Mahalliy .env sozlamalaringizni saqlang. Supabase yangilanishi uchun UPDATE-7.25.md yo‘riqnomasidan foydalaning.
