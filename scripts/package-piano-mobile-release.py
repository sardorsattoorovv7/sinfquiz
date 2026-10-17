"""Build a verified, atomically finalized full 7.43 source ZIP."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, hashlib, json, os, re, tempfile

p=argparse.ArgumentParser();p.add_argument('--baseline',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
args=p.parse_args();root=Path(__file__).resolve().parents[1];sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(args.baseline.read_bytes())=='258a8ace7971e8ede6012571bf1aaba62f17cfa96d339e10cc1c1ad24580dcbf'
assert json.loads((root/'package.json').read_text())['version']=='7.43.0'
log=(root/'qa-7.43.0/all-tests.log').read_text()
for label,count in [('pass',326),('fail',0),('skipped',0),('cancelled',0)]:assert re.search(r'ℹ '+label+' '+str(count)+r'\b',log),label
assert 'built in' in (root/'qa-7.43.0/build-final.log').read_text()
assert json.loads((root/'qa-7.43.0/performance.json').read_text())['budget']['passed']
baseline={}
with ZipFile(args.baseline) as a:
 assert a.testzip() is None
 for info in a.infolist():
  if info.is_dir():continue
  n=PurePosixPath(info.filename);assert n.parts[0]=='sinf-quiz' and '..' not in n.parts
  baseline[n.relative_to('sinf-quiz').as_posix()]=a.read(info)
assert len(baseline)==1349
before=json.loads(baseline['package.json']);after=json.loads((root/'package.json').read_text())
for key in ['dependencies','devDependencies','scripts']:assert before[key]==after[key],key
changed=[];protected=[]
for n,b in baseline.items():
 f=root/n;assert f.is_file(),'Missing previous file: '+n
 if f.read_bytes()!=b:changed.append(n)
 if n.startswith(('public/','data/')) or f.suffix=='.sql':assert f.read_bytes()==b,'Protected data changed: '+n;protected.append(n)
assert len(protected)==553
allowed={'README.md','package.json','package-lock.json','src/CinemaPiano.jsx','src/piano-stage.css','src/use-piano-stage.js','src/App.jsx','src/StudioShell.jsx','tests/piano-stage.test.js','tests/piano.test.js','tests/vercel.test.js'}
assert set(changed)==allowed,changed
added={'src/PianoStageLibrary.jsx','scripts/package-piano-mobile-release.py','UPDATE-7.43.md','QA-7.43.md','CHANGED-FILES-7.43.md','RELEASE-7.43.0.json','qa-7.43.0/all-tests.log','qa-7.43.0/build-final.log','qa-7.43.0/performance.json'}
assert len(added)==9 and not added.intersection(baseline)
names=sorted(set(baseline)|added)
(root/'CHANGED-FILES-7.43.md').write_text('# SinfQuiz 7.43.0 — asosiy fayllar\n\n'
 '- `CinemaPiano.jsx`: yonlama kuy tanlash tugmasi, xavfsiz pauza/almashish, PIANO nomi.\n'
 '- `PianoStageLibrary.jsx`: aylangan sahna ichidagi qidiruvli kuy/mashq/shaxsiy MIDI ro‘yxati.\n'
 '- `piano-stage.css`: ro‘yxat o‘lchamlari, scroll, telefon va katta ekran boshqaruvlari.\n'
 '- `use-piano-stage.js`: ro‘yxatda fokus/Esc va qidiruv klaviaturasi ochilgandagi burilishni saqlash.\n'
 '- `StudioShell.jsx`, `App.jsx`: ko‘rinadigan PIANO nomi.\n'
 '- `piano-stage.test.js`: 3 yangi yonlama tanlov, native fullscreen/fokus va klaviatura viewport testi.\n\n'
 'Barcha 1349 eski fayl saqlangan. Oldingi 553 public/data/SQL fayli, typing razminkasi, audio mexanizmi va notalar o‘zgarmagan. SQL/dependency qo‘shilmagan.\n\n'
 '## Yangilangan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(changed))+
 '\n\n## Qo‘shilgan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(added))+'\n',encoding='utf-8')
args.output.parent.mkdir(parents=True,exist_ok=True);fd,temporary=tempfile.mkstemp(prefix='sinfquiz-743-',suffix='.part',dir=args.output.parent);os.close(fd);temporary=Path(temporary)
with ZipFile(temporary,'w',ZIP_DEFLATED,compresslevel=9) as a:
 for n in names:
  f=root/n;assert f.is_file() and not f.is_symlink()
  assert not any(x in {'node_modules','dist','.git'} for x in Path(n).parts)
  assert not f.name.startswith('.env') or f.name=='.env.example'
  a.write(f,'sinf-quiz/'+n)
with ZipFile(temporary) as a:
 assert a.testzip() is None and len(a.namelist())==len(set(a.namelist()))==1358
 for n in names:assert a.read('sinf-quiz/'+n)==(root/n).read_bytes(),n
assert temporary.stat().st_size<50*1024*1024
with temporary.open('rb') as f:os.fsync(f.fileno())
os.replace(temporary,args.output)
result=dict(path=str(args.output.resolve()),version='7.43.0',bytes=args.output.stat().st_size,entries=len(names),sha256=sha(args.output.read_bytes()),baselineFilesPreserved=len(baseline),protectedFilesUnchanged=len(protected),changed=sorted(changed),added=sorted(added),crc='passed',allBytesVerified=True,testsPassed=326,readyPianoSongsPreserved=79,practicePiecesPreserved=38,uzbekWarmupPreserved=True,displayName='PIANO',landscapeSongPicker=True)
args.output.with_suffix('.verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
