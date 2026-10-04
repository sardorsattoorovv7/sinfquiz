import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {BIOLOGY_ASSETS,biologyAssetUrl,biologySceneAssets} from '../src/biology-asset-catalog.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3,Vector3} from 'three';
import {instantiateBiologyAsset,disposeBiologyAsset,assetAnimation} from '../src/biology-asset-loader.js';
const asset=n=>readFileSync(new URL('../public/biology/v7.21/'+n,import.meta.url));
const manifest=JSON.parse(asset('manifest.json'));
const json=b=>JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
const structure=(file,key)=>manifest.assets[file].structures.find(s=>s.key===key);

test('bundled licensed models are complete, hashed and self-contained glTF 2.0 files',()=>{
 assert.equal(manifest.version,'7.21.0');
 for(const filename of Object.values(BIOLOGY_ASSETS)){
  const entry=manifest.assets[filename],b=asset(filename),d=json(b);
  assert.ok(entry?.author&&entry?.source&&entry?.license,filename);
  assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);
  assert.equal(entry.bytes,b.length);assert.equal(createHash('sha256').update(b).digest('hex'),entry.sha256);
  assert.equal(d.asset.version,'2.0');assert.ok(d.scenes.length&&d.meshes.length,filename);
  assert.ok(d.buffers.every(b=>!b.uri),'model cannot fetch arbitrary external buffers');
  assert.ok((d.images||[]).every(i=>i.bufferView!==undefined),'textures must ship inside the GLB');
  for(const a of d.accessors||[]){if(a.type==='VEC3'&&a.min){assert.ok(a.min.concat(a.max).every(Number.isFinite),filename)}}
 }
 assert.ok(Object.values(manifest.assets).reduce((s,a)=>s+a.bytes,0)<14*1024*1024,'all models stay under 14 MiB');
});
test('teacher scene choices use only known local assets, including hostile property names',()=>{
 for(const key of ['__proto__','constructor','toString','https://evil.test/model.glb',null,{},'../../file'])assert.throws(()=>biologyAssetUrl(key));
 for(const s of ['breathing','movement','senses','growth','habitat'])for(const key of biologySceneAssets(s))assert.match(biologyAssetUrl(key),/^\/biology\/v7\.21\/[a-z-]+\.glb$/);
 assert.deepEqual(biologySceneAssets('unknown'),[]);
});
test('anatomical coordinates preserve patient sides and source-derived organ relationships',()=>{
 const file='anatomy-organs.glb',right=structure(file,'right-kidney'),left=structure(file,'left-kidney'),brain=structure(file,'brain'),stomach=structure(file,'stomach'),lungs=structure('anatomy-lungs.glb','right-lung');
 assert.ok(right.bounds[1][0]<0&&left.bounds[0][0]>0,'patient right is negative x');
 assert.ok(brain.bounds[0][1]>lungs.bounds[1][1]);assert.ok(stomach.bounds[1][1]<brain.bounds[0][1]);
 assert.ok(right.fmaIds.includes('FMA7204')&&left.fmaIds.includes('FMA7205'));
 for(const key of ['right-atrium','left-atrium','right-ventricle','left-ventricle'])assert.ok(structure(file,key).sourceIds.length);
 for(const key of ['upper-arm-right','forearm-right','upper-arm-left','forearm-left','digits','feet','skull','ribcage'])assert.ok(structure('anatomy-skeleton.glb',key)?.sourceIds.length,key);
 const skull=structure('anatomy-skeleton.glb','skull');assert.ok(skull.bounds[0][1]>2.8,'skull cannot contain soft torso or eye aggregates');
 for(const a of Object.values(manifest.assets))for(const s of a.structures||[]){assert.ok(s.sourceIds.length&&s.fmaIds.length);assert.ok(s.triangles>0&&s.triangles<=s.sourceTriangles)}
});
test('native anatomical meshes parse, remain aligned, and instance materials do not mutate their source',async()=>{
 const b=asset('anatomy-organs.glb'),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const first=g.scene.children.find(n=>n.userData.key==='right-bronchial-tree'),old=first.material.color.clone();
 const copy=instantiateBiologyAsset(g,{filter:m=>m.userData.part==='lungs',height:3.7});
 let seen=0;copy.traverse(m=>{if(m.isMesh&&m.visible){seen++;m.material.color.setHex(0x000000)}});assert.equal(seen,3);assert.ok(first.material.color.equals(old));
 const raw=instantiateBiologyAsset(g,{center:false});raw.updateMatrixWorld(true);
 const kidney=raw.children[0].children[0].children.find(n=>n.userData.key==='right-kidney');assert.ok(new Box3().setFromObject(kidney).getCenter(new Vector3()).x<0);
 assert.equal(assetAnimation(copy),null,'anatomy never invents a walk animation');
 for(const root of [copy,raw])root.traverse(m=>{if(m.isMesh)m.material.dispose()});disposeBiologyAsset(g);
});
