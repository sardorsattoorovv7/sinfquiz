# Speaking va AI manbalari — 2026-11-02

Quyidagilar rasmiy birlamchi manbalar. Sahifa tekshirilgan sana hujjatning yangi nashr sanasi degani emas. Manbada aniq versiya berilmasa `officialDocumentVersion: null` saqlangan. Mahsulot siyosati `sq-speaking-text-evidence-746.1`; prompt fayli `server/speaking/prompts.js`da versiyalangan.

| Manba | Amalda ishlatilishi |
| --- | --- |
| [Groq compatibility](https://console.groq.com/docs/openai) | Serverdan OpenAI mos `/chat/completions`, `/audio/transcriptions` |
| [Structured outputs](https://console.groq.com/docs/structured-outputs) | GPT OSS 120B / 20B uchun `strict: true`, barcha maydon required, `additionalProperties: false`; streaming va tool chaqiruvisiz |
| [Speech to text](https://console.groq.com/docs/speech-to-text) | Whisper v3 / turbo, `verbose_json`, word + segment vaqt belgilari, inglizcha transkripsiya |
| [Models](https://console.groq.com/docs/models) | Standart model identifikatorlari; sozlashda qayta tekshiring |
| [API reference](https://console.groq.com/docs/api-reference) | Server parametr va xato javoblari |
| [IELTS Speaking format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking) | Uch qism va bo‘lim vaqtlari |
| [IELTS descriptors](https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf) | Grammatik / leksik dalilga oid qisqa qayta ifodalangan tayanchlar; to‘liq jadval nusxalanmagan |
| [UZBMB Speaking sahifasi](https://uzbmb.uz/page/cefr_speaking) | Format va baholash hujjatlarini tekshirish uchun asosiy rasmiy sahifa |
| [Multilevel format](https://uzbmb.uz/upload/file/pdf/phone/Speaking_yangi_format.pdf) | 3+3+1+1 audio uyasi, uch savolning birga ko‘rinishi, rasm va vaqtlar |
| [Multilevel format jadvali](https://uzbmb.uz/upload/file/pdf/phone/Speaking_format.pdf) | Format jadvalini tekshirish |
| [Multilevel descriptors](https://uzbmb.uz/upload/file/pdf/phone/yangi_format_eng.pdf) | Qismga mos til va mazmun talabi; rasmiy /75 konvertatsiya implementatsiyada yoqilmagan |

UZBMBning ayrim PDF URLlari to‘g‘ridan-to‘g‘ri ochilganda 502/503 qaytardi; ularning rasmiy qidiruv indeksidagi matni va rasmiy Speaking sahifasidagi bog‘lanishlar ham solishtirildi. Bu sababli amaldagi rasmiy ball jadvali to‘liq integratsiya qilindi deb da’vo qilinmaydi.

## Original kontent va tasvirlar

`server/speaking/questions.js`: SinfQuiz uchun original 6 IELTS / 6 Multilevel mock va 54 qo‘shimcha topshiriq. Ular haqiqiy imtihondan sizib chiqqan savollar yoki rasmiy savollar nusxasi emas. Bank versiyasi savol metadata bilan birga saqlanadi; savollarning qiyinligi taxminiy, kalibrlangan psixometrik qiymat emas.

`public/speaking/v7.46/`: 12 juftlik va 6 kontekst — 30 mahalliy SVG. Original dasturiy illyustratsiyalar, tashqi rasm, skript yoki resource chaqiruvisiz. Caption, obyektlar, muallif/huquq, aniq byte va SHA-256 [SOURCES.json](public/speaking/v7.46/SOURCES.json)da. Barcha SVGlar XML parse va renderdan o‘tkazilgan. Ular rasmiy fotosurat yoki fotoreal skan sifatida ko‘rsatilmaydi.

Rasm captionlari AI tahliliga savol bilan birga yuboriladi; ular model ko‘rsatmasi emas, ishonchsiz kontekst sifatida belgilanadi. Foydalanuvchi rasm tavsifini ko‘rishi urinish metadata orqali qayd qilinadi.

## Mahsulot siyosati

150 so‘zdan kam yoki to‘liq / ishonchli bo‘lmagan namunada provisional matn balli yo‘q; 100 so‘zdan kamida xato zichligi chiqarilmaydi. Bu sonlar rasmiy IELTS yoki UZBMB chegarasi emas. Faol o‘zlashtirish, review intervali, kunlik vaqtlar, server kvotalari va haftalik reja yangilanishi ham SinfQuiz o‘quv siyosatidir. Ularni rasmiy sertifikatlash formulasi sifatida ishlatmang.
