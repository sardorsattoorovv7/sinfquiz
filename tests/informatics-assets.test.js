import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Box3,Matrix4,Quaternion,Vector3} from 'three';
import {components} from '../src/informatics/content.js';
import {informaticsAssets,informaticsAssetUrl,REAL_PART_POS,assetTotals} from '../src/informatics/asset-catalog.js';
import {historicalModels,historicalEmbedUrl} from '../src/informatics/history-model-catalog.js';
const root=path.resolve('public/informatics/v7.44');
function glb(id){const bytes=fs.readFileSync(path.join(root,informaticsAssets[id].file));assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(bytes.readUInt32LE(16),0x4e4f534a);return {bytes,json:JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)))};}
function bounds(g,materialName=null){const box=new Box3();function walk(index,parent){const n=g.nodes[index],local=n.matrix?new Matrix4().fromArray(n.matrix):new Matrix4().compose(new Vector3(...(n.translation||[0,0,0])),new Quaternion(...(n.rotation||[0,0,0,1])),new Vector3(...(n.scale||[1,1,1]))),world=parent.clone().multiply(local);if(n.mesh!==undefined)for(const p of g.meshes[n.mesh].primitives){if(materialName&&g.materials[p.material]?.name!==materialName)continue;const a=g.accessors[p.attributes.POSITION];assert.ok(a.min&&a.max);const decode=v=>a.normalized?(a.componentType===5122?Math.max(-1,v/32767):a.componentType===5123?v/65535:a.componentType===5120?Math.max(-1,v/127):a.componentType===5121?v/255:v):v;const b=new Box3(new Vector3(...a.min.map(decode)),new Vector3(...a.max.map(decode))).applyMatrix4(world);box.union(b);}for(const child of n.children||[])walk(child,world);}for(const index of g.scenes[g.scene||0].nodes)walk(index,new Matrix4());return box;}
test('all 18 hardware parts are backed by complete local binary GLBs with embedded resources',()=>{
 assert.deepEqual(Object.keys(informaticsAssets).sort(),components.map(c=>c.id).sort());assert.equal(assetTotals.count,18);assert.ok(assetTotals.bytes<20*1024*1024);
 for(const c of components){const a=informaticsAssets[c.id],{bytes,json}=glb(c.id);assert.equal(bytes.length,a.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,c.id);assert.ok(json.meshes.length>0);assert.ok(json.asset.copyright?.includes(a.author));for(const b of json.buffers||[])assert.equal(b.uri,undefined);for(const t of json.images||[])assert.equal(t.uri,undefined);const box=bounds(json);assert.ok(!box.isEmpty(),c.id);assert.ok(box.min.toArray().concat(box.max.toArray()).every(Number.isFinite));}
});
test('imported meshes keep physical proportions and the ATX board is sized from its PCB',()=>{
 const size=id=>bounds(glb(id).json).getSize(new Vector3());assert.ok(Math.abs(size('case').y-4.53)<.01);assert.ok(Math.abs(size('ram').y-1.33)<.01);assert.ok(Math.abs(size('gpu').z-2.85)<.01);assert.ok(Math.abs(size('nvme').z-.8)<.005);assert.ok(Math.abs(size('cpu').y-.4)<.005);const pcb=bounds(glb('motherboard').json,'Board').getSize(new Vector3());assert.ok(Math.abs(pcb.y-3.05)<.01);assert.ok(Math.abs(pcb.z-2.445)<.02);assert.ok(size('rom').x<.03);
});
test('PCIe and SATA use actual connector geometry rather than a plate or whole motherboard',()=>{
 for(const id of ['pcie','sata']){const a=informaticsAssets[id],g=glb(id).json;assert.equal(a.kind,'source-model fragment');assert.equal(a.sourceFile,'motherboard');assert.ok(a.sourceRegion);assert.ok(a.faces>1000);assert.ok(g.materials.some(m=>m.name==='RouohghPlast'));assert.ok(!g.materials.some(m=>m.name==='Board'));assert.ok(!g.materials.some(m=>m.name==='Material.004'));}
 const sata=bounds(glb('sata').json).getSize(new Vector3());assert.ok(sata.y<.5&&sata.z<.3&&sata.x>.08);assert.ok(REAL_PART_POS.sata[2]<REAL_PART_POS.motherboard[2]);
});
test('third-party model provenance and licences are retained without relicensing the original cable asset',()=>{
 const thirdParty=Object.values(informaticsAssets).filter(a=>a.kind!=='original model');assert.equal(thirdParty.length,17);for(const a of thirdParty){assert.ok(/^https?:\/\/creativecommons\.org\/licenses\/by(?:-sa)?\/4\.0\/$/.test(a.license));assert.match(a.rawSha256,/^[0-9a-f]{64}$/);assert.ok(a.author&&a.source.startsWith('https://'));assert.match(a.commit,/^[a-f0-9]{40}$/);assert.ok(a.downloadSource.includes(a.commit));}
 const original=informaticsAssets.cables;assert.equal(original.author,'SinfQuiz');assert.match(original.license,/SINFQUIZ-ORIGINAL/);for(const file of ['CC-BY-4.0.txt','CC-BY-SA-4.0.txt','KiCad-LICENSE.md','CAD-AUTHORS.txt','SINFQUIZ-ORIGINAL.txt'])assert.ok(fs.statSync(path.join(root,'LICENSES',file)).size>100);
});
test('local asset URL lookup only admits known part identifiers',()=>{
 assert.equal(informaticsAssetUrl('ram'),'/informatics/v7.44/ram.glb');for(const id of ['../other','https://evil.example/model.glb','constructor','__proto__',null])assert.throws(()=>informaticsAssetUrl(id));
});
test('historical viewer records identify real historical subjects, preserve posters and constrain embeds',()=>{
 assert.equal(Object.keys(historicalModels).length,7);for(const [id,a]of Object.entries(historicalModels)){assert.ok(components.every(c=>c.id!==id)||id==='pc');assert.match(a.uid,/^[a-f0-9]{32}$/);const url=new URL(historicalEmbedUrl(id));assert.equal(url.origin,'https://sketchfab.com');assert.equal(url.pathname,`/models/${a.uid}/embed`);assert.ok(a.label&&a.author&&a.source&&a.license);const b=fs.readFileSync(path.join(root,'history',a.poster));assert.equal(createHash('sha256').update(b).digest('hex'),a.posterSha256);}
 assert.equal(historicalEmbedUrl('eniac'),null);assert.equal(historicalEmbedUrl('../anything'),null);assert.match(historicalModels.abacus.label,/zamonaviy/);assert.match(historicalModels.babbage.description,/non-working/);assert.ok(historicalModels.transistor.author.includes('Breno Valli'));
 const config=JSON.parse(fs.readFileSync('vercel.json','utf8')),policy=config.headers.flatMap(x=>x.headers).find(h=>h.key==='Content-Security-Policy').value;assert.match(policy,/frame-src 'self' https:\/\/oauth\.telegram\.org https:\/\/sketchfab\.com;/);assert.match(policy,/frame-ancestors 'none'/);
});
