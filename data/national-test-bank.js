const rotate=(values,shift)=>values.map((_,index)=>values[(index+shift)%values.length]);
const question=(id,text,answer,distractors,explanation,index,subject)=>{
 const raw=[String(answer),...distractors.map(String)].filter((value,position,all)=>all.indexOf(value)===position);
 while(raw.length<4)raw.push(String(Number(answer||0)+raw.length+7));
 const options=rotate(raw.slice(0,4),index%4);
 return {id,type:'test',text,options,correct:options.indexOf(String(answer)),answer:String(answer),explanation,subject,points:1,time:120};
};

const mathArithmetic=Array.from({length:30},(_,index)=>{
 const a=12+index*3,b=2+index%7,c=3+index%5,answer=a+b*c;
 return question(`math-1-${index+1}`,`${a} + ${b} × ${c} ifodaning qiymatini toping.`,answer,[a+b+c,(a+b)*c,answer+c],`Avval ko‘paytirish bajariladi: ${b} × ${c}, so‘ng ${a} qo‘shiladi.`,index,'Matematika');
});
const mathEquations=Array.from({length:30},(_,index)=>{
 const x=2+index,a=2+index%5,b=3+(index*2)%9,c=a*x+b;
 return question(`math-2-${index+1}`,`${a}x + ${b} = ${c} tenglamani yeching.`,x,[x+1,x-1,x+a],`${a}x = ${c}-${b} = ${a*x}; x = ${x}.`,index,'Matematika');
});
const mathPercent=Array.from({length:30},(_,index)=>{
 const percent=[10,20,25,40,50][index%5],base=40+(index*20),answer=base*percent/100;
 return question(`math-3-${index+1}`,`${base} sonining ${percent}% ini toping.`,answer,[base-answer,answer+percent,base/percent],`${base} × ${percent}/100 = ${answer}.`,index,'Matematika');
});
const mathGeometry=Array.from({length:30},(_,index)=>{
 const width=3+index%8,height=5+Math.floor(index/3),area=width*height,isArea=index%2===0,answer=isArea?area:2*(width+height);
 return question(`math-4-${index+1}`,`Tomonlari ${width} cm va ${height} cm bo‘lgan to‘g‘ri to‘rtburchakning ${isArea?'yuzini':'perimetrini'} toping.`,`${answer} cm${isArea?'²':''}`,[`${isArea?2*(width+height):area} cm${isArea?'²':''}`,`${answer+width} cm${isArea?'²':''}`,`${Math.abs(height-width)} cm${isArea?'²':''}`],isArea?`S = ${width} × ${height} = ${answer} cm².`:`P = 2 × (${width}+${height}) = ${answer} cm.`,index,'Matematika');
});
const mathFunctions=Array.from({length:30},(_,index)=>{
 const start=2+index,diff=2+index%6,n=4+index%5,answer=start+(n-1)*diff;
 return question(`math-5-${index+1}`,`Arifmetik progressiyada a₁=${start}, d=${diff}. a${n} ni toping.`,answer,[answer-diff,answer+diff,start+n*diff],`aₙ = a₁ + (n−1)d = ${start} + ${n-1}×${diff} = ${answer}.`,index,'Matematika');
});

const englishFromRows=(section,rows)=>Array.from({length:30},(_,index)=>{
 const row=rows[index%rows.length],cycle=Math.floor(index/rows.length),text=row[0].replace('{n}',String(cycle+1)),answer=row[1],distractors=row.slice(2,5);
 return question(`english-${section}-${index+1}`,text,answer,distractors,row[5]||`Correct answer: ${answer}.`,index,'Ingliz tili');
});
const grammarRows=[
 ['My brother ___ to school every day.','goes','go','going','gone','“My brother” uchinchi shaxs birlik, shuning uchun goes ishlatiladi.'],
 ['There ___ two books on the desk.','are','is','be','was','Ko‘plikdagi “two books” bilan are ishlatiladi.'],
 ['She has ___ umbrella.','an','a','the','some','Unli tovush bilan boshlangan birlik ot oldidan an keladi.'],
 ['We ___ football on Fridays.','play','plays','played now','playing','Takroriy odat present simple bilan ifodalanadi.'],
 ['This bag is ___ than that one.','heavier','heavy','heaviest','more heavy','Ikki narsa taqqoslanganda comparative shakl ishlatiladi.'],
 ['I can ___ this question.','answer','answered','answering','answers','Modal fe’ldan keyin fe’lning asosiy shakli keladi.']
];
const tenseRows=[
 ['Yesterday we ___ the museum.','visited','visit','have visit','visiting','Yesterday past simple talab qiladi.'],
 ['Look! The children ___.','are running','run','ran','have ran','Hozir davom etayotgan ish present continuous bilan beriladi.'],
 ['I ___ my homework already.','have finished','finish yesterday','am finish','finishes','Already bilan present perfect mos keladi.'],
 ['By the time we arrived, the lesson ___.','had started','starts','has start','starting','Oldin tugagan harakat past perfect bilan ifodalanadi.'],
 ['This time tomorrow, she ___ for the exam.','will be studying','studied','studies','has studied','Kelajakdagi ma’lum vaqtda davom etadigan ish future continuous.'],
 ['If it rains, we ___ at home.','will stay','stayed','stay yesterday','would stayed','First conditional: if + present, will + verb.']
];
const vocabularyRows=[
 ['“Reliable” so‘ziga eng yaqin ma’noni tanlang.','trustworthy','expensive','temporary','colourful','Reliable — ishonchli.'],
 ['Students should ___ attention during the lesson.','pay','make','do','take up','To pay attention — e’tibor bermoq.'],
 ['The opposite of “increase” is ___.','decrease','improve','include','develop','Decrease — kamaymoq.'],
 ['We need strong ___ to support this claim.','evidence','decoration','weather','silence','Evidence — dalil.'],
 ['She made a useful ___ to the project.','contribution','permission','location','competition','Contribution — hissa.'],
 ['Choose the correct collocation: ___ a decision.','make','do','build','set','Ingliz tilida “make a decision” deyiladi.']
];
const advancedRows=[
 ['Rarely ___ such a clear explanation.','have I heard','I have heard','did I heard','I hearing','Rarely boshida kelganda inversion ishlatiladi.'],
 ['The results, ___ were unexpected, changed the plan.','which','who','where','what','Narsa haqida qo‘shimcha ma’lumotda which ishlatiladi.'],
 ['The teacher said that the test ___ the following day.','would begin','will begin yesterday','begins now','has beginning','Reported speech’da will → would bo‘ladi.'],
 ['The documents must ___ before Friday.','be submitted','submit','submitted them','be submit','Modal passive: must be + past participle.'],
 ['Had I known earlier, I ___ differently.','would have acted','will act','acted would','had act','Third conditional: would have + V3.'],
 ['It is essential that every answer ___ checked.','be','is being always','was to','has','Formal subjunctive’da fe’lning asosiy shakli ishlatiladi.']
];

const readingPassages=[
 ['A school library extended its opening hours during exam month. More students visited in the evening, but morning attendance stayed unchanged.','What changed after the new schedule?','Evening visits increased.','Morning visits doubled.','The library closed earlier.','Exams were cancelled.'],
 ['Dilnoza compared three sources before using a statistic in her report. Two sources agreed, while the third gave no method for its calculation.','Why did Dilnoza doubt the third source?','It did not explain its method.','It was the shortest source.','It agreed with the others.','It contained no numbers.'],
 ['The city planted trees near several bus stops. The trees will take time to grow, but planners expect them to provide shade and reduce heat in future summers.','What is the main purpose of the project?','To make waiting areas cooler over time.','To remove public transport.','To shorten every bus route.','To create indoor stations.'],
 ['A team tested its app with a small group first. The users found a confusing button, so the team changed its label before the public release.','What benefit did early testing provide?','It revealed a usability problem.','It increased the app price.','It removed all users.','It delayed every project.'],
 ['Some students studied for one long session, while others used shorter sessions across a week. The second group remembered more during the final quiz.','What does the result suggest?','Spaced practice may improve memory.','Long sessions always work best.','Quiz results do not matter.','Short sessions reduce learning.'],
 ['The article praises online lessons for flexibility but notes that stable internet and a quiet study space are not available to every learner.','What is the author’s view?','Online learning has both benefits and limits.','Online learning is always equal.','Internet access is unnecessary.','Flexibility causes every problem.'],
 ['A factory reduced packaging by using smaller boxes. Product damage did not increase, and transport trucks could carry more items per journey.','Which result was observed?','Transport became more efficient.','Products became larger.','More packaging was required.','Every truck carried fewer items.'],
 ['The researcher found a connection between sleep time and scores but warned that other habits might also influence the result.','Why is the warning important?','A connection alone does not prove one cause.','Scores cannot be measured.','Sleep has no relationship with health.','All habits are identical.'],
 ['The proposal is simple to measure, yet it focuses only on speed. Critics argue that accuracy and fairness should also be considered.','What is the criticism?','One measure cannot represent all important outcomes.','Speed is impossible to measure.','Accuracy should never be checked.','The proposal has too many measures.'],
 ['The historian accepts that the reform produced benefits. However, she asks who paid the costs and whether those costs were shared equally.','What does the historian add to the debate?','Attention to how costs were distributed.','A denial that benefits existed.','Proof that reforms have no cost.','A request to ignore equality.']
];
const readingQuestions=readingPassages.flatMap((row,index)=>[
 question(`english-5-${index*3+1}`,`${row[0]}\n\n${row[1]}`,row[2],row.slice(3,6),'Javob matndagi asosiy ma’lumotga tayangan.',index*3,'Ingliz tili'),
 question(`english-5-${index*3+2}`,`${row[0]}\n\nChoose the best summary.`,index<5?'The passage reports a change and its result.':'The passage presents a claim with a qualification.',['The passage lists unrelated names.','The passage gives only a date.','The passage contains no central idea.'],'Asosiy fikr matndagi sabab, natija yoki cheklovni umumlashtiradi.',index*3+1,'Ingliz tili'),
 question(`english-5-${index*3+3}`,`${row[0]}\n\nWhich skill is most useful for understanding this passage?`,'Identifying evidence and the main idea.',['Ignoring qualifications.','Memorising one isolated word.','Choosing without reading.'],'Reading savolida dalil va asosiy fikrni ajratish muhim.',index*3+2,'Ingliz tili')
]);

const section=(id,subject,title,description,questions,scoringModel)=>({id,subject,title,description,questionCount:30,durationMinutes:60,questions,scoringModel,builtin:true,visibility:'public',approvalStatus:'approved',ownerName:'SinfQuiz metodik bazasi'});

export const nationalTestBank=[
 section('national-math-1','Matematika','Sonlar va amallar','Amallar tartibi, butun sonlar va hisoblash aniqligi.',mathArithmetic,'general-certificate'),
 section('national-math-2','Matematika','Tenglamalar','Chiziqli tenglamalar va algebraik fikrlash.',mathEquations,'general-certificate'),
 section('national-math-3','Matematika','Foiz va proporsiya','Foiz, ulush va kundalik hisob-kitoblar.',mathPercent,'general-certificate'),
 section('national-math-4','Matematika','Geometriya','Yuza, perimetr va shakllar xossalari.',mathGeometry,'general-certificate'),
 section('national-math-5','Matematika','Funksiya va ketma-ketlik','Arifmetik progressiya va funksional bog‘lanish.',mathFunctions,'general-certificate'),
 section('national-english-1','Ingliz tili','Grammar Foundations','A1–A2 darajadagi asosiy grammatik tuzilmalar.',englishFromRows(1,grammarRows),'general-certificate'),
 section('national-english-2','Ingliz tili','Tenses and Conditionals','Zamonlar va shart gaplarni farqlash.',englishFromRows(2,tenseRows),'general-certificate'),
 section('national-english-3','Ingliz tili','Vocabulary and Collocations','Lug‘at, sinonim, antonim va birikmalar.',englishFromRows(3,vocabularyRows),'general-certificate'),
 section('national-english-4','Ingliz tili','Advanced Grammar','B2–C1 tuzilmalar, passive va inversion.',englishFromRows(4,advancedRows),'general-certificate'),
 section('national-english-5','Ingliz tili','Reading Skills','Asosiy fikr, dalil, xulosa va cheklovni aniqlash.',readingQuestions,'general-certificate')
];

export const nationalSummary={sections:nationalTestBank.length,questions:nationalTestBank.reduce((sum,item)=>sum+item.questions.length,0),subjects:['Matematika','Ingliz tili']};
