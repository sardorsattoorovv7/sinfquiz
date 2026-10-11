import {secureActivityPath,secureActivityApi} from './secure-activities.js';
import {securePlayPath,securePlayApi,playRpc} from './secure-play-service.js';
import {quizRanking} from './quiz-ranking.js';
import bank from '../data/question-bank.json';
import {office729Quizzes} from '../data/office-729.js';
import {excelBasicsQuiz} from '../data/excel-basics.js';
import typingLessons from '../data/english-typing-lessons.json';
import longTypingLessons from '../data/typing-lessons.json';
import {nationalTestBank} from '../data/national-test-bank.js';
import {publicationError} from './national-validation.js';
import {cefrResult} from './cefr-grading.js';
import {audioMazeLevelById} from './audio-maze-content.js';
import {adminEmail,ensureAnonymous,getSupabase,waitForAuth} from './supabase-sdk.js';

const avatars=['🧑‍💻','👩‍🚀','🤖','🥷','🧙','🦸','👾','🦊','🐼','🦁','🐯','🐸'];
const runtime={ticket:null,game:null,race:null,typing:null,national:null,cefr:null};
const seededTeachers=new Set();
// v7.9 and earlier shipped one identical 15-question Python template.
// Replace only its untouched question array; never overwrite teacher edits.
const templateHash=value=>{let hash=2166136261;for(const char of JSON.stringify(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}return (hash>>>0).toString(16)};
const originalClassroomTemplates={Word:['a038fcd6'],Excel:['ec7a63f6'],PowerPoint:['f8187d4d'],Python:['61fedcfd','52633651']};
const seedNational=async(sdk,profile)=>{
 const {ensureNationalDefaults}=await import('./national-defaults.js');
 return ensureNationalDefaults(sdk,profile);
};
const seedComputerCourse=async(sdk,profile)=>{
 const {ensureComputerCourse}=await import('./computer-course-seed.js');
 return ensureComputerCourse(sdk,profile);
};
const key=name=>`sinfquiz_supabase_${name}`;
const randomId=()=>globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
const load=name=>{try{return JSON.parse(sessionStorage.getItem(key(name))||'null')}catch{return null}};
const save=(name,value)=>{runtime[name]=value;if(value)sessionStorage.setItem(key(name),JSON.stringify(value));else sessionStorage.removeItem(key(name))};
for(const name of ['game','race','typing','national','cefr'])runtime[name]=typeof sessionStorage==='undefined'?null:load(name);

const fail=message=>{throw Error(message)};
const clean=value=>JSON.parse(JSON.stringify(value));
const safeQuestion=question=>{if(!question)return null;const {correct,answer,acceptedAnswers,criteria,officeRubric,...safe}=question;return safe};
const quizInfo=quiz=>({id:quiz.id,title:quiz.title,group:quiz.group,subject:quiz.subject,questionCount:quiz.questions.length,visibility:quiz.visibility||'private',ownerName:quiz.ownerName||'O‘qituvchi'});
const docData=snapshot=>snapshot.exists()?{id:snapshot.id,...snapshot.data()}:null;
const queryData=snapshot=>snapshot.docs.map(item=>({id:item.id,...item.data()}));
const nationalInfo=section=>({id:section.id,title:section.title,subject:section.subject,description:section.description||'',questionCount:section.questions?.length||section.questionCount||30,durationMinutes:section.durationMinutes||60,scoringModel:section.scoringModel||'general-certificate',builtin:!!section.builtin,visibility:section.visibility||'private',approvalStatus:section.approvalStatus||'draft',ownerId:section.ownerId||null,ownerName:section.ownerName||'O‘qituvchi',reviewNote:section.reviewNote||'',createdAt:section.createdAt||null,updatedAt:section.updatedAt||null});
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
 const uid=sdk.auth.currentUser.uid;if(seededTeachers.has(uid))return;
 const current=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'quizzes'),sdk.where('ownerId','==',uid)));if(!current.empty){
  for(const source of [excelBasicsQuiz,...office729Quizzes]){
   if(current.docs.some(item=>item.data()?.templateKey===source.templateKey))continue;
   const id=`template:${source.templateKey}:${uid}`,pins=new Set(current.docs.map(item=>item.data()?.pin));let pin;do{pin=String(Math.floor(100000+Math.random()*900000))}while(pins.has(pin));
   const profile=await userProfile(sdk);await sdk.setDoc(sdk.doc(sdk.db,'quizzes',id),{...clean(source),id,pin,status:'passive',visibility:'private',ownerId:uid,ownerName:profile?.name||'O‘qituvchi',createdAt:Date.now(),version:5});
  }
  for(const snapshot of current.docs){const quiz=snapshot.data();const source=bank.find(item=>item.subject===quiz?.subject);
   if(source&&originalClassroomTemplates[quiz.subject]?.includes(templateHash(quiz.questions))){
    await sdk.updateDoc(snapshot.ref,{questions:clean(source.questions),title:source.title,version:3});
   }
  }
  seededTeachers.add(uid);return;
 }
 const profile=await userProfile(sdk),ownerName=profile?.name||'O‘qituvchi';
 const batch=sdk.writeBatch(sdk.db),used=new Set();
 for(const source of [...bank,excelBasicsQuiz,...office729Quizzes]){let pin=String(Math.floor(100000+Math.random()*900000));while(used.has(pin)){pin=String(Math.floor(100000+Math.random()*900000))}used.add(pin);const id=source.templateKey?`template:${source.templateKey}:${uid}`:randomId();batch.set(sdk.doc(sdk.db,'quizzes',id),{...clean(source),id,pin,status:'passive',visibility:'private',ownerId:sdk.auth.currentUser.uid,ownerName,createdAt:Date.now(),version:source.templateKey?4:3})}
 await batch.commit();seededTeachers.add(uid);
}

async function adminState(sdk){
 await seedQuizzes(sdk);
 const uid=sdk.auth.currentUser.uid,profile=await userProfile(sdk),isAdmin=profile?.role==='admin';
 let courseSeedError=null;
 if(isAdmin){
  await seedNational(sdk,profile).catch(()=>{});
  try{await seedComputerCourse(sdk,profile)}catch(error){courseSeedError=error.message||'Darsliklarni saqlab bo‘lmadi.'}
 }
 const [quizSnap,playerSnap,raceSnap,settingsSnap,resultSnap,lessonSnap,publicQuizSnap,nationalSnap]=await Promise.all([
  sdk.getDocs(sdk.query(sdk.collection(sdk.db,'quizzes'),sdk.where('ownerId','==',uid))),
  sdk.getDocs(sdk.query(sdk.collection(sdk.db,'players'),sdk.where('ownerId','==',uid))),
  playRpc(sdk,'sq_room_staff'),
  sdk.getDoc(sdk.doc(sdk.db,'settings','app')),
  sdk.getDocs(sdk.query(sdk.collection(sdk.db,'typingResults'),sdk.where('ownerId','==',uid))),
  sdk.getDocs(sdk.query(sdk.collection(sdk.db,'lessons'),sdk.where('ownerId','==',uid))),
  playRpc(sdk,'sq_quiz_catalog'),
  isAdmin?sdk.getDocs(sdk.collection(sdk.db,'nationalSections')):sdk.getDocs(sdk.query(sdk.collection(sdk.db,'nationalSections'),sdk.where('ownerId','==',uid))),
 ]);
 const settings=settingsSnap.data()||{},race=raceSnap.race;
 let analytics=null;
 if(isAdmin)analytics=await playRpc(sdk,'sq_admin_analytics');
 return {quizzes:queryData(quizSnap),publicQuizzes:publicQuizSnap,lessons:queryData(lessonSnap).sort((a,b)=>b.updatedAt-a.updatedAt),courseSeedError,nationalSections:queryData(nationalSnap).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)),players:queryData(playerSnap),race,typing:{...raceSnap.typing,studentCount:0,stageCount:5,results:queryData(resultSnap).filter(r=>r.verified===true).sort((a,b)=>b.completedAt-a.completedAt).slice(0,50)},analytics};
}

const raceSummary=race=>race?{id:race.id,active:!!race.active,phase:race.phase,title:race.title,sourceQuizId:race.sourceQuizId||null,questionCount:race.questionCount||race.questionsByLane?.[0]?.length||race.questions?.length||0,startsAt:race.startsAt||null,startedAt:race.startedAt||null,winnerId:race.winnerId||null,createdAt:race.createdAt,racers:(race.racers||[]).map(({answer,...player})=>player)}:null;
export async function supabaseApi(path,{method='GET',data={}}={}){
 try{
  if(secureActivityPath(path))return await secureActivityApi(path,data,{runtime,load,save});
  if(securePlayPath(path))return await securePlayApi(path,data,{runtime,load,save});
  if(path==='/auth/session'){
  const sdk=await waitForAuth(),user=sdk.auth.currentUser,profile=await userProfile(sdk,user);return {user:profile?{id:user.uid,...profile}:null,csrf:profile?'supabase':null};
  }
  if(path==='/auth/login'){
   const sdk=await getSupabase();if(data.username!=='admin'&&data.username!==adminEmail())fail('Login yoki parol noto‘g‘ri.');if(sdk.auth.currentUser)await sdk.signOut(sdk.auth);const credential=await sdk.signInWithEmailAndPassword(sdk.auth,adminEmail(),data.password),profileRef=sdk.doc(sdk.db,'profiles',credential.user.uid);await sdk.setDoc(profileRef,{uid:credential.user.uid,role:'admin',name:'Administrator',email:adminEmail(),username:'admin',updatedAt:Date.now(),createdAt:Date.now()},{merge:true});return {user:{id:credential.user.uid,uid:credential.user.uid,role:'admin',name:'Administrator',username:'admin'},csrf:'firebase'};
  }
  if(path==='/auth/logout'){const sdk=await getSupabase();await sdk.signOut(sdk.auth);for(const name of ['game','race','typing','national','cefr'])save(name,null);sessionStorage.removeItem('sq_active_hash');return {ok:true}}

  if(path==='/api/audio-maze/active'){
   const sdk=await ensureAnonymous(),snap=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'audioMazeActivations'),sdk.where('active','==',true))),activations=queryData(snap),active=[];
   for(const activation of activations){let level=audioMazeLevelById[activation.levelId];if(!level){const saved=docData(await sdk.getDoc(sdk.doc(sdk.db,'audioMazeLevels',String(activation.levelId||''))));if(saved?.approvalStatus==='approved')level={...saved,gateCells:audioMazeLevelById[saved.mapId]?.gateCells,start:audioMazeLevelById[saved.mapId]?.start,exit:audioMazeLevelById[saved.mapId]?.exit,monster:audioMazeLevelById[saved.mapId]?.monster,grid:audioMazeLevelById[saved.mapId]?.grid,route:audioMazeLevelById[saved.mapId]?.route};}
    if(level?.grid&&level.gateCells?.length===level.tasks?.length)active.push({id:activation.id,ownerId:activation.ownerId,ownerName:activation.ownerName||'O‘qituvchi',level:{...level,ownerId:activation.ownerId}});
   }
   return {active};
  }
  if(path==='/api/audio-maze/admin'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(!['teacher','admin'].includes(profile?.role))fail('O‘qituvchi ruxsati kerak.');const uid=sdk.auth.currentUser.uid,isAdmin=profile.role==='admin';
   const [levelSnap,resultSnap,activationSnap]=await Promise.all([isAdmin?sdk.getDocs(sdk.collection(sdk.db,'audioMazeLevels')):sdk.getDocs(sdk.query(sdk.collection(sdk.db,'audioMazeLevels'),sdk.where('ownerId','==',uid))),isAdmin?sdk.getDocs(sdk.collection(sdk.db,'audioMazeResults')):sdk.getDocs(sdk.query(sdk.collection(sdk.db,'audioMazeResults'),sdk.where('ownerId','==',uid))),sdk.getDoc(sdk.doc(sdk.db,'audioMazeActivations',`a-${uid}`))]);
   const levels=queryData(levelSnap).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)),results=queryData(resultSnap).sort((a,b)=>(b.completedAt||0)-(a.completedAt||0)).slice(0,100),activation=activationSnap.exists()?activationSnap.data():null;
   return {activation,levels,pending:isAdmin?levels.filter(x=>x.approvalStatus==='pending'):[],results};
  }
  if(path==='/api/audio-maze/activate'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(!['teacher','admin'].includes(profile?.role))fail('O‘qituvchi ruxsati kerak.');const uid=sdk.auth.currentUser.uid,ref=sdk.doc(sdk.db,'audioMazeActivations',`a-${uid}`),now=Date.now();
   if(!data.active){await sdk.setDoc(ref,{id:`a-${uid}`,feature:'audioMaze',ownerId:uid,ownerName:profile.name||'O‘qituvchi',active:false,closedAt:now,updatedAt:now});return {ok:true,active:false}}
   let level=audioMazeLevelById[String(data.levelId||'')];if(!level){level=docData(await sdk.getDoc(sdk.doc(sdk.db,'audioMazeLevels',String(data.levelId||''))));if(!level||level.approvalStatus!=='approved'||(profile.role!=='admin'&&level.ownerId!==uid))fail('Faqat tayyor xarita yoki administrator tasdiqlagan savollarni ochish mumkin.');const map=audioMazeLevelById[level.mapId];if(!map)fail('Tanlangan labirint xaritasi topilmadi.');level={...level,...map,tasks:level.tasks}}
   await sdk.setDoc(ref,{id:`a-${uid}`,feature:'audioMaze',ownerId:uid,ownerName:profile.name||'O‘qituvchi',active:true,levelId:level.id,levelTitle:level.title,taskCount:level.tasks.length,updatedAt:now,activatedAt:now});return {ok:true,active:true,levelId:level.id};
  }
  if(path==='/api/audio-maze/levels'&&method==='POST'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(!['teacher','admin'].includes(profile?.role))fail('O‘qituvchi ruxsati kerak.');const uid=sdk.auth.currentUser.uid,base=audioMazeLevelById[String(data.mapId||'')];if(!base)fail('Mavjud xaritalardan birini tanlang.');if(!data.title?.trim()||data.title.length>60)fail('To‘plam nomi 1–60 belgi bo‘lsin.');if(!Array.isArray(data.tasks)||data.tasks.length!==base.tasks.length)fail(`Bu xarita uchun aynan ${base.tasks.length} ta topshiriq kerak.`);
   const tasks=data.tasks.map((task,index)=>{if(typeof task.audio!=='string'||task.audio.trim().length<5||task.audio.length>260)fail(`Topshiriq ${index+1}: inglizcha gapni to‘liq kiriting.`);if(!Array.isArray(task.options)||task.options.length!==3||task.options.some(option=>typeof option!=='string'||!option.trim()||option.length>90))fail(`Topshiriq ${index+1}: uchta javob variantini kiriting.`);if(!Number.isInteger(task.answer)||task.answer<0||task.answer>2)fail(`Topshiriq ${index+1}: to‘g‘ri javobni belgilang.`);return {id:`custom-${index+1}`,audio:task.audio.trim(),translation:String(task.translation||'').trim().slice(0,260),options:task.options.map(x=>x.trim()),answer:task.answer,explanation:String(task.explanation||'Javobni audiodagi kalit so‘z bilan solishtiring.').slice(0,300),hints:Array.isArray(task.hints)?task.hints.slice(0,2).map(x=>String(x).slice(0,180)):[],skill:String(task.skill||'listening').slice(0,30)}});
   const id=data.id&&String(data.id).length<100?String(data.id):randomId(),existing=docData(await sdk.getDoc(sdk.doc(sdk.db,'audioMazeLevels',id)));if(existing&&existing.ownerId!==uid&&profile.role!=='admin')fail('Faqat o‘zingiz yaratgan to‘plamni o‘zgartira olasiz.');const custom={id,title:data.title.trim(),mapId:base.id,tasks,ownerId:uid,ownerName:profile.name||'O‘qituvchi',visibility:profile.role==='admin'?'public':'private',approvalStatus:profile.role==='admin'?'approved':'pending',createdAt:existing?.createdAt||Date.now(),updatedAt:Date.now()};await sdk.setDoc(sdk.doc(sdk.db,'audioMazeLevels',id),custom);return {id,status:custom.approvalStatus};
  }
  const audioReview=path.match(/^\/api\/audio-maze\/review\/([^/]+)$/);if(audioReview&&method==='POST'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(profile?.role!=='admin')fail('Administrator ruxsati kerak.');const id=decodeURIComponent(audioReview[1]),level=docData(await sdk.getDoc(sdk.doc(sdk.db,'audioMazeLevels',id)));if(!level)fail('Savollar to‘plami topilmadi.');const approved=data.decision==='approved',decision=['approved','rejected'].includes(data.decision)?data.decision:null;if(!decision)fail('Tasdiqlash holati noto‘g‘ri.');await sdk.updateDoc(sdk.doc(sdk.db,'audioMazeLevels',id),{approvalStatus:decision,visibility:approved?'public':'private',reviewedAt:Date.now()});return {ok:true,approvalStatus:decision};
  }
  if(path==='/api/audio-maze/result'&&method==='POST'){
   const sdk=await ensureAnonymous(),uid=sdk.auth.currentUser.uid,ownerId=String(data.ownerId||''),activation=ownerId?docData(await sdk.getDoc(sdk.doc(sdk.db,'audioMazeActivations',`a-${ownerId}`))):null;if(!activation?.active||activation.levelId!==data.levelId)fail('O‘yin yopilgan yoki xarita almashtirilgan. Natija saqlanmadi.');let level=audioMazeLevelById[String(data.levelId||'')];if(!level){const custom=docData(await sdk.getDoc(sdk.doc(sdk.db,'audioMazeLevels',String(data.levelId||''))));if(custom?.approvalStatus!=='approved')fail('Tasdiqlanmagan savollar natijasi saqlanmaydi.');const map=audioMazeLevelById[custom.mapId];if(!map)fail('Xarita topilmadi.');level={...custom,...map,tasks:custom.tasks}}
   const total=level.tasks.length,correct=Number(data.correct),wrong=Number(data.wrong),elapsed=Number(data.elapsedMs),outcome=['won','caught','time','left'].includes(data.outcome)?data.outcome:null;if(!outcome||Number(data.tasksTotal)!==total||!Number.isInteger(correct)||correct<0||correct>total||!Number.isInteger(wrong)||wrong<0||wrong>100||!Number.isFinite(elapsed)||elapsed<0||elapsed>180000)fail('Natija ma’lumotlari tekshiruvdan o‘tmadi.');const result={id:randomId(),attemptId:String(data.attemptId||'').slice(0,100),uid,ownerId,ownerName:activation.ownerName||'O‘qituvchi',levelId:level.id,levelTitle:level.title,name:String(data.name||'O‘quvchi').trim().slice(0,40)||'O‘quvchi',mode:data.mode==='learn'?'learn':'listen',outcome,tasksTotal:total,correct,wrong,assisted:Math.max(0,Math.min(total,Number(data.assisted)||0)),elapsedMs:Math.round(elapsed),mistakes:Array.isArray(data.mistakes)?data.mistakes.slice(0,80).map(x=>({taskId:String(x.taskId||'').slice(0,40),chosen:Math.max(0,Math.min(2,Number(x.chosen)||0))})):[],completedAt:Date.now()};await sdk.setDoc(sdk.doc(sdk.db,'audioMazeResults',result.id),result);return {ok:true,id:result.id};
  }

  if((path==='/api/quizzes'&&method==='GET')||path==='/api/state'){
   const sdk=await waitForAuth();if(!await isTeacher(sdk))fail('O‘qituvchi sifatida kirish kerak.');return adminState(sdk);
  }
  const quizMatch=path.match(/^\/api\/quizzes\/([^/]+)$/);
  if((path==='/api/quizzes'&&method==='POST')||quizMatch){
   const sdk=await waitForAuth();if(!await isTeacher(sdk))fail('O‘qituvchi ruxsati kerak.');
   const uid=sdk.auth.currentUser.uid,existing=quizMatch?docData(await sdk.getDoc(sdk.doc(sdk.db,'quizzes',quizMatch[1]))):null;if(existing&&existing.ownerId!==uid)fail('Faqat o‘zingiz yaratgan testni o‘zgartira olasiz.');
   if(method==='DELETE')return playRpc(sdk,'sq_owned_bulk',{p_kind:'quiz-delete',p_quiz_id:quizMatch[1]});
   const profile=await userProfile(sdk),id=quizMatch?.[1]||data.id||randomId(),quiz={...clean(data),id,visibility:data.visibility==='public'?'public':'private',ownerName:profile?.name||'O‘qituvchi',createdAt:data.createdAt||Date.now(),version:(data.version||0)+1};
   return {quiz:await playRpc(sdk,'sq_quiz_save',{p_id:id,p_data:quiz})};

  }
  if(path==='/api/results/reset'){const sdk=await waitForAuth();return playRpc(sdk,'sq_owned_bulk',{p_kind:'players-reset'})}

  if(path==='/api/catalog'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(!profile)fail('Telegram orqali kirish kerak.');
   const [quizzes,lessonSnap]=await Promise.all([playRpc(sdk,'sq_quiz_catalog'),sdk.getDocs(sdk.query(sdk.collection(sdk.db,'lessons'),sdk.where('visibility','==','public')))]);
   return {quizzes,lessons:queryData(lessonSnap).sort((a,b)=>b.updatedAt-a.updatedAt)};
  }
  const lessonMatch=path.match(/^\/api\/lessons\/([^/]+)$/);
  if(path==='/api/lessons'&&method==='GET'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(!profile)fail('Telegram orqali kirish kerak.');const snap=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'lessons'),sdk.where(profile.role==='teacher'?'ownerId':'visibility','==',profile.role==='teacher'?sdk.auth.currentUser.uid:'public')));return {lessons:queryData(snap).sort((a,b)=>b.updatedAt-a.updatedAt)};
  }
  if((path==='/api/lessons'&&method==='POST')||lessonMatch){
   const sdk=await waitForAuth();if(!await isTeacher(sdk))fail('Darslik yaratish uchun o‘qituvchi bo‘lib kiring.');const uid=sdk.auth.currentUser.uid,existing=lessonMatch?docData(await sdk.getDoc(sdk.doc(sdk.db,'lessons',lessonMatch[1]))):null;if(existing&&existing.ownerId!==uid)fail('Faqat o‘zingiz yaratgan darslikni o‘zgartira olasiz.');if(method==='DELETE'){await sdk.deleteDoc(sdk.doc(sdk.db,'lessons',lessonMatch[1]));return {ok:true}}if(!data.title?.trim()||!data.content?.trim())fail('Darslik sarlavhasi va matnini kiriting.');const profile=await userProfile(sdk),id=lessonMatch?.[1]||randomId(),lesson={...(existing||{}),id,title:data.title.trim(),subject:(data.subject||'Informatika').trim(),summary:(data.summary||'').trim(),content:data.content.trim(),cover:'DARS',visibility:data.visibility==='private'?'private':'public',ownerId:uid,ownerName:profile?.name||'O‘qituvchi',createdAt:existing?.createdAt||Date.now(),updatedAt:Date.now()};await sdk.setDoc(sdk.doc(sdk.db,'lessons',id),lesson);return {lesson};
  }

  if(path==='/api/national'&&method==='GET'){
   const sdk=await waitForAuth(),profile=await userProfile(sdk);if(!profile)fail('Milliy test mashqlariga kirish uchun hisobingizga kiring.');
   if(profile.role==='admin')await seedNational(sdk,profile);
   return playRpc(sdk,'sq_national_catalog');
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
   const wantsPublic=data.requestPublic===true,approvalStatus=profile.role==='admin'&&wantsPublic?'approved':wantsPublic?'pending':'draft',id=existing?.id||randomId(),section={id,title:data.title.trim(),subject:data.subject,description:String(data.description||'').trim().slice(0,500),durationMinutes:Math.max(30,Math.min(180,Number(data.durationMinutes)||60)),scoringModel:'general-certificate',questions:questions.map((item,index)=>({id:item.id||`${id}-q-${index+1}`,type:'test',text:item.text.trim(),passage:String(item.passage||'').trim().slice(0,12000),topic:String(item.topic||'').trim().slice(0,120),sourceUrl:String(item.sourceUrl||'').trim().slice(0,1000),sourceReference:String(item.sourceReference||'').trim().slice(0,200),options:item.options.map(option=>String(option).trim()),correct:Number(item.correct),answer:String(item.options[Number(item.correct)]).trim(),explanation:String(item.explanation||'').trim().slice(0,600),subject:data.subject,points:1,time:120})),questionCount:30,builtin:false,visibility:approvalStatus==='approved'?'public':'private',approvalStatus,ownerId:existing?.ownerId||uid,ownerName:existing?.ownerName||profile.name||'O‘qituvchi',createdAt:existing?.createdAt||Date.now(),updatedAt:Date.now()};await sdk.setDoc(sdk.doc(sdk.db,'nationalSections',id),section);return {section:nationalInfo(section)};
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

  fail('Funksiya topilmadi.');
 }catch(error){
  const message=String(error?.message||'');if(/invalid login credentials/i.test(message))throw Error('Login yoki parol noto‘g‘ri.');if(/row-level security|permission denied|not allowed/i.test(message))throw Error('Supabase xavfsizlik qoidasi ruxsat bermadi. SQL Editor’da `supabase-migration-7.28.sql` yangilanishini RUN qiling.');throw Error(message||'Supabase so‘rovi bajarilmadi.');
 }
}

export function subscribeSupabase(handlers){
 let stopped=false,unsubs=[];
 const listen=async()=>{try{const sdk=await waitForAuth();if(stopped)return;const user=sdk.auth.currentUser;
  if(await isTeacher(sdk,user)){
   let timer,inFlight=false,dirty=false;const profile=await userProfile(sdk,user);
   const refresh=()=>{clearTimeout(timer);timer=setTimeout(async()=>{
    if(stopped)return;if(inFlight){dirty=true;return}inFlight=true;
    try{handlers.onState?.(await supabaseApi('/api/quizzes'))}catch(error){handlers.onError?.(error)}
    finally{inFlight=false;if(dirty){dirty=false;refresh()}}
   },120)};
   const targets=['quizzes','players','typingResults','lessons','nationalSections','live','settings'];
   if(profile?.role==='admin')targets.push('profiles','userActivity');
   for(const collection of targets)unsubs.push(sdk.onChanges(collection,payload=>{
    const row=payload.new?.data||payload.old?.data;
    if(row&&!['live','settings','profiles','userActivity'].includes(collection)&&profile?.role!=='admin'&&row.ownerId!==user.uid)return;
    refresh();
   },()=>{}));const roomTimer=setInterval(refresh,15000);unsubs.push(()=>clearInterval(roomTimer));refresh();
  }
  const game=runtime.game||load('game');if(game){unsubs.push(sdk.onSnapshot(sdk.doc(sdk.db,'leaderboards',game.quiz.id),snapshot=>handlers.onRanking?.(quizRanking(snapshot.data()?.rows,game.quiz.id)),error=>handlers.onError?.(error)));const timer=setInterval(()=>{if(!stopped&&!document.hidden)supabaseApi('/api/play/session').catch(e=>{if(/testni to‘xtatgan/.test(e.message))handlers.onClosed?.()})},15000);unsubs.push(()=>clearInterval(timer))}
  const race=runtime.race||load('race');if(race){let pending=false;const refresh=async()=>{if(stopped||pending||document.hidden)return;pending=true;try{handlers.onRace?.(await supabaseApi('/api/race/session'))}catch(error){if(/Poyga yopilgan|Poyga almashtirilgan/.test(error.message))handlers.onRaceClosed?.();else handlers.onError?.(error)}finally{pending=false}};const timer=setInterval(refresh,1000);unsubs.push(()=>clearInterval(timer));refresh();}
  const typing=runtime.typing||load('typing');if(typing){const timer=setInterval(()=>{if(!stopped&&!document.hidden)supabaseApi('/api/typing/session').catch(error=>{if(/hozir yopiq/.test(error.message))handlers.onTypingClosed?.()})},15000);unsubs.push(()=>clearInterval(timer));}
 }catch(error){handlers.onError?.(error)}};listen();return()=>{stopped=true;unsubs.forEach(stop=>stop())};
}
