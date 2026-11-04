import React from 'react';
import {ArrowRight,BookOpen,Brain,Code2,Compass,Flag,Gamepad2,GraduationCap,Headphones,Keyboard,Languages,Leaf,Mic,Orbit,Ruler,Trophy,Landmark} from 'lucide-react';
import {PaperBrand,PaperButton} from './PaperUI.jsx';
import ClassJoinForm from './ClassJoinForm.jsx';
import StudioArt from '../StudioArt.jsx';
import {appFeatures} from '../speaking/features.js';
import {uiCopy} from '../ui-copy.js';
import './notebook-home.css';

// Navigation metadata only: atlas content, viewers and model files remain in
// their route chunks instead of loading with the home page.
const subjectRoutes=[
 {id:'informaticsAtlas',subject:'informatics',title:'Informatika',icon:Code2,action:'onInformatics'},
 {id:'biology',subject:'biology',title:'Biologiya',icon:Leaf,action:'onBiology'},
 {id:'mathAtlas',subject:'math',title:'Matematika',icon:Ruler,action:'onAtlas'},
 {id:'historyAtlas',subject:'history',title:'Tarix',icon:Landmark,action:'onHistory'},
 {id:'englishCourse',subject:'english',title:'Ingliz tili',icon:Languages,action:'onEnglishCourse'},
 {id:'chemistry',subject:'chemistry',title:'Kimyo',icon:Compass,action:'onChemistry'},
 {id:'space',subject:'space',title:'Fizika',icon:Orbit,action:'onSpace'},
].map(subject=>({...subject,description:appFeatures.find(f=>f.id===subject.id)?.description||''}));

function AtlasDesk({onOpen}){
 return <section className="sq-atlas-desk" aria-labelledby="sq-atlas-desk-title">
  <div className="sq-desk-caption"><span className="sq-index-label">02 / KO‘RING VA TEKSHIRING</span><h2 id="sq-atlas-desk-title">Bir mavzu.<br/>Turli qarashlar.</h2></div>
  <div className="sq-desk-objects" aria-hidden="true">
   <div className="sq-desk-object sq-desk-computer"><StudioArt subject="informatics"/><span>Informatika</span></div>
   <div className="sq-desk-object sq-desk-plant"><StudioArt subject="biology"/><span>Biologiya</span></div>
   <div className="sq-desk-object sq-desk-solid"><StudioArt subject="math"/><span>Matematika</span></div>
   <div className="sq-desk-object sq-desk-history"><StudioArt subject="history"/><span>Tarix</span></div>
   <span className="sq-margin-note">Qismlarni atlasda ko‘ring.</span>
  </div>
  <div className="sq-desk-footer"><span>Sxematik fan chizmalari</span><button type="button" onClick={onOpen}>3D atlaslarni ko‘rish <ArrowRight size={18}/></button></div>
 </section>;
}

export default function PaperHome(props){
 const {user,onJoin,onCatalog,onAtlasHub,onExerciseHub,onCompetitions,onIQ,onAudioMaze,onEnglishCourse,onPractice,onNational,onCefr,onSpeaking,race,typing,onRace,onTyping}=props;
 const subjects=subjectRoutes.filter(s=>typeof props[s.action]==='function');
 const extra=[{icon:Brain,title:'IQ va mantiq',detail:'Savollar va yechimlar tahlili',onClick:onIQ},{icon:Headphones,title:'Audio labirint',detail:'Inglizcha tinglash mashqlari',onClick:onAudioMaze},{icon:Code2,title:'Tayyor testlar',detail:'Python, ingliz tili va matematika',onClick:onPractice},{icon:GraduationCap,title:'Milliy test',detail:'Variantlar va javoblar tahlili',onClick:onNational},{icon:Headphones,title:'CEFR / Multilevel',detail:'Til ko‘nikmalari bo‘yicha mashqlar',onClick:onCefr},{icon:BookOpen,title:'Ingliz tili darslari',detail:'Tinglash, o‘qish va kundalik suhbat',onClick:onEnglishCourse}];
 return <main className="landing pw-home sq-notebook-home">
  <div className="sq-home-main">
   <section className="sq-home-start" aria-labelledby="pw-home-title"><span className="sq-index-label"><span className="sq-index-cross" aria-hidden="true">+</span> {uiCopy.home.eyebrow}</span><h1 id="pw-home-title">Test ishlang. <br/><span>Mavzuni o‘rganing.</span></h1><p className="sq-hero-description">{uiCopy.home.description}</p>
    <section className="sq-code-panel" aria-labelledby="sq-code-title"><span className="sq-cut-mark" aria-hidden="true"/><div className="sq-code-heading"><span className="sq-index-label">01 / BOSHLASH</span><h2 id="sq-code-title">{uiCopy.join.title}</h2><p>{uiCopy.join.description}</p></div><ClassJoinForm onResolved={onJoin}/></section>
   </section>
   <section id="paper-subjects" className="sq-home-subjects" aria-labelledby="sq-subjects-title"><header className="sq-section-heading"><div><span className="sq-index-label">03 / FANLAR</span><h2 id="sq-subjects-title">Faningizni tanlang.</h2><p>O‘rganmoqchi bo‘lgan mavzudan boshlang.</p></div><button type="button" onClick={onCatalog}>Darsliklar <ArrowRight size={17}/></button></header><div className="sq-subject-rows">{subjects.map((s,i)=><button type="button" key={s.id} onClick={props[s.action]} className="sq-subject-row"><span className="sq-subject-ordinal">{String(i+1).padStart(2,'0')}</span><s.icon size={23} strokeWidth={1.6}/><span><b>{s.title}</b><small>{s.description}</small></span><ArrowRight size={18}/></button>)}</div></section>
   <AtlasDesk onOpen={onAtlasHub}/>
   <section className="sq-home-speaking" aria-labelledby="sq-home-speaking-title"><span className="sq-index-label">04 / AI SPEAKING</span><div className="sq-speaking-wave" aria-hidden="true">{Array.from({length:21},(_,i)=><i key={i} style={{'--wave-height':[12,24,38,18,52,72,44,84,60,104,124,76,96,52,72,40,58,28,38,20,12][i]+'px'}}/>)}</div><h2 id="sq-home-speaking-title">Inglizcha gapirishni mashq qiling.</h2><p>Savollarga ovozli javob bering. So‘ng javoblaringiz tahlili va mashqlarni ko‘ring.</p><div className="sq-speaking-formats"><span>IELTS Speaking</span><span>Multilevel Speaking</span></div>{onSpeaking&&<PaperButton variant="primary" onClick={onSpeaking}><Mic size={18}/>Speaking sinovini boshlash<ArrowRight size={18}/></PaperButton>}<p className="sq-speaking-note">Javoblaringiz va rejangiz hisobingizda saqlanadi.</p></section>
  </div>
  <section className="sq-home-tools" aria-labelledby="sq-home-tools-title"><header className="sq-section-heading"><div><span className="sq-index-label">05 / AMALIY ISHLAR</span><h2 id="sq-home-tools-title">Mashq qilishni davom ettiring.</h2></div><button type="button" onClick={onExerciseHub}>Barcha mashqlar <ArrowRight size={17}/></button></header><div className="studio-home-shortcuts sq-home-shortcuts">{[{title:'Darsliklar',detail:'Mavzu va amaliy topshiriqlar',icon:BookOpen,go:onCatalog},{title:'3D Atlas',detail:'Model, qismlar va kuzatishlar',icon:Compass,go:onAtlasHub},{title:'Mashqlar',detail:'Piano, labirint va amaliy ishlar',icon:Gamepad2,go:onExerciseHub},{title:'Musobaqalar',detail:'Ustoz ochgan jamoaviy sinovlar',icon:Trophy,go:onCompetitions}].map((a,i)=><button type="button" key={a.title} onClick={a.go}><span className="sq-index-label">0{i+1}</span><a.icon size={26} strokeWidth={1.5}/><b>{a.title}</b><small>{a.detail}</small><ArrowRight size={18}/></button>)}</div></section>
  {(race?.active&&race.phase==='lobby'&&race.playerCount<2||typing?.active)&&<section className="active-lessons sq-active-lessons" aria-label="Ustoz ochgan mashqlar"><h2>Hozir ochiq</h2><div>{race?.active&&race.phase==='lobby'&&race.playerCount<2&&<article><Flag size={24}/><h3>{race.title||'1v1 bilim poygasi'}</h3><p>Ikki ishtirokchi uchun. {race.questionCount} ta savol.</p><PaperButton variant="primary" onClick={()=>onRace(race)}>Poygaga kirish</PaperButton></article>}{typing?.active&&<article><Keyboard size={24}/><h3>Ingliz tili va tez yozish</h3><p>Tinglab yozish va klaviatura mashqlari.</p><PaperButton variant="primary" onClick={()=>onTyping(typing)}>Mashqni boshlash</PaperButton></article>}</div></section>}
  <section className="sq-practice-index" aria-label="Qo‘shimcha mashqlar">{extra.filter(a=>a.onClick).map(a=><button type="button" key={a.title} onClick={a.onClick}><a.icon size={21}/><span><b>{a.title}</b><small>{a.detail}</small></span><ArrowRight size={17}/></button>)}</section>
  <footer className="pw-footer sq-home-footer"><PaperBrand/><span>{uiCopy.brand.tagline}</span><small>{user?.name?user.name+' · shaxsiy hisob':'Kod bilan testga kirish uchun hisob ochish shart emas.'}</small></footer>
 </main>;
}
