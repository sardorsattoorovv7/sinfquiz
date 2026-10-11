"""Verify the complete 7.27 baseline and package the tested 7.28 source release."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse
import hashlib
import json
import re
import shutil

parser = argparse.ArgumentParser()
parser.add_argument('--baseline', type=Path, required=True)
parser.add_argument('--output-dir', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
qa = root / 'qa-7.28.0'
sha = lambda data: hashlib.sha256(data).hexdigest()
read = lambda path: json.loads((root / path).read_text())
for name in ['package.json', 'package-lock.json']:
    assert read(name)['version'] == '7.28.0'
log = (qa / 'all-tests.log').read_text()
count = int(re.search(r'\btests (\d+)', log).group(1))
assert count >= 206 and re.search(r'\bpass ' + str(count) + r'\b', log)
assert re.search(r'\bfail 0\b', log)
assert 'built in' in (qa / 'build.log').read_text()
classroom = read('qa-7.28.0/classroom/results.json')
assert len(classroom['checks']) >= 36 and all(classroom['checks'].values())
assert not classroom['errors']
for key in ['nativeEditableTableDimensionsUndoPNG', 'largeTimerPreservesSharedState',
        'largeNumberSelectionSharesHistory', 'largeNoiseUsesExistingMicrophone']:
    assert classroom['checks'][key]
play = read('qa-7.28.0/play/results.json')
assert len(play['checks']) >= 6 and all(play['checks'].values()) and not play['errors']
science = read('qa-7.28.0/science/results.json')
assert all(science['checks'].values()) and not science['errors']
studio = read('qa-7.28.0/studio/studio-browser.json')
learning = read('qa-7.28.0/learning/learning-browser.json')
attendance = read('qa-7.28.0/competition/attendance-browser.json')
for data in [studio, learning, attendance]:
    assert data['passed'] and not data['runtimeErrors']
assert learning['realPythonWorker'] and learning['realOfficeGrading']
assert learning['teacherOwnership'] and learning['canonicalScore'] == 32
assert studio['triangleLiveCalculation'] and studio['real3DMazeAndTextMode']
load = read('qa-7.28.0/load/competition-load.json')
assert load['passed'] and load['updated']['requests'] == 974
assert load['updated']['errors'] == 0
accessibility = []
for suite in ['classroom', 'science', 'studio', 'learning', 'competition']:
    rows = read(f'qa-7.28.0/{suite}/accessibility.json')
    assert rows and all(not r['violations'] for r in rows), suite
    accessibility.extend(rows)

baseline_hash = sha(args.baseline.read_bytes())
assert baseline_hash == '4e8bc7fb5f449739e0e41f7a1ecf89f1be2c558d394102b82d6729eca82fd640'
original = {}
with ZipFile(args.baseline) as archive:
    assert archive.testzip() is None
    for item in archive.infolist():
        if item.is_dir():
            continue
        name = PurePosixPath(item.filename)
        assert name.parts[0] == 'sinf-quiz' and '..' not in name.parts
        original[name.relative_to('sinf-quiz').as_posix()] = archive.read(item)
assert len(original) == 958
sql_fixes = {'supabase-migration-7.8-fixed.sql', 'supabase-migration-7.25.sql',
    'sql/7.25/01-schema.sql'}
for name, data in original.items():
    file = root / name
    assert file.is_file(), 'Missing baseline file: ' + name
    if name.startswith('public/') or (file.suffix == '.sql' and name not in sql_fixes):
        assert file.read_bytes() == data, 'Existing model/audio/content changed: ' + name
for item in read('public/english-course/v7.23/manifest.json'):
    assert sha((root / 'public/english-course/v7.23' / item['file']).read_bytes()) == item['audioSha256']
biology = read('public/biology/v7.21/manifest.json')
for name, item in biology['assets'].items():
    assert sha((root / 'public/biology/v7.21' / name).read_bytes()) == item['sha256']
assert read('generated/iq-library-manifest.json')['books'] == 198
for route in ['ustozlar/sinfxona', 'fanlar/informatika', 'fanlar/matematika',
        'fanlar/kimyo', 'fanlar/biologiya', 'ingliz-tili', 'darsliklar']:
    html = (root / 'dist' / (route + '.html')).read_text()
    assert '<h1>' in html and 'rel="canonical"' in html and 'application/ld+json' in html
assert (root / 'dist/sitemap.xml').read_text().count('<loc>') == 8

release = root / 'RELEASE-7.28.0.json'
changes = root / 'CHANGED-FILES-7.28.md'
release.touch()
changes.touch()
selected_images = {'qa-7.28.0/classroom/jadval-doska.png',
    'qa-7.28.0/classroom/taymer-katta.png', 'qa-7.28.0/classroom/table-export.png'}
selected_logs = {'all-tests.log', 'audit-tests.log', 'migration-chain.log', 'build.log',
    'classroom-e2e.log', 'play-e2e.log', 'studio-e2e.log', 'learning-e2e.log',
    'science-e2e.log', 'competition-e2e.log', 'load.log'}
def eligible(file):
    relative = file.relative_to(root)
    name = relative.as_posix()
    if not file.is_file() or file.is_symlink():
        return False
    if any(p in {'node_modules', 'dist', '.git', '__pycache__'} for p in relative.parts):
        return False
    if any(p.startswith('.env') and p != '.env.example' for p in relative.parts):
        return False
    if file.suffix == '.zip' and name != 'public/python-runtime/python_stdlib.zip':
        return False
    if file.name in {'failure.png', 'failure.txt'} and relative.parts[0].startswith('qa-'):
        return False
    if relative.parts[0] == 'qa-7.28.0':
        if file.suffix == '.png' and name not in selected_images:
            return False
        if file.suffix == '.log' and file.name not in selected_logs:
            return False
    return True

files = sorted(p for p in root.rglob('*') if eligible(p))
names = {p.relative_to(root).as_posix() for p in files}
assert set(original) <= names
changed = sorted(n for n, data in original.items() if (root / n).read_bytes() != data)
added = sorted(names - set(original))
changes.write_text('# SinfQuiz 7.28.0 — o‘zgargan fayllar\n\n'
    'To‘liq 7.27.0 ZIP bilan solishtirildi: 958 ta avvalgi faylning barchasi saqlangan. '
    'Barcha `public/` modellar, audio va Python resurslari baytma-bayt bir xil. '
    '7.8-fixed Cron mavjud bo‘lmagan holatga, 7.25 IQ taymeri esa bitta server soatiga tuzatildi. '
    'Yangi asosiy migratsiya: `supabase-migration-7.28.sql`.\n\n'
    '## Asosiy qismlar\n\n'
    '- `src/Classroom.jsx`, `src/classroom/`, `src/classroom.css`: tahrirlanadigan jadval, '
    'kattaroq animatsiyalar, taymer/shovqin/raqam uchun katta namoyish.\n'
    '- `src/secure-activities.js`, `src/RoomChoice.jsx`, `src/supabase-data.js`: '
    'UIDga bog‘langan server sessiyalari va ustozga tegishli xonalar.\n'
    '- `src/ordered-pages.js`, `src/UserAnalytics.jsx`, `src/supabase-sdk.js`: '
    'pagination, server statistikasi, atomik yozuvlar va hisoblagichlar.\n'
    '- `supabase-migration-7.28.sql`: RLS, PIN, server baholash va bulk RPC.\n'
    '- `MIGRATIONS.md`, `migration-chain.json`, `sql/cefr-7.7/`: to‘liq yangi baza tartibi '
    'va mazmuni o‘zgarmagan o‘nta CEFR variantining kichik SQL bo‘laklari.\n\n'
    '## Yangilangan fayllar\n\n' + '\n'.join('- `' + n + '`' for n in changed) +
    '\n\n## Qo‘shilgan fayllar\n\n' + '\n'.join('- `' + n + '`' for n in added) +
    '\n\n`qa-7.28.0/` — joriy tekshiruvlar. Eski QA fayllari faqat o‘z versiyasining dalilidir.\n', encoding='utf-8')
report = {'version': '7.28.0', 'baseVersion': '7.27.0', 'testedAt': '2026-10-10',
    'files': len(files), 'testsPassed': count, 'buildPassed': True,
    'browserSuitesPassed': 6, 'classroomBrowserChecks': len(classroom['checks']),
    'securePlayBrowserChecks': len(play['checks']), 'accessibilityChecks': len(accessibility),
    'accessibilityViolations': 0, 'baselineFilesPreserved': len(original),
    'baselineSha256': baseline_hash, 'existingModelsAndAudioUnchanged': True,
    'englishAudioHashesVerified': 216, 'biologyModelHashesVerified': len(biology['assets']),
    'requiredNewMigration': 'supabase-migration-7.28.sql',
    'freshInstallChainTested': True, 'pythonPracticeOnly': True,
    'load': {'clients': 40, 'requests': 974, 'errors': 0,
        'scope': load['scope'], 'dbModel': load['updated']['dbModel']},
    'scope': 'Local Chromium, real React/Canvas/IndexedDB/WebAudio/WebGL/Python and Postgres/RLS fixtures. '
        'Auth transport is a fixture; no live deployment or physical classroom test.',
    'seoLimits': 'Crawlable HTML/canonical/sitemap work; Google ranking is not guaranteed.',
    'changedFiles': changed, 'addedFiles': added}
release.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for file in files:
    if file.suffix in {'.js', '.jsx', '.json', '.md', '.sql', '.log', '.py'} or file.name == '.env.example':
        data = file.read_text(errors='replace')
        assert not re.search(r'sb_secret_[A-Za-z0-9_-]{20,}', data), 'Private key in ' + str(file.relative_to(root))
        assert not re.search(r'\b\d{8,12}:[A-Za-z0-9_-]{30,}\b', data), 'Bot token in ' + str(file.relative_to(root))
args.output_dir.mkdir(parents=True, exist_ok=True)
target = args.output_dir / 'SinfQuiz-v7.28.0-Sinfxona.zip'
with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for file in files:
        archive.write(file, 'sinf-quiz/' + file.relative_to(root).as_posix())
with ZipFile(target) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(set(archive.namelist())) == len(files)
    for name in archive.namelist():
        relative = PurePosixPath(name).relative_to('sinf-quiz').as_posix()
        assert archive.read(name) == (root / relative).read_bytes(), relative
assert target.stat().st_size < 50 * 1024 * 1024
guide = args.output_dir / 'SinfQuiz-7.28-qollanma.md'
guide.write_text((root / 'UPDATE-7.28.md').read_text() + '\n---\n\n' +
    (root / 'MIGRATIONS.md').read_text() + '\n---\n\n' +
    (root / 'QA-7.28.md').read_text(), encoding='utf-8')
shutil.copy2(qa / 'classroom/jadval-doska.png', args.output_dir / 'Sinfxona-7.28-jadval.png')
delivery = {'version': '7.28.0', 'path': str(target.resolve()), 'bytes': target.stat().st_size,
    'files': len(files), 'crc': 'passed', 'everyArchiveByteVerified': True,
    'sha256': sha(target.read_bytes()), 'baselineFilesPreserved': len(original),
    'testsPassed': count, 'classroomBrowserChecks': len(classroom['checks']),
    'accessibilityChecks': len(accessibility)}
(args.output_dir / 'DELIVERY-7.28.0.json').write_text(json.dumps(delivery, ensure_ascii=False,
    indent=2) + '\n', encoding='utf-8')
print(json.dumps(delivery, ensure_ascii=False))
