import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {C,meteorEntry,sampleProfile,propagateOrbit} from './model.js';
import {createPhysicalScene} from './scenes-731.js';
const tau=Math.PI*2,rad=x=>x*Math.PI/180,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const models=new Map();
async function model(name){
 if(!models.has(name))models.set(name,(async()=>{
  const url=name==='skin'?'/biology/v7.21/anatomy-skin.glb':`/space/${name==='sun'?'v7.31':'v7.30'}/${name}-nasa.glb`;
  // Cache only versioned public assets, never user responses or application chunks.
  if(globalThis.caches){try{const cache=await caches.open('sq-space-assets-v730');let response=await cache.match(url);if(!response){response=await fetch(url);if(!response.ok)throw Error('Model yuklanmadi');await cache.put(url,response.clone())}const raw=await response.arrayBuffer();return new Promise((resolve,reject)=>new GLTFLoader().parse(raw,'',g=>resolve(g.scene),reject))}catch{/* regular loader remains available */}}
  return (await new GLTFLoader().loadAsync(url)).scene;
 })().catch(e=>{models.delete(name);throw e}));
 return models.get(name);
}
const seed=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
export function createSpaceRenderer(host,topic,{onPart,onReady,onFailure,lowQuality=false}){
 let alive=true,frame,visible=true,params={},time=0,last=0,orbit=null,meteor=null,oldKey='',running=false,rate=1,syncedAt=0;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#07152b');
 const camera=new THREE.PerspectiveCamera(42,1,.01,2000);camera.position.set(0,5,13);
 const renderer=new THREE.WebGLRenderer({antialias:!lowQuality,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(lowQuality?1:Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',`${topic.title}: aylantiriladigan uch o‘lchamli ta’limiy model`);host.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=2;controls.maxDistance=150;controls.enablePan=true;
 scene.add(new THREE.AmbientLight(0xaac9ff,1.2));const sunLight=new THREE.DirectionalLight(0xffe6b1,2.7);sunLight.position.set(-8,3,5);scene.add(sunLight);
 const root=new THREE.Group();scene.add(root);const objects={},parts=[],ownedTextures=[];
 function cloudTexture(){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');const g=ctx.createRadialGradient(64,64,0,64,64,62);g.addColorStop(0,'rgba(255,255,255,0.85)');g.addColorStop(.35,'rgba(255,255,255,0.5)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);const texture=new THREE.CanvasTexture(canvas);ownedTextures.push(texture);return texture}
 function mark(obj,name,info){obj.userData={name,info};parts.push({name,info});return obj}
 function sphere(radius,color,name,info,position=[0,0,0],emissive=false){const m=new THREE.Mesh(new THREE.SphereGeometry(radius,lowQuality?24:40,lowQuality?16:28),new THREE.MeshStandardMaterial({color,roughness:.65,...(emissive?{emissive:color,emissiveIntensity:1.4}:{})}));m.position.set(...position);root.add(mark(m,name,info));return m}
 function line(points,color=0x6de1d8,opacity=1){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));root.add(l);return l}
 function ring(radius,color=0x426382,y=0){return line(Array.from({length:129},(_,i)=>[Math.cos(i/128*tau)*radius,y,Math.sin(i/128*tau)*radius]),color,.65)}
 function disk(radius,color,name){const m=new THREE.Mesh(new THREE.RingGeometry(.9,radius,96),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.7}));m.rotation.x=-Math.PI/2;root.add(mark(m,name,'Diskdagi alohida zarrachalar orbital harakat qiladi.'));return m}
 function globe(radius,name='earth',pos=[0,0,0]){
  const wrapper=new THREE.Group();wrapper.position.set(...pos);const labels={earth:['Yer','NASA VTAD Yer modeli. Yorug‘ va qorong‘i tomonlari yoritishga bog‘liq.'],moon:['Oy','NASA VTAD Oy modeli. Fazalar sirtga tushgan nur bilan bog‘liq.'],sun:['Quyosh','NASA Quyosh modeli. Masofa boshqaruvi jismning o‘zini Yerga yaqinlashtiradi.'],skin:['Odam silueti','BodyParts3D modeli: kabina ichidagi ta’limiy siluet. Insonning fiziologik bardoshlilik hisobi emas.']};root.add(mark(wrapper,...labels[name]));
  const fallback=new THREE.Mesh(new THREE.SphereGeometry(radius,32,24),new THREE.MeshStandardMaterial({color:name==='earth'?0x3182bb:name==='sun'?0xffac42:0xadb4c3,roughness:.85,...(name==='sun'?{emissive:0xff8b24,emissiveIntensity:.75}:{})}));wrapper.add(fallback);
  model(name).then(template=>{if(!alive)return;const cloned=template.clone(true);cloned.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();if(name==='sun'){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(m.emissive){m.emissive.set(0xffffff);m.emissiveMap=m.emissiveMap||m.map;m.emissiveIntensity=.85;}})}if(name==='skin'){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.color?.set(0x98bfd2));}o.userData=wrapper.userData}});const box=new THREE.Box3().setFromObject(cloned),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());const scale=2*radius/Math.max(size.x,size.y,size.z);cloned.scale.setScalar(scale);cloned.position.copy(center).multiplyScalar(-scale);wrapper.remove(fallback);fallback.geometry.dispose();fallback.material.dispose();wrapper.add(cloned);renderer.render(scene,camera);onReady?.(name==='skin'?'Odam modeli tayyor':'NASA modellari tayyor');}).catch(()=>onReady?.('Yengil sferik model ishlamoqda'));
  return wrapper;
 }
 const starPositions=new Float32Array(900);for(let i=0;i<300;i++){starPositions[i*3]=(seed(i*3)-.5)*90;starPositions[i*3+1]=(seed(i*3+1)-.5)*60;starPositions[i*3+2]=-15-seed(i*3+2)*60}
 const stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(starPositions,3)),new THREE.PointsMaterial({color:0xc2d6ec,size:.045}));scene.add(stars);
 const id=topic.id,family=topic.family;
 const physical=createPhysicalScene(family,{root,scene,camera,controls,sunLight,sphere,globe,line,mark,cloudTexture,canvas:renderer.domElement});if(family==='ocean')stars.visible=false;
 if(['earth','tide','moon','gravity'].includes(family)){
  objects.earth=globe(1.55);objects.axis=line([[0,-2.4,0],[0,2.4,0]],0x5ddfd0);mark(objects.axis,'O‘q','O‘q og‘ishi Quyosh yoritilishi va kun uzunligini o‘zgartiradi.');
  if(family==='moon'||family==='tide'){sunLight.position.set(8,0,0);objects.moon=globe(.42,'moon',[4,0,0]);objects.moonMark=sphere(.09,0xffde86,'Oy yuz belgisi','Belgi Oy qaysi tomoni Yerga qarashini ko‘rsatadi.');root.remove(objects.moonMark);objects.moon.add(objects.moonMark);objects.moonMark.position.set(0,0,.43);ring(4);}
  if(family==='tide'){objects.tide=new THREE.Mesh(new THREE.SphereGeometry(1.6,40,24),new THREE.MeshBasicMaterial({color:0x38cfd9,transparent:true,opacity:.3,wireframe:true}));root.add(mark(objects.tide,'Qalqish deformatsiyasi','Tortish farqi uchun kattalashtirilgan ko‘rgazma; haqiqiy suv balandligi emas.'))}
  if(family==='moon'){objects.shadow=new THREE.Mesh(new THREE.ConeGeometry(1.2,6,40),new THREE.MeshBasicMaterial({color:0x02040a,transparent:true,opacity:.35,side:THREE.DoubleSide}));objects.shadow.rotation.z=Math.PI/2;objects.shadow.position.x=3;root.add(mark(objects.shadow,'Soya','Soyaga mos kelish uchun faza va orbita og‘ishi birga muhim.'));}
  if(family==='gravity'){objects.gravityMoon=globe(1.55,'moon');objects.mars=sphere(1.55,0xb9674c,'Mars','Mars gravitatsion tezlanishi 3,71 m/s².');objects.weight=sphere(.3,0xffc97a,'Jism','Bir xil massa boshqa osmon jismida boshqa og‘irlikka ega.');}
 }
 if(family==='orbit'){
  objects.earth=globe(1.6);objects.satellite=new THREE.Group();root.add(mark(objects.satellite,'Yo‘ldosh','Markaziy tortish bo‘yicha hisoblangan holat.'));
  const body=new THREE.Mesh(new THREE.BoxGeometry(.22,.3,.22),new THREE.MeshStandardMaterial({color:0xcbd6e5,metalness:.6}));objects.satellite.add(body);
  for(const side of [-1,1]){const panel=new THREE.Mesh(new THREE.BoxGeometry(.7,.02,.28),new THREE.MeshStandardMaterial({color:0x215fbd}));panel.position.x=side*.45;objects.satellite.add(panel)}
 }
 if(family==='system'){
  if(id==='planet-rings'){objects.planet=sphere(1,0xc8b58d,'Sayyora','Halqa zarrachalari tortish ta’sirida aylanadi.');objects.ring=disk(3,0xb8c5cf,'Halqa');objects.grains=Array.from({length:180},(_,i)=>sphere(.015+seed(i)*.025,0xd3cebd,'Halqa zarrachasi','Halqa bitta qattiq jism emas.'));}
  else{objects.sun=sphere(.65,0xffba50,'Quyosh','Tizimning asosiy gravitatsion manbai.',[0,0,0],true);const au=[.387,.723,1,1.524,5.203,9.537,19.19,30.07],names=['Merkuriy','Venera','Yer','Mars','Yupiter','Saturn','Uran','Neptun'];objects.planets=au.map((a,i)=>{const radius=1.1+Math.log1p(a)*1.2;ring(radius);const obj=i===2?globe(.2):sphere(i<4?.12:.24,[0xaaa49a,0xd5ab70,0x3385b0,0xc86745,0xd9ba83,0xc8b590,0x73c1ca,0x476adc][i],names[i],'Orbital davr Quyoshgacha masofaga bog‘liq.');return {a,radius,obj}});objects.test=sphere(.16,0x57e0cb,id==='comet-tail'?'Kometa':'Tajriba jismi','O‘zingiz tanlagan orbitadagi jism.');objects.trail=line(Array.from({length:80},()=>[0,0,0]),0x79e9ff);objects.orbit=line(Array.from({length:160},()=>[0,0,0]));if(id==='protoplanetary-disk')objects.dust=Array.from({length:160},(_,i)=>sphere(.02,0xb9a6bd,'Chang','Gaz va changdan yig‘ilish juda uzoq vaqt talab qiladi.'));if(id==='retrograde')objects.sight=line([[0,0,0],[0,0,0]],0xffcf80);}
 }
 if(family==='meteor'){
  objects.terrain=new THREE.Mesh(new THREE.PlaneGeometry(50,24,lowQuality?64:100,lowQuality?32:48),new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.86,side:THREE.DoubleSide}));objects.terrain.rotation.x=-Math.PI/2;objects.terrain.position.y=-.05;root.add(mark(objects.terrain,'Sirt','Quruqlik krateri va suv halqalari faqat nisbiy model.'));objects.base=objects.terrain.geometry.attributes.position.array.slice();objects.terrain.geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(objects.base.length),3));
  objects.meteor=sphere(.2,0x9b8c7c,'Meteoroid','Kosmik jism atmosferada ablyatsiya va parchalanishga uchrashi mumkin.');
  objects.glow=sphere(.27,0xff7c32,'Qizigan havo','Siqilgan havo va jism energiya almashadi.',[0,0,0],true);objects.glow.material.transparent=true;
  objects.tail=line(Array.from({length:50},()=>[0,0,0]),0xffb574);objects.shock=ring(1,0x80e6f3);objects.shock.material.transparent=true;
  objects.fragments=Array.from({length:32},(_,i)=>sphere(.025+seed(i)*.05,0xffad5d,'Parcha','Dinamik bosim mustahkamlikdan oshganda parchalanish ko‘rsatiladi.'));
  objects.waveRings=Array.from({length:5},()=>ring(1,0x81dbed,.015));
  const texture=cloudTexture();objects.dust=Array.from({length:24},()=>{const cloud=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xd6c2a2,transparent:true,opacity:0,depthWrite:false}));root.add(mark(cloud,'Zarba changi','Chang hajmi va tezligi sirtga yetgan energiya bilan nisbiy o‘zgaradi.'));return cloud});
  objects.flash=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xffbd75,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));root.add(mark(objects.flash,'Zarba chaqnashi','Chaqnash va ejecta faqat yuqori tezlikda sirtga yetganda ko‘rsatiladi.'));
 }
 if(family==='solar'){
  objects.sun=sphere(1.45,0xffa63f,'Quyosh','Plazma va magnit faollik manbai.',[-3,0,0],true);objects.earth=globe(.65,'earth',[4,0,0]);
  objects.wind=Array.from({length:90},(_,i)=>sphere(.025,0x8ce9ec,'Zarracha oqimi','Havo emas, zaryadlangan zarrachalar oqimi.'));
  objects.spots=Array.from({length:18},(_,i)=>sphere(.11,0x9c451d,'Dog‘','Atrofga qaraganda sovuqroq, magnit faol sirt sohasi.'));
  objects.front=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),new THREE.MeshBasicMaterial({color:0xffd77d,wireframe:true,transparent:true,opacity:.5}));root.add(mark(objects.front,'Koronal oqim','Yo‘nalish modeldagi Yerga moslikni belgilaydi.'));
  objects.aurora=new THREE.Mesh(new THREE.TorusGeometry(.52,.045,8,64),new THREE.MeshBasicMaterial({color:0x6cffb0,transparent:true}));objects.aurora.rotation.x=Math.PI/2;objects.aurora.position.set(4,.45,0);root.add(mark(objects.aurora,'Atmosferadagi yog‘du','Zarrachalar atmosferani qo‘zg‘atganda yorug‘lik chiqadi.'));
  objects.magnetosphere=new THREE.Mesh(new THREE.SphereGeometry(.95,24,16),new THREE.MeshBasicMaterial({color:0x489cd1,wireframe:true,transparent:true,opacity:.2}));objects.magnetosphere.position.x=4;objects.magnetosphere.scale.x=1.6;root.add(objects.magnetosphere);
 }
 if(family==='transit'){
  objects.star=sphere(2,0xffbf63,'Yulduz diski','Yuzaning yopilgan ulushi yorug‘lik kamayishini beradi.',[0,0,0],true);objects.planet=sphere(.2,0x263546,'Tranzit sayyorasi','Radiusi va kuzatuv yo‘nalishi boshqariladi.');camera.position.set(0,0,12);controls.enableRotate=false;
 }
 if(family==='shower'){
  objects.earth=globe(1.25,'earth',[0,-2,0]);objects.streaks=Array.from({length:120},()=>line([[0,0,0],[0,0,0]],0xf7d99a));
 }
 if(['star','binary','compact','hole'].includes(family)){
  const black=family==='hole'||id==='blackhole-merger',color=black?0x010308:family==='compact'?0x93c8ff:0xffbe62;
  objects.core=sphere(family==='hole'?1:.8,color,black?'Hodisalar ufqi':'Yulduz',black?'Bu chegara ichidan yorug‘lik chiqib keta olmaydi.':'Yulduzning ko‘rgazmali modeli.',[0,0,0],!black);
  if(family==='hole'){objects.disk=disk(4,0xffa665,'Akkretsiya diski');objects.grains=Array.from({length:120},()=>sphere(.025,0xffd7a3,'Disk moddasi','Nurlanish ufq tashqarisidagi issiq moddadan keladi.'));objects.object=sphere(.3,0x77d6ec,'Yaqin jism','Gravitatsiya farqi jismni cho‘zishi mumkin.');objects.lens=line(Array.from({length:100},()=>[0,0,0]),0xa4e9ff);}
  if(family==='binary'){objects.second=sphere(.65,id==='blackhole-merger'?0x010308:0xff8d63,'Qo‘shni yulduz','Ikki jism umumiy massa markazi atrofida harakat qiladi.',[3,0,0],id!=='blackhole-merger');objects.stream=line(Array.from({length:80},()=>[0,0,0]),0x7ce8f8);}
  if(family==='compact'||id==='jets'||id==='quasar'){objects.beams=[-1,1].map(side=>{const cone=new THREE.Mesh(new THREE.ConeGeometry(.7,6,32,1,true),new THREE.MeshBasicMaterial({color:0x69c6ff,side:THREE.DoubleSide,transparent:true,opacity:.4}));root.add(mark(cone,'Yo‘naltirilgan nur','Jet yoki nur ufq tashqarisidagi modelga tegishli.'));cone.position.y=side*3;cone.rotation.z=side===1?Math.PI:0;return cone})}
  objects.shells=Array.from({length:6},(_,i)=>{const x=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),new THREE.MeshBasicMaterial({color:i%2?0xa390fb:0xffa66a,transparent:true,opacity:.1,wireframe:i%2===1}));root.add(mark(x,'Gaz yoki to‘lqin qobig‘i','Qatlamlar chiqishi va tarqalish ko‘rgazmali; vaqt siqilgan.'));return x});
 }
 if(family==='wave'){
  objects.waveParticles=Array.from({length:48},(_,i)=>sphere(.06,0x8be4e6,'Sinov nuqtasi','Ko‘ndalang o‘lchovlar qarama-qarshi o‘zgaradi.'));
  objects.wave=line(Array.from({length:150},()=>[0,0,0]),0x68dfd0);
 }
 if(family==='resonance'){
  sphere(.55,0xffbd63,'Markaz','Orbital harakat markazi.',[0,0,0],true);ring(2);ring(3.5);objects.inner=sphere(.2,0x5dddca,'Ichki jism','Aylanish nisbati sozlanadi.');objects.outer=sphere(.28,0x9dbeff,'Tashqi jism','Davrlar mosligi takrorlanadi.');objects.join=line([[0,0,0],[0,0,0]],0x8fafc6);
 }
 if(family==='assist'){
  objects.planet=globe(1);objects.ship=sphere(.15,0xf7d49a,'Apparat','Yo‘l sayyora yonidan o‘tib buriladi.');objects.path=line(Array.from({length:100},()=>[0,0,0]),0x5dddca);objects.velocity=line([[0,0,0],[0,0,0]],0xffc47c);
 }
 if(family==='galaxy'||family==='expansion'||family==='scale'){
  objects.galaxies=[];const count=family==='expansion'?12:family==='scale'?8:2;
  for(let g=0;g<count;g++){const positions=new Float32Array(600*3);for(let i=0;i<600;i++){const r=Math.sqrt(seed(i+g*600))*2,a=r*3+(i%3)*tau/3+(seed(i+99)-.5)*.5;positions[i*3]=Math.cos(a)*r;positions[i*3+1]=(seed(i+199)-.5)*.13;positions[i*3+2]=Math.sin(a)*r}const mesh=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(positions,3)),new THREE.PointsMaterial({color:g%2?0x85ccef:0xe8c9a0,size:.055}));root.add(mark(mesh,'Galaktika','Nuqtalar yulduzlar guruhini bildiradi, masofalar siqilgan.'));mesh.userData.base=positions.slice();objects.galaxies.push(mesh)}
  objects.wave=line(Array.from({length:180},()=>[0,0,0]),0xffac90);
 }
 if(family==='rocket'){
  objects.rocket=new THREE.Group();root.add(mark(objects.rocket,'Raketa','Gaz chiqarilishi teskari yo‘nalishda impuls beradi.'));
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,1.5,32),new THREE.MeshStandardMaterial({color:0xe5eaf1,metalness:.3}));objects.rocket.add(body);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.3,.6,32),new THREE.MeshStandardMaterial({color:0x55cdbb}));tip.position.y=1.05;objects.rocket.add(tip);
  objects.exhaust=Array.from({length:40},()=>sphere(.04,0xffb360,'Gaz','Impuls bilan chiqayotgan gaz.'));
 }
 function pointsUpdate(obj,fn){const arr=obj.geometry.attributes.position;for(let i=0;i<arr.count;i++){const p=fn(i,arr.count);arr.setXYZ(i,...p)}arr.needsUpdate=true;obj.geometry.computeBoundingSphere()}
 function disposeObj(obj){obj.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())})}
 function rebuild(p){
  if(family==='orbit'){orbit=propagateOrbit(p.height,p.speed);if(objects.path){root.remove(objects.path);disposeObj(objects.path)}const scale=1.6/C.R;objects.path=line(orbit.points.filter((_,i)=>i%3===0).map(x=>[x.x*scale,x.y*scale,0]));const extent=Math.max(4,...orbit.points.map(x=>x.r*scale));camera.position.set(0,extent*.35,extent*2.7);controls.maxDistance=extent*7;controls.target.set(0,0,0);}
  if(family==='meteor'){meteor=meteorEntry(p);const length=10/Math.tan(rad(p.angle));camera.position.set(-length*.36,7,Math.max(18,length*.95));controls.target.set(-length*.3,3,0);}
 }
 function update(p,t){
  physical?.update(p,t);
  if(objects.earth&&family==='earth'){objects.earth.rotation.z=-rad(p.tilt);objects.earth.rotation.y=t*tau;objects.axis.rotation.z=-rad(p.tilt);sunLight.position.set(-Math.sin(rad(p.season))*8,0,Math.cos(rad(p.season))*8);}
    if(family==='tide'||family==='moon'){const a=rad(p.phase)+t*tau,d=family==='tide'?2.3+p.distance/150000:4;objects.moon.position.set(Math.cos(a)*d,Math.cos(a)*Math.sin(rad(p.inclination||0))*d,Math.sin(a)*d);objects.moon.lookAt(0,0,0);objects.moonMark.visible=id==='tidal-lock';if(objects.tide){objects.tide.scale.set(1+.18*(384400/p.distance)**3,1,1);objects.tide.rotation.y=-a;}if(objects.shadow){objects.shadow.visible=id.includes('eclipse');if(id==='solar-eclipse'){objects.shadow.position.copy(objects.moon.position);objects.shadow.position.x-=3;objects.shadow.scale.set(.35,1,1);}else{objects.shadow.position.set(-3,0,0);objects.shadow.scale.set(1.3,1,1);}}}
  if(family==='gravity'){objects.earth.visible=p.world==='earth';objects.gravityMoon.visible=p.world==='moon';objects.mars.visible=p.world==='mars';objects.axis.visible=false;objects.weight.position.set(0,2.3-1.2*t*t*({earth:1,moon:.165,mars:.378}[p.world]),0);objects.weight.scale.setScalar(Math.cbrt(p.mass/50));}
  if(family==='orbit'&&orbit){const q=sampleProfile(orbit.points,t);objects.satellite.position.set(q.x*1.6/C.R,q.y*1.6/C.R,0);objects.satellite.rotation.z=Math.atan2(q.y,q.x);}
  if(family==='system'){
   if(id==='planet-rings'){objects.ring.scale.setScalar(p.radius/3);objects.grains.forEach((x,i)=>{const r=1.2+seed(i)*(p.radius-1.2),a=i*.3+t*tau*3/r**1.5;x.position.set(Math.cos(a)*r,0,Math.sin(a)*r*(1-p.eccentricity));});}
   else{objects.planets.forEach(x=>{const a=t*tau*2/Math.sqrt(x.a**3);x.obj.position.set(Math.cos(a)*x.radius,0,Math.sin(a)*x.radius);});const e=p.eccentricity,rr=1.1+Math.log1p(p.radius)*1.2,M=t*tau;let E=M;for(let i=0;i<7;i++)E-= (E-e*Math.sin(E)-M)/(1-e*Math.cos(E));const x=rr*(Math.cos(E)-e),z=rr*Math.sqrt(1-e*e)*Math.sin(E);objects.test.position.set(x,0,z);pointsUpdate(objects.orbit,(i,n)=>{const a=i/(n-1)*tau;return[rr*(Math.cos(a)-e),0,rr*Math.sqrt(1-e*e)*Math.sin(a)]});objects.trail.visible=id==='comet-tail';if(id==='comet-tail')pointsUpdate(objects.trail,(i,n)=>{const u=i/(n-1),r=Math.hypot(x,z),len=2/(.5+r*.3);return[x+x/r*u*len,.02,z+z/r*u*len+u*u*.5]});if(objects.dust)objects.dust.forEach((o,i)=>{const r=.8+seed(i)*4,a=i*.7+t*tau/r**1.5;o.position.set(Math.cos(a)*r,(seed(i+3)-.5)*.2,Math.sin(a)*r)});if(objects.sight)pointsUpdate(objects.sight,i=>i?objects.test.position.toArray():objects.planets[2].obj.position.toArray());}
  }
  if(family==='meteor'&&meteor){
   const q=sampleProfile(meteor.profile,Math.min(1,t/.72)),h=q.height/100000,pos=[1-h*10/Math.tan(rad(p.angle)),.25+h*10,0],after=clamp((t-.72)/.28),heat=clamp(q.pressure/1e6);
   objects.meteor.position.set(...pos);objects.meteor.scale.setScalar(Math.max(.06,Math.cbrt(q.fraction)*(.2+Math.log1p(p.diameter)/5)));objects.meteor.visible=t<.72||!meteor.hypervelocity;
   objects.glow.position.copy(objects.meteor.position);objects.glow.scale.copy(objects.meteor.scale).multiplyScalar(1+heat);objects.glow.material.opacity=heat*.75;objects.glow.visible=t<.72;
   objects.tail.visible=t<.72&&heat>.005;pointsUpdate(objects.tail,(i,n)=>{const u=i/(n-1);return[pos[0]-u*1.6/Math.tan(rad(p.angle)),pos[1]+u*1.6,0]});
   const impact=meteor.hypervelocity&&after>0,power=Math.min(2.6,.15+.1*Math.log1p(meteor.impactEnergy/1e12)),burst=impact?after*4*power:0;
   objects.fragments.forEach((f,i)=>{const flightFragment=meteor.fragmented&&t<.72&&q.height<meteor.breakHeight;f.visible=flightFragment||impact;const a=seed(i)*tau,rr=flightFragment?(1-h)*seed(i)*.8:burst*(.4+seed(i));f.position.set(pos[0]+Math.cos(a)*rr,pos[1]+(flightFragment?(seed(i+20)-.5)*rr:Math.sin(after*Math.PI)*(1+seed(i))*power*3),Math.sin(a)*rr);});
   const attr=objects.terrain.geometry.attributes.position,colors=objects.terrain.geometry.attributes.color;for(let i=0;i<attr.count;i++){const bx=objects.base[i*3],by=objects.base[i*3+1],d=Math.hypot(bx-1,by),hills=p.surface==='land'?.18*Math.sin(bx*.35)*Math.cos(by*.43)+.065*Math.sin(bx*.9+by*.65)+.025*Math.sin(bx*2+by*1.7):.025*Math.sin(bx*.7-t*8)*Math.cos(by*.6-t*5),rim=impact&&p.surface==='land'?power*after*(.2*Math.exp(-Math.pow(d-1.2*power,2)/.13)-.7*Math.exp(-d*d/(.4+power))):0;attr.setZ(i,hills+rim);const tone=.85+.15*Math.sin(bx*1.4+by*.83);if(p.surface==='water')colors.setXYZ(i,.08*tone,.25*tone,.36*tone);else if(impact&&d<1.7*power)colors.setXYZ(i,.35*tone,.30*tone,.24*tone);else colors.setXYZ(i,.19*tone,.29*tone,.21*tone);}attr.needsUpdate=true;colors.needsUpdate=true;objects.terrain.geometry.computeVertexNormals();
   objects.shock.visible=impact&&p.surface==='land'&&after<.9;objects.shock.position.set(1,.04,0);objects.shock.scale.setScalar(.1+after*8*power);objects.shock.material.opacity=(1-after)*.5;
   objects.waveRings.forEach((w,i)=>{w.visible=impact&&p.surface==='water'&&after>i*.12;w.position.x=1;w.scale.setScalar(Math.max(.01,(after-i*.12)*9*power));w.material.opacity=Math.max(0,(1-after)*.6);});
   objects.flash.visible=impact;objects.flash.position.set(1,.4,0);objects.flash.scale.setScalar(1+after*7*power);objects.flash.material.opacity=Math.max(0,(1-after*3))*1.4;
   objects.dust.forEach((cloud,i)=>{cloud.visible=impact&&p.surface==='land';const a=seed(i)*tau,r=after*(.5+seed(i+1))*3.5*power;cloud.position.set(1+Math.cos(a)*r,.2+after*(1+seed(i+12))*2*power,Math.sin(a)*r);cloud.scale.setScalar((.2+after*2)*power);cloud.material.opacity=(1-after)*.5;});
  }
  if(family==='solar'){
   objects.wind.forEach((o,i)=>{const u=(seed(i)+t*(.7+p.activity*.3))%1;o.position.set(-1.5+u*7,(seed(i+90)-.5)*2+Math.max(0,u-.65)**2*8*(1-(p.field||0)),(seed(i+190)-.5)*2);o.visible=id!=='sunspots';o.scale.setScalar(.6+p.activity*.4)});
   objects.spots.forEach((o,i)=>{const a=i*2.4+t*tau,lat=(seed(i)-.5)*1.1;o.visible=i<p.activity*6;const rr=1.46;o.position.set(-3+Math.cos(a)*Math.cos(lat)*rr,Math.sin(lat)*rr,Math.sin(a)*Math.cos(lat)*rr)});
   const direction=rad(p.direction||0);objects.front.visible=['cme','solar-flare','geomagnetic-storm'].includes(id);objects.front.position.set(-3+8*t*Math.cos(direction),8*t*Math.sin(direction),0);objects.front.scale.setScalar(.2+t*1.2*p.activity);objects.aurora.visible=['aurora','geomagnetic-storm'].includes(id);objects.aurora.material.opacity=clamp((p.latitude||65)/90*p.activity*(1-(p.field||0))/2);objects.earth.rotation.y=t*tau;
  }
  if(family==='transit'){objects.planet.scale.setScalar(p.ratio*10);objects.planet.position.set((t*2-1)*3,6*Math.cos(rad(p.inclination)),2.2);}
  if(family==='shower'){const strength=.2+.8*Math.cos(rad(p.phase-180))**8;objects.streaks.forEach((l,i)=>{l.visible=i<p.count*strength;const u=(seed(i)+t*3)%1,x=(seed(i+5)-.5)*9;pointsUpdate(l,j=>[x+u*3+j*.25,5-u*8-j*.5,(seed(i+8)-.5)*3])});}
  if(family==='star'){
   const massive=p.mass>=8,a=p.age/100,explode=id==='supernova'&&massive&&p.age>=85,nebula=id==='planetary-nebula';let radius=id==='white-dwarf'?.15:id==='red-giant'?1+a*2:id==='protostar'?1.5-t*.8:id==='stellar-life'?(a>.7?1+(a-.7)*7:Math.pow(p.mass,.3)*.5):.8;
   objects.core.scale.setScalar(explode?Math.max(.18,1-t*1.4):nebula?.2:radius);objects.core.material.color.set(id==='white-dwarf'?0xd0e9ff:id==='red-giant'?0xff6746:0xffbf6a);objects.shells.forEach((o,i)=>{o.visible=explode||nebula||id==='protostar';o.scale.setScalar(id==='protostar'?2.8-t*1.2+i*.1:.9+t*(4+i*.7));o.material.opacity=(1-t)*.12+(nebula?.08:0)});
  }
  if(family==='binary'){
   const merger=id.includes('merger'),r=p.separation*(merger?1-.92*t:1),a=t*tau*(merger?1+3*t:1);objects.core.position.set(-Math.cos(a)*r/2,0,-Math.sin(a)*r/2);objects.second.position.copy(objects.core.position).multiplyScalar(-1);objects.core.scale.setScalar(id==='nova'?.35:1);objects.second.scale.setScalar(id==='nova'?1.7:1);objects.stream.visible=id==='nova';if(id==='nova')pointsUpdate(objects.stream,(i,n)=>{const u=i/(n-1);return objects.second.position.clone().lerp(objects.core.position,u).add(new THREE.Vector3(0,Math.sin(u*Math.PI)*.5,0)).toArray()});objects.shells.forEach((o,i)=>{o.visible=(id==='nova'&&t>.55)||merger;o.position.copy(objects.core.position);o.scale.setScalar(.5+((t+i*.08)%1)*4);o.material.opacity=id==='nova'?Math.max(0,(t-.55)*.5)*(1-t):.06;});
  }
  if(family==='compact'){
   const a=t*tau*3/(p.spin||1),tilt=rad(p.beam);objects.beams.forEach((b,i)=>{const side=i?1:-1;b.position.set(Math.sin(a)*Math.sin(tilt)*3*side,Math.cos(tilt)*3*side,Math.cos(a)*Math.sin(tilt)*3*side);b.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),b.position.clone().normalize());b.material.opacity=id==='gamma-burst'?.5*Math.exp(-t*3/(p.duration||3)):.32});objects.shells.forEach((x,i)=>{x.visible=id==='magnetar';x.scale.setScalar(.5+t*(2+p.field));x.material.opacity=Math.sin(t*Math.PI)**8*.14});
  }
  if(family==='hole'){
   objects.disk.rotation.z=.15;objects.disk.rotation.y=t*.4;objects.object.visible=id==='blackhole-tides';objects.object.position.set(1+p.distance/2,0,0);objects.object.scale.set(1+.4*Math.min(8,(10/p.mass)**2*(5/p.distance)**3),Math.max(.2,1-.1*Math.min(8,(10/p.mass)**2*(5/p.distance)**3)),1);objects.grains.forEach((o,i)=>{const r=1.15+seed(i)*2.8,a=i*.71+t*tau*3/r**1.5;o.position.set(Math.cos(a)*r,.05,Math.sin(a)*r)});objects.lens.visible=id==='lensing';pointsUpdate(objects.lens,(i,n)=>{const u=i/(n-1),x=-5+u*10;return[x,0,1+.8/(.3+x*x)*Math.min(3,p.mass/10)]});objects.shells.forEach(x=>x.visible=false);objects.beams?.forEach(b=>{b.material.opacity=.25+.1*Math.sin(t*tau)});
  }
  if(family==='wave'){const strain=Math.sin(t*tau*p.frequency)*p.amplitude*.45;objects.waveParticles.forEach((o,i)=>{const a=i/48*tau;o.position.set(Math.cos(a)*2*(1+strain),Math.sin(a)*2*(1-strain),0)});pointsUpdate(objects.wave,(i,n)=>{const x=-5+i/(n-1)*10;return[x,Math.sin(x*p.frequency-t*tau)*p.amplitude,-2]});}
  if(family==='resonance'){const a=t*tau*p.inner,b=t*tau*p.outer;objects.inner.position.set(Math.cos(a)*2,0,Math.sin(a)*2);objects.outer.position.set(Math.cos(b)*3.5,0,Math.sin(b)*3.5);pointsUpdate(objects.join,i=>(i?objects.outer:objects.inner).position.toArray());}
  if(family==='assist'){const bend=rad(p.bend)*(p.side==='behind'?1:-1),path=u=>{const x=-5+u*10,y=1.3+Math.max(0,u-.5)**2*8*Math.sin(bend);return[x,y,0]};pointsUpdate(objects.path,(i,n)=>path(i/(n-1)));objects.ship.position.set(...path(t));pointsUpdate(objects.velocity,i=>i?[1,0,2]:[-1,0,2]);}
  if(family==='galaxy'){objects.galaxies.forEach((g,i)=>{g.position.x=id==='galaxy-rotation'?0:(i?1:-1)*p.separation/2*(1-.8*t);g.visible=id!=='galaxy-rotation'||i===0;g.rotation.z=i?rad(p.angle||0):0;g.rotation.y=id==='galaxy-rotation'?0:t*tau*.3;const attr=g.geometry.attributes.position,base=g.userData.base;for(let j=0;j<attr.count;j++){const x=base[j*3],z=base[j*3+2],r=Math.max(.12,Math.hypot(x,z)),a=Math.atan2(z,x)+t*tau*(p.profile==='kepler'?1/r**1.5:1/r);if(id==='galaxy-rotation')attr.setXYZ(j,Math.cos(a)*r,base[j*3+1],Math.sin(a)*r);else attr.setXYZ(j,x*(1+.2*t/(1+p.separation)),base[j*3+1],z*(1-.1*t/(1+p.separation)));}attr.needsUpdate=true;});objects.wave.visible=false;}
  if(family==='expansion'){const scale=1+(p.scale-1)*t;objects.galaxies.forEach((g,i)=>{g.scale.setScalar(.16);const a=i*tau/12,r=1.3+(i%3)*1.1;g.position.set(Math.cos(a)*r*scale,(i%2-.5)*scale,Math.sin(a)*r*scale);});pointsUpdate(objects.wave,(i,n)=>{const x=-5+i/(n-1)*10;return[x,2+Math.sin(x*5/(scale*p.wavelength/500)-t*tau)*.4,0]});}
  if(family==='scale'){objects.galaxies.forEach((g,i)=>{g.visible=Math.abs(i-p.zoom)<2;g.scale.setScalar(i===p.zoom?1:.25);g.position.set((i-p.zoom)*4,0,0);g.rotation.y=t*.3});objects.wave.visible=false;}
  if(family==='rocket'){objects.rocket.position.y=-2+t*Math.min(5,p.exhaust*Math.log(p.ratio));objects.exhaust.forEach((o,i)=>{const u=(seed(i)+t*3)%1;o.position.set((seed(i+80)-.5)*u*.5,objects.rocket.position.y-1-u*3,(seed(i+30)-.5)*u*.5);o.scale.setScalar((1-u)*p.exhaust/3)});}
 }
 const resize=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;physical?.resize(w/h);controls.update();camera.updateProjectionMatrix();renderer.render(scene,camera)});resize.observe(host);
 const observer=new IntersectionObserver(es=>{visible=es[0]?.isIntersecting!==false});observer.observe(host);
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 const pointerDown=e=>{down={x:e.clientX,y:e.clientY}},click=e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(root.children,true).find(h=>h.object.userData.name||h.object.parent?.userData.name);if(hit)onPart?.(hit.object.userData.name?hit.object.userData:hit.object.parent.userData)};
 const lost=e=>{e.preventDefault();onFailure?.('Grafik muhit qayta ochiladi. Ikki o‘lchamli model mavjud.')};renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',click);
 function loop(now){frame=requestAnimationFrame(loop);if(!alive||document.hidden||!visible||now-last<(running?(lowQuality?50:33):100))return;last=now;controls.update();update(params,running?Math.min(1,time+(now-syncedAt)/1000*rate/24):time);renderer.render(scene,camera)}
 frame=requestAnimationFrame(loop);
 onReady?.('3D sahna tayyor');
 return {parts:[...new Map(parts.map(p=>[p.name,p])).values()],set(p,t,playing=false,speed=1){params=p;time=t;running=playing;rate=speed;syncedAt=performance.now();const key=JSON.stringify(p);if(key!==oldKey){oldKey=key;rebuild(p)}if(!playing){update(p,t);renderer.render(scene,camera)}},camera(action){if(physical?.camera(action)){controls.update();renderer.render(scene,camera);return}if(action==='left'||action==='right')camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),action==='left'?-.25:.25);if(action==='in'||action==='out')camera.position.sub(controls.target).multiplyScalar(action==='in'?.85:1.15).add(controls.target);if(action==='reset'){camera.position.set(0,5,13);controls.target.set(0,0,0);oldKey='';rebuild(params)}controls.update();renderer.render(scene,camera)},dispose(){alive=false;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',click);disposeObj(scene);ownedTextures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
