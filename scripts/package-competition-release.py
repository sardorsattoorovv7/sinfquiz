"""Package the complete 7.24 source after its SQL/browser/load checks pass."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, hashlib, json, re
parser=argparse.ArgumentParser();parser.add_argument('--baseline',required=True,type=Path);parser.add_argument('--output',required=True,type=Path);args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
assert json.loads((root/'package.json').read_text())['version']=='7.24.0'
qa=root/'qa-7.24';tests=(qa/'all-tests.log').read_text();count=int(re.search(r'tests (\d+)',tests).group(1));assert f'pass {count}' in tests and 'fail 0' in tests
assert 'built in' in (qa/'build.log').read_text()
browser=json.loads((qa/'browser/competition-browser.json').read_text());attendance=json.loads((qa/'attendance/attendance-browser.json').read_text());load=json.loads((qa/'competition-load.json').read_text())
assert browser['status']=='pass' and not browser['runtimeErrors'] and attendance['passed'] and not attendance['runtimeErrors']
assert attendance['actualHttp'] and attendance['typingWorkerFailureFallsBack']
checks=[]
for file in ['browser/accessibility.json','attendance/accessibility.json']:
 rows=json.loads((qa/file).read_text());assert all(not r['violations'] for r in rows);checks+=rows
assert load['passed'] and load['updated']['concurrentStudents']==40 and load['updated']['stages']==10 and load['updated']['errors']==0
assert load['updated']['requests']>=900 and load['unchangedResponseReductionPercent']>90
# Preserve the previous English reliability evidence and every old source/public file.
assert json.loads((root/'qa-7.23.1/resilience-browser.json').read_text())['passed']
assert json.loads((root/'qa-7.23.1/regression/english-browser.json').read_text())['passed']
with ZipFile(args.baseline) as old:
 assert old.testzip() is None;previous=len(old.namelist())
 for name in old.namelist():
  path=root/name.removeprefix('sinf-quiz/');assert path.is_file(),name
  if name.startswith('sinf-quiz/public/'):assert path.read_bytes()==old.read(name),name
manifest=json.loads((root/'public/english-course/v7.23/manifest.json').read_text());assert len(manifest)==216
for item in manifest:assert hashlib.sha256((root/'public/english-course/v7.23'/item['file']).read_bytes()).hexdigest()==item['audioSha256']
def eligible(path):
 parts=path.relative_to(root).parts
 return path.is_file() and not path.is_symlink() and not any(p in {'node_modules','dist','.git','__pycache__','.pytest_cache'} for p in parts) and not any(p.startswith('.env') and p!='.env.example' for p in parts) and path.suffix!='.zip'
report={'version':'7.24.0','testsPassed':count,'browserSuitesPassed':2,'browserVersion':browser['browser'],'accessibilityChecks':len(checks),'buildPassed':True,'loadClients':40,'loadStages':10,'loadRequests':load['updated']['requests'],'loadErrors':0,'loadScope':load['scope'],'unchangedResponseReductionPercent':load['unchangedResponseReductionPercent'],'previousArchiveFilesPreserved':previous,'previousPublicAssetsUnchanged':True,'englishAudioHashesVerified':216,'migrationSha256':hashlib.sha256((root/'supabase-migration-7.24.sql').read_bytes()).hexdigest(),'archiveCRC':'Verified after creation'}
report_path=root/'RELEASE-7.24.json';report_path.write_text(json.dumps(report,indent=2)+'\n');files=sorted(p for p in root.rglob('*') if eligible(p));report['files']=len(files);report_path.write_text(json.dumps(report,indent=2)+'\n')
args.output.parent.mkdir(parents=True,exist_ok=True)
with ZipFile(args.output,'w',ZIP_DEFLATED,compresslevel=6) as archive:
 for p in files:archive.write(p,'sinf-quiz/'+p.relative_to(root).as_posix())
with ZipFile(args.output) as archive:
 assert archive.testzip() is None and len(archive.namelist())==len(files)
 for item in manifest:assert hashlib.sha256(archive.read('sinf-quiz/public/english-course/v7.23/'+item['file'])).hexdigest()==item['audioSha256']
print(json.dumps({'zip':str(args.output),'bytes':args.output.stat().st_size,'files':len(files),'crc':'passed','previousPublicAssets':'unchanged','audioHashes':216,'sha256':hashlib.sha256(args.output.read_bytes()).hexdigest()}))
