import * as THREE from 'three';
import {solarExperiment,oceanExperiment,physicalConstants} from './physical.js';
const tau=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createPhysicalScene(family,api){
 if(family==='sunlight')return solarScene(api);
 if(family==='ocean')return oceanScene(api);
 return null;
}
function solarScene({root,camera,controls,sunLight,sphere,globe,line,mark,cloudTexture,canvas}){
 const earth=globe(1.25,'earth',[4,0,0]),sun=globe(2.15,'sun',[-6,0,0]);
 const heat=sphere(1.29,0xff7a3f,'Issiqlik qatlami','Rang model haroratining boshlang‘ich holatdan farqini ko‘rsatadi.',[4,0,0],true);
 heat.material.transparent=true;heat.material.depthWrite=false;heat.material.opacity=0;heat.material.side=THREE.FrontSide;
 const corona=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTexture(),color:0xffba68,transparent:true,opacity:.32,depthWrite:false,blending:THREE.AdditiveBlending}));root.add(mark(corona,'Quyosh toji','Ko‘rgazmali yorug‘ toj. Yer va Quyosh radiuslari haqiqiy nisbatda chizilmagan.'));corona.scale.set(7,7,1);
 const distance=line([[-6,-2.6,0],[4,-2.6,0]],0x9eb9d5);mark(distance,'Masofa','Slayderdagi AU qiymati hisobda ishlatiladi. Chizmada masofa ko‘lami siqilgan.');
 const rays=Array.from({length:9},()=>line([[0,0,0],[0,0,0]],0xffc77b,.2));
 rays.forEach(x=>mark(x,'Kiruvchi energiya','Masofa kamayganda birlik yuzaga ko‘proq energiya keladi.'));
 const photons=Array.from({length:18},()=>sphere(.045,0xffd28a,'Nur yo‘li','Nuqtalar energiya oqimi uchun ko‘rgazma; fotonlarning haqiqiy soni yoki o‘lchami emas.',[0,0,0],true));
 const emitted=Array.from({length:12},()=>line([[0,0,0],[0,0,0]],0xf09c86,.5));emitted.forEach(x=>mark(x,'Chiquvchi issiqlik','Radiatsion chiqish modelda σT⁴ ga bog‘liq.'));
 let aspect=1;
 const home=()=>{camera.position.set(-2,3.5,Math.max(18,21/(Math.max(.65,aspect))));controls.target.set(-2,0,0);};home();
 const changeLine=(obj,a,b)=>{obj.geometry.setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);};
 return {
  update(p,t){
   const x=solarExperiment(p,t);sun.position.x=earth.position.x-x.displaySeparation;sun.rotation.y=t*.45;earth.rotation.y=t*tau*.45;corona.position.copy(sun.position);sunLight.position.copy(sun.position).add(new THREE.Vector3(0,1.5,3));sunLight.intensity=1.2/x.distance**2;
   heat.material.color.set(x.heat>=0?0xff753a:0x6fbcff);heat.material.emissive.copy(heat.material.color);heat.material.opacity=Math.abs(x.heat)*.45;heat.scale.setScalar(1+Math.abs(x.heat)*.06);
   changeLine(distance,[sun.position.x,-2.6,0],[earth.position.x,-2.6,0]);
   rays.forEach((l,i)=>{const y=(i-4)*.16;changeLine(l,[sun.position.x+2.1,y*2,0],[earth.position.x-1.22,y,0]);l.material.opacity=clamp(.12+.12/p.distance**2,.1,.65);});
   photons.forEach((o,i)=>{const u=(i/18+t*3)%1,y=((i%7)-3)*.16;o.position.set(sun.position.x+2.12+u*(x.displaySeparation-3.37),y,0);o.scale.setScalar(.55+1/p.distance);});
   emitted.forEach((l,i)=>{const a=i/12*tau,r=1.3+(t*3+i/12)%1*(.5+x.temperature/300);changeLine(l,[4+Math.cos(a)*1.27,Math.sin(a)*1.27,.1],[4+Math.cos(a)*r,Math.sin(a)*r,.1]);l.material.opacity=.25+Math.abs(x.heat)*.5;});
   canvas.dataset.sunWorldX=String(sun.position.x);canvas.dataset.earthWorldX=String(earth.position.x);canvas.dataset.modelTemperature=String(x.temperature);canvas.dataset.heatOpacity=String(heat.material.opacity);
  },resize(a){aspect=a;home();},camera(action){if(action==='reset'){home();return true}return false}
 };
}
function oceanScene({scene,root,camera,controls,sunLight,sphere,globe,line,mark,canvas}){
 const colors=new Float32Array(12);[0x237ea1,0x237ea1,0x031327,0x031327].forEach((color,i)=>{const c=new THREE.Color(color);colors.set([c.r,c.g,c.b],i*3)});
 const wallGeo=new THREE.PlaneGeometry(10,20);wallGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
 const wall=new THREE.Mesh(wallGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));wall.position.set(0,-8,-3.6);root.add(mark(wall,'Suv ustuni','Suv ustunining og‘irligi chuqurlik bilan bosimni oshiradi. Vertikal ko‘lam logarifmik siqilgan.'));
 const surface=new THREE.Mesh(new THREE.PlaneGeometry(13,8,30,16),new THREE.MeshStandardMaterial({color:0x43aacc,transparent:true,opacity:.42,side:THREE.DoubleSide,roughness:.2}));surface.rotation.x=-Math.PI/2;root.add(mark(surface,'Suv sirti','Sirt yaqinidagi umumiy bosimga atmosfera ham hissa qo‘shadi.'));
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(12,9,32,24),new THREE.MeshStandardMaterial({color:0x536774,roughness:.95,side:THREE.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.y=-17.8;root.add(mark(floor,'Challenger Deep tubi','Tadqiqotdagi chuqurlik 10 935 ±6 m. Model haqiqiy batimetrik xarita emas.'));
 const floorPos=floor.geometry.attributes.position;for(let i=0;i<floorPos.count;i++){const a=floorPos.getX(i),b=floorPos.getY(i);floorPos.setZ(i,.14*Math.sin(a*.9)*Math.cos(b*.7)+.05*Math.sin(a*2.2+b));}floor.geometry.computeVertexNormals();
 const ticks=[0,200,physicalConstants.scubaRecord,1000,4000,6000,physicalConstants.challengerDepth];ticks.forEach(h=>{const drop=16*Math.log1p(h/500)/Math.log1p(physicalConstants.challengerDepth/500);const l=line([[-4.8,-drop,-3.5],[4.8,-drop,-3.5]],h===physicalConstants.scubaRecord?0xffdc89:0x437288,.55);mark(l,`${h.toLocaleString('uz-UZ')} m belgisi`,h===physicalConstants.scubaRecord?'Ahmed Gabrning 2014-yilgi SCUBA rekordi; xavfsiz chuqurlik tavsiyasi emas.':'Bu belgi chuqurlikning siqilgan ko‘lamida joylashtirilgan.');});
 const cabin=new THREE.Group();root.add(mark(cabin,'Bosim kabinasi','Ichkaridagi model bosimi 1 atmosfera. Tashqi va ichki bosim farqi qobiqqa yuklama beradi.'));
 const hull=new THREE.Mesh(new THREE.SphereGeometry(1.2,40,28),new THREE.MeshStandardMaterial({color:0xb6d8e8,metalness:.35,roughness:.3,transparent:true,opacity:.24,depthWrite:false}));cabin.add(hull);hull.scale.z=1.3;
 const belt=new THREE.Mesh(new THREE.TorusGeometry(1.23,.09,12,64),new THREE.MeshStandardMaterial({color:0xe9bc56,metalness:.45,roughness:.3}));cabin.add(belt);
 const windowRim=new THREE.Mesh(new THREE.TorusGeometry(.7,.055,12,48),new THREE.MeshStandardMaterial({color:0xefc86b,metalness:.3}));windowRim.position.z=1.15;cabin.add(windowRim);
 const person=globe(.63,'skin');root.remove(person);cabin.add(person);person.position.set(0,-.12,0);
 const panels=Array.from({length:8},(_,i)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.48,.1,.52),new THREE.MeshStandardMaterial({color:0xabcbd7,metalness:.4,roughness:.4}));cabin.add(m);mark(m,'Qobiq bo‘lagi','Ezilish ko‘rgazmali; haqiqiy konstruksiya mustahkamligi yechilmagan.');return m});
 const sampleGroup=new THREE.Group();root.add(sampleGroup);const air=sphere(.9,0x84e5e5,'Yopiq ideal gaz namunasi','PV=const: ideal gaz, molekulalar soni va harorat o‘zgarmas. Yuqori bosimda haqiqiy gaz chetga chiqadi; bu inson o‘pkasi modeli emas.');root.remove(air);sampleGroup.add(air);air.material.transparent=true;air.material.opacity=.5;air.material.roughness=.15;
 const sampleFrame=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:0x61bdcd,wireframe:true,transparent:true,opacity:.18}));sampleGroup.add(mark(sampleFrame,'Boshlang‘ich ideal gaz hajmi','Ichki namuna shu ramkaga nisbatan siqiladi.'));
 const arrowGroup=new THREE.Group();root.add(arrowGroup);const arrows=Array.from({length:8},(_,i)=>{const direction=new THREE.Vector3(Math.cos(i/8*tau),Math.sin(i/8*tau),0);const arrow=new THREE.ArrowHelper(direction.clone().multiplyScalar(-1),direction.clone().multiplyScalar(2.2),.6,0x8dddf0,.2,.1);arrowGroup.add(arrow);mark(arrow,'Bosim yo‘nalishi','Suyuqlik bosimi barcha tomondan ta’sir qiladi.');return arrow});
 const particleGroup=new THREE.Group();root.add(particleGroup);const cloud=new THREE.BufferGeometry(),coords=new Float32Array(90*3);for(let i=0;i<90;i++){coords[i*3]=((i%6)-2.5)*.38;coords[i*3+1]=(Math.floor(i/6)%5-2)*.38;coords[i*3+2]=(Math.floor(i/30)-1)*.38}cloud.setAttribute('position',new THREE.BufferAttribute(coords,3));particleGroup.add(mark(new THREE.Points(cloud,new THREE.PointsMaterial({color:0x85d8f2,size:.055})),'Suv zarrachalari','Bir xil massa hajmi oz siqiladi. Zarrachalar orasidagi ko‘lam taxminiy; kimyoviy tuzilish modeli emas.'));
 const spot=new THREE.PointLight(0xabdfff,9,12,2);cabin.add(spot);spot.position.set(0,.5,2);
 let follow=true,previousY=0,aspect=1,latest=null;
 const home=()=>{follow=true;const y=latest?-.5-latest.displayDrop:0;previousY=y;controls.target.set(0,y,0);camera.position.set(3,y+1.2,Math.max(8.5,8.5/Math.max(.8,aspect)));};home();
 return {
  update(p,t){
   const x=oceanExperiment(p,t),y=-.5-x.displayDrop;latest=x;
   if(follow){const shift=new THREE.Vector3(0,y-previousY,0);camera.position.add(shift);controls.target.add(shift);}previousY=y;
   cabin.position.set(0,y,0);cabin.visible=p.mode==='cabin';sampleGroup.visible=p.mode==='air';sampleGroup.position.set(0,y,0);air.scale.setScalar(Math.cbrt(x.airFraction));
   person.visible=!x.failed;hull.material.color.set(x.failed?0x8395a8:0xb6d8e8);hull.scale.set(1-x.collapse*.85,1-x.collapse*.74,1.3*(1-x.collapse*.55));belt.scale.setScalar(1-x.collapse*.7);windowRim.scale.setScalar(1-x.collapse*.8);windowRim.position.z=1.15*(1-x.collapse*.7);
   panels.forEach((panel,i)=>{panel.visible=x.failed;const a=i/8*tau,r=.95*(1-x.collapse*.8);panel.position.set(Math.cos(a)*r,Math.sin(a)*r,-.25*x.collapse);panel.rotation.set(a*x.collapse,i*.3*x.collapse,a);});
   arrowGroup.position.y=y;arrows.forEach(a=>{a.setLength(.45+Math.log1p(x.bar)/8,.18,.09);a.setColor(x.failed?0xffb773:0x8dddf0)});
   particleGroup.position.set(3,y,-.8);particleGroup.scale.setScalar(Math.cbrt(x.surfaceDensity/x.density));
   const dark=clamp(x.depth/1500,0,1);scene.background.setRGB(.012*(1-dark),.055*(1-dark)+.006,.11*(1-dark)+.018);sunLight.intensity=2.4*(1-dark)+.12;
   const a=surface.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,.04*Math.sin(a.getX(i)*1.3+t*tau)*Math.cos(a.getY(i)*.8-t*tau));a.needsUpdate=true;
   canvas.dataset.depth=String(x.depth);canvas.dataset.waterDensity=String(x.density);canvas.dataset.pressureBar=String(x.bar);canvas.dataset.cabinFailed=String(x.failed);canvas.dataset.airScale=String(air.scale.x);
  },resize(a){aspect=a;if(follow)home();},camera(action){if(action==='whole'){follow=false;camera.position.set(5,-5,Math.max(30,30/Math.max(.7,aspect)));controls.target.set(0,-8,0);return true}if(action==='follow'||action==='reset'){home();return true}return false}
 };
}
