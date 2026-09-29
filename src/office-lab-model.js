export const officeTemplates={
 'word-report':{
  title:'Word: rasm, jadval va matn o‘rami',kind:'word',
  prompt:'«Maktab kutubxonasi» nomli hujjat tayyorlang: sarlavha va izoh yozing, ikki qatorli jadval yarating, rasm qo‘shib uni matnning o‘ng tomoniga joylang.',
  rubric:[{label:'Sarlavha va matn',kind:'wordText'},{label:'Kamida ikki qatorli jadval',kind:'wordTable'},{label:'Rasm kiritilgan',kind:'wordImage'},{label:'Rasm o‘ngga o‘ralgan',kind:'wordWrap',value:'right'}],
 },
 'word-reference':{
  title:'Word: ma’lumotnoma tayyorlash',kind:'word',
  prompt:'Ma’lumotnoma tuzing: hujjat sarlavhasi va qisqa mazmunini yozing; kimga yuborilishi, sanasi va manbasini kiriting. Ikki ustunli ma’lumot jadvali qo‘shing.',
  rubric:[{label:'Sarlavha va matn',kind:'wordText'},{label:'Qabul qiluvchi, sana va manba',kind:'wordReference'},{label:'Jadval to‘ldirilgan',kind:'wordTable'}],
 },
 'excel-shop':{
  title:'Excel: katak va formula bilan hisoblash',kind:'excel',
  prompt:'B2 va C2 dagi miqdor/narxdan D2 ni, B3 va C3 dan D3 ni hisoblang. D4 katakda jami xarajatni SUM funksiyasi bilan toping.',
  initialCells:{A1:'Mahsulot',B1:'Soni',C1:'Narx',D1:'Jami',A2:'Daftar',B2:'3',C2:'8000',A3:'Qalam',B3:'4',C3:'2000',A4:'Hammasi'},
  rubric:[{label:'D2: katakka tayangan ko‘paytirish',kind:'excelFormula',cell:'D2',references:['B2','C2'],expected:24000},{label:'D3: katakka tayangan ko‘paytirish',kind:'excelFormula',cell:'D3',references:['B3','C3'],expected:8000},{label:'D4: SUM bilan jami',kind:'excelFormula',cell:'D4',fn:'SUM',expected:32000}],
 },
 'excel-average':{
  title:'Excel: o‘rtacha va katak manzillari',kind:'excel',
  prompt:'B2, B3 va B4 kataklaridagi ballarni ko‘ring. B5 ga AVERAGE yordamida o‘rtachasini, C2 ga B2+5 formulasini yozing.',
  initialCells:{A1:'O‘quvchi',B1:'Ball',C1:'Yangi ball',A2:'Ali',B2:'70',A3:'Lola',B3:'80',A4:'Vali',B4:'90',A5:'O‘rtacha'},
  rubric:[{label:'B5: AVERAGE bilan o‘rtacha',kind:'excelFormula',cell:'B5',fn:'AVERAGE',expected:80},{label:'C2: B2 katagiga tayangan formula',kind:'excelFormula',cell:'C2',references:['B2'],expected:75}],
 },
 'ppt-presentation':{
  title:'PowerPoint: ikki slaydli namoyish',kind:'ppt',
  prompt:'«Maktab kutubxonasi» mavzusida ikki slayd yarating. Har biriga aniq sarlavha va mazmun yozing, bitta rasm joylang, ikkinchi slaydga so‘zlovchi qaydlarini kiriting.',
  rubric:[{label:'Ikki mazmunli slayd',kind:'pptSlides'},{label:'Slaydda rasm',kind:'pptImage'},{label:'Ikkinchi slaydda qaydlar',kind:'pptNotes'}],
 },
};

const error=message=>{throw Error(message)};
const formulaTokens=formula=>{
 const source=formula.toUpperCase().replace(/^=/,'');
 if(source.length>120)error('Formula juda uzun');
 const tokens=[],pattern=/\s*(AVERAGE|SUM|[A-D][1-8]|\d+(?:\.\d+)?|[()+\-*/,:])\s*/gy;
 let offset=0,match;
 while((match=pattern.exec(source))){if(match.index!==offset)error('Formula belgisi noto‘g‘ri');tokens.push(match[1]);offset=pattern.lastIndex;if(tokens.length>80)error('Formula juda murakkab')}
 if(offset!==source.length||!tokens.length)error('Formula noto‘g‘ri');return tokens;
};
export function excelValue(cells,address,visiting=new Set()){
 const raw=String(cells?.[address]??'').trim();
 if(!raw)return 0;
 if(!raw.startsWith('=')){const value=Number(raw);return Number.isFinite(value)?value:NaN}
 if(visiting.size>16||visiting.has(address))error('Aylanma katak havolasi');
 const seen=new Set(visiting);seen.add(address);
 const tokens=formulaTokens(raw),position={i:0};
 const take=()=>tokens[position.i++],peek=()=>tokens[position.i];
 const atom=()=>{
  const token=take();if(token==='-')return -atom();if(token==='+')return atom();
  if(token==='('){const value=expression();if(take()!==')')error('Qavs yopilmagan');return value}
  if(token==='SUM'||token==='AVERAGE'){
   if(take()!=='(')error('Funksiya qavsi yo‘q');const start=take();if(take()!==':')error('Oraliq noto‘g‘ri');const end=take();if(take()!==')')error('Funksiya qavsi yopilmagan');
   if(!/^[A-D][1-8]$/.test(start||'')||!/^[A-D][1-8]$/.test(end||''))error('Katak manzili noto‘g‘ri');
   const a=start.charCodeAt(0),b=end.charCodeAt(0),r1=Number(start.slice(1)),r2=Number(end.slice(1));if(a>b||r1>r2)error('Oraliq tartibi noto‘g‘ri');
   const values=[];for(let row=r1;row<=r2;row++)for(let col=a;col<=b;col++)values.push(excelValue(cells,String.fromCharCode(col)+row,seen));
   return values.reduce((sum,value)=>sum+value,0)/(token==='AVERAGE'?values.length:1);
  }
  if(/^[A-D][1-8]$/.test(token||''))return excelValue(cells,token,seen);
  if(/^\d+(?:\.\d+)?$/.test(token||''))return Number(token);
  error('Formula noto‘g‘ri');
 };
 const term=()=>{let value=atom();while(peek()==='*'||peek()==='/'){const op=take(),right=atom();value=op==='*'?value*right:value/right}return value};
 const expression=()=>{let value=term();while(peek()==='+'||peek()==='-'){const op=take(),right=term();value=op==='+'?value+right:value-right}return value};
 const result=expression();if(position.i!==tokens.length||!Number.isFinite(result))error('Hisoblab bo‘lmadi');return result;
}

export function gradeOffice(q,value){
 let submission;try{if(typeof value!=='string'||value.length>18000)return {ratio:0,checks:[]};submission=JSON.parse(value)}catch{return {ratio:0,checks:[]}}
 const task=q.officeTask||officeTemplates[q.officeTemplate],rubric=q.officeRubric||task?.rubric;
 if(!task||submission?.kind!==task.kind||!Array.isArray(rubric)||!rubric.length)return {ratio:0,checks:[]};
 const text=v=>typeof v==='string'&&v.trim().length>=3&&v.length<=1000;
 const checks=rubric.map(item=>{
  let passed=false;
  try{
   if(item.kind==='wordText')passed=text(submission.title)&&text(submission.body);
   if(item.kind==='wordTable')passed=Array.isArray(submission.table)&&submission.table.length>=2&&submission.table.slice(0,2).every(row=>Array.isArray(row)&&row.length>=2&&row.slice(0,2).every(cell=>typeof cell==='string'&&cell.trim().length>=1&&cell.length<=100));
   if(item.kind==='wordImage')passed=submission.imageInserted===true;
   if(item.kind==='wordWrap')passed=submission.imageInserted===true&&submission.wrap===item.value;
   if(item.kind==='wordReference')passed=['recipient','date','source'].every(field=>text(submission.reference?.[field]));
   if(item.kind==='excelFormula'){
    const formula=String(submission.cells?.[item.cell]||'').toUpperCase().replace(/\s/g,'');
    passed=formula.startsWith('=')&&(!item.fn||formula.includes(item.fn+'('))&&(!item.references||item.references.every(ref=>formula.includes(ref)))&&Math.abs(excelValue(submission.cells,item.cell)-item.expected)<.001;
   }
   if(item.kind==='pptSlides')passed=Array.isArray(submission.slides)&&submission.slides.length>=2&&submission.slides.slice(0,2).every(slide=>text(slide.title)&&text(slide.body))&&submission.slides[0].title!==submission.slides[1].title;
   if(item.kind==='pptImage')passed=submission.slides?.some(slide=>slide.imageInserted===true)===true;
   if(item.kind==='pptNotes')passed=text(submission.slides?.[1]?.notes);
  }catch{passed=false}
  return {label:item.label,passed};
 });
 return {ratio:checks.filter(item=>item.passed).length/checks.length,checks};
}
