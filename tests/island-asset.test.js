import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
// Retained historical asset: ensure the previous licensed model remains intact.
const ISLAND_ASSET={id:'27910a201acb4a109f77baa5c073c7a3',source:'https://sketchfab.com/3d-models/fantasy-island-in-the-sky-27910a201acb4a109f77baa5c073c7a3',author:'Violette_Lass'};

const folder=new URL('../public/models/island/v7.29/',import.meta.url);
const bytes=fs.readFileSync(new URL('fantasy-island.glb',folder));
const meta=JSON.parse(fs.readFileSync(new URL('provenance.json',folder),'utf8'));
const length=bytes.readUInt32LE(12),model=JSON.parse(bytes.subarray(20,20+length));

test('the packaged artist model is a complete small GLB with embedded local textures',()=>{
 assert.equal(bytes.toString('utf8',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.optimizedSha256);
 assert.equal(bytes.length,meta.optimizedBytes);assert.ok(bytes.length<800000);
 assert.ok(model.buffers.every(b=>!b.uri));assert.ok(model.images.every(i=>!i.uri&&Number.isInteger(i.bufferView)));
 assert.ok(meta.textures.every(t=>t.width<=1024&&t.height<=1024));
 assert.deepEqual(model.extensionsRequired.sort(),['EXT_meshopt_compression','EXT_texture_webp','KHR_mesh_quantization'].sort());
});

test('batching preserves every animated subtree, all 28 channels and artist attribution',()=>{
 const targets=new Set(model.animations[0].channels.map(c=>c.target.node));
 function triangles(i){const n=model.nodes[i];return ('mesh' in n?model.meshes[n.mesh].primitives.reduce((sum,p)=>sum+model.accessors[p.indices].count/3,0):0)+(n.children||[]).reduce((sum,i)=>sum+triangles(i),0);}
 const subtrees=Object.fromEntries([...targets].map(i=>[model.nodes[i].name,triangles(i)]));
 assert.deepEqual(subtrees,meta.animatedSubtreeTriangles);
 assert.equal(subtrees.Sphere_219,38339);assert.equal(Object.keys(subtrees).length,11);
 assert.equal(model.animations.length,1);assert.equal(model.animations[0].channels.length,28);
 assert.equal(model.nodes.filter(n=>Number.isInteger(n.mesh)).length,23);
 assert.equal(meta.modelId,ISLAND_ASSET.id);assert.equal(meta.license,'CC BY 4.0');
 const license=fs.readFileSync(new URL('LICENSE.txt',folder),'utf8');assert.ok(license.includes(ISLAND_ASSET.source));assert.ok(license.includes(ISLAND_ASSET.author));
});
