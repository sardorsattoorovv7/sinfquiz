import {writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {cases} from '../data/cefr-ready-cases.js';

const root=fileURLToPath(new URL('..',import.meta.url));
const source='SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati';
const order=(items,shift)=>[...items.slice(shift%items.length),...items.slice(0,shift%items.length)];
const makeQuestion=(id,text,answer,options,explanation,shift=0)=>({
 id,type:'choice',text,options:order(options,shift),answers:[answer],explanation
});
const short=(id,text,answer,explanation)=>({id,type:'text',text,options:[],answers:[answer],explanation});
const section=(skill,minutes,parts)=>({skill,minutes,parts});
const part=(skill,i,title,text,questions,audioUrl='')=>({id:`${skill}-p${i}`,title,text,source,audioUrl,imageUrl:'',questions});
const labels=['A','B','C','D','E','F','G','H','I','J'];

function listening(c,n){
 const p1=[
  [`The first message said ${c.earlier}, but the ${c.topic.toLowerCase()} meeting now starts at ${c.time}.`,'When does the meeting begin?',c.time,[c.time,c.earlier,'12:00']],
  [`We are meeting at ${c.venue}. Please do not wait at the old entrance.`,'Where will people meet?',c.venue,[c.venue,'the town hall','the railway café']],
  [`Before you leave home, remember to bring ${c.bring}. Other equipment is provided.`,'What should visitors bring?',c.bring,[c.bring,'a printed ticket','a camera']],
  [`You can sign up until ${c.register}. We cannot add names at the door.`,'What is the last day to register?',c.register,[c.register,'the following weekend','the day after the event']],
  [`Admission is ${c.fee}. The amount covers the materials, and there is no extra charge.`,'How much is admission?',c.fee,[c.fee,'five pounds','ten pounds']],
  [`If you have a question, ask for ${c.contact} at the information desk.`,'Who can answer questions?',c.contact,[c.contact,'the caretaker','the driver']],
  [`Because ${c.challenge}, the team decided to ${c.change}.`,'What did the team decide to do?',c.change,[c.change,'cancel the entire project','ignore the difficulty']],
  [`We are doing this to support ${c.focus}, not simply to advertise the event.`,'What is the main purpose?',c.focus,[c.focus,'to sell more tickets','to replace every volunteer']]
 ];
 const q1=p1.map(([script,q,a,opts],i)=>makeQuestion(`m${n}-l1-${i+1}`,q,a,opts,`The announcement says: ${script}`,i));
 const s1=p1.map(([script],i)=>`Message ${i+1}. ${script}`).join(' ');

 const s2=`Welcome to the ${c.topic.toLowerCase()} briefing. We meet on ${c.day} at ${c.time}. ${c.contact} will lead the first session. Please register by ${c.register}. During the trial we recorded ${c.number} entries. When you describe the main concern in your notes, use the word ${c.keyword}. The session takes place at ${c.venue}. There will be time for questions at the end, but please keep the completed form with you until the organiser collects it.`;
 const p2facts=[['Which day is the briefing held?',c.day],['What time does the briefing start?',c.time],['Who leads the first session?',c.contact],['What is the registration deadline?',c.register],['How many entries were recorded?',c.number],['Which word describes the main concern?',c.keyword]];
 const q2=p2facts.map(([q,a],i)=>short(`m${n}-l2-${i+1}`,q+' Write ONE word or number.',a,`The briefing explicitly gives ${a}.`));

 const speakers=[
  `I joined because ${c.focus} matters to my family. I want more neighbours to take part.`,
  `When ${c.challenge}, I learned that even a useful idea needs a practical backup plan.`,
  `I was impressed by ${c.result}, although we still need to check whether it lasts.`,
  `For me the important next step is to ${c.next}; the first event should not be the end.`
 ];
 const themes=['Personal motivation','Learning from a setback','Cautious optimism about a result','Planning the next stage','Finding a sponsor','Rejecting the whole project'];
 const s3=speakers.map((s,i)=>`Speaker ${i+1}. ${s}`).join(' ');
 const q3=speakers.map((_,i)=>makeQuestion(`m${n}-l3-${i+1}`,`Match speaker ${i+1} with the main idea.`,themes[i],themes,`Speaker ${i+1} focuses on ${themes[i].toLowerCase()}.`,i+n));

 const actions=[
  ['A visitor who cannot reach the upper floor','Move activities to an accessible room'],
  ['A volunteer who needs to know the arrival time','Check the revised schedule'],
  ['Someone who wants the project to continue','Help plan a follow-up session'],
  ['A researcher questioning the findings','Explain the sample limitation'],
  ['A participant with an item to bring','Read the equipment list']
 ];
 const actionOptions=actions.map(x=>x[1]).concat(['Buy a new ticket immediately','Send the report to a newspaper','Replace all volunteers']);
 const s4=`At ${c.venue}, our team reviewed five requests. One visitor could not reach the upper floor, so we moved activities to an accessible room. A volunteer asked when to arrive; we directed them to the revised schedule. Another person wanted the project to continue and joined the follow-up planning group. A researcher questioned the findings, so we explained that ${c.limit}. Finally, a participant asked what to bring; the equipment list answered that question. We did not ask anybody to buy another ticket.`;
 const q4=actions.map(([person,answer],i)=>makeQuestion(`m${n}-l4-${i+1}`,`Which response was given to ${person.toLowerCase()}?`,answer,actionOptions,`The announcement connects this request with “${answer.toLowerCase()}”.`,i+n));

 const dialogs=[
  {script:`A: The report says ${c.result}. Does that prove the plan will always work? B: No. ${c.limit}. We need another trial.`,qa:['Why is the speaker cautious?',c.limit,[c.limit,'There was no trial.','The report was lost.']],qb:['What does the speaker recommend?', 'another trial',['another trial','closing the project','buying a larger room']]},
  {script:`A: Should we choose ${c.choice} or ${c.contrast}? B: I prefer ${c.choice}, because it directly supports ${c.focus}.`,qa:['Which option does the second speaker prefer?',c.choice,[c.choice,c.contrast,'neither option']],qb:['Why does the speaker prefer it?',c.focus,[c.focus,'it is the oldest option','it needs no volunteers']]},
  {script:`A: I heard ${c.contact} will speak on ${c.day}. B: Yes, at ${c.venue}; the plan changed after ${c.challenge}.`,qa:['Who will speak?',c.contact,[c.contact,'the driver','the caretaker']],qb:['Why did the plan change?',c.challenge,[c.challenge,'a lack of interest','a change in the weather forecast']]}
 ];
 const s5=dialogs.map((d,i)=>`Conversation ${i+1}. ${d.script}`).join(' ');
 const q5=dialogs.flatMap((d,i)=>[d.qa,d.qb].map(([q,a,opts],j)=>makeQuestion(`m${n}-l5-${i*2+j+1}`,q,a,opts,`Conversation ${i+1} states this clearly.`,i+j+n)));

 const s6=`Today I will explain what our ${c.topic.toLowerCase()} project can and cannot show. We began with ${c.focus}. Our first obstacle was ${c.challenge}; the practical response was to ${c.change}. We collected ${c.evidence}. Together, those records form evidence. The total highlighted in the report is ${c.number}. The weakness is that ${c.limit}. Next, the team will ${c.next}. The key idea is ${c.keyword}: a result is useful only when we understand the conditions behind it. We asked visitors for feedback, and the report distinguishes what people observed from what they merely expected. Keep that distinction in mind when you read the final conclusions.`;
 const gapFacts=[['What do the collected records form?','evidence'],['What is the total highlighted in the report?',c.number],['Which word describes the key idea?',c.keyword],['What did the team ask visitors for?','feedback'],['What must be understood behind a result?','conditions'],['Which section contains the final interpretation?','conclusions']];
 const q6=gapFacts.map(([q,a],i)=>short(`m${n}-l6-${i+1}`,q+' Write ONE word or number.',a,`The lecture uses the word ${a}.`));
 return {parts:[
  part('listening',1,'Short announcements','Listen to eight short messages. Choose the best answer for each.',q1),
  part('listening',2,'Briefing notes','Listen to the briefing. Complete the notes with one word or number.',q2),
  part('listening',3,'Four speakers','Match four speakers with the main ideas. Two options are extra.',q3),
  part('listening',4,'Responding to requests','Match each request to the response. Three options are extra.',q4),
  part('listening',5,'Three conversations','Listen to three conversations. Answer two questions about each.',q5),
  part('listening',6,'Project lecture','Listen to the lecture and write one word or number for each answer.',q6)
 ],scripts:[s1,s2,s3,s4,s5,s6]};
}

function reading(c,n){
 const gaps=['volunteers','schedule','records','feedback','access','evidence'];
 const p1text=`The ${c.topic.toLowerCase()} project depended on (1) ____ who gave their time freely. At first, the team followed a fixed (2) ____, but ${c.challenge}. Careful (3) ____ showed exactly when the difficulty appeared. The organisers asked visitors for (4) ____ before changing the plan. They also wanted better (5) ____ for people who could not use the first arrangement. In the end, the strongest (6) ____ came from ${c.evidence}. None of these observations proves that the same approach would work in every town. Nevertheless, the group learned why small, well-recorded changes can matter. Its next meeting will consider whether ${c.next} is practical and who could help.`;
 const q1=gaps.map((a,i)=>short(`m${n}-r1-${i+1}`,`Complete gap ${i+1} with ONE word.`,a,`“${a}” makes the sentence grammatically and logically complete.`));

 const adverts=[
  [`A. Guided introduction: meet ${c.contact} at ${c.venue} on ${c.day}.`,'A visitor wants a guided introduction.','A'],
  [`B. Quiet hour: a smaller group meets before the main session.`,'Someone prefers a smaller, quieter group.','B'],
  [`C. Access help: ask about step-free rooms and larger-print information.`,'A person needs access information.','C'],
  [`D. Skills desk: volunteers demonstrate practical methods and tools.`,'A learner wants a hands-on demonstration.','D'],
  [`E. Family visit: activities are planned for adults and children together.`,'A parent wants to bring a child.','E'],
  [`F. Research corner: examine the report and ask how information was collected.`,'A visitor wants to inspect the evidence.','F'],
  [`G. Follow-up team: help organise ${c.next}.`,'A resident wants to help with the next event.','G'],
  [`H. Short briefing: ${c.contact} gives a twenty-minute overview.`,'Someone has only twenty minutes available.','H'],
  [`I. Merchandise desk: souvenirs are available after the event.`,'Extra advertisement one.','I'],
  [`J. Private room hire: businesses can book an unrelated meeting.`,'Extra advertisement two.','J']
 ];
 const q2=adverts.slice(0,8).map(([,need,a],i)=>makeQuestion(`m${n}-r2-${i+1}`,`Which notice suits this person? ${need}`,a,labels,`Notice ${a} offers exactly this service.`,i+n));
 const p2text=adverts.map(x=>x[0]).join('\n');

 const headings=['The original difficulty','A practical adjustment','Collecting information','What the figures show','A reason for caution','The next question','A celebrity endorsement','An unrelated invention'];
 const paragraphs=[
  `A. The idea behind ${c.topic.toLowerCase()} began with ${c.focus}. People welcomed the aim, but the first arrangement was less reliable than the team expected. In particular, ${c.challenge}. Several participants described this as a problem of planning rather than a reason to abandon the work. Their observations were recorded instead of being dismissed.`,
  `B. The organisers compared a complicated solution with a manageable one. They chose to ${c.change}. This did not remove every difficulty, yet it made the next session possible without asking volunteers to start again. ${c.contact} then explained the revised procedure to participants, including those who had missed the first announcement.`,
  `C. Good intentions alone could not tell the team whether the change helped. They gathered ${c.evidence} and kept notes about the conditions under which each observation was made. When a record was incomplete, they marked it as uncertain rather than filling in a likely answer. This made the report less dramatic but more useful.`,
  `D. According to the team, ${c.result}. The figure attracted attention because it described an observable outcome, not merely a prediction. It also encouraged more residents to ask how they could take part. However, a number by itself says little about the people or circumstances behind it.`,
  `E. The report acknowledges that ${c.limit}. A different location, season or group of participants might produce a different result. The team therefore resisted a claim that its method was universally successful. This careful interpretation helped readers separate the evidence from the organisers' hopes.`,
  `F. The final recommendation was to ${c.next}. Before doing so, the organisers want to agree on clear measures of success and an accessible way to collect comments. They also plan to compare ${c.choice} with ${c.contrast} rather than assuming one choice will be best for every participant.`
 ];
 const q3=paragraphs.map((_,i)=>makeQuestion(`m${n}-r3-${i+1}`,`Choose a heading for paragraph ${'ABCDEF'[i]}.`,headings[i],headings,`Paragraph ${'ABCDEF'[i]} develops the idea “${headings[i].toLowerCase()}”.`,i+n));
 const p3text=`Headings: ${headings.map((h,i)=>`${'ABCDEFGH'[i]}. ${h}`).join(' | ')}\n\n${paragraphs.join('\n\n')}`;

 const p4text=`An invitation to take part in ${c.topic.toLowerCase()} appeared at ${c.venue}. Its stated aim was ${c.focus}. The first public meeting was held on ${c.day}, and ${c.contact} collected the comments. Early reports suggested enthusiasm, but the team also heard practical concerns. Most notably, ${c.challenge}. It would have been easy to present this as a minor inconvenience. Instead, the organisers documented it and chose to ${c.change}.\n\nThe revised activity did not follow exactly the original schedule. The organisers tested the change, recorded ${c.evidence}, and compared comments made before and after the adjustment. Their report states that ${c.result}. The authors are careful to explain the difference between an observation and a prediction: a positive first month does not guarantee a positive first year.\n\nTwo alternatives were discussed. Some participants supported ${c.choice}; others preferred ${c.contrast}. Neither option was dismissed without consideration. The report ultimately recommended a limited further trial rather than an immediate permanent decision. Its main reservation was that ${c.limit}. ${c.contact} said that the next stage would be to ${c.next}.\n\nThe report does not give the ages of the visitors, the exact amount of any future grant, or a date for publishing a second edition. Those details may matter later, but a reader should not invent them now. The value of the project lies partly in its willingness to say what remains unknown.`;
 const q4=[
  makeQuestion(`m${n}-r4-1`,'What was the stated aim of the project?',c.focus,[c.focus,'to sell souvenirs','to replace public transport','to close the venue'],'The opening paragraph states the aim.',n),
  makeQuestion(`m${n}-r4-2`,'What led the organisers to revise the activity?',c.challenge,[c.challenge,'a new mayor','a cancelled newspaper','a competition prize'],'The reported problem led directly to the adjustment.',n+1),
  makeQuestion(`m${n}-r4-3`,'Which action did the organisers take?',c.change,[c.change,'stop collecting comments','claim guaranteed success','ignore accessibility'],'The revised action is explicitly described.',n+2),
  makeQuestion(`m${n}-r4-4`,'How do the authors treat the positive early result?','As useful but limited evidence',['As useful but limited evidence','As proof for every community','As an error to hide','As irrelevant to the project'],'The text distinguishes observation from prediction.',n+3),
  ...[
   ['The team recorded information during the revised activity.','True','The second paragraph says the team recorded evidence.'],
   ['The organisers permanently rejected both alternatives.','False','Both alternatives were considered; a further trial was recommended.'],
   ['Every visitor was younger than eighteen.','Not Given','No ages are supplied.'],
   ['The report identifies a limitation of the trial.','True','The report acknowledges a limitation.'],
   ['A second edition will be published next month.','Not Given','No date for a second edition is given.']
  ].map(([q,a,e],i)=>makeQuestion(`m${n}-r4-${i+5}`,`True / False / Not Given: ${q}`,a,['True','False','Not Given'],e,i+n))
 ];

 const p5text=`The organisers at ${c.venue} made a useful distinction between a change that is easy to announce and a change that can be evaluated. Their focus was ${c.focus}. During the first stage, ${c.challenge}. The immediate response was to ${c.change}, but the team did not describe this response as a complete solution.\n\nTo check what happened, they collected ${c.evidence}. The report highlighted a figure of ${c.number}. A short account of the trial was sent to ${c.contact}, who asked for more information about the conditions in which it took place. In particular, ${c.limit}. This mattered because an impressive number from a narrow trial can be misleading when removed from its context.\n\nAt the next meeting, participants will compare ${c.choice} with ${c.contrast}. They will also consider how to ${c.next}. The discussion is designed to invite disagreement supported by reasons, not to reward the loudest speaker. If the group can repeat the trial and explain its limitations clearly, the result will be more useful to other communities.`;
 const q5=[
  short(`m${n}-r5-1`,'Which venue hosted the organisers? Write ONE word from the venue name.',c.venue.split(' ')[0],`The venue starts with ${c.venue.split(' ')[0]}.`),
  short(`m${n}-r5-2`,'What figure did the report highlight? Write ONE number.',c.number,`The figure given is ${c.number}.`),
  short(`m${n}-r5-3`,'Who requested more information? Write ONE name.',c.contact,`The text names ${c.contact}.`),
  short(`m${n}-r5-4`,'What can be misleading without context? Write ONE word.','number','The passage describes an impressive number from a narrow trial.'),
  makeQuestion(`m${n}-r5-5`,'Why does the writer mention the limitation?','To prevent an overconfident conclusion',['To prevent an overconfident conclusion','To argue that evidence is useless','To avoid hearing from participants','To hide the report'],'The writer warns against removing the result from context.',n),
  makeQuestion(`m${n}-r5-6`,'What attitude does the final paragraph encourage?','Reasoned disagreement',['Reasoned disagreement','Silence at meetings','Immediate approval of every idea','Competition for attention'],'The group invites disagreement supported by reasons.',n+1)
 ];
 return [
  part('reading',1,'One-word gaps',p1text,q1),
  part('reading',2,'Notices and needs',p2text,q2),
  part('reading',3,'Paragraph headings',p3text,q3),
  part('reading',4,'Detailed article',p4text,q4),
  part('reading',5,'Analysis and inference',p5text,q5)
 ];
}

function writing(c,n){
 const tasks=[
  `You and a friend attended an activity about ${c.topic.toLowerCase()}. Write an informal message to your friend. Explain what you enjoyed and suggest one thing to do next. Aim for about 50 words.`,
  `Write to ${c.contact}, the organiser at ${c.venue}. Explain why you attended, describe the difficulty (“${c.challenge}”), and suggest a practical improvement. Use a suitable formal tone. Aim for about 120–150 words.`,
  `Some people think communities should invest in ${c.choice}; others prefer ${c.contrast}. Discuss both views and explain which approach would better support ${c.focus}. Give reasons and examples. Aim for about 180–220 words.`
 ];
 return [part('writing',1,'Tasks 1.1, 1.2 and 2','Write all three responses. Your work is assessed by an administrator.',tasks.map((text,i)=>({id:`m${n}-w${i+1}`,type:'writing',text,options:[],answers:[],explanation:''})))];
}
function speaking(c,n){
 const groups=[
  ['What do you enjoy doing in your neighbourhood?','How do you usually learn about local events?',`Have you ever visited a place like ${c.venue}?`],
  [`Compare a small group discussion at ${c.venue} with a large public meeting. What might each be like?`,`Which setting would help people discuss ${c.topic.toLowerCase()} more effectively, and why?`, 'Would your preference change if you were presenting rather than listening?'],
  [`Discuss this issue: should communities prioritise ${c.choice} or ${c.contrast}? Give advantages, disadvantages and examples connected with ${c.focus}.`],
  [`“A small successful trial is enough to justify a permanent public policy.” Discuss both sides of this claim. Refer to the limitation that ${c.limit}.`]
 ];
 const titles=['Part 1.1 — personal questions','Part 1.2 — compare two scenes','Part 2 — extended answer','Part 3 — argument'];
 return groups.map((arr,i)=>part('speaking',i+1,titles[i],i===1?'Scene A: a small group working together. Scene B: a large public presentation. Compare the two situations.':i===2?'Prepare for one minute; speak for about two minutes.':'Record one answer per prompt.',arr.map((text,j)=>({id:`m${n}-s${i+1}-${j+1}`,type:'speaking',text,options:[],answers:[],explanation:''}))));
}

export const readyMocks=cases.map((c,index)=>{
 const n=index+1,l=listening(c,n);
 l.parts.forEach((p,i)=>p.audioUrl=`/cefr-audio/mock-${n}-part-${i+1}.mp3`);
 return {title:`Multilevel Mock ${String(n).padStart(2,'0')} · ${c.topic}`,description:`Original mashq varianti: ${c.topic.toLowerCase()}. 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. Rasmiy test savollari emas.`,level:'B1–C1',format:'multilevel',rightsConfirmed:true,seedKey:`sinfquiz-multilevel-${n}`,sections:[section('listening',45,l.parts),section('reading',60,reading(c,n)),section('writing',60,writing(c,n)),section('speaking',15,speaking(c,n))]};
});
export const listeningScripts=cases.flatMap((c,index)=>listening(c,index+1).scripts.map((script,p)=>({mock:index+1,part:p+1,text:script})));

if(process.argv.includes('--write')){
 const path=join(root,'data','cefr-ready-bank.json');
 writeFileSync(path,JSON.stringify(readyMocks,null,2)+'\n');
 const scriptsPath=join(root,'data','cefr-audio-scripts.json');
 writeFileSync(scriptsPath,JSON.stringify(listeningScripts,null,2)+'\n');
 console.log(`Created ${readyMocks.length} variants and ${listeningScripts.length} original audio scripts.`);
}
