import rawMaps from '../data/audio-maze-maps.json' with {type:'json'};

const rawTasks = [
 // A1: directions, colours, numbers, familiar objects
 ['a1-01','Turn left at the blue door.','Ko‘k eshik oldida chapga buriling.',['←','↑','→'],0,'“Turn left” chapga burilishni bildiradi.','Tinglashda yo‘nalish so‘ziga e’tibor bering.','Left — chapga.','direction'],
 ['a1-02','Go straight to the red key.','Qizil kalit tomon to‘g‘ri yuring.',['←','↑','→'],1,'“Go straight” to‘g‘riga yurish degani.','Birinchi ikki so‘zni yana tinglang.','Straight — to‘g‘ri.','direction'],
 ['a1-03','Turn right after the green tree.','Yashil daraxtdan keyin o‘ngga buriling.',['←','↑','→'],2,'“Turn right” o‘ngga burilishni bildiradi.','Rangdan keyin kelgan yo‘nalishga quloq tuting.','Right — o‘ngga.','direction'],
 ['a1-04','Find the yellow star.','Sariq yulduzni toping.',['Yulduz','Doira','Kvadrat'],0,'“Star” — yulduz.','Shakl nomini tinglang.','Star — yulduz.','object'],
 ['a1-05','The red apple is near the gate.','Qizil olma darvoza yaqinida.',['Olma','Kalit','Kitob'],0,'“Apple” — olma.','Bu gapda meva nomi bor.','Apple — olma.','object'],
 ['a1-06','Choose number seven.','Yetti raqamini tanlang.',['3','7','9'],1,'“Seven” — 7.','Raqam aytilgan joyini qayta eshiting.','Seven — yetti.','number'],
 ['a1-07','The small cat is under the table.','Kichik mushuk stol tagida.',['↑','↔','↓'],2,'“Under” pastda, tagida degani.','Joylashuv bildiruvchi so‘zni ajrating.','Under — tagida.','place'],
 ['a1-08','The door is orange.','Eshik zarg‘aldoq rangda.',['Binafsha','Zarg‘aldoq','Yashil'],1,'Orange rangiga mos doirani tanlang.','Rang nomini eshiting.','Orange — zarg‘aldoq.','colour'],
 ['a1-09','Take the green key.','Yashil kalitni oling.',['Yashil kalit','Qizil kalit','Ko‘k kalit'],0,'Kalit rangiga mos tasvirni tanlang.','Rang va buyum ketma-ket keladi.','Green — yashil.','colour'],
 ['a1-10','Walk to door number four.','To‘rt raqamli eshikka yuring.',['2','4','6'],1,'Eshikdagi raqamni eshiting.','Four soniga quloq tuting.','Four — to‘rt.','number'],
 ['a1-11','The blue bird is above the box.','Ko‘k qush quti ustida.',['↑','↓','←'],0,'Qush qutidan yuqorida turibdi.','Joylashuv so‘zi “bilan” qiyoslanadi.','Above — ustida, yuqorida.','place'],
 ['a1-12','Open the door on your left.','Chap tomoningizdagi eshikni oching.',['←','↑','→'],0,'Eshik chap tomonda.','“Your left” iborasini tinglang.','Left — chap tomon.','direction'],
 // A2: descriptions and short instructions
 ['a2-01','Walk past the fountain, then take the second door on your right.','Favvoradan o‘ting, keyin o‘ng tomondagi ikkinchi eshikdan kiring.',['1-eshik','2-eshik','3-eshik'],1,'“Second door” — ikkinchi eshik.','Tartib sonini va tomonni birga tinglang.','Second — ikkinchi; right — o‘ng.','instruction'],
 ['a2-02','The wooden box is between the two lamps.','Yog‘och quti ikki chiroq orasida.',['◉ ■ ◉','■ ◉ ◉','◉ ◉ ■'],0,'Quti ikki chiroqning o‘rtasida.','“Between” so‘zini aniqlang.','Between — orasida.','place'],
 ['a2-03','Choose the door beside the yellow flower.','Sariq gul yonidagi eshikni tanlang.',['Gul yonidagi eshik','O‘rtadagi eshik','Guldan naridagi eshik'],0,'Eshik gul yonida joylashgan.','“Beside” yaqinlikni bildiradi.','Beside — yonida.','place'],
 ['a2-04','First go upstairs, then turn left at the bookcase.','Avval yuqoriga chiqing, keyin kitob javoni yonida chapga buriling.',['↑ then ←','← then ↑','↓ then →'],0,'Harakatlar ketma-ket: yuqoriga, so‘ng chapga.','“First” va “then” so‘zlari tartibni bildiradi.','First — avval; then — keyin.','sequence'],
 ['a2-05','There are three green apples in the basket.','Savatda uchta yashil olma bor.',['2 ta','3 ta','4 ta'],1,'Sondan keyin “green apples” deyiladi.','Olmalar sonini sanang.','Three — uchta.','number'],
 ['a2-06','The clock is above the blue cabinet, not beside it.','Soat ko‘k shkaf ustida, yonida emas.',['↑','↔','↓'],0,'Gap “not beside” deb inkor qiladi; soat tepada.','“Not” dan keyingi qarama-qarshilikka e’tibor bering.','Above — ustida; not — emas.','place'],
 ['a2-07','Go through the small arch and stop before the bridge.','Kichik ravoqdan o‘ting va ko‘prikdan oldin to‘xtang.',['Ravoqdan keyin ko‘prikdan oldin','Ko‘prikdan o‘tib','Ravoqdan oldin'],0,'To‘xtash joyi ko‘prikka yetmasdan oldin.','“Before” so‘zini tutib oling.','Before — oldin.','instruction'],
 ['a2-08','The purple door is the last one on the left.','Binafsha eshik chap tomondagi eng oxirgisi.',['Birinchi','O‘rtadagi','Oxirgisi'],2,'“Last one” — oxirgisi.','Chap tomon va tartib so‘zlariga quloq tuting.','Last — oxirgi.','sequence'],
 ['a2-09','Put the key inside the red box.','Kalitni qizil quti ichiga qo‘ying.',['Kalit oq quti ichida','Kalit qizil quti ichida','Kalit qizil quti tashqarisida'],1,'Kalit qutining ichida bo‘lishi kerak.','“Inside” so‘zi joyni bildiradi.','Inside — ichida.','place'],
 ['a2-10','The little dog is behind the green bench.','Kichik it yashil o‘rindiq orqasida.',['It oldinda','It orqada','Faqat o‘rindiq'],1,'It o‘rindiqning orqa tomonida.','“Behind” so‘zini tinglang.','Behind — orqasida.','place'],
 ['a2-11','Take the first path on your right, not the wide path.','O‘ngdagi birinchi yo‘lakdan yuring, keng yo‘lakdan emas.',['Tor yo‘lak','Keng yo‘lak','Chap yo‘lak'],0,'Gap keng yo‘lakni rad etadi.','“Not” dan keyin rad etilgan variant aytiladi.','First path — birinchi yo‘lak.','instruction'],
 ['a2-12','The blue key opens the door with a number eight.','Ko‘k kalit sakkiz raqamli eshikni ochadi.',['6','8','10'],1,'Kalit ko‘k, eshik raqami sakkiz.','Eshik raqamini qayta eshiting.','Eight — sakkiz.','number'],
 // B1: short dialogue, compound directions and situation listening
 ['b1-01','Excuse me, how do I reach the library? Go across the courtyard and turn right after the statue.','Kechirasiz, kutubxonaga qanday boraman? Hovlidan o‘ting va haykaldan keyin o‘ngga buriling.',['Haykaldan oldin chapga','Haykaldan keyin o‘ngga','Hovliga qayting'],1,'Yo‘nalish haykaldan keyin o‘ngga.','Suhbatdagi “after the statue” qismini aniqlang.','After — keyin; turn right — o‘ngga buriling.','dialogue'],
 ['b1-02','The yellow sign is not at the entrance; it is opposite the water fountain.','Sariq belgi kirishda emas, suv favvorasining ro‘parasida.',['Kirishda','Favvora ro‘parasida','Favvora tagida'],1,'“Opposite” — ro‘parasida.','Avvalgi joy inkor qilinadi, keyin to‘g‘risi aytiladi.','Opposite — ro‘parasida.','place'],
 ['b1-03','Keep going until you see a narrow passage between the bakery and the post office.','Nonvoyxona va pochta orasidagi tor yo‘lakni ko‘rguncha davom eting.',['Tor yo‘lak','Keng zinapoya','Yashil darvoza'],0,'Muhim belgi — ikki bino orasidagi tor yo‘lak.','“Until you see” dan keyingi tasvirni tuting.','Narrow passage — tor yo‘lak.','instruction'],
 ['b1-04','I left my red umbrella on the chair near the window, not on the table.','Qizil soyabonimni deraza yonidagi stulga qoldirdim, stolga emas.',['Deraza yonidagi stul','Stol','Eshik oldi'],0,'Stol varianti “not” bilan rad etilgan.','Buyum, rang va joylashuvni birga yodda tuting.','Near the window — deraza yonida.','dialogue'],
 ['b1-05','Walk east to the bridge. Before crossing it, follow the path that bends south.','Sharqqa ko‘prikkacha yuring. Undan o‘tishdan oldin janubga egiladigan yo‘lakka kiring.',['Ko‘prikdan o‘tib shimolga','Ko‘prikdan oldin janubga burilgan yo‘l','Sharqqa qaytish'],1,'Ko‘prikdan o‘tmay, oldin janubga burilasiz.','“Before crossing” muhim vaqt belgisidir.','Before crossing — o‘tishdan oldin.','instruction'],
 ['b1-06','The caretaker says the spare key is underneath the third flowerpot from the door.','Qorovul zaxira kalit eshikdan sanaganda uchinchi gul tuvagi tagida ekanini aytadi.',['Birinchi tuvak','Uchinchi tuvak','To‘rtinchi tuvak'],1,'Eshikdan sanaganda uchinchi tuvak.','Boshlanish nuqtasi eshik ekanini unutmang.','Third — uchinchi; underneath — tagida.','number'],
 ['b1-07','At the crossroads, ignore the path with the red flags and take the one marked with two blue circles.','Chorrahada qizil bayroqli yo‘lni olmang; ikkita ko‘k doira bilan belgilanganiga kiring.',['Qizil bayroqli yo‘l','Ikkita ko‘k doirali yo‘l','Bitta ko‘k doirali yo‘l'],1,'Qizil bayroqli yo‘l rad etilgan; ikkita ko‘k doirali yo‘l to‘g‘ri.','“Ignore” bu yo‘lni tanlamaslikni bildiradi.','Two blue circles — ikkita ko‘k doira.','symbol'],
 ['b1-08','Mina: Is the exit beside the clock? Omar: No, it is just beyond the second arch.','Mina: Chiqish soat yonidami? Omar: Yo‘q, u ikkinchi ravoqdan sal narida.',['Soat yonida','Birinchi ravoqdan oldin','Ikkinchi ravoqdan keyin'],2,'Omar “No” deb tuzatadi: ikkinchi ravoqdan keyin.','Javob beruvchining tuzatishini tinglang.','Beyond — narigi tomonida/keyin.','dialogue'],
 ['b1-09','Take the corridor on the left. When it splits, choose the branch with the brighter lights.','Chap yo‘lakka kiring. U ikkiga ajralganda yorug‘roq chiroqli tarmoqni tanlang.',['Chapga, so‘ng yorug‘ tarmoqqa','O‘ngga, so‘ng qorong‘i yo‘lga','Chapga, so‘ng orqaga'],0,'Ikkinchi tanlov yorug‘roq yo‘l.','Gapda ikkita ketma-ket ko‘rsatma bor.','Splits — ikkiga ajraladi; brighter — yorug‘roq.','sequence'],
 ['b1-10','The green door will stay locked until you bring the small silver key from the fountain.','Favvoradan kichik kumush kalitni olib kelmaguningizcha yashil eshik qulfligicha qoladi.',['Katta oltin kalit','Kichik kumush kalit','Ko‘k karta'],1,'Kalit kichik va kumush rangda, favvora yonidan olinadi.','“Until” dan keyingi shartni eshiting.','Silver — kumush; until — ...guncha.','dialogue'],
 ['b1-11','Go down the steps, pass the first blue door, and enter the second blue door.','Zinadan tushing, birinchi ko‘k eshikdan o‘ting va ikkinchi ko‘k eshikka kiring.',['Birinchi ko‘k eshik','Ikkinchi ko‘k eshik','Zinaga qayting'],1,'Eshiklar bir xil rangda, farq tartibida.','Birinchi va ikkinchi tartib sonini adashtirmang.','Second — ikkinchi.','sequence'],
 ['b1-12','The guide says the exit is behind the stage, although the map shows it beside the stage.','Yo‘lboshchi chiqish sahna orqasida deydi, xaritada esa yonida ko‘rsatilgan.',['Sahna yonida','Sahna orqasida','Sahna oldida'],1,'Savolda yo‘lboshchining aytganini topish kerak.','“Although” xaritadagi farqli ma’lumotni kiritadi.','Behind — orqasida.','dialogue'],
];

export const audioMazeTasks=rawTasks.map(([id,audio,translation,options,answer,explanation,hint1,hint2,skill])=>({id,audio,translation,options,answer,explanation,hints:[hint1,hint2],skill}));
export const audioMazeLevels=rawMaps.map((map,i)=>{
 const pool=i<4?audioMazeTasks.slice(0,12):i<8?audioMazeTasks.slice(12,24):audioMazeTasks.slice(24);
 const offset=(i*3)%pool.length;
 const tasks=Array.from({length:map.taskCount},(_,step)=>pool[(offset+step*2)%pool.length]);
 return {...map,tasks};
});
export const audioMazeLevelById=Object.fromEntries(audioMazeLevels.map(level=>[level.id,level]));
export const mazeMapAttribution={name:'Rectangular maze layouts',source:'https://github.com/emadehsan/maze',license:'MIT (algorithm reference)',method:'The reference project demonstrates randomized Prim rectangular mazes; these 12 fixed maps are separately authored, embedded and route-verified.'};

export function mazeNeighbors(grid,point,closed=[]){
 const key=p=>`${p[0]},${p[1]}`,closedSet=new Set(closed.map(p=>Array.isArray(p)?key(p):String(p)));
 return [[point[0]+1,point[1]],[point[0]-1,point[1]],[point[0],point[1]+1],[point[0],point[1]-1]].filter(([x,y])=>grid[y]?.[x]&&grid[y][x]!=='#'&&!closedSet.has(key([x,y])));
}
export function mazePath(grid,start,goal,closed=[]){
 const queue=[start],prev=new Map([[start.join(','),null]]),target=goal.join(','),key=p=>p.join(',');
 for(let i=0;i<queue.length;i++){const p=queue[i];if(key(p)===target)break;for(const next of mazeNeighbors(grid,p,closed)){const k=key(next);if(!prev.has(k)){prev.set(k,key(p));queue.push(next)}}}
 if(!prev.has(target))return null;const path=[];let current=target;while(current){path.push(current.split(',').map(Number));current=prev.get(current)}return path.reverse();
}
export function validateAudioMazeLevels(levels=audioMazeLevels){
 const ids=new Set();for(const level of levels){if(ids.has(level.id))throw Error(`Takroriy xarita id: ${level.id}`);ids.add(level.id);if(level.grid.length<9||new Set(level.grid.map(row=>row.length)).size!==1)throw Error(`${level.id}: xarita o‘lchami xato`);if(!mazePath(level.grid,level.start,level.exit))throw Error(`${level.id}: chiqish yo‘li yo‘q`);if(level.tasks.length!==level.taskCount||level.tasks.length<5||level.tasks.length>8)throw Error(`${level.id}: audio topshiriq soni noto‘g‘ri`);if(level.gateCells.length!==level.taskCount)throw Error(`${level.id}: audio eshiklar soni mos emas`);if(level.tasks.some(task=>task.options.length<3||task.answer<0||task.answer>=task.options.length))throw Error(`${level.id}: audio javob modeli xato`)}return {levels:ids.size,taskCount:audioMazeTasks.length,uniqueMaps:new Set(levels.map(level=>level.grid.join('\n'))).size};
}
