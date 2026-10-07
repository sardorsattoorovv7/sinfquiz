import React,{useState} from 'react';
export function LessonChecks({checks}){
 const [answers,setAnswers]=useState({});
 if(!Array.isArray(checks)||!checks.length)return null;
 return <div className="lesson-checks"><h3>O‘zingizni tekshiring</h3>{checks.map((item,index)=><div className="lesson-check" key={index}><p><b>{index+1}. {item.question}</b></p><div className="lesson-choices">{item.options.map((option,choice)=><button key={choice} type="button" className={answers[index]===choice?(choice===item.answer?'correct':'incorrect'):''} aria-pressed={answers[index]===choice} onClick={()=>setAnswers(old=>({...old,[index]:choice}))}>{option}</button>)}</div>{answers[index]!==undefined&&<p role="status" className={answers[index]===item.answer?'answer-right':'answer-wrong'}>{answers[index]===item.answer?'To‘g‘ri. ':'Yana bir bor ko‘rib chiqing. '}{item.explanation}</p>}</div>)}</div>;
}

export function LessonSections({content}){
 const sections=[],lines=String(content||'').split('\n');
 let bullet=[],code=[],codeLanguage='',inCode=false;
 const flush=()=>{if(bullet.length){sections.push(<ul key={`list-${sections.length}`}>{bullet.map((item,index)=><li key={index}>{item}</li>)}</ul>);bullet=[]}};
 const flushCode=()=>{sections.push(<pre key={`code-${sections.length}`} className="lesson-code"><code data-language={codeLanguage}>{code.join('\n')}</code></pre>);code=[];codeLanguage=''};
 lines.forEach((source,index)=>{
  const line=source.trim();
  if(line.startsWith('```')){flush();if(inCode)flushCode();else codeLanguage=line.slice(3).slice(0,16);inCode=!inCode;return}
  if(inCode){code.push(source);return}
  if(!line)return;
  if(line.startsWith('## ')){flush();sections.push(<h2 key={`heading-${index}`}>{line.slice(3)}</h2>)}
  else if(line.startsWith('- '))bullet.push(line.slice(2));
  else{flush();sections.push(<p key={`paragraph-${index}`}>{line}</p>)}
 });
 flush();
 if(inCode)flushCode();
 return sections;
}

