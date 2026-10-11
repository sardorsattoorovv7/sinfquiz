"""Verify the full 7.28 baseline and package the tested 7.29 source release."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, hashlib, json, re

parser = argparse.ArgumentParser()
parser.add_argument('--baseline', type=Path, required=True)
parser.add_argument('--output-dir', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
read = lambda name: json.loads((root / name).read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
for name in ['package.json', 'package-lock.json']:
    assert read(name)['version'] == '7.29.0'
chain = read('migration-chain.json')
assert chain['version'] == '7.29.0' and len(chain['freshInstall']) == 49
assert chain['upgradeFrom7.28'] == ['supabase-migration-7.29.sql']
assert (root / 'supabase-migration-7.29.sql').stat().st_size < 150000
log = (root / 'qa-7.29.0/all-tests.log').read_text()
assert re.search(r'(?:ℹ|#) fail 0\b', log)
count = int(re.search(r'(?:ℹ|#) pass (\d+)\b', log)[1])
assert count >= 220 and 'built in' in (root / 'qa-7.29.0/build.log').read_text()
free = read('qa-7.29.0/competition/results.json')
assert free['passed'] and not free['errors'] and len(free['checks']) == 14
assert all(free['checks'].values())
guided = read('qa-7.29.0/guided/competition-browser.json')
assert guided['status'] == 'pass' and guided['stages'] == 5 and not guided['runtimeErrors']
attendance = read('qa-7.29.0/attendance/attendance-browser.json')
learning = read('qa-7.29.0/learning/learning-browser.json')
for row in [attendance, learning]:
    assert row['passed'] and not row['runtimeErrors']
assert attendance['startingParticipants'] == 2 and attendance['initialCapacity'] == 6
assert attendance['emptyTeamUnranked'] and attendance['cancelPreservesResults']
assert learning['realPythonWorker'] and learning['realOfficeGrading'] and learning['teacherOwnership']
play = read('qa-7.29.0/play/results.json')
classroom = read('qa-7.29.0/classroom/results.json')
for row in [play, classroom]:
    assert not row['errors'] and all(row['checks'].values())
assert len(classroom['checks']) == 36
accessibility = []
for suite in ['competition', 'guided', 'attendance', 'learning', 'classroom']:
    rows = read(f'qa-7.29.0/{suite}/accessibility.json')
    assert rows and all(not r['violations'] for r in rows), suite
    accessibility.extend(rows)
load = read('qa-7.29.0/load/competition-free-load.json')
assert load['passed'] and load['clients'] == 40 and load['requests'] == 365 and load['errors'] == 0

baseline_hash = sha(args.baseline.read_bytes())
assert baseline_hash == 'f32052b56e5c6a367205403bd57050724bee34214259b2ea0f5b97409d1014cc'
original = {}
with ZipFile(args.baseline) as archive:
    assert archive.testzip() is None
    for info in archive.infolist():
        if info.is_dir():
            continue
        name = PurePosixPath(info.filename)
        assert name.parts[0] == 'sinf-quiz' and '..' not in name.parts
        original[name.relative_to('sinf-quiz').as_posix()] = archive.read(info)
assert len(original) == 1016
for name, data in original.items():
    file = root / name
    assert file.is_file(), 'Missing previous file: ' + name
    if name.startswith('public/') or file.suffix == '.sql':
        assert file.read_bytes() == data, 'Previous asset or migration changed: ' + name
audio = read('public/english-course/v7.23/manifest.json')
for row in audio:
    assert sha((root / 'public/english-course/v7.23' / row['file']).read_bytes()) == row['audioSha256']
biology = read('public/biology/v7.21/manifest.json')
for name, row in biology['assets'].items():
    assert sha((root / 'public/biology/v7.21' / name).read_bytes()) == row['sha256']
for route in ['ustozlar/sinfxona', 'fanlar/informatika', 'fanlar/matematika',
        'fanlar/kimyo', 'fanlar/biologiya', 'ingliz-tili', 'darsliklar']:
    html = (root / 'dist' / (route + '.html')).read_text()
    assert '<h1>' in html and 'rel="canonical"' in html and 'application/ld+json' in html
assert (root / 'dist/sitemap.xml').read_text().count('<loc>') == 8
release = root / 'RELEASE-7.29.0.json'
changes = root / 'CHANGED-FILES-7.29.md'
release.touch()
changes.touch()
allowed_logs = {'all-tests.log', 'build.log', 'competition-unit.log', 'free-e2e.log',
    'guided-e2e.log', 'attendance-e2e.log', 'learning-e2e.log', 'play-e2e.log',
    'classroom-e2e.log', 'load.log'}
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
    if relative.parts[0] == 'qa-7.29.0':
        if file.suffix == '.png' or file.name.startswith(('debug-', 'failure')):
            return False
        if file.suffix == '.log' and file.name not in allowed_logs:
            return False
    return True
files = sorted(p for p in root.rglob('*') if eligible(p))
names = {p.relative_to(root).as_posix() for p in files}
assert set(original) <= names
changed = sorted(n for n, data in original.items() if (root / n).read_bytes() != data)
added = sorted(names - set(original))
changes.write_text('# SinfQuiz 7.29.0 — o‘zgargan fayllar\n\n'
    'To‘liq 7.28.0 ZIPdagi 1016 faylning barchasi saqlangan. Avvalgi SQL, model, audio va '
    'Python resurslari baytma-bayt bir xil. Yangi migratsiya: `supabase-migration-7.29.sql`.\n\n'
    '## Asosiy o‘zgarishlar\n\n'
    '- `src/CompetitionRoom.jsx`, `src/CompetitionStagePicker.jsx`, `src/CompetitionBuilder.jsx`: '
    'asosiy yarim tarkib starti, erkin bosqichlar va shaxsiy taymerlar.\n'
    '- `src/CompetitionChallenges.jsx`, `src/competition-service.js`: qoralama tiklash/saqlash, '
    'almashtirishdan oldin yozish va muddat tugagandagi natija.\n'
    '- `data/office-729.js`, `src/OfficeLab.jsx`, `src/office-lab-model.js`, '
    '`src/excel-formula.js`: 12/12/10 savol, sarlavha formati, jadval/rasm, '
    'nisbiy/mutlaq/aralash katak ko‘chirish va xavfsiz IF/AND/OR hisoblash.\n'
    '- `data/competition-729/`, `scripts/build-competition-729.py`, '
    '`scripts/build-office-729.mjs`: qayta yaratiladigan qo‘shimcha SQL.\n'
    '- `src/supabase-data.js`: ustozga tegishli yangi to‘plam nusxalari.\n'
    '- `tests/competition-729.test.js`, `tests/competition-free-browser.cjs`, '
    '`tests/competition-free-load.mjs`: haqiqiy SQL, UI va 40 mijozli yuklama sinovi.\n\n'
    '## Yangilangan fayllar\n\n' + '\n'.join('- `' + n + '`' for n in changed) +
    '\n\n## Qo‘shilgan fayllar\n\n' + '\n'.join('- `' + n + '`' for n in added) +
    '\n\nJoriy tekshiruvlar `qa-7.29.0/`da. Eski QA faqat o‘z versiyasiga tegishli.\n', encoding='utf-8')
report = {'version':'7.29.0', 'baseVersion':'7.28.0', 'testedAt':'2026-10-11',
    'files':len(files), 'testsPassed':count, 'buildPassed':True,
    'browserSuitesPassed':6, 'freeOrderBrowserChecks':len(free['checks']),
    'classroomBrowserChecks':len(classroom['checks']),
    'accessibilityChecks':len(accessibility), 'accessibilityViolations':0,
    'baselineFilesPreserved':len(original), 'baselineSha256':baseline_hash,
    'previousSqlUnchanged':True, 'existingModelsAndAudioUnchanged':True,
    'englishAudioHashesVerified':len(audio), 'biologyModelHashesVerified':len(biology['assets']),
    'newQuestionCounts':{'keyboard':12,'word':12,'excel':10},
    'requiredNewMigration':'supabase-migration-7.29.sql', 'freshInstallMigrations':49,
    'freshInstallChainTested':True, 'pythonPracticeOnly':True,
    'load':{'clients':40,'requests':365,'errors':0,'scope':load['scope']},
    'scope':'Local Chromium/React/Canvas/Python/WebAudio and Postgres/RLS fixtures; Auth transport is a fixture. No live deployment or physical classroom measurement.',
    'changedFiles':changed, 'addedFiles':added}
release.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
for file in files:
    if file.suffix in {'.js','.jsx','.json','.md','.sql','.log','.py'} or file.name == '.env.example':
        data = file.read_text(errors='replace')
        assert not re.search(r'sb_secret_[A-Za-z0-9_-]{20,}', data), 'Private key in ' + str(file.relative_to(root))
        assert not re.search(r'\b\d{8,12}:[A-Za-z0-9_-]{30,}\b', data), 'Bot token in ' + str(file.relative_to(root))
args.output_dir.mkdir(parents=True, exist_ok=True)
target = args.output_dir / 'SinfQuiz-v7.29.0-Musobaqa.zip'
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
delivery = {'version':'7.29.0', 'path':str(target.resolve()), 'bytes':target.stat().st_size,
    'files':len(files), 'crc':'passed', 'everyArchiveByteVerified':True,
    'sha256':sha(target.read_bytes()), 'baselineFilesPreserved':len(original),
    'testsPassed':count, 'browserSuitesPassed':6,
    'accessibilityChecks':len(accessibility), 'loadClients':40,'loadRequests':365,'loadErrors':0}
(args.output_dir / 'DELIVERY-7.29.0.json').write_text(json.dumps(delivery, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(delivery, ensure_ascii=False))
