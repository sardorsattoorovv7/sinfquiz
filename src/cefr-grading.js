export const cefrBand=score=>score>=65?'C1':score>=51?'B2':score>=38?'B1':'B1 dan quyi';

export function cefrObjectiveScore(correct,total=35){
 return Math.round(correct/Math.max(1,total)*75*10)/10;
}

export function cefrResult({listeningCorrect,readingCorrect,writingScore=0,speakingScore=0}){
 const listening=cefrObjectiveScore(listeningCorrect,35),reading=cefrObjectiveScore(readingCorrect,35);
 const writing=Math.max(0,Math.min(75,Number(writingScore)||0)),speaking=Math.max(0,Math.min(75,Number(speakingScore)||0));
 const overall=Math.round((listening+reading+writing+speaking)/4*10)/10;
 return {listening,reading,writing,speaking,overall,level:cefrBand(overall),scaleMax:75,provisional:true};
}
