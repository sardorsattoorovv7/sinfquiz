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

const hashes={profile:'profil',chat:'suhbatlar',catalog:'informatika',practice:'open-exam',national:'milliy-testlar',cefrManaged:'cefr-test',classroom:'sinfxona'};
export const studioViewHash=view=>hashes[view]||null;
export function restoredStudioView(hash,user){
 if(!user||!['student','teacher','admin'].includes(user.role))return null;
 const view=Object.keys(hashes).find(key=>`#${hashes[key]}`===hash);
 if(!view)return null;
 if(view==='classroom'&&(!user.id||!['teacher','admin'].includes(user.role)))return null;
 if(['profile','chat'].includes(view)&&user.role!=='student')return null;
 return view;
}
