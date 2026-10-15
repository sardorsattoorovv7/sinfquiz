# Python muhiti

Bu katalogdagi Pyodide 0.29.4 fayllari `npm ci` tugaganda avtomatik yaratiladi.
`npm run dev`, `npm start` va `npm run build` oldidan ham nusxalash bajariladi.

Manba: `package.json`da ko‘rsatilgan mahalliy `node_modules/pyodide` paketi.
Skript: `scripts/copy-python-runtime.mjs`.

ZIP hajmini kamaytirish uchun qayta yaratiladigan beshta fayl arxivga kiritilmagan:

- `pyodide.mjs`
- `pyodide.asm.js`
- `pyodide.asm.wasm`
- `python_stdlib.zip`
- `pyodide-lock.json`

Ular production build ichiga lokal nusxalanadi. Foydalanuvchi Python muharririni
ishga tushirgandagina yuklanadi. Alohida CDN yoki yangi konfiguratsiya kerak emas.
