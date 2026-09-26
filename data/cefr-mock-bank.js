const themes=[
 ['School projects','a student science fair','planning a group presentation','renewable energy in schools'],
 ['City life','a community library','improving public transport','safe cycling routes'],
 ['Technology','a robotics club','using digital notes effectively','responsible artificial intelligence'],
 ['Environment','a neighbourhood clean-up','reducing plastic at events','protecting urban wildlife'],
 ['Health and learning','a school sports day','building a balanced routine','the value of regular breaks'],
 ['Travel and culture','a museum visit','organising a cultural festival','learning through local history'],
 ['Work and skills','a weekend workshop','preparing for an interview','teamwork in modern workplaces'],
 ['Science','a planetarium tour','presenting a simple experiment','citizen science projects'],
 ['Communication','a student podcast','giving constructive feedback','how language changes online'],
 ['Future education','a careers exhibition','designing a study timetable','flexible learning spaces']
];

const partSizes=[5,6,6,6,6,6];
const readingPartSizes=[7,7,7,7,7];
const names=['Amina','Daniel','Laylo','Martin','Nodira','Oliver','Sabina','Timur'];
const places=['main hall','second floor','east entrance','computer room','school garden','information desk'];
const times=['nine fifteen','ten thirty','half past eleven','one forty-five','three twenty','four o’clock'];

function rotate(values,index){return values[index%values.length]}
function choices(correct,wrong,index){const all=[correct,...wrong],shift=index%4;return [...all.slice(shift),...all.slice(0,shift)]}
function answerIndex(options,answer){return options.indexOf(answer)}

function listeningQuestion(mockIndex,part,index,globalIndex,theme){
 const person=rotate(names,mockIndex+globalIndex),place=rotate(places,globalIndex+part),time=rotate(times,mockIndex+index);
 const variants=[
  {script:`Hi ${person}. The ${theme[1]} begins at ${time}, not at ten as the first notice said. Please meet beside the ${place} ten minutes early.`,question:'What is the corrected starting time?',correct:time,wrong:['ten o’clock','noon','eight thirty']},
  {script:`Announcement: everyone joining ${theme[1]} should use the ${place}. Bring a notebook, but leave large bags in the classroom.`,question:'Where should participants go?',correct:place,wrong:['sports field','cafeteria','west gate']},
  {script:`I first wanted to work alone on ${theme[2]}, but I changed my mind because sharing the research made our final explanation clearer.`,question:'Why did the speaker change the plan?',correct:'Teamwork improved the explanation.',wrong:['The deadline disappeared.','The topic became shorter.','The teacher cancelled the task.']},
  {script:`The report on ${theme[3]} gives useful examples. However, its survey included only forty people, so its conclusion should be treated carefully.`,question:'What limitation does the speaker identify?',correct:'The survey was too small.',wrong:['There were no examples.','The subject was irrelevant.','The report had no conclusion.']},
  {script:`Although the new system took time to learn, students completed routine work faster after two weeks. Most still wanted clearer instructions for difficult tasks.`,question:'What is the speaker’s main point?',correct:'The system helped, but guidance was still needed.',wrong:['The system failed completely.','Students refused to use instructions.','All tasks became difficult.']}
 ];
 const item=variants[(globalIndex+mockIndex)%variants.length],options=choices(item.correct,item.wrong,globalIndex+mockIndex);
 return {id:`cefr-${mockIndex+1}-l-${globalIndex+1}`,part,script:item.script,question:item.question,options,correct:answerIndex(options,item.correct)};
}

function makeListening(mockIndex,theme){let globalIndex=0;return partSizes.flatMap((size,p)=>Array.from({length:size},(_,index)=>listeningQuestion(mockIndex,p+1,index,globalIndex++,theme)))}

function readingPassage(mockIndex,part,index,theme){
 const leads=[
  `${rotate(names,mockIndex+index)} joined ${theme[1]} expecting only a lecture. Instead, participants worked in small groups and compared their observations. The practical stage took longer, yet it helped them remember the main ideas.`,
  `A local team began ${theme[2]} with a detailed schedule. When two volunteers became unavailable, the team simplified the plan rather than cancelling it. The final event attracted fewer people than expected, but feedback was strongly positive.`,
  `Researchers discussing ${theme[3]} found that small changes can produce measurable benefits. They also stressed that results from one community may not apply everywhere because resources and habits differ.`,
  `The writer supports innovation, but argues that speed should not be the only measure of success. Accessibility, accuracy and long-term value must be considered before a new approach is widely adopted.`,
  `Two schools tested different solutions to the same problem. One invested in new equipment; the other trained staff to use existing resources more effectively. Both improved, though the second school spent considerably less.`
 ];
 return leads[(part-1)%leads.length];
}

function readingQuestion(mockIndex,part,index,globalIndex,theme){
 const passage=readingPassage(mockIndex,part,index,theme);
 const variants=[
  ['What is the main idea of the passage?','A practical adjustment led to a useful outcome.',['Nothing changed after the project.','Only money determined success.','The activity was cancelled immediately.']],
  ['Which statement is supported by the passage?','The result included both a benefit and a limitation.',['Every participant had the same opinion.','The plan worked exactly as first designed.','The writer rejects all change.']],
  ['What can reasonably be inferred?','Context can affect how well a solution works.',['One solution is perfect everywhere.','Evidence is unnecessary.','Training always costs more than equipment.']],
  ['Why does the writer mention a difficulty?','To give a balanced account of the outcome.',['To prove that the topic is unimportant.','To change to an unrelated subject.','To show that no progress was made.']],
  ['Which word best describes the writer’s approach?','Measured',['Careless','Hostile','Unquestioning']]
 ];
 const [question,correct,wrong]=variants[(globalIndex+part+mockIndex)%variants.length],options=choices(correct,wrong,globalIndex);
 return {id:`cefr-${mockIndex+1}-r-${globalIndex+1}`,part,passage,question,options,correct:answerIndex(options,correct)};
}

function makeReading(mockIndex,theme){let globalIndex=0;return readingPartSizes.flatMap((size,p)=>Array.from({length:size},(_,index)=>readingQuestion(mockIndex,p+1,index,globalIndex++,theme)))}

function makeWriting(mockIndex,theme){return [
 {id:`cefr-${mockIndex+1}-w-1`,task:1,minWords:100,maxWords:150,title:'Formal message',prompt:`You took part in ${theme[1]}. Write an email to the organiser. Explain what was useful, describe one problem and suggest one improvement.`},
 {id:`cefr-${mockIndex+1}-w-2`,task:2,minWords:200,maxWords:250,title:'Essay',prompt:`Some people believe schools should give more time to ${theme[2]}. Discuss both views and give your own opinion with reasons and examples.`}
 ]}

function makeSpeaking(mockIndex,theme){return [
 {part:1,minutes:3,title:'Personal questions',prompts:[`What do you enjoy learning outside lessons?`,`How do you usually prepare for an important task?`,`Tell us about a useful skill you learned recently.`]},
 {part:2,minutes:4,title:'Long turn',prompts:[`Describe an experience connected with ${theme[1]}. Say what happened, who was involved and what you learned. You have one minute to prepare and two minutes to speak.`]},
 {part:3,minutes:8,title:'Discussion',prompts:[`How could ${theme[2]} benefit young people?`,`What difficulties might appear?`,`Who should be responsible for making improvements?`,`How may this topic change in the future?`]}
 ]}

export const cefrMockBank=themes.map((theme,index)=>({
 id:`cefr-mock-${index+1}`,number:index+1,title:`Multilevel Mock ${index+1}`,theme:theme[0],description:`${theme[0]} mavzusidagi to‘liq B1–C1 multilevel mashq varianti.`,durationMinutes:180,
 listening:makeListening(index,theme),reading:makeReading(index,theme),writing:makeWriting(index,theme),speaking:makeSpeaking(index,theme)
}));

export const cefrSummary={mocks:cefrMockBank.length,listeningPerMock:35,readingPerMock:35,writingPerMock:2,speakingParts:3};
