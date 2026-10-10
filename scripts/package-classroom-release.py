"""Package Sinfxona 7.27.0 only after local QA and complete baseline verification."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse
import hashlib
import json
import re
import shutil


def sha(data):
    return hashlib.sha256(data).hexdigest()


parser = argparse.ArgumentParser()
parser.add_argument('--baseline', required=True, type=Path)
parser.add_argument('--output-dir', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
qa = root / 'qa-7.27.0'
for name in ['package.json', 'package-lock.json']:
    assert json.loads((root / name).read_text())['version'] == '7.27.0', name
log = (qa / 'all-tests.log').read_text()
count = int(re.search(r'\btests (\d+)', log).group(1))
assert count >= 188 and re.search(r'\bpass ' + str(count) + r'\b', log)
assert re.search(r'\bfail 0\b', log)
assert 'built in' in (qa / 'build.log').read_text()


def result(suite, filename):
    return json.loads((qa / suite / filename).read_text())


classroom = result('classroom', 'results.json')
assert len(classroom['checks']) >= 32 and all(classroom['checks'].values())
assert not classroom['errors']
science = result('science', 'results.json')
play = result('secure-play', 'results.json')
studio = result('studio', 'studio-browser.json')
learning = result('learning', 'learning-browser.json')
assert all(science['checks'].values()) and not science['errors']
assert all(play['checks'].values()) and not play['errors']
assert studio['passed'] and not studio['runtimeErrors']
assert all(studio[k] for k in ['purposeNavigation', 'topLevelReload', 'keyboardSearch',
    'triangleLiveCalculation', 'mobileDrawerEscape', 'subjectsAndTheme',
    'actualChemistryWorkbench', 'real3DMazeAndTextMode', 'teacherPanel', 'teacherChatRoute'])
assert learning['passed'] and not learning['runtimeErrors']
assert learning['realPythonWorker'] and learning['realOfficeGrading']
assert learning['canonicalScore'] == 32 and learning['teacherOwnership']
accessibility = []
for suite in ['classroom', 'science', 'studio', 'learning']:
    rows = result(suite, 'accessibility.json')
    assert rows and all(not row['violations'] for row in rows), suite
    accessibility.extend(rows)
assert len(result('classroom', 'accessibility.json')) == 5

# Production output must include genuinely crawlable pages rather than one SPA fallback.
seo_paths = ['ustozlar/sinfxona', 'fanlar/informatika', 'fanlar/matematika',
    'fanlar/kimyo', 'fanlar/biologiya', 'ingliz-tili', 'darsliklar']
for route in seo_paths:
    html = (root / 'dist' / (route + '.html')).read_text()
    assert '<h1>' in html and 'rel="canonical"' in html and 'application/ld+json' in html, route
assert (root / 'dist/sitemap.xml').read_text().count('<loc>') == 8
assert 'Sitemap:' in (root / 'dist/robots.txt').read_text()
assert (root / 'dist/og-sinfquiz.png').is_file()

original = {}
with ZipFile(args.baseline) as old:
    assert old.testzip() is None
    for item in old.infolist():
        if item.is_dir():
            continue
        name = PurePosixPath(item.filename)
        assert not name.is_absolute() and '..' not in name.parts
        assert name.parts[0] == 'sinf-quiz'
        rel = name.relative_to('sinf-quiz').as_posix()
        assert rel not in original
        original[rel] = old.read(item)
assert len(original) == 916, 'Use the complete 7.26.2 Science Studio ZIP'
assert sha(args.baseline.read_bytes()) == '08c431446d0fefc2e9fc36783d86bf7e409ba14e1c1d9ce4f27cc400d8299c75'
for name, data in original.items():
    file = root / name
    assert file.is_file(), 'Missing original file: ' + name
    if file.suffix == '.sql' or (name.startswith('public/') and name != 'public/robots.txt'):
        assert file.read_bytes() == data, 'Protected migration/model/audio changed: ' + name

audio = json.loads((root / 'public/english-course/v7.23/manifest.json').read_text())
assert len(audio) == 216
for row in audio:
    assert sha((root / 'public/english-course/v7.23' / row['file']).read_bytes()) == row['audioSha256']
biology = json.loads((root / 'public/biology/v7.21/manifest.json').read_text())
for name, row in biology['assets'].items():
    assert sha((root / 'public/biology/v7.21' / name).read_bytes()) == row['sha256']
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
    if path.suffix == '.zip' and rel.as_posix() != 'public/python-runtime/python_stdlib.zip':
        return False
    if rel.parts[0].startswith('qa-') and path.name in {'failure.png', 'failure.txt'}:
        return False
    return True


release = root / 'RELEASE-7.27.0.json'
changes = root / 'CHANGED-FILES-7.27.0.md'
release.touch()
changes.touch()
files = sorted(p for p in root.rglob('*') if eligible(p))
names = {p.relative_to(root).as_posix() for p in files}
assert set(original) <= names, 'Packaging omits an original file'
changed = sorted(n for n, b in original.items() if (root / n).read_bytes() != b)
added = sorted(names - set(original))
changes.write_text(
    '# SinfQuiz 7.27.0 — o‘zgargan fayllar\n\n'
    'To‘liq 7.26.2 ZIP bilan baytma-bayt solishtirildi: 916 ta avvalgi faylning '
    'barchasi paketda bor. SQL, 3D modellar va audio o‘zgarmagan. Sinfxona uchun yangi SQL yo‘q.\n\n'
    '## Asosiy o‘zgarishlar\n\n'
    '- `src/Classroom.jsx`, `src/classroom/`, `src/classroom.css`: doska, qoralama, '
    'taymer, mahalliy mikrofon va xolis raqam tanlash.\n'
    '- `src/App.jsx`, `src/StudioShell.jsx`, `src/studio-navigation.js`: '
    'ustoz/admin menyusi, to‘g‘ridan-to‘g‘ri kirish va brauzer Back nazorati.\n'
    '- `seo-pages.js`, `index.html`, `vite.config.js`, `vercel.json`, `public/seo.css`, '
    '`public/og-sinfquiz.png`, `public/robots.txt`: ochiq HTML sahifalar, sitemap, canonical va metadata.\n'
    '- `tests/classroom-*.test.js`, `tests/classroom-browser.cjs`, `tests/seo.test.js`: '
    'hisob, ruxsat, qurilma, saqlash va SEO tekshiruvi.\n\n'
    '## Yangilangan fayllar\n\n' + '\n'.join('- `' + n + '`' for n in changed) +
    '\n\n## Qo‘shilgan fayllar\n\n' + '\n'.join('- `' + n + '`' for n in added) +
    '\n\n`qa-7.27.0/` — joriy versiya natijalari. Eski QA fayllari o‘z versiyasining dalili sifatida saqlangan.\n',
    encoding='utf-8')
report = {
    'version': '7.27.0', 'baseVersion': '7.26.2', 'testedAt': '2026-10-10',
    'files': len(files), 'testsPassed': count, 'buildPassed': True,
    'browserSuitesPassed': 5, 'browserVersion': studio['browser'],
    'classroomBrowserChecks': len(classroom['checks']),
    'accessibilityChecks': len(accessibility), 'accessibilityViolations': 0,
    'viewports': ['390x844 mobile', '768x1024 tablet', '1600x1080 desktop', '1920x1080 projector'],
    'baselineFilesPreserved': len(original), 'baselineSha256': sha(args.baseline.read_bytes()),
    'existingModelsAndAudioUnchanged': True, 'previousMigrationsUnchanged': True,
    'englishAudioHashesVerified': 216, 'biologyModelHashesVerified': len(biology['assets']),
    'requiredNewMigration': None, 'pythonStandardLibraryIncluded': True,
    'newCrawlableHTMLPages': 7, 'sitemapURLs': 8,
    'classroomStorage': 'Per-UID IndexedDB, localStorage fallback; no cloud synchronization',
    'microphone': 'Relative 0–100; explicit permission; no recording/upload; cleaned up on exit',
    'scope': 'Local Chromium/real React/Canvas/WebAudio/IndexedDB/WebGL/Python and checked Postgres fixtures. '
        'Auth transport fixtures; controlled native audio. No live deployment, real Supabase accounts, '
        'physical microphone/projection or whole-class load measurement.',
    'seoLimits': 'Technical crawlability improved; Google indexing/rank is not guaranteed',
    'changedFiles': changed, 'addedFiles': added,
}
release.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

# Never echo any detected credential value into release logs.
for file in files:
    if file.suffix.lower() in {'.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.sql', '.log', '.py'} or file.name == '.env.example':
        contents = file.read_text(errors='replace')
        assert not re.search(r'sb_secret_[A-Za-z0-9_-]{20,}', contents), 'Private key in ' + str(file.relative_to(root))
        assert not re.search(r'\b\d{8,12}:[A-Za-z0-9_-]{30,}\b', contents), 'Bot token in ' + str(file.relative_to(root))

args.output_dir.mkdir(parents=True, exist_ok=True)
target = args.output_dir / 'SinfQuiz-v7.27.0-Sinfxona.zip'
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
for source, name in [(root / 'UPDATE-7.27.0.md', 'UPDATE-7.27.0.md'),
        (root / 'QA-7.27.0.md', 'QA-7.27.0.md'),
        (qa / 'classroom/sinfxona-preview.png', 'Sinfxona-7.27.0.png')]:
    shutil.copy2(source, args.output_dir / name)
delivery = {'version': '7.27.0', 'path': str(target.resolve()), 'bytes': target.stat().st_size,
    'files': len(files), 'crc': 'passed', 'everyArchiveByteVerified': True,
    'sha256': sha(target.read_bytes()), 'baselineFilesPreserved': len(original),
    'testsPassed': count, 'classroomBrowserChecks': len(classroom['checks']),
    'accessibilityChecks': len(accessibility)}
(args.output_dir / 'DELIVERY-7.27.0.json').write_text(json.dumps(delivery, indent=2, ensure_ascii=False) + '\n')
print(json.dumps(delivery, ensure_ascii=False))
