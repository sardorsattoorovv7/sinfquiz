import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {informaticsAssetUrl} from './asset-catalog.js';
const cache=new Map();let bytesHeld=0;const MAX_BYTES=24*1024*1024;
export async function loadInformaticsAsset(id){
 let record=cache.get(id);
 if(!record){record={bytes:0,promise:null};record.promise=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const response=await fetch(informaticsAssetUrl(id),{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('Model fayli yuklanmadi.');const bytes=await response.arrayBuffer();if(bytes.byteLength<20||new DataView(bytes).getUint32(0,true)!==0x46546c67)throw Error('GLB model fayli buzilgan.');record.bytes=bytes.byteLength;bytesHeld+=bytes.byteLength;for(const [key,entry]of cache){if(bytesHeld<=MAX_BYTES)break;if(key!==id&&entry.bytes){bytesHeld-=entry.bytes;cache.delete(key);}}return bytes;}catch(error){if(cache.get(id)===record)cache.delete(id);throw error;}finally{clearTimeout(timer);}})();cache.set(id,record);}
 const data=await record.promise,loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);const gltf=await loader.parseAsync(data,INTERNAL_BASE);
 gltf.scene.userData.assetKey=id;gltf.scene.traverse(node=>{if(!node.isMesh)return;node.castShadow=false;node.receiveShadow=false;node.userData.part=id;node.userData.imported=true;const materials=Array.isArray(node.material)?node.material:[node.material];for(const material of materials){material.userData={...material.userData,baseOpacity:material.opacity,baseTransparent:material.transparent,baseDepthWrite:material.depthWrite,baseEmissive:material.emissive?.getHex()||0,baseEmissiveIntensity:material.emissiveIntensity??1};}});return gltf.scene;
}
const INTERNAL_BASE='/informatics/v7.44/';
export function disposeImportedModel(root){const geometries=new Set(),materials=new Set(),textures=new Set();root?.traverse(node=>{if(node.geometry)geometries.add(node.geometry);for(const m of (Array.isArray(node.material)?node.material:[node.material]).filter(Boolean)){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures){t.dispose();t.source?.data?.close?.();}}
