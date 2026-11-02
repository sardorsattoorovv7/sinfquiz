// Original practice material; not released or predicted live examination questions.
// DATA ONLY. Asset records are plans: generate and validate the referenced SVGs before publication.
export const SPEAKING_BANK_VERSION = '7.46.0-original-bank-2026-11-02';
export const SPEAKING_CHECKED_AT = '2026-11-02';
export const speakingSources = Object.freeze({
  ieltsFormat: {id:'ielts-format-20261102',publisher:'IELTS',title:'IELTS Academic: Speaking test format',url:'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking',checkedAt:SPEAKING_CHECKED_AT,officialDocumentVersion:null,verification:'official-page-read',sha256:'961a901b65d89da8c7a8bde18d72cff8903cce47ae959d785ea83a263e20bc38'},
  ieltsDescriptors: {id:'ielts-descriptors-20261102',publisher:'IELTS',title:'Speaking Band Descriptors',url:'https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf',checkedAt:SPEAKING_CHECKED_AT,officialDocumentVersion:null,verification:'official-pdf-read-and-bytes-downloaded',sha256:'8f8f556a64da18eefdcd68bb6addcc261f0299d72e0461bcf9a2c1d2a5b9c56b'},
  ieltsScoring: {id:'ielts-scoring-20261102',publisher:'IELTS',title:'IELTS scoring in detail',url:'https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail',checkedAt:SPEAKING_CHECKED_AT,officialDocumentVersion:null,verification:'official-indexed-page-read',sha256:null},
  multilevelIndex: {id:'uzbmb-speaking-index-20261102',publisher:'Bilim va malakalarni baholash agentligi',title:'Gapirish ko‘nikmasi',url:'https://uzbmb.uz/page/cefr_speaking',checkedAt:SPEAKING_CHECKED_AT,officialDocumentVersion:null,verification:'official-search-index; origin-503',sha256:null},
  multilevelFormat: {id:'uzbmb-speaking-format-20261102',publisher:'Bilim va malakalarni baholash agentligi',title:'Ko‘p darajali test sinovi gapirish ko‘nikmasi yangi formati',url:'https://uzbmb.uz/upload/file/pdf/phone/Speaking_yangi_format.pdf',checkedAt:SPEAKING_CHECKED_AT,officialDocumentVersion:null,verification:'official-indexed-pdf-full-text-read; origin-503',sha256:null},
  multilevelRatingScale: {id:'uzbmb-speaking-rating-20261102',publisher:'Bilim va malakalarni baholash agentligi',title:'Ko‘p darajali format gapirish ko‘nikmasini baholash reyting shkalasi',url:'https://uzbmb.uz/upload/file/pdf/phone/reyting_shkala.pdf',checkedAt:SPEAKING_CHECKED_AT,officialDocumentVersion:null,verification:'official-indexed-pdf-table-read; not an activated assessment rubric',sha256:null},
});

export const speakingFormat = Object.freeze({
  ielts: {
    id:'ielts-speaking-sourcechecked-20261102',sourceIds:['ieltsFormat','ieltsDescriptors','ieltsScoring'],checkedAt:SPEAKING_CHECKED_AT,
    totalDurationSeconds:{min:660,max:840},officialFixedQuestionCount:null,
    sections:[
      {section:'part1',part:'1',taskType:'personal_interview',timerScope:'section',durationSeconds:{min:240,max:300},prepSeconds:0,responseMaxSeconds:null,questionCount:null},
      {section:'part2',part:'2',taskType:'long_turn',timerScope:'task_with_optional_follow_up',durationSeconds:{min:180,max:240},prepSeconds:60,responseMaxSeconds:120,questionCount:null},
      {section:'part3',part:'3',taskType:'abstract_discussion',timerScope:'section',durationSeconds:{min:240,max:300},prepSeconds:0,responseMaxSeconds:null,questionCount:null},
    ],
    timerPolicy:'Part 1 and Part 3 share a section time budget. Their per-question response caps are null; the bank pool length is not an official question count. Part 2 preparation and long turn have separate timers. Pause candidate timers while waiting for network operations.',
    scoring:{label:'AI taxminiy tahlili',officialResult:false,criteria:[{id:'fluency_coherence',weight:.25},{id:'lexical_resource',weight:.25},{id:'grammar_range_accuracy',weight:.25},{id:'pronunciation',weight:.25}],overallBandDefault:null,pronunciationScoreDefault:null,requiresValidatedAudioOrHumanPronunciation:true,missingCriterionMeansNoOverall:true,questionBandAveragingAllowed:false},
  },
  multilevel: {
    id:'uzbmb-speaking-sourcechecked-20261102',sourceIds:['multilevelIndex','multilevelFormat','multilevelRatingScale'],checkedAt:SPEAKING_CHECKED_AT,
    totalRecordedAnswerSlots:8,recordedAnswerSlotPattern:[3,3,1,1],fixedTotalExamSeconds:null,
    answerAndPreparationSeconds:555,instructionAndTransitionSecondsIncluded:false,
    sections:[
      {section:'part1_1',part:'1.1',taskType:'personal_questions',recordedAnswerSlots:3,visibleQuestionCount:3,prepSeconds:0,responseMaxSeconds:[30,30,30]},
      {section:'part1_2',part:'1.2',taskType:'picture_comparison',recordedAnswerSlots:3,visibleQuestionCount:3,prepSeconds:0,responseMaxSeconds:[45,30,30],imageCount:2},
      {section:'part2',part:'2',taskType:'three_question_long_turn',recordedAnswerSlots:1,visibleQuestionCount:3,prepSeconds:60,responseMaxSeconds:120,imageCount:1,describeImageRequired:false,showAllThreeQuestionsTogether:true},
      {section:'part3',part:'3',taskType:'balanced_argument',recordedAnswerSlots:1,visibleQuestionCount:1,prepSeconds:60,responseMaxSeconds:120,showForAndAgainstTogether:true,choosePointsFromEachSide:2},
    ],
    timerPolicy:'Eight answer recordings, not eight underlying question prompts. The 555 seconds cover answer and preparation time only, not the entire real examination. Do not deduct upload, model generation or transcription time from speaking time.',
    scoring:{label:'Transkript bo‘yicha taxminiy profil',officialResult:false,scaledScore75Default:null,cefrLevelDefault:null,rawRubricVersion:null,rawToScaledTableAvailableAsReference:true,rawToScaledMappingActivated:false,requiresValidatedCompleteRawRubricAndAudio:true,ieltsToCefrConversionAllowed:false},
  },
});

const imagePlan=(id,filename,caption,visibleObjects)=>Object.freeze({id,src:`/speaking/v7.46/${filename}.svg`,caption,alt:caption,visibleObjects,rendering:'original local SVG illustration',status:'generated_and_validated',source:{type:'original-asset',author:'SinfQuiz',url:null,checkedAt:SPEAKING_CHECKED_AT},rights:'Original project illustration; rights remain with the project owner. No third-party photograph is copied.'});
const pairPlans=[
 ['learning',['Three students sit around a table with notebooks and discuss a task.',['students','table','notebooks','classroom']],['One student studies at a desk using a laptop with a lesson on the screen.',['student','desk','laptop','headphones']]],
 ['transport',['Passengers sit inside a train carriage with bags beside them.',['passengers','train seats','window','bags']],['A person rides a bicycle along a marked cycle path.',['cyclist','bicycle','cycle path','trees']]],
 ['leisure',['Friends sit on a picnic blanket in a park with a food basket.',['friends','blanket','basket','park']],['Visitors look at paintings in an indoor art museum.',['visitors','paintings','museum walls','bench']]],
 ['shopping',['A shopper chooses vegetables at an outdoor market stall.',['shopper','vegetables','stall','market']],['A shopper pushes a trolley between shelves in a supermarket.',['shopper','trolley','shelves','supermarket']]],
 ['exercise',['Two people run along a path in a park.',['runners','path','trees','running shoes']],['A person exercises on a stationary bicycle in a gym.',['person','stationary bicycle','gym','water bottle']]],
 ['communication',['Family members talk while sitting together around a dining table.',['family members','dining table','chairs','plates']],['A person talks to someone on a laptop video call.',['person','laptop','video call screen','desk']]],
 ['reading',['A reader holds a paper book while sitting beside a window.',['reader','paper book','chair','window']],['A reader holds a tablet displaying a page of text.',['reader','tablet','chair','reading lamp']]],
 ['meals',['A person prepares vegetables in a home kitchen.',['cook','vegetables','kitchen worktop','pan']],['Two people eat a meal at a restaurant table.',['diners','restaurant table','plates','menu']]],
 ['short-journeys',['Several people wait at a bus stop beside a timetable.',['people','bus stop','timetable','bus']],['Two people walk along a pavement carrying small bags.',['pedestrians','pavement','bags','street']]],
 ['collaboration',['Colleagues discuss a plan around a meeting table.',['colleagues','meeting table','plan','office']],['Volunteers work together to plant young trees outdoors.',['volunteers','young trees','spades','outdoor ground']]],
 ['green-spaces',['People relax in a city park surrounded by tall buildings.',['people','park bench','trees','city buildings']],['People walk on a path through open countryside.',['walkers','footpath','hills','fields']]],
 ['creative-hobbies',['A learner draws a picture at a table with pencils and paper.',['learner','pencils','paper','table']],['A learner practises a musical instrument in a room.',['learner','musical instrument','music stand','chair']]],
];
export const speakingImagePairs=Object.freeze(pairPlans.map(([topic,a,b],index)=>{
  const n=String(index+1).padStart(2,'0'),id=`sp746-pair-${n}`;
  return Object.freeze({id,topic,purpose:index<6?'multilevel-mock':'unseen-practice-transfer',images:[imagePlan(`${id}-a`,`pair-${n}-a`,...a),imagePlan(`${id}-b`,`pair-${n}-b`,...b)],captionQuestionAlignmentChecked:true,assetBytesValidated:true});
}));
const contextPlans=[
 ['learning-challenge','A learner practises a new skill using notes and simple tools.',['learner','notes','tools','practice desk']],
 ['helping-others','People organise boxes of useful supplies at a community collection point.',['people','boxes','supplies','collection point']],
 ['personal-decision','A person looks at a planner with two possible routes drawn on a separate map.',['person','planner','map','two routes']],
 ['handling-change','A small group moves an outdoor activity into an indoor room as rain begins.',['group','rain outside','indoor room','activity materials']],
 ['team-achievement','A team checks a completed project displayed on a table.',['team','completed project','table','notes']],
 ['using-time','A person arranges study, work and leisure cards on a weekly planner.',['person','weekly planner','study card','leisure card']],
];
export const speakingContextImages=Object.freeze(contextPlans.map(([topic,caption,objects],index)=>({...imagePlan(`sp746-context-${String(index+1).padStart(2,'0')}`,`context-${String(index+1).padStart(2,'0')}`,caption,objects),topic,purpose:'multilevel-part2-context-not-description-target'})));
export const speakingImageAssets=Object.freeze([...speakingImagePairs.flatMap(p=>p.images),...speakingContextImages]);

const difficultyFor=section=>['part1','part1_1'].includes(section)?'familiar':section==='part1_2'?'descriptive':section==='part2'?'extended':'analytical';
function question(exam,setId,section,index,topic,prompt,extra={}){
  const id=`sp746-${exam}-${setId}-${section}-${String(index).padStart(2,'0')}`;
  const ielts=exam==='ielts',long=section==='part2'||section==='part3'&&!ielts;
  return Object.freeze({id,exam,setId,section,part:section==='part1_1'?'1.1':section==='part1_2'?'1.2':section.replace('part',''),taskType:ielts?(section==='part1'?'personal_interview':section==='part2'?'cue_card':'abstract_discussion'):(section==='part1_1'?'personal_question':section==='part1_2'?'picture_question':section==='part2'?'three_question_long_turn':'balanced_argument'),topic,difficulty:difficultyFor(section),difficultyCalibrated:false,prompt,taskPoints:[],prepSeconds:long?60:0,responseMaxSeconds:ielts?(section==='part2'?120:null):(section==='part1_1'?30:section==='part1_2'?(index===1?45:30):120),timerScope:ielts&&section!=='part2'?'section':'task',imageIds:[],imagePairId:null,formatVersion:speakingFormat[exam].id,bankVersion:SPEAKING_BANK_VERSION,sourceId:ielts?'ieltsFormat':'multilevelFormat',checkedAt:SPEAKING_CHECKED_AT,origin:'SinfQuiz original practice question',officialExamQuestion:false,exposureKey:id,promptFamilyId:id,exposurePolicy:'Resolve prompt, model-answer and image exposure from this learner’s ledger; never store a global seen=false flag.',...extra});
}

const ieltsPlans=[
 {id:'mock-01',title:'Learning beyond the classroom',topic:'learning',p1:[
  'Are you working or studying at the moment?','What do you enjoy most about your usual weekday activities?','Is there anything you would like to change about your daily routine?',
  'What kinds of things do you enjoy learning in your free time?','Do you prefer learning something alone or with another person?','How do you remember new information?',
  'What do you usually do at the weekend?','Have your weekends changed since you were younger?','Do you prefer making weekend plans or deciding on the day?','Is there a place you like visiting on your days off?'],
  cue:'Describe a useful skill you learned outside a formal class.',points:['what the skill was','how and when you learned it','who or what helped you','and explain why learning it was useful to you'],follow:'Have you used that skill recently?',
  p3:['Why do some adults enjoy learning new skills?','How is learning a practical skill different from learning facts?','What responsibilities do schools have for teaching everyday skills?','Can online lessons replace all types of face-to-face teaching?','Why might people stop learning something they were initially interested in?','How could communities make learning more accessible to people of different ages?']},
 {id:'mock-02',title:'Places and community life',topic:'public-places',p1:[
  'What kind of area do you live in?','What do you like about the area around your home?','Has your neighbourhood changed much in recent years?',
  'Where do you go when you want some quiet time?','Do you find it easy to concentrate in a busy place?','Did you have a favourite quiet place when you were a child?',
  'How often do you visit a local park or public space?','Who do you usually spend time with near your home?','Would you like more public facilities in your area?','What place would you show a visitor to your neighbourhood?'],
  cue:'Describe a public place where you felt comfortable spending time.',points:['where the place was','when you went there','what you did there','and explain what made the place comfortable for you'],follow:'Would you like to visit that place again?',
  p3:['What makes a public place welcoming to different groups of people?','Why do some public spaces become popular while others are rarely used?','How should towns balance quiet areas with places for social activities?','Who should be responsible for maintaining shared public spaces?','Can the design of a neighbourhood affect how well its residents know one another?','How might public spaces change as more activities move online?']},
 {id:'mock-03',title:'Objects, repair and consumption',topic:'possessions',p1:[
  'Which everyday object do you use most often?','Do you usually keep old things or replace them?','Did you have a favourite possession as a child?',
  'How often do you go shopping for things other than food?','Do you prefer choosing products in a shop or online?','What do you usually consider before buying something?',
  'Have you ever tried repairing a small item?','Who do you ask when something at home stops working?','Are you careful about keeping your belongings organised?','Is there an object you would find it difficult to lend to someone?'],
  cue:'Describe an item you repaired or arranged to have repaired.',points:['what the item was','what was wrong with it','what you did to get it repaired','and explain how you felt about the result'],follow:'Do you still have that item?',
  p3:['Why do people sometimes replace items instead of repairing them?','Should manufacturers make products easier to repair?','How might advertising influence what people believe they need?','What are the benefits and limitations of buying second-hand products?','How can schools help young people make informed purchasing decisions?','Who should take responsibility for reducing waste from consumer products?']},
 {id:'mock-04',title:'Journeys and transport choices',topic:'transport',p1:[
  'How do you normally travel to the places you visit regularly?','What is your journey usually like in the morning?','Is there a form of transport you would like to use more often?',
  'Do you enjoy travelling to unfamiliar places?','What do you usually take with you on a short trip?','Do you prefer travelling with company or on your own?',
  'Does the weather affect your plans for the day?','What kind of weather do you enjoy most?','Did you travel much with your family when you were younger?','How do you find your way in a place you do not know?'],
  cue:'Describe a journey on public transport that you remember clearly.',points:['where you were going','what form of transport you used','what happened during the journey','and explain why you remember it'],follow:'Would you choose that form of transport for a similar journey?',
  p3:['Why is reliable public transport important for a community?','What difficulties do people face when changing their usual way of travelling?','Should cities prioritise cheaper fares or more frequent services?','How can transport planning meet the needs of older people and people with disabilities?','What are the advantages and disadvantages of limiting private cars in city centres?','How might technology change the way people plan and pay for journeys?']},
 {id:'mock-05',title:'Cooperation and shared activities',topic:'cooperation',p1:[
  'Who do you usually spend your free time with?','Do you find it easy to make plans with friends?','What kind of activity do you enjoy doing with other people?',
  'Do you know many people in your local community?','Have you ever taken part in a community event?','What makes a local event enjoyable for you?',
  'How often do you spend time outdoors?','Did you play team games when you were a child?','Would you rather organise an activity or join one organised by somebody else?','How do you keep in touch with people you do not see often?'],
  cue:'Describe a time you worked with other people to achieve something useful.',points:['what you were trying to do','who was involved','what your own role was','and explain what you learned from working together'],follow:'Would you like to work with those people again?',
  p3:['What makes cooperation successful in a group?','Why do some people prefer individual work to teamwork?','How should responsibilities be shared when people have different abilities?','What can schools do to help students handle disagreements constructively?','Should employers reward individual results or team achievements?','How can community projects include people who have little spare time?']},
 {id:'mock-06',title:'Planning and adapting to change',topic:'planning',p1:[
  'What is usually the busiest part of your day?','Do you like planning your day in advance?','How do you decide which task to do first?',
  'Do you use a paper diary or a digital planner?','What kind of reminders are useful to you?','Have your methods of organising your time changed?',
  'How do you feel when a plan changes unexpectedly?','Do you prefer a fixed routine or some variety?','What do you like doing when you have an unexpected free hour?','Is there something you would like to make more time for?'],
  cue:'Describe an occasion when you had to change an important plan.',points:['what your original plan was','why it had to change','what you did instead','and explain how you felt about the change'],follow:'Would you handle a similar change differently now?',
  p3:['Why do some people find unexpected changes more difficult than others?','How much planning is useful before beginning a complex task?','What can organisations do to prepare people for change?','Should young people be encouraged to take risks when making plans?','How might too much dependence on planning applications affect people?','Is flexibility likely to become more important in future workplaces?']},
];

export const ieltsMockSets=Object.freeze(ieltsPlans.map(plan=>{
  const part1=plan.p1.map((p,i)=>question('ielts',plan.id,'part1',i+1,plan.topic,p));
  const longTurn=question('ielts',plan.id,'part2',1,plan.topic,plan.cue,{taskPoints:plan.points});
  const followUp=question('ielts',plan.id,'part2',2,plan.topic,plan.follow,{taskType:'long_turn_follow_up',prepSeconds:0,responseMaxSeconds:null,timerScope:'part2_section_remaining',optional:true});
  const part3=plan.p3.map((p,i)=>question('ielts',plan.id,'part3',i+1,plan.topic,p,{relatedToQuestionId:longTurn.id}));
  return Object.freeze({id:`sp746-ielts-${plan.id}`,exam:'ielts',title:plan.title,topic:plan.topic,formatVersion:speakingFormat.ielts.id,checkedAt:SPEAKING_CHECKED_AT,originalPractice:true,modelAnswersIncluded:false,baselineRequiresUnseenSet:true,sections:[{id:'part1',timerScope:'section',durationSeconds:{min:240,max:300},selectionPolicy:'question_pool_until_section_target; pool length is not an official question count',questions:part1},{id:'part2',timerScope:'task_with_optional_follow_up',durationSeconds:{min:180,max:240},questions:[longTurn,followUp]},{id:'part3',timerScope:'section',durationSeconds:{min:240,max:300},selectionPolicy:'discussion_pool_until_section_target',questions:part3}],questions:[...part1,longTurn,followUp,...part3]});
}));

const multilevelPlans=[
 {id:'mock-01',title:'Learning and useful skills',topic:'learning',personal:['What do you enjoy doing after your usual work or study?','Who do you talk to most often during a normal day?','Which room at home do you like spending time in?'],picture:['Compare the two pictures. What are the people doing?','What are the advantages of learning with other people?','Why might someone prefer studying alone?'],context:0,long:['Tell me about something difficult you learned to do.','How did learning it change the way you approached similar tasks?','Why do people differ in how they respond to learning challenges?'],statement:'Schools should give practical skills as much time as academic subjects.',for:['Practical tasks prepare learners for everyday responsibilities.','Different learners may show strengths through hands-on work.','Practical projects can connect knowledge with real situations.'],against:['There is limited time for core academic knowledge.','Specialist equipment and teachers may be expensive.','Some practical skills can be learned outside school.']},
 {id:'mock-02',title:'Travel and helping others',topic:'transport',personal:['How do you usually begin your morning?','What kind of weather makes you feel comfortable?','Where would you take a friend visiting your area?'],picture:['Look at both pictures and compare the ways people are travelling.','What are some benefits of travelling by train?','Why do some people choose a bicycle for daily journeys?'],context:1,long:['Describe a time when you helped someone with a difficult task.','How did the experience affect your relationship with that person?','What can prevent people from offering help even when they want to?'],statement:'City centres should have more areas where private cars are not allowed.',for:['Pedestrians may have safer spaces to move around.','Less traffic can reduce noise and local pollution.','Public spaces can be used for community activities.'],against:['Some people depend on cars because of mobility needs.','Shops may face difficulties receiving deliveries.','Reliable alternative transport may not be available.']},
 {id:'mock-03',title:'Free time and personal decisions',topic:'leisure',personal:['What do you like to do with members of your family?','Is there a local place you visit regularly?','What type of music do you enjoy listening to?'],picture:['Describe and compare the activities shown in these pictures.','What can people gain from spending time outdoors with friends?','Why might people choose to visit a museum in their free time?'],context:2,long:['Tell me about a choice you made between two attractive options.','What helped you decide which option to choose?','How can advice from others affect an important personal decision?'],statement:'Public museums should be free to enter.',for:['More people may gain access to cultural learning.','Families can visit without worrying about ticket costs.','Free entry can encourage repeated local visits.'],against:['Museums still need funding for care and staffing.','Very high visitor numbers may create pressure on buildings.','Public budgets have other competing priorities.']},
 {id:'mock-04',title:'Shopping and adapting to change',topic:'shopping',personal:['What do you usually have for breakfast?','Do you prefer a busy or a quiet place to live?','Which day of the week do you usually enjoy most?'],picture:['What similarities and differences can you see between these shopping scenes?','What are some benefits of buying food at a local market?','Why do some shoppers prefer a large supermarket?'],context:3,long:['Describe a time when an unexpected change affected your plans.','How did you respond to the change?','Why is adapting to change easier in some situations than in others?'],statement:'Large shops should provide fewer single-use packages.',for:['Less packaging can reduce the amount of waste.','Customers may develop reusable shopping habits.','Businesses may design products with fewer unnecessary materials.'],against:['Some packaging protects food and other fragile goods.','Changing packaging systems may increase business costs.','Reusable options may not be convenient for every customer.']},
 {id:'mock-05',title:'Exercise and teamwork',topic:'exercise',personal:['What kind of physical activity do you enjoy?','How do you keep in contact with a friend who lives far away?','What do you like about the place where you study or work?'],picture:['Compare the two pictures of people exercising.','What are the advantages of exercising outside?','Why might a person choose to exercise in a gym?'],context:4,long:['Tell me about a time you contributed to a successful group activity.','What did the experience teach you about your own strengths?','How can a group deal with different opinions while working towards one goal?'],statement:'Employers should allow flexible starting and finishing times where the job permits it.',for:['Workers may organise family responsibilities more easily.','People can work when they feel most productive.','Commuting pressure may be spread across more hours.'],against:['Teams may find it harder to coordinate shared tasks.','Some services need staff to be available at fixed times.','Access to flexibility may differ between job roles.']},
 {id:'mock-06',title:'Communication and the use of time',topic:'communication',personal:['What do you usually do to relax at home?','Who has taught you something useful in everyday life?','Which part of your town would you like to know better?'],picture:['Compare how the people are communicating in the two pictures.','What are some benefits of talking to people face to face?','Why do people use video calls to keep in touch?'],context:5,long:['Describe a period when you had to manage several responsibilities at the same time.','Which approach helped you use your time effectively?','Why do some people find it hard to maintain a balance between responsibilities and rest?'],statement:'Schools should teach students how to judge information they find online.',for:['Students can learn to check sources before sharing claims.','Information skills can support independent study.','The lessons may help students recognise misleading content.'],against:['The timetable is already crowded with other subjects.','Teachers need current training and suitable materials.','Families and online platforms also have responsibilities.']},
];

export const multilevelMockSets=Object.freeze(multilevelPlans.map((plan,index)=>{
  const pair=speakingImagePairs[index],context=speakingContextImages[plan.context];
  const personal=plan.personal.map((p,i)=>question('multilevel',plan.id,'part1_1',i+1,plan.topic,p));
  const pictures=plan.picture.map((p,i)=>question('multilevel',plan.id,'part1_2',i+1,pair.topic,p,{imageIds:pair.images.map(a=>a.id),imagePairId:pair.id,promptFamilyId:`sp746-multilevel-${plan.id}-picture-${i+1}`}));
  const longTurn=question('multilevel',plan.id,'part2',1,context.topic,'Answer all three questions together. The picture gives the topic; you do not need to describe it.',{taskPoints:plan.long,displayQuestionsTogether:true,underlyingQuestionCount:3,imageIds:[context.id],describeImageRequired:false});
  const debate=question('multilevel',plan.id,'part3',1,plan.topic,plan.statement,{taskPoints:['Give a balanced discussion of both sides.','Select two points from the FOR list and two from the AGAINST list.'],argumentFor:plan.for,argumentAgainst:plan.against,choosePointsFromEachSide:2});
  return Object.freeze({id:`sp746-multilevel-${plan.id}`,exam:'multilevel',title:plan.title,topic:plan.topic,formatVersion:speakingFormat.multilevel.id,checkedAt:SPEAKING_CHECKED_AT,originalPractice:true,modelAnswersIncluded:false,baselineRequiresUnseenSet:true,recordedAnswerSlots:8,recordedAnswerSlotPattern:[3,3,1,1],sections:[{id:'part1_1',questions:personal},{id:'part1_2',imagePairId:pair.id,questions:pictures},{id:'part2',questions:[longTurn]},{id:'part3',questions:[debate]}],questions:[...personal,...pictures,longTurn,debate]});
}));

const ieltsPracticePersonal=[
 ['sleep','What helps you feel ready for the day when you wake up?'],['food','Is there a meal you enjoy preparing yourself?'],['reading','What do you choose to read when you have a little free time?'],['clothes','Do you prefer wearing similar clothes each day or having variety?'],['music','When do you usually listen to music?'],['technology','Which feature of your phone do you find useful in everyday life?'],['celebrations','What do you enjoy about a small family celebration?'],['nature','Is there a natural feature near your home that you like?'],
];
const ieltsPracticeLong=[
 ['communication','Describe a conversation that helped you understand something better.',['who you spoke with','what you discussed','where or when the conversation took place','and explain how it changed your understanding']],
 ['creativity','Describe something creative you made or helped to make.',['what it was','why you made it','what you did during the process','and explain how you felt about the result']],
 ['places','Describe a place you visited where you learned something about the past.',['where it was','what you saw or did','who you went with, if anyone','and explain what you learned there']],
 ['recommendations','Describe a recommendation you gave to another person.',['who you gave it to','what you recommended','why you recommended it','and explain what happened afterwards']],
 ['responsibility','Describe a responsibility that you were trusted with.',['what the responsibility was','who asked you to do it','how you handled it','and explain what the experience meant to you']],
 ['environment','Describe a small change you made to reduce waste.',['what you changed','why you decided to change it','how easy or difficult it was','and explain whether you continued doing it']],
];
const ieltsPracticeDiscussion=[
 ['communication','How can people check that they have understood another person correctly?'],['creativity','Should schools assess creative work in the same way as factual knowledge?'],['heritage','How should communities decide which historic buildings to protect?'],['recommendations','Why do people sometimes trust recommendations from strangers online?'],['responsibility','How can young people gradually become more responsible?'],['environment','What can make environmentally friendly habits difficult to maintain?'],['accessibility','How can services include people who are less confident with technology?'],['news','What responsibilities do people have when sharing news with others?'],['housing','How might smaller homes change the way people use shared spaces?'],['work','What might be lost when an organisation moves all communication online?'],
];
const transferPictureQuestions=[
 ['Compare these two ways of reading. What do you notice?','What are some advantages of reading a paper book?','Why might people choose to read on a screen?'],
 ['Compare what the people are doing in these two meal settings.','What are some benefits of preparing food at home?','Why might people choose to eat in a restaurant?'],
 ['Compare the two ways of making a short journey shown here.','What are some advantages of taking a bus for a short trip?','Why might someone prefer walking for a short journey?'],
 ['Compare the two groups working together in these pictures.','What can people gain from planning a task as a group?','Why do some people volunteer for outdoor community work?'],
 ['Compare these two places where people spend time outside.','What are some benefits of having a park near people’s homes?','Why might someone choose to visit the countryside?'],
 ['Compare these two creative activities. What are the learners doing?','What can a person gain from learning to draw?','Why might someone choose music as a hobby?'],
];
const multilevelPracticePersonal=[
 ['daily-life','What is one small thing that makes your day enjoyable?'],['home','Which household task do you find easiest to do?'],['friends','What do you and your friends like talking about?'],['interests','What new hobby would you like to try?'],['local-area','What can people do for fun near your home?'],['routines','What do you usually do before going to bed?'],
];
const multilevelPracticeLong=[
 ['confidence','Answer all three questions in one response.', ['Describe a time you spoke in front of other people.','How did that experience affect your confidence?','What can help people become more comfortable speaking to an audience?']],
 ['feedback','Answer all three questions in one response.', ['Tell me about a time useful advice helped you improve something.','How did you decide which parts of the advice to follow?','Why do people sometimes find it difficult to accept feedback?']],
 ['independence','Answer all three questions in one response.', ['Describe a time you had to solve a problem without immediate help.','What did you learn about your own abilities?','How can families support young people in becoming more independent?']],
];
const multilevelPracticeDebates=[
 ['libraries','Local libraries should offer more shared workspaces.', ['More residents could access a place to study or work.','Shared space may support local learning networks.','Existing public buildings could serve more purposes.'], ['Noise could disturb readers who need quiet.','Equipment and staffing would need extra funding.','Other library services might receive less space.']],
 ['assessment','Schools should use more group projects in assessment.', ['Learners can practise cooperation and communication.','Complex tasks can involve several different strengths.','Projects can connect classroom learning to real needs.'], ['Individual contributions may be difficult to judge fairly.','Some learners may have unequal access to time or resources.','Group disagreements can affect the result.']],
 ['tourism','Popular destinations should limit the number of visitors at busy times.', ['Limits may reduce damage to fragile places.','Residents may experience less crowding.','Visitors may have a calmer experience.'], ['Local businesses could lose some income.','Booking systems may exclude some travellers.','Crowds may simply move to nearby places.']],
];

export const practiceTransferQuestions=Object.freeze([
  ...ieltsPracticePersonal.map(([topic,p],i)=>question('ielts','transfer-01','part1',i+1,topic,p,{purpose:'practice_or_unseen_transfer',baselineEligible:false})),
  ...ieltsPracticeLong.map(([topic,p,points],i)=>question('ielts','transfer-02','part2',i+1,topic,p,{taskPoints:points,purpose:'practice_or_unseen_transfer',baselineEligible:false})),
  ...ieltsPracticeDiscussion.map(([topic,p],i)=>question('ielts','transfer-03','part3',i+1,topic,p,{purpose:'practice_or_unseen_transfer',baselineEligible:false})),
  ...transferPictureQuestions.flatMap((items,i)=>items.map((p,j)=>{const pair=speakingImagePairs[i+6];return question('multilevel',`transfer-${String(i+1).padStart(2,'0')}`,'part1_2',j+1,pair.topic,p,{imageIds:pair.images.map(a=>a.id),imagePairId:pair.id,purpose:'practice_or_unseen_transfer',baselineEligible:false});})),
  ...multilevelPracticePersonal.map(([topic,p],i)=>question('multilevel','transfer-07','part1_1',i+1,topic,p,{purpose:'practice_or_unseen_transfer',baselineEligible:false})),
  ...multilevelPracticeLong.map(([topic,p,points],i)=>question('multilevel','transfer-08','part2',i+1,topic,p,{taskPoints:points,displayQuestionsTogether:true,underlyingQuestionCount:3,describeImageRequired:false,imageIds:[speakingContextImages[i].id],purpose:'practice_or_unseen_transfer',baselineEligible:false})),
  ...multilevelPracticeDebates.map(([topic,p,forPoints,againstPoints],i)=>question('multilevel','transfer-09','part3',i+1,topic,p,{taskPoints:['Choose two points from each list and discuss both sides.'],argumentFor:forPoints,argumentAgainst:againstPoints,choosePointsFromEachSide:2,purpose:'practice_or_unseen_transfer',baselineEligible:false})),
]);

export const speakingMockSets=Object.freeze([...ieltsMockSets,...multilevelMockSets]);
export const allSpeakingQuestions=Object.freeze([...speakingMockSets.flatMap(s=>s.questions),...practiceTransferQuestions]);
export const speakingQuestionsById=Object.freeze(Object.fromEntries(allSpeakingQuestions.map(q=>[q.id,q])));
export const speakingMockSetsById=Object.freeze(Object.fromEntries(speakingMockSets.map(s=>[s.id,s])));

// Per-learner exposure is supplied by the caller, never inferred from a global bank flag.
export function eligibleTransferQuestions({exam,baselineSeenIds=[],seenPromptIds=[],seenModelAnswerIds=[],seenFamilyIds=[],seenImageIds=[]}={}){
  const ids=new Set([...baselineSeenIds,...seenPromptIds,...seenModelAnswerIds]),families=new Set(seenFamilyIds),images=new Set(seenImageIds);
  return practiceTransferQuestions.filter(q=>(!exam||q.exam===exam)&&!ids.has(q.id)&&!families.has(q.promptFamilyId)&&q.imageIds.every(id=>!images.has(id)));
}
export function eligibleBaselineSets({exam,seenPromptIds=[],seenModelAnswerIds=[],seenImageIds=[]}={}){
  const ids=new Set([...seenPromptIds,...seenModelAnswerIds]),images=new Set(seenImageIds);
  return speakingMockSets.filter(s=>(!exam||s.exam===exam)&&s.questions.every(q=>!ids.has(q.id)&&q.imageIds.every(id=>!images.has(id))));
}

export const speakingBankPolicy=Object.freeze({
  origin:'All prompts, cue cards, arguments and captions are original SinfQuiz practice material.',
  predictedLiveExamQuestions:false,modelAnswersInMockBank:false,learnerLevelPreassigned:false,
  difficultyMeaning:'Editorial task-demand label, not a validated ability estimate or IELTS-to-CEFR conversion.',
  attemptLedgerRequired:['questionId','attemptKind','isFirstAttempt','hasSeenPrompt','hasSeenModelAnswer','sourceAnswerId','formatVersion','rubricVersion'],
  typedResponseMode:'practice_only_not_audio_baseline',
  assetIntegrationRequired:'Generate all 30 planned local SVG assets; validate captions, image IDs and paths, then update asset generation status. Original illustrations are not official examination photos.',
  baselineCompletion:'Require the proper complete sequence and section timing for the selected exam; a single practice answer is not a full diagnostic.',
  transferExposure:'Exclude all prompts or model answers already seen, including baseline prompts and related images. Record exposure at first display, not only after submission.',
});
