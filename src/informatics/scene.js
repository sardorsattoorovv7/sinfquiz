import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {components,history} from './content.js';
import {clamp} from './model.js';
import {buildHistoryEnvironment} from './history-environment.js';
import {createRealHardware} from './real-hardware.js';
import {REAL_PART_POS,REAL_PART_OFFSETS} from './asset-catalog.js';

// Procedural teaching models: no external downloads and no photogrammetric claims.
export function createInformaticsScene(host,initial,onSelect,onLost,onAssets=()=>{}){
 const scene=new T.Scene();scene.background=new T.Color('#142b2b');scene.fog=new T.Fog('#142b2b',22,52);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
 const environmentScene=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer),environmentTarget=pmrem.fromScene(environmentScene,.04);scene.environment=environmentTarget.texture;environmentScene.dispose?.();pmrem.dispose();
 renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const camera=new T.PerspectiveCamera(38,1,.005,130);camera.position.set(9,6.5,10);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=3;controls.maxDistance=25;controls.maxPolarAngle=Math.PI*.88;controls.target.set(0,1.8,0);
 scene.add(new T.HemisphereLight('#dbefe4','#2a3136',2.9));
 const sun=new T.DirectionalLight('#fff1d1',3.7);sun.position.set(4,10,6);scene.add(sun);
 const fill=new T.DirectionalLight('#8bd5d8',2.5);fill.position.set(-5,5,-7);scene.add(fill);
 const floor=new T.Mesh(new T.PlaneGeometry(130,80),new T.MeshStandardMaterial({color:'#213a36',roughness:.93}));floor.rotation.x=-Math.PI/2;floor.position.y=-.08;scene.add(floor);
 const grid=new T.GridHelper(120,100,'#45635a','#2b4942');grid.position.y=-.06;scene.add(grid);
 const world=new T.Group();scene.add(world);
 const overlay=document.createElement('div');overlay.className='ia-label-layer';overlay.setAttribute('aria-hidden','true');host.appendChild(overlay);
 let state={...initial},disposed=false,frame=null,visible=true,move=null,lastTime=0;
 let parts=new Map(),markers=[],animations=[],signature='',environment=null,realLayer=null;
 const bronze='#bd9556',beige='#c1b59a',ink='#263536',green='#327764',metal='#a1b5b9';
 function material(color,extras={}){return new T.MeshStandardMaterial({color,roughness:.48,metalness:.28,...extras});}
 function box(parent,pos,size,color,extras={}){const m=new T.Mesh(new T.BoxGeometry(...size),material(color,extras));m.position.set(...pos);parent.add(m);return m;}
 function cylinder(parent,pos,radius,height,color,rotation=null){const m=new T.Mesh(new T.CylinderGeometry(radius,radius,height,24),material(color));m.position.set(...pos);if(rotation)m.rotation.set(...rotation);parent.add(m);return m;}
 function ball(parent,pos,radius,color,extras={}){const m=new T.Mesh(new T.SphereGeometry(radius,12,8),material(color,extras));m.position.set(...pos);parent.add(m);return m;}
 function wire(parent,points,color,radius=.018){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,20,radius,6,false),material(color));parent.add(m);return m;}
 function text(parent,value,pos,width=2,color='#dfd9bd'){
  const cvs=document.createElement('canvas');cvs.width=768;cvs.height=160;const ctx=cvs.getContext('2d');ctx.fillStyle=color;ctx.font='600 66px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,384,80,740);
  const tex=new T.CanvasTexture(cvs);tex.colorSpace=T.SRGBColorSpace;const m=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));m.scale.set(width,width*160/768,1);m.position.set(...pos);parent.add(m);return m;
 }
 function clear(){realLayer?.dispose();realLayer=null;const geometries=new Set(),materials=new Set(),textures=new Set();world.traverse(m=>{if(m.geometry)geometries.add(m.geometry);for(const mt of Array.isArray(m.material)?m.material:[m.material]){if(!mt)continue;materials.add(mt);for(const value of Object.values(mt))if(value?.isTexture)textures.add(value);}});for(const geometry of geometries)geometry.dispose();for(const mt of materials)mt.dispose();for(const texture of textures){texture.dispose();texture.source?.data?.close?.();}world.clear();overlay.replaceChildren();parts=new Map();markers=[];animations=[];environment=null;delete host.dataset.importedModels;delete host.dataset.assetsStatus;}
 function fan(parent,pos,size,axis='x'){
  const g=new T.Group();g.position.set(...pos);if(axis==='x')g.rotation.z=-Math.PI/2;else if(axis==='z')g.rotation.x=Math.PI/2;parent.add(g);
  const ring=new T.Mesh(new T.TorusGeometry(size*.41,size*.055,8,32),material(metal));ring.rotation.x=Math.PI/2;g.add(ring);
  const rotor=new T.Group();g.add(rotor);cylinder(rotor,[0,0,0],size*.115,.1,ink);
  for(let i=0;i<7;i++){const b=box(rotor,[0,0,0],[size*.38,.055,size*.14],'#718e92');b.position.set(Math.cos(i*Math.PI*2/7)*size*.2,0,Math.sin(i*Math.PI*2/7)*size*.2);b.rotation.y=-i*Math.PI*2/7+.5;}
  animations.push(t=>rotor.rotation.y=t*2);return g;
 }
 function boardDetails(g,width,depth){
  for(let i=0;i<10;i++){const x=-width*.42+(i%5)*width*.18,z=-depth*.36+Math.floor(i/5)*depth*.65;box(g,[x,.065,z],[.18,.08,.25],ink);}
  for(let i=0;i<7;i++)box(g,[-width*.44+i*width*.13,.043,depth*.15],[.015,.006,depth*.6],'#a6a266');
 }
 function cabinet(g,x,w=1,height=2.8,type='lamp'){
  const body=box(g,[x,height/2,0],[w,height,.64],type==='transistor'?'#aec6c7':'#4c5854');
  box(g,[x,height/2,.335],[w*.91,height*.89,.045],ink);
  for(let r=0;r<9;r++)for(let c=0;c<4;c++){
   const xx=x+(c-1.5)*w*.19,yy=.3+r*(height-.5)/9;
   if(type==='relay')box(g,[xx,yy,.39],[w*.12,.09,.055],'#a3a69b');
   else {const lamp=ball(g,[xx,yy,.395],w*.025,(r+c)%4===0?'#dfbd6b':'#7b9988',{emissive:(r+c)%4===0?'#85622c':'#17382c',emissiveIntensity:.8});if(c===0&&r%3===0)animations.push(t=>lamp.material.emissiveIntensity=.5+Math.sin(t*2+r)*.35);}
  }
  if(type==='lamp')for(let i=0;i<3;i++)wire(g,[[x-w*.3,.3+i*.4,.46],[x,.5+i*.4,.7],[x+w*.25,.3+i*.4,.46]],i%2?'#a76d4f':'#689786',.015);
  return body;
 }
 function vintagePC(g){
  box(g,[0,.42,0],[2.3,.65,1.45],beige);box(g,[0,.8,0],[1.9,.12,1.15],beige);
  box(g,[0,1.6,-.1],[1.8,1.5,1.2],beige);box(g,[0,1.63,.52],[1.42,1.02,.08],ink);
  box(g,[0,1.63,.57],[1.22,.84,.015],'#163c32',{emissive:'#1d7753',emissiveIntensity:.6});
  text(g,'C:\\> _',[0,1.65,.6],1,'#9ad998');
  for(let i=0;i<2;i++)box(g,[.58,.4+i*.16,.74],[.6,.055,.03],ink);
  box(g,[0,.17,1.22],[2.5,.15,.74],beige);
  for(let row=0;row<4;row++)for(let col=0;col<13;col++)box(g,[-1.08+col*.17,.27,1.0+row*.14],[.13,.06,.1],col%3?beige:'#ded2b6');
 }
 function exhibit(kind){
  const g=new T.Group();
  if(kind==='abacus'){
   box(g,[0,.2,0],[3,.2,1],bronze);box(g,[-1.42,1.4,0],[.15,2.5,.3],bronze);box(g,[1.42,1.4,0],[.15,2.5,.3],bronze);box(g,[0,2.6,0],[3,.16,.3],bronze);
   for(let c=0;c<9;c++){cylinder(g,[-1.1+c*.275,1.4,0],.022,2.2,metal);for(let r=0;r<7;r++){const b=ball(g,[-1.1+c*.275,.48+r*.25+(c%3)*.045,0],.12,r>3?'#a9bf9e':'#c89c63');b.scale.y=.65;}}
  }else if(kind==='gears'||kind==='engine'){
   const tall=kind==='engine';box(g,[0,.25,0],[3.1,.3,1.7],bronze);
   for(let c=0;c<8;c++){const x=-1.25+c*.35;cylinder(g,[x,tall?1.4:.65,0],.04,tall?2.3:.5,metal);for(let r=0;r<(tall?8:1);r++){const gear=cylinder(g,[x,.6+r*.25,0],.19,.1,bronze);for(let n=0;n<12;n++){const a=n*Math.PI/6;box(gear,[Math.cos(a)*.19,0,Math.sin(a)*.19],[.065,.07,.065],bronze);}}}
   if(tall){box(g,[0,2.7,0],[3,.12,.6],bronze);box(g,[2,.65,.1],[.7,.06,.8],'#e8dfbd');for(let i=0;i<4;i++)for(let j=0;j<3;j++)box(g,[1.8+i*.12,.69,-.1+j*.14],[.055,.008,.04],ink);wire(g,[[1.45,.9,0],[1.8,.9,0],[1.8,.55,0]],metal,.06);}else text(g,'0   0   0   0',[0,.62,.78],2.3,ink);
  }else if(['relay','colossus','eniac','baby','univac','transistor'].includes(kind)){
   const count=kind==='eniac'?6:kind==='baby'?3:kind==='relay'?3:4;
   for(let i=0;i<count;i++)cabinet(g,(i-(count-1)/2)*.85,.8,kind==='eniac'?2.9:2.5,kind==='relay'?'relay':kind==='transistor'?'transistor':'lamp');
   if(kind==='baby'){
    cylinder(g,[.2,1.8,.58],.26,.48,'#74888c',[Math.PI/2,0,0]);const screen=cylinder(g,[.2,1.8,.85],.22,.018,'#557e60',[Math.PI/2,0,0]);screen.material.emissive.set('#4c8a53');
   }
   if(kind==='colossus'){
    for(const y of [1.0,2.0])cylinder(g,[2.05,y,0],.28,.12,beige,[Math.PI/2,0,0]);wire(g,[[2.05,2,.13],[2.45,1.5,.13],[2.05,1,.13],[1.65,1.5,.13],[2.05,2,.13]],'#d9cca5',.06);
   }
   if(kind==='univac'||kind==='transistor'){
    for(const x of [-1.05,1.05]){for(const xx of [-.18,.18]){const reel=cylinder(g,[x+xx,2,.43],.16,.1,beige,[Math.PI/2,0,0]);for(let k=0;k<3;k++){const a=k*Math.PI*2/3;ball(reel,[Math.cos(a)*.085,.06,Math.sin(a)*.085],.035,ink);}}}
    box(g,[0,.7,1.25],[1.5,.18,.8],beige);box(g,[0,.45,1.1],[1,.8,.2],beige);
   }
  }else if(kind==='chip'){
   box(g,[0,.25,0],[3.6,.12,2.4],green);boardDetails(g,3.5,2.3);
   box(g,[0,.7,0],[1.4,.7,1],ink);text(g,'INTEL 4004',[0,1.25,0],2);
   for(let i=0;i<8;i++)for(const z of [-.7,.7])box(g,[-.6+i*.17,.45,z],[.07,.25,.4],bronze);
  }else if(kind==='pc')vintagePC(g);
  else {
   box(g,[.9,1.55,-.35],[1.35,3.1,1.5],ink);box(g,[.9,1.55,.42],[1.2,2.9,.05],'#355454',{transparent:true,opacity:.65});for(let y=0;y<3;y++)fan(g,[.9,.7+y*.75,.48],.65,'z');
   box(g,[-1.2,.48,.6],[2.5,.12,1.5],metal);const screen=box(g,[-1.2,1.35,-.1],[2.5,1.7,.12],ink);screen.rotation.x=-.2;box(g,[-1.2,1.35,.01],[2.25,1.45,.04],'#326358',{emissive:'#3c8f86',emissiveIntensity:.35});text(g,'HELLO, WORLD',[-1.2,1.35,.08],1.85);
  }
  return g;
 }
 function museum(){
  const idx=clamp(state.eraIndex,0,history.length-1);
  if(state.immersive){environment=buildHistoryEnvironment({world,h:history[idx],box,cylinder,ball,wire,text,exhibit});host.dataset.roomPanels=String(environment.panelCount);host.dataset.roomMeters=`${environment.width.toFixed(2)}x${environment.length.toFixed(2)}`;return;}
  delete host.dataset.roomPanels;delete host.dataset.roomMeters;
  for(let i=Math.max(0,idx-1);i<=Math.min(history.length-1,idx+1);i++){
   const x=i*7,g=new T.Group();g.position.set(x,.16,0);const model=exhibit(history[i].kind);g.add(model);world.add(g);
   box(g,[0,-.03,0],[5,.25,3.9],'#40574c');box(g,[0,-.13,0],[5.2,.12,4.1],'#9c986d');
   text(g,history[i].year,[0,.38,2.04],1.45,'#e6c580');text(g,history[i].name,[0,3.6,-.2],3.8);
   model.traverse(m=>{if(m.isMesh)m.userData.era=i;});
  }
  for(const z of [-2.7,2.7])box(world,[idx*7,.02,z],[24,.035,.035],'#bcaa6d');
 }
 const partPos={case:[0,0,0],motherboard:[-1.2,2.45,-.25],cpu:[-1.02,3,-.5],cooler:[-.35,3,-.5],ram:[-1,2.85,.65],rom:[-1.03,1.94,.74],hdd:[0,.95,1.27],ssd:[0,1.52,1.3],nvme:[-1.01,2.18,-.35],gpu:[-.05,1.65,-.35],psu:[0,.45,-1.2],chipset:[-1.02,2.05,.4],cmos:[-1.01,1.47,.55],sata:[-1.01,1.25,.85],pcie:[-1.03,1.6,-.32],io:[-1.02,3.1,-1.75],fan:[0,2.95,1.85],cables:[0,0,0]};
 const partOffsets={case:[-.8,0,0],motherboard:[-1.2,.1,-.1],cpu:[1.1,1.25,-.45],cooler:[3,1.6,-.7],ram:[1.7,1.1,1.2],rom:[2,-.15,1.9],hdd:[.2,-.25,2.25],ssd:[.4,1.15,2.5],nvme:[2,.4,.9],gpu:[2,-.3,-1.2],psu:[-.5,-.1,-2.6],chipset:[1.1,.2,1.35],cmos:[1.5,-.75,1.15],sata:[.3,-.6,1.9],pcie:[1.1,-.2,-1.8],io:[-.2,.8,-1.8],fan:[-.6,.9,1.9],cables:[0,-.4,0]};
 function hardware(){
  if(state.assetMode!=='schematic'){
   realLayer=createRealHardware({world,getState:()=>state,animations,onStatus:status=>{host.dataset.importedModels=String(status.loaded);host.dataset.assetsStatus=status.status;onAssets(status);},onChange:id=>{applyHardware();if(state.isolated&&state.selected===id)focusPart(id);request();}});parts=realLayer.parts;
   for(const [index,c]of components.entries()){const el=document.createElement('button');el.type='button';el.className='ia-scene-marker';el.tabIndex=-1;el.title=c.name;el.textContent=String(index+1).padStart(2,'0');el.addEventListener('click',()=>onSelect(c.id));overlay.appendChild(el);markers.push({el,group:parts.get(c.id),id:c.id,offset:c.id==='case'?new T.Vector3(1,2.2,0):new T.Vector3(.2,.15,.1)});}
   const dot=ball(world,[0,0,0],.07,'#f5d182',{emissive:'#c9993f',emissiveIntensity:1.5});dot.visible=false;animations.push(t=>{const activity=state.activity,path=activity?.path||[],a=parts.get(path[Math.max(0,(activity?.phase||1)-1)]),b=parts.get(path[Math.min(path.length-1,activity?.phase||1)]);dot.visible=Boolean(!state.isolated&&activity?.running&&activity.ready&&a&&b);if(dot.visible)dot.position.lerpVectors(a.position,b.position,(t*.8)%1);});return;
  }
  for(const [index,c] of components.entries()){
   const g=new T.Group();g.position.set(...partPos[c.id]);g.userData.part=c.id;world.add(g);parts.set(c.id,g);
   const k=c.id,col=c.color;
   if(k==='case'){
    for(const x of [-1.5,1.5])for(const z of [-1.95,1.95])box(g,[x,2.2,z],[.08,4.4,.08],metal);
    for(const y of [.06,4.36]){box(g,[0,y,0],[3.1,.1,4],ink);}
    const panel=box(g,[-1.55,2.2,0],[.05,4.3,3.95],metal,{transparent:true,opacity:.35});panel.userData.panel=true;
    const lid=box(g,[1.55,2.2,0],[.05,4.3,3.95],metal,{transparent:true,opacity:.9});lid.userData.panel=true;
    for(const x of [-1.15,1.15])for(const z of [-1.5,1.5])box(g,[x,-.04,z],[.35,.16,.35],ink);
   }else if(k==='motherboard'){
    box(g,[0,0,0],[.1,3.3,2.8],'#266553');
    for(let i=0;i<30;i++){const y=-1.4+(i%10)*.3,z=-1.1+Math.floor(i/10)*.9;box(g,[.065,y,z],[.012,.012,.6],'#9d9a56');}
    for(let i=0;i<10;i++)cylinder(g,[.11,-1.2+i*.27,-.95],.055,.2,'#c4c6b9',[0,0,Math.PI/2]);
   }else if(k==='cpu'){
    box(g,[-.03,0,0],[.12,.85,.85],ink);box(g,[.06,0,0],[.08,.65,.65],metal);text(g,'CPU',[.3,.5,0],.65);
   }else if(k==='cooler'){
    for(let i=0;i<12;i++)box(g,[-.4+i*.07,0,0],[.035,.9,.95],metal);fan(g,[.53,0,0],.9,'x');
   }else if(k==='ram'){
    for(let n=0;n<2;n++){box(g,[.2,0,n*.24],[.55,1.2,.065],'#3d8061');for(let i=0;i<5;i++)box(g,[.49,-.46+i*.23,n*.24],[.04,.14,.065],ink);box(g,[-.08,0,n*.24],[.06,1.15,.075],bronze);}
   }else if(k==='rom'){
    box(g,[0,0,0],[.09,.22,.27],ink);for(let i=0;i<4;i++)for(const z of [-.16,.16])box(g,[.02,-.09+i*.06,z],[.08,.025,.08],metal);
   }else if(k==='hdd'){
    box(g,[0,0,0],[2,.26,1.12],metal);cylinder(g,[0,.16,0],.47,.045,'#c9d8da');cylinder(g,[0,.19,0],.1,.05,ink);wire(g,[[.8,.21,.4],[.45,.22,.2],[.15,.23,.1]],bronze,.038);box(g,[-.4,.14,-.38],[.5,.05,.15],ink);
   }else if(k==='ssd'){
    box(g,[0,0,0],[1.52,.18,1],ink);box(g,[0,.105,0],[1.22,.02,.7],col);text(g,'SATA SSD',[0,.35,0],1.1);
   }else if(k==='nvme'){
    box(g,[0,0,0],[.07,.3,1.1],'#346c57');for(let i=0;i<3;i++)box(g,[.06,0,-.32+i*.31],[.06,.22,.2],ink);box(g,[.02,0,-.57],[.08,.24,.09],bronze);
   }else if(k==='gpu'){
    box(g,[0,0,0],[2.1,.12,2.35],'#354f4b');box(g,[0,.2,0],[2,.32,2.12],ink);for(const z of [-.55,.55])fan(g,[0,.39,z],.82,'y');box(g,[-.94,0,0],[.1,.15,1.7],bronze);
   }else if(k==='psu'){
    box(g,[0,0,0],[2.55,.75,1.3],ink);fan(g,[0,.42,0],1.1,'y');for(let i=0;i<12;i++)box(g,[-1.05+i*.19,.05,-.66],[.045,.45,.02],metal);
   }else if(k==='chipset'){
    box(g,[0,0,0],[.15,.43,.46],ink);for(let i=0;i<5;i++)box(g,[.13,-.16+i*.08,0],[.1,.025,.46],metal);
   }else if(k==='cmos'){
    cylinder(g,[0,0,0],.19,.1,col,[0,0,Math.PI/2]);
   }else if(k==='sata'){
    for(let i=0;i<4;i++)box(g,[.02,(i%2)*.17,Math.floor(i/2)*.19],[.22,.13,.13],i%2?col:ink);
   }else if(k==='pcie'){
    box(g,[0,0,0],[.14,.12,2.25],col);box(g,[.08,0,0],[.03,.04,2],ink);
   }else if(k==='io'){
    box(g,[0,0,0],[.45,1.8,.26],metal);for(let i=0;i<7;i++)box(g,[0,-.69+i*.22,-.14],[.3,.12,.07],i<4?'#426a94':ink);
   }else if(k==='fan')fan(g,[0,0,0],1.15,'z');
   else {
    for(let i=0;i<3;i++)wire(g,[[.7,.55,-1.1],[1.12,1+i*.4,-.3],[1.03,2.6+i*.13,.8]],i%2?'#af9a5e':'#344b52',.034);
    wire(g,[[0,1,1.27],[.9,.8,1.25],[.8,1.2,.7],[-.8,1.28,.85]],'#ba7762',.025);
   }
   g.traverse(m=>{if(m.isMesh){m.userData.part=k;m.userData.baseEmissive=m.material.emissive?.getHex()||0;}});
   const el=document.createElement('button');el.type='button';el.className='ia-scene-marker';el.tabIndex=-1;el.title=c.name;el.textContent=String(index+1).padStart(2,'0');el.addEventListener('click',()=>onSelect(k));overlay.appendChild(el);markers.push({el,group:g,id:k,offset:k==='case'?new T.Vector3(1.5,4.4,0):new T.Vector3(.2,.2,.1)});
  }
  const dot=ball(world,[0,0,0],.12,'#f5d182',{emissive:'#c9993f',emissiveIntensity:1.5});
  animations.push(t=>{const activity=state.activity,path=activity?.path||[],a=parts.get(path[Math.max(0,(activity?.phase||1)-1)]),b=parts.get(path[Math.min(path.length-1,activity?.phase||1)]);dot.visible=Boolean(activity?.running&&activity.ready&&a&&b);if(dot.visible)dot.position.lerpVectors(a.position,b.position,(t*.8)%1);});
  dot.visible=false;
 }
 function applyHardware(){
  const amount=clamp(state.explode);
  for(const [id,g] of parts){
   const p=(realLayer?REAL_PART_POS:partPos)[id],offset=(realLayer?REAL_PART_OFFSETS:partOffsets)[id];g.position.set(p[0]+offset[0]*amount,p[1]+offset[1]*amount,p[2]+offset[2]*amount);
   g.visible=state.isolated?id===state.selected:!state.installed||['case','motherboard','rom','chipset','cmos','sata','pcie','io','fan','cables'].includes(id)||state.installed.includes(id);
   g.traverse(m=>{if(!m.isMesh)return;if(m.userData.panel)m.visible=!state.cutaway;
    const active=state.activity?.phase>0&&state.activity?.ready&&state.activity.path?.[Math.min(2,state.activity.phase-1)]===id;
    for(const mt of Array.isArray(m.material)?m.material:[m.material]){const base=mt.userData.baseEmissive??m.userData.baseEmissive??0;mt.emissive?.setHex(active?0x8b712d:id===state.selected?0x276953:base);mt.emissiveIntensity=active?.4:id===state.selected?(realLayer?.12:.55):(mt.userData.baseEmissiveIntensity??1);}
   });
  }
  realLayer?.update();
 }
 function focusPart(id){const g=parts.get(id);if(!g)return;world.updateMatrixWorld(true);const bounds=realLayer?.bounds(id),center=bounds?bounds.getCenter(new T.Vector3()):g.getWorldPosition(new T.Vector3()),size=bounds?Math.max(...bounds.getSize(new T.Vector3()).toArray()):0;const dir=camera.position.clone().sub(controls.target).normalize();controls.minDistance=realLayer?.04:3;travel(center.clone().add(dir.multiplyScalar(bounds?Math.max(.24,size*1.8):id==='case'||id==='motherboard'?7:4)),center);}
 function labels(){
  const vec=new T.Vector3();
  for(const marker of markers){
   marker.group.getWorldPosition(vec);vec.add(marker.offset);vec.project(camera);
   const show=state.labels&&marker.group.visible&&(!realLayer||realLayer.loaded.has(marker.id))&&vec.z>-1&&vec.z<1&&Math.abs(vec.x)<.96&&Math.abs(vec.y)<.94;
   marker.el.hidden=!show;if(show){marker.el.style.left=`${(vec.x*.5+.5)*100}%`;marker.el.style.top=`${(-vec.y*.5+.5)*100}%`;marker.el.classList.toggle('selected',marker.id===state.selected);}
  }
 }
 function render(time=performance.now()){
  frame=null;if(disposed||!visible||document.hidden)return;
  if(move){const u=clamp((time-move.start)/move.duration),smooth=u*u*(3-2*u);camera.position.lerpVectors(move.from,move.to,smooth);controls.target.lerpVectors(move.targetFrom,move.targetTo,smooth);if(u>=1)move=null;}
  animations.forEach(fn=>fn(time/1000));controls.update();renderer.render(scene,camera);labels();lastTime=time;
  host.dataset.meshes=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.selectedPart=state.selected||'';host.dataset.assetMode=state.assetMode||'';host.dataset.ready=(!realLayer||realLayer.loaded.size>0)?'true':'false';
  if(move||state.motion)request();
 }
 function request(){if(!disposed&&frame===null&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
 function travel(position,target,instant=false){move={from:camera.position.clone(),to:position,targetFrom:controls.target.clone(),targetTo:target,start:performance.now(),duration:instant||state.reduced?0:620};if(move.duration===0){camera.position.copy(position);controls.target.copy(target);move=null;}request();}
 function reset(instant=false){
  if(state.mode==='history'&&environment){const view=environment.views.overview;controls.minDistance=.35;controls.maxDistance=24;travel(new T.Vector3(...view.position),new T.Vector3(...view.target),instant);}
  else if(state.mode==='history'){const x=state.eraIndex*7;travel(new T.Vector3(x+5.5,4.4,8.2),new T.Vector3(x,1.3,0),instant);controls.minDistance=3;controls.maxDistance=17;}
  else {const k=clamp(state.explode);travel(new T.Vector3(8+k*3,5.8+k*2,9+k*3),new T.Vector3(k*.5,2.1,k*.4),instant);controls.maxDistance=25;}
 }
 function update(next){
  const previous=state;state={...state,...next};const sig=state.mode==='history'?`museum:${state.eraIndex}:${Boolean(state.immersive)}`:`hardware:${state.assetMode}:${state.assetRetry||0}`;
  if(signature!==sig){clear();signature=sig;if(state.mode==='history')museum();else hardware();reset(!previous.mode);}
  if(state.mode!=='history'){applyHardware();if(state.isolated&&(previous.selected!==state.selected||!previous.isolated))focusPart(state.selected);else if(previous.isolated&&!state.isolated)reset();else if(previous.explode!==state.explode&&!move)reset();}
  environment?.update(state);
  request();
 }
 const size=()=>{const rect=host.getBoundingClientRect();if(rect.width<1||rect.height<1)return;renderer.setSize(rect.width,rect.height);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();request();};
 const resize=new ResizeObserver(size);resize.observe(host);
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();else if(frame!==null){cancelAnimationFrame(frame);frame=null;}});intersection.observe(host);
 const visibility=()=>{if(document.hidden&&frame!==null){cancelAnimationFrame(frame);frame=null;}else request();};document.addEventListener('visibilitychange',visibility);
 controls.addEventListener('change',request);
 let down=null;
 const pointerDown=e=>{down=[e.clientX,e.clientY];move=null;};
 const pointerUp=e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const rect=renderer.domElement.getBoundingClientRect(),v=new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new T.Raycaster();ray.setFromCamera(v,camera);scene.updateMatrixWorld();const found=ray.intersectObjects(world.children,true).find(hit=>{let m=hit.object;if(!m.userData.part&&!m.userData.roomPart&&m.userData.era===undefined)return false;while(m){if(!m.visible)return false;m=m.parent;}return true;});if(found){if(state.mode==='history')onSelect(found.object.userData.roomPart??found.object.userData.era);else onSelect(found.object.userData.part);}};
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);
 const lost=e=>{e.preventDefault();if(frame!==null){cancelAnimationFrame(frame);frame=null;}onLost();};renderer.domElement.addEventListener('webglcontextlost',lost);
 update(initial);reset(true);size();
 return {
  update,reset,
  station(id){const view=environment?.views[id];if(!view)return;travel(new T.Vector3(...view.position),new T.Vector3(...view.target),id==='inside');},
  walk(direction){if(!environment)return;move=null;const bounds=environment.bounds,forward=controls.target.clone().sub(camera.position);forward.y=0;forward.normalize();const right=forward.clone().cross(new T.Vector3(0,1,0));const v=direction==='forward'?forward:direction==='back'?forward.negate():direction==='left'?right.negate():right;v.multiplyScalar(.55);const next=camera.position.clone().add(v);next.x=clamp(next.x,bounds.minX,bounds.maxX);next.z=clamp(next.z,bounds.minZ,bounds.maxZ);next.y=1.65;const delta=next.clone().sub(camera.position);camera.position.copy(next);controls.target.add(delta);controls.update();host.dataset.walkPosition=`${next.x.toFixed(2)},${next.z.toFixed(2)}`;request();},
  turn(angle){if(!environment)return;move=null;const dir=controls.target.clone().sub(camera.position).applyAxisAngle(new T.Vector3(0,1,0),angle);dir.y=0;dir.normalize().multiplyScalar(3);controls.target.copy(camera.position).add(dir);controls.update();request();},
  focus:focusPart,
  angle(view){if(state.mode==='history')return reset();if(realLayer&&state.isolated){const bounds=realLayer.bounds(state.selected);if(bounds){const center=bounds.getCenter(new T.Vector3()),distance=Math.max(.24,Math.max(...bounds.getSize(new T.Vector3()).toArray())*1.8),v={front:[1,0,0],back:[-1,0,0],top:[.01,1,.01],iso:[.8,.55,.8]}[view]||[.8,.55,.8];travel(center.clone().add(new T.Vector3(...v).normalize().multiplyScalar(distance)),center);return;}}const target=new T.Vector3(0,2.1,0),k=1+clamp(state.explode)*.3;const pos={top:[.1,12,.1],front:[7,3,8],back:[8,4,-9],iso:[9,6.5,10]}[view]||[9,6.5,10];travel(new T.Vector3(...pos).multiplyScalar(k),target);},
  zoom(factor){const d=camera.position.clone().sub(controls.target).multiplyScalar(factor);d.clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(d);move=null;request();},
  dispose(){if(disposed)return;disposed=true;if(frame!==null)cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);clear();environmentTarget.dispose();floor.geometry.dispose();floor.material.dispose();grid.geometry.dispose();grid.material.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();overlay.remove();},
 };
}
