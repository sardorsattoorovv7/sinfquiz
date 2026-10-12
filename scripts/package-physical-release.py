"""Package 7.31 only after current physics, database and browser checks pass."""
from pathlib import Path
import hashlib, json, re, sys, zipfile

root = Path(__file__).resolve().parents[1]
baseline, target = map(Path, sys.argv[1:3])
target.parent.mkdir(parents=True, exist_ok=True)
sha = lambda data: hashlib.sha256(data).hexdigest()
baseline_sha = sha(baseline.read_bytes())
assert baseline_sha == 'f65c530916499a34bfb498a3341ff1c8cd5e2ce24746a3f0eec8adcb3c2bd7f8'
qa = root / 'qa-7.31'
tests = (qa / 'node-tests.log').read_text()
count = int(re.findall(r'ℹ tests (\d+)', tests)[-1])
passed = int(re.findall(r'ℹ pass (\d+)', tests)[-1])
failed = int(re.findall(r'ℹ fail (\d+)', tests)[-1])
assert count == passed == 269 and failed == 0
assert 'built in ' in (qa / 'build.log').read_text()
assert (root / 'dist/assets').is_dir()

physical = json.loads((qa / 'physical/result.json').read_text())
assert len(physical['checks']) == 17 and all(physical['checks'].values()) and not physical['errors']
for name in ['src/space/physical.js', 'src/space/renderer.js', 'src/space/scenes-731.js', 'src/space/SpaceScene.jsx']:
    assert (qa / 'physical/result.json').stat().st_mtime >= (root / name).stat().st_mtime, name
space = json.loads((qa / 'space/result.json').read_text())
assert len(space['scenes']) == len(set(space['scenes'])) == 53
assert all(space['checks'].values()) and not space['errors']
assert (qa / 'space/result.json').stat().st_mtime >= (root / 'src/space/service.js').stat().st_mtime
axes = list(physical['axes']) + list(space['axes'])
other = {}
for label, filename in [('learning', 'learning-browser.json'), ('studio', 'studio-browser.json'), ('competition', 'results.json'), ('play', 'results.json')]:
    data = json.loads((qa / label / filename).read_text())
    assert not data.get('errors', []) and not data.get('runtimeErrors', []), label
    if label == 'play':
        assert all(data['checks'].values())
    else:
        assert data['passed']
    other[label] = data
    if label != 'play':
        axes.extend(json.loads((qa / label / 'accessibility.json').read_text()))
assert all(not x['violations'] for x in axes)

assert json.loads((root / 'package.json').read_text())['version'] == '7.31.0'
assert json.loads((root / 'package-lock.json').read_text())['version'] == '7.31.0'
chain = json.loads((root / 'migration-chain.json').read_text())
assert chain['version'] == '7.31.0' and len(chain['freshInstall']) == 52
assert chain['upgradeFrom7.30'] == ['supabase-migration-7.31.sql']
assert chain['upgradeFrom7.29'] == ['supabase-office-amaliy-fix.sql', 'supabase-migration-7.30.sql', 'supabase-migration-7.31.sql']
for name in chain['freshInstall']:
    assert (root / name).is_file()
assets = json.loads((root / 'public/space/v7.31/manifest.json').read_text())
for item in assets:
    data = (root / 'public/space/v7.31' / item['file']).read_bytes()
    assert sha(data) == item['sha256'] and len(data) == item['bytes']
assert len(re.findall('<loc>', (root / 'dist/sitemap.xml').read_text())) == 9

report = f'''# SinfQuiz 7.31.0 tekshiruvlari

- Node: {passed}/{count}, xato: {failed}. Fizik hisob, SQL/RLS, eski fanlar, typing, poyga, Office, Python va musobaqa testlari o‘tdi.
- Build muvaffaqiyatli. 9 ta sitemap manzili saqlandi, fizik atlasning public SEO sahifasida 53 hodisa ko‘rsatiladi.
- Fizika brauzeri: {len(physical['checks'])} tekshiruv. Quyoshning haqiqiy model koordinatasi, Yerning issiqlik rangi, qizish/sovish grafigi, suv zichligi, bosim, kabina ezilishi, gaz siqilishi va ikki kuzatuvning SQLga topshirilishi tekshirildi.
- Koinot atlasi: 53 sahna va {len(space['checks'])} oqim tekshiruvi; qoralamani tiklash, kamera, pauza, JSON yuklash, guruh ishi, ustoz fikri, boshqa ustozdan ajratish va WebGLsiz fallback o‘tdi.
- Yana 4 browser suite: IQ/darslik/Python/Office/ingliz tili; Matematika/Kimyo va umumiy navigatsiya; qisman tarkibdagi jamoa, mustaqil bosqichlar va vaqt; mehmon quiz reytingi, split 1v1 va typing.
- 390 px telefon, 1024 px planshet, 1600 px desktop va 1920 px katta ekran; sahifa eni toshishi aniqlanmadi. Tungi rejim tekshirildi.
- Axe: {len(axes)} holatda avtomatik WCAG 2.0/2.1/2.2 A/AA tekshiruvlari, topilgan xato yo‘q. Bu to‘liq qo‘lda accessibility auditi emas.
- Yangi Quyosh modeli {assets[0]['bytes']:,} bayt. Odam modeli mavjud BodyParts3D aktivini qayta ishlatadi. Oldingi SQL va public aktivlar baytlari o‘zgarmagan.
- ZIP CRC hamda paketlangan har bir faylning bayti tekshirildi; 7.30 dastur fayllari saqlangan. Ichki QA suratlari paketga kiritilmagan.

React, Three.js, haqiqiy Python worker va PGlite PostgreSQL ishlatildi. Auth/HTTP transport test fixture orqali berilgan. Production Supabase/Vercel, haqiqiy sho‘ng‘ish, haqiqiy kabina yoki 40 telefon yuklamasi bu ishda o‘lchanmagan. Fizik modellar ta’limiy soddalashtirish; server fizik natijani mustaqil attestatsiya qilmaydi. Qoralama tiklash hisob bo‘yicha ajratilgan, oldingi RLS siyosatlari o‘zgarmagan.

Dalillar `qa-7.31/` JSON va loglarida. Tekshiruv suratlari arxivga kiritilmagan. Migratsiya va ishga tushirish: `UPDATE-7.31.md`; model va aktivlar: `PHYSICS-7.31-SOURCES.md`.
'''
(root / 'QA-7.31.md').write_text(report)

def files():
    pairs = []
    for p in root.rglob('*'):
        if not p.is_file() or p.is_symlink():
            continue
        rel = p.relative_to(root)
        if any(x in ('node_modules', 'dist', '.git', '__pycache__') for x in rel.parts):
            continue
        if p.name.startswith('.env') and p.name != '.env.example':
            continue
        if rel.parts[0].startswith('qa-') and (p.suffix not in ('.json', '.log', '.txt') or 'failure' in p.name):
            continue
        if p.suffix == '.zip' and rel.parts[0] != 'public':
            continue
        pairs.append((p, 'sinf-quiz/' + rel.as_posix()))
    return pairs

with zipfile.ZipFile(baseline) as old:
    assert old.testzip() is None
    old_names = set(old.namelist())
    assert len(old_names) == 1101
    omitted = {name for name in old_names if name.startswith('sinf-quiz/qa-') and Path(name).suffix in ('.png', '.jpg', '.webp')}
    assert len(omitted) == 22
    retained = old_names - omitted
    new_pairs = files()
    assert retained <= {name for p, name in new_pairs}, 'Baseline application file missing'
    changed, added = [], []
    for p, name in new_pairs:
        if name in old_names:
            if old.read(name) != p.read_bytes():
                assert not name.startswith('sinf-quiz/public/') and not name.endswith('.sql'), name
                changed.append(name.removeprefix('sinf-quiz/'))
        else:
            added.append(name.removeprefix('sinf-quiz/'))
    for name in ['QA-7.31.md', 'CHANGED-FILES-7.31.md', 'RELEASE-7.31.0.json']:
        if name not in added:
            added.append(name)
    (root / 'CHANGED-FILES-7.31.md').write_text('# 7.31 o‘zgargan fayllar\n\n## O‘zgartirilgan\n\n' + '\n'.join('- `' + x + '`' for x in sorted(changed)) + '\n\n## Qo‘shilgan\n\n' + '\n'.join('- `' + x + '`' for x in sorted(added)) + '\n')
    receipt = {'version': '7.31.0', 'baselineSha256': baseline_sha, 'baselineFiles': len(old_names), 'preservedBaselineFiles': len(retained), 'omittedAuditScreenshots': len(omitted), 'nodeTests': count, 'nodePassed': passed, 'scenes': 53, 'physicsChecks': physical['checks'], 'spaceChecks': space['checks'], 'accessibilityStates': len(axes), 'otherBrowserSuites': list(other), 'assets': assets, 'migrationsFrom730': chain['upgradeFrom7.30']}
    (root / 'RELEASE-7.31.0.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    new_pairs = files()
    for p, name in new_pairs:
        if p.suffix in ('.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.sql', '.example'):
            body = p.read_text(errors='replace')
            assert not re.search(r'sb_secret_[A-Za-z0-9_-]{20,}', body), name
            assert not re.search(r'\b\d{8,12}:AA[A-Za-z0-9_-]{30,}\b', body), name
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for p, name in sorted(new_pairs, key=lambda pair: pair[1]):
            z.write(p, name)
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None and retained <= set(z.namelist())
        for p, name in new_pairs:
            assert z.read(name) == p.read_bytes(), name
    final_sha = sha(target.read_bytes())
    target.with_suffix('.sha256').write_text(final_sha + '  ' + target.name + '\n')
    print(json.dumps({'file': str(target), 'bytes': target.stat().st_size, 'files': len(new_pairs), 'sha256': final_sha, 'tests': count, 'axeStates': len(axes)}, indent=2))
