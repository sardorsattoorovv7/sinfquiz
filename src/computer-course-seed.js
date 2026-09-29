import {computerCourse} from '../data/computer-course.js';
import {courseGuides} from '../data/course-guides.js';
import {pythonCourse,pythonGuides,pythonLessonContent} from '../data/python-course.js';

const running=new Map();

export function ensureComputerCourse(sdk,profile){
 const uid=sdk.auth.currentUser?.uid;
 if(profile?.role!=='admin'||!uid)return Promise.resolve(false);
 if(running.has(uid))return running.get(uid);
 const task=(async()=>{
  const profileRef=sdk.doc(sdk.db,'profiles',uid);
  const profileSnapshot=await sdk.getDoc(profileRef);
  const version=profileSnapshot.data()?.computerCourseVersion||0;
  if(version>=3)return false;
  const current=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'lessons'),sdk.where('ownerId','==',uid)));
  const existing=new Map(current.docs.map(item=>[item.id,item.data()]));
  const batch=sdk.writeBatch(sdk.db),now=Date.now();
  let changed=0;
  if(version<2)computerCourse.forEach((source,index)=>{
   const id=`computer-course-v1-${uid}-${source.slug}`;
   const guide=courseGuides[source.slug];
   if(existing.has(id)){
    const old=existing.get(id);
    if(old.sourcePackage!=='computer-course-v1'&&old.sourcePackage!=='computer-course-v2')return;
    if(old.courseVersion>=2)return;
    // Avval tahrirlangan matn, ko‘rinish va sanalar saqlanadi.
    batch.set(sdk.doc(sdk.db,'lessons',id),{...old,guide,sourcePackage:'computer-course-v2',courseVersion:2});
    changed++;
    return;
   }
   if(version>=1)return; // O‘chirilgan darslarni qayta tiklamaymiz.
   batch.set(sdk.doc(sdk.db,'lessons',id),{
    id,title:source.title,subject:source.subject,summary:source.summary,
    content:source.content,cover:source.cover,visibility:'public',
    ownerId:uid,ownerName:profile.name||'SinfQuiz administratori',
    courseOrder:index+1,sourcePackage:'computer-course-v2',courseVersion:2,guide,
    createdAt:now,updatedAt:now-index,
   });
   changed++;
  });
  // v3 faqat yangi Python darslarini qo‘shadi; admin tahriri va o‘chirishini saqlaydi.
  pythonCourse.forEach((source,index)=>{
   const id=`python-course-v3-${uid}-${source.slug}`;
   if(existing.has(id)||version>=3)return;
   batch.set(sdk.doc(sdk.db,'lessons',id),{
    id,title:`${index+1}. ${source.title}`,subject:'Python',summary:source.summary,
    content:pythonLessonContent(source),cover:'PY',visibility:'public',
    ownerId:uid,ownerName:profile.name||'SinfQuiz administratori',
    courseOrder:index+1,courseTotal:pythonCourse.length,sourcePackage:'python-course-v3',courseVersion:3,
    guide:pythonGuides[source.slug],createdAt:now,updatedAt:now-index,
   });
   changed++;
  });
  if(changed)await batch.commit();
  await sdk.setDoc(profileRef,{uid,role:'admin',name:profile.name||'Administrator',
   computerCourseVersion:3,computerCourseInstalledAt:profileSnapshot.data()?.computerCourseInstalledAt||now},{merge:true});
  return changed>0;
 })();
 running.set(uid,task);
 return task.finally(()=>running.delete(uid));
}
