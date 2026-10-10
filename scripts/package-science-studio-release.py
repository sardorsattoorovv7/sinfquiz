"""Build a complete 7.26.2 ZIP and verify QA, provenance and every archive byte."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse
import hashlib
import json
import re
import shutil


def digest(data):
    return hashlib.sha256(data).hexdigest()


parser = argparse.ArgumentParser()
parser.add_argument('--baseline', required=True, action='append', type=Path)
parser.add_argument('--output-dir', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
qa = root / 'qa-7.26.2'
assert json.loads((root / 'package.json').read_text())['version'] == '7.26.2'
assert json.loads((root / 'package-lock.json').read_text())['version'] == '7.26.2'
test_log = (qa / 'all-tests.log').read_text()
count = int(re.search(r'\btests (\d+)', test_log).group(1))
assert count >= 165 and re.search(r'\bpass ' + str(count) + r'\b', test_log)
assert re.search(r'\bfail 0\b', test_log)
assert 'built in' in (qa / 'build.log').read_text()


def result(name):
    return json.loads((qa / name).read_text())


science = result('science/results.json')
play = result('secure-play/results.json')
studio = result('studio/studio-browser.json')
learning = result('learning/learning-browser.json')
english = result('english/english-browser.json')
competition = result('competition/competition-browser.json')
assert len(science['checks']) == 8 and all(science['checks'].values())
assert not science['errors']
assert len(play['checks']) == 4 and all(play['checks'].values())
assert not play['errors']
assert studio['passed'] and not studio['runtimeErrors']
assert all(studio[k] for k in [
    'purposeNavigation', 'topLevelReload', 'keyboardSearch',
    'triangleLiveCalculation', 'mobileDrawerEscape', 'subjectsAndTheme',
    'actualChemistryWorkbench', 'real3DMazeAndTextMode', 'teacherPanel',
    'teacherChatRoute', 'searchDismissAndEmptyEnter',
])
assert learning['passed'] and not learning['runtimeErrors']
assert learning['realPythonWorker'] and learning['realOfficeGrading']
assert learning['canonicalScore'] == 32 and learning['teacherOwnership']
assert english['passed'] and not english['errors']
assert competition['status'] == 'pass' and competition['stages'] == 5
assert not competition['runtimeErrors']
accessibility = []
for suite in ['science', 'studio', 'learning', 'english', 'competition']:
    rows = result(suite + '/accessibility.json')
    assert rows and all(not row['violations'] for row in rows), suite
    accessibility.extend(rows)
assert len(result('science/accessibility.json')) == 7
assert len(result('studio/accessibility.json')) == 13

# All four original parts form one baseline; reject traversal, conflicts or omissions.
original = {}
baselines = []
for path in args.baseline:
    with ZipFile(path) as old:
        assert old.testzip() is None, str(path)
        seen = set()
        for info in old.infolist():
            if info.is_dir():
                continue
            parsed = PurePosixPath(info.filename)
            assert not parsed.is_absolute() and parsed.parts[0] == 'sinf-quiz'
            assert '..' not in parsed.parts and info.filename not in seen
            seen.add(info.filename)
            name = parsed.relative_to('sinf-quiz').as_posix()
            data = old.read(info)
            assert name not in original or original[name] == data, name
            original[name] = data
        baselines.append({'name': path.name, 'sha256': digest(path.read_bytes()), 'files': len(seen)})
assert len(original) == 877, 'Use all four original 7.26.1 parts'
for name, data in original.items():
    file = root / name
    assert file.is_file(), 'Missing baseline file: ' + name
    if name.startswith('public/') or file.suffix == '.sql':
        assert file.read_bytes() == data, 'Preserved asset/migration changed: ' + name

audio = json.loads((root / 'public/english-course/v7.23/manifest.json').read_text())
assert len(audio) == 216
for item in audio:
    assert digest((root / 'public/english-course/v7.23' / item['file']).read_bytes()) == item['audioSha256']
bio = json.loads((root / 'public/biology/v7.21/manifest.json').read_text())
for name, item in bio['assets'].items():
    assert digest((root / 'public/biology/v7.21' / name).read_bytes()) == item['sha256'], name
assert (root / 'public/python-runtime/python_stdlib.zip').is_file()
assert json.loads((root / 'generated/iq-library-manifest.json').read_text())['books'] == 198


def eligible(path):
    rel = path.relative_to(root)
    if not path.is_file() or path.is_symlink():
        return False
    if any(p in {'node_modules', 'dist', '.git', '__pycache__', '.pytest_cache'} for p in rel.parts):
        return False
    if any(p.startswith('.env') and p != '.env.example' for p in rel.parts):
        return False
    # Python's standard library is itself a ZIP and must be shipped.
    if path.suffix == '.zip' and rel.as_posix() != 'public/python-runtime/python_stdlib.zip':
        return False
    if rel.parts[0] == 'qa-7.26.2' and path.name in {'failure.txt', 'failure.png'}:
        return False
    return True


release_path = root / 'RELEASE-7.26.2.json'
change_path = root / 'CHANGED-FILES-7.26.2.md'
release_path.touch()
change_path.touch()
files = sorted(p for p in root.rglob('*') if eligible(p))
names = {p.relative_to(root).as_posix() for p in files}
assert set(original) <= names, 'Packaging excludes an original file'
changed = sorted(n for n, b in original.items() if (root / n).read_bytes() != b)
added = sorted(names - set(original))
change_path.write_text(
    '# SinfQuiz 7.26.2 — o‘zgargan fayllar\n\n'
    '7.26.1 Studio paketining to‘rt qismi bilan baytlar bo‘yicha solishtirildi. '
    'Bazadagi 877 faylning barchasi saqlangan. Mavjud 3D modellar, audio va oldingi SQL migratsiyalari o‘zgarmagan.\n\n'
    '## Asosiy o‘zgarishlar\n\n'
    '- `ScienceStudio.jsx`, `science-studio.css`, `science-measurements.js`: qisqa dars, tekshiruv, grafik, birliklar, taqqoslash va CSV.\n'
    '- `BiologyActivity.jsx`, biologiya model/workflow/3D: qoralama, faol boshlash, sharoitlarni taqqoslash, yomg‘ir hisobi va tayyor o‘simlik.\n'
    '- `ChemistryBench.jsx`, kimyo model/3D: dars bilan bog‘lanish, porsiya va suyultirish hisobi, ko‘rinadigan tajriba stoli.\n'
    '- `supabase-migration-7.26.2.sql`, `secure-play-service.js`, `supabase-data.js`: kalit serverda; ball, taymer va poyga g‘olibi serverda; sessiya va ustoz chegaralari.\n'
    '- `local-admin-api.js`, `api/telegram-auth.js`, `vite.config.js`: lokal server API va yangi Supabase server kaliti nomi.\n'
    '- `public/python-runtime/python_stdlib.zip`: lokal Python uchun zarur standart kutubxona.\n\n'
    '## Yangilangan fayllar\n\n' + '\n'.join('- `' + n + '`' for n in changed) +
    '\n\n## Qo‘shilgan fayllar\n\n' + '\n'.join('- `' + n + '`' for n in added) +
    '\n\n`qa-7.26.2/` joriy tekshiruv loglari, JSON natijalari va ikkita haqiqiy brauzer ekran suratini o‘z ichiga oladi.\n',
    encoding='utf-8'
)
report = {
    'version': '7.26.2', 'baseVersion': '7.26.1', 'testedAt': '2026-10-10',
    'files': len(files), 'testsPassed': count, 'buildPassed': True,
    'browserSuitesPassed': 6, 'browserVersion': studio['browser'],
    'accessibilityChecks': len(accessibility), 'scienceAndStudioAccessibilityChecks': 20,
    'viewports': ['390x844 mobile', '1600x1050 desktop', '1920x1080 board'],
    'baselineFilesPreserved': len(original), 'baselineParts': baselines,
    'existingPublicAssetsUnchanged': True, 'previousMigrationsUnchanged': True,
    'englishAudioHashesVerified': 216, 'biologyModelHashesVerified': len(bio['assets']),
    'pythonStandardLibraryIncluded': True,
    'requiredNewMigration': 'supabase-migration-7.26.2.sql',
    'security': ['server-held quiz keys', 'server grading and race winner', 'UID-bound sessions', 'RLS and replay checks'],
    'scope': 'Local Chromium, real React/WebGL/Python worker, PostgreSQL/PGlite RPC fixtures; no live Supabase/Vercel deployment or physical classroom load measured',
    'modelLimits': 'Stoichiometry and conservation checked; kinetics, foam and ecosystem indices are educational approximations',
    'changedFiles': changed, 'addedFiles': added,
}
release_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

# Scan text without exposing any credential value in an error message.
for file in files:
    if file.suffix.lower() in {'.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.sql', '.log', '.py'} or file.name == '.env.example':
        contents = file.read_text(errors='replace')
        assert not re.search(r'sb_secret_[A-Za-z0-9_-]{20,}', contents), 'Private key in ' + str(file.relative_to(root))
        assert not re.search(r'\b\d{8,12}:[A-Za-z0-9_-]{30,}\b', contents), 'Bot token in ' + str(file.relative_to(root))

args.output_dir.mkdir(parents=True, exist_ok=True)
target = args.output_dir / 'SinfQuiz-v7.26.2-Science-Studio.zip'
with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for file in files:
        archive.write(file, 'sinf-quiz/' + file.relative_to(root).as_posix())
with ZipFile(target) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(set(archive.namelist())) == len(files)
    for name in archive.namelist():
        parsed = PurePosixPath(name)
        assert not parsed.is_absolute() and '..' not in parsed.parts
        rel = parsed.relative_to('sinf-quiz').as_posix()
        assert archive.read(name) == (root / rel).read_bytes(), rel
assert target.stat().st_size < 50 * 1024 * 1024
for source, name in [
    (root / 'supabase-migration-7.26.2.sql', 'supabase-migration-7.26.2.sql'),
    (root / 'UPDATE-7.26.2.md', 'UPDATE-7.26.2.md'),
    (qa / 'science/biology-workbench.png', 'Biologiya-Studio-7.26.2.png'),
    (qa / 'science/chemistry-studio.png', 'Kimyo-Studio-7.26.2.png'),
]:
    shutil.copy2(source, args.output_dir / name)
delivery = {
    'version': '7.26.2', 'path': str(target.resolve()),
    'bytes': target.stat().st_size, 'files': len(files), 'crc': 'passed',
    'everyArchiveByteVerified': True, 'sha256': digest(target.read_bytes()),
    'baselineFilesPreserved': len(original), 'testsPassed': count,
    'accessibilityChecks': len(accessibility),
}
(args.output_dir / 'DELIVERY-7.26.2.json').write_text(json.dumps(delivery, indent=2, ensure_ascii=False) + '\n')
print(json.dumps(delivery, ensure_ascii=False))
