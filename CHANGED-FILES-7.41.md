# SinfQuiz 7.41.0 — o‘zgargan fayllar

7.40 ZIPdagi barcha 1317 fayl saqlandi. Oldingi 548 ta public/data/SQL fayli baytma-bayt o‘zgarmagan. Yangi dependency yoki SQL migratsiyasi yo‘q.

## Asosiy o‘zgarishlar

- `piano-selected-ready.js`, `piano-repertoire.js`: Belki va Tujh naqoratlari; jami 79 tayyor kuy.
- `CinemaPiano.jsx`: yangi darslar tavsifi va Tujh o‘quv ritmi izohi.
- `piano-selected-7.41.json`, generator, 2 MIDI: offline va manbasi ko‘rsatilgan melodiya.
- `piano-selected.test.js`: nota/MIDI mosligi, pauza, takror, qidiruv, offline avtoijro va to‘liq tutorial.
- Eski testlarda jami kuy sonlari va yangi hindcha filtr sanog‘i yangilandi; eski tekshiruvlar saqlandi.
- Ovoz va yonlama piano kodi o‘zgarmagan.

## Yangilangan

- `README.md`
- `package-lock.json`
- `package.json`
- `src/CinemaPiano.jsx`
- `src/piano-repertoire.js`
- `tests/piano-expansion.test.js`
- `tests/piano-requested.test.js`
- `tests/vercel.test.js`

## Qo‘shilgan

- `CHANGED-FILES-7.41.md`
- `PIANO-SOURCES-7.41.md`
- `QA-7.41.md`
- `RELEASE-7.41.0.json`
- `UPDATE-7.41.md`
- `data/piano-selected-7.41.json`
- `public/piano/selected-7.41/SOURCES.md`
- `public/piano/selected-7.41/manifest.json`
- `public/piano/selected-7.41/selected-belki-chorus.mid`
- `public/piano/selected-7.41/selected-tujh-mein-rab-dikhta-hai-chorus.mid`
- `qa-7.41.0/all-tests.log`
- `qa-7.41.0/build-final.log`
- `qa-7.41.0/performance.json`
- `qa-7.41.0/repertoire-build.json`
- `qa-7.41.0/source-fidelity.json`
- `qa-7.41.0/test-command.json`
- `scripts/build-selected-piano.mjs`
- `scripts/package-selected-piano-release.py`
- `src/piano-selected-ready.js`
- `tests/piano-selected.test.js`
