import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cachedGardenModel} from '../src/garden-model-cache.js';
import {ISLAND_ASSET} from '../src/island-asset.js';
test('public model persists and a cache hit needs no network',async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches;const files=new Map();let requests=0;
 globalThis.caches={open:async()=>({match:async u=>files.get(u)?.clone(),put:async(u,r)=>files.set(u,r)})};
 globalThis.fetch=async()=>{requests++;return new Response('glb',{status:200})};
 try {assert.equal(await(await cachedGardenModel(ISLAND_ASSET.url)).text(),'glb');assert.equal(await(await cachedGardenModel(ISLAND_ASSET.url)).text(),'glb');assert.equal(requests,1);await assert.rejects(cachedGardenModel('/auth/session'));}
 finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches}
});
test('unavailable storage falls back; aborted request is rejected',async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches;
 globalThis.caches={open:async()=>{throw new Error('quota')}};globalThis.fetch=async()=>new Response('model');
 try{assert.equal(await(await cachedGardenModel(ISLAND_ASSET.lowUrl)).text(),'model');const c=new AbortController();c.abort();await assert.rejects(cachedGardenModel(ISLAND_ASSET.url,{signal:c.signal}));}
 finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches}
});
