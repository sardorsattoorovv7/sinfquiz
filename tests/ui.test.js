import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(dirname(fileURLToPath(import.meta.url)));

test('UI: local admin, code-only student, ready 3D fallback, theme, quiz and result',async()=>{
 const dom=new JSDOM('<!doctype html><html lang="uz"><head><title>SinfQuiz</title></head><body><div id="root"></div></body></html>',{url:'http://localhost:3000',pretendToBeVisual:true});
 for(const key of ['window','document','HTMLElement','Element','Node','MutationObserver','localStorage','sessionStorage','history','location'])globalThis[key]=dom.window[key];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.matchMedia=globalThis.matchMedia;window.scrollTo=()=>{};globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 globalThis.__SINFQUIZ_LEGACY_TEST__=true;
 const React=(await import('react')).default;const {render,screen,cleanup,within}=await import('@testing-library/react');const user=(await import('@testing-library/user-event')).default.setup();
 const vite=await createServer({root,server:{middlewareMode:true},appType:'custom'});
 const bank=JSON.parse(readFileSync(join(root,'data/question-bank.json'))),typingLessons=JSON.parse(readFileSync(join(root,'data/english-typing-lessons.json')));let account=null,records=[],stage=0,raceActive=false,raceModel=null,typingActive=false,typingModel=null;const calls=[];
 const q={id:'ui-q',type:'test',text:'Word nimaga kerak?',options:['Matn yozish','Video','Ovoz','Server'],time:30,points:100,subject:'Word'};
 const player={id:'ui-player',quizId:'ui-quiz',name:'Sinov',avatar:'🤖',score:0,answers:0,correct:0,startedAt:Date.now()};
 const raceQuestion={...q,id:'race-q'};
 const game=()=>({quiz:{id:'ui-quiz',title:'Word darsi',questionCount:1,subject:'Word',group:'8-A'},player:{...player,score:stage?100:0,correct:stage?1:0,answers:stage?1:0,lastEarned:stage?100:0},question:stage===2?null:q,index:0,deadline:Date.now()+30000,serverNow:Date.now(),csrf:'player-test',finished:stage===2,feedback:stage?{ratio:1,earned:100,correct:true,checks:[],correctIndex:0}:null,ranking:[{...player,score:stage?100:0}]});
 globalThis.fetch=async(path,options={})=>{const data=options.body?JSON.parse(options.body):{};calls.push({path,data});let value={},status=200;
  if(path==='/auth/session')value={user:account,csrf:account?'teacher-test':null};
  else if(path==='/auth/login'){if(data.username==='admin'&&data.password==='admin123'){account={id:'local-admin',name:'Administrator',username:'admin'};value={user:account,csrf:'teacher-test'}}else{status=401;value={error:'Login yoki parol noto‘g‘ri.'}}}
  else if(path==='/api/quizzes'&&(!options.method||options.method==='GET'))value={quizzes:records,players:[],race:raceModel?.race||null,typing:{active:typingActive,stageCount:5,studentCount:typingModel?1:0,results:[]}};
  else if(path==='/api/quizzes'&&options.method==='POST'){const quiz={...data,id:'new-quiz',ownerId:'local-admin'};records=[quiz];value={quiz}}
  else if(path==='/api/quizzes/new-quiz'){records=[{...data,id:'new-quiz',ownerId:'local-admin'}];value={quiz:records[0]}}
  else if(path==='/api/resolve'){if(data.pin==='123456')value={quiz:game().quiz,ticket:'fixture-ticket'};else{status=404;value={error:'Kod topilmadi yoki test hali ochilmagan.'}}}
  else if(path==='/api/play/join'){player.name=data.name;player.avatar=data.avatar;value=game()}
  else if(path==='/api/play/answer'){stage=1;value=game()}
  else if(path==='/api/play/next'){stage=2;value=game()}
  else if(path==='/api/play/leave')value={ok:true}
  else if(path==='/api/race/active')value=raceActive?{active:true,id:'race-ui',title:'1v1 Bilim poygasi',phase:raceModel?.race?.phase||'lobby',questionCount:10,playerCount:raceModel?.race?.racers?.length||0}:{active:false}
  else if(path==='/api/race/activate'){raceActive=true;raceModel={race:{id:'race-ui',active:true,title:'1v1 Bilim poygasi',phase:'lobby',questionCount:10,racers:[],winnerId:null},playerId:null,question:null,csrf:'race-test'};value={race:raceModel.race}}
  else if(path==='/api/race/join'){raceModel={race:{...raceModel.race,phase:'running',racers:[{id:'r1',name:data.players[0].name,avatar:data.players[0].avatar,ready:true,index:0},{id:'r2',name:data.players[1].name,avatar:data.players[1].avatar,ready:true,index:0}]},localMode:true,playerIds:['r1','r2'],questions:[raceQuestion,raceQuestion],feedbackByPlayer:{},csrf:'race-test',serverNow:Date.now()};value=raceModel}
  else if(path==='/api/race/ready'){raceModel={...raceModel,race:{...raceModel.race,phase:'running',racers:raceModel.race.racers.map(player=>({...player,ready:true}))},question:raceQuestion,serverNow:Date.now()};value=raceModel}
  else if(path==='/api/race/session')value=raceModel
  else if(path==='/api/race/answer'){raceModel={...raceModel,race:{...raceModel.race,phase:'finished',winnerId:data.playerId,racers:raceModel.race.racers.map(player=>player.id===data.playerId?{...player,index:10,correct:10}:player)},questions:[null,null],feedbackByPlayer:{[data.playerId]:{correct:true,at:Date.now()}}};value=raceModel}
  else if(path==='/api/race/leave'||path==='/api/race/stop'){raceActive=false;value={ok:true}}
  else if(path==='/api/typing/active')value={active:typingActive,stageCount:5,title:'English Typing & Vocabulary',levels:['A1','A2','B1','B2']}
  else if(path==='/api/typing/status'){typingActive=data.active;value={typing:{active:typingActive,stageCount:5,studentCount:0,results:[]}}}
  else if(path==='/api/typing/join'){const lesson=typingLessons.find(item=>item.englishLevel===(data.englishLevel||'A1'));typingModel={active:true,playerId:'typist-1',name:data.name,avatar:data.avatar,courseMode:data.courseMode||'english',englishLevel:data.englishLevel||'A1',entryMode:data.entryMode||'selected',index:0,stageCount:5,stage:{...lesson,wordCount:lesson.text.split(/\s+/).length},stageStartedAt:null,results:[],feedback:null,finished:false,csrf:'typing-test',serverNow:Date.now()};value=typingModel}
  else if(path==='/api/typing/start'){typingModel={...typingModel,stageStartedAt:Date.now(),feedback:null};value=typingModel}
  else if(path==='/api/typing/submit'){const result={stage:1,title:'School routine',wpm:42,accuracy:100,errors:0,seconds:8,passed:true};typingModel={...typingModel,index:5,stage:null,stageStartedAt:null,results:Array(5).fill(result),feedback:result,finished:true};value=typingModel}
  else if(path==='/api/typing/leave'){typingModel=null;value={ok:true}};
  return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
 };
 try{
  const {default:App}=await vite.ssrLoadModule('/src/App.jsx');render(React.createElement(App));
  await screen.findByRole('button',{name:'Admin kirishi'});
  assert.equal(screen.queryByText(/Google/),null);
  assert.equal(screen.queryByText(/Faol testlar/),null);
  assert.ok(screen.getByText(/akkaunt ham, parol ham kerak emas/i));
  const nav=screen.getByRole('navigation',{name:'Asosiy navigatsiya'});assert.ok(within(nav).getByRole('button',{name:'Dark rejimga o‘tish'}));
  await user.click(screen.getByRole('button',{name:'Dark rejimga o‘tish'}));assert.equal(document.documentElement.dataset.theme,'dark');
  await user.click(screen.getByRole('button',{name:'Admin kirishi'}));await screen.findByRole('heading',{name:'Login va parol bilan kirish'});
  assert.ok(screen.getByText(/Parol Firebase Authentication’da yaratiladi/));
  await user.type(screen.getByLabelText('Parol'),'wrong');await user.click(screen.getByRole('button',{name:'Admin paneliga kirish'}));await screen.findByText('Login yoki parol noto‘g‘ri.');
  await user.clear(screen.getByLabelText('Parol'));await user.type(screen.getByLabelText('Parol'),'admin123');await user.click(screen.getByRole('button',{name:'Admin paneliga kirish'}));await screen.findByRole('heading',{name:'Testlar boshqaruvi'});
  assert.equal(document.documentElement.dataset.theme,'dark');
  await user.click(screen.getByRole('button',{name:'1v1 poyga'}));await screen.findByRole('heading',{name:'Ikki o‘quvchi, bir xil 10 savol'});await user.click(screen.getByRole('button',{name:/Poygani yoqish/}));await screen.findByText('O‘quvchilar kutilmoqda');
  await user.click(screen.getByRole('button',{name:'Typing mashqi'}));await screen.findByRole('heading',{name:'Ikki rejimli Typing Akademiyasi'});await user.click(screen.getByRole('button',{name:'PASSIVE'}));await screen.findByRole('button',{name:'ACTIVE'});
  await user.click(screen.getByRole('button',{name:'Testlar'}));await user.click(screen.getByRole('button',{name:'Word',exact:true}));await screen.findByRole('heading',{name:'Testni tahrirlash'});await user.click(screen.getByRole('button',{name:'Saqlash',exact:true}));await screen.findByRole('heading',{name:'Testlar boshqaruvi'});assert.equal(records[0].status,'passive');

  cleanup();account=null;stage=0;history.replaceState(null,'',location.pathname);render(React.createElement(App));await screen.findByLabelText('O‘YIN KODI');
  await user.type(screen.getByLabelText('O‘YIN KODI'),'123456');await user.click(screen.getByRole('button',{name:'Qo‘shilish'}));
  await screen.findByRole('heading',{name:'O‘yinga qo‘shiling'});await user.type(screen.getByPlaceholderText('Ismingizni kiriting'),'Sinov');await user.click(screen.getByRole('button',{name:'Avatar 3',exact:true}));await user.click(screen.getByRole('button',{name:'Maydonga kirish',exact:true}));
  await screen.findByRole('heading',{name:q.text});assert.ok(await screen.findByRole('img',{name:/Tayyor animation clip/}));assert.ok(screen.getByText('3D BILIM ARENA'));
  await user.click(screen.getByRole('button',{name:'A Matn yozish'}));await user.click(screen.getByRole('button',{name:'Javobni yuborish'}));await screen.findByText('Ajoyib! To‘g‘ri javob');
  assert.deepEqual(Object.keys(calls.find(call=>call.path==='/api/play/answer').data).sort(),['questionId','value']);
  await user.click(screen.getByRole('button',{name:'Yakunlash'}));assert.ok((await screen.findAllByText('TEST YAKUNLANDI')).length>=1);assert.ok((await screen.findAllByRole('img',{name:/Tayyor animation clip/})).length);
  cleanup();stage=0;history.replaceState(null,'',location.pathname);render(React.createElement(App));
  await screen.findByRole('button',{name:/Poygaga qo‘shilish/});await user.click(screen.getByRole('button',{name:/Poygaga qo‘shilish/}));await screen.findByRole('heading',{name:'Bitta ekranda 1v1'});
  await user.type(screen.getByPlaceholderText('1-o‘quvchi ismi'),'Ali');await user.type(screen.getByPlaceholderText('2-o‘quvchi ismi'),'Vali');await user.click(screen.getByRole('button',{name:'Split poygani boshlash'}));assert.equal(screen.getAllByRole('img',{name:/Tayyor animation clip/}).length,2);
  assert.equal((await screen.findAllByRole('heading',{name:raceQuestion.text})).length,2);
  await user.click(screen.getAllByRole('button',{name:'A Matn yozish'})[0]);
  await user.click(screen.getAllByRole('button',{name:'Javobni yuborish'})[0]);
  await screen.findByRole('heading',{name:'Ali g‘olib!'});
  cleanup();raceActive=false;history.replaceState(null,'',location.pathname);render(React.createElement(App));await screen.findByRole('button',{name:/Mashqni boshlash/});await user.click(screen.getByRole('button',{name:/Mashqni boshlash/}));await screen.findByRole('heading',{name:'Typing rejimini tanlang'});await user.click(screen.getByRole('button',{name:/Darajani tanlash/}));await user.type(screen.getByPlaceholderText('Ismingizni kiriting'),'Malika');await user.click(screen.getByRole('button',{name:'A1 mashqiga kirish'}));await screen.findByRole('heading',{name:'School routine',level:1});await user.click(screen.getByRole('button',{name:'Tinglash va boshlash'}));const typingBox=await screen.findByPlaceholderText('Masalan: I go to school every day.');await user.type(typingBox,typingLessons[0].text);await user.click(screen.getByRole('button',{name:/Gapni tekshirish/}));await screen.findByRole('heading',{name:'Barakalla, Malika!'});
  console.log('UI checks: local admin, code-only quiz, no-code 1v1 race, split runners, typing ACTIVE/PASSIVE, typing join, answer, winner, theme, 3D fallback and result.');
 }finally{cleanup();delete globalThis.__SINFQUIZ_LEGACY_TEST__;await vite.close();dom.window.close()}
});

test('Theme semantic text contrast meets 4.5:1 for body text',()=>{
 const luminance=hex=>{const a=hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722};
 const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 for(const pair of [['211936','ffffff'],['62536f','ffffff'],['f0eafa','201c31'],['c1b2d0','201c31'],['c1b2d0','29223e'],['ffa8b7','201c31']])assert.ok(ratio(...pair)>=4.5,pair.join('/'));
});
