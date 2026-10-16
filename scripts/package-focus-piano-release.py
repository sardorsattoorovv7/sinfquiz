"""Package all SinfQuiz 7.38 files against the verified 7.37 full-project ZIP."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, hashlib, json, re

p = argparse.ArgumentParser()
p.add_argument('--baseline', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
args = p.parse_args()
root = Path(__file__).resolve().parents[1]
sha = lambda b: hashlib.sha256(b).hexdigest()
assert sha(args.baseline.read_bytes()) == 'd0131772f450466df751ac87fadee4ba6fb31f1d9e13082b71d7fa9e12e6eb6b'
assert json.loads((root/'package.json').read_text())['version'] == '7.38.0'
assert re.search(r'ℹ pass 300\b', (root/'qa-7.38.0/all-tests.log').read_text())
assert re.search(r'ℹ fail 0\b', (root/'qa-7.38.0/all-tests.log').read_text())
assert 'built in' in (root/'qa-7.38.0/build-final.log').read_text()
assert json.loads((root/'qa-7.38.0/performance.json').read_text())['budget']['passed']
baseline = {}
with ZipFile(args.baseline) as archive:
    assert archive.testzip() is None
    for info in archive.infolist():
        if info.is_dir():
            continue
        name = PurePosixPath(info.filename)
        assert name.parts[0] == 'sinf-quiz' and '..' not in name.parts
        baseline[name.relative_to('sinf-quiz').as_posix()] = archive.read(info)
assert len(baseline) == 1227
old_package = json.loads(baseline['package.json'])
new_package = json.loads((root/'package.json').read_text())
for key in ['dependencies', 'devDependencies', 'scripts']:
    assert old_package.get(key) == new_package.get(key), key
changed, protected = [], []
for name, before in baseline.items():
    file = root/name
    assert file.is_file(), 'Missing previous file: '+name
    if file.read_bytes() != before:
        changed.append(name)
    if name.startswith(('public/', 'data/')) or file.suffix == '.sql':
        assert file.read_bytes() == before, 'Protected resource changed: '+name
        protected.append(name)
allowed = {'README.md', 'package.json', 'package-lock.json', 'src/CinemaPiano.jsx',
    'src/cinema-piano.css', 'src/piano-repertoire.js', 'src/piano-music.js',
    'tests/piano.test.js', 'tests/piano-repertoire.test.js', 'tests/piano-solfege.test.js',
    'tests/performance.test.js', 'tests/vercel.test.js'}
assert set(changed) == allowed, changed
assert len(protected) == 503
added = {'src/piano-focus-ready.js', 'data/piano-focus-7.38.json',
    'scripts/build-focus-piano.mjs', 'scripts/package-focus-piano-release.py',
    'tests/piano-focus.test.js', 'UPDATE-7.38.md', 'QA-7.38.md',
    'PIANO-SOURCES-7.38.md', 'RELEASE-7.38.0.json', 'CHANGED-FILES-7.38.md',
    'qa-7.38.0/all-tests.log', 'qa-7.38.0/build-final.log',
    'qa-7.38.0/performance.json', 'qa-7.38.0/repertoire-build.json'}
added |= {f.relative_to(root).as_posix() for f in (root/'public/piano/focus-7.38').iterdir() if f.is_file()}
assert len([n for n in added if n.endswith('.mid')]) == 11
assert not added.intersection(baseline)
names = sorted(set(baseline) | added)
(root/'CHANGED-FILES-7.38.md').write_text(
    '# SinfQuiz 7.38.0 — o‘zgargan fayllar\n\n'
    '7.37.0 ZIPdagi 1227 fayl saqlangan. Oldingi 503 ta SQL, public va data '
    'resursi baytma-bayt o‘zgarmagan. Yangi SQL yoki dependency yo‘q.\n\n'
    '## Yangilangan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(changed))+
    '\n\n## Qo‘shilgan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(added))+
    '\n\n11 ta qisqa o‘ng qo‘l melodiyasi: 6 BLOK3 va 5 hindcha kino kuyi; '
    '4 ta tayyor MIDI manbasi, 7 tasi notadan tayyorlangan. Yangi bo‘lim asosiy '
    'bo‘lim sifatida ochiladi; film nomi va O‘g‘irlanmagan kelin orqali qidirish mumkin. '
    'Oldingi inglizcha hitlar, xalq/mumtoz kuylar, mashqlar va shaxsiy MIDIlar saqlangan.\n',
    encoding='utf-8')
args.output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(args.output, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for name in names:
        file = root/name
        assert file.is_file() and not file.is_symlink()
        assert not any(part in {'node_modules', 'dist', '.git'} for part in Path(name).parts)
        assert not file.name.startswith('.env') or file.name == '.env.example'
        archive.write(file, 'sinf-quiz/'+name)
with ZipFile(args.output) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(set(archive.namelist())) == len(names)
    for name in names:
        assert archive.read('sinf-quiz/'+name) == (root/name).read_bytes(), name
assert args.output.stat().st_size < 50*1024*1024
result = {'path': str(args.output.resolve()), 'version': '7.38.0',
    'bytes': args.output.stat().st_size, 'entries': len(names), 'sha256': sha(args.output.read_bytes()),
    'baselineFilesPreserved': len(baseline), 'protectedFilesUnchanged': len(protected),
    'changed': sorted(changed), 'added': sorted(added), 'crc': 'passed', 'allBytesVerified': True,
    'testsPassed': 300, 'songsAdded': 11, 'blok3Songs': 6, 'hindiFilmSongs': 5,
    'readyMidiSources': 4, 'scoreTranscriptions': 7, 'solfegeDefault': True}
args.output.with_suffix('.verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(result, ensure_ascii=False))
