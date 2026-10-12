import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {spaceFixture,teacher,other,students} from './space-fixture.js';
import {topicById,defaultParameters} from '../src/space/content.js';import {observation} from '../src/space/model.js';
test('7.31 catalog-only migration supports real depth work, preserves records and keeps tenant isolation',async()=>{
 const f=await spaceFixture();try{
  const t=topicById('ocean-depth'),p=defaultParameters(t),g=await f.call(teacher,'sq_group_create',['Chuqurlik 8-A']);await f.call(students[0],'sq_group_join',[g.join_code]);
  const c=await f.space(teacher,'save',{topic_id:t.id,title:'Suv bosimi va zichlik',notes:'Ikki xil kabinani bir xil chuqurlikda taqqoslang.',parameters:p,visibility:'group',group_id:g.id});
  const trials=[p,{...p,rating:500}].map(parameters=>({parameters,progress:1,metrics:observation(t,parameters,1).metrics}));
  const n={topic_id:t.id,assignment_id:c.id,client_token:crypto.randomUUID(),prediction:'Bosim chuqurlashganda oshadi.',conclusion:'500 bar kabina bardosh bermadi, 1200 bar kabina modeli chegarada saqlandi.',trials,choice:t.answer,hints:0,wrongChecks:0};
  const a=await f.space(students[0],'submit',n);assert.equal(a.data.trials[0].metrics.length,8);assert.equal(a.student_id,students[0]);assert.equal((await f.space(teacher,'results')).results.length,1);assert.equal((await f.space(other,'results')).results.length,0);await assert.rejects(f.space(students[1],'submit',{...n,client_token:crypto.randomUUID()}),/ruxsat/);
  await f.db.exec('reset role');const old=(await f.db.query('select * from public.sq_space_attempts order by id')).rows;const configs=(await f.db.query('select * from public.sq_space_configs order by id')).rows;
  await f.db.exec(readFileSync(new URL('../supabase-migration-7.31.sql',import.meta.url),'utf8'));await f.db.exec(readFileSync(new URL('../supabase-migration-7.31.sql',import.meta.url),'utf8'));
  assert.deepEqual((await f.db.query('select * from public.sq_space_attempts order by id')).rows,old);assert.deepEqual((await f.db.query('select * from public.sq_space_configs order by id')).rows,configs);assert.equal((await f.db.query('select count(*)::int n from public.sq_space_catalog')).rows[0].n,53);
 }finally{await f.db.close()}
});
