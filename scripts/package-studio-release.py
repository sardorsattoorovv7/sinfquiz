"""Build the Studio release only from validated source and current QA results."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse
import hashlib
import json
import re


def digest(data):
    return hashlib.sha256(data).hexdigest()


parser = argparse.ArgumentParser()
parser.add_argument('--baseline', required=True, type=Path)
parser.add_argument('--output-dir', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
qa = root / 'qa-7.26'
assert json.loads((root / 'package.json').read_text())['version'] == '7.26.0'
test_log = (qa / 'all-tests.log').read_text()
count = int(re.search(r'\btests (\d+)', test_log).group(1))
assert count >= 156 and re.search(r'\bpass ' + str(count) + r'\b', test_log)
assert re.search(r'\bfail 0\b', test_log)
assert 'built in' in (qa / 'build.log').read_text()


def result(name):
    return json.loads((qa / name).read_text())


studio = result('studio/studio-browser.json')
learning = result('learning/learning-browser.json')
english = result('english/english-browser.json')
competition = result('competition/competition-browser.json')
assert studio['passed'] and not studio['runtimeErrors']
assert all(studio[k] for k in ['purposeNavigation', 'triangleLiveCalculation',
                              'mobileDrawerEscape', 'subjectsAndTheme',
                              'actualChemistryWorkbench', 'real3DMazeAndTextMode', 'teacherPanel'])
assert learning['passed'] and not learning['runtimeErrors']
assert all(learning[k] for k in ['realPythonWorker', 'realOfficeGrading',
                                'englishGatePreserved', 'englishLessonWorks',
                                'activeReload', 'networkRecovery', 'teacherOwnership'])
assert learning['canonicalScore'] == 32
assert english['passed'] and not english['errors']
assert competition['status'] == 'pass' and competition['stages'] == 5
assert not competition['runtimeErrors']
accessibility = []
for suite in ['studio', 'learning', 'english', 'competition']:
    rows = result(suite + '/accessibility.json')
    assert rows and all(not row['violations'] for row in rows), suite
    accessibility.extend(rows)
assert len(accessibility) >= 30
catalog = json.loads((root / 'generated/iq-library-manifest.json').read_text())
assert catalog['items'] == 144 and catalog['books'] == 198

with ZipFile(args.baseline) as old:
    assert old.testzip() is None
    old_files = {}
    for info in old.infolist():
        if info.is_dir():
            continue
        name = PurePosixPath(info.filename)
        assert name.parts[0] == 'sinf-quiz' and '..' not in name.parts
        relative = name.relative_to('sinf-quiz').as_posix()
        assert relative not in old_files
        old_files[relative] = old.read(info)
    for name, data in old_files.items():
        file = root / name
        assert file.is_file(), 'Missing baseline file: ' + name
        if name.startswith('public/') or file.suffix == '.sql' or name.startswith('api/'):
            assert file.read_bytes() == data, 'Protected existing asset/server changed: ' + name

audio = json.loads((root / 'public/english-course/v7.23/manifest.json').read_text())
assert len(audio) == 216
for item in audio:
    assert digest((root / 'public/english-course/v7.23' / item['file']).read_bytes()) == item['audioSha256']

screenshots = {
    'home-desktop.png', 'math-triangle-desktop.png', 'math-triangle-board.png',
    'math-triangle-mobile.png', 'chemistry-desktop.png', 'chemistry-dark-desktop.png',
    'chemistry-mobile.png', 'books-dark-mobile.png', 'maze-text-question.png',
    'teacher-desktop.png', 'teacher-mobile.png',
}


def eligible(path):
    rel = path.relative_to(root)
    if not path.is_file() or path.is_symlink():
        return False
    if any(p in {'node_modules', 'dist', '.git', '__pycache__', '.pytest_cache'} for p in rel.parts):
        return False
    if any(p.startswith('.env') and p != '.env.example' for p in rel.parts):
        return False
    if path.suffix == '.zip':
        return False
    if rel.parts[0] == 'qa-7.26':
        if path.name in {'failure.txt', 'failure.png'}:
            return False
        if path.suffix == '.png':
            return rel.parent.as_posix() == 'qa-7.26/studio' and path.name in screenshots
    return True


changed = sorted(name for name, data in old_files.items() if (root / name).read_bytes() != data)
release_path = root / 'RELEASE-7.26.json'
change_path = root / 'CHANGED-FILES-7.26.md'
release_path.touch()
change_path.touch()
files = sorted(p for p in root.rglob('*') if eligible(p))
names = {p.relative_to(root).as_posix() for p in files}
assert set(old_files) <= names, 'Packaging excludes an original file'
new = sorted(names - set(old_files))
change_path.write_text(
    '# SinfQuiz 7.26 — o‘zgargan fayllar\n\n'
    '7.25 arxivi bilan baytlar bo‘yicha solishtirildi. Oldingi ' + str(len(old_files)) +
    ' fayl saqlangan. Public modellar/audio, API va SQL o‘zgarmagan.\n\n'
    '## Yangilangan\n\n' + '\n'.join('- `' + n + '`' for n in changed) +
    '\n\n## Yangi\n\n' + '\n'.join('- `' + n + '`' for n in new) +
    '\n\n`qa-7.26/` — yangi tekshiruv loglari, JSON natijalari va tanlangan ekran suratlari. '
    'Tarixiy QA fayllari arxivda alohida saqlanadi.\n'
)
report = {
    'version': '7.26.0', 'testedAt': '2026-10-08', 'files': len(files),
    'testsPassed': count, 'buildPassed': True, 'browserSuitesPassed': 4,
    'browserVersion': studio['browser'], 'accessibilityChecks': len(accessibility),
    'viewports': ['390x844 mobile', '1600x1050 desktop', '1920x1080 board'],
    'triangleChecks': ['8 * 5 / 2 = 20', '10 * 5 / 2 = 25'],
    'iqItemsPreserved': 144, 'originalTextbooksPreserved': 198,
    'previousArchiveFilesPreserved': len(old_files),
    'previousPublicAssetsUnchanged': True, 'existingAPIAndSQLUnchanged': True,
    'englishAudioHashesVerified': 216, 'newSQLRequiredFrom725': False,
    'archiveValidation': 'All four ZIP CRCs and the parts union checked by this script',
    'scope': 'Local Chromium, SVG/WebGL, actual Python worker, PostgreSQL/PGlite RPC fixtures; no live Supabase/Vercel deployment tested',
}
release_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
args.output_dir.mkdir(parents=True, exist_ok=True)


def write_zip(filename, selected):
    target = args.output_dir / filename
    with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
        for p in selected:
            archive.write(p, 'sinf-quiz/' + p.relative_to(root).as_posix())
    with ZipFile(target) as archive:
        assert archive.testzip() is None
        assert len(archive.namelist()) == len(set(archive.namelist())) == len(selected)
        for name in archive.namelist():
            parsed = PurePosixPath(name)
            assert not parsed.is_absolute() and '..' not in parsed.parts
            rel = parsed.relative_to('sinf-quiz').as_posix()
            assert archive.read(name) == (root / rel).read_bytes()
    return {'path': str(target.resolve()), 'bytes': target.stat().st_size,
            'files': len(selected), 'crc': 'passed', 'sha256': digest(target.read_bytes())}


full = write_zip('SinfQuiz-v7.26-Studio-UI.zip', files)
groups = [[], [], []]
for file in files:
    name = file.relative_to(root).as_posix()
    group = 1 if name.startswith('public/english-course/') else 2 if name.startswith('public/cefr-audio/') else 0
    groups[group].append(file)
parts = [write_zip(name, group) for name, group in zip(
    ['SinfQuiz-v7.26-1-Kod-Modellar.zip', 'SinfQuiz-v7.26-2-Ingliz-Audio.zip', 'SinfQuiz-v7.26-3-CEFR-Audio.zip'], groups)]
assert all(p['bytes'] < 20 * 1024 * 1024 for p in parts)
with ZipFile(full['path']) as archive:
    union = set()
    for part in parts:
        with ZipFile(part['path']) as small:
            part_names = set(small.namelist())
            assert not union.intersection(part_names)
            for name in part_names:
                assert small.read(name) == archive.read(name)
            union.update(part_names)
    assert union == set(archive.namelist())
delivery = {'version': '7.26.0', 'full': full, 'parts': parts,
            'partsUnionByteIdenticalToFull': True, 'baselineFilesPreserved': len(old_files),
            'accessibilityChecks': len(accessibility), 'testsPassed': count}
(args.output_dir / 'DELIVERY-7.26.json').write_text(json.dumps(delivery, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(delivery, ensure_ascii=False))
