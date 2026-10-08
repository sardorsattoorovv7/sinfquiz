import {solidNetModel,solidSection} from './math-solid-models.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {clone as skeletonClone} from 'three/addons/utils/SkeletonUtils.js';

const base=import.meta.env.BASE_URL||'/';
const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.48,metalness:.06,...extra});
const mesh=(geometry,color,extra)=>new T.Mesh(geometry,material(color,extra));
const models=new Map();
function model(name){const url=name==='robot'?`${base}models/RobotExpressive.glb`:`${base}models/castle/${name}.glb`;if(!models.has(url)){const promise=new GLTFLoader().loadAsync(url).catch(error=>{models.delete(url);throw error});models.set(url,promise)}return models.get(url)}
function disposeTree(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry&&!o.userData.shared)geometries.add(o.geometry);if(o.material&&!o.userData.shared)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
function cloneModel(asset,height){const node=skeletonClone(asset.scene),bounds=new T.Box3().setFromObject(node),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),group=new T.Group();node.position.set(-center.x,-bounds.min.y,-center.z);group.add(node);group.scale.setScalar(height/size.y);node.traverse(o=>{if(o.isMesh){o.userData.shared=true;o.castShadow=true;o.receiveShadow=true}});return group}

export function mountLearningScene(host,initial,{onReady,onFail}){
 let disposed=false,visible=true,frame=0,previous=0,live=initial,content=new T.Group(),lastSolid='',orbitChanged=false;
 const mode=initial.mode,renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,host.clientWidth<600?1:1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.localClippingEnabled=true;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.style.touchAction=mode==='maze'?'pan-y':'none';
 const scene=new T.Scene(),camera=mode==='maze'?new T.OrthographicCamera(-12,12,12,-12,.1,150):new T.PerspectiveCamera(36,1,.1,150);scene.add(content);
 scene.add(new T.HemisphereLight(0xe9f8ff,0x506873,1.5));const light=new T.DirectionalLight(0xffeed8,2.3);light.position.set(-8,16,10);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-16,right:16,top:16,bottom:-16,far:60});light.shadow.bias=-.001;scene.add(light);const fill=new T.DirectionalLight(0x80d8ef,.8);fill.position.set(6,5,-8);scene.add(fill);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=false;controls.enableZoom=mode==='solid';controls.minDistance=4;controls.maxDistance=35;controls.minPolarAngle=.28;controls.maxPolarAngle=1.25;controls.addEventListener('change',()=>{orbitChanged=true;if(mode==='solid'&&!disposed)renderer.render(scene,camera)});controls.enabled=mode!=='maze';
 const labelTextures=[];
 let mixers=[],player=null,hunter=null,gates=[],moveTarget=null,hunterTarget=null,heroObjects=[];
 function cameraAt(extent,maze=false){if(maze){const aspect=host.clientWidth/Math.max(1,host.clientHeight),half=extent*.58*Math.max(1,1.1/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.position.set(18,24,22);camera.lookAt(0,0,0);controls.target.set(0,0,0);camera.updateProjectionMatrix();controls.update();return}const aspect=host.clientWidth/Math.max(1,host.clientHeight),distance=extent/(2*Math.tan(T.MathUtils.degToRad(18)))*Math.max(1,1/aspect)*1.13;camera.position.set(distance*.37,distance*(maze ? .86 : .53),distance*.65);camera.lookAt(0,0,0);controls.target.set(0,0,0);controls.update()}
 function size(){if(disposed)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(mode==='maze')cameraAt(Math.max(live.level.grid[0].length,live.level.grid.length)*1.14,true);else if(mode==='atlas')cameraAt(9);else if(!orbitChanged)cameraAt(8.5);if(mode==='solid')renderer.render(scene,camera)}
 const resize=new ResizeObserver(size);resize.observe(host);const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false});observer.observe(host);
 const lost=e=>{e.preventDefault();onFail();};renderer.domElement.addEventListener('webglcontextlost',lost);
 function ready(){if(!disposed){size();onReady()}}
 function addOutline(m){const edge=new T.LineSegments(new T.EdgesGeometry(m.geometry,25),new T.LineBasicMaterial({color:0xe5fff8,transparent:true,opacity:.7}));m.add(edge)}
 function buildSolid(p){
  const sig=JSON.stringify([p.kind,p.a,p.b,p.h,p.r,p.open,p.section,p.sectionAt]);if(lastSolid===sig){content.rotation.y=T.MathUtils.degToRad(p.yaw||0);return}lastSolid=sig;scene.remove(content);disposeTree(content);content=new T.Group();scene.add(content);
  const {kind,a=3,b=2,h=3,r=2,open=0,section=false}=p;
  if((kind==='cube'||kind==='cuboid')&&!section){
   const w=a,d=kind==='cube'?a:b,height=kind==='cube'?a:h,t=open/100*Math.PI/2;
   const face=(w,h,color,parent,x=0,y=0,z=0)=>{const m=mesh(new T.PlaneGeometry(w,h),color,{side:T.DoubleSide});m.position.set(x,y,z);parent.add(m);addOutline(m);return m};
   const bottom=face(w,d,0x338c90,content,0,-height/2,0);bottom.rotation.x=-Math.PI/2;
   const front=new T.Group();front.position.set(0,-height/2,d/2);front.rotation.x=t;content.add(front);face(w,height,0x65c6ac,front,0,height/2);
   const back=new T.Group();back.position.set(0,-height/2,-d/2);back.rotation.x=-t;content.add(back);face(w,height,0x59b6ce,back,0,height/2);
   const top=new T.Group();top.position.y=height;top.rotation.x=Math.PI/2-t;back.add(top);face(w,d,0xf0bc75,top,0,d/2);
   for(const sign of [-1,1]){const pivot=new T.Group();pivot.position.set(sign*w/2,-height/2,0);pivot.rotation.z=-sign*t;content.add(pivot);const f=face(d,height,sign===1?0x7c9dde:0x9bcbbb,pivot,0,height/2);f.rotation.y=Math.PI/2}
   content.scale.setScalar(5/Math.max(w,d,height)/(1+open/140));
  }else if(open>0&&['prism','pyramid','cylinder','cone'].includes(kind)){
   content.add(solidNetModel(p,material));
  }else{
   let geometry;if(kind==='sphere')geometry=new T.SphereGeometry(r,32,24);else if(kind==='cylinder')geometry=new T.CylinderGeometry(r,r,h,32);else if(kind==='cone')geometry=new T.ConeGeometry(r,h,32);else if(kind==='pyramid'){geometry=new T.ConeGeometry(a/Math.SQRT2,h,4);geometry.rotateY(Math.PI/4)}else if(kind==='prism'){const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(a,0);shape.lineTo(0,-b);shape.closePath();geometry=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geometry.rotateX(-Math.PI/2);geometry.translate(-a/2,-h/2,-b/2)}else geometry=new T.BoxGeometry(a,kind==='cube'?a:h,kind==='cube'?a:b);
   const m=mesh(geometry,0x49b7a7,{side:T.DoubleSide});content.add(m);if(!section)addOutline(m);
   if(section){const cap=solidSection({...p,sectionAt:p.sectionAt??50}),shape=mesh(cap.geometry,0xf1b56d,{side:T.DoubleSide});shape.position.y=cap.y;if(kind==='prism'){shape.position.x=-a/2;shape.position.z=-b/2}content.add(shape);m.userData.cap=cap;}
  }
  const bounds=new T.Box3().setFromObject(content),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),factor=5/Math.max(size.x,size.y,size.z,.01);content.scale.multiplyScalar(factor);content.position.sub(center.multiplyScalar(factor));
  if(section){content.traverse(o=>{if(o.userData.cap){const y=o.userData.cap.y*content.scale.y+content.position.y;o.material.clippingPlanes=[new T.Plane(new T.Vector3(0,-1,0),y)]}})}
  content.rotation.y=T.MathUtils.degToRad(p.yaw||0);ready();
 }
 async function buildAtlas(){
  const geometries=[new T.BoxGeometry(2.2,2.2,2.2),new T.SphereGeometry(1.05,32,24),new T.ConeGeometry(1.05,2.4,32),new T.TorusGeometry(1.1,.32,16,48)];
  const colors=[0x78d5bf,0xf1c276,0x9cacec,0x80c6ec],positions=[[-1.5,.5,.4],[1.35,1.9,-.2],[1.7,-1.25,.5],[-2,-1.4,.3]];
  geometries.forEach((g,i)=>{const m=mesh(g,colors[i]);m.position.set(...positions[i]);m.rotation.set(.25,-.45,.13);m.userData.origin=m.position.y;content.add(m);heroObjects.push(m);if(i===0)addOutline(m)});
  ready();
  try{const asset=await model('tower-square');if(disposed)return;const tower=cloneModel(asset,1.8);tower.position.set(.3,-1.5,-1);content.add(tower)}catch{/* Geometric models remain usable. */}ready();
 }
 async function buildMaze(p){
  const {grid}=p.level,w=grid[0].length,h=grid.length,assets=await Promise.all(['wall-half','gate','tower-square','tree-small','flag','robot'].map(model));if(disposed)return;
  const toPoint=([x,y])=>new T.Vector3(x-(w-1)/2,0,y-(h-1)/2),floor=mesh(new T.BoxGeometry(w+1.8,.6,h+1.8),0x283d58);floor.position.y=-.38;floor.receiveShadow=true;content.add(floor);
  const tiles=[],walls=[];grid.forEach((row,y)=>[...row].forEach((v,x)=>(v==='#'?walls:tiles).push(toPoint([x,y]))));
  const tile=new T.InstancedMesh(new T.BoxGeometry(.94,.075,.94),material(0xd8e2ed),tiles.length),dummy=new T.Object3D();tiles.forEach((p,i)=>{dummy.position.copy(p);dummy.updateMatrix();tile.setMatrixAt(i,dummy.matrix)});tile.receiveShadow=true;content.add(tile);
  const wall=assets[0].scene;wall.updateMatrixWorld(true);wall.traverse(part=>{if(!part.isMesh)return;const instances=new T.InstancedMesh(part.geometry,part.material.clone(),walls.length);instances.material.color.set(0x727da6);instances.material.roughness=.9;instances.userData.shared=true;instances.userData.ownedMaterial=true;walls.forEach((p,i)=>{dummy.position.copy(p);dummy.scale.set(1,.4,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();instances.setMatrixAt(i,new T.Matrix4().multiplyMatrices(dummy.matrix,part.matrixWorld))});instances.castShadow=true;instances.receiveShadow=true;content.add(instances)});
  for(const [i,pos] of p.level.gateCells.entries()){const gate=cloneModel(assets[1],.8);gate.position.copy(toPoint(pos));const [x,y]=pos;gate.rotation.y=grid[y]?.[x-1]!=='#'&&grid[y]?.[x+1]!=='#'?0:Math.PI/2;content.add(gate);gates.push({key:pos.join(','),node:gate});const ring=mesh(new T.RingGeometry(.26,.34,24),0xf9b742,{side:T.DoubleSide});ring.rotation.x=-Math.PI/2;ring.position.copy(gate.position);ring.position.y=.09;content.add(ring);gates[i].ring=ring;
   const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const ctx=canvas.getContext('2d');ctx.fillStyle='#142d48';ctx.beginPath();ctx.arc(48,48,42,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a9e6dd';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 52px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),48,50);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;labelTextures.push(texture);const marker=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));marker.position.set(0,1.55/gate.scale.x,0);marker.scale.setScalar(.52/gate.scale.x);gate.add(marker);
  }
  const corners=[[-w/2+.5,-h/2+.5],[w/2-.5,-h/2+.5],[-w/2+.5,h/2-.5],[w/2-.5,h/2-.5]];corners.forEach(([x,z])=>{const tower=cloneModel(assets[2],1.15);tower.position.set(x,.1,z);content.add(tower)});
  for(let i=0;i<6;i++){const tree=cloneModel(assets[3],1.1);tree.position.set(i%2? w/2+.45:-w/2-.45,0,-h/2+2+i*(h-4)/6);content.add(tree)}
  const flag=cloneModel(assets[4],1.3);flag.position.copy(toPoint(p.level.exit));content.add(flag);
  player=cloneModel(assets[5],1.5);hunter=cloneModel(assets[5],1.5);[player,hunter].forEach((node,index)=>node.traverse(o=>{if(o.isMesh){const materialCopy=m=>{const copy=m.clone();copy.color?.lerp(new T.Color(index?0x993cd1:0x13b482),.85);return copy};o.material=Array.isArray(o.material)?o.material.map(materialCopy):materialCopy(o.material);o.userData.ownedMaterial=true}}));
  // Unscaled, high-contrast beacons make characters easy to locate on a phone.
  for(const [i,node] of [player,hunter].entries()){const marker=mesh(new T.SphereGeometry(.22,14,10),i?0xa942df:0x0aa775);marker.position.y=1.9/node.scale.x;marker.scale.setScalar(1/node.scale.x);node.add(marker);const ring=mesh(new T.RingGeometry(.28,.43,24),i?0xa942df:0x0aa775,{side:T.DoubleSide});ring.rotation.x=-Math.PI/2;ring.position.y=.12/node.scale.x;ring.scale.setScalar(1/node.scale.x);node.add(ring)}
  for(const node of [player,hunter]){content.add(node);const mixer=new T.AnimationMixer(node),idle=mixer.clipAction(assets[5].animations.find(a=>a.name==='Idle')),run=mixer.clipAction(assets[5].animations.find(a=>a.name==='Running'));idle.play();run.play();mixers.push({mixer,idle,run})}
  player.position.copy(toPoint(p.position||p.level.start));hunter.position.copy(toPoint(p.monster||p.level.monster));moveTarget=player.position.clone();hunterTarget=hunter.position.clone();ready();update(p);
 }
 function update(p){live=p;if(mode==='solid'){buildSolid(p);renderer.render(scene,camera)};if(mode==='maze'&&player){const w=p.level.grid[0].length,h=p.level.grid.length,toPos=([x,y])=>new T.Vector3(x-(w-1)/2,0,y-(h-1)/2);moveTarget.copy(toPos(p.position||p.level.start));hunterTarget.copy(toPos(p.monster||p.level.monster));const closed=new Set(p.closed||p.level.gateCells.map(x=>x.join(',')));for(const g of gates){g.node.visible=closed.has(g.key);g.ring.visible=g.node.visible}}}
 if(mode==='maze')buildMaze(initial).catch(()=>{if(!disposed)onFail()});else if(mode==='atlas')buildAtlas();else buildSolid(initial);
 function animate(now){frame=requestAnimationFrame(animate);if(disposed||document.hidden||!visible||now-previous<32)return;const dt=Math.min((now-previous)/1000,.065);previous=now;
  if(mode==='atlas'&&!reduced.matches)heroObjects.forEach((o,i)=>{o.position.y=o.userData.origin+Math.sin(now/1700+i)*.12;o.rotation.y+=dt*.08});
  if(player){[player,hunter].forEach((node,i)=>{const target=i?hunterTarget:moveTarget,d=target.clone().sub(node.position),moving=d.length()>.01;if(moving){node.rotation.y=Math.atan2(d.x,d.z);node.position.lerp(target,reduced.matches?1:Math.min(1,dt*12))}mixers[i].idle.setEffectiveWeight(moving?0:1);mixers[i].run.setEffectiveWeight(moving?1:0);if(!reduced.matches)mixers[i].mixer.update(dt)})}renderer.render(scene,camera);
 }
 size();if(mode!=='solid')frame=requestAnimationFrame(animate);else renderer.render(scene,camera);
 return {update,rotate(delta){camera.position.applyAxisAngle(new T.Vector3(0,1,0),delta);camera.lookAt(controls.target);controls.update();renderer.render(scene,camera)},zoom(f){camera.position.sub(controls.target).multiplyScalar(f).add(controls.target);controls.update();renderer.render(scene,camera)},reset(){orbitChanged=false;size()},dispose(){disposed=true;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);mixers.forEach(({mixer})=>mixer.stopAllAction());content.traverse(o=>{if(o.userData.ownedMaterial)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()});labelTextures.forEach(t=>t.dispose());disposeTree(scene);renderer.dispose();renderer.domElement.remove()}};
}
