import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Original teaching reconstructions. Architectural details are illustrative,
// never presented as a measured archaeological survey.
export function createHistoryDiorama(topic){
 const root=new T.Group(),parts=Array.from({length:4},(_,i)=>{const p=new T.Group();p.userData.partIndex=i;root.add(p);return p;}),moving=[];
 const stone='#c9ad79',clay='#b67a51',ink='#304d4b',wood='#805c40',gold='#c69c51',blue='#76a4aa';
 const material=(c,opacity=1)=>new T.MeshStandardMaterial({color:c,roughness:.82,metalness:.03,transparent:opacity<1,opacity,side:T.DoubleSide});
 function shape(p,g,c,pos=[0,0,0],rotation=null){const m=new T.Mesh(g,material(c));m.position.set(...pos);if(rotation)m.rotation.set(...rotation);p.add(m);return m;}
 const box=(p,pos,size,c)=>shape(p,new T.BoxGeometry(...size),c,pos);
 const cylinder=(p,pos,r,h,c,rt=r)=>shape(p,new T.CylinderGeometry(rt,r,h,24),c,pos);
 const sphere=(p,pos,r,c)=>shape(p,new T.SphereGeometry(r,20,12),c,pos);
 function tube(p,points,r,c){return shape(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a))),48,r,8,false),c);}
 function roof(p,x,y,z,w=1.4,d=1.1){const m=shape(p,new T.ConeGeometry(w*.78,.65,4),clay,[x,y,z]);m.rotation.y=Math.PI/4;m.scale.z=d/w;return m;}
 function house(p,x,z,w=1.3){box(p,[x,.65,z],[w,1.3,1.1],stone);roof(p,x,1.58,z,w);box(p,[x,.38,z+.556],[.3,.76,.025],wood);for(const dx of [-.37,.37])box(p,[x+dx,.95,z+.562],[.18,.22,.027],ink);}
 function arch(p,x,y,z,w=1.1,h=1.4){box(p,[x-w/2,y+h/2,z],[.2,h,.3],stone);box(p,[x+w/2,y+h/2,z],[.2,h,.3],stone);const m=shape(p,new T.TorusGeometry(w/2,.12,8,32,Math.PI),stone,[x,y+h,z]);return m;}
 function columns(p,x,z,count=6){for(let i=0;i<count;i++){const xx=x+(i-(count-1)/2)*.52;cylinder(p,[xx,1.15,z],.12,2.1,stone);box(p,[xx,.15,z],[.35,.15,.35],stone);box(p,[xx,2.23,z],[.35,.18,.35],stone);}box(p,[x,2.43,z],[count*.54,.26,.48],stone);}
 function sheet(p,x,y,z,w=1,h=.05,d=.75){return box(p,[x,y,z],[w,h,d],'#eee1bf');}
 function writing(p,x,y,z,n=5){for(let i=0;i<n;i++)box(p,[x,y,z+(i-n/2)*.105],[.68,.012,.025],ink);}
 function palm(p,x,z){cylinder(p,[x,.8,z],.065,1.6,wood);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;tube(p,[[x,1.6,z],[x+Math.cos(a)*.45,1.8,z+Math.sin(a)*.45],[x+Math.cos(a)*.8,1.4,z+Math.sin(a)*.8]],.045,'#64855a');}}
 function carriage(p,x,z){box(p,[x,.6,z],[1.7,.7,.8],clay);for(const xx of [-.55,.55])for(const zz of [-.46,.46]){const w=cylinder(p,[x+xx,.23,z+zz],.24,.1,ink);w.rotation.x=Math.PI/2;}return p;}
 function person(p,x,z){cylinder(p,[x,.45,z],.12,.6,blue);sphere(p,[x,.88,z],.15,'#d7b68b');}
 function slab(p,x,z,w,d){box(p,[x,.08,z],[w,.16,d],stone);}
 const ground=shape(root,new T.CylinderGeometry(5.4,5.5,.18,80), '#a8936e',[0,-.13,0]);ground.userData.ground=true;
 const [a,b,c,d]=parts;
 switch(topic.scene){
 case 'village':
  for(const [x,z] of [[-2,-1],[0,-1.2],[1.5,-.8],[-1,.4]]){box(a,[x,.6,z],[1.4,1.2,1.25],clay);box(a,[x,.98,z],[.34,.06,.34],wood);for(const xx of [-.16,.16]){const ladder=cylinder(a,[x+xx,1,z+.4],.025,1.2,wood);ladder.rotation.x=.3;}for(let i=0;i<5;i++)box(a,[x,.45+i*.22,z+.55-i*.06],[.36,.035,.035],wood);}
  box(b,[2.4,.03,1.2],[2,.08,1.8],'#9b874e');for(let i=0;i<42;i++){const x=1.55+i%7*.26,z=.55+Math.floor(i/7)*.25,stalk=cylinder(b,[x,.27,z],.014,.5,gold);moving.push(t=>stalk.scale.y=.25+t*.75);shape(b,new T.ConeGeometry(.055,.16,5),gold,[x,.57,z]);}
  tube(c,[[-4.2,.03,2],[-2,.03,1.5],[0,.03,1.8],[3,.03,2.5]],.18,blue);
  cylinder(d,[-3,.6,1.1],.65,1.2,clay);shape(d,new T.ConeGeometry(.78,.55,20),gold,[-3,1.46,1.1]);break;
 case 'ziggurat':
  for(let i=0;i<5;i++)box(a,[-.8,.3+i*.48,-.65],[4.2-i*.68,.6,3.6-i*.56],clay);
  box(b,[-.8,3,-.65],[1.05,1.1,.9],stone);box(b,[-.8,2.9,-.18],[.35,.85,.04],ink);for(let i=0;i<14;i++)box(a,[-.8,.08+i*.17,2.4-i*.17],[.75,.17,.24],stone);
  const tablet=box(c,[2.6,.55,.9],[1.2,.14,1.55],clay);tablet.rotation.z=.1;
  for(let i=0;i<35;i++){const w=shape(c,new T.ConeGeometry(.045,.12,3),ink,[2.17+i%5*.18,.64,.3+Math.floor(i/5)*.18]);w.rotation.z=Math.PI/2;moving.push(t=>w.visible=i/35<=t);}
  const reed=cylinder(d,[3.1,1.2,-1],.045,1.6,gold);reed.rotation.z=-.7;break;
 case 'pyramid':
  for(let i=0;i<19;i++)box(a,[-.8,.12+i*.19,-.2],[4-i*.195,.19,4-i*.195],stone);
  const ramp=box(b,[1.1,.75,2.2],[1,1.5,2.4],clay);ramp.rotation.x=-.5;
  box(c,[-2.7,.18,2.4],[1.3,.25,.8],ink);box(c,[-2.7,.37,2.4],[.66,.18,.36],gold);tube(c,[[-2.7,.35,2.4],[-2.6,.35,1.7],[-1.6,.7,1]],.1,ink);
  box(d,[3.1,-.015,-.2],[.7,.05,7],blue);palm(d,2.4,-2);palm(d,3.8,2);break;
 case 'polis':
  slab(a,0,-1.5,4.2,2);columns(a,0,-.6);columns(a,0,-2.2);roof(a,0,2.95,-1.4,4.4,2.3);
  slab(b,0,1.2,4.7,2);for(let i=0;i<6;i++)person(b,(i-2.5)*.55,.9+i%2*.6);
  cylinder(c,[-2.8,.5,1.2],.38,.85,clay);for(let i=0;i<7;i++){const pebble=sphere(c,[-3.1+i*.09,1.1,1.2],.055,ink);moving.push(t=>pebble.position.y=1.1-Math.min(1,t*2+i*.02)*.65);}
  house(d,-3,-1.7,1);house(d,3,-1.7,1);break;
 case 'silk':
  for(const x of [-2.1,2.1])box(a,[x,.75,-1],[.4,1.5,2.7],clay);box(a,[0,.75,-2.3],[4.5,1.5,.4],clay);for(const x of [-1.4,0,1.4])arch(a,x,0,-2.05,.8,.8);arch(a,0,0,.45,1.3,1.2);
  for(let i=0;i<4;i++){const camel=new T.Group();b.add(camel);sphere(camel,[0,.8,0],.33,gold).scale.set(1.5,.65,.75);sphere(camel,[-.1,1.07,0],.18,gold);tube(camel,[[.32,.8,0],[.5,1.4,0],[.75,1.45,0]],.08,gold);for(const xx of [-.3,.3])for(const zz of [-.15,.15])cylinder(camel,[xx,.35,zz],.04,.7,wood);moving.push(t=>camel.position.set(-2.8+i*1.35+t*.9,0,2));}
  for(let i=0;i<6;i++)box(c,[-2.4+i%3*.45,.3+Math.floor(i/3)*.4,.3],[.4,.4,.5],i%2?blue:gold);
  for(const z of [-.9,0,.9])tube(d,[[-4,.01,z+2],[0,.01,2],[4,.01,z+2]],.025,'#e0c898');break;
 case 'observatory':
  cylinder(a,[-.6,.4,-.6],2.2,.8,clay);for(let i=0;i<22;i++){const t=i*Math.PI*2/22;cylinder(a,[-.6+Math.cos(t)*2,.95,-.6+Math.sin(t)*2],.06,1.1,stone);}
  for(const x of [-.18,.18])tube(b,[[x,-.1,1.6],[x,.1,1.2],[x,.7,.5],[x,1.65,-.2],[x,2.3,-.5]],.11,stone);
  for(let i=0;i<14;i++){const y=i*.14;box(b,[0,y,.9-i*.1],[.4,.025,.065],ink);}
  const sun=sphere(c,[1.5,3.5,-1],.22,gold);const beam=tube(c,[[1.5,3.5,-1],[0,.2,.7]],.018,gold);moving.push(t=>{sun.position.set(3*Math.cos(.25+t),2+2*Math.sin(t),-1);beam.rotation.z=t*.16;});
  sheet(d,2.9,.5,1.1,1.5,.1,1.6);writing(d,2.9,.56,1.1,10);break;
 case 'castle':
  for(const x of [-2,2])box(a,[x,.8,0],[.3,1.6,4],stone);for(const z of [-2,2]){box(a,[0,.8,z],[4,1.6,.3],stone);for(let i=0;i<12;i++)box(a,[-1.85+i*.34,1.7,z],[.22,.3,.35],stone);}a.traverse(m=>{if(m.isMesh)m.material.color.set(stone)});
  for(const x of [-2,2])for(const z of [-2,2]){cylinder(b,[x,1.1,z],.53,2.2,clay);for(let i=0;i<8;i++){const t=i*Math.PI/4;box(b,[x+Math.cos(t)*.45,2.3,z+Math.sin(t)*.45],[.22,.3,.22],stone);}}
  arch(c,0,0,2.2,1.2,1.3);const gate=box(c,[0,.7,2.2],[1.0,1.35,.1],wood);moving.push(t=>gate.position.y=.7+t*1.1);
  slab(d,0,0,3.5,3.5);cylinder(d,[0,.26,0],.4,.5,clay);break;
 case 'press':
  for(const x of [-1.2,1.2])box(a,[x,1.4,0],[.28,2.8,.35],wood);box(a,[0,2.65,0],[2.9,.25,.5],wood);box(a,[0,.7,0],[2.9,.25,2],wood);cylinder(a,[0,2.1,0],.12,1.3,ink);const platen=box(a,[0,1.52,0],[1.9,.22,1.2],wood);moving.push(t=>platen.position.y=1.52-Math.sin(t*Math.PI)*.55);
  for(let i=0;i<48;i++)box(b,[-.74+i%8*.21,.9,-.47+Math.floor(i/8)*.18],[.16,.12,.13],ink);
  sheet(c,2.6,.8,.4,1.7,.12,2);writing(c,2.6,.88,.4,12);box(c,[2.6,.65,.4],[1.8,.17,2.05],clay);
  cylinder(d,[-2.6,.4,.7],.45,.65,ink);sphere(d,[-2.6,.9,.7],.22,wood);break;
 case 'industry':
  box(a,[0,.7,-2.2],[5.2,1.4,.3],clay);for(const x of [-1.8,0,1.8])box(a,[x,.85,-2],[.75,.7,.025],blue);cylinder(a,[2.2,2,-2],.22,4,clay);
  const boiler=cylinder(b,[-2,.9,.1],.65,1.8,ink);boiler.rotation.z=Math.PI/2;tube(b,[[-1.7,1.6,0],[-.7,1.9,0],[.4,1.1,0]],.07,gold);
  box(c,[0,.75,.2],[1.2,.7,.8],wood);const piston=box(c,[.1,.85,.7],[.65,.1,.12],gold);moving.push(t=>piston.position.x=.1+Math.sin(t*Math.PI*4)*.35);
  const wheel=shape(d,new T.TorusGeometry(1,.09,10,48),ink,[1.8,1,1]);for(let i=0;i<8;i++){const r=box(wheel,[0,0,0],[.04,1.9,.05],gold);r.rotation.z=i*Math.PI/4;}moving.push(t=>wheel.rotation.z=-t*Math.PI*4);break;
 case 'rail':case 'war':
  for(const z of [-.4,.4])box(a,[0,.05,z],[9,.1,.08],ink);for(let i=0;i<35;i++)box(a,[-4.4+i*.26,.01,0],[.16,.06,1.3],wood);house(a,-2.4,-2,2);
  const train=new T.Group();(topic.scene==='war'?a:b).add(train);carriage(train,-.5,0);carriage(train,1.45,0);const engine=cylinder(train,[-1.4,.9,0],.3,1.4,ink);engine.rotation.z=Math.PI/2;cylinder(train,[-1.9,1.3,0],.11,.6,ink);moving.push(t=>train.position.x=-1.5+t*2.5);
  if(topic.scene==='rail'){for(let i=0;i<8;i++)box(c,[2.8+i%2*.45,.23+Math.floor(i/2)*.4,-2],[.4,.4,.5],clay);sheet(d,2.8,.65,2,2,.06,1.2);tube(d,[[2,.71,2],[2.5,.71,1.8],[3.3,.71,2.2]],.025,clay);}else{house(b,2.6,-2,1.6);for(let i=0;i<6;i++){box(c,[-2.7+i%3*.65,.55,1.9+Math.floor(i/3)*.65],[.5,.12,.4],wood);person(c,-2.7+i%3*.65,1.8+Math.floor(i/3)*.65);}sheet(d,2.7,.4,2,1.7,.06,1.3);writing(d,2.7,.44,2,8);}break;
 case 'independence':
  box(a,[0,.65,-1.6],[4.5,1.3,1.3],stone);columns(a,0,-.85,7);for(let i=0;i<5;i++)box(a,[0,.08+i*.08,-.1-i*.14],[4.4,.08,.28],stone);
  sheet(b,-2.7,.48,1.5,1.7,.12,2);writing(b,-2.7,.56,1.5,11);
  box(c,[.2,.5,1.6],[1.5,1.1,.2],'#efe2bd');for(let i=0;i<28;i++)box(c,[-.38+i%7*.18,.2+Math.floor(i/7)*.18,1.72],[.08,.06,.01],i===0?clay:ink);
  cylinder(d,[2.8,1.3,1],.055,2.6,ink);const cloth=box(d,[3.3,2.2,1],[1,.6,.035],blue);moving.push(t=>cloth.rotation.y=Math.sin(t*Math.PI*2)*.12);break;
 default:throw new Error('Noma’lum tarixiy sahna.');
 }
 const bases=parts.map(p=>p.position.clone());let lastPick=-1;
 return {root,parts,step(phase=0,explode=0,selected=-1){const t=T.MathUtils.clamp(Number(phase)||0,0,1),e=T.MathUtils.clamp(Number(explode)||0,0,1);moving.forEach(fn=>fn(t));parts.forEach((p,i)=>{p.position.copy(bases[i]).add(new T.Vector3(i%2?1:-1,.15*(i%2),i>1?1:-1).multiplyScalar(e*1.5));if(lastPick!==selected)p.traverse(m=>{if(m.isMesh)m.material.emissive?.setHex(i===selected?0x29200d:0);});});lastPick=selected;},dispose(){const gs=new Set(),ms=new Set(),ts=new Set();root.traverse(m=>{if(m.geometry)gs.add(m.geometry);for(const mt of (Array.isArray(m.material)?m.material:[m.material]).filter(Boolean)){ms.add(mt);for(const v of Object.values(mt))if(v?.isTexture)ts.add(v);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>{t.dispose();t.source?.data?.close?.();});}};
}

export function mountHistoryScene(host,topic,initial,{onReady,onFail,onSelect,onLabels=()=>{},onAssetStatus=()=>{}}){
 const renderer=new T.WebGLRenderer({antialias:innerWidth>600,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new T.Scene();scene.background=new T.Color('#173d3b');const camera=new T.PerspectiveCamera(37,1,.05,100),controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=2;controls.maxDistance=30;
 scene.add(new T.HemisphereLight('#fff4d7','#426965',2.5));const light=new T.DirectionalLight('#fff0cb',3.2);light.position.set(-4,8,6);scene.add(light);const fill=new T.DirectionalLight('#acd4d9',1.2);fill.position.set(5,4,-4);scene.add(fill);
 const model=createHistoryDiorama(topic);scene.add(model.root);let state=initial,disposed=false,frame=null;
 function render(){frame=null;if(disposed||document.hidden)return;const b=host.getBoundingClientRect();if(b.bottom<0||b.top>innerHeight)return;renderer.render(scene,camera);model.root.updateMatrixWorld(true);onLabels(model.parts.map((part,i)=>{const box=new T.Box3().setFromObject(part),v=box.getCenter(new T.Vector3());v.y=box.max.y+.25;v.project(camera);return {i,x:(v.x+1)*50,y:(1-v.y)*50,visible:!box.isEmpty()&&v.z<1&&Math.abs(v.x)<.96&&Math.abs(v.y)<.95};}));host.dataset.ready='true';host.dataset.renderCount=String(Number(host.dataset.renderCount||0)+1);host.dataset.triangles=String(renderer.info.render.triangles);}
 function request(){if(!disposed&&frame===null)frame=requestAnimationFrame(render);}
 function preset(view='angle'){controls.target.set(0,.8,0);camera.position.set(...({angle:[9,7,11],front:[0,3,14],top:[0,15,.03],back:[0,4,-14]}[view]||[9,7,11]));controls.update();request();}
 function update(next){state=next;model.step(next.phase,next.explode,next.selected);request();}
 const ray=new T.Raycaster(),point=new T.Vector2();let down;
 const pointerDown=e=>down=[e.clientX,e.clientY],pointerUp=e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const b=renderer.domElement.getBoundingClientRect();point.set((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2);ray.setFromCamera(point,camera);const hit=ray.intersectObjects(model.parts,true)[0];if(!hit)return;let n=hit.object;while(n&&n.userData.partIndex===undefined)n=n.parent;if(n)onSelect(n.userData.partIndex);},lost=e=>{e.preventDefault();onFail();};
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('webglcontextlost',lost);
 const resize=()=>{if(disposed)return;const w=host.clientWidth,h=host.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();request();}},ro=new ResizeObserver(resize),io=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting)request();});ro.observe(host);io.observe(host);controls.addEventListener('change',request);document.addEventListener('visibilitychange',request);window.addEventListener('scroll',request,{capture:true,passive:true});preset();resize();update(initial);onReady();
 if(topic.scene==='castle'){
  function releaseModels(models){const geometry=new Set(),materials=new Set(),textures=new Set();for(const g of models)g.scene.traverse(m=>{if(m.geometry)geometry.add(m.geometry);for(const mt of (Array.isArray(m.material)?m.material:[m.material]).filter(Boolean)){materials.add(mt);for(const v of Object.values(mt))if(v?.isTexture)textures.add(v);}});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});}
  const loader=new GLTFLoader();onAssetStatus('Kenney qal’a modellari yuklanmoqda…');Promise.allSettled(['wall-half','tower-square','gate'].map(n=>loader.loadAsync(`/models/castle/${n}.glb`))).then(results=>{const models=results.filter(r=>r.status==='fulfilled').map(r=>r.value);if(disposed||models.length!==3){releaseModels(models);if(!disposed)onAssetStatus('Qal’a GLBlari ochilmadi; original o‘quv rekonstruksiyasi ko‘rsatilmoqda.');return;}
   models.forEach((g,i)=>{const part=model.parts[i];const old=part.children.splice(0);for(const n of old){n.parent=null;n.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});}const template=g.scene,box=new T.Box3().setFromObject(template),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());template.position.sub(center);const count=i===0?4:i===1?4:1;for(let j=0;j<count;j++){const holder=new T.Group();const copy=template.clone(true);holder.add(copy);holder.scale.setScalar((i===0?4:i===1?2.3:2.1)/Math.max(size.x,size.y,.01));holder.position.set(i===1?(j%2?2:-2):i===0?(j%2?2:0):0,i===1?1.1:1,i===1?(j>1?2:-2):i===0?(j>1?2:-2):2.1);if(i===0&&j%2)holder.rotation.y=Math.PI/2;part.add(holder);}});host.dataset.assetSource='Kenney Castle Kit CC0';onAssetStatus('Tayyor Kenney GLB modellari · CC0');model.step(state.phase,state.explode,-99);update(state);
  }).catch(()=>onAssetStatus('Qal’a GLBlari ochilmadi; original o‘quv rekonstruksiyasi ko‘rsatilmoqda.'));
 }
 return {update,preset,rotate:n=>{camera.position.sub(controls.target).applyAxisAngle(new T.Vector3(0,1,0),n).add(controls.target);controls.update();request();},zoom:f=>{camera.position.sub(controls.target).multiplyScalar(f).clampLength(2,30).add(controls.target);controls.update();request();},dispose(){if(disposed)return;disposed=true;if(frame!==null)cancelAnimationFrame(frame);ro.disconnect();io.disconnect();controls.dispose();document.removeEventListener('visibilitychange',request);window.removeEventListener('scroll',request,true);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('webglcontextlost',lost);model.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
