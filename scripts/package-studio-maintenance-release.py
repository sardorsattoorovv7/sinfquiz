"""Package 7.26.1 after checking QA, preserved source, audio and every ZIP byte."""
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
qa = root / 'qa-7.26.1'
assert json.loads((root / 'package.json').read_text())['version'] == '7.26.1'
test_log = (qa / 'all-tests.log').read_text()
count = int(re.search(r'\btests (\d+)', test_log).group(1))
assert count >= 158 and re.search(r'\bpass ' + str(count) + r'\b', test_log)
assert re.search(r'\bfail 0\b', test_log)
assert 'built in' in (qa / 'build.log').read_text()


def result(name):
    return json.loads((qa / name).read_text())


studio = result('studio/studio-browser.json')
learning = result('learning/learning-browser.json')
english = result('english/english-browser.json')
competition = result('competition/competition-browser.json')
assert studio['passed'] and not studio['runtimeErrors']
assert all(studio[k] for k in [
    'purposeNavigation', 'triangleLiveCalculation', 'mobileDrawerEscape',
    'subjectsAndTheme', 'actualChemistryWorkbench', 'real3DMazeAndTextMode',
    'teacherPanel', 'topLevelReload', 'keyboardSearch',
    'searchDismissAndEmptyEnter', 'teacherChatRoute',
])
assert learning['passed'] and not learning['runtimeErrors']
assert all(learning[k] for k in [
    'realPythonWorker', 'realOfficeGrading', 'englishGatePreserved',
    'englishLessonWorks', 'activeReload', 'networkRecovery', 'teacherOwnership',
])
assert learning['canonicalScore'] == 32
assert english['passed'] and not english['errors']
assert competition['status'] == 'pass' and competition['stages'] == 5
assert not competition['runtimeErrors']
accessibility = []
for suite in ['studio', 'learning', 'english', 'competition']:
    rows = result(suite + '/accessibility.json')
    assert rows and all(not row['violations'] for row in rows), suite
    if suite == 'studio':
        assert len(rows) == studio['accessibilityChecks']
    accessibility.extend(rows)
assert len(accessibility) >= 31
catalog = json.loads((root / 'generated/iq-library-manifest.json').read_text())
assert catalog['items'] == 144 and catalog['books'] == 198

with ZipFile(args.baseline) as old:
    assert old.testzip() is None
    old_files = {}
    for info in old.infolist():
        if info.is_dir():
            continue
        name = PurePosixPath(info.filename)
        assert not name.is_absolute() and name.parts[0] == 'sinf-quiz'
        assert '..' not in name.parts
        relative = name.relative_to('sinf-quiz').as_posix()
        assert relative not in old_files
        old_files[relative] = old.read(info)
    for name, data in old_files.items():
        file = root / name
        assert file.is_file(), 'Missing baseline file: ' + name
        if name.startswith('public/') or file.suffix == '.sql' or name.startswith('api/'):
            assert file.read_bytes() == data, 'Protected asset/server changed: ' + name

audio = json.loads((root / 'public/english-course/v7.23/manifest.json').read_text())
assert len(audio) == 216
for item in audio:
    path = root / 'public/english-course/v7.23' / item['file']
    assert digest(path.read_bytes()) == item['audioSha256']

screenshots = {'home-desktop.png', 'math-triangle-mobile.png', 'teacher-desktop.png'}


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
    if rel.parts[0] == 'qa-7.26.1':
        if path.name in {'failure.txt', 'failure.png'}:
            return False
        if path.suffix == '.png':
            return rel.parent.as_posix() == 'qa-7.26.1/studio' and path.name in screenshots
    return True


release_path = root / 'RELEASE-7.26.1.json'
change_path = root / 'CHANGED-FILES-7.26.1.md'
release_path.touch()
change_path.touch()
files = sorted(p for p in root.rglob('*') if eligible(p))
names = {p.relative_to(root).as_posix() for p in files}
assert set(old_files) <= names, 'Packaging excludes an original file'
changed = sorted(name for name, data in old_files.items() if (root / name).read_bytes() != data)
new = sorted(names - set(old_files))
change_path.write_text(
    '# SinfQuiz 7.26.1 — o‘zgargan fayllar\n\n'
    '7.26 arxivi bilan baytlar bo‘yicha solishtirildi. Oldingi ' + str(len(old_files)) +
    ' fayl saqlangan. Public modellar/audio, API va SQL o‘zgarmagan.\n\n'
    '## Yangilangan\n\n' + '\n'.join('- `' + n + '`' for n in changed) +
    '\n\n## Yangi\n\n' + '\n'.join('- `' + n + '`' for n in new) +
    '\n\n`qa-7.26.1/` — joriy tekshiruv loglari, JSON natijalari va uchta ekran surati. '
    'Tarixiy QA fayllari arxivda alohida saqlanadi.\n'
)
report = {
    'version': '7.26.1', 'testedAt': '2026-10-08', 'files': len(files),
    'testsPassed': count, 'buildPassed': True, 'browserSuitesPassed': 4,
    'browserVersion': studio['browser'], 'accessibilityChecks': len(accessibility),
    'viewports': ['390x844 mobile', '1600x1050 desktop', '1920x1080 board'],
    'triangleChecks': ['8 * 5 / 2 = 20', '10 * 5 / 2 = 25'],
    'iqItemsPreserved': 144, 'originalTextbooksPreserved': 198,
    'previousArchiveFilesPreserved': len(old_files),
    'previousPublicAssetsUnchanged': True, 'existingAPIAndSQLUnchanged': True,
    'englishAudioHashesVerified': 216, 'newSQLRequiredFrom725Or726': False,
    'maintenanceChecks': ['keyboardSearch', 'topLevelReload',
                          'searchDismissAndEmptyEnter', 'teacherChatRoute',
                          'mobileDrawerFocusAndInertBackground'],
    'archiveValidation': 'All five local ZIP CRCs and the four-part byte union checked by this script',
    'deliveryVerification': 'Saved copies must be downloaded and compared to delivery SHA-256 before links are delivered',
    'scope': 'Local Chromium, SVG/WebGL, actual Python worker, PostgreSQL/PGlite RPC fixtures; no live Supabase/Vercel deployment tested',
}
release_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')

# Reject accidentally committed private credentials without printing their values.
for file in files:
    if file.suffix.lower() in {'.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.sql', '.log'} or file.name == '.env.example':
        text = file.read_text(errors='replace')
        assert not re.search(r'sb_secret_[A-Za-z0-9_-]{20,}', text), 'Private key in ' + str(file.relative_to(root))
        assert not re.search(r'\b\d{8,12}:[A-Za-z0-9_-]{30,}\b', text), 'Bot token in ' + str(file.relative_to(root))

args.output_dir.mkdir(parents=True, exist_ok=True)


def write_zip(filename, selected):
    target = args.output_dir / filename
    selected = sorted(selected)
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


full = write_zip('SinfQuiz-v7.26.1-Studio-UI.zip', files)
assert full['bytes'] < 50 * 1024 * 1024
groups = [[], [], [], []]
english_mp3 = []
for file in files:
    name = file.relative_to(root).as_posix()
    if name.startswith('public/english-course/'):
        if file.suffix.lower() == '.mp3':
            english_mp3.append(file)
        else:
            groups[1].append(file)
    elif name.startswith('public/cefr-audio/'):
        groups[3].append(file)
    else:
        groups[0].append(file)

# Alphabetic halves are very uneven. Balance audio bytes with 108 tracks in each bin.
assert len(english_mp3) == 216
loads = [0, 0]
tracks = [0, 0]
for file in sorted(english_mp3, key=lambda p: (-p.stat().st_size, p.as_posix())):
    candidates = [i for i in range(2) if tracks[i] < 108]
    i = min(candidates, key=lambda j: (loads[j], j))
    groups[i + 1].append(file)
    loads[i] += file.stat().st_size
    tracks[i] += 1
assert tracks == [108, 108]
parts = [write_zip(name, group) for name, group in zip([
    'SinfQuiz-v7.26.1-1-Kod-Modellar.zip',
    'SinfQuiz-v7.26.1-2-Ingliz-Audio-A.zip',
    'SinfQuiz-v7.26.1-3-Ingliz-Audio-B.zip',
    'SinfQuiz-v7.26.1-4-CEFR-Audio.zip',
], groups)]
assert all(p['bytes'] < 20 * 1024 * 1024 for p in parts)
assert all(p['bytes'] < 10 * 1024 * 1024 for p in parts[1:3])
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
delivery = {
    'version': '7.26.1', 'full': full, 'parts': parts,
    'partsUnionByteIdenticalToFull': True, 'baselineFilesPreserved': len(old_files),
    'englishTracksPerPart': tracks, 'accessibilityChecks': len(accessibility),
    'testsPassed': count,
}
(args.output_dir / 'DELIVERY-7.26.1.json').write_text(json.dumps(delivery, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(delivery, ensure_ascii=False))
