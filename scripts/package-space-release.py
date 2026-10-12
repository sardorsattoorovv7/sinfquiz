"""Verify the 7.30 evidence and preserve every baseline file before packaging."""
import pathlib,zipfile,json,hashlib,re,sys
root=pathlib.Path(__file__).resolve().parents[1]
baseline=pathlib.Path(sys.argv[1]);target=pathlib.Path(sys.argv[2]);target.parent.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(baseline.read_bytes())=='48ebc82ead589e3eab26e70201bd610ccf58b582f14d2a5ca55ca4090aca795d'
qa=root/'qa-7.30';tests=(qa/'node-tests.log').read_text();build=(qa/'build.log').read_text()
count=int(re.findall(r'ℹ tests (\d+)',tests)[-1]);passed=int(re.findall(r'ℹ pass (\d+)',tests)[-1]);failed=int(re.findall(r'ℹ fail (\d+)',tests)[-1]);assert count==passed and failed==0 and count>=255
assert 'built in ' in build
space=json.loads((qa/'space/result.json').read_text());assert len(space['scenes'])==52 and len(set(space['scenes']))==52 and not space['errors'] and all(space['checks'].values())
assert (qa/'space/result.json').stat().st_mtime>=(root/'src/space/renderer.js').stat().st_mtime,'Current renderer must be tested'
other={}
for label,name in [('learning','learning-browser.json'),('studio','studio-browser.json'),('competition','results.json'),('play','results.json')]:
 data=json.loads((qa/label/name).read_text());assert not data.get('errors',[])
 if label=='play':assert all(data['checks'].values())
 else:assert data['passed']
 other[label]=data
axe_sets=space['axes']
for label in ['learning','studio','competition']:axe_sets+=json.loads((qa/label/'accessibility.json').read_text())
assert all(not x['violations'] for x in axe_sets)
pkg=json.loads((root/'package.json').read_text());assert pkg['version']=='7.30.0'
chain=json.loads((root/'migration-chain.json').read_text());assert chain['version']=='7.30.0' and len(chain['freshInstall'])==51
assert chain['upgradeFrom7.29']==['supabase-office-amaliy-fix.sql','supabase-migration-7.30.sql']
for f in chain['freshInstall']:assert (root/f).is_file()
assets=json.loads((root/'public/space/v7.30/manifest.json').read_text())
for asset in assets:
 data=(root/'public/space/v7.30'/asset['file']).read_bytes();assert sha(data)==asset['sha256'] and len(data)==asset['bytes']
assert len(re.findall('<loc>',(root/'dist/sitemap.xml').read_text()))==9
all_files=[]
for f in root.rglob('*'):
 if not f.is_file() or f.is_symlink():continue
 rel=f.relative_to(root)
 if any(part in ('node_modules','dist','.git') for part in rel.parts):continue
 if f.name.startswith('.env') and f.name!='.env.example':continue
 if rel.parts[0]=='qa-7.30' and (f.suffix not in ('.json','.log') or 'failure' in f.name):continue
 if f.suffix=='.zip' and rel.parts[0]!='public':continue
 all_files.append((f,'sinf-quiz/'+rel.as_posix()))
with zipfile.ZipFile(baseline) as old:
 assert old.testzip() is None
 old_names=set(old.namelist());new_names={name for f,name in all_files};assert old_names<=new_names,'Old files cannot disappear'
 changed=[];added=[]
 for f,name in all_files:
  if name in old_names:
   different=old.read(name)!=f.read_bytes()
   if different:
    assert not name.startswith('sinf-quiz/public/') and not name.endswith('.sql'),'Existing assets and migrations must remain unchanged'
    changed.append(name.removeprefix('sinf-quiz/'))
  else:added.append(name.removeprefix('sinf-quiz/'))
 report=f'''# SinfQuiz 7.30.0 tekshiruvlari

- Node: {passed}/{count}, xato: {failed}. Model, SQL/RLS, Office tuzatishi va oldingi funksiyalar tekshirildi.
- Build muvaffaqiyatli. Yangi atlas JavaScript va 3D kutubxonalari lazy yuklanadi.
- Brauzer: 52 sahna va {len(space['checks'])} oqim tekshiruvi. {', '.join(space['checks'])}.
- 390 px telefon, 1024 px planshet, 1600 px desktop va 1920 px katta ekran; gorizontal sahifa toshishi aniqlanmadi.
- Axe: {len(axe_sets)} holat, WCAG 2.0/2.1/2.2 A/AA bo‘yicha avtomatik topilgan xato yo‘q. Bu to‘liq qo‘lda accessibility auditi yoki sertifikat emas.
- Python/Office/ingliz tili/IQ; Matematika/Kimyo/biologiya navigatsiyasi; mehmon quiz reytingi, typing, split 1v1; qisman tarkibdagi musobaqa va bosqich taymerlari uchun 4 qo‘shimcha browser suite o‘tdi.
- NASA Yer/Oy aktivlari: {sum(x['bytes'] for x in assets):,} bayt. Geometriya saqlandi, teksturalar optimallashtirildi.
- ZIP baseline fayllarini saqlaydi. Oldingi SQL va public aktivlar baytlari o‘zgarmagan. CRC va barcha paketlangan fayllarning baytlari tekshirildi.

Brauzerda React, Three.js, haqiqiy Python worker va PGlite PostgreSQL ishlatildi. Auth/HTTP transport test fixture bilan berilgan. Production Supabase/Vercel va 40 ta haqiqiy telefon bilan yuklama bu ishda o‘lchanmagan. Animatsiya har kadrda serverga so‘rov yubormaydi. Sahna hisobi ta’limiy; server brauzerdagi fizik modelni qayta attestatsiya qilmaydi.

Dalillar `qa-7.30/`dagi JSON va loglarda. Brauzer suratlari arxivga kiritilmadi. Ishga tushirish va migratsiya: `UPDATE-7.30.md`.
'''
 (root/'QA-7.30.md').write_text(report)
 (root/'CHANGED-FILES-7.30.md').write_text('# 7.30 o‘zgargan fayllar\n\n## O‘zgartirilgan\n\n'+'\n'.join('- `'+x+'`' for x in sorted(changed))+'\n\n## Qo‘shilgan\n\n'+'\n'.join('- `'+x+'`' for x in sorted(added))+'\n')
 receipt={'version':'7.30.0','baselineSha256':sha(baseline.read_bytes()),'baselineFiles':len(old_names),'nodeTests':count,'nodePassed':passed,'spaceScenes':52,'spaceBrowserChecks':space['checks'],'accessibilityStates':len(axe_sets),'otherBrowserSuites':list(other),'assets':assets,'migrationsFrom729':chain['upgradeFrom7.29']}
 (root/'RELEASE-7.30.0.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
 for name in ['QA-7.30.md','CHANGED-FILES-7.30.md','RELEASE-7.30.0.json']:
  pair=(root/name,'sinf-quiz/'+name)
  if pair not in all_files:all_files.append(pair)
 for f,name in all_files:
  if f.suffix in ('.js','.jsx','.mjs','.cjs','.json','.md','.sql','.example'):
   body=f.read_text(errors='replace');assert not re.search(r'sb_secret_[A-Za-z0-9_-]{20,}',body),name
   assert not re.search(r'\b\d{8,12}:AA[A-Za-z0-9_-]{30,}\b',body),name
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for f,name in sorted(all_files,key=lambda pair:pair[1]):z.write(f,name)
 with zipfile.ZipFile(target) as z:
  assert z.testzip() is None and old_names<=set(z.namelist())
  for f,name in all_files:assert z.read(name)==f.read_bytes(),name
 final_sha=sha(target.read_bytes());target.with_suffix('.sha256').write_text(final_sha+'  '+target.name+'\n')
 print(json.dumps({'file':str(target),'bytes':target.stat().st_size,'files':len(all_files),'sha256':final_sha,'tests':count,'axeStates':len(axe_sets)},indent=2))
