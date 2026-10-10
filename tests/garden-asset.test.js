import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ISLAND_ASSET} from '../src/island-asset.js';
const folder=new URL('../public/models/registan/v7.34/',import.meta.url);
const bytes=fs.readFileSync(new URL('registan.glb',folder));
const meta=JSON.parse(fs.readFileSync(new URL('provenance.json',folder),'utf8'));
const length=bytes.readUInt32LE(12),model=JSON.parse(bytes.subarray(20,20+length));
test('garden model retains embedded artist textures and compatible PBR materials',()=>{
 assert.equal(bytes.toString('utf8',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);
 assert.equal(meta.modelId,ISLAND_ASSET.id);assert.equal(meta.bytes,bytes.length);
 assert.equal(meta.sha256,createHash('sha256').update(bytes).digest('hex'));
 assert.ok(bytes.length<10_000_000);assert.ok(model.images.length>=3);
 assert.ok(model.images.every(i=>!i.uri&&Number.isInteger(i.bufferView)));
 assert.ok(model.buffers.every(b=>!b.uri));
 assert.ok(!(model.extensionsUsed||[]).includes('KHR_materials_pbrSpecularGlossiness'));
 assert.ok(model.materials.some(m=>m.pbrMetallicRoughness?.baseColorTexture));

 const license=fs.readFileSync(new URL('LICENSE.txt',folder),'utf8');
 assert.ok(license.includes(ISLAND_ASSET.id));assert.ok(license.includes('CC-BY-NC-4.0'));
});
test('mobile variant is no larger without external images or unsupported legacy materials',()=>{
 const low=fs.readFileSync(new URL('registan-low.glb',folder));
 const n=low.readUInt32LE(12),doc=JSON.parse(low.subarray(20,20+n));
 assert.equal(low.readUInt32LE(8),low.length);assert.ok(low.length<=bytes.length);
 assert.equal(meta.lowVariant.sha256,createHash('sha256').update(low).digest('hex'));
 assert.equal(doc.images.length,model.images.length);assert.ok(doc.images.every(i=>!i.uri));
 assert.ok(!(doc.extensionsUsed||[]).includes('KHR_materials_pbrSpecularGlossiness'));
 assert.equal(doc.meshes.length,model.meshes.length);
});
