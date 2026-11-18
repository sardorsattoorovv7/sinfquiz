// Small shared index for navigation; it does not change content permissions.
export function normalizeStudioSearch(value){
 return String(value??'').normalize('NFKC').toLocaleLowerCase('uz')
  .replace(/[ʻʼ‘’`´]/g,"'").replace(/\s+/g,' ').trim();
}

export function findStudioRoutes(routes,query){
 const terms=normalizeStudioSearch(query).split(' ').filter(Boolean),seen=new Set();
 return routes.filter(route=>{
  if(seen.has(route.id))return false;
  seen.add(route.id);
  const text=normalizeStudioSearch(`${route.label||''} ${route.detail||''}`);
  return terms.every(term=>text.includes(term));
 });
}

const hashes={
 speaking:'ai-speaking',aiGuide:'ai-yordamchi',pricing:'tariflar',livePractice:'typing-va-1v1',
 iq:'iq',books:'darsliklar',mathAtlas:'matematika',chemistry:'kimyo',englishCourse:'ingliz-darsi',competitions:'musobaqa',
 historyAtlas:'tarix-atlasi',informaticsAtlas:'informatika-atlasi',cinemaPiano:'kino-piano',
 space:'koinot',profile:'profil',chat:'suhbatlar',catalog:'informatika',practice:'open-exam',
 national:'milliy-testlar',cefrManaged:'cefr-test',classroom:'sinfxona',
};
export const studioViewHash=view=>hashes[view]||null;
const publicViews=new Set(['speaking','aiGuide','pricing','livePractice','iq','historyAtlas','informaticsAtlas','cinemaPiano','englishCourse','competitions']);
const loginViews=new Set([...publicViews,'books','mathAtlas','chemistry','space','results','chat','catalog','practice','national','cefrManaged','classroom','admin','createQuiz']);

export function loginDestination(view,detail){
 if(!loginViews.has(view))return null;
 return {view,detail:typeof detail==='string'?detail.slice(0,120):null};
}

export function restoredStudioView(hash,user){
 if(hash==='#biologiya')return 'biology';
 if(hash==='#kirish')return 'login';
 const view=Object.keys(hashes).find(key=>`#${hashes[key]}`===hash);
 if(publicViews.has(view))return view;
 if(!user||!['student','teacher','admin'].includes(user.role))return null;
 if(!view)return null;
 if(view==='classroom'&&(!user.id||!['teacher','admin'].includes(user.role)))return null;
 if(['profile','chat'].includes(view)&&user.role!=='student')return null;
 return view;
}
