import {copyFileSync,existsSync,mkdirSync,readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=join(root,'node_modules','pyodide');
const target=join(root,'public','python-runtime');
const files=['pyodide.mjs','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'];
if(!existsSync(source))throw Error('Pyodide topilmadi. Avval npm ci bajaring.');
const metadata=JSON.parse(readFileSync(join(source,'package.json'),'utf8'));
if(metadata.version!=='0.29.4')throw Error('Pyodide versiyasi mos emas: '+metadata.version);
mkdirSync(target,{recursive:true});
for(const file of files){
 const from=join(source,file),to=join(target,file);
 copyFileSync(from,to);
}
console.log('Python muhiti tayyor: 5 ta mahalliy fayl.');
