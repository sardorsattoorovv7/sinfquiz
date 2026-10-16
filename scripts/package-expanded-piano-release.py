"""Package the full 7.39 project, preserving every file in verified 7.38."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, hashlib, json, re

p = argparse.ArgumentParser()
p.add_argument('--baseline', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
args = p.parse_args()
root = Path(__file__).resolve().parents[1]
sha = lambda b: hashlib.sha256(b).hexdigest()
assert sha(args.baseline.read_bytes()) == 'd9949b0fb92212b0743d5ced5f880fad883b077f17c7a5779ca598483cb3f397'
assert json.loads((root/'package.json').read_text())['version'] == '7.39.0'
log = (root/'qa-7.39.0/all-tests.log').read_text()
assert re.search(r'ℹ pass 308\b', log) and re.search(r'ℹ fail 0\b', log)
assert 'built in' in (root/'qa-7.39.0/build-final.log').read_text()
assert json.loads((root/'qa-7.39.0/performance.json').read_text())['budget']['passed']
baseline = {}
with ZipFile(args.baseline) as archive:
    assert archive.testzip() is None
    for info in archive.infolist():
        if info.is_dir():
            continue
        name = PurePosixPath(info.filename)
        assert name.parts[0] == 'sinf-quiz' and '..' not in name.parts
        baseline[name.relative_to('sinf-quiz').as_posix()] = archive.read(info)
assert len(baseline) == 1254
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
    'src/piano-repertoire.js', 'tests/piano-focus.test.js', 'tests/piano.test.js',
    'tests/piano-repertoire.test.js', 'tests/piano-solfege.test.js', 'tests/vercel.test.js'}
assert set(changed) == allowed, changed
assert len(protected) == 517
added = {'src/piano-expansion-ready.js', 'src/use-piano-stage.js', 'src/piano-stage.css',
    'data/piano-expansion-7.39.json', 'scripts/build-expanded-piano.mjs',
    'scripts/package-expanded-piano-release.py', 'tests/piano-expansion.test.js',
    'tests/piano-stage.test.js', 'UPDATE-7.39.md', 'QA-7.39.md', 'PIANO-SOURCES-7.39.md',
    'RELEASE-7.39.0.json', 'CHANGED-FILES-7.39.md', 'qa-7.39.0/all-tests.log',
    'qa-7.39.0/build-final.log', 'qa-7.39.0/performance.json',
    'qa-7.39.0/repertoire-build.json', 'qa-7.39.0/source-fidelity.json'}
added |= {f.relative_to(root).as_posix() for f in (root/'public/piano/expansion-7.39').iterdir() if f.is_file()}
assert len([n for n in added if n.endswith('.mid')]) == 20
assert not added.intersection(baseline)
names = sorted(set(baseline) | added)
(root/'CHANGED-FILES-7.39.md').write_text(
    '# SinfQuiz 7.39.0 — o‘zgargan fayllar\n\n'
    '7.38.0 ZIPdagi barcha 1254 fayl saqlangan. Oldingi 517 ta SQL, public va '
    'data resursi baytma-bayt o‘zgarmagan. Yangi SQL yoki dependency yo‘q.\n\n'
    '## Asosiy o‘zgarishlar\n\n'
    '- `CinemaPiano.jsx`: Yangi kuylar bo‘limi va yonlama piano/tutor sahnasi.\n'
    '- `use-piano-stage.js`: viewport, 90° aylanish, fullscreen, orientation, fokus va scroll tiklanishi.\n'
    '- `piano-stage.css`: telefon/planshet sahnasi, safe-area, keng klavishlar va tutorial joylashuvi.\n'
    '- `piano-expansion-ready.js`: 20 yangi, darhol tinglab o‘rganiladigan melodiya.\n'
    '- `piano-repertoire.js`: yangi kuylar, film/serial/albom qidiruvi.\n\n'
    '## Yangilangan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(changed))+
    '\n\n## Qo‘shilgan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(added))+
    '\n\n20 yangi parcha: Training Season naqorati, 9 turk seriali mavzusi va '
    '10 hindcha kino kuyi. 5 tayyor MIDI manbasi, 15 notadan tayyorlangan qisqa '
    'o‘quv melodiya. Oldingi 52 kuy va 38 mashq saqlangan. Tafsilotlar '
    '`UPDATE-7.39.md`, `QA-7.39.md` va `PIANO-SOURCES-7.39.md`da.\n', encoding='utf-8')
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
result = {'path': str(args.output.resolve()), 'version': '7.39.0',
    'bytes': args.output.stat().st_size, 'entries': len(names), 'sha256': sha(args.output.read_bytes()),
    'baselineFilesPreserved': len(baseline), 'protectedFilesUnchanged': len(protected),
    'changed': sorted(changed), 'added': sorted(added), 'crc': 'passed', 'allBytesVerified': True,
    'testsPassed': 308, 'songsAdded': 20, 'readySongsTotal': 72,
    'readyMidiSources': 5, 'scoreTranscriptions': 15, 'landscapePiano': True}
args.output.with_suffix('.verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(result, ensure_ascii=False))
