import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadBiologyAsset,disposeBiologyAsset} from './biology-asset-loader.js';

// Imported BodyParts3D surfaces retain common, source anatomical coordinates.
export function mountAnatomy(host,initial,{onSelect,onReady,onFail,onStructure=()=>{},onLoading=()=>{}}){
 const low=(navigator.hardwareConcurrency||4)<=4||innerWidth<600;
 const renderer=new T.WebGLRenderer({antialias:!low,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,low?1:1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.localClippingEnabled=true;
 host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.02,120),controls=new OrbitControls(camera,renderer.domElement),world=new T.Group();scene.add(world);
 camera.position.set(0,-.34,15);controls.target.set(0,-.34,.25);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=1.2;controls.maxDistance=25;controls.update();
 scene.add(new T.HemisphereLight(0xffffff,0x59786b,2));
 for(const [color,intensity,pos] of [[0xfff5e6,2.6,[-5,7,8]],[0xb2d1fa,1.3,[5,3,-6]]]){const light=new T.DirectionalLight(color,intensity);light.position.set(...pos);scene.add(light)}
 const assets=new Map(),pending=new Map(),clip=new T.Plane(new T.Vector3(0,0,-1),10);
 let disposed=false,frame=null,token=0,ready=false,state=initial,lastMode='',meshes=[],loadedParts=[];
 async function ensure(key){
  if(assets.has(key))return assets.get(key);if(pending.has(key))return pending.get(key);
  const promise=loadBiologyAsset(key).then(gltf=>{pending.delete(key);if(disposed){disposeBiologyAsset(gltf);return null}assets.set(key,gltf);return gltf},error=>{pending.delete(key);throw error});pending.set(key,promise);return promise;
 }
 function request(){if(!disposed&&frame===null)frame=requestAnimationFrame(()=>{frame=null;if(disposed||document.hidden)return;const b=host.getBoundingClientRect();if(b.bottom<0||b.top>innerHeight)return;renderer.render(scene,camera);host.dataset.renderCount=String(Number(host.dataset.renderCount||0)+1)})}
 function clearWorld(){while(world.children.length)world.remove(world.children[0]);meshes=[]}
 function material(node,opacity){node.material.transparent=opacity<1;node.material.opacity=opacity;node.material.depthWrite=opacity>=1;node.material.emissive.setHex(node.userData.part===state.organ?0x14362c:0);node.material.emissiveIntensity=.15;node.material.clippingPlanes=state.layer==='inside'&&node.userData.part===state.organ?[clip]:[];node.material.needsUpdate=true;}
 function boundsFor(part){const box=new T.Box3();world.updateMatrixWorld(true);for(const m of meshes){if(m.visible&&(!part||m.userData.part===part)){m.geometry.computeBoundingBox();box.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld))}}return box}
 function focus(part=state.organ){const b=boundsFor(part);if(b.isEmpty())return;const c=b.getCenter(new T.Vector3()),size=b.getSize(new T.Vector3()),distance=Math.max(size.y,size.x)*2.45+1;controls.target.copy(c);camera.position.copy(c).add(new T.Vector3(0,.05,distance));controls.update();request()}
 function reset(){controls.target.set(0,-.34,.25);camera.position.set(0,-.34,15);controls.update();request()}
 function show(){
  clearWorld();const layer=state.layer,keys=layer==='outer'?['skin']:layer==='skeleton'?['skeleton']:layer==='muscles'?['skeleton','muscles']:layer==='inside'&&['skeleton','muscles','skin'].includes(state.organ)?[state.organ]:['organs','lungs'];
  for(const key of keys){const root=assets.get(key)?.scene;if(root){world.add(root);root.traverse(node=>{if(node.isMesh){node.visible=layer==='inside'?node.userData.part===state.organ:!node.userData.key?.endsWith('bronchial-tree');material(node,layer==='muscles'&&key==='skeleton'?.45:1);meshes.push(node)}})}}
  if(layer==='organs'&&assets.has('skin')){const root=assets.get('skin').scene;world.add(root);root.traverse(node=>{if(node.isMesh){node.visible=true;material(node,.045);meshes.push(node)}})}
  const b=boundsFor(state.organ);if(!b.isEmpty())clip.constant=b.max.z-(b.max.z-b.min.z)*(Math.max(0,Math.min(85,state.cut??28))/100);
  if(layer!=='inside')clip.constant=100;
  const mode=layer==='inside'?'inside:'+state.organ:layer;if(mode!==lastMode){lastMode=mode;if(layer==='inside')focus();else reset()}
  loadedParts=meshes.filter(m=>m.visible&&m.material.opacity>.2).map(m=>({key:m.userData.key,label:m.userData.label,part:m.userData.part}));
  host.dataset.assetSource='BodyParts3D+HuBMAP';host.dataset.meshes=String(loadedParts.length);host.dataset.layer=layer;host.dataset.cut=String(state.cut??28);onLoading(false);request();if(!ready){ready=true;onReady()}
 }
 async function update(p){
  state=p;const current=++token,keys=p.layer==='outer'?['skin']:p.layer==='skeleton'?['skeleton']:p.layer==='muscles'?['skeleton','muscles']:p.layer==='inside'&&['skeleton','muscles','skin'].includes(p.organ)?[p.organ]:['organs','skin','lungs'];onLoading(keys.some(k=>!assets.has(k)));
  try{await Promise.all(keys.map(ensure));if(!disposed&&current===token)show()}catch(e){if(!disposed&&current===token)onFail(e)}
 }
 function pick(key){const m=meshes.find(m=>m.userData.key===key);if(!m)return;onSelect(m.userData.part);onStructure({label:m.userData.label,part:m.userData.part,fmaIds:m.userData.fmaIds,source:m.userData.source||'BodyParts3D'});request()}
 const ray=new T.Raycaster(),pointer=new T.Vector2();let downAt;
 const down=e=>downAt=[e.clientX,e.clientY],up=e=>{if(!downAt||Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])>6)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(world.children,true).find(h=>h.object.visible&&h.object.material?.opacity>.2&&!(state.layer==='inside'&&clip.distanceToPoint(h.point)<0));if(hit)pick(hit.object.userData.key)},lost=e=>{e.preventDefault();onFail(new Error('WebGL aloqasi uzildi.'))};
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('webglcontextlost',lost);
 const resize=()=>{if(disposed)return;const w=host.clientWidth,h=host.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();request()}},ro=new ResizeObserver(resize),io=new IntersectionObserver(e=>{if(e[0]?.isIntersecting)request()});ro.observe(host);io.observe(host);controls.addEventListener('change',request);document.addEventListener('visibilitychange',request);window.addEventListener('scroll',request,{capture:true,passive:true});resize();update(initial);
 return {update,focus,reset,pick,parts:()=>loadedParts,rotate:d=>{camera.position.sub(controls.target).applyAxisAngle(new T.Vector3(0,1,0),d).add(controls.target);controls.update();request()},zoom:f=>{const v=camera.position.clone().sub(controls.target);v.setLength(T.MathUtils.clamp(v.length()*f,1.2,25));camera.position.copy(controls.target).add(v);controls.update();request()},dispose(){if(disposed)return;disposed=true;token++;if(frame!==null)cancelAnimationFrame(frame);ro.disconnect();io.disconnect();controls.removeEventListener('change',request);controls.dispose();document.removeEventListener('visibilitychange',request);window.removeEventListener('scroll',request,true);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',lost);for(const a of assets.values())disposeBiologyAsset(a);assets.clear();clearWorld();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();delete host.dataset.assetSource}};
}
