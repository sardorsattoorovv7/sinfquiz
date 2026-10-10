import {ISLAND_ASSET} from './island-asset.js';
export const MODEL_CACHE='sinfquiz-public-garden-v1';
// Cache only immutable, public model assets. Never cache sessions or student data.
export async function cachedGardenModel(url,{signal}={}) {
 if (![ISLAND_ASSET.url,ISLAND_ASSET.lowUrl].includes(url)) throw new Error('Unknown model asset');
 signal?.throwIfAborted();
 let cache;
 try { cache=await globalThis.caches?.open(MODEL_CACHE); } catch { /* private mode/quota: HTTP fallback */ }
 let saved;
 try { saved=await cache?.match(url); } catch { /* HTTP fallback */ }
 signal?.throwIfAborted();
 if(saved?.ok) return saved;
 const response=await fetch(url,{signal,cache:'force-cache'});
 if(response.ok&&cache){
  try { await cache.put(url,response.clone()); } catch { /* storage is optional */ }
 }
 signal?.throwIfAborted();
 return response;
}
