// Time positions are schematic, not dates or measured durations.
const point=(x,label)=>({kind:'point',x,label});
const span=(from,to,label)=>({kind:'span',from,to,label});
const link=(from,to,label)=>({kind:'link',from,to,label});
const repeat=label=>({kind:'repeat',from:70,to:570,label});
const view=(why,events)=>({why,events});
export const timelines={
 'en-a1-09':[
  view('Every day bir martalik hozirgi voqeani emas, takrorlanadigan odatni bildiradi.',[repeat('Ko‘p kunlarda takrorlanadi')]),
  view('Goes uchinchi shaxs shakli; bu yerda avtobusdagi odatiy yo‘l aytilgan.',[repeat('Odatiy yo‘l')])],
 'en-a1-11':[
  view('Is reading hozir davom etayotgan jarayonni ko‘rsatadi. Qachon tugashi aytilmagan.',[span(260,380,'Jarayon hozirni qamraydi')]),
  view('Am writing shu vaziyatdagi jarayon. Chiziq uning aniq necha daqiqa davom etishini bildirmaydi.',[span(260,380,'Hozir yozish jarayoni')])],
 'en-a2-01':[
  view('Yesterday holatni tugagan o‘tgan vaqtga bog‘laydi. We bilan were ishlatiladi.',[point(145,'Kecha muzeyda bo‘lish')]),
  view('Was tired safardan keyingi o‘tgan holat. Safarning sanasi aytilmagan.',[point(185,'Safardan keyin charchagan')])],
 'en-a2-02':[
  view('Visited — tugallangan o‘tgan harakat; aniq sanani bu gapning o‘zi bermaydi.',[point(150,'Tugallangan tashrif')]),
  view('On Sunday tugagan yakshanba vaqtini belgilaydi. Played shu vaqtdagi harakat.',[point(155,'O‘tgan yakshanbadagi o‘yin')])],
 'en-a2-04':[
  view('Was reading at eight — o‘tgan paytda davom etayotgan jarayon. Shu payt ichida kuzatuv bor.',[span(75,245,'O‘qish jarayoni'),point(155,'O‘tgan vaqtdagi soat sakkiz')]),
  view('Went out — chiroq o‘chishi kabi qisqa voqea. Past Simple davom etayotgan jarayondan ajraladi.',[point(160,'Chiroq o‘chishi')])],
 'en-a2-05':[
  view('Going to oldindan belgilangan niyatni kelajakdagi tashrif bilan bog‘laydi.',[link(320,515,'Hozirgi niyat → keyingi tashrif'),point(515,'Kelajakdagi tashrif')]),
  view('I’ll carry shu vaziyatda bildirilgan yordam taklifi. Harakat oldinda.',[link(320,480,'Taklif → keyingi yordam'),point(480,'Sumkani ko‘tarish')])],
 'en-a2-11':[
  view('Have finished: tugagan harakatning hozirgi natijasi muhim. Aniq tugagan vaqt berilmagan.',[point(205,'Plakat tugagan'),link(205,320,'Hozir natija bor')]),
  view('Has seen tajribani hozirgacha bo‘lgan davrga bog‘laydi. Film ko‘rilgan sana aytilmagan.',[point(180,'Oldingi tajriba'),link(180,320,'Hozirgacha bo‘lgan tajriba')])],
 'en-a2-13':[
  view('For two years boshlanishdan hozirgacha davomiylikni beradi. Grafikdagi uzunlik kunlar soni emas.',[span(110,320,'Ikki yil davomida — hozirgacha')]),
  view('Since 2024 boshlanish nuqtasi. Tanishlik hozirgacha davom etadi.',[span(95,320,'2024-yildan hozirgacha')])],
 'en-b1-01':[
  view('Every Friday muntazam odat. Present Simple bitta ayni damdagi voqea bilan cheklanmaydi.',[repeat('Juma kunlarida takrorlanadi')]),
  view('Today I am checking vaqtinchalik bugungi jarayonni ajratadi.',[span(260,380,'Bugungi tekshirish jarayoni')])],
 'en-b1-02':[
  view('Have been working oldin boshlangan jarayonni hozir bilan bog‘laydi; u davom etayotgan yoki yaqinda tugagan bo‘lishi mumkin.',[span(100,320,'Bir soat davomida ishlash')]),
  view('Have written three pages jarayonning sonli natijasini ko‘rsatadi. Hozir uch sahifa tayyor.',[point(230,'Uch sahifa yozilgan'),link(230,320,'Hozirgi natija')])],
 'en-b1-03':[
  view('Had left voqeasi arriveddan oldin sodir bo‘lgan. Ikkala voqea ham hozirdan oldin.',[point(95,'Avtobus ketgan'),point(210,'Men yetib kelganman')]),
  view('Was waiting hikoyadagi o‘tgan paytda davom etayotgan holat. Aniq davomiylik berilmagan.',[span(75,245,'O‘tgan paytdagi kutish')])],
 'en-b2-01':[
  view('Have repaired three shelves tugagan ish miqdorini hozirgi natija sifatida ko‘rsatadi.',[point(210,'Uch tokcha tayyor'),link(210,320,'Hozirgi natija')]),
  view('Have been repairing all morning bajarilish jarayoni va davomiyligini ajratadi. Tugagan tokchalar soni bu gapda yo‘q.',[span(90,320,'Ertalab davom etgan ish')])],
 'en-b2-02':[
  view('Will be arranging kelajakdagi soat o‘nda davom etayotgan jarayonni ko‘rsatadi.',[span(425,505,'Kelajakdagi jarayon'),point(465,'Soat o‘n')]),
  view('Will have finished kelajakdagi tush paytigacha tugagan natijani ko‘rsatadi.',[point(490,'Ish tugashi'),point(565,'Tush paytidagi chegara')])],
 'en-b2-04':[
  view('If I had practised — amalga oshmagan o‘tgan shart; would feel now — taxminiy hozirgi natija. Bu chiziq haqiqiy voqea emas.',[point(130,'Amalga oshmagan o‘tgan shart'),link(130,320,'Taxminiy hozirgi natija')]),
  view('If she knew — hozirgi bilimga oid noreal shart; would have helped yesterday — taxminiy o‘tgan natija.',[point(170,'Taxminiy kechagi yordam'),link(320,170,'Noreal shart → o‘tgan natija')])]
};
