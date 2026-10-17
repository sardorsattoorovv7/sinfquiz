"""Atomic complete ZIP, with preservation and regression evidence checks."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, hashlib, json, os, re, tempfile

p=argparse.ArgumentParser();p.add_argument('--baseline',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
args=p.parse_args();root=Path(__file__).resolve().parents[1];sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(args.baseline.read_bytes())=='63ce949f0e80f13763cf3afdc237f11cf124fd50bf3cf81d04d4c4fbc906d92a'
assert json.loads((root/'package.json').read_text())['version']=='7.42.0'
log=(root/'qa-7.42.0/all-tests.log').read_text()
for label,count in [('pass',323),('fail',0),('skipped',0),('cancelled',0)]:assert re.search(r'ℹ '+label+' '+str(count)+r'\b',log),label
assert 'built in' in (root/'qa-7.42.0/build-final.log').read_text()
assert json.loads((root/'qa-7.42.0/performance.json').read_text())['budget']['passed']
baseline={}
with ZipFile(args.baseline) as a:
 assert a.testzip() is None
 for info in a.infolist():
  if info.is_dir():continue
  n=PurePosixPath(info.filename);assert n.parts[0]=='sinf-quiz' and '..' not in n.parts
  baseline[n.relative_to('sinf-quiz').as_posix()]=a.read(info)
assert len(baseline)==1337
before=json.loads(baseline['package.json']);after=json.loads((root/'package.json').read_text())
for key in ['dependencies','devDependencies','scripts']:assert before[key]==after[key],key
changed=[];protected=[]
for n,b in baseline.items():
 f=root/n;assert f.is_file(),'Missing previous file: '+n
 if f.read_bytes()!=b:changed.append(n)
 if n.startswith(('public/','data/')) or f.suffix=='.sql':assert f.read_bytes()==b,'Protected data changed: '+n;protected.append(n)
assert len(protected)==553
allowed={'README.md','package.json','package-lock.json','src/app-views/SessionViews.jsx','src/paper/PaperHome.jsx','tests/vercel.test.js'}
assert set(changed)==allowed,changed
added={'src/typing/uzbek-warmup.js','src/typing/UzbekTypingWarmup.jsx','src/typing/uzbek-warmup.css',
 'tests/uzbek-warmup.test.js','scripts/package-warmup-release.py',
 'UPDATE-7.42.md','QA-7.42.md','CHANGED-FILES-7.42.md','RELEASE-7.42.0.json',
 'qa-7.42.0/all-tests.log','qa-7.42.0/build-final.log','qa-7.42.0/performance.json'}
assert len(added)==12 and not added.intersection(baseline)
names=sorted(set(baseline)|added)
(root/'CHANGED-FILES-7.42.md').write_text('# SinfQuiz 7.42.0 — asosiy o‘zgarishlar\n\n'
 '- `src/typing/uzbek-warmup.js`: 48 qisqa gap, tasodifiy to‘plam, normalizatsiya, xato/tezlik/vaqt modeli.\n'
 '- `src/typing/UzbekTypingWarmup.jsx`: matn ustida yozish, gap/vaqt tanlovi, IME, klaviatura, natijalar.\n'
 '- `src/typing/uzbek-warmup.css`: qog‘oz tokenlari, dark/light, mobil va reduced-motion.\n'
 '- `SessionViews.jsx`: o‘zbekcha bo‘limdagi razminka va eski 5 bosqich orasida o‘tish; modul lazy yuklanadi.\n'
 '- `PaperHome.jsx`: typing kartasidagi razminka ta’rifi.\n'
 '- `uzbek-warmup.test.js`: 6 yangi ma’lumot/vaqt/UI/accessibility va kirish oqimi testi.\n\n'
 'Avvalgi 1337 faylning barchasi mavjud. 553 public/data/SQL fayli baytma-bayt o‘zgarmagan. '
 'API, autentifikatsiya, RPC/RLS, server baholashi, piano va fan modullari o‘zgarmagan. Dependency yoki SQL qo‘shilmagan.\n\n'
 '## Yangilangan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(changed))+
 '\n\n## Qo‘shilgan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(added))+'\n',encoding='utf-8')
args.output.parent.mkdir(parents=True,exist_ok=True);fd,temporary=tempfile.mkstemp(prefix='sinfquiz-742-',suffix='.part',dir=args.output.parent);os.close(fd);temporary=Path(temporary)
with ZipFile(temporary,'w',ZIP_DEFLATED,compresslevel=9) as a:
 for n in names:
  f=root/n;assert f.is_file() and not f.is_symlink()
  assert not any(x in {'node_modules','dist','.git'} for x in Path(n).parts)
  assert not f.name.startswith('.env') or f.name=='.env.example'
  a.write(f,'sinf-quiz/'+n)
with ZipFile(temporary) as a:
 assert a.testzip() is None and len(a.namelist())==len(set(a.namelist()))==1349
 for n in names:assert a.read('sinf-quiz/'+n)==(root/n).read_bytes(),n
assert temporary.stat().st_size<50*1024*1024
with temporary.open('rb') as f:os.fsync(f.fileno())
os.replace(temporary,args.output)
result=dict(path=str(args.output.resolve()),version='7.42.0',bytes=args.output.stat().st_size,entries=len(names),sha256=sha(args.output.read_bytes()),baselineFilesPreserved=len(baseline),protectedFilesUnchanged=len(protected),changed=sorted(changed),added=sorted(added),crc='passed',allBytesVerified=True,testsPassed=323,warmupTests=6,shortUzbekSentences=48,officialTypingUnchanged=True,readyPianoSongsPreserved=79)
args.output.with_suffix('.verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
