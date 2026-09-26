import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const ARENA_CLIPS={
 idle:'Idle',
 ready:'Wave',
 correct:'Punch',
 wrong:'No',
 victory:'Dance',
 complete:'ThumbsUp',
 running:'Running',
};

const labels={idle:'JAVOBNI KUTMOQDA',ready:'STARTGA TAYYOR',correct:'TO‘G‘RI JAVOB!',wrong:'KEYINGI URINISH',victory:'G‘ALABA!',complete:'YAKUNLANDI',running:'YUGURMOQDA'};

export default function KurashArena({state='idle',compact=false,label}){
 const host=useRef(null),live=useRef(state);live.current=state;
 const [status,setStatus]=useState('loading');

 useEffect(()=>{
  if(!host.current||typeof WebGL2RenderingContext==='undefined'){setStatus('fallback');return}
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch{setStatus('fallback');return}

  const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x08111f,7,15);
  const camera=new THREE.PerspectiveCamera(34,1,.1,30);camera.position.set(3.8,2.7,6.2);camera.lookAt(0,1.05,0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;host.current.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xdceaff,0x172033,2.3));
  const key=new THREE.DirectionalLight(0xffedcf,4.8);key.position.set(-3,6,4);key.castShadow=true;key.shadow.mapSize.set(512,512);scene.add(key);
  const blue=new THREE.SpotLight(0x4e8dff,22,14,.34,.7);blue.position.set(-3.5,5,-2);blue.target.position.set(0,1,0);scene.add(blue,blue.target);
  const green=new THREE.SpotLight(0x42d99a,18,14,.34,.7);green.position.set(3.5,5,-2);green.target.position.set(0,1,0);scene.add(green,green.target);

  const floor=new THREE.Mesh(new THREE.CircleGeometry(8,64),new THREE.MeshStandardMaterial({color:0x08111f,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.06;floor.receiveShadow=true;scene.add(floor);
  const carpet=new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.42,.10,64),new THREE.MeshStandardMaterial({color:0x236d86,roughness:.85}));carpet.position.y=0;carpet.receiveShadow=true;scene.add(carpet);
  const center=new THREE.Mesh(new THREE.RingGeometry(.72,.76,64),new THREE.MeshBasicMaterial({color:0xf0d277,side:THREE.DoubleSide}));center.rotation.x=-Math.PI/2;center.position.y=.056;scene.add(center);
  const outer=new THREE.Mesh(new THREE.RingGeometry(2.05,2.10,64),new THREE.MeshBasicMaterial({color:0x8ec8d4,side:THREE.DoubleSide,transparent:true,opacity:.65}));outer.rotation.x=-Math.PI/2;outer.position.y=.058;scene.add(outer);

  let mixer=null,model=null,active=null,activeState='',disposed=false;
  const clock=new THREE.Clock();
  const actions=new Map();
  const play=current=>{
   const nextState=ARENA_CLIPS[current]?current:'idle';if(nextState===activeState||!mixer)return;
   activeState=nextState;const next=actions.get(ARENA_CLIPS[nextState])||actions.get('Idle');if(!next)return;
   if(active&&active!==next)active.fadeOut(.22);
   next.reset().fadeIn(.22);
   if(['correct','wrong','complete','ready'].includes(nextState)){next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true}else{next.setLoop(THREE.LoopRepeat,Infinity)}
   next.play();active=next;
  };

  const loader=new GLTFLoader();
  loader.load('/models/RobotExpressive.glb',gltf=>{
   if(disposed)return;model=gltf.scene;model.scale.setScalar(.72);model.position.set(0,.05,0);model.rotation.y=.18;
   model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true}});scene.add(model);
   mixer=new THREE.AnimationMixer(model);for(const clip of gltf.animations)actions.set(clip.name,mixer.clipAction(clip));play(live.current);setStatus('ready');
  },undefined,()=>{if(!disposed)setStatus('fallback')});

  let visible=true;const observer=new ResizeObserver(()=>{if(!host.current)return;const {width,height}=host.current.getBoundingClientRect();if(width&&height){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}});observer.observe(host.current);const visibility=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false},{rootMargin:'120px'});visibility.observe(host.current);
  const lost=event=>{event.preventDefault();setStatus('fallback')};renderer.domElement.addEventListener('webglcontextlost',lost);
  renderer.setAnimationLoop(()=>{if(document.hidden||!visible)return;play(live.current);if(mixer)mixer.update(Math.min(clock.getDelta(),.05));renderer.render(scene,camera)});
  return()=>{disposed=true;observer.disconnect();visibility.disconnect();renderer.setAnimationLoop(null);renderer.domElement.removeEventListener('webglcontextlost',lost);if(model)scene.remove(model);const geometries=new Set(),materials=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)for(const material of(Array.isArray(object.material)?object.material:[object.material]))materials.add(material)});geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());renderer.dispose();renderer.domElement.remove()};
 },[]);

 return <div className={`solo-arena ${compact?'compact':''} state-${state}`} ref={host} role="img" aria-label="Harakatlanuvchi 3D arena qahramoni">
  <div className="solo-arena-brand" aria-hidden="true"><b>BILIM ARENA</b><span>READY-MADE 3D MOTION</span></div>
  <div className="solo-arena-state" aria-hidden="true"><i/><span>{label||labels[state]||labels.idle}</span></div>
  {status==='loading'&&<div className="arena-loader"><i/><span>3D qahramon yuklanmoqda…</span></div>}
  {status==='fallback'&&<div className="arena-fallback"><span>3D ARENA</span><p>Bu qurilmada WebGL ishlamadi.<br/>Test ishlashda davom etadi.</p></div>}
 </div>;
}
