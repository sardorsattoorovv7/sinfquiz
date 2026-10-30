import * as T from 'three';
import {eniacPanels,eniacFacts,historyWorkplaces} from './history-sim.js';
export function buildHistoryEnvironment({world,h,box,cylinder,ball,wire,text,exhibit}){
 const g=new T.Group();world.add(g);const eniac=h.id==='eniac',width=eniac?eniacFacts.roomWidth:10,length=eniac?eniacFacts.roomLength:12;
 const paper='#d5d0b2',wood='#a48c62',iron='#45524b';
 box(g,[0,-.04,0],[width,.08,length],'#73775d',{roughness:.95});
 for(let x=-Math.floor(width/2);x<=width/2;x++)box(g,[x,.005,0],[.012,.008,length],'#aaa98a');for(let z=-Math.floor(length/2);z<=length/2;z++)box(g,[0,.005,z],[width,.008,.012],'#aaa98a');
 box(g,[0,1.8,-length/2],[width,3.6,.12],'#768473',{roughness:.95});
 for(const x of [-width/2,width/2])box(g,[x,1.8,0],[.12,3.6,length],'#7f8b76',{transparent:true,opacity:.22,depthWrite:false});
 for(let i=-1;i<=1;i++){box(g,[i*2.5,2.65,-length/2+.08],[1.6,1,.06],'#b6cab8',{emissive:'#8eaa8e',emissiveIntensity:.45});box(g,[i*2.5,2.65,-length/2+.13],[.04,1,.03],paper);box(g,[i*2.5,2.65,-length/2+.13],[1.6,.04,.03],paper);}
 text(g,historyWorkplaces[h.id].place,[0,3.9,-length/2+.2],7.5);
 // A 1.7 metre reference, not a portrait of a historical programmer.
 const person=new T.Group();person.position.set(eniac?.2:-3.5,0,eniac?5.5:3);g.add(person);cylinder(person,[0,.98,0],.18,.65,'#a5b7a2');ball(person,[0,1.53,0],.16,'#c2ad89');for(const x of [-.11,.11]){cylinder(person,[x,.36,0],.065,.65,iron);box(person,[x,.045,.08],[.15,.09,.28],iron);}for(const x of [-.24,.24])cylinder(person,[x,.95,0],.055,.55,'#a5b7a2');text(person,'1,7 m',[0,1.96,0],1.05);
 const desk=(x,z)=>{box(g,[x,.77,z],[1.4,.1,.8],wood);for(const xx of [-.58,.58])for(const zz of [-.3,.3])box(g,[x+xx,.37,z+zz],[.07,.74,.07],iron);};
 const wires=[],litPanels=[],digitLights=[];let register;
 if(eniac){
  const lampGeometry=new T.SphereGeometry(.018,6,4),lampMaterial=new T.MeshStandardMaterial({color:'#ffffff',roughness:.45});
  const lamps=new T.InstancedMesh(lampGeometry,lampMaterial,40*100);lamps.instanceMatrix.setUsage(T.StaticDrawUsage);g.add(lamps);const matrix=new T.Matrix4(),pos=new T.Vector3(),color=new T.Color();
  for(let i=0;i<40;i++){
   const panel=new T.Group();const position=i<16?[-2.7,0,-4.875+i*.65]:i<24?[-2.275+(i-16)*.65,0,-5.525]:[2.7,0,-4.875+(39-i)*.65];panel.position.set(...position);panel.rotation.y=i<16?Math.PI/2:i>=24?-Math.PI/2:0;g.add(panel);
   box(panel,[0,1.26,0],[.62,2.52,.66],iron);const face=box(panel,[0,1.3,.345],[.57,2.38,.035],'#263b31');face.userData.roomPart=eniacPanels[i].startsWith('Akkumulyator')?'accumulators':i<4?'program':i>=34?'output':'calculator';litPanels.push(face);
   text(panel,String(i+1).padStart(2,'0'),[0,2.65,.1],.45);text(panel,eniacPanels[i].replace('Akkumulyator','ACC'),[0,.14,.39],.55);
   for(let row=0;row<4;row++)box(panel,[0,.35+row*.2,.38],[.48,.045,.045],'#7f8d73');
   for(let j=0;j<6;j++){cylinder(panel,[-.19+j%3*.19,.4+Math.floor(j/3)*.18,.43],.03,.025,'#bfa676',[Math.PI/2,0,0]);}
   panel.updateMatrixWorld(true);
   for(let d=0;d<10;d++)for(let v=0;v<10;v++){pos.set(-.23+d*.051,1.18+v*.075,.38).applyMatrix4(panel.matrixWorld);matrix.makeTranslation(pos.x,pos.y,pos.z);const index=i*100+d*10+v;lamps.setMatrixAt(index,matrix);lamps.setColorAt(index,color.set(v===0?'#d1a357':'#344536'));if(i===6)digitLights.push({index,digit:d,value:v});}
   // Visible cable patching is representative, not a port-for-port wiring claim.
   if(i%4===0)wire(panel,[[-.2,.38,.43],[-.25,.65,.62],[.2,.56,.43]],i%8?'#a28255':'#6f9890',.012);
  }
  lamps.instanceColor.needsUpdate=true;
  for(const [x,label]of [[-1.7,'KARTA O‘QISH'],[1.7,'NATIJA KARTASI']]){desk(x,4.8);box(g,[x,1.18,4.8],[.8,.7,.6],'#b0b49a');box(g,[x,1.56,4.95],[.55,.06,.4],paper);for(let i=0;i<10;i++)box(g,[x-.2+i*.045,1.6,4.98],[.016,.008,.07],'#4b5b49');text(g,label,[x,1.96,4.8],1.8);}
  const input=wire(g,[[-1.7,.85,4.5],[-2,.15,3],[-2.4,.25,.3],[-2.4,1.1,.2]],'#b7aa6d',.025),output=wire(g,[[2.4,1.1,-.2],[2,.2,.5],[2,.15,3],[1.7,.9,4.5]],'#6b9b9a',.025);wires.push(input,output);
  register=text(g,'0000000999',[0,2.9,-4.8],3.6);text(g,'O‘NLIK AKKUMULYATOR',[0,3.25,-4.8],3.2);
  text(g,'≈ 27,2 t · 40 PANEL · 1946',[0,.08,6.7],5.4);
  // Vacuum tube banks are distinct from the neon indicator lights on the front.
  const tubeGeo=new T.CylinderGeometry(.04,.04,.15,8),tubeMat=new T.MeshStandardMaterial({color:'#a27b51',transparent:true,opacity:.7,roughness:.3});const tubes=new T.InstancedMesh(tubeGeo,tubeMat,160);g.add(tubes);for(let i=0;i<160;i++){matrix.makeTranslation(-2.9+(i%8)*.035,.4+Math.floor(i/8)%10*.18,-4.8+Math.floor(i/80)*.8);tubes.setMatrixAt(i,matrix);}
  const update=state=>{const demo=state.demonstration||{},value=String(Math.floor(demo.value||0)).padStart(10,'0').slice(-10);for(const l of digitLights){lamps.setColorAt(l.index,color.set(Number(value[l.digit])===l.value?'#ffe7a1':'#233d2d'));}lamps.instanceColor.needsUpdate=true;wires.forEach((w,i)=>{w.material.emissive.set((i===0?demo.inputWire==='accumulator':demo.outputWire==='punch')?'#877237':'#000000');w.material.emissiveIntensity=.7;});for(const face of litPanels){const active=demo.phase>0&&(demo.phase<=2?face.userData.roomPart==='accumulators':demo.phase===3?face.userData.roomPart==='program':demo.phase===4?face.userData.roomPart==='calculator':face.userData.roomPart==='output');face.material.emissive.set(active?'#4f5e2f':'#000000');face.material.emissiveIntensity=.35;}updateText(register,value);};
  return {update,width,length,views:{overview:{position:[8,7.5,12],target:[0,1.3,0]},inside:{position:[0,1.65,4.1],target:[0,1.5,-4]},program:{position:[-.6,1.7,3.3],target:[-2.3,1.5,2.3]},accumulators:{position:[-.25,1.65,-.8],target:[-2.4,1.5,-.85]},calculator:{position:[0,1.7,-1.5],target:[.3,1.4,-5.1]},output:{position:[.2,1.65,3.8],target:[1.7,1.2,4.8]},top:{position:[.01,15,.01],target:[0,0,0]}},bounds:{minX:-2.15,maxX:2.15,minZ:-4.3,maxZ:5.9},panelCount:40};
 }
 const model=exhibit(h.kind),table=['abacus','gears','chip','pc','modern'].includes(h.kind);model.position.set(0,table?.82:0,-.8);g.add(model);if(table){box(g,[0,.78,-.8],[4.3,.14,3.5],wood);for(const x of [-1.9,1.9])for(const z of [-2.2,.6])box(g,[x,.36,z],[.12,.72,.12],iron);}desk(-3,3);
 const abacusBeads=[],decimalWheels=[];
 if(h.id==='abacus'){
  model.visible=false;const abacus=new T.Group();abacus.position.set(0,.82,-.8);g.add(abacus);for(const x of [-1.65,1.65])box(abacus,[x,1.2,0],[.12,2.4,.2],wood);for(const y of [.05,2.35])box(abacus,[0,y,0],[3.4,.12,.2],wood);for(let row=0;row<4;row++){wire(abacus,[[-1.6,.4+row*.5,0],[1.6,.4+row*.5,0]],'#b9b9a0',.015);text(abacus,['1','10','100','1000'][row],[1.9,.4+row*.5,0],.35);for(let i=0;i<10;i++){const bead=ball(abacus,[0,.4+row*.5,0],.095,i===4||i===5?'#426850':'#b89056');bead.scale.x=.7;abacusBeads.push({bead,row,index:i});}}
 }
 if(h.id==='pascal'){for(let i=0;i<4;i++){const wheel=cylinder(g,[-.75+i*.5,1.65,.18],.24,.16,'#b99a5e',[Math.PI/2,0,0]);const digit=text(g,'0',[-.75+i*.5,1.65,.3],.37);decimalWheels.push(digit);}}
 const cards=[];for(let i=0;i<8;i++){const card=box(g,[-3+i*.008,.86+i*.015,3],[.7,.012,.4],paper);cards.push(card);for(let j=0;j<5;j++)box(g,[-3.2+j*.09,.867+i*.015,3],[.025,.008,.07],iron);}
 text(g,'Dastur / ma’lumot',[ -3,1.45,3],2);register=text(g,'0000000000',[0,table?3.8:3.2,-.6],4);text(g,'BOSQICHMA-BOSQICH ISHLASH',[0,4.3,-3.5],5.5);
 // Contact bank / chip data pins / CRT memory: observable representations of state.
 const bits=[];for(let i=0;i<8;i++){const lamp=ball(g,[-1.05+i*.3,table?.93:.3,1.3],.06,'#b7a665');bits.push(lamp);}
 const update=state=>{const d=state.demonstration||{},v=Math.floor(d.value||0);updateText(register,h.id==='micro'?v.toString(2).padStart(4,'0'):String(v).padStart(10,'0'));bits.forEach((b,i)=>{const on=Boolean(v&(1<<(7-i)));b.material.emissive.set(on?'#b9832f':'#000000');b.material.emissiveIntensity=on?1.2:0;});cards.forEach((c,i)=>c.position.x=-3+(i===Math.min(7,d.phase||0)?.45:0)+i*.008);abacusBeads.forEach(({bead,row,index})=>{const digit=Math.floor(v/10**row)%10;bead.position.x=index<digit?-1.45+index*.15:.1+(index-digit)*.15;});const digits=String(v).padStart(4,'0').slice(-4);decimalWheels.forEach((digit,i)=>updateText(digit,digits[i]));};
 return {update,width,length,views:{overview:{position:[7,5.3,8.5],target:[0,1.6,-.5]},inside:{position:[0,1.65,4],target:[0,1.7,-.7]},program:{position:[-1,1.65,3.8],target:[-3,1,3]},accumulators:{position:[2.5,2.3,3],target:[0,1.8,0]},calculator:{position:[2.5,2.3,3],target:[0,1.8,0]},output:{position:[0,2.5,3],target:[0,2,-.5]},top:{position:[.01,12,.01],target:[0,0,0]}},bounds:{minX:-2.2,maxX:2.2,minZ:2.5,maxZ:5.4},panelCount:0};
}
function updateText(sprite,value){const texture=sprite.material.map,canvas=texture.image,context=canvas.getContext('2d');context.clearRect(0,0,canvas.width,canvas.height);context.fillStyle='#f7df9f';context.font='600 66px monospace';context.textAlign='center';context.textBaseline='middle';context.fillText(value,canvas.width/2,canvas.height/2,canvas.width-30);texture.needsUpdate=true;}
