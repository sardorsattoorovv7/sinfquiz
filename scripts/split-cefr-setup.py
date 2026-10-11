"""Create small SQL Editor files without changing any of the ten CEFR mocks."""
from pathlib import Path
import hashlib
import json
import re

root = Path(__file__).resolve().parents[1]
source = (root / 'supabase-migration-7.7.sql').read_text(encoding='utf-8')
head, tail = source.split('insert into public.cefr_builtin_bank(seed_key,payload)', 1)
before, bank = tail.split('$cefr_bank$', 1)
payload, after = bank.split('$cefr_bank$', 1)
items = json.loads(payload)
assert len(items) == 10 and len({x['seedKey'] for x in items}) == 10
_, finish = after.split('on conflict(seed_key) do update set payload=excluded.payload;', 1)
destination = root / 'sql/cefr-7.7'
destination.mkdir(parents=True, exist_ok=True)
files = [('01-schema.sql', head + '\ncommit;\n')]
for number, item in enumerate(items, 2):
    data = json.dumps(item, ensure_ascii=False, separators=(',', ':'))
    assert '$cefr_mock$' not in data
    files.append((f'{number:02}-mock.sql',
        "begin;\ninsert into public.cefr_builtin_bank(seed_key,payload)\n"
        "select item->>'seedKey',item-'seedKey' from (select "
        f"$cefr_mock${data}$cefr_mock$::jsonb item) source\n"
        "on conflict(seed_key) do update set payload=excluded.payload;\ncommit;\n"))
files.append(('12-finish.sql', 'begin;\n' + finish.lstrip()))
for name, sql in files:
    assert len(sql.encode()) < 150000, name
    (destination / name).write_text(sql, encoding='utf-8')
manifest = {
    'source': 'supabase-migration-7.7.sql',
    'sourceSha256': hashlib.sha256(source.encode()).hexdigest(),
    'mocks': 10,
    'files': [f'sql/cefr-7.7/{name}' for name, _ in files],
    'contentSha256': hashlib.sha256(json.dumps(items, ensure_ascii=False,
        sort_keys=True, separators=(',', ':')).encode()).hexdigest(),
}
(destination / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False,
    indent=2) + '\n', encoding='utf-8')
print(f'{len(files)} SQL files; all 10 original mocks preserved.')
