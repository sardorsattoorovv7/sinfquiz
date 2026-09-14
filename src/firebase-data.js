import bank from '../data/question-bank.json';
import typingLessons from '../data/typing-lessons.json';
import {gradeAnswer} from './grading.js';
import {adminEmail,ensureAnonymous,getFirebase,waitForAuth} from './firebase-sdk.js';

const avatars=['🧑‍💻','👩‍🚀','🤖','🥷','🧙','🦸','👾','🦊','🐼','🦁','🐯','🐸'];
const runtime={ticket:null,game:null,race:null,typing:null};
const key=name=>`sinfquiz_firebase_${name}`;
const randomId=()=>globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
const load=name=>{try{return JSON.parse(sessionStorage.getItem(key(name))||'null')}catch{return null}};
const save=(name,value)=>{runtime[name]=value;if(value)sessionStorage.setItem(key(name),JSON.stringify(value));else sessionStorage.removeItem(key(name))};
for(const name of ['game','race','typing'])runtime[name]=typeof sessionStorage==='undefined'?null:load(name);

const fail=message=>{throw Error(message)};
const clean=value=>JSON.parse(JSON.stringify(value));
const publicPlayer=player=>{const {responses,...safe}=player;return safe};
const safeQuestion=question=>{if(!question)return null;const {correct,answer,acceptedAnswers,criteria,...safe}=question;return safe};
const quizInfo=quiz=>({id:quiz.id,title:quiz.title,group:quiz.group,subject:quiz.subject,questionCount:quiz.questions.length});
const rankRows=players=>players.sort((a,b)=>b.score-a.score||(a.finishedAt||Infinity)-(b.finishedAt||Infinity)||a.startedAt-b.startedAt);
const docData=snapshot=>snapshot.exists()?{id:snapshot.id,...snapshot.data()}:null;
const queryData=snapshot=>snapshot.docs.map(item=>({id:item.id,...item.data()}));

async function isAdmin(sdk,user=sdk.auth.currentUser){
 if(!user||user.isAnonymous)return false;
 return (await sdk.getDoc(sdk.doc(sdk.db,'admins',user.uid))).exists();
}

async function seedQuizzes(sdk){
 const current=await sdk.getDocs(sdk.collection(sdk.db,'quizzes'));if(!current.empty)return;
 const batch=sdk.writeBatch(sdk.db),used=new Set();
 for(const source of bank){let pin=source.pin;while(used.has(pin)){pin=String(Math.floor(100000+Math.random()*900000))}used.add(pin);const id=source.id||randomId();batch.set(sdk.doc(sdk.db,'quizzes',id),{...clean(source),id,pin,status:source.status||'passive',ownerId:sdk.auth.currentUser.uid,createdAt:source.createdAt||Date.now(),version:1})}
 await batch.commit();
}

async function adminState(sdk){
 await seedQuizzes(sdk);
 const [quizSnap,playerSnap,raceSnap,settingsSnap,resultSnap]=await Promise.all([
  sdk.getDocs(sdk.collection(sdk.db,'quizzes')),
  sdk.getDocs(sdk.collection(sdk.db,'players')),
  sdk.getDoc(sdk.doc(sdk.db,'live','race')),
  sdk.getDoc(sdk.doc(sdk.db,'settings','app')),
  sdk.getDocs(sdk.collection(sdk.db,'typingResults')),
 ]);
 const settings=settingsSnap.data()||{},race=raceSnap.exists()?raceSnap.data():null;
 return {quizzes:queryData(quizSnap),players:queryData(playerSnap),race:raceSummary(race),typing:{active:!!settings.typingActive,activatedAt:settings.typingActivatedAt||null,studentCount:0,stageCount:5,results:queryData(resultSnap).sort((a,b)=>b.completedAt-a.completedAt).slice(0,50)}};
}

async function ranking(sdk,quizId){
 const snap=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'players'),sdk.where('quizId','==',quizId)));
 return rankRows(queryData(snap).map(publicPlayer));
}

function playState(current,player,rows){
 return {quiz:quizInfo(current.quiz),player:publicPlayer(player),question:current.finished?null:safeQuestion(current.quiz.questions[current.index]),index:current.index,deadline:current.deadline,serverNow:Date.now(),csrf:'firebase',feedback:current.feedback||null,finished:!!current.finished,ranking:rows};
}

const raceSummary=race=>race?{id:race.id,active:!!race.active,phase:race.phase,title:race.title,questionCount:race.questions?.length||0,startsAt:race.startsAt||null,startedAt:race.startedAt||null,winnerId:race.winnerId||null,createdAt:race.createdAt,racers:(race.racers||[]).map(({answer,...player})=>player)}:null;
async function advanceRace(sdk){
 const ref=sdk.doc(sdk.db,'live','race');
 await sdk.runTransaction(sdk.db,async transaction=>{const snap=await transaction.get(ref);if(!snap.exists())return;const race=snap.data();if(race.active&&race.phase==='countdown'&&Date.now()>=race.startsAt)transaction.update(ref,{phase:'running',startedAt:race.startsAt})});
}
function raceState(race,current){
 if(!race?.active||race.id!==current.raceId)fail('Poyga yopilgan.');const player=race.racers.find(item=>item.id===current.playerId);if(!player)fail('Poygachi topilmadi.');return {race:raceSummary(race),playerId:player.id,question:race.phase==='running'&&!race.winnerId?safeQuestion(race.questions[player.index]):null,index:player.index,feedback:current.feedback||null,csrf:'firebase',serverNow:Date.now()};
}

const editDistance=(left,right)=>{const a=[...left],b=[...right],row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let diagonal=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const above=row[j],cost=a[i-1]===b[j-1]?0:1;row[j]=Math.min(row[j]+1,row[j-1]+1,diagonal+cost);diagonal=above}}return row[b.length]};
const typingMetrics=(target,value,elapsedMs)=>{const expected=target.normalize('NFC'),typed=value.normalize('NFC'),distance=editDistance(expected,typed),length=Math.max(1,expected.length,typed.length),accuracy=Math.max(0,Math.round((1-distance/length)*1000)/10),correctChars=Math.max(0,expected.length-distance),seconds=Math.max(1,elapsedMs/1000),wpm=Math.max(0,Math.round((correctChars/5)/(seconds/60)));return {accuracy,wpm,seconds:Math.round(seconds*10)/10,errors:distance,typedChars:typed.length,expectedChars:expected.length,passed:accuracy>=90&&typed.length>=expected.length*.9}};
const typingStage=index=>{const stage=typingLessons[index];return stage?{...stage,wordCount:stage.text.trim().split(/\s+/u).length}:null};
const typingState=current=>({active:true,playerId:current.playerId,name:current.name,avatar:current.avatar,index:current.index,stage:typingStage(current.index),stageStartedAt:current.stageStartedAt||null,results:current.results,feedback:current.feedback||null,finished:current.index>=typingLessons.length,csrf:'firebase',serverNow:Date.now()});

export async function firebaseApi(path,{method='GET',data={}}={}){
 try{
  if(path==='/auth/session'){
   const sdk=await waitForAuth(),user=sdk.auth.currentUser,admin=await isAdmin(sdk,user);return {user:admin?{id:user.uid,name:'Administrator',username:'admin'}:null,csrf:admin?'firebase':null};
  }
  if(path==='/auth/login'){
   const sdk=await getFirebase();if(data.username!=='admin'&&data.username!==adminEmail())fail('Login yoki parol noto‘g‘ri.');if(sdk.auth.currentUser)await sdk.signOut(sdk.auth);const credential=await sdk.signInWithEmailAndPassword(sdk.auth,adminEmail(),data.password),adminRef=sdk.doc(sdk.db,'admins',credential.user.uid);if(!(await sdk.getDoc(adminRef)).exists())await sdk.setDoc(adminRef,{email:credential.user.email,createdAt:Date.now()});if(!await isAdmin(sdk,credential.user)){await sdk.signOut(sdk.auth);fail('Bu akkaunt admin sifatida sozlanmagan. Firebase qo‘llanmasini tekshiring.')}return {user:{id:credential.user.uid,name:'Administrator',username:'admin'},csrf:'firebase'};
  }
  if(path==='/auth/logout'){const sdk=await getFirebase();await sdk.signOut(sdk.auth);return {ok:true}}

  if((path==='/api/quizzes'&&method==='GET')||path==='/api/state'){
   const sdk=await waitForAuth();if(!await isAdmin(sdk))fail('Admin login va parolini kiriting.');return adminState(sdk);
  }
  const quizMatch=path.match(/^\/api\/quizzes\/([^/]+)$/);
  if((path==='/api/quizzes'&&method==='POST')||quizMatch){
   const sdk=await waitForAuth();if(!await isAdmin(sdk))fail('Admin ruxsati kerak.');
   if(method==='DELETE'){const id=quizMatch[1],batch=sdk.writeBatch(sdk.db),players=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'players'),sdk.where('quizId','==',id)));players.forEach(item=>batch.delete(item.ref));batch.delete(sdk.doc(sdk.db,'quizzes',id));await batch.commit();return {ok:true}}
   const quizzes=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'quizzes'),sdk.where('pin','==',data.pin)));if(quizzes.docs.some(item=>item.id!==quizMatch?.[1]))fail('Bu kod band. Boshqa 6 xonali kod tanlang.');
   const id=quizMatch?.[1]||randomId(),quiz={...clean(data),id,ownerId:sdk.auth.currentUser.uid,createdAt:data.createdAt||Date.now(),version:(data.version||0)+1};await sdk.setDoc(sdk.doc(sdk.db,'quizzes',id),quiz);return {quiz};
  }
  if(path==='/api/results/reset'){const sdk=await waitForAuth();if(!await isAdmin(sdk))fail('Admin ruxsati kerak.');const snap=await sdk.getDocs(sdk.collection(sdk.db,'players')),batch=sdk.writeBatch(sdk.db);snap.forEach(item=>batch.delete(item.ref));await batch.commit();return {ok:true}}

  if(path==='/api/resolve'){
   const sdk=await ensureAnonymous();if(!/^\d{6}$/.test(data.pin||''))fail('6 xonali kodni kiriting.');const snap=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'quizzes'),sdk.where('pin','==',data.pin),sdk.where('status','==','active'))),quiz=queryData(snap)[0];if(!quiz)fail('Kod topilmadi yoki test hali ochilmagan.');runtime.ticket=quiz;return {quiz:quizInfo(quiz),ticket:quiz.id};
  }
  if(path==='/api/play/join'){
   const sdk=await ensureAnonymous(),quiz=runtime.ticket?.id===data.ticket?runtime.ticket:docData(await sdk.getDoc(sdk.doc(sdk.db,'quizzes',data.ticket)));if(!quiz||quiz.status!=='active')fail('Test o‘zgardi yoki yopildi. Kodni qayta kiriting.');if(!data.name?.trim()||!avatars.includes(data.avatar))fail('Ism va avatarni kiriting.');const id=randomId(),now=Date.now(),player={id,uid:sdk.auth.currentUser.uid,quizId:quiz.id,name:data.name.trim(),avatar:data.avatar,score:0,correct:0,answers:0,startedAt:now,responses:[]};await sdk.setDoc(sdk.doc(sdk.db,'players',id),player);const current={playerId:id,quiz:clean(quiz),index:0,deadline:now+quiz.questions[0].time*1000,feedback:null,finished:false};save('game',current);return playState(current,player,await ranking(sdk,quiz.id));
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
  if(path==='/api/race/activate'){const sdk=await waitForAuth();if(!await isAdmin(sdk))fail('Admin ruxsati kerak.');const quizzes=queryData(await sdk.getDocs(sdk.collection(sdk.db,'quizzes'))),unique=new Map();for(const quiz of quizzes)for(const question of quiz.questions||[])if(question.type==='test'&&question.options?.length===4&&!unique.has(question.text))unique.set(question.text,question);if(unique.size<10)fail('1v1 poyga uchun kamida 10 ta variantli test savoli kerak.');const source=[...unique.values()].sort(()=>Math.random()-.5),id=randomId(),questions=source.slice(0,10).map((question,index)=>({...clean(question),id:`${id}-${index+1}`})),race={id,title:'1v1 Bilim poygasi',active:true,phase:'lobby',questions,racers:[],winnerId:null,createdAt:Date.now(),startsAt:null,startedAt:null};await sdk.setDoc(sdk.doc(sdk.db,'live','race'),race);return {race:raceSummary(race)}}
  if(path==='/api/race/stop'){const sdk=await waitForAuth();if(!await isAdmin(sdk))fail('Admin ruxsati kerak.');await sdk.setDoc(sdk.doc(sdk.db,'live','race'),{active:false,phase:'closed',closedAt:Date.now()},{merge:true});return {ok:true}}
  if(path==='/api/race/join'){const sdk=await ensureAnonymous(),ref=sdk.doc(sdk.db,'live','race'),player={id:randomId(),uid:sdk.auth.currentUser.uid,name:data.name?.trim(),avatar:data.avatar,ready:false,index:0,correct:0,attempts:0,joinedAt:Date.now()};if(!player.name||!avatars.includes(player.avatar))fail('Ism va avatarni kiriting.');await sdk.runTransaction(sdk.db,async transaction=>{const snap=await transaction.get(ref),race=snap.data();if(!race?.active||race.phase!=='lobby')fail('Poygaga hozir qo‘shilib bo‘lmaydi.');if(race.racers.length>=2)fail('Poygada ikki o‘rin ham band.');transaction.update(ref,{racers:[...race.racers,player]})});const current={raceId:(await sdk.getDoc(ref)).data().id,playerId:player.id,feedback:null};save('race',current);return raceState((await sdk.getDoc(ref)).data(),current)}
  if(path.startsWith('/api/race/')){
   const sdk=await ensureAnonymous(),current=runtime.race||load('race'),ref=sdk.doc(sdk.db,'live','race');if(!current)fail('Poyga sessiyasi tugagan. Qayta qo‘shiling.');await advanceRace(sdk);
   if(path==='/api/race/session')return raceState((await sdk.getDoc(ref)).data(),current);
   if(path==='/api/race/ready'){await sdk.runTransaction(sdk.db,async transaction=>{const snap=await transaction.get(ref),race=snap.data(),racers=race.racers.map(player=>player.id===current.playerId?{...player,ready:true}:player),ready=racers.length===2&&racers.every(player=>player.ready);transaction.update(ref,{racers,...(ready?{phase:'countdown',startsAt:Date.now()+3000}:{})})});return raceState((await sdk.getDoc(ref)).data(),current)}
   if(path==='/api/race/answer'){await sdk.runTransaction(sdk.db,async transaction=>{const snap=await transaction.get(ref),race=snap.data();if(!race.active||!['running','countdown'].includes(race.phase)||(race.phase==='countdown'&&Date.now()<race.startsAt)||race.winnerId)fail('Poyga hozir javob qabul qilmaydi.');const player=race.racers.find(item=>item.id===current.playerId),question=race.questions[player.index],correct=data.value===question.correct,at=Date.now();current.feedback={correct,at,retryAt:correct?0:at+1000};const racers=race.racers.map(item=>item.id===player.id?{...item,attempts:item.attempts+1,index:item.index+Number(correct),correct:item.correct+Number(correct),...(correct&&item.index+1===race.questions.length?{finishedAt:at}:{})}:item),won=correct&&player.index+1===race.questions.length;transaction.update(ref,{phase:won?'finished':'running',racers,...(won?{winnerId:player.id,finishedAt:at}:{})})});save('race',current);return raceState((await sdk.getDoc(ref)).data(),current)}
   if(path==='/api/race/leave'){await sdk.runTransaction(sdk.db,async transaction=>{const snap=await transaction.get(ref);if(!snap.exists())return;const race=snap.data(),opponent=race.racers.find(item=>item.id!==current.playerId),racers=race.racers.filter(item=>item.id!==current.playerId);transaction.update(ref,race.phase==='running'&&opponent&&!race.winnerId?{racers,winnerId:opponent.id,phase:'finished',finishedAt:Date.now()}:{racers,phase:'lobby',startsAt:null})});save('race',null);return {ok:true}}
  }

  if(path==='/api/typing/active'){const sdk=await ensureAnonymous(),settings=(await sdk.getDoc(sdk.doc(sdk.db,'settings','app'))).data()||{};return {active:!!settings.typingActive,stageCount:5,title:'O‘zbekcha Typing Akademiyasi'}}
  if(path==='/api/typing/status'){const sdk=await waitForAuth();if(!await isAdmin(sdk))fail('Admin ruxsati kerak.');await sdk.setDoc(sdk.doc(sdk.db,'settings','app'),{typingActive:!!data.active,typingActivatedAt:data.active?Date.now():null},{merge:true});return {typing:(await adminState(sdk)).typing}}
  if(path==='/api/typing/results/reset'){const sdk=await waitForAuth();if(!await isAdmin(sdk))fail('Admin ruxsati kerak.');const snap=await sdk.getDocs(sdk.collection(sdk.db,'typingResults')),batch=sdk.writeBatch(sdk.db);snap.forEach(item=>batch.delete(item.ref));await batch.commit();return {ok:true}}
  if(path==='/api/typing/join'){const sdk=await ensureAnonymous(),settings=(await sdk.getDoc(sdk.doc(sdk.db,'settings','app'))).data()||{};if(!settings.typingActive)fail('Typing mashqi hozir PASSIVE. Admin yoqishini kuting.');if(!data.name?.trim()||!avatars.includes(data.avatar))fail('Ism va avatarni kiriting.');const current={playerId:randomId(),uid:sdk.auth.currentUser.uid,name:data.name.trim(),avatar:data.avatar,index:0,results:[],stageStartedAt:null,feedback:null};save('typing',current);return typingState(current)}
  if(path.startsWith('/api/typing/')){
   const sdk=await ensureAnonymous(),current=runtime.typing||load('typing');if(!current||current.uid!==sdk.auth.currentUser.uid)fail('Typing sessiyasi tugagan. Qayta qo‘shiling.');const settings=(await sdk.getDoc(sdk.doc(sdk.db,'settings','app'))).data()||{};if(path!=='/api/typing/leave'&&!settings.typingActive)fail('Typing mashqi hozir PASSIVE.');
   if(path==='/api/typing/session')return typingState(current);
   if(path==='/api/typing/start'){current.stageStartedAt=current.stageStartedAt||Date.now();current.feedback=null;save('typing',current);return typingState(current)}
   if(path==='/api/typing/submit'){const stage=typingLessons[current.index];if(!stage||!current.stageStartedAt)fail('Avval bosqichni boshlang.');const metrics=typingMetrics(stage.text,data.value||'',Date.now()-current.stageStartedAt),result={stage:stage.level,title:stage.title,...metrics};current.feedback=result;current.stageStartedAt=null;if(metrics.passed){current.results.push(result);current.index++;if(current.index>=5){const averageAccuracy=Math.round(current.results.reduce((sum,item)=>sum+item.accuracy,0)/5*10)/10,averageWpm=Math.round(current.results.reduce((sum,item)=>sum+item.wpm,0)/5);await sdk.setDoc(sdk.doc(sdk.db,'typingResults',current.playerId),{uid:current.uid,name:current.name,avatar:current.avatar,averageAccuracy,averageWpm,totalSeconds:Math.round(current.results.reduce((sum,item)=>sum+item.seconds,0)*10)/10,completedAt:Date.now(),stages:current.results})}}save('typing',current);return typingState(current)}
   if(path==='/api/typing/leave'){save('typing',null);return {ok:true}}
  }
  fail('Funksiya topilmadi.');
 }catch(error){
  const messages={'auth/invalid-credential':'Login yoki parol noto‘g‘ri.','auth/operation-not-allowed':'Firebase’da kerakli login usuli yoqilmagan.','permission-denied':'Firebase Security Rules ruxsat bermadi. Sozlash qo‘llanmasini tekshiring.'};throw Error(messages[error.code]||error.message||'Firebase so‘rovi bajarilmadi.');
 }
}

export function subscribeFirebase(handlers){
 let stopped=false,unsubs=[];
 const listen=async()=>{try{const sdk=await waitForAuth();if(stopped)return;const user=sdk.auth.currentUser;
  if(await isAdmin(sdk,user)){let timer;const refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>firebaseApi('/api/quizzes').then(handlers.onState).catch(()=>{}),80)};for(const target of [sdk.collection(sdk.db,'quizzes'),sdk.collection(sdk.db,'players'),sdk.collection(sdk.db,'typingResults'),sdk.doc(sdk.db,'live','race'),sdk.doc(sdk.db,'settings','app')])unsubs.push(sdk.onSnapshot(target,refresh,()=>{}));refresh()}
  const game=runtime.game||load('game');if(game){unsubs.push(sdk.onSnapshot(sdk.query(sdk.collection(sdk.db,'players'),sdk.where('quizId','==',game.quiz.id)),snapshot=>handlers.onRanking?.(rankRows(queryData(snapshot).map(publicPlayer))),()=>{}));unsubs.push(sdk.onSnapshot(sdk.doc(sdk.db,'quizzes',game.quiz.id),snapshot=>{if(!snapshot.exists()||snapshot.data().status!=='active')handlers.onClosed?.()},()=>{}))}
  const race=runtime.race||load('race');if(race)unsubs.push(sdk.onSnapshot(sdk.doc(sdk.db,'live','race'),snapshot=>{const value=snapshot.data();if(!value?.active)handlers.onRaceClosed?.();else try{handlers.onRace?.(raceState(value,race))}catch{}},()=>{}));
  const typing=runtime.typing||load('typing');if(typing)unsubs.push(sdk.onSnapshot(sdk.doc(sdk.db,'settings','app'),snapshot=>{if(!snapshot.data()?.typingActive)handlers.onTypingClosed?.()},()=>{}));
 }catch(error){handlers.onError?.(error)}};listen();return()=>{stopped=true;unsubs.forEach(stop=>stop())};
}
