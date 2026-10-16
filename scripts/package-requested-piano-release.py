"""Package 7.40 while retaining every path from the verified full 7.39 ZIP."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, hashlib, json, re

p = argparse.ArgumentParser()
p.add_argument('--baseline', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
args = p.parse_args()
root = Path(__file__).resolve().parents[1]
sha = lambda b: hashlib.sha256(b).hexdigest()
assert sha(args.baseline.read_bytes()) == '92081921261e34164d5c003f7d9074bfc54b47a6ca742dc1a3842bc99d5c4d87'
assert json.loads((root/'package.json').read_text())['version'] == '7.40.0'
log = (root/'qa-7.40.0/all-tests.log').read_text()
assert re.search(r'ℹ pass 314\b', log) and re.search(r'ℹ fail 0\b', log)
assert re.search(r'ℹ skipped 0\b', log)
assert 'built in' in (root/'qa-7.40.0/build-final.log').read_text()
assert json.loads((root/'qa-7.40.0/performance.json').read_text())['budget']['passed']
baseline = {}
with ZipFile(args.baseline) as archive:
    assert archive.testzip() is None
    for info in archive.infolist():
        if info.is_dir():
            continue
        name = PurePosixPath(info.filename)
        assert name.parts[0] == 'sinf-quiz' and '..' not in name.parts
        baseline[name.relative_to('sinf-quiz').as_posix()] = archive.read(info)
assert len(baseline) == 1294
before = json.loads(baseline['package.json'])
after = json.loads((root/'package.json').read_text())
for key in ['dependencies', 'devDependencies', 'scripts']:
    assert before.get(key) == after.get(key), key
changed, protected = [], []
for name, data in baseline.items():
    file = root/name
    assert file.is_file(), 'Missing previous path: '+name
    if file.read_bytes() != data:
        changed.append(name)
    if name.startswith(('public/', 'data/')) or file.suffix == '.sql':
        assert file.read_bytes() == data, 'Protected resource changed: '+name
        protected.append(name)
allowed = {'README.md', 'package.json', 'package-lock.json', 'src/CinemaPiano.jsx',
    'src/piano-audio.js', 'src/piano-music.js', 'src/piano-repertoire.js', 'src/piano-stage.css',
    'tests/piano-expansion.test.js', 'tests/piano-focus.test.js', 'tests/piano-repertoire.test.js',
    'tests/piano-solfege.test.js', 'tests/piano-stage.test.js', 'tests/vercel.test.js'}
assert set(changed) == allowed, changed
assert len(protected) == 540
added = {'data/piano-requested-7.40.json', 'src/piano-requested-ready.js',
    'scripts/build-requested-piano.mjs', 'scripts/package-requested-piano-release.py',
    'tests/piano-requested.test.js', 'tests/piano-audio-output.test.js',
    'UPDATE-7.40.md', 'QA-7.40.md', 'PIANO-SOURCES-7.40.md',
    'CHANGED-FILES-7.40.md', 'RELEASE-7.40.0.json',
    'qa-7.40.0/all-tests.log', 'qa-7.40.0/build-final.log', 'qa-7.40.0/performance.json',
    'qa-7.40.0/repertoire-build.json', 'qa-7.40.0/source-fidelity.json'}
added |= {f.relative_to(root).as_posix() for f in (root/'public/piano/requested-7.40').iterdir() if f.is_file()}
assert len(added) == 23 and len([n for n in added if n.endswith('.mid')]) == 5
assert not added.intersection(baseline)
names = sorted(set(baseline) | added)
(root/'CHANGED-FILES-7.40.md').write_text(
    '# SinfQuiz 7.40.0 — o‘zgargan fayllar\n\n'
    '7.39.0 ZIPdagi barcha 1294 yo‘l saqlandi. Oldingi 540 ta SQL/public/data '
    'resursi baytma-bayt o‘zgarmagan. Eski 72 kuy va 38 mashq saqlangan. '
    'Yangi SQL yoki dependency yo‘q.\n\n'
    '## Asosiy o‘zgarishlar\n\n'
    '- `piano-requested-ready.js` va `piano-repertoire.js`: beshta yangi o‘quv kuy, jami 77 tayyor kuy.\n'
    '- `piano-audio.js`: umumiy chiqishni kuchaytirish, yumshoq cheklagich, 6/8 metronom.\n'
    '- `piano-music.js`: yangi standart ovoz 90% va Master Gain 1.10×; mavjud tanlovlar saqlanadi.\n'
    '- `CinemaPiano.jsx` va `piano-stage.css`: yangi ro‘yxat, izohlar va yonlama ovoz slayderi.\n'
    '- `piano-requested-7.40.json`, `build-requested-piano.mjs`, yangi MIDIlar: offline qayta yaratiladigan nota darslari.\n'
    '- `piano-requested.test.js`, `piano-audio-output.test.js`, `piano-stage.test.js`: kuy, tutorial, ovoz va mobil sozlama tekshiruvlari.\n\n'
    '## Yangilangan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(changed))+
    '\n\n## Qo‘shilgan\n\n'+'\n'.join('- `'+n+'`' for n in sorted(added))+
    '\n\nNahotki shu bo‘lsa sevgi hali qo‘shilmagan; sabab va manbalar '
    '`PIANO-SOURCES-7.40.md`da ochiq yozilgan. Tekshiruvlar `QA-7.40.md`da.\n', encoding='utf-8')
args.output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(args.output, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for name in names:
        file = root/name
        assert file.is_file() and not file.is_symlink()
        assert not any(x in {'node_modules', 'dist', '.git'} for x in Path(name).parts)
        assert not file.name.startswith('.env') or file.name == '.env.example'
        archive.write(file, 'sinf-quiz/'+name)
with ZipFile(args.output) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(set(archive.namelist())) == len(names)
    for name in names:
        assert archive.read('sinf-quiz/'+name) == (root/name).read_bytes(), name
assert args.output.stat().st_size < 50*1024*1024
result = {'path': str(args.output.resolve()), 'version': '7.40.0', 'bytes': args.output.stat().st_size,
    'entries': len(names), 'sha256': sha(args.output.read_bytes()), 'baselineFilesPreserved': len(baseline),
    'protectedFilesUnchanged': len(protected), 'changed': sorted(changed), 'added': sorted(added),
    'crc': 'passed', 'allBytesVerified': True, 'testsPassed': 314, 'songsAdded': 5,
    'readySongsTotal': 77, 'notesAdded': 283, 'midiBytesAdded': 2638,
    'scoreTranscriptions': 5, 'louderPianoOutput': True, 'landscapeVolume': True,
    'unresolvedRequests': ['Alisher Uzoqov — Nahotki shu bo‘lsa sevgi']}
args.output.with_suffix('.verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(result, ensure_ascii=False))
