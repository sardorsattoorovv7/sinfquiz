import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {molecules,phColor} from '../chemistry-model.js';
// Procedural environments: physical geometry, real lighting, original textures.
// No downloaded assets, invented photographs or claims of surveyed reconstruction.
export function mountRealityWorld(host,initial,onLost){
 const scene=new T.Scene();scene.background=new T.Color('#253d35');scene.fog=new T.Fog('#253d35',30,65);
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const camera=new T.PerspectiveCamera(42,1,.05,100),controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=1;controls.maxDistance=32;controls.maxPolarAngle=Math.PI*.49;controls.enableDamping=false;
 scene.add(new T.HemisphereLight('#f6f0d7','#526955',2));const sun=new T.DirectionalLight('#fff3d4',3.2);sun.position.set(8,13,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.bias=-.001;scene.add(sun);const fill=new T.DirectionalLight('#a6ded1',1.8);fill.position.set(-9,6,-4);scene.add(fill);
 const world=new T.Group();scene.add(world);let state=initial,signature='',frame=null,visible=true,disposed=false,animate=[];
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.5,metalness:.1,...extra});
 const add=(parent,geometry,color,pos=[0,0,0],extra={})=>{const mesh=new T.Mesh(geometry,mat(color,extra));mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const box=(parent,pos,size,color,extra={})=>add(parent,new T.BoxGeometry(...size),color,pos,extra);
 const cyl=(parent,pos,r,h,color,extra={})=>add(parent,new T.CylinderGeometry(r,r,h,32),color,pos,extra);
 const ball=(parent,pos,r,color,extra={})=>add(parent,new T.SphereGeometry(r,20,12),color,pos,extra);
 const label=(parent,value,pos,width=2)=>{const cv=document.createElement('canvas');cv.width=1024;cv.height=160;const c=cv.getContext('2d');c.fillStyle='#f5eed3';c.font='600 62px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(value),512,80,990);const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,depthWrite:false}));sprite.position.set(...pos);sprite.scale.set(width,width*160/1024,1);parent.add(sprite);return sprite;};
 const beam=(parent,a,b,r,color)=>{const v=new T.Vector3(...b).sub(new T.Vector3(...a)),m=add(parent,new T.CylinderGeometry(r,r,v.length(),12),color);m.position.copy(new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;};
 const ring=(parent,pos,r,color)=>{const m=add(parent,new T.TorusGeometry(r,.018,8,48),color,pos);m.rotation.x=Math.PI/2;return m;};
 function clear(){world.traverse(m=>{m.geometry?.dispose();for(const material of Array.isArray(m.material)?m.material:[m.material]){material?.map?.dispose();material?.dispose();}});world.clear();animate=[];}
 function room(){
  const floor=box(world,[0,-.09,0],[26,.16,22],'#777960',{roughness:.95});
  for(let i=-12;i<=12;i++){box(world,[i,.005,0],[.012,.01,22],'#adad8e');if(i>=-10&&i<=10)box(world,[0,.005,i],[26,.01,.012],'#adad8e');}
  box(world,[0,2.6,-7],[26,5.2,.16],'#4e6954',{roughness:.9});box(world,[-10,2.6,0],[.16,5.2,14],'#66775a');
  for(let i=-2;i<=2;i++){box(world,[i*3.3,2.8,-6.88],[2.4,1.8,.03],'#abc7b4',{emissive:'#8fbca7',emissiveIntensity:.5});box(world,[i*3.3,2.8,-6.84],[.07,1.8,.03],'#b6a77d');box(world,[i*3.3,2.8,-6.84],[2.4,.07,.03],'#b6a77d');}
  const human=new T.Group();human.position.set(state.subject==='chemistry'?-2.2:-3.5,0,1);world.add(human);cyl(human,[0,.85,0],.18,.65,'#cebd94');ball(human,[0,1.52,0],.16,'#d8c39c');beam(human,[-.1,.6,0],[-.15,.1,.04],.07,'#394d47');beam(human,[.1,.6,0],[.15,.1,-.04],.07,'#394d47');beam(human,[-.18,1.1,0],[-.32,.65,0],.055,'#cebd94');beam(human,[.18,1.1,0],[.32,.65,0],.055,'#cebd94');label(human,'1,7 m',[0,1.95,0],1.15);
 }
 function panel(points,color='#d0a862',depth=.09){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const mesh=add(world,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),color);mesh.rotation.x=-Math.PI/2;mesh.position.y=.06;return mesh;}
 function dimension(a,b,value){beam(world,a,b,.012,'#edd69a');label(world,value,new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5).add(new T.Vector3(0,.25,0)).toArray(),2.2);}
 function math(){
  const p=state.parameters,s=state.topic.scene,id=state.topic.templateId||state.topic.id,accent='#b39155',blue='#4d9994',paper='#d9d3b8';
  room();
  const solids=['cube','cuboid','prism','pyramid','cylinder','cone','sphere'];
  if(solids.includes(s)){
   let geo,height,width,depth;const a=p.a||3,b=p.b||a,c=p.c||a,r=p.r||2,h=p.h||3;
   if(s==='cube'||s==='cuboid'){width=a;depth=s==='cube'?a:b;height=s==='cube'?a:c;geo=new T.BoxGeometry(width,height,depth);}
   else if(s==='sphere'){height=r*2;width=r*2;depth=r*2;geo=new T.SphereGeometry(r,36,24);}
   else if(s==='cylinder'||s==='cone'){height=h;width=r*2;depth=r*2;geo=new T.CylinderGeometry(s==='cone'?0:r,r,h,48);}
   else if(s==='pyramid'){height=h;width=a;depth=a;geo=new T.ConeGeometry(a/Math.SQRT2,h,4);geo.rotateY(Math.PI/4);}
   else {const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(a,0);sh.lineTo(0,b);sh.closePath();geo=new T.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false});geo.translate(-a/2,0,-h/2);height=b;width=a;depth=h;}
   const shape=add(world,geo,blue,[0,s==='prism'?0:height/2,0],{transparent:true,opacity:.62,side:T.DoubleSide,roughness:.25,metalness:.25});
   const edges=new T.LineSegments(new T.EdgesGeometry(geo),new T.LineBasicMaterial({color:'#e3d8a9'}));edges.position.copy(shape.position);world.add(edges);
   dimension([-width/2,.15,depth/2+.4],[width/2,.15,depth/2+.4],`${width.toFixed(1)} m`);dimension([width/2+.5,.15,0],[width/2+.5,height,0],`${height.toFixed(1)} m`);
   const measure=box(world,[0,.05,0],[Math.max(.2,width),.03,Math.max(.2,depth)],'#e2c16c',{transparent:true,opacity:.48});animate.push(q=>{measure.position.y=q*height;});
  }else if(s==='number'){
   box(world,[0,1.9,0],[1.4,3.8,.25],paper);const glass=cyl(world,[0,1.8,.2],.09,2.7,'#d0e6d8',{transparent:true,opacity:.4});const v=p.start+p.change;const col=cyl(world,[0,.5,.2],.06,1,'#aa6552');ball(world,[0,.4,.2],.16,'#aa6552');for(let i=-20;i<=20;i+=5){box(world,[.3,1.8+i*.06,.2],[.2,.012,.05],'#3c5142');label(world,String(i),[.56,1.8+i*.06,.22],.4);}animate.push(q=>{const temperature=p.start+p.change*q,length=.16+(temperature+20)/40*2.4;col.scale.y=length;col.position.y=.44+length/2;});label(world,'°C',[0,3.5,.3],.65);
  }else if(['fraction'].includes(s)){
   const numerator=id==='ulush-foiz'?p.discount:id==='nisbat'?p.syrup:p.numerator,denominator=id==='ulush-foiz'?100:id==='nisbat'?p.syrup+p.water:p.denominator,count=Math.ceil(numerator/denominator)||1;
   if(id==='nisbat'){for(let i=0;i<p.syrup+p.water;i++){const x=(i%6-2.5)*.75,z=Math.floor(i/6)*.8;const cup=cyl(world,[x,.4,z],.24,.8,i<p.syrup?'#ba8657':'#7db4b4',{transparent:true,opacity:.7});ring(world,[x,.8,z],.24,paper);}}
   else for(let k=0;k<Math.min(10,count);k++){const x=(k-(count-1)/2)*2.4,total=Math.min(denominator,100);cyl(world,[x,.08,0],1,.12,'#70543a');for(let i=0;i<total;i++){const m=add(world,new T.CircleGeometry(.97,Math.max(3,Math.ceil(64/total)),i*2*Math.PI/total,2*Math.PI/total-.008),i+k*denominator<numerator?'#cead63':'#a5b5a0',[x,.151,0]);m.rotation.x=-Math.PI/2;}}
   label(world,id==='ulush-foiz'?`${p.discount}% chegirma`:id==='nisbat'?`${p.syrup} : ${p.water}`:`${p.numerator} / ${p.denominator}`,[0,2.6,0],4);
  }else if(['angle'].includes(s)){
   box(world,[-1.5,1.6,0],[.2,3.2,.3],accent);box(world,[0,3.1,0],[3.2,.2,.3],accent);box(world,[1.5,1.6,0],[.2,3.2,.3],accent);const hinge=new T.Group();hinge.position.x=-1.4;world.add(hinge);const door=box(hinge,[1.4,1.5,0],[2.8,3,.1],'#b39662');ball(hinge,[2.5,1.4,.1],.055,'#d9c891');hinge.rotation.y=-p.angle*Math.PI/180;label(world,`${p.angle}°`,[0,3.7,0],2.5);
  }else if(s==='triangle'){
   let a=p.a||3,b=id==='teng-tomonli'?a*Math.sqrt(3)/2:id==='trigonometriya'?a*Math.tan(p.angle*Math.PI/180):p.b||4;const centered=['teng-yonli','teng-tomonli','uchburchak'].includes(id),top=centered?0:-a/2;
   panel([[-a/2,0],[a/2,0],[top,b]],'#9c8c60');for(const [u,v]of [[[-a/2,.1,0],[a/2,.1,0]],[[top,.1,-b],[a/2,.1,0]],[[top,.1,-b],[-a/2,.1,0]]])beam(world,u,v,.08,accent);
   // A second upright copy makes the physical wall / ladder relationship visible.
   if(['pifagor','togri-uchburchak','trigonometriya'].includes(id)){box(world,[-a/2,b/2,-.5],[.13,b,1],paper);beam(world,[-a/2,b,.1],[a/2,0,.1],.075,accent);for(let i=1;i<=8;i++){const q=i/9;box(world,[-a/2+a*q,b*(1-q),.1],[.35,.06,.08],paper);}dimension([-a/2,.1,1],[a/2,.1,1],`${a} m`);}
   else dimension([-a/2,.15,1],[a/2,.15,1],`${a} m`);
  }else if(['coordinate','line'].includes(s)){
   for(let i=-6;i<=6;i++){box(world,[i,.025,0],[.025,.025,12],i===0?paper:'#526b56');box(world,[0,.025,i],[12,.025,.025],i===0?paper:'#526b56');}
   const a=[0,.12,0],b=[p.x,.12,-p.y];beam(world,a,b,.045,accent);ball(world,a,.16,'#cead63');ball(world,b,.18,blue);label(world,`(${p.x}; ${p.y})`,[p.x,.65,-p.y],2.3);
   if(id==='parallel'){beam(world,[-5,.13,2],[5,.13,2],.06,accent);beam(world,[-5,.13,-2],[5,.13,-2],.06,accent);for(let i=-5;i<=5;i++)box(world,[i,.07,0],[.12,.1,4.5],'#4d4639');}
   if(['nur','nuqta-chiziq','kesma-nur'].includes(id)){const end=new T.Vector3(...b).sub(new T.Vector3(...a)).normalize().multiplyScalar(2).add(new T.Vector3(...b));beam(world,b,end.toArray(),.018,paper);}
  }else if(['rectangle','square','parallelogram','trapezoid','rhombus','polygon','circle'].includes(s)){
   const a=p.a||3,b=s==='square'?a:p.b||3;
   if(s==='circle'){const m=cyl(world,[0,.15,0],p.r,.25,accent);ring(world,[0,.3,0],p.r,paper);dimension([0,.33,0],[p.r,.33,0],`r=${p.r} m`);}
   else if(s==='polygon'){const pts=id==='nomuntazam-kopburchak'?[[0,0],[5,0],[4+p.shift,3],[1,4]]:Array.from({length:p.sides},(_,i)=>[Math.cos(i*2*Math.PI/p.sides)*p.r,Math.sin(i*2*Math.PI/p.sides)*p.r]);panel(pts,accent);}
   else if(s==='rhombus')panel([[0,-b/2],[a/2,0],[0,b/2],[-a/2,0]],accent);
   else if(s==='trapezoid')panel([[-a/2,0],[a/2,0],[b/2,p.h],[-b/2,p.h]],accent);
   else {panel([[-a/2,0],[a/2,0],[a/2+(s==='parallelogram'?1:0),b],[-a/2+(s==='parallelogram'?1:0),b]],accent);dimension([-a/2,.2,1],[a/2,.2,1],`${a} m`);}
  }else if(s==='balance'){
   if(id==='tengsizlik'){box(world,[0,.15,0],[3,.3,2.5],blue);const cube=box(world,[0,1,0],[1.2,1.5,1.2],accent);label(world,`${p.load} kg · limit 5 kg`,[0,2.6,0],4);}
   else {beam(world,[0,0,0],[0,2.7,0],.12,accent);beam(world,[-2,2.7,0],[2,2.7,0],.08,accent);for(const x of [-2,2]){beam(world,[x,2.7,0],[x,1.25,0],.015,paper);cyl(world,[x,1.2,0],.8,.08,blue);}for(let i=0;i<p.count;i++)box(world,[-2+i%3*.28-.25,1.32+Math.floor(i/3)*.13,0],[.25,.1,.7],accent);label(world,`${p.count}x + ${p.extra} = ${p.total}`,[0,3.5,0],5);}
  }else if(s==='linear'){
   if(id==='grafiklar'){const tank=cyl(world,[0,1.5,0],1.2,3,'#c7dfcf',{transparent:true,opacity:.2});const water=cyl(world,[0,.1,0],1.1,1,blue,{transparent:true,opacity:.7});animate.push(q=>{const height=Math.min(2.9,(p.b+p.m*p.x*q)/90*3);water.scale.y=Math.max(.02,height);water.position.y=height/2;});}
   else {for(let i=0;i<15;i++)box(world,[-7+i,.01,0],[.5,.03,.05],paper);const car=new T.Group();world.add(car);box(car,[0,.65,0],[2.5,.6,1.2],accent);box(car,[0,1.15,0],[1.3,.5,1.1],blue);for(const x of [-.8,.8])for(const z of [-.63,.63]){const wheel=cyl(car,[x,.35,z],.3,.15,'#283731');wheel.rotation.x=Math.PI/2;}animate.push(q=>car.position.x=-4+p.x/15*8*q);label(world,`${p.m} × ${p.x} + ${p.b}`,[0,3,0],4);}
  }else if(s==='quadratic'){
   const end=(p.speed+Math.sqrt(p.speed*p.speed+19.62*p.height))/9.81;const object=ball(world,[0,p.height,0],.2,'#c48648');animate.push(q=>{const t=end*q;object.position.set(q*4-2,Math.max(.2,p.height+p.speed*t-4.905*t*t),0);});box(world,[0,.03,0],[8,.06,4],'#799268');
  }else if(s==='statistics'||s==='probability'){
   if(s==='statistics'){[10,20,30,40,p.minutes].forEach((v,i)=>{box(world,[(i-2)*1.2,v/30/2,0],[.8,Math.max(.01,v/30),.8],i===4?accent:blue);label(world,String(v),[(i-2)*1.2,v/30+.4,0],.9);});}
   else {box(world,[0,.06,0],[4,.12,3],paper);for(let i=0;i<p.red+p.blue;i++)ball(world,[-1.5+i%5*.7,.4+Math.floor(i/5)*.5,0],.23,i<p.red?'#b96c5b':blue);}
  }else if(s==='transform'){
   const make=(x,z,scale,color)=>{const g=new T.Group();g.position.set(x,.1,z);g.scale.setScalar(scale);world.add(g);box(g,[0,.06,0],[1,.12,1],color);box(g,[.65,.06,.35],[.3,.12,.3],color);return g;};make(id==='simmetriya'?-p.dx:-2,0,1,blue);const copy=make(p.dx,0,p.scale||1,accent);copy.rotation.y=(p.angle||0)*Math.PI/180;if(id==='simmetriya'){copy.position.x=p.dx;copy.scale.x=-1;copy.scale.y=copy.scale.z=1;copy.rotation.y=0;beam(world,[0,.2,-3],[0,.2,3],.02,paper);}
  }else if(s==='expression'&&['kophad','kopaytuvchilar'].includes(id)){const x=p.x;panel([[0,0],[x+1,0],[x+1,x+2],[0,x+2]],blue);beam(world,[x,.2,0],[x,.2,-x-2],.015,paper);beam(world,[0,.2,-x],[x+1,.2,-x],.015,paper);label(world,`(${x}+1) × (${x}+2)`,[1.5,2,0],4);}
  else if(id==='ildizlar'){const side=Math.sqrt(p.area);panel([[0,0],[side,0],[side,side],[0,side]],blue);dimension([0,.2,.8],[side,.2,.8],`${side.toFixed(2)} m`);}
  else {const amount=s==='power'?(id==='logarifm'?p.amount:p.base**p.exponent):s==='sequence'?p.weeks:12;for(let i=0;i<Math.min(100,amount);i++)box(world,[(i%10-4.5)*.5,.25+Math.floor(i/10)*.5,0],[.45,.45,.45],i%2?accent:blue);label(world,amount>100?`100 / ${amount} namuna`:String(amount),[0,6,0],4);}
 }
 function chemistry(){
  room();const p=state.parameters,s=state.topic.scene,glass={transparent:true,opacity:.23,roughness:.12,metalness:.1,side:T.DoubleSide,depthWrite:false},metal='#afbbb1',wood='#9c855e';
  const bench=new T.Group();world.add(bench);box(bench,[0,.9,0],[3.2,.1,1.5],wood);for(const x of [-1.4,1.4])for(const z of [-.6,.6])box(bench,[x,.42,z],[.07,.84,.07],'#394b41');
  const apparatus=new T.Group();apparatus.position.y=.95;apparatus.scale.setScalar(.4);world.add(apparatus);
  function beaker(x,z,r=.65,h=1.5,color='#76b8b6',base=.65){cyl(apparatus,[x,h/2,z],r,h,'#c9e6db',glass);ring(apparatus,[x,h,z],r,'#e0e5cf');ring(apparatus,[x,.03,z],r,'#a2c8b6');const fluid=cyl(apparatus,[x,base/2,z],r*.96,base,color,{transparent:true,opacity:.7,roughness:.2});for(let i=1;i<=5;i++)box(apparatus,[x+r*.7,i*h/6,z+r*.75],[.14,.012,.012],metal);return fluid;}
  function flask(x,z,color='#78b8bc'){add(apparatus,new T.ConeGeometry(.65,1.1,40), '#d0e5d6',[x,.6,z],glass);cyl(apparatus,[x,1.4,z],.18,.7,'#d0e5d6',glass);const fluid=add(apparatus,new T.CylinderGeometry(.34,.58,.5,32),color,[x,.3,z],{transparent:true,opacity:.65});ring(apparatus,[x,1.75,z],.18,metal);return fluid;}
  const microscopic=new T.Group();microscopic.position.set(0,2,0);world.add(microscopic);
  const atomColor={H:'#e1ddd0',O:'#bf715e',N:'#799fc1',C:'#485d54',Na:'#a48bbc',Cl:'#94b565'};
  function molecule(name){const model=molecules[name]||molecules.water;model.atoms.forEach(([sym,x,y,z])=>{ball(microscopic,[x,y,z],sym==='H'?.15:.24,atomColor[sym]||'#d6b970');});for(const [a,b,count]of model.bonds){const u=model.atoms[a].slice(1),v=model.atoms[b].slice(1);for(let i=0;i<count;i++)beam(microscopic,[u[0],u[1]+(i-(count-1)/2)*.1,u[2]],[v[0],v[1]+(i-(count-1)/2)*.1,v[2]],.035,metal);}label(microscopic,model.formula,[0,1.8,0],2.5);}
  if(s==='atom'||s==='periodic'){
   const proton=p.protons||p.z||8,neutron=p.neutrons??8,electron=p.electrons??Math.min(proton,20);
   for(let i=0;i<Math.min(35,proton+neutron);i++){const a=i*2.4,r=.12*Math.sqrt(i);ball(microscopic,[Math.cos(a)*r,(i%3-1)*.18,Math.sin(a)*r],.13,i<proton?'#c08165':'#a6aa8d');}
   let left=electron;for(let shell=0;shell<4&&left>0;shell++){const n=Math.min([2,8,8,2][shell],left),r=.8+shell*.38;const orbit=ring(microscopic,[0,0,0],r,'#b6cab5');orbit.rotation.x=Math.PI/2;for(let i=0;i<n;i++){const b=ball(microscopic,[Math.cos(i/n*6.28)*r,Math.sin(i/n*6.28)*r,0],.055,'#82c9d2');animate.push(q=>{const a=i/n*2*Math.PI+q*2*Math.PI;b.position.set(Math.cos(a)*r,Math.sin(a)*r,0);});}left-=n;}
   label(microscopic,'Kattalashtirilgan hisob modeli',[0,2.5,0],4);beaker(-2,0);
  }else if(s==='molecule'||s==='organic'){molecule(p.molecule);flask(-2,0);}
  else if(s==='bonds'){
   if(p.bond==='covalent')molecule('water');else for(let i=0;i<27;i++){const x=i%3-1,y=Math.floor(i/3)%3-1,z=Math.floor(i/9)-1;ball(microscopic,[x*.65,y*.65,z*.65],.24,p.bond==='metal'?'#bcbda3':(x+y+z)%2?'#ae8fb7':'#9bbe7f');}beaker(-2,0);
  }else if(s==='states'||s==='life'){
   beaker(0,0,.8,1.7,p.temperature<0?'#b2d4d2':'#78b8b6',p.temperature>100?.03:1);
   for(let i=0;i<40;i++){const solid=p.temperature<=0,gas=p.temperature>=100,r=gas?1.8:.7,a=i*2.4;const b=ball(microscopic,solid?[(i%4-1.5)*.32,(Math.floor(i/4)%3-1)*.32,(Math.floor(i/12)-1)*.32]:[Math.cos(a)*r,(i%7-3)*.2,Math.sin(a)*r],.075,'#92cbd2');animate.push(q=>{if(!solid){b.position.x=Math.cos(a+q*(gas?6:1))*r;b.position.y=(i%7-3)*.2+Math.sin(q*6+i)*.12;}});}
  }else if(s==='reaction'){
   molecule('water');beaker(-2,0,.5,1.1);beaker(2,0,.5,1.1);label(apparatus,`${p.hydrogen}H₂ + ${p.oxygen}O₂ → ${p.water}H₂O`,[0,2.3,0],5);
  }else {
   const isLab=s.startsWith('lab-'),type=s.replace('lab-','');let fluid;
   if(['distillation'].includes(type)){
    flask(-1.8,0);beam(apparatus,[-1.8,1.7,0],[.7,1.2,0],.06,metal);beam(apparatus,[-.7,1.5,0],[.8,1.2,0],.15,'#8fbeb8');beam(apparatus,[.8,1.2,0],[1.6,1,0],.05,metal);fluid=beaker(1.8,0,.55,1.1,'#7ebcc1',.1);box(apparatus,[-1.8,.05,0],[1.4,.1,1.4],'#564c39');
   }else if(type==='filtration'||s==='mixture'){
    fluid=beaker(1,0,.7,1.4,'#97c7c0',.3);const funnel=add(apparatus,new T.ConeGeometry(.65,.7,32,1,true), '#d8d1af',[1,1.8,0],{side:T.DoubleSide});funnel.rotation.z=Math.PI;beam(apparatus,[1,1.45,0],[1,1.1,0],.045,metal);for(let i=0;i<30;i++){const grain=ball(apparatus,[1+Math.cos(i*2.4)*.35,1.8+Math.sin(i)*.04,Math.sin(i*2.4)*.35],.035,'#b39c69');animate.push(q=>{grain.visible=i<(type==='filtration'?(state.result?.raw?.values['Filtrdagi qum']||0):Math.max(0,p.salt-35.9*p.water/100));});}const source=flask(-1.5,0);animate.push(q=>{if(type==='filtration'){source.scale.y=Math.max(.02,1-q);fluid.scale.y=Math.max(.02,(state.result?.raw?.values['Filtratdagi suv']||0)/100*3);fluid.position.y=.15*fluid.scale.y;}});
   }else if(type==='balloon'){
    flask(0,0);const balloon=ball(apparatus,[0,2.1,0],.65,'#cf9c74',{transparent:true,opacity:.8});animate.push(q=>{const scale=.08+Math.min(p.soda,p.acid)/20*q;balloon.scale.set(scale,scale*1.25,scale);balloon.position.y=1.8+.65*scale;});
   }else if(type==='volcano'){
    add(apparatus,new T.CylinderGeometry(.25,1.3,1,40), '#9c7a57',[0,.5,0]);fluid=beaker(0,0,.22,1.1,'#d2ba8e',.1);for(let i=0;i<30;i++){const b=ball(apparatus,[0,1.1,0],.09,'#e7d8ab');animate.push(q=>{const e=q*Math.min(p.soda,p.acid)/15;b.position.set(Math.cos(i*2.4)*e,.9+Math.sin(i)*.1-e*.5,Math.sin(i*2.4)*e);b.scale.setScalar(.3+e);});}
   }else if(type==='chromatography'){
    beaker(0,0,.7,1.5,'#97bcb7',.2);box(apparatus,[0,1.2,0],[.45,2.2,.025],'#ded8b8');['#b37087','#c6a564','#739ab1'].forEach((c,i)=>{const spot=box(apparatus,[0,.25,.03],[.35,.07,.02],c);animate.push(q=>spot.position.y=.25+q*(p.front/10)*[.25,.55,.8][i]*2);});
   }else if(type==='corrosion'){
    beaker(0,0,.7,1.5,'#94b8ac',.65);const nail=beam(apparatus,[-.2,.25,0],[.2,1.2,0],.04,metal);const rust=beam(apparatus,[-.2,.25,0],[.2,1.2,0],.045,'#a06e42');animate.push(q=>{rust.scale.y=state.result?.raw?.corrosion||0;});
   }else if(type==='conductivity'||s==='electric'){
    beaker(-1,0,.65,1.3);beaker(1,0,.65,1.3);for(const x of [-1,1])box(apparatus,[x,1.1,0],[.18,.8,.1],x<0?'#8e9d94':'#b98b63');beam(apparatus,[-1,1.5,0],[-1,2,0],.025,metal);beam(apparatus,[-1,2,0],[1,2,0],.025,metal);beam(apparatus,[1,2,0],[1,1.5,0],.025,metal);const bulb=ball(apparatus,[0,2,0],.2,'#e3c670',{emissive:'#d1a543',emissiveIntensity:0});animate.push(q=>bulb.material.emissiveIntensity=s==='electric'?(p.circuit==='closed'?q*2:0):2*(state.result?.raw?.conductivity||0));
   }else if(type==='neutralisation'||s==='ph'){
    const ph=state.result?.metrics?.find(m=>/pH/.test(m.label))?.value||7;fluid=beaker(0,0,.8,1.3,phColor(ph),.6);cyl(apparatus,[.3,2.5,0],.065,1.8,'#c9e6db',glass);beam(apparatus,[1.2,0,0],[1.2,3.6,0],.035,metal);beam(apparatus,[1.2,3.3,0],[.3,3.3,0],.03,metal);const drop=ball(apparatus,[.3,1.5,0],.035,'#c1dbd1');animate.push(q=>drop.position.y=1.6-(q*6%1)*.6);
   }else if(type==='density'){
    beaker(0,0,.8,2,'#74b5bb',.8);const oil=cyl(apparatus,[0,.8+p.oil/150/2,0],.76,p.oil/150,'#cfb36e',{transparent:true,opacity:.85});
   }else if(type==='crystals'||type==='dissolving'){
    fluid=beaker(0,0,.85,1.6,'#8fbbb8',1);for(let i=0;i<35;i++){const salt=box(apparatus,[Math.cos(i*2.4)*.6,.08+(i%3)*.04,Math.sin(i*2.4)*.6],[.1,.1,.1],'#e7dfc0');animate.push(q=>salt.scale.setScalar(type==='crystals'?.05+q:.1+Math.max(0,1-q*Math.min(1,35.9*(p.water||100)/100/(p.salt||1)))));}
   }else {fluid=beaker(0,0,.85,1.7,type==='indicator'?phColor(p.ph):'#83babc',1);flask(-2,0);if(type==='diffusion'){for(let i=0;i<45;i++){const dot=ball(apparatus,[0,.8,0],.035,'#ae6b8f');animate.push(q=>{const r=.05+q*(p.temperature/60)*.7;dot.position.set(Math.cos(i*2.4)*r,.8+Math.sin(i*3.2)*r,Math.sin(i*2.4)*r);});}}}
   if(fluid)animate.push(q=>{if(type==='distillation'){const amount=state.result?.raw?.values['Yig‘ilgan suv']||0;fluid.scale.y=.02+amount/100*8;fluid.position.y=.05*fluid.scale.y;}else if(type==='crystals')fluid.scale.y=(state.result?.raw?.values['Qolgan suv']||0)/100;if(type==='neutralisation'||s==='ph')fluid.material.color.set(phColor(state.result?.metrics?.find(m=>/pH/.test(m.label))?.value??7));});
   // Molecular view stays separate from the metre-scale apparatus.
   if(s==='ph'||type==='indicator'||type==='neutralisation'){for(let i=0;i<18;i++)ball(microscopic,[Math.cos(i*2.4),Math.sin(i*2.4),i%3*.4],.09,i%2?'#b1869c':'#9cc7bb');}
   else if(s==='electric'||type==='conductivity')for(let i=0;i<24;i++)ball(microscopic,[(i%4-1.5)*.6,(Math.floor(i/4)%3-1)*.6,(Math.floor(i/12)-.5)*.6],.12,i%2?'#9fbb84':'#b6a1c7');
   else molecule('water');
  }
  animate.push(()=>{apparatus.visible=state.station!==1;microscopic.visible=state.station===1||['atom','periodic','molecule','bonds','organic','reaction'].includes(s);});
 }
 function reset(){const chem=state.subject==='chemistry',close=state.station===1,s=state.topic.scene,p=state.parameters;let target=[0,1.6,0],position=[8,6,10];if(chem){const micro=close||['atom','periodic','molecule','bonds','organic','reaction'].includes(s);target=[0,micro?1.9:1.3,0];position=micro?[4,3.5,6]:[3.2,2.8,4.3];}else if(['cube','cuboid','prism','pyramid','cylinder','cone','sphere'].includes(s)){const h=s==='sphere'?p.r*2:s==='cube'?p.a:s==='cuboid'?p.c:s==='prism'?p.b:p.h;const size=Math.max(p.a||0,p.b||0,p.c||0,p.r?2*p.r:0,p.h||0);target=[0,h/2,0];position=[size*1.15+4,h*.8+3,size*1.3+4];}else if(s==='number'){position=[4,3.4,6];target=[0,1.8,0];}else if(s==='fraction'){position=[5.5,4.8,7];target=[0,.4,0];}else if(['rectangle','square','parallelogram','trapezoid','rhombus','polygon','circle'].includes(s)){position=[7.5,8,9];target=[0,.2,-1.4];}if(close&&!chem){position=position.map((v,i)=>target[i]+(v-target[i])*.72);}if(state.station===2&&!chem)position=[9,11,11];camera.position.set(...position);controls.target.set(...target);controls.update();request();}
 function update(next){const previous=state;state=next;const key=JSON.stringify([state.subject,state.topic.id,state.parameters]),rebuilt=key!==signature;if(rebuilt){clear();signature=key;state.subject==='chemistry'?chemistry():math();}animate.forEach(f=>f(state.time));host.dataset.realityReady='true';host.dataset.realityKind=state.topic.scene;if(rebuilt||previous.station!==state.station)reset();request();}
 function draw(){frame=null;if(disposed||!visible||document.hidden)return;renderer.render(scene,camera);host.dataset.drawCalls=String(renderer.info.render.calls);}
 function request(){if(!disposed&&visible&&!document.hidden&&frame===null)frame=requestAnimationFrame(draw);}
 const resize=()=>{const r=host.getBoundingClientRect();if(r.width<=0||r.height<=0)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();request();};const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(host);const intersection=new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)request();else if(frame!==null){cancelAnimationFrame(frame);frame=null;}});intersection.observe(host);const visibility=()=>{if(document.hidden&&frame!==null){cancelAnimationFrame(frame);frame=null;}else request();};document.addEventListener('visibilitychange',visibility);controls.addEventListener('change',request);const lost=e=>{e.preventDefault();onLost();};renderer.domElement.addEventListener('webglcontextlost',lost);
 update(initial);reset();resize();
 return {update,reset,rotate(angle){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new T.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(offset);controls.update();request();},zoom(factor){const d=camera.position.clone().sub(controls.target).multiplyScalar(factor).clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(d);controls.update();request();},dispose(){if(disposed)return;disposed=true;if(frame!==null)cancelAnimationFrame(frame);sizeObserver.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',lost);controls.dispose();clear();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
