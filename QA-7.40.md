# SinfQuiz 7.40.0 — tekshiruvlar

- `npm test`: **314 test o‘tdi, 0 xato, 0 tashlab ketilgan**; `qa-7.40.0/all-tests.log`.
- `npm run build`: production build muvaffaqiyatli; `qa-7.40.0/build-final.log`.
- `npm run perf`: hajm chegaralari bajarildi; `qa-7.40.0/performance.json`.

## Kuylar va darslar

Besh yangi tayyor melodiya: Belalım, Çalıkuşu, Unutmak İstiyorum (Ufuk Çalışkan), Diet Mountain Dew va Bu Akşam Ölürüm. Jami **283 nota**, **2638 bayt MIDI**. Avvalgi 72 kuy va 38 mashq saqlangan; endi 77 tayyor kuy bor.

Beshala yangi karta tashqi musiqa so‘rovlari bloklangan holda ochildi va o‘z notalarini audio scheduler’ga yubordi. Har bir Do–Re–Mi darsi oxirigacha pointer hodisalari bilan chalindi, noto‘g‘ri nota oldinga o‘tkazmadi va yakuniy progress saqlandi. Bu mock audio engine bilan UI/scheduler tekshiruvi. Tashqi musiqa so‘rovi: 0.

Har bir nota MIDI eksportidan qayta o‘qilib, balandligi, davomiyligi va boshlanish vaqti darsga solishtirildi. SHA-256, o‘ng qo‘l belgilari va 30 soniyadan oshmasligi tekshirildi. Ochiq manba PDF/JPG/tab fayllari fingerprintlari tekshirildi; tanlangan qismlar va boshlang‘ich nota ketma-ketliklari vizual solishtirildi. `qa-7.40.0/source-fidelity.json`da qaydlar bor.

Belalım va Bu Akşam — vokal naqorat. Çalıkuşu — Esin Engin mavzusi; Unutmak — Ufuk Çalışkan aranjirovkasidagi asosiy takroriy qism. Diet Mountain Dew haqiqiy naqorat tovushlaridan, **soddalashtirilgan o‘quv ritmida**. Bu farqlar ilova tavsifi va manbalarda yozilgan. **Alisher Uzoqov — Nahotki shu bo‘lsa sevgi hali kiritilmagan**, aniq melodiya tasdiqlanmadi.

## Balandroq ovoz

Manual klavish, avtoijro, tutorial namunasi va MIDI bir xil kuchaytirilgan audio yo‘lidan o‘tishi tekshirildi. Kompressor → chiqish gain → yumshoq cheklagich → analyser → audio chiqish yo‘lida cheklagichni chetlab o‘tadigan ulanish yo‘q. Native Web Audio tugunlari ishlatiladi, alohida audio bank yoki JS audio loop qo‘shilmadi.

Cheklagich egri chizig‘i nol signalda nol, normal amplitudada chiziqli, simmetrik, monoton va 0.97 dan kichik chegarada ekanligi sonli tekshirildi. Saqlangan 40% ovoz/1.2× gain tanlovi o‘zgarmay qo‘llandi; 0% ovoz jim holicha qoldi. Yangi standart 90% ovoz va 1.10× gain. 6/8 metronom sakkizliklarni sanab, har oltinchi urishda taktni ajratishi tekshirildi; eski 4/4 holati saqlandi.

Bu native audio grafigi va matematik signal cheklash sinovi. Haqiqiy brauzerdan audio renderi yoki quloq bilan ovoz balandligi/tembr solishtiruvi bajarilmadi; qurilma dinamiklaridagi natija alohida tekshiruvni talab qiladi.

## Telefon va planshet

Oldingi 90° sahna testlari o‘tdi: fullscreen/orientation rad etilganda fallback, fokus va scroll tiklanishi, ushlangan notalar qo‘yib yuborilishi, tutorial progress saqlanishi, kech kelgan fullscreen javobi sahnani qayta ochmasligi. Yonlama ovoz slayderi o‘zgartirilib, oddiy ko‘rinishga qaytganda 96% qiymat va saqlangan sozlama tekshirildi. Slayderning bosish maydoni kamida 44 px CSS bilan berilgan.

320×640, 390×844, 768×1024, 1024×768, 1920×1080 va 3840×2160 maydon geometriyasi hisoblari o‘tdi. Bu ekran renderi yoki haqiqiy telefon/planshet sensor sinovi emas.

## Mavjud loyiha va performance

Rol navigatsiyasi, kod bilan sinfga kirish, fanlar, test/natijalar, musobaqa, typing, darslar, atlaslar, dark/light tokenlar, SQL/RPC/RLS va haqiqiy Python runtime bo‘yicha mavjud testlar o‘tdi. Auth, Supabase, API va natijani saqlash kodi o‘zgarmagan; yangi SQL, dependency yoki environment kerak emas.

Boshlang‘ich JS **583481 bayt**, gzip taxmini **171603 bayt**. CSS **314436 bayt**, gzip **55345 bayt**. 7.39 bilan siqilmagan JS va CSS hajmi bir xil. Yangi nota ma’lumotlari pianino moduli bilan kechiktirib yuklanadi. Bu resurs hajmi o‘lchovi; real LCP, INP yoki Lighthouse natijasi emas.

7.39 ZIPdagi 1294 yo‘l saqlanadi, oldingi 540 SQL/public/data fayli baytma-bayt o‘zgarmagan. Paketlash barcha arxiv yozuvlari, CRC, dublikatlar, xavfsiz yo‘llar va fayl baytlarini solishtiradi. To‘liq manba PDF/JPG/audio, node_modules, dist va shaxsiy environment fayllari ZIPga kiritilmaydi. ZIPning saqlangan nusxasi hajm/SHA-256/CRC bo‘yicha alohida qayta tekshiriladi.

Node/JSDOM/Vite SSR ishlatildi. Browser boshqaruvi mavjud bo‘lmagani uchun haqiqiy mobil brauzer ko‘rinishi, tashqi MIDI va jonli Supabase hisoblaridagi E2E bu safar bajarilmadi.
