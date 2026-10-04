// Extract source mesh positions without changing their shape. Run before the
// Python converter; no server or browser is required for texture-free HRA GLB.
import {readFileSync,writeFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Vector3} from 'three';
const dir=process.argv[2],b=readFileSync(dir+'/hra-lung.glb'),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
g.scene.updateMatrixWorld(true);const out=[];
g.scene.traverse(n=>{if(!n.isMesh||!n.name.includes('bronchopulmonary_segment'))return;const a=n.geometry.attributes.position,p=[];for(let i=0;i<a.count;i++)p.push(...new Vector3().fromBufferAttribute(a,i).applyMatrix4(n.matrixWorld).toArray());out.push({name:n.name,position:p,index:Array.from(n.geometry.index.array)})});
writeFileSync(dir+'/hra-lung-meshes.json',JSON.stringify(out));console.log(out.length,'native lung segment meshes extracted');
