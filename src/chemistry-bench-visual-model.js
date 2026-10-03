// Qualitative appearance driven by the calculated specimen, never random chemistry.
export function benchVisualState(result){
 const p=result.parameters,kind=p.equipment,tube=kind==='tube',dish=kind==='dish',volcano=kind==='volcano';
 const radius=tube?.43:dish?1.45:volcano?.42:1,ceiling=dish?.5:volcano?2.15:2.65;
 const fraction=Math.max(0,Math.min(1,result.volume/result.capacity)),height=fraction*ceiling;
 const oilHeight=result.volume>0?height*result.oil/result.volume:0;
 const gasFlow=Math.max(0,result.gasRateMl||0),foamHeight=Math.min(1.45,result.foamMl/result.capacity*ceiling);
 const precipitate=Math.max(0,result.precipitateMass||0),sand=Math.max(0,result.sand||0);
 const lastPrecip=Math.max(0,...result.events.filter(e=>e.id==='precipitate').map(e=>e.at));
 const suspended=result.filtered?0:p.stir?1:Math.exp(-Math.max(0,p.elapsed-lastPrecip)/16);
 const solid=result.filtered?0:Math.max(0,result.residue-precipitate-sand);
 return {kind,radius,ceiling,height,oilHeight,waterHeight:Math.max(0,height-oilHeight),foamHeight,gasFlow,
  bubbleCount:gasFlow>.002?Math.min(64,Math.max(4,Math.ceil(gasFlow*6))):0,
  precipitate,sand,solid,suspended,
  liquid:result.volume>0&&result.phase!=='muz'&&result.phase!=='bug‘',ice:result.phase==='muz',steam:result.phase==='bug‘',
  cloudy:!result.filtered&&(precipitate>0||sand>0)&&suspended>.02,
  mixing:p.stir&&result.water>0,mixedOil:p.stir&&result.water>0&&result.oil>0,
  foam:result.foamMl>0,overflow:result.overflow>0,filterResidue:result.filtered?result.residue:0,
  narrative:result.filtered?'Erigan moddalar filtratga o‘tdi; erimagan qoldiq filtrda.':precipitate>0?'Oq CaCO₃ cho‘kmasi hosil bo‘ldi. Aralashtirishda zarrachalar tarqaladi; tinch holatda tubga tushadi.':result.phase==='bug‘'?'Sof suvning bug‘ holati: oq bulutcha ko‘rinmaydigan bug‘ning shartli belgisi.':result.phase==='muz'?'Sof suv muz holatida. H₂O formulasi saqlanadi.':result.foamMl>0?'Gaz pufakchalari ko‘pikda ushlanadi. Ko‘pik hajmi gazning o‘zi bilan teng emas.':result.gasTargetMoles>0?'CO₂ hosil bo‘ladi. Pufakchalar tezligi modeldagi gaz ajralish tezligiga bog‘liq.':result.oil>0&&result.water>0?p.stir?'Moy tomchilar ko‘rinishida tarqalgan; bu kimyoviy reaksiya emas.':'Moy yuqorida, suv pastda. Aralashtirishni yoqib, tomchilarga ajralishini tekshiring.':solid>0?'Qattiq qoldiq tubda. Erigan qismni yon paneldagi ko‘rsatkichdan tekshiring.':result.water>0?'Suvli namuna. Rangsiz eritmaning sathi ko‘rinishi uchun yengil tus berilgan.':'Jihozni tanlang va javondan namuna qo‘shing.'};
}
