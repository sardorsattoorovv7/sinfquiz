import {Group,Box3,Vector3} from 'three';
import {components} from './content.js';
import {loadInformaticsAsset,disposeImportedModel} from './asset-loader.js';
export function createRealHardware({world,onStatus,onChange,getState,animations}){
 const parts=new Map(),models=new Map(),failed=[],loaded=new Set();let dead=false;
 for(const part of components){const group=new Group();group.name=part.id;group.userData.part=part.id;world.add(group);parts.set(part.id,group);}
 const report=()=>{if(dead)return;onStatus({status:loaded.size+failed.length===components.length?(failed.length?'partial':'ready'):'loading',loaded:loaded.size,total:components.length,failed:[...failed]});};
 const cloneMaterials=root=>root.traverse(node=>{if(node.isMesh){node.material=Array.isArray(node.material)?node.material.map(m=>m.clone()):node.material.clone();}});
 async function acquire(part){try{
  const model=await loadInformaticsAsset(part.id);if(dead){disposeImportedModel(model);return;}
  model.name='Imported '+part.id;parts.get(part.id).add(model);models.set(part.id,model);
  if(part.id==='ram'){const second=model.clone(true);cloneMaterials(second);second.position.z=.075;model.position.z=-.0375;parts.get('ram').add(second);}
  if(part.id==='fan'){const second=model.clone(true);cloneMaterials(second);model.position.y=-.64;second.position.y=.64;parts.get('fan').add(second);for(const fan of [model,second]){const rotor=new Group();rotor.name='Blade rotor';fan.add(rotor);fan.updateMatrixWorld(true);const blades=[];fan.traverse(n=>{if(n.isMesh&&(/Extruded|Cylinder\.001/.test(n.name)))blades.push(n);});for(const blade of blades)rotor.attach(blade);if(blades.length)animations.push(t=>{if(getState().motion)rotor.rotation.z=t*3;});}}
  model.traverse(node=>{if(node.isMesh)node.userData.part=part.id;});parts.get(part.id).traverse(node=>{if(node.isMesh){node.userData.part=part.id;node.userData.imported=true;}});
  loaded.add(part.id);report();onChange();
 }catch(error){if(dead)return;failed.push(part.id);report();onChange();}}
 let cursor=0;const worker=async()=>{while(!dead&&cursor<components.length){const part=components[cursor++];await acquire(part);}};report();void Promise.all([worker(),worker(),worker()]);
 return {parts,loaded,models,update(){const state=getState();for(const [id,group]of parts){group.traverse(node=>{if(!node.isMesh)return;for(const material of Array.isArray(node.material)?node.material:[node.material]){const base=material.userData;if(id==='case'){const ghost=state.cutaway&&!state.isolated;material.opacity=ghost?(state.selected==='case'?.45:.1):(base.baseOpacity??1);material.transparent=ghost||Boolean(base.baseTransparent);material.depthWrite=ghost?false:(base.baseDepthWrite??true);}}});}},bounds(id){const group=parts.get(id);if(!group||!loaded.has(id))return null;return new Box3().setFromObject(group);},dispose(){dead=true;}};
}
