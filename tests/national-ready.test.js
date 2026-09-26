import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {publicationError} from '../src/national-validation.js';

test('Admin national variants have sourced questions, valid keys and reading passages',async()=>{
 const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {nationalReadyVariants}=await vite.ssrLoadModule('/data/national-ready.js');
  assert.deepEqual(nationalReadyVariants.map(v=>v.subject),['Matematika','Ingliz tili']);
  for(const variant of nationalReadyVariants){
   assert.equal(variant.questions.length,30);assert.equal(publicationError(variant),null);
   assert.ok(new Set(variant.questions.map(q=>q.id)).size===30);
   for(const q of variant.questions){
    assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
    assert.equal(q.options[q.correct],q.answer);
    assert.ok(q.sourceUrl.startsWith('https://'));
    assert.ok(q.explanation.length>10);
    if(variant.subject==='Ingliz tili')assert.ok(q.passage.length>50);
   }
  }
  const {ensureNationalDefaults}=await vite.ssrLoadModule('/src/national-defaults.js');
  const docs=new Map(),admin='admin-id',sdk={db:null,auth:{currentUser:{uid:admin}},
   doc:(_,collection,id)=>`${collection}/${id}`,
   getDoc:async ref=>({exists:()=>docs.has(ref),data:()=>docs.get(ref)}),
   setDoc:async(ref,value)=>{docs.set(ref,structuredClone(value))}
  };
  assert.equal(await ensureNationalDefaults(sdk,{role:'student'}),false);
  assert.equal(docs.size,0);
  assert.equal(await ensureNationalDefaults(sdk,{role:'admin'}),true);
  assert.equal(docs.size,3);
  for(const variant of nationalReadyVariants){const row=docs.get('nationalSections/'+variant.id);
   assert.equal(row.ownerId,admin);assert.equal(row.approvalStatus,'approved');
   assert.equal(row.visibility,'public');assert.equal(row.builtin,false);
   assert.equal(publicationError(row),null);
  }
  docs.get('nationalSections/ready-math-75').title='Edited by administrator';
  assert.equal(await ensureNationalDefaults(sdk,{role:'admin'}),false);
  assert.equal(docs.get('nationalSections/ready-math-75').title,'Edited by administrator');
  docs.delete('nationalSections/ready-math-75');
  assert.equal(await ensureNationalDefaults(sdk,{role:'admin'}),false);
  assert.equal(docs.has('nationalSections/ready-math-75'),false);
 }finally{await vite.close()}
});
