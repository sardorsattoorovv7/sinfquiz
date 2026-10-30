// Optional reproducible fetch for the separately licensed 3D asset sources.
// Usage: node scripts/fetch-informatics-sources-744.mjs DESTINATION
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
if(!process.argv[2])throw Error('Provide a destination for the optional raw assets.');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'public/informatics/v7.44/SOURCES.json'),'utf8')),dest=path.resolve(process.argv[2]);fs.mkdirSync(dest,{recursive:true});
const sources=new Map();for(const asset of manifest.assets){if(!asset.downloadSource)continue;if(!sources.has(asset.sourceFile))sources.set(asset.sourceFile,{...asset,id:asset.sourceFile});}
for(const [id,asset]of sources){const extension=asset.downloadSource.endsWith('.step')?'step':'glb',output=path.join(dest,`${id}.${extension}`),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);try{const response=await fetch(asset.downloadSource,{signal:controller.signal});if(!response.ok)throw Error(id+': '+response.status);const bytes=Buffer.from(await response.arrayBuffer()),hash=createHash('sha256').update(bytes).digest('hex');if(hash!==asset.rawSha256)throw Error(id+': source hash differs; do not overwrite the reviewed source.');fs.writeFileSync(output,bytes);console.log(id,bytes.byteLength);}finally{clearTimeout(timer);}}
fs.writeFileSync(path.join(dest,'acquisition.json'),JSON.stringify([...sources.values()],null,2)+'\n');
