import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {benchById} from './chemistry-bench-content.js';
import {benchVisualState} from './chemistry-bench-visual-model.js';

// Original procedural models. Reuse particle populations and update transforms;
// never rebuild a scene on each simulation tick.
export function createBenchView(host,initial){
 const low=initial.quality==='low'||(initial.quality==='auto'&&((navigator.hardwareConcurrency||4)<=4||innerWidth<700));
 const segments=low?24:48,particleMax=low?28:64;
 const renderer=new T.WebGLRenderer({antialias:!low,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,low?1:1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.setClearColor(0,0);host.appendChild(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,80);camera.position.set(5,4.2,7);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.target.set(0,1.7,0);controls.minDistance=4;controls.maxDistance=14;controls.maxPolarAngle=Math.PI*.8;controls.minPolarAngle=.22;controls.enablePan=false;
 scene.add(new T.HemisphereLight(0xe9f7ff,0x5c6e78,1.55));const light=new T.DirectionalLight(0xffffff,2.2);light.position.set(4,6,5);scene.add(light);const rim=new T.DirectionalLight(0xc5f2ee,1.05);rim.position.set(-5,4,-4);scene.add(rim);
 let environment;
 if(!low){const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();}
 const vessel=new T.Group(),sample=new T.Group(),micro=new T.Group(),pour=new T.Group(),overflow=new T.Group();scene.add(vessel,sample,micro,pour,overflow);micro.visible=false;pour.visible=false;
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.42,...extra});
 const glass=()=>low?mat(0xd7edf2,{transparent:true,opacity:.24,roughness:.14,metalness:.1,side:T.DoubleSide,depthWrite:false}):new T.MeshPhysicalMaterial({color:0xf1fcff,transparent:true,opacity:.38,roughness:.075,metalness:0,ior:1.47,thickness:.035,transmission:.3,clearcoat:1,envMapIntensity:.9,side:T.DoubleSide,depthWrite:false});
 const mesh=(parent,g,m,pos=[0,0,0])=>{const o=new T.Mesh(g,m);o.position.set(...pos);parent.add(o);return o;};
 const sphere=(parent,r,color,pos,extra={})=>mesh(parent,new T.SphereGeometry(r,low?10:18,low?8:12),mat(color,extra),pos);
 const rod=(parent,a,b,width,color)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),o=mesh(parent,new T.CylinderGeometry(width,width,start.distanceTo(end),10),mat(color),start.clone().add(end).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return o;};
 const disposeGroup=g=>{const materials=new Set(),geometries=new Set(),textures=new Set();g.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{materials.add(m);if(m.map)textures.add(m.map);});});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());g.clear();};
 const label=(parent,text,x,y,z,width=.62)=>{const c=document.createElement('canvas');c.width=256;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#e8f5f8';ctx.fillRect(0,0,256,96);ctx.fillStyle='#28475a';ctx.font='600 37px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,48);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,opacity:.9,depthWrite:false}));s.position.set(x,y,z);s.scale.set(width,width*96/256,1);parent.add(s);return s;};
 const base=mesh(scene,new T.CylinderGeometry(3.25,3.25,.12,segments),mat(0xe5eef2,{roughness:.82}),[0,-.11,0]);
 const tray=mesh(scene,new T.CylinderGeometry(2.13,2.13,.065,segments),mat(0xdae8ed,{roughness:.62}),[0,-.014,0]);
 const ring=mesh(scene,new T.TorusGeometry(2.13,.025,8,segments),mat(0xb1c6cf),[0,.026,0]);ring.rotation.x=Math.PI/2;
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,5,64,64,60);gradient.addColorStop(0,'rgba(24,48,62,.3)');gradient.addColorStop(.65,'rgba(24,48,62,.08)');gradient.addColorStop(1,'rgba(24,48,62,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const shadow=mesh(scene,new T.PlaneGeometry(3.5,3.5),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),[0,.03,0]);shadow.rotation.x=-Math.PI/2;
 const liquid=mesh(sample,new T.CylinderGeometry(1,1,1,segments),mat(initial.result.colour,{transparent:true,opacity:.68,roughness:.14,metalness:.08,depthWrite:false}));liquid.renderOrder=1;
 const oil=mesh(sample,new T.CylinderGeometry(1,1,1,segments),mat(0xe8c15f,{transparent:true,opacity:.77,roughness:.14,depthWrite:false}));oil.renderOrder=2;
 const meniscus=mesh(sample,new T.TorusGeometry(1,.018,8,segments),mat(0xdaeef3,{transparent:true,opacity:.7,roughness:.1,depthWrite:false}));meniscus.rotation.x=Math.PI/2;meniscus.renderOrder=3;
 const surfaceGeometry=new T.BufferGeometry(),positions=[],indices=[],rings=low?4:7;
 for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,r=j/rings;positions.push(Math.sin(a)*r,0,Math.cos(a)*r);}
 for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
 surfaceGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));surfaceGeometry.setIndex(indices);surfaceGeometry.computeVertexNormals();
 const surface=mesh(sample,surfaceGeometry,mat(0xc3eaf0,{transparent:true,opacity:.68,roughness:.075,metalness:.13,side:T.DoubleSide,depthWrite:false}));surface.renderOrder=4;
 const dummy=new T.Object3D();
 function population(geometry,material,max=particleMax){const o=new T.InstancedMesh(geometry,material,max);o.instanceMatrix.setUsage(T.DynamicDrawUsage);o.frustumCulled=false;o.count=0;sample.add(o);return o;}
 const particleGeometry=new T.SphereGeometry(1,low?8:12,low?6:8);
 const bubbles=population(particleGeometry,mat(0xf2fcff,{transparent:true,opacity:.5,roughness:.025,metalness:.2,depthWrite:false}));bubbles.renderOrder=5;
 const foam=population(particleGeometry.clone(),mat(0xf3faec,{transparent:true,opacity:.9,roughness:.18,depthWrite:false}),low?40:96);foam.renderOrder=6;
 const foamBody=mesh(sample,new T.CylinderGeometry(1,1,1,segments),mat(0xeaf3e5,{transparent:true,opacity:.72,roughness:.36,depthWrite:false}));foamBody.renderOrder=5;
 const sand=population(new T.IcosahedronGeometry(1,0),mat(0xbca17b,{roughness:.9}));
 const crystals=population(new T.BoxGeometry(1,1,1),mat(0xe7e9df,{roughness:.31,metalness:.08}));
 const precipitate=population(particleGeometry.clone(),mat(0xf7f4e8,{transparent:true,opacity:.87,roughness:.75}));
 const droplets=population(particleGeometry.clone(),mat(0xe7bd4f,{transparent:true,opacity:.87,roughness:.13}));
 const ice=population(new T.BoxGeometry(1,1,1),low?mat(0xc7eaf0,{transparent:true,opacity:.8,roughness:.14}):new T.MeshPhysicalMaterial({color:0xcdeff3,transparent:true,opacity:.82,roughness:.12,transmission:.15,ior:1.31,thickness:.3,clearcoat:.8}));
 const steam=population(particleGeometry.clone(),mat(0xe2f1f4,{transparent:true,opacity:.15,roughness:1,depthWrite:false}));
 const iron=mesh(sample,new T.BoxGeometry(.64,.12,.22),mat(0x75838b,{metalness:.75,roughness:.34}),[.2,.13,.2]);
 const rust=population(new T.IcosahedronGeometry(1,1),mat(0xaa693e,{roughness:.98}));
 const bulb=sphere(sample,.21,0x98a9b2,[-1.75,3.32,0]);const bulbLight=new T.PointLight(0xffd87a,0,2);bulbLight.position.copy(bulb.position);sample.add(bulbLight);
 let current=initial,appearance=benchVisualState(initial.result),kind='',microKey='',disposed=false,frame=0,visible=true,inViewport=true,last=0,clock=0,lastPour=initial.pour?.serial||0,pourStart=-100,settleStart=-100,settling=false,previousMix=false,pourHeightFrom=0;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 function buildVessel(id){
  disposeGroup(vessel);disposeGroup(overflow);const a=benchVisualState(current.result),r=a.radius+.055,h=a.ceiling+.15;
  const points=[[0,0],[r-.045,0],[r,.04],[r,h],[r-.025,h],[r-.04,.085],[0,.085]].map(([x,y])=>new T.Vector2(x,y));
  const body=mesh(vessel,new T.LatheGeometry(points,segments),glass());body.renderOrder=8;
  const lip=mesh(vessel,new T.TorusGeometry(r-.015,.027,8,segments),glass(),[0,h,0]);lip.rotation.x=Math.PI/2;lip.renderOrder=9;
  for(let i=1;i<=4;i++){const y=.06+a.ceiling*i/4;rod(vessel,[r*.87,y,r*.45],[r*.72,y,r*.7],.009,0x426e80);label(vessel,`${Math.round(current.result.capacity*i/4)} ml`,r*.77+.24,y,r*.62,.48);}
  if(id==='volcano'){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=low?128:256;const c=canvas.getContext('2d'),pixels=c.createImageData(canvas.width,canvas.height);
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const n=(Math.sin(x*12.9898+y*78.233)*43758.5453)%1,v=155+Math.abs(n)*70+12*Math.sin(y/12+x/31),i=(y*canvas.width+x)*4;pixels.data[i]=v;pixels.data[i+1]=v*.91;pixels.data[i+2]=v*.8;pixels.data[i+3]=255;}c.putImageData(pixels,0,0);const stone=new T.CanvasTexture(canvas);stone.colorSpace=T.SRGBColorSpace;
   const mountain=mesh(vessel,new T.CylinderGeometry(.53,1.8,2.25,segments,5,true,Math.PI*.34,Math.PI*1.32),mat(0xad8870,{roughness:1,map:stone,bumpMap:stone,bumpScale:.03,side:T.DoubleSide}),[0,1.12,0]);
   const attr=mountain.geometry.attributes.position;for(let i=0;i<attr.count;i++){const y=attr.getY(i),f=Math.max(0,(1.1-y)/2.2),angle=Math.atan2(attr.getX(i),attr.getZ(i)),jitter=1+.045*f*Math.sin(angle*11+y*4);attr.setX(i,attr.getX(i)*jitter);attr.setZ(i,attr.getZ(i)*jitter);}mountain.geometry.computeVertexNormals();
   for(const angle of [Math.PI*.34,Math.PI*1.66])rod(vessel,[Math.sin(angle)*.53,2.245,Math.cos(angle)*.53],[Math.sin(angle)*1.8,0,Math.cos(angle)*1.8],.025,0x765b4f);
  }
  if(id==='funnel'){
   const funnel=mesh(vessel,new T.ConeGeometry(.8,1.05,segments,1,true),glass(),[0,3.63,0]);funnel.rotation.z=Math.PI;funnel.renderOrder=8;
   mesh(vessel,new T.CylinderGeometry(.11,.11,.56,12,1,true),glass(),[0,2.9,0]);
   const paper=mesh(vessel,new T.ConeGeometry(.75,.98,segments,1,true),mat(0xf3f0e2,{side:T.DoubleSide,roughness:.8}),[0,3.65,0]);paper.rotation.z=Math.PI;
   rod(vessel,[1.4,0,-.35],[1.4,4.05,-.35],.035,0x5d7f8d);rod(vessel,[1.4,3.75,-.35],[.7,3.75,-.35],.035,0x5d7f8d);
  }
  if(id==='electrodes'){
   for(const x of [-.48,.48])mesh(vessel,new T.BoxGeometry(.1,2.4,.14),mat(0x596d77,{metalness:.65}),[x,2.1,0]);
   rod(vessel,[-.48,3.32,0],[-1.75,3.32,0],.024,0x367d85);rod(vessel,[.48,3.32,0],[1.75,3.32,0],.024,0xc07a64);label(vessel,'Ionlar zaryad tashiydi',0,3.72,0,1.72);
  }
  const paths=id==='volcano'?5:2;
  for(let i=0;i<paths;i++){
   const angle=id==='volcano'?1.4+i*.72:3.8+i*.7,r0=id==='volcano'?.53:r;
   const points=[new T.Vector3(Math.sin(angle)*r0,h,Math.cos(angle)*r0),new T.Vector3(Math.sin(angle)*(r0+.25),h*.72,Math.cos(angle)*(r0+.25)),new T.Vector3(Math.sin(angle)*(id==='volcano'?1.35:r+.12),h*.25,Math.cos(angle)*(id==='volcano'?1.35:r+.12)),new T.Vector3(Math.sin(angle)*(id==='volcano'?1.83:r+.18),.09,Math.cos(angle)*(id==='volcano'?1.83:r+.18))];
   const flow=mesh(overflow,new T.TubeGeometry(new T.CatmullRomCurve3(points),18,.08,low?5:8,false),mat(0xedf6e7,{roughness:.25,transparent:true,opacity:.84}));flow.userData.index=i;
  }
  const puddle=mesh(overflow,new T.CircleGeometry(1,segments),mat(0xe9f3e7,{transparent:true,opacity:.78,roughness:.2,side:T.DoubleSide}),[0,.055,0]);puddle.rotation.x=-Math.PI/2;puddle.userData.puddle=true;
 }
 function buildMicro(result){
  disposeGroup(micro);
  if(result.water>0){const water=new T.Group();micro.add(water);sphere(water,.4,0xd96155,[0,0,0]);for(const x of [-1,1]){const p=[x*Math.sin(104.5*Math.PI/360)*.96,Math.cos(104.5*Math.PI/360)*.96,0];sphere(water,.22,0xe9f4f7,p);rod(water,[0,0,0],p,.055,0xa7bbc2);}water.position.set(-1,1.6,0);label(micro,'H₂O · 104,5°',-1,2.82,0,1.32);}
  if(result.dissolvedSalt>0){sphere(micro,.34,0x8c9fde,[1,1.1,.5]);sphere(micro,.44,0x78b79b,[1.5,2.25,-.2]);label(micro,'Na⁺',1,.52,.5,.55);label(micro,'Cl⁻',1.5,2.87,-.2,.55);}
  if(result.gasTargetMoles>0){const co2=new T.Group();micro.add(co2);sphere(co2,.27,0x526a7a,[0,0,0]);for(const x of [-1,1]){sphere(co2,.32,0xd96155,[x*.83,0,0]);rod(co2,[0,.045,0],[x*.83,.045,0],.04,0xa9bdc5);rod(co2,[0,-.045,0],[x*.83,-.045,0],.04,0xa9bdc5);}co2.position.set(result.dissolvedSalt>0?0:1,3.55,0);label(micro,'CO₂ · 180°',co2.position.x,4.18,0,1.35);}
 }
 function buildPour(event){
  disposeGroup(pour);if(!event)return;const s=benchById[event.substance],solid=s.unit==='g',y=kind==='funnel'?4.5:appearance.ceiling+1.15;
  const bottle=new T.Group();pour.add(bottle);bottle.position.set(-1.4,y,.15);bottle.rotation.z=-.72;
  mesh(bottle,new T.CylinderGeometry(.23,.27,.63,16),glass(),[0,0,0]);mesh(bottle,new T.CylinderGeometry(.1,.1,.2,12),glass(),[0,.4,0]);mesh(bottle,new T.CylinderGeometry(.22,.25,.4,16),mat(s.color,{transparent:!solid,opacity:solid?1:.8,roughness:solid?.8:.16}),[0,-.08,0]);label(bottle,s.formula,0,0,.28,.65);
  if(!solid){const end=new T.Vector3(0,kind==='funnel'?3.83:appearance.height+.1,0),curve=new T.QuadraticBezierCurve3(new T.Vector3(-1.1,y+.3,.1),new T.Vector3(-.4,y-.1,.1),end);mesh(pour,new T.TubeGeometry(curve,16,Math.min(.06,.018+event.amount/180*.04),7,false),mat(s.color,{transparent:true,opacity:.72,roughness:.1,depthWrite:false}));}
  else for(let i=0;i<(low?12:24);i++){const g=mesh(pour,new T.IcosahedronGeometry(.022+i%3*.009,0),mat(s.color));g.userData={grain:true,i,y};}
  pour.visible=true;
 }
 function instance(o,i,x,y,z,size,rotation=0){dummy.position.set(x,y,z);dummy.scale.setScalar(size);dummy.rotation.set(rotation,rotation*.7,rotation*.3);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);}
 function arrange(time){
  const r=current.result,a=appearance,p=r.parameters,age=(performance.now()-pourStart)/1000,fill=pour.visible&&age<1.1?1-(1-Math.max(0,age/1.1))**2:1,h=pourHeightFrom+(a.height-pourHeightFrom)*fill,rad=a.radius;
  const separation=settling?Math.min(1,(clock-settleStart)/2.4):p.stir?0:1;
  const mixed=a.mixedOil||(settling&&separation<1),visibleOil=mixed?a.oilHeight*separation:a.oilHeight;
  const waterHeight=mixed?h-visibleOil:Math.max(0,h-visibleOil);
  liquid.visible=a.liquid&&waterHeight>0;liquid.scale.set(rad,Math.max(.001,waterHeight),rad);liquid.position.y=.06+waterHeight/2;liquid.material.color.set(r.colour);if(a.precipitate>0&&!r.filtered)liquid.material.color.lerp(new T.Color(0xf7f5e9),Math.min(.93,a.precipitate/Math.max(1,r.water)*160*a.suspended));liquid.material.opacity=a.cloudy?.84:.61;
  oil.visible=a.liquid&&visibleOil>.005;oil.scale.set(rad,Math.max(.001,visibleOil),rad);oil.position.y=.06+waterHeight+visibleOil/2;
  meniscus.visible=surface.visible=a.liquid;meniscus.scale.set(rad,rad,rad);meniscus.position.y=h+.067;surface.position.y=h+.06;surface.scale.set(rad,1,rad);surface.material.color.set(r.oil&&!mixed?0xe8c15f:r.colour);
  const attr=surfaceGeometry.attributes.position,amplitude=Math.min(h*.09,a.mixing?.026:a.gasFlow>0?.008:.001);
  for(let i=0;i<attr.count;i++){const x=positions[i*3],z=positions[i*3+2],edge=Math.hypot(x,z);attr.setY(i,amplitude*(Math.sin(x*7+time*3)+Math.cos(z*6-time*2))*(1-edge*.45));}attr.needsUpdate=true;surfaceGeometry.computeVertexNormals();
  bubbles.count=a.liquid&&r.gasMoles>0?Math.min(particleMax,a.bubbleCount):0;
  for(let i=0;i<bubbles.count;i++){const v=(time*(.26+Math.min(1,a.gasFlow/10))+i*.137)%1,theta=i*2.399+time*.2,rr=rad*(.2+i%9/14),size=(.016+i%4*.007)*(1+v*.9);instance(bubbles,i,Math.sin(theta)*rr,.09+v*Math.max(.05,h-.12),Math.cos(theta)*rr,size);}
  droplets.count=mixed?Math.min(particleMax,Math.ceil(r.oil*2)):0;
  for(let i=0;i<droplets.count;i++){const theta=i*2.399+time*.4,rr=rad*Math.sqrt((i+.5)/droplets.count)*.85,y=.1+((i*.173+time*.035)%1)*Math.max(.02,h-.13);instance(droplets,i,Math.sin(theta)*rr,y*(1-separation)+(.06+waterHeight)*separation,Math.cos(theta)*rr,(.024+i%4*.009)*Math.max(.05,1-separation));}
  foamBody.visible=a.foam;foamBody.scale.set(rad*.96,Math.max(.001,a.foamHeight*.85),rad*.96);foamBody.position.y=h+.075+a.foamHeight*.425;
  foam.count=a.foam?foam.instanceMatrix.count:0;
  for(let i=0;i<foam.count;i++){const theta=i*2.399,rr=rad*Math.sqrt((i+.5)/foam.count)*.94,layer=i%7/6,size=(low?.04:.025)+i%5*.007;instance(foam,i,Math.sin(theta)*rr,h+.09+(.73+layer*.27)*a.foamHeight+(current.running?Math.sin(time*2+i)*.015:0),Math.cos(theta)*rr,size);}
  function sediment(o,mass,suspended,crystal=false){o.count=mass>.001?Math.min(particleMax,Math.max(8,Math.ceil(mass*9))):0;const depth=Math.min(.28,mass/50+.025);for(let i=0;i<o.count;i++){const theta=i*2.399+(suspended?time*.16:0),rr=rad*Math.sqrt((i+.5)/o.count)*.83,bed=.1+i%3*depth/3,y=suspended?bed+(Math.sin(i*2.2+time*.35)*.5+.5)*Math.max(.02,h-.16)*suspended:bed;instance(o,i,Math.sin(theta)*rr,y,Math.cos(theta)*rr,crystal?.055+i%3*.02:.025+i%3*.016,i*.45);}}
  sediment(sand,r.filtered?0:a.sand,p.stir?1:.08*a.suspended);sediment(crystals,a.solid,p.stir?.15:0,true);sediment(precipitate,r.filtered?0:a.precipitate,a.suspended);
  if(a.filterResidue>0){sand.count=Math.min(particleMax,Math.max(8,Math.ceil(a.filterResidue*7)));sand.material.color.set(r.sand>0?0xbca17b:0xf3eee0);for(let i=0;i<sand.count;i++){const theta=i*2.399,rr=.51*Math.sqrt((i+.5)/sand.count);instance(sand,i,Math.sin(theta)*rr,3.42+rr*.6,Math.cos(theta)*rr,.035+i%3*.015);}}else sand.material.color.set(0xbca17b);
  ice.count=a.ice?12:0;for(let i=0;i<ice.count;i++){const theta=i*2.399,rr=rad*Math.sqrt((i+.5)/12)*.68,size=Math.min(.37,Math.max(.13,Math.cbrt(Math.max(.01,h))*.28));instance(ice,i,Math.sin(theta)*rr,.1+size/2+(i%3)*size*.72,Math.cos(theta)*rr,size,i*.47);}
  steam.count=a.steam?(low?12:24):0;for(let i=0;i<steam.count;i++){const v=(time*.18+i*.073)%1;instance(steam,i,Math.sin(i*2.399+v)*rad*.62,a.ceiling*.3+v*2.6,Math.cos(i*2.399)*rad*.62,.055+v*.17);}
  iron.visible=p.additions.some(v=>v.substance==='iron');rust.count=iron.visible?Math.round(particleMax*r.rustFraction):0;for(let i=0;i<rust.count;i++)instance(rust,i,.2+Math.sin(i*2.399)*.26,.199,.2+Math.cos(i*2.399)*.09,.02+i%4*.005);
  bulb.visible=bulbLight.visible=kind==='electrodes';bulb.material.color.set(r.conductivity>.005?0xffcf72:0x8ca0ac);bulb.material.emissive.set(0xffc65c);bulb.material.emissiveIntensity=r.conductivity*1.2;bulbLight.intensity=r.conductivity*2;
  overflow.visible=a.overflow&&current.view!=='micro';overflow.children.forEach(o=>{if(o.userData.puddle){const size=kind==='volcano'?1.9:1.25;o.scale.set(size,size,.9);o.material.color.set(a.foam?0xedf6e7:r.colour);o.material.opacity=Math.min(.85,.3+r.overflow/200);}else{o.visible=r.overflow>o.userData.index*10;o.material.color.set(a.foam?0xedf6e7:r.colour);}});
  if(pour.visible){pour.visible=age<1.45&&current.view!=='micro';pour.children.forEach(o=>{if(o.userData.grain){const {i,y}=o.userData,v=(age*.9+i*.097)%1;o.position.set(-1.05+(i%3)*.08+v*.9,y+.2-v*(y-h),.1+Math.sin(i)*.055);}});}
  [bubbles,droplets,foam,sand,crystals,precipitate,ice,steam,rust].forEach(o=>{o.instanceMatrix.needsUpdate=true;});
 }
 function draw(){if(!disposed&&visible)renderer.render(scene,camera);}
 const animated=()=>visible&&!reduce.matches&&(current.running||pour.visible||settling);
 function animate(t){if(disposed)return;frame=0;if(animated()){if(t-last>=(low?50:33)){clock+=Math.min(.1,(t-last)/1000);last=t;if(settling&&clock-settleStart>=2.4)settling=false;arrange(clock);draw();}if(animated())frame=requestAnimationFrame(animate);}}
 function update(next){
  if(disposed)return;const wasRunning=current.running,priorHeight=appearance.height,priorTime=current.result.parameters.elapsed,priorFiltered=current.result.filtered;current={...current,...next};appearance=benchVisualState(current.result);
  if(kind!==appearance.kind){kind=appearance.kind;buildVessel(kind);}
  const key=JSON.stringify([current.result.water>0,current.result.dissolvedSalt>0,current.result.gasTargetMoles>0]);if(microKey!==key){microKey=key;buildMicro(current.result);}
  if(previousMix&&!current.result.parameters.stir&&current.result.oil>0&&current.result.water>0){settleStart=clock;settling=!reduce.matches;}previousMix=current.result.parameters.stir;
  if(current.pour?.serial&&current.pour.serial!==lastPour){lastPour=current.pour.serial;pourStart=performance.now();pourHeightFrom=priorHeight;buildPour(current.pour);if(reduce.matches)pour.visible=false;}
  if(!current.pour){pour.visible=false;lastPour=0;}
  if(wasRunning&&!current.running){pour.visible=false;settling=false;}
  if(!current.running&&(current.result.parameters.elapsed!==priorTime||current.result.filtered!==priorFiltered))pour.visible=false;
  const detail=current.view==='micro',targetY=detail?(current.result.gasTargetMoles>0?2.45:1.9):kind==='funnel'?2.05:kind==='dish'?.8:1.55,delta=targetY-controls.target.y;if(Math.abs(delta)>.001){controls.target.y=targetY;camera.position.y+=delta;controls.update();}micro.visible=detail;[vessel,sample].forEach(g=>g.visible=!detail);if(detail)pour.visible=false;
  arrange(clock);draw();if(animated()){if(!frame){last=performance.now();frame=requestAnimationFrame(animate);}}else{cancelAnimationFrame(frame);frame=0;}
 }
 const size=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw();};
 const resize=new ResizeObserver(size);resize.observe(host);
 const intersection=new IntersectionObserver(entries=>{inViewport=entries[0]?.isIntersecting;visible=inViewport&&!document.hidden;if(visible)update(current);else{cancelAnimationFrame(frame);frame=0;}});intersection.observe(host);
 const visibility=()=>{visible=inViewport&&!document.hidden;if(visible)update(current);else{cancelAnimationFrame(frame);frame=0;}};
 const lost=e=>{e.preventDefault();cancelAnimationFrame(frame);current.onLost?.();};document.addEventListener('visibilitychange',visibility);renderer.domElement.addEventListener('webglcontextlost',lost);controls.addEventListener('change',draw);
 const theme=()=>{const dark=document.documentElement.dataset.theme==='dark';base.material.color.set(dark?0x193445:0xe5eef2);tray.material.color.set(dark?0x2b4c59:0xdae8ed);ring.material.color.set(dark?0x648891:0xb1c6cf);draw();};
 const themeObserver=new MutationObserver(theme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});const media=()=>{if(reduce.matches){pour.visible=false;settling=false;}update(current);};reduce.addEventListener('change',media);theme();size();update(initial);
 return {update,
  rotate(angle){const offset=camera.position.clone().sub(controls.target).applyAxisAngle(new T.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(offset);controls.update();draw();},
  tilt(angle){const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));s.phi=T.MathUtils.clamp(s.phi+angle,.22,Math.PI*.8);camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s));controls.update();draw();},
  zoom(factor){camera.position.sub(controls.target).multiplyScalar(factor).clampLength(4,14).add(controls.target);controls.update();draw();},
  dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();themeObserver.disconnect();reduce.removeEventListener('change',media);document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',lost);controls.dispose();disposeGroup(scene);environment?.dispose();renderer.dispose();renderer.domElement.remove();}
 };
}
