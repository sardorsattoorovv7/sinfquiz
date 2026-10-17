// Original short Uzbek practice sentences. No network or assessed-room state.
export const UZBEK_WARMUP_SENTENCES=Object.freeze([
 "Bugun havo juda yaxshi.", "Men kitob o'qishni sevaman.", "Biz birga dars tayyorlaymiz.",
 "Yangi kun boshlandi.", "Do'stim menga yordam berdi.", "Hovlida gullar ochildi.",
 "Daftarimni sumkaga soldim.", "Maktabimiz bog'i juda chiroyli.", "Har kuni ozgina mashq qilaman.",
 "Bugun yangi mavzu o'rgandik.", "Qalam bilan rasm chizdim.", "Onam mazali non yopdi.",
 "Tongda qushlar sayraydi.", "Men savolga javob topdim.", "Biz tabiatni asraymiz.",
 "Kichik qadam ham muhim.", "Avval o'yla, keyin yoz.", "Yozgan gapimni tekshirib chiqdim.",
 "Kompyuterim darsga tayyor.", "Yaxshi odat foyda keltiradi.", "O'quvchilar sinfga kirishdi.",
 "G'ayrat bilan ish boshladik.", "O'rik daraxti gulladi.", "Qo'limni erkin tutaman.",
 "Bo'sh joyni unutma.", "To'g'ri yozishga harakat qilaman.", "O'qituvchi mavzuni tushuntirdi.",
 "Ko'chamiz toza va osoyishta.", "G'olibni hammamiz tabrikladik.", "Ko'k choy ichdim.",
 "O'zimga kichik maqsad qo'ydim.", "To'garak bugun erta boshlandi.", "Yomg'irdan so'ng havo ochildi.",
 "Qo'shnimiz yangi ko'chat ekdi.", "Birga o'rganish juda qiziq.", "Yangi so'zni eslab qoldim.",
 "Darsdan so'ng uyga qaytdim.", "Do'stlikni qadrlash kerak.", "To'pni darvozaga tepdim.",
 "Bir piyola suv ichdim.", "Derazadan quyosh ko'rindi.", "Bugun barcha ishni tugatdim.",
 "Sekin va aniq yozaman.", "Ekranga qulay masofada o'tiraman.", "Barmoqlarim tugmalarni topadi.",
 "Xato qilsam, tuzataman.", "Matnni shoshmasdan o'qiyman.", "Mashq meni chaqqon qiladi.",
]);

export const DEFAULT_WARMUP=Object.freeze({mode:'sentences',count:3,seconds:30,punctuation:false});
export const normalizeWarmup=value=>String(value).replace(/['’ʻʼ`´]/gu,'');

export function makeWarmupText(options=DEFAULT_WARMUP,random=Math.random,avoidFirst=''){
 const count=options.mode==='time'?24:[1,3,5].includes(options.count)?options.count:3;
 const pool=[...UZBEK_WARMUP_SENTENCES];
 for(let i=pool.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const format=s=>options.punctuation?s:s.toLowerCase().replace(/[.,!?;:]/gu,'');
 const first=format(pool[0]);
 if((avoidFirst===first||avoidFirst.startsWith(first+' ')||avoidFirst.endsWith(' '+first))&&pool.length>1)[pool[0],pool[1]]=[pool[1],pool[0]];
 return pool.slice(0,count).map(format).join(' ');
}

export const newWarmupSession=()=>({typed:'',startedAt:null,endedAt:null,attempts:0,correctAttempts:0});

// Count new keystrokes even when a typo is later removed. Deletion itself is
// not an error. Prefix/suffix comparison also handles selection replacement.
export function advanceWarmup(session,target,value,now,options=DEFAULT_WARMUP){
 if(session.endedAt!==null)return session;
 const deadline=session.startedAt===null?null:session.startedAt+options.seconds*1000;
 if(options.mode==='time'&&deadline!==null&&now>=deadline)return {...session,endedAt:deadline};
 const previous=[...normalizeWarmup(session.typed)],next=[...normalizeWarmup(value)],expected=[...normalizeWarmup(target)];
 if(value===session.typed)return session;
 if(!next.length&&session.startedAt===null)return session;
 let prefix=0,suffix=0;
 while(prefix<previous.length&&prefix<next.length&&previous[prefix]===next[prefix])prefix++;
 while(suffix<previous.length-prefix&&suffix<next.length-prefix&&previous.at(-1-suffix)===next.at(-1-suffix))suffix++;
 let correctAttempts=0;
 for(let i=prefix;i<next.length-suffix;i++)if(next[i]===expected[i])correctAttempts++;
 return {...session,typed:value,startedAt:session.startedAt??now,
  endedAt:options.mode==='sentences'&&next.length>=expected.length?now:null,
  attempts:session.attempts+Math.max(0,next.length-prefix-suffix),correctAttempts:session.correctAttempts+correctAttempts};
}

export function finishWarmup(session,now,options=DEFAULT_WARMUP){
 if(session.startedAt===null||session.endedAt!==null)return session;
 return {...session,endedAt:options.mode==='time'?Math.min(now,session.startedAt+options.seconds*1000):now};
}

export function warmupMetrics(session,target,now){
 const expected=[...normalizeWarmup(target)],typed=[...normalizeWarmup(session.typed)];
 const elapsedMs=session.startedAt===null?0:Math.max(0,(session.endedAt??now)-session.startedAt);
 let correct=0;for(let i=0;i<typed.length;i++)if(typed[i]===expected[i])correct++;
 return {correct,typed:typed.length,total:expected.length,elapsedMs,
  wpm:elapsedMs?Math.round(correct*12000/Math.max(1000,elapsedMs)):0,
  accuracy:session.attempts?Math.round(session.correctAttempts/session.attempts*100):100,
  errors:session.attempts-session.correctAttempts,
  progress:expected.length?Math.min(100,typed.length/expected.length*100):0};
}
