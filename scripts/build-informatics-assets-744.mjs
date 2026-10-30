// Optional asset preparation; the released GLBs are already in public/informatics/v7.44.
// Usage: node scripts/build-informatics-assets-744.mjs RAW_DIRECTORY TOOLS_NODE_MODULES
// Tools: @gltf-transform/{core,functions,extensions}, meshoptimizer, sharp, occt-import-js.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const raw=path.resolve(process.argv[2]||''),deps=path.resolve(process.argv[3]||'');
if(!process.argv[2]||!process.argv[3])throw Error('Provide the raw asset directory and optional build tools node_modules.');
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(project,'public/informatics/v7.44');fs.mkdirSync(out,{recursive:true});
const load=async p=>import(pathToFileURL(path.join(deps,p)).href);
const {Document,NodeIO}=await load('@gltf-transform/core/dist/index.js');
const {ALL_EXTENSIONS}=await load('@gltf-transform/extensions/dist/index.js');
const {dedup,prune,weld,simplify,meshopt,textureCompress,getBounds,dequantize}=await load('@gltf-transform/functions/dist/index.js');
const {MeshoptEncoder,MeshoptDecoder,MeshoptSimplifier}=await load('meshoptimizer/index.js');
const require=createRequire(import.meta.url),sharp=require(path.join(deps,'sharp'));
const T=await import('three');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const input=JSON.parse(fs.readFileSync(path.join(raw,'acquisition.json'),'utf8'));
const boardQ=[.5,.5,-.5,.5],gpuQ=[.5,.5,.5,.5],identity=[0,0,0,1],turnY=[0,Math.SQRT1_2,0,Math.SQRT1_2];
const size=b=>b.max.map((v,i)=>v-b.min[i]),center=b=>b.max.map((v,i)=>(v+b.min[i])/2);
function materialBounds(doc,names){const b={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};for(const node of doc.getRoot().listNodes()){if(!node.getMesh()?.listPrimitives().some(p=>names.includes(p.getMaterial()?.getName())))continue;const a=getBounds(node);for(let i=0;i<3;i++){b.min[i]=Math.min(b.min[i],a.min[i]);b.max[i]=Math.max(b.max[i],a.max[i]);}}return b;}
function keepMaterials(doc,names){for(const n of doc.getRoot().listNodes()){const m=n.getMesh();if(!m)continue;for(const p of [...m.listPrimitives()])if(!names.includes(p.getMaterial()?.getName()))m.removePrimitive(p);if(!m.listPrimitives().length)n.setMesh(null);}}
async function cropRegion(doc,roi){await doc.transform(dequantize());const buffer=doc.getRoot().listBuffers()[0];for(const node of doc.getRoot().listNodes()){const mesh=node.getMesh();if(!mesh)continue;const matrix=new T.Matrix4().fromArray(node.getWorldMatrix());for(const prim of [...mesh.listPrimitives()]){if(prim.getMaterial()?.getName()==='Board'){mesh.removePrimitive(prim);continue;}const position=prim.getAttribute('POSITION'),indices=prim.getIndices(),count=indices?.getCount()||position.getCount(),keep=[];for(let j=0;j<count;j+=3){const tri=[0,1,2].map(k=>indices?indices.getScalar(j+k):j+k),points=tri.map(i=>new T.Vector3().fromArray(position.getElement(i,[])).applyMatrix4(matrix));if(points.every(v=>v.toArray().every((n,i)=>n>=roi.min[i]&&n<=roi.max[i])))keep.push(...tri);}if(!keep.length){mesh.removePrimitive(prim);continue;}const unique=[...new Set(keep)],map=new Map(unique.map((index,i)=>[index,i]));for(const semantic of prim.listSemantics()){const a=prim.getAttribute(semantic),width=a.getElementSize(),values=new Float32Array(unique.length*width);unique.forEach((index,i)=>values.set(a.getElement(index,[]),i*width));prim.setAttribute(semantic,doc.createAccessor(semantic+' cropped').setType(a.getType()).setArray(values).setBuffer(buffer));}prim.setIndices(doc.createAccessor('cropped indices').setType('SCALAR').setArray(new Uint32Array(keep.map(i=>map.get(i)))).setBuffer(buffer));}if(!mesh.listPrimitives().length)node.setMesh(null);}await doc.transform(prune());}
function normalize(doc,{rotation=identity,scale=1,anchor=null}={}){const scene=doc.getRoot().listScenes()[0],b=getBounds(scene),c=anchor||center(b),shift=doc.createNode('Source origin').setTranslation(c.map(v=>-v));for(const n of [...scene.listChildren()]){scene.removeChild(n);shift.addChild(n);}const fit=doc.createNode('Calibrated model').setRotation(rotation).setScale(Array.isArray(scale)?scale:[scale,scale,scale]);fit.addChild(shift);scene.addChild(fit);return {sourceBounds:b,anchor:c,scale,rotation};}
function addGeometry(doc,scene,name,geo,color,pos=[0,0,0],rotation=null){if(rotation)geo.applyMatrix4(rotation);const buffer=doc.getRoot().listBuffers()[0]||doc.createBuffer(),mesh=doc.createMesh(name),prim=doc.createPrimitive();for(const semantic of ['POSITION','NORMAL']){const a=geo.getAttribute(semantic.toLowerCase());if(a)prim.setAttribute(semantic,doc.createAccessor().setType('VEC3').setArray(new Float32Array(a.array)).setBuffer(buffer));}if(geo.index)prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(geo.index.array)).setBuffer(buffer));const c=new T.Color(color),mat=doc.createMaterial(name).setBaseColorFactor([c.r,c.g,c.b,1]).setMetallicFactor(name.includes('pin')?.65:.08).setRoughnessFactor(.45);prim.setMaterial(mat);mesh.addPrimitive(prim);scene.addChild(doc.createNode(name).setMesh(mesh).setTranslation(pos));geo.dispose();}
const occt=await require(path.join(deps,'occt-import-js'))();
function stepDocument(name){const result=occt.ReadStepFile(new Uint8Array(fs.readFileSync(path.join(raw,name+'.step'))),{linearUnit:'millimeter',linearDeflectionType:'absolute_value',linearDeflection:.035,angularDeflection:.3});if(!result.success)throw Error(name+' STEP conversion failed');const d=new Document(),buffer=d.createBuffer(),s=d.createScene();for(const [i,m]of result.meshes.entries()){const mesh=d.createMesh(m.name||name),material=d.createMaterial(m.name||name).setBaseColorFactor([...(m.color||[.16,.17,.18]),1]).setMetallicFactor(m.color&&m.color[0]>.5?.6:.1).setRoughnessFactor(.4),prim=d.createPrimitive().setAttribute('POSITION',d.createAccessor().setType('VEC3').setArray(new Float32Array(m.attributes.position.array)).setBuffer(buffer)).setIndices(d.createAccessor().setType('SCALAR').setArray(new Uint32Array(m.index.array)).setBuffer(buffer)).setMaterial(material);if(m.attributes.normal)prim.setAttribute('NORMAL',d.createAccessor().setType('VEC3').setArray(new Float32Array(m.attributes.normal.array)).setBuffer(buffer));mesh.addPrimitive(prim);s.addChild(d.createNode(m.name||`${name} ${i}`).setMesh(mesh));}if(name==='cmos'){const b=getBounds(s),c=center(b);addGeometry(d,s,'Coin cell body · original addition',new T.CylinderGeometry(10,10,3.2,48),'#c2c5c3',[c[0],c[1],b.max[2]-1.6],new T.Matrix4().makeRotationX(Math.PI/2));}return d;}
function cableDocument(){const d=new Document(),s=d.createScene();d.createBuffer();for(const z of [0,-1.6]){addGeometry(d,s,'ATX connector housing · original',new T.BoxGeometry(.16,.12,.54),'#202722',[0,z,0]);for(let i=0;i<24;i++){const row=Math.floor(i/12),col=i%12;addGeometry(d,s,'Connector pin · original',new T.CylinderGeometry(.006,.006,.04,8),'#c2ac76',[(row-.5)*.042,z+.07,(col-5.5)*.042]);}}for(let i=0;i<24;i++){const x=(Math.floor(i/12)-.5)*.042,z=(i%12-5.5)*.042,curve=new T.CatmullRomCurve3([new T.Vector3(x,0,z),new T.Vector3(.25+i*.006,-.4,z+.02),new T.Vector3(.3,-1.1,z+.02),new T.Vector3(x,-1.6,z)]);addGeometry(d,s,'Wire '+(i+1),new T.TubeGeometry(curve,24,.008,6,false),['#242c26','#b5a24b','#874d45','#293c31'][i%4]);}return d;}
const recipes=[
 {id:'case',file:'case',axis:1,length:4.53,rotation:turnY,ratio:.5},
 {id:'motherboard',file:'motherboard',board:true,rotation:boardQ,ratio:.25},
 {id:'cpu',file:'amd-cpu',length:.4,normalX:true,ratio:.8},
 {id:'cooler',file:'air-cooler',length:1.0,normalX:true,ratio:.8},
 {id:'ram',file:'ram',axis:2,length:1.33,rotation:boardQ,ratio:.75},
 {id:'rom',step:true,scale:.01,rotation:turnY},
 {id:'hdd',file:'hdd',length:1.47,flat:true,ratio:.65},
 {id:'ssd',file:'ssd',length:1.0045,flat:true,ratio:1},
 {id:'nvme',file:'storage',axis:0,length:.8,rotation:boardQ,ratio:1},
 {id:'gpu',file:'gpu',axis:1,length:2.85,rotation:gpuQ,ratio:.7},
 {id:'psu',file:'psu',axis:0,length:1.5,rotation:[0,1,0,0],ratio:.9,hide:['Object_78']},
 {id:'chipset',file:'motherboard',materials:['Chiipset','chipset_shiney','chipset_glow'],boardScale:true,rotation:boardQ,ratio:.7},
 {id:'cmos',step:true,scale:.01,rotation:turnY},
 {id:'sata',file:'motherboard',roi:{min:[10.2,12.3,-7.5],max:[12.3,14.5,-3.5]},boardScale:true,rotation:boardQ,ratio:.8},
 {id:'pcie',file:'motherboard',roi:{min:[-7.0,12.3,-9],max:[4.8,14.5,-7]},boardScale:true,rotation:boardQ,ratio:.8},
 {id:'io',file:'motherboard',materials:['IO_Metal.001','Scratchefdmeta','GoldWifi','BoardOfIO','IO_Heatsink_botton'],boardScale:true,rotation:boardQ,ratio:.7},
 {id:'fan',file:'fan',axis:0,length:1.2,rotation:identity,ratio:.9},
 {id:'cables',own:true},
];
const boardDoc=await io.read(path.join(raw,'motherboard.glb')),pcb=materialBounds(boardDoc,['Board']),boardScale=3.05/size(pcb)[2];
const selected=process.env.ATLAS_BUILD_IDS?.split(','),existing=selected?JSON.parse(fs.readFileSync(path.join(out,'SOURCES.json'),'utf8')).assets:[],records=[];
for(const recipe of recipes.filter(r=>!selected||selected.includes(r.id))){
 const doc=recipe.own?cableDocument():recipe.step?stepDocument(recipe.id):await io.read(path.join(raw,recipe.file+'.glb'));for(const node of doc.getRoot().listNodes())if(recipe.hide?.includes(node.getName()))node.setMesh(null);
 if(recipe.materials)keepMaterials(doc,recipe.materials);
 if(recipe.roi)await cropRegion(doc,recipe.roi);
 await doc.transform(prune(),dedup());
 const b=getBounds(doc.getRoot().listScenes()[0]),dims=size(b);let rotation=recipe.rotation||identity,scale=recipe.scale||1,anchor=recipe.board?center(pcb):null;
 if(recipe.normalX){const thin=dims.indexOf(Math.min(...dims));rotation=thin===1?[0,0,-Math.SQRT1_2,Math.SQRT1_2]:thin===2?turnY:identity;}
 if(recipe.flat){const thin=dims.indexOf(Math.min(...dims));rotation=thin===2?[-Math.SQRT1_2,0,0,Math.SQRT1_2]:thin===0?[0,0,Math.SQRT1_2,Math.SQRT1_2]:identity;}
 if(recipe.board||recipe.boardScale)scale=boardScale;else if(recipe.length)scale=recipe.length/(recipe.axis===undefined?Math.max(...dims):dims[recipe.axis]);
 const calibration=normalize(doc,{rotation,scale,anchor});
 await doc.transform(weld(),...(recipe.ratio&&recipe.ratio<1?[simplify({simplifier:MeshoptSimplifier,ratio:recipe.ratio,error:.0007,lockBorder:true})]:[]),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:88}),prune(),dedup(),meshopt({encoder:MeshoptEncoder,level:'high',quantizePosition:15,quantizeTexcoord:14}));
 const source=input.find(r=>r.id===(recipe.file||recipe.id));if(!source&&!recipe.own)throw Error('Missing source '+recipe.id);
 const bounds=getBounds(doc.getRoot().listScenes()[0]);const json={id:recipe.id,name:recipe.own?'ATX connector and wire teaching model':source.name,author:recipe.own?'SinfQuiz':source.author,authorUrl:source?.authorUrl||'',license:recipe.own?'/informatics/v7.44/LICENSES/SINFQUIZ-ORIGINAL.txt':source.license,source:source?.source||'',api:source?.api||'',downloadSource:source?.downloadSource||'',rawSha256:source?.rawSha256||'',commit:source?.commit||'',file:recipe.id+'.glb',kind:recipe.step?'CAD':recipe.materials||recipe.roi?'source-model fragment':recipe.own?'original model':'authored 3D model',changes:[recipe.step?'STEP triangulated to GLB':recipe.materials?'Named submeshes extracted':recipe.roi?'Physical connector region extracted from the motherboard':recipe.own?'Original geometry':'Geometry optimized', 'Centered, oriented and uniformly scaled','Meshopt compression; textures at most 1024 px'],calibration,bounds,sourceFile:recipe.file||recipe.id,...(recipe.roi?{sourceRegion:recipe.roi}:{})};
 doc.getRoot().getAsset().copyright=`${json.name} — ${json.author}; ${json.license}; ${json.source}`;doc.getRoot().setExtras({sinfquizSource:json.source,assetKind:json.kind,license:json.license});
 const output=await io.writeBinary(doc);fs.writeFileSync(path.join(out,json.file),output);json.bytes=output.byteLength;json.sha256=createHash('sha256').update(output).digest('hex');json.faces=doc.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0),0);records.push(json);console.log(recipe.id,json.bytes,Math.round(json.faces),JSON.stringify(size(bounds)));
}
const merged=recipes.map(r=>records.find(a=>a.id===r.id)||existing.find(a=>a.id===r.id));if(merged.some(x=>!x))throw Error('Asset manifest incomplete');fs.writeFileSync(path.join(out,'SOURCES.json'),JSON.stringify({version:'7.44.0',checkedAt:'2026-10-30',unit:'1 scene unit = 100 mm, visual teaching assembly',assets:merged},null,2)+'\n');
