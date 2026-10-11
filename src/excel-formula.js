// Bounded educational Excel evaluator. It never evaluates JavaScript or SQL.
const fail=message=>{throw Error(message)};
const aliasMap={'СРЗНАЧ':'AVERAGE','СУММ':'SUM','ЕСЛИ':'IF','И':'AND','ИЛИ':'OR','НЕ':'NOT','ИСТИНА':'TRUE','ЛОЖЬ':'FALSE'};
export const normalizeFormula=raw=>String(raw).replace(/"(?:[^"]|"")*"|(?<![\p{L}\p{N}_])(СРЗНАЧ|СУММ|ЕСЛИ|ИЛИ|И|НЕ|ИСТИНА|ЛОЖЬ)(?![\p{L}\p{N}_])/giu,w=>w.startsWith('"')?w:(aliasMap[w.toUpperCase()]||w));
export function formulaLex(raw){
 const s=normalizeFormula(String(raw).trim().replace(/^=/,'')),tokens=[];
 if(s.length>240)fail('Formula 240 belgidan oshmasin');
 const re=/\s*("(?:[^"]|"")*"|AVERAGE|SUM|IF|AND|OR|NOT|TRUE|FALSE|\$?[A-D]\$?[1-8]|\d+(?:\.\d+)?|>=|<=|<>|[=<>()+\-*/,:;])\s*/giy;
 let offset=0,m;while((m=re.exec(s))){if(m.index!==offset)fail('Formula belgisi noto‘g‘ri');tokens.push(m[1].startsWith('"')?m[1]:m[1].toUpperCase());offset=re.lastIndex;if(tokens.length>120)fail('Formula juda murakkab')}
 if(offset!==s.length||!tokens.length)fail('Formula noto‘g‘ri');return tokens;
}
const numeric=v=>typeof v==='number'&&Number.isFinite(v)?v:typeof v==='boolean'?Number(v):fail('Sonli qiymat kerak');
const truth=v=>typeof v==='boolean'?v:typeof v==='number'?v!==0:fail('Mantiqiy shart kerak');
export function excelValue(cells,address,visiting=new Set()){
 address=String(address).replaceAll('$','').toUpperCase();if(!/^[A-D][1-8]$/.test(address))fail('Katak manzili A1–D8 oralig‘ida bo‘lsin');
 if(visiting.size>16||visiting.has(address))fail('Aylanma katak havolasi');
 const raw=String(cells?.[address]??'').trim();if(!raw)return 0;
 if(!raw.startsWith('=')){const n=Number(raw);return Number.isFinite(n)?n:raw}
 const seen=new Set(visiting);seen.add(address);const t=formulaLex(raw);let i=0;
 const take=()=>t[i++],peek=()=>t[i],comma=()=>{if(![',',';'].includes(take()))fail('Funksiya argumentlarini , yoki ; bilan ajrating')};
 const expression=(min=0,evaluate=true,depth=0)=>{
  if(depth>32)fail('Qavslar juda ko‘p');let tok=take(),v=0;
  if(tok==='+'||tok==='-'){const r=expression(4,evaluate,depth+1);v=evaluate?(tok==='-'?-numeric(r):numeric(r)):0}
  else if(tok==='('){v=expression(0,evaluate,depth+1);if(take()!==')')fail('Qavs yopilmagan')}
  else if(tok==='IF'){
   if(take()!=='(')fail('IF uchun qavs kerak');const condition=expression(0,evaluate,depth+1);comma();const yes=evaluate&&truth(condition);
   const a=expression(0,!!yes,depth+1);let b=false;if([',',';'].includes(peek())){take();b=expression(0,evaluate&&!yes,depth+1)}
   if(take()!==')')fail('IF qavsi yopilmagan');v=evaluate?(yes?a:b):0;
  }else if(['AND','OR','NOT'].includes(tok)){
   if(take()!=='(')fail('Funksiya qavsi kerak');const values=[expression(0,evaluate,depth+1)];while([',',';'].includes(peek())){take();values.push(expression(0,evaluate,depth+1));if(values.length>20)fail('Argumentlar ko‘p')}
   if(take()!==')'||tok==='NOT'&&values.length!==1)fail('Mantiqiy funksiya argumentlari noto‘g‘ri');v=evaluate?(tok==='NOT'?!truth(values[0]):tok==='AND'?values.every(truth):values.some(truth)):0;
  }else if(tok==='SUM'||tok==='AVERAGE'){
   if(take()!=='(')fail('Funksiya qavsi kerak');const start=String(take()).replaceAll('$',''),colon=take(),end=String(take()).replaceAll('$','');if(colon!==':'||take()!==')'||! /^[A-D][1-8]$/.test(start)||! /^[A-D][1-8]$/.test(end))fail('Funksiya oralig‘i noto‘g‘ri');
   if(start[0]>end[0]||Number(start[1])>Number(end[1]))fail('Oraliq tartibi noto‘g‘ri');const values=[];
   if(evaluate)for(let row=+start[1];row<=+end[1];row++)for(let col=start.charCodeAt(0);col<=end.charCodeAt(0);col++){const a=String.fromCharCode(col)+row,r=String(cells?.[a]??'').trim();if(r&&(r.startsWith('=')||Number.isFinite(Number(r)))){const value=excelValue(cells,a,seen);if(typeof value==='number')values.push(value)}}
   if(evaluate&&tok==='AVERAGE'&&!values.length)fail('O‘rtacha uchun sonli katak yo‘q');v=evaluate?values.reduce((s,n)=>s+n,0)/(tok==='AVERAGE'?values.length:1):0;
  }else if(/^\$?[A-D]\$?[1-8]$/.test(tok||''))v=evaluate?excelValue(cells,tok,seen):0;
  else if(/^\d+(?:\.\d+)?$/.test(tok||''))v=evaluate?Number(tok):0;
  else if(tok==='TRUE'||tok==='FALSE')v=evaluate?tok==='TRUE':0;
  else if(tok?.startsWith('"'))v=evaluate?tok.slice(1,-1).replaceAll('""','"'):0;
  else fail('Formula belgisi noto‘g‘ri');
  while(true){const op=peek(),prec=['=','<>','>','<','>=','<='].includes(op)?1:['+','-'].includes(op)?2:['*','/'].includes(op)?3:-1;if(prec<min)break;take();const r=expression(prec+1,evaluate,depth+1);if(!evaluate)continue;
   if(['=','<>','>','<','>=','<='].includes(op)){const a=typeof v==='string'?v.toLocaleLowerCase():v,b=typeof r==='string'?r.toLocaleLowerCase():r;v=op==='='?a===b:op==='<>'?a!==b:op==='>'?a>b:op==='<'?a<b:op==='>='?a>=b:a<=b}
   else{const a=numeric(v),b=numeric(r);if(op==='/'&&b===0)fail('Nolga bo‘lib bo‘lmaydi');v=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:a/b;if(!Number.isFinite(v))fail('Hisoblab bo‘lmadi')}
  }return v;
 };
 const result=expression();if(i!==t.length)fail('Formula oxirida ortiqcha belgi');return result;
}
export function copyFormula(raw,from,to){
 if(!/^[A-D][1-8]$/.test(from)||!/^[A-D][1-8]$/.test(to))fail('Manba va manzil A1–D8 oralig‘ida bo‘lsin');if(!String(raw).startsWith('='))return String(raw);
 const dc=to.charCodeAt(0)-from.charCodeAt(0),dr=+to[1]-+from[1];
 // Quoted strings are data, never cell references.
 return String(raw).replace(/"(?:[^"]|"")*"|\$?[A-D]\$?[1-8]/gi,part=>{
  if(part.startsWith('"'))return part;const m=/^(\$?)([A-D])(\$?)([1-8])$/i.exec(part),col=m[2].toUpperCase().charCodeAt(0)+(m[1]?0:dc),row=+m[4]+(m[3]?0:dr);
  if(col<65||col>68||row<1||row>8)fail('Ko‘chirishda havola o‘quv jadvalidan chiqadi');return m[1]+String.fromCharCode(col)+m[3]+row;
 });
}
