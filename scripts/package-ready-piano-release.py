"""Package 7.36 sources, preserving every file in the verified 7.35 archive."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, hashlib, json, re

p = argparse.ArgumentParser()
p.add_argument('--baseline', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
args = p.parse_args()
root = Path(__file__).resolve().parents[1]
sha = lambda b: hashlib.sha256(b).hexdigest()
assert sha(args.baseline.read_bytes()) == '706968b5fe10de812c57762d3e0c7cd7fe8844545814fc8234336061108216f4'
assert json.loads((root/'package.json').read_text())['version'] == '7.36.0'
assert re.search(r'ℹ pass 291\b', (root/'qa-7.36.0/all-tests.log').read_text())
assert re.search(r'ℹ fail 0\b', (root/'qa-7.36.0/all-tests.log').read_text())
assert 'built in' in (root/'qa-7.36.0/build-final.log').read_text()
assert json.loads((root/'qa-7.36.0/performance.json').read_text())['budget']['passed']
baseline = {}
with ZipFile(args.baseline) as archive:
    assert archive.testzip() is None
    for info in archive.infolist():
        if info.is_dir():
            continue
        name = PurePosixPath(info.filename)
        assert name.parts[0] == 'sinf-quiz' and '..' not in name.parts
        baseline[name.relative_to('sinf-quiz').as_posix()] = archive.read(info)
assert len(baseline) == 1158
changed = []
protected = []
for name, before in baseline.items():
    file = root/name
    assert file.is_file(), 'Missing previous file: '+name
    if file.read_bytes() != before:
        changed.append(name)
    if name.startswith(('public/', 'data/')) or file.suffix == '.sql':
        assert file.read_bytes() == before, 'Protected previous resource changed: '+name
        protected.append(name)
allowed = {'README.md','package.json','package-lock.json','src/CinemaPiano.jsx',
    'src/piano-repertoire.js','src/piano-music.js','tests/piano.test.js',
    'tests/piano-repertoire.test.js','tests/vercel.test.js'}
assert set(changed) <= allowed, changed
added = {'src/piano-turkish-ready.js','data/piano-ready-7.36.json',
    'scripts/build-ready-piano.mjs','scripts/package-ready-piano-release.py',
    'UPDATE-7.36.md','QA-7.36.md','PIANO-SOURCES-7.36.md','RELEASE-7.36.0.json',
    'CHANGED-FILES-7.36.md','qa-7.36.0/all-tests.log',
    'qa-7.36.0/build-final.log','qa-7.36.0/performance.json'}
added |= {p.relative_to(root).as_posix() for p in (root/'public/piano/ready-7.36').iterdir() if p.is_file()}
assert len([n for n in added if n.endswith('.mid')]) == 20
names = sorted(set(baseline) | added)
(root/'CHANGED-FILES-7.36.md').write_text(
    '# SinfQuiz 7.36.0 — o‘zgargan fayllar\n\n'
    '7.35.0 ZIPdagi 1158 faylning barchasi saqlangan. Oldingi SQL, media, model, '
    'ma’lumotlar va labirint resurslari baytma-bayt o‘zgarmagan. Yangi SQL yo‘q.\n\n'
    '## Yangilangan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(changed))+
    '\n\n## Qo‘shilgan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(added))+
    '\n\nYangi 20 ta musiqa aktivi CC BY-NC-SA 4.0. Janr: turkcha xalq va mumtoz kuylar. '
    'Tafsilot va manbalar: `PIANO-SOURCES-7.36.md`.\n', encoding='utf-8')
args.output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(args.output, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for name in names:
        file = root/name
        assert file.is_file() and not file.is_symlink()
        assert not any(part in {'node_modules','dist','.git'} for part in Path(name).parts)
        assert not file.name.startswith('.env') or file.name == '.env.example'
        archive.write(file, 'sinf-quiz/'+name)
with ZipFile(args.output) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(set(archive.namelist())) == len(names)
    for name in names:
        assert archive.read('sinf-quiz/'+name) == (root/name).read_bytes(), name
assert args.output.stat().st_size < 50*1024*1024
result = {'path':str(args.output.resolve()),'version':'7.36.0',
    'bytes':args.output.stat().st_size,'entries':len(names),'sha256':sha(args.output.read_bytes()),
    'baselineFilesPreserved':len(baseline),'protectedFilesUnchanged':len(protected),
    'changed':sorted(changed),'added':sorted(added),'crc':'passed','allBytesVerified':True,
    'testsPassed':291,'newReadySongs':20,'modernChartSongsAdded':0,'hindiSongsAdded':0}
args.output.with_suffix('.verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
