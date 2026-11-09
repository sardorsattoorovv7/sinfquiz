import React,{useEffect,useState,useRef} from "react";

import {supabaseReady,recordActivity} from "./supabase-sdk.js";

import {useActivityGuard} from "./useActivityGuard.js";
import {usePanelData} from './usePanelData.js';
import {confirmUnsavedNavigation} from "./useUnsavedChanges.js";

import {canUseClassroom} from "./classroom/model.js";

import {restoredStudioView,studioViewHash} from "./studio-navigation.js";

import {api,setPlayerCsrf,setRaceCsrf,setTypingCsrf,setTeacherCsrf,subscribeRealtime} from "./api.js";

import StudioShell,{StudioHub} from "./StudioShell.jsx";

import {PaperNotice,PaperSkeleton,PaperBrand} from "./paper/PaperUI.jsx";

import EnglishAudioMaze from "./lazy-audio-maze.jsx";

import {playSound} from "./effects.jsx";

import {Settings} from "lucide-react";

import PaperHome from "./paper/PaperHome.jsx";

import {deferredView} from './deferred-view.jsx';
import {afterStyles,loadStudyStyles,loadAdminStyles,loadLegacyStyles} from './lazy-styles.js';

import './app-core.css';

import './studio.css';

import './paper/paper-tokens.css';

import './paper/paper-workshop.css';

const SpeakingHub=deferredView(()=>import('./speaking/SpeakingHub.jsx'));
const AiGuide=deferredView(()=>import('./speaking/AiGuide.jsx'));
const GuideWelcome=React.lazy(()=>import('./speaking/GuideWelcome.jsx'));

const AdminLogin=deferredView(afterStyles(()=>import("./app-views/AuthViews.jsx"),loadLegacyStyles),"AdminLogin");

const AuthPortal=deferredView(afterStyles(()=>import("./app-views/AuthViews.jsx"),loadLegacyStyles),"AuthPortal");

export const StudentCatalog=deferredView(afterStyles(()=>import("./app-views/StudentViews.jsx"),loadStudyStyles),"StudentCatalog");

export const LessonReader=deferredView(afterStyles(()=>import("./app-views/StudentViews.jsx"),loadStudyStyles),"LessonReader");

const NationalCatalog=deferredView(afterStyles(()=>import("./app-views/NationalViews.jsx"),loadStudyStyles),"NationalCatalog");

export const NationalExam=deferredView(afterStyles(()=>import("./app-views/NationalViews.jsx"),loadStudyStyles),"NationalExam");

const AdminPanel=deferredView(afterStyles(()=>import("./app-views/AdminViews.jsx"),loadAdminStyles),"AdminPanel");

const Join=deferredView(afterStyles(()=>import("./app-views/SessionViews.jsx"),loadStudyStyles),"Join");

const RaceJoin=deferredView(afterStyles(()=>import("./app-views/SessionViews.jsx"),loadStudyStyles),"RaceJoin");

const TypingJoin=deferredView(afterStyles(()=>import("./app-views/SessionViews.jsx"),loadStudyStyles),"TypingJoin");

const RaceScreen=deferredView(afterStyles(()=>import("./app-views/SessionViews.jsx"),loadStudyStyles),"RaceScreen");

const TypingScreen=deferredView(afterStyles(()=>import("./app-views/SessionViews.jsx"),loadStudyStyles),"TypingScreen");

const PlayQuiz=deferredView(afterStyles(()=>import("./app-views/SessionViews.jsx"),loadStudyStyles),"PlayQuiz");

const Result=deferredView(afterStyles(()=>import("./app-views/SessionViews.jsx"),loadStudyStyles),"Result");

const CefrHub=React.lazy(afterStyles(()=>import('./CefrHub.jsx'),loadStudyStyles));

const OpenExamHub=React.lazy(afterStyles(()=>import('./OpenExamHub.jsx'),loadStudyStyles));

const CefrWorkspace=React.lazy(afterStyles(()=>import('./CefrWorkspace.jsx'),loadStudyStyles));

const ClassroomChat=React.lazy(()=>import('./ClassroomChat.jsx'));

const StudentProfile=React.lazy(()=>import('./StudentProfile.jsx'));

const SpaceAtlas=React.lazy(()=>import('./space/SpaceAtlas.jsx'));

const HistoryAtlas=React.lazy(()=>import('./HistoryAtlas.jsx'));
const AtlasHub=React.lazy(()=>import('./AtlasHub.jsx'));

const MathAtlas=React.lazy(()=>import('./MathAtlas.jsx'));

const InformaticsAtlas=React.lazy(()=>import('./InformaticsAtlas.jsx'));

const EnglishCourse=React.lazy(afterStyles(()=>import('./EnglishCourse.jsx'),loadStudyStyles));

const TeamCompetitions=React.lazy(()=>import('./TeamCompetitions.jsx'));

const CinemaPiano=React.lazy(()=>import('./CinemaPiano.jsx'));

const BiologyAtlas=React.lazy(()=>import('./BiologyAtlas.jsx'));

const ChemistryAtlas=React.lazy(()=>import('./ChemistryAtlas.jsx'));

const Classroom=React.lazy(()=>import('./Classroom.jsx'));

const TextbookHub=React.lazy(afterStyles(()=>import('./TextbookHub.jsx'),loadStudyStyles));

const IQHub=React.lazy(()=>import('./IQHub.jsx'));

const BookPractice=React.lazy(afterStyles(()=>import('./BookPractice.jsx'),loadStudyStyles));

function App(){
  useEffect(()=>{document.documentElement.dataset.design='paper'},[]);
  const deploymentReady=supabaseReady()||globalThis.__SINFQUIZ_LEGACY_TEST__===true;
  const [view,setView]=useState(()=>location.hash==='#ai-speaking'?'speaking':location.hash==='#ai-yordamchi'?'aiGuide':location.hash==='#tarix-atlasi'?'historyAtlas':location.hash==='#biologiya'?'biology':location.hash==='#informatika-atlasi'?'informaticsAtlas':'home');const [selectedLesson,setSelectedLesson]=useState(null);const [chatLessonId,setChatLessonId]=useState(null);
  const [user,setUser]=useState(null);const [authReady,setAuthReady]=useState(false);const [initialDataReady,setInitialDataReady]=useState(false);const [navOpen,setNavOpen]=useState(false);
  const {db,setDb,catalog,setCatalog,reload,panelPending,panelError,retryPanel,dbReady}=usePanelData(user,view,authReady);
  const navigationHash=useRef(location.hash);
  useEffect(()=>{navigationHash.current=location.hash;setNavOpen(false)},[view]);
  const [spaceActive,setSpaceActive]=useState(false);
  const [speakingActive,setSpeakingActive]=useState(false);
  const [guideOrigin,setGuideOrigin]=useState(null);
  useEffect(()=>{if(authReady&&!user)setSpaceActive(false)},[authReady,user]);
  const [englishActive,setEnglishActive]=useState(false);
  const [iqActive,setIqActive]=useState(()=>sessionStorage.getItem('sq_active_hash')==='#iq');
  const [englishInitialLessonId,setEnglishInitialLessonId]=useState(null);
  const [atlasInitialTopic,setAtlasInitialTopic]=useState(null);
  const [practiceBook,setPracticeBook]=useState(null);
  const [selectedBookId,setSelectedBookId]=useState(null);
  const [lessonOrigin,setLessonOrigin]=useState('catalog');
  const [adminInitialSection,setAdminInitialSection]=useState(null);
  const [competitionActive,setCompetitionActive]=useState(()=>sessionStorage.getItem('sq_active_hash')==='#musobaqa');const [cefrActive,setCefrActive]=useState(false);const [practiceSubject,setPracticeSubject]=useState('all');const [audioMazePlaying,setAudioMazePlaying]=useState(false);const [pianoActive,setPianoActive]=useState(false);
  const [entry,setEntry]=useState(null);const [game,setGame]=useState(null);const [raceGame,setRaceGame]=useState(null);const [typingGame,setTypingGame]=useState(null);const [nationalGame,setNationalGame]=useState(null);const [cefrGame,setCefrGame]=useState(null);const [toast,setToast]=useState('');const [connection,setConnection]=useState('');
  const notify=message=>setToast(message);
  const inActivity=speakingActive||spaceActive||iqActive||englishActive||competitionActive||cefrActive||audioMazePlaying||pianoActive||['play','result','race','typing','nationalExam','cefrExam'].includes(view);
  const unfinished=speakingActive||spaceActive||iqActive||englishActive||competitionActive||cefrActive||audioMazePlaying||pianoActive||(view==='play'&&!game?.finished)||(view==='race'&&raceGame?.race?.phase!=='finished')||(view==='typing'&&!typingGame?.finished)||(view==='nationalExam'&&!nationalGame?.finished)||(view==='cefrExam'&&!cefrGame?.finished);
  useActivityGuard({active:authReady?unfinished:!!sessionStorage.getItem('sq_active_hash'),hash:!authReady?(sessionStorage.getItem('sq_active_hash')||location.hash):cefrActive?(view==='practice'?'#open-exam':view==='cefrManaged'?'#cefr-test':'#cefr-source'):location.hash});
  useEffect(()=>{
    if(!authReady)return;
    const open=()=>{
      if(inActivity)return;
      if(!confirmUnsavedNavigation()){history.replaceState(null,'',location.pathname+location.search+navigationHash.current);return;}
      navigationHash.current=location.hash;
      if(location.hash==='#ai-speaking'){setView('speaking');return;}
      if(location.hash==='#ai-yordamchi'){setView('aiGuide');return;}
      if(location.hash==='#tarix-atlasi'){setView('historyAtlas');return;}
      if(location.hash==='#biologiya'){setView('biology');return;}
      if(location.hash==='#informatika-atlasi'){setView('informaticsAtlas');return;}
      if(location.hash==='#atlaslar'){setView('atlasHub');return;}
      setView(current=>{
        if(location.hash==='#sinfxona')return canUseClassroom(user)?'classroom':'classroomDenied';
        if(!['classroom','classroomDenied','informaticsAtlas','historyAtlas','biology','atlasHub','speaking','aiGuide'].includes(current))return current;
        const publicViews={'#atlaslar':'atlasHub','#mashqlar':'exerciseHub','#ingliz-darsi':'englishCourse','#kino-piano':'cinemaPiano'};
        const accountViews={'#koinot':'space','#matematika':'mathAtlas','#kimyo':'chemistry','#biologiya':'biology','#darsliklar':'books','#iq':'iq','#musobaqa':'competitions','#audio-maze':'audioMaze'};
        return restoredStudioView(location.hash,user)||publicViews[location.hash]||(user&&accountViews[location.hash])||'home';
      });
    };
    open();window.addEventListener('hashchange',open);
    return()=>window.removeEventListener('hashchange',open);
  },[authReady,user?.id,user?.role,inActivity]);
  const applyGame=next=>{setConnection('');setPlayerCsrf(next.csrf);setGame(next);setView(next.finished?'result':'play');location.hash='play'};
  const applyRace=next=>{setConnection('');setRaceCsrf(next.csrf);setRaceGame(next);setView('race');location.hash='race'};
  const applyTyping=next=>{setConnection('');setTypingCsrf(next.csrf);setTypingGame(next);setView('typing');location.hash='typing'};
  const applyNational=next=>{setConnection('');setNationalGame(next);setView('nationalExam');location.hash='national-test'};
  const applyCefr=next=>{setConnection('');setCefrGame(next);setView('cefrExam');location.hash='cefr-mock'};
  useEffect(()=>{const online=()=>setConnection(''),offline=()=>setConnection('Internet aloqasi uzildi. Tugmalar aloqa qaytgach yana ishlaydi.');window.addEventListener('online',online);window.addEventListener('offline',offline);if(!navigator.onLine)offline();return()=>{window.removeEventListener('online',online);window.removeEventListener('offline',offline)}},[]);
  useEffect(()=>{
    if(!deploymentReady){setAuthReady(true);return}
    localStorage.removeItem('sinfquiz_v1');sessionStorage.removeItem('sq_admin');
    const interrupted=sessionStorage.getItem('sq_active_hash');if(interrupted)history.replaceState(null,'',location.pathname+interrupted);
    api('/auth/session').then(async info=>{setUser(info.user);setTeacherCsrf(info.csrf);const restored=restoredStudioView(location.hash,info.user);if(restored)setView(restored);if(location.hash==='#atlaslar')setView('atlasHub');if(location.hash==='#mashqlar')setView('exerciseHub');if(location.hash==='#darsliklar'&&info.user)setView('books');if(location.hash==='#iq'&&info.user)setView('iq');if(location.hash.startsWith('#ingliz-darsi'))setView('englishCourse');if(location.hash==='#musobaqa')setView('competitions');if(location.hash==='#audio-maze')setView('audioMaze');if(location.hash==='#kino-piano')setView('cinemaPiano');if(location.hash==='#cefr-source'&&info.user)setView('cefr');if(location.hash==='#open-exam'&&info.user)setView('practice');if(location.hash==='#cefr-test'&&info.user)setView('cefrManaged');if(location.hash==='#koinot'&&info.user)setView('space');if(location.hash==='#matematika'&&info.user)setView('mathAtlas');if(location.hash==='#biologiya'&&info.user)setView('biology');if(location.hash==='#kimyo'&&info.user)setView('chemistry');setAuthReady(true);if(location.hash==='#dashboard')setView(['teacher','admin'].includes(info.user?.role)?'admin':info.user?'home':'login');if(location.hash==='#play'){try{applyGame(await api('/api/play/session'))}catch{notify('Test yakunlangan. Qayta kirish uchun kodni kiriting.');history.replaceState(null,'',location.pathname)}}if(location.hash==='#race'){try{applyRace(await api('/api/race/session'))}catch{notify('Poyga yakunlangan. Yangi poyga ochilganda qayta kiring.');history.replaceState(null,'',location.pathname)}}if(location.hash==='#typing'){try{applyTyping(await api('/api/typing/session'))}catch{notify('Matn terish mashqi yakunlangan. Qayta kirib ko‘ring.');history.replaceState(null,'',location.pathname)}}if(location.hash==='#national-test'){try{applyNational(await api('/api/national/session'))}catch{setView('national');history.replaceState(null,'',location.pathname)}}if(location.hash==='#cefr-mock'){try{applyCefr(await api('/api/cefr/session'))}catch{setView('cefr');history.replaceState(null,'',location.pathname)}}}).catch(e=>notify(e.message)).finally(()=>{setAuthReady(true);setInitialDataReady(true)});
  },[]);
  useEffect(()=>{const staffLive=view==='admin'&&dbReady&&['teacher','admin'].includes(user?.role),sessionKinds=['play','result'].includes(view)?['play']:view==='race'?['race']:view==='typing'?['typing']:[];if(!staffLive&&!sessionKinds.length)return;const stop=subscribeRealtime({teacherState:staffLive,initialStateLoaded:dbReady,sessionKinds,onState:setDb,onRanking:ranking=>setGame(g=>g?{...g,ranking}:g),onRace:applyRace,onTyping:applyTyping,onClosed:()=>{setGame(null);setView('home');notify('O‘qituvchi testni yakunladi.')},onRaceClosed:()=>{setRaceGame(null);setRaceCsrf('');setView('home');notify('O‘qituvchi 1v1 poygani yopdi.')},onTypingClosed:()=>{setTypingGame(null);setTypingCsrf('');setView('home');notify('Matn terish mashqi yopildi.')},onError:()=>setConnection('Jonli natijalar vaqtincha yangilanmayapti. Internet aloqasini tekshiring.')});if(stop){setConnection('');return stop}},[user?.id,view,dbReady,game?.player?.id,raceGame?.playerId,typingGame?.playerId]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(t)},[toast]);
  useEffect(()=>{if(!user||globalThis.__SINFQUIZ_LEGACY_TEST__===true)return;let stopped=false;recordActivity('login').catch(()=>{});const beat=()=>{if(!stopped&&!document.hidden)recordActivity('heartbeat').catch(()=>{})},timer=setInterval(beat,120000);document.addEventListener('visibilitychange',beat);return()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',beat)}},[user?.id]);
  const resetHome=()=>{setView('home');history.replaceState(null,'',location.pathname)};
  const home=()=>{if(confirmUnsavedNavigation())resetHome()};
  const openAuth=()=>{if(confirmUnsavedNavigation())setView('login')};
  const openEnglish=lessonId=>{if(!confirmUnsavedNavigation())return;setEnglishInitialLessonId(typeof lessonId==='string'?lessonId:null);setView('englishCourse');location.hash='ingliz-darsi'};
  const openBooks=()=>{if(!confirmUnsavedNavigation())return;if(!user)return openAuth();setView('books');location.hash='darsliklar'};
  const openIQ=()=>{if(!confirmUnsavedNavigation())return;if(!user)return openAuth();setView('iq');location.hash='iq'};
  const bookActivity=book=>{setAtlasInitialTopic(book.topicId||null);if(book.subject==='informatics'){setPracticeBook(book);setView('bookPractice');return}setView(book.subject==='chemistry'?'chemistry':'biology');location.hash=book.subject==='chemistry'?'kimyo':'biologiya'};
  const openCompetitions=()=>{if(!confirmUnsavedNavigation())return;setView('competitions');location.hash='musobaqa'};
  const login=async credentials=>{const info=await api('/auth/login',{method:'POST',data:credentials});setTeacherCsrf(info.csrf);setUser(info.user);setView('admin');location.hash='dashboard'};
  const telegramLoggedIn=async()=>{const info=await api('/auth/session');setTeacherCsrf(info.csrf);setUser(info.user);const returnView=sessionStorage.getItem('sq_ai_return');if(['speaking','aiGuide'].includes(returnView)){sessionStorage.removeItem('sq_ai_return');setView(returnView);location.hash=returnView==='speaking'?'ai-speaking':'ai-yordamchi';return;}if(['teacher','admin'].includes(info.user?.role)){setView('admin');location.hash='dashboard'}else{setView('home');history.replaceState(null,'',location.pathname)}};
  const logout=async()=>{if(!confirmUnsavedNavigation())return;try{if(user&&globalThis.__SINFQUIZ_LEGACY_TEST__!==true)await recordActivity('logout').catch(()=>{});await api('/auth/logout',{method:'POST'});setUser(null);setDb({quizzes:[],publicQuizzes:[],lessons:[],players:[]});setCatalog({quizzes:[],lessons:[]});setTeacherCsrf('');setGame(null);setRaceGame(null);setTypingGame(null);setNationalGame(null);setCefrGame(null);resetHome()}catch(e){notify(e.message)}};
  const leave=async()=>{try{await api('/api/play/leave',{method:'POST',role:'player'});setGame(null);setPlayerCsrf('');home()}catch(e){notify(e.message)}};
  const leaveRace=async()=>{try{await api('/api/race/leave',{method:'POST',role:'race'});setRaceGame(null);setRaceCsrf('');home()}catch(e){notify(e.message)}};
  const leaveTyping=async()=>{try{await api('/api/typing/leave',{method:'POST',role:'typing'});setTypingGame(null);setTypingCsrf('');home()}catch(e){notify(e.message)}};
  const openStudio=(id,initialTopic=null)=>{
    if(inActivity||!confirmUnsavedNavigation())return;
    if(id==='home')return home();
    if(['speaking','aiGuide'].includes(id)){if(id==='aiGuide'&&view!=='aiGuide')setGuideOrigin(view);setView(id);location.hash=id==='speaking'?'ai-speaking':'ai-yordamchi';return;}
    if(id==='subjects'){home();requestAnimationFrame(()=>document.getElementById('paper-subjects')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}));return;}
    if(id==='login')return openAuth();
    if(id==='books')return openBooks();
    if(id==='iq')return openIQ();
    if(id==='englishCourse')return openEnglish();
    if(id==='historyAtlas'){setAtlasInitialTopic(initialTopic);setView('historyAtlas');location.hash='tarix-atlasi';return;}
    if(id==='biology'){setAtlasInitialTopic(initialTopic);setView('biology');location.hash='biologiya';return;}
    if(id==='informaticsAtlas'){setAtlasInitialTopic(initialTopic);setView('informaticsAtlas');location.hash='informatika-atlasi';return;}
    if(id==='competitions')return openCompetitions();
    if(id==='cinemaPiano'){setView('cinemaPiano');location.hash='kino-piano';return;}
    if(id==='audioMaze'){setView('audioMaze');location.hash='audio-maze';return;}
    if(['atlasHub','exerciseHub'].includes(id)){setView(id);location.hash=id==='atlasHub'?'atlaslar':'mashqlar';return;}
    if(id==='livePractice'){home();requestAnimationFrame(()=>document.querySelector('.active-lessons')?.scrollIntoView({behavior:'smooth'}));return;}
    if(!user)return openAuth();
    if(id==='classroom'){if(!canUseClassroom(user)){notify('Sinfxona faqat ustoz va administrator uchun.');return;}setView('classroom');location.hash='sinfxona';return;}
    if(id==='admin'||id==='createQuiz'||(id==='results'&&['teacher','admin'].includes(user.role))){if(!['teacher','admin'].includes(user.role))return;setAdminInitialSection(id==='createQuiz'?'createQuiz':id==='results'?'results':null);setView('admin');location.hash='dashboard';return;}
    if(id==='results'){setView('profile');location.hash=studioViewHash('profile');return;}
    if(id==='chat'){setChatLessonId(null);if(user.role==='student'){setView('chat');location.hash=studioViewHash('chat');return;}setAdminInitialSection('chats');setView('admin');location.hash='dashboard';return;}
    if(id==='space'){setAtlasInitialTopic(initialTopic);setView('space');location.hash='koinot';return;}
    if(['mathAtlas','biology','chemistry'].includes(id)){setAtlasInitialTopic(initialTopic);setView(id);location.hash={mathAtlas:'matematika',biology:'biologiya',chemistry:'kimyo'}[id];return;}
    if(id==='practice')setPracticeSubject('all');
    if(['catalog','practice','national','cefrManaged'].includes(id)){setView(id);location.hash=studioViewHash(id);}
  };
  if(!deploymentReady&&!['informaticsAtlas','historyAtlas','biology','atlasHub','speaking','aiGuide'].includes(view))return <SupabaseSetupRequired onInformatics={()=>openStudio('informaticsAtlas')}/>;
  return <StudioShell {...{user,view,inActivity,unfinished,authReady}} onNavigate={openStudio} onLogout={logout} onJoin={setEntryAndJoin}>
    {toast&&<PaperNotice className="toast" onDismiss={()=>setToast('')}>{toast}</PaperNotice>}{connection&&<PaperNotice className="connection-banner" kind="warning">{connection}</PaperNotice>}
    {panelError&&<PaperNotice kind="error">{panelError}<button className="btn btn-outline" onClick={retryPanel}>Qayta urinish</button></PaperNotice>}
    {(!authReady&&(view!=='home'||!!location.hash&&location.hash!=='#home')||panelPending||!initialDataReady&&['race','typing','play','nationalExam','cefrExam'].includes(view))?<PaperSkeleton label="Yuklanmoqda…"/>:<>
    {view==='speaking'&&<SpeakingHub key={user?.id||'guest'} user={user} onNavigate={openStudio} onActive={setSpeakingActive} onLogin={()=>{sessionStorage.setItem('sq_ai_return','speaking');openAuth();}}/>}
    {view==='aiGuide'&&<AiGuide key={user?.id||'guest'} user={user} currentView="aiGuide" originView={guideOrigin} onNavigate={openStudio} onLogin={()=>{sessionStorage.setItem('sq_ai_return','aiGuide');openAuth();}}/>}
    {user&&<React.Suspense fallback={null}><GuideWelcome user={user} hidden={inActivity||['aiGuide','speaking','englishCourse','books','bookPractice','lesson','iq'].includes(view)} onNavigate={openStudio}/></React.Suspense>}
    {view==='atlasHub'&&<React.Suspense fallback={<PaperSkeleton label="Atlaslar markazi ochilmoqda…"/>}><AtlasHub user={user} onNavigate={openStudio}/></React.Suspense>}
    {view==='exerciseHub'&&<StudioHub type="exercise" onNavigate={openStudio}/>}
    {view==='classroom'&&canUseClassroom(user)&&<React.Suspense fallback={<PaperSkeleton label="Sinfxona ochilmoqda…"/>}><Classroom user={user} onBack={home}/></React.Suspense>}
    {(view==='classroomDenied'||view==='classroom'&&!canUseClassroom(user))&&<main className="learning-page"><h1>Sinfxona ustozlar uchun</h1><p>Elektron doska va dars vositalaridan faqat o‘qituvchi va administrator foydalanadi.</p><button className="btn btn-primary" onClick={user?home:openAuth}>{user?'Bosh sahifaga qaytish':'Hisobga kirish'}</button></main>}
    {view==='home'&&<Landing authReady={authReady} onSpeaking={()=>openStudio('speaking')} onHistory={()=>openStudio('historyAtlas')} onSpace={()=>openStudio('space')} onAtlasHub={()=>openStudio('atlasHub')} onExerciseHub={()=>openStudio('exerciseHub')} onIQ={openIQ} onEnglishCourse={openEnglish} onCompetitions={openCompetitions} onBiology={()=>openStudio('biology')} onChemistry={()=>{if(!user)return openAuth();setAtlasInitialTopic(null);setView('chemistry');location.hash='kimyo'}} user={user} catalog={catalog} onAudioMaze={()=>{setView('audioMaze');location.hash='audio-maze'}} onNational={()=>user?setView('national'):openAuth()} onCefr={()=>{if(!user)return openAuth();setView('cefrManaged')}} onPractice={()=>{if(!user)return openAuth();setPracticeSubject('all');setView('practice')}} onCatalog={openBooks} onInformatics={()=>openStudio('informaticsAtlas')} onAtlas={()=>{if(!user)return openAuth();setView('mathAtlas');location.hash='matematika'}} onJoin={setEntryAndJoin} onRace={offer=>{setEntry({race:offer});setView('raceJoin')}} onTyping={offer=>{setEntry({typing:offer});setView('typingJoin')}}/>}
    {view==='historyAtlas'&&<React.Suspense fallback={<PaperSkeleton label="Tarix atlasi ochilmoqda…"/>}><HistoryAtlas key={`${user?.id||'guest'}:${atlasInitialTopic||'home'}`} user={user} initialTopicId={atlasInitialTopic} onBack={()=>openStudio('atlasHub')}/></React.Suspense>}
    {view==='informaticsAtlas'&&<React.Suspense fallback={<PaperSkeleton label="Informatika atlasi ochilmoqda…"/>}><InformaticsAtlas key={`${user?.id||'guest'}:${atlasInitialTopic||'home'}`} initialTab={atlasInitialTopic} user={user} onBack={()=>openStudio('atlasHub')} onPractice={deploymentReady?()=>openStudio('catalog'):undefined}/></React.Suspense>}
    {view==='englishCourse'&&<React.Suspense fallback={<PaperSkeleton label="Ingliz tili darsi ochilmoqda…"/>}><EnglishCourse key={user?.id||'guest'} initialLessonId={englishInitialLessonId} user={user} onBack={englishInitialLessonId?openBooks:home} onLogin={openAuth} onMaze={()=>{setEnglishActive(false);setView('audioMaze');location.hash='audio-maze'}} onSpeaking={()=>openStudio('speaking')} onActive={setEnglishActive}/></React.Suspense>}
    {view==='competitions'&&<React.Suspense fallback={<PaperSkeleton label="Musobaqalar ochilmoqda…"/>}><TeamCompetitions key={user?.id||'guest'} user={user} onBack={home} onLogin={openAuth} onActive={setCompetitionActive}/></React.Suspense>}
    {view==='space'&&user&&<React.Suspense fallback={<PaperSkeleton label="Koinot atlasi ochilmoqda…"/>}><SpaceAtlas key={`${user.id}:${atlasInitialTopic||'overview'}`} initialTopicId={atlasInitialTopic} user={user} onBack={()=>{setSpaceActive(false);setView('atlasHub');location.hash='atlaslar'}} onActive={setSpaceActive}/></React.Suspense>}
    {view==='biology'&&<React.Suspense fallback={<PaperSkeleton label="Biologiya atlasi ochilmoqda…"/>}><BiologyAtlas key={`${user?.id||'guest'}:${atlasInitialTopic||'home'}`} user={user||{id:'guest',name:'Mehmon',role:'guest'}} initialTopicId={atlasInitialTopic} onBack={()=>openStudio('atlasHub')}/></React.Suspense>}
    {view==='chemistry'&&user&&<React.Suspense fallback={<PaperSkeleton label="Kimyo atlasi ochilmoqda…"/>}><ChemistryAtlas user={user} initialTopicId={atlasInitialTopic} onBack={()=>openStudio('atlasHub')}/></React.Suspense>}
    {view==='mathAtlas'&&user&&<React.Suspense fallback={<PaperSkeleton label="Matematika atlasi ochilmoqda…"/>}><MathAtlas key={`${user.id}:${atlasInitialTopic||'overview'}`} initialTopicId={atlasInitialTopic} user={user} onBack={()=>openStudio('atlasHub')}/></React.Suspense>}
    {view==='audioMaze'&&<EnglishAudioMaze user={user} notify={notify} onBack={home} onPlayingChange={active=>{setAudioMazePlaying(active);if(active)location.hash='audio-maze';else if(location.hash==='#audio-maze')history.replaceState(null,'',location.pathname)}}/>}
    {view==='cinemaPiano'&&<React.Suspense fallback={<PaperSkeleton label="Kino Piano ochilmoqda…"/>}><CinemaPiano key={user?.id||'guest'} user={user} onActive={setPianoActive} onBack={()=>{setPianoActive(false);setView('exerciseHub');location.hash='mashqlar'}}/></React.Suspense>}
    {view==='login'&&(globalThis.__SINFQUIZ_LEGACY_TEST__===true?<AdminLogin onBack={home} onLogin={login}/>:<AuthPortal onBack={home} onDone={telegramLoggedIn}/>)} 
    {view==='iq'&&user&&<React.Suspense fallback={<PaperSkeleton label="IQ va mantiq mashqlari ochilmoqda…"/>}><IQHub key={user.id} user={user} onBack={home} onActive={setIqActive}/></React.Suspense>}
    {view==='books'&&user&&<React.Suspense fallback={<PaperSkeleton label="Darsliklar ochilmoqda…"/>}><TextbookHub key={user.id} user={user} onBack={home} onEnglish={openEnglish} onCatalog={()=>setView('catalog')} onActivity={bookActivity} onDocument={(lesson,bookId)=>{setSelectedLesson(lesson);setSelectedBookId(bookId);setLessonOrigin('books');setView('lesson')}} onManage={['teacher','admin'].includes(user.role)?()=>{setAdminInitialSection('lessons');setView('admin');location.hash='dashboard'}:null}/></React.Suspense>}
    {view==='bookPractice'&&user&&practiceBook&&<React.Suspense fallback={<PaperSkeleton label="Amaliyot ochilmoqda…"/>}><BookPractice key={practiceBook.id} book={practiceBook} user={user} onBack={openBooks}/></React.Suspense>}
    {view==='catalog'&&user&&<StudentCatalog ownerId={user.id} catalog={catalog} onBack={home} onJoinPin={async pin=>setEntryAndJoin(await api('/api/resolve',{method:'POST',data:{pin}}))} onBooks={openBooks} onLesson={lesson=>{setSelectedLesson(lesson);setSelectedBookId(null);setLessonOrigin('catalog');setView('lesson')}} onChats={()=>openStudio('chat')} onProfile={user.role==='student'?()=>openStudio('results'):null}/>}
    {view==='profile'&&user?.role==='student'&&<React.Suspense fallback={<PaperSkeleton label="Profil ochilmoqda…"/>}><StudentProfile user={user} onBack={home} onSaved={profile=>setUser(old=>({...old,name:profile.name,school:profile.school,className:profile.className}))}/></React.Suspense>}
    {view==='lesson'&&selectedLesson&&<LessonReader key={selectedLesson.id} lesson={selectedLesson} bookId={selectedBookId} onBack={lessonOrigin==='books'?openBooks:()=>setView('catalog')} onRead={count=>setCatalog(old=>({...old,lessons:old.lessons.map(item=>item.id===selectedLesson.id?{...item,readCount:count}:item)}))} onChat={user?.role==='student'?()=>{setChatLessonId(selectedLesson.id);setView('chat')}:null} nextLesson={catalog.lessons.find(item=>item.ownerId===selectedLesson.ownerId&&item.subject===selectedLesson.subject&&item.courseOrder===selectedLesson.courseOrder+1)} onNext={lesson=>{setSelectedLesson(lesson);window.scrollTo({top:0,behavior:'smooth'})}}/>}
    {view==='chat'&&user?.role==='student'&&<React.Suspense fallback={<PaperSkeleton label="Suhbat ochilmoqda…"/>}><ClassroomChat key={chatLessonId||'inbox'} user={user} lessonId={chatLessonId} onBack={()=>{if(chatLessonId){setView('lesson');location.hash=lessonOrigin==='books'?'darsliklar':'informatika';}else openStudio('catalog');}}/></React.Suspense>}
    {view==='national'&&user&&<NationalCatalog onPractice={()=>{setPracticeSubject('all');setView('practice')}} onBack={home} onStart={async id=>applyNational(await api('/api/national/start',{method:'POST',data:{sectionId:id}}))}/>} 
    {view==='nationalExam'&&nationalGame&&<NationalExam game={nationalGame} onUpdate={applyNational} onExit={async()=>{await api('/api/national/leave',{method:'POST'}).catch(()=>{});setNationalGame(null);setView('national');history.replaceState(null,'',location.pathname)}}/>}
    {view==='practice'&&user&&<React.Suspense fallback={<PaperSkeleton label="Testlar ochilmoqda…"/>}><OpenExamHub key={user.id} user={user} onBack={home} onStatus={setCefrActive} initialSubject={practiceSubject}/></React.Suspense>}
    {view==='cefrManaged'&&user&&<React.Suspense fallback={<PaperSkeleton label="CEFR ochilmoqda…"/>}><CefrHub user={user} onBack={home} onPractice={()=>{setPracticeSubject('english');setView('practice')}} onStatus={setCefrActive}/></React.Suspense>}
    {view==='cefr'&&user&&<React.Suspense fallback={<PaperSkeleton label="CEFR ochilmoqda…"/>}><CefrWorkspace user={user} onBack={home} onStatus={setCefrActive}/></React.Suspense>} 
    {view==='cefrExam'&&<section className="source-page"><h1>Eski demo sessiyasi</h1><p>Bu variant rasmiy CEFR materiali emas. Yangi manbalar bo‘limiga o‘ting.</p><button className="btn btn-primary" onClick={async()=>{await api('/api/cefr/leave',{method:'POST'}).catch(()=>{});setCefrGame(null);setView('cefr');history.replaceState(null,'',location.pathname)}}>Sessiyani tugatish</button></section>}
    {view==='admin'&&['teacher','admin'].includes(user?.role)&&<AdminPanel key={`${user.id}:${adminInitialSection||'default'}`} initialSection={adminInitialSection} onBooks={openBooks} onIQ={openIQ} onEnglishCourse={openEnglish} user={user} db={db} reload={reload} onCompetitions={openCompetitions} onHome={home} onAtlas={()=>openStudio('mathAtlas')} notify={notify} onLogout={logout}/>}
    {view==='join'&&entry&&<Join quiz={entry.quiz} onBack={home} onStart={async p=>{const next=await api('/api/play/join',{method:'POST',data:{ticket:entry.ticket,name:p.name,avatar:p.avatar}});playSound('arena');applyGame(next)}}/>}
    {view==='raceJoin'&&entry?.race&&<RaceJoin race={entry.race} onBack={home} onStart={async player=>{const next=await api('/api/race/join',{method:'POST',data:player});playSound('arena');applyRace(next)}}/>}
    {view==='typingJoin'&&entry?.typing&&<TypingJoin offer={entry.typing} onBack={home} onStart={async player=>applyTyping(await api('/api/typing/join',{method:'POST',data:player}))}/>} 
    {view==='race'&&raceGame&&<RaceScreen game={raceGame} onUpdate={applyRace} onLeave={leaveRace}/>} 
    {view==='typing'&&typingGame&&<TypingScreen game={typingGame} onUpdate={applyTyping} onLeave={leaveTyping}/>} 
    {view==='play'&&game&&<PlayQuiz game={game} onUpdate={applyGame}/>}
    {view==='result'&&game&&<Result quiz={{...game.quiz,questions:Array(game.quiz.questionCount)}} player={game.player} db={{players:game.ranking}} onHome={leave} onRefresh={async()=>applyGame(await api('/api/play/session',{role:'player'}))}/>}
        {view==='home'&&<nav className="studio-public-links" aria-label="Fanlar haqida"><a href="/fanlar/informatika">Informatika</a><a href="/fanlar/matematika">Matematika</a><a href="/fanlar/fizika">Fizika</a><a href="/fanlar/kimyo">Kimyo</a><a href="/fanlar/biologiya">Biologiya</a><a href="/ingliz-tili">Ingliz tili</a><a href="/darsliklar">Darsliklar haqida</a><a href="/ustozlar/sinfxona">Sinfxona haqida</a></nav>}
    </>}
  </StudioShell>;
  function setEntryAndJoin(data){if(!confirmUnsavedNavigation())return;setEntry(data);setView('join')}
}

function SupabaseSetupRequired({onInformatics}){
 const local=import.meta.env.DEV;
 return <main className="firebase-setup-page paper-workshop"><section><PaperBrand/><div className="firebase-setup-icon"><Settings/></div><span>DASTLABKI SOZLASH</span><h1>Saytni Supabase bilan ulang</h1><p>{local?'Lokal server Supabase loyiha URL manzili va publishable/anon kalitini topolmadi.':'Sayt Supabase loyiha URL manzili va publishable/anon kalitini topolmadi.'}</p><div className="firebase-setup-steps">{local?<><div><b>1</b><span>Loyiha papkasidagi `.env.local` faylini oching.</span></div><div><b>2</b><span>`VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` ga haqiqiy qiymatlarni kiriting.</span></div><div><b>3</b><span>Terminalda `npm run dev` jarayonini to‘xtatib, qayta ishga tushiring.</span></div></>:<><div><b>1</b><span>Vercel Environment Variables bo‘limiga `VITE_SUPABASE_URL` ni kiriting.</span></div><div><b>2</b><span>`VITE_SUPABASE_ANON_KEY` ga publishable/anon kalitni kiriting.</span></div><div><b>3</b><span>Saytni qayta deploy qiling.</span></div></>}</div><small>`.env.example` namuna fayl; undagi qiymatlar saytga avtomatik ulanmaydi. Maxfiy server kalitini hech qachon `VITE_` bilan nomlamang.</small><button className="btn btn-primary" onClick={onInformatics} style={{marginTop:20}}>Informatika atlasini ochish</button></section></main>
}

function Landing(props){
  const [race,setRace]=useState(null),[typing,setTyping]=useState(null);
  useEffect(()=>{if(!props.authReady)return;let alive=true,timer;const load=async()=>{if(document.hidden){timer=setTimeout(load,15000);return}try{const data=await api('/api/race/active');if(alive)setRace(data.active?data:null)}catch{}finally{if(alive)timer=setTimeout(load,15000)}};load();return()=>{alive=false;clearTimeout(timer)}},[props.authReady]);
  useEffect(()=>{if(!props.authReady)return;let alive=true,timer;const load=async()=>{if(document.hidden){timer=setTimeout(load,18000);return}try{const data=await api('/api/typing/active');if(alive)setTyping(data.active?data:null)}catch{}finally{if(alive)timer=setTimeout(load,18000)}};load();return()=>{alive=false;clearTimeout(timer)}},[props.authReady]);
  return <PaperHome {...props} race={race} typing={typing}/>;
}

export default App;
