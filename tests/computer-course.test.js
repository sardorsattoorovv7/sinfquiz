import test from 'node:test';
import assert from 'node:assert/strict';
import {computerCourse,computerCourseModules} from '../data/computer-course.js';
import {courseGuides} from '../data/course-guides.js';
import {pythonCourse,pythonGuides,pythonLessonContent} from '../data/python-course.js';
import {ensureComputerCourse} from '../src/computer-course-seed.js';
import {readFile} from 'node:fs/promises';
import {mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

function mockDatabase(uid){
 const rows=new Map();
 const key=ref=>`${ref.collection}/${ref.id}`;
 const sdk={db:{},auth:{currentUser:{uid}},
  doc:(_db,collection,id)=>({collection,id}),
  collection:(_db,collection)=>({collection}),
  where:(field,op,value)=>({field,op,value}),
  query:(ref,filter)=>({...ref,filter}),
  getDoc:async ref=>({exists:()=>rows.has(key(ref)),data:()=>rows.get(key(ref))}),
  getDocs:async ref=>({docs:[...rows].filter(([k,value])=>k.startsWith(ref.collection+'/')&&(!ref.filter||value[ref.filter.field]===ref.filter.value)).map(([k,value])=>({id:k.split('/')[1],data:()=>value}))}),
  setDoc:async(ref,value,options)=>rows.set(key(ref),options?.merge?{...rows.get(key(ref)),...value}:value),
  writeBatch:()=>{const pending=[];return {set:(ref,value)=>pending.push([ref,value]),commit:async()=>{for(const [ref,value] of pending)rows.set(key(ref),value)}}},
 };
 return {sdk,rows};
}

test('admin course seeds once, remains public, and preserves edits and deletions',async()=>{
 const uid='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
 const {sdk,rows}=mockDatabase(uid);
 const profile={role:'admin',name:'Administrator'};
 assert.equal(await ensureComputerCourse(sdk,{role:'teacher',name:'Other'}),false);
 assert.equal(rows.size,0);
 assert.equal(await ensureComputerCourse(sdk,profile),true);
 const lessons=[...rows].filter(([k])=>k.startsWith('lessons/'));
 assert.equal(lessons.length,48);
 assert.equal(new Set(lessons.map(([,value])=>value.id)).size,48);
 assert.ok(lessons.every(([,value])=>value.ownerId===uid&&value.visibility==='public'));
 assert.ok(lessons.every(([,value])=>value.guide?.steps.length>=4&&value.courseVersion>=2));
 const firstKey=lessons[0][0],deletedKey=lessons[1][0];
 rows.set(firstKey,{...rows.get(firstKey),content:'Admin tahriri'});
 rows.delete(deletedKey);
 assert.equal(await ensureComputerCourse(sdk,profile),false);
 assert.equal(rows.get(firstKey).content,'Admin tahriri');
 assert.equal(rows.has(deletedKey),false);
 sdk.auth.currentUser.uid=other;
 assert.equal(await ensureComputerCourse(sdk,{role:'teacher',name:'Other'}),false);
 assert.equal([...rows].filter(([k])=>k.startsWith('lessons/')).length,47);
});

test('v1 admin course gains illustrations without replacing edited lessons or deleted rows',async()=>{
 const uid='00000000-0000-0000-0000-000000000003',profile={role:'admin',name:'Direktor'};
 const {sdk,rows}=mockDatabase(uid);
 const first=computerCourse[0],second=computerCourse[1];
 rows.set(`profiles/${uid}`,{computerCourseVersion:1,computerCourseInstalledAt:42});
 rows.set(`lessons/computer-course-v1-${uid}-${first.slug}`,{id:`computer-course-v1-${uid}-${first.slug}`,ownerId:uid,sourcePackage:'computer-course-v1',title:'Admin o‘zgartirdi',content:'O‘zimning matnim',visibility:'private',updatedAt:100});
 assert.equal(await ensureComputerCourse(sdk,profile),true);
 const lesson=rows.get(`lessons/computer-course-v1-${uid}-${first.slug}`);
 assert.equal(lesson.content,'O‘zimning matnim');
 assert.equal(lesson.title,'Admin o‘zgartirdi');
 assert.equal(lesson.visibility,'private');
 assert.equal(lesson.updatedAt,100);
 assert.equal(lesson.guide.slug,first.slug);
 assert.equal(rows.has(`lessons/computer-course-v1-${uid}-${second.slug}`),false);
 assert.equal(rows.get(`profiles/${uid}`).computerCourseVersion,3);
 assert.equal(rows.get(`profiles/${uid}`).computerCourseInstalledAt,42);
});

test('v2 installation adds Python without replacing edited computer lessons',async()=>{
 const uid='00000000-0000-0000-0000-000000000004',profile={role:'admin',name:'Admin'};
 const {sdk,rows}=mockDatabase(uid),first=computerCourse[0];
 rows.set(`profiles/${uid}`,{computerCourseVersion:2});
 rows.set(`lessons/computer-course-v1-${uid}-${first.slug}`,{ownerId:uid,content:'Mening tahririm',title:'Mening darsim'});
 assert.equal(await ensureComputerCourse(sdk,profile),true);
 assert.equal([...rows].filter(([key])=>key.startsWith('lessons/python-course-v3-')).length,20);
 assert.equal(rows.get(`lessons/computer-course-v1-${uid}-${first.slug}`).content,'Mening tahririm');
 rows.delete(`lessons/python-course-v3-${uid}-${pythonCourse[0].slug}`);
 assert.equal(await ensureComputerCourse(sdk,profile),false);
 assert.equal(rows.has(`lessons/python-course-v3-${uid}-${pythonCourse[0].slug}`),false);
});

test('Python curriculum has runnable examples, practical work and answer keys',()=>{
 assert.equal(pythonCourse.length,20);
 assert.equal(new Set(pythonCourse.map(item=>item.slug)).size,20);
 for(const lesson of pythonCourse){
  assert.ok(pythonLessonContent(lesson).length>650);
  assert.ok(pythonLessonContent(lesson).includes('```python'));
  assert.ok(lesson.practice.length>60&&lesson.explain.length>60);
  const guide=pythonGuides[lesson.slug];
  assert.equal(guide.steps.length,4);
  assert.equal(guide.checks.length,2);
  for(const check of guide.checks)assert.ok(check.answer>=0&&check.answer<check.options.length&&check.explanation);
 }
});

test('Python lesson examples produce the stated results',()=>{
 const directory=mkdtempSync(join(tmpdir(),'sinfquiz-python-'));
 try{
  for(const lesson of pythonCourse){
   const result=spawnSync('python3',['-I','-c',lesson.code],{cwd:directory,input:lesson.slug==='python-input'?'12\n':undefined,encoding:'utf8',timeout:3000});
   assert.equal(result.status,0,`${lesson.slug}: ${result.stderr}`);
   const actual=result.stdout.trim().split('\n').map(line=>line.trim());
   const expected=lesson.output.trim().split('\n').map(line=>line.trim());
   if(lesson.slug==='python-input')assert.ok(actual.at(-1).endsWith(expected.at(-1)));
   else assert.deepEqual(actual,expected,lesson.slug);
  }
 }finally{rmSync(directory,{recursive:true,force:true})}
});

test('course has ordered original lessons with an exercise in every module',()=>{
 assert.equal(computerCourse.length,28);
 assert.equal(new Set(computerCourse.map(item=>item.slug)).size,28);
 for(const subject of computerCourseModules){
  assert.ok(computerCourse.filter(item=>item.subject===subject).length>=5);
 }
 assert.ok(computerCourse.every(item=>item.title&&item.summary&&item.content.length>600&&/## (Amaliy mashq|Vazifa)/.test(item.content)&&item.content.includes('## Tekshiring')));
});

test('all 28 course guides have original local SVG, practice and answer feedback',async()=>{
 assert.equal(Object.keys(courseGuides).length,computerCourse.length);
 for(const source of computerCourse){
  const guide=courseGuides[source.slug];
  assert.ok(guide.setup.length>30&&guide.result.length>30&&guide.steps.length>=4&&guide.mistakes.length);
  assert.equal(guide.checks.length,2);
  for(const check of guide.checks)assert.ok(check.question&&check.options.length>=3&&check.answer>=0&&check.answer<check.options.length&&check.explanation);
  const svg=await readFile(new URL(`../public${guide.image}`,import.meta.url),'utf8');
  assert.ok(svg.startsWith('<svg')&&svg.includes('<title')&&svg.includes('TUSHUNTIRUVCHI SXEMA'));
 }
});
