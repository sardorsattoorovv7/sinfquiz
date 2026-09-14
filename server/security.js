import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';

export const randomToken=()=>randomBytes(32).toString('base64url');

export function secureEqual(value,expected){
 const left=createHash('sha256').update(String(value)).digest();
 const right=createHash('sha256').update(String(expected)).digest();
 return timingSafeEqual(left,right);
}

export function cookies(req){
 return Object.fromEntries(String(req.headers.cookie||'').split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2));
}

export function validateQuiz(input){
 const text=(value,min,max)=>typeof value==='string'&&value.trim().length>=min&&value.length<=max;
 const bad=()=>{const e=Error('Test ma’lumotlari noto‘g‘ri. Maydonlar, kod va savollarni tekshiring.');e.status=400;throw e};
 if(!input||!text(input.title,1,160)||!text(input.group,1,40)||!/^[0-9]{6}$/.test(input.pin)||!['active','passive'].includes(input.status)||!Array.isArray(input.questions)||input.questions.length<1||input.questions.length>100)bad();
 const ids=new Set();
 const questions=input.questions.map(q=>{
  if(!q||!text(q.id,1,100)||ids.has(q.id)||!text(q.text,1,4000)||!['test','shortcut','practical','prompt'].includes(q.type)||!Number.isInteger(q.time)||q.time<10||q.time>3600||!Number.isInteger(q.points)||q.points<10||q.points>10000)bad();
  ids.add(q.id);
  const safe={id:q.id,type:q.type,text:q.text.trim(),time:q.time,points:q.points,subject:String(q.subject||input.subject||'Informatika').slice(0,80),explanation:String(q.explanation||'').slice(0,4000)};
  if(q.type==='test'){
   if(!Array.isArray(q.options)||q.options.length!==4||q.options.some(x=>!text(x,1,1000))||!Number.isInteger(q.correct)||q.correct<0||q.correct>3)bad();
   Object.assign(safe,{options:q.options,correct:q.correct});
  }else{
   if(!text(q.answer,1,8000))bad();safe.answer=q.answer;
   if(q.type==='practical'){
    if(q.acceptedAnswers&&(!Array.isArray(q.acceptedAnswers)||q.acceptedAnswers.length>20||q.acceptedAnswers.some(x=>!text(x,1,8000))))bad();
    safe.acceptedAnswers=q.acceptedAnswers||[];
   }
  }
  if(q.type==='prompt'){
   if(!Array.isArray(q.criteria)||!q.criteria.length||q.criteria.length>20)bad();
   safe.criteria=q.criteria.map(c=>{if(!c||!text(c.label,1,160)||!Array.isArray(c.keywords)||!c.keywords.length||c.keywords.length>20||c.keywords.some(k=>!text(k,1,200)))bad();return {label:c.label,keywords:c.keywords}});
  }
  return safe;
 });
 return {title:input.title.trim(),group:input.group.trim(),subject:String(input.subject||'Informatika').slice(0,80),pin:input.pin,status:input.status,color:['violet','blue','green','orange','pink'].includes(input.color)?input.color:'violet',questions};
}

export function safeQuestion(q){
 if(!q)return null;
 return {id:q.id,type:q.type,text:q.text,time:q.time,points:q.points,subject:q.subject,...(q.type==='test'?{options:q.options}:{}),...(q.type==='prompt'?{criteria:q.criteria.map(c=>({label:c.label}))}:{})};
}
