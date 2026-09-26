import bank from '../data/question-bank.json';
import typingLessons from '../data/english-typing-lessons.json';
import longTypingLessons from '../data/typing-lessons.json';
import {nationalTestBank} from '../data/national-test-bank.js';
import {gradeAnswer} from './grading.js';
import {nationalGrade} from './national-grading.js';
import {nationalReview} from './national-review.js';
import {publicationError} from './national-validation.js';
import {cefrResult} from './cefr-grading.js';
import {adminEmail,ensureAnonymous,getSupabase,waitForAuth} from './supabase-sdk.js';

const avatars=['🧑‍💻','👩‍🚀','🤖','🥷','🧙','🦸','👾','🦊','🐼','🦁','🐯','🐸'];
const runtime={ticket:null,game:null,race:null,typing:null,national:null,cefr:null};
const key=name=>`sinfquiz_supabase_${name}`;
const randomId=()=>globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
const load=name=>{try{return JSON.parse(sessionStorage.getItem(key(name))||'null')}catch{return null}};
const save=(name,value)=>{runtime[name]=value;if(value)sessionStorage.setItem(key(name),JSON.stringify(value));else sessionStorage.removeItem(key(name))};
for(const name of ['game','race','typing','national','cefr'])runtime[name]=typeof sessionStorage==='undefined'?null:load(name);

const fail=message=>{throw Error(message)};
const clean=value=>JSON.parse(JSON.stringify(value));
const publicPlayer=player=>{const {responses,...safe}=player;return safe};
const safeQuestion=question=>{if(!question)return null;const {correct,answer,acceptedAnswers,criteria,...safe}=question;return safe};
const quizInfo=quiz=>({id:quiz.id,title:quiz.title,group:quiz.group,subject:quiz.subject,questionCount:quiz.questions.length,visibility:quiz.visibility||'private',ownerName:quiz.ownerName||'O‘qituvchi'});
const rankRows=players=>players.sort((a,b)=>b.score-a.score||(a.finishedAt||Infinity)-(b.finishedAt||Infinity)||a.startedAt-b.startedAt);
const docData=snapshot=>snapshot.exists()?{id:snapshot.id,...snapshot.data()}:null;
const queryData=snapshot=>snapshot.docs.map(item=>({id:item.id,...item.data()}));
const nationalInfo=section=>({id:section.id,title:section.title,subject:section.subject,description:section.description||'',questionCount:section.questions?.length||section.questionCount||30,durationMinutes:section.durationMinutes||60,scoringModel:section.scoringModel||'general-certificate',builtin:!!section.builtin,visibility:section.visibility||'private',approvalStatus:section.approvalStatus||'draft',ownerId:section.ownerId||null,ownerName:section.ownerName||'O‘qituvchi',reviewNote:section.reviewNote||'',createdAt:section.createdAt||null,updatedAt:section.updatedAt||null});
const nationalState=current=>{const total=current.section.questions.length,expired=Date.now()>=current.endsAt;if(expired&&!current.finished){current.finished=true;current.finishedAt=Date.now();current.finishReason='time'}const question=current.finished?null:safeQuestion(current.section.questions[current.index]);return {section:nationalInfo(current.section),question,index:current.index,answers:current.answers.map(value=>value===null?null:true),selected:current.answers[current.index],startedAt:current.startedAt,endsAt:current.endsAt,serverNow:Date.now(),finished:!!current.finished,finishReason:current.finishReason||null,review:nationalReview(current),result:current.finished?nationalGrade(current.section,current.section.questions.reduce((sum,item,index)=>sum+Number(current.answers[index]===item.correct),0),total):null}};
const cefrInfo=mock=>({id:mock.id,number:mock.number,title:mock.title,theme:mock.theme,description:mock.description,durationMinutes:mock.durationMinutes,listeningCount:mock.listening.length,readingCount:mock.reading.length,writingCount:mock.writing.length,speakingParts:mock.speaking.length});
const cefrState=current=>{
 const expired=Date.now()>=current.endsAt;if(expired&&!current.finished){current.finished=true;current.finishedAt=Date.now();current.finishReason='time'}
 const skill=current.skill,index=current.indexes[skill]||0,questions=current.mock[skill]||[],question=['listening','reading'].includes(skill)&&!current.finished?safeQuestion(questions[index]):null;
 const listeningCorrect=current.mock.listening.reduce((sum,item,i)=>sum+Number(current.answers.listening[i]===item.correct),0),readingCorrect=current.mock.reading.reduce((sum,item,i)=>sum+Number(current.answers.reading[i]===item.correct),0);
 return {mock:cefrInfo(current.mock),skill,index,question,answers:{listening:current.answers.listening.map(value=>value===null?null:true),reading:current.answers.reading.map(value=>value===null?null:true)},selected:current.answers[skill]?.[index]??null,plays:current.plays,writingTasks:current.mock.writing,writingResponses:current.writingResponses,speaking:current.mock.speaking,speakingNotes:current.speakingNotes,writingScore:current.writingScore,speakingScore:current.speakingScore,startedAt:current.startedAt,endsAt:current.endsAt,serverNow:Date.now(),finished:!!current.finished,finishReason:current.finishReason||null,result:current.finished?cefrResult({listeningCorrect,readingCorrect,writingScore:current.writingScore,speakingScore:current.speakingScore}):null};
};

async function userProfile(sdk,user=sdk.auth.currentUser){
 if(!user||user.isAnonymous)return null;
 if(user.email&&user.email.toLowerCase()===adminEmail().toLowerCase())return {id:user.uid,uid:user.uid,role:'admin',name:user.displayName||'Administrator',email:user.email,username:'admin'};
 const snap=await sdk.getDoc(sdk.doc(sdk.db,'profiles',user.uid));
 if(snap.exists())return {id:user.uid,...snap.data()};
 return null;
}
async function isTeacher(sdk,user=sdk.auth.currentUser){return ['teacher','admin'].includes((await userProfile(sdk,user))?.role)}

async function seedQuizzes(sdk){
 const current=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'quizzes'),sdk.where('ownerId','==',sdk.auth.currentUser.uid)));if(!current.empty)return;
 const profile=await userProfile(sdk),ownerName=profile?.name||'O‘qituvchi';
 const batch=sdk.writeBatch(sdk.db),used=new Set();
 for(const source of bank){let pin=String(Math.floor(100000+Math.random()*900000));while(used.has(pin)){pin=String(Math.floor(100000+Math.random()*900000))}used.add(pin);const id=randomId();batch.set(sdk.doc(sdk.db,'quizzes',id),{...clean(source),id,pin,status:'passive',visibility:'private',ownerId:sdk.auth.currentUser.uid,ownerName,createdAt:Date.now(),version:1})}
 await batch.commit();
}

async function adminState(sdk){
 await seedQuizzes(sdk);
 const uid=sdk.auth.currentUser.uid,profile=await userProfile(sdk),isAdmin=profile?.role==='admin';
 const [quizSnap,playerSnap,raceSnap,settingsSnap,resultSnap,lessonSnap,publicQuizSnap,nationalSnap]=await Promise.all([
  sdk.getDocs(sdk.query(sdk.collection(sdk.db,'quizzes'),sdk.where('ownerId','==',uid))),
  sdk.getDocs(sdk.query(sdk.collection(sdk.db,'players'),sdk.where('ownerId','==',uid))),
  sdk.getDoc(sdk.doc(sdk.db,'live','race')),
  sdk.getDoc(sdk.doc(sdk.db,'settings','app')),
  sdk.getDocs(sdk.query(sdk.collection(sdk.db,'typingResults'),sdk.where('ownerId','==',uid))),
  sdk.getDocs(sdk.query(sdk.collection(sdk.db,'lessons'),sdk.where('ownerId','==',uid))),
  sdk.getDocs(sdk.query(sdk.collection(sdk.db,'quizzes'),sdk.where('visibility','==','public'))),
  isAdmin?sdk.getDocs(sdk.collection(sdk.db,'nationalSections')):sdk.getDocs(sdk.query(sdk.collection(sdk.db,'nationalSections'),sdk.where('ownerId','==',uid))),
 ]);
 const settings=settingsSnap.data()||{},race=raceSnap.exists()?raceSnap.data():null;
 let analytics=null;
 if(isAdmin){const [profilesSnap,activitySnap]=await Promise.all([sdk.getDocs(sdk.collection(sdk.db,'profiles')),sdk.getDocs(sdk.collection(sdk.db,'userActivity'))]),profiles=queryData(profilesSnap),activity=queryData(activitySnap),activityMap=new Map(activity.map(item=>[item.uid,item])),now=Date.now(),users=profiles.map(item=>({...item,activity:activityMap.get(item.uid)||null})).sort((a,b)=>(b.activity?.lastSeenAt||0)-(a.activity?.lastSeenAt||0));analytics={users,totalUsers:users.length,activeUsers:users.filter(item=>now-(item.activity?.lastSeenAt||0)<5*60*1000).length,totalLogins:activity.reduce((sum,item)=>sum+(item.loginCount||0),0),totalLogouts:activity.reduce((sum,item)=>sum+(item.logoutCount||0),0),teachers:users.filter(item=>item.role==='teacher').length,students:users.filter(item=>item.role==='student').length,generatedAt:now}}
 return {quizzes:queryData(quizSnap),publicQuizzes:queryData(publicQuizSnap),lessons:queryData(lessonSnap).sort((a,b)=>b.updatedAt-a.updatedAt),nationalSections:queryData(nationalSnap).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)),players:queryData(playerSnap),race:raceSummary(race),typing:{active:!!settings.typingActive,activatedAt:settings.typingActivatedAt||null,studentCount:0,stageCount:5,results:queryData(resultSnap).sort((a,b)=>b.completedAt-a.completedAt).slice(0,50)},analytics};
}

async function ranking(sdk,quizId){
 const snap=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'players'),sdk.where('quizId','==',quizId)));
 return rankRows(queryData(snap).map(publicPlayer));
}

function playState(current,player,rows){
 return {quiz:quizInfo(current.quiz),player:publicPlayer(player),question:current.finished?null:safeQuestion(current.quiz.questions[current.index]),index:current.index,deadline:current.deadline,serverNow:Date.now(),csrf:'supabase',feedback:current.feedback||null,finished:!!current.finished,ranking:rows};
}

const raceSummary=race=>race?{id:race.id,active:!!race.active,phase:race.phase,title:race.title,sourceQuizId:race.sourceQuizId||null,questionCount:race.questionCount||race.questionsByLane?.[0]?.length||race.questions?.length||0,startsAt:race.startsAt||null,startedAt:race.startedAt||null,winnerId:race.winnerId||null,createdAt:race.createdAt,racers:(race.racers||[]).map(({answer,...player})=>player)}:null;
const raceQuestion=(race,player)=>race.questionsByLane?.[player.lane]?.[player.index]||race.questions?.[player.index]||null;
async function advanceRace(sdk){
 const ref=sdk.doc(sdk.db,'live','race');
 await sdk.runTransaction(sdk.db,async transaction=>{const snap=await transaction.get(ref);if(!snap.exists())return;const race=snap.data();if(race.active&&race.phase==='countdown'&&Date.now()>=race.startsAt)transaction.update(ref,{phase:'running',startedAt:race.startsAt})});
}
function raceState(race,current){
 if(!race?.active||race.id!==current.raceId)fail('Poyga yopilgan.');
 if(current.localMode){const players=(current.playerIds||[]).map(id=>race.racers.find(item=>item.id===id));if(players.some(player=>!player))fail('Poygachilar topilmadi.');return {race:raceSummary(race),localMode:true,playerIds:current.playerIds,questions:players.map(player=>race.phase==='running'&&!race.winnerId?safeQuestion(raceQuestion(race,player)):null),feedbackByPlayer:current.feedbackByPlayer||{},csrf:'firebase',serverNow:Date.now()}}
 const player=race.racers.find(item=>item.id===current.playerId);if(!player)fail('Poygachi topilmadi.');return {race:raceSummary(race),playerId:player.id,question:race.phase==='running'&&!race.winnerId?safeQuestion(raceQuestion(race,player)):null,index:player.index,feedback:current.feedback||null,csrf:'firebase',serverNow:Date.now()};
}

const editDistance=(left,right)=>{const a=[...left],b=[...right],row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let diagonal=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const above=row[j],cost=a[i-1]===b[j-1]?0:1;row[j]=Math.min(row[j]+1,row[j-1]+1,diagonal+cost);diagonal=above}}return row[b.length]};
const typingMetrics=(target,value,elapsedMs)=>{const expected=target.normalize('NFC'),typed=value.normalize('NFC'),distance=editDistance(expected,typed),length=Math.max(1,expected.length,typed.length),accuracy=Math.max(0,Math.round((1-distance/length)*1000)/10),correctChars=Math.max(0,expected.length-distance),seconds=Math.max(1,elapsedMs/1000),wpm=Math.max(0,Math.round((correctChars/5)/(seconds/60)));return {accuracy,wpm,seconds:Math.round(seconds*10)/10,errors:distance,typedChars:typed.length,expectedChars:expected.length,passed:accuracy>=90&&typed.length>=expected.length*.9}};
const englishLevels=['A1','A2','B1','B2','C1','C2'];
const typingCourse=(level,mode)=>mode==='longtext'?longTypingLessons:typingLessons.filter(stage=>stage.englishLevel===(englishLevels.includes(level)?level:'A1'));
const typingStage=(index,level,mode)=>{const stage=typingCourse(level,mode)[index];return stage?{...stage,courseMode:mode||'english',wordCount:stage.text.trim().split(/\s+/u).length}:null};
const typingState=current=>{const course=typingCourse(current.englishLevel,current.courseMode);return {active:true,playerId:current.playerId,name:current.name,avatar:current.avatar,courseMode:current.courseMode||'english',englishLevel:current.englishLevel||'A1',entryMode:current.entryMode||'selected',placementScore:current.placementScore??null,index:current.index,stage:typingStage(current.index,current.englishLevel,current.courseMode),stageCount:course.length,stageStartedAt:current.stageStartedAt||null,results:current.results,feedback:current.feedback||null,finished:current.index>=course.length,csrf:'firebase',serverNow:Date.now()}};

export async function supabaseApi(path,{method='GET',data={}}={}){
 try{
  if(path==='/auth/session'){
  const sdk=await waitForAuth(),user=sdk.auth.currentUser,profile=await userProfile(sdk,user);return {user:profile?{id:user.uid,...profile}:null,csrf:profile?'supabase':null};
  }
  if(path==='/auth/login'){
   const sdk=await getSupabase();if(data.username!=='admin'&&data.username!==adminEmail())fail('Login yoki parol noto‘g‘ri.');if(sdk.auth.currentUser)await sdk.signOut(sdk.auth);const credential=await sdk.signInWithEmailAndPassword(sdk.auth,adminEmail(),data.password),profileRef=sdk.doc(sdk.db,'profiles',credential.user.uid);await sdk.setDoc(profileRef,{uid:credential.user.uid,role:'admin',name:'Administrator',email:adminEmail(),username:'admin',updatedAt:Date.now(),createdAt:Date.now()},{merge:true});return {user:{id:credential.user.uid,uid:credential.user.uid,role:'admin',name:'Administrator',username:'admin'},csrf:'firebase'};
  }
  if(path==='/auth/logout'){const sdk=await getSupabase();await sdk.signOut(sdk.auth);for(const name of ['game','race','typing','national','cefr'])save(name,null);sessionStorage.removeItem('sq_active_hash');return {ok:true}}

  if((path==='/api/quizzes'&&method==='GET')||path==='/api/state'){
   const sdk=await waitForAuth();if(!await isTeacher(sdk))fail('O‘qituvchi sifatida kirish kerak.');return adminState(sdk);
  }
  const quizMatch=path.match(/^\/api\/quizzes\/([^/]+)$/);
  if((path==='/api/quizzes'&&method==='POST')||quizMatch){
   const sdk=await waitForAuth();if(!await isTeacher(sdk))fail('O‘qituvchi ruxsati kerak.');
   const uid=sdk.auth.currentUser.uid,existing=quizMatch?docData(await sdk.getDoc(sdk.doc(sdk.db,'quizzes',quizMatch[1]))):null;if(existing&&existing.ownerId!==uid)fail('Faqat o‘zingiz yaratgan testni o‘zgartira olasiz.');
   if(method==='DELETE'){const id=quizMatch[1],batch=sdk.writeBatch(sdk.db),players=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'players'),sdk.where('quizId','==',id)));players.forEach(item=>batch.delete(item.ref));batch.delete(sdk.doc(sdk.db,'quizzes',id));await batch.commit();return {ok:true}}
   const quizzes=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'quizzes'),sdk.where('pin','==',data.pin)));if(quizzes.docs.some(item=>item.id!==quizMatch?.[1]))fail('Bu kod band. Boshqa 6 xonali kod tanlang.');
   const profile=await userProfile(sdk),id=quizMatch?.[1]||randomId(),quiz={...clean(data),id,visibility:data.visibility==='public'?'public':'private',ownerId:uid,ownerName:profile?.name||'O‘qituvchi',createdAt:data.createdAt||Date.now(),updatedAt:Date.now(),version:(data.version||0)+1};await sdk.setDoc(sdk.doc(sdk.db,'quizzes',id),quiz);return {quiz};
  }
  if(path==='/api/results/reset'){const sdk=await waitForAuth();if(!await isTeacher(sdk))fail('O‘qituvchi ruxsati kerak.');const snap=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'players'),sdk.where('ownerId','==',sdk.auth.currentUser.uid))),batch=sdk.writeBatch(sdk.db);snap.forEach(item=>batch.delete(item.ref));await batch.commit();return {ok:true}}

  if(path==='/api/catalog'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(!profile)fail('Telegram orqali kirish kerak.');
   const [quizSnap,lessonSnap]=await Promise.all([sdk.getDocs(sdk.query(sdk.collection(sdk.db,'quizzes'),sdk.where('visibility','==','public'))),sdk.getDocs(sdk.query(sdk.collection(sdk.db,'lessons'),sdk.where('visibility','==','public')))]);
   return {quizzes:queryData(quizSnap).filter(item=>item.status==='active').map(quizInfo),lessons:queryData(lessonSnap).sort((a,b)=>b.updatedAt-a.updatedAt)};
  }
  const lessonMatch=path.match(/^\/api\/lessons\/([^/]+)$/);
  if(path==='/api/lessons'&&method==='GET'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(!profile)fail('Telegram orqali kirish kerak.');const snap=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'lessons'),sdk.where(profile.role==='teacher'?'ownerId':'visibility','==',profile.role==='teacher'?sdk.auth.currentUser.uid:'public')));return {lessons:queryData(snap).sort((a,b)=>b.updatedAt-a.updatedAt)};
  }
  if((path==='/api/lessons'&&method==='POST')||lessonMatch){
   const sdk=await waitForAuth();if(!await isTeacher(sdk))fail('Darslik yaratish uchun o‘qituvchi bo‘lib kiring.');const uid=sdk.auth.currentUser.uid,existing=lessonMatch?docData(await sdk.getDoc(sdk.doc(sdk.db,'lessons',lessonMatch[1]))):null;if(existing&&existing.ownerId!==uid)fail('Faqat o‘zingiz yaratgan darslikni o‘zgartira olasiz.');if(method==='DELETE'){await sdk.deleteDoc(sdk.doc(sdk.db,'lessons',lessonMatch[1]));return {ok:true}}if(!data.title?.trim()||!data.content?.trim())fail('Darslik sarlavhasi va matnini kiriting.');const profile=await userProfile(sdk),id=lessonMatch?.[1]||randomId(),lesson={id,title:data.title.trim(),subject:(data.subject||'Informatika').trim(),summary:(data.summary||'').trim(),content:data.content.trim(),cover:data.cover||'📘',visibility:data.visibility==='private'?'private':'public',ownerId:uid,ownerName:profile?.name||'O‘qituvchi',createdAt:existing?.createdAt||Date.now(),updatedAt:Date.now()};await sdk.setDoc(sdk.doc(sdk.db,'lessons',id),lesson);return {lesson};
  }

  if(path==='/api/national'&&method==='GET'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(!profile)fail('Milliy test mashqlariga kirish uchun hisobingizga kiring.');
   const snap=await sdk.getDocs(sdk.collection(sdk.db,'nationalSections')),custom=queryData(snap).filter(item=>profile.role==='admin'||item.ownerId===sdk.auth.currentUser.uid||(item.visibility==='public'&&item.approvalStatus==='approved'));
   return {sections:custom.filter(item=>!publicationError(item)).map(nationalInfo),canCreate:['teacher','admin'].includes(profile.role),canReview:profile.role==='admin'};
  }
  const nationalSectionMatch=path.match(/^\/api\/national\/sections\/([^/]+)$/),nationalReviewMatch=path.match(/^\/api\/national\/sections\/([^/]+)\/review$/);
  if((path==='/api/national/sections'&&method==='POST')||nationalSectionMatch||nationalReviewMatch){
   const sdk=await waitForAuth(),profile=await userProfile(sdk),uid=sdk.auth.currentUser?.uid;if(!['teacher','admin'].includes(profile?.role))fail('Bo‘lim yaratish uchun o‘qituvchi yoki administrator bo‘lib kiring.');
   const sectionId=nationalReviewMatch?.[1]||nationalSectionMatch?.[1],ref=sectionId?sdk.doc(sdk.db,'nationalSections',sectionId):null,existing=ref?docData(await sdk.getDoc(ref)):null;
   if(nationalReviewMatch){if(profile.role!=='admin')fail('Ommaga chiqarishga faqat administrator ruxsat beradi.');if(!existing)fail('Bo‘lim topilmadi.');const approved=data.decision==='approved';if(approved){const issue=publicationError(existing);if(issue)fail(issue)}await sdk.updateDoc(ref,{approvalStatus:approved?'approved':'rejected',visibility:approved?'public':'private',reviewNote:String(data.note||'').slice(0,300),reviewedBy:uid,reviewedAt:Date.now(),updatedAt:Date.now()});return {section:nationalInfo(docData(await sdk.getDoc(ref)))} }
   if(existing&&existing.ownerId!==uid&&profile.role!=='admin')fail('Faqat o‘zingiz yaratgan bo‘limni o‘zgartira olasiz.');
   if(method==='DELETE'){if(!existing)fail('Bo‘lim topilmadi.');await sdk.deleteDoc(ref);return {ok:true}}
   const questions=Array.isArray(data.questions)?data.questions:[];if(!data.title?.trim())fail('Bo‘lim nomini kiriting.');if(!['Matematika','Ingliz tili'].includes(data.subject))fail('Hozircha Matematika yoki Ingliz tili fanini tanlang.');if(questions.length!==30)fail('Milliy test bo‘limida aynan 30 ta savol bo‘lishi kerak.');if(questions.some(item=>!item.text?.trim()||!Array.isArray(item.options)||item.options.length!==4||item.options.some(option=>!String(option).trim())||!Number.isInteger(Number(item.correct))||Number(item.correct)<0||Number(item.correct)>3))fail('Har bir savolda matn, 4 ta variant va bitta to‘g‘ri javob bo‘lsin.');
   if(data.requestPublic){const issue=publicationError(data);if(issue)fail(issue)}
   const wantsPublic=data.requestPublic===true,approvalStatus=profile.role==='admin'&&wantsPublic?'approved':wantsPublic?'pending':'draft',id=existing?.id||randomId(),section={id,title:data.title.trim(),subject:data.subject,description:String(data.description||'').trim().slice(0,500),durationMinutes:Math.max(30,Math.min(180,Number(data.durationMinutes)||60)),scoringModel:'general-certificate',questions:questions.map((item,index)=>({id:item.id||`${id}-q-${index+1}`,type:'test',text:item.text.trim(),topic:String(item.topic||'').trim().slice(0,120),sourceUrl:String(item.sourceUrl||'').trim().slice(0,1000),sourceReference:String(item.sourceReference||'').trim().slice(0,200),options:item.options.map(option=>String(option).trim()),correct:Number(item.correct),answer:String(item.options[Number(item.correct)]).trim(),explanation:String(item.explanation||'').trim().slice(0,600),subject:data.subject,points:1,time:120})),questionCount:30,builtin:false,visibility:approvalStatus==='approved'?'public':'private',approvalStatus,ownerId:existing?.ownerId||uid,ownerName:existing?.ownerName||profile.name||'O‘qituvchi',createdAt:existing?.createdAt||Date.now(),updatedAt:Date.now()};await sdk.setDoc(sdk.doc(sdk.db,'nationalSections',id),section);return {section:nationalInfo(section)};
  }
  if(path==='/api/national/start'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(!profile)fail('Testni boshlash uchun hisobingizga kiring.');let section=nationalTestBank.find(item=>item.id===data.sectionId);if(!section)section=docData(await sdk.getDoc(sdk.doc(sdk.db,'nationalSections',String(data.sectionId||''))));if(!section||section.builtin)fail('Bu demo variant arxivlangan. Ustozning manbali variantini tanlang.');if(!section.builtin&&section.approvalStatus!=='approved'&&section.ownerId!==sdk.auth.currentUser.uid&&profile.role!=='admin')fail('Bu bo‘lim hali ommaga tasdiqlanmagan.');const startedAt=Date.now(),current={attemptId:randomId(),uid:sdk.auth.currentUser.uid,section:clean(section),index:0,answers:Array(section.questions.length).fill(null),startedAt,endsAt:startedAt+(section.durationMinutes||60)*60*1000,finished:false};save('national',current);return nationalState(current);
  }
  if(path.startsWith('/api/national/')){
   const sdk=await waitForAuth(),current=runtime.national||load('national');if(!current||current.uid!==sdk.auth.currentUser?.uid)fail('Milliy test sessiyasi topilmadi. Qayta boshlang.');
   nationalState(current);
   if(path==='/api/national/leave'){if(!current.finished)fail('Avval testni tugating.');save('national',null);return {ok:true}}
   if(path==='/api/national/finish'&&!current.finished){current.finished=true;current.finishedAt=Date.now();current.finishReason='submitted'}
   if(current.finished){
    save('national',current);
    if(!current.resultSaved){
     current.attemptId=current.attemptId||randomId();save('national',current);
     try{
      const ref=sdk.doc(sdk.db,'nationalResults',current.attemptId),previous=await sdk.getDoc(ref),state=nationalState(current);
      if(!previous.exists())await sdk.setDoc(ref,{uid:current.uid,sectionId:current.section.id,sectionTitle:current.section.title,subject:current.section.subject,ownerId:current.section.ownerId||'',...state.result,review:state.review,startedAt:current.startedAt,finishedAt:current.finishedAt,finishReason:current.finishReason});
      current.resultSaved=true;current.storageError=null;
     }catch{current.storageError='Natija hozircha shu brauzerda saqlandi. Serverga yuborish uchun qayta urinib ko‘ring.'}
     save('national',current);
    }
    return {...nationalState(current),storageError:current.storageError||null};
   }
   if(path==='/api/national/session'){save('national',current);return nationalState(current)}
   if(path==='/api/national/answer'){const value=Number(data.value);if(!Number.isInteger(value)||value<0||value>3)fail('Javob variantini tanlang.');current.answers[current.index]=value;save('national',current);return nationalState(current)}
   if(path==='/api/national/navigate'){const index=Number(data.index);if(!Number.isInteger(index)||index<0||index>=current.section.questions.length)fail('Savol raqami noto‘g‘ri.');current.index=index;save('national',current);return nationalState(current)}
  }

  if(path==='/api/cefr'&&method==='GET'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(!profile)fail('CEFR mock testlariga kirish uchun hisobingizga kiring.');return {mocks:[],notice:'Eski demo savollar arxivlangan; rasmiy manbalar bilan ishlang.'};
  }
  if(path==='/api/cefr/start')fail('Eski shablon mocklar yopilgan. CEFR manbalar bo‘limidan foydalaning.');
  if(path.startsWith('/api/cefr/')){
   const sdk=await waitForAuth(),current=runtime.cefr||load('cefr');if(!current||current.uid!==sdk.auth.currentUser?.uid)fail('CEFR mock sessiyasi topilmadi. Qayta boshlang.');
   if(path==='/api/cefr/session'){const state=cefrState(current);save('cefr',current);return state}
   if(path==='/api/cefr/leave'){save('cefr',null);return {ok:true}}
   fail('Eski CEFR sessiyasini faqat yopish mumkin. Manbali mashq bo‘limidan foydalaning.');
  }

  if(path==='/api/resolve'){
   const sdk=await ensureAnonymous();if(!/^\d{6}$/.test(data.pin||''))fail('6 xonali kodni kiriting.');const snap=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'quizzes'),sdk.where('pin','==',data.pin),sdk.where('status','==','active'))),quiz=queryData(snap)[0];if(!quiz)fail('Kod topilmadi yoki test hali ochilmagan.');runtime.ticket=quiz;return {quiz:quizInfo(quiz),ticket:quiz.id};
  }
  if(path==='/api/play/join'){
   const sdk=await ensureAnonymous(),quiz=runtime.ticket?.id===data.ticket?runtime.ticket:docData(await sdk.getDoc(sdk.doc(sdk.db,'quizzes',data.ticket)));if(!quiz||quiz.status!=='active')fail('Test o‘zgardi yoki yopildi. Kodni qayta kiriting.');if(!data.name?.trim()||!avatars.includes(data.avatar))fail('Ism va avatarni kiriting.');const id=randomId(),now=Date.now(),player={id,uid:sdk.auth.currentUser.uid,ownerId:quiz.ownerId,quizId:quiz.id,name:data.name.trim(),avatar:data.avatar,score:0,correct:0,answers:0,startedAt:now,responses:[]};await sdk.setDoc(sdk.doc(sdk.db,'players',id),player);const current={playerId:id,quiz:clean(quiz),index:0,deadline:now+quiz.questions[0].time*1000,feedback:null,finished:false};save('game',current);return playState(current,player,await ranking(sdk,quiz.id));
  }
  if(path.startsWith('/api/play/')){
   const sdk=await ensureAnonymous(),current=runtime.game||load('game');if(!current)fail('O‘yin sessiyasi tugagan. Kod bilan qayta kiring.');const playerRef=sdk.doc(sdk.db,'players',current.playerId),player=docData(await sdk.getDoc(playerRef));if(!player||player.uid!==sdk.auth.currentUser.uid)fail('O‘yin sessiyasi topilmadi.');
   if(path==='/api/play/session')return playState(current,player,await ranking(sdk,current.quiz.id));
   if(path==='/api/play/leave'){save('game',null);return {ok:true}}
   const liveQuiz=docData(await sdk.getDoc(sdk.doc(sdk.db,'quizzes',current.quiz.id)));if(!liveQuiz||liveQuiz.status!=='active')fail('O‘qituvchi testni to‘xtatgan.');const question=current.quiz.questions[current.index];
   if(path==='/api/play/answer'){if(current.feedback)return playState(current,player,await ranking(sdk,current.quiz.id));const seconds=Math.max(0,(current.deadline-Date.now())/1000),result=seconds<=0?{ratio:0,earned:0,correct:false,checks:[],expired:true}:gradeAnswer(question,data.value,seconds);const nextPlayer={...player,score:player.score+result.earned,answers:player.answers+1,correct:player.correct+Number(result.correct),lastEarned:result.earned,responses:[...(player.responses||[]),{questionId:question.id,type:question.type,text:question.text,value:data.value,earned:result.earned,checks:result.checks||[]}]};current.feedback={...result,answer:question.answer||null,correctIndex:question.type==='test'?question.correct:null,explanation:question.explanation};save('game',current);await sdk.setDoc(playerRef,nextPlayer);return playState(current,nextPlayer,await ranking(sdk,current.quiz.id))}
   if(path==='/api/play/next'){if(!current.feedback)fail('Avval joriy savolga javob bering.');if(current.index===current.quiz.questions.length-1){current.finished=true;player.finishedAt=Date.now();await sdk.updateDoc(playerRef,{finishedAt:player.finishedAt})}else{current.index++;current.deadline=Date.now()+current.quiz.questions[current.index].time*1000;current.feedback=null}save('game',current);return playState(current,docData(await sdk.getDoc(playerRef)),await ranking(sdk,current.quiz.id))}
  }

  if(path==='/api/race/active'){const sdk=await ensureAnonymous(),race=docData(await sdk.getDoc(sdk.doc(sdk.db,'live','race')));return race?.active?{...raceSummary(race),playerCount:race.racers.length}:{active:false}}
  if(path==='/api/race/activate'){const sdk=await waitForAuth();if(!await isTeacher(sdk))fail('O‘qituvchi ruxsati kerak.');const quiz=docData(await sdk.getDoc(sdk.doc(sdk.db,'quizzes',String(data.quizId||''))));if(!quiz||quiz.ownerId!==sdk.auth.currentUser.uid)fail('Poyga uchun o‘zingiz yaratgan testni tanlang.');const requested=Array.isArray(data.questionIds)?data.questionIds.slice(0,12):[],byId=new Map((quiz.questions||[]).filter(question=>question.type==='test'&&question.options?.length===4).map(question=>[question.id,question])),selected=requested.map(id=>byId.get(id)).filter(Boolean);if(selected.length<2)fail('Poyga uchun kamida 2 ta variantli savol tanlang.');const id=randomId(),lane0=selected.map((question,index)=>({...clean(question),id:`${id}-a-${index+1}`})),lane1=[...selected.slice(1),selected[0]].map((question,index)=>({...clean(question),id:`${id}-b-${index+1}`})),race={id,title:`${quiz.title} · 1v1`,active:true,phase:'lobby',ownerId:sdk.auth.currentUser.uid,sourceQuizId:quiz.id,sourcePin:quiz.pin,questionCount:selected.length,questionsByLane:[lane0,lane1],racers:[],winnerId:null,createdAt:Date.now(),startsAt:null,startedAt:null};await sdk.setDoc(sdk.doc(sdk.db,'live','race'),race);return {race:raceSummary(race)}}
  if(path==='/api/race/stop'){const sdk=await waitForAuth();if(!await isTeacher(sdk))fail('O‘qituvchi ruxsati kerak.');await sdk.setDoc(sdk.doc(sdk.db,'live','race'),{active:false,phase:'closed',closedAt:Date.now()},{merge:true});return {ok:true}}
  if(path==='/api/race/join'){const sdk=await ensureAnonymous(),ref=sdk.doc(sdk.db,'live','race');if(Array.isArray(data.players)){if(data.players.length!==2)fail('Poyga uchun aynan ikki o‘quvchi kerak.');const players=data.players.map((item,index)=>({id:randomId(),uid:sdk.auth.currentUser.uid,name:item.name?.trim(),avatar:item.avatar,ready:true,index:0,correct:0,attempts:0,lane:index,joinedAt:Date.now()}));if(players.some(player=>!player.name||!avatars.includes(player.avatar)))fail('Ikkala o‘quvchi uchun ism va avatar kiriting.');await sdk.runTransaction(sdk.db,async transaction=>{const snap=await transaction.get(ref),race=snap.data();if(!race?.active||race.phase!=='lobby')fail('Poygaga hozir kirib bo‘lmaydi. Admin poygani qayta ACTIVE qilsin.');if(race.racers.length)fail('Bu poygada oldingi ishtirokchilar bor. Admin poygani qayta yoqsin.');transaction.update(ref,{racers:players,phase:'countdown',startsAt:Date.now()+3000,startedAt:null})});const live=(await sdk.getDoc(ref)).data(),current={raceId:live.id,localMode:true,playerIds:players.map(player=>player.id),feedbackByPlayer:{}};save('race',current);return raceState(live,current)}const player={id:randomId(),uid:sdk.auth.currentUser.uid,name:data.name?.trim(),avatar:data.avatar,ready:false,index:0,correct:0,attempts:0,joinedAt:Date.now()};if(!player.name||!avatars.includes(player.avatar))fail('Ism va avatarni kiriting.');await sdk.runTransaction(sdk.db,async transaction=>{const snap=await transaction.get(ref),race=snap.data();if(!race?.active||race.phase!=='lobby')fail('Poygaga hozir qo‘shilib bo‘lmaydi.');if(race.racers.length>=2)fail('Poygada ikki o‘rin ham band.');transaction.update(ref,{racers:[...race.racers,player]})});const current={raceId:(await sdk.getDoc(ref)).data().id,playerId:player.id,feedback:null};save('race',current);return raceState((await sdk.getDoc(ref)).data(),current)}
  if(path.startsWith('/api/race/')){
   const sdk=await ensureAnonymous(),current=runtime.race||load('race'),ref=sdk.doc(sdk.db,'live','race');if(!current)fail('Poyga sessiyasi tugagan. Qayta qo‘shiling.');await advanceRace(sdk);
   if(path==='/api/race/session')return raceState((await sdk.getDoc(ref)).data(),current);
   if(path==='/api/race/ready'){await sdk.runTransaction(sdk.db,async transaction=>{const snap=await transaction.get(ref),race=snap.data(),racers=race.racers.map(player=>player.id===current.playerId?{...player,ready:true}:player),ready=racers.length===2&&racers.every(player=>player.ready);transaction.update(ref,{racers,...(ready?{phase:'countdown',startsAt:Date.now()+3000}:{})})});return raceState((await sdk.getDoc(ref)).data(),current)}
   if(path==='/api/race/answer'){const answerPlayerId=current.localMode?data.playerId:current.playerId;if(current.localMode&&!current.playerIds.includes(answerPlayerId))fail('Poygachi noto‘g‘ri.');await sdk.runTransaction(sdk.db,async transaction=>{const snap=await transaction.get(ref),race=snap.data();if(!race.active||!['running','countdown'].includes(race.phase)||(race.phase==='countdown'&&Date.now()<race.startsAt)||race.winnerId)fail('Poyga hozir javob qabul qilmaydi.');const player=race.racers.find(item=>item.id===answerPlayerId),question=raceQuestion(race,player);if(!question||question.id!==data.questionId)fail('Savol yangilangan. Qayta urinib ko‘ring.');const correct=data.value===question.correct,at=Date.now(),feedback={correct,at,retryAt:correct?0:at+1000};if(current.localMode)current.feedbackByPlayer={...(current.feedbackByPlayer||{}),[player.id]:feedback};else current.feedback=feedback;const total=race.questionCount||race.questionsByLane?.[0]?.length||race.questions?.length||0,racers=race.racers.map(item=>item.id===player.id?{...item,attempts:item.attempts+1,index:item.index+Number(correct),correct:item.correct+Number(correct),...(correct&&item.index+1===total?{finishedAt:at}:{})}:item),won=correct&&player.index+1===total;transaction.update(ref,{phase:won?'finished':'running',racers,...(won?{winnerId:player.id,finishedAt:at}:{})})});save('race',current);return raceState((await sdk.getDoc(ref)).data(),current)}
   if(path==='/api/race/leave'){await sdk.runTransaction(sdk.db,async transaction=>{const snap=await transaction.get(ref);if(!snap.exists())return;const race=snap.data();if(current.localMode){transaction.update(ref,{racers:[],phase:'lobby',startsAt:null,startedAt:null,winnerId:null});return}const opponent=race.racers.find(item=>item.id!==current.playerId),racers=race.racers.filter(item=>item.id!==current.playerId);transaction.update(ref,race.phase==='running'&&opponent&&!race.winnerId?{racers,winnerId:opponent.id,phase:'finished',finishedAt:Date.now()}:{racers,phase:'lobby',startsAt:null})});save('race',null);return {ok:true}}
  }

  if(path==='/api/typing/active'){const sdk=await ensureAnonymous(),settings=(await sdk.getDoc(sdk.doc(sdk.db,'settings','app'))).data()||{};return {active:!!settings.typingActive,stageCount:5,title:'English Typing & Vocabulary',levels:englishLevels}}
  if(path==='/api/typing/status'){const sdk=await waitForAuth();if(!await isTeacher(sdk))fail('O‘qituvchi ruxsati kerak.');await sdk.setDoc(sdk.doc(sdk.db,'settings','app'),{typingActive:!!data.active,typingOwnerId:sdk.auth.currentUser.uid,typingActivatedAt:data.active?Date.now():null},{merge:true});return {typing:(await adminState(sdk)).typing}}
  if(path==='/api/typing/results/reset'){const sdk=await waitForAuth();if(!await isTeacher(sdk))fail('O‘qituvchi ruxsati kerak.');const snap=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'typingResults'),sdk.where('ownerId','==',sdk.auth.currentUser.uid))),batch=sdk.writeBatch(sdk.db);snap.forEach(item=>batch.delete(item.ref));await batch.commit();return {ok:true}}
  if(path==='/api/typing/join'){const sdk=await ensureAnonymous(),settings=(await sdk.getDoc(sdk.doc(sdk.db,'settings','app'))).data()||{};if(!settings.typingActive)fail('Matn terish mashqi hozir yopiq. O‘qituvchi ochishini kuting.');if(!data.name?.trim()||!avatars.includes(data.avatar))fail('Ism va avatarni kiriting.');const courseMode=data.courseMode==='longtext'?'longtext':'english',englishLevel=englishLevels.includes(data.englishLevel)?data.englishLevel:'A1',current={playerId:randomId(),uid:sdk.auth.currentUser.uid,ownerId:settings.typingOwnerId||'',name:data.name.trim(),avatar:data.avatar,courseMode,englishLevel,entryMode:data.entryMode==='placement'?'placement':courseMode==='longtext'?'longtext':'selected',placementScore:Number.isFinite(data.placementScore)?data.placementScore:null,index:0,results:[],stageStartedAt:null,feedback:null};save('typing',current);return typingState(current)}
  if(path.startsWith('/api/typing/')){
   const sdk=await ensureAnonymous(),current=runtime.typing||load('typing');if(!current||current.uid!==sdk.auth.currentUser.uid)fail('Typing sessiyasi tugagan. Qayta qo‘shiling.');const settings=(await sdk.getDoc(sdk.doc(sdk.db,'settings','app'))).data()||{};if(path!=='/api/typing/leave'&&!settings.typingActive)fail('Typing mashqi hozir PASSIVE.');
   if(path==='/api/typing/session')return typingState(current);
   if(path==='/api/typing/start'){current.stageStartedAt=current.stageStartedAt||Date.now();current.feedback=null;save('typing',current);return typingState(current)}
   if(path==='/api/typing/submit'){const course=typingCourse(current.englishLevel,current.courseMode),stage=course[current.index];if(!stage||!current.stageStartedAt)fail('Avval bosqichni boshlang.');const metrics=typingMetrics(stage.text,data.value||'',Date.now()-current.stageStartedAt),result={stage:stage.level,title:stage.title,courseMode:current.courseMode||'english',englishLevel:current.englishLevel,focus:stage.focus||null,...metrics};current.feedback={...result,correctText:stage.text,translation:stage.translation||null};current.stageStartedAt=null;if(metrics.passed){current.results.push(result);current.index++;if(current.index>=course.length){const count=Math.max(1,current.results.length),averageAccuracy=Math.round(current.results.reduce((sum,item)=>sum+item.accuracy,0)/count*10)/10,averageWpm=Math.round(current.results.reduce((sum,item)=>sum+item.wpm,0)/count);await sdk.setDoc(sdk.doc(sdk.db,'typingResults',current.playerId),{uid:current.uid,ownerId:current.ownerId||'',name:current.name,avatar:current.avatar,courseMode:current.courseMode||'english',englishLevel:current.englishLevel,entryMode:current.entryMode,placementScore:current.placementScore,averageAccuracy,averageWpm,totalSeconds:Math.round(current.results.reduce((sum,item)=>sum+item.seconds,0)*10)/10,completedAt:Date.now(),stages:current.results})}}save('typing',current);return typingState(current)}
   if(path==='/api/typing/leave'){save('typing',null);return {ok:true}}
  }
  fail('Funksiya topilmadi.');
 }catch(error){
  const message=String(error?.message||'');if(/invalid login credentials/i.test(message))throw Error('Login yoki parol noto‘g‘ri.');if(/row-level security|permission denied|not allowed/i.test(message))throw Error('Supabase xavfsizlik qoidasi ruxsat bermadi. `supabase-schema.sql` faylini SQL Editor’da qayta RUN qiling.');throw Error(message||'Supabase so‘rovi bajarilmadi.');
 }
}

export function subscribeSupabase(handlers){
 let stopped=false,unsubs=[];
 const listen=async()=>{try{const sdk=await waitForAuth();if(stopped)return;const user=sdk.auth.currentUser;
  if(await isTeacher(sdk,user)){let timer;const profile=await userProfile(sdk,user),refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>supabaseApi('/api/quizzes').then(handlers.onState).catch(()=>{}),120)},owned=collection=>sdk.query(sdk.collection(sdk.db,collection),sdk.where('ownerId','==',user.uid)),targets=[owned('quizzes'),owned('players'),owned('typingResults'),owned('lessons'),profile?.role==='admin'?sdk.collection(sdk.db,'nationalSections'):owned('nationalSections'),sdk.doc(sdk.db,'live','race'),sdk.doc(sdk.db,'settings','app')];if(profile?.role==='admin')targets.push(sdk.collection(sdk.db,'profiles'),sdk.collection(sdk.db,'userActivity'));for(const target of targets)unsubs.push(sdk.onSnapshot(target,refresh,()=>{}));refresh()}
  const game=runtime.game||load('game');if(game){unsubs.push(sdk.onSnapshot(sdk.query(sdk.collection(sdk.db,'players'),sdk.where('quizId','==',game.quiz.id)),snapshot=>handlers.onRanking?.(rankRows(queryData(snapshot).map(publicPlayer))),()=>{}));unsubs.push(sdk.onSnapshot(sdk.doc(sdk.db,'quizzes',game.quiz.id),snapshot=>{if(!snapshot.exists()||snapshot.data().status!=='active')handlers.onClosed?.()},()=>{}))}
  const race=runtime.race||load('race');if(race)unsubs.push(sdk.onSnapshot(sdk.doc(sdk.db,'live','race'),snapshot=>{const value=snapshot.data();if(!value?.active)handlers.onRaceClosed?.();else try{handlers.onRace?.(raceState(value,race))}catch{}},()=>{}));
  const typing=runtime.typing||load('typing');if(typing)unsubs.push(sdk.onSnapshot(sdk.doc(sdk.db,'settings','app'),snapshot=>{if(!snapshot.data()?.typingActive)handlers.onTypingClosed?.()},()=>{}));
 }catch(error){handlers.onError?.(error)}};listen();return()=>{stopped=true;unsubs.forEach(stop=>stop())};
}
