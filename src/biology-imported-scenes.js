import * as T from 'three';

// Imported anatomy stays in common BodyParts3D coordinates. The animated
// deformation and coloured paths are explicitly educational overlays.
export function buildImportedBiologyScene(id,p,c){
 const {world,model,assembly,part,moves,tube,marker,ell,box,pivot,heart}=c;
 const keys=(...names)=>m=>names.includes(m.userData.key);
 const organ=(names,height,label,why)=>model(names.every(n=>['right-lung','left-lung'].includes(n))?'lungs':'organs',{filter:keys(...names),height,label,why});
 const center=m=>new T.Box3().setFromObject(m).getCenter(new T.Vector3());
 const visibleMeshes=root=>{const out=[];root.traverse(m=>{if(m.isMesh&&m.visible)out.push(m)});return out};
 if(id==='breathing'){
  const lungs=assembly([['organs',keys('trachea','diaphragm')],['lungs',keys('right-lung','left-lung')]],3.7);
  const moving=[];lungs.traverse(m=>{if(!m.isMesh||!m.visible)return;
   if(m.userData.key==='diaphragm'){part(m.userData.part,'Qisqarganda diafragma pastlaydi; ko‘krak hajmi ortadi. Modeldagi deformatsiya soddalashtirilgan.');pivot(m);moving.push({m,diaphragm:true,start:m.position.clone()})}
   if(['right-lung','left-lung'].includes(m.userData.key)){part(m.userData.part,'Havo kirishi ko‘krak hajmi ortishiga bog‘liq. Ranglar shartli.');pivot(m);moving.push({m,start:m.position.clone()})}
  });
  world.updateMatrixWorld(true);
  const trachea=visibleMeshes(lungs).find(m=>m.userData.key==='trachea'),tb=new T.Box3().setFromObject(trachea),top=new T.Vector3(0,tb.max.y,tb.getCenter(new T.Vector3()).z+.2);
  for(const item of moving.filter(a=>!a.diaphragm)){
   const end=center(item.m);end.z+=.45;
   const path=tube([top.toArray(),[top.x,top.y-.6,top.z],end.toArray()],.018,0x69b7d8,part('Havo harakati','Belgilar O₂ molekulalarining aniq yo‘li emas; nafas bosqichini ko‘rsatadi.'));
   marker(path.curve,0xd6f4fc,'Havo harakati',5,world,({q})=>q>0,x=>x.r.phase<.5?x.q*4:-x.q*4+12);
  }
  moves.push(({r})=>{for(const item of moving){if(item.diaphragm){item.m.position.copy(item.start);item.m.position.y-=r.inflation*.13;item.m.scale.set(1,1-r.inflation*.16,1)}else item.m.scale.set(1+r.inflation*.10,1+r.inflation*.12,1+r.inflation*.10)}});
  return true;
 }
 if(id==='circulation'){
  const h=heart([0,-.2,0],.8),heartScale=h.scale.clone(),lungs=organ(['right-lung','left-lung'],1.35);lungs.position.set(0,1.65,-.2);
  const route=tube([[0,-1.8,.65],[-1.9,-.8,.65],[-.32,-.15,.65],[-1.4,1.6,.65],[0,2.15,.65],[1.4,1.6,.65],[.32,-.15,.65],[1.9,-.8,.65],[0,-1.8,.65]],.045,0xffffff,part('Qon yo‘li','Tana → o‘ng yurak → o‘pka → chap yurak → tana. Ko‘k rang kislorodi kam qonni bildiradi; qon aslida ko‘k emas.'));
  const g=route.m.geometry,a=g.attributes.position,colors=new Float32Array(a.count*3),ring=g.parameters.radialSegments+1;
  for(let i=0;i<a.count;i++)new T.Color(Math.floor(i/ring)/g.parameters.tubularSegments<.5?0x487fc6:0xc95069).toArray(colors,i*3);
  g.setAttribute('color',new T.BufferAttribute(colors,3));route.m.material.vertexColors=true;
  const blood=ell([0,0,0],[.13,.1,.13],0xffd49a,'Qon yo‘li');
  moves.push(({q})=>{blood.position.copy(route.curve.getPoint(q===1?1:q*p.cycles%1));h.scale.copy(heartScale).multiplyScalar(1+.035*Math.sin(q*p.cycles*Math.PI*2))});
  part('O‘pka kapillyarlari','O‘pkada O₂ qonga o‘tadi, CO₂ esa qondan chiqadi. Rangli yo‘l anatomik tomirlar xaritasi emas.');return true;
 }
 if(id==='digestion'){
  const tract=organ(['esophagus','stomach','small-intestine','large-intestine','liver','pancreas'],4);
  const positions={};world.updateMatrixWorld(true);tract.traverse(m=>{if(!m.isMesh||!m.visible)return;positions[m.userData.key]=center(m);
   if(['liver','pancreas'].includes(m.userData.key)){m.material.opacity=.28;m.material.transparent=true;m.material.depthWrite=false;part(m.userData.part,'Bu bez hazmga yordam beruvchi moddalar chiqaradi. Ovqat uning ichidan o‘tmaydi.')}});
  const es=positions.esophagus,st=positions.stomach,sm=positions['small-intestine'],lg=positions['large-intestine'];
  const route=tube([[es.x,2.1,1.1],[es.x,es.y,1.1],[st.x,st.y,1.1],[sm.x-.3,sm.y+.35,1.1],[sm.x+.3,sm.y-.1,1.1],[lg.x,lg.y-.6,1.1],[0,-2,1.1]],.014,0xe3bd6d,part('Ovqat yo‘li','Qizilo‘ngach → oshqozon → ingichka ichak → yo‘g‘on ichak. Yo‘l shartli chiziq; ovqat bezlar ichidan o‘tmaydi.'));
  const bolus=ell([0,0,0],[.13,.13,.13],0xf3bc45,'Ovqat yo‘li');bolus.material.depthTest=false;bolus.renderOrder=3;
  moves.push(({q})=>bolus.position.copy(route.curve.getPoint(q)));return true;
 }
 if(id==='movement'){
  const arm=model('skeleton',{filter:keys('upper-arm-right','forearm-right'),height:3.8}),meshList=visibleMeshes(arm),upper=meshList.find(m=>m.userData.key==='upper-arm-right'),fore=meshList.find(m=>m.userData.key==='forearm-right');
  if(upper&&fore){upper.geometry.computeBoundingBox();const b=upper.geometry.boundingBox,c0=b.getCenter(new T.Vector3());c0.y=b.min.y;pivot(fore,c0);part(fore.userData.part,'Bilak tirsak atrofida aylanadi. Model suyak uzunligini o‘zgartirmaydi.');moves.push(({r})=>fore.rotation.z=-r.angle*Math.PI/180)}
  // An enlarged real biceps/triceps model is placed beside the bone lever.
  const muscle=model('muscles',{filter:keys('biceps','triceps'),height:2.6});muscle.position.set(1.65,.3,0);muscle.scale.x*=.75;
  const base=muscle.scale.clone();moves.push(({r})=>{muscle.scale.copy(base);muscle.scale.y*=r.length;muscle.scale.x/=Math.sqrt(r.length)});
  part('Mushak qisqarishi','Yon tomondagi mushaklar kattalashtirilgan. Paylar suyakni tortadi; sirtning qisqarishi kuch hisobining to‘liq modeli emas.');return true;
 }
 if(id==='endocrine'){
  const gland=organ(['pancreas'],1.15,'Oshqozon osti bezi','Insulin kabi gormonlar qonga chiqariladi.');gland.position.set(-1.5,0,0);
  const cell=ell([1.4,0,0],[.7,.7,.4],0x83b8a1,part('Nishon hujayra','Mos retseptor gormon signaliga javob beradi.'),world,.65),route=tube([[-1,0,0],[0,.6,0],[.8,.2,0]],.035,0xc95069,part('Qon','Gormonlar qon orqali yetkaziladi.'));
  marker(route.curve,0x9474c0,'Gormon',6,world,({r})=>r.insulin>0);moves.push(({r})=>cell.material.emissive.setRGB(r.insulin*.1,r.insulin*.2,r.insulin*.1));return true;
 }
 if(id==='pollination'){
  const flower=model('flower',{filter:m=>m.name.includes('_b_LOD0'),height:2.8,label:'Gul',why:'Empodium gulining tayyor teksturali modeli. Urug‘chi, changdon va chang yo‘li alohida kattalashtirilgan sxema.'});flower.position.set(0,0,-.3);
  // The inset is intentionally not hidden inside an opaque decorative flower.
  const tract=tube([[.65,.9,1],[.65,.3,1],[.65,-.35,1]],.018,0xeacd77,part('Urug‘chi','Mos chang tumshuqchaga tushgach, chang naychasi urug‘kurtakka o‘sishi mumkin.'));
  ell([.65,-.35,1],[.22,.26,.16],0xa4bf73,'Urug‘chi');
  const pollen=ell([-2,.9,1],[.1,.1,.1],0xf0ca61,part('Chang','Sariq belgi kattalashtirilgan chang donasi. Moslik va tashuvchi natijaga ta’sir qiladi.'));
  moves.push(({q,r})=>{pollen.visible=p.visits>0;pollen.position.x=-2+Math.min(q/.35,1)*2.65;tract.m.visible=!!r.delivered&&p.compatible==='yes';tract.m.geometry.setDrawRange(0,Math.floor(tract.m.geometry.index.count*Math.max(0,Math.min(1,(q-.35)/.4))/3)*3)});
  part('Chang tashuvchi',p.carrier==='insect'?'Hasharot guldan gulga chang ko‘chirishi mumkin. Bu modelda chang yo‘li sariq belgi bilan ko‘rsatilgan.':'Shamol chang donalarini ko‘chirishi mumkin. Barcha gul turlari shamol bilan changlanmaydi.');return true;
 }
 return false;
}
