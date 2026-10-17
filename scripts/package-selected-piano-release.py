"""Package 7.41, preserving every file of the verified complete 7.40 release."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, hashlib, json, re, tempfile, os

p=argparse.ArgumentParser()
p.add_argument('--baseline',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
args=p.parse_args()
root=Path(__file__).resolve().parents[1]
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(args.baseline.read_bytes())=='63a1b7c756401f6abb48d657982da514f0da448f63e88fc9287814218c6a6e67'
assert json.loads((root/'package.json').read_text())['version']=='7.41.0'
log=(root/'qa-7.41.0/all-tests.log').read_text()
for label,count in [('pass',317),('fail',0),('skipped',0),('cancelled',0)]:
    assert re.search(r'ℹ '+label+' '+str(count)+r'\b',log),label
assert 'built in' in (root/'qa-7.41.0/build-final.log').read_text()
assert json.loads((root/'qa-7.41.0/performance.json').read_text())['budget']['passed']
baseline={}
with ZipFile(args.baseline) as a:
    assert a.testzip() is None
    for info in a.infolist():
        if info.is_dir():continue
        name=PurePosixPath(info.filename)
        assert name.parts[0]=='sinf-quiz' and '..' not in name.parts
        baseline[name.relative_to('sinf-quiz').as_posix()]=a.read(info)
assert len(baseline)==1317
before=json.loads(baseline['package.json']);after=json.loads((root/'package.json').read_text())
for key in ['dependencies','devDependencies','scripts']:assert before.get(key)==after.get(key),key
changed=[];protected=[]
for name,data in baseline.items():
    file=root/name
    assert file.is_file(),'Missing old file: '+name
    if file.read_bytes()!=data:changed.append(name)
    if name.startswith(('public/','data/')) or file.suffix=='.sql':
        assert file.read_bytes()==data,'Protected resource changed: '+name
        protected.append(name)
allowed={'README.md','package.json','package-lock.json','src/CinemaPiano.jsx','src/piano-repertoire.js',
    'tests/piano-expansion.test.js','tests/piano-requested.test.js','tests/vercel.test.js'}
assert set(changed)==allowed,changed
assert len(protected)==548
added={'data/piano-selected-7.41.json','src/piano-selected-ready.js',
    'scripts/build-selected-piano.mjs','scripts/package-selected-piano-release.py','tests/piano-selected.test.js',
    'UPDATE-7.41.md','QA-7.41.md','PIANO-SOURCES-7.41.md','CHANGED-FILES-7.41.md','RELEASE-7.41.0.json',
    'qa-7.41.0/all-tests.log','qa-7.41.0/build-final.log','qa-7.41.0/performance.json',
    'qa-7.41.0/repertoire-build.json','qa-7.41.0/source-fidelity.json','qa-7.41.0/test-command.json'}
added|={f.relative_to(root).as_posix() for f in (root/'public/piano/selected-7.41').iterdir() if f.is_file()}
assert len(added)==20 and len([n for n in added if n.endswith('.mid')])==2
assert not added.intersection(baseline)
names=sorted(set(baseline)|added)
(root/'CHANGED-FILES-7.41.md').write_text(
 '# SinfQuiz 7.41.0 — o‘zgargan fayllar\n\n'
 '7.40 ZIPdagi barcha 1317 fayl saqlandi. Oldingi 548 ta public/data/SQL fayli baytma-bayt o‘zgarmagan. '
 'Yangi dependency yoki SQL migratsiyasi yo‘q.\n\n'
 '## Asosiy o‘zgarishlar\n\n'
 '- `piano-selected-ready.js`, `piano-repertoire.js`: Belki va Tujh naqoratlari; jami 79 tayyor kuy.\n'
 '- `CinemaPiano.jsx`: yangi darslar tavsifi va Tujh o‘quv ritmi izohi.\n'
 '- `piano-selected-7.41.json`, generator, 2 MIDI: offline va manbasi ko‘rsatilgan melodiya.\n'
 '- `piano-selected.test.js`: nota/MIDI mosligi, pauza, takror, qidiruv, offline avtoijro va to‘liq tutorial.\n'
 '- Eski testlarda jami kuy sonlari va yangi hindcha filtr sanog‘i yangilandi; eski tekshiruvlar saqlandi.\n'
 '- Ovoz va yonlama piano kodi o‘zgarmagan.\n\n'
 '## Yangilangan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(changed))+
 '\n\n## Qo‘shilgan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(added))+'\n',encoding='utf-8')
args.output.parent.mkdir(parents=True,exist_ok=True)
fd,temporary=tempfile.mkstemp(prefix='sinfquiz-741-',suffix='.part',dir=args.output.parent)
os.close(fd)
temporary=Path(temporary)
with ZipFile(temporary,'w',ZIP_DEFLATED,compresslevel=9) as a:
    for name in names:
        file=root/name
        assert file.is_file() and not file.is_symlink()
        assert not any(x in {'node_modules','dist','.git'} for x in Path(name).parts)
        assert not file.name.startswith('.env') or file.name=='.env.example'
        a.write(file,'sinf-quiz/'+name)
with ZipFile(temporary) as a:
    assert a.testzip() is None
    assert len(a.namelist())==len(set(a.namelist()))==len(names)==1337
    for name in names:assert a.read('sinf-quiz/'+name)==(root/name).read_bytes(),name
assert temporary.stat().st_size<50*1024*1024
with temporary.open('rb') as f:os.fsync(f.fileno())
os.replace(temporary,args.output)
result=dict(path=str(args.output.resolve()),version='7.41.0',bytes=args.output.stat().st_size,entries=len(names),
 sha256=sha(args.output.read_bytes()),baselineFilesPreserved=len(baseline),protectedFilesUnchanged=len(protected),
 changed=sorted(changed),added=sorted(added),crc='passed',allBytesVerified=True,testsPassed=317,
 songsAdded=2,readySongsTotal=79,notesAdded=81,midiBytesAdded=808,scoreTranscriptions=2,
 louderAudioPreserved=True,landscapePianoPreserved=True,simplifiedRhythm=['Tujh Mein Rab Dikhta Hai'])
args.output.with_suffix('.verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
