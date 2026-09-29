export const atlasSceneParams={
 number:{value:{label:'Boshlang‘ich nuqta',value:-3,min:-10,max:10},step:{label:'Qadam miqdori',value:2,min:-4,max:4}},
 fraction:{percent:{label:'Foiz',value:25,min:0,max:100},whole:{label:'Butun miqdor',value:200,min:20,max:500}},
 balance:{count:{label:'x lar soni',value:3,min:1,max:5},extra:{label:'Qo‘shimcha son',value:2,min:0,max:10},total:{label:'Tenglamaning o‘ng tomoni',value:17,min:0,max:30}},
 linear:{m:{label:'Qiyalik m',value:2,min:-3,max:3},b:{label:'Boshlang‘ich b',value:1,min:-5,max:5},second:{label:'Ikkinchi qiyalik',value:-1,min:-3,max:3}},
 quadratic:{m:{label:'Kvadrat koeffitsiyent a',value:2,min:-3,max:3},b:{label:'Ozod had c',value:1,min:-5,max:5}},
 triangle:{base:{label:'Asos',value:11,min:5,max:14},cx:{label:'Uchning gorizontal joyi',value:260,min:45,max:400},cy:{label:'Uchning balandligi',value:60,min:44,max:164}},
 transform:{dx:{label:'Gorizontal siljish',value:2,min:-3,max:3},dy:{label:'Vertikal siljish',value:1,min:-2,max:2},angle:{label:'Burilish gradusi',value:0,min:-180,max:180},scale:{label:'Masshtab',value:1,min:.5,max:2}},
 power:{base:{label:'Asos',value:2,min:2,max:5},exponent:{label:'Daraja',value:3,min:1,max:5}},
 sequence:{first:{label:'Birinchi had',value:2,min:-5,max:10},diff:{label:'Qadam',value:3,min:-3,max:8}},
 expression:{x:{label:'x qiymati',value:3,min:-5,max:8}},
 coordinate:{x:{label:'A nuqta x',value:2,min:-4,max:4},y:{label:'A nuqta y',value:3,min:-3,max:3},x2:{label:'B nuqta x',value:-2,min:-4,max:4}},
 angle:{angle:{label:'Boshlang‘ich burchak',value:70,min:10,max:170},length:{label:'Nur ko‘lami',value:100,min:60,max:155}},
 line:{length:{label:'Ko‘rinadigan kesma',value:6,min:2,max:9},tilt:{label:'Yo‘nalish',value:0,min:-3,max:3},gap:{label:'Parallel oraliq',value:3,min:1,max:5}},
 square:{a:{label:'Tomon a',value:5,min:1,max:10}},rectangle:{a:{label:'Uzunlik a',value:5,min:1,max:10},b:{label:'En b',value:3,min:1,max:10}},parallelogram:{a:{label:'Asos a',value:5,min:1,max:10},b:{label:'Tik balandlik h',value:3,min:1,max:10}},trapezoid:{a:{label:'Birinchi asos',value:5,min:1,max:10},b:{label:'Ikkinchi asos',value:3,min:1,max:10}},rhombus:{a:{label:'Birinchi diagonal',value:5,min:1,max:10},b:{label:'Ikkinchi diagonal',value:3,min:1,max:10}},polygon:{a:{label:'Tomon uzunligi',value:5,min:1,max:10},n:{label:'Tomonlar soni',value:6,min:3,max:10}},circle:{a:{label:'Radius r',value:5,min:1,max:10}},
 cube:{a:{label:'Kub tomoni a',value:3,min:1,max:7},yaw:{label:'Burish burchagi',value:30,min:-55,max:55}},cuboid:{a:{label:'Uzunlik a',value:3,min:1,max:7},b:{label:'En b',value:2,min:1,max:7},h:{label:'Balandlik c',value:2,min:1,max:7},yaw:{label:'Burish burchagi',value:30,min:-55,max:55}},prism:{a:{label:'Uchburchak asosi',value:3,min:1,max:7},b:{label:'Uchburchak balandligi',value:2,min:1,max:7},h:{label:'Prizma uzunligi',value:3,min:1,max:7}},pyramid:{a:{label:'Asos tomoni',value:3,min:1,max:7},h:{label:'Tik balandlik',value:3,min:1,max:7}},cylinder:{r:{label:'Radius r',value:2,min:1,max:6},h:{label:'Balandlik h',value:3,min:1,max:7}},cone:{r:{label:'Radius r',value:2,min:1,max:6},h:{label:'Balandlik h',value:3,min:1,max:7}},sphere:{r:{label:'Radius r',value:2,min:1,max:6}},
};
export function atlasDefaultParams(scene){return Object.fromEntries(Object.entries(atlasSceneParams[scene]||{}).map(([key,spec])=>[key,spec.value]))}
