"""Package 7.25 only after current SQL, browser and regression checks pass."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, hashlib, json, re

parser = argparse.ArgumentParser()
parser.add_argument('--baseline', required=True, type=Path)
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
qa = root / 'qa-7.25'
assert json.loads((root / 'package.json').read_text())['version'] == '7.25.0'
tests = (qa / 'all-tests.log').read_text()
count = int(re.search(r'tests (\d+)', tests).group(1))
assert count >= 156 and f'pass {count}' in tests and 'fail 0' in tests
assert 'built in' in (qa / 'build.log').read_text()
browser = json.loads((qa / 'browser/learning-browser.json').read_text())
competition = json.loads((qa / 'regression/competition/competition-browser.json').read_text())
english = json.loads((qa / 'regression/english/english-browser.json').read_text())
assert browser['passed'] and not browser['runtimeErrors']
assert all(browser[k] for k in ['realPythonWorker', 'realOfficeGrading', 'englishGatePreserved', 'englishLessonWorks', 'activeReload', 'networkRecovery', 'teacherOwnership'])
assert browser['canonicalScore'] == 32
assert competition['status'] == 'pass' and competition['stages'] == 5 and not competition['runtimeErrors']
assert english['passed'] and not english['errors']
checks = []
for file in ['browser/accessibility.json', 'regression/competition/accessibility.json', 'regression/english/accessibility.json']:
    rows = json.loads((qa / file).read_text())
    assert all(not row['violations'] for row in rows), file
    checks += rows
assert len(checks) >= 18
manifest = json.loads((root / 'generated/iq-library-manifest.json').read_text())
assert manifest['items'] == 144 and manifest['books'] == 198
assert (root / 'supabase-migration-7.25.sql').stat().st_size < 150000

def eligible(path):
    parts = path.relative_to(root).parts
    return path.is_file() and not path.is_symlink() and not any(p in {'node_modules', 'dist', '.git', '__pycache__', '.pytest_cache'} for p in parts) and not any(p.startswith('.env') and p != '.env.example' for p in parts) and path.suffix != '.zip'

with ZipFile(args.baseline) as old:
    assert old.testzip() is None
    previous = len(old.namelist())
    old_files = {n.removeprefix('sinf-quiz/'): old.read(n) for n in old.namelist()}
    for name, data in old_files.items():
        file = root / name
        assert file.is_file(), name
        if name.startswith('public/'):
            assert file.read_bytes() == data, name

audio = json.loads((root / 'public/english-course/v7.23/manifest.json').read_text())
assert len(audio) == 216
for item in audio:
    assert hashlib.sha256((root / 'public/english-course/v7.23' / item['file']).read_bytes()).hexdigest() == item['audioSha256']

changed = sorted(name for name, data in old_files.items() if (root / name).read_bytes() != data)
report = {
    'version': '7.25.0', 'testedAt': '2026-10-07', 'testsPassed': count,
    'browserSuitesPassed': 3, 'browserVersion': browser['browser'],
    'accessibilityChecks': len(checks), 'buildPassed': True,
    'iqItems': 144, 'iqItemsPerRun': 32, 'originalTextbooks': 198,
    'criterionBasedScoresOnly': True, 'ageNormedIQValidationPerformed': False,
    'previousArchiveFilesPreserved': previous, 'previousPublicAssetsUnchanged': True,
    'englishAudioHashesVerified': 216,
    'migrationSha256': hashlib.sha256((root / 'supabase-migration-7.25.sql').read_bytes()).hexdigest(),
    'scope': 'Local Chromium and PostgreSQL/PGlite RPC fixtures; no live Supabase/Vercel or psychometric norming trial',
    'archiveCRC': 'Verified after creation',
}
report_path = root / 'RELEASE-7.25.json'
report_path.write_text(json.dumps(report, indent=2) + '\n')
change_path = root / 'CHANGED-FILES-7.25.md'
change_path.touch()
files = sorted(p for p in root.rglob('*') if eligible(p))
new = [p.relative_to(root).as_posix() for p in files if p.relative_to(root).as_posix() not in old_files]
change_path.write_text('# SinfQuiz 7.25 — o‘zgargan fayllar\n\n7.24 arxivi bilan baytlar bo‘yicha solishtirildi. Oldingi ' + str(previous) + ' fayl saqlangan; public aktivlar o‘zgarmagan.\n\n## Yangilangan\n\n' + '\n'.join('- `' + n + '`' for n in changed) + '\n\n## Yangi\n\n' + '\n'.join('- `' + n + '`' for n in new) + '\n\n`qa-7.25/` — ushbu relizda qayta bajarilgan testlar, loglar va ekran suratlari. Tarixiy QA hisobotlari alohida saqlanadi.\n')
report['files'] = len(files)
report_path.write_text(json.dumps(report, indent=2) + '\n')
args.output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(args.output, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for file in files:
        archive.write(file, 'sinf-quiz/' + file.relative_to(root).as_posix())
with ZipFile(args.output) as archive:
    assert archive.testzip() is None and len(archive.namelist()) == len(files)
    for item in audio:
        assert hashlib.sha256(archive.read('sinf-quiz/public/english-course/v7.23/' + item['file'])).hexdigest() == item['audioSha256']
print(json.dumps({'zip': str(args.output), 'bytes': args.output.stat().st_size, 'files': len(files), 'crc': 'passed', 'previousFiles': previous, 'publicAssets': 'unchanged', 'audioHashes': 216, 'sha256': hashlib.sha256(args.output.read_bytes()).hexdigest()}))
