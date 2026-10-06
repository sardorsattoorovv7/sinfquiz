"""Create and CRC-verify a complete source ZIP; exclude dependencies and private env files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import argparse
import hashlib
import json

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True, type=Path)
parser.add_argument('--baseline', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
assert version == '7.23.1'

def eligible(path):
    parts = path.relative_to(root).parts
    return (path.is_file() and not path.is_symlink()
            and not any(p in {'node_modules', 'dist', '.git', '__pycache__', '.pytest_cache'} for p in parts)
            and not any(p.startswith('.env') and p != '.env.example' for p in parts)
            and path.suffix != '.zip')

audio = json.loads((root / 'public/english-course/v7.23/manifest.json').read_text())
assert len(audio) == 216
for item in audio:
    data = (root / 'public/english-course/v7.23' / item['file']).read_bytes()
    assert hashlib.sha256(data).hexdigest() == item['audioSha256'], item['file']

old_count = None
if args.baseline:
    with ZipFile(args.baseline) as old:
        old_count = len(old.namelist())
        assert old.testzip() is None
        for name in old.namelist():
            target = root / name.removeprefix('sinf-quiz/')
            assert target.is_file(), name
            if name.startswith('sinf-quiz/public/'):
                assert target.read_bytes() == old.read(name), name

assert json.loads((root / 'qa-7.23.1/resilience-browser.json').read_text())['passed']
assert json.loads((root / 'qa-7.23.1/regression/english-browser.json').read_text())['passed']
for file in ['qa-7.23.1/accessibility.json', 'qa-7.23.1/regression/accessibility.json']:
    assert all(not row['violations'] for row in json.loads((root / file).read_text()))
assert 'tests 135' in (root / 'qa-7.23.1/all-tests.log').read_text()
assert 'pass 135' in (root / 'qa-7.23.1/all-tests.log').read_text()
assert 'built in' in (root / 'qa-7.23.1/build.log').read_text()

report_path = root / 'release-7.23.1.json'
report = {'version': version, 'audioFilesVerified': 216, 'previousArchiveFilesPreserved': old_count,
          'previousPublicAssetsUnchanged': bool(args.baseline), 'testsPassed': 135,
          'browserSuitesPassed': 2, 'accessibilityChecks': 10, 'buildPassed': True,
          'archiveCRC': 'Checked after creation; package is delivered only when verification passes.'}
report_path.write_text(json.dumps(report, indent=2) + '\n')
files = sorted(path for path in root.rglob('*') if eligible(path))
report['files'] = len(files)
report_path.write_text(json.dumps(report, indent=2) + '\n')
args.output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(args.output, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for file in files:
        archive.write(file, 'sinf-quiz/' + file.relative_to(root).as_posix())
with ZipFile(args.output) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(files)
    for item in audio:
        data = archive.read('sinf-quiz/public/english-course/v7.23/' + item['file'])
        assert hashlib.sha256(data).hexdigest() == item['audioSha256']
print(json.dumps({'zip': str(args.output), 'bytes': args.output.stat().st_size,
                  'files': len(files), 'crc': 'passed', 'audioHashes': 216,
                  'sha256': hashlib.sha256(args.output.read_bytes()).hexdigest()}))
