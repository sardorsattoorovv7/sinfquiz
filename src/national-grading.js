export function nationalGrade(section,correct,total){
 const score=Math.round(correct/Math.max(1,total)*75*10)/10;
 const level=score>70?'A+':score>=65?'A':score>=60?'B+':score>=55?'B':score>=50?'C+':score>=46?'C':'Sertifikat darajasidan quyi';
 return {correct,total,score,level,scaleMax:75,method:'Mashq bahosi: to‘g‘ri javoblar ulushi × 75. Rasmiy sertifikat natijasi emas.'};
}
