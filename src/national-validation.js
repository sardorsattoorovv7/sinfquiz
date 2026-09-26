import {safeSourceUrl} from './national-review.js';
export function publicationError(section){
 const questions=section?.questions;
 if(!Array.isArray(questions)||questions.length!==30)return 'Variantda 30 ta savol bo‘lishi kerak.';
 if(questions.some(q=>!q.text?.trim()||!Array.isArray(q.options)||q.options.length!==4||q.options.some(o=>!String(o).trim())||!Number.isInteger(q.correct)||q.correct<0||q.correct>3))return 'Savol, 4 ta variant va to‘g‘ri javobni to‘ldiring.';
 if(questions.some(q=>!q.topic?.trim()||!q.explanation?.trim()||!q.sourceReference?.trim()||!safeSourceUrl(q.sourceUrl)))return 'Har savolga mavzu, HTTPS manba, sahifa/savol raqami va javob izohini kiriting.';
 const topics=new Set(questions.map(q=>q.topic.trim().toLocaleLowerCase()));
 if(topics.size<3)return 'Aralash variant kamida 3 ta mavzuni qamrab olsin.';
 if(new Set(questions.map(q=>q.text.trim().toLocaleLowerCase())).size!==30)return 'Bir xil savolni variantda takrorlamang.';
 return null;
}
