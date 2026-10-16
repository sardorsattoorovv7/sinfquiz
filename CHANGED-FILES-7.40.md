# SinfQuiz 7.40.0 — o‘zgargan fayllar

7.39.0 ZIPdagi barcha 1294 yo‘l saqlandi. Oldingi 540 ta SQL/public/data resursi baytma-bayt o‘zgarmagan. Eski 72 kuy va 38 mashq saqlangan. Yangi SQL yoki dependency yo‘q.

## Asosiy o‘zgarishlar

- `piano-requested-ready.js` va `piano-repertoire.js`: beshta yangi o‘quv kuy, jami 77 tayyor kuy.
- `piano-audio.js`: umumiy chiqishni kuchaytirish, yumshoq cheklagich, 6/8 metronom.
- `piano-music.js`: yangi standart ovoz 90% va Master Gain 1.10×; mavjud tanlovlar saqlanadi.
- `CinemaPiano.jsx` va `piano-stage.css`: yangi ro‘yxat, izohlar va yonlama ovoz slayderi.
- `piano-requested-7.40.json`, `build-requested-piano.mjs`, yangi MIDIlar: offline qayta yaratiladigan nota darslari.
- `piano-requested.test.js`, `piano-audio-output.test.js`, `piano-stage.test.js`: kuy, tutorial, ovoz va mobil sozlama tekshiruvlari.

## Yangilangan

- `README.md`
- `package-lock.json`
- `package.json`
- `src/CinemaPiano.jsx`
- `src/piano-audio.js`
- `src/piano-music.js`
- `src/piano-repertoire.js`
- `src/piano-stage.css`
- `tests/piano-expansion.test.js`
- `tests/piano-focus.test.js`
- `tests/piano-repertoire.test.js`
- `tests/piano-solfege.test.js`
- `tests/piano-stage.test.js`
- `tests/vercel.test.js`

## Qo‘shilgan

- `CHANGED-FILES-7.40.md`
- `PIANO-SOURCES-7.40.md`
- `QA-7.40.md`
- `RELEASE-7.40.0.json`
- `UPDATE-7.40.md`
- `data/piano-requested-7.40.json`
- `public/piano/requested-7.40/SOURCES.md`
- `public/piano/requested-7.40/manifest.json`
- `public/piano/requested-7.40/requested-belalim-chorus.mid`
- `public/piano/requested-7.40/requested-bu-aksam-olurum-chorus.mid`
- `public/piano/requested-7.40/requested-calikusu-theme.mid`
- `public/piano/requested-7.40/requested-diet-mountain-dew.mid`
- `public/piano/requested-7.40/requested-unutmak-istiyorum-hook.mid`
- `qa-7.40.0/all-tests.log`
- `qa-7.40.0/build-final.log`
- `qa-7.40.0/performance.json`
- `qa-7.40.0/repertoire-build.json`
- `qa-7.40.0/source-fidelity.json`
- `scripts/build-requested-piano.mjs`
- `scripts/package-requested-piano-release.py`
- `src/piano-requested-ready.js`
- `tests/piano-audio-output.test.js`
- `tests/piano-requested.test.js`

Nahotki shu bo‘lsa sevgi hali qo‘shilmagan; sabab va manbalar `PIANO-SOURCES-7.40.md`da ochiq yozilgan. Tekshiruvlar `QA-7.40.md`da.
