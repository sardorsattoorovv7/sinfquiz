import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeStudioSearch,findStudioRoutes,studioViewHash,restoredStudioView} from '../src/studio-navigation.js';

test('Studio search accepts whitespace and Uzbek apostrophe variants and finds practical tools',()=>{
 const routes=[{id:'catalog',label:'Informatika amaliyoti',detail:'Python, Word, Excel va PowerPoint'},
  {id:'biology',label:'Biologiya atlasi',detail:'O‘simliklar va tirik tabiat'},
  {id:'mathAtlas',label:'Matematika atlasi',detail:'Sonlar va shakllar'},
  {id:'catalog',label:'Dublikat'}];
 assert.deepEqual(findStudioRoutes(routes,'  eXceL  Word ').map(x=>x.id),['catalog']);
 assert.deepEqual(findStudioRoutes(routes,"o'simliklar").map(x=>x.id),['biology']);
 assert.deepEqual(findStudioRoutes(routes,' MATEMATIKA   ').map(x=>x.id),['mathAtlas']);
 assert.equal(findStudioRoutes(routes,'   ').length,3);
 assert.equal(findStudioRoutes(routes,'<script>unknown</script>').length,0);
 assert.equal(normalizeStudioSearch('  OʻQUVCHI\t '),"o'quvchi");
});

test('Studio restores top-level routes on reload without granting guest or staff a student profile',()=>{
 const student={id:'student-1',role:'student'},teacher={id:'teacher-1',role:'teacher'};
 for(const view of ['profile','chat','catalog','practice','national','cefrManaged']){
  const hash='#'+studioViewHash(view);
  assert.equal(restoredStudioView(hash,student),view);
  assert.equal(restoredStudioView(hash,null),null);
 }
 assert.equal(restoredStudioView('#profil',teacher),null);
 assert.equal(restoredStudioView('#suhbatlar',teacher),null);
 assert.equal(restoredStudioView('#informatika',teacher),'catalog');
 assert.equal(restoredStudioView('#profil',{id:'guest',role:'anonymous'}),null);
 for(const hash of ['#dashboard','#play','#race','#typing','#national-test','#iq','#unknown'])assert.equal(restoredStudioView(hash,student),null);
 assert.equal(studioViewHash('untrusted'),null);
});
